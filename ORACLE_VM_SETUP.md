# 🚀 Oracle Cloud VM Setup Guide - HealthNHabits

Complete guide for deploying **HealthNHabits** and **Portfolio** to your Oracle Cloud VM.

---

## 📑 Table of Contents

- [Part 1: Connect to Your VM](#part-1-connect-to-your-vm)
- [Part 2: Configure Oracle Cloud Firewall](#part-2-configure-oracle-cloud-firewall)
- [Part 3: Configure Cloudflare DNS](#part-3-configure-cloudflare-dns)
- [Part 4: Cleanup Previous Installation](#part-4-cleanup-previous-installation-optional)
- [Part 5: Run Initial Setup Script](#part-5-run-initial-setup-script)
- [Part 6: Configure Environment Variables](#part-6-configure-environment-variables)
- [Part 7: Start Containers](#part-8-start-containers)
- [Part 8: Verify Installation](#part-9-verify-installation)
- [Part 9: Troubleshooting](#part-10-troubleshooting)
- [Part 10: Updating the Application](#part-11-updating-the-application)

---

## 📋 Prerequisites

| Requirement | Value |
|-------------|-------|
| VM IP Address | `149.118.67.133` |
| GitHub Repo | `https://github.com/furkantekkartal/HealthNHabits` |
| Domain | `furkantekkartal.com` |
| SSH User | `ubuntu` |

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
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |
| `0.0.0.0/0` | TCP | 1110 | Dev Backend |
| `0.0.0.0/0` | TCP | 1120 | Dev Frontend |
| `0.0.0.0/0` | TCP | 1130 | Dev Database |
| `0.0.0.0/0` | TCP | 1210 | Prod Backend |
| `0.0.0.0/0` | TCP | 1220 | Prod Frontend |
| `0.0.0.0/0` | TCP | 1230 | Prod Database |

---

## Part 3: Configure Cloudflare DNS

We use Cloudflare for DNS management (instead of DuckDNS).

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain (`furkantekkartal.com`)
3. Go to **DNS** → **Records**
4. Add the following **A records** (ensure Proxy status is **DNS Only** / grey cloud):

| Type | Name | Content | Proxy Status |
|------|------|---------|--------------|
| A | `@` | `149.118.67.133` | ☁️ DNS Only |
| A | `www` | `149.118.67.133` | ☁️ DNS Only |
| A | `healthnhabits` | `149.118.67.133` | ☁️ DNS Only |
| A | `healthnhabits-dev` | `149.118.67.133` | ☁️ DNS Only |

**URLs:**
- Portfolio: `http://furkantekkartal.com`
- Production: `http://healthnhabits.furkantekkartal.com`
- Development: `http://healthnhabits-dev.furkantekkartal.com`

---

## Part 4: Cleanup Previous Installation (Optional)

> **Skip this step if this is your first time setting up HealthNHabits.**

### ⚠️ IMPORTANT: Backup Before Cleanup

Before removing anything, **always backup your database and user files** to a safe location outside the project folder:

```bash
# Create a permanent backup folder (outside project directory - never gets deleted)
sudo mkdir -p /home/ubuntu/backups/healthnhabits
sudo chown ubuntu:ubuntu /home/ubuntu/backups/healthnhabits

# Create timestamped backup
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /home/ubuntu/backups/healthnhabits/$BACKUP_DATE

# Backup Production Database
docker exec healthnhabits-db pg_dump -U healthnhabits -d healthnhabits > /home/ubuntu/backups/healthnhabits/$BACKUP_DATE/prod_database.sql

# Backup Development Database (if exists)
docker exec dev-healthnhabits-db pg_dump -U healthnhabits -d dev_healthnhabits > /home/ubuntu/backups/healthnhabits/$BACKUP_DATE/dev_database.sql 2>/dev/null || echo "No dev database to backup"

# Backup Upload Files (profile pictures, etc.)
docker cp healthnhabits-backend:/app/uploads /home/ubuntu/backups/healthnhabits/$BACKUP_DATE/prod_uploads 2>/dev/null || echo "No prod uploads to backup"
docker cp dev-healthnhabits-backend:/app/uploads /home/ubuntu/backups/healthnhabits/$BACKUP_DATE/dev_uploads 2>/dev/null || echo "No dev uploads to backup"

# Verify backup
echo "✅ Backup created at: /home/ubuntu/backups/healthnhabits/$BACKUP_DATE"
ls -la /home/ubuntu/backups/healthnhabits/$BACKUP_DATE
```

> 📁 **Safe Location:** `/home/ubuntu/backups/` is outside the project folder and will NOT be deleted when you remove the project.

### Cleanup Commands

After backup is complete, you can safely cleanup:

```bash
cd ~/apps/HealthNHabits

# Stop only this project's containers (does NOT affect other projects)
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose-dev.yml down 2>/dev/null || true

# Remove only this project's images (optional, saves disk space)
docker images | grep healthnhabits | awk '{print $3}' | xargs -r docker rmi -f
```

### Restore from Backup (If Needed)

```bash
# Restore database from backup
cat /home/ubuntu/backups/healthnhabits/YYYYMMDD_HHMMSS/prod_database.sql | docker exec -i healthnhabits-db psql -U healthnhabits -d healthnhabits

# Restore upload files
docker cp /home/ubuntu/backups/healthnhabits/YYYYMMDD_HHMMSS/prod_uploads/. healthnhabits-backend:/app/uploads/
```

---

## Part 5: Run Initial Setup Script

This script automatically:
- Updates system packages
- Installs Docker and Git
- Configures iptables firewall (ports 80, 443, 1110, 1120, 1130, 1210, 1220, 1230)
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

Nginx handles routing based on subdomains (`healthnhabits-dev`, `healthnhabits`, `www`).
For this to work, **Dev environment MUST be started first** to create the network, then Prod connects to it.

```bash
cd ~/apps/HealthNHabits

# 1. Start Development Environment (Creates internal network)
docker-compose -f docker-compose-dev.yml up -d --build

# 2. Start Production Environment (Connects to dev network for routing)
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Verify All Containers
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Stop Environments

**Stop Everything:**
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose-dev.yml down
```

---

## Part 8: Verify Installation

Visit the URLs in your browser:

1. **Portfolio:** `http://furkantekkartal.com`
2. **Production App:** `http://healthnhabits.furkantekkartal.com`
3. **Development App:** `http://healthnhabits-dev.furkantekkartal.com`

### Check Container Logs
```bash
# Nginx / Router Logs
docker logs healthnhabits-nginx --tail 50

# Production Backend Logs
docker logs healthnhabits-backend --tail 50

# Development Backend Logs
docker logs dev-healthnhabits-backend --tail 50
```

---

## Part 9: Troubleshooting

### Fix: Docker-Compose "ContainerConfig" Error

If you see `KeyError: 'ContainerConfig'` when running `docker-compose up`, use these commands:

```bash
# Force remove and restart DEV
docker rm -f $(docker ps -aq --filter "name=dev-healthnhabits") 2>/dev/null || true
docker-compose -f docker-compose-dev.yml up -d --build

# Force remove and restart PROD
docker rm -f $(docker ps -aq --filter "name=healthnhabits-") 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build
```

### Fix: Dev Subdomain "502 Bad Gateway"

If `healthnhabits-dev.furkantekkartal.com` returns 502:
1. Ensure Dev containers are running: `docker ps | grep dev-`
2. Ensure Prod Nginx is connected to `healthnhabits_dev-network`:
   ```bash
   docker network inspect healthnhabits_dev-network | grep healthnhabits-nginx
   ```
3. Restart Nginx:
   ```bash
   docker restart healthnhabits-nginx
   ```

---

## Part 10: Updating the Application

### Development Workflow

1.  **Code**: Make changes locally on `dev` branch.
2.  **Push**: `git push origin dev`
3.  **Deploy Dev**:
    ```bash
    cd ~/apps/HealthNHabits
    git pull origin dev
    docker-compose -f docker-compose-dev.yml up -d --build
    ```
4.  **Test**: Verified at `http://healthnhabits-dev.furkantekkartal.com`

5.  **Sync Data (Optional)**: If you need fresh prod data in dev:
    ```bash
    bash scripts/clone-prod-to-dev.sh
    ```
    This script automatically:
    - Exports production database
    - Imports it into development database
    - Copies all upload files (profile images, etc.) to development
    *Note: Both environments must be running for this to work.*

6.  **Deploy Prod**:
    *   Merge `dev` to `master` locally and push.
    *   On VM:
        ```bash
        cd ~/apps/HealthNHabits
        git checkout master
        git pull origin master
        docker-compose -f docker-compose.prod.yml up -d --build
        ```

---
