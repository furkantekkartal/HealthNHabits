# 🚀 Oracle Cloud VM Setup Guide - HealthNHabits

Complete guide for deploying **HealthNHabits** to your Oracle Cloud Always Free VM.

---

## 📋 Prerequisites

| Requirement | Value |
|-------------|-------|
| VM IP Address | `152.67.97.67` |
| GitHub Repo | `https://github.com/furkantekkartal/HealthNHabits` |
| Domain | `furkantekkartal.duckdns.org` |
| SSH User | `ubuntu` |

---

## 🔧 Part 1: Initial VM Setup

### Step 1.1: Connect via SSH (PuTTY)

1. Host: `152.67.97.67`, Port: `22`
2. Connection → SSH → Auth → Credentials: Select your `.ppk` file
3. Login as: `ubuntu`

### Step 1.2: Run Initial Setup Script

```bash
curl -sSL https://raw.githubusercontent.com/furkantekkartal/HealthNHabits/master/scripts/initial-setup.sh | bash
```

⚠️ After this script completes, **log out and log back in** for Docker permissions to take effect.

---

## 🌐 Part 2: DNS Setup (Do This First!)

Before configuring Nginx, you need your domain pointing to the VM.

1. Go to [DuckDNS.org](https://www.duckdns.org/)
2. Find your subdomain: `furkantekkartal`
3. Update the IP to: `152.67.97.67`
4. Click **update ip**

---

## 🛡️ Part 3: Oracle Cloud Firewall

Add these **Ingress Rules** in [Oracle Cloud Console](https://cloud.oracle.com) → Networking → VCN → Security List:

| Source CIDR | Protocol | Port | Description |
|-------------|----------|------|-------------|
| `0.0.0.0/0` | TCP | 22 | SSH (already exists) |
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |
| `0.0.0.0/0` | TCP | 1110 | Dev Backend |
| `0.0.0.0/0` | TCP | 1120 | Dev Frontend |
| `0.0.0.0/0` | TCP | 1210 | Prod Backend |
| `0.0.0.0/0` | TCP | 1220 | Prod Frontend |

---

## 📦 Part 4: Clone Repository & Configure

### Step 4.1: Clone the Repository

```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/furkantekkartal/HealthNHabits.git HealthNHabits
cd HealthNHabits
```

### Step 4.2: Create Environment File

```bash
cp .env.production.example .env
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

### Step 4.3: Configure Nginx Domain

```bash
nano nginx/conf.d/default.conf
```

Find `server_name` and replace with:
```
server_name furkantekkartal.duckdns.org;
```

---

## 🧹 Part 5: Cleanup Old Containers (If Upgrading)

If you have old containers running (from a previous setup or with wrong names):

```bash
# Stop all running containers for this project
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.yml down 2>/dev/null || true

# Remove old images and cache to free space
docker system prune -af
```

---

## 🚀 Part 6: Start Containers

### Option A: Production Only (Recommended)

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

**Access**:
- Main Site: `http://furkantekkartal.duckdns.org`
- Direct (Port): `http://152.67.97.67:1220`
- API Direct: `http://152.67.97.67:1210`

---

### Option B: Development Only

```bash
docker-compose -f docker-compose.yml up -d --build
```

**Access**:
- Dev Site: `http://152.67.97.67:1120`
- Dev API: `http://152.67.97.67:1110`

---

### Option C: Both Environments (Side-by-Side)

You can run Production AND Development at the same time! They use different ports and container names.

```bash
# Start Production
docker-compose -f docker-compose.prod.yml up -d --build

# Start Development (alongside Production)
docker-compose -f docker-compose.yml up -d --build
```

**Access Both**:

| Environment | Frontend URL | Backend URL |
|-------------|--------------|-------------|
| **Production** | `http://furkantekkartal.duckdns.org` | `http://152.67.97.67:1210` |
| **Development** | `http://152.67.97.67:1120` | `http://152.67.97.67:1110` |

⚠️ **Memory Warning**: The Always Free VM has limited RAM (~1GB). Running both may cause slowdowns. Stop whichever you're not using:
```bash
docker-compose -f docker-compose.yml down      # Stop Dev
docker-compose -f docker-compose.prod.yml down # Stop Prod
```

---

## ✅ Part 7: Verification

### Check Container Status

```bash
docker ps
```

You should see containers like:
- `healthnhabits-db`
- `healthnhabits-backend`
- `healthnhabits-frontend`
- `healthnhabits-nginx`

### Test Health Endpoint

```bash
curl http://localhost/api/health
```

Expected response:
```json
{"status":"ok","database":{"type":"postgresql","connected":true}}
```

---

## 🔄 Updating the Application

When you push new code to GitHub:

```bash
cd ~/apps/HealthNHabits
git pull origin master
docker-compose -f docker-compose.prod.yml up -d --build
```

Or run the deploy script:
```bash
bash scripts/deploy.sh
```

---

## 📊 Quick Reference - Port Summary

See [PORTS.md](PORTS.md) for the full port registry.

| Service | Dev Port | Prod Port |
|---------|----------|-----------|
| Frontend | 1120 | 1220 (or 80) |
| Backend | 1110 | 1210 |
| PostgreSQL | 5433 | 5432 (internal) |

---
