# HealthNHabits (Secondary App)

A health and habit tracking application, now deployed as a secondary project behind the FTcom Gateway.

## 🏗 Infrastructure Role

This project is served on **Port 2220** and reached via `healthnhabits.furkantekkartal.com`.
The **FTcom** project handles the public SSL and Port 80 traffic, forwarding it to this service.

## 🚀 Deployment

**IMPORTANT**: If you are migrating from an old installation, follow the **Backup & Restore** guide in [ORACLE_VM_SETUP.md](./ORACLE_VM_SETUP.md).

### Quick Start
```bash
git clone https://github.com/furkantekkartal/HealthNHabbits.git
cd HealthNHabbits
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📁 Project ID: 2
| Environment | Ports |
|-------------|-------|
| Production  | 2210 (API), 2220 (UI), 2230 (DB) |
| Development | 2110 (API), 2120 (UI), 2130 (DB) |
