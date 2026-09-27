// ponytail: Bun.serve single-process monolith serving API and SPA frontend.
import { pool, query } from "./src/db";
import { verifyPassword, hashPassword, generateSessionToken, sanitizeInput } from "./src/auth";
import { calculatePeriodicDailySales } from "./src/inventory";
import { saveUploadedLogo, saveUploadedAvatar } from "./src/upload";
import path from "path";
import nodeCrypto from "crypto";

const PORT = Number(process.env.PORT) || 8030;
const DIST_DIR = path.resolve(__dirname, "dist");

function json(data: any, status = 200, headers: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function getSessionToken(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/session_token=([a-f0-9]{64})/);
  return match ? match[1] : null;
}

async function authenticate(req: Request) {
  // 1. Bearer Token or X-API-Key header (for external bots, automation, scripts)
  const authHeader = req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("X-API-Key");
  let bearerKey: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    bearerKey = authHeader.slice(7).trim();
  } else if (apiKeyHeader) {
    bearerKey = apiKeyHeader.trim();
  }

  if (bearerKey) {
    // Check active api_keys
    const apiUsers = await query<any>(
      `SELECT u.id, u.username, u.role, a.key_name 
       FROM api_keys a 
       JOIN users u ON u.id = a.created_by 
       WHERE a.api_key = ? AND a.is_active = TRUE`,
      [bearerKey]
    );
    if (apiUsers.length) return { ...apiUsers[0], _via: "apikey" };

    // Also check if bearer matches a valid session token
    const sessUsers = await query<any>(
      `SELECT u.id, u.username, u.role, u.display_name, u.avatar_url, u.wa_uid
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > NOW()`,
      [bearerKey]
    );
    if (sessUsers.length) return { ...sessUsers[0], _via: "session" };
  }

  // 2. Cookie session fallback
  const token = getSessionToken(req);
  if (!token) return null;

  const users = await query<any>(
    `SELECT u.id, u.username, u.role, u.display_name, u.avatar_url, u.wa_uid
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > NOW()`,
    [token]
  );
  return users[0] ? { ...users[0], _via: "session" } : null;
}

