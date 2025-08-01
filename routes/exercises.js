// routes/exercises.js - Converted to ESM
import express from 'express';
import { sequelize } from '../config/database.js';
import { QueryTypes } from 'sequelize';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// GET /api/exercises - Get all exercises (Public)
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all exercises...');
    
    const exercises = await sequelize.query(
      'SELECT * FROM exercises ORDER BY id ASC',
      { type: QueryTypes.SELECT }
    );

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

// GET /api/exercises/:id - Get specific exercise (Public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 Fetching exercise with ID: ${id}`);
    
    const exercise = await sequelize.query(
      'SELECT * FROM exercises WHERE id = :id',
      { 
        replacements: { id },
        type: QueryTypes.SELECT 
      }
    );

    if (exercise.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    console.log(`✅ Found exercise: ${exercise[0].name}`);
    
    res.json({
      success: true,
      data: exercise[0]
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

// POST /api/exercises - Create new exercise (Admin only)
router.post('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, category, difficulty, duration, muscles, videoId } = req.body;
    
    console.log('📝 Creating new exercise:', { name, category, difficulty });
    
    // Validation
    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name and category are required'
      });
    }

    const result = await sequelize.query(
      `INSERT INTO exercises (name, category, difficulty, duration, muscles, "videoId", created_at) 
       VALUES (:name, :category, :difficulty, :duration, :muscles, :videoId, NOW()) 
       RETURNING *`,
      {
        replacements: { 
          name, 
          category, 
          difficulty: difficulty || 'Beginner',
          duration: duration || '30 seconds',
          muscles: muscles || '',
          videoId: videoId || ''
        },
        type: QueryTypes.SELECT
      }
    );

    console.log(`✅ Exercise created: ${result[0].name}`);
    
    res.status(201).json({
      success: true,
      message: 'Exercise created successfully',
      data: result[0]
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

// PUT /api/exercises/:id - Update exercise (Admin only)
router.put('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, difficulty, duration, muscles, videoId } = req.body;
    
    console.log(`📝 Updating exercise ID: ${id}`);
    
    // Check if exercise exists
    const existing = await sequelize.query(
      'SELECT * FROM exercises WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Update exercise
    const result = await sequelize.query(
      `UPDATE exercises 
       SET name = COALESCE(:name, name),
           category = COALESCE(:category, category),
           difficulty = COALESCE(:difficulty, difficulty),
           duration = COALESCE(:duration, duration),
           muscles = COALESCE(:muscles, muscles),
           "videoId" = COALESCE(:videoId, "videoId")
       WHERE id = :id 
       RETURNING *`,
      {
        replacements: { id, name, category, difficulty, duration, muscles, videoId },
        type: QueryTypes.SELECT
      }
    );

    console.log(`✅ Exercise updated: ${result[0].name}`);
    
    res.json({
      success: true,
      message: 'Exercise updated successfully',
      data: result[0]
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

// DELETE /api/exercises/:id - Delete exercise (Admin only)
router.delete('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting exercise ID: ${id}`);
    
    // Check if exercise exists
    const existing = await sequelize.query(
      'SELECT * FROM exercises WHERE id = :id',
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Delete exercise
    await sequelize.query(
      'DELETE FROM exercises WHERE id = :id',
      { replacements: { id }, type: QueryTypes.DELETE }
    );

    console.log(`✅ Exercise deleted: ${existing[0].name}`);
    
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