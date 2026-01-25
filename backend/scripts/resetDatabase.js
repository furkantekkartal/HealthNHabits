require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/diet-tracker';

async function resetDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;

        // Get all collections
        const collections = await db.listCollections().toArray();

        console.log('\nDropping all collections...');
        for (const collection of collections) {
            await db.dropCollection(collection.name);
            console.log(`  ✓ Dropped: ${collection.name}`);
        }

        console.log('\n✅ Database reset complete!');
        console.log('Run "node scripts/seedProducts.js" to add sample products.');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

resetDatabase();
