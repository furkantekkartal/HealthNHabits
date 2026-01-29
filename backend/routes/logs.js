const express = require('express');
const router = express.Router();
const { DailyLog, DailyLogEntry, Product, UserProfile } = require('../models');
const auth = require('../middleware/auth');

// All log routes require authentication
router.use(auth);

// Helper to get log with entries
const getLogWithEntries = async (log) => {
    if (!log) return null;

    const entries = await DailyLogEntry.findAll({
        where: { dailyLogId: log.id },
        order: [['time', 'DESC']]
    });

    return log.toAPIFormat(entries);
};

// Get today's log
router.get('/today', async (req, res) => {
    try {
        const log = await DailyLog.getOrCreateToday(req.user.userId);
        const result = await getLogWithEntries(log);
        res.json(result);
    } catch (error) {
        console.error('Get today log error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get log for specific date
router.get('/date/:date', async (req, res) => {
    try {
        // Date comes as YYYY-MM-DD string from frontend, use directly
        const dateString = req.params.date;

        const log = await DailyLog.findOne({
            where: {
                userId: req.user.userId,
                date: dateString
            }
        });

        if (!log) {
            return res.json({
                date: dateString,
                entries: [],
                summary: {
                    caloriesEaten: 0,
                    caloriesBurned: 0,
                    waterIntake: 0,
                    steps: 0,
                    weight: null,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    fiber: 0
                }
            });
        }

        const result = await getLogWithEntries(log);
        res.json(result);
    } catch (error) {
        console.error('Get date log error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add food entry
router.post('/food', async (req, res) => {
    try {
        const { productId, name, calories, protein, carbs, fat, fiber, portion, unit, mealType, date } = req.body;
        const userId = req.user.userId;

        const log = date
            ? await DailyLog.getOrCreateForDate(userId, date)
            : await DailyLog.getOrCreateToday(userId);

        await DailyLogEntry.create({
            dailyLogId: log.id,
            entryType: 'food',
            time: new Date(),
            productId: productId || null,
            name,
            calories,
            protein,
            carbs,
            fat,
            fiber: fiber || 0,
            portion,
            unit,
            mealType: mealType || 'other'
        });

        await log.recalculateSummary();
        await log.save();

        // Increment product usage if productId provided
        if (productId) {
            await Product.increment('usageCount', { where: { id: productId } });
        }

        const result = await getLogWithEntries(log);
        res.json(result);
    } catch (error) {
        console.error('Add food error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Add water entry
router.post('/water', async (req, res) => {
    try {
        const { amount, date } = req.body;
        const userId = req.user.userId;

        const log = date
            ? await DailyLog.getOrCreateForDate(userId, date)
            : await DailyLog.getOrCreateToday(userId);

        await DailyLogEntry.create({
            dailyLogId: log.id,
            entryType: 'water',
            time: new Date(),
            amount
        });

        await log.recalculateSummary();
        await log.save();

        const result = await getLogWithEntries(log);
        res.json(result);
    } catch (error) {
        console.error('Add water error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Remove water (decrease)
router.post('/water/remove', async (req, res) => {
    try {
        const { amount, date } = req.body;
        const userId = req.user.userId;

        let log;
        if (date) {
            // Date comes as YYYY-MM-DD string from frontend, use directly
            log = await DailyLog.findOne({ where: { userId, date } });
        } else {
            log = await DailyLog.getOrCreateToday(userId);
        }

        if (!log) {
            return res.status(404).json({ error: 'No log found for this date' });
        }

        await DailyLogEntry.create({
            dailyLogId: log.id,
            entryType: 'water',
            time: new Date(),
            amount: -Math.abs(amount)
        });

        await log.recalculateSummary();
        await log.save();

        const result = await getLogWithEntries(log);
        res.json(result);
    } catch (error) {
        console.error('Remove water error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Add/Update steps entry
router.post('/steps', async (req, res) => {
    try {
        const { steps, date } = req.body;
        const userId = req.user.userId;

        const log = date
            ? await DailyLog.getOrCreateForDate(userId, date)
            : await DailyLog.getOrCreateToday(userId);

        // Calculate calories burned based on user profile
        const profile = await UserProfile.findOne({ where: { userId } });
        let caloriesBurned = Math.round(steps * 0.04);

        if (profile?.weightValue) {
            const weightKg = profile.weightUnit === 'kg'
                ? parseFloat(profile.weightValue)
                : parseFloat(profile.weightValue) * 0.453592;
            caloriesBurned = Math.round(steps * 0.04 * (weightKg / 70));
        }

        const strideLength = profile?.strideLength || 70;
        const distance = (steps * strideLength / 100 / 1000).toFixed(2);

        // Remove existing steps entries
        await DailyLogEntry.destroy({
            where: {
                dailyLogId: log.id,
                entryType: 'steps'
            }
        });

        await DailyLogEntry.create({
            dailyLogId: log.id,
            entryType: 'steps',
            time: new Date(),
            steps,
            distance: parseFloat(distance),
            caloriesBurned
        });

        await log.recalculateSummary();
        await log.save();

        const result = await getLogWithEntries(log);
        res.json(result);
    } catch (error) {
        console.error('Add steps error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Add/Update weight entry
router.post('/weight', async (req, res) => {
    try {
        const { weight, weightUnit, date } = req.body;
        const userId = req.user.userId;

        const log = date
            ? await DailyLog.getOrCreateForDate(userId, date)
            : await DailyLog.getOrCreateToday(userId);

        // Remove existing weight entries
        await DailyLogEntry.destroy({
            where: {
                dailyLogId: log.id,
                entryType: 'weight'
            }
        });

        await DailyLogEntry.create({
            dailyLogId: log.id,
            entryType: 'weight',
            time: new Date(),
            weight,
            weightUnit: weightUnit || 'kg'
        });

        await log.recalculateSummary();
        await log.save();

        // Also update user's profile weight
        await UserProfile.update(
            {
                weightValue: weight,
                weightUnit: weightUnit || 'kg'
            },
            { where: { userId } }
        );

        const result = await getLogWithEntries(log);
        res.json(result);
    } catch (error) {
        console.error('Add weight error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get weight history
router.get('/weight/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.days) || 7;
        const userId = req.user.userId;

        const entries = await DailyLogEntry.findAll({
            where: { entryType: 'weight' },
            include: [{
                model: DailyLog,
                as: 'dailyLog',
                where: { userId },
                attributes: ['date']
            }],
            order: [[{ model: DailyLog, as: 'dailyLog' }, 'date', 'DESC']],
            limit
        });

        const history = entries.map(entry => ({
            date: entry.dailyLog.date,
            weight: parseFloat(entry.weight)
        }));

        res.json(history.reverse());
    } catch (error) {
        console.error('Get weight history error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete entry
router.delete('/entry/:entryId', async (req, res) => {
    try {
        const { date } = req.query;
        const userId = req.user.userId;

        let log;
        if (date) {
            // Date comes as YYYY-MM-DD string from frontend, use directly
            log = await DailyLog.findOne({ where: { userId, date } });
        } else {
            log = await DailyLog.getOrCreateToday(userId);
        }

        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }

        const entry = await DailyLogEntry.findOne({
            where: {
                id: req.params.entryId,
                dailyLogId: log.id
            }
        });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        await entry.destroy();
        await log.recalculateSummary();
        await log.save();

        const result = await getLogWithEntries(log);
        res.json(result);
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update entry
router.put('/entry/:entryId', async (req, res) => {
    try {
        const { date, data } = req.body;
        const userId = req.user.userId;

        let log;
        if (date) {
            // Date comes as YYYY-MM-DD string from frontend, use directly
            log = await DailyLog.findOne({ where: { userId, date } });
        } else {
            log = await DailyLog.getOrCreateToday(userId);
        }

        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }

        const entry = await DailyLogEntry.findOne({
            where: {
                id: req.params.entryId,
                dailyLogId: log.id
            }
        });

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Update entry with new data
        const updateData = { time: new Date() };

        // Map data object fields to entry fields
        if (data.name !== undefined) updateData.name = data.name;
        if (data.calories !== undefined) updateData.calories = data.calories;
        if (data.protein !== undefined) updateData.protein = data.protein;
        if (data.carbs !== undefined) updateData.carbs = data.carbs;
        if (data.fat !== undefined) updateData.fat = data.fat;
        if (data.fiber !== undefined) updateData.fiber = data.fiber;
        if (data.portion !== undefined) updateData.portion = data.portion;
        if (data.unit !== undefined) updateData.unit = data.unit;
        if (data.amount !== undefined) updateData.amount = data.amount;
        if (data.steps !== undefined) updateData.steps = data.steps;
        if (data.weight !== undefined) updateData.weight = data.weight;
        if (data.mealType !== undefined) updateData.mealType = data.mealType;

        await entry.update(updateData);

        await log.recalculateSummary();
        await log.save();

        const result = await getLogWithEntries(log);
        res.json(result);
    } catch (error) {
        console.error('Update entry error:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
