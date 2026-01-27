# 🚀 Oracle Cloud VM Setup Guide - HealthNHabbits

This guide walks you through deploying HealthNHabbits to your Oracle Cloud Always Free VM.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [x] Oracle Cloud VM running (Ubuntu 24.04)
- [x] SSH access to VM (PuTTY with your .key file)
- [x] VM Public IP address: `152.67.97.67`
- [x] GitHub repository with this code pushed
- [x] Domain address: `furkantekkartal.duckdns.org`

---

## 🔧 Part 1: Oracle VM Setup (SSH Terminal)

### Step 1.1: Connect to Your VM

Using PuTTY:
1. Host: `152.67.97.67`
2. Port: `22`
3. Connection > SSH > Auth > Credentials: Select your `.ppk` file
4. Click "Open"
5. Login as: `ubuntu`

You should see:
```
ubuntu@furkanubuntu:~$
```

---

### Step 1.2: Run Initial Setup Script

```bash
# Download and run setup script directly from master branch
curl -sSL https://raw.githubusercontent.com/furkantekkartal/HealtNHabbits/master/scripts/initial-setup.sh | bash
```

---

### Step 1.3: Configure Oracle VCN Firewall

⚠️ **This is critical!** Without this, your site won't be accessible.

1. Go to [Oracle Cloud Console](https://cloud.oracle.com)
2. Navigate to: **Networking → Virtual Cloud Networks**
3. Click on your VCN
4. Click on your **Subnet**
5. Click on your **Security List**
6. Click **Add Ingress Rules**

Add these rules:

| Source CIDR | IP Protocol | Destination Port | Description |
|-------------|-------------|------------------|-------------|
| `0.0.0.0/0` | TCP | 80 | HTTP |
| `0.0.0.0/0` | TCP | 443 | HTTPS |
| `0.0.0.0/0` | TCP | 1110 | HealthNHabbits Dev Backend |
| `0.0.0.0/0` | TCP | 1120 | HealthNHabbits Dev Frontend |
| `0.0.0.0/0` | TCP | 1210 | HealthNHabbits Prod Backend |
| `0.0.0.0/0` | TCP | 1220 | HealthNHabbits Prod Frontend |

7. Click **Add Ingress Rules**

Also configure iptables on the VM (already done by script, but here if needed):

```bash
# Allow HTTP and HTTPS through iptables
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
# New Project Ports
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 1110 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 1120 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 1210 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 1220 -j ACCEPT

# Make the rules persistent
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

---

### Step 1.4: Clone Repository

```bash
# Create apps directory
mkdir -p ~/apps
cd ~/apps

# Clone the repository
git clone https://github.com/furkantekkartal/HealtNHabbits.git HealthNHabbits
cd HealthNHabbits
```

---

### Step 1.5: Configure Environment Variables

```bash
# Navigate to app
cd ~/apps/HealthNHabbits

# Edit your .env file
nano .env
```

Your `.env` should look like this (you have already done this):

```env
# Database
POSTGRES_USER=healthnhabbits
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=healthnhabbits

# Security
JWT_SECRET=your_generated_jwt_secret

# AI Keys
OPENROUTER_API_KEY=sk-or-v1-xxxxx
GEMINI_API_KEY=AIzaSyxxxxx
```

---

### Step 1.6: Update Nginx Domain

```bash
# Edit the nginx config
nano nginx/conf.d/default.conf
```

Replace `YOUR_DOMAIN` with your actual domain:
- Find: `server_name YOUR_DOMAIN;`
- Replace: `server_name furkantekkartal.duckdns.org;`

Save and exit: `Ctrl+X`, then `Y`, then `Enter`.

---

### Step 1.7: Start the Application

```bash
# Build and start all containers
docker-compose -f docker-compose.prod.yml up -d --build

# Watch the logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

Verify all containers are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

---

## 🌐 Part 2: Domain & DNS Setup

### Step 2.1: DuckDNS Configuration

1. Log in to [DuckDNS.org](https://www.duckdns.org/)
2. Find your domain: `furkantekkartal`
3. Update the IP address to: `152.67.97.67`
4. Click **update ip**

### Step 2.2: Cloudflare (Optional for DuckDNS)

*Note: Since you are using a DuckDNS subdomain, you usually don't need Cloudflare unless you are using it for a custom Root Domain.*

---

## ✅ Part 3: Verification

### Test the Application

1. Open your browser
2. Navigate to: `http://furkantekkartal.duckdns.org`
3. You should see the HealthNHabbits login page!

### API Health Check

```bash
curl http://furkantekkartal.duckdns.org/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": {
    "type": "postgresql",
    "connected": true
  }
}
```

---

## 🔄 Part 4: Updating the App

Whenever you push new code to GitHub:

```bash
# Connect to VM and run:
cd ~/apps/HealthNHabbits
git pull origin master
bash scripts/deploy.sh
```

---

## 📊 Part 5: Monitoring

### Check Container Logs

```bash
# Last 100 lines for backend
docker logs healthnhabbits-backend --tail 100 -f
```

### Check System Resources

```bash
htop
df -h
```

---

## 📁 Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `cd ~/apps/HealthNHabbits` | Go to app folder |
| `docker-compose -f docker-compose.prod.yml up -d` | Start app |
| `docker-compose -f docker-compose.prod.yml down` | Stop app |
| `docker-compose -f docker-compose.prod.yml logs -f` | View logs |
| `nano .env` | Edit environment variables |
| `git pull origin master` | Get latest code |
