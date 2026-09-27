#!/usr/bin/env bash
# Build the REAL iOS app (native .app / .ipa, NOT a PWA) and copy artifacts to out/IOS.
#
# ⚠️ iOS native compilation REQUIRES macOS + Xcode (xcodebuild) + CocoaPods.
# It CANNOT run on Linux — Apple's toolchain is macOS-only. This machine is Linux,
# so this script must be run on a Mac. The Capacitor Xcode project is already
# generated at ios/App and is ready to open/build there.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="$ROOT/out/IOS"
mkdir -p "$OUT"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "ERROR: iOS builds require macOS + Xcode. Current OS: $(uname)."
  echo "Run this script on a Mac, or use a macOS CI runner (e.g. GitHub Actions macos-latest)."
  echo "The native Xcode project is ready at: $ROOT/ios/App/App.xcworkspace"
  exit 1
fi

echo "==> [1/4] Vite production build"
/home/nanz/.bun/bin/bun run build

echo "==> [2/4] Sync web assets into native iOS project"
npx cap sync ios

echo "==> [3/4] Archive with xcodebuild"
xcodebuild -project ios/App/App.xcodeproj \
  -scheme App -configuration Release \
  -archivePath "$OUT/UMKM-ERP.xcarchive" \
  -destination 'generic/platform=iOS' \
  archive

echo "==> [4/4] Export .ipa (needs ios/ExportOptions.plist with your team/signing)"
if [[ -f ios/ExportOptions.plist ]]; then
  xcodebuild -exportArchive \
    -archivePath "$OUT/UMKM-ERP.xcarchive" \
    -exportPath "$OUT" \
    -exportOptionsPlist ios/ExportOptions.plist
else
  echo "SKIP .ipa export: create ios/ExportOptions.plist (signing team + method) first."
  echo "The .xcarchive is at $OUT/UMKM-ERP.xcarchive — export from Xcode Organizer."
fi

echo ""
echo "iOS artifacts:"
ls -la "$OUT"
