const ExcelJS = require('exceljs');
const { db } = require('./db');

// Define which tables/views to export and their column order
const SOURCES = [
  {
    name: 'inventory',
    columns: ['item_id', 'item_name', 'description', 'quantity', 'unit_price', 'reorder_level', 'notes', 'created_date'],
    query: 'SELECT item_id, item_name, description, quantity, unit_price, reorder_level, notes, created_date FROM inventory ORDER BY item_id'
  },
  {
    name: 'clients',
    columns: ['client_id', 'client_name', 'email', 'phone', 'address', 'notes', 'created_date'],
    query: 'SELECT client_id, client_name, email, phone, address, notes, created_date FROM clients ORDER BY client_id'
  },
  {
    name: 'vendors',
    columns: ['vendor_id', 'vendor_name', 'email', 'phone', 'address', 'notes', 'created_date'],
    query: 'SELECT vendor_id, vendor_name, email, phone, address, notes, created_date FROM vendors ORDER BY vendor_id'
  },
  {
    name: 'sales',
    columns: ['sale_id', 'client_id', 'sale_date', 'notes'],
    query: 'SELECT sale_id, client_id, sale_date, notes FROM sales ORDER BY sale_id'
  },
  {
    name: 'sale_items',
    columns: ['sale_item_id', 'sale_id', 'item_id', 'quantity', 'unit_price', 'notes', 'subtotal'],
    query: 'SELECT sale_item_id, sale_id, item_id, quantity, unit_price, notes, subtotal FROM sale_items ORDER BY sale_item_id'
  },
  {
    name: 'supply_orders',
    columns: ['supply_order_id', 'vendor_id', 'order_date', 'notes'],
    query: 'SELECT supply_order_id, vendor_id, order_date, notes FROM supply_orders ORDER BY supply_order_id'
  },
  {
    name: 'supply_items',
    columns: ['supply_item_id', 'supply_order_id', 'item_id', 'quantity', 'cost_price', 'notes', 'subtotal'],
    query: 'SELECT supply_item_id, supply_order_id, item_id, quantity, cost_price, notes, subtotal FROM supply_items ORDER BY supply_item_id'
  },
  // Views
  {
    name: 'low_stock_items',
    columns: ['item_id', 'item_name', 'quantity', 'reorder_level', 'notes'],
    query: 'SELECT item_id, item_name, quantity, reorder_level, notes FROM low_stock_items ORDER BY quantity ASC, item_id'
  },
  {
    name: 'sales_summary',
    columns: ['sale_id', 'sale_date', 'client_name', 'sale_notes'],
    query: 'SELECT sale_id, sale_date, client_name, sale_notes FROM sales_summary ORDER BY sale_date DESC, sale_id DESC'
  },
  {
    name: 'sale_details',
    columns: ['sale_item_id', 'sale_id', 'sale_date', 'client_name', 'item_name', 'quantity', 'unit_price', 'subtotal', 'sale_notes', 'item_notes'],
    query: 'SELECT sale_item_id, sale_id, sale_date, client_name, item_name, quantity, unit_price, subtotal, sale_notes, item_notes FROM sale_details ORDER BY sale_date DESC, sale_item_id DESC'
  },
  {
    name: 'supply_order_summary',
    columns: ['supply_order_id', 'order_date', 'vendor_name', 'order_notes'],
    query: 'SELECT supply_order_id, order_date, vendor_name, order_notes FROM supply_order_summary ORDER BY order_date DESC, supply_order_id DESC'
  },
  {
    name: 'supply_order_details',
    columns: ['supply_item_id', 'supply_order_id', 'order_date', 'vendor_name', 'item_name', 'quantity', 'cost_price', 'subtotal', 'order_notes', 'item_notes'],
    query: 'SELECT supply_item_id, supply_order_id, order_date, vendor_name, item_name, quantity, cost_price, subtotal, order_notes, item_notes FROM supply_order_details ORDER BY order_date DESC, supply_item_id DESC'
  }
];

function fetchSnapshot() {
  const run = db.transaction(() => {
    return SOURCES.map(src => ({
      name: src.name,
      columns: src.columns,
      rows: db.prepare(src.query).all()
    }));
  });
  return run();
}

function addSheet(workbook, source) {
  const ws = workbook.addWorksheet(source.name);
  const columns = source.columns && source.columns.length
    ? source.columns
    : (source.rows[0] ? Object.keys(source.rows[0]) : []);

  if (columns.length) {
    ws.columns = columns.map(col => ({ header: col, key: col }));
  }

  if (!source.rows || source.rows.length === 0) {
    ws.addRow(['(no rows)']);
    return;
  }

  for (const row of source.rows) {
    ws.addRow(row);
  }

  if (ws.getRow(1)) ws.getRow(1).font = { bold: true };
  if (ws.columns) {
    ws.columns.forEach(col => { col.width = Math.min(40, Math.max(10, String(col.header || '').length + 2)); });
  }
}

async function buildWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Inventory App';
  workbook.created = new Date();
  workbook.modified = new Date();

  const snapshot = fetchSnapshot();
  snapshot.forEach(src => addSheet(workbook, src));

  return workbook;
}

module.exports = { buildWorkbook };
