const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyLogEntry = sequelize.define('DailyLogEntry', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    dailyLogId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'daily_log_id'
    },
    entryType: {
        type: DataTypes.ENUM('food', 'water', 'steps', 'weight', 'activity'),
        allowNull: false,
        field: 'entry_type'
    },
    time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // Food fields
    productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'product_id'
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    calories: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    protein: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    carbs: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    fat: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    fiber: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    portion: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true
    },
    unit: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    mealType: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'meal_type'
    },
    // Water fields
    amount: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Steps fields
    steps: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    distance: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: true
    },
    // Weight fields
    weight: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    weightUnit: {
        type: DataTypes.STRING(5),
        allowNull: true,
        field: 'weight_unit'
    },
    // Activity fields
    activityType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'activity_type'
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    caloriesBurned: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'calories_burned'
    },
    // AI insight
    aiInsight: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ai_insight'
    },
    // Image path for analyzed food photos
    imagePath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
        field: 'image_path'
    }
}, {
    tableName: 'daily_log_entries',
    timestamps: false
});

// Convert to API format with nested data object for compatibility
DailyLogEntry.prototype.toAPIFormat = function () {
    const json = this.toJSON();

    const base = {
        _id: json.id,
        type: json.entryType,
        time: json.time,
        aiInsight: json.aiInsight,
        imagePath: json.imagePath
    };

    // Build data object based on entry type
    const data = {};

    switch (json.entryType) {
        case 'food':
            data.productId = json.productId;
            data.name = json.name;
            data.calories = json.calories;
            data.protein = parseFloat(json.protein) || 0;
            data.carbs = parseFloat(json.carbs) || 0;
            data.fat = parseFloat(json.fat) || 0;
            data.fiber = parseFloat(json.fiber) || 0;
            data.portion = parseFloat(json.portion) || 0;
            data.unit = json.unit;
            data.mealType = json.mealType;
            break;
        case 'water':
            data.amount = json.amount;
            break;
        case 'steps':
            data.steps = json.steps;
            data.distance = parseFloat(json.distance) || 0;
            data.caloriesBurned = json.caloriesBurned;
            break;
        case 'weight':
            data.weight = parseFloat(json.weight) || 0;
            data.weightUnit = json.weightUnit;
            break;
        case 'activity':
            data.activityType = json.activityType;
            data.duration = json.duration;
            data.caloriesBurned = json.caloriesBurned;
            break;
    }

    return { ...base, data };
};

module.exports = DailyLogEntry;
