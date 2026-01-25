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

// Get weight history (last N user-entered measurements, not days)
router.get('/weight/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.days) || 7; // Reusing 'days' param but now means count of entries

        // Find all logs with weight entries, sorted by date descending
        const logs = await DailyLog.find({
            'entries.type': 'weight'
        }).sort({ date: -1 });

        // Extract weight entries from logs (only user-entered ones via entries array)
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

        // Reverse to show oldest first (for graph display)
        res.json(history.reverse());
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
