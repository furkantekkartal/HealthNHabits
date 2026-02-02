# 🚀 Oracle Cloud VM Setup Guide - HealthNHabits

Complete guide for deploying **HealthNHabits** to your Oracle Cloud VM behind the FTcom Gateway.

---

## 📑 Table of Contents

- [Part 1: Connect to Your VM](#part-1-connect-to-your-vm)
- [Part 2: Configure Oracle Cloud Firewall](#part-2-configure-oracle-cloud-firewall)
- [Part 3: Configure Cloudflare DNS](#part-3-configure-cloudflare-dns)
- [Part 4: CRITICAL - Migration & Backup](#part-4-critical---migration--backup)
- [Part 5: Run Initial Setup Script](#part-5-run-initial-setup-script)
- [Part 6: Configure Environment Variables](#part-6-configure-environment-variables)
- [Part 7: Launch the Application (Project ID 2)](#part-7-launch-the-application)
- [Part 8: Verify Installation](#part-8-verify-installation)
- [Part 9: Troubleshooting](#part-9-troubleshooting)
- [Part 10: Updating the Application](#part-10-updating-the-application)

---

## Part 1: Connect to Your VM

### 1. Requirements
- Your VM Public IP (e.g., `152.xx.xx.xx`)
- Your Private Key file (`.key` or `.ppk`)
- SSH Client (PuTTY for Windows, or terminal for Mac/Linux)

### 2. Connection Command (Bash/CLI)
```bash
ssh -i path/to/your/key.key ubuntu@YOUR_VM_IP
```

---

## Part 2: Configure Oracle Cloud Firewall

Log in to [Oracle Cloud Console](https://cloud.oracle.com) and update your **Ingress Rules** for the project range (ID 2):

| Protocol | Source | Port Range | Description |
|----------|--------|------------|-------------|
| TCP | `0.0.0.0/0` | `2110-2130` | Development Range (API, UI, DB) |
| TCP | `0.0.0.0/0` | `2210-2230` | Production Range (API, UI, DB) |

> [!NOTE]
> Ports 80 and 443 are now managed by the **FTcom** project. You do not need to assign them to HealthNHabits.

---

## Part 3: Configure Cloudflare DNS

Ensure your subdomains are pointing to the VM IP in [Cloudflare DNS](https://dash.cloudflare.com/):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `healthnhabits` | `YOUR_VM_IP` | Proxied (Orange Cloud) |
| A | `healthnhabits-dev` | `YOUR_VM_IP` | Proxied (Orange Cloud) |

---

## Part 4: CRITICAL - Migration & Backup

If you are moving from the old Project 0/1 setup to this new Project 2 setup, use these commands:

### 1. Backup Existing Data (Run BEFORE cleanup)
```bash
# Create a permanent backup folder
mkdir -p ~/backups/hnh_migration_$(date +%Y%m%d)
BACKUP_PATH=~/backups/hnh_migration_$(date +%Y%m%d)

# Backup DB
docker exec healthnhabits-db pg_dump -U healthnhabits -d healthnhabits > $BACKUP_PATH/db_backup.sql

# Backup Uploads (Extract from Volume)
docker cp healthnhabits-backend:/app/uploads $BACKUP_PATH/
```

### 2. Full Cleanup (Fresh Start)
```bash
cd ~/apps/HealthNHabits
docker compose -f docker-compose.prod.yml down --volumes --remove-orphans
cd ..
rm -rf HealthNHabits
```

### 3. Restore Data (After Part 7)
Once the new environment is running, restore your data:
```bash
# Restore DB
cat $BACKUP_PATH/db_backup.sql | docker exec -i healthnhabits-db psql -U healthnhabits -d healthnhabits
```

---

## Part 5: Run Initial Setup Script

```bash
# Ensure you are in the apps directory
mkdir -p ~/apps && cd ~/apps

# Clone the repository
git clone https://github.com/furkantekkartal/HealthNHabits.git
cd HealthNHabits

# Run setup (ID 2 ranges)
# Note: You may need to manually update scripts/initial-setup.sh for 2xxx ports first
```

---

## Part 6: Configure Environment Variables

Create and edit the `.env` file:
```bash
cp .env.production.example .env
nano .env
```
Ensure you set:
- `POSTGRES_DB=healthnhabits`
- `POSTGRES_USER=healthnhabits`
- `POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD`
- `JWT_SECRET=YOUR_SECRET`

---

## Part 7: Launch the Application (Project ID 2)

### 1. Start Production (Port 2220)
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 2. Start Development (Port 2120)
```bash
docker compose -f docker-compose-dev.yml up -d --build
```

---

## Part 8: Verify Installation

Check if the containers are healthy:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Access Points
- **Production**: Accessible via `healthnhabits.furkantekkartal.com` (Requires FTcom Gateway running).
- **Development**: Accessible via `healthnhabits-dev.furkantekkartal.com` (Requires FTcom Gateway running).

---

## Part 9: Troubleshooting

### Reset Environment
If you see "ContainerConfig" errors:
```bash
docker system prune -f
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Part 10: Updating the Application

#### Step 1: Pull Changes
```bash
git checkout master
git pull origin master
```

#### Step 2: Re-deploy
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Port Reference (Project ID 2)

| Service | Dev Port | Prod Port | Notes |
|---------|----------|-----------|-------|
| Backend | **2110** | **2210** | |
| Frontend | **2120** | **2220** | Mapped to Gateway |
| Database | **2130** | **2230** | |

**Domain Mapping (FTcom Gateway):**
- `healthnhabits.furkantekkartal.com` -> `Internal:2220`
- `healthnhabits-dev.furkantekkartal.com` -> `Internal:2120`
