const { getDb } = require('../db')

function getDashboard() {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  const todaySales = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
    FROM sales WHERE date(created_at) = date(?)
  `).get(today)

  const monthSales = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
    FROM sales WHERE strftime('%Y-%m', created_at) = ?
  `).get(thisMonth)

  const totalProducts = db.prepare(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`).get()
  const lowStockCount = db.prepare(`SELECT COUNT(*) as count FROM products WHERE stock <= low_stock_threshold AND is_active = 1`).get()
  const totalCustomers = db.prepare(`SELECT COUNT(*) as count FROM customers`).get()

  const recentSales = db.prepare(`
    SELECT s.*, c.name as customer_name
    FROM sales s LEFT JOIN customers c ON s.customer_id = c.id
    ORDER BY s.created_at DESC LIMIT 5
  `).all()

  const topProducts = db.prepare(`
    SELECT p.name, SUM(si.quantity) as total_sold, SUM(si.subtotal) as revenue
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales sa ON si.sale_id = sa.id
    WHERE date(sa.created_at) >= date('now', '-30 days')
    GROUP BY si.product_id
    ORDER BY total_sold DESC LIMIT 5
  `).all()

  const last7Days = db.prepare(`
    SELECT date(created_at) as date,
      COUNT(*) as count,
      COALESCE(SUM(total), 0) as revenue
    FROM sales
    WHERE date(created_at) >= date('now', '-6 days')
    GROUP BY date(created_at)
    ORDER BY date
  `).all()

  return {
    success: true,
    data: {
      todaySales,
      monthSales,
      totalProducts: totalProducts.count,
      lowStockCount: lowStockCount.count,
      totalCustomers: totalCustomers.count,
      recentSales,
      topProducts,
      last7Days,
    }
  }
}

function getSalesByDate({ startDate, endDate } = {}) {
  const db = getDb()
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const end   = endDate   || new Date().toISOString().split('T')[0]

  const rows = db.prepare(`
    SELECT date(created_at) as date,
      COUNT(*) as count,
      COALESCE(SUM(total), 0) as revenue,
      COALESCE(SUM(tax_amount), 0) as tax,
      COALESCE(SUM(discount), 0) as discount
    FROM sales
    WHERE date(created_at) BETWEEN date(?) AND date(?)
    GROUP BY date(created_at)
    ORDER BY date
  `).all(start, end)

  return { success: true, data: rows }
}

function getTopProducts({ startDate, endDate, limit = 10 } = {}) {
  const db = getDb()
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const end   = endDate   || new Date().toISOString().split('T')[0]

  const rows = db.prepare(`
    SELECT
      p.id, p.name, p.price,
      c.name as category_name,
      SUM(si.quantity) as total_sold,
      SUM(si.subtotal) as revenue,
      SUM(si.quantity * si.cost) as cost,
      SUM(si.subtotal) - SUM(si.quantity * si.cost) as profit
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    JOIN sales sa ON si.sale_id = sa.id
    WHERE date(sa.created_at) BETWEEN date(?) AND date(?)
    GROUP BY si.product_id
    ORDER BY total_sold DESC
    LIMIT ?
  `).all(start, end, limit)

  return { success: true, data: rows }
}

function getRevenue({ period = 'monthly', year } = {}) {
  const db = getDb()
  const y = year || new Date().getFullYear()

  let rows
  if (period === 'monthly') {
    rows = db.prepare(`
      SELECT
        strftime('%Y-%m', created_at) as period,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue,
        COALESCE(SUM(tax_amount), 0) as tax
      FROM sales
      WHERE strftime('%Y', created_at) = ?
      GROUP BY period
      ORDER BY period
    `).all(String(y))
  } else {
    rows = db.prepare(`
      SELECT
        strftime('%Y', created_at) as period,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM sales
      GROUP BY period ORDER BY period
    `).all()
  }

  return { success: true, data: rows }
}

function getCategoryBreakdown() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT
      c.name as category,
      COUNT(DISTINCT si.product_id) as products,
      SUM(si.quantity) as total_sold,
      SUM(si.subtotal) as revenue
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    GROUP BY p.category_id
    ORDER BY revenue DESC
  `).all()
  return { success: true, data: rows }
}

function getCustomerReport() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT
      c.id, c.name, c.phone,
      COUNT(s.id) as total_purchases,
      COALESCE(SUM(s.total), 0) as total_spent,
      MAX(s.created_at) as last_purchase
    FROM customers c
    LEFT JOIN sales s ON s.customer_id = c.id
    GROUP BY c.id
    ORDER BY total_spent DESC
  `).all()
  return { success: true, data: rows }
}

module.exports = { getDashboard, getSalesByDate, getTopProducts, getRevenue, getCategoryBreakdown, getCustomerReport }
