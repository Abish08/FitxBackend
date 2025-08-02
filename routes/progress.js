
import express from 'express';
import { Progress } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';


const router = express.Router(); 




router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const currentProgress = await Progress.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    if (!currentProgress) {
      const initialProgress = await Progress.create({
        userId,
        weight: null,
        goalWeight: null,
        waterIntake: 0,
        waterGoal: 8,
        sleepHours: null,
        sleepGoal: 8.0,
        dailySteps: 0,
        stepsGoal: 10000,
        workoutStreak: 0,
        waterStreak: 0
      });

      return res.json({
        success: true,
        data: initialProgress,
        message: 'Initial progress record created'
      });
    }

    res.json({
      success: true,
      data: currentProgress
    });

  } catch (error) {
    console.error('Error fetching current progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current progress',
      error: error.message
    });
  }
});

router.post('/weight', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { weight, goalWeight } = req.body;

    if (!weight || isNaN(weight)) {
      return res.status(400).json({
        success: false,
        message: 'Valid weight is required'
      });
    }

    let userProgress = await Progress.findOne({
      where: { userId }
    });

    if (userProgress) {
      await userProgress.update({
        weight: parseFloat(weight),
        goalWeight: goalWeight ? parseFloat(goalWeight) : userProgress.goalWeight
      });
    } else {
      userProgress = await Progress.create({
        userId,
        weight: parseFloat(weight),
        goalWeight: goalWeight ? parseFloat(goalWeight) : null
      });
    }

    console.log(`⚖️ Weight logged: ${weight} lbs for user ${userId}`);

    res.json({
      success: true,
      data: userProgress,
      message: 'Weight logged successfully'
    });

  } catch (error) {
    console.error('Error logging weight:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging weight',
      error: error.message
    });
  }
});

router.post('/goal', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalWeight } = req.body;

    if (!goalWeight || isNaN(goalWeight)) {
      return res.status(400).json({
        success: false,
        message: 'Valid goal weight is required'
      });
    }

    let userProgress = await Progress.findOne({
      where: { userId }
    });

    if (userProgress) {
      await userProgress.update({ goalWeight: parseFloat(goalWeight) });
    } else {
      userProgress = await Progress.create({
        userId,
        goalWeight: parseFloat(goalWeight)
      });
    }

    console.log(`🎯 Goal set: ${goalWeight} lbs for user ${userId}`);

    res.json({
      success: true,
      data: userProgress,
      message: 'Goal weight set successfully'
    });

  } catch (error) {
    console.error('Error setting goal:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting goal weight',
      error: error.message
    });
  }
});

router.post('/measurements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { chest, waist, arms, thighs } = req.body;

    let userProgress = await Progress.findOne({
      where: { userId }
    });

    const measurements = {
      chest: chest ? parseFloat(chest) : null,
      waist: waist ? parseFloat(waist) : null,
      arms: arms ? parseFloat(arms) : null,
      thighs: thighs ? parseFloat(thighs) : null
    };

    if (userProgress) {
      await userProgress.update(measurements);
    } else {
      userProgress = await Progress.create({
        userId,
        ...measurements
      });
    }

    console.log(`📏 Measurements updated for user ${userId}`);

    res.json({
      success: true,
      data: userProgress,
      message: 'Body measurements updated successfully'
    });

  } catch (error) {
    console.error('Error updating measurements:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating measurements',
      error: error.message
    });
  }
});

router.post('/water', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { waterIntake } = req.body;

    if (waterIntake === undefined || isNaN(waterIntake)) {
      return res.status(400).json({
        success: false,
        message: 'Valid water intake is required'
      });
    }

    let userProgress = await Progress.findOne({
      where: { userId }
    });

    if (userProgress) {
      await userProgress.update({ waterIntake: parseInt(waterIntake) });
    } else {
      userProgress = await Progress.create({
        userId,
        waterIntake: parseInt(waterIntake)
      });
    }

    console.log(`💧 Water logged: ${waterIntake} glasses for user ${userId}`);

    res.json({
      success: true,
      data: userProgress,
      message: 'Water intake logged successfully'
    });

  } catch (error) {
    console.error('Error logging water:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging water intake',
      error: error.message
    });
  }
});

router.post('/workout-note', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { workoutType, feeling, notes, duration, caloriesBurned } = req.body;

    let userProgress = await Progress.findOne({
      where: { userId }
    });

    const workoutData = {
      workoutType: workoutType || null,
      feeling: feeling || null,
      notes: notes || null,
      workoutDuration: duration ? parseInt(duration) : null,
      caloriesBurned: caloriesBurned ? parseInt(caloriesBurned) : null
    };

    if (userProgress) {
      await userProgress.update(workoutData);
    } else {
      userProgress = await Progress.create({
        userId,
        ...workoutData
      });
    }

    console.log(`📝 Workout note added for user ${userId}`);

    res.json({
      success: true,
      data: userProgress,
      message: 'Workout note saved successfully'
    });

  } catch (error) {
    console.error('Error saving workout note:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving workout note',
      error: error.message
    });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 30 } = req.query;

    const progressHistory = await Progress.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: progressHistory,
      count: progressHistory.length
    });

  } catch (error) {
    console.error('Error fetching progress history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress history',
      error: error.message
    });
  }
});

// GET /api/progress/stats - Get progress statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const progressEntries = await Progress.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']]
    });

    const totalEntries = progressEntries.length;
    const workoutEntries = progressEntries.filter(entry => entry.workoutType !== null);

    const stats = {
      totalEntries,
      totalWorkouts: workoutEntries.length,
      consistencyScore: Math.round((totalEntries / 30) * 100)
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching progress stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress statistics',
      error: error.message
    });
  }
});

export default router;