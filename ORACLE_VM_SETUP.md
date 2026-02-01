# 🚀 Oracle Cloud VM Setup Guide - HealthNHabits (Secondary App)

Guide for deploying **HealthNHabits** behind the FTcom Gateway.

---

## ⚠️ CRITICAL: Migration Steps (Backup & Erase)

Failure to backup will result in data loss!

### 1. Backup Existing Data
Run these on the VM **BEFORE** erasing old folders:
```bash
# Create backup directory
mkdir -p ~/backups/hnh_$(date +%Y%m%d)
# Backup DB
docker exec healthnhabits-db pg_dump -U healthnhabits -d healthnhabits > ~/backups/hnh_$(date +%Y%m%d)/db_backup.sql
# Backup Uploads
cp -r ~/apps/HealthNHabits/backend/uploads ~/backups/hnh_$(date +%Y%m%d)/
```

### 2. Erase & Clean
```bash
cd ~/apps/HealthNHabits
docker-compose -f docker-compose.prod.yml down
# Proceed only if backup is verified!
rm -rf ~/apps/HealthNHabits
```

---

## 📑 Table of Contents
- [Part 1: Firewall Configuration](#part-1-firewall-configuration)
- [Part 2: Installation](#part-2-installation)
- [Part 3: Data Restoration](#part-3-data-restoration)

---

## Part 1: Firewall Configuration (Project ID 2)

Add these ingress rules to Oracle Cloud:

| Protocol | Port Range | Description |
|----------|------------|-------------|
| TCP | 2110-2130 | Development Range |
| TCP | 2210-2230 | Production Range |

---

## Part 2: Installation

1. Clone & Re-setup:
```bash
git clone https://github.com/furkantekkartal/HealthNHabits.git ~/apps/HealthNHabits
cd ~/apps/HealthNHabits
# Edit .env with your credentials
nano .env
```

2. Start Project:
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Part 3: Data Restoration

```bash
# Restore Database
cat ~/backups/hnh_DATE/db_backup.sql | docker exec -i healthnhabits-db psql -U healthnhabits -d healthnhabits
# Restore Uploads
cp -r ~/backups/hnh_DATE/uploads/* ~/apps/HealthNHabits/backend/uploads/
```

---

## Port Reference (ID 2)
| Service | Dev Port | Prod Port |
|---------|----------|-----------|
| Backend | 2110 | 2210 |
| Frontend | 2120 | 2220 |
| Database | 2130 | 2230 |
