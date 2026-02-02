#!/bin/bash
# HealthNHabits - Initial Oracle VM Setup Script (PROJECT ID 2)
# Run this to set up dependencies and firewall for the secondary app

set -e

echo "🚀 HealthNHabits Oracle VM Setup (Project ID 2)"
echo "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Update system
echo -e "${YELLOW}📦 Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. Install required packages
echo -e "${YELLOW}📦 Step 2: Installing Docker and dependencies...${NC}"
sudo apt install -y docker.io docker-compose git curl htop nano

# 3. Enable and start Docker
echo -e "${YELLOW}🐳 Step 3: Configuring Docker...${NC}"
sudo systemctl enable docker && sudo systemctl start docker
sudo usermod -aG docker $USER || true

# 4. Configure firewall (Project ID 2: 21xx/22xx)
echo -e "${YELLOW}🔥 Step 4: Configuring firewall for Project 2...${NC}"

# Dev ports
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2110 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2120 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2130 -j ACCEPT
# Prod ports
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2210 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2220 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 2230 -j ACCEPT

# Ensure persistence tools are installed
sudo apt install -y iptables-persistent
sudo netfilter-persistent save

# 5. Create app directory
echo -e "${YELLOW}📁 Step 5: Creating application directory...${NC}"
mkdir -p ~/apps && cd ~/apps

# 6. Clone repository
if [ -d "HealthNHabits" ]; then
    echo -e "${GREEN}✓ HealthNHabits directory already exists${NC}"
    cd HealthNHabits && git pull origin master
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
echo -e "${GREEN}✅ Initial setup completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Follow the setup guide for remaining steps:"
echo "   See ORACLE_VM_SETUP.md in the repository"
echo ""
echo "Port Reference (Project 2):"
echo "   Dev UI:   http://YOUR_IP:2120"
echo "   Prod UI:  http://YOUR_IP:2220"
echo ""
