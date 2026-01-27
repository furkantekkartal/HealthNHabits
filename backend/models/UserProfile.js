const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'user_id'
    },
    name: {
        type: DataTypes.STRING(100),
        defaultValue: 'User'
    },
    profileImagePath: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
        field: 'profile_image_path'
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        defaultValue: 'male'
    },
    birthYear: {
        type: DataTypes.INTEGER,
        defaultValue: 1990,
        field: 'birth_year',
        validate: {
            min: 1900,
            max: 2030
        }
    },
    heightValue: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 170,
        field: 'height_value'
    },
    heightUnit: {
        type: DataTypes.ENUM('cm', 'ft'),
        defaultValue: 'cm',
        field: 'height_unit'
    },
    weightValue: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 70,
        field: 'weight_value'
    },
    weightUnit: {
        type: DataTypes.ENUM('kg', 'lb'),
        defaultValue: 'kg',
        field: 'weight_unit'
    },
    activityLevel: {
        type: DataTypes.ENUM('sedentary', 'lightly_active', 'active', 'very_active'),
        defaultValue: 'lightly_active',
        field: 'activity_level'
    },
    strideLength: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: null,
        field: 'stride_length'
    },
    dailyCalorieGoal: {
        type: DataTypes.INTEGER,
        defaultValue: 2000,
        field: 'daily_calorie_goal'
    },
    dailyWaterGoal: {
        type: DataTypes.INTEGER,
        defaultValue: 2000,
        field: 'daily_water_goal'
    },
    dailyStepsGoal: {
        type: DataTypes.INTEGER,
        defaultValue: 10000,
        field: 'daily_steps_goal'
    },
    dailyProteinGoal: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
        field: 'daily_protein_goal'
    },
    dailyCarbsGoal: {
        type: DataTypes.INTEGER,
        defaultValue: 250,
        field: 'daily_carbs_goal'
    },
    dailyFatGoal: {
        type: DataTypes.INTEGER,
        defaultValue: 65,
        field: 'daily_fat_goal'
    },
    dailyFiberGoal: {
        type: DataTypes.INTEGER,
        defaultValue: 25,
        field: 'daily_fiber_goal'
    }
}, {
    tableName: 'user_profiles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Virtual getters for compatibility with existing code
UserProfile.prototype.getHeight = function () {
    return {
        value: parseFloat(this.heightValue) || 170,
        unit: this.heightUnit || 'cm'
    };
};

UserProfile.prototype.getWeight = function () {
    return {
        value: parseFloat(this.weightValue) || 70,
        unit: this.weightUnit || 'kg'
    };
};

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor
UserProfile.prototype.calculateBMR = function () {
    const weightValue = parseFloat(this.weightValue) || 70;
    const weightUnit = this.weightUnit || 'kg';
    const heightValue = parseFloat(this.heightValue) || 170;
    const heightUnit = this.heightUnit || 'cm';
    const birthYear = this.birthYear || 1990;
    const gender = this.gender || 'male';

    const weightKg = weightUnit === 'kg' ? weightValue : weightValue * 0.453592;
    const heightCm = heightUnit === 'cm' ? heightValue : heightValue * 30.48;
    const age = new Date().getFullYear() - birthYear;

    if (gender === 'male') {
        return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
        return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }
};

// Calculate TDEE (Total Daily Energy Expenditure)
UserProfile.prototype.calculateTDEE = function () {
    const bmr = this.calculateBMR();
    const multipliers = {
        sedentary: 1.2,
        lightly_active: 1.35,
        active: 1.5,
        very_active: 1.7
    };
    return Math.round(bmr * (multipliers[this.activityLevel] || 1.35));
};

// Convert to JSON with nested height/weight for API compatibility
UserProfile.prototype.toAPIFormat = function () {
    const json = this.toJSON();
    return {
        ...json,
        height: {
            value: parseFloat(json.heightValue) || 170,
            unit: json.heightUnit || 'cm'
        },
        weight: {
            value: parseFloat(json.weightValue) || 70,
            unit: json.weightUnit || 'kg'
        }
    };
};

module.exports = UserProfile;
