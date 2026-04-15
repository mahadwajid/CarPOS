const { getDb } = require('../db')

// ─── List expenses with filters ─────────────────────────────────────────────
function getAll({ startDate, endDate, categoryId, search, paymentMethod, limit = 100, offset = 0 } = {}) {
  const db = getDb()
  let where = []
  let params = []

  if (startDate) { where.push('e.expense_date >= ?'); params.push(startDate) }
  if (endDate)   { where.push('e.expense_date <= ?'); params.push(endDate) }
  if (categoryId) { where.push('e.expense_category_id = ?'); params.push(categoryId) }
  if (paymentMethod) { where.push('e.payment_method = ?'); params.push(paymentMethod) }
  if (search) { where.push("(e.title LIKE ? OR e.description LIKE ?)"); params.push(`%${search}%`, `%${search}%`) }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

  const rows = db.prepare(`
    SELECT e.*, ec.name as category_name, ec.icon as category_icon, ec.color as category_color
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.expense_category_id = ec.id
    ${whereClause}
    ORDER BY e.expense_date DESC, e.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  const total = db.prepare(`SELECT COUNT(*) as count FROM expenses e ${whereClause}`).get(...params)

  return { success: true, data: rows, total: total.count }
}

// ─── Get single expense ─────────────────────────────────────────────────────
function getById(id) {
  const db = getDb()
  const row = db.prepare(`
    SELECT e.*, ec.name as category_name, ec.icon as category_icon, ec.color as category_color
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.expense_category_id = ec.id
    WHERE e.id = ?
  `).get(id)
  if (!row) return { success: false, message: 'Expense not found' }
  return { success: true, data: row }
}

// ─── Create expense ─────────────────────────────────────────────────────────
function create({ title, amount, expense_category_id, description, payment_method, reference, is_recurring, recurring_period, expense_date, user_id }) {
  const db = getDb()
  if (!title || !amount) return { success: false, message: 'Title and amount are required' }

  const result = db.prepare(`
    INSERT INTO expenses (title, amount, expense_category_id, description, payment_method, reference, is_recurring, recurring_period, expense_date, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    amount,
    expense_category_id || null,
    description || null,
    payment_method || 'cash',
    reference || null,
    is_recurring ? 1 : 0,
    recurring_period || null,
    expense_date || new Date().toISOString().split('T')[0],
    user_id || null
  )

  return { success: true, id: result.lastInsertRowid, message: 'Expense added successfully' }
}

// ─── Update expense ─────────────────────────────────────────────────────────
function update({ id, title, amount, expense_category_id, description, payment_method, reference, is_recurring, recurring_period, expense_date }) {
  const db = getDb()
  if (!id) return { success: false, message: 'Expense ID is required' }

  const existing = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id)
  if (!existing) return { success: false, message: 'Expense not found' }

  db.prepare(`
    UPDATE expenses SET
      title = COALESCE(?, title),
      amount = COALESCE(?, amount),
      expense_category_id = ?,
      description = ?,
      payment_method = COALESCE(?, payment_method),
      reference = ?,
      is_recurring = ?,
      recurring_period = ?,
      expense_date = COALESCE(?, expense_date)
    WHERE id = ?
  `).run(
    title, amount,
    expense_category_id || null,
    description || null,
    payment_method,
    reference || null,
    is_recurring ? 1 : 0,
    recurring_period || null,
    expense_date, id
  )

  return { success: true, message: 'Expense updated successfully' }
}

// ─── Delete expense ─────────────────────────────────────────────────────────
function remove(id) {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id)
  if (!existing) return { success: false, message: 'Expense not found' }

  db.prepare('DELETE FROM expenses WHERE id = ?').run(id)
  return { success: true, message: 'Expense deleted successfully' }
}

// ─── Get expense categories ─────────────────────────────────────────────────
function getCategories() {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM expense_categories ORDER BY name').all()
  return { success: true, data: rows }
}

// ─── Create expense category ────────────────────────────────────────────────
function createCategory({ name, icon, color }) {
  const db = getDb()
  if (!name) return { success: false, message: 'Category name is required' }
  try {
    const result = db.prepare('INSERT INTO expense_categories (name, icon, color) VALUES (?, ?, ?)').run(name, icon || 'receipt', color || '#6366f1')
    return { success: true, id: result.lastInsertRowid, message: 'Category created' }
  } catch (err) {
    if (err.message.includes('UNIQUE')) return { success: false, message: 'Category already exists' }
    throw err
  }
}

// ─── Expense summary (by category for a date range) ─────────────────────────
function getSummary({ startDate, endDate } = {}) {
  const db = getDb()
  const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const end = endDate || new Date().toISOString().split('T')[0]

  const rows = db.prepare(`
    SELECT
      ec.id as category_id,
      COALESCE(ec.name, 'Uncategorized') as category_name,
      ec.icon as category_icon,
      ec.color as category_color,
      COUNT(e.id) as count,
      COALESCE(SUM(e.amount), 0) as total
    FROM expenses e
    LEFT JOIN expense_categories ec ON e.expense_category_id = ec.id
    WHERE e.expense_date BETWEEN ? AND ?
    GROUP BY e.expense_category_id
    ORDER BY total DESC
  `).all(start, end)

  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0)
  return { success: true, data: rows, grandTotal }
}

// ─── Monthly expense trend for the year ─────────────────────────────────────
function getMonthlyTrend(year) {
  const db = getDb()
  const y = year || new Date().getFullYear()

  const rows = db.prepare(`
    SELECT
      strftime('%Y-%m', expense_date) as period,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE strftime('%Y', expense_date) = ?
    GROUP BY period
    ORDER BY period
  `).all(String(y))

  return { success: true, data: rows }
}

module.exports = { getAll, getById, create, update, remove, getCategories, createCategory, getSummary, getMonthlyTrend }
