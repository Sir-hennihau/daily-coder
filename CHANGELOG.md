# Change Log

All notable changes to the "daily-coder" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [2.0.0] - 2026-09-25

### Added

- **Daily Coder Vivid**: the same theme with more saturated colors and identical contrast.

### Changed

- New palette: every color now comes from a luminance-based palette, so a shade has the same contrast in every hue. Blue and yellow stay the identity, purples move to indigo, and the active tab keeps its dark navy.
- Text keeps WCAG AA contrast or better on the surface it actually renders on: editor, current line, selections, search results, diffs, merge conflicts, popups, badges and buttons.
- Popups (hover, suggestions, find, quick open, menus, notifications) get their own surface, so they stand out from the editor and the title bar while all borders stay flat.
- Keywords, numbers, comments, line numbers and diff markup were too dark before and are now readable.
- Errors, warnings and git states differ in lightness as well as hue, so they stay apart with deuteranopia.

## [Unreleased]

- Initial release
