const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

// ─── Database Handlers ────────────────────────────────────────────────────────
const { initDatabase }     = require('./database/db')
const productHandlers      = require('./database/handlers/products')
const salesHandlers        = require('./database/handlers/sales')
const customerHandlers     = require('./database/handlers/customers')
const inventoryHandlers    = require('./database/handlers/inventory')
const reportHandlers       = require('./database/handlers/reports')
const settingsHandlers     = require('./database/handlers/settings')
const authHandlers         = require('./database/handlers/auth')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  // Init DB first
  initDatabase()

  // Register all IPC handlers
  registerIpcHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── Window Controls ──────────────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())

// ─── IPC Handler Registration ─────────────────────────────────────────────────
function registerIpcHandlers() {
  // Auth
  ipcMain.handle('auth:login',    (_, data) => authHandlers.login(data))
  ipcMain.handle('auth:logout',   ()         => authHandlers.logout())
  ipcMain.handle('auth:getUsers', ()         => authHandlers.getUsers())
  ipcMain.handle('auth:createUser', (_, data) => authHandlers.createUser(data))
  ipcMain.handle('auth:updateUser', (_, data) => authHandlers.updateUser(data))
  ipcMain.handle('auth:deleteUser', (_, id)   => authHandlers.deleteUser(id))
  ipcMain.handle('auth:changePassword', (_, data) => authHandlers.changePassword(data))

  // Products
  ipcMain.handle('products:getAll',    ()         => productHandlers.getAll())
  ipcMain.handle('products:getById',   (_, id)    => productHandlers.getById(id))
  ipcMain.handle('products:create',    (_, data)  => productHandlers.create(data))
  ipcMain.handle('products:update',    (_, data)  => productHandlers.update(data))
  ipcMain.handle('products:delete',    (_, id)    => productHandlers.remove(id))
  ipcMain.handle('products:search',    (_, q)     => productHandlers.search(q))
  ipcMain.handle('products:getByBarcode', (_, bc) => productHandlers.getByBarcode(bc))
  ipcMain.handle('products:getLowStock',  ()      => productHandlers.getLowStock())
  ipcMain.handle('products:getCategories', ()     => productHandlers.getCategories())
  ipcMain.handle('products:createCategory', (_, data) => productHandlers.createCategory(data))

  // Sales
  ipcMain.handle('sales:create',     (_, data)  => salesHandlers.create(data))
  ipcMain.handle('sales:getAll',     (_, params) => salesHandlers.getAll(params))
  ipcMain.handle('sales:getById',    (_, id)    => salesHandlers.getById(id))
  ipcMain.handle('sales:getSaleItems', (_, id)  => salesHandlers.getSaleItems(id))
  ipcMain.handle('sales:delete',     (_, id)    => salesHandlers.remove(id))
  ipcMain.handle('sales:getDaily',   (_, date)  => salesHandlers.getDaily(date))
  ipcMain.handle('sales:getMonthly', (_, month) => salesHandlers.getMonthly(month))

  // Customers
  ipcMain.handle('customers:getAll',    ()        => customerHandlers.getAll())
  ipcMain.handle('customers:getById',   (_, id)   => customerHandlers.getById(id))
  ipcMain.handle('customers:create',    (_, data) => customerHandlers.create(data))
  ipcMain.handle('customers:update',    (_, data) => customerHandlers.update(data))
  ipcMain.handle('customers:delete',    (_, id)   => customerHandlers.remove(id))
  ipcMain.handle('customers:getHistory', (_, id)  => customerHandlers.getPurchaseHistory(id))
  ipcMain.handle('customers:search',    (_, q)    => customerHandlers.search(q))

  // Inventory
  ipcMain.handle('inventory:getLogs',   (_, params) => inventoryHandlers.getLogs(params))
  ipcMain.handle('inventory:restock',   (_, data)   => inventoryHandlers.restock(data))
  ipcMain.handle('inventory:adjust',    (_, data)   => inventoryHandlers.adjust(data))
  ipcMain.handle('inventory:getProduct', (_, id)    => inventoryHandlers.getProductStock(id))

  // Reports
  ipcMain.handle('reports:dashboard',     ()         => reportHandlers.getDashboard())
  ipcMain.handle('reports:salesByDate',   (_, params) => reportHandlers.getSalesByDate(params))
  ipcMain.handle('reports:topProducts',   (_, params) => reportHandlers.getTopProducts(params))
  ipcMain.handle('reports:revenue',       (_, params) => reportHandlers.getRevenue(params))
  ipcMain.handle('reports:categoryBreakdown', ()     => reportHandlers.getCategoryBreakdown())
  ipcMain.handle('reports:customerReport', ()        => reportHandlers.getCustomerReport())

  // Settings
  ipcMain.handle('settings:get',    ()        => settingsHandlers.get())
  ipcMain.handle('settings:update', (_, data) => settingsHandlers.update(data))

  // Backup & Restore
  ipcMain.handle('backup:create', async () => {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Backup',
      defaultPath: `CarPOS_backup_${new Date().toISOString().slice(0,10)}.db`,
      filters: [{ name: 'Database', extensions: ['db'] }],
    })
    if (!filePath) return { success: false, message: 'Cancelled' }
    try {
      const dbPath = path.join(app.getPath('userData'), 'carpos.db')
      fs.copyFileSync(dbPath, filePath)
      return { success: true, message: 'Backup saved successfully' }
    } catch (err) {
      return { success: false, message: err.message }
    }
  })

  ipcMain.handle('backup:restore', async () => {
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Restore Backup',
      filters: [{ name: 'Database', extensions: ['db'] }],
      properties: ['openFile'],
    })
    if (!filePaths?.length) return { success: false, message: 'Cancelled' }
    try {
      const dbPath = path.join(app.getPath('userData'), 'carpos.db')
      fs.copyFileSync(filePaths[0], dbPath)
      // Re-init after restore
      initDatabase()
      return { success: true, message: 'Database restored. Please restart the app.' }
    } catch (err) {
      return { success: false, message: err.message }
    }
  })
}
