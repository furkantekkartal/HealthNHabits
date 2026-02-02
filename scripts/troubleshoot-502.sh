#!/bin/bash
# HealthNHabbits 502 Troubleshooting Script
# Run this on your VM to diagnose the issue

echo "=== HealthNHabbits 502 Troubleshooting ==="
echo ""

echo "1. Checking if HealthNHabbits containers are running..."
docker ps --filter "name=healthnhabits" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
echo ""

echo "2. Checking FTcom nginx container..."
docker ps --filter "name=ftcom" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
echo ""

echo "3. Testing direct access to HealthNHabbits frontend (Port 2220)..."
curl -I http://localhost:2220
echo ""

echo "4. Testing FTcom's ability to reach HealthNHabbits..."
docker exec ftcom-nginx curl -I http://host.docker.internal:2220 2>/dev/null || echo "FAILED: Cannot reach port 2220 from FTcom"
echo ""

echo "5. Checking HealthNHabbits frontend logs..."
docker logs healthnhabits-frontend --tail 20
echo ""

echo "6. Checking FTcom nginx logs..."
docker logs ftcom-nginx --tail 20
echo ""

echo "=== Diagnosis Complete ==="
echo "If port 2220 is not accessible, HealthNHabbits might not be running on the correct ports."
echo "Run: docker-compose -f docker-compose.prod.yml ps"
