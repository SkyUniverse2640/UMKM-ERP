#!/usr/bin/env bash
# Build the REAL Android app (native APK + AAB, NOT a PWA) and copy artifacts to out/Android.
# Requires: Android SDK (cmdline-tools + platform-tools + platform 35 + build-tools 35),
# JDK 17+, ANDROID_HOME. Run from the project root: npm run build:android
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

OUT="$ROOT/out/Android"
mkdir -p "$OUT"

echo "==> [1/4] Vite production build"
/home/nanz/.bun/bin/bun run build

echo "==> [2/4] Sync web assets into native Android project"
npx cap sync android

echo "==> [3/4] Gradle: assemble debug APK + release AAB"
cd "$ROOT/android"
./gradlew --no-daemon assembleDebug bundleRelease

echo "==> [4/4] Collect artifacts into out/Android"
cp -f app/build/outputs/apk/debug/app-debug.apk "$OUT/UMKM-ERP-debug.apk" 2>/dev/null || true
cp -f app/build/outputs/bundle/release/app-release.aab "$OUT/UMKM-ERP-release.aab" 2>/dev/null || true

echo ""
echo "Android artifacts:"
ls -la "$OUT"
echo ""
echo "NOTE: the release .aab is UNSIGNED. Sign with your keystore before Play Store upload:"
echo "  jarsigner / apksigner using your own release keystore."
