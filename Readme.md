# HealthNHabits 🥗

> A modern, AI-powered diet and activity tracker focusing on quick logging and habit formation.

**[🚀 Deployment Guide for Oracle Cloud](ORACLE_VM_SETUP.md)**

---

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)

---

## ✨ Features

### 🍽️ AI-Powered Food Analysis
- **Photo Analysis**: Take or upload a food photo and get instant nutritional estimates
- **Text Description**: Describe your meal and AI generates nutritional data
- **Editable Results**: All AI estimates are fully editable before logging
- **Smart Catalog**: Save frequently consumed items for one-tap logging

### 📊 Dashboard
- Daily calorie balance with TDEE calculations
- Energy gap visualization (deficit/surplus with fat gram equivalent)
- Macro tracking (Protein, Carbs, Fat, Fiber)
- Progress bars for all daily goals
- Date navigation for historical data

### 💧 Hydration Tracking
- Quick-add water buttons (250ml, 500ml, custom)
- Visual progress bars and glass indicators
- Daily goal customization

### 🚶 Activity & Steps
- Manual step entry with calorie burn calculation
- Personalized calculations based on weight and stride length
- Steps contribute to daily energy expenditure

### ⚖️ Weight Management
- Daily weight logging with date support
- Historical weight chart with 7-day trends
- BMI-based zone coloring (Underweight/Normal/Overweight)
- Weight data automatically updates user profile

### 👤 Comprehensive Profile
- Personal metrics (height, weight, gender, birth year)
- Activity level selection with TDEE calculation
- Profile picture with crop functionality
- Customizable daily goals (calories, water, steps)

### 🔐 Authentication
- JWT-based secure authentication
- User registration and login
- Protected routes for all features

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI Framework |
| Vite | 7.2 | Build Tool & Dev Server |
| TailwindCSS | 4.1 | Styling |
| React Router | 7.12 | Navigation |
| Axios | 1.13 | HTTP Client |
| react-image-crop | 11.0 | Profile Picture Cropping |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20+ | Runtime |
| Express | 5.2 | Web Framework |
| PostgreSQL | 16 | Database |
| Sequelize | 6.37 | ORM |
| JWT | 9.0 | Authentication |
| bcryptjs | 3.0 | Password Hashing |
| Multer | 2.0 | File Uploads |

### AI Integration
- **OpenRouter API** with Google Gemini 2.0 Flash for food image and text analysis

---

## 📁 Project Structure

```
HealthNHabits/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── layout/       # Layout components (navbar, sidebar)
│   │   │   └── ui/           # UI primitives (toast, loading)
│   │   ├── context/          # React contexts (Auth, Date)
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Catalog.jsx
│   │   │   ├── FoodAnalysis.jsx
│   │   │   ├── Hydration.jsx
│   │   │   ├── Steps.jsx
│   │   │   ├── Weight.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── ...
│   │   ├── services/         # API client
│   │   └── App.jsx           # Main app component
│   └── package.json
│
├── backend/                  # Express API server
│   ├── models/               # Sequelize models
│   │   ├── User.js           # User authentication
│   │   ├── UserProfile.js    # Profile with BMR/TDEE
│   │   ├── DailyLog.js       # Daily entries (food, water, steps, weight)
│   │   └── Product.js        # Food catalog items
│   ├── routes/               # API routes
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── profile.js        # Profile management
│   │   ├── products.js       # Product catalog CRUD
│   │   ├── logs.js           # Daily log entries
│   │   ├── dashboard.js      # Dashboard data
│   │   └── ai.js             # AI analysis endpoints
│   ├── middleware/           # Express middleware
│   │   └── auth.js           # JWT verification
│   ├── scripts/              # Database utilities
│   └── server.js             # Entry point
│
└── designs/                  # UI/UX design files
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or use Docker)
- OpenRouter API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/furkantekkartal/HealthNHabits.git
   cd HealthNHabits
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure backend environment**
   
   Create `.env` file in `/backend`:
   ```env
   # PostgreSQL
   POSTGRES_USER=healthnhabits
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=healthnhabits
   
   # JWT
   JWT_SECRET=your-secure-secret-key
   
   # AI (Gemini)
   GEMINI_API_KEY=your_gemini_api_key
   
   # Server
   PORT=5000
   ```

4. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Start development servers**

   Backend (from `/backend`):
   ```bash
   npm run dev
   ```

   Frontend (from `/frontend`):
   ```bash
   npm run dev
   ```

6. **Open in browser**
   
   Navigate to `http://localhost:5173`

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |
| GET | `/api/profile/calculations` | Get BMR/TDEE |

### Products (Food Catalog)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/most-used` | Top used products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Daily Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/logs/today` | Get today's log |
| GET | `/api/logs/date/:date` | Get log by date |
| POST | `/api/logs/food` | Add food entry |
| POST | `/api/logs/water` | Add water entry |
| POST | `/api/logs/steps` | Update steps |
| POST | `/api/logs/weight` | Update weight |
| DELETE | `/api/logs/entry/:id` | Delete entry |

### AI Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/analyze-food` | Analyze food image |
| POST | `/api/ai/analyze-text` | Analyze food description |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Today's summary |
| GET | `/api/dashboard/weekly` | Weekly summary |

---

## 🔧 Environment Configurations

The app supports multiple environments:

| Environment | Frontend Port | Backend Port | Notes |
|-------------|---------------|--------------|-------|
| Development (Docker) | 1120 | 1110 | Via docker-compose.yml |
| Production (Docker) | 1220 (or 80) | 1210 | Via docker-compose.prod.yml |
| Local Dev | 5173 | 5000 | npm run dev |

Run specific environment:
```bash
# Backend
npm run dev:dev    # Development
npm run dev:master # Master

# Frontend  
npm run start:dev    # Development
npm run start:master # Master
```

---

## 🧮 Calorie Calculations

### BMR (Basal Metabolic Rate) - Mifflin-St Jeor Formula
- **Male**: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5
- **Female**: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161

### TDEE (Total Daily Energy Expenditure)
| Activity Level | Multiplier |
|----------------|------------|
| Sedentary | 1.2 |
| Lightly Active | 1.35 |
| Active | 1.5 |
| Very Active | 1.7 |

### Energy Gap
```
Energy Gap = TDEE + Activity Burned - Calories Eaten
Fat Grams ≈ Energy Gap / 7.7
```

---

## 🎨 Design Philosophy

- **Fast daily logging beats perfect data** - Optimized for quick entries
- **AI assists, never blocks** - All estimates are editable
- **One-tap actions** - Most-used items appear first
- **Habit formation over obsession** - Clean, encouraging UI

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ for a healthier lifestyle**
