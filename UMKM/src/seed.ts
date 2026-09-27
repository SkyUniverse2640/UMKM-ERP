import { pool, query } from "./db";
import { hashPassword } from "./auth";

async function seed() {
  console.log("Seeding database with ONLY user 'admin'...");
  
  // Wipe / reset all operational data
  await query("SET FOREIGN_KEY_CHECKS = 0;");
  await query("TRUNCATE TABLE daily_sales_inventory;");
  await query("TRUNCATE TABLE opex_records;");
  await query("TRUNCATE TABLE master_items;");
  await query("TRUNCATE TABLE sessions;");
  await query("TRUNCATE TABLE api_keys;");
  await query("TRUNCATE TABLE users;");
  await query("TRUNCATE TABLE business_info;");
  await query("SET FOREIGN_KEY_CHECKS = 1;");

  // Seed ONLY user 'admin' (Password meets: Uppercase, Lowercase, Number, Special Character)
  const defaultAdminPass = process.env.SEED_ADMIN_PASSWORD || "Admin12345!";
  const hash = await hashPassword(defaultAdminPass);
  await query(
    "INSERT INTO users (id, username, password_hash, role) VALUES (1, 'admin', ?, 'admin')",
    [hash]
  );

  // Initialize a default business_info record
  await query(
    `INSERT INTO business_info (id, business_name, business_address, business_logo, business_email, business_telephone) 
     VALUES (1, 'UMKM Digital Enterprise', 'Jl. Sudirman No. 12, Jakarta', '/logo.png', 'contact@umkm.skyuniverse.tech', '+62 812-3456-7890')`
  );

  console.log(`Database reset and seeded successfully!`);
  console.log(`User created: admin (Password: ${defaultAdminPass})`);
  console.log(`Master Items: 0 items (Clean reset)`);
  console.log(`Daily Sales: 0 records (Clean reset)`);
  console.log(`OpEx: 0 records (Clean reset)`);
  
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
