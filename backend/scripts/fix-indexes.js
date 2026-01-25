/**
 * Script to fix the DailyLog indexes
 * Run with: node scripts/fix-indexes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/diet-tracker';

async function fixIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('dailylogs');

        // List current indexes
        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(idx => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        // Drop the problematic date_1 index if it exists
        console.log('\n🔧 Dropping date_1 index if it exists...');
        try {
            await collection.dropIndex('date_1');
            console.log('✅ Dropped date_1 index');
        } catch (e) {
            if (e.code === 27) {
                console.log('ℹ️  date_1 index does not exist (already removed)');
            } else {
                throw e;
            }
        }

        // Ensure the correct compound index exists
        console.log('\n🔧 Ensuring correct compound index (userId + date)...');
        await collection.createIndex(
            { userId: 1, date: 1 },
            { unique: true, name: 'userId_1_date_1' }
        );
        console.log('✅ Compound index created/verified');

        // List indexes after fix
        console.log('\n📋 Indexes after fix:');
        const newIndexes = await collection.indexes();
        newIndexes.forEach(idx => {
            console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        console.log('\n🎉 Index fix complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixIndexes();
