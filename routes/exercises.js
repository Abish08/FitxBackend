
import express from 'express';
import { Exercise } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { adminOnly } from '../middleware/admin.js';

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all exercises...');
    const exercises = await Exercise.findAll({
      order: [['id', 'ASC']]
    });

    console.log(`✅ Found ${exercises.length} exercises`);
    res.json({
      success: true,
      data: exercises,
      count: exercises.length
    });
  } catch (error) {
    console.error('❌ Error fetching exercises:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exercises',
      error: error.message
    });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching exercise with ID: ${id}`);

    const exercise = await Exercise.findByPk(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    console.log(`✅ Found exercise: ${exercise.name}`);
    res.json({
      success: true,
      data: exercise
    });
  } catch (error) {
    console.error('❌ Error fetching exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exercise',
      error: error.message
    });
  }
});


router.post('/', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { name, category, difficulty, duration, muscles, videoId, description } = req.body;

    // Validation
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    console.log('📝 Creating new exercise:', { name, category, difficulty });

    const exercise = await Exercise.create({
      name,
      category,
      difficulty: difficulty || 'Beginner',
      duration: duration || '30 seconds',
      muscles: muscles || '',
      videoId: videoId || '',
      description: description || ''
    });

    console.log(`✅ Exercise created: ${exercise.name}`);
    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      data: exercise
    });
  } catch (error) {
    console.error('❌ Error creating exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating exercise',
      error: error.message
    });
  }
});


router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, difficulty, duration, muscles, videoId, description } = req.body;

    console.log(`📝 Updating exercise ID: ${id}`);

    const exercise = await Exercise.findByPk(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Update fields
    Object.assign(exercise, {
      name,
      category,
      difficulty,
      duration,
      muscles,
      videoId,
      description
    });

    await exercise.save();

    console.log(`✅ Exercise updated: ${exercise.name}`);
    res.json({
      success: true,
      message: 'Exercise updated successfully',
      data: exercise
    });
  } catch (error) {
    console.error('❌ Error updating exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exercise',
      error: error.message
    });
  }
});


router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting exercise ID: ${id}`);

    const exercise = await Exercise.findByPk(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    await exercise.destroy();

    console.log(`✅ Exercise deleted: ${exercise.name}`);
    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting exercise',
      error: error.message
    });
  }
});

export default router;