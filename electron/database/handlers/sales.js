const { getDb } = require('../db')

function generateInvoiceNumber() {
  const db = getDb()
  const settings = db.prepare(`SELECT value FROM settings WHERE key = 'invoice_prefix'`).get()
  const prefix = settings?.value || 'INV'
  const now = new Date()
  const datePart = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  const last = db.prepare(`
    SELECT invoice_number FROM sales ORDER BY id DESC LIMIT 1
  `).get()
  let seq = 1
  if (last) {
    const parts = last.invoice_number.split('-')
    const lastNum = parseInt(parts[parts.length - 1]) || 0
    seq = lastNum + 1
  }
  return `${prefix}-${datePart}-${String(seq).padStart(4, '0')}`
}

function create(saleData) {
  const db = getDb()
  const {
    items, customer_id, subtotal, discount, discount_type,
    tax_rate, tax_amount, total, paid_amount, change_amount,
    payment_method, notes, cashier_id,
  } = saleData

  if (!items?.length) return { success: false, message: 'No items in sale' }

  const invoiceNumber = generateInvoiceNumber()

  const insertSale = db.transaction(() => {
    // Insert sale header
    const saleResult = db.prepare(`
      INSERT INTO sales (
        invoice_number, customer_id, subtotal, discount, discount_type,
        tax_rate, tax_amount, total, paid_amount, change_amount,
        payment_method, notes, cashier_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceNumber, customer_id || null, subtotal, discount || 0,
      discount_type || 'fixed', tax_rate || 0, tax_amount || 0,
      total, paid_amount, change_amount || 0,
      payment_method || 'cash', notes || null, cashier_id || null
    )

    const saleId = saleResult.lastInsertRowid

    // Insert sale items & update stock
    const insertItem = db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, product_name, price, cost, quantity, discount, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const updateStock = db.prepare(`
      UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?
    `)
    const logInventory = db.prepare(`
      INSERT INTO inventory_logs (product_id, type, quantity, before_qty, after_qty, reference, notes)
      VALUES (?, 'sale', ?, ?, ?, ?, 'Sold via POS')
    `)

    for (const item of items) {
      // Validate stock
      const product = db.prepare(`SELECT stock FROM products WHERE id = ?`).get(item.product_id)
      if (!product) throw new Error(`Product ID ${item.product_id} not found`)
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${item.product_name}"`)
      }

      insertItem.run(
        saleId, item.product_id, item.product_name,
        item.price, item.cost || 0, item.quantity,
        item.discount || 0, item.subtotal
      )

      const beforeQty = product.stock
      const afterQty = beforeQty - item.quantity
      updateStock.run(item.quantity, item.product_id)
      logInventory.run(item.product_id, item.quantity, beforeQty, afterQty, invoiceNumber)
    }

    return saleId
  })

  try {
    const saleId = insertSale()
    return { success: true, saleId, invoiceNumber }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

function getAll({ page = 1, limit = 50, search = '', startDate = '', endDate = '', payment_method = '' } = {}) {
  const db = getDb()
  let whereClauses = []
  let params = []

  if (search) {
    whereClauses.push(`(s.invoice_number LIKE ? OR c.name LIKE ?)`)
    params.push(`%${search}%`, `%${search}%`)
  }
  if (startDate) { whereClauses.push(`date(s.created_at) >= date(?)`); params.push(startDate) }
  if (endDate)   { whereClauses.push(`date(s.created_at) <= date(?)`); params.push(endDate) }
  if (payment_method) { whereClauses.push(`s.payment_method = ?`); params.push(payment_method) }

  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''
  const offset = (page - 1) * limit

  const rows = db.prepare(`
    SELECT s.*, c.name as customer_name,
      (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as item_count
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    ${where}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset)

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM sales s LEFT JOIN customers c ON s.customer_id = c.id ${where}
  `).get(...params).count

  return { success: true, data: rows, total, page, limit }
}

function getById(id) {
  const db = getDb()
  const sale = db.prepare(`
    SELECT s.*, c.name as customer_name, c.phone as customer_phone
    FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.id = ?
  `).get(id)
  if (!sale) return { success: false, message: 'Sale not found' }

  const items = db.prepare(`
    SELECT si.*, p.barcode FROM sale_items si
    LEFT JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `).all(id)

  return { success: true, data: { ...sale, items } }
}

function getSaleItems(saleId) {
  const db = getDb()
  const items = db.prepare(`
    SELECT si.*, p.barcode FROM sale_items si
    LEFT JOIN products p ON si.product_id = p.id
    WHERE si.sale_id = ?
  `).all(saleId)
  return { success: true, data: items }
}

function remove(id) {
  const db = getDb()
  // Restore stock
  const items = db.prepare(`SELECT * FROM sale_items WHERE sale_id = ?`).all(id)
  const restoreStock = db.transaction(() => {
    for (const item of items) {
      const product = db.prepare(`SELECT stock FROM products WHERE id = ?`).get(item.product_id)
      if (product) {
        db.prepare(`UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?`)
          .run(item.quantity, item.product_id)
        db.prepare(`
          INSERT INTO inventory_logs (product_id, type, quantity, before_qty, after_qty, notes)
          VALUES (?, 'adjustment', ?, ?, ?, 'Sale voided')
        `).run(item.product_id, item.quantity, product.stock, product.stock + item.quantity)
      }
    }
    db.prepare(`DELETE FROM sales WHERE id = ?`).run(id)
  })
  try {
    restoreStock()
    return { success: true }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

function getDaily(date) {
  const db = getDb()
  const d = date || new Date().toISOString().split('T')[0]
  const rows = db.prepare(`
    SELECT s.*, c.name as customer_name
    FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
    WHERE date(s.created_at) = date(?)
    ORDER BY s.created_at DESC
  `).all(d)
  const summary = db.prepare(`
    SELECT COUNT(*) as count, SUM(total) as revenue, SUM(tax_amount) as tax, SUM(discount) as discount
    FROM sales WHERE date(created_at) = date(?)
  `).get(d)
  return { success: true, data: rows, summary }
}

function getMonthly(month) {
  const db = getDb()
  const m = month || new Date().toISOString().slice(0, 7)
  const rows = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count, SUM(total) as revenue
    FROM sales
    WHERE strftime('%Y-%m', created_at) = ?
    GROUP BY date(created_at)
    ORDER BY date
  `).all(m)
  return { success: true, data: rows }
}

module.exports = { create, getAll, getById, getSaleItems, remove, getDaily, getMonthly }
