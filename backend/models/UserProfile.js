const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: {
        type: String,
        default: 'User'
    },
    profileImage: {
        type: String,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'male'
    },
    birthYear: {
        type: Number,
        min: 1900,
        max: 2026,
        default: 1990
    },
    height: {
        value: { type: Number, default: 170 },
        unit: { type: String, enum: ['cm', 'ft'], default: 'cm' }
    },
    weight: {
        value: { type: Number, default: 70 },
        unit: { type: String, enum: ['kg', 'lb'], default: 'kg' }
    },
    activityLevel: {
        type: String,
        enum: ['sedentary', 'lightly_active', 'active', 'very_active'],
        default: 'lightly_active'
    },
    strideLength: {
        type: Number, // in cm
        default: null
    },
    dailyCalorieGoal: {
        type: Number,
        default: 2000
    },
    dailyWaterGoal: {
        type: Number, // in ml
        default: 2000
    },
    dailyStepsGoal: {
        type: Number,
        default: 10000
    },
    // Daily macro goals
    dailyProteinGoal: {
        type: Number, // in grams
        default: 50
    },
    dailyCarbsGoal: {
        type: Number, // in grams
        default: 250
    },
    dailyFatGoal: {
        type: Number, // in grams
        default: 65
    },
    dailyFiberGoal: {
        type: Number, // in grams
        default: 25
    }
}, { timestamps: true });

// Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor
userProfileSchema.methods.calculateBMR = function () {
    // Use defaults if values are missing
    const weightValue = this.weight?.value || 70;
    const weightUnit = this.weight?.unit || 'kg';
    const heightValue = this.height?.value || 170;
    const heightUnit = this.height?.unit || 'cm';
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
userProfileSchema.methods.calculateTDEE = function () {
    const bmr = this.calculateBMR();
    const multipliers = {
        sedentary: 1.2,
        lightly_active: 1.35,
        active: 1.5,
        very_active: 1.7
    };
    return Math.round(bmr * multipliers[this.activityLevel]);
};

module.exports = mongoose.model('UserProfile', userProfileSchema);
