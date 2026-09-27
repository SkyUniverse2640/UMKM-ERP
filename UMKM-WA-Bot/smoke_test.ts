import { handleMenu, handlePesan } from "./index.ts";
const jid = "6280000000000@s.whatsapp.net";
console.log("=== /menu ===");
console.log(await handleMenu());
console.log("\n=== /pesan (no args) ===");
console.log(await handlePesan("/pesan", jid));
console.log("\n=== /pesan 1 2 (SKU index) ===");
console.log(await handlePesan("/pesan 1 2", jid));
