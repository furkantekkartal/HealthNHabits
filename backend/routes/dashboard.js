const express = require('express');
const router = express.Router();
const DailyLog = require('../models/DailyLog');
const UserProfile = require('../models/UserProfile');
const auth = require('../middleware/auth');

// All dashboard routes require authentication
router.use(auth);

// Get dashboard summary for today
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const log = await DailyLog.getOrCreateToday(userId);
        const profile = await UserProfile.findOne({ userId });

        // Default goals
        const goals = {
            calories: profile?.dailyCalorieGoal || 2000,
            water: profile?.dailyWaterGoal || 2000,
            steps: profile?.dailyStepsGoal || 10000
        };

        // Calculate remaining calories
        const netCalories = log.summary.caloriesEaten - log.summary.caloriesBurned;
        const remainingCalories = goals.calories - netCalories;

        // Generate AI insight based on progress
        let aiInsight = '';
        const calorieProgress = (log.summary.caloriesEaten / goals.calories) * 100;
        const waterProgress = (log.summary.waterIntake / goals.water) * 100;
        const stepsProgress = (log.summary.steps / goals.steps) * 100;

        if (calorieProgress < 50 && new Date().getHours() > 12) {
            aiInsight = "You're under your calorie target for this time of day. Consider a balanced snack!";
        } else if (waterProgress < 30 && new Date().getHours() > 10) {
            aiInsight = "Stay hydrated! You're behind on your water intake.";
        } else if (stepsProgress > 80) {
            aiInsight = "Great job on your steps! You're almost at your daily goal!";
        } else if (log.summary.protein > 50) {
            aiInsight = "You're hitting your protein goals today! Keep it up.";
        } else {
            aiInsight = "On track to hit your weekly goal!";
        }

        res.json({
            date: log.date,
            calories: {
                goal: goals.calories,
                eaten: log.summary.caloriesEaten,
                burned: log.summary.caloriesBurned,
                remaining: remainingCalories
            },
            water: {
                current: log.summary.waterIntake,
                goal: goals.water
            },
            steps: {
                current: log.summary.steps,
                goal: goals.steps
            },
            macros: {
                protein: log.summary.protein,
                carbs: log.summary.carbs,
                fat: log.summary.fat,
                fiber: log.summary.fiber || 0
            },
            weight: log.summary.weight,
            aiInsight,
            user: {
                name: profile?.name || req.user.username,
                gender: profile?.gender,
                profileImage: profile?.profileImage || null
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get weekly summary
router.get('/weekly', async (req, res) => {
    try {
        const userId = req.user.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const logs = await DailyLog.find({
            userId,
            date: { $gte: weekAgo, $lte: today }
        }).sort({ date: 1 });

        const profile = await UserProfile.findOne({ userId });
        const calorieGoal = profile?.dailyCalorieGoal || 2000;

        const dailyData = logs.map(log => ({
            date: log.date,
            calories: log.summary.caloriesEaten,
            burned: log.summary.caloriesBurned,
            water: log.summary.waterIntake,
            steps: log.summary.steps,
            weight: log.summary.weight
        }));

        const averages = {
            calories: Math.round(dailyData.reduce((sum, d) => sum + d.calories, 0) / dailyData.length) || 0,
            water: Math.round(dailyData.reduce((sum, d) => sum + d.water, 0) / dailyData.length) || 0,
            steps: Math.round(dailyData.reduce((sum, d) => sum + d.steps, 0) / dailyData.length) || 0
        };

        res.json({
            dailyData,
            averages,
            calorieGoal
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
