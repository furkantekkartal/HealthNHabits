/**
 * Seed 100 Popular Products and Reset Users
 * For PostgreSQL (Sequelize)
 * Usage: node seed-database.js
 */

require('dotenv').config();
const { sequelize } = require('../config/database');
const Product = require('../models/Product');
const User = require('../models/User');

// 100 Popular Food Products with nutritional info
const popularProducts = [
    // ===== BREAKFAST (15) =====
    { name: 'Scrambled Eggs (2)', emoji: '🥚', category: 'Meal', servingSizeValue: 120, servingSizeUnit: 'g', calories: 182, protein: 12, carbs: 2, fat: 14, fiber: 0, sugar: 1 },
    { name: 'Oatmeal', emoji: '🥣', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4, sugar: 1 },
    { name: 'Toast with Butter', emoji: '🍞', category: 'Meal', servingSizeValue: 50, servingSizeUnit: 'g', calories: 180, protein: 4, carbs: 24, fat: 8, fiber: 1, sugar: 2 },
    { name: 'Pancakes (2)', emoji: '🥞', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 310, protein: 8, carbs: 42, fat: 12, fiber: 1, sugar: 8 },
    { name: 'Greek Yogurt', emoji: '🥛', category: 'Snack', servingSizeValue: 150, servingSizeUnit: 'g', calories: 100, protein: 17, carbs: 6, fat: 1, fiber: 0, sugar: 4 },
    { name: 'Avocado Toast', emoji: '🥑', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 280, protein: 6, carbs: 28, fat: 18, fiber: 7, sugar: 2 },
    { name: 'Cereal with Milk', emoji: '🥣', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 220, protein: 6, carbs: 42, fat: 4, fiber: 2, sugar: 12 },
    { name: 'Bacon (3 strips)', emoji: '🥓', category: 'Meal', servingSizeValue: 45, servingSizeUnit: 'g', calories: 161, protein: 12, carbs: 0, fat: 12, fiber: 0, sugar: 0 },
    { name: 'French Toast', emoji: '🍞', category: 'Meal', servingSizeValue: 120, servingSizeUnit: 'g', calories: 280, protein: 9, carbs: 32, fat: 13, fiber: 1, sugar: 8 },
    { name: 'Croissant', emoji: '🥐', category: 'Snack', servingSizeValue: 60, servingSizeUnit: 'g', calories: 231, protein: 5, carbs: 26, fat: 12, fiber: 1, sugar: 6 },
    { name: 'Bagel with Cream Cheese', emoji: '🥯', category: 'Meal', servingSizeValue: 120, servingSizeUnit: 'g', calories: 350, protein: 10, carbs: 48, fat: 13, fiber: 2, sugar: 6 },
    { name: 'Granola', emoji: '🥣', category: 'Snack', servingSizeValue: 50, servingSizeUnit: 'g', calories: 230, protein: 5, carbs: 34, fat: 9, fiber: 3, sugar: 12 },
    { name: 'Breakfast Burrito', emoji: '🌯', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 420, protein: 18, carbs: 38, fat: 22, fiber: 3, sugar: 3 },
    { name: 'Muesli', emoji: '🥣', category: 'Meal', servingSizeValue: 80, servingSizeUnit: 'g', calories: 290, protein: 8, carbs: 52, fat: 6, fiber: 6, sugar: 18 },
    { name: 'Waffles (2)', emoji: '🧇', category: 'Meal', servingSizeValue: 140, servingSizeUnit: 'g', calories: 380, protein: 8, carbs: 48, fat: 18, fiber: 1, sugar: 10 },

    // ===== FRUITS (15) =====
    { name: 'Apple', emoji: '🍎', category: 'Fruit', servingSizeValue: 180, servingSizeUnit: 'g', calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4, sugar: 19 },
    { name: 'Banana', emoji: '🍌', category: 'Fruit', servingSizeValue: 120, servingSizeUnit: 'g', calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, sugar: 14 },
    { name: 'Orange', emoji: '🍊', category: 'Fruit', servingSizeValue: 130, servingSizeUnit: 'g', calories: 62, protein: 1, carbs: 15, fat: 0, fiber: 3, sugar: 12 },
    { name: 'Strawberries', emoji: '🍓', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 48, protein: 1, carbs: 11, fat: 0, fiber: 3, sugar: 7 },
    { name: 'Grapes', emoji: '🍇', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 104, protein: 1, carbs: 27, fat: 0, fiber: 1, sugar: 23 },
    { name: 'Watermelon', emoji: '🍉', category: 'Fruit', servingSizeValue: 200, servingSizeUnit: 'g', calories: 60, protein: 1, carbs: 15, fat: 0, fiber: 1, sugar: 12 },
    { name: 'Mango', emoji: '🥭', category: 'Fruit', servingSizeValue: 165, servingSizeUnit: 'g', calories: 99, protein: 1, carbs: 25, fat: 1, fiber: 3, sugar: 23 },
    { name: 'Blueberries', emoji: '🫐', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 85, protein: 1, carbs: 21, fat: 0, fiber: 4, sugar: 15 },
    { name: 'Pineapple', emoji: '🍍', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 75, protein: 1, carbs: 20, fat: 0, fiber: 2, sugar: 15 },
    { name: 'Peach', emoji: '🍑', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 58, protein: 1, carbs: 14, fat: 0, fiber: 2, sugar: 12 },
    { name: 'Kiwi', emoji: '🥝', category: 'Fruit', servingSizeValue: 75, servingSizeUnit: 'g', calories: 42, protein: 1, carbs: 10, fat: 0, fiber: 2, sugar: 6 },
    { name: 'Cherries', emoji: '🍒', category: 'Fruit', servingSizeValue: 100, servingSizeUnit: 'g', calories: 50, protein: 1, carbs: 12, fat: 0, fiber: 2, sugar: 8 },
    { name: 'Pear', emoji: '🍐', category: 'Fruit', servingSizeValue: 180, servingSizeUnit: 'g', calories: 100, protein: 1, carbs: 27, fat: 0, fiber: 6, sugar: 17 },
    { name: 'Avocado', emoji: '🥑', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 240, protein: 3, carbs: 13, fat: 22, fiber: 10, sugar: 1 },
    { name: 'Pomegranate', emoji: '🍎', category: 'Fruit', servingSizeValue: 150, servingSizeUnit: 'g', calories: 125, protein: 2, carbs: 28, fat: 2, fiber: 6, sugar: 20 },

    // ===== COFFEE & DRINKS (12) =====
    { name: 'Black Coffee', emoji: '☕', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Latte', emoji: '☕', category: 'Coffee', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 190, protein: 10, carbs: 18, fat: 7, fiber: 0, sugar: 17 },
    { name: 'Cappuccino', emoji: '☕', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 120, protein: 6, carbs: 10, fat: 6, fiber: 0, sugar: 9 },
    { name: 'Espresso', emoji: '☕', category: 'Coffee', servingSizeValue: 30, servingSizeUnit: 'ml', calories: 3, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Mocha', emoji: '☕', category: 'Coffee', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 290, protein: 10, carbs: 38, fat: 11, fiber: 2, sugar: 32 },
    { name: 'Hot Chocolate', emoji: '🍫', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 190, protein: 8, carbs: 27, fat: 6, fiber: 2, sugar: 24 },
    { name: 'Orange Juice', emoji: '🍊', category: 'Fruit', servingSizeValue: 250, servingSizeUnit: 'ml', calories: 112, protein: 2, carbs: 26, fat: 0, fiber: 0, sugar: 21 },
    { name: 'Green Tea', emoji: '🍵', category: 'Coffee', servingSizeValue: 240, servingSizeUnit: 'ml', calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Iced Coffee', emoji: '🧊', category: 'Coffee', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 80, protein: 1, carbs: 15, fat: 2, fiber: 0, sugar: 14 },
    { name: 'Protein Shake', emoji: '🥤', category: 'Snack', servingSizeValue: 400, servingSizeUnit: 'ml', calories: 250, protein: 30, carbs: 15, fat: 5, fiber: 2, sugar: 8 },
    { name: 'Smoothie (fruit)', emoji: '🥤', category: 'Snack', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 220, protein: 3, carbs: 48, fat: 2, fiber: 4, sugar: 38 },
    { name: 'Milk (1 glass)', emoji: '🥛', category: 'Snack', servingSizeValue: 250, servingSizeUnit: 'ml', calories: 150, protein: 8, carbs: 12, fat: 8, fiber: 0, sugar: 12 },

    // ===== LUNCH/DINNER MEALS (40) =====
    { name: 'Grilled Chicken Breast', emoji: '🍗', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 248, protein: 46, carbs: 0, fat: 5, fiber: 0, sugar: 0 },
    { name: 'Beef Steak', emoji: '🥩', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 450, protein: 50, carbs: 0, fat: 26, fiber: 0, sugar: 0 },
    { name: 'Salmon Fillet', emoji: '🐟', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 280, protein: 34, carbs: 0, fat: 15, fiber: 0, sugar: 0 },
    { name: 'Caesar Salad', emoji: '🥗', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 350, protein: 12, carbs: 15, fat: 28, fiber: 3, sugar: 3 },
    { name: 'Pasta Bolognese', emoji: '🍝', category: 'Meal', servingSizeValue: 350, servingSizeUnit: 'g', calories: 520, protein: 25, carbs: 62, fat: 18, fiber: 4, sugar: 8 },
    { name: 'Margherita Pizza (2 slices)', emoji: '🍕', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 450, protein: 18, carbs: 52, fat: 18, fiber: 3, sugar: 6 },
    { name: 'Burger', emoji: '🍔', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 550, protein: 28, carbs: 42, fat: 30, fiber: 2, sugar: 8 },
    { name: 'Sushi Roll (6 pcs)', emoji: '🍣', category: 'Meal', servingSizeValue: 180, servingSizeUnit: 'g', calories: 280, protein: 12, carbs: 42, fat: 6, fiber: 2, sugar: 5 },
    { name: 'Tacos (2)', emoji: '🌮', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 380, protein: 18, carbs: 32, fat: 20, fiber: 4, sugar: 3 },
    { name: 'Fried Rice', emoji: '🍚', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 340, protein: 8, carbs: 52, fat: 12, fiber: 2, sugar: 2 },
    { name: 'Chicken Soup', emoji: '🍲', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'ml', calories: 180, protein: 15, carbs: 18, fat: 6, fiber: 2, sugar: 3 },
    { name: 'Grilled Vegetables', emoji: '🥦', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 120, protein: 4, carbs: 18, fat: 5, fiber: 6, sugar: 8 },
    { name: 'White Rice (cooked)', emoji: '🍚', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1, sugar: 0 },
    { name: 'Brown Rice (cooked)', emoji: '🍚', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 165, protein: 4, carbs: 35, fat: 1, fiber: 2, sugar: 0 },
    { name: 'Boiled Potato', emoji: '🥔', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 130, protein: 3, carbs: 30, fat: 0, fiber: 3, sugar: 1 },
    { name: 'Sweet Potato', emoji: '🍠', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 135, protein: 2, carbs: 31, fat: 0, fiber: 4, sugar: 6 },
    { name: 'Pad Thai', emoji: '🍜', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 450, protein: 15, carbs: 55, fat: 18, fiber: 3, sugar: 12 },
    { name: 'Chicken Curry', emoji: '🍛', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 420, protein: 28, carbs: 25, fat: 24, fiber: 3, sugar: 6 },
    { name: 'Beef Tacos (3)', emoji: '🌮', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 480, protein: 24, carbs: 36, fat: 26, fiber: 4, sugar: 4 },
    { name: 'Fish and Chips', emoji: '🐟', category: 'Meal', servingSizeValue: 350, servingSizeUnit: 'g', calories: 650, protein: 30, carbs: 55, fat: 35, fiber: 4, sugar: 2 },
    { name: 'Lamb Chops', emoji: '🍖', category: 'Meal', servingSizeValue: 180, servingSizeUnit: 'g', calories: 380, protein: 35, carbs: 0, fat: 26, fiber: 0, sugar: 0 },
    { name: 'BBQ Ribs', emoji: '🍖', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 520, protein: 32, carbs: 18, fat: 36, fiber: 0, sugar: 14 },
    { name: 'Shrimp Pasta', emoji: '🍝', category: 'Meal', servingSizeValue: 350, servingSizeUnit: 'g', calories: 480, protein: 28, carbs: 58, fat: 14, fiber: 3, sugar: 5 },
    { name: 'Vegetable Stir Fry', emoji: '🥦', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 180, protein: 6, carbs: 22, fat: 8, fiber: 5, sugar: 10 },
    { name: 'Chicken Wings (6)', emoji: '🍗', category: 'Meal', servingSizeValue: 180, servingSizeUnit: 'g', calories: 420, protein: 32, carbs: 8, fat: 28, fiber: 0, sugar: 2 },
    { name: 'Turkey Sandwich', emoji: '🥪', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 380, protein: 24, carbs: 38, fat: 14, fiber: 2, sugar: 4 },
    { name: 'BLT Sandwich', emoji: '🥪', category: 'Meal', servingSizeValue: 180, servingSizeUnit: 'g', calories: 340, protein: 14, carbs: 32, fat: 18, fiber: 2, sugar: 4 },
    { name: 'Grilled Cheese', emoji: '🧀', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 380, protein: 16, carbs: 32, fat: 22, fiber: 1, sugar: 4 },
    { name: 'Ramen', emoji: '🍜', category: 'Meal', servingSizeValue: 400, servingSizeUnit: 'ml', calories: 450, protein: 18, carbs: 52, fat: 18, fiber: 2, sugar: 3 },
    { name: 'Pho', emoji: '🍲', category: 'Meal', servingSizeValue: 450, servingSizeUnit: 'ml', calories: 380, protein: 22, carbs: 45, fat: 10, fiber: 2, sugar: 4 },
    { name: 'Burrito Bowl', emoji: '🥗', category: 'Meal', servingSizeValue: 400, servingSizeUnit: 'g', calories: 520, protein: 28, carbs: 55, fat: 20, fiber: 10, sugar: 6 },
    { name: 'Greek Salad', emoji: '🥗', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 220, protein: 8, carbs: 12, fat: 16, fiber: 3, sugar: 6 },
    { name: 'Quinoa Bowl', emoji: '🥗', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 380, protein: 14, carbs: 52, fat: 12, fiber: 6, sugar: 4 },
    { name: 'Falafel Wrap', emoji: '🌯', category: 'Meal', servingSizeValue: 250, servingSizeUnit: 'g', calories: 420, protein: 14, carbs: 48, fat: 20, fiber: 8, sugar: 5 },
    { name: 'Meatballs (5)', emoji: '🍖', category: 'Meal', servingSizeValue: 150, servingSizeUnit: 'g', calories: 320, protein: 22, carbs: 12, fat: 20, fiber: 1, sugar: 3 },
    { name: 'Lasagna', emoji: '🍝', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 480, protein: 24, carbs: 42, fat: 24, fiber: 3, sugar: 8 },
    { name: 'Shepherd\'s Pie', emoji: '🥧', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 420, protein: 22, carbs: 38, fat: 20, fiber: 4, sugar: 5 },
    { name: 'Tuna Salad', emoji: '🐟', category: 'Meal', servingSizeValue: 200, servingSizeUnit: 'g', calories: 280, protein: 28, carbs: 8, fat: 16, fiber: 2, sugar: 3 },
    { name: 'Egg Fried Rice', emoji: '🍚', category: 'Meal', servingSizeValue: 300, servingSizeUnit: 'g', calories: 380, protein: 12, carbs: 55, fat: 12, fiber: 2, sugar: 3 },
    { name: 'Chicken Noodle Soup', emoji: '🍲', category: 'Meal', servingSizeValue: 350, servingSizeUnit: 'ml', calories: 200, protein: 14, carbs: 24, fat: 5, fiber: 2, sugar: 3 },

    // ===== SNACKS (18) =====
    { name: 'Almonds (handful)', emoji: '🥜', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 175, protein: 6, carbs: 6, fat: 15, fiber: 3, sugar: 1 },
    { name: 'Protein Bar', emoji: '🍫', category: 'Snack', servingSizeValue: 60, servingSizeUnit: 'g', calories: 220, protein: 20, carbs: 22, fat: 8, fiber: 3, sugar: 6 },
    { name: 'Dark Chocolate (2 squares)', emoji: '🍫', category: 'Snack', servingSizeValue: 20, servingSizeUnit: 'g', calories: 110, protein: 2, carbs: 10, fat: 8, fiber: 2, sugar: 6 },
    { name: 'Cheese (slice)', emoji: '🧀', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 115, protein: 7, carbs: 0, fat: 9, fiber: 0, sugar: 0 },
    { name: 'Hummus & Carrots', emoji: '🥕', category: 'Snack', servingSizeValue: 120, servingSizeUnit: 'g', calories: 150, protein: 5, carbs: 18, fat: 7, fiber: 4, sugar: 4 },
    { name: 'Rice Cake', emoji: '🍘', category: 'Snack', servingSizeValue: 9, servingSizeUnit: 'pc', calories: 35, protein: 1, carbs: 7, fat: 0, fiber: 0, sugar: 0 },
    { name: 'Cottage Cheese', emoji: '🥛', category: 'Snack', servingSizeValue: 100, servingSizeUnit: 'g', calories: 98, protein: 11, carbs: 3, fat: 4, fiber: 0, sugar: 3 },
    { name: 'Peanut Butter (tbsp)', emoji: '🥜', category: 'Snack', servingSizeValue: 32, servingSizeUnit: 'g', calories: 190, protein: 8, carbs: 6, fat: 16, fiber: 2, sugar: 3 },
    { name: 'Crackers (6)', emoji: '🍪', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 130, protein: 3, carbs: 20, fat: 5, fiber: 1, sugar: 2 },
    { name: 'Popcorn (small bag)', emoji: '🍿', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 120, protein: 4, carbs: 21, fat: 4, fiber: 4, sugar: 0 },
    { name: 'Trail Mix', emoji: '🥜', category: 'Snack', servingSizeValue: 40, servingSizeUnit: 'g', calories: 200, protein: 5, carbs: 18, fat: 13, fiber: 2, sugar: 10 },
    { name: 'Yogurt Parfait', emoji: '🥛', category: 'Snack', servingSizeValue: 200, servingSizeUnit: 'g', calories: 280, protein: 12, carbs: 42, fat: 8, fiber: 3, sugar: 28 },
    { name: 'Energy Ball', emoji: '⚡', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 120, protein: 4, carbs: 14, fat: 6, fiber: 2, sugar: 8 },
    { name: 'Mixed Nuts', emoji: '🥜', category: 'Snack', servingSizeValue: 40, servingSizeUnit: 'g', calories: 240, protein: 6, carbs: 8, fat: 22, fiber: 2, sugar: 2 },
    { name: 'Banana Chips', emoji: '🍌', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 150, protein: 1, carbs: 17, fat: 10, fiber: 2, sugar: 10 },
    { name: 'Dried Mango', emoji: '🥭', category: 'Snack', servingSizeValue: 40, servingSizeUnit: 'g', calories: 128, protein: 1, carbs: 31, fat: 0, fiber: 2, sugar: 27 },
    { name: 'Beef Jerky', emoji: '🥩', category: 'Snack', servingSizeValue: 30, servingSizeUnit: 'g', calories: 116, protein: 9, carbs: 3, fat: 7, fiber: 0, sugar: 3 },
    { name: 'String Cheese', emoji: '🧀', category: 'Snack', servingSizeValue: 28, servingSizeUnit: 'g', calories: 80, protein: 7, carbs: 1, fat: 6, fiber: 0, sugar: 0 },
];

async function seedDatabase() {
    console.log('===========================================');
    console.log('  Database Seeding - 100 Products');
    console.log('===========================================\n');

    try {
        // Connect to database
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL\n');

        // Drop all users
        console.log('Dropping all users...');
        const deletedUsers = await User.destroy({ where: {}, truncate: true, cascade: true });
        console.log(`✅ All users deleted\n`);

        // Clear existing products
        console.log('Clearing existing products...');
        await Product.destroy({ where: {}, truncate: true, cascade: true });
        console.log('✅ Products cleared\n');

        // Insert products
        console.log('Inserting 100 products...');
        await Product.bulkCreate(popularProducts);
        console.log(`✅ Inserted ${popularProducts.length} products\n`);

        console.log('===========================================');
        console.log('  ✅ Database seeding completed!');
        console.log('===========================================');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('\nConnection closed.');
    }
}

seedDatabase();
