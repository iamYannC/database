// ==================================================================
// CLIENTS ROUTES
// ==================================================================

const express = require('express');
const router = express.Router();
const { clients } = require('../db');

// GET /api/clients - Get all clients
router.get('/', (req, res) => {
  try {
    const allClients = clients.getAll();
    res.json(allClients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clients/:id - Get single client
router.get('/:id', (req, res) => {
  try {
    const client = clients.getById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clients - Create new client
router.post('/', (req, res) => {
  try {
    const newClient = clients.create(req.body);
    res.status(201).json(newClient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', (req, res) => {
  try {
    const updatedClient = clients.update(req.params.id, req.body);
    if (!updatedClient) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(updatedClient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', (req, res) => {
  try {
    clients.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;