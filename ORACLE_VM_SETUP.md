# 🚀 Oracle Cloud VM Setup Guide - HealthNHabits

Complete guide for deploying **HealthNHabits** to your Oracle Cloud Always Free VM.

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
| `0.0.0.0/0` | TCP | 1210 | Prod Backend |
| `0.0.0.0/0` | TCP | 1220 | Prod Frontend |

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
docker-compose -f docker-compose.yml down 2>/dev/null || true

# Remove only this project's images (optional, saves disk space)
docker images | grep healthnhabits | awk '{print $3}' | xargs -r docker rmi -f
```

---

## Part 5: Run Initial Setup Script

This script automatically:
- Updates system packages
- Installs Docker and Git
- Configures iptables firewall (ports 80, 443, 1110, 1120, 1210, 1220)
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

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

| Access | URL |
|--------|-----|
| Via Domain | `http://furkantekkartal.duckdns.org` |
| Direct Frontend | `http://149.118.67.133:1220` |
| Direct Backend | `http://149.118.67.133:1210` |

### Development

```bash
docker-compose -f docker-compose.yml up -d --build
```

| Access | URL |
|--------|-----|
| Via Domain | `http://furkantekkartal.duckdns.org:1120` |
| Direct Frontend | `http://149.118.67.133:1120` |
| Direct Backend | `http://149.118.67.133:1110` |

### Both Environments (Side-by-Side)

Production and Development use different ports and container names, so they can run simultaneously.

```bash
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.yml up -d --build
```

| Environment | Frontend | Backend |
|-------------|----------|---------|
| Production | `http://furkantekkartal.duckdns.org` | `http://149.118.67.133:1210` |
| Development | `http://furkantekkartal.duckdns.org:1120` | `http://149.118.67.133:1110` |

> **Note**: The Always Free VM has ~1GB RAM. Running both may cause slowdowns.

**Stop environments:**
```bash
docker-compose -f docker-compose.yml down      # Stop Dev
docker-compose -f docker-compose.prod.yml down # Stop Prod
```

---

## Part 9: Verify Installation

Check running containers:
```bash
docker ps
```

Test the health endpoint:
```bash
curl http://localhost/api/health
```

---

## Updating the Application

```bash
cd ~/apps/HealthNHabits
git pull origin master
docker-compose -f docker-compose.prod.yml up -d --build
```

If running both environments, also rebuild dev:
```bash
docker-compose -f docker-compose.yml up -d --build
```

---

## Sync Production Data to Development

Clone all data from production to development database (users, passwords, uploads, etc.):

```bash
cd ~/apps/HealthNHabits
bash scripts/clone-prod-to-dev.sh
```

**What this script does:**
1. Exports production database via `pg_dump`
2. Clears all tables in development database
3. Imports data to development (passwords stay hashed, no re-hashing)
4. Copies upload files from prod to dev

> **Tip**: Run this after every deployment to keep dev data in sync with prod.

---

## Monitoring & Troubleshooting

### Check Container Status
```bash
docker ps
docker stats --no-stream
```

### Check Container Memory Usage
```bash
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"
```

### View Container Logs
```bash
docker logs healthnhabits-backend --tail 50
docker logs dev-healthnhabits-backend --tail 50
```

### Check System Resources
```bash
htop
free -h
```

### Free Up RAM (Optional)

The Oracle Free Tier VM has only ~1GB RAM. If running low:

**Stop dev environment when not needed:**
```bash
docker-compose -f docker-compose.yml down
```

**Disable Snap (saves 50-100MB RAM):**
Snap is Ubuntu's package manager - not needed for Docker servers.
```bash
sudo systemctl disable --now snapd
sudo systemctl disable --now snapd.socket
```

**Clean up unused Docker resources:**
```bash
docker system prune -af
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
