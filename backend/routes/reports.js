// ==================================================================
// REPORTS ROUTES
// ==================================================================

const express = require('express');
const router = express.Router();
const { reports } = require('../db');

// GET /api/reports/inventory - Get inventory summary
router.get('/inventory', (req, res) => {
  try {
    const summary = reports.inventorySummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/transactions - Get transaction summary
router.get('/transactions', (req, res) => {
  try {
    const summary = reports.transactionSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/dashboard - Get combined dashboard data
router.get('/dashboard', (req, res) => {
  try {
    const inventory = reports.inventorySummary();
    const transactions = reports.transactionSummary();
    
    res.json({
      inventory,
      transactions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;