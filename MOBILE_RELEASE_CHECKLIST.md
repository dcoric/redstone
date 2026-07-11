# Mobile Release Checklist

## Configuration

Set `EXPO_PUBLIC_API_URL` to the deployed API base URL, including `/api`:

```bash
EXPO_PUBLIC_API_URL=https://redstone.citadel.red/api pnpm dev:mobile
```

The fallback URLs are suitable only for local simulators:

- iOS simulator: `http://localhost:3000/api`
- Android emulator: `http://10.0.2.2:3000/api`

## Automated gates

- [x] `pnpm lint`
- [x] `pnpm test`
- [x] `pnpm build`
- [x] `pnpm --filter mobile exec tsc --noEmit`
- [x] Expo SDK dependency versions aligned
- [x] iOS production JavaScript bundle generated
- [x] Android production JavaScript bundle generated

Expo Doctor reports the web workspace's React 19.2 packages alongside Expo's
required React 19.1 package. Native Metro exports resolve the Expo-compatible
version and complete successfully on both platforms.

## Physical-device QA

- [ ] Sign up, sign in, restart the app, and sign out
- [ ] Create, edit, preview, and delete a note online
- [ ] Repeat file CRUD in airplane mode, then reconnect and sync
- [ ] Move a note between nested folders
- [ ] Search titles and note content while offline
- [ ] Add and remove tags offline, then verify them on the web client
- [ ] Edit the same note on web and mobile and resolve the conflict both ways
- [ ] Verify expired credentials return to the login screen
- [ ] Check small-screen layout, keyboard avoidance, and accessibility labels

Close Phase 5 issues only after these checks pass on both iOS and Android.
