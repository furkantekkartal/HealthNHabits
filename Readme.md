# HealthNHabits

A health and habit tracking application deployed on furkantekkartal.com infrastructure.

---

## 🚀 Deployment Order

> [!IMPORTANT]
> **Deploy in this exact order:**
> 1. **FTcom_Infrastructure** - Shared database (FIRST)
> 2. **FTcom** - Gateway (nginx)
> 3. **This project** ← YOU ARE HERE

---

## Quick Start

```bash
# 1. Ensure Infrastructure and Gateway are running first!
docker ps | grep infra-postgres
docker ps | grep ftcom-nginx

# 2. Clone/pull project
git clone https://github.com/furkantekkartal/HealthNHabbits.git
cd HealthNHabbits

# 3. Start containers
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose-dev.yml up -d --build

# 4. Verify
curl http://healthnhabits.furkantekkartal.com/api/health
```

---

## URLs

| Environment | URL |
|-------------|-----|
| Production | https://healthnhabits.furkantekkartal.com |
| Development | https://healthnhabits-dev.furkantekkartal.com |

---

## Port Assignments (Project ID: 2)

| Environment | Backend | Frontend |
|-------------|---------|----------|
| Production | 2210 | 2220 |
| Development | 2110 | 2120 |

**Note**: Database is now handled by FTcom_Infrastructure (shared `infra-postgres`).

---

## Database

Databases are hosted in the shared Infrastructure container:
- **Production**: `hnh_prod` 
- **Development**: `hnh_dev`

### Copy Prod → Dev
```bash
# Run from Infrastructure project
~/apps/FTcom_Infrastructure/scripts/copy-prod-to-dev.sh healthnhabits
```

---

## Troubleshooting

### 502 Bad Gateway
- Check Infrastructure is running: `docker ps | grep infra-postgres`
- Check container logs: `docker logs healthnhabits-backend`

### Database Connection Failed
- Ensure `infra-network` is in docker-compose networks
- Verify `DB_HOST=infra-postgres` in environment
