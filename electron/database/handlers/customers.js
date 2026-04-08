const { getDb } = require('../db')

function getAll() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT c.*,
      COUNT(s.id) as total_purchases,
      COALESCE(SUM(s.total), 0) as total_spent
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `).all()
  return { success: true, data: rows }
}

function getById(id) {
  const db = getDb()
  const row = db.prepare(`SELECT * FROM customers WHERE id = ?`).get(id)
  return { success: true, data: row }
}

function search(q) {
  const db = getDb()
  const term = `%${q}%`
  const rows = db.prepare(`
    SELECT * FROM customers
    WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
    LIMIT 20
  `).all(term, term, term)
  return { success: true, data: rows }
}

function create({ name, phone, email, address }) {
  const db = getDb()
  try {
    const result = db.prepare(`
      INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)
    `).run(name, phone || null, email || null, address || null)
    return { success: true, id: result.lastInsertRowid }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

function update({ id, name, phone, email, address }) {
  const db = getDb()
  db.prepare(`
    UPDATE customers SET name=?, phone=?, email=?, address=?, updated_at=datetime('now') WHERE id=?
  `).run(name, phone || null, email || null, address || null, id)
  return { success: true }
}

function remove(id) {
  const db = getDb()
  // Unlink sales instead of deleting customer
  db.prepare(`UPDATE sales SET customer_id = NULL WHERE customer_id = ?`).run(id)
  db.prepare(`DELETE FROM customers WHERE id = ?`).run(id)
  return { success: true }
}

function getPurchaseHistory(customerId) {
  const db = getDb()
  const sales = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
    FROM sales s
    WHERE s.customer_id = ?
    ORDER BY s.created_at DESC
  `).all(customerId)
  return { success: true, data: sales }
}

module.exports = { getAll, getById, search, create, update, remove, getPurchaseHistory }
