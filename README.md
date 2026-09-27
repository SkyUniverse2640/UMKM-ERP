# UMKM ERP

Sistem manajemen usaha (ERP) untuk UMKM: pencatatan penjualan harian, biaya operasional (OPEX), inventaris, dan analitik keuangan — lengkap dengan **bot WhatsApp** untuk input data & laporan langsung dari chat, plus **aplikasi mobile native** (Android/iOS) via Capacitor.

Dibangun oleh **SkyUniverse Technology**. Live di [umkm.skyuniverse.tech](https://umkm.skyuniverse.tech).

---

## Daftar Isi

- [Arsitektur](#arsitektur)
- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Struktur Repo](#struktur-repo)
- [Prasyarat](#prasyarat)
- [Instalasi & Menjalankan](#instalasi--menjalankan)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Bot WhatsApp](#bot-whatsapp)
- [Build Aplikasi Mobile](#build-aplikasi-mobile)
- [Ringkasan API](#ringkasan-api)
- [Keamanan](#keamanan)

---

## Arsitektur

Repo ini adalah monorepo berisi dua layanan yang saling terhubung:

```
┌─────────────────┐        HTTPS        ┌──────────────────────┐
│  Web / Mobile   │ ──────────────────► │   UMKM ERP Backend    │
│  (Vue 3 SPA /   │  cookie session     │   (Bun + Hono, :8030) │
│   Capacitor)    │ ◄────────────────── │   MySQL 8             │
└─────────────────┘                     └──────────┬───────────┘
                                                    │ REST + API key
                                         ┌──────────▼───────────┐
                                         │   WhatsApp Bot        │
                                         │   (Bun + Baileys,     │
                                         │    :8031)             │
                                         └───────────────────────┘
```

- **Backend** menyajikan REST API **dan** aset SPA yang sudah di-build (`dist/`).
- **Bot WhatsApp** adalah proses terpisah yang memanggil backend lewat REST memakai `UMKM_API_KEY`.
- **Multi-tenant**: setiap data (item, penjualan, OPEX) tersegmentasi per `user_id`; login memakai **UID** (bukan username).

---

## Fitur Utama

### Web Dashboard (Vue 3)
- **Multi-tenant + login UID-only** — isolasi data penuh antar pengguna, admin punya god-view.
- **Dashboard** — ringkasan omzet, laba, dan pesanan mendatang; tombol **Catat Sekarang!** membuka overlay input pesanan dari mana saja.
- **Pendapatan (Penjualan Harian)** — input pesanan **multi-item per pemesan**, ledger yang bisa di-collapse, hierarki visual SKU vs. pembeli.
- **OPEX / Biaya** — pencatatan biaya operasional dengan **AI receipt scanning**: upload/scan invoice atau screenshot e-commerce (Tokopedia, Shopee) dari galeri maupun kamera, otomatis membaca item, harga dibayar, dan tanggal.
- **Inventaris** — master item, satuan, dan katalog produk.
- **Analitik** — breakdown omzet, OPEX, dan waste; grafik harian.
- **Business info & branding** — nama usaha, logo, avatar (per-tenant).
- **i18n** (ID/EN), tema terang/gelap, skala UI, "Ingat saya 90 hari".

### Bot WhatsApp (Baileys)
Input data & laporan langsung dari WhatsApp. Perintah untuk user ter-whitelist:

| Perintah | Fungsi |
|----------|--------|
| `/setup UMK-XXXX` | Hubungkan nomor WA ke akun ERP (via UID) |
| `/belanja` | Catat belanja/OPEX dari screenshot (kirim gambar lalu reply, auto-scan tanggal & item, konfirmasi Yes/No) |
| `/pesanan` | Catat pesanan/penjualan |
| `/updatecatalog` | Update katalog produk (grup opsional) |
| `/menu` | Tampilkan daftar produk & harga |
| `/analytics` | Ringkasan analitik |
| `/dashboard` | Link dashboard web |
| `/satuan` | Kelola satuan |
| `/bantuan` | Bantuan & daftar perintah |

Non-whitelist yang mengirim pesan otomatis dibalas pesan sambutan berisi cara pendaftaran.

### Aplikasi Mobile
Shell native via **Capacitor** (bukan PWA): WebView native yang connect ke backend HTTPS, cookie sesi disimpan oleh OS. Menghasilkan APK/AAB (Android) dan proyek Xcode/IPA (iOS).

---

## Teknologi

| Lapisan | Stack |
|---------|-------|
| Frontend | Vue 3 (SFC), Vite, Tailwind CSS v4, radix-vue, lucide icons |
| Backend | Bun runtime, MySQL 8 (`mysql2`) |
| Auth | Session cookie (token 64-hex, HttpOnly), password hash `Bun.password` |
| Bot | Bun + `@whiskeysockets/baileys`, `qrcode` |
| Mobile | Capacitor 8 (Android + iOS) |
| AI | Vision model via AI gateway (OpenAI-compatible) untuk receipt scanning |

---

## Struktur Repo

```
.
├── UMKM/                    # ERP: backend + web + mobile shells
│   ├── index.ts             # Server Bun (REST API + serve SPA)
│   ├── schema.sql           # Skema MySQL
│   ├── src/
│   │   ├── App.vue          # Aplikasi Vue utama
│   │   ├── db.ts            # Koneksi MySQL
│   │   ├── auth.ts          # Hash & verifikasi password
│   │   ├── seed.ts          # Seed user admin awal
│   │   ├── i18n.ts          # Terjemahan ID/EN
│   │   └── components/      # SmartSelect, SmartDate
│   ├── android/             # Proyek Capacitor Android
│   ├── ios/                 # Proyek Capacitor iOS
│   └── scripts/             # build-android.sh, build-ios.sh
│
└── UMKM-WA-Bot/             # Bot WhatsApp
    └── index.ts             # Baileys socket + dispatcher perintah
```

---

## Prasyarat

- [Bun](https://bun.sh) (runtime utama kedua layanan)
- MySQL 8 (mis. via Docker: `docker run -d --name umkm-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=... -e MYSQL_DATABASE=umkm_db mysql:8`)
- Node/npm (hanya untuk toolchain build mobile Capacitor)
- Android SDK (untuk build Android) / macOS + Xcode (untuk build iOS)

---

## Instalasi & Menjalankan

### 1. Backend ERP

```bash
cd UMKM
bun install

# siapkan environment (lihat bagian Konfigurasi)
cp .env.example .env      # lalu isi nilainya

# inisialisasi database
mysql -u root -p umkm_db < schema.sql
bun run src/seed.ts       # membuat user admin awal

# jalankan
bun run index.ts          # server di http://localhost:8030
```

### 2. Frontend (development)

```bash
cd UMKM
bun run dev:ui            # Vite dev server (hot reload)
# atau build produksi yang di-serve backend:
bun run build             # menghasilkan dist/
```

Di produksi, backend menyajikan `dist/` sekaligus `/api/*`, jadi cukup jalankan `index.ts`.

### 3. Bot WhatsApp

```bash
cd UMKM-WA-Bot
bun install
cp .env.example .env      # isi UMKM_API_KEY (harus cocok dengan backend)
bun run index.ts          # scan QR di terminal saat pertama kali
```

---

## Konfigurasi Environment

Semua rahasia lewat environment variable — **tidak ada** yang di-commit. Salin `.env.example` di tiap subproject.

**UMKM/.env**
```
PORT=8030
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=...
DB_NAME=umkm_db
AI_GATEWAY_URL=http://localhost:20128/v1
AI_VISION_MODEL=...
AI_API_KEY=...
SEED_ADMIN_PASSWORD=...        # opsional, override password admin awal
```

**UMKM-WA-Bot/.env**
```
BOT_PORT=8031
UMKM_API_BASE=http://127.0.0.1:8030
UMKM_API_KEY=...               # shared secret, cocokkan dengan backend
```

---

## Bot WhatsApp

- Saat pertama dijalankan, bot menampilkan **QR code** di terminal — scan dari WhatsApp (Perangkat Tertaut). Sesi disimpan di `auth_info_baileys/` (di-gitignore, **jangan pernah di-commit** — setara akses penuh akun).
- Whitelist nomor disimpan di `whitelist.json` (di-gitignore, berisi PII).
- Hubungkan akun: dari WhatsApp kirim `/setup UMK-XXXX` (UID dari dashboard), atau kelola whitelist via dashboard.

---

## Build Aplikasi Mobile

```bash
cd UMKM

# Android → APK debug + AAB release di out/Android/
bun run build:android

# iOS → archive Xcode (WAJIB macOS + Xcode)
bun run build:ios
```

Catatan:
- Sinkronisasi aset web ke native: `bun run build:mobile` (`vite build && cap sync`).
- **iOS hanya bisa di-build di macOS** (butuh Xcode + code signing Apple). AAB release perlu ditandatangani keystore sebelum upload ke Play Store.

---

## Ringkasan API

Semua endpoint di bawah `/api`, otentikasi via cookie sesi (atau `Authorization: Bearer` untuk bot dengan API key).

- **Auth**: `/api/auth/login`, `/logout`, `/me`, `/profile`, `/change-password`
- **Penjualan**: `/api/daily-sales`, `/daily-sales/waste`, `/api/order-dates`, `/api/upcoming-orders`
- **OPEX**: `/api/opex`, `/api/opex/scan` (AI receipt scanning)
- **Inventaris**: `/api/items`
- **Analitik**: `/api/analytics/daily`, `/analytics/breakdown/{revenue,opex,waste}`
- **Bisnis**: `/api/business-info`, `/api/upload/{logo,avatar}`
- **Pengguna** (admin): `/api/users`, `/api/users/regenerate-uid`, `/api/api-keys`
- **WA Bot**: `/api/wa-bot/{status,connect,disconnect,whitelist,reminder-settings}`, `/api/wa/setup`
- **Utilitas**: `/api/health`, `/api/wilayah`, `/api/address-search`

---

## Keamanan

- Login **UID-only** — tidak bisa login pakai display name; password selalu diverifikasi (opsi "Ingat saya" hanya mengubah durasi sesi, bukan bypass).
- Data tersegmentasi per tenant di seluruh endpoint.
- Rahasia (DB password, API key, kredensial AI, sesi WhatsApp) **tidak pernah** masuk repo — dikelola via env & `.gitignore`.
- Session cookie: `HttpOnly`, `SameSite=Lax`, token 64-hex; TTL 7 hari (90 hari bila "Ingat saya").

---

All Rights Reserved &copy; 2026 - SkyUniverse Technology
