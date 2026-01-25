const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');
const Product = require('../models/Product');
const UserProfile = require('../models/UserProfile');

// Get today's log
router.get('/today', async (req, res) => {
    try {
        const log = await DailyLog.getOrCreateToday();
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
        const log = await DailyLog.findOne({ date });
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

        let log;
        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOneAndUpdate(
                { date: targetDate },
                { $setOnInsert: { date: targetDate, entries: [], summary: {} } },
                { upsert: true, new: true }
            );
        } else {
            log = await DailyLog.getOrCreateToday();
        }

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

        let log;
        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOneAndUpdate(
                { date: targetDate },
                { $setOnInsert: { date: targetDate, entries: [], summary: {} } },
                { upsert: true, new: true }
            );
        } else {
            log = await DailyLog.getOrCreateToday();
        }

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

        let log;
        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOne({ date: targetDate });
        } else {
            log = await DailyLog.getOrCreateToday();
        }

        if (!log) {
            return res.status(404).json({ error: 'No log found for this date' });
        }

        // Add negative water entry to decrease
        log.entries.push({
            type: 'water',
            time: new Date(),
            data: { amount: -Math.abs(amount) }
        });

        log.recalculateSummary();
        // Ensure water doesn't go below 0
        if (log.summary.waterIntake < 0) {
            log.summary.waterIntake = 0;
        }
        await log.save();
        res.json(log);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Add/Update steps entry (REPLACES existing steps for the day)
router.post('/steps', async (req, res) => {
    try {
        const { steps, date } = req.body;

        let log;
        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOneAndUpdate(
                { date: targetDate },
                { $setOnInsert: { date: targetDate, entries: [], summary: {} } },
                { upsert: true, new: true }
            );
        } else {
            log = await DailyLog.getOrCreateToday();
        }

        // Calculate calories burned based on user profile
        const profile = await UserProfile.findOne();
        let caloriesBurned = Math.round(steps * 0.04);

        if (profile) {
            const weightKg = profile.weight.unit === 'kg'
                ? profile.weight.value
                : profile.weight.value * 0.453592;
            caloriesBurned = Math.round(steps * 0.04 * (weightKg / 70));
        }

        const strideLength = profile?.strideLength || 70;
        const distance = (steps * strideLength / 100 / 1000).toFixed(2);

        // REMOVE all existing steps entries for this day (UPDATE behavior)
        log.entries = log.entries.filter(e => e.type !== 'steps');

        // Add the new steps entry
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

        let log;
        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOneAndUpdate(
                { date: targetDate },
                { $setOnInsert: { date: targetDate, entries: [], summary: {} } },
                { upsert: true, new: true }
            );
        } else {
            log = await DailyLog.getOrCreateToday();
        }

        // Remove existing weight entries for this day (UPDATE behavior)
        log.entries = log.entries.filter(e => e.type !== 'weight');

        log.entries.push({
            type: 'weight',
            time: new Date(),
            data: { weight, weightUnit: weightUnit || 'kg' }
        });

        log.recalculateSummary();
        await log.save();

        // Also update profile weight
        await UserProfile.findOneAndUpdate({}, {
            'weight.value': weight,
            'weight.unit': weightUnit || 'kg'
        });

        res.json(log);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get weight history (last 7 days)
router.get('/weight/history', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        const logs = await DailyLog.find({
            date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 });

        const history = [];
        for (let i = 0; i < days; i++) {
            const checkDate = new Date(startDate);
            checkDate.setDate(checkDate.getDate() + i);
            checkDate.setHours(0, 0, 0, 0);

            const log = logs.find(l => l.date.toDateString() === checkDate.toDateString());
            const weightEntry = log?.entries?.find(e => e.type === 'weight');

            history.push({
                date: checkDate.toISOString().split('T')[0],
                weight: weightEntry?.data?.weight || log?.summary?.weight || null
            });
        }

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete entry (with date support)
router.delete('/entry/:entryId', async (req, res) => {
    try {
        const { date } = req.query;
        let log;

        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOne({ date: targetDate });
        } else {
            log = await DailyLog.getOrCreateToday();
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
        let log;

        if (date) {
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            log = await DailyLog.findOne({ date: targetDate });
        } else {
            log = await DailyLog.getOrCreateToday();
        }

        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }

        const entry = log.entries.id(req.params.entryId);
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        // Update entry data
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
