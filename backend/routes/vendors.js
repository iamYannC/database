// ==================================================================
// VENDORS ROUTES
// ==================================================================

const express = require('express');
const router = express.Router();
const { vendors } = require('../db');

// GET /api/vendors - Get all vendors
router.get('/', (req, res) => {
  try {
    const allVendors = vendors.getAll();
    res.json(allVendors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/vendors/:id - Get single vendor
router.get('/:id', (req, res) => {
  try {
    const vendor = vendors.getById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/vendors - Create new vendor
router.post('/', (req, res) => {
  try {
    const newVendor = vendors.create(req.body);
    res.status(201).json(newVendor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/vendors/:id - Update vendor
router.put('/:id', (req, res) => {
  try {
    const updatedVendor = vendors.update(req.params.id, req.body);
    if (!updatedVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json(updatedVendor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/vendors/:id - Delete vendor
router.delete('/:id', (req, res) => {
  try {
    vendors.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;