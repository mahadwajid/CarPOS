const { getDb } = require('../db')

function get() {
  const db = getDb()
  const rows = db.prepare(`SELECT key, value FROM settings`).all()
  const settings = {}
  for (const row of rows) settings[row.key] = row.value
  return { success: true, data: settings }
}

function update(updates) {
  const db = getDb()
  const stmt = db.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`)
  const updateMany = db.transaction((data) => {
    for (const [key, value] of Object.entries(data)) {
      stmt.run(key, String(value))
    }
  })
  updateMany(updates)
  return { success: true }
}

module.exports = { get, update }
