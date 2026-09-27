import { handleUpdateBelanja, handleUpdateJual, handleAnalyticsDashboard } from "./index";
import assert from "node:assert";

console.log("Running WhatsApp Bot logic & API integration tests...");

// Test 1: handleUpdateBelanja multi-item test
const belanjaMsg = [
  "/updatebelanja",
  "24-09-26",
  "Ayam Potong, 240000, 4 KG",
  "Cabe Rawit, 120000, 2 KG"
];

const resBelanja = await handleUpdateBelanja(belanjaMsg);
console.log("--- Belanja Result ---");
console.log(resBelanja);
assert.ok(resBelanja.includes("HASIL UPDATE BELANJA"), "Must return success header");
assert.ok(resBelanja.includes("Ayam Potong"), "Must record Ayam Potong");
assert.ok(resBelanja.includes("Cabe Rawit"), "Must record Cabe Rawit");

// Test 2: handleUpdateJual multi-item test with buyer names and catalog mapping
const jualMsg = [
  "/updatejual",
  "24-09-26",
  "Wina, Cakalang, 2",
  "Wina, Kare, 1",
  "Kevin, Ayam, 3"
];

const resJual = await handleUpdateJual(jualMsg);
console.log("\n--- Jual Result ---");
console.log(resJual);
assert.ok(resJual.includes("HASIL UPDATE PENJUALAN"), "Must return sales header");
assert.ok(resJual.includes("Wina"), "Must record Wina");
assert.ok(resJual.includes("Kevin"), "Must record Kevin");

// Test 3: Analytics Dashboard query
const resAnalytics = await handleAnalyticsDashboard();
console.log("\n--- Analytics Dashboard Result ---");
console.log(resAnalytics);
assert.ok(resAnalytics.includes("EXECUTIVE DASHBOARD"), "Must return dashboard header");
assert.ok(resAnalytics.includes("30D Revenue"), "Must contain rolling revenue");

console.log("\n✅ All WhatsApp Bot handlers and UMKM API endpoints verified successfully!");
