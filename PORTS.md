# 🌐 Oracle VM Port Registry

This document tracks the systematic port assignment for all projects hosted on the Oracle VM.
Schema: `[Project#][Env][Service][0]`

- **Project#**: 1-9
- **Env**: 1 (Dev), 2 (Prod)
- **Service**: 1 (Backend), 2 (Frontend), 3 (Database)
- **Last Digit**: Always 0

---

## 1. FTcom (Portfolio - Primary Gateway)

| Environment | Service | Port | Internal Container Port | URL |
|-------------|---------|------|-------------------------|-----|
| **Dev** | Frontend | **1120** | 80 | `http://IP:1120` |
| **Prod** | Frontend | **80/443** | 80 | `http://furkantekkartal.com` |
| **Prod** | Shared | **1220** | 80 | `http://IP:1220` (Direct) |

---

## 2. HealthNHabits (Secondary App)

| Environment | Service | Port | Internal Container Port | URL |
|-------------|---------|------|-------------------------|-----|
| **Dev** | Backend | **2110** | 5050 | `http://IP:2110` |
| **Dev** | Frontend | **2120** | 80 | `http://IP:2120` |
| **Dev** | Database | **2130** | 5432 | PostgreSQL |
| **Prod** | Backend | **2210** | 5000 | `http://IP:2210` |
| **Prod** | Frontend | **2220** | 80 | `http://IP:2220` |
| **Prod** | Database | **2230** | 5432 | PostgreSQL |
