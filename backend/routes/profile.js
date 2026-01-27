const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { UserProfile } = require('../models');
const auth = require('../middleware/auth');
const { uploadProfilePicture, getFileUrl, profilePicturesDir } = require('../config/fileStorage');

// All profile routes require authentication
router.use(auth);

// Get profile (or create default if none exists for this user)
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        let profile = await UserProfile.findOne({ where: { userId } });

        if (!profile) {
            profile = await UserProfile.create({ userId });
        }

        // Return in API format for frontend compatibility
        const apiProfile = profile.toAPIFormat();
        apiProfile.profileImage = getFileUrl(req, profile.profileImagePath);

        res.json(apiProfile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update profile
router.put('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        let profile = await UserProfile.findOne({ where: { userId } });

        // Sanitize and flatten incoming data
        const updateData = {};

        // Handle direct fields
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.gender !== undefined) updateData.gender = req.body.gender;
        if (req.body.birthYear !== undefined && req.body.birthYear !== null) {
            updateData.birthYear = req.body.birthYear;
        }
        if (req.body.activityLevel !== undefined) updateData.activityLevel = req.body.activityLevel;
        if (req.body.strideLength !== undefined) updateData.strideLength = req.body.strideLength;
        if (req.body.dailyCalorieGoal !== undefined) updateData.dailyCalorieGoal = req.body.dailyCalorieGoal;
        if (req.body.dailyWaterGoal !== undefined) updateData.dailyWaterGoal = req.body.dailyWaterGoal;
        if (req.body.dailyStepsGoal !== undefined) updateData.dailyStepsGoal = req.body.dailyStepsGoal;
        if (req.body.dailyProteinGoal !== undefined) updateData.dailyProteinGoal = req.body.dailyProteinGoal;
        if (req.body.dailyCarbsGoal !== undefined) updateData.dailyCarbsGoal = req.body.dailyCarbsGoal;
        if (req.body.dailyFatGoal !== undefined) updateData.dailyFatGoal = req.body.dailyFatGoal;
        if (req.body.dailyFiberGoal !== undefined) updateData.dailyFiberGoal = req.body.dailyFiberGoal;

        // Handle base64 profile image
        if (req.body.profileImage && req.body.profileImage.startsWith('data:image')) {
            try {
                // Extract base64 data
                const matches = req.body.profileImage.match(/^data:image\/(\w+);base64,(.+)$/);
                if (matches) {
                    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
                    const base64Data = matches[2];
                    const filename = `${userId}_${Date.now()}.${ext}`;
                    const filePath = path.join(profilePicturesDir, filename);

                    // Save image to disk
                    await fs.promises.writeFile(filePath, Buffer.from(base64Data, 'base64'));
                    updateData.profileImagePath = `uploads/profile_pictures/${filename}`;
                }
            } catch (imgError) {
                console.error('Error saving profile image:', imgError);
            }
        }

        // Handle nested height object
        if (req.body.height) {
            updateData.heightValue = req.body.height.value || 170;
            updateData.heightUnit = req.body.height.unit || 'cm';
        }

        // Handle nested weight object
        if (req.body.weight) {
            updateData.weightValue = req.body.weight.value || 70;
            updateData.weightUnit = req.body.weight.unit || 'kg';
        }

        if (!profile) {
            profile = await UserProfile.create({ userId, ...updateData });
        } else {
            await profile.update(updateData);
        }

        // Recalculate recommended calorie goal based on profile
        const tdee = profile.calculateTDEE();
        await profile.update({ dailyCalorieGoal: tdee });

        // Reload to get updated values
        await profile.reload();

        const apiProfile = profile.toAPIFormat();
        apiProfile.profileImage = getFileUrl(req, profile.profileImagePath);

        res.json(apiProfile);
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Upload profile picture
router.post('/picture', uploadProfilePicture.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const userId = req.user.userId;
        let profile = await UserProfile.findOne({ where: { userId } });

        if (!profile) {
            profile = await UserProfile.create({ userId });
        }

        // Save the relative path
        const relativePath = `uploads/profile_pictures/${req.file.filename}`;
        await profile.update({ profileImagePath: relativePath });

        res.json({
            success: true,
            profileImage: getFileUrl(req, relativePath)
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get calculated values
router.get('/calculations', async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await UserProfile.findOne({ where: { userId } });

        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const apiProfile = profile.toAPIFormat();
        res.json({
            bmr: profile.calculateBMR(),
            tdee: profile.calculateTDEE(),
            ...apiProfile
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
