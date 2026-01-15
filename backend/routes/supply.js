// ==================================================================
// SUPPLY ORDERS ROUTES
// ==================================================================

const express = require('express');
const router = express.Router();
const { supplyOrders } = require('../db');

// GET /api/supply - Get all supply orders (summary view)
router.get('/', (req, res) => {
  try {
    const allOrders = supplyOrders.getAll();
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/supply/details - Get all supply order details (with line items)
router.get('/details', (req, res) => {
  try {
    const details = supplyOrders.getDetails();
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/supply/:id - Get single supply order with items
router.get('/:id', (req, res) => {
  try {
    const order = supplyOrders.getById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Supply order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/supply - Create new supply order
// Body: { vendor_id?, notes?, items: [{item_id, quantity, cost_price, notes?}] }
router.post('/', (req, res) => {
  try {
    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({ error: 'Supply order must have at least one item' });
    }

    const newOrder = supplyOrders.create(req.body);
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/supply/:id - Delete supply order
router.delete('/:id', (req, res) => {
  try {
    supplyOrders.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;