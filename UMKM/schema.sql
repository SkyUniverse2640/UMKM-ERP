-- UMKM Accounting & Inventory Schema (MySQL 8.0+)
CREATE DATABASE IF NOT EXISTS umkm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE umkm_db;

-- 1. Authentication & Multi-User (roles: admin | user)
-- Login is by wa_uid (UID), not username/display_name.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin','user') NOT NULL DEFAULT 'user',
    wa_uid VARCHAR(16) NULL UNIQUE,          -- login ID + WhatsApp setup code: /setup <UID>
    wa_jid VARCHAR(64) NULL UNIQUE,          -- bound WhatsApp number, stored as <digits>@s.whatsapp.net
    wa_bound_at DATETIME NULL,               -- when the number was bound
    display_name VARCHAR(100) NULL,
    avatar_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1b. API Keys for external Bot and Automation Integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(64) NOT NULL UNIQUE,
    created_by INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY, -- Secure random session token
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sessions_expires (expires_at)
) ENGINE=InnoDB;

-- 1c. Business Information & Settings (per-user profile)
CREATE TABLE IF NOT EXISTS business_info (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NULL UNIQUE,
    business_name VARCHAR(150) NOT NULL,
    business_address TEXT NULL,
    business_logo TEXT NULL,
    business_email VARCHAR(100) NULL,
    business_telephone VARCHAR(50) NULL,
    business_province VARCHAR(100) NULL,
    business_regency VARCHAR(100) NULL,
    business_district VARCHAR(100) NULL,
    business_village VARCHAR(100) NULL,
    business_address_detail VARCHAR(255) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Master Data - Sales Items (per-user)
CREATE TABLE IF NOT EXISTS master_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    group_name VARCHAR(100) NULL,
    current_price DECIMAL(12, 2) NOT NULL CHECK (current_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_item_user_name (user_id, name),
    INDEX idx_mi_user (user_id),
    INDEX idx_group_name (group_name)
) ENGINE=InnoDB;

-- 3. Master Data - Cost / Operational Expenditures (OpEx) (per-user)
CREATE TABLE IF NOT EXISTS opex_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    price_paid DECIMAL(12, 2) NOT NULL CHECK (price_paid >= 0),
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    measurement ENUM('Box', 'Pcs', 'Kilo', 'Litre', 'Sachet') NOT NULL,
    expense_date DATE NOT NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ox_user (user_id),
    INDEX idx_opex_date (expense_date)
) ENGINE=InnoDB;

-- 4. Daily Operations (Periodic Inventory & Sales Snapshot)
-- IMMUTABILITY RULE: snapshotted_unit_price is stored at entry time.
-- PERIODIC FORMULA: sold_quantity = (starting_stock + restock_quantity) - leftover_quantity - waste_quantity.
CREATE TABLE IF NOT EXISTS daily_sales_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    entry_date DATE NOT NULL,
    item_id INT NOT NULL,
    buyer_name VARCHAR(100) NULL,
    starting_stock INT NOT NULL CHECK (starting_stock >= 0),
    restock_quantity INT NOT NULL DEFAULT 0 CHECK (restock_quantity >= 0),
    leftover_quantity INT NOT NULL CHECK (leftover_quantity >= 0),
    waste_quantity INT NOT NULL CHECK (waste_quantity >= 0), -- Mandatory waste tracking
    sold_quantity INT GENERATED ALWAYS AS (
        (starting_stock + restock_quantity) - leftover_quantity - waste_quantity
    ) STORED,
    snapshotted_unit_price DECIMAL(12, 2) NOT NULL CHECK (snapshotted_unit_price >= 0),
    total_revenue DECIMAL(12, 2) GENERATED ALWAYS AS (
        sold_quantity * snapshotted_unit_price
    ) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date_item (entry_date, item_id),
    INDEX idx_ds_user (user_id),
    FOREIGN KEY (item_id) REFERENCES master_items(id) ON DELETE RESTRICT,
    INDEX idx_entry_date (entry_date),
    CONSTRAINT chk_stock_balance CHECK (
        (starting_stock + restock_quantity) >= (leftover_quantity + waste_quantity)
    )
) ENGINE=InnoDB;
