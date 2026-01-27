const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductVariant = sequelize.define('ProductVariant', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'product_id'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    multiplier: {
        type: DataTypes.DECIMAL(4, 2),
        defaultValue: 1
    }
}, {
    tableName: 'product_variants',
    timestamps: false
});

module.exports = ProductVariant;
