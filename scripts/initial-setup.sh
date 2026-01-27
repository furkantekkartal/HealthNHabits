#!/bin/bash
# HealthNHabits - Initial Oracle VM Setup Script
# Run this ONCE on a fresh Oracle VM to set up everything

set -e

echo "🚀 HealthNHabits Oracle VM Initial Setup"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Update system
echo -e "${YELLOW}📦 Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install required packages (no ufw - we use iptables)
echo -e "${YELLOW}📦 Step 2: Installing Docker and dependencies...${NC}"
sudo apt install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    htop \
    nano

# 3. Enable and start Docker
echo -e "${YELLOW}🐳 Step 3: Configuring Docker...${NC}"
sudo systemctl enable docker
sudo systemctl start docker

# Add current user to docker group
sudo usermod -aG docker $USER

# 4. Configure firewall (all required ports)
echo -e "${YELLOW}🔥 Step 4: Configuring firewall...${NC}"
# Standard HTTP/HTTPS
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
# Dev ports
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 1110 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 1120 -j ACCEPT
# Prod ports
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 1210 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 1220 -j ACCEPT

# Ensure persistence tools are installed
sudo apt install -y iptables-persistent
sudo netfilter-persistent save

# 5. Create app directory
echo -e "${YELLOW}📁 Step 5: Creating application directory...${NC}"
mkdir -p ~/apps
cd ~/apps

# 6. Clone repository (if not already cloned)
if [ -d "HealthNHabits" ]; then
    echo -e "${GREEN}✓ HealthNHabits directory already exists${NC}"
    cd HealthNHabits
    git pull origin master
else
    echo -e "${YELLOW}📥 Step 6: Cloning repository...${NC}"
    git clone https://github.com/furkantekkartal/HealthNHabits.git HealthNHabits
    cd HealthNHabits
fi

# 7. Create .env file from template
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Step 7: Creating .env file...${NC}"
    cp .env.production.example .env
    echo -e "${RED}⚠️  IMPORTANT: Edit .env file with your actual values!${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✅ Initial setup completed!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Log out and log back in (for docker group to take effect)"
echo ""
echo "2. Edit the .env file:"
echo "   cd ~/apps/HealthNHabits && nano .env"
echo ""
echo "3. Configure Nginx domain:"
echo "   nano ~/apps/HealthNHabits/nginx/conf.d/default.conf"
echo ""
echo "4. Follow the setup guide for remaining steps:"
echo "   See ORACLE_VM_SETUP.md in the repository"
echo ""
echo "Port Reference:"
echo "   Dev:  http://YOUR_IP:1120 (frontend) | http://YOUR_IP:1110 (backend)"
echo "   Prod: http://YOUR_IP:1220 (frontend) | http://YOUR_IP:1210 (backend)"
echo ""
