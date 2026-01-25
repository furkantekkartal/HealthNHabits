/**
 * Clone Products (Catalog) from Master to Dev database
 * Usage: node clone-products.js
 */

const mongoose = require('mongoose');

// Connection URIs
const MASTER_URI = 'mongodb+srv://furkantekkartal2_db_user:hEFMMGC2WdFz5aY8@furkantekkartal2.eckh1ik.mongodb.net/diet-tracker-master?appName=furkantekkartal2';
const DEV_URI = 'mongodb+srv://furkantekkartal2_db_user:hEFMMGC2WdFz5aY8@furkantekkartal2.eckh1ik.mongodb.net/diet-tracker-dev?appName=furkantekkartal2';

async function cloneProducts() {
    console.log('===========================================');
    console.log('  Clone Products from Master to Dev');
    console.log('===========================================\n');

    let masterConn, devConn;

    try {
        // Connect to Master DB
        console.log('Connecting to Master database...');
        masterConn = await mongoose.createConnection(MASTER_URI).asPromise();
        console.log('  Connected to Master\n');

        // Connect to Dev DB
        console.log('Connecting to Dev database...');
        devConn = await mongoose.createConnection(DEV_URI).asPromise();
        console.log('  Connected to Dev\n');

        // Get products from Master
        console.log('Fetching products from Master...');
        const masterProducts = masterConn.collection('products');
        const products = await masterProducts.find({}).toArray();
        console.log(`  Found ${products.length} products in Master\n`);

        if (products.length === 0) {
            console.log('No products to clone.');
            return;
        }

        // Clear Dev products
        console.log('Clearing existing products in Dev...');
        const devProducts = devConn.collection('products');
        const deleteResult = await devProducts.deleteMany({});
        console.log(`  Deleted ${deleteResult.deletedCount} products from Dev\n`);

        // Remove _id to allow new insertions
        const productsToInsert = products.map(p => {
            const { _id, ...rest } = p;
            return rest;
        });

        // Insert into Dev
        console.log('Cloning products to Dev...');
        const insertResult = await devProducts.insertMany(productsToInsert);
        console.log(`  Inserted ${insertResult.insertedCount} products into Dev\n`);

        console.log('===========================================');
        console.log('  Clone completed successfully!');
        console.log('===========================================');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        if (masterConn) await masterConn.close();
        if (devConn) await devConn.close();
        console.log('\nConnections closed.');
    }
}

cloneProducts();
