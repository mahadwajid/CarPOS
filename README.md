# CarPOS — Complete Offline Desktop POS System

CarPOS is a modern, offline-first Point of Sale (POS) application built for desktop environments. Designed with performance, local data retention, and high-quality UI/UX in mind, this application caters to small and medium retail businesses seeking a reliable solution that doesn't rely on cloud connectivity.

---

## 🏗️ Architecture Stack

- **Desktop Framework:** Electron.js (Provides native OS access and window management)
- **Frontend Framework:** React.js + Vite (Fast rendering and module replacement)
- **Styling:** Tailwind CSS v3 (Custom dark-mode UI with sleek modern aesthetics)
- **Database:** SQLite3 via `better-sqlite3` (Lighting-fast local offline storage)
- **IPC Protocol:** Secure `contextBridge` mapping via Preload script for safe Main-to-Renderer communication.

---

## 🌟 Core Features

### 1. Point of Sale (POS) Terminal
- Fast checkout workflow with a grid-based product selector.
- Search-by-barcode integration with automatic item quantity updates.
- Real-time cart calculation (Subtotals, Discounts, Dynamic Tax rates).
- Built-in dynamic checkout with change calculation and various payment methods (Cash, Card, Wallet).

### 2. Product Management
- Full CRUD capabilities for products (Name, Barcode, Prices, Categories).
- Stock level tracking equipped with Low-Stock thresholds and alerts.
- Disable/Enable toggle for seasonable or discontinued active items.

### 3. Inventory Control
- Deep logging of all stock movements (Sales, Manual adjustments, Re-stocking receipts).
- Real-time synchronization; inventory dynamically decrements upon sale creation.

### 4. Sales & Invoices
- Browse through Historical transaction logs.
- Search for past invoices by Number or Customer name.
- Single-click invoice voiding (which systematically returns voided items back to inventory stock).
- Embedded thermal printable Receipt Generation via `jsPDF`.

### 5. Analytics & Dashboard
- At-a-glance dashboard highlighting daily vs. monthly revenues, total transactions, and low stock items.
- Advanced visual reports using `Recharts` for Timeline-based tracking.
- Performance statistics like "Top Selling Products" mapped intelligently against category matrices.

### 6. Built-in Securty & Admin Controls
- Secure bcrypt-hashed Authentication system out of the box.
- User Role segregation (`admin` vs. `cashier`). Only admins can access global system settings and historical data purging.
- Turnkey database backup system (create portable `.db` snapshots) via OS dialogues. 

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **NPM** or **Yarn**
- Windows OS (Or Mac/Linux if building natively)

### Installation

1. Copy or Clone the project repository to your required folder (`d:\CarPOS`).
2. Open your terminal inside the root directory and install dependencies:
   ```bash
   npm install
   ```
3. *Note:* Because the project uses `better-sqlite3`, native bindings must be compiled against Electron's Node engine. If you encounter module mismatch errors, run:
   ```bash
   npx electron-builder install-app-deps
   ```

### Running in Development

To start the local Vite development server alongside the Electron window shell, simply run:

```bash
npm run dev
```

**Default Credentials:**
- **Username:** `admin`
- **Password:** `admin123`

---

## 🛠️ Build and Distribution

Packaging the application into a standalone executable (`.exe` on Windows) is handled natively by `electron-builder`.

To compile, bundle, and generate an installer for distribution, run:

```bash
npm run build:electron
```

The resulting executables will be generated in the `dist-electron/` folder.

---

## 🗂️ Project Structure map

```text
CarPOS/
├── electron/                   # Backend / Main process context
│   ├── main.js                 # Electron configuration & IPC routing
│   ├── preload.js              # Security barrier for Renderer
│   └── database/               # Local persistence logic
│       ├── db.js               # SQLite connection setup + Default Seeds
│       └── handlers/           # Modularized endpoints (products, sales, etc.)
├── src/                        # Frontend / Renderer process context
│   ├── components/             # Reusable UI Blocks (Nav, Modals, Buttons)
│   ├── context/                # Global React State Providers (Cart, Auth)
│   ├── pages/                  # Top-level Route components (POS, Dashboard)
│   ├── utils/                  # Shared helper scripts (PDF rendering, formatters)
│   ├── App.jsx                 # Routing core
│   └── index.css               # Tailwind directives and Custom generic classes
├── public/                     # Static assets (Favicons, images)
├── tailwind.config.js          # Theming definitions
├── vite.config.js              # Bundler configuration
└── package.json
```

---

## 💾 Relational Database Design

The local `carpos.db` database relies on the following relational structure:
- **`users`** — Application access credentials and authorization levels.
- **`settings`** — K/V pairs for global modifiers (Currency, Global Tax, Shop name).
- **`categories`** — Structural grouping labels.
- **`products`** — The catalog referencing back to `categories`.
- **`customers`** — Lightweight CRM tracking table.
- **`sales`** — High-level checkout summaries pointing optionally to `customers` and `users` (as the cashier).
- **`sale_items`** — The detailed receipt line items intrinsically locked to a single `sales` event.
- **`inventory_logs`** — Pure audit table capturing every stock manipulation event.

*(For detailed schemas, reference `electron/database/db.js`)*
