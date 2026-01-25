const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    emoji: {
        type: String,
        default: '🍽️'
    },
    category: {
        type: String,
        enum: ['Meal', 'Fruit', 'Coffee', 'Snack', 'Custom'],
        default: 'Custom'
    },
    imageUrl: {
        type: String,
        default: null
    },
    servingSize: {
        value: { type: Number, required: true, default: 100 },
        unit: { type: String, enum: ['g', 'ml', 'pc'], default: 'g' }
    },
    variants: [{
        name: { type: String },
        multiplier: { type: Number, default: 1 }
    }],
    nutrition: {
        calories: { type: Number, required: true, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 },
        fiber: { type: Number, default: 0 },
        sugar: { type: Number, default: 0 }
    },
    usageCount: {
        type: Number,
        default: 0
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Index for search
productSchema.index({ name: 'text', category: 'text' });

// Static method to get most used products
productSchema.statics.getMostUsed = function (limit = 10) {
    return this.find().sort({ usageCount: -1 }).limit(limit);
};

module.exports = mongoose.model('Product', productSchema);
