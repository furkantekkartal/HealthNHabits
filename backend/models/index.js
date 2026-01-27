const { sequelize, testConnection } = require('../config/database');
const User = require('./User');
const UserProfile = require('./UserProfile');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const DailyLog = require('./DailyLog');
const DailyLogEntry = require('./DailyLogEntry');

// Define associations

// User <-> UserProfile (1:1)
User.hasOne(UserProfile, {
    foreignKey: 'userId',
    as: 'profile',
    onDelete: 'CASCADE'
});
UserProfile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// Product <-> ProductVariant (1:N)
Product.hasMany(ProductVariant, {
    foreignKey: 'productId',
    as: 'variants',
    onDelete: 'CASCADE'
});
ProductVariant.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product'
});

// User <-> DailyLog (1:N)
User.hasMany(DailyLog, {
    foreignKey: 'userId',
    as: 'dailyLogs',
    onDelete: 'CASCADE'
});
DailyLog.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});

// DailyLog <-> DailyLogEntry (1:N)
DailyLog.hasMany(DailyLogEntry, {
    foreignKey: 'dailyLogId',
    as: 'entries',
    onDelete: 'CASCADE'
});
DailyLogEntry.belongsTo(DailyLog, {
    foreignKey: 'dailyLogId',
    as: 'dailyLog'
});

// DailyLogEntry -> Product (N:1, optional)
DailyLogEntry.belongsTo(Product, {
    foreignKey: 'productId',
    as: 'product',
    onDelete: 'SET NULL'
});

// Sync database (create tables)
const syncDatabase = async (options = {}) => {
    try {
        // Test connection first
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Database connection failed');
        }

        // Sync all models
        await sequelize.sync(options);
        console.log('✅ Database synchronized successfully');
        return true;
    } catch (error) {
        console.error('❌ Database sync error:', error.message);
        return false;
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    User,
    UserProfile,
    Product,
    ProductVariant,
    DailyLog,
    DailyLogEntry
};
