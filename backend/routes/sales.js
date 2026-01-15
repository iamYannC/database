// ==================================================================
// SALES ROUTES
// ==================================================================

const express = require('express');
const router = express.Router();
const { sales } = require('../db');

// GET /api/sales - Get all sales (summary view)
router.get('/', (req, res) => {
  try {
    const allSales = sales.getAll();
    res.json(allSales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sales/details - Get all sale details (with line items)
router.get('/details', (req, res) => {
  try {
    const details = sales.getDetails();
    res.json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sales/:id - Get single sale with items
router.get('/:id', (req, res) => {
  try {
    const sale = sales.getById(req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sales - Create new sale
// Body: { client_id?, notes?, items: [{item_id, quantity, unit_price, notes?}] }
router.post('/', (req, res) => {
  try {
    if (!req.body.items || req.body.items.length === 0) {
      return res.status(400).json({ error: 'Sale must have at least one item' });
    }

    const newSale = sales.create(req.body);
    res.status(201).json(newSale);
  } catch (error) {
    // Check if it's an inventory constraint error
    if (error.message.includes('negative')) {
      res.status(400).json({ error: 'Insufficient stock for one or more items' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// DELETE /api/sales/:id - Delete sale
router.delete('/:id', (req, res) => {
  try {
    sales.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;