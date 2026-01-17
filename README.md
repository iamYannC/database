# Backend Setup Guide

## Directory Structure

```
inventory-app/
├── backend/
│   ├── routes/
│   │   ├── inventory.js
│   │   ├── clients.js
│   │   ├── vendors.js
│   │   ├── sales.js
│   │   ├── supply.js
│   │   └── reports.js
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── index.html
│   ├── app.js
│   ├── i18n.js
│   └── styles.css
├── database/
│   ├── schema.sql
│   ├── views.sql
│   ├── deploy.sh
│   └── inventory.db
└── README.md
```

## Installation Steps

### 1. Install Node.js

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# Verify installation
node --version  # Should be v16+ 
npm --version
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- `express` - Web framework
- `better-sqlite3` - Fast SQLite driver
- `cors` - Enable cross-origin requests
- `nodemon` - Auto-restart on file changes (dev only)

### 3. Verify Database

```bash
cd ../database

# If inventory.db doesn't exist, create it:
sqlite3 inventory.db < schema.sql
sqlite3 inventory.db < views.sql

# Verify
sqlite3 inventory.db "SELECT name FROM sqlite_master WHERE type='table';"
```

## Running the Server

### Development Mode (auto-restart)

```bash
cd backend
npm run dev
```

### Production Mode

```bash
cd backend
npm start
```

The server will start on **http://localhost:3000**

## Frontend i18n

- Translations live in `frontend/i18n.js` and are loaded before `frontend/app.js`.
- The language toggle in the sidebar updates the UI instantly and persists the preference in `localStorage`.

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Inventory Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get all inventory items |
| GET | `/api/inventory/low-stock` | Get low stock items |
| GET | `/api/inventory/:id` | Get single item |
| POST | `/api/inventory` | Create new item |
| PUT | `/api/inventory/:id` | Update item |
| DELETE | `/api/inventory/:id` | Delete item |

**Example POST /api/inventory:**
```json
{
  "item_name": "Coffee Beans 1kg",
  "description": "Arabica blend",
  "quantity": 0,
  "unit_price": 19.50,
  "reorder_level": 5,
  "notes": "Premium quality"
}
```

### Client Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clients` | Get all clients |
| GET | `/api/clients/:id` | Get single client |
| POST | `/api/clients` | Create new client |
| PUT | `/api/clients/:id` | Update client |
| DELETE | `/api/clients/:id` | Delete client |

**Example POST /api/clients:**
```json
{
  "client_name": "Café Central",
  "email": "cafe@central.com",
  "phone": "+31 20 123 4567",
  "address": "Amsterdam, Netherlands",
  "notes": "Regular customer"
}
```

### Vendor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendors` | Get all vendors |
| GET | `/api/vendors/:id` | Get single vendor |
| POST | `/api/vendors` | Create new vendor |
| PUT | `/api/vendors/:id` | Update vendor |
| DELETE | `/api/vendors/:id` | Delete vendor |

### Sales Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | Get all sales (summary) |
| GET | `/api/sales/details` | Get all sale line items |
| GET | `/api/sales/:id` | Get single sale with items |
| POST | `/api/sales` | Create new sale |
| DELETE | `/api/sales/:id` | Delete sale |

**Example POST /api/sales:**
```json
{
  "client_id": 1,
  "notes": "Cash sale",
  "items": [
    {
      "item_id": 1,
      "quantity": 5,
      "unit_price": 19.50,
      "notes": null
    },
    {
      "item_id": 2,
      "quantity": 3,
      "unit_price": 2.40,
      "notes": "Discount applied"
    }
  ]
}
```

### Supply Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/supply` | Get all supply orders (summary) |
| GET | `/api/supply/details` | Get all supply line items |
| GET | `/api/supply/:id` | Get single order with items |
| POST | `/api/supply` | Create new supply order |
| DELETE | `/api/supply/:id` | Delete supply order |

**Example POST /api/supply:**
```json
{
  "vendor_id": 1,
  "notes": "Weekly delivery",
  "items": [
    {
      "item_id": 1,
      "quantity": 50,
      "cost_price": 12.00,
      "notes": null
    }
  ]
}
```

### Reports Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/inventory` | Inventory summary |
| GET | `/api/reports/transactions` | Transaction summary |
| GET | `/api/reports/dashboard` | Combined dashboard data |

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3000/api/health

# Get all inventory
curl http://localhost:3000/api/inventory

# Create new item
curl -X POST http://localhost:3000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test Item",
    "unit_price": 10.50,
    "quantity": 0,
    "reorder_level": 5
  }'

# Get low stock items
curl http://localhost:3000/api/inventory/low-stock
```

### Using Browser

Open: http://localhost:3000/api/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T...",
  "database": "connected"
}
```

## Database Triggers

The backend respects SQLite triggers:

✅ **Sales automatically decrease inventory**
- When you POST to `/api/sales`, triggers update inventory quantities
- Sales are blocked if stock would go negative

✅ **Supply orders automatically increase inventory**
- When you POST to `/api/supply`, triggers update inventory quantities

✅ **Deletions restore inventory**
- Deleting a sale restores the sold quantities
- Deleting a supply order removes the received quantities

## Troubleshooting

### Error: "Cannot find module 'better-sqlite3'"

```bash
cd backend
npm install
```

### Error: "ENOENT: no such file or directory"

Make sure the directory structure is correct and `inventory.db` is in the `database/` folder.

### Database is locked

Close any other programs accessing the database (like DB Browser for SQLite).

### Port 3000 already in use

```bash
# Change port in server.js
const PORT = process.env.PORT || 3001;

# Or set environment variable
PORT=3001 npm start
```

## Next Steps

1. ✅ Backend is running
2. 🔄 Update frontend to use API (next step)
3. 🚀 Deploy to production

## Production Deployment

For production, Consider:

1. **Use PM2 for process management:**
```bash
npm install -g pm2
pm2 start server.js --name inventory-api
pm2 startup
pm2 save
```

2. **Add environment variables:**
Create `.env` file:
```
PORT=3000
NODE_ENV=production
DB_PATH=../database/inventory.db
```

3. **Add HTTPS with nginx reverse proxy**

4. **Package as desktop app with Electron** (optional)

## Development Tips

- Database is at: `../database/inventory.db`
- Frontend is served from: `./frontend/`
- API routes are prefixed with: `/api/`
- All routes use JSON for request/response
- Errors return proper HTTP status codes
- SQLite transactions ensure data integrity
