import { handleUpdateBelanja, handleUpdateJual, handleSatuan, handleBantuan } from "./index";
import assert from "node:assert";

console.log("Testing Bot fixes...");

// 1. Bare /updatebelanja prompt
const promptBelanja = await handleUpdateBelanja(["/updatebelanja"]);
console.log("\n--- Prompt Belanja ---");
console.log(promptBelanja);
assert.ok(promptBelanja.includes("Untuk melakukan Update Belanja"), "Must show tutorial");
assert.ok(promptBelanja.includes("12kg"), "Must show 12kg example");

// 2. Bare /updatejual prompt
const promptJual = await handleUpdateJual(["/updatejual"]);
console.log("\n--- Prompt Jual ---");
console.log(promptJual);
assert.ok(promptJual.includes("Untuk melakukan Update Jual"), "Must show tutorial");
assert.ok(promptJual.includes("Wina: ayam kare 10"), "Must show new format example");

// 2b. Test /updatejual new format parsing with colon and comma
const runJual = await handleUpdateJual([
  "/updatejual",
  "26-09-26",
  "Wina: ayam kare 10, cakalang 5",
  "Kevin: ayam kare 2"
]);
console.log("\n--- Executed Jual with colon & multi-sku format ---");
console.log(runJual);
assert.ok(runJual.includes("Nasi Ayam Kare"), "Must match Nasi Ayam Kare");
assert.ok(runJual.includes("Wina"), "Must show Wina");
assert.ok(runJual.includes("Kevin"), "Must show Kevin");

// 3. /satuan command
const satuanRes = handleSatuan();
console.log("\n--- Satuan Result ---");
console.log(satuanRes);
assert.ok(satuanRes.includes("Kilo"), "Must show Kilo");
assert.ok(satuanRes.includes("Sachet"), "Must show Sachet");

// 4. /bantuan command
const bantuanRes = handleBantuan();
console.log("\n--- Bantuan Result ---");
console.log(bantuanRes);
assert.ok(bantuanRes.includes("/bantuan"), "Must list /bantuan");
assert.ok(bantuanRes.includes("/satuan"), "Must list /satuan");

// 5. Case insensitive merged units: "12kg" and "1sachet"
const runBelanja = await handleUpdateBelanja([
  "/updatebelanja",
  "24-09-26",
  "Ayam Broiler, 250000, 12kg",
  "Bumbu Racik, 50000, 1sachet"
]);
console.log("\n--- Executed Belanja with merged units ---");
console.log(runBelanja);
assert.ok(runBelanja.includes("12 Kilo"), "12kg must parse to 12 Kilo");
assert.ok(runBelanja.includes("1 Sachet"), "1sachet must parse to 1 Sachet");

console.log("\n✅ All unit tests and tutorial replies passed successfully!");
