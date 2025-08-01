// routes/admin/AdminExercises.js
import express from 'express';
import { Exercise } from '../../config/database.js';
import { adminOnly } from '../../middleware/admin.js';

const router = express.Router();

// GET /api/admin/exercises
router.get('/exercises', adminOnly, async (req, res) => {
  try {
    const exercises = await Exercise.findAll();
    res.json({
      success: true,
       exercises
    });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching exercises',
      error: error.message
    });
  }
});

// POST /api/admin/exercises
router.post('/exercises', adminOnly, async (req, res) => {
  const { name, category, description, videoUrl, difficulty } = req.body;

  try {
    const exercise = await Exercise.create({
      name,
      category,
      description,
      videoUrl,
      difficulty
    });

    res.status(201).json({
      success: true,
      message: 'Exercise added',
      data: exercise
    });
  } catch (error) {
    console.error('Error adding exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding exercise',
      error: error.message
    });
  }
});

// PUT /api/admin/exercises/:id
router.put('/exercises/:id', adminOnly, async (req, res) => {
  const { id } = req.params;
  const { name, category, description, videoUrl, difficulty } = req.body;

  try {
    const exercise = await Exercise.findByPk(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    exercise.name = name;
    exercise.category = category;
    exercise.description = description;
    exercise.videoUrl = videoUrl;
    exercise.difficulty = difficulty;

    await exercise.save();

    res.json({
      success: true,
      message: 'Exercise updated',
      data: exercise
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating exercise',
      error: error.message
    });
  }
});

// DELETE /api/admin/exercises/:id
router.delete('/exercises/:id', adminOnly, async (req, res) => {
  const { id } = req.params;

  try {
    const exercise = await Exercise.findByPk(id);
    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    await exercise.destroy();

    res.json({
      success: true,
      message: 'Exercise deleted'
    });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting exercise',
      error: error.message
    });
  }
});

export default router;