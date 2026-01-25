const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');

// Get profile (or create default if none exists)
router.get('/', async (req, res) => {
    try {
        let profile = await UserProfile.findOne();
        if (!profile) {
            profile = await UserProfile.create({});
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update profile
router.put('/', async (req, res) => {
    try {
        let profile = await UserProfile.findOne();
        if (!profile) {
            profile = new UserProfile(req.body);
        } else {
            Object.assign(profile, req.body);
        }
        await profile.save();

        // Calculate recommended calorie goal based on profile
        const tdee = profile.calculateTDEE();
        profile.dailyCalorieGoal = tdee;
        await profile.save();

        res.json(profile);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get calculated values
router.get('/calculations', async (req, res) => {
    try {
        const profile = await UserProfile.findOne();
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        res.json({
            bmr: profile.calculateBMR(),
            tdee: profile.calculateTDEE(),
            ...profile.toObject()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
