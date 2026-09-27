import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  type WASocket,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

// Configuration
const UMKM_API_BASE = process.env.UMKM_API_BASE || "http://127.0.0.1:8030";
const UMKM_API_KEY = process.env.UMKM_API_KEY || "";
const AUTH_DIR = path.resolve(__dirname, "/home/nanz/Document/UMKM-WA-Bot/auth_info_baileys");
const BOT_PORT = Number(process.env.BOT_PORT) || 8031;
const WHITELIST_FILE = path.resolve(__dirname, "/home/nanz/Document/UMKM-WA-Bot/whitelist.json");

// Build auth headers for UMKM API calls. When a WhatsApp sender jid is provided,
// resolve it to a phone JID (<digits>@s.whatsapp.net) and pass it as X-WA-JID so the
// backend scopes data to the account bound to that number (multi-tenant).
async function waHeaders(jid?: string): Promise<Record<string, string>> {
  const h: Record<string, string> = { Authorization: `Bearer ${UMKM_API_KEY}` };
  if (jid) {
    try {
      const phone = await jidToPhone(jid);
      if (phone) h["X-WA-JID"] = `${phone}@s.whatsapp.net`;
    } catch {}
  }
  return h;
}

// Pending catalog update confirmations: Map<jid, PendingUpdate[]>
interface PendingCatalogUpdate {
  name: string;
  newGroup: string;
  newPrice: number;
  existingItem: { id: number; name: string; group_name: string | null; current_price: number };
  changes: string[];
}
const pendingCatalogUpdates = new Map<string, PendingCatalogUpdate[]>();

// Pending customer orders awaiting name entry: Map<jid, OrderItem[]>
interface OrderItem {
  item: { id: number; name: string; current_price: number };
  qty: number;
}
const pendingOrders = new Map<string, OrderItem[]>();

// --- Screenshot-to-OpEx (belanja) scan flow ---
// Recently received images per sender, kept briefly so a following /updatebelanja
// reply can pick them up. Baileys delivers each image as its own message, so we
// buffer them by jid with a sliding time window.
interface BufferedImage { message: any; ts: number; }
const recentImages = new Map<string, BufferedImage[]>();
const IMAGE_BUFFER_MS = 5 * 60 * 1000; // images older than 5 min are ignored
const MAX_IMAGES_PER_SCAN = 8;

// Scanned belanja items awaiting a Yes/No save confirmation.
interface PendingBelanja {
  items: Array<{ item_name: string; price_paid: number; quantity: number; measurement: string }>;
  expense_date: string;
}
const pendingBelanjaSave = new Map<string, PendingBelanja>();

function bufferIncomingImage(jid: string, message: any) {
  const now = Date.now();
  const list = (recentImages.get(jid) || []).filter((b) => now - b.ts < IMAGE_BUFFER_MS);
  list.push({ message, ts: now });
  // keep only the newest MAX_IMAGES_PER_SCAN
  recentImages.set(jid, list.slice(-MAX_IMAGES_PER_SCAN));
}
function takeBufferedImages(jid: string): any[] {
  const now = Date.now();
  const list = (recentImages.get(jid) || []).filter((b) => now - b.ts < IMAGE_BUFFER_MS);
  recentImages.delete(jid);
  return list.map((b) => b.message);
}

// Recently received plain-text messages per sender, so a following /updatecatalog
// (sent alone) can pick up a product list that was sent moments earlier.
const recentTexts = new Map<string, { text: string; ts: number }[]>();
const TEXT_BUFFER_MS = 5 * 60 * 1000;
function bufferIncomingText(jid: string, text: string) {
  const now = Date.now();
  const list = (recentTexts.get(jid) || []).filter((b) => now - b.ts < TEXT_BUFFER_MS);
  list.push({ text, ts: now });
  recentTexts.set(jid, list.slice(-10));
}
function takeBufferedTexts(jid: string): string[] {
  const now = Date.now();
  const list = (recentTexts.get(jid) || []).filter((b) => now - b.ts < TEXT_BUFFER_MS);
  recentTexts.delete(jid);
  return list.map((b) => b.text);
}

