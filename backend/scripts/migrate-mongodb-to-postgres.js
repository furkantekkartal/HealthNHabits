/**
 * Migration Script: MongoDB Atlas → PostgreSQL
 * 
 * This script migrates all data from the MongoDB Atlas database to the local PostgreSQL database.
 * It handles Users, UserProfiles, Products, and DailyLogs with their entries.
 * 
 * IMPORTANT: User passwords are already hashed in MongoDB, so we need to transfer them as-is
 * without re-hashing.
 * 
 * Usage: node scripts/migrate-mongodb-to-postgres.js [master|dev]
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection strings
const MONGO_URIS = {
    master: 'mongodb+srv://furkantekkartal2_db_user:hEFMMGC2WdFz5aY8@furkantekkartal2.eckh1ik.mongodb.net/diet-tracker-master?appName=furkantekkartal2',
    dev: 'mongodb+srv://furkantekkartal2_db_user:hEFMMGC2WdFz5aY8@furkantekkartal2.eckh1ik.mongodb.net/diet-tracker-dev?appName=furkantekkartal2'
};

// MongoDB Schemas (minimal, just for reading)
const mongoUserSchema = new mongoose.Schema({
    username: String,
    password: String,
    profilePictureUrl: String,
    createdAt: Date
}, { collection: 'users' });

const mongoUserProfileSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    profileImage: String,
    gender: String,
    birthYear: Number,
    height: { value: Number, unit: String },
    weight: { value: Number, unit: String },
    activityLevel: String,
    strideLength: Number,
    dailyCalorieGoal: Number,
    dailyWaterGoal: Number,
    dailyStepsGoal: Number,
    dailyProteinGoal: Number,
    dailyCarbsGoal: Number,
    dailyFatGoal: Number,
    dailyFiberGoal: Number
}, { collection: 'userprofiles' });

const mongoProductSchema = new mongoose.Schema({
    name: String,
    emoji: String,
    category: String,
    imageUrl: String,
    servingSize: { value: Number, unit: String },
    variants: [{ name: String, multiplier: Number }],
    nutrition: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        sugar: Number
    },
    usageCount: Number,
    sortOrder: Number
}, { collection: 'products' });

const mongoDailyLogSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    date: Date,
    entries: [{
        type: String,
        time: Date,
        data: mongoose.Schema.Types.Mixed,
        aiInsight: String
    }],
    summary: {
        caloriesEaten: Number,
        caloriesBurned: Number,
        waterIntake: Number,
        steps: Number,
        weight: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number
    }
}, { collection: 'dailylogs' });

async function migrate(source = 'master') {
    console.log(`\n🚀 Starting migration from MongoDB (${source}) to PostgreSQL...\n`);

    // Connect to MongoDB
    const mongoUri = MONGO_URIS[source];
    if (!mongoUri) {
        console.error(`❌ Unknown source: ${source}. Use 'master' or 'dev'.`);
        process.exit(1);
    }

    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas\n');

    // Create MongoDB models
    const MongoUser = mongoose.model('User', mongoUserSchema);
    const MongoUserProfile = mongoose.model('UserProfile', mongoUserProfileSchema);
    const MongoProduct = mongoose.model('Product', mongoProductSchema);
    const MongoDailyLog = mongoose.model('DailyLog', mongoDailyLogSchema);

    // Import PostgreSQL models
    const {
        sequelize,
        User,
        UserProfile,
        Product,
        ProductVariant,
        DailyLog,
        DailyLogEntry,
        syncDatabase
    } = require('../models');

    console.log('📡 Connecting to PostgreSQL...');
    await syncDatabase({ force: false }); // Don't drop tables
    console.log('');

    // Create ID mapping for users (MongoDB ObjectId -> PostgreSQL id)
    const userIdMap = new Map();
    const productIdMap = new Map();

    // ==================== MIGRATE USERS ====================
    console.log('👤 Migrating Users...');
    const mongoUsers = await MongoUser.find({});
    console.log(`   Found ${mongoUsers.length} users in MongoDB`);

    for (const mongoUser of mongoUsers) {
        try {
            // Check if user already exists
            let pgUser = await User.findOne({ where: { username: mongoUser.username } });

            if (!pgUser) {
                // Create user WITHOUT triggering password hash hook
                // We need to insert the pre-hashed password directly
                pgUser = await User.create({
                    username: mongoUser.username,
                    password: 'temporary', // Will be updated below
                    profilePicturePath: mongoUser.profilePictureUrl || null
                });

                // Update password directly to preserve the hash
                await sequelize.query(
                    `UPDATE users SET password = :password WHERE id = :id`,
                    {
                        replacements: {
                            password: mongoUser.password,
                            id: pgUser.id
                        }
                    }
                );
                console.log(`   ✅ Created user: ${mongoUser.username}`);
            } else {
                console.log(`   ⏭️  User already exists: ${mongoUser.username}`);
            }

            userIdMap.set(mongoUser._id.toString(), pgUser.id);
        } catch (error) {
            console.error(`   ❌ Failed to migrate user ${mongoUser.username}:`, error.message);
        }
    }

    // ==================== MIGRATE USER PROFILES ====================
    console.log('\n📋 Migrating User Profiles...');
    const mongoProfiles = await MongoUserProfile.find({});
    console.log(`   Found ${mongoProfiles.length} profiles in MongoDB`);

    for (const mongoProfile of mongoProfiles) {
        try {
            const pgUserId = userIdMap.get(mongoProfile.userId?.toString());
            if (!pgUserId) {
                console.log(`   ⚠️  No matching user for profile, skipping...`);
                continue;
            }

            // Check if profile already exists
            let pgProfile = await UserProfile.findOne({ where: { userId: pgUserId } });

            const profileData = {
                userId: pgUserId,
                name: mongoProfile.name || 'User',
                profileImagePath: mongoProfile.profileImage || null,
                gender: mongoProfile.gender || 'male',
                birthYear: mongoProfile.birthYear || 1990,
                heightValue: mongoProfile.height?.value || 170,
                heightUnit: mongoProfile.height?.unit || 'cm',
                weightValue: mongoProfile.weight?.value || 70,
                weightUnit: mongoProfile.weight?.unit || 'kg',
                activityLevel: mongoProfile.activityLevel || 'lightly_active',
                strideLength: mongoProfile.strideLength || null,
                dailyCalorieGoal: mongoProfile.dailyCalorieGoal || 2000,
                dailyWaterGoal: mongoProfile.dailyWaterGoal || 2000,
                dailyStepsGoal: mongoProfile.dailyStepsGoal || 10000,
                dailyProteinGoal: mongoProfile.dailyProteinGoal || 50,
                dailyCarbsGoal: mongoProfile.dailyCarbsGoal || 250,
                dailyFatGoal: mongoProfile.dailyFatGoal || 65,
                dailyFiberGoal: mongoProfile.dailyFiberGoal || 25
            };

            if (!pgProfile) {
                await UserProfile.create(profileData);
                console.log(`   ✅ Created profile for user ID: ${pgUserId}`);
            } else {
                await pgProfile.update(profileData);
                console.log(`   ⏭️  Updated existing profile for user ID: ${pgUserId}`);
            }
        } catch (error) {
            console.error(`   ❌ Failed to migrate profile:`, error.message);
        }
    }

    // ==================== MIGRATE PRODUCTS ====================
    console.log('\n🍎 Migrating Products...');
    const mongoProducts = await MongoProduct.find({});
    console.log(`   Found ${mongoProducts.length} products in MongoDB`);

    for (const mongoProd of mongoProducts) {
        try {
            // Check if product already exists by name
            let pgProduct = await Product.findOne({ where: { name: mongoProd.name } });

            const productData = {
                name: mongoProd.name,
                emoji: mongoProd.emoji || '🍽️',
                category: mongoProd.category || 'Custom',
                imagePath: mongoProd.imageUrl || null,
                servingSizeValue: mongoProd.servingSize?.value || 100,
                servingSizeUnit: mongoProd.servingSize?.unit || 'g',
                calories: mongoProd.nutrition?.calories || 0,
                protein: mongoProd.nutrition?.protein || 0,
                carbs: mongoProd.nutrition?.carbs || 0,
                fat: mongoProd.nutrition?.fat || 0,
                fiber: mongoProd.nutrition?.fiber || 0,
                sugar: mongoProd.nutrition?.sugar || 0,
                usageCount: mongoProd.usageCount || 0,
                sortOrder: mongoProd.sortOrder || 0
            };

            if (!pgProduct) {
                pgProduct = await Product.create(productData);
                console.log(`   ✅ Created product: ${mongoProd.name}`);
            } else {
                await pgProduct.update(productData);
                console.log(`   ⏭️  Updated existing product: ${mongoProd.name}`);
            }

            productIdMap.set(mongoProd._id.toString(), pgProduct.id);

            // Migrate variants
            if (mongoProd.variants && mongoProd.variants.length > 0) {
                // Remove existing variants
                await ProductVariant.destroy({ where: { productId: pgProduct.id } });

                for (const variant of mongoProd.variants) {
                    await ProductVariant.create({
                        productId: pgProduct.id,
                        name: variant.name,
                        multiplier: variant.multiplier || 1
                    });
                }
            }
        } catch (error) {
            console.error(`   ❌ Failed to migrate product ${mongoProd.name}:`, error.message);
        }
    }

    // ==================== MIGRATE DAILY LOGS ====================
    console.log('\n📅 Migrating Daily Logs...');
    const mongoLogs = await MongoDailyLog.find({});
    console.log(`   Found ${mongoLogs.length} daily logs in MongoDB`);

    for (const mongoLog of mongoLogs) {
        try {
            const pgUserId = userIdMap.get(mongoLog.userId?.toString());
            if (!pgUserId) {
                console.log(`   ⚠️  No matching user for log, skipping...`);
                continue;
            }

            const dateStr = mongoLog.date.toISOString().split('T')[0];

            // Check if log already exists
            let pgLog = await DailyLog.findOne({
                where: { userId: pgUserId, date: dateStr }
            });

            const logData = {
                userId: pgUserId,
                date: dateStr,
                caloriesEaten: mongoLog.summary?.caloriesEaten || 0,
                caloriesBurned: mongoLog.summary?.caloriesBurned || 0,
                waterIntake: mongoLog.summary?.waterIntake || 0,
                steps: mongoLog.summary?.steps || 0,
                weight: mongoLog.summary?.weight || null,
                protein: mongoLog.summary?.protein || 0,
                carbs: mongoLog.summary?.carbs || 0,
                fat: mongoLog.summary?.fat || 0,
                fiber: mongoLog.summary?.fiber || 0
            };

            if (!pgLog) {
                pgLog = await DailyLog.create(logData);
                console.log(`   ✅ Created log for user ${pgUserId}, date: ${dateStr}`);
            } else {
                await pgLog.update(logData);
                console.log(`   ⏭️  Updated existing log for user ${pgUserId}, date: ${dateStr}`);
            }

            // Migrate entries
            if (mongoLog.entries && mongoLog.entries.length > 0) {
                // Remove existing entries
                await DailyLogEntry.destroy({ where: { dailyLogId: pgLog.id } });

                for (const entry of mongoLog.entries) {
                    const entryData = {
                        dailyLogId: pgLog.id,
                        entryType: entry.type,
                        time: entry.time || new Date(),
                        aiInsight: entry.aiInsight || null
                    };

                    // Add type-specific fields from entry.data
                    if (entry.data) {
                        const data = entry.data;
                        if (data.productId) {
                            entryData.productId = productIdMap.get(data.productId?.toString()) || null;
                        }
                        entryData.name = data.name;
                        entryData.calories = data.calories;
                        entryData.protein = data.protein;
                        entryData.carbs = data.carbs;
                        entryData.fat = data.fat;
                        entryData.fiber = data.fiber;
                        entryData.portion = data.portion;
                        entryData.unit = data.unit;
                        entryData.mealType = data.mealType;
                        entryData.amount = data.amount;
                        entryData.steps = data.steps;
                        entryData.distance = data.distance;
                        entryData.weight = data.weight;
                        entryData.weightUnit = data.weightUnit;
                        entryData.activityType = data.activityType;
                        entryData.duration = data.duration;
                        entryData.caloriesBurned = data.caloriesBurned;
                    }

                    await DailyLogEntry.create(entryData);
                }
                console.log(`      ➡️  Migrated ${mongoLog.entries.length} entries`);
            }
        } catch (error) {
            console.error(`   ❌ Failed to migrate log:`, error.message);
        }
    }

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(50));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`   Users migrated: ${userIdMap.size}`);
    console.log(`   Products migrated: ${productIdMap.size}`);
    console.log(`   Daily logs processed: ${mongoLogs.length}`);
    console.log('='.repeat(50));

    // Close connections
    await mongoose.disconnect();
    await sequelize.close();

    console.log('\n✅ Migration completed successfully!\n');
}

// Get source from command line argument
const source = process.argv[2] || 'master';
migrate(source).catch(error => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});
