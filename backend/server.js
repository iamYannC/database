// ==================================================================
// INVENTORY MANAGEMENT SYSTEM - EXPRESS SERVER
// ==================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { db } = require('./db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==================================================================
// MIDDLEWARE
// ==================================================================

// Enable CORS for local development
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================================================================
// API ROUTES
// ==================================================================

const inventoryRoutes = require('./routes/inventory');
const clientRoutes = require('./routes/clients');
const vendorRoutes = require('./routes/vendors');
const salesRoutes = require('./routes/sales');
const supplyRoutes = require('./routes/supply');
const reportRoutes = require('./routes/reports');

app.use('/api/inventory', inventoryRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/supply', supplyRoutes);
app.use('/api/reports', reportRoutes);

// ==================================================================
// HEALTH CHECK
// ==================================================================

app.get('/api/health', (req, res) => {
  try {
    const row = db.prepare('SELECT 1 as ok').get();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: row && row.ok === 1 ? 'connected' : 'unknown'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'error',
      message: error.message
    });
  }
});

// ==================================================================
// FRONTEND ROUTES
// ==================================================================


// API 404
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});


// Serve index.html for all non-API routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ==================================================================
// ERROR HANDLING
// ==================================================================


// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// ==================================================================
// START SERVER
// ==================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Inventory Management System - Server        ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Frontend:  http://localhost:${PORT}`);
  console.log(`🔌 API:       http://localhost:${PORT}/api`);
  console.log(`💚 Health:    http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('📝 API Endpoints:');
  console.log('   GET    /api/inventory');
  console.log('   GET    /api/inventory/low-stock');
  console.log('   POST   /api/inventory');
  console.log('   GET    /api/clients');
  console.log('   POST   /api/clients');
  console.log('   GET    /api/vendors');
  console.log('   POST   /api/vendors');
  console.log('   GET    /api/sales');
  console.log('   POST   /api/sales');
  console.log('   GET    /api/supply');
  console.log('   POST   /api/supply');
  console.log('   GET    /api/reports/dashboard');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

// ==================================================================
// GRACEFUL SHUTDOWN
// ==================================================================

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