// Whitelist helper functions (Baileys format: '628xxx@s.whatsapp.net')
function getWhitelist(): string[] {
  try {
    if (fs.existsSync(WHITELIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(WHITELIST_FILE, "utf-8"));
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

function saveWhitelist(list: string[]) {
  try {
    fs.writeFileSync(WHITELIST_FILE, JSON.stringify(list, null, 2));
  } catch {}
}

async function isWhitelisted(jid: string): Promise<boolean> {
  const list = getWhitelist();
  if (list.length === 0) return true; // If no numbers configured, allow all

  const candidates = new Set<string>([jid.toLowerCase().trim()]);
  const cleanId = jid.split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
  if (cleanId) {
    candidates.add(cleanId);
    if (cleanId.startsWith("62")) candidates.add("0" + cleanId.slice(2));
    if (cleanId.startsWith("0")) candidates.add("62" + cleanId.slice(1));
  }

  // Resolve LID to PN if it's an LID JID
  if (jid.endsWith("@lid") || cleanId.length > 13) {
    try {
      if (sock?.signalRepository?.lidMapping) {
        const fullLid = jid.includes("@") ? jid : `${cleanId}@lid`;
        const pnJid = await sock.signalRepository.lidMapping.getPNForLID(fullLid);
        if (pnJid) {
          const cleanPn = pnJid.split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
          if (cleanPn) {
            candidates.add(cleanPn);
            if (cleanPn.startsWith("62")) candidates.add("0" + cleanPn.slice(2));
            if (cleanPn.startsWith("0")) candidates.add("62" + cleanPn.slice(1));
          }
        }
      }
    } catch {}

    try {
      const revFile = path.resolve(AUTH_DIR, `lid-mapping-${cleanId}_reverse.json`);
      if (fs.existsSync(revFile)) {
        const rawPn = JSON.parse(fs.readFileSync(revFile, "utf-8"));
        const cleanPn = String(rawPn).split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
        if (cleanPn) {
          candidates.add(cleanPn);
          if (cleanPn.startsWith("62")) candidates.add("0" + cleanPn.slice(2));
          if (cleanPn.startsWith("0")) candidates.add("62" + cleanPn.slice(1));
        }
      }
    } catch {}
  }

  // Check each whitelisted item against candidates and forward mappings
  for (const item of list) {
    const itemTrim = item.trim().toLowerCase();
    if (candidates.has(itemTrim)) return true;

    const cleanItem = itemTrim.split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
    if (!cleanItem) continue;

    if (candidates.has(cleanItem)) return true;
    if (cleanItem.startsWith("62") && candidates.has("0" + cleanItem.slice(2))) return true;
    if (cleanItem.startsWith("0") && candidates.has("62" + cleanItem.slice(1))) return true;

    try {
      const fwdFile = path.resolve(AUTH_DIR, `lid-mapping-${cleanItem}.json`);
      if (fs.existsSync(fwdFile)) {
        const rawLid = JSON.parse(fs.readFileSync(fwdFile, "utf-8"));
        const cleanLid = String(rawLid).replace(/[^0-9]/g, "");
        if (cleanLid && candidates.has(cleanLid)) return true;
      }
    } catch {}
  }

  return false;
}

// Reminder Configuration & Scheduler
const REMINDER_FILE = path.resolve(__dirname, "/home/nanz/Document/UMKM-WA-Bot/reminder_config.json");

export interface ReminderConfig {
  enabled: boolean;
  evening_hour: number;
  evening_minute: number;
  morning_hour: number;
  morning_minute: number;
}

export function getReminderConfig(): ReminderConfig {
  const defaults: ReminderConfig = {
    enabled: true,
    evening_hour: 21,
    evening_minute: 0,
    morning_hour: 2,
    morning_minute: 0,
  };
  try {
    if (fs.existsSync(REMINDER_FILE)) {
      const data = JSON.parse(fs.readFileSync(REMINDER_FILE, "utf-8"));
      return { ...defaults, ...data };
    }
  } catch {}
  return defaults;
}

export function saveReminderConfig(cfg: Partial<ReminderConfig>): ReminderConfig {
  const current = getReminderConfig();
  const updated: ReminderConfig = {
    enabled: typeof cfg.enabled === "boolean" ? cfg.enabled : current.enabled,
    evening_hour: typeof cfg.evening_hour === "number" ? Math.min(23, Math.max(0, cfg.evening_hour)) : current.evening_hour,
    evening_minute: typeof cfg.evening_minute === "number" ? Math.min(59, Math.max(0, cfg.evening_minute)) : current.evening_minute,
    morning_hour: typeof cfg.morning_hour === "number" ? Math.min(23, Math.max(0, cfg.morning_hour)) : current.morning_hour,
    morning_minute: typeof cfg.morning_minute === "number" ? Math.min(59, Math.max(0, cfg.morning_minute)) : current.morning_minute,
  };
  try {
    fs.writeFileSync(REMINDER_FILE, JSON.stringify(updated, null, 2));
  } catch {}
  return updated;
}

export async function buildOrderReminderMessage(targetDate: string, type: "evening" | "morning", jid?: string): Promise<{ text: string; count: number; itemsCount: number } | null> {
  try {
    const res = await fetch(`${UMKM_API_BASE}/api/daily-sales?date=${targetDate}`, {
      headers: await waHeaders(jid),
    });
    if (!res.ok) return null;
    const entries: Array<any> = await res.json();
    if (!entries || entries.length === 0) return null;

    const buyersMap = new Map<string, Array<{ itemName: string; qty: number }>>();
    const totalsMap = new Map<string, number>();
    let totalPcs = 0;

    for (const e of entries) {
      const buyer = e.buyer_name || "Tanpa Nama";
      const item = e.item_name || "Produk";
      const qty = Number(e.starting_stock) || Number(e.sold_quantity) || 0;
      if (qty <= 0) continue;

      if (!buyersMap.has(buyer)) {
        buyersMap.set(buyer, []);
      }
      buyersMap.get(buyer)!.push({ itemName: item, qty });
      totalsMap.set(item, (totalsMap.get(item) || 0) + qty);
      totalPcs += qty;
    }

    if (totalPcs === 0) return null;

    const isEvening = type === "evening";
    const headerTitle = isEvening
      ? "🔔 *REMINDER PERSIAPAN PESANAN PENJUALAN (H-1)*"
      : "🔔 *REMINDER PENYIAPAN & PACKING PESANAN (HARI H)*";
    const timingNote = isEvening
      ? "Malam Persiapan Bahan & Stok"
      : "Subuh Pengolahan & Pengemasan";

    let text = `${headerTitle}\n`;
    text += `📅 *Target Tanggal:* ${targetDate}\n`;
    text += `🕒 *Sesi Pengingat:* ${timingNote}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `📋 *Rincian Pesanan per Pembeli:*\n`;
    for (const [buyer, items] of buyersMap.entries()) {
      text += `• *${buyer}:*\n`;
      for (const it of items) {
        text += `  - ${it.itemName}: *${it.qty} pcs*\n`;
      }
    }
    text += `\n📦 *Total Kebutuhan Bahan / Barang:*\n`;
    for (const [itemName, totalItemQty] of totalsMap.entries()) {
      text += `• ${itemName}: *${totalItemQty} pcs*\n`;
    }

    text += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👥 *Total:* ${buyersMap.size} Pembeli | *${totalPcs} pcs*\n`;
    if (isEvening) {
      text += `⚠️ *Catatan:* Harap belanja & siapkan bahan untuk pesanan besok!`;
    } else {
      text += `⚠️ *Catatan:* Selamat pagi! Pastikan pesanan di atas selesai dikemas dan siap diantar.`;
    }

    return { text, count: buyersMap.size, itemsCount: totalPcs };
  } catch (err: any) {
    console.error("Error building reminder message:", err);
    return null;
  }
}

const sentReminderKeys = new Set<string>();

export async function sendDailyOrderReminder(targetDate: string, type: "evening" | "morning"): Promise<{ success: boolean; message: string; recipients: string[]; preview?: string }> {
  const list = getWhitelist();
  if (list.length === 0) {
    return {
      success: false,
      message: "Whitelist kosong, tidak ada nomor WhatsApp tujuan reminder.",
      recipients: [],
    };
  }

  const recipientsSent: string[] = [];
  let lastPreview: string | undefined;
  // Each whitelisted number belongs to a different tenant — build the reminder
  // scoped to that number's own account so users only see their own orders.
  for (const rawItem of list) {
    const item = rawItem.trim();
    if (!item) continue;
    let destJid = item;
    if (!destJid.includes("@")) destJid = `${destJid}@s.whatsapp.net`;
    try {
      const reminder = await buildOrderReminderMessage(targetDate, type, destJid);
      if (!reminder) continue; // no orders for this tenant on that date
      lastPreview = reminder.text;
      if (sock) {
        await sock.sendMessage(destJid, { text: reminder.text });
        recipientsSent.push(destJid);
      }
    } catch (e: any) {
      console.error(`Failed sending reminder to ${item}:`, e.message);
    }
  }

  if (recipientsSent.length === 0) {
    return {
      success: false,
      message: `Tidak ada data pesanan penjualan pada tanggal ${targetDate} untuk kontak manapun.`,
      recipients: [],
      preview: lastPreview,
    };
  }

  return {
    success: true,
    message: `Reminder berhasil dikirim ke ${recipientsSent.length} kontak WhatsApp.`,
    recipients: recipientsSent,
    preview: lastPreview,
  };
}

export function startReminderScheduler() {
  setInterval(async () => {
    try {
      const cfg = getReminderConfig();
      if (!cfg.enabled) return;

      const now = new Date();
      const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
      const hour = parseInt(parts.hour, 10);
      const minute = parseInt(parts.minute, 10);
      const todayDate = `${parts.year}-${parts.month}-${parts.day}`;

      // Calculate tomorrow's date in WIB
      const todayMs = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+07:00`).getTime();
      const tomorrowObj = new Date(todayMs + 24 * 60 * 60 * 1000);
      const tFmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const tParts = Object.fromEntries(tFmt.formatToParts(tomorrowObj).map((p) => [p.type, p.value]));
      const tomorrowDate = `${tParts.year}-${tParts.month}-${tParts.day}`;

      // 1. Evening reminder (target: tomorrow's orders)
      if (hour === cfg.evening_hour && minute === cfg.evening_minute) {
        const key = `evening-${todayDate}-${tomorrowDate}`;
        if (!sentReminderKeys.has(key)) {
          sentReminderKeys.add(key);
          console.log(`[Reminder Scheduler] Triggering evening reminder for tomorrow: ${tomorrowDate}`);
          await sendDailyOrderReminder(tomorrowDate, "evening");
        }
      }

      // 2. Morning reminder (target: today's orders)
      if (hour === cfg.morning_hour && minute === cfg.morning_minute) {
        const key = `morning-${todayDate}`;
        if (!sentReminderKeys.has(key)) {
          sentReminderKeys.add(key);
          console.log(`[Reminder Scheduler] Triggering morning reminder for today: ${todayDate}`);
          await sendDailyOrderReminder(todayDate, "morning");
        }
      }

      if (sentReminderKeys.size > 200) {
        sentReminderKeys.clear();
      }
    } catch (e: any) {
      console.error("[Reminder Scheduler Error]:", e);
    }
  }, 30000);
}

// Global Bot State
let sock: WASocket | null = null;
let currentQRDataUrl: string | null = null;
let connectionStatus: "disconnected" | "connecting" | "connected" = "disconnected";
let connectedJid: string | null = null;
let lastError: string | null = null;

// Helper: Format Currency (Rp 240,000 — no trailing decimals)
function formatCurrency(val: any): string {
  const num = Number(val) || 0;
  return "Rp " + num.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

// Helper: Normalize Date String [dd-mm-yy] -> YYYY-MM-DD
function parseCustomDate(dateStr: string): string {
  const clean = dateStr.trim();
  const parts = clean.split(/[-/.]/);
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    let year = parts[2];
    if (year.length === 2) {
      year = "20" + year;
    }
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split("T")[0];
}

// Helper: Parse quantity and unit seamlessly (e.g. "4 KG", "12kg", "1sachet", "2 Box")
function parseQuantityAndUnit(rawStr: string): { quantity: number; measurement: "Box" | "Pcs" | "Kilo" | "Litre" | "Sachet" } {
  const clean = rawStr.trim();
  const match = clean.match(/^([0-9.]+)\s*([a-zA-Z]*)$/);

  let qty = 1;
  let unit = "Pcs";

  if (match) {
    qty = Number(match[1]) || 1;
    unit = match[2] || "Pcs";
  } else {
    const parts = clean.split(/\s+/);
    qty = Number(parts[0].replace(/[^0-9.]/g, "")) || 1;
    unit = parts.slice(1).join(" ") || "Pcs";
  }

  const u = unit.toLowerCase().trim();
  let measurement: "Box" | "Pcs" | "Kilo" | "Litre" | "Sachet" = "Pcs";

  if (u.startsWith("kg") || u.startsWith("kilo") || u === "k") {
    measurement = "Kilo";
  } else if (u.startsWith("lit") || u.startsWith("ltr") || u === "l") {
    measurement = "Litre";
  } else if (u.startsWith("box") || u.startsWith("bx") || u.startsWith("dus") || u.startsWith("kotak")) {
    measurement = "Box";
  } else if (u.startsWith("sach") || u.startsWith("sch") || u.startsWith("sct") || u.startsWith("bungkus") || u.startsWith("bgk")) {
    measurement = "Sachet";
  } else {
    measurement = "Pcs";
  }

  return { quantity: qty, measurement };
}

// Helper: Fetch Master Items from UMKM API
async function getMasterItems(jid?: string): Promise<Array<{ id: number; name: string; current_price: string; group_name?: string | null; is_active?: number | boolean }>> {
  const res = await fetch(`${UMKM_API_BASE}/api/items`, {
    headers: await waHeaders(jid),
  });
  if (!res.ok) return [];
  return await res.json();
}

// Helper: format Rupiah for messages
function rupiah(n: number): string {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

// Scan ONE screenshot/receipt image (as a Buffer) via the UMKM backend scanner.
// Returns the parsed { expense_date, items } or null on failure.
async function scanImageBuffer(buf: Buffer, jid?: string): Promise<{ expense_date: string; items: any[] } | null> {
  try {
    const fd = new FormData();
    fd.append("receipt", new Blob([buf], { type: "image/jpeg" }), "screenshot.jpg");
    const res = await fetch(`${UMKM_API_BASE}/api/opex/scan`, {
      method: "POST",
      headers: await waHeaders(jid), // Authorization + X-WA-JID (tenant scope)
      body: fd,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { expense_date: data.expense_date, items: Array.isArray(data.items) ? data.items : [] };
  } catch {
    return null;
  }
}

// Download every buffered image for this sender, scan each, and merge results.
// Uses the EARLIEST detected date across screenshots as the expense_date.
async function scanBufferedBelanja(messages: any[], jid: string): Promise<PendingBelanja> {
  const allItems: PendingBelanja["items"] = [];
  let earliestDate = "";
  for (const message of messages) {
    let buf: Buffer;
    try {
      buf = (await downloadMediaMessage(message, "buffer", {})) as Buffer;
    } catch {
      continue;
    }
    const result = await scanImageBuffer(buf, jid);
    if (!result) continue;
    if (result.expense_date && (!earliestDate || result.expense_date < earliestDate)) {
      earliestDate = result.expense_date;
    }
    for (const it of result.items) allItems.push(it);
  }
  const fallback = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  return { items: allItems, expense_date: earliestDate || fallback };
}

// Send a Yes/No prompt. WhatsApp interactive buttons are unreliable on many
// Baileys/WA versions, so send tappable-style options AND accept typed Ya/Tidak.
async function sendYesNo(jid: string, body: string, yesId: string, noId: string, quoted?: any): Promise<void> {
  try {
    await sock?.sendMessage(jid, {
      text: body,
      buttons: [
        { buttonId: yesId, buttonText: { displayText: "✅ Yes" }, type: 1 },
        { buttonId: noId, buttonText: { displayText: "❌ No" }, type: 1 },
      ],
      headerType: 1,
    } as any, { quoted });
  } catch {
    // Fallback: plain text instruction if the WA version rejects buttons.
    await sock?.sendMessage(jid, { text: `${body}\n\n_Balas *Ya* untuk simpan, atau *Tidak* untuk batal._` }, { quoted });
  }
}

// Persist confirmed belanja items to OpEx (scoped to this sender's account).
async function saveBelanjaToOpex(pending: PendingBelanja, jid: string): Promise<number> {
  let ok = 0;
  for (const it of pending.items) {
    try {
      const res = await fetch(`${UMKM_API_BASE}/api/opex`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await waHeaders(jid)) },
        body: JSON.stringify({
          item_name: it.item_name,
          price_paid: it.price_paid,
          quantity: it.quantity || 1,
          measurement: it.measurement || "Pcs",
          expense_date: pending.expense_date,
          notes: "Scan screenshot (WhatsApp)",
        }),
      });
      if (res.ok) ok++;
    } catch {}
  }
  return ok;
}


// Helper: Fetch Business Name from UMKM API
async function getBusinessName(jid?: string): Promise<string> {
  try {
    const res = await fetch(`${UMKM_API_BASE}/api/business-info`, {
      headers: await waHeaders(jid),
    });
    if (res.ok) {
      const info = await res.json();
      return info.business_name || "UMKM Enterprise";
    }
  } catch {}
  return "UMKM Enterprise";
}

// Helper: extract phone number from a Baileys JID (resolve LID if needed)
async function jidToPhone(jid: string): Promise<string> {
  const cleanId = jid.split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
  if (jid.includes("@s.whatsapp.net")) return cleanId;
  // LID: try live mapping, then reverse file
  try {
    if (sock?.signalRepository?.lidMapping) {
      const fullLid = jid.includes("@") ? jid : `${cleanId}@lid`;
      const pnJid = await sock.signalRepository.lidMapping.getPNForLID(fullLid);
      if (pnJid) {
        const cleanPn = pnJid.split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
        if (cleanPn) return cleanPn;
      }
    }
  } catch {}
  try {
    const revFile = path.resolve(AUTH_DIR, `lid-mapping-${cleanId}_reverse.json`);
    if (fs.existsSync(revFile)) {
      const rawPn = JSON.parse(fs.readFileSync(revFile, "utf-8"));
      const cleanPn = String(rawPn).split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
      if (cleanPn) return cleanPn;
    }
  } catch {}
  return cleanId;
}

// Helper: Find Best Matching Item by Name
function findBestMatchingItem(name: string, items: Array<{ id: number; name: string }>) {
  const target = name.trim().toLowerCase();
  // Exact match
  let found = items.find((i) => i.name.toLowerCase() === target);
  if (found) return found;

  // Substring match
  const subMatches = items.filter((i) => {
    const iname = i.name.toLowerCase();
    return iname.includes(target) || target.includes(iname);
  });
  if (subMatches.length === 1) return subMatches[0];

  // Token overlap scoring
  const targetTokens = target.split(/[\s\-–—/]+/).filter(Boolean);
  let bestScore = 0;
  let bestItem: { id: number; name: string } | null = null;

  for (const item of items) {
    const itemTokens = item.name.toLowerCase().split(/[\s\-–—/]+/).filter(Boolean);
    let score = 0;
    for (const t of targetTokens) {
      if (itemTokens.some((it) => it === t || it.includes(t) || t.includes(it))) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  if (bestScore > 0) return bestItem;
  return null;
}

// Handler: /updatebelanja
export async function handleUpdateBelanja(lines: string[], jid?: string): Promise<string> {
  const nonBlankLines = lines.map((l) => l.trim()).filter((l) => l.length > 0);

  // If user only types command without full parameters
  if (nonBlankLines.length <= 1) {
    return (
      "Untuk melakukan Update Belanja Kamu memerlukan full perintah berikut:\n" +
      "> /belanja\n" +
      "> [dd-mm-yy]\n" +
      "> nama barang, harga, qty satuan\n" +
      "*CONTOH*\n" +
      "> /belanja\n" +
      "> 22-09-26\n" +
      "> Ayam, 250000, 12kg\n" +
      "> Micin, 50000, 1sachet"
    );
  }

  const dateLine = nonBlankLines[1];
  const expenseDate = parseCustomDate(dateLine);
  const dataLines = nonBlankLines.slice(2);

  if (dataLines.length === 0) {
    return (
      "Untuk melakukan Update Belanja Kamu memerlukan full perintah berikut:\n" +
      "> /belanja\n" +
      "> [dd-mm-yy]\n" +
      "> nama barang, harga, qty satuan\n" +
      "*CONTOH*\n" +
      "> /belanja\n" +
      "> 22-09-26\n" +
      "> Ayam, 250000, 12kg\n" +
      "> Micin, 50000, 1sachet"
    );
  }

  const successList: string[] = [];
  const errorList: string[] = [];
  let totalBelanja = 0;

  for (const rawLine of dataLines) {
    const parts = rawLine.split(",").map((s) => s.trim());
    if (parts.length < 3) {
      errorList.push(`• "${rawLine}" -> Format harus: Nama Barang, Harga, Qty Satuan`);
      continue;
    }

    const itemName = parts[0];
    const costNum = Number(parts[1].replace(/[^0-9.]/g, ""));
    const rawQtyAndUnit = parts.length > 3 ? `${parts[2]} ${parts[3]}` : parts[2];
    const { quantity: qtyNum, measurement } = parseQuantityAndUnit(rawQtyAndUnit);

    if (!itemName || isNaN(costNum) || isNaN(qtyNum) || costNum <= 0 || qtyNum <= 0) {
      errorList.push(`• "${itemName || rawLine}" -> Angka harga atau quantity tidak valid`);
      continue;
    }

    try {
      const res = await fetch(`${UMKM_API_BASE}/api/opex`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await waHeaders(jid)),
        },
        body: JSON.stringify({
          item_name: itemName,
          price_paid: costNum,
          quantity: qtyNum,
          measurement: measurement,
          expense_date: expenseDate,
        }),
      });

      if (res.ok) {
        successList.push(`✅ ${itemName}: ${formatCurrency(costNum)} (${qtyNum} ${measurement})`);
        totalBelanja += costNum;
      } else {
        const err = await res.json();
        errorList.push(`❌ ${itemName}: ${err.error || "Gagal menyimpan ke OpEx"}`);
      }
    } catch (e: any) {
      errorList.push(`❌ ${itemName}: ${e.message || "Gagal menghubungi server"}`);
    }
  }

  let reply = `📦 *HASIL UPDATE BELANJA (OpEx)*\n📅 Tanggal: *${expenseDate}*\n\n`;
  if (successList.length > 0) {
    reply += `*Berhasil Dicatat:*\n${successList.join("\n")}\n\n`;
    reply += `💰 *Total Belanja Baru:* ${formatCurrency(totalBelanja)}\n`;
  }
  if (errorList.length > 0) {
    reply += `\n*Gagal/Dilewati:*\n${errorList.join("\n")}\n`;
  }
  return reply.trim();
}

// Handler: /updatejual
export async function handleUpdateJual(lines: string[], jid?: string): Promise<string> {
  const nonBlankLines = lines.map((l) => l.trim()).filter((l) => l.length > 0);

  // If user only types command without full parameters
  if (nonBlankLines.length <= 1) {
    return (
      "Untuk melakukan Update Jual Kamu memerlukan full perintah berikut:\n" +
      "> /pesanan\n" +
      "> [dd-mm-yy]\n" +
      "> nama pembeli: sku qty, ...\n" +
      "*CONTOH*\n" +
      "> /pesanan\n" +
      "> 26-09-26\n" +
      "> Wina: ayam kare 10, cumi 11, sate kikil 11\n" +
      "> Kevin: sate kikil 12, cumi 1\n" +
      "> Darma: Jus Jambu 1"
    );
  }

  const dateLine = nonBlankLines[1];
  const entryDate = parseCustomDate(dateLine);
  const dataLines = nonBlankLines.slice(2);

  if (dataLines.length === 0) {
    return (
      "Untuk melakukan Update Jual Kamu memerlukan full perintah berikut:\n" +
      "> /pesanan\n" +
      "> [dd-mm-yy]\n" +
      "> nama pembeli: sku qty, ...\n" +
      "*CONTOH*\n" +
      "> /pesanan\n" +
      "> 26-09-26\n" +
      "> Wina: ayam kare 10, cumi 11, sate kikil 11\n" +
      "> Kevin: sate kikil 12, cumi 1\n" +
      "> Darma: Jus Jambu 1"
    );
  }

  const masterItems = await getMasterItems(jid);
  if (masterItems.length === 0) {
    return "❌ *Gagal mengambil katalog produk dari sistem. Pastikan katalog terisi.*";
  }

  const successList: string[] = [];
  const errorList: string[] = [];
  let totalRevenueEst = 0;
  let totalQtySum = 0;

  for (const rawLine of dataLines) {
    if (rawLine.includes(":")) {
      const colonIdx = rawLine.indexOf(":");
      const buyerName = rawLine.slice(0, colonIdx).trim();
      const right = rawLine.slice(colonIdx + 1).trim();

      if (!buyerName || !right) {
        errorList.push(`• "${rawLine}" -> Format harus: Nama Pembeli: sku qty, ...`);
        continue;
      }

      const segments = right.split(",").map((s) => s.trim()).filter(Boolean);
      if (segments.length === 0) {
        errorList.push(`• "${rawLine}" -> Tidak ada rincian barang yang dicatat`);
        continue;
      }

      for (const seg of segments) {
        const match = seg.match(/^(.*?)\s+(\d+(?:\.\d+)?)(?:\s*(?:pcs|buah|porsi|box|bungkus|paket))?$/i);
        if (!match) {
          errorList.push(`• [${buyerName}] "${seg}" -> Format harus: [nama sku] [qty angka], contoh: ayam kare 10`);
          continue;
        }

        const itemNameQuery = match[1].trim();
        const stockQty = parseFloat(match[2]);

        if (isNaN(stockQty) || stockQty <= 0) {
          errorList.push(`• [${buyerName}] "${seg}" -> Jumlah harus > 0`);
          continue;
        }

        const matchedItem = findBestMatchingItem(itemNameQuery, masterItems);
        if (!matchedItem) {
          errorList.push(`• [${buyerName}] "${itemNameQuery}" -> Tidak ditemukan di Katalog produk!`);
          continue;
        }

        try {
          const res = await fetch(`${UMKM_API_BASE}/api/daily-sales`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(await waHeaders(jid)),
            },
            body: JSON.stringify({
              entry_date: entryDate,
              item_id: matchedItem.id,
              buyer_name: buyerName,
              starting_stock: stockQty,
              restock_quantity: 0,
              waste_quantity: 0,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const rev = Number(data.total_revenue) || 0;
            totalRevenueEst += rev;
            totalQtySum += stockQty;
            successList.push(`✅ [${buyerName}] ${matchedItem.name}: ${stockQty} pcs (${formatCurrency(rev)})`);
          } else {
            const err = await res.json().catch(() => ({}));
            errorList.push(`❌ [${buyerName}] ${matchedItem.name}: ${err.error || "Gagal mencatat penjualan"}`);
          }
        } catch (e: any) {
          errorList.push(`❌ [${buyerName}] ${itemNameQuery}: ${e.message || "Gagal menghubungi server"}`);
        }
      }
    } else {
      // Legacy format: "Buyer, Item, Qty"
      const parts = rawLine.split(",").map((s) => s.trim());
      if (parts.length < 3) {
        errorList.push(`• "${rawLine}" -> Format harus: Nama Pembeli: sku qty, ...`);
        continue;
      }

      const buyerName = parts[0];
      const itemNameQuery = parts[1];
      const stockQty = Number(parts[2].replace(/[^0-9.]/g, ""));

      if (isNaN(stockQty) || stockQty <= 0) {
        errorList.push(`• "${rawLine}" -> Jumlah stock harus berupa angka > 0`);
        continue;
      }

      const matchedItem = findBestMatchingItem(itemNameQuery, masterItems);
      if (!matchedItem) {
        errorList.push(`• "${itemNameQuery}" -> Tidak ditemukan di Katalog produk!`);
        continue;
      }

      try {
        const res = await fetch(`${UMKM_API_BASE}/api/daily-sales`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await waHeaders(jid)),
          },
          body: JSON.stringify({
            entry_date: entryDate,
            item_id: matchedItem.id,
            buyer_name: buyerName,
            starting_stock: stockQty,
            restock_quantity: 0,
            waste_quantity: 0,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rev = Number(data.total_revenue) || 0;
          totalRevenueEst += rev;
          totalQtySum += stockQty;
          successList.push(`✅ [${buyerName}] ${matchedItem.name}: ${stockQty} pcs (${formatCurrency(rev)})`);
        } else {
          const err = await res.json().catch(() => ({}));
          errorList.push(`❌ [${buyerName}] ${matchedItem.name}: ${err.error || "Gagal mencatat penjualan"}`);
        }
      } catch (e: any) {
        errorList.push(`❌ [${buyerName}] ${itemNameQuery}: ${e.message || "Gagal menghubungi server"}`);
      }
    }
  }

  let reply = `📊 *HASIL UPDATE PENJUALAN (Daily Ops)*\n📅 Target Tanggal: *${entryDate}*\n\n`;
  if (successList.length > 0) {
    reply += `*Berhasil Dicatat (${totalQtySum} pcs):*\n${successList.join("\n")}\n\n`;
    reply += `💵 *Subtotal Omzet:* ${formatCurrency(totalRevenueEst)}\n`;
    reply += `⏰ *Reminder Otomatis:* Bot akan mengirimkan ringkasan pesanan ke WhatsApp pada jam 21:00 WIB (H-1) dan 02:00 WIB (Hari H).\n`;
  }
  if (errorList.length > 0) {
    reply += `\n*Gagal/Perlu Dicek:*\n${errorList.join("\n")}\n`;
  }
  return reply.trim();
}

// Handler: /satuan
export function handleSatuan(): string {
  return (
    `📏 *DAFTAR SATUAN RESMI (OpEx / Belanja):*\n\n` +
    `1. *Kilo* (Dukungan: KG, kg, kilo, k)\n` +
    `2. *Litre* (Dukungan: L, l, liter, litre, ltr)\n` +
    `3. *Box* (Dukungan: box, dus, kotak, bx)\n` +
    `4. *Sachet* (Dukungan: sachet, sch, sct, bungkus, bgk)\n` +
    `5. *Pcs* (Dukungan: pcs, buah, lembar, butir)\n\n` +
    `💡 *Tips:* Penulisan bisa digabung atau dipisah:\n` +
    `Contoh: *12kg* atau *12 KG*, *1sachet* atau *1 sachet*`
  );
}

// Handler: /updatecatalog
export async function handleUpdateCatalog(lines: string[], jid?: string): Promise<string> {
  const nonBlankLines = lines.map((l) => l.trim()).filter((l) => l.length > 0);

  if (nonBlankLines.length <= 1) {
    return (
      "Untuk menambah/update Katalog Produk, gunakan format:\n" +
      "> /updatecatalog\n" +
      "> nama produk, harga jual\n" +
      "_(grup opsional: nama produk, grup, harga jual)_\n" +
      "*CONTOH*\n" +
      "> /updatecatalog\n" +
      "> Nasi Bakar Ayam, 12000\n" +
      "> Sate Kikil, Aneka Sate, 15000\n\n" +
      "Jika produk sudah ada, bot akan menanyakan konfirmasi perubahan."
    );
  }

  const dataLines = nonBlankLines.slice(1);

  // Fetch existing items for group resolution AND duplicate detection
  let existingGroups: Map<string, string> = new Map();
  let existingItems: Array<{ id: number; name: string; group_name: string | null; current_price: number }> = [];
  try {
    const res = await fetch(`${UMKM_API_BASE}/api/items`, {
      headers: await waHeaders(jid),
    });
    if (res.ok) {
      existingItems = await res.json();
      for (const item of existingItems) {
        if (item.group_name) {
          existingGroups.set(item.group_name.toLowerCase(), item.group_name);
        }
      }
    }
  } catch {}

  const successList: string[] = [];
  const errorList: string[] = [];
  const pendingList: PendingCatalogUpdate[] = [];

  for (const rawLine of dataLines) {
    const parts = rawLine.split(",").map((s) => s.trim());
    // Group is OPTIONAL: accept either "nama, harga" (2 fields) or "nama, grup, harga" (3+).
    if (parts.length < 2) {
      errorList.push(`- "${rawLine}" -> Format: nama produk, harga jual (grup opsional)`);
      continue;
    }

    let name: string;
    let groupInput: string;
    let priceRaw: string;
    if (parts.length === 2) {
      // nama, harga  → no group
      name = parts[0];
      groupInput = "";
      priceRaw = parts[1];
    } else {
      // nama, grup, harga (harga = last field; middle joined as group name)
      name = parts[0];
      priceRaw = parts[parts.length - 1];
      groupInput = parts.slice(1, parts.length - 1).join(", ");
    }
    const price = Number(priceRaw.replace(/[^0-9.]/g, ""));

    if (!name) {
      errorList.push(`- "${rawLine}" -> Nama produk tidak boleh kosong`);
      continue;
    }
    if (isNaN(price) || price <= 0) {
      errorList.push(`- "${name}" -> Harga jual harus angka > 0`);
      continue;
    }

    // Group optional: keep existing group on update, or blank for a new item.
    let groupName = "";
    if (groupInput) {
      groupName = existingGroups.get(groupInput.toLowerCase()) || groupInput;
      if (!existingGroups.has(groupInput.toLowerCase())) {
        existingGroups.set(groupInput.toLowerCase(), groupInput);
      }
    }

    // Check for existing item (case-insensitive name match)
    const existing = existingItems.find(
      (it) => it.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) {
      // Detect what changed
      const changes: string[] = [];
      // Only treat group as a change when the user actually supplied one.
      if (groupInput && existing.group_name?.toLowerCase() !== groupName.toLowerCase()) {
        changes.push(`Group: *${existing.group_name || 'No Group'}* -> *${groupName}*`);
      }
      if (Number(existing.current_price) !== price) {
        changes.push(`Harga: *${formatCurrency(Number(existing.current_price))}* -> *${formatCurrency(price)}*`);
      }

      if (changes.length > 0) {
        pendingList.push({
          name: existing.name,
          // Keep the current group if none was supplied.
          newGroup: groupInput ? groupName : (existing.group_name || ""),
          newPrice: price,
          existingItem: existing,
          changes,
        });
      } else {
        successList.push(`- ${name}: Data tidak berubah (sudah sama)`);
      }
      continue;
    }

    // New item: create directly
    try {
      const res = await fetch(`${UMKM_API_BASE}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await waHeaders(jid)),
        },
        body: JSON.stringify({
          name,
          group_name: groupName,
          current_price: price,
        }),
      });

      if (res.ok) {
        successList.push(`[+] ${name} [${groupName}]: ${formatCurrency(price)}`);
      } else {
        const err = await res.json().catch(() => ({}));
        errorList.push(`[!] ${name}: ${(err as any).error || "Gagal menyimpan"}`);
      }
    } catch (e: any) {
      errorList.push(`[!] ${name}: ${e.message || "Gagal menghubungi server"}`);
    }
  }

  // Store pending updates for this user
  if (pendingList.length > 0 && jid) {
    pendingCatalogUpdates.set(jid, pendingList);
    // Auto-clear after 5 minutes
    setTimeout(() => pendingCatalogUpdates.delete(jid), 5 * 60 * 1000);
  }

  let reply = `*HASIL UPDATE KATALOG PRODUK*\n\n`;
  if (successList.length > 0) {
    reply += `*Berhasil (${successList.length} item):*\n${successList.join("\n")}\n`;
  }
  if (errorList.length > 0) {
    reply += `\n*Gagal/Dilewati:*\n${errorList.join("\n")}\n`;
  }
  if (pendingList.length > 0) {
    reply += `\n*Konfirmasi Perubahan (${pendingList.length} item):*\n`;
    for (let i = 0; i < pendingList.length; i++) {
      const p = pendingList[i];
      reply += `\n*${i + 1}. ${p.name}*\n`;
      for (const c of p.changes) {
        reply += `   ${c}\n`;
      }
    }
    reply += `\nBalas *Y* untuk update semua, atau *N* untuk batal.`;
  }
  return reply.trim();
}

