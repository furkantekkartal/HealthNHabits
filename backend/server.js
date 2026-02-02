// Load environment-specific .env file
const path = require('path');
const nodeEnv = process.env.NODE_ENV || 'development';
let envFile = '.env';
if (nodeEnv === 'master') {
    envFile = '.env.master';
} else if (nodeEnv === 'development') {
    envFile = '.env.dev';
}
require('dotenv').config({ path: path.join(__dirname, envFile) });

const express = require('express');
const cors = require('cors');
const { syncDatabase, sequelize } = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Trust proxy for correct protocol (HTTPS) and IP behind Nginx/Cloudflare
app.set('trust proxy', true);

console.log(`🔧 Environment: ${nodeEnv}`);
console.log(`📄 Loading config from: ${envFile}`);

// Middleware - Dynamic CORS to allow Cloudflare tunnels
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // Allow localhost origins
        if (origin.includes('localhost')) return callback(null, true);

        // Allow all Cloudflare tunnel URLs
        if (origin.includes('.trycloudflare.com')) return callback(null, true);

        // Allow configured frontend URL
        if (origin === FRONTEND_URL) return callback(null, true);

        callback(null, true); // Allow all for development
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const productRoutes = require('./routes/products');
const logRoutes = require('./routes/logs');
const dashboardRoutes = require('./routes/dashboard');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Health check with database status
app.get('/api/health', async (req, res) => {
    let dbConnected = false;
    try {
        await sequelize.authenticate();
        dbConnected = true;
    } catch (error) {
        dbConnected = false;
    }

    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
            type: 'postgresql',
            connected: dbConnected
        },
        environment: process.env.NODE_ENV || 'development'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: err.message });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Sync database (creates tables if they don't exist)
        // Use { alter: true } in development to update tables
        // Use { force: true } to drop and recreate (DANGER: loses data)
        const syncOptions = nodeEnv === 'development' ? { alter: true } : {};
        await syncDatabase(syncOptions);

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
