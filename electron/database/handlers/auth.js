const { getDb } = require('../db')
const bcrypt = require('bcryptjs')

function login({ username, password }) {
  const db = getDb()
  const user = db.prepare(`
    SELECT * FROM users WHERE username = ? AND is_active = 1
  `).get(username)

  if (!user) return { success: false, message: 'Invalid username or password' }

  const valid = bcrypt.compareSync(password, user.password)
  if (!valid) return { success: false, message: 'Invalid username or password' }

  const { password: _, ...safeUser } = user
  return { success: true, user: safeUser }
}

function logout() {
  return { success: true }
}

function getUsers() {
  const db = getDb()
  const users = db.prepare(`
    SELECT id, username, name, role, is_active, created_at FROM users ORDER BY name
  `).all()
  return { success: true, data: users }
}

function createUser({ username, password, name, role }) {
  const db = getDb()
  try {
    const hash = bcrypt.hashSync(password, 10)
    const result = db.prepare(`
      INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)
    `).run(username, hash, name, role || 'cashier')
    return { success: true, id: result.lastInsertRowid }
  } catch (err) {
    if (err.message.includes('UNIQUE')) return { success: false, message: 'Username already exists' }
    return { success: false, message: err.message }
  }
}

function updateUser({ id, username, name, role, is_active }) {
  const db = getDb()
  try {
    db.prepare(`
      UPDATE users SET username = ?, name = ?, role = ?, is_active = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(username, name, role, is_active ?? 1, id)
    return { success: true }
  } catch (err) {
    return { success: false, message: err.message }
  }
}

function deleteUser(id) {
  const db = getDb()
  // Never delete the last admin
  const adminCount = db.prepare(`SELECT COUNT(*) as c FROM users WHERE role='admin' AND is_active=1`).get().c
  const user = db.prepare(`SELECT role FROM users WHERE id=?`).get(id)
  if (user?.role === 'admin' && adminCount <= 1) {
    return { success: false, message: 'Cannot delete the last admin user' }
  }
  db.prepare(`DELETE FROM users WHERE id = ?`).run(id)
  return { success: true }
}

function changePassword({ id, currentPassword, newPassword }) {
  const db = getDb()
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id)
  if (!user) return { success: false, message: 'User not found' }

  const valid = bcrypt.compareSync(currentPassword, user.password)
  if (!valid) return { success: false, message: 'Current password is incorrect' }

  const hash = bcrypt.hashSync(newPassword, 10)
  db.prepare(`UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, id)
  return { success: true }
}

module.exports = { login, logout, getUsers, createUser, updateUser, deleteUser, changePassword }
