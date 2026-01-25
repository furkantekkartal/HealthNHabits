/**
 * Seed 50 Popular Products to both Master and Dev databases
 * Usage: node seed-products.js
 */

const mongoose = require('mongoose');

// Connection URIs
const MASTER_URI = 'mongodb+srv://furkantekkartal2_db_user:hEFMMGC2WdFz5aY8@furkantekkartal2.eckh1ik.mongodb.net/diet-tracker-master?appName=furkantekkartal2';
const DEV_URI = 'mongodb+srv://furkantekkartal2_db_user:hEFMMGC2WdFz5aY8@furkantekkartal2.eckh1ik.mongodb.net/diet-tracker-dev?appName=furkantekkartal2';

// 50 Popular Food Products with nutritional info (per serving)
const popularProducts = [
    // Breakfast
    { name: 'Scrambled Eggs (2)', emoji: '🥚', category: 'Meal', servingSize: { value: 120, unit: 'g' }, nutrition: { calories: 182, protein: 12, carbs: 2, fat: 14, fiber: 0, sugar: 1 } },
    { name: 'Oatmeal', emoji: '🥣', category: 'Meal', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 150, protein: 5, carbs: 27, fat: 3, fiber: 4, sugar: 1 } },
    { name: 'Toast with Butter', emoji: '🍞', category: 'Meal', servingSize: { value: 50, unit: 'g' }, nutrition: { calories: 180, protein: 4, carbs: 24, fat: 8, fiber: 1, sugar: 2 } },
    { name: 'Pancakes (2)', emoji: '🥞', category: 'Meal', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 310, protein: 8, carbs: 42, fat: 12, fiber: 1, sugar: 8 } },
    { name: 'Greek Yogurt', emoji: '🥛', category: 'Snack', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 100, protein: 17, carbs: 6, fat: 1, fiber: 0, sugar: 4 } },
    { name: 'Avocado Toast', emoji: '🥑', category: 'Meal', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 280, protein: 6, carbs: 28, fat: 18, fiber: 7, sugar: 2 } },

    // Fruits
    { name: 'Apple', emoji: '🍎', category: 'Fruit', servingSize: { value: 180, unit: 'g' }, nutrition: { calories: 95, protein: 0, carbs: 25, fat: 0, fiber: 4, sugar: 19 } },
    { name: 'Banana', emoji: '🍌', category: 'Fruit', servingSize: { value: 120, unit: 'g' }, nutrition: { calories: 105, protein: 1, carbs: 27, fat: 0, fiber: 3, sugar: 14 } },
    { name: 'Orange', emoji: '🍊', category: 'Fruit', servingSize: { value: 130, unit: 'g' }, nutrition: { calories: 62, protein: 1, carbs: 15, fat: 0, fiber: 3, sugar: 12 } },
    { name: 'Strawberries', emoji: '🍓', category: 'Fruit', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 48, protein: 1, carbs: 11, fat: 0, fiber: 3, sugar: 7 } },
    { name: 'Grapes', emoji: '🍇', category: 'Fruit', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 104, protein: 1, carbs: 27, fat: 0, fiber: 1, sugar: 23 } },
    { name: 'Watermelon', emoji: '🍉', category: 'Fruit', servingSize: { value: 200, unit: 'g' }, nutrition: { calories: 60, protein: 1, carbs: 15, fat: 0, fiber: 1, sugar: 12 } },
    { name: 'Mango', emoji: '🥭', category: 'Fruit', servingSize: { value: 165, unit: 'g' }, nutrition: { calories: 99, protein: 1, carbs: 25, fat: 1, fiber: 3, sugar: 23 } },
    { name: 'Blueberries', emoji: '🫐', category: 'Fruit', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 85, protein: 1, carbs: 21, fat: 0, fiber: 4, sugar: 15 } },

    // Coffee & Drinks
    { name: 'Black Coffee', emoji: '☕', category: 'Coffee', servingSize: { value: 240, unit: 'ml' }, nutrition: { calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 } },
    { name: 'Latte', emoji: '☕', category: 'Coffee', servingSize: { value: 350, unit: 'ml' }, nutrition: { calories: 190, protein: 10, carbs: 18, fat: 7, fiber: 0, sugar: 17 } },
    { name: 'Cappuccino', emoji: '☕', category: 'Coffee', servingSize: { value: 240, unit: 'ml' }, nutrition: { calories: 120, protein: 6, carbs: 10, fat: 6, fiber: 0, sugar: 9 } },
    { name: 'Espresso', emoji: '☕', category: 'Coffee', servingSize: { value: 30, unit: 'ml' }, nutrition: { calories: 3, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 } },
    { name: 'Mocha', emoji: '☕', category: 'Coffee', servingSize: { value: 350, unit: 'ml' }, nutrition: { calories: 290, protein: 10, carbs: 38, fat: 11, fiber: 2, sugar: 32 } },
    { name: 'Hot Chocolate', emoji: '🍫', category: 'Coffee', servingSize: { value: 240, unit: 'ml' }, nutrition: { calories: 190, protein: 8, carbs: 27, fat: 6, fiber: 2, sugar: 24 } },
    { name: 'Orange Juice', emoji: '🍊', category: 'Fruit', servingSize: { value: 250, unit: 'ml' }, nutrition: { calories: 112, protein: 2, carbs: 26, fat: 0, fiber: 0, sugar: 21 } },
    { name: 'Green Tea', emoji: '🍵', category: 'Coffee', servingSize: { value: 240, unit: 'ml' }, nutrition: { calories: 2, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 } },

    // Lunch/Dinner Meals
    { name: 'Grilled Chicken Breast', emoji: '🍗', category: 'Meal', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 248, protein: 46, carbs: 0, fat: 5, fiber: 0, sugar: 0 } },
    { name: 'Beef Steak', emoji: '🥩', category: 'Meal', servingSize: { value: 200, unit: 'g' }, nutrition: { calories: 450, protein: 50, carbs: 0, fat: 26, fiber: 0, sugar: 0 } },
    { name: 'Salmon Fillet', emoji: '🐟', category: 'Meal', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 280, protein: 34, carbs: 0, fat: 15, fiber: 0, sugar: 0 } },
    { name: 'Caesar Salad', emoji: '🥗', category: 'Meal', servingSize: { value: 250, unit: 'g' }, nutrition: { calories: 350, protein: 12, carbs: 15, fat: 28, fiber: 3, sugar: 3 } },
    { name: 'Pasta Bolognese', emoji: '🍝', category: 'Meal', servingSize: { value: 350, unit: 'g' }, nutrition: { calories: 520, protein: 25, carbs: 62, fat: 18, fiber: 4, sugar: 8 } },
    { name: 'Margherita Pizza (2 slices)', emoji: '🍕', category: 'Meal', servingSize: { value: 200, unit: 'g' }, nutrition: { calories: 450, protein: 18, carbs: 52, fat: 18, fiber: 3, sugar: 6 } },
    { name: 'Burger', emoji: '🍔', category: 'Meal', servingSize: { value: 250, unit: 'g' }, nutrition: { calories: 550, protein: 28, carbs: 42, fat: 30, fiber: 2, sugar: 8 } },
    { name: 'Sushi Roll (6 pcs)', emoji: '🍣', category: 'Meal', servingSize: { value: 180, unit: 'g' }, nutrition: { calories: 280, protein: 12, carbs: 42, fat: 6, fiber: 2, sugar: 5 } },
    { name: 'Tacos (2)', emoji: '🌮', category: 'Meal', servingSize: { value: 200, unit: 'g' }, nutrition: { calories: 380, protein: 18, carbs: 32, fat: 20, fiber: 4, sugar: 3 } },
    { name: 'Fried Rice', emoji: '🍚', category: 'Meal', servingSize: { value: 250, unit: 'g' }, nutrition: { calories: 340, protein: 8, carbs: 52, fat: 12, fiber: 2, sugar: 2 } },
    { name: 'Chicken Soup', emoji: '🍲', category: 'Meal', servingSize: { value: 300, unit: 'ml' }, nutrition: { calories: 180, protein: 15, carbs: 18, fat: 6, fiber: 2, sugar: 3 } },
    { name: 'Grilled Vegetables', emoji: '🥦', category: 'Meal', servingSize: { value: 200, unit: 'g' }, nutrition: { calories: 120, protein: 4, carbs: 18, fat: 5, fiber: 6, sugar: 8 } },

    // Snacks
    { name: 'Almonds (handful)', emoji: '🥜', category: 'Snack', servingSize: { value: 30, unit: 'g' }, nutrition: { calories: 175, protein: 6, carbs: 6, fat: 15, fiber: 3, sugar: 1 } },
    { name: 'Protein Bar', emoji: '🍫', category: 'Snack', servingSize: { value: 60, unit: 'g' }, nutrition: { calories: 220, protein: 20, carbs: 22, fat: 8, fiber: 3, sugar: 6 } },
    { name: 'Dark Chocolate (2 squares)', emoji: '🍫', category: 'Snack', servingSize: { value: 20, unit: 'g' }, nutrition: { calories: 110, protein: 2, carbs: 10, fat: 8, fiber: 2, sugar: 6 } },
    { name: 'Cheese (slice)', emoji: '🧀', category: 'Snack', servingSize: { value: 30, unit: 'g' }, nutrition: { calories: 115, protein: 7, carbs: 0, fat: 9, fiber: 0, sugar: 0 } },
    { name: 'Hummus & Carrots', emoji: '🥕', category: 'Snack', servingSize: { value: 120, unit: 'g' }, nutrition: { calories: 150, protein: 5, carbs: 18, fat: 7, fiber: 4, sugar: 4 } },
    { name: 'Rice Cake', emoji: '🍘', category: 'Snack', servingSize: { value: 9, unit: 'g' }, nutrition: { calories: 35, protein: 1, carbs: 7, fat: 0, fiber: 0, sugar: 0 } },
    { name: 'Cottage Cheese', emoji: '🥛', category: 'Snack', servingSize: { value: 100, unit: 'g' }, nutrition: { calories: 98, protein: 11, carbs: 3, fat: 4, fiber: 0, sugar: 3 } },
    { name: 'Peanut Butter (tbsp)', emoji: '🥜', category: 'Snack', servingSize: { value: 32, unit: 'g' }, nutrition: { calories: 190, protein: 8, carbs: 6, fat: 16, fiber: 2, sugar: 3 } },
    { name: 'Crackers (6)', emoji: '🍪', category: 'Snack', servingSize: { value: 30, unit: 'g' }, nutrition: { calories: 130, protein: 3, carbs: 20, fat: 5, fiber: 1, sugar: 2 } },
    { name: 'Popcorn (small bag)', emoji: '🍿', category: 'Snack', servingSize: { value: 30, unit: 'g' }, nutrition: { calories: 120, protein: 4, carbs: 21, fat: 4, fiber: 4, sugar: 0 } },

    // More Essentials
    { name: 'White Rice (cooked)', emoji: '🍚', category: 'Meal', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 195, protein: 4, carbs: 43, fat: 0, fiber: 1, sugar: 0 } },
    { name: 'Brown Rice (cooked)', emoji: '🍚', category: 'Meal', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 165, protein: 4, carbs: 35, fat: 1, fiber: 2, sugar: 0 } },
    { name: 'Boiled Potato', emoji: '🥔', category: 'Meal', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 130, protein: 3, carbs: 30, fat: 0, fiber: 3, sugar: 1 } },
    { name: 'Sweet Potato', emoji: '🍠', category: 'Meal', servingSize: { value: 150, unit: 'g' }, nutrition: { calories: 135, protein: 2, carbs: 31, fat: 0, fiber: 4, sugar: 6 } },
    { name: 'Milk (1 glass)', emoji: '🥛', category: 'Snack', servingSize: { value: 250, unit: 'ml' }, nutrition: { calories: 150, protein: 8, carbs: 12, fat: 8, fiber: 0, sugar: 12 } },
    { name: 'Smoothie (fruit)', emoji: '🥤', category: 'Snack', servingSize: { value: 350, unit: 'ml' }, nutrition: { calories: 220, protein: 3, carbs: 48, fat: 2, fiber: 4, sugar: 38 } },
];

async function seedProducts() {
    console.log('===========================================');
    console.log('  Seeding 50 Popular Products');
    console.log('===========================================\n');

    let masterConn, devConn;

    try {
        // Connect to both DBs
        console.log('Connecting to databases...');
        masterConn = await mongoose.createConnection(MASTER_URI).asPromise();
        devConn = await mongoose.createConnection(DEV_URI).asPromise();
        console.log('  Connected to both databases\n');

        // Seed Master
        console.log('Seeding Master database...');
        const masterProducts = masterConn.collection('products');
        await masterProducts.deleteMany({});
        const masterResult = await masterProducts.insertMany(popularProducts);
        console.log(`  Inserted ${masterResult.insertedCount} products into Master\n`);

        // Seed Dev
        console.log('Seeding Dev database...');
        const devProducts = devConn.collection('products');
        await devProducts.deleteMany({});
        const devResult = await devProducts.insertMany(popularProducts);
        console.log(`  Inserted ${devResult.insertedCount} products into Dev\n`);

        console.log('===========================================');
        console.log('  Seeding completed successfully!');
        console.log('===========================================');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (masterConn) await masterConn.close();
        if (devConn) await devConn.close();
        console.log('\nConnections closed.');
    }
}

seedProducts();
