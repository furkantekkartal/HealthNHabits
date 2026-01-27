# 🌐 Oracle VM Port Registry

This document tracks the systematic port assignment for all projects hosted on the Oracle VM.
Schema: `[Project#][Env][Service][0]`

- **Project#**: 1-9
- **Env**: 1 (Dev), 2 (Prod)
- **Service**: 1 (Backend), 2 (Frontend), 3 (Database)
- **Last Digit**: Always 0

---

## 1. HealthNHabits

| Environment | Service | Port | Internal Container Port | URL |
|-------------|---------|------|-------------------------|-----|
| **Dev** | Backend | **1110** | 5050 | `http://IP:1110` |
| **Dev** | Frontend | **1120** | 80 | `http://IP:1120` |
| **Dev** | Database | **1130** | 5432 | PostgreSQL |
| **Prod** | Backend | **1210** | 5000 | `http://IP:1210` |
| **Prod** | Frontend | **1220** | 80 (Nginx) | `http://IP:1220` |
| **Prod** | Database | **1230** | 5432 | PostgreSQL |

---

## 2. AnotherProject (Planned)

| Environment | Service | Port | Internal Container Port | URL |
|-------------|---------|------|-------------------------|-----|
| **Dev** | Backend | **2110** | ... | `http://IP:2110` |
| **Dev** | Frontend | **2120** | ... | `http://IP:2120` |
| **Prod** | Backend | **2210** | ... | `http://IP:2210` |
| **Prod** | Frontend | **2220** | ... | `http://IP:2220` |
