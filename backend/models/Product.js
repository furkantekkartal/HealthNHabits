const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    emoji: {
        type: DataTypes.STRING(10),
        defaultValue: '🍽️'
    },
    category: {
        type: DataTypes.ENUM('Meal', 'Fruit', 'Coffee', 'Snack', 'Custom'),
        defaultValue: 'Custom'
    },
    imagePath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
        field: 'image_path'
    },
    servingSizeValue: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        field: 'serving_size_value'
    },
    servingSizeUnit: {
        type: DataTypes.ENUM('g', 'ml', 'pc'),
        defaultValue: 'g',
        field: 'serving_size_unit'
    },
    calories: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    protein: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    carbs: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    fat: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    fiber: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    sugar: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
    },
    usageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'usage_count'
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sort_order'
    },
    // Store ingredients as JSON array for meals
    ingredients: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
    }
}, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Static method to get most used products
Product.getMostUsed = async function (limit = 10) {
    return this.findAll({
        order: [['usage_count', 'DESC']],
        limit
    });
};

// Convert to API format with nested servingSize and nutrition
Product.prototype.toAPIFormat = function () {
    const json = this.toJSON();
    return {
        ...json,
        // Keep _id for frontend compatibility (they use _id from MongoDB)
        _id: json.id,
        servingSize: {
            value: json.servingSizeValue || 100,
            unit: json.servingSizeUnit || 'g'
        },
        nutrition: {
            calories: json.calories || 0,
            protein: parseFloat(json.protein) || 0,
            carbs: parseFloat(json.carbs) || 0,
            fat: parseFloat(json.fat) || 0,
            fiber: parseFloat(json.fiber) || 0,
            sugar: parseFloat(json.sugar) || 0
        },
        // Map imagePath to imageUrl for frontend compatibility
        imageUrl: json.imagePath,
        // Include ingredients for meals
        ingredients: json.ingredients || []
    };
};

module.exports = Product;
