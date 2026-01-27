const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const DailyLog = sequelize.define('DailyLog', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    // Summary fields (denormalized for performance)
    caloriesEaten: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'calories_eaten'
    },
    caloriesBurned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'calories_burned'
    },
    waterIntake: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'water_intake'
    },
    steps: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    weight: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: null
    },
    protein: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0
    },
    carbs: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0
    },
    fat: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0
    },
    fiber: {
        type: DataTypes.DECIMAL(6, 2),
        defaultValue: 0
    }
}, {
    tableName: 'daily_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'date']
        }
    ]
});

// Static method to get or create today's log for a user
DailyLog.getOrCreateToday = async function (userId) {
    if (!userId) throw new Error('userId is required');

    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    const [log, created] = await this.findOrCreate({
        where: { userId, date: dateString },
        defaults: {
            userId,
            date: dateString,
            caloriesEaten: 0,
            caloriesBurned: 0,
            waterIntake: 0,
            steps: 0,
            weight: null,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
        }
    });

    return log;
};

// Static method to get or create log for any date
DailyLog.getOrCreateForDate = async function (userId, date) {
    if (!userId) throw new Error('userId is required');

    const targetDate = new Date(date);
    const dateString = targetDate.toISOString().split('T')[0];

    const [log, created] = await this.findOrCreate({
        where: { userId, date: dateString },
        defaults: {
            userId,
            date: dateString,
            caloriesEaten: 0,
            caloriesBurned: 0,
            waterIntake: 0,
            steps: 0,
            weight: null,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0
        }
    });

    return log;
};

// Instance method to recalculate summary from entries
DailyLog.prototype.recalculateSummary = async function () {
    // We need to get the DailyLogEntry model - import it here to avoid circular deps
    const DailyLogEntry = require('./DailyLogEntry');

    const entries = await DailyLogEntry.findAll({
        where: { dailyLogId: this.id }
    });

    const summary = {
        caloriesEaten: 0,
        caloriesBurned: 0,
        waterIntake: 0,
        steps: 0,
        weight: null,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
    };

    for (const entry of entries) {
        switch (entry.entryType) {
            case 'food':
                summary.caloriesEaten += entry.calories || 0;
                summary.protein += parseFloat(entry.protein) || 0;
                summary.carbs += parseFloat(entry.carbs) || 0;
                summary.fat += parseFloat(entry.fat) || 0;
                summary.fiber += parseFloat(entry.fiber) || 0;
                break;
            case 'water':
                summary.waterIntake += entry.amount || 0;
                break;
            case 'steps':
                summary.steps = entry.steps || 0; // Replace, don't add
                summary.caloriesBurned += entry.caloriesBurned || 0;
                break;
            case 'weight':
                summary.weight = entry.weight;
                break;
            case 'activity':
                summary.caloriesBurned += entry.caloriesBurned || 0;
                break;
        }
    }

    // Ensure water intake doesn't go negative
    if (summary.waterIntake < 0) summary.waterIntake = 0;

    this.caloriesEaten = summary.caloriesEaten;
    this.caloriesBurned = summary.caloriesBurned;
    this.waterIntake = summary.waterIntake;
    this.steps = summary.steps;
    this.weight = summary.weight;
    this.protein = summary.protein;
    this.carbs = summary.carbs;
    this.fat = summary.fat;
    this.fiber = summary.fiber;

    return this;
};

// Convert to API format with nested summary for compatibility
DailyLog.prototype.toAPIFormat = function (entries = []) {
    const json = this.toJSON();
    return {
        ...json,
        _id: json.id,
        entries: entries.map(e => e.toAPIFormat ? e.toAPIFormat() : e),
        summary: {
            caloriesEaten: json.caloriesEaten || 0,
            caloriesBurned: json.caloriesBurned || 0,
            waterIntake: json.waterIntake || 0,
            steps: json.steps || 0,
            weight: json.weight ? parseFloat(json.weight) : null,
            protein: parseFloat(json.protein) || 0,
            carbs: parseFloat(json.carbs) || 0,
            fat: parseFloat(json.fat) || 0,
            fiber: parseFloat(json.fiber) || 0
        }
    };
};

module.exports = DailyLog;
