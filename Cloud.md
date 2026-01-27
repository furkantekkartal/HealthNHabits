# Oracle Cloud Always Free – Kişisel Projeler için 7/24 Ücretsiz Altyapı Kurulumu

Merhaba, bu dokümanda Oracle Cloud Always Free katmanını kullanarak kişisel projelerimizi
(web uygulamaları, botlar, API’ler vb.) tek bir VM üzerinde,
Docker + Nginx reverse proxy ile 7/24, bakımsız ve ücretsiz şekilde
çalıştıracağımız altyapının tamamını adım adım anlatıyorum.

---

## 🎯 Asıl Hedefimiz

- 3–4 adet kişisel projeyi tek bir Oracle Always Free VM üzerinde çalıştırmak
- Her projenin:
  - Kendi subdomain’i (proje1.example.com)
  - veya kendi path’i (example.com/proje1)
- Hepsinin:
  - Aynı makinede
  - 7/24 açık
  - Otomatik restart’lı
  - HTTPS (ücretsiz SSL)
  - Minimum bakım gerektiren bir yapıda olması

---

## ✅ Şu Ana Kadar Yapılanlar

### 1. Oracle Cloud Hesabı
- Oracle Cloud hesabı oluşturuldu
- Always Free Tier aktif

### 2. Compute Instance (VM)
- Shape: VM.Standard.E2.1.Micro
  - AMD tabanlı
  - 1/8 OCPU
  - 1 GB RAM
  - 50 GB Boot Volume
- OS: Canonical Ubuntu 24.04
- Public IP: Ephemeral IPv4 (örnek: 152.67.97.67)

### 3. SSH Erişimi
- Private key (.key)
- PuTTY kullanıldı
- Kullanıcı: ubuntu

### 4. Mevcut Durum
- VM running
- Terminal erişimi var:
  ubuntu@furkanubuntumachine:~$

---

## 🛠️ Yapılacaklar – Adım Adım Plan

---

## 1️⃣ Temel Sistem Kurulumu

Sistemi güncelle:

  sudo apt update && sudo apt upgrade -y

Gerekli paketleri kur:

  sudo apt install -y docker.io docker-compose nginx git curl htop nano

Docker servisini başlat:

  sudo systemctl enable --now docker

Kullanıcıyı docker grubuna ekle:

  sudo usermod -aG docker ubuntu

⚠️ Bu işlemden sonra SSH bağlantısını kapatıp yeniden bağlan.

---

## 2️⃣ Docker + Nginx Mimarisi

Genel mimari:

  Internet
     |
  Cloudflare (DNS + SSL)
     |
  Oracle VM (Public IP)
     |
  Nginx (Reverse Proxy)
     |
  Docker Containers
     ├── proje1
     ├── proje2
     └── proje3

- Tüm projeler Docker container olarak çalışır
- Nginx gelen istekleri subdomain veya path’e göre yönlendirir

---

## 3️⃣ Domain & DNS Yapılandırması

### Domain Satın Alma
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare Registrar

Örnek uzantılar:
- .com
- .xyz
- .dev

Yıllık maliyet: ~10–15 USD

---

### Cloudflare Ayarları

1. Domain’i Cloudflare’e ekle (Free plan yeterli)
2. Nameserver’ları domain sağlayıcında Cloudflare ile değiştir

DNS kayıtları:

A Record:
- Type: A
- Name: @
- IP: 152.67.97.67
- Proxy: Proxied (ON)

Subdomain örnekleri:
- proje1.furkantekartal.com → 152.67.97.67
- proje2.furkantekartal.com → 152.67.97.67

---

## 4️⃣ Projelerin Deploy Edilmesi

Önerilen klasör yapısı:

  /home/ubuntu/apps/
  ├── proje1/
  │   ├── Dockerfile
  │   └── docker-compose.yml
  ├── proje2/
  │   ├── Dockerfile
  │   └── docker-compose.yml
  └── nginx/
      └── conf.d/
          ├── proje1.conf
          └── proje2.conf

Projeleri klonla:

  mkdir -p ~/apps
  cd ~/apps
  git clone https://github.com/kullanici/proje1.git
  git clone https://github.com/kullanici/proje2.git

Container’ları başlat:

  cd ~/apps/proje1
  docker-compose up -d

docker-compose içinde önerilen ayar:

  restart: always

---

## 5️⃣ Nginx Reverse Proxy

Subdomain örneği:

  server {
      listen 80;
      server_name proje1.furkantekartal.com;

      location / {
          proxy_pass http://127.0.0.1:3001;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      }
  }

Nginx kontrol ve reload:

  sudo nginx -t
  sudo systemctl reload nginx

---

## 6️⃣ HTTPS – Let’s Encrypt

Certbot kurulumu:

  sudo apt install -y certbot python3-certbot-nginx

SSL sertifikası al:

  sudo certbot --nginx -d proje1.furkantekartal.com

- Otomatik HTTPS
- Otomatik HTTP → HTTPS redirect
- Otomatik yenileme

---

## 7️⃣ Sürekli Çalışma & Yönetim

- Docker restart policy: restart: always
- Uptime monitoring: https://uptimerobot.com (Free)
- Log izleme:
  docker logs proje1
  docker logs -f proje1

---

## 8️⃣ Yedekleme (Opsiyonel)

- Oracle Object Storage (Always Free)
- Önemli veriler:
  - DB dump
  - Upload klasörleri
- Cron ile günlük yedek alınabilir

---

## 🧩 Nihai Mimari Özeti

- Tek Oracle Always Free VM
- Ubuntu 24.04
- Docker + docker-compose
- Nginx reverse proxy
- Cloudflare DNS + ücretsiz SSL
- 3–4 proje, tek makinede
- Subdomain veya path bazlı erişim
- 7/24 çalışan, bakım gerektirmeyen yapı