// Handle Y/N confirmation for pending catalog updates
export async function handleCatalogConfirmation(answer: string, jid: string): Promise<string | null> {
  const pending = pendingCatalogUpdates.get(jid);
  if (!pending || pending.length === 0) return null;

  pendingCatalogUpdates.delete(jid);

  if (answer.toLowerCase() !== "y") {
    return "Perubahan katalog dibatalkan. Data tetap seperti semula.";
  }

  const results: string[] = [];
  for (const p of pending) {
    try {
      const res = await fetch(`${UMKM_API_BASE}/api/items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(await waHeaders(jid)),
        },
        body: JSON.stringify({
          id: p.existingItem.id,
          name: p.name,
          group_name: p.newGroup,
          current_price: p.newPrice,
        }),
      });
      if (res.ok) {
        results.push(`[OK] ${p.name}: ${p.changes.join(", ")}`);
      } else {
        results.push(`[!] ${p.name}: Gagal update`);
      }
    } catch {
      results.push(`[!] ${p.name}: Error koneksi`);
    }
  }

  return `*KATALOG UPDATED*\n\n${results.join("\n")}`;
}

// Handler: /bantuan
export function handleBantuan(): string {
  return (
    `🤖 *UMKM ENTERPRISE*\n` +
    `_Asisten pembukuan usaha kamu_\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `📋 *DAFTAR PERINTAH*\n\n` +
    `🛒 */belanja*\n` +
    `Catat pengeluaran belanja. Bisa kirim foto struk/screenshot lalu balas perintah ini.\n\n` +
    `💰 */pesanan*\n` +
    `Catat penjualan harian.\n\n` +
    `📦 */updatecatalog*\n` +
    `Tambah / ubah katalog produk.\n\n` +
    `🍽️ */menu*\n` +
    `Lihat daftar produk aktif.\n\n` +
    `📏 */satuan*\n` +
    `Lihat daftar satuan resmi.\n\n` +
    `📈 */analytics*\n` +
    `Dashboard keuangan & omzet.\n\n` +
    `📅 */dashboard*\n` +
    `Ringkasan pesanan hari ini.\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `💡 Ketik satu perintah tanpa isi untuk melihat panduan formatnya.\n` +
    `🌐 https://umkm.skyuniverse.tech`
  );
}

// Handler: /menu (public — shows catalog grouped by group type)
export async function handleMenu(jid?: string): Promise<string> {
  const [items, businessName] = await Promise.all([getMasterItems(jid), getBusinessName(jid)]);
  const active = items.filter((it) => it.is_active === undefined || it.is_active === 1 || it.is_active === true);

  if (active.length === 0) {
    return "Maaf, menu belum tersedia saat ini. Silakan coba lagi nanti.";
  }

  // Group by group_name
  const groups = new Map<string, typeof active>();
  for (const it of active) {
    const g = (it.group_name || "Lainnya").trim();
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(it);
  }

  let text = `🍽️ *MENU — ${businessName.toUpperCase()}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━\n`;
  let idx = 1;
  const sortedGroups = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  for (const g of sortedGroups) {
    text += `\n📂 *${g.toUpperCase()}*\n`;
    for (const it of groups.get(g)!) {
      text += `${idx}. *${it.name}*\n     ${formatCurrency(Number(it.current_price))}\n`;
      idx++;
    }
  }
  text += `\n━━━━━━━━━━━━━━━━━━━\n`;
  text += `📋 Total ${idx - 1} produk aktif.`;
  return text;
}

// Build a stable menu list (same ordering as handleMenu) for SKU-index lookup
async function buildMenuList(jid?: string): Promise<Array<{ id: number; name: string; current_price: number; group_name: string | null }>> {
  const items = await getMasterItems(jid);
  const active = items.filter((it) => it.is_active === undefined || it.is_active === 1 || it.is_active === true);
  const groups = new Map<string, typeof active>();
  for (const it of active) {
    const g = (it.group_name || "Lainnya").trim();
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(it);
  }
  const ordered: Array<{ id: number; name: string; current_price: number; group_name: string | null }> = [];
  const sortedGroups = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  for (const g of sortedGroups) {
    for (const it of groups.get(g)!) {
      ordered.push({ id: it.id, name: it.name, current_price: Number(it.current_price), group_name: it.group_name ?? null });
    }
  }
  return ordered;
}

const PESAN_TUTORIAL =
  "🛒 *CARA MELAKUKAN PEMESANAN*\n" +
  "━━━━━━━━━━━━━━━━━━━\n\n" +
  "📖 Lihat menu terlebih dahulu:\n" +
  "> `/menu`\n\n" +
  "✍️ Lalu buat pesanan dengan:\n" +
  "> `/pesan [SKUID] [jumlah]`\n" +
  "> `/pesan [Nama Product] [jumlah]`\n\n" +
  "💡 *Contoh:*\n" +
  "> `/pesan 1 12`\n" +
  "_(1 = urutan menu sesuai list, 12 = jumlah)_\n\n" +
  "atau pesan beberapa item sekaligus:\n" +
  "> `/pesan Nasi Bakar Ayam 12, Nasi Bakar Cumi 13`";

// Handler: /setup <UID> — bind this WhatsApp number to a user account via the UMKM API.
// One UID → one number; the backend rejects rebinding a UID or number already linked.
export async function handleSetup(text: string, jid: string): Promise<string> {
  const uid = text.replace(/^\/setup\s*/i, "").trim().toUpperCase();
  if (!uid) {
    return (
      "🔗 *Setup Akun*\n" +
      "━━━━━━━━━━━━━━━━━━━\n" +
      "Ketik UID yang diberikan admin:\n" +
      "> `/setup UMK-XXXXXXXX`\n\n" +
      "_Nomor WhatsApp ini akan terhubung ke akun kamu._"
    );
  }
  try {
    // Always resolve to a phone JID (<digits>@s.whatsapp.net) — even if the sender arrives as @lid.
    const phone = await jidToPhone(jid);
    const bindJid = phone ? `${phone}@s.whatsapp.net` : jid;
    const res = await fetch(`${UMKM_API_BASE}/api/wa/setup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${UMKM_API_KEY}`,
      },
      body: JSON.stringify({ uid, jid: bindJid }),
    });
    const data = await res.json().catch(() => ({} as any));
    if (res.ok) {
      // Refresh the local whitelist file from the backend's bound-number feed.
      await syncWhitelistFromApi();
      if (data.already) {
        return `✅ Nomor ini *sudah terhubung* ke akun *${data.username}*.\n\nKetik \`/menu\` untuk mulai.`;
      }
      return (
        `✅ *Berhasil!*\n` +
        `━━━━━━━━━━━━━━━━━━━\n` +
        `Nomor kamu terhubung ke akun *${data.username}*.\n\n` +
        `Sekarang kamu bisa pakai semua command. Ketik \`/bantuan\` untuk lihat daftar.`
      );
    }
    return `⚠️ ${data.error || "Gagal setup. Periksa UID kamu."}`;
  } catch (e) {
    return "⚠️ Tidak bisa terhubung ke server. Coba lagi nanti.";
  }
}

