const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const sampleProducts = [
    {
        name: 'Espresso',
        emoji: '☕',
        category: 'Coffee',
        servingSize: { value: 30, unit: 'ml' },
        nutrition: { calories: 2, protein: 0, carbs: 0, fat: 0 },
        usageCount: 15
    },
    {
        name: 'Banana',
        emoji: '🍌',
        category: 'Fruit',
        servingSize: { value: 1, unit: 'pc' },
        nutrition: { calories: 105, protein: 1, carbs: 27, fat: 0 },
        usageCount: 12
    },
    {
        name: 'Apple',
        emoji: '🍎',
        category: 'Fruit',
        servingSize: { value: 1, unit: 'pc' },
        nutrition: { calories: 95, protein: 0, carbs: 25, fat: 0 },
        usageCount: 10
    },
    {
        name: 'Orange Juice',
        emoji: '🍊',
        category: 'Fruit',
        servingSize: { value: 250, unit: 'ml' },
        nutrition: { calories: 110, protein: 2, carbs: 26, fat: 0 },
        usageCount: 8
    },
    {
        name: 'Grilled Chicken Breast',
        emoji: '🍗',
        category: 'Meal',
        servingSize: { value: 150, unit: 'g' },
        nutrition: { calories: 200, protein: 37, carbs: 0, fat: 4 },
        usageCount: 20
    },
    {
        name: 'Greek Salad',
        emoji: '🥗',
        category: 'Meal',
        servingSize: { value: 300, unit: 'g' },
        nutrition: { calories: 320, protein: 8, carbs: 12, fat: 24 },
        usageCount: 7
    },
    {
        name: 'Protein Shake',
        emoji: '🥤',
        category: 'Snack',
        servingSize: { value: 300, unit: 'ml' },
        nutrition: { calories: 150, protein: 25, carbs: 8, fat: 3 },
        usageCount: 14
    },
    {
        name: 'Potato Chips',
        emoji: '🥔',
        category: 'Snack',
        servingSize: { value: 28, unit: 'g' },
        nutrition: { calories: 150, protein: 2, carbs: 15, fat: 10 },
        usageCount: 5
    },
    {
        name: 'Whole Grain Toast',
        emoji: '🍞',
        category: 'Meal',
        servingSize: { value: 1, unit: 'pc' },
        nutrition: { calories: 90, protein: 4, carbs: 18, fat: 1 },
        usageCount: 11
    },
    {
        name: 'Latte',
        emoji: '☕',
        category: 'Coffee',
        servingSize: { value: 350, unit: 'ml' },
        nutrition: { calories: 190, protein: 10, carbs: 18, fat: 7 },
        usageCount: 9
    }
];

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing products
        await Product.deleteMany({});
        console.log('Cleared existing products');

        // Insert sample products
        const result = await Product.insertMany(sampleProducts);
        console.log(`Inserted ${result.length} sample products`);

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding products:', error);
        process.exit(1);
    }
}

seedProducts();
