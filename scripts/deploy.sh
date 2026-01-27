#!/bin/bash
# HealthNHabbits Deployment Script
# Run this on the Oracle VM to deploy/update the application

set -e  # Exit on any error

echo "🚀 Starting HealthNHabbits deployment..."
echo "📅 $(date)"
echo ""

# Navigate to app directory
cd ~/apps/HealthNHabbits

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Stop running containers gracefully
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans || true

# Build new images
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for health checks
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Show status
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

# Show logs (last 20 lines)
echo ""
echo "📋 Recent Backend Logs:"
docker logs healthnhabbits-backend --tail 20

# Clean up old images
echo ""
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be available at your configured domain"