// Pull the list of bound numbers from the UMKM backend and persist to whitelist.json.
async function syncWhitelistFromApi(): Promise<void> {
  try {
    const res = await fetch(`${UMKM_API_BASE}/api/wa/whitelist`, {
      headers: { Authorization: `Bearer ${UMKM_API_KEY}` },
    });
    if (!res.ok) return;
    const rows: Array<{ wa_jid: string }> = await res.json();
    const jids = rows.map((r) => r.wa_jid).filter(Boolean);
    if (jids.length) saveWhitelist(jids);
  } catch {}
}

// Handler: /pesan (public — customer order, mirrors /updatejual for non-whitelist users)
export async function handlePesan(text: string, jid: string): Promise<string> {
  // Strip the leading command token, keep the rest
  const afterCmd = text.replace(/^\/pesan\s*/i, "").trim();

  if (!afterCmd) {
    return PESAN_TUTORIAL;
  }

  const menu = await buildMenuList(jid);
  if (menu.length === 0) {
    return "Maaf, menu belum tersedia saat ini. Silakan coba lagi nanti.";
  }

  // Parse comma-separated segments: each "SKUID qty" or "Product Name qty"
  const segments = afterCmd.split(",").map((s) => s.trim()).filter(Boolean);
  const orderItems: OrderItem[] = [];
  const errorList: string[] = [];

  for (const seg of segments) {
    const match = seg.match(/^(.*?)\s+(\d+(?:\.\d+)?)(?:\s*(?:pcs|buah|porsi|box|bungkus|paket))?$/i);
    if (!match) {
      errorList.push(`- "${seg}" -> Format: [SKUID/Nama Product] [jumlah], contoh: 1 12`);
      continue;
    }
    const query = match[1].trim();
    const qty = parseFloat(match[2]);
    if (isNaN(qty) || qty <= 0) {
      errorList.push(`- "${seg}" -> Jumlah harus > 0`);
      continue;
    }

    // If query is a pure integer, treat as SKU index (1-based)
    let matchedItem: { id: number; name: string; current_price: number } | null = null;
    if (/^\d+$/.test(query)) {
      const idx = parseInt(query, 10) - 1;
      if (idx >= 0 && idx < menu.length) {
        matchedItem = menu[idx];
      } else {
        errorList.push(`- SKUID "${query}" -> Tidak ada di menu (1-${menu.length}). Ketik /menu untuk lihat daftar.`);
        continue;
      }
    } else {
      matchedItem = findBestMatchingItem(query, menu) as any;
      if (!matchedItem) {
        errorList.push(`- "${query}" -> Tidak ditemukan di menu. Ketik /menu untuk lihat daftar.`);
        continue;
      }
    }

    orderItems.push({ item: matchedItem, qty });
  }

  if (orderItems.length === 0) {
    let reply = "❌ *Pesanan tidak dapat diproses:*\n" + errorList.join("\n");
    reply += "\n\n" + PESAN_TUTORIAL;
    return reply;
  }

  // Store pending order, ask for name
  pendingOrders.set(jid, orderItems);
  setTimeout(() => pendingOrders.delete(jid), 10 * 60 * 1000);

  let summary = "";
  for (const oi of orderItems) {
    summary += `> • *${oi.item.name}* ×${oi.qty}\n>    ${formatCurrency(oi.item.current_price * oi.qty)}\n`;
  }
  let reply = `🧾 *RINGKASAN PESANAN*\n━━━━━━━━━━━━━━━━━━━\n${summary}`;
  if (errorList.length > 0) {
    reply += `\n⚠️ *Dilewati:*\n${errorList.join("\n")}\n`;
  }
  reply += `\n━━━━━━━━━━━━━━━━━━━\n`;
  reply += `👤 *[System]: Masukan Nama Anda:*`;
  return reply;
}

