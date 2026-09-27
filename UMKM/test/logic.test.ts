import assert from "node:assert/strict";
import { calculatePeriodicDailySales } from "../src/inventory";
import { hashPassword, verifyPassword, generateSessionToken, sanitizeInput } from "../src/auth";

console.log("Running self-check tests...");

// 1. Periodic Inventory & Waste Calculation
const normalDay = calculatePeriodicDailySales({
  startingStock: 100,
  restockQuantity: 50,
  leftoverQuantity: 30,
  wasteQuantity: 5, // 5 spoiled items
  unitPrice: 15000,
});
// Total available: 150. Accounted unsold: 30 + 5 = 35. Sold = 115.
assert.equal(normalDay.soldQuantity, 115, "Sold quantity must be 115");
assert.equal(normalDay.totalRevenue, 115 * 15000, "Revenue must reflect only sold items, not waste");

// 2. Waste tracking integrity: waste must not become revenue
const wasteDay = calculatePeriodicDailySales({
  startingStock: 10,
  restockQuantity: 0,
  leftoverQuantity: 0,
  wasteQuantity: 10, // All spoiled
  unitPrice: 20000,
});
assert.equal(wasteDay.soldQuantity, 0, "All items spoiled, sold quantity must be 0");
assert.equal(wasteDay.totalRevenue, 0, "Revenue must be 0 for spoiled items");

// 3. Balance violation check
assert.throws(() => {
  calculatePeriodicDailySales({
    startingStock: 10,
    restockQuantity: 0,
    leftoverQuantity: 8,
    wasteQuantity: 5, // 8 + 5 = 13 > 10
    unitPrice: 10000,
  });
}, /Invalid inventory balance/);

// 4. Authentication (Argon2id & Complexity)
const pwd = "SecureMasterPassword123!";
const hashed = await hashPassword(pwd);
assert.ok(hashed.startsWith("$argon2id$"), "Hash must use Argon2id");
assert.ok(await verifyPassword(pwd, hashed), "Password verification must succeed");
assert.ok(!(await verifyPassword("WrongPassword", hashed)), "Wrong password must fail");

// Complexity checks
assert.rejects(async () => await hashPassword("simple"), /at least 8 characters/);
assert.rejects(async () => await hashPassword("lowercaseonly123!"), /uppercase letter/);
assert.rejects(async () => await hashPassword("UPPERCASEONLY123!"), /lowercase letter/);
assert.rejects(async () => await hashPassword("NoNumbersHere!"), /number/);
assert.rejects(async () => await hashPassword("NoSpecialChars123"), /special character/);

// 5. Session token generation
const token1 = generateSessionToken();
const token2 = generateSessionToken();
assert.equal(token1.length, 64, "Token must be 64-char hex string (32 bytes)");
assert.notEqual(token1, token2, "Tokens must be unique");

// 6. XSS sanitization
const malicious = '<script>alert("xss")</script>';
const clean = sanitizeInput(malicious);
assert.equal(clean, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');

console.log("All unit and security assertions passed successfully!");
