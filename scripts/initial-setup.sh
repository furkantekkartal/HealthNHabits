#!/bin/bash
# HealthNHabbits - Initial Oracle VM Setup Script
# Run this ONCE on a fresh Oracle VM to set up everything

set -e

echo "🚀 HealthNHabbits Oracle VM Initial Setup"
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

# 2. Install required packages
echo -e "${YELLOW}📦 Step 2: Installing Docker and dependencies...${NC}"
sudo apt install -y \
    docker.io \
    docker-compose \
    git \
    curl \
    htop \
    nano \
    ufw

# 3. Enable and start Docker
echo -e "${YELLOW}🐳 Step 3: Configuring Docker...${NC}"
sudo systemctl enable docker
sudo systemctl start docker

# Add current user to docker group
sudo usermod -aG docker $USER

# 4. Configure firewall
echo -e "${YELLOW}🔥 Step 4: Configuring firewall...${NC}"
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT

# Ensure persistence tools are installed (sometimes removed by ufw)
sudo apt install -y iptables-persistent
sudo netfilter-persistent save

# Note: You also need to configure Oracle VCN Security List!

# 5. Create app directory
echo -e "${YELLOW}📁 Step 5: Creating application directory...${NC}"
mkdir -p ~/apps
cd ~/apps

# 6. Clone repository (if not already cloned)
if [ -d "HealthNHabits" ]; then
    echo -e "${GREEN}✓ HealthNHabits directory already exists${NC}"
else
    echo -e "${YELLOW}📥 Step 6: Cloning repository...${NC}"
    git clone https://github.com/furkantekkartal/HealthNHabits.git HealthNHabits
fi

cd HealthNHabits

# 7. Create .env file from template
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Step 7: Creating .env file...${NC}"
    cp .env.production.example .env
    echo -e "${RED}⚠️  IMPORTANT: Edit .env file with your actual values!${NC}"
    echo "   nano .env"
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
echo "2. Edit the .env file with your credentials:"
echo "   cd ~/apps/HealthNHabbits && nano .env"
echo ""
echo "3. Configure Oracle VCN Security List:"
echo "   - Allow ingress TCP port 80 from 0.0.0.0/0"
echo "   - Allow ingress TCP port 443 from 0.0.0.0/0"
echo ""
echo "4. Start the application:"
echo "   cd ~/apps/HealthNHabbits"
echo "   docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "5. Set up your domain DNS in Cloudflare"
echo ""
