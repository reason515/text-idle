# Release Notes

Version-specific release notes for in-game **版本** modal and internal distribution.

| Version | File | Status |
|---------|------|--------|
| v0.1.0 | [v0.1.0.md](./v0.1.0.md) | Current MVP internal test |

## Conventions

- One file per semver: `vX.Y.Z.md` (matches `APP_VERSION` in `frontend/src/data/version.js`).
- Structure: `#` title, `**发布日期：**`, `**代号：**`, summary paragraph, then `##` sections with `-` bullet lists.
- UI loads the current file via `frontend/src/data/releaseNotesMarkdown.js` (Vite `?raw` import). When bumping version, add the new markdown here and register the import in that module.
