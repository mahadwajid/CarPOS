const { getDb } = require('../db')

// ─── List borrowed sales with filters ───────────────────────────────────────
function getAll({ startDate, endDate, status, search, limit = 100, offset = 0 } = {}) {
  const db = getDb()
  let where = []
  let params = []

  if (startDate) { where.push('bs.sale_date >= ?'); params.push(startDate) }
  if (endDate) { where.push('bs.sale_date <= ?'); params.push(endDate) }
  if (status) { where.push('bs.status = ?'); params.push(status) }
  if (search) {
    where.push("(bs.supplier_name LIKE ? OR bs.product_name LIKE ? OR bs.buyer_name LIKE ?)")
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

  const rows = db.prepare(`
    SELECT bs.*
    FROM borrowed_sales bs
    ${whereClause}
    ORDER BY bs.sale_date DESC, bs.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  const total = db.prepare(`SELECT COUNT(*) as count FROM borrowed_sales bs ${whereClause}`).get(...params)

  return { success: true, data: rows, total: total.count }
}

// ─── Get single borrowed sale ───────────────────────────────────────────────
function getById(id) {
  const db = getDb()
  const row = db.prepare('SELECT * FROM borrowed_sales WHERE id = ?').get(id)
  if (!row) return { success: false, message: 'Record not found' }
  return { success: true, data: row }
}

// ─── Create borrowed sale ───────────────────────────────────────────────────
function create({ supplier_name, supplier_phone, product_name, product_desc, cost_price, sell_price, quantity, buyer_name, payment_method, notes, sale_date, user_id }) {
  const db = getDb()
  if (!supplier_name || !product_name) return { success: false, message: 'Supplier name and product name are required' }
  if (!cost_price || !sell_price) return { success: false, message: 'Cost price and sell price are required' }

  const qty = quantity || 1
  const totalCost = parseFloat(cost_price) * qty
  const totalSell = parseFloat(sell_price) * qty
  const profit = totalSell - totalCost

  const result = db.prepare(`
    INSERT INTO borrowed_sales (supplier_name, supplier_phone, product_name, product_desc, cost_price, sell_price, profit, quantity, buyer_name, payment_method, notes, sale_date, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    supplier_name,
    supplier_phone || null,
    product_name,
    product_desc || null,
    totalCost,
    totalSell,
    profit,
    qty,
    buyer_name || null,
    payment_method || 'cash',
    notes || null,
    sale_date || new Date().toISOString().split('T')[0],
    user_id || null
  )

  return { success: true, id: result.lastInsertRowid, message: `Borrowed sale added — Profit: Rs ${profit.toFixed(2)}` }
}

// ─── Update borrowed sale ───────────────────────────────────────────────────
function update({ id, supplier_name, supplier_phone, product_name, product_desc, cost_price, sell_price, quantity, buyer_name, payment_method, notes, sale_date, status }) {
  const db = getDb()
  if (!id) return { success: false, message: 'Record ID is required' }

  const existing = db.prepare('SELECT id FROM borrowed_sales WHERE id = ?').get(id)
  if (!existing) return { success: false, message: 'Record not found' }

  const qty = quantity || 1
  const totalCost = parseFloat(cost_price) * qty
  const totalSell = parseFloat(sell_price) * qty
  const profit = totalSell - totalCost

  const settled_date = status === 'settled' ? new Date().toISOString().split('T')[0] : null

  db.prepare(`
    UPDATE borrowed_sales SET
      supplier_name = COALESCE(?, supplier_name),
      supplier_phone = ?,
      product_name = COALESCE(?, product_name),
      product_desc = ?,
      cost_price = ?,
      sell_price = ?,
      profit = ?,
      quantity = ?,
      buyer_name = ?,
      payment_method = COALESCE(?, payment_method),
      notes = ?,
      sale_date = COALESCE(?, sale_date),
      status = COALESCE(?, status),
      settled_date = COALESCE(?, settled_date)
    WHERE id = ?
  `).run(
    supplier_name,
    supplier_phone || null,
    product_name,
    product_desc || null,
    totalCost, totalSell, profit, qty,
    buyer_name || null,
    payment_method,
    notes || null,
    sale_date,
    status,
    settled_date,
    id
  )

  return { success: true, message: 'Record updated successfully' }
}

// ─── Mark as settled ────────────────────────────────────────────────────────
function markSettled(id) {
  const db = getDb()
  const existing = db.prepare('SELECT id, status FROM borrowed_sales WHERE id = ?').get(id)
  if (!existing) return { success: false, message: 'Record not found' }

  const newStatus = existing.status === 'settled' ? 'unsettled' : 'settled'
  const settled_date = newStatus === 'settled' ? new Date().toISOString().split('T')[0] : null

  db.prepare('UPDATE borrowed_sales SET status = ?, settled_date = ? WHERE id = ?').run(newStatus, settled_date, id)
  return { success: true, message: `Marked as ${newStatus}`, status: newStatus }
}

// ─── Delete borrowed sale ───────────────────────────────────────────────────
function remove(id) {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM borrowed_sales WHERE id = ?').get(id)
  if (!existing) return { success: false, message: 'Record not found' }

  db.prepare('DELETE FROM borrowed_sales WHERE id = ?').run(id)
  return { success: true, message: 'Record deleted successfully' }
}

// ─── Summary / Stats ────────────────────────────────────────────────────────
function getSummary({ startDate, endDate } = {}) {
  const db = getDb()
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const end = endDate || new Date().toISOString().split('T')[0]

  const totals = db.prepare(`
    SELECT
      COUNT(*) as count,
      COALESCE(SUM(sell_price), 0) as total_revenue,
      COALESCE(SUM(cost_price), 0) as total_cost,
      COALESCE(SUM(profit), 0) as total_profit,
      COALESCE(SUM(CASE WHEN status = 'unsettled' THEN cost_price ELSE 0 END), 0) as unsettled_amount,
      COALESCE(SUM(CASE WHEN status = 'settled' THEN cost_price ELSE 0 END), 0) as settled_amount
    FROM borrowed_sales
    WHERE sale_date BETWEEN ? AND ?
  `).get(start, end)

  // By supplier
  const bySupplier = db.prepare(`
    SELECT
      supplier_name,
      COUNT(*) as count,
      COALESCE(SUM(profit), 0) as total_profit,
      COALESCE(SUM(CASE WHEN status = 'unsettled' THEN cost_price ELSE 0 END), 0) as unsettled
    FROM borrowed_sales
    WHERE sale_date BETWEEN ? AND ?
    GROUP BY supplier_name
    ORDER BY total_profit DESC
  `).all(start, end)

  return { success: true, data: totals, bySupplier }
}

module.exports = { getAll, getById, create, update, remove, markSettled, getSummary }
