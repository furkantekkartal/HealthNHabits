# 🚀 Oracle Cloud VM Setup Guide - HealthNHabbits

This guide walks you through deploying **HealthNHabbits** to your Oracle Cloud Always Free VM.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [x] Oracle Cloud VM running (Ubuntu 24.04)
- [x] SSH access to VM (PuTTY with your .key file)
- [x] VM Public IP address: `152.67.97.67`
- [x] GitHub repository URL: `https://github.com/furkantekkartal/HealthNHabbits`
- [x] Domain address: `furkantekkartal.duckdns.org`

---

## 🔧 Part 1: Oracle VM Setup (SSH Terminal)

### Step 1.1: Connect to Your VM

Using PuTTY:
1. Host: `152.67.97.67`
2. Port: `22`
3. Connection > SSH > Auth > Credentials: Select your `.ppk` file
4. Login as: `ubuntu`

### Step 1.2: Run Initial Setup Script

```bash
# Download and run setup script directly from master branch
curl -sSL https://raw.githubusercontent.com/furkantekkartal/HealthNHabbits/master/scripts/initial-setup.sh | bash
```

### Step 1.3: Configure Oracle VCN Firewall

⚠️ **Critical:** Add these Ingress Rules in [Oracle Cloud Console](https://cloud.oracle.com) -> Networking -> VCN -> Security List:

| Source CIDR | Protocol | Port | Service |
|-------------|----------|------|---------|
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |
| `0.0.0.0/0` | TCP | 1110 | Dev Backend |
| `0.0.0.0/0` | TCP | 1120 | Dev Frontend |
| `0.0.0.0/0` | TCP | 1210 | Prod Backend |
| `0.0.0.0/0` | TCP | 1220 | Prod Frontend |

### Step 1.4: Clone/Update Repository

```bash
mkdir -p ~/apps
cd ~/apps

# If cloning for the first time:
git clone https://github.com/furkantekkartal/HealthNHabbits.git HealthNHabbits
cd HealthNHabbits

# If updating existing repo (fixing name):
mv HealtNHabbits HealthNHabbits 2>/dev/null || true
cd HealthNHabbits
git pull origin master
```

### Step 1.5: Configure Environment Variables

```bash
nano .env
```
Ensure your `.env` is set up with `POSTGRES_USER`, `POSTGRES_PASSWORD`, etc.

### Step 1.6: Configure Nginx

```bash
nano nginx/conf.d/default.conf
```
Replace `server_name` with `furkantekkartal.duckdns.org;`.

---

## 🚀 Part 2: Deployment & Cleanup

### Clean Up Old Containers
If you have running containers from the old setup (wrong names, old ports), run this first:

```bash
# Stop everything
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml down

# Remove unused build cache and images to save space
docker system prune -af
```

### Start Production Environment
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### Start Development Environment (Optional)
```bash
docker-compose -f docker-compose.yml up -d --build
```

---

## 🌐 Part 3: DNS Setup (DuckDNS)

1. Log in to [DuckDNS.org](https://www.duckdns.org/)
2. Update `furkantekkartal` IP to `152.67.97.67`

---

## 🛠️ Verification

- **Production**: `http://furkantekkartal.duckdns.org`
- **Development**: `http://152.67.97.67:1120`

---
