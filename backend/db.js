// ==================================================================
// DATABASE CONNECTION & UTILITY FUNCTIONS
// ==================================================================
// Uses better-sqlite3 for synchronous SQLite operations
// ==================================================================

const Database = require('better-sqlite3');
const path = require('path');

// Connect to database
const dbPath = path.join(__dirname, '..', 'database', 'inventory.db');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

// ==================================================================
// UTILITY FUNCTIONS
// ==================================================================

/**
 * Execute a query and return all rows
 */
function query(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.all(params);
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

/**
 * Execute a query and return a single row
 */
function queryOne(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.get(params);
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

/**
 * Execute an INSERT/UPDATE/DELETE and return info
 */
function execute(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    return stmt.run(params);
  } catch (error) {
    console.error('Execute error:', error.message);
    throw error;
  }
}

/**
 * Execute multiple statements in a transaction
 */
function transaction(callback) {
  const txn = db.transaction(callback);
  return txn();
}

// ==================================================================
// INVENTORY OPERATIONS
// ==================================================================

const inventory = {
  getAll() {
    return query('SELECT * FROM inventory ORDER BY item_name');
  },

  getById(id) {
    return queryOne('SELECT * FROM inventory WHERE item_id = ?', [id]);
  },

  getLowStock() {
    return query('SELECT * FROM low_stock_items');
  },

  create(item) {
    const result = execute(
      `INSERT INTO inventory (item_name, description, quantity, unit_price, reorder_level, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        item.item_name,
        item.description || null,
        item.quantity || 0,
        item.unit_price,
        item.reorder_level || 10,
        item.notes || null
      ]
    );
    return this.getById(result.lastInsertRowid);
  },

  update(id, item) {
    execute(
      `UPDATE inventory 
       SET item_name = ?, description = ?, unit_price = ?, reorder_level = ?, notes = ?
       WHERE item_id = ?`,
      [
        item.item_name,
        item.description || null,
        item.unit_price,
        item.reorder_level || 10,
        item.notes || null,
        id
      ]
    );
    return this.getById(id);
  },

  delete(id) {
    return execute('DELETE FROM inventory WHERE item_id = ?', [id]);
  }
};

// ==================================================================
// CLIENT OPERATIONS
// ==================================================================

const clients = {
  getAll() {
    return query('SELECT * FROM clients ORDER BY client_name');
  },

  getById(id) {
    return queryOne('SELECT * FROM clients WHERE client_id = ?', [id]);
  },

  create(client) {
    const result = execute(
      `INSERT INTO clients (client_name, email, phone, address, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        client.client_name,
        client.email || null,
        client.phone || null,
        client.address || null,
        client.notes || null
      ]
    );
    return this.getById(result.lastInsertRowid);
  },

  update(id, client) {
    execute(
      `UPDATE clients 
       SET client_name = ?, email = ?, phone = ?, address = ?, notes = ?
       WHERE client_id = ?`,
      [
        client.client_name,
        client.email || null,
        client.phone || null,
        client.address || null,
        client.notes || null,
        id
      ]
    );
    return this.getById(id);
  },

  delete(id) {
    return execute('DELETE FROM clients WHERE client_id = ?', [id]);
  }
};

// ==================================================================
// VENDOR OPERATIONS
// ==================================================================

const vendors = {
  getAll() {
    return query('SELECT * FROM vendors ORDER BY vendor_name');
  },

  getById(id) {
    return queryOne('SELECT * FROM vendors WHERE vendor_id = ?', [id]);
  },

  create(vendor) {
    const result = execute(
      `INSERT INTO vendors (vendor_name, email, phone, address, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        vendor.vendor_name,
        vendor.email || null,
        vendor.phone || null,
        vendor.address || null,
        vendor.notes || null
      ]
    );
    return this.getById(result.lastInsertRowid);
  },

  update(id, vendor) {
    execute(
      `UPDATE vendors 
       SET vendor_name = ?, email = ?, phone = ?, address = ?, notes = ?
       WHERE vendor_id = ?`,
      [
        vendor.vendor_name,
        vendor.email || null,
        vendor.phone || null,
        vendor.address || null,
        vendor.notes || null,
        id
      ]
    );
    return this.getById(id);
  },

  delete(id) {
    return execute('DELETE FROM vendors WHERE vendor_id = ?', [id]);
  }
};

// ==================================================================
// SALES OPERATIONS
// ==================================================================

const sales = {
  getAll() {
    return query('SELECT * FROM sales_summary');
  },

  getById(id) {
    const sale = queryOne('SELECT * FROM sales WHERE sale_id = ?', [id]);
    if (sale) {
      sale.items = query('SELECT * FROM sale_details WHERE sale_id = ?', [id]);
    }
    return sale;
  },

  getDetails() {
    return query('SELECT * FROM sale_details');
  },

  create(sale) {
    return transaction(() => {
      // Insert sale header
      const saleResult = execute(
        'INSERT INTO sales (client_id, notes) VALUES (?, ?)',
        [sale.client_id || null, sale.notes || null]
      );
      
      const saleId = saleResult.lastInsertRowid;

      // Insert sale items
      for (const item of sale.items) {
        execute(
          `INSERT INTO sale_items (sale_id, item_id, quantity, unit_price, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [
            saleId,
            item.item_id,
            item.quantity,
            item.unit_price,
            item.notes || null
          ]
        );
      }

      return this.getById(saleId);
    });
  },

  delete(id) {
    // Cascade will handle sale_items
    return execute('DELETE FROM sales WHERE sale_id = ?', [id]);
  }
};

