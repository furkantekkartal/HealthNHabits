# HealthNHabbits Backup & Restore Guide

## Unified Backup System

This system creates complete backups including:
- `.env` configuration file
- Production database
- Dev database
- Production uploads (images, analyzed images, profile pictures)
- Dev uploads

---

## Creating a Backup

### Quick Backup
```bash
cd ~/apps/HealthNHabits
bash scripts/backup.sh
```

### What Gets Backed Up
```
~/backups/healthnhabits/YYYYMMDD_HHMMSS/
├── .env                    # Environment variables
├── database_prod.sql       # Production database dump
├── database_dev.sql        # Dev database dump
├── uploads_prod/           # Production uploads folder
│   ├── product_images/
│   ├── profile_pictures/
│   └── analyzed_images/
├── uploads_dev/            # Dev uploads folder
└── MANIFEST.txt            # Backup info
```

---

## Restoring a Backup

### List Available Backups
```bash
ls -lh ~/backups/healthnhabits/
```

### Restore a Specific Backup
```bash
# Replace TIMESTAMP with actual backup folder name (e.g., 20260202_180000)
bash ~/apps/HealthNHabits/scripts/restore-backup.sh TIMESTAMP
```

Example:
```bash
bash ~/apps/HealthNHabits/scripts/restore-backup.sh 20260202_180000
```

The script will:
1. Show you what will be restored
2. Ask for confirmation
3. Drop and recreate databases
4. Restore all data
5. Verify the restoration

---

## Automated Backups (Optional)

### Daily Backup Cron Job
```bash
# Edit crontab
crontab -e

# Add this line for daily backup at 3 AM
0 3 * * * cd ~/apps/HealthNHabits && bash scripts/backup.sh >> ~/backups/backup.log 2>&1
```

### Weekly Cleanup (Keep Last 4 Weeks)
```bash
# Add to crontab - runs every Sunday at 4 AM
0 4 * * 0 find ~/backups/healthnhabits -type d -mtime +28 -exec rm -rf {} +
```

---

## Manual Backup Commands

### Backup Only Database
```bash
docker exec healthnhabits-db pg_dump -U healthnhabits -d healthnhabits > ~/manual_db_backup.sql
```

### Backup Only Uploads
```bash
docker cp healthnhabits-backend:/app/uploads ~/manual_uploads_backup
```

### Backup Only .env
```bash
cp ~/apps/HealthNHabits/.env ~/.env_backup
```

---

## Cleanup Old Backup Systems

The old inconsistent backups are in:
- `~/backups/healthnhabits/*` (old structure)
- `~/migration_backups/` (migration data)

After confirming your new unified backup works:
```bash
# Archive old backups
mkdir -p ~/old_backups
mv ~/migration_backups ~/old_backups/
mv ~/backups/healthnhabits/20260201_085626 ~/old_backups/

# Or delete if you're sure
# rm -rf ~/migration_backups
# rm -rf ~/backups/healthnhabits/20260201_085626
```

---

## Troubleshooting

### Permission Errors
```bash
# Fix upload permissions
docker exec healthnhabits-backend chown -R node:node /app/uploads
docker exec dev-healthnhabits-backend chown -R node:node /app/uploads
```

### Database Connection Errors
```bash
# Restart containers
cd ~/apps/HealthNHabits
docker-compose -f docker-compose.prod.yml restart
docker-compose -f docker-compose-dev.yml restart
```

### Verify Restoration
```bash
# Check user count
docker exec healthnhabits-db psql -U healthnhabits -d healthnhabits -c "SELECT COUNT(*) FROM users;"

# Check uploads
docker exec healthnhabits-backend ls -la /app/uploads

# Check .env
cat ~/apps/HealthNHabits/.env
```
