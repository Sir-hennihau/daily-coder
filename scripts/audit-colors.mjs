#!/usr/bin/env node
// Audits the theme against the color registry of the locally installed VS Code.
//
// VS Code derives most colors from other colors (e.g. `list.focusOutline` defaults
// to `focusBorder`). Only "root" colors, whose default is a hardcoded value, need to
// be set by the theme; everything else inherits. This script reports roots the theme
// doesn't cover yet, explicit keys that just repeat what they would inherit, and
// deprecated or unknown keys.
//
// Usage:
//   node scripts/audit-colors.mjs [--strict] [--app <path>] [--children <color id>]
//
//   --strict      exit with code 1 when uncovered roots, deprecated or unknown keys exist
//   --app         path to VS Code's `resources/app` folder (or set VSCODE_APP)
//   --children    list every unset color that inherits from the given color

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const THEME_PATH = fileURLToPath(
    new URL("../themes/Daily Coder-color-theme.json", import.meta.url)
);
const BUNDLE = path.join("out", "vs", "workbench", "workbench.desktop.main.js");

const args = process.argv.slice(2);
const option = (name) =>
    args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const strict = args.includes("--strict");

const escapeName = (name) => name.replace(/\$/g, "\\$&");

function fail(message) {
    console.error(`audit-colors: ${message}`);
    process.exit(2);
}

// --- Locate VS Code -------------------------------------------------------

function findAppRoot() {
    const explicit = option("--app") ?? process.env.VSCODE_APP;
    if (explicit) {
        if (!fs.existsSync(path.join(explicit, BUNDLE)))
            fail(`no VS Code workbench found in ${explicit}.`);
        return explicit;
    }
    const candidates = [];
    try {
        const lookup =
            process.platform === "win32" ? "where code" : "command -v code";
        const bin = execSync(lookup, {
            encoding: "utf8",
            stdio: ["ignore", "pipe", "ignore"],
        })
            .split(/\r?\n/)[0]
            .trim();
        const binDir = path.dirname(fs.realpathSync(bin));
        // Linux/Windows: <install>/bin/code -> <install>/resources/app
        // macOS: <app>/Contents/Resources/app/bin/code -> <app>/Contents/Resources/app
        candidates.push(
            path.resolve(binDir, "..", "resources", "app"),
            path.resolve(binDir, "..")
        );
    } catch {
        // `code` is not on PATH; fall back to the usual install locations.
    }
    candidates.push(
        "/usr/share/code/resources/app",
        "/opt/visual-studio-code/resources/app",
        "/snap/code/current/usr/share/code/resources/app",
        "/Applications/Visual Studio Code.app/Contents/Resources/app",
        process.env.LOCALAPPDATA &&
            path.join(
                process.env.LOCALAPPDATA,
                "Programs",
                "Microsoft VS Code",
                "resources",
                "app"
            )
    );
    const found = candidates.find(
        (dir) => dir && fs.existsSync(path.join(dir, BUNDLE))
    );
    if (!found)
        fail(
            "VS Code not found. Pass --app <path to resources/app> or set VSCODE_APP."
        );
    return found;
}

// --- Parse the color registry ----------------------------------------------

// Reads one JS expression starting at `start`, up to the next top-level `,` or
// closing bracket. Returns the expression and the index where it ended.
function readExpr(src, start) {
    let depth = 0;
    let quote = null;
    let i = start;
    for (; i < src.length; i++) {
        const c = src[i];
        if (quote) {
            if (c === "\\") i++;
            else if (c === quote) quote = null;
        } else if (c === '"' || c === "'" || c === "`") quote = c;
        else if ("([{".includes(c)) depth++;
        else if (")]}".includes(c)) {
            if (depth === 0) break;
            depth--;
        } else if (c === "," && depth === 0) break;
    }
    return [src.slice(start, i), i];
}

function readArgs(src, start) {
    const result = [];
    let i = start;
    for (;;) {
        const [expr, end] = readExpr(src, i);
        result.push(expr);
        if (src[end] !== ",") return result;
        i = end + 1;
    }
}

