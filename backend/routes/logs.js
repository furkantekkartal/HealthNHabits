const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');
const Product = require('../models/Product');
const UserProfile = require('../models/UserProfile');
const auth = require('../middleware/auth');

// All log routes require authentication
router.use(auth);

// Helper to get or create log for a date
const getOrCreateLog = async (userId, date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let log = await DailyLog.findOne({ userId, date: targetDate });
    if (!log) {
        log = await DailyLog.create({ userId, date: targetDate, entries: [] });
    }
    return log;
};

// Get today's log
router.get('/today', async (req, res) => {
    try {
        const log = await DailyLog.getOrCreateToday(req.user.userId);
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get log for specific date
router.get('/date/:date', async (req, res) => {
    try {
        const date = new Date(req.params.date);
        date.setHours(0, 0, 0, 0);
        const log = await DailyLog.findOne({ userId: req.user.userId, date });
        if (!log) {
            return res.json({ date, entries: [], summary: {} });
        }
        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add food entry
router.post('/food', async (req, res) => {
    try {
        const { productId, name, calories, protein, carbs, fat, fiber, portion, unit, mealType, date } = req.body;
        const userId = req.user.userId;

        const log = date
            ? await getOrCreateLog(userId, date)
            : await DailyLog.getOrCreateToday(userId);

        log.entries.push({
            type: 'food',
            time: new Date(),
            data: { productId, name, calories, protein, carbs, fat, fiber: fiber || 0, portion, unit, mealType: mealType || 'other' }
        });

        log.recalculateSummary();
        await log.save();

        // Increment product usage if productId provided
        if (productId) {
            await Product.findByIdAndUpdate(productId, { $inc: { usageCount: 1 } });
        }

        res.json(log);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add water entry
router.post('/water', async (req, res) => {
    try {
        const { amount, date } = req.body;
        const userId = req.user.userId;

        const log = date
            ? await getOrCreateLog(userId, date)
            : await DailyLog.getOrCreateToday(userId);

        log.entries.push({
            type: 'water',
            time: new Date(),
            data: { amount }
        });

        log.recalculateSummary();
        await log.save();
        res.json(log);
    } catch (error) {
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
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOne({ userId, date: targetDate });
        } else {
            log = await DailyLog.getOrCreateToday(userId);
        }

        if (!log) {
            return res.status(404).json({ error: 'No log found for this date' });
        }

        log.entries.push({
            type: 'water',
            time: new Date(),
            data: { amount: -Math.abs(amount) }
        });

        log.recalculateSummary();
        if (log.summary.waterIntake < 0) {
            log.summary.waterIntake = 0;
        }
        await log.save();
        res.json(log);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add/Update steps entry
router.post('/steps', async (req, res) => {
    try {
        const { steps, date } = req.body;
        const userId = req.user.userId;

        const log = date
            ? await getOrCreateLog(userId, date)
            : await DailyLog.getOrCreateToday(userId);

        // Calculate calories burned based on user profile
        const profile = await UserProfile.findOne({ userId });
        let caloriesBurned = Math.round(steps * 0.04);

        if (profile) {
            const weightKg = profile.weight.unit === 'kg'
                ? profile.weight.value
                : profile.weight.value * 0.453592;
            caloriesBurned = Math.round(steps * 0.04 * (weightKg / 70));
        }

        const strideLength = profile?.strideLength || 70;
        const distance = (steps * strideLength / 100 / 1000).toFixed(2);

        // Remove existing steps entries
        log.entries = log.entries.filter(e => e.type !== 'steps');

        log.entries.push({
            type: 'steps',
            time: new Date(),
            data: { steps, distance: parseFloat(distance), caloriesBurned }
        });

        log.recalculateSummary();
        await log.save();
        res.json(log);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add/Update weight entry
router.post('/weight', async (req, res) => {
    try {
        const { weight, weightUnit, date } = req.body;
        const userId = req.user.userId;

        const log = date
            ? await getOrCreateLog(userId, date)
            : await DailyLog.getOrCreateToday(userId);

        // Remove existing weight entries
        log.entries = log.entries.filter(e => e.type !== 'weight');

        log.entries.push({
            type: 'weight',
            time: new Date(),
            data: { weight, weightUnit: weightUnit || 'kg' }
        });

        log.recalculateSummary();
        await log.save();

        // Also update user's profile weight
        await UserProfile.findOneAndUpdate({ userId }, {
            'weight.value': weight,
            'weight.unit': weightUnit || 'kg'
        });

        res.json(log);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get weight history
router.get('/weight/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.days) || 7;
        const userId = req.user.userId;

        const logs = await DailyLog.find({
            userId,
            'entries.type': 'weight'
        }).sort({ date: -1 });

        const history = [];
        for (const log of logs) {
            const weightEntry = log.entries.find(e => e.type === 'weight');
            if (weightEntry && weightEntry.data?.weight) {
                history.push({
                    date: log.date.toISOString().split('T')[0],
                    weight: weightEntry.data.weight
                });
            }
            if (history.length >= limit) break;
        }

        res.json(history.reverse());
    } catch (error) {
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
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOne({ userId, date: targetDate });
        } else {
            log = await DailyLog.getOrCreateToday(userId);
        }

        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }

        log.entries = log.entries.filter(e => e._id.toString() !== req.params.entryId);
        log.recalculateSummary();
        await log.save();
        res.json(log);
    } catch (error) {
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
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOne({ userId, date: targetDate });
        } else {
            log = await DailyLog.getOrCreateToday(userId);
        }

        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }

        const entry = log.entries.id(req.params.entryId);
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        Object.assign(entry.data, data);
        entry.time = new Date();

        log.recalculateSummary();
        await log.save();
        res.json(log);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