// Handle order name entry (finalizes a pending order -> records daily sales + invoice)
export async function handleOrderNameEntry(name: string, jid: string): Promise<string | null> {
  const order = pendingOrders.get(jid);
  if (!order || order.length === 0) return null;

  pendingOrders.delete(jid);

  const buyerName = name.trim();
  const entryDate = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" }); // YYYY-MM-DD WIB
  const phone = await jidToPhone(jid);
  const invoiceNo = `INV-${entryDate.replace(/-/g, "")}-${Date.now().toString().slice(-6)}`;

  const detailList: string[] = [];
  let total = 0;

  for (const oi of order) {
    try {
      const res = await fetch(`${UMKM_API_BASE}/api/daily-sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await waHeaders(jid)),
        },
        body: JSON.stringify({
          entry_date: entryDate,
          item_id: oi.item.id,
          buyer_name: buyerName,
          starting_stock: oi.qty,
          restock_quantity: 0,
          waste_quantity: 0,
        }),
      });
      const lineTotal = oi.item.current_price * oi.qty;
      total += lineTotal;
      if (res.ok) {
        detailList.push(`> • *${oi.item.name}* ×${oi.qty} = ${formatCurrency(lineTotal)}`);
      } else {
        detailList.push(`> • *${oi.item.name}* ×${oi.qty} = ${formatCurrency(lineTotal)} _(gagal dicatat)_`);
      }
    } catch {
      detailList.push(`> • *${oi.item.name}* ×${oi.qty} _(error koneksi)_`);
    }
  }

  return (
    `✅ *PESANAN BERHASIL DIBUAT*\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *Atas Nama:* ${buyerName}\n` +
    `🧾 *No. Invoice:* \`${invoiceNo}\`\n` +
    `📱 *No. Telepon:* ${phone}\n\n` +
    `🛍️ *Detail Pesanan:*\n${detailList.join("\n")}\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *TOTAL: ${formatCurrency(total)}*\n\n` +
    `_Terima kasih telah memesan! 🙏_`
  );
}

// Handler: /dashboard — Pesanan hari ini (today's orders grouped by buyer)
export async function handleDashboardPesanan(jid?: string): Promise<string> {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const businessName = await getBusinessName(jid);
  try {
    const res = await fetch(`${UMKM_API_BASE}/api/daily-sales?date=${today}`, {
      headers: await waHeaders(jid),
    });
    if (!res.ok) return "❌ Gagal memuat data pesanan dari server.";
    const entries: Array<any> = await res.json();

    const buyersMap = new Map<string, { totalQty: number; items: Array<{ name: string; qty: number }> }>();
    let totalPcs = 0;

    for (const e of entries) {
      const buyer = e.buyer_name || "Walk-in Customer";
      const item = e.item_name || "Produk";
      const qty = Number(e.sold_quantity) || Number(e.starting_stock) || 0;
      if (qty <= 0) continue;
      if (!buyersMap.has(buyer)) buyersMap.set(buyer, { totalQty: 0, items: [] });
      const b = buyersMap.get(buyer)!;
      b.totalQty += qty;
      const ex = b.items.find((it) => it.name === item);
      if (ex) ex.qty += qty;
      else b.items.push({ name: item, qty });
      totalPcs += qty;
    }

    let text = `📊 *PESANAN HARI INI — ${businessName.toUpperCase()}*\n`;
    text += `📅 ${today}\n`;
    text += `━━━━━━━━━━━━━━━━━━━\n`;
    text += `🛒 *Total Jumlah Pesanan:* ${totalPcs} pcs\n`;
    text += `👥 *Total Pembeli:* ${buyersMap.size} orang\n`;
    text += `━━━━━━━━━━━━━━━━━━━\n\n`;

    if (buyersMap.size === 0) {
      text += `_Belum ada pesanan hari ini._`;
      return text;
    }

    text += `*List Pembeli:*\n`;
    for (const [buyer, data] of buyersMap.entries()) {
      const itemsStr = data.items.map((it) => `${it.name} [${it.qty}]`).join(", ");
      text += `> *${buyer}:* ${itemsStr}\n`;
    }
    return text;
  } catch (e: any) {
    return `❌ Error mengambil pesanan: ${e.message || "Internal error"}`;
  }
}

// Handler: /analytics or /dashboard
export async function handleAnalyticsDashboard(jid?: string): Promise<string> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [resRolling, resDaily] = await Promise.all([
      fetch(`${UMKM_API_BASE}/api/analytics/rolling-30`, {
        headers: await waHeaders(jid),
      }),
      fetch(`${UMKM_API_BASE}/api/analytics/daily?date=${today}`, {
        headers: await waHeaders(jid),
      }),
    ]);

    if (!resRolling.ok) {
      return "❌ Gagal memuat data analytics dari server UMKM.";
    }

    const rolling = await resRolling.json();
    const daily = resDaily.ok ? await resDaily.json() : null;

    let text = `📈 *EXECUTIVE DASHBOARD & ANALYTICS*\n`;
    text += `🏢 *UMKM Enterprise*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    if (daily) {
      text += `📅 *Hari Ini (${today}):*\n`;
      text += `• Total Pcs Terjual: *${daily.total_items_sold || 0} pcs*\n`;
      text += `• Sisa / Waste: *${daily.total_waste || 0} pcs*\n`;
      text += `• Omzet Hari Ini: *${formatCurrency(daily.daily_revenue)}*\n\n`;
    }

    text += `📊 *Rolling 30 Hari:*\n`;
    text += `• 30D Revenue: *${formatCurrency(rolling.rolling_revenue)}*\n`;
    text += `• 30D OpEx: *${formatCurrency(rolling.rolling_opex)}*\n`;
    text += `• 30D Gross Profit: *${formatCurrency(rolling.gross_profit)}*\n`;
    text += `• Total Sisa / Waste: *${rolling.rolling_waste_qty || 0} pcs*\n\n`;

    if (rolling.health_suggestion) {
      const icon = rolling.health_status === "bad" ? "🚨" : rolling.health_status === "unhealthy" ? "⚠️" : "✨";
      text += `${icon} *Analytics Suggestion:*\n"${rolling.health_suggestion}"\n\n`;
    }

    if (rolling.data_mining?.advice) {
      text += `💡 *Data Mining Advice:*\n${rolling.data_mining.advice}\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🌐 Web Workspace: https://umkm.skyuniverse.tech`;

    return text;
  } catch (e: any) {
    return `❌ Error mengambil analytics: ${e.message || "Internal error"}`;
  }
}

