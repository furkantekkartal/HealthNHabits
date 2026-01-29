# 🚀 Oracle Cloud VM Setup Guide - HealthNHabits

Complete guide for deploying **HealthNHabits** to your Oracle Cloud VM.

---

## 📑 Table of Contents

- [Part 1: Connect to Your VM](#part-1-connect-to-your-vm)
- [Part 2: Configure Oracle Cloud Firewall](#part-2-configure-oracle-cloud-firewall)
- [Part 3: Configure DNS (DuckDNS)](#part-3-configure-dns-duckdns)
- [Part 4: Cleanup Previous Installation](#part-4-cleanup-previous-installation-optional)
- [Part 5: Run Initial Setup Script](#part-5-run-initial-setup-script)
- [Part 6: Configure Environment Variables](#part-6-configure-environment-variables)
- [Part 7: Configure Nginx](#part-7-configure-nginx-optional)
- [Part 8: Start Containers](#part-8-start-containers)
- [Part 9: Verify Installation](#part-9-verify-installation)
- [Part 10: Troubleshooting](#part-10-troubleshooting)
- [Part 11: Updating the Application](#part-11-updating-the-application)
- [Port Reference](#port-reference)

---

## 📋 Prerequisites

| Requirement | Value |
|-------------|-------|
| VM IP Address | `149.118.67.133` |
| GitHub Repo | `https://github.com/furkantekkartal/HealthNHabits` |
| Domain | `furkantekkartal.duckdns.org` |
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

## Part 3: Configure DNS (DuckDNS)

1. Go to [DuckDNS.org](https://www.duckdns.org/)
2. Find your subdomain: `furkantekkartal`
3. Set the IP to: `149.118.67.133`
4. Click **update ip**

---

## Part 4: Cleanup Previous Installation (Optional)

> **Skip this step if this is your first time setting up HealthNHabits.**

If you have previously installed HealthNHabits and want a fresh start:

```bash
cd ~/apps/HealthNHabits

# Stop only this project's containers (does NOT affect other projects)
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose-dev.yml down 2>/dev/null || true

# Remove only this project's images (optional, saves disk space)
docker images | grep healthnhabits | awk '{print $3}' | xargs -r docker rmi -f
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

## Part 7: Configure Nginx (Optional)

> **Note:** The default domain is `furkantekkartal.duckdns.org`. If you want to use a different domain, update the nginx config. Otherwise, skip this step.

```bash
nano nginx/conf.d/default.conf
```

Find `server_name` and set it to your domain:
```
server_name your-domain.duckdns.org;
```

---

## Part 8: Start Containers

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

If you get `KeyError: 'ContainerConfig'` error, see [Part 10: Troubleshooting](#part-10-troubleshooting).

| Access | URL |
|--------|-----|
| Via Domain | `http://furkantekkartal.duckdns.org` |
| Direct Frontend | `http://149.118.67.133:1220` |

### Development

> **Note:** Development is designed to run alongside Production. They use different ports and don't interfere with each other.

```bash
docker-compose -f docker-compose-dev.yml up -d --build
```

If you get `KeyError: 'ContainerConfig'` error, see [Part 10: Troubleshooting](#part-10-troubleshooting).

| Access | URL |
|--------|-----|
| Via Domain | `http://furkantekkartal.duckdns.org:1120` |
| Direct Frontend | `http://149.118.67.133:1120` |

### Both Environments (Side-by-Side)

Production and Development use different ports and container names, so they can run simultaneously.

```bash
# Start Production
docker-compose -f docker-compose.prod.yml up -d --build

# Start Development
docker-compose -f docker-compose-dev.yml up -d --build

# Verify both are running
docker ps --format "table {{.Names}}\t{{.Status}}"
```

| Environment | Frontend | 
|-------------|----------|
| Production | `http://furkantekkartal.duckdns.org` |
| Development | `http://furkantekkartal.duckdns.org:1120` |

### Stop Environments

**Stop Development only:**
```bash
docker-compose -f docker-compose-dev.yml down
```

**Stop Production only:**
```bash
docker-compose -f docker-compose.prod.yml down
```

---

## Part 9: Verify Installation

### Check Container Status
```bash
docker ps
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Check Container Memory Usage
```bash
docker stats --no-stream
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

### View Container Logs
```bash
# Production logs
docker logs healthnhabits-backend --tail 50
docker logs healthnhabits-frontend --tail 50

# Development logs
docker logs dev-healthnhabits-backend --tail 50
docker logs dev-healthnhabits-frontend --tail 50
```

### Check System Resources
```bash
htop
free -h
```

### Test Health Endpoint
```bash
# Production
curl http://localhost:1210/api/health

# Development
curl http://localhost:1110/api/health
```

---

## Part 10: Troubleshooting

### Fix: Docker-Compose "ContainerConfig" Error

If you see this error when running `docker-compose up`:
```
KeyError: 'ContainerConfig'
```

This is a known bug with `docker-compose 1.29.2` and newer Docker versions.

**Solution 1: Force remove containers**
```bash
# For Production
docker rm -f $(docker ps -aq --filter "name=healthnhabits-") 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build

# For Development
docker rm -f $(docker ps -aq --filter "name=dev-healthnhabits") 2>/dev/null || true
docker-compose -f docker-compose-dev.yml up -d --build
```

**Solution 2: Manual build and run (if docker-compose keeps failing)**

```bash
# Remove problematic container
docker rm -f dev-healthnhabits-frontend

# Build without cache (replace IP with your VM IP)
docker build --no-cache -t healthnhabits_dev-frontend \
  --build-arg VITE_API_URL=http://149.118.67.133:1110/api \
  ./frontend

# Run manually
docker run -d \
  --name dev-healthnhabits-frontend \
  --network healthnhabits_dev-network \
  -p 1120:80 \
  --restart unless-stopped \
  healthnhabits_dev-frontend
```

### Free Up Disk Space

```bash
docker system prune -af
```

### Disable Snap (Optional - saves RAM)

Snap is Ubuntu's package manager - not needed for Docker servers.
```bash
sudo systemctl disable --now snapd
sudo systemctl disable --now snapd.socket
```

---

## Part 11: Updating the Application

### Development Workflow

The recommended workflow is:
1. Make changes locally on your IDE (dev branch)
2. Push to GitHub (dev branch)
3. Deploy to Dev environment on VM
4. Test thoroughly
5. Push to master branch
6. Deploy to Production

### Step 1: Clone Production Data to Development (Before Making Changes)

Before pulling new changes to dev, sync the data from production:

```bash
cd ~/apps/HealthNHabits
bash scripts/clone-prod-to-dev.sh
```

This script:
- Exports production database via `pg_dump`
- Clears development database
- Imports data to development (passwords stay hashed)
- Copies upload files (profile pictures, etc.)

> ⚠️ **Both environments must be running for this script to work!**

### Step 2: Update Development Environment

After pushing your changes to the `dev` branch from your IDE:

```bash
cd ~/apps/HealthNHabits

# Pull latest dev changes
git fetch origin
git checkout dev
git pull origin dev

# Rebuild dev containers (without affecting production)
docker rm -f $(docker ps -aq --filter "name=dev-healthnhabits") 2>/dev/null || true
docker-compose -f docker-compose-dev.yml up -d --build

# Verify dev is running
docker ps --filter "name=dev-healthnhabits"
```

Test your changes at: `http://149.118.67.133:1120`

### Step 3: Push Dev Changes to Master

Once dev is working correctly, push changes to master from your IDE:

```bash
# On your local machine (IDE)
git checkout master
git merge dev
git push origin master
```

### Step 4: Update Production Environment

```bash
cd ~/apps/HealthNHabits

# Pull latest master changes
git checkout master
git pull origin master

# Rebuild production containers (without affecting dev)
docker rm -f $(docker ps -aq --filter "name=healthnhabits-") 2>/dev/null || true
docker-compose -f docker-compose.prod.yml up -d --build

# Verify production is running
docker ps --filter "name=healthnhabits-"
```

### Step 5: Verify Both Environments Are Running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

You should see both prod and dev containers:
```
NAMES                        STATUS
healthnhabits-nginx          Up (healthy)
healthnhabits-frontend       Up (healthy)
healthnhabits-backend        Up (healthy)
healthnhabits-db             Up (healthy)
dev-healthnhabits-frontend   Up (healthy)
dev-healthnhabits-backend    Up (healthy)
dev-healthnhabits-db         Up (healthy)
```

---

## Port Reference

| Service | Dev Port | Prod Port |
|---------|----------|-----------|
| Frontend | 1120 | 1220 (or 80) |
| Backend | 1110 | 1210 |
| PostgreSQL | 1130 | 1230 |

See [PORTS.md](PORTS.md) for the complete port registry.

---
