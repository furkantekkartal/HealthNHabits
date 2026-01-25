const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const auth = require('../middleware/auth');

// All profile routes require authentication
router.use(auth);

// Get profile (or create default if none exists for this user)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        let profile = await UserProfile.findOne({ userId });
        if (!profile) {
            profile = await UserProfile.create({ userId });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update profile
router.put('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        let profile = await UserProfile.findOne({ userId });

        // Sanitize incoming data - remove null/undefined fields that shouldn't overwrite
        const sanitizedData = { ...req.body };

        // If birthYear is null, don't include it (keep existing or default)
        if (sanitizedData.birthYear === null || sanitizedData.birthYear === undefined) {
            delete sanitizedData.birthYear;
        }

        // Ensure height and weight have proper values
        if (sanitizedData.height) {
            sanitizedData.height = {
                value: sanitizedData.height.value || 170,
                unit: sanitizedData.height.unit || 'cm'
            };
        }
        if (sanitizedData.weight) {
            sanitizedData.weight = {
                value: sanitizedData.weight.value || 70,
                unit: sanitizedData.weight.unit || 'kg'
            };
        }

        console.log('Sanitized data:', JSON.stringify(sanitizedData, null, 2));

        if (!profile) {
            profile = new UserProfile({ userId, ...sanitizedData });
            console.log('Creating new profile');
        } else {
            Object.assign(profile, sanitizedData);
            console.log('Updating existing profile');
        }
        await profile.save();
        console.log('Profile saved successfully, _id:', profile._id);

        // Calculate recommended calorie goal based on profile
        const tdee = profile.calculateTDEE();
        profile.dailyCalorieGoal = tdee;
        await profile.save();

        res.json(profile);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get calculated values
router.get('/calculations', async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await UserProfile.findOne({ userId });
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
