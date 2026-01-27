# 🚀 Oracle Cloud VM Setup Guide - HealthNHabbits

This guide walks you through deploying HealthNHabbits to your Oracle Cloud Always Free VM.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Oracle Cloud VM running (Ubuntu 24.04)
- [ ] SSH access to VM (PuTTY with your .key file)
- [ ] VM Public IP address (e.g., `152.67.97.67`)
- [ ] GitHub repository with this code pushed
- [ ] (Optional) Domain name

---

## 🔧 Part 1: Oracle VM Setup (SSH Terminal)

### Step 1.1: Connect to Your VM

Using PuTTY:
1. Host: `152.67.97.67` (your VM IP)
2. Port: `22`
3. Connection > SSH > Auth > Credentials: Select your `.ppk` file
4. Click "Open"
5. Login as: `ubuntu`

You should see:
```
ubuntu@furkanubuntumachine:~$
```

---

### Step 1.2: Run Initial Setup Script

**Option A: Automatic Setup (Recommended)**

```bash
# Download and run setup script directly
curl -sSL https://raw.githubusercontent.com/furkantekkartal/HealtNHabbits/master/scripts/initial-setup.sh | bash
```

**Option B: Manual Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker and tools
sudo apt install -y docker.io docker-compose git curl htop nano

# Enable Docker
sudo systemctl enable --now docker

# Add user to docker group
sudo usermod -aG docker ubuntu

# IMPORTANT: Log out and log back in!
exit
```

After logging back in:

```bash
# Verify Docker works
docker --version
docker-compose --version
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

7. Click **Add Ingress Rules**

Also configure iptables on the VM:

```bash
# Allow HTTP and HTTPS through iptables
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

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
# Copy the example file
cp .env.production.example .env

# Edit with your values
nano .env
```

Update these values in the `.env` file:

```env
# Database - change the password!
POSTGRES_USER=healthnhabbits
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE
POSTGRES_DB=healthnhabbits

# Security - generate a random string!
JWT_SECRET=generate_a_long_random_string_here

# AI Keys - copy from your local .env
OPENROUTER_API_KEY=sk-or-v1-xxxxx
GEMINI_API_KEY=AIzaSyxxxxx
```

💡 **Tip**: Generate a secure JWT secret:
```bash
openssl rand -hex 32
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

---

### Step 1.6: Update Nginx Domain

```bash
# Edit the nginx config
nano nginx/conf.d/default.conf
```

Replace `YOUR_DOMAIN` with your actual domain (e.g., `health.furkantekartal.com`):
- Find: `server_name YOUR_DOMAIN;`
- Replace: `server_name health.furkantekartal.com;`

Save and exit.

---

### Step 1.7: Start the Application

```bash
# Build and start all containers
docker-compose -f docker-compose.prod.yml up -d --build

# Watch the logs (Ctrl+C to exit)
docker-compose -f docker-compose.prod.yml logs -f
```

Verify all containers are running:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Expected output:
```
NAME                       STATUS              PORTS
healthnhabbits-backend    Up (healthy)        5000/tcp
healthnhabbits-db         Up (healthy)        5432/tcp
healthnhabbits-frontend   Up (healthy)        80/tcp
healthnhabbits-nginx      Up                  0.0.0.0:80->80/tcp
```

---

## 🌐 Part 2: Domain & Cloudflare Setup (Browser)

### Step 2.1: Add Domain to Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Add a Site**
3. Enter your domain (e.g., `furkantekartal.com`)
4. Select **Free Plan**
5. Cloudflare will scan your DNS records

---

### Step 2.2: Update Nameservers

Cloudflare will give you nameservers like:
- `anna.ns.cloudflare.com`
- `bob.ns.cloudflare.com`

Go to your domain registrar (Namecheap, GoDaddy, etc.) and update the nameservers.

⏳ This can take up to 24 hours to propagate, but usually < 1 hour.

---

### Step 2.3: Configure DNS Records

In Cloudflare DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | `@` | `152.67.97.67` | Proxied (orange cloud) |
| A | `health` | `152.67.97.67` | Proxied (orange cloud) |

Replace `152.67.97.67` with your actual Oracle VM IP.

---

### Step 2.4: Configure SSL/TLS

In Cloudflare:
1. Go to **SSL/TLS** → **Overview**
2. Select **Full** or **Flexible** mode
   - **Flexible**: Cloudflare handles SSL (easiest)
   - **Full**: Your server also needs SSL (use Let's Encrypt)

For simplicity, use **Flexible** mode.

---

## ✅ Part 3: Verification

### Test the Application

1. Open your browser
2. Navigate to: `https://health.yourdomain.com`
3. You should see the HealthNHabbits login page!

