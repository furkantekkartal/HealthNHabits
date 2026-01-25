const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['food', 'water', 'steps', 'weight', 'activity'],
        required: true
    },
    time: {
        type: Date,
        default: Date.now
    },
    data: {
        // For food
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        portion: Number,
        unit: String,

        // For water
        amount: Number, // ml

        // For steps
        steps: Number,
        distance: Number, // km
        caloriesBurned: Number,

        // For weight
        weight: Number,
        weightUnit: String,

        // For activity
        activityType: String,
        duration: Number, // minutes
        caloriesBurned: Number
    },
    aiInsight: {
        type: String,
        default: null
    }
});

const dailyLogSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    entries: [entrySchema],
    summary: {
        caloriesEaten: { type: Number, default: 0 },
        caloriesBurned: { type: Number, default: 0 },
        waterIntake: { type: Number, default: 0 },
        steps: { type: Number, default: 0 },
        weight: { type: Number, default: null },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 }
    }
}, { timestamps: true });

// Update summary when entries change
dailyLogSchema.methods.recalculateSummary = function () {
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

    for (const entry of this.entries) {
        switch (entry.type) {
            case 'food':
                summary.caloriesEaten += entry.data.calories || 0;
                summary.protein += entry.data.protein || 0;
                summary.carbs += entry.data.carbs || 0;
                summary.fat += entry.data.fat || 0;
                summary.fiber += entry.data.fiber || 0;
                break;
            case 'water':
                summary.waterIntake += entry.data.amount || 0;
                break;
            case 'steps':
                summary.steps += entry.data.steps || 0;
                summary.caloriesBurned += entry.data.caloriesBurned || 0;
                break;
            case 'weight':
                summary.weight = entry.data.weight;
                break;
            case 'activity':
                summary.caloriesBurned += entry.data.caloriesBurned || 0;
                break;
        }
    }

    this.summary = summary;
    return this;
};

// Static method to get or create today's log
dailyLogSchema.statics.getOrCreateToday = async function () {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let log = await this.findOne({ date: today });
    if (!log) {
        log = await this.create({ date: today, entries: [] });
    }
    return log;
};

module.exports = mongoose.model('DailyLog', dailyLogSchema);
