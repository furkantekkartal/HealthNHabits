# 🚀 Oracle Cloud VM Setup Guide - HealthNHabits

A health and habit tracking application.

> [!IMPORTANT]
> **Prerequisites**: 
> 1. FTcom_Infrastructure must be running (database)
> 2. FTcom must be running (gateway)

---

## 📑 Table of Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Clone Repository](#2-clone-repository)
- [3. Configure Environment](#3-configure-environment)
- [4. Start Services](#4-start-services)
- [5. Run Only Production](#5-run-only-production)
- [6. Run Only Development](#6-run-only-development)
- [7. Run Both Environments](#7-run-both-environments)
- [8. Docker Management](#8-docker-management)
- [9. Troubleshooting](#9-troubleshooting)
- [10. How to Update a Project](#10-how-to-update-a-project-deploy-changes)

---

## 1. Prerequisites

Verify Infrastructure and Gateway are running:
```bash
docker ps | grep infra-postgres  # Should be healthy
docker ps | grep ftcom-nginx     # Should be running
```

---

## 2. Clone Repository

```bash
cd ~/apps
git clone https://github.com/furkantekkartal/HealthNHabits.git
cd HealthNHabits
```

---

## 3. Configure Environment

```bash
# Copy example and edit
cp .env.example .env
nano .env
```

Required variables:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=YOUR_INFRA_PASSWORD
JWT_SECRET=your_random_secret_key
OPENROUTER_API_KEY=your_key
GEMINI_API_KEY=your_key
```

For development, also create:
```bash
cp .env .env.dev
nano .env.dev
# Change any dev-specific values
```

---

## 4. Start Services

```bash
# Production only
docker-compose -f docker-compose.prod.yml up -d --build

# Development only
docker-compose -f docker-compose-dev.yml up -d --build

# Both
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose-dev.yml up -d --build
```

---

## 5. Run Only Production

```bash
# Start production
docker-compose -f docker-compose.prod.yml up -d --build

# Verify
curl -I http://healthnhabits.furkantekkartal.com/api/health
```

**URLs**:
- https://healthnhabits.furkantekkartal.com

**Ports**: 2210 (backend), 2220 (frontend)

---

## 6. Run Only Development

```bash
# Start development
docker-compose -f docker-compose-dev.yml up -d --build

# Verify
curl -I http://healthnhabits-dev.furkantekkartal.com/api/health
```

**URLs**:
- https://healthnhabits-dev.furkantekkartal.com

**Ports**: 2110 (backend), 2120 (frontend)

---

## 7. Run Both Environments

```bash
# Start both
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose-dev.yml up -d --build

# Check all containers
docker ps --format "table {{.Names}}\t{{.Status}}" | grep healthnhabits
```

---

## 8. Docker Management

### View Status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}" | grep healthnhabits
```

### View Logs
```bash
# Production
docker logs healthnhabits-backend --tail 50
docker logs healthnhabits-frontend --tail 50

# Development
docker logs dev-healthnhabits-backend --tail 50
docker logs dev-healthnhabits-frontend --tail 50

# Follow live
docker logs healthnhabits-backend -f
```

### Resource Usage (RAM/CPU)
```bash
docker stats --no-stream | grep healthnhabits
```

### Stop Services
```bash
# Stop production
docker-compose -f docker-compose.prod.yml down

# Stop development
docker-compose -f docker-compose-dev.yml down

# Stop all
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose-dev.yml down
```

### Restart Services
```bash
# Restart production
docker-compose -f docker-compose.prod.yml restart

# Restart development
docker-compose -f docker-compose-dev.yml restart

# Restart specific container
docker restart healthnhabits-backend
```

### Rebuild (after code changes)
```bash
# Rebuild production
docker-compose -f docker-compose.prod.yml up -d --build

# Rebuild development
docker-compose -f docker-compose-dev.yml up -d --build
```

### Delete and Recreate
```bash
# Remove production containers
docker-compose -f docker-compose.prod.yml down
docker rmi healthnhabits_backend healthnhabits_frontend

# Recreate
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 9. Troubleshooting

### 502 Bad Gateway
```bash
# Check containers are running
docker ps | grep healthnhabits

# Check backend logs
docker logs healthnhabits-backend --tail 50

# Restart gateway to pick up network
docker restart ftcom-nginx
```

### Database Connection Failed
```bash
# Check infra-postgres is running
docker ps | grep infra-postgres

# Test database connection
docker exec infra-postgres psql -U postgres -c "\l" | grep hnh

# Verify .env has correct password
cat .env | grep POSTGRES
```

### Backend Not Starting
```bash
# Check for syntax errors
docker logs healthnhabits-backend --tail 100

# Shell into container
docker exec -it healthnhabits-backend sh
```

### Frontend Shows Blank Page
```bash
# Check frontend logs
docker logs healthnhabits-frontend --tail 50

# Check nginx config inside container
docker exec healthnhabits-frontend cat /etc/nginx/conf.d/default.conf
```

### API Returns 500 Error
```bash
# Check backend logs for stack trace
docker logs healthnhabits-backend --tail 100

# Check if database tables exist
docker exec infra-postgres psql -U postgres -d hnh_prod -c "\dt"
```

### Health Check Failing
```bash
# Check what health endpoint returns
curl http://localhost:2210/api/health

# Check docker health status
docker inspect healthnhabits-backend | grep -A 10 Health
```

---

## 10. How to Update a Project (Deploy Changes)

This section explains how to push local changes to the server, test on dev, and deploy to production. This workflow applies to all 4 projects.

### Project Overview

| Project | Dev URL | Prod URL | Location |
|---------|---------|----------|----------|
| **HealthNHabits** | healthnhabits-dev.furkantekkartal.com | healthnhabits.furkantekkartal.com | `~/apps/HealthNHabits` |
| **HomeMadeKahoot** | kahoot-dev.furkantekkartal.com | kahoot.furkantekkartal.com | `~/apps/HomeMadeKahoot` |
| **FTcom_Infrastructure** | N/A (shared infra) | N/A | `~/apps/FTcom_Infrastructure` |
| **FTcom** | N/A | furkantekkartal.com | `~/apps/FTcom` |

---

### Step 1: Push Changes from Local (on your computer)

```bash
# Make sure you're on dev branch
git checkout dev

# Commit your changes
git add -A
git commit -m "feat: description of your changes"

# Push to remote
git push origin dev
```

---

### Step 2: Pull and Test on Dev (on the server)

```bash
# Navigate to project
cd ~/apps/HealthNHabits  # or HomeMadeKahoot, FTcom, etc.

# Pull the dev branch
git checkout dev
git pull origin dev

# Rebuild dev containers (down first to avoid errors)
docker-compose -f docker-compose-dev.yml down
docker-compose -f docker-compose-dev.yml up -d --build

# Check logs for errors
docker logs dev-healthnhabits-backend --tail 50
```

**Test the dev environment:**
- Visit https://healthnhabits-dev.furkantekkartal.com
- Verify your changes work correctly
- Check backend logs: `docker logs dev-healthnhabits-backend -f`

---

### Step 3: Promote to Production (if dev works)

Only after verifying dev works correctly:

```bash
# On your local machine: merge dev to master
git checkout master
git merge dev
git push origin master

---

### Step 4: Deploy to Production (on the server)

```bash
# Navigate to project
cd ~/apps/HealthNHabits

# Ensure on master branch
git checkout master
git pull origin master

# Rebuild production containers (down first to avoid errors)
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Verify
curl -I http://healthnhabits.furkantekkartal.com/api/health
docker logs healthnhabits-backend --tail 50
```

---

### Quick Reference Commands (Per Project)

#### HealthNHabits
```bash
cd ~/apps/HealthNHabits

# Dev update
git checkout dev && git pull origin dev
docker-compose -f docker-compose-dev.yml down
docker-compose -f docker-compose-dev.yml up -d --build

# Prod update
git checkout master && git pull origin master
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

#### HomeMadeKahoot
```bash
cd ~/apps/HomeMadeKahoot

# Dev update
git checkout dev && git pull origin dev
docker-compose -f docker-compose-dev.yml down
docker-compose -f docker-compose-dev.yml up -d --build

# Prod update
git checkout master && git pull origin master
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

#### FTcom_Infrastructure
```bash
cd ~/apps/FTcom_Infrastructure

# Update (single environment)
git pull origin master
docker-compose down
docker-compose up -d --build
```

#### FTcom (Gateway/Portfolio)
```bash
cd ~/apps/FTcom

# Update
git pull origin master
docker-compose down
docker-compose up -d --build
```

---

### Rollback (If Something Goes Wrong)

```bash
# On server: revert to previous commit
git log --oneline -5  # see recent commits
git checkout <previous-commit-hash>
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# OR: reset to remote master
git fetch origin
git reset --hard origin/master
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

---

**Last Updated**: 2026-02-04

