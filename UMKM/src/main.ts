import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";

// --- Native app API routing ---------------------------------------------
// On web the UI is served by the backend, so relative `/api/...` works.
// Inside the native app (Capacitor) the WebView origin is capacitor://localhost,
// so relative calls would 404. Rewrite them to the production HTTPS backend.
// CapacitorHttp (enabled in capacitor.config.ts) carries the session cookie
// through the native HTTP stack, so there is no CORS wall.
const NATIVE_API_BASE = "https://umkm.skyuniverse.tech";
const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
if (isNative) {
  const _fetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === "string" && input.startsWith("/")) {
      input = NATIVE_API_BASE + input;
      init = { credentials: "include", ...init };
    }
    return _fetch(input as any, init);
  }) as typeof window.fetch;
}

const app = createApp(App);

// ReactBits-style spotlight: card highlight follows the cursor.
// Usage: v-spotlight on any element with the `.spotlight` class.
app.directive("spotlight", {
  mounted(el: HTMLElement) {
    const handler = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    (el as any).__spot = handler;
    el.addEventListener("mousemove", handler);
  },
  unmounted(el: HTMLElement) {
    const h = (el as any).__spot;
    if (h) el.removeEventListener("mousemove", h);
  },
});

app.mount("#app");
