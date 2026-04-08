const Database = require('better-sqlite3')
const path = require('path')
const { app } = require('electron')
const fs = require('fs')

let db

function getDb() {
  return db
}

function initDatabase() {
  const dbPath = app
    ? path.join(app.getPath('userData'), 'carpos.db')
    : path.join(__dirname, '../../carpos.db')

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createSchema()
  seedDefaults()

  console.log('[DB] Initialized at:', dbPath)
  return db
}

function createSchema() {
  db.exec(`
    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL UNIQUE,
      created_at TEXT    DEFAULT (datetime('now'))
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      barcode       TEXT    UNIQUE,
      price         REAL    NOT NULL DEFAULT 0,
      cost          REAL    NOT NULL DEFAULT 0,
      stock         INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      unit          TEXT    DEFAULT 'pcs',
      description   TEXT,
      is_active     INTEGER DEFAULT 1,
      created_at    TEXT    DEFAULT (datetime('now')),
      updated_at    TEXT    DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_products_barcode    ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_category   ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_name       ON products(name);

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      phone      TEXT,
      email      TEXT,
      address    TEXT,
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

    -- Sales
    CREATE TABLE IF NOT EXISTS sales (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT    NOT NULL UNIQUE,
      customer_id    INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      subtotal       REAL    NOT NULL DEFAULT 0,
      discount       REAL    NOT NULL DEFAULT 0,
      discount_type  TEXT    DEFAULT 'fixed',
      tax_rate       REAL    NOT NULL DEFAULT 0,
      tax_amount     REAL    NOT NULL DEFAULT 0,
      total          REAL    NOT NULL DEFAULT 0,
      paid_amount    REAL    NOT NULL DEFAULT 0,
      change_amount  REAL    NOT NULL DEFAULT 0,
      payment_method TEXT    DEFAULT 'cash',
      notes          TEXT,
      cashier_id     INTEGER,
      status         TEXT    DEFAULT 'completed',
      created_at     TEXT    DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sales_invoice    ON sales(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_customer   ON sales(customer_id);

    -- Sale Items
    CREATE TABLE IF NOT EXISTS sale_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id     INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      product_name TEXT   NOT NULL,
      price       REAL    NOT NULL,
      cost        REAL    NOT NULL DEFAULT 0,
      quantity    INTEGER NOT NULL DEFAULT 1,
      discount    REAL    NOT NULL DEFAULT 0,
      subtotal    REAL    NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_sale_items_sale    ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

    -- Inventory Logs
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      type        TEXT    NOT NULL, -- 'sale','restock','adjustment','initial'
      quantity    INTEGER NOT NULL,
      before_qty  INTEGER NOT NULL,
      after_qty   INTEGER NOT NULL,
      reference   TEXT,
      notes       TEXT,
      user_id     INTEGER,
      created_at  TEXT    DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_inv_logs_product    ON inventory_logs(product_id);
    CREATE INDEX IF NOT EXISTS idx_inv_logs_created_at ON inventory_logs(created_at);

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      name       TEXT    NOT NULL,
      role       TEXT    NOT NULL DEFAULT 'cashier',  -- 'admin' | 'cashier'
      is_active  INTEGER DEFAULT 1,
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now'))
    );

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

function seedDefaults() {
  // Default admin user (password: admin123)
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
  if (!existingAdmin) {
    const bcrypt = require('bcryptjs')
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare(`
      INSERT INTO users (username, password, name, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', hash, 'Administrator', 'admin')
  }

  // Default settings
  const defaults = [
    ['shop_name',       'CarPOS Store'],
    ['shop_address',    '123 Main Street'],
    ['shop_phone',      '+1 (555) 000-0000'],
    ['shop_email',      'store@carpos.com'],
    ['currency',        'PKR'],
    ['currency_symbol', 'Rs '],
    ['tax_rate',        '0'],
    ['tax_name',        'Tax'],
    ['receipt_footer',  'Thank you for your purchase!'],
    ['low_stock_threshold', '10'],
    ['invoice_prefix',  'INV'],
  ]
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `)
  for (const [k, v] of defaults) insertSetting.run(k, v)

  // Default category
  db.prepare(`INSERT OR IGNORE INTO categories (name) VALUES (?)`).run('General')
}

module.exports = { initDatabase, getDb }