// Start Baileys WASocket
async function connectToWhatsApp(forceNew = false) {
  if (forceNew && fs.existsSync(AUTH_DIR)) {
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      console.log("Auth session cleared for new pairing");
    } catch {}
  }

  connectionStatus = "connecting";
  currentQRDataUrl = null;
  lastError = null;

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Baileys version ${version.join(".")}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: ["UMKM Management", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        currentQRDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 7 });
        connectionStatus = "connecting";
        console.log("Generated WhatsApp QR Data URL for Web UI");
      } catch (err: any) {
        console.error("QR Code generation error:", err);
      }
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      connectionStatus = "disconnected";
      currentQRDataUrl = null;
      connectedJid = null;
      lastError = `Disconnected (code: ${statusCode})`;
      console.log(`Connection closed (code ${statusCode}). Reconnect: ${shouldReconnect}`);
      if (shouldReconnect) {
        connectToWhatsApp(false);
      }
    } else if (connection === "open") {
      connectionStatus = "connected";
      currentQRDataUrl = null;
      connectedJid = sock?.user?.id || "Connected";
      lastError = null;
      console.log("✅ WhatsApp Integrator Bot successfully connected to WhatsApp:", connectedJid);
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;
    if (!jid) return;

    // Buffer any incoming image so a following /belanja can scan it.
    // (An image WITH a /belanja caption is handled directly below.)
    const imageMsg = msg.message.imageMessage;
    const caption = (imageMsg?.caption || "").trim();
    const captionIsBelanja = caption.toLowerCase().startsWith("/belanja");
    if (imageMsg && !captionIsBelanja) {
      bufferIncomingImage(jid, msg);
      return; // silent buffer; wait for the /belanja trigger
    }

    // Button reply (Yes/No) for a pending belanja save.
    const buttonId =
      msg.message.buttonsResponseMessage?.selectedButtonId ||
      msg.message.templateButtonReplyMessage?.selectedId ||
      "";

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      "";

    const trimmed = text.trim();

    // ===== Pending belanja Yes/No confirmation (button tap OR typed) =====
    if (pendingBelanjaSave.has(jid)) {
      const ans = (buttonId || trimmed).toLowerCase();
      const isYes = ans === "belanja_yes" || ans === "yes" || ans === "ya" || ans === "y";
      const isNo = ans === "belanja_no" || ans === "no" || ans === "n" || ans === "tidak" || ans === "batal";
      if (isYes) {
        const pending = pendingBelanjaSave.get(jid)!;
        pendingBelanjaSave.delete(jid);
        const saved = await saveBelanjaToOpex(pending, jid);
        const total = pending.items.reduce((a, it) => a + (Number(it.price_paid) || 0), 0);
        await sock?.sendMessage(jid, {
          text: saved > 0
            ? `✅ *Tersimpan!*\n━━━━━━━━━━━━━━━━━━━\n${saved} barang masuk ke pembukuan belanja.\n📅 Tanggal: ${pending.expense_date}\n💰 Total: ${rupiah(total)}`
            : "⚠️ Gagal menyimpan. Pastikan nomor kamu sudah `/setup <UID>`.",
        }, { quoted: msg });
        return;
      }
      if (isNo) {
        pendingBelanjaSave.delete(jid);
        await sock?.sendMessage(jid, { text: "❌ Dibatalkan. Barang tidak disimpan." }, { quoted: msg });
        return;
      }
      // otherwise fall through to normal handling
    }

    if (!trimmed && !buttonId) return;

    const lower = trimmed.toLowerCase();
    const lines = trimmed.split("\n").map((l) => l.trim());
    const cmdFirst = lines[0].toLowerCase();

    console.log(`[WA Incoming] From: ${jid}, Command: ${lines[0] || buttonId}`);

    const whitelisted = await isWhitelisted(jid);

    // ============ PUBLIC COMMANDS (available to everyone) ============

    // NOTE: /pesan is temporarily DISABLED. /menu is enabled for whitelisted users only (below).

    if (cmdFirst === "/pesan" || cmdFirst.startsWith("/pesan ")) {
      await sock?.sendMessage(
        jid,
        { text: "🚧 Fitur ini sedang dinonaktifkan sementara." },
        { quoted: msg }
      );
      return;
    }

    // /setup <UID> — bind this WhatsApp number to a user account (public: new users aren't whitelisted yet)
    if (cmdFirst.startsWith("/setup")) {
      const reply = await handleSetup(trimmed, jid);
      await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
      return;
    }

    // ============ WHITELIST GATE ============
    if (!whitelisted) {
      console.log(`[WA Security] Non-whitelist number, showing welcome: ${jid}`);
      await sock?.sendMessage(
        jid,
        {
          text: "👋 *Selamat datang!*\n━━━━━━━━━━━━━━━━━━━\n[UMKM Enterprise]\n\nLakukan perintah berikut untuk memulai:\n🔗`/setup UMK-XXXX` — hubungkan akun kamu\n\nHalaman Dashboard Website: `https://umkm.skyuniverse.tech`\n\nUntuk pendaftaran akun Website hubungi: `https://wa.me/6281808666636`\n\n_(c) SkyUniverse Technology 2026._",
          // Embed ONLY the dashboard URL; suppress any preview for the wa.me link.
          linkPreview: {
            "canonical-url": "https://umkm.skyuniverse.tech",
            "matched-text": "https://umkm.skyuniverse.tech",
            title: "UMKM Enterprise",
            description: "Dashboard pembukuan & manajemen UMKM",
          },
        } as any,
        { quoted: msg }
      );
      return;
    }

    // Handle pending catalog confirmation (Y/N)
    if (pendingCatalogUpdates.has(jid)) {
      const yn = text.trim().toLowerCase();
      if (yn === "y" || yn === "n") {
        const reply = await handleCatalogConfirmation(yn, jid);
        if (reply) {
          await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
          return;
        }
      }
    }

    // ============ WHITELIST-ONLY Command Dispatcher ============
    if (cmdFirst.startsWith("/updatecatalog")) {
      // Reply-to-list mode: if the command was sent alone (no product lines),
      // pull the product list the user sent moments earlier.
      let catalogLines = lines;
      const hasInline = lines.filter((l) => l.trim().length > 0).length > 1;
      if (!hasInline) {
        const buffered = takeBufferedTexts(jid);
        if (buffered.length > 0) {
          const merged = buffered.join("\n").split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
          catalogLines = [lines[0], ...merged];
        }
      }
      const reply = await handleUpdateCatalog(catalogLines, jid);
      await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
    } else if (cmdFirst.startsWith("/belanja")) {
      // Screenshot-scan mode: an image caption OR a reply/message following sent images.
      const captionImage = captionIsBelanja && imageMsg ? [msg] : [];
      const buffered = takeBufferedImages(jid);
      const images = [...buffered, ...captionImage].slice(0, MAX_IMAGES_PER_SCAN);

      if (images.length > 0) {
        await sock?.sendMessage(jid, { text: "🔍 Sedang Scanning gambar kamu, mohon tunggu sebentar..." }, { quoted: msg });
        const pending = await scanBufferedBelanja(images, jid);
        if (pending.items.length === 0) {
          await sock?.sendMessage(jid, { text: "⚠️ Tidak ada barang yang terbaca dari gambar. Pastikan screenshot jelas & tidak terpotong, lalu coba lagi." }, { quoted: msg });
        } else {
          pendingBelanjaSave.set(jid, pending);
          setTimeout(() => pendingBelanjaSave.delete(jid), 10 * 60 * 1000);
          let list = "";
          pending.items.forEach((it, i) => {
            list += `${i + 1}. *${it.item_name}*\n    ${rupiah(it.price_paid)} × ${it.quantity} ${it.measurement}\n`;
          });
          const total = pending.items.reduce((a, it) => a + (Number(it.price_paid) || 0), 0);
          const summary =
            `🧾 *HASIL SCAN BELANJA*\n━━━━━━━━━━━━━━━━━━━\n` +
            `📅 Tanggal: ${pending.expense_date}\n📸 ${images.length} gambar diproses\n\n${list}\n` +
            `━━━━━━━━━━━━━━━━━━━\n💰 *Total: ${rupiah(total)}*\n\n` +
            `Simpan barang terlampir kedalam pembukuan belanja?`;
          await sendYesNo(jid, summary, "belanja_yes", "belanja_no", msg);
        }
      } else {
        // No images → fall back to manual text entry handler.
        const reply = await handleUpdateBelanja(lines, jid);
        await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
      }
    } else if (cmdFirst.startsWith("/pesanan")) {
      const reply = await handleUpdateJual(lines, jid);
      await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
    } else if (lower === "/satuan") {
      const reply = handleSatuan();
      await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
    } else if (lower === "/menu") {
      const reply = await handleMenu(jid);
      await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
    } else if (
      lower === "/bantuan" ||
      lower === "/help" ||
      lower === "/start"
    ) {
      const reply = handleBantuan();
      await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
    } else if (
      lower === "/analytics" ||
      lower === "/laporan" ||
      lower === "/omzet"
    ) {
      const reply = await handleAnalyticsDashboard(jid);
      await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
    } else if (lower === "/dashboard") {
      const reply = await handleDashboardPesanan(jid);
      await sock?.sendMessage(jid, { text: reply }, { quoted: msg });
    } else if (!lower.startsWith("/")) {
      // Not a command: buffer as a possible product list for a following /updatecatalog.
      bufferIncomingText(jid, trimmed);
    }
  });
}

