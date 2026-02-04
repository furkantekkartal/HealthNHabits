/**
 * Seed script to create 100 common default food products
 * Run with: node scripts/seedDefaultProducts.js
 * 
 * These products have userId=null, making them visible to all users
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.dev') });

const { sequelize } = require('../config/database');
const Product = require('../models/Product');

const defaultProducts = [
    // Fruits (🍎)
    { name: 'Apple', emoji: '🍎', category: 'Fruit', servingSizeValue: 182, servingSizeUnit: 'g', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, fiber: 4.4, sugar: 19 },
    { name: 'Banana', emoji: '🍌', category: 'Fruit', servingSizeValue: 118, servingSizeUnit: 'g', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, fiber: 3.1, sugar: 14 },
    { name: 'Orange', emoji: '🍊', category: 'Fruit', servingSizeValue: 131, servingSizeUnit: 'g', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, fiber: 3.1, sugar: 12 },
    { name: 'Strawberries', emoji: '🍓', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 49, protein: 1, carbs: 12, fat: 0.5, fiber: 3, sugar: 7 },
    { name: 'Grapes', emoji: '🍇', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 104, protein: 1.1, carbs: 27, fat: 0.2, fiber: 1.4, sugar: 23 },
    { name: 'Watermelon', emoji: '🍉', category: 'Fruit', servingSizeValue: 280, servingSizeUnit: 'g', calories: 86, protein: 1.7, carbs: 22, fat: 0.4, fiber: 1.1, sugar: 18 },
    { name: 'Mango', emoji: '🥭', category: 'Fruit', servingSizeValue: 165, servingSizeUnit: 'g', calories: 99, protein: 1.4, carbs: 25, fat: 0.6, fiber: 2.6, sugar: 23 },
    { name: 'Pineapple', emoji: '🍍', category: 'Fruit', servingSizeValue: 165, servingSizeUnit: 'g', calories: 82, protein: 0.9, carbs: 22, fat: 0.2, fiber: 2.3, sugar: 16 },
    { name: 'Blueberries', emoji: '🫐', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 86, protein: 1.1, carbs: 22, fat: 0.5, fiber: 3.6, sugar: 15 },
    { name: 'Avocado', emoji: '🥑', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 240, protein: 3, carbs: 13, fat: 22, fiber: 10, sugar: 1 },

    // Meals - Breakfast (🍳)
    { name: 'Scrambled Eggs', emoji: '🍳', category: 'Meal', servingSizeValue: 100, servingSizeUnit: 'g', calories: 147, protein: 10, carbs: 2, fat: 11, fiber: 0, sugar: 1 },
    { name: 'Oatmeal', emoji: '🥣', category: 'Meal', servingSizeValue: 234, servingSizeUnit: 'g', calories: 158, protein: 6, carbs: 27, fat: 3, fiber: 4, sugar: 1 },
    { name: 'Pancakes', emoji: '🥞', category: 'Meal', servingSizeValue: 116, servingSizeUnit: 'g', calories: 227, protein: 6, carbs: 28, fat: 10, fiber: 1, sugar: 5 },
    { name: 'Toast with Butter', emoji: '🍞', category: 'Meal', servingSizeValue: 50, servingSizeUnit: 'g', calories: 167, protein: 3, carbs: 20, fat: 8, fiber: 1, sugar: 2 },
    { name: 'Greek Yogurt', emoji: '🥛', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 146, protein: 20, carbs: 8, fat: 4, fiber: 0, sugar: 6 },
    { name: 'Cereal with Milk', emoji: '🥣', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 220, protein: 8, carbs: 40, fat: 4, fiber: 3, sugar: 12 },
    { name: 'Bacon', emoji: '🥓', category: 'Meal', servingSizeValue: 28, servingSizeUnit: 'g', calories: 161, protein: 12, carbs: 0.4, fat: 12, fiber: 0, sugar: 0 },
    { name: 'French Toast', emoji: '🍞', category: 'Meal', servingSizeValue: 135, servingSizeUnit: 'g', calories: 285, protein: 10, carbs: 34, fat: 12, fiber: 1, sugar: 8 },
    { name: 'Bagel with Cream Cheese', emoji: '🥯', category: 'Meal', servingSizeValue: 120, servingSizeUnit: 'g', calories: 354, protein: 12, carbs: 52, fat: 11, fiber: 2, sugar: 6 },
    { name: 'Smoothie Bowl', emoji: '🥣', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 280, protein: 8, carbs: 50, fat: 6, fiber: 8, sugar: 35 },

    // Meals - Lunch/Dinner (🍽️)
    { name: 'Grilled Chicken Breast', emoji: '🍗', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 248, protein: 46, carbs: 0, fat: 5, fiber: 0, sugar: 0 },
    { name: 'Beef Steak', emoji: '🥩', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 506, protein: 50, carbs: 0, fat: 34, fiber: 0, sugar: 0 },
    { name: 'Salmon Fillet', emoji: '🐟', category: 'Meal', servingSizeValue: 170, servingSizeUnit: 'g', calories: 350, protein: 39, carbs: 0, fat: 21, fiber: 0, sugar: 0 },
    { name: 'Spaghetti Bolognese', emoji: '🍝', category: 'Meal', servingSizeValue: 350, servingSizeUnit: 'g', calories: 450, protein: 22, carbs: 52, fat: 16, fiber: 4, sugar: 8 },
    { name: 'Caesar Salad', emoji: '🥗', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 220, protein: 10, carbs: 12, fat: 16, fiber: 3, sugar: 3 },
    { name: 'Pizza Slice', emoji: '🍕', category: 'Meal', servingSizeValue: 107, servingSizeUnit: 'g', calories: 285, protein: 12, carbs: 36, fat: 10, fiber: 2, sugar: 4 },
    { name: 'Burger', emoji: '🍔', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 540, protein: 28, carbs: 40, fat: 29, fiber: 2, sugar: 8 },
    { name: 'Fried Rice', emoji: '🍚', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 333, protein: 10, carbs: 52, fat: 10, fiber: 2, sugar: 2 },
    { name: 'Sushi (8 pieces)', emoji: '🍣', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 280, protein: 16, carbs: 44, fat: 4, fiber: 2, sugar: 6 },
    { name: 'Chicken Soup', emoji: '🍲', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 165, protein: 15, carbs: 15, fat: 5, fiber: 2, sugar: 3 },
    { name: 'Tacos (2)', emoji: '🌮', category: 'Meal', servingSizeValue: 180, servingSizeUnit: 'g', calories: 340, protein: 18, carbs: 28, fat: 18, fiber: 4, sugar: 3 },
    { name: 'Burrito', emoji: '🌯', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 430, protein: 22, carbs: 52, fat: 14, fiber: 6, sugar: 4 },
    { name: 'Pad Thai', emoji: '🍜', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 420, protein: 18, carbs: 50, fat: 16, fiber: 3, sugar: 10 },
    { name: 'Fish and Chips', emoji: '🐟', category: 'Meal', servingSizeValue: 350, servingSizeUnit: 'g', calories: 650, protein: 30, carbs: 55, fat: 35, fiber: 4, sugar: 2 },
    { name: 'Lasagna', emoji: '🍝', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 400, protein: 22, carbs: 32, fat: 20, fiber: 3, sugar: 6 },
    { name: 'Grilled Cheese Sandwich', emoji: '🥪', category: 'Meal', servingSizeValue: 130, servingSizeUnit: 'g', calories: 400, protein: 14, carbs: 28, fat: 26, fiber: 1, sugar: 4 },
    { name: 'Chicken Stir Fry', emoji: '🥡', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 320, protein: 28, carbs: 25, fat: 12, fiber: 4, sugar: 8 },
    { name: 'Shrimp Pasta', emoji: '🍝', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 420, protein: 24, carbs: 48, fat: 14, fiber: 3, sugar: 4 },
    { name: 'Vegetable Curry', emoji: '🍛', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 280, protein: 8, carbs: 35, fat: 12, fiber: 6, sugar: 8 },
    { name: 'Roast Beef Sandwich', emoji: '🥪', category: 'Meal', servingSizeValue: 180, servingSizeUnit: 'g', calories: 380, protein: 28, carbs: 32, fat: 16, fiber: 2, sugar: 5 },

    // Snacks (🍿)
    { name: 'Potato Chips', emoji: '🍟', category: 'Snack', servingSizeValue: 50, servingSizeUnit: 'g', calories: 270, protein: 3, carbs: 26, fat: 18, fiber: 2, sugar: 1 },
    { name: 'Chocolate Bar', emoji: '🍫', category: 'Snack', servingSizeValue: 45, servingSizeUnit: 'g', calories: 240, protein: 3, carbs: 27, fat: 14, fiber: 2, sugar: 22 },
    { name: 'Popcorn', emoji: '🍿', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 120, protein: 4, carbs: 22, fat: 2, fiber: 4, sugar: 0 },
    { name: 'Mixed Nuts', emoji: '🥜', category: 'Snack', servingSizeValue: 40, servingSizeUnit: 'g', calories: 240, protein: 8, carbs: 8, fat: 21, fiber: 3, sugar: 2 },
    { name: 'Almonds', emoji: '🌰', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 174, protein: 6, carbs: 6, fat: 15, fiber: 4, sugar: 1 },
    { name: 'Protein Bar', emoji: '🍫', category: 'Snack', servingSizeValue: 60, servingSizeUnit: 'g', calories: 220, protein: 20, carbs: 22, fat: 7, fiber: 3, sugar: 8 },
    { name: 'Crackers', emoji: '🍘', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 130, protein: 3, carbs: 22, fat: 4, fiber: 1, sugar: 2 },
    { name: 'Cheese Stick', emoji: '🧀', category: 'Snack', servingSizeValue: 28, servingSizeUnit: 'g', calories: 80, protein: 7, carbs: 1, fat: 6, fiber: 0, sugar: 0 },
    { name: 'Trail Mix', emoji: '🥜', category: 'Snack', servingSizeValue: 50, servingSizeUnit: 'g', calories: 250, protein: 7, carbs: 25, fat: 15, fiber: 3, sugar: 15 },
    { name: 'Granola Bar', emoji: '🍫', category: 'Snack', servingSizeValue: 35, servingSizeUnit: 'g', calories: 150, protein: 3, carbs: 26, fat: 5, fiber: 2, sugar: 12 },
    { name: 'Pretzel', emoji: '🥨', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 110, protein: 3, carbs: 23, fat: 1, fiber: 1, sugar: 1 },
    { name: 'Rice Cakes', emoji: '🍘', category: 'Snack', servingSizeValue: 18, servingSizeUnit: 'g', calories: 70, protein: 1, carbs: 15, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Hummus with Veggies', emoji: '🥕', category: 'Snack', servingSizeValue: 100, servingSizeUnit: 'g', calories: 180, protein: 6, carbs: 18, fat: 10, fiber: 4, sugar: 3 },
    { name: 'Dark Chocolate', emoji: '🍫', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 170, protein: 2, carbs: 13, fat: 12, fiber: 3, sugar: 7 },
    { name: 'Peanut Butter', emoji: '🥜', category: 'Snack', servingSizeValue: 32, servingSizeUnit: 'g', calories: 190, protein: 8, carbs: 6, fat: 16, fiber: 2, sugar: 3 },

    // Coffee & Drinks (☕)
    { name: 'Black Coffee', emoji: '☕', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 2, protein: 0.3, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Latte', emoji: '☕', category: 'Coffee', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 150, protein: 8, carbs: 15, fat: 6, fiber: 0, sugar: 13 },
    { name: 'Cappuccino', emoji: '☕', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 80, protein: 5, carbs: 8, fat: 3, fiber: 0, sugar: 7 },
    { name: 'Espresso', emoji: '☕', category: 'Coffee', servingSizeValue: 30, servingSizeUnit: 'ml', calories: 3, protein: 0.2, carbs: 0.5, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Mocha', emoji: '☕', category: 'Coffee', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 290, protein: 9, carbs: 38, fat: 12, fiber: 2, sugar: 32 },
    { name: 'Americano', emoji: '☕', category: 'Coffee', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 15, protein: 1, carbs: 2, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Iced Coffee', emoji: '🧊', category: 'Coffee', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 120, protein: 2, carbs: 22, fat: 3, fiber: 0, sugar: 20 },
    { name: 'Tea', emoji: '🍵', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Green Tea', emoji: '🍵', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Hot Chocolate', emoji: '☕', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 190, protein: 8, carbs: 27, fat: 6, fiber: 2, sugar: 22 },
    { name: 'Orange Juice', emoji: '🍊', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 110, protein: 2, carbs: 26, fat: 0, fiber: 0, sugar: 21 },
    { name: 'Milk', emoji: '🥛', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 150, protein: 8, carbs: 12, fat: 8, fiber: 0, sugar: 12 },
    { name: 'Almond Milk', emoji: '🥛', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 30, protein: 1, carbs: 1, fat: 2.5, fiber: 0, sugar: 0 },
    { name: 'Protein Shake', emoji: '🥤', category: 'Coffee', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 200, protein: 25, carbs: 10, fat: 5, fiber: 2, sugar: 5 },
    { name: 'Smoothie', emoji: '🥤', category: 'Coffee', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 250, protein: 5, carbs: 50, fat: 3, fiber: 4, sugar: 40 },

    // More Meals
    { name: 'Meatballs', emoji: '🍝', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 280, protein: 22, carbs: 8, fat: 18, fiber: 1, sugar: 2 },
    { name: 'Pork Chop', emoji: '🍖', category: 'Meal', servingSizeValue: 170, servingSizeUnit: 'g', calories: 290, protein: 35, carbs: 0, fat: 16, fiber: 0, sugar: 0 },
    { name: 'Turkey Breast', emoji: '🦃', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 180, protein: 40, carbs: 0, fat: 1, fiber: 0, sugar: 0 },
    { name: 'Lamb Chops', emoji: '🍖', category: 'Meal', servingSizeValue: 170, servingSizeUnit: 'g', calories: 380, protein: 32, carbs: 0, fat: 28, fiber: 0, sugar: 0 },
    { name: 'Chicken Wings (6)', emoji: '🍗', category: 'Meal', servingSizeValue: 180, servingSizeUnit: 'g', calories: 450, protein: 38, carbs: 6, fat: 30, fiber: 0, sugar: 1 },
    { name: 'BBQ Ribs', emoji: '🍖', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 520, protein: 35, carbs: 12, fat: 36, fiber: 0, sugar: 10 },
    { name: 'Tuna Salad', emoji: '🥗', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 280, protein: 28, carbs: 6, fat: 16, fiber: 2, sugar: 2 },
    { name: 'Chicken Caesar Wrap', emoji: '🌯', category: 'Meal', servingSizeValue: 220, servingSizeUnit: 'g', calories: 480, protein: 28, carbs: 38, fat: 24, fiber: 3, sugar: 4 },
    { name: 'Vegetable Soup', emoji: '🍲', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 120, protein: 4, carbs: 20, fat: 3, fiber: 5, sugar: 8 },
    { name: 'Quinoa Bowl', emoji: '🥗', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 320, protein: 12, carbs: 48, fat: 10, fiber: 6, sugar: 4 },

    // Custom/Other
    { name: 'White Rice', emoji: '🍚', category: 'Custom', servingSizeValue: 150, servingSizeUnit: 'g', calories: 206, protein: 4, carbs: 45, fat: 0.4, fiber: 0.6, sugar: 0 },
    { name: 'Brown Rice', emoji: '🍚', category: 'Custom', servingSizeValue: 150, servingSizeUnit: 'g', calories: 216, protein: 5, carbs: 45, fat: 2, fiber: 3.5, sugar: 0.7 },
    { name: 'Pasta (cooked)', emoji: '🍝', category: 'Custom', servingSizeValue: 150, servingSizeUnit: 'g', calories: 220, protein: 8, carbs: 43, fat: 1.3, fiber: 2.5, sugar: 1 },
    { name: 'Bread Slice', emoji: '🍞', category: 'Custom', servingSizeValue: 30, servingSizeUnit: 'g', calories: 80, protein: 3, carbs: 15, fat: 1, fiber: 1, sugar: 2 },
    { name: 'Boiled Egg', emoji: '🥚', category: 'Custom', servingSizeValue: 50, servingSizeUnit: 'g', calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, sugar: 0.6 },
    { name: 'Fried Egg', emoji: '🍳', category: 'Custom', servingSizeValue: 46, servingSizeUnit: 'g', calories: 90, protein: 6, carbs: 0.4, fat: 7, fiber: 0, sugar: 0.4 },
    { name: 'Broccoli', emoji: '🥦', category: 'Custom', servingSizeValue: 100, servingSizeUnit: 'g', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7 },
    { name: 'Carrot', emoji: '🥕', category: 'Custom', servingSizeValue: 80, servingSizeUnit: 'g', calories: 33, protein: 0.7, carbs: 8, fat: 0.2, fiber: 2.3, sugar: 4 },
    { name: 'Spinach', emoji: '🥬', category: 'Custom', servingSizeValue: 100, servingSizeUnit: 'g', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4 },
    { name: 'Potato (baked)', emoji: '🥔', category: 'Custom', servingSizeValue: 170, servingSizeUnit: 'g', calories: 161, protein: 4, carbs: 37, fat: 0.2, fiber: 4, sugar: 2 },
    { name: 'Sweet Potato', emoji: '🍠', category: 'Custom', servingSizeValue: 150, servingSizeUnit: 'g', calories: 129, protein: 2, carbs: 30, fat: 0.1, fiber: 4, sugar: 6 },
    { name: 'Corn on the Cob', emoji: '🌽', category: 'Custom', servingSizeValue: 100, servingSizeUnit: 'g', calories: 96, protein: 3.4, carbs: 21, fat: 1.5, fiber: 2.4, sugar: 4.5 },
    { name: 'Green Beans', emoji: '🥒', category: 'Custom', servingSizeValue: 100, servingSizeUnit: 'g', calories: 31, protein: 1.8, carbs: 7, fat: 0.1, fiber: 3.4, sugar: 1.4 },
    { name: 'Tomato', emoji: '🍅', category: 'Custom', servingSizeValue: 120, servingSizeUnit: 'g', calories: 22, protein: 1.1, carbs: 4.8, fat: 0.2, fiber: 1.5, sugar: 3.2 },
    { name: 'Cottage Cheese', emoji: '🧀', category: 'Custom', servingSizeValue: 100, servingSizeUnit: 'g', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, sugar: 2.7 },
];

async function seedProducts() {
    try {
        console.log('🔄 Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Delete all existing products
        console.log('🗑️ Deleting all existing products...');
        const deletedCount = await Product.destroy({ where: {} });
        console.log(`✅ Deleted ${deletedCount} existing products`);

        // Insert default products (userId = null makes them visible to all)
        console.log('📦 Creating default products...');
        let successCount = 0;

        for (const productData of defaultProducts) {
            try {
                await Product.create({
                    userId: null, // Default product - visible to all users
                    ...productData
                });
                successCount++;
                process.stdout.write(`\r   Created ${successCount}/${defaultProducts.length} products...`);
            } catch (err) {
                console.error(`\n❌ Failed to create ${productData.name}:`, err.message);
            }
        }

        console.log(`\n✅ Successfully created ${successCount} default products!`);
        console.log('🎉 Seed complete!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}

seedProducts();
