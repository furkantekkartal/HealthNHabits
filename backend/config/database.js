const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables
const nodeEnv = process.env.NODE_ENV || 'development';

// Database configuration
const config = {
    database: process.env.DB_NAME || 'health_habits',
    username: process.env.DB_USER || 'healthapp',
    password: process.env.DB_PASSWORD || 'healthapp123',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Set to console.log if you need to debug SQL queries
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

// Create Sequelize instance
const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: config.logging,
        pool: config.pool
    }
);

// Test connection function
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connection established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to PostgreSQL:', error.message);
        return false;
    }
};

module.exports = { sequelize, testConnection };
