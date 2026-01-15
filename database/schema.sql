-- ==================================================================
-- DATABASE SCHEMA: Tables, Triggers & Indexes
-- ==================================================================
-- Business Inventory Management System
-- This file contains the core data structure and integrity rules
-- Run this FIRST before views.sql
-- ==================================================================

PRAGMA foreign_keys = ON;

-- ==================================================================
-- TABLES
-- ==================================================================

-- Inventory: Product catalog and stock levels
CREATE TABLE IF NOT EXISTS inventory (
  item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL,
  reorder_level INTEGER DEFAULT 10,
  notes TEXT,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP,
  CHECK (quantity >= 0),
  CHECK (unit_price > 0)
);

-- Clients: Customer directory
CREATE TABLE IF NOT EXISTS clients (
  client_id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Vendors: Supplier directory
CREATE TABLE IF NOT EXISTS vendors (
  vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_date TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Sales: Sales transaction headers
CREATE TABLE IF NOT EXISTS sales (
  sale_id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  sale_date TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (client_id) REFERENCES clients(client_id)
);

-- Sale Items: Line items for each sale
CREATE TABLE IF NOT EXISTS sale_items (
  sale_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  notes TEXT,
  subtotal REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
  FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory(item_id),
  CHECK (quantity > 0),
  CHECK (unit_price > 0),
  CHECK (subtotal >= 0)
);

-- Supply Orders: Purchase order headers from vendors
CREATE TABLE IF NOT EXISTS supply_orders (
  supply_order_id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id INTEGER,
  order_date TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id)
);

-- Supply Items: Line items for each supply order
CREATE TABLE IF NOT EXISTS supply_items (
  supply_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
  supply_order_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  cost_price REAL NOT NULL,
  notes TEXT,
  subtotal REAL GENERATED ALWAYS AS (quantity * cost_price) STORED,
  FOREIGN KEY (supply_order_id) REFERENCES supply_orders(supply_order_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES inventory(item_id),
  CHECK (quantity > 0),
  CHECK (cost_price > 0),
  CHECK (subtotal >= 0)
);

-- ==================================================================
-- TRIGGERS: Inventory Management Automation
-- ==================================================================

-- SALES TRIGGERS --

-- Prevent sales that would result in negative inventory
CREATE TRIGGER IF NOT EXISTS prevent_negative_inventory
BEFORE INSERT ON sale_items
BEGIN
  SELECT
    CASE
      WHEN (SELECT quantity FROM inventory WHERE item_id = NEW.item_id) < NEW.quantity
      THEN RAISE(ABORT, 'Cannot accept this value, negative quantity')
    END;
END;

-- Decrease inventory after a sale
CREATE TRIGGER IF NOT EXISTS update_inventory_after_sale
AFTER INSERT ON sale_items
BEGIN
  UPDATE inventory
  SET quantity = quantity - NEW.quantity
  WHERE item_id = NEW.item_id;
END;

-- Restore inventory when a sale item is deleted
CREATE TRIGGER IF NOT EXISTS restore_inventory_after_delete
AFTER DELETE ON sale_items
BEGIN
  UPDATE inventory
  SET quantity = quantity + OLD.quantity
  WHERE item_id = OLD.item_id;
END;

-- Adjust inventory when sale item quantity is updated
CREATE TRIGGER IF NOT EXISTS adjust_inventory_on_sale_item_update
AFTER UPDATE OF quantity ON sale_items
BEGIN
  -- Adjust inventory by the difference
  UPDATE inventory
  SET quantity = quantity + OLD.quantity - NEW.quantity
  WHERE item_id = NEW.item_id;

  -- Prevent negative stock
  SELECT
    CASE
      WHEN (SELECT quantity FROM inventory WHERE item_id = NEW.item_id) < 0
      THEN RAISE(ABORT, 'Cannot update: negative stock!')
    END;
END;

-- SUPPLY TRIGGERS --

-- Increase inventory when supply arrives
CREATE TRIGGER IF NOT EXISTS update_inventory_after_supply
AFTER INSERT ON supply_items
BEGIN
  UPDATE inventory
  SET quantity = quantity + NEW.quantity
  WHERE item_id = NEW.item_id;
END;

-- Decrease inventory when supply item is deleted
CREATE TRIGGER IF NOT EXISTS restore_inventory_after_supply_delete
AFTER DELETE ON supply_items
BEGIN
  UPDATE inventory
  SET quantity = quantity - OLD.quantity
  WHERE item_id = OLD.item_id;
END;

-- Adjust inventory when supply item quantity is updated
CREATE TRIGGER IF NOT EXISTS adjust_inventory_on_supply_item_update
AFTER UPDATE OF quantity ON supply_items
BEGIN
  UPDATE inventory
  SET quantity = quantity - OLD.quantity + NEW.quantity
  WHERE item_id = NEW.item_id;
END;

-- ==================================================================
-- INDEXES: Performance Optimization
-- ==================================================================

-- Sale Items indexes
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON sale_items(item_id);

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);

-- Supply Items indexes
CREATE INDEX IF NOT EXISTS idx_supply_items_order_id ON supply_items(supply_order_id);
CREATE INDEX IF NOT EXISTS idx_supply_items_item_id ON supply_items(item_id);

-- Supply Orders indexes
CREATE INDEX IF NOT EXISTS idx_supply_orders_vendor_id ON supply_orders(vendor_id);