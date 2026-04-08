const { contextBridge, ipcRenderer } = require('electron')

// ─── Expose safe API to renderer (React) ─────────────────────────────────────
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close:    () => ipcRenderer.send('window:close'),
  },

  // Auth
  auth: {
    login:          (data) => ipcRenderer.invoke('auth:login', data),
    logout:         ()     => ipcRenderer.invoke('auth:logout'),
    getUsers:       ()     => ipcRenderer.invoke('auth:getUsers'),
    createUser:     (data) => ipcRenderer.invoke('auth:createUser', data),
    updateUser:     (data) => ipcRenderer.invoke('auth:updateUser', data),
    deleteUser:     (id)   => ipcRenderer.invoke('auth:deleteUser', id),
    changePassword: (data) => ipcRenderer.invoke('auth:changePassword', data),
  },

  // Products
  products: {
    getAll:          ()     => ipcRenderer.invoke('products:getAll'),
    getById:         (id)   => ipcRenderer.invoke('products:getById', id),
    create:          (data) => ipcRenderer.invoke('products:create', data),
    update:          (data) => ipcRenderer.invoke('products:update', data),
    delete:          (id)   => ipcRenderer.invoke('products:delete', id),
    search:          (q)    => ipcRenderer.invoke('products:search', q),
    getByBarcode:    (bc)   => ipcRenderer.invoke('products:getByBarcode', bc),
    getLowStock:     ()     => ipcRenderer.invoke('products:getLowStock'),
    getCategories:   ()     => ipcRenderer.invoke('products:getCategories'),
    createCategory:  (data) => ipcRenderer.invoke('products:createCategory', data),
  },

  // Sales
  sales: {
    create:       (data)   => ipcRenderer.invoke('sales:create', data),
    getAll:       (params) => ipcRenderer.invoke('sales:getAll', params),
    getById:      (id)     => ipcRenderer.invoke('sales:getById', id),
    getSaleItems: (id)     => ipcRenderer.invoke('sales:getSaleItems', id),
    delete:       (id)     => ipcRenderer.invoke('sales:delete', id),
    getDaily:     (date)   => ipcRenderer.invoke('sales:getDaily', date),
    getMonthly:   (month)  => ipcRenderer.invoke('sales:getMonthly', month),
  },

  // Customers
  customers: {
    getAll:      ()     => ipcRenderer.invoke('customers:getAll'),
    getById:     (id)   => ipcRenderer.invoke('customers:getById', id),
    create:      (data) => ipcRenderer.invoke('customers:create', data),
    update:      (data) => ipcRenderer.invoke('customers:update', data),
    delete:      (id)   => ipcRenderer.invoke('customers:delete', id),
    getHistory:  (id)   => ipcRenderer.invoke('customers:getHistory', id),
    search:      (q)    => ipcRenderer.invoke('customers:search', q),
  },

  // Inventory
  inventory: {
    getLogs:      (params) => ipcRenderer.invoke('inventory:getLogs', params),
    restock:      (data)   => ipcRenderer.invoke('inventory:restock', data),
    adjust:       (data)   => ipcRenderer.invoke('inventory:adjust', data),
    getProduct:   (id)     => ipcRenderer.invoke('inventory:getProduct', id),
  },

  // Reports
  reports: {
    dashboard:          ()       => ipcRenderer.invoke('reports:dashboard'),
    salesByDate:        (params) => ipcRenderer.invoke('reports:salesByDate', params),
    topProducts:        (params) => ipcRenderer.invoke('reports:topProducts', params),
    revenue:            (params) => ipcRenderer.invoke('reports:revenue', params),
    categoryBreakdown:  ()       => ipcRenderer.invoke('reports:categoryBreakdown'),
    customerReport:     ()       => ipcRenderer.invoke('reports:customerReport'),
  },

  // Settings
  settings: {
    get:    ()     => ipcRenderer.invoke('settings:get'),
    update: (data) => ipcRenderer.invoke('settings:update', data),
  },

  // Backup
  backup: {
    create:  () => ipcRenderer.invoke('backup:create'),
    restore: () => ipcRenderer.invoke('backup:restore'),
  },
})