// Picks the dark-theme default out of `{light:…,dark:…,hcDark:…}` or a bare value.
function darkDefault(expr) {
    if (!expr.startsWith("{") || expr.startsWith("{op:")) return expr;
    const at = expr.search(/[{,]dark:/);
    return at < 0 ? "null" : readExpr(expr, at + 6)[0];
}

// Converts a literal default such as `X.fromHex("#fff").transparent(.5)` or
// `new X(new Y(255,18,18,.8))` to hex, for display. Returns null if not possible.
function literalToHex(expr) {
    let rgba = null;
    let m;
    if (
        (m =
            expr.match(/^"?(#[0-9a-f]{3,8})"?(?=$|\.)/i) ||
            expr.match(/fromHex\("(#[0-9a-f]{3,8})"\)/i))
    ) {
        let hex = m[1].slice(1);
        if (hex.length <= 4) hex = [...hex].map((c) => c + c).join("");
        if (hex.length === 6) hex += "ff";
        rgba = [0, 2, 4, 6].map((i) => parseInt(hex.slice(i, i + 2), 16));
        rgba[3] /= 255;
    } else if (
        (m = expr.match(
            /^new [\w$]+\(new [\w$]+\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)\)/
        ))
    ) {
        rgba = [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
    } else if (/^[\w$]+\.white\b/.test(expr)) rgba = [255, 255, 255, 1];
    else if (/^[\w$]+\.black\b/.test(expr)) rgba = [0, 0, 0, 1];
    else if (/^[\w$]+\.transparent$/.test(expr)) rgba = [0, 0, 0, 0];
    if (!rgba) return null;
    const alpha = expr.match(/\.transparent\(([\d.]+)\)$/);
    if (alpha) rgba[3] *= +alpha[1];
    else if (
        /\.(lighten|darken|transparent)\(/.test(
            expr.replace(/^.*?fromHex\([^)]*\)/, "")
        )
    )
        return null;
    const hex = rgba
        .map((v, i) =>
            Math.round(i === 3 ? v * 255 : v)
                .toString(16)
                .padStart(2, "0")
        )
        .join("");
    return `#${hex.endsWith("ff") ? hex.slice(0, 6) : hex}`;
}

function loadRegistry(appRoot) {
    const src = fs.readFileSync(path.join(appRoot, BUNDLE), "utf8");
    // Minified names change every release, so find the registration function by use.
    const register = src.match(/([\w$]+)\("editor\.background",\{/)?.[1];
    if (!register)
        fail(
            "could not find VS Code's color registration function in the bundle."
        );

    const colors = new Map();
    const varToId = new Map();
    const call = new RegExp(
        `(?:([\\w$]+)=)?(?<![\\w$.])${escapeName(register)}\\("([a-zA-Z][\\w.-]*)",`,
        "g"
    );
    for (const m of src.matchAll(call)) {
        const [defaults, , , deprecation] = readArgs(
            src,
            m.index + m[0].length
        );
        colors.set(m[2], {
            id: m[2],
            dark: darkDefault(defaults),
            deprecated: deprecation !== undefined,
        });
        if (m[1]) varToId.set(m[1], m[2]);
    }
    // Terminal ANSI colors are registered in a loop over a lookup table.
    for (const m of src.matchAll(
        /"(terminal\.ansi\w+)":\{index:\d+,defaults:\{[^}]*?dark:"([^"]+)"/g
    )) {
        colors.set(m[1], { id: m[1], dark: `"${m[2]}"`, deprecated: false });
    }
    // Colors contributed by built-in extensions (e.g. gitDecoration.*).
    const extDir = path.join(appRoot, "extensions");
    for (const ext of fs.existsSync(extDir) ? fs.readdirSync(extDir) : []) {
        const manifest = path.join(extDir, ext, "package.json");
        if (!fs.existsSync(manifest)) continue;
        for (const c of JSON.parse(fs.readFileSync(manifest, "utf8"))
            .contributes?.colors ?? []) {
            colors.set(c.id, {
                id: c.id,
                dark: JSON.stringify(c.defaults?.dark ?? null),
                deprecated: false,
            });
        }
    }

    // Top-level constants used in defaults (e.g. `x=oneOf(a,b)` or `x=new Color(…)`).
    const definitionOf = (name) => {
        const m = src.match(new RegExp(`[,;\\s]${escapeName(name)}=(?!=)`));
        return m ? readExpr(src, m.index + m[0].length)[0] : null;
    };
    const refsIn = (expr, depth = 0) => {
        const refs = new Set();
        for (const [, name] of expr.matchAll(
            /(?<![\w$."#])([A-Za-z_$][\w$]*)(?![\w$(.:])/g
        )) {
            if (varToId.has(name)) refs.add(varToId.get(name));
            else if (depth < 2 && name.length > 1) {
                const def = definitionOf(name);
                if (def) for (const r of refsIn(def, depth + 1)) refs.add(r);
            }
        }
        for (const [, id] of expr.matchAll(/"([a-zA-Z][\w.-]*)"/g))
            if (colors.has(id)) refs.add(id);
        return refs;
    };

    for (const color of colors.values()) {
        const { dark } = color;
        color.refs = dark === "null" ? [] : [...refsIn(dark)];
        // A plain reference to another color, without any transform.
        color.plainRef =
            color.refs.length === 1 &&
            (varToId.get(dark) === color.refs[0] ||
                dark === `"${color.refs[0]}"`);
        if (dark === "null") color.kind = "null";
        else if (color.refs.length) color.kind = "ref";
        else {
            color.kind = "literal";
            color.hex =
                literalToHex(dark) ?? literalToHex(definitionOf(dark) ?? "");
        }
    }
    return colors;
}

// --- Load the theme ---------------------------------------------------------

function loadTheme() {
    const text = fs.readFileSync(THEME_PATH, "utf8");
    let json = "";
    let quote = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            json += c;
            if (c === "\\") json += text[++i];
            else if (c === '"') quote = false;
        } else if (c === '"') {
            quote = true;
            json += c;
        } else if (c === "/" && text[i + 1] === "/") {
            while (i < text.length && text[i] !== "\n") i++;
            json += "\n";
        } else if (c === "/" && text[i + 1] === "*") {
            i = text.indexOf("*/", i + 2) + 1;
        } else json += c;
    }
    try {
        return JSON.parse(json.replace(/,(\s*[}\]])/g, "$1")).colors;
    } catch (error) {
        fail(`theme JSON is invalid: ${error.message}`);
    }
}

