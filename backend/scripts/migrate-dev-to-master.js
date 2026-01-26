/**
 * Migrate ALL data from Dev to Master database
 * Copies: users, userprofiles, products, dailylogs
 * IMPORTANT: Passwords are copied as-is (already hashed) - NO double hashing!
 * 
 * Usage: node migrate-dev-to-master.js
 */

const mongoose = require('mongoose');

// Connection URIs
const DEV_URI = 'mongodb+srv://furkantekkartal2_db_user:hEFMMGC2WdFz5aY8@furkantekkartal2.eckh1ik.mongodb.net/diet-tracker-dev?appName=furkantekkartal2';
const MASTER_URI = 'mongodb+srv://furkantekkartal2_db_user:hEFMMGC2WdFz5aY8@furkantekkartal2.eckh1ik.mongodb.net/diet-tracker-master?appName=furkantekkartal2';

const COLLECTIONS_TO_MIGRATE = ['users', 'userprofiles', 'products', 'dailylogs'];

async function migrateCollection(devConn, masterConn, collectionName) {
    console.log(`\nMigrating ${collectionName}...`);

    const devCollection = devConn.collection(collectionName);
    const masterCollection = masterConn.collection(collectionName);

    // Get all documents from dev
    const documents = await devCollection.find({}).toArray();
    console.log(`  Found ${documents.length} documents in Dev`);

    if (documents.length === 0) {
        console.log(`  Nothing to migrate`);
        return 0;
    }

    // Clear master collection first
    const deleteResult = await masterCollection.deleteMany({});
    console.log(`  Cleared ${deleteResult.deletedCount} existing documents from Master`);

    // Copy documents directly - NO modifications (passwords stay as-is)
    // This preserves the already-hashed passwords
    const insertResult = await masterCollection.insertMany(documents);
    console.log(`  Inserted ${insertResult.insertedCount} documents into Master`);

    return insertResult.insertedCount;
}

async function migrate() {
    console.log('===========================================');
    console.log('  Migrate ALL Data: Dev -> Master');
    console.log('===========================================');
    console.log('\nWARNING: This will REPLACE all data in Master with Dev data!');
    console.log('Passwords will be copied as-is (no re-hashing).\n');

    let devConn, masterConn;
    let totalMigrated = 0;

    try {
        // Connect to both DBs
        console.log('Connecting to databases...');
        devConn = await mongoose.createConnection(DEV_URI).asPromise();
        masterConn = await mongoose.createConnection(MASTER_URI).asPromise();
        console.log('  Connected to both databases');

        // Migrate each collection
        for (const collection of COLLECTIONS_TO_MIGRATE) {
            const count = await migrateCollection(devConn, masterConn, collection);
            totalMigrated += count;
        }

        console.log('\n===========================================');
        console.log(`  Migration Complete! ${totalMigrated} total documents`);
        console.log('===========================================');

    } catch (error) {
        console.error('\nError:', error.message);
    } finally {
        if (devConn) await devConn.close();
        if (masterConn) await masterConn.close();
        console.log('\nConnections closed.');
    }
}

migrate();
