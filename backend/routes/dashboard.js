const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { DailyLog, UserProfile } = require('../models');
const auth = require('../middleware/auth');
const { getFileUrl } = require('../config/fileStorage');

// All dashboard routes require authentication
router.use(auth);

// Get dashboard summary for today
router.get('/', async (req, res) => {
    try {
        const userId = req.user.userId;
        const log = await DailyLog.getOrCreateToday(userId);
        const profile = await UserProfile.findOne({ where: { userId } });

        // Default goals
        const goals = {
            calories: profile?.dailyCalorieGoal || 2000,
            water: profile?.dailyWaterGoal || 2000,
            steps: profile?.dailyStepsGoal || 10000
        };

        // Calculate remaining calories
        const caloriesEaten = log.caloriesEaten || 0;
        const caloriesBurned = log.caloriesBurned || 0;
        const netCalories = caloriesEaten - caloriesBurned;
        const remainingCalories = goals.calories - netCalories;

        // Generate AI insight based on progress
        let aiInsight = '';
        const calorieProgress = (caloriesEaten / goals.calories) * 100;
        const waterProgress = (log.waterIntake / goals.water) * 100;
        const stepsProgress = (log.steps / goals.steps) * 100;

        if (calorieProgress < 50 && new Date().getHours() > 12) {
            aiInsight = "You're under your calorie target for this time of day. Consider a balanced snack!";
        } else if (waterProgress < 30 && new Date().getHours() > 10) {
            aiInsight = "Stay hydrated! You're behind on your water intake.";
        } else if (stepsProgress > 80) {
            aiInsight = "Great job on your steps! You're almost at your daily goal!";
        } else if (parseFloat(log.protein) > 50) {
            aiInsight = "You're hitting your protein goals today! Keep it up.";
        } else {
            aiInsight = "On track to hit your weekly goal!";
        }

        res.json({
            date: log.date,
            calories: {
                goal: goals.calories,
                eaten: caloriesEaten,
                burned: caloriesBurned,
                remaining: remainingCalories
            },
            water: {
                current: log.waterIntake || 0,
                goal: goals.water
            },
            steps: {
                current: log.steps || 0,
                goal: goals.steps
            },
            macros: {
                protein: parseFloat(log.protein) || 0,
                carbs: parseFloat(log.carbs) || 0,
                fat: parseFloat(log.fat) || 0,
                fiber: parseFloat(log.fiber) || 0
            },
            weight: log.weight ? parseFloat(log.weight) : null,
            aiInsight,
            user: {
                name: profile?.name || req.user.username,
                gender: profile?.gender,
                profileImage: getFileUrl(req, profile?.profileImagePath)
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get weekly summary
router.get('/weekly', async (req, res) => {
    try {
        const userId = req.user.userId;
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoString = weekAgo.toISOString().split('T')[0];

        const logs = await DailyLog.findAll({
            where: {
                userId,
                date: {
                    [Op.gte]: weekAgoString,
                    [Op.lte]: todayString
                }
            },
            order: [['date', 'ASC']]
        });

        const profile = await UserProfile.findOne({ where: { userId } });
        const calorieGoal = profile?.dailyCalorieGoal || 2000;

        const dailyData = logs.map(log => ({
            date: log.date,
            calories: log.caloriesEaten || 0,
            burned: log.caloriesBurned || 0,
            water: log.waterIntake || 0,
            steps: log.steps || 0,
            weight: log.weight ? parseFloat(log.weight) : null
        }));

        const dataLength = dailyData.length || 1; // Prevent division by zero
        const averages = {
            calories: Math.round(dailyData.reduce((sum, d) => sum + d.calories, 0) / dataLength),
            water: Math.round(dailyData.reduce((sum, d) => sum + d.water, 0) / dataLength),
            steps: Math.round(dailyData.reduce((sum, d) => sum + d.steps, 0) / dataLength)
        };

        res.json({
            dailyData,
            averages,
            calorieGoal
        });
    } catch (error) {
        console.error('Weekly dashboard error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