// ==================================================================
// SUPPLY ORDER OPERATIONS
// ==================================================================

const supplyOrders = {
  getAll() {
    return query('SELECT * FROM supply_order_summary');
  },

  getById(id) {
    const order = queryOne('SELECT * FROM supply_orders WHERE supply_order_id = ?', [id]);
    if (order) {
      order.items = query('SELECT * FROM supply_order_details WHERE supply_order_id = ?', [id]);
    }
    return order;
  },

  getDetails() {
    return query('SELECT * FROM supply_order_details');
  },

  create(order) {
    return transaction(() => {
      // Insert supply order header
      const orderResult = execute(
        'INSERT INTO supply_orders (vendor_id, notes) VALUES (?, ?)',
        [order.vendor_id || null, order.notes || null]
      );
      
      const orderId = orderResult.lastInsertRowid;

      // Insert supply items
      for (const item of order.items) {
        execute(
          `INSERT INTO supply_items (supply_order_id, item_id, quantity, cost_price, notes)
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId,
            item.item_id,
            item.quantity,
            item.cost_price,
            item.notes || null
          ]
        );
      }

      return this.getById(orderId);
    });
  },

  delete(id) {
    // Cascade will handle supply_items
    return execute('DELETE FROM supply_orders WHERE supply_order_id = ?', [id]);
  }
};

// ==================================================================
// REPORTS
// ==================================================================

const reports = {
  inventorySummary() {
    const totalValue = queryOne(`
      SELECT SUM(quantity * unit_price) as total_value,
             SUM(quantity) as total_items
      FROM inventory
    `);
    
    const lowStockCount = queryOne(`
      SELECT COUNT(*) as count FROM low_stock_items
    `);

    return {
      total_value: totalValue.total_value || 0,
      total_items: totalValue.total_items || 0,
      low_stock_count: lowStockCount.count || 0
    };
  },

  transactionSummary() {
    const salesTotal = queryOne(`
      SELECT SUM(subtotal) as total FROM sale_items
    `);

    const supplyTotal = queryOne(`
      SELECT SUM(subtotal) as total FROM supply_items
    `);

    const salesCount = queryOne(`
      SELECT COUNT(*) as count FROM sales
    `);

    const supplyCount = queryOne(`
      SELECT COUNT(*) as count FROM supply_orders
    `);

    return {
      sales_revenue: salesTotal.total || 0,
      sales_count: salesCount.count || 0,
      supply_cost: supplyTotal.total || 0,
      supply_count: supplyCount.count || 0,
      gross_margin: (salesTotal.total || 0) - (supplyTotal.total || 0)
    };
  }
};

// ==================================================================
// EXPORTS
// ==================================================================

module.exports = {
  db,
  query,
  queryOne,
  execute,
  transaction,
  inventory,
  clients,
  vendors,
  sales,
  supplyOrders,
  reports
};