// Embedded HTTP Server for Web System Page Integration (port 8031)
if (import.meta.main) {
  const server = Bun.serve({
    port: BOT_PORT,
    async fetch(req) {
      const url = new URL(req.url);
      const method = req.method;

      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type": "application/json",
      };

      if (method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      if (url.pathname === "/status" && method === "GET") {
        return new Response(
          JSON.stringify({
            status: connectionStatus,
            qr: currentQRDataUrl,
            user: connectedJid,
            last_error: lastError,
            whitelist: getWhitelist(),
          }),
          { headers: corsHeaders }
        );
      }

      if (url.pathname === "/whitelist" && method === "GET") {
        return new Response(JSON.stringify(getWhitelist()), { headers: corsHeaders });
      }

      if (url.pathname === "/whitelist" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const numbers = Array.isArray(body.numbers) ? body.numbers : [];
        const cleanList = numbers
          .map((n: string) => {
            const digits = n.replace(/[^0-9]/g, "");
            return digits ? `${digits}@s.whatsapp.net` : null;
          })
          .filter(Boolean);
        saveWhitelist(cleanList as string[]);
        return new Response(JSON.stringify({ message: "Whitelist updated", whitelist: cleanList }), { headers: corsHeaders });
      }

      if (url.pathname === "/connect" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const forceNew = Boolean(body.force);
        connectToWhatsApp(forceNew);
        return new Response(
          JSON.stringify({
            message: "WhatsApp connection initiated",
            status: "connecting",
          }),
          { headers: corsHeaders }
        );
      }

      if (url.pathname === "/disconnect" && method === "POST") {
        try {
          await sock?.logout();
        } catch {}
        try {
          sock?.end(new Error("Manual disconnect"));
        } catch {}
        sock = null;
        connectionStatus = "disconnected";
        currentQRDataUrl = null;
        connectedJid = null;
        if (fs.existsSync(AUTH_DIR)) {
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
          } catch {}
        }
        return new Response(
          JSON.stringify({ message: "Disconnected and session cleared" }),
          { headers: corsHeaders }
        );
      }

      if (url.pathname === "/reminder-settings" && method === "GET") {
        return new Response(JSON.stringify(getReminderConfig()), { headers: corsHeaders });
      }

      if (url.pathname === "/reminder-settings" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const updated = saveReminderConfig(body);
        return new Response(JSON.stringify({ message: "Reminder settings updated", config: updated }), { headers: corsHeaders });
      }

      if (url.pathname === "/reminder-trigger" && method === "POST") {
        const body = await req.json().catch(() => ({}));
        const targetDate = body.target_date || new Date().toISOString().split("T")[0];
        const type = body.type === "morning" ? "morning" : "evening";
        const result = await sendDailyOrderReminder(targetDate, type);
        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    },
  });

  console.log(`WhatsApp Bot Service running on internal port ${server.port}`);

  // Start background reminder scheduler (checks every 30 seconds for 21:00 and 02:00 WIB)
  startReminderScheduler();

  if (fs.existsSync(path.join(AUTH_DIR, "creds.json"))) {
    connectToWhatsApp(false);
  }
}
