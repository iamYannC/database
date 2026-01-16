// ==================================================================
// EXPORT ROUTES
// ==================================================================

const express = require('express');
const router = express.Router();
const { buildWorkbook } = require('../exporter');

// GET /api/export/xlsx - Download Excel workbook
router.get('/xlsx', async (req, res) => {
  try {
    const workbook = await buildWorkbook();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-export-${ts}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({ error: 'Failed to generate export', message: error.message });
  }
});

module.exports = router;
