#!/bin/bash

DB_FILE="inventory.db"
VIEWS_FILE="views.sql"

echo "🔧 Adding missing views to existing database..."

# ==================================================================
# Check if database exists
# ==================================================================

if [ ! -f "$DB_FILE" ]; then
    echo "❌ Error: Database '$DB_FILE' not found!"
    exit 1
fi

# ==================================================================
# Check if views file exists
# ==================================================================

if [ ! -f "$VIEWS_FILE" ]; then
    echo "❌ Error: $VIEWS_FILE not found!"
    exit 1
fi

# ==================================================================
# Add views to existing database
# ==================================================================

echo "👁️  Creating views..."
sqlite3 "$DB_FILE" < "$VIEWS_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Views created successfully"
else
    echo "❌ View creation failed"
    exit 1
fi

# ==================================================================
# Verify views were created
# ==================================================================

echo ""
echo "📊 Views in database:"
sqlite3 "$DB_FILE" "SELECT name FROM sqlite_master WHERE type='view' ORDER BY name;"

echo ""
echo "✅ Views added successfully!"
echo ""
echo "Test a view:"
echo "  sqlite3 $DB_FILE \"SELECT * FROM sales_summary;\""