// Resolve the data tenant for this request.
//  - WhatsApp bot (API key): scope to the account bound to the X-WA-JID sender number.
//  - Session admin: "god view" — reads span every user; writes are owned by the admin.
//  - Session user: strictly their own data.
// Returns ownerId (used for INSERT/UPDATE/DELETE ownership) and scopeAll (reads see everything).
async function resolveTenant(
  req: Request,
  currentUser: any
): Promise<{ ownerId: number | null; scopeAll: boolean; error?: string }> {
  if (currentUser?._via === "apikey") {
    const rawJid = req.headers.get("X-WA-JID") || "";
    const digits = rawJid.split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
    if (!digits) {
      return { ownerId: null, scopeAll: false, error: "Nomor WhatsApp belum dihubungkan. Ketik /setup <UID> dulu." };
    }
    const jid = `${digits}@s.whatsapp.net`;
    const rows = await query<any>("SELECT id FROM users WHERE wa_jid = ?", [jid]);
    if (!rows.length) {
      return { ownerId: null, scopeAll: false, error: "Nomor ini belum terhubung ke akun manapun. Ketik /setup <UID>." };
    }
    return { ownerId: rows[0].id, scopeAll: false };
  }
  // Session-based
  if (currentUser?.role === "admin") {
    return { ownerId: currentUser.id, scopeAll: true };
  }
  return { ownerId: currentUser.id, scopeAll: false };
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    // CORS
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": req.headers.get("Origin") || "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
        },
      });
    }

    // API Routes
    if (pathname.startsWith("/api/")) {
      try {
        // 1. Auth: Login (by UID or username + password)
        if (pathname === "/api/auth/login" && method === "POST") {
          const body = await req.json();
          const identifier = sanitizeInput(String(body.uid || "").trim());
          const password = body.password;

          if (!identifier || !password) return json({ error: "UID and password required" }, 400);

          // Login ONLY by wa_uid (UID) — display name / username are NOT accepted.
          const users = await query<any>(
            "SELECT * FROM users WHERE wa_uid = ? LIMIT 1",
            [identifier.toUpperCase()]
          );
          const user = users[0];
          if (!user || !(await verifyPassword(password, user.password_hash))) {
            return json({ error: "UID atau password salah." }, 401);
          }

          // Session lifetime: 90 days if "remember me" is explicitly checked, else 7 days.
          // The password is ALWAYS verified above — "remember" only affects duration,
          // never whether authentication is required. No credential bypass path exists.
          const rememberDays = body.remember === true ? 90 : 7;
          const maxAgeSec = rememberDays * 86400;

          const token = generateSessionToken();
          const expiresAt = new Date(Date.now() + maxAgeSec * 1000);

          await query("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [
            token,
            user.id,
            expiresAt,
          ]);

          return json(
            { message: "Logged in", user: { id: user.id, username: user.username, role: user.role, wa_uid: user.wa_uid, display_name: user.display_name, avatar_url: user.avatar_url } },
            200,
            {
              "Set-Cookie": `session_token=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}`,
            }
          );
        }

        // Public Health check
        if (pathname === "/api/health") return json({ status: "healthy" });

        // Session verification guard
        const currentUser = await authenticate(req);
        if (!currentUser) {
          return json({ error: "Unauthorized" }, 401);
        }

        // Resolve which user's data this request operates on (multi-tenant).
        const tenant = await resolveTenant(req, currentUser);

        // Current user
        if (pathname === "/api/auth/me" && method === "GET") {
          return json({ user: currentUser });
        }

        // Logout
        if (pathname === "/api/auth/logout" && method === "POST") {
          const token = getSessionToken(req);
          if (token) await query("DELETE FROM sessions WHERE id = ?", [token]);
          return json({ message: "Logged out" }, 200, {
            "Set-Cookie": `session_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
          });
        }

        // 1b. User Profile: update display name / avatar
        if (pathname === "/api/auth/profile" && method === "PUT") {
          const body = await req.json();
          const displayName = body.display_name !== undefined
            ? sanitizeInput(String(body.display_name).trim()).slice(0, 100)
            : null;
          const avatarUrl = body.avatar_url !== undefined
            ? sanitizeInput(String(body.avatar_url).trim()).slice(0, 255)
            : undefined;

          if (avatarUrl !== undefined) {
            await query("UPDATE users SET display_name = ?, avatar_url = ? WHERE id = ?", [
              displayName || null,
              avatarUrl || null,
              currentUser.id,
            ]);
          } else {
            await query("UPDATE users SET display_name = ? WHERE id = ?", [
              displayName || null,
              currentUser.id,
            ]);
          }
          const rows = await query<any>(
            "SELECT id, username, role, display_name, avatar_url FROM users WHERE id = ?",
            [currentUser.id]
          );
          return json({ message: "Profile updated", user: rows[0] });
        }

        // 1c. User Profile: change password (current + new, with complexity rules)
        if (pathname === "/api/auth/change-password" && method === "POST") {
          const body = await req.json();
          const currentPassword = body.current_password;
          const newPassword = body.new_password;
          const confirmPassword = body.confirm_password;

          if (!currentPassword || !newPassword || !confirmPassword) {
            return json({ error: "All password fields are required." }, 400);
          }
          if (newPassword !== confirmPassword) {
            return json({ error: "New password and confirmation do not match." }, 400);
          }

          const rows = await query<any>("SELECT password_hash FROM users WHERE id = ?", [currentUser.id]);
          if (!rows.length || !(await verifyPassword(currentPassword, rows[0].password_hash))) {
            return json({ error: "Current password is incorrect." }, 401);
          }
          if (await verifyPassword(newPassword, rows[0].password_hash)) {
            return json({ error: "New password must differ from the current password." }, 400);
          }

          let newHash: string;
          try {
            newHash = await hashPassword(newPassword); // enforces complexity rules
          } catch (e: any) {
            return json({ error: e.message || "Password does not meet requirements." }, 400);
          }
          await query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, currentUser.id]);
          // Invalidate all other sessions for safety; keep current one
          const keepToken = getSessionToken(req);
          if (keepToken) {
            await query("DELETE FROM sessions WHERE user_id = ? AND id <> ?", [currentUser.id, keepToken]);
          }
          return json({ message: "Password changed successfully." });
        }

        // 1d. User Profile: avatar upload
        if (pathname === "/api/upload/avatar" && method === "POST") {
          const formData = await req.formData();
          const file = formData.get("avatar") || formData.get("file");
          if (!file || !(file instanceof File)) {
            return json({ error: "No image file provided" }, 400);
          }
          const fileUrl = await saveUploadedAvatar(file);
          await query("UPDATE users SET avatar_url = ? WHERE id = ?", [fileUrl, currentUser.id]);
          return json({ message: "Avatar uploaded", avatar_url: fileUrl });
        }

        // 2. Master Data - Items
        if (pathname === "/api/items" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const items = tenant.scopeAll
            ? await query("SELECT * FROM master_items ORDER BY is_active DESC, group_name ASC, id DESC")
            : await query("SELECT * FROM master_items WHERE user_id = ? ORDER BY is_active DESC, group_name ASC, id DESC", [tenant.ownerId]);
          return json(items);
        }

        if (pathname === "/api/items" && method === "POST") {
          if (tenant.error || tenant.ownerId == null) return json({ error: tenant.error || "No tenant" }, 400);
          const body = await req.json();
          const name = sanitizeInput(body.name?.trim());
          const groupName = body.group_name ? sanitizeInput(body.group_name.trim()) : null;
          const currentPrice = Number(body.current_price);

          if (!name || isNaN(currentPrice) || currentPrice < 0) {
            return json({ error: "Valid item name and non-negative price required" }, 400);
          }

          const dup = await query<any>("SELECT id FROM master_items WHERE user_id = ? AND name = ?", [tenant.ownerId, name]);
          if (dup.length) return json({ error: "Produk dengan nama ini sudah ada." }, 409);

          const res: any = await query(
            "INSERT INTO master_items (user_id, name, group_name, current_price, is_active) VALUES (?, ?, ?, ?, TRUE)",
            [tenant.ownerId, name, groupName, currentPrice]
          );
          return json({ id: res.insertId, name, group_name: groupName, current_price: currentPrice, is_active: 1 }, 201);
        }

        if (pathname === "/api/items" && method === "PUT") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const body = await req.json();
          const id = Number(body.id);
          const name = sanitizeInput(body.name?.trim());
          const groupName = body.group_name !== undefined ? (body.group_name ? sanitizeInput(body.group_name.trim()) : null) : null;
          const currentPrice = Number(body.current_price);
          const isActive = body.is_active !== undefined ? Boolean(body.is_active) : true;

          if (isNaN(id) || !name || isNaN(currentPrice) || currentPrice < 0) {
            return json({ error: "Valid item ID, name, and non-negative price required" }, 400);
          }

          // Ownership guard (admin may edit any).
          const own = await query<any>("SELECT user_id FROM master_items WHERE id = ?", [id]);
          if (!own.length) return json({ error: "Item not found" }, 404);
          if (!tenant.scopeAll && own[0].user_id !== tenant.ownerId) return json({ error: "Forbidden" }, 403);

          await query("UPDATE master_items SET name = ?, group_name = ?, current_price = ?, is_active = ? WHERE id = ?", [
            name,
            groupName,
            currentPrice,
            isActive,
            id,
          ]);
          return json({ id, name, group_name: groupName, current_price: currentPrice, is_active: isActive ? 1 : 0 });
        }

        if (pathname === "/api/items" && method === "DELETE") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const id = Number(url.searchParams.get("id"));
          if (isNaN(id)) return json({ error: "Valid item ID required" }, 400);

          const own = await query<any>("SELECT user_id FROM master_items WHERE id = ?", [id]);
          if (!own.length) return json({ error: "Item not found" }, 404);
          if (!tenant.scopeAll && own[0].user_id !== tenant.ownerId) return json({ error: "Forbidden" }, 403);

          // Check if item has transactions
          const trans = await query<any>("SELECT COUNT(*) as count FROM daily_sales_inventory WHERE item_id = ?", [id]);
          if (trans[0]?.count > 0) {
            // Soft delete/archive to protect immutable transaction history
            await query("UPDATE master_items SET is_active = FALSE WHERE id = ?", [id]);
            return json({ message: "Item archived (has existing transactions)", archived: true });
          } else {
            // Hard delete if no linked transactions
            await query("DELETE FROM master_items WHERE id = ?", [id]);
            return json({ message: "Item deleted successfully", deleted: true });
          }
        }

        // 3. Master Data - OpEx
        if (pathname === "/api/opex/scan" && method === "POST") {
          const AI_URL = process.env.AI_GATEWAY_URL || "http://localhost:20128/v1";
          const AI_KEY = process.env.AI_API_KEY || "";
          const AI_MODEL = process.env.AI_VISION_MODEL || "jdw/claude-opus-4-8";
          if (!AI_KEY) return json({ error: "Receipt scanning is not configured (missing AI_API_KEY)" }, 503);

          const form = await req.formData();
          const file = form.get("receipt");
          if (!(file instanceof File)) return json({ error: "No receipt image uploaded" }, 400);
          const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
          if (!allowed.includes(file.type)) return json({ error: "Only PNG, JPG or WEBP images are supported" }, 400);
          if (file.size > 8 * 1024 * 1024) return json({ error: "Image too large (max 8MB)" }, 400);

          const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
          const today = new Date().toISOString().split("T")[0];
          const prompt = `You are an expense parser for an Indonesian small business. The image is EITHER a physical receipt (supermarket, minimarket, traditional market, handwritten) OR a screenshot from an online shop / e-commerce / e-wallet app (Tokopedia, Shopee, Gojek, GoPay, DANA, mobile banking, transaction history, invoices). Extract every purchased line item / transaction as a business cost. Return ONLY a JSON object, no prose, shaped exactly:\n{"expense_date":"YYYY-MM-DD","items":[{"item_name":string,"price_paid":number,"quantity":number,"measurement":"Box|Pcs|Kilo|Litre|Sachet"}]}\nRules:\n- price_paid is the TOTAL rupiah paid for that line as a plain integer (no dots, no commas, no "Rp"). e.g. "Rp326.890" -> 326890.\n- quantity defaults to 1 if not shown. Pick the closest measurement unit; default "Pcs".\n- For a transaction-history screenshot, treat each transaction row as one item: item_name = the product/description (e.g. "XL SATU", "Mandiri E-Money 10rb"), price_paid = that row's total.\n- CRITICAL — only include a transaction if BOTH its description AND its total price are FULLY visible in the image. If a row is cut off at the top or bottom edge, or its price is not fully shown, OMIT it entirely. Never guess or estimate a partially visible amount.\n- Ignore page totals, subtotals, tax, shipping-as-separate-line only if it is a summary, change/kembalian, balance, store headers, search bars, tab labels, and status text.\n- If a transaction/receipt date is visible use it (convert Indonesian dates like "7 Sep 2026" to YYYY-MM-DD), else use "${today}".`;

          let aiText = "";
          try {
            const aiRes = await fetch(`${AI_URL}/chat/completions`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${AI_KEY}` },
              body: JSON.stringify({
                model: AI_MODEL,
                max_tokens: 1500,
                stream: false,
                messages: [{ role: "user", content: [
                  { type: "text", text: prompt },
                  { type: "image_url", image_url: { url: `data:${file.type};base64,${b64}` } },
                ] }],
              }),
            });
            const raw = await aiRes.text();
            // Gateway may stream SSE even with stream:false — reassemble either shape
            if (raw.startsWith("data:")) {
              for (const line of raw.split("\n")) {
                const t = line.trim();
                if (!t.startsWith("data:")) continue;
                const payload = t.slice(5).trim();
                if (payload === "[DONE]") break;
                try { aiText += JSON.parse(payload)?.choices?.[0]?.delta?.content || ""; } catch {}
              }
            } else {
              const parsed = JSON.parse(raw);
              aiText = parsed?.choices?.[0]?.message?.content || "";
            }
          } catch (e: any) {
            return json({ error: "Failed to reach receipt scanner: " + (e?.message || "unknown") }, 502);
          }

          // Strip code fences and isolate the JSON object
          const cleaned = aiText.replace(/```json/gi, "").replace(/```/g, "").trim();
          const start = cleaned.indexOf("{");
          const end = cleaned.lastIndexOf("}");
          if (start === -1 || end === -1) return json({ error: "Could not read any items from the receipt. Try a clearer photo." }, 422);
          let extracted: any;
          try { extracted = JSON.parse(cleaned.slice(start, end + 1)); }
          catch { return json({ error: "Could not parse the scanned receipt. Try a clearer photo." }, 422); }

          const allowedUnits = ["Box", "Pcs", "Kilo", "Litre", "Sachet"];
          const items = Array.isArray(extracted?.items) ? extracted.items : [];
          const clean = items.map((it: any) => ({
            item_name: sanitizeInput(String(it?.item_name || "").trim()).slice(0, 120),
            price_paid: Math.max(0, Math.round(Number(it?.price_paid) || 0)),
            quantity: Math.max(1, Number(it?.quantity) || 1),
            measurement: allowedUnits.includes(it?.measurement) ? it.measurement : "Pcs",
          })).filter((it: any) => it.item_name && it.price_paid > 0);

          const dateRe = /^\d{4}-\d{2}-\d{2}$/;
          const expense_date = dateRe.test(extracted?.expense_date) ? extracted.expense_date : today;
          if (clean.length === 0) return json({ error: "No purchasable items detected on the receipt." }, 422);
          return json({ expense_date, items: clean });
        }

        if (pathname === "/api/opex" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const records = tenant.scopeAll
            ? await query("SELECT * FROM opex_records ORDER BY expense_date DESC, id DESC LIMIT 100")
            : await query("SELECT * FROM opex_records WHERE user_id = ? ORDER BY expense_date DESC, id DESC LIMIT 100", [tenant.ownerId]);
          return json(records);
        }

        if (pathname === "/api/opex" && method === "POST") {
          if (tenant.error || tenant.ownerId == null) return json({ error: tenant.error || "No tenant" }, 400);
          const body = await req.json();
          const itemName = sanitizeInput(body.item_name?.trim());
          const pricePaid = Number(body.price_paid);
          const quantity = Number(body.quantity);
          const measurement = body.measurement;
          const expenseDate = body.expense_date || new Date().toISOString().split("T")[0];
          const notes = body.notes ? sanitizeInput(body.notes.trim()) : null;

          const allowedUnits = ["Box", "Pcs", "Kilo", "Litre", "Sachet"];
          if (!itemName || isNaN(pricePaid) || isNaN(quantity) || !allowedUnits.includes(measurement)) {
            return json({ error: "Invalid OpEx fields or measurement unit" }, 400);
          }

          const res: any = await query(
            "INSERT INTO opex_records (user_id, item_name, price_paid, quantity, measurement, expense_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [tenant.ownerId, itemName, pricePaid, quantity, measurement, expenseDate, notes]
          );
          return json({ id: res.insertId, message: "OpEx recorded" }, 201);
        }

        if (pathname === "/api/opex" && method === "PUT") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const body = await req.json();
          const id = Number(body.id);
          const itemName = sanitizeInput(body.item_name?.trim());
          const pricePaid = Number(body.price_paid);
          const quantity = Number(body.quantity);
          const measurement = body.measurement;
          const expenseDate = body.expense_date || new Date().toISOString().split("T")[0];
          const notes = body.notes ? sanitizeInput(body.notes.trim()) : null;

          const allowedUnits = ["Box", "Pcs", "Kilo", "Litre", "Sachet"];
          if (isNaN(id) || !itemName || isNaN(pricePaid) || isNaN(quantity) || !allowedUnits.includes(measurement)) {
            return json({ error: "Invalid OpEx fields or measurement unit" }, 400);
          }

          const own = await query<any>("SELECT user_id FROM opex_records WHERE id = ?", [id]);
          if (!own.length) return json({ error: "OpEx not found" }, 404);
          if (!tenant.scopeAll && own[0].user_id !== tenant.ownerId) return json({ error: "Forbidden" }, 403);

          await query(
            "UPDATE opex_records SET item_name = ?, price_paid = ?, quantity = ?, measurement = ?, expense_date = ?, notes = ? WHERE id = ?",
            [itemName, pricePaid, quantity, measurement, expenseDate, notes, id]
          );
          return json({ id, message: "OpEx updated" });
        }

        if (pathname === "/api/opex" && method === "DELETE") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const id = Number(url.searchParams.get("id"));
          if (isNaN(id)) return json({ error: "Valid OpEx ID required" }, 400);

          const own = await query<any>("SELECT user_id FROM opex_records WHERE id = ?", [id]);
          if (!own.length) return json({ error: "OpEx not found" }, 404);
          if (!tenant.scopeAll && own[0].user_id !== tenant.ownerId) return json({ error: "Forbidden" }, 403);

          await query("DELETE FROM opex_records WHERE id = ?", [id]);
          return json({ message: "OpEx record deleted" });
        }

        // 4. Daily Operations (Periodic Inventory & Price Snapshot)
        if (pathname === "/api/daily-sales" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
          const entries = await query<any>(
            `SELECT 
               d.id, d.entry_date, d.item_id, d.buyer_name, m.name AS item_name, m.group_name,
               d.starting_stock, d.restock_quantity, d.leftover_quantity, d.waste_quantity,
               d.sold_quantity, d.snapshotted_unit_price, d.total_revenue, d.created_at
             FROM daily_sales_inventory d
             JOIN master_items m ON m.id = d.item_id
             WHERE d.entry_date = ?${tenant.scopeAll ? "" : " AND d.user_id = ?"}
             ORDER BY m.name ASC, d.id DESC`,
            tenant.scopeAll ? [date] : [date, tenant.ownerId]
          );
          return json(entries);
        }

        // Distinct dates that have orders/pesanan (for dashboard date highlighting)
        if (pathname === "/api/order-dates" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const rows = await query<any>(
            `SELECT DISTINCT entry_date FROM daily_sales_inventory${tenant.scopeAll ? "" : " WHERE user_id = ?"} ORDER BY entry_date ASC`,
            tenant.scopeAll ? [] : [tenant.ownerId]
          );
          return json(rows.map((r) => (r.entry_date instanceof Date ? r.entry_date.toISOString().split("T")[0] : String(r.entry_date).split("T")[0])));
        }

        // Upcoming orders (entry_date today or later) grouped rows for overlay
        if (pathname === "/api/upcoming-orders" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const rows = await query<any>(
            `SELECT 
               d.entry_date, d.buyer_name, m.name AS item_name, m.group_name,
               d.starting_stock, d.sold_quantity, d.snapshotted_unit_price
             FROM daily_sales_inventory d
             JOIN master_items m ON m.id = d.item_id
             WHERE d.entry_date >= CURDATE()${tenant.scopeAll ? "" : " AND d.user_id = ?"}
             ORDER BY d.entry_date ASC, d.buyer_name ASC`,
            tenant.scopeAll ? [] : [tenant.ownerId]
          );
          const norm = rows.map((r) => ({
            ...r,
            entry_date: r.entry_date instanceof Date ? r.entry_date.toISOString().split("T")[0] : String(r.entry_date).split("T")[0],
          }));
          return json(norm);
        }

        // POST create daily stock (Waste / Leftover unified model)
        if (pathname === "/api/daily-sales" && method === "POST") {
          if (tenant.error || tenant.ownerId == null) return json({ error: tenant.error || "No tenant" }, 400);
          const body = await req.json();
          const entryDate = body.entry_date || new Date().toISOString().split("T")[0];
          const itemId = Number(body.item_id);
          const buyerName = body.buyer_name ? sanitizeInput(body.buyer_name.trim()) : null;
          const buyerPhone = body.buyer_phone ? sanitizeInput(String(body.buyer_phone).replace(/[^0-9+]/g, "").trim()) : null;
          const startingStock = Number(body.starting_stock || 0);
          const restockQuantity = Number(body.restock_quantity || 0);
          // Leftover (unsold / waste) stored as waste_quantity
          const wasteQuantity = Number(body.waste_quantity ?? body.leftover_quantity ?? 0);
          const leftoverQuantity = 0;

          if (!itemId || isNaN(itemId)) {
            return json({ error: "An item must be selected from the catalog" }, 400);
          }

          if (isNaN(startingStock) || isNaN(wasteQuantity) || startingStock < 0 || wasteQuantity < 0) {
            return json({ error: "Invalid inventory counts provided" }, 400);
          }

          const totalAvailable = startingStock + restockQuantity;
          if (wasteQuantity > totalAvailable) {
            return json({ error: "Leftover (waste) count cannot exceed total available stock" }, 400);
          }

          const items = await query<any>("SELECT current_price, user_id FROM master_items WHERE id = ?", [itemId]);
          if (!items.length) return json({ error: "Master item not found" }, 404);
          if (!tenant.scopeAll && items[0].user_id !== tenant.ownerId) return json({ error: "Item bukan milik akun ini." }, 403);
          const snapshotPrice = Number(items[0].current_price);
          // The sale is owned by whoever owns the item (keeps admin god-view writes consistent).
          const rowOwner = items[0].user_id;

          const calc = calculatePeriodicDailySales({
            startingStock,
            restockQuantity,
            leftoverQuantity: 0,
            wasteQuantity,
            unitPrice: snapshotPrice,
          });

          await query(
            `INSERT INTO daily_sales_inventory 
             (user_id, entry_date, item_id, buyer_name, buyer_phone, starting_stock, restock_quantity, leftover_quantity, waste_quantity, snapshotted_unit_price) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [rowOwner, entryDate, itemId, buyerName, buyerPhone, startingStock, restockQuantity, 0, wasteQuantity, snapshotPrice]
          );

          return json({
            message: "Daily sales operation recorded",
            entry_date: entryDate,
            item_id: itemId,
            buyer_name: buyerName,
            sold_quantity: calc.soldQuantity,
            snapshotted_unit_price: snapshotPrice,
            total_revenue: calc.totalRevenue,
          }, 201);
        }

        // Dedicated Endpoint: Record or Update Waste AFTER daily operation is inputted
        if (pathname === "/api/daily-sales/waste" && method === "POST") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const body = await req.json();
          const id = Number(body.id);
          const wasteQuantity = Number(body.waste_quantity);

          if (isNaN(id) || isNaN(wasteQuantity) || wasteQuantity < 0) {
            return json({ error: "Valid record ID and non-negative waste quantity required" }, 400);
          }

          const existing = await query<any>(
            "SELECT starting_stock, restock_quantity, leftover_quantity, user_id FROM daily_sales_inventory WHERE id = ?",
            [id]
          );
          if (!existing.length) return json({ error: "Daily record not found" }, 404);
          if (!tenant.scopeAll && existing[0].user_id !== tenant.ownerId) return json({ error: "Forbidden" }, 403);

          const row = existing[0];
          const totalAvailable = Number(row.starting_stock) + Number(row.restock_quantity);
          const unaccounted = Number(row.leftover_quantity) + wasteQuantity;

          if (unaccounted > totalAvailable) {
            return json({
              error: `Invalid waste: leftover (${row.leftover_quantity}) + waste (${wasteQuantity}) exceeds total available (${totalAvailable})`
            }, 400);
          }

          await query("UPDATE daily_sales_inventory SET waste_quantity = ? WHERE id = ?", [wasteQuantity, id]);

          const updated = await query<any>(
            `SELECT d.*, m.name AS item_name 
             FROM daily_sales_inventory d 
             JOIN master_items m ON m.id = d.item_id 
             WHERE d.id = ?`,
            [id]
          );

          return json({
            message: "Waste updated successfully",
            record: updated[0]
          });
        }

        // Dedicated Endpoint: Update Daily Operation Entry (Starting, Restock, Leftover/Waste, Buyer)
        if (pathname === "/api/daily-sales" && method === "PUT") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const body = await req.json();
          const id = Number(body.id);
          const buyerName = body.buyer_name ? sanitizeInput(body.buyer_name.trim()) : null;
          const startingStock = Number(body.starting_stock || 0);
          const restockQuantity = Number(body.restock_quantity || 0);
          const wasteQuantity = Number(body.waste_quantity ?? body.leftover_quantity ?? 0);
          const leftoverQuantity = 0;

          if (isNaN(id) || isNaN(startingStock) || isNaN(wasteQuantity) || startingStock < 0 || wasteQuantity < 0) {
            return json({ error: "Missing required inventory counts" }, 400);
          }

          const ownRow = await query<any>("SELECT user_id FROM daily_sales_inventory WHERE id = ?", [id]);
          if (!ownRow.length) return json({ error: "Daily record not found" }, 404);
          if (!tenant.scopeAll && ownRow[0].user_id !== tenant.ownerId) return json({ error: "Forbidden" }, 403);

          const totalAvailable = startingStock + restockQuantity;
          if (wasteQuantity > totalAvailable) {
            return json({ error: "Leftover / waste count exceeds total available stock" }, 400);
          }

          await query(
            `UPDATE daily_sales_inventory 
             SET buyer_name = ?, starting_stock = ?, restock_quantity = ?, leftover_quantity = ?, waste_quantity = ? 
             WHERE id = ?`,
            [buyerName, startingStock, restockQuantity, 0, wasteQuantity, id]
          );

          const updated = await query<any>(
            `SELECT d.*, m.name AS item_name 
             FROM daily_sales_inventory d 
             JOIN master_items m ON m.id = d.item_id 
             WHERE d.id = ?`,
            [id]
          );
          return json({ message: "Daily operation updated", record: updated[0] });
        }

        // Dedicated Endpoint: Delete Daily Operation Entry
        if (pathname === "/api/daily-sales" && method === "DELETE") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const id = Number(url.searchParams.get("id"));
          if (isNaN(id)) return json({ error: "Valid daily sales ID required" }, 400);

          const ownRow = await query<any>("SELECT user_id FROM daily_sales_inventory WHERE id = ?", [id]);
          if (!ownRow.length) return json({ error: "Daily record not found" }, 404);
          if (!tenant.scopeAll && ownRow[0].user_id !== tenant.ownerId) return json({ error: "Forbidden" }, 403);

          await query("DELETE FROM daily_sales_inventory WHERE id = ?", [id]);
          return json({ message: "Daily sales record deleted" });
        }

        // 5. Dashboard & Analytics
        if (pathname === "/api/analytics/daily" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];
          const rows = await query<any>(
            `SELECT 
               entry_date,
               COALESCE(SUM(sold_quantity), 0) AS total_items_sold,
               COALESCE(SUM(waste_quantity), 0) AS total_waste,
               COALESCE(SUM(total_revenue), 0) AS daily_revenue
             FROM daily_sales_inventory
             WHERE entry_date = ?${tenant.scopeAll ? "" : " AND user_id = ?"}
             GROUP BY entry_date`,
            tenant.scopeAll ? [date] : [date, tenant.ownerId]
          );
          return json(rows[0] || { entry_date: date, total_items_sold: 0, total_waste: 0, daily_revenue: 0 });
        }

        if (pathname === "/api/analytics/rolling-30" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const scope = tenant.scopeAll;
          const oid = tenant.ownerId;
          // Monthly cut-off: window resets on the 1st of each month (from 1st → today).
          const revenueRows = await query<any>(
            `SELECT 
               COALESCE(SUM(total_revenue), 0) AS rolling_revenue,
               COALESCE(SUM(waste_quantity), 0) AS rolling_waste_qty
             FROM daily_sales_inventory
             WHERE entry_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND entry_date <= CURDATE()${scope ? "" : " AND user_id = ?"}`,
            scope ? [] : [oid]
          );

          const opexRows = await query<any>(
            `SELECT COALESCE(SUM(price_paid), 0) AS rolling_opex
             FROM opex_records
             WHERE expense_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND expense_date <= CURDATE()${scope ? "" : " AND user_id = ?"}`,
            scope ? [] : [oid]
          );

          const rollingRevenue = Number(revenueRows[0].rolling_revenue);
          const rollingWaste = Number(revenueRows[0].rolling_waste_qty);
          const rollingOpex = Number(opexRows[0].rolling_opex);
          const grossProfit = rollingRevenue - rollingOpex;

          // Analytics Suggestion based on 30-day net profit (frontend renders the
          // localized copy from health_status; suggestion kept for API/back-compat).
          let healthSuggestion = "";
          let healthStatus: "bad" | "unhealthy" | "healthy" = "healthy";

          if (grossProfit < 100000) {
            healthSuggestion = "Peforma Usaha Kamu memburuk 30 Hari Terakhir, Lakukan Evaluasi!";
            healthStatus = "bad";
          } else if (grossProfit >= 100000 && grossProfit <= 500000) {
            healthSuggestion = "Your Business is unhealthy, try to improve";
            healthStatus = "unhealthy";
          } else {
            healthSuggestion = "Your Business performance is strong and profitable! Keep up the momentum.";
            healthStatus = "healthy";
          }

          // Data Mining: SKU Performance Analysis (Best vs Worst, current month cut-off)
          const skuPerformance = await query<any>(
            `SELECT 
               m.id, 
               m.name, 
               m.group_name,
               m.current_price,
               COALESCE(SUM(d.sold_quantity), 0) AS total_sold,
               COALESCE(SUM(d.waste_quantity), 0) AS total_waste,
               COALESCE(SUM(d.total_revenue), 0) AS total_revenue
             FROM master_items m
             LEFT JOIN daily_sales_inventory d ON d.item_id = m.id AND d.entry_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND d.entry_date <= CURDATE()
             WHERE m.is_active = 1${scope ? "" : " AND m.user_id = ?"}
             GROUP BY m.id, m.name, m.group_name, m.current_price
             ORDER BY total_revenue DESC, total_sold DESC`,
            scope ? [] : [oid]
          );

          let bestSku: any = null;
          let worstSku: any = null;
          let dataMiningAdvice = "";

          if (skuPerformance.length > 0) {
            bestSku = skuPerformance[0];
            worstSku = skuPerformance[skuPerformance.length - 1];
            const rp = (n: any) => "Rp " + Number(n).toLocaleString("id-ID");

            if (bestSku.id === worstSku.id || Number(worstSku.total_sold) === Number(bestSku.total_sold)) {
              dataMiningAdvice = `Penjualan kamu merata bulan ini. "${bestSku.name}" jadi yang paling laku (${bestSku.total_sold} pcs). Terus jaga stok bahannya biar nggak kehabisan pas lagi ramai.`;
            } else if (Number(worstSku.total_sold) === 0) {
              dataMiningAdvice = `Kabar baik: "${bestSku.name}" paling laris (${bestSku.total_sold} pcs terjual). Tapi "${worstSku.name}" belum laku sama sekali bulan ini. Coba tawarkan bareng "${bestSku.name}" jadi satu paket, atau kurangi bikinnya dulu biar bahan nggak kebuang.`;
            } else {
              dataMiningAdvice = `Yang paling laku: "${bestSku.name}" (${bestSku.total_sold} pcs, hasil ${rp(bestSku.total_revenue)}). Yang paling sepi: "${worstSku.name}" (${worstSku.total_sold} pcs). Coba taruh "${worstSku.name}" di tempat yang lebih kelihatan, atau kasih promo beli 2 biar makin banyak yang beli.`;
            }
          }

          return json({
            period_days: 30,
            rolling_revenue: rollingRevenue,
            rolling_opex: rollingOpex,
            rolling_waste_qty: rollingWaste,
            gross_profit: grossProfit,
            health_status: healthStatus,
            health_suggestion: healthSuggestion,
            data_mining: {
              best_sku: bestSku,
              worst_sku: worstSku,
              advice: dataMiningAdvice,
              all_skus: skuPerformance,
            },
          });
        }

        // Current-month cut-off breakdowns (reset on the 1st). Used by dashboard KPI overlays + CSV export.
        // Revenue breakdown: per buyer + item, qty, unit price, line total.
        if (pathname === "/api/analytics/breakdown/revenue" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const rows = await query<any>(
            `SELECT 
               d.entry_date, d.buyer_name, m.name AS item_name, m.group_name,
               d.sold_quantity, d.snapshotted_unit_price,
               (d.sold_quantity * d.snapshotted_unit_price) AS line_total
             FROM daily_sales_inventory d
             JOIN master_items m ON m.id = d.item_id
             WHERE d.entry_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND d.entry_date <= CURDATE()
               AND d.sold_quantity > 0${tenant.scopeAll ? "" : " AND d.user_id = ?"}
             ORDER BY d.entry_date ASC, d.buyer_name ASC`,
            tenant.scopeAll ? [] : [tenant.ownerId]
          );
          return json(rows.map((r) => ({
            ...r,
            entry_date: r.entry_date instanceof Date ? r.entry_date.toISOString().split("T")[0] : String(r.entry_date).split("T")[0],
          })));
        }

        // OpEx breakdown: item, qty, unit cost, amount paid.
        if (pathname === "/api/analytics/breakdown/opex" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const rows = await query<any>(
            `SELECT 
               expense_date, item_name, quantity, measurement, price_paid,
               (CASE WHEN quantity > 0 THEN price_paid / quantity ELSE price_paid END) AS unit_cost,
               notes
             FROM opex_records
             WHERE expense_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND expense_date <= CURDATE()${tenant.scopeAll ? "" : " AND user_id = ?"}
             ORDER BY expense_date ASC`,
            tenant.scopeAll ? [] : [tenant.ownerId]
          );
          return json(rows.map((r) => ({
            ...r,
            expense_date: r.expense_date instanceof Date ? r.expense_date.toISOString().split("T")[0] : String(r.expense_date).split("T")[0],
          })));
        }

        // Waste (Barang Terbuang) breakdown: item, buyer, qty wasted.
        if (pathname === "/api/analytics/breakdown/waste" && method === "GET") {
          if (tenant.error) return json({ error: tenant.error }, 400);
          const rows = await query<any>(
            `SELECT 
               d.entry_date, d.buyer_name, m.name AS item_name, m.group_name,
               d.waste_quantity
             FROM daily_sales_inventory d
             JOIN master_items m ON m.id = d.item_id
             WHERE d.entry_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND d.entry_date <= CURDATE()
               AND d.waste_quantity > 0${tenant.scopeAll ? "" : " AND d.user_id = ?"}
             ORDER BY d.entry_date ASC, m.name ASC`,
            tenant.scopeAll ? [] : [tenant.ownerId]
          );
          return json(rows.map((r) => ({
            ...r,
            entry_date: r.entry_date instanceof Date ? r.entry_date.toISOString().split("T")[0] : String(r.entry_date).split("T")[0],
          })));
        }

        // 6. External Bot API Keys Management
        if (pathname === "/api/api-keys" && method === "GET") {
          const keys = await query<any>(
            `SELECT id, key_name, api_key, is_active, created_at 
             FROM api_keys 
             WHERE created_by = ? 
             ORDER BY id DESC`,
            [currentUser.id]
          );
          return json(keys);
        }

        if (pathname === "/api/api-keys" && method === "POST") {
          const body = await req.json();
          const keyName = sanitizeInput(body.key_name?.trim()) || "Bot API Key";
          const randomBytes = crypto.randomUUID().replace(/-/g, "");
          const apiKey = `umkm_live_${randomBytes}`;

          await query(
            "INSERT INTO api_keys (key_name, api_key, created_by) VALUES (?, ?, ?)",
            [keyName, apiKey, currentUser.id]
          );

          return json({
            message: "API Key created successfully",
            key_name: keyName,
            api_key: apiKey,
          }, 201);
        }

        if (pathname === "/api/api-keys" && method === "DELETE") {
          const id = Number(url.searchParams.get("id"));
          if (isNaN(id)) return json({ error: "Valid key ID required" }, 400);

          await query("DELETE FROM api_keys WHERE id = ? AND created_by = ?", [id, currentUser.id]);
          return json({ message: "API key revoked successfully" });
        }

        // 6b. User Management (ADMIN ONLY) — create/list/delete users, roles: admin | user
        if (pathname === "/api/users" && method === "GET") {
          if (currentUser.role !== "admin") return json({ error: "Admin access required" }, 403);
          const users = await query<any>(
            `SELECT id, username, role, wa_uid, wa_jid, wa_bound_at, display_name, created_at
             FROM users ORDER BY role ASC, id ASC`
          );
          return json(users);
        }

        if (pathname === "/api/users" && method === "POST") {
          if (currentUser.role !== "admin") return json({ error: "Admin access required" }, 403);
          const body = await req.json();
          const username = sanitizeInput(String(body.username || "").trim()).slice(0, 50);
          const password = body.password;
          const role = body.role === "admin" ? "admin" : "user";

          if (!username) return json({ error: "Nama wajib diisi." }, 400);
          if (!/^[A-Za-z0-9_.\- ]{3,50}$/.test(username)) {
            return json({ error: "Nama hanya boleh huruf, angka, spasi, titik, garis (3-50 karakter)." }, 400);
          }
          const existing = await query<any>("SELECT id FROM users WHERE username = ?", [username]);
          if (existing.length) return json({ error: "Nama sudah dipakai, gunakan nama lain." }, 409);

          let passwordHash: string;
          try {
            passwordHash = await hashPassword(password);
          } catch (e: any) {
            return json({ error: e.message || "Password tidak memenuhi syarat." }, 400);
          }

          // Generate a unique WA setup UID (only meaningful for role=user, but issued for both).
          let waUid = "";
          for (let attempt = 0; attempt < 6; attempt++) {
            const candidate = "UMK-" + nodeCrypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. UMK-9F3A2B1C (12 chars)
            const clash = await query<any>("SELECT id FROM users WHERE wa_uid = ?", [candidate]);
            if (!clash.length) { waUid = candidate; break; }
          }
          if (!waUid) return json({ error: "Gagal membuat UID unik, coba lagi." }, 500);

          const result: any = await query(
            "INSERT INTO users (username, password_hash, role, wa_uid, display_name) VALUES (?, ?, ?, ?, ?)",
            [username, passwordHash, role, waUid, username]
          );
          return json({
            message: "User berhasil dibuat.",
            user: { id: (result as any).insertId, username, role, wa_uid: waUid },
          }, 201);
        }

        if (pathname === "/api/users" && method === "DELETE") {
          if (currentUser.role !== "admin") return json({ error: "Admin access required" }, 403);
          const id = Number(url.searchParams.get("id"));
          if (isNaN(id)) return json({ error: "Valid user ID required" }, 400);
          if (id === currentUser.id) return json({ error: "Tidak bisa menghapus akun sendiri." }, 400);
          // Guard: never delete the last remaining admin.
          const target = await query<any>("SELECT role FROM users WHERE id = ?", [id]);
          if (!target.length) return json({ error: "User tidak ditemukan." }, 404);
          if (target[0].role === "admin") {
            const admins = await query<any>("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
            if (Number(admins[0].c) <= 1) return json({ error: "Tidak bisa menghapus admin terakhir." }, 400);
          }
          await query("DELETE FROM users WHERE id = ?", [id]);
          return json({ message: "User dihapus." });
        }

        if (pathname === "/api/users/regenerate-uid" && method === "POST") {
          if (currentUser.role !== "admin") return json({ error: "Admin access required" }, 403);
          const body = await req.json();
          const id = Number(body.id);
          if (isNaN(id)) return json({ error: "Valid user ID required" }, 400);
          let waUid = "";
          for (let attempt = 0; attempt < 6; attempt++) {
            const candidate = "UMK-" + nodeCrypto.randomBytes(4).toString("hex").toUpperCase();
            const clash = await query<any>("SELECT id FROM users WHERE wa_uid = ?", [candidate]);
            if (!clash.length) { waUid = candidate; break; }
          }
          if (!waUid) return json({ error: "Gagal membuat UID unik." }, 500);
          await query("UPDATE users SET wa_uid = ?, wa_jid = NULL, wa_bound_at = NULL WHERE id = ?", [waUid, id]);
          return json({ message: "UID diperbarui, nomor lama dilepas.", wa_uid: waUid });
        }

        // Edit an existing user (admin): rename, change role, optional password reset.
        if (pathname === "/api/users" && method === "PUT") {
          if (currentUser.role !== "admin") return json({ error: "Admin access required" }, 403);
          const body = await req.json();
          const id = Number(body.id);
          if (isNaN(id)) return json({ error: "Valid user ID required" }, 400);
          const target = await query<any>("SELECT id, role FROM users WHERE id = ?", [id]);
          if (!target.length) return json({ error: "User tidak ditemukan." }, 404);

          const username = sanitizeInput(String(body.username || "").trim()).slice(0, 50);
          if (!username) return json({ error: "Nama wajib diisi." }, 400);
          if (!/^[A-Za-z0-9_.\- ]{3,50}$/.test(username)) {
            return json({ error: "Nama hanya boleh huruf, angka, spasi, titik, garis (3-50 karakter)." }, 400);
          }
          const dup = await query<any>("SELECT id FROM users WHERE username = ? AND id <> ?", [username, id]);
          if (dup.length) return json({ error: "Nama sudah dipakai, gunakan nama lain." }, 409);

          const role = body.role === "admin" ? "admin" : "user";
          // Guard: don't demote the last admin.
          if (target[0].role === "admin" && role !== "admin") {
            const admins = await query<any>("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
            if (Number(admins[0].c) <= 1) return json({ error: "Tidak bisa menurunkan admin terakhir." }, 400);
          }

          // Optional password change.
          if (body.password) {
            let newHash: string;
            try {
              newHash = await hashPassword(body.password);
            } catch (e: any) {
              return json({ error: e.message || "Password tidak memenuhi syarat." }, 400);
            }
            await query("UPDATE users SET username = ?, role = ?, display_name = ?, password_hash = ? WHERE id = ?", [username, role, username, newHash, id]);
          } else {
            await query("UPDATE users SET username = ?, role = ?, display_name = ? WHERE id = ?", [username, role, username, id]);
          }
          return json({ message: "User diperbarui." });
        }

        // 6c. WhatsApp identity binding — called by the WA bot (X-API-Key) on `/setup <UID>`.
        // Enforces: one UID → at most one number; a number already bound cannot rebind to another UID.
        if (pathname === "/api/wa/setup" && method === "POST") {
          const body = await req.json();
          const uid = sanitizeInput(String(body.uid || "").trim()).toUpperCase().slice(0, 16);
          const rawJid = String(body.jid || "").trim();
          // Store ONLY as <digits>@s.whatsapp.net — never @lid or a device-suffixed jid.
          const digits = rawJid.split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
          const jid = digits ? `${digits}@s.whatsapp.net` : "";
          if (!uid || !jid) return json({ error: "UID dan nomor WhatsApp wajib ada." }, 400);

          const target = await query<any>("SELECT id, username, wa_jid FROM users WHERE wa_uid = ?", [uid]);
          if (!target.length) return json({ error: "UID tidak ditemukan." }, 404);
          const user = target[0];

          // Is this number already bound to a *different* UID?
          const jidOwner = await query<any>("SELECT id, wa_uid FROM users WHERE wa_jid = ?", [jid]);
          if (jidOwner.length && jidOwner[0].id !== user.id) {
            return json({ error: "Nomor ini sudah terhubung ke UID lain." }, 409);
          }
          // Is this UID already bound to a (different) number?
          if (user.wa_jid && user.wa_jid !== jid) {
            return json({ error: "UID ini sudah terhubung ke nomor lain. Minta admin reset UID." }, 409);
          }
          if (user.wa_jid === jid) {
            return json({ message: "Nomor sudah terhubung sebelumnya.", username: user.username, jid, already: true });
          }

          await query("UPDATE users SET wa_jid = ?, wa_bound_at = NOW() WHERE id = ?", [jid, user.id]);
          return json({ message: "Nomor berhasil dihubungkan.", username: user.username, jid });
        }

        // Whitelist feed for the WA bot: every bound number (X-API-Key auth).
        if (pathname === "/api/wa/whitelist" && method === "GET") {
          const rows = await query<any>("SELECT wa_jid, wa_uid, username FROM users WHERE wa_jid IS NOT NULL");
          return json(rows);
        }

        // 7. Business Information & Settings (per-user)
        if (pathname === "/api/business-info" && method === "GET") {
          const rows = await query<any>("SELECT * FROM business_info WHERE user_id = ?", [currentUser.id]);
          return json(rows[0] || {
            id: null,
            user_id: currentUser.id,
            business_name: "UMKM Enterprise",
            business_address: "",
            business_logo: "/logo.png",
            business_email: "",
            business_telephone: "",
          });
        }

        if (pathname === "/api/business-info" && method === "PUT") {
          const body = await req.json();
          const businessName = sanitizeInput(body.business_name?.trim());
          const businessLogo = sanitizeInput(body.business_logo?.trim() || "/logo.png");
          const businessEmail = sanitizeInput(body.business_email?.trim() || "");
          const businessTelephone = sanitizeInput(body.business_telephone?.trim() || "");
          const businessProvince = sanitizeInput(body.business_province?.trim() || "");
          const businessRegency = sanitizeInput(body.business_regency?.trim() || "");
          const businessDistrict = sanitizeInput(body.business_district?.trim() || "");
          const businessVillage = sanitizeInput(body.business_village?.trim() || "");
          const businessAddressDetail = sanitizeInput(body.business_address_detail?.trim() || "");
          // Compose full address string for backward compatibility / display
          const composed = [businessAddressDetail, businessVillage, businessDistrict, businessRegency, businessProvince]
            .filter(Boolean).join(", ");
          const businessAddress = composed || sanitizeInput(body.business_address?.trim() || "");

          if (!businessName) {
            return json({ error: "Business name is required" }, 400);
          }
          // Validate Indonesian phone number (+62 / 08 mobile) when provided
          if (businessTelephone) {
            const digits = businessTelephone.replace(/[^0-9]/g, "").replace(/^62/, "0");
            // Indonesian mobile prefixes (Telkomsel, Indosat, XL, Tri, Smartfren, etc.)
            if (!/^08[1-9][0-9]{7,10}$/.test(digits)) {
              return json({ error: "Invalid Indonesian phone number. Use format +62 812-3456-7890." }, 400);
            }
          }

          await query(
            `INSERT INTO business_info (user_id, business_name, business_address, business_logo, business_email, business_telephone, business_province, business_regency, business_district, business_village, business_address_detail)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
               business_name = VALUES(business_name),
               business_address = VALUES(business_address),
               business_logo = VALUES(business_logo),
               business_email = VALUES(business_email),
               business_telephone = VALUES(business_telephone),
               business_province = VALUES(business_province),
               business_regency = VALUES(business_regency),
               business_district = VALUES(business_district),
               business_village = VALUES(business_village),
               business_address_detail = VALUES(business_address_detail)`,
            [currentUser.id, businessName, businessAddress, businessLogo, businessEmail, businessTelephone,
             businessProvince, businessRegency, businessDistrict, businessVillage, businessAddressDetail]
          );

          const updated = await query<any>("SELECT * FROM business_info WHERE user_id = ?", [currentUser.id]);
          return json({ message: "Business information updated successfully", business_info: updated[0] });
        }

        // 7b. Indonesia address dropdowns (proxy to emsifa wilayah API) + place search (photon)
        if (pathname === "/api/wilayah" && method === "GET") {
          const level = url.searchParams.get("level") || "provinces"; // provinces|regencies|districts|villages
          const parentId = url.searchParams.get("id") || "";
          const allowed: Record<string, string> = {
            provinces: "provinces",
            regencies: parentId ? `regencies/${parentId}` : "",
            districts: parentId ? `districts/${parentId}` : "",
            villages: parentId ? `villages/${parentId}` : "",
          };
          const seg = allowed[level];
          if (seg === undefined || (level !== "provinces" && !/^\d+$/.test(parentId))) {
            return json({ error: "Invalid wilayah query" }, 400);
          }
          try {
            const upstream = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/${seg}.json`);
            const data = await upstream.json();
            return json(data);
          } catch {
            return json({ error: "Failed to fetch wilayah data" }, 502);
          }
        }

        if (pathname === "/api/address-search" && method === "GET") {
          const q = (url.searchParams.get("q") || "").trim();
          if (q.length < 3) return json([]);
          try {
            const upstream = await fetch(
              `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&bbox=95,-11,141,6`
            );
            const data: any = await upstream.json();
            const results = (data.features || []).map((f: any) => {
              const p = f.properties || {};
              const label = [p.name, p.street, p.district, p.city, p.state]
                .filter(Boolean).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(", ");
              return { label, name: p.name || "", district: p.district || "", city: p.city || "", state: p.state || "", postcode: p.postcode || "" };
            }).filter((r: any) => r.label);
            return json(results);
          } catch {
            return json([]);
          }
        }

        // 8. WhatsApp Bot Integration Proxy Endpoints
        if (pathname === "/api/wa-bot/status" && method === "GET") {
          try {
            const botRes = await fetch("http://127.0.0.1:8031/status");
            const data = await botRes.json();
            return json(data);
          } catch {
            return json({ status: "disconnected", qr: null, user: null, last_error: "WhatsApp Bot process not reachable" });
          }
        }

        if (pathname === "/api/wa-bot/connect" && method === "POST") {
          try {
            const body = await req.json().catch(() => ({}));
            const botRes = await fetch("http://127.0.0.1:8031/connect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const data = await botRes.json();
            return json(data);
          } catch {
            return json({ error: "Failed to communicate with WhatsApp Bot process" }, 502);
          }
        }

        if (pathname === "/api/wa-bot/disconnect" && method === "POST") {
          try {
            const botRes = await fetch("http://127.0.0.1:8031/disconnect", { method: "POST" });
            const data = await botRes.json();
            return json(data);
          } catch {
            return json({ error: "Failed to communicate with WhatsApp Bot process" }, 502);
          }
        }

        if (pathname === "/api/wa-bot/whitelist" && method === "GET") {
          try {
            const botRes = await fetch("http://127.0.0.1:8031/whitelist");
            const data = await botRes.json();
            return json(data);
          } catch {
            return json([]);
          }
        }

        if (pathname === "/api/wa-bot/whitelist" && method === "POST") {
          try {
            const body = await req.json();
            const botRes = await fetch("http://127.0.0.1:8031/whitelist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const data = await botRes.json();
            return json(data);
          } catch {
            return json({ error: "Failed to update whitelist on bot" }, 502);
          }
        }

        if (pathname === "/api/wa-bot/reminder-settings" && method === "GET") {
          try {
            const botRes = await fetch("http://127.0.0.1:8031/reminder-settings");
            const data = await botRes.json();
            return json(data);
          } catch {
            return json({ enabled: true, evening_hour: 21, evening_minute: 0, morning_hour: 2, morning_minute: 0 });
          }
        }

        if (pathname === "/api/wa-bot/reminder-settings" && method === "POST") {
          try {
            const body = await req.json();
            const botRes = await fetch("http://127.0.0.1:8031/reminder-settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const data = await botRes.json();
            return json(data);
          } catch {
            return json({ error: "Failed to update reminder settings on bot" }, 502);
          }
        }

        if (pathname === "/api/wa-bot/reminder-trigger" && method === "POST") {
          try {
            const body = await req.json().catch(() => ({}));
            const botRes = await fetch("http://127.0.0.1:8031/reminder-trigger", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            });
            const data = await botRes.json();
            return json(data);
          } catch {
            return json({ error: "Failed to trigger reminder on bot" }, 502);
          }
        }

        // 9. Logo Image Upload Handler (Saved to UMKM/public/images/ and served)
        if (pathname === "/api/upload/logo" && method === "POST") {
          const formData = await req.formData();
          const file = formData.get("logo") || formData.get("file");
          if (!file || !(file instanceof File)) {
            return json({ error: "No image file provided" }, 400);
          }

          const fileUrl = await saveUploadedLogo(file);

          // Automatically update this user's business_info with the new logo URL
          await query(
            `UPDATE business_info SET business_logo = ? WHERE user_id = ?`,
            [fileUrl, currentUser.id]
          );

          return json({
            message: "Logo uploaded successfully",
            url: fileUrl,
          });
        }

        return json({ error: "Endpoint not found" }, 404);
      } catch (err: any) {
        return json({ error: err.message || "Internal server error" }, 500);
      }
    }

    // Static Dedicated /docs/api Route
    if (pathname === "/docs/api" || pathname === "/docs/api/") {
      const docsFile = Bun.file(path.join(DIST_DIR, "docs", "api", "index.html"));
      if (await docsFile.exists()) {
        return new Response(docsFile, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
    }

    // Static /images/* Handler (Public uploads directory)
    if (pathname.startsWith("/images/")) {
      const imgName = pathname.replace(/^\/images\//, "");
      const pubImg = Bun.file(path.join(__dirname, "public", "images", imgName));
      if (await pubImg.exists()) {
        return new Response(pubImg);
      }
      const distImg = Bun.file(path.join(DIST_DIR, "images", imgName));
      if (await distImg.exists()) {
        return new Response(distImg);
      }
    }

    // Static SPA Asset Serving
    // Decode percent-encoding so paths with spaces (e.g. "/Sound/Data%20Mining.mp3") resolve to the real file.
    let relPath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
    try { relPath = decodeURIComponent(relPath); } catch {}
    // Guard against path traversal after decoding.
    if (relPath.includes("..")) return new Response("Forbidden", { status: 403 });
    const filePath = path.join(DIST_DIR, relPath);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      // Hashed build assets are immutable; HTML must always revalidate so a new
      // deploy is picked up immediately (prevents stale index.html -> old JS bundle).
      const isHashedAsset = relPath.startsWith("assets/");
      const headers: Record<string, string> = isHashedAsset
        ? { "Cache-Control": "public, max-age=31536000, immutable" }
        : { "Cache-Control": "no-cache, must-revalidate" };
      return new Response(file, { headers });
    }

    return new Response(Bun.file(path.join(DIST_DIR, "index.html")), {
      headers: { "Cache-Control": "no-cache, must-revalidate" },
    });
  },
});

console.log(`Backend server running at http://localhost:${server.port}`);
