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
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

console.log(`🔧 Environment: ${nodeEnv}`);
console.log(`📄 Loading config from: ${envFile}`);

// Middleware
app.use(cors({
    origin: [FRONTEND_URL, 'http://localhost:3040', 'http://localhost:3050'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/diet-tracker';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

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
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
            connected: mongoose.connection.readyState === 1
        },
        environment: process.env.NODE_ENV || 'development'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
