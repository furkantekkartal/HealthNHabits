#!/bin/bash
# HealthNHabits - Clone Production Database to Development
# This script copies all data from prod to dev database
# Passwords are copied as-is (no re-hashing)

set -e

echo "🔄 HealthNHabits: Clone Prod → Dev"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Database connection details
PROD_CONTAINER="healthnhabits-db"
DEV_CONTAINER="dev-healthnhabits-db"
PROD_DB="healthnhabits"
DEV_DB="dev_healthnhabits"
PROD_USER="${POSTGRES_USER:-healthnhabits}"
DEV_USER="${POSTGRES_USER:-healthnhabits}"

# Check if containers are running
echo -e "${YELLOW}Step 1: Checking containers...${NC}"
if ! docker ps | grep -q $PROD_CONTAINER; then
    echo -e "${RED}❌ Production container ($PROD_CONTAINER) is not running!${NC}"
    exit 1
fi

if ! docker ps | grep -q $DEV_CONTAINER; then
    echo -e "${RED}❌ Development container ($DEV_CONTAINER) is not running!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Both containers are running${NC}"

# Export from production
echo -e "${YELLOW}Step 2: Exporting production database...${NC}"
docker exec $PROD_CONTAINER pg_dump -U $PROD_USER -d $PROD_DB --no-owner --no-acl > /tmp/prod_backup.sql
echo -e "${GREEN}✓ Production data exported${NC}"

# Clear development database
echo -e "${YELLOW}Step 3: Clearing development database...${NC}"
docker exec $DEV_CONTAINER psql -U $DEV_USER -d $DEV_DB -c "
DO \$\$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
"
echo -e "${GREEN}✓ Development database cleared${NC}"

# Import to development
echo -e "${YELLOW}Step 4: Importing to development database...${NC}"
docker exec -i $DEV_CONTAINER psql -U $DEV_USER -d $DEV_DB < /tmp/prod_backup.sql
echo -e "${GREEN}✓ Data imported to development${NC}"

# Copy upload files (profile pictures, etc.)
echo -e "${YELLOW}Step 5: Copying upload files...${NC}"

# Method 1: Try using docker cp (more reliable for volumes)
docker cp healthnhabits-backend:/app/uploads/. /tmp/prod_uploads/ 2>/dev/null

if [ -d "/tmp/prod_uploads" ] && [ "$(ls -A /tmp/prod_uploads 2>/dev/null)" ]; then
    docker cp /tmp/prod_uploads/. dev-healthnhabits-backend:/app/uploads/
    rm -rf /tmp/prod_uploads
    echo -e "${GREEN}✓ Upload files copied (${NC}$(docker exec dev-healthnhabits-backend ls /app/uploads 2>/dev/null | wc -l)${GREEN} files)${NC}"
else
    # Method 2: Fallback to volume mount paths
    PROD_UPLOADS=$(docker inspect --format='{{range .Mounts}}{{if eq .Destination "/app/uploads"}}{{.Source}}{{end}}{{end}}' healthnhabits-backend 2>/dev/null || echo "")
    DEV_UPLOADS=$(docker inspect --format='{{range .Mounts}}{{if eq .Destination "/app/uploads"}}{{.Source}}{{end}}{{end}}' dev-healthnhabits-backend 2>/dev/null || echo "")
    
    if [ -n "$PROD_UPLOADS" ] && [ -n "$DEV_UPLOADS" ]; then
        sudo cp -r $PROD_UPLOADS/* $DEV_UPLOADS/ 2>/dev/null || true
        echo -e "${GREEN}✓ Upload files copied (volume method)${NC}"
    else
        echo -e "${YELLOW}⚠ Could not locate upload volumes, skipping file copy${NC}"
    fi
fi

# Cleanup
rm -f /tmp/prod_backup.sql

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}✅ Clone completed successfully!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo "Development database now mirrors production."
echo "Access dev at: http://YOUR_IP:1120"
echo ""