### API Health Check

```bash
curl https://health.yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-27T...",
  "database": {
    "type": "postgresql",
    "connected": true
  },
  "environment": "production"
}
```

---

## 🔄 Part 4: GitHub Actions CI/CD (Optional)

This enables automatic deployments when you push to GitHub.

### Step 4.1: Generate SSH Key for GitHub

On your **local machine**:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f github_deploy_key
```

This creates:
- `github_deploy_key` (private key)
- `github_deploy_key.pub` (public key)

### Step 4.2: Add Public Key to Oracle VM

```bash
# On Oracle VM
echo "YOUR_PUBLIC_KEY_CONTENT" >> ~/.ssh/authorized_keys
```

### Step 4.3: Add Secrets to GitHub

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `ORACLE_VM_HOST` | `152.67.97.67` |
| `ORACLE_VM_USER` | `ubuntu` |
| `ORACLE_VM_SSH_KEY` | (paste entire private key content) |

### Step 4.4: Test Deployment

Push a change to `main` branch → GitHub Actions will auto-deploy!

---

## 📊 Part 5: Monitoring (Recommended)

### UptimeRobot (Free)

1. Go to [UptimeRobot](https://uptimerobot.com)
2. Create account
3. Add monitor:
   - Type: HTTPS
   - URL: `https://health.yourdomain.com/api/health`
   - Interval: 5 minutes
4. Add email/Telegram notifications

### Check Container Logs

```bash
# All containers
docker-compose -f docker-compose.prod.yml logs

# Specific container
docker logs healthnhabbits-backend -f

# Last 100 lines
docker logs healthnhabbits-backend --tail 100
```

---

## 🛠️ Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Check if ports are in use
sudo lsof -i :80
sudo lsof -i :5000
```

### Database connection error

```bash
# Enter backend container
docker exec -it healthnhabbits-backend sh

# Test database connection
wget -O- http://postgres:5432 || echo "Cannot reach postgres"
```

### Site not accessible

1. Check Oracle VCN Security List (ingress rules for 80/443)
2. Check iptables: `sudo iptables -L -n`
3. Check Cloudflare DNS propagation: `nslookup health.yourdomain.com`
4. Check nginx logs: `docker logs healthnhabbits-nginx`

### Restart containers

```bash
docker-compose -f docker-compose.prod.yml restart

# Or full rebuild
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 📁 Quick Reference Commands

```bash
# Navigate to app
cd ~/apps/HealthNHabbits

# Start containers
docker-compose -f docker-compose.prod.yml up -d

# Stop containers
docker-compose -f docker-compose.prod.yml down

# Restart containers
docker-compose -f docker-compose.prod.yml restart

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# Pull latest code and deploy
git pull && bash scripts/deploy.sh

# Check disk space
df -h

# Check memory
free -m

# Check running processes
htop
```

---

## 🎉 Congratulations!

Your HealthNHabbits app is now running 24/7 on Oracle Cloud for free!

**Summary of what you have:**
- ✅ Docker containers with auto-restart
- ✅ PostgreSQL database
- ✅ Nginx reverse proxy
- ✅ Cloudflare SSL (HTTPS)
- ✅ GitHub Actions auto-deploy (optional)

**Monthly Cost: $0** 🎊
