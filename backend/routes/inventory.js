// ==================================================================
// INVENTORY ROUTES
// ==================================================================

const express = require('express');
const router = express.Router();
const { inventory } = require('../db');

// GET /api/inventory - Get all inventory items
router.get('/', (req, res) => {
  try {
    const items = inventory.getAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/low-stock - Get low stock items
router.get('/low-stock', (req, res) => {
  try {
    const items = inventory.getLowStock();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/:id - Get single item
router.get('/:id', (req, res) => {
  try {
    const item = inventory.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory - Create new item
router.post('/', (req, res) => {
  try {
    const newItem = inventory.create(req.body);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/inventory/:id - Update item
router.put('/:id', (req, res) => {
  try {
    const updatedItem = inventory.update(req.params.id, req.body);
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/inventory/:id - Delete item
router.delete('/:id', (req, res) => {
  try {
    inventory.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;