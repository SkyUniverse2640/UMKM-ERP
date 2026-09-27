import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native app shell config (Capacitor).
 * Produces REAL native apps (APK/AAB for Android, Xcode project → IPA for iOS),
 * NOT a PWA. The Vue build in `dist/` is embedded in a native WebView.
 *
 * The UI talks to the production backend over HTTPS. CapacitorHttp routes
 * fetch/XHR through the native HTTP stack, so there is no browser CORS wall and
 * the session cookie is persisted by the OS cookie store.
 */
const config: CapacitorConfig = {
  appId: "tech.skyuniverse.umkm",
  appName: "UMKM ERP",
  webDir: "dist",
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
