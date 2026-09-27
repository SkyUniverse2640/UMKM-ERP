# UMKM ERP — Native Mobile Apps (Android + iOS)

These are **real native apps** (Capacitor, not a PWA). The Vue build in `dist/` is
embedded in a native WebView shell; the app talks to the production backend at
`https://umkm.skyuniverse.tech` over the native HTTP stack (no browser CORS wall,
OS-managed session cookie — see `src/main.ts`).

- App ID: `tech.skyuniverse.umkm`
- App name: `UMKM ERP`
- Native projects: `android/` (Gradle) and `ios/App` (Xcode)
- Config: `capacitor.config.ts`

## Build outputs
- Android → `out/Android/`
- iOS → `out/IOS/`

## Android (works on this Linux machine)
```bash
npm run build:android
```
Produces:
- `out/Android/UMKM-ERP-debug.apk` — installable debug APK (sideload / test).
- `out/Android/UMKM-ERP-release.aab` — Play Store bundle (**UNSIGNED**; sign with
  your release keystore before upload).

Toolchain used (already installed under `~/Android`):
- Android SDK: `~/Android/Sdk` (platform-35, build-tools 35.0.0, platform-tools)
- JDK 21: `~/Android/jdk/jdk-21.0.2` (pinned via `android/gradle.properties`
  `org.gradle.java.home` — system JDK 26 is too new for Android Gradle Plugin)
- `android/local.properties` → `sdk.dir=/home/nanz/Android/Sdk`

### Sign the release AAB
```bash
keytool -genkey -v -keystore umkm-release.jks -keyalg RSA -keysize 2048 \
  -validity 10000 -alias umkm
# then configure signingConfigs in android/app/build.gradle, or sign the APK:
~/Android/Sdk/build-tools/35.0.0/apksigner sign --ks umkm-release.jks <apk>
```

## iOS (requires macOS + Xcode — CANNOT build on Linux)
Apple's toolchain is macOS-only. The native Xcode project is fully generated and
ready at `ios/App/App.xcodeproj`. On a Mac:
```bash
npm run build:ios          # runs scripts/build-ios.sh
```
This archives to `out/IOS/UMKM-ERP.xcarchive`. To export a signed `.ipa`, create
`ios/ExportOptions.plist` (see `ios/ExportOptions.plist.example`) with your Apple
Team ID + distribution method, then the script exports the `.ipa` automatically.
Or open `ios/App/App.xcworkspace` in Xcode and Archive → Distribute from there.

## After changing the web app
Rebuild + resync the native shells:
```bash
npm run build:mobile       # vite build && cap sync
```
