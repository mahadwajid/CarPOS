const { getDb } = require('../db')

function getAll() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.name
  `).all()
  return { success: true, data: rows }
}

function getById(id) {
  const db = getDb()
  const row = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(id)
  return { success: true, data: row }
}

function search(q) {
  const db = getDb()
  const term = `%${q}%`
  const rows = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE (p.name LIKE ? OR p.barcode LIKE ?) AND p.is_active = 1
    ORDER BY p.name LIMIT 50
  `).all(term, term)
  return { success: true, data: rows }
}

function getByBarcode(barcode) {
  const db = getDb()
  const row = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.barcode = ? AND p.is_active = 1
  `).get(barcode)
  return { success: true, data: row || null }
}

function getLowStock() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.stock <= p.low_stock_threshold AND p.is_active = 1
    ORDER BY p.stock ASC
  `).all()
  return { success: true, data: rows }
}

function create({ name, barcode, price, cost, stock, low_stock_threshold, category_id, unit, description }) {
  const db = getDb()
  try {
    const result = db.prepare(`
      INSERT INTO products (name, barcode, price, cost, stock, low_stock_threshold, category_id, unit, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, barcode || null, price, cost || 0, stock || 0,
      low_stock_threshold || 10, category_id || null, unit || 'pcs', description || null
    )
    // Log initial stock
    if (stock > 0) {
      db.prepare(`
        INSERT INTO inventory_logs (product_id, type, quantity, before_qty, after_qty, notes)
        VALUES (?, 'initial', ?, 0, ?, 'Initial stock')
      `).run(result.lastInsertRowid, stock, stock)
    }
    return { success: true, id: result.lastInsertRowid }
  } catch (err) {
    if (err.message.includes('UNIQUE')) return { success: false, message: 'Barcode already exists' }
    return { success: false, message: err.message }
  }
}

function update({ id, name, barcode, price, cost, stock, low_stock_threshold, category_id, unit, description, is_active }) {
  const db = getDb()
  try {
    const current = db.prepare(`SELECT stock FROM products WHERE id = ?`).get(id)
    db.prepare(`
      UPDATE products
      SET name=?, barcode=?, price=?, cost=?, stock=?, low_stock_threshold=?,
          category_id=?, unit=?, description=?, is_active=?, updated_at=datetime('now')
      WHERE id = ?
    `).run(
      name, barcode || null, price, cost || 0, stock,
      low_stock_threshold || 10, category_id || null, unit || 'pcs',
      description || null, is_active ?? 1, id
    )
    // Log if stock changed
    if (current && current.stock !== stock) {
      const diff = stock - current.stock
      db.prepare(`
        INSERT INTO inventory_logs (product_id, type, quantity, before_qty, after_qty, notes)
        VALUES (?, 'adjustment', ?, ?, ?, 'Manual stock update')
      `).run(id, diff, current.stock, stock)
    }
    return { success: true }
  } catch (err) {
    if (err.message.includes('UNIQUE')) return { success: false, message: 'Barcode already exists' }
    return { success: false, message: err.message }
  }
}

function remove(id) {
  const db = getDb()
  // Soft delete
  db.prepare(`UPDATE products SET is_active = 0, updated_at = datetime('now') WHERE id = ?`).run(id)
  return { success: true }
}

function getCategories() {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM categories ORDER BY name`).all()
  return { success: true, data: rows }
}

function createCategory({ name }) {
  const db = getDb()
  try {
    const result = db.prepare(`INSERT INTO categories (name) VALUES (?)`).run(name)
    return { success: true, id: result.lastInsertRowid }
  } catch (err) {
    if (err.message.includes('UNIQUE')) return { success: false, message: 'Category already exists' }
    return { success: false, message: err.message }
  }
}

module.exports = { getAll, getById, search, getByBarcode, getLowStock, create, update, remove, getCategories, createCategory }
