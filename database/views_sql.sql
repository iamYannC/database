-- ==================================================================
-- DATABASE VIEWS: Query Abstractions
-- ==================================================================
-- Business Inventory Management System
-- This file contains view definitions for common queries
-- Run this AFTER schema.sql
-- Views can be dropped and recreated without affecting data
-- ==================================================================

-- ==================================================================
-- INVENTORY VIEWS
-- ==================================================================

-- Low Stock Alert: Items at or below reorder level
CREATE VIEW IF NOT EXISTS low_stock_items AS
SELECT
  item_id,
  item_name,
  quantity,
  reorder_level,
  notes
FROM inventory
WHERE quantity <= reorder_level
ORDER BY quantity ASC;

-- ==================================================================
-- SALES VIEWS
-- ==================================================================

-- Sales Summary: Overview of all sales transactions
CREATE VIEW IF NOT EXISTS sales_summary AS
SELECT
  s.sale_id,
  s.sale_date,
  c.client_name,
  s.notes AS sale_notes
FROM sales s
LEFT JOIN clients c ON s.client_id = c.client_id
ORDER BY s.sale_date DESC;

-- Sale Details: Complete breakdown of sale line items
CREATE VIEW IF NOT EXISTS sale_details AS
SELECT
  si.sale_item_id,
  s.sale_id,
  s.sale_date,
  c.client_name,
  i.item_name,
  si.quantity,
  si.unit_price,
  si.subtotal,
  s.notes AS sale_notes,
  si.notes AS item_notes
FROM sale_items si
JOIN sales s ON si.sale_id = s.sale_id
JOIN inventory i ON si.item_id = i.item_id
LEFT JOIN clients c ON s.client_id = c.client_id
ORDER BY s.sale_date DESC;

-- ==================================================================
-- SUPPLY VIEWS
-- ==================================================================

-- Supply Order Summary: Overview of all supply orders
CREATE VIEW IF NOT EXISTS supply_order_summary AS
SELECT
  so.supply_order_id,
  so.order_date,
  v.vendor_name,
  so.notes AS order_notes
FROM supply_orders so
LEFT JOIN vendors v ON so.vendor_id = v.vendor_id
ORDER BY so.order_date DESC;

-- Supply Order Details: Complete breakdown of supply line items
CREATE VIEW IF NOT EXISTS supply_order_details AS
SELECT
  si.supply_item_id,
  so.supply_order_id,
  so.order_date,
  v.vendor_name,
  i.item_name,
  si.quantity,
  si.cost_price,
  si.subtotal,
  so.notes AS order_notes,
  si.notes AS item_notes
FROM supply_items si
JOIN supply_orders so ON si.supply_order_id = so.supply_order_id
JOIN inventory i ON si.item_id = i.item_id
LEFT JOIN vendors v ON so.vendor_id = v.vendor_id
ORDER BY so.order_date DESC;