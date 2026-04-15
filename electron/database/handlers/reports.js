const { getDb } = require('../db')

function getDashboard() {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date().toISOString().slice(0, 7)

  const todaySales = db.prepare(`
    SELECT 
      COUNT(*) as count, 
      COALESCE(SUM(total), 0) as revenue,
      COALESCE(SUM(total - tax_amount), 0) - (
        SELECT COALESCE(SUM(si.quantity * si.cost), 0)
        FROM sale_items si JOIN sales s ON si.sale_id = s.id
        WHERE date(s.created_at) = date(?)
      ) as gross_profit
    FROM sales WHERE date(created_at) = date(?)
  `).get(today, today)

  const monthSales = db.prepare(`
    SELECT 
      COUNT(*) as count, 
      COALESCE(SUM(total), 0) as revenue,
      COALESCE(SUM(total - tax_amount), 0) - (
        SELECT COALESCE(SUM(si.quantity * si.cost), 0)
        FROM sale_items si JOIN sales s ON si.sale_id = s.id
        WHERE strftime('%Y-%m', s.created_at) = ?
      ) as gross_profit
    FROM sales WHERE strftime('%Y-%m', created_at) = ?
  `).get(thisMonth, thisMonth)

  // Expense totals for today and month
  const todayExpenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date = ?
  `).get(today)

  const monthExpenses = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE strftime('%Y-%m', expense_date) = ?
  `).get(thisMonth)

  // Borrowed sales profit for today and month
  const todayBorrowed = db.prepare(`
    SELECT COALESCE(SUM(profit), 0) as total FROM borrowed_sales WHERE sale_date = ?
  `).get(today)

  const monthBorrowed = db.prepare(`
    SELECT COALESCE(SUM(profit), 0) as total FROM borrowed_sales WHERE strftime('%Y-%m', sale_date) = ?
  `).get(thisMonth)

  // Net profit = gross profit - expenses + borrowed profit
  todaySales.expenses = todayExpenses.total
  todaySales.borrowed_profit = todayBorrowed.total
  todaySales.profit = todaySales.gross_profit - todayExpenses.total + todayBorrowed.total

  monthSales.expenses = monthExpenses.total
  monthSales.borrowed_profit = monthBorrowed.total
  monthSales.profit = monthSales.gross_profit - monthExpenses.total + monthBorrowed.total

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

  // Last 7 days with expenses included
  const last7Days = db.prepare(`
    WITH DailyCosts AS (
      SELECT date(s.created_at) as date, SUM(si.quantity * si.cost) as cost
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE date(s.created_at) >= date('now', '-6 days')
      GROUP BY date(s.created_at)
    ),
    DailyExpenses AS (
      SELECT expense_date as date, SUM(amount) as expenses
      FROM expenses
      WHERE expense_date >= date('now', '-6 days')
      GROUP BY expense_date
    )
    SELECT 
      date(s.created_at) as date,
      COUNT(s.id) as count,
      COALESCE(SUM(s.total), 0) as revenue,
      COALESCE(SUM(s.total - s.tax_amount), 0) - COALESCE(c.cost, 0) as gross_profit,
      COALESCE(ex.expenses, 0) as expenses,
      COALESCE(SUM(s.total - s.tax_amount), 0) - COALESCE(c.cost, 0) - COALESCE(ex.expenses, 0) as profit
    FROM sales s
    LEFT JOIN DailyCosts c ON date(s.created_at) = c.date
    LEFT JOIN DailyExpenses ex ON date(s.created_at) = ex.date
    WHERE date(s.created_at) >= date('now', '-6 days')
    GROUP BY date(s.created_at)
    ORDER BY date
  `).all()

  return {
    success: true,
    data: {
      todaySales,
      monthSales,
      todayExpenses: todayExpenses.total,
      monthExpenses: monthExpenses.total,
      todayBorrowedProfit: todayBorrowed.total,
      monthBorrowedProfit: monthBorrowed.total,
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
  const end = endDate || new Date().toISOString().split('T')[0]

  const rows = db.prepare(`
    WITH DailyCosts AS (
      SELECT date(s.created_at) as date, SUM(si.quantity * si.cost) as cost
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE date(s.created_at) BETWEEN date(?) AND date(?)
      GROUP BY date(s.created_at)
    ),
    DailyExpenses AS (
      SELECT expense_date as date, SUM(amount) as expenses
      FROM expenses
      WHERE expense_date BETWEEN date(?) AND date(?)
      GROUP BY expense_date
    )
    SELECT date(s.created_at) as date,
      COUNT(s.id) as count,
      COALESCE(SUM(s.total), 0) as revenue,
      COALESCE(SUM(s.tax_amount), 0) as tax,
      COALESCE(SUM(s.discount), 0) as discount,
      COALESCE(SUM(s.total - s.tax_amount), 0) - COALESCE(c.cost, 0) as gross_profit,
      COALESCE(ex.expenses, 0) as expenses,
      COALESCE(SUM(s.total - s.tax_amount), 0) - COALESCE(c.cost, 0) - COALESCE(ex.expenses, 0) as profit
    FROM sales s
    LEFT JOIN DailyCosts c ON date(s.created_at) = c.date
    LEFT JOIN DailyExpenses ex ON date(s.created_at) = ex.date
    WHERE date(s.created_at) BETWEEN date(?) AND date(?)
    GROUP BY date(s.created_at)
    ORDER BY date
  `).all(start, end, start, end, start, end)

  return { success: true, data: rows }
}

function getTopProducts({ startDate, endDate, limit = 10 } = {}) {
  const db = getDb()
  const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const end = endDate || new Date().toISOString().split('T')[0]

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
      WITH PeriodCosts AS (
        SELECT strftime('%Y-%m', s.created_at) as period, SUM(si.quantity * si.cost) as cost
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE strftime('%Y', s.created_at) = ?
        GROUP BY strftime('%Y-%m', s.created_at)
      ),
      PeriodExpenses AS (
        SELECT strftime('%Y-%m', expense_date) as period, SUM(amount) as expenses
        FROM expenses
        WHERE strftime('%Y', expense_date) = ?
        GROUP BY strftime('%Y-%m', expense_date)
      )
      SELECT
        strftime('%Y-%m', s.created_at) as period,
        COUNT(s.id) as count,
        COALESCE(SUM(s.total), 0) as revenue,
        COALESCE(SUM(s.tax_amount), 0) as tax,
        COALESCE(SUM(s.total - s.tax_amount), 0) - COALESCE(c.cost, 0) as gross_profit,
        COALESCE(ex.expenses, 0) as expenses,
        COALESCE(SUM(s.total - s.tax_amount), 0) - COALESCE(c.cost, 0) - COALESCE(ex.expenses, 0) as profit
      FROM sales s
      LEFT JOIN PeriodCosts c ON strftime('%Y-%m', s.created_at) = c.period
      LEFT JOIN PeriodExpenses ex ON strftime('%Y-%m', s.created_at) = ex.period
      WHERE strftime('%Y', s.created_at) = ?
      GROUP BY strftime('%Y-%m', s.created_at)
      ORDER BY period
    `).all(String(y), String(y), String(y))
  } else {
    rows = db.prepare(`
      WITH PeriodCosts AS (
        SELECT strftime('%Y', s.created_at) as period, SUM(si.quantity * si.cost) as cost
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        GROUP BY strftime('%Y', s.created_at)
      ),
      PeriodExpenses AS (
        SELECT strftime('%Y', expense_date) as period, SUM(amount) as expenses
        FROM expenses
        GROUP BY strftime('%Y', expense_date)
      )
      SELECT
        strftime('%Y', s.created_at) as period,
        COUNT(s.id) as count,
        COALESCE(SUM(s.total), 0) as revenue,
        COALESCE(SUM(s.total - s.tax_amount), 0) - COALESCE(c.cost, 0) as gross_profit,
        COALESCE(ex.expenses, 0) as expenses,
        COALESCE(SUM(s.total - s.tax_amount), 0) - COALESCE(c.cost, 0) - COALESCE(ex.expenses, 0) as profit
      FROM sales s
      LEFT JOIN PeriodCosts c ON strftime('%Y', s.created_at) = c.period
      LEFT JOIN PeriodExpenses ex ON strftime('%Y', s.created_at) = ex.period
      GROUP BY strftime('%Y', s.created_at)
      ORDER BY period
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
