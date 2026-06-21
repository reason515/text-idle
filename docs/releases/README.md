# Release Notes

Version-specific release notes for in-game **版本** modal and internal distribution.

| Version | File | Status |
|---------|------|--------|
| v0.1.4 | [v0.1.4.md](./v0.1.4.md) | Current — production load performance |
| v0.1.3 | [v0.1.3.md](./v0.1.3.md) | Death rest penalty and equip fixes |
| v0.1.2 | [v0.1.2.md](./v0.1.2.md) | Global message board |
| v0.1.1 | [v0.1.1.md](./v0.1.1.md) | Tactics UX patch |
| v0.1.0 | [v0.1.0.md](./v0.1.0.md) | MVP internal test |

## Conventions

- One file per semver: `vX.Y.Z.md` (matches `APP_VERSION` in `frontend/src/data/version.js`).
- Structure: `#` title, `**发布日期：**`, `**代号：**`, summary paragraph, then `##` sections with `-` bullet lists.
- UI loads the current file via `frontend/src/data/releaseNotesMarkdown.js` (Vite `?raw` import). **Version modal** uses `getAllReleaseNotes()` to list every registered version (newest first); inline `**bold**` is rendered in UI via `ReleaseNoteInline.vue`. When bumping version, add the new markdown here and register the import in that module.
