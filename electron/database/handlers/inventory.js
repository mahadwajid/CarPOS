const { getDb } = require('../db')

function getLogs({ product_id, type, startDate, endDate, page = 1, limit = 50 } = {}) {
  const db = getDb()
  let where = []
  let params = []

  if (product_id) { where.push('il.product_id = ?'); params.push(product_id) }
  if (type)        { where.push('il.type = ?');       params.push(type)       }
  if (startDate)   { where.push(`date(il.created_at) >= date(?)`); params.push(startDate) }
  if (endDate)     { where.push(`date(il.created_at) <= date(?)`); params.push(endDate)   }

  const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const rows = db.prepare(`
    SELECT il.*, p.name as product_name, p.unit
    FROM inventory_logs il
    LEFT JOIN products p ON il.product_id = p.id
    ${whereStr}
    ORDER BY il.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM inventory_logs il ${whereStr}
  `).get(...params).count

  return { success: true, data: rows, total }
}

function restock({ product_id, quantity, notes, user_id }) {
  const db = getDb()
  const product = db.prepare(`SELECT stock FROM products WHERE id = ?`).get(product_id)
  if (!product) return { success: false, message: 'Product not found' }
  if (quantity <= 0) return { success: false, message: 'Quantity must be positive' }

  const beforeQty = product.stock
  const afterQty = beforeQty + quantity

  db.prepare(`UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?`).run(afterQty, product_id)
  db.prepare(`
    INSERT INTO inventory_logs (product_id, type, quantity, before_qty, after_qty, notes, user_id)
    VALUES (?, 'restock', ?, ?, ?, ?, ?)
  `).run(product_id, quantity, beforeQty, afterQty, notes || 'Restock', user_id || null)

  return { success: true, newStock: afterQty }
}

function adjust({ product_id, quantity, notes, user_id }) {
  const db = getDb()
  const product = db.prepare(`SELECT stock FROM products WHERE id = ?`).get(product_id)
  if (!product) return { success: false, message: 'Product not found' }

  const beforeQty = product.stock
  const afterQty = Math.max(0, beforeQty + quantity)

  db.prepare(`UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?`).run(afterQty, product_id)
  db.prepare(`
    INSERT INTO inventory_logs (product_id, type, quantity, before_qty, after_qty, notes, user_id)
    VALUES (?, 'adjustment', ?, ?, ?, ?, ?)
  `).run(product_id, quantity, beforeQty, afterQty, notes || 'Manual adjustment', user_id || null)

  return { success: true, newStock: afterQty }
}

function getProductStock(product_id) {
  const db = getDb()
  const product = db.prepare(`SELECT id, name, stock, unit, low_stock_threshold FROM products WHERE id = ?`).get(product_id)
  return { success: true, data: product }
}

module.exports = { getLogs, restock, adjust, getProductStock }
