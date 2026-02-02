# 🚀 Oracle Cloud VM Setup Guide - HealthNHabits

Complete guide for deploying **HealthNHabits** to your Oracle Cloud VM with Cloudflare DNS.

---

## 📑 Table of Contents

- [Part 1: Connect to Your VM](#part-1-connect-to-your-vm)
- [Part 2: Configure Oracle Cloud Firewall](#part-2-configure-oracle-cloud-firewall)
- [Part 3: Configure Cloudflare DNS](#part-3-configure-cloudflare-dns)
- [Part 4: Backup Before Changes](#part-4-backup-before-changes)
- [Part 5: Run Initial Setup Script](#part-5-run-initial-setup-script)
- [Part 6: Configure Environment Variables](#part-6-configure-environment-variables)
- [Part 7: Start Containers](#part-7-start-containers)
- [Part 8: Verify Installation](#part-8-verify-installation)
- [Part 9: Troubleshooting](#part-9-troubleshooting)
- [Part 10: Updating the Application](#part-10-updating-the-application)
- [Port Reference](#port-reference)

---

## 📋 Prerequisites

| Requirement | Value |
|-------------|-------|
| VM IP Address | `149.118.67.133` |
| GitHub Repo | `https://github.com/furkantekkartal/HealthNHabits` |
| Domain | `furkantekkartal.com` |
| SSH User | `ubuntu` |

> [!WARNING]
> **FTcom Gateway Must Be Running First!**
> This project requires the **FTcom** gateway (Project ID 1) to be deployed and running on Port 80. If you haven't deployed FTcom yet, do that first by following its `ORACLE_VM_SETUP.md`.

---

## Part 1: Connect to Your VM

Using PuTTY:
1. Host: `149.118.67.133`, Port: `22`
2. Connection → SSH → Auth → Credentials: Select your `.ppk` file
3. Login as: `ubuntu`

---

## Part 2: Configure Oracle Cloud Firewall

Add these **Ingress Rules** in [Oracle Cloud Console](https://cloud.oracle.com) → Networking → VCN → Security List:

| Source CIDR | Protocol | Port | Description |
|-------------|----------|------|-------------|
| `0.0.0.0/0` | TCP | 2110 | Dev Backend (Project ID 2) |
| `0.0.0.0/0` | TCP | 2120 | Dev Frontend (Project ID 2) |
| `0.0.0.0/0` | TCP | 2130 | Dev Database (Project ID 2) |
| `0.0.0.0/0` | TCP | 2210 | Prod Backend (Project ID 2) |
| `0.0.0.0/0` | TCP | 2220 | Prod Frontend (Project ID 2) |
| `0.0.0.0/0` | TCP | 2230 | Prod Database (Project ID 2) |

> [!NOTE]
> Ports 80 and 443 are managed by **FTcom** (Project ID 1). HealthNHabbits is accessed via subdomains that FTcom proxies to Port 2220.

---

## Part 3: Configure Cloudflare DNS

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Your Domain → DNS → Records
2. Add these **A records** (all pointing to your VM IP):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `149.118.67.133` | DNS only (gray cloud) |
| A | `www` | `149.118.67.133` | DNS only (gray cloud) |
| A | `healthnhabits` | `149.118.67.133` | DNS only (gray cloud) |
| A | `healthnhabits-dev` | `149.118.67.133` | DNS only (gray cloud) |

> ⚠️ **Important:** Keep Proxy OFF (gray cloud) unless you configure SSL through Cloudflare.

**Result URLs:**
- `http://furkantekkartal.com` → Portfolio (FTcom Project)
- `http://healthnhabits.furkantekkartal.com` → Production (Proxied to Port 2220)
- `http://healthnhabits-dev.furkantekkartal.com` → Development (Proxied to Port 2120)

---

## Part 4: Backup Before Changes

Before any major changes, backup your data to a safe location:

```bash
# Create a permanent backup folder (outside project directory)
sudo mkdir -p /home/ubuntu/backups/healthnhabits
sudo chown ubuntu:ubuntu /home/ubuntu/backups/healthnhabits

# Create timestamped backup
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /home/ubuntu/backups/healthnhabits/$BACKUP_DATE

# Backup Production Database
docker exec healthnhabits-db pg_dump -U healthnhabits -d healthnhabits > /home/ubuntu/backups/healthnhabits/$BACKUP_DATE/prod_database.sql

# Backup Upload Files (from Docker volume)
docker cp healthnhabits-backend:/app/uploads /home/ubuntu/backups/healthnhabits/$BACKUP_DATE/prod_uploads 2>/dev/null || echo "No uploads found"

# Verify
ls -la /home/ubuntu/backups/healthnhabits/$BACKUP_DATE
```

> 📁 **Safe Location:** `/home/ubuntu/backups/` is outside the project folder and won't be deleted.

---

## Part 5: Run Initial Setup Script

This script automatically:
- Updates system packages
- Installs Docker and Git
- Configures iptables firewall
- Clones the repository to `~/apps/HealthNHabits`
- Creates `.env` file from template

```bash
curl -sSL https://raw.githubusercontent.com/furkantekkartal/HealthNHabits/master/scripts/initial-setup.sh | bash
```

> ⚠️ **IMPORTANT: After this script completes, you MUST log out and log back in for Docker permissions to take effect!**

---

## Part 6: Configure Environment Variables

```bash
cd ~/apps/HealthNHabits
nano .env
```

Fill in your values:
```env
POSTGRES_USER=healthnhabits
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=healthnhabits
JWT_SECRET=YOUR_LONG_RANDOM_STRING
GEMINI_API_KEY=your_gemini_api_key
```

---

## Part 7: Start Containers

> ⚠️ **IMPORTANT:** Start DEV first (creates network), then PROD (connects to dev network for subdomain routing).

### Step 1: Start Development
```bash
cd ~/apps/HealthNHabits
docker-compose -f docker-compose-dev.yml up -d --build
```

### Step 2: Start Production
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Verify Both Running
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Expected output:
```
NAMES                        STATUS
healthnhabits-nginx          Up (healthy)
healthnhabits-frontend       Up (healthy)
healthnhabits-backend        Up (healthy)
healthnhabits-db             Up (healthy)
dev-healthnhabits-nginx      Up (healthy)
dev-healthnhabits-frontend   Up (healthy)
dev-healthnhabits-backend    Up (healthy)
dev-healthnhabits-db         Up (healthy)
```

---

## Part 8: Verify Installation

### Check Subdomains (Via FTcom Gateway)
```bash
curl -I http://furkantekkartal.com  # Should show portfolio
curl -I http://healthnhabits.furkantekkartal.com  # Should now return 200 OK
curl -I http://healthnhabits-dev.furkantekkartal.com  # Should now return 200 OK
```

All should return `HTTP/1.1 200 OK` if both FTcom and HealthNHabbits are running.

### Check Container Logs
```bash
docker logs healthnhabits-backend --tail 20
docker logs dev-healthnhabits-backend --tail 20
```

### Check Health Endpoints
```bash
curl http://localhost:2210/api/health  # Production Backend
curl http://localhost:2110/api/health  # Development Backend
```

---

## Part 9: Troubleshooting

### Fix: Docker-Compose "ContainerConfig" Error

If you see `KeyError: 'ContainerConfig'`:

```bash
# Force remove containers
docker rm -f $(docker ps -aq --filter "name=healthnhabits") 2>/dev/null || true

# Start again
docker-compose -f docker-compose-dev.yml up -d --build
docker-compose -f docker-compose.prod.yml up -d --build
```

### Dev Subdomain Returns 502

Dev containers might not be running:
```bash
docker-compose -f docker-compose-dev.yml up -d
```

### Clean Up Disk Space
```bash
docker system prune -af
```

---

## Part 10: Updating the Application

### Workflow: Dev → Test → Push to Master → Deploy Prod

#### Step 1: Clone Production Data (Before Changes)
```bash
cd ~/apps/HealthNHabits
bash scripts/clone-prod-to-dev.sh
```

#### Step 2: Pull & Deploy Dev Changes
```bash
git fetch origin
git checkout dev
git pull origin dev

# Rebuild dev
docker rm -f $(docker ps -aq --filter "name=dev-healthnhabits") 2>/dev/null || true
docker-compose -f docker-compose-dev.yml up -d --build
```

Test at: `http://healthnhabits-dev.furkantekkartal.com`

#### Step 3: Push Dev to Master (on your local IDE)
```bash
git checkout master
git merge dev
git push origin master
```

#### Step 4: Deploy Production
```bash
cd ~/apps/HealthNHabits
git checkout master
git pull origin master

# Rebuild prod
docker rm -f $(docker ps -aq --filter "name=healthnhabits-") 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Step 5: Verify Both Running
```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## Part 11: Backup & Restore

### Quick Backup (Recommended)
```bash
cd ~/apps/HealthNHabits
bash scripts/backup.sh
```

This creates a complete backup including:
- `.env` configuration
- Production & Dev databases
- All upload files (images, analyzed images, profiles)

**Backup location**: `~/backups/healthnhabits/YYYYMMDD_HHMMSS/`

### Restore from Backup
```bash
# List available backups
ls -lh ~/backups/healthnhabits/

# Restore specific backup (replace TIMESTAMP with folder name)
bash ~/apps/HealthNHabits/scripts/restore-backup.sh TIMESTAMP
```

Example:
```bash
bash ~/apps/HealthNHabits/scripts/restore-backup.sh 20260202_180000
```

### Automated Daily Backups
```bash
# Add to crontab for daily backup at 3 AM
crontab -e

# Add this line:
0 3 * * * cd ~/apps/HealthNHabits && bash scripts/backup.sh >> ~/backups/backup.log 2>&1
```

---

## Port Reference

| Service | Dev Port | Prod Port | Notes |
|---------|----------|-----------|-------|
| Frontend | **2120** | **2220** | Accessed via FTcom Gateway on Port 80 |
| Backend | **2110** | **2210** | Direct API access |
| PostgreSQL | **2130** | **2230** | Internal only |

**Subdomains:**
| URL | Environment |
|-----|-------------|
| `furkantekkartal.com` | Portfolio |
| `healthnhabits.furkantekkartal.com` | Production |
| `healthnhabits-dev.furkantekkartal.com` | Development |

---
