#!/bin/bash
# HealthNHabbits Unified Backup Script
# Creates a complete backup of database, uploads, and configuration

# Configuration
BACKUP_ROOT=~/backups/healthnhabits
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

echo "=== HealthNHabbits Backup System ==="
echo "Creating backup in: $BACKUP_DIR"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# 1. Backup .env file
echo "1. Backing up .env configuration..."
cp ~/apps/HealthNHabits/.env "$BACKUP_DIR/.env"

# 2. Backup Production Database
echo "2. Backing up production database..."
docker exec healthnhabits-db pg_dump -U healthnhabits -d healthnhabits > "$BACKUP_DIR/database_prod.sql"

# 3. Backup Dev Database
echo "3. Backing up dev database..."
docker exec dev-healthnhabits-db pg_dump -U healthnhabits -d dev_healthnhabits > "$BACKUP_DIR/database_dev.sql" 2>/dev/null || echo "   Dev DB not running, skipped"

# 4. Backup Production Uploads
echo "4. Backing up production uploads..."
docker cp healthnhabits-backend:/app/uploads "$BACKUP_DIR/uploads_prod"

# 5. Backup Dev Uploads
echo "5. Backing up dev uploads..."
docker cp dev-healthnhabits-backend:/app/uploads "$BACKUP_DIR/uploads_dev" 2>/dev/null || echo "   Dev uploads not found, skipped"

# 6. Create backup manifest
echo "6. Creating backup manifest..."
cat > "$BACKUP_DIR/MANIFEST.txt" << EOF
HealthNHabbits Backup
Created: $(date)
Hostname: $(hostname)

Contents:
- .env file
- Production database (database_prod.sql)
- Dev database (database_dev.sql)
- Production uploads (uploads_prod/)
- Dev uploads (uploads_dev/)

To restore this backup:
  bash ~/apps/HealthNHabits/scripts/restore-backup.sh $TIMESTAMP
EOF

# 7. Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

echo ""
echo "=== Backup Complete ==="
echo "Location: $BACKUP_DIR"
echo "Size: $BACKUP_SIZE"
echo ""
echo "To restore: bash ~/apps/HealthNHabits/scripts/restore-backup.sh $TIMESTAMP"
