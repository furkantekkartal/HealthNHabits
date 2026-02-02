#!/bin/bash
# HealthNHabbits Unified Restore Script
# Restores database, uploads, and configuration from a backup

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_timestamp>"
    echo ""
    echo "Available backups:"
    ls -1 ~/backups/healthnhabits/ 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_ROOT=~/backups/healthnhabits
TIMESTAMP=$1
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "ERROR: Backup not found: $BACKUP_DIR"
    exit 1
fi

echo "=== HealthNHabbits Restore System ==="
echo "Restoring from: $BACKUP_DIR"
echo ""
cat "$BACKUP_DIR/MANIFEST.txt" 2>/dev/null || echo "Warning: No manifest found"
echo ""
read -p "Continue with restore? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# 1. Restore .env file
if [ -f "$BACKUP_DIR/.env" ]; then
    echo "1. Restoring .env configuration..."
    cp "$BACKUP_DIR/.env" ~/apps/HealthNHabits/.env
else
    echo "1. No .env file in backup, skipping..."
fi

# 2. Restore Production Database
if [ -f "$BACKUP_DIR/database_prod.sql" ]; then
    echo "2. Restoring production database..."
    docker exec healthnhabits-db psql -U healthnhabits -d postgres -c "DROP DATABASE IF EXISTS healthnhabits;"
    docker exec healthnhabits-db psql -U healthnhabits -d postgres -c "CREATE DATABASE healthnhabits;"
    cat "$BACKUP_DIR/database_prod.sql" | docker exec -i healthnhabits-db psql -U healthnhabits -d healthnhabits
else
    echo "2. No production database in backup, skipping..."
fi

# 3. Restore Dev Database
if [ -f "$BACKUP_DIR/database_dev.sql" ]; then
    echo "3. Restoring dev database..."
    docker exec dev-healthnhabits-db psql -U healthnhabits -d postgres -c "DROP DATABASE IF EXISTS dev_healthnhabits;" 2>/dev/null
    docker exec dev-healthnhabits-db psql -U healthnhabits -d postgres -c "CREATE DATABASE dev_healthnhabits;" 2>/dev/null
    cat "$BACKUP_DIR/database_dev.sql" | docker exec -i dev-healthnhabits-db psql -U healthnhabits -d dev_healthnhabits 2>/dev/null || echo "   Dev DB restore skipped"
else
    echo "3. No dev database in backup, skipping..."
fi

# 4. Restore Production Uploads
if [ -d "$BACKUP_DIR/uploads_prod" ]; then
    echo "4. Restoring production uploads..."
    docker exec healthnhabits-backend rm -rf /app/uploads/* 2>/dev/null
    docker cp "$BACKUP_DIR/uploads_prod/." healthnhabits-backend:/app/uploads/
    docker exec healthnhabits-backend chown -R node:node /app/uploads
else
    echo "4. No production uploads in backup, skipping..."
fi

# 5. Restore Dev Uploads
if [ -d "$BACKUP_DIR/uploads_dev" ]; then
    echo "5. Restoring dev uploads..."
    docker exec dev-healthnhabits-backend rm -rf /app/uploads/* 2>/dev/null
    docker cp "$BACKUP_DIR/uploads_dev/." dev-healthnhabits-backend:/app/uploads/ 2>/dev/null || echo "   Dev uploads restore skipped"
    docker exec dev-healthnhabits-backend chown -R node:node /app/uploads 2>/dev/null
else
    echo "5. No dev uploads in backup, skipping..."
fi

echo ""
echo "=== Restore Complete ==="
echo ""
echo "Verification:"
docker exec healthnhabits-db psql -U healthnhabits -d healthnhabits -c "SELECT COUNT(*) AS users FROM users;" 2>/dev/null
docker exec healthnhabits-backend ls -lh /app/uploads 2>/dev/null | head -5
