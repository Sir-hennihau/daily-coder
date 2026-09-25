---
name: theme-maintenance
description: "Maintain and improve a VS Code color theme. Use for adjusting palette tokens, improving contrast/accessibility, refining syntax colors, and validating the generated theme package."
argument-hint: "What should be improved in the VS Code theme?"
user-invocable: true
disable-model-invocation: false
---

# VS Code Theme Maintenance

## When to Use

- Update the palette for a specific theme token or semantic color
- Improve readability, contrast, or accessibility in editor UI
- Review the theme for consistency across syntax highlighting, selection states, gutter, sidebar, and debug UI
- Prepare a small iteration or improvement pass before packaging the extension

## Project Context

This repository is a dark VS Code theme extension built around a blue/yellow identity and strong semantic colors for warnings, errors, and info states.

Key files:

- [colors.ts](../../../colors.ts) — source of truth for palette definitions
- [themes/Daily Coder-color-theme.json](../../../themes/Daily%20Coder-color-theme.json) — shipped theme JSON that VS Code reads
- [package.json](../../../package.json) — extension metadata and packaging entry
- [README.md](../../../README.md) — design intent and accessibility framing

## Procedure

1. Start with the root cause and the intended change.
    - If the update is a palette change, edit [colors.ts](../../../colors.ts) first.
    - If the update is a narrow visual adjustment, patch the relevant token in [themes/Daily Coder-color-theme.json](../../../themes/Daily%20Coder-color-theme.json) directly.

2. Keep the theme visually consistent.
    - Preserve the dark high-contrast base.
    - Keep the blue/yellow visual identity and semantic error/warning/info colors coherent.
    - Favor small, targeted tweaks over broad rewrites.

3. Review all affected surfaces before finishing.
    - Syntax highlighting and token colors
    - Selection, hover, and focus states
    - Editor gutter and minimap/ruler colors
    - Sidebar, tabs, breadcrumbs, input controls, and debug UI
    - Git decorations and diff colors

4. Check accessibility and readability.
    - Ensure contrast is strong enough for text and important UI states.
    - Avoid introducing arbitrary brand colors that distort the existing palette.
    - Keep semantic colors recognizable: warnings, errors, info, success, and modified states.

5. Validate the result.
    - Run `npm run audit:colors -- --strict`: checks the JSON parses and that every VS Code root color is covered, with no deprecated or unknown keys. Only set root colors; let VS Code derive the rest (see AGENTS.md, "Color coverage").
    - Run the project validation path:
        - `npm install`
        - `npm run package`

## Quality Bar

A change is ready when:

- It stays within the repo’s established palette language
- It improves readability or consistency without unnecessary churn
- It does not introduce unrelated runtime or build tooling changes
- The extension still packages successfully

## Improvement Heuristics

When looking for theme improvements, prefer:

- Better contrast in low-visibility UI states
- More consistent semantic coloring for warnings/errors/infos
- More readable selections and hover states
- Reduced visual noise in large dark surfaces
- Small refinements that preserve the current identity

Avoid:

- Broad palette resets without a concrete goal
- Random color additions that do not match the existing design language
- Unnecessary runtime code or non-theme files in a visual-only change
