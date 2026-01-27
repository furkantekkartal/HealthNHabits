---
description: Setup PostgreSQL database for HealthNHabbits application
---

# PostgreSQL Setup Workflow

This workflow sets up PostgreSQL for the HealthNHabbits application on a fresh system (Windows or Linux VM).

## Prerequisites
- Administrator/sudo access on the target machine
- Internet connection for downloads

---

## Windows Setup

### 1. Install PostgreSQL
```powershell
# Using winget (Windows 10/11)
winget install --id PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements

# OR download installer from https://www.postgresql.org/download/windows/
```

### 2. Configure pg_hba.conf for Password Authentication
```powershell
# Temporarily allow trust auth for initial setup
$pgHbaPath = "C:\Program Files\PostgreSQL\17\data\pg_hba.conf"
$content = Get-Content $pgHbaPath -Raw
$newContent = $content -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+scram-sha-256', 'host    all             all             127.0.0.1/32            trust'
Set-Content $pgHbaPath -Value $newContent

# Restart PostgreSQL service (run as Admin)
Start-Process powershell -Verb RunAs -ArgumentList "-Command Restart-Service -Name 'postgresql-x64-17'" -Wait
```

### 3. Create Database and User
```powershell
# Set environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:PAGER = ""

# Create user and database
// turbo
psql -U postgres -h 127.0.0.1 -c "CREATE USER healthapp WITH PASSWORD 'healthapp123';" -t
// turbo
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE health_habits OWNER healthapp;" -t
// turbo
psql -U postgres -h 127.0.0.1 -c "GRANT ALL PRIVILEGES ON DATABASE health_habits TO healthapp;" -t
// turbo
psql -U postgres -h 127.0.0.1 -d health_habits -c "GRANT ALL ON SCHEMA public TO healthapp;" -t
```

### 4. Restore Password Authentication
```powershell
# Restore scram-sha-256 auth
$content = Get-Content $pgHbaPath -Raw
$newContent = $content -replace 'host\s+all\s+all\s+127\.0\.0\.1/32\s+trust', 'host    all             all             127.0.0.1/32            scram-sha-256'
Set-Content $pgHbaPath -Value $newContent

# Restart service
Start-Process powershell -Verb RunAs -ArgumentList "-Command Restart-Service -Name 'postgresql-x64-17'" -Wait
```

### 5. Verify Connection
```powershell
$env:PGPASSWORD = "healthapp123"
// turbo
psql -U healthapp -h 127.0.0.1 -d health_habits -c "SELECT current_database(), current_user;" -t
```

---

## Linux (Ubuntu/Debian) Setup

### 1. Install PostgreSQL
```bash
# Update and install
// turbo
sudo apt update
// turbo
sudo apt install -y postgresql postgresql-contrib

# Start and enable service
// turbo
sudo systemctl start postgresql
// turbo
sudo systemctl enable postgresql
```

### 2. Create Database and User
```bash
# Switch to postgres user and create database
// turbo
sudo -u postgres psql -c "CREATE USER healthapp WITH PASSWORD 'healthapp123';"
// turbo
sudo -u postgres psql -c "CREATE DATABASE health_habits OWNER healthapp;"
// turbo
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE health_habits TO healthapp;"
// turbo
sudo -u postgres psql -d health_habits -c "GRANT ALL ON SCHEMA public TO healthapp;"
```

### 3. Configure pg_hba.conf (if needed)
```bash
# Find pg_hba.conf location
sudo -u postgres psql -c "SHOW hba_file;"

# Edit to allow password authentication for local connections
# Add this line if not present:
# host    all    all    127.0.0.1/32    scram-sha-256

# Restart PostgreSQL
// turbo
sudo systemctl restart postgresql
```

### 4. Verify Connection
```bash
// turbo
PGPASSWORD=healthapp123 psql -U healthapp -h 127.0.0.1 -d health_habits -c "SELECT current_database(), current_user;"
```

---

## Environment Variables

Add these to your `.env` file in the backend:

```env
# PostgreSQL Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=health_habits
DB_USER=healthapp
DB_PASSWORD=healthapp123
```

---

## Database Connection Details

| Property | Value |
|----------|-------|
| Host | 127.0.0.1 |
| Port | 5432 |
| Database | health_habits |
| Username | healthapp |
| Password | healthapp123 |

---

## Starting the Application

```bash
# Install dependencies (first time only)
cd backend
// turbo
npm install

# Start the server (tables will auto-create)
// turbo
npm run dev
```

The server will automatically create all required tables on first startup using Sequelize sync.
