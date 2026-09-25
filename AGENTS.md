# AGENTS

This repository is a VS Code color theme extension. Treat it as a design-focused package: the shipped behavior is the theme JSON, and the goal is to keep the palette accessible, readable, and consistent across editor UI elements.

## Project overview

- The extension entry point is [package.json](package.json); it contributes the "Daily Coder" theme.
- The actual theme definition lives in [themes/Daily Coder-color-theme.json](themes/Daily Coder-color-theme.json).
- The palette source used for the theme is [colors.ts](colors.ts), which defines the base colors used by the design.
- Documentation and product context are in [README.md](README.md).

## Working conventions

- Keep the theme dark and high-contrast. Small, deliberate tweaks are preferred over large rewrites.
- Preserve the existing visual identity: blue/yellow base palette, dark UI surfaces, and strong semantic colors for warnings/errors/infos.
- Favor consistency across editor, sidebar, breadcrumbs, tabs, and debug UI. A color added in one section should usually match the overall theme language.
- If a change affects the theme palette, update the source of truth in [colors.ts](colors.ts) when relevant, then verify the generated theme JSON remains valid.
- Do not add unrelated runtime code or new build tooling for a color-only change.

## Color coverage

- VS Code derives most colors from others (e.g. `menu.background` defaults to `dropdown.background`). Only set **root** colors, whose VS Code default is a hardcoded value, and let the rest inherit.
- Don't add a key that just repeats the value it would inherit; change the parent instead.
- Success/added states use blue, not green (deuteranopia): error/removed = red, conflict = orange, modified = light blue.
- After VS Code updates, run `npm run audit:colors`. It reads the locally installed VS Code's color registry and lists uncovered roots, redundant keys, and deprecated or unknown keys. `npm run audit:colors -- --children <color id>` shows what inherits from a color.

## Validation

- There is no automated test suite in this repo.
- Run `npm run audit:colors -- --strict`; it also fails if the theme JSON doesn't parse.
- The main validation path is packaging the VS Code extension:
  - `npm install`
  - `npm run package` (needs `vsce`; otherwise use `npx @vscode/vsce package`)
- If a change is purely visual, prefer checking the JSON structure and ensuring the theme still loads in VS Code.

## Files to inspect first

- [package.json](package.json) for extension metadata and contribution wiring
- [themes/Daily Coder-color-theme.json](themes/Daily Coder-color-theme.json) for the actual design tokens
- [colors.ts](colors.ts) for palette definitions
- [README.md](README.md) for intent, motivation, and accessibility context

## Change guidance

- Keep changes minimal and targeted to the theme token being adjusted.
- When modifying colors, maintain readability for syntax highlighting, selections, hover states, and errors/warnings.
- Avoid introducing arbitrary brand colors that break the established palette and accessibility goals.
- Snippets and asset folders are supporting content, not the source of the theme logic.