// --- Audit ------------------------------------------------------------------

const appRoot = findAppRoot();
const version = JSON.parse(
    fs.readFileSync(path.join(appRoot, "package.json"), "utf8")
).version;
const colors = loadRegistry(appRoot);
const theme = loadTheme();
const isSet = (id) => Object.hasOwn(theme, id);

const isOff = (c) =>
    c.kind === "null" ||
    (c.kind === "literal" && c.hex?.length === 9 && c.hex.endsWith("00"));
const isRoot = (c) =>
    !isSet(c.id) && c.kind === "literal" && !isOff(c) && !c.deprecated;

const children = new Map();
for (const c of colors.values()) {
    for (const parent of c.refs)
        children.set(parent, [...(children.get(parent) ?? []), c.id]);
}
function unsetDescendants(id, found = new Set()) {
    for (const child of children.get(id) ?? []) {
        if (!isSet(child) && !found.has(child)) {
            found.add(child);
            unsetDescendants(child, found);
        }
    }
    return found;
}

const childrenOf = option("--children");
if (childrenOf) {
    if (!colors.has(childrenOf)) fail(`unknown color "${childrenOf}".`);
    const list = [...unsetDescendants(childrenOf)].sort();
    console.log(`${list.length} unset colors inherit from ${childrenOf}:`);
    for (const id of list) console.log(`  ${id}`);
    process.exit(0);
}

const normalize = (hex) => {
    let h = hex.toLowerCase().slice(1);
    if (h.length <= 4) h = [...h].map((c) => c + c).join("");
    return h.length === 6 ? `${h}ff` : h;
};
// The value a plain-reference chain resolves to, if it ends in a key the theme sets.
function inheritedValue(id) {
    for (
        let cur = colors.get(id), hops = 0;
        cur?.plainRef && hops < 20;
        hops++
    ) {
        const parent = cur.refs[0];
        if (isSet(parent)) return { from: parent, value: theme[parent] };
        cur = colors.get(parent);
    }
    return null;
}

const roots = [...colors.values()]
    .filter(isRoot)
    .sort((a, b) => a.id.localeCompare(b.id));
const redundant = Object.keys(theme)
    .map((id) => ({ id, inherited: inheritedValue(id) }))
    .filter(
        ({ id, inherited }) =>
            inherited && normalize(inherited.value) === normalize(theme[id])
    );
const deprecated = Object.keys(theme).filter(
    (id) => colors.get(id)?.deprecated
);
const unknown = Object.keys(theme).filter((id) => !colors.has(id));

const section = (title, lines) => {
    if (!lines.length) return;
    console.log(`\n${title} (${lines.length})`);
    for (const line of lines) console.log(`  ${line}`);
};
section(
    "Uncovered roots: set these, VS Code derives the rest",
    roots.map((c) => {
        const inheritors = unsetDescendants(c.id).size;
        return `${c.id}  stock ${c.hex ?? c.dark}${inheritors ? `  (+${inheritors} inherit)` : ""}`;
    })
);
section(
    "Redundant: same value as inherited, remove to let the parent drive it",
    redundant.map(
        ({ id, inherited }) => `${id}  (= ${inherited.from} ${inherited.value})`
    )
);
section("Deprecated keys", deprecated);
section("Unknown keys (not registered by this VS Code)", unknown);

const inherited = [...colors.values()].filter(
    (c) => !isSet(c.id) && c.kind === "ref"
).length;
const off = [...colors.values()].filter(
    (c) => !isSet(c.id) && (isOff(c) || (c.kind === "literal" && c.deprecated))
).length;
console.log(
    `\nVS Code ${version}: ${colors.size} colors · ${Object.keys(theme).length} set · ${inherited} inherited · ` +
        `${off} off by default · ${roots.length} uncovered roots · ${redundant.length} redundant · ` +
        `${deprecated.length} deprecated · ${unknown.length} unknown`
);

if (strict && (roots.length || deprecated.length || unknown.length))
    process.exit(1);
