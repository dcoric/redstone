# Desktop Release Checklist

## Automated gates

- [x] Strict TypeScript
- [x] Credential encryption tests
- [x] SQLite CRUD, search, cursor, and conflict tests
- [x] Electron fuses and hardened preload boundary
- [x] macOS arm64 package generated locally
- [x] Tag-triggered macOS, Windows, and Linux maker workflow configured

## Release process

1. Complete the platform smoke checks below.
2. Tag the desired commit, for example `v1.0.0`.
3. Push the tag to GitHub.
4. The `Desktop Release` workflow builds each platform and uploads the resulting
   installers to the generated GitHub Release.

## Platform smoke checks

- [ ] macOS: install, launch, sign in, restart, and verify session restoration
- [ ] Windows: install with Squirrel, launch, and verify shortcuts
- [ ] Linux: install `.deb` and `.rpm` artifacts on representative distributions
- [ ] Create, edit, search, and delete notes while offline
- [ ] Reconnect and verify pending changes synchronize
- [ ] Produce a web/desktop edit conflict and resolve it both ways
- [ ] Verify expired credentials return to sign-in while local notes remain intact
- [ ] Confirm Linux does not report the `basic_text` safeStorage backend before release

Code signing and notarization credentials are intentionally not stored in the
repository and must be supplied through GitHub Actions secrets when distribution
requires signed installers.
