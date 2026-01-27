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

## Part 1: Connect to Your VM

Using PuTTY:
1. Host: `152.67.97.67`, Port: `22`
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
| `0.0.0.0/0` | TCP | 1210 | Prod Backend |
| `0.0.0.0/0` | TCP | 1220 | Prod Frontend |

---

## Part 3: Configure DNS (DuckDNS)

1. Go to [DuckDNS.org](https://www.duckdns.org/)
2. Find your subdomain: `furkantekkartal`
3. Set the IP to: `152.67.97.67`
4. Click **update ip**

---

## Part 4: Cleanup Previous Installation (Optional)

> **Skip this step if this is your first time setting up HealthNHabits.**

If you have previously installed HealthNHabits and want a fresh start:

```bash
cd ~/apps/HealthNHabits

# Stop only this project's containers (does NOT affect other projects)
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.yml down 2>/dev/null || true

# Remove only this project's images (optional, saves disk space)
docker images | grep healthnhabits | awk '{print $3}' | xargs -r docker rmi -f
```

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

After this script completes, **log out and log back in** for Docker permissions to take effect.

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

## Part 7: Configure Nginx

```bash
nano nginx/conf.d/default.conf
```

Find `server_name` and set it to:
```
server_name furkantekkartal.duckdns.org;
```

---

## Part 8: Start Containers

### Option A: Production Only (Recommended)

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

| Access | URL |
|--------|-----|
| Main Site | `http://furkantekkartal.duckdns.org` |
| Direct Frontend | `http://152.67.97.67:1220` |
| Direct Backend | `http://152.67.97.67:1210` |

---

### Option B: Development Only

```bash
docker-compose -f docker-compose.yml up -d --build
```

| Access | URL |
|--------|-----|
| Dev Frontend | `http://152.67.97.67:1120` |
| Dev Backend | `http://152.67.97.67:1110` |

---

### Option C: Both Environments (Side-by-Side)

Production and Development use different ports and container names, so they can run simultaneously.

```bash
# Start Production
docker-compose -f docker-compose.prod.yml up -d --build

# Start Development
docker-compose -f docker-compose.yml up -d --build
```

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Production | `http://furkantekkartal.duckdns.org` | `http://152.67.97.67:1210` |
| Development | `http://152.67.97.67:1120` | `http://152.67.97.67:1110` |

> **Note**: The Always Free VM has ~1GB RAM. Running both may cause slowdowns. Stop whichever you're not using:
> ```bash
> docker-compose -f docker-compose.yml down      # Stop Dev
> docker-compose -f docker-compose.prod.yml down # Stop Prod
> ```

---

## Part 9: Verify Installation

Check running containers:
```bash
docker ps
```

You should see:
- `healthnhabits-db`
- `healthnhabits-backend`
- `healthnhabits-frontend`
- `healthnhabits-nginx`

Test the health endpoint:
```bash
curl http://localhost/api/health
```

---

## Updating the Application

When you push new code to GitHub:

```bash
cd ~/apps/HealthNHabits
git pull origin master
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Port Reference

| Service | Dev Port | Prod Port |
|---------|----------|-----------|
| Frontend | 1120 | 1220 (or 80) |
| Backend | 1110 | 1210 |
| PostgreSQL | 5433 | 5432 (internal) |

See [PORTS.md](PORTS.md) for the complete port registry.

---
