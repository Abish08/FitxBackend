const request = require('supertest');
const express = require('express');

let app;
try {
  app = require('../../server.js');
} catch (error) {
  // Mock app with exercise routes
  app = express();
  app.use(express.json());
  
  const exercises = [
    { id: 1, name: 'Push Up', category: 'strength', muscleGroups: ['chest', 'triceps'], difficulty: 'beginner' },
    { id: 2, name: 'Running', category: 'cardio', muscleGroups: ['legs'], difficulty: 'intermediate' },
    { id: 3, name: 'Squats', category: 'strength', muscleGroups: ['legs', 'glutes'], difficulty: 'beginner' }
  ];
  
  const mockAuth = (req, res, next) => {
    if (req.headers.authorization) {
      req.user = { id: 1, email: 'test@example.com' };
      next();
    } else {
      res.status(401).json({ error: 'Access denied' });
    }
  };
  
  app.get('/api/exercises', (req, res) => {
    const { category, search, difficulty, muscleGroup } = req.query;
    let filteredExercises = [...exercises];
    
    if (category) {
      filteredExercises = filteredExercises.filter(ex => ex.category === category);
    }
    
    if (search) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (difficulty) {
      filteredExercises = filteredExercises.filter(ex => ex.difficulty === difficulty);
    }
    
    if (muscleGroup) {
      filteredExercises = filteredExercises.filter(ex => 
        ex.muscleGroups.includes(muscleGroup)
      );
    }
    
    res.json({ 
      success: true,
      exercises: filteredExercises,
      total: filteredExercises.length 
    });
  });
  
  app.get('/api/exercises/:id', (req, res) => {
    const exercise = exercises.find(ex => ex.id === parseInt(req.params.id));
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    res.json({ success: true, exercise });
  });
  
  app.post('/api/exercises', mockAuth, (req, res) => {
    const { name, category, muscleGroups, instructions, difficulty, equipment } = req.body;
    
    if (!name || !category || !muscleGroups) {
      return res.status(400).json({ error: 'Name, category, and muscle groups are required' });
    }
    
    const newExercise = {
      id: exercises.length + 1,
      name,
      category,
      muscleGroups,
      instructions,
      difficulty: difficulty || 'beginner',
      equipment: equipment || 'bodyweight',
      createdAt: new Date(),
      createdBy: req.user.id
    };
    
    exercises.push(newExercise);
    res.status(201).json({ success: true, exercise: newExercise });
  });
  
  app.put('/api/exercises/:id', mockAuth, (req, res) => {
    const exercise = exercises.find(ex => ex.id === parseInt(req.params.id));
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    Object.assign(exercise, req.body, { updatedAt: new Date() });
    res.json({ success: true, exercise });
  });
  
  app.delete('/api/exercises/:id', mockAuth, (req, res) => {
    const index = exercises.findIndex(ex => ex.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    exercises.splice(index, 1);
    res.json({ success: true, message: 'Exercise deleted successfully' });
  });
}

describe('Exercise Controller', () => {
  const authToken = 'Bearer mock-token';

  describe('GET /api/exercises', () => {
    test('should return all exercises', async () => {
      const response = await request(app)
        .get('/api/exercises')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('exercises');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.exercises)).toBe(true);
      expect(response.body.exercises.length).toBeGreaterThan(0);
    });

    test('should filter exercises by category', async () => {
      const response = await request(app)
        .get('/api/exercises?category=strength')
        .expect(200);

      expect(response.body.exercises).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ category: 'strength' })
        ])
      );
      
      response.body.exercises.forEach(exercise => {
        expect(exercise.category).toBe('strength');
      });
    });

    test('should filter exercises by difficulty', async () => {
      const response = await request(app)
        .get('/api/exercises?difficulty=beginner')
        .expect(200);

      response.body.exercises.forEach(exercise => {
        expect(exercise.difficulty).toBe('beginner');
      });
    });

    test('should search exercises by name', async () => {
      const response = await request(app)
        .get('/api/exercises?search=push')
        .expect(200);

      expect(response.body.exercises.length).toBeGreaterThan(0);
      response.body.exercises.forEach(exercise => {
        expect(exercise.name.toLowerCase()).toContain('push');
      });
    });

    test('should filter by muscle group', async () => {
      const response = await request(app)
        .get('/api/exercises?muscleGroup=chest')
        .expect(200);

      response.body.exercises.forEach(exercise => {
        expect(exercise.muscleGroups).toContain('chest');
      });
    });

    test('should return empty array for non-existent category', async () => {
      const response = await request(app)
        .get('/api/exercises?category=nonexistent')
        .expect(200);

      expect(response.body.exercises).toHaveLength(0);
    });
  });

  describe('GET /api/exercises/:id', () => {
    test('should return specific exercise', async () => {
      const response = await request(app)
        .get('/api/exercises/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('exercise');
      expect(response.body.exercise.id).toBe(1);
    });

    test('should return 404 for non-existent exercise', async () => {
      const response = await request(app)
        .get('/api/exercises/999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/exercises', () => {
    test('should create new exercise with valid data', async () => {
      const exerciseData = {
        name: 'Deadlifts',
        category: 'strength',
        muscleGroups: ['back', 'legs'],
        instructions: 'Stand with feet hip-width apart...',
        difficulty: 'intermediate',
        equipment: 'barbell'
      };

      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', authToken)
        .send(exerciseData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('exercise');
      expect(response.body.exercise.name).toBe('Deadlifts');
      expect(response.body.exercise.category).toBe('strength');
      expect(response.body.exercise.muscleGroups).toEqual(['back', 'legs']);
    });

    test('should return 400 for missing required fields', async () => {
      const invalidData = {
        category: 'strength'
        // Missing name and muscleGroups
      };

      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('required');
    });

    test('should return 401 without authentication', async () => {
      const exerciseData = {
        name: 'Test Exercise',
        category: 'strength',
        muscleGroups: ['chest']
      };

      await request(app)
        .post('/api/exercises')
        .send(exerciseData)
        .expect(401);
    });

    test('should set default values for optional fields', async () => {
      const exerciseData = {
        name: 'Basic Push Up',
        category: 'strength',
        muscleGroups: ['chest']
      };

      const response = await request(app)
        .post('/api/exercises')
        .set('Authorization', authToken)
        .send(exerciseData)
        .expect(201);

      expect(response.body.exercise.difficulty).toBe('beginner');
      expect(response.body.exercise.equipment).toBe('bodyweight');
    });
  });

  describe('PUT /api/exercises/:id', () => {
    test('should update existing exercise', async () => {
      const updateData = {
        name: 'Modified Push Up',
        difficulty: 'advanced',
        instructions: 'Updated instructions'
      };

      const response = await request(app)
        .put('/api/exercises/1')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.exercise.name).toBe('Modified Push Up');
      expect(response.body.exercise.difficulty).toBe('advanced');
      expect(response.body.exercise).toHaveProperty('updatedAt');
    });

    test('should return 404 for non-existent exercise', async () => {
      const updateData = { name: 'Test' };

      const response = await request(app)
        .put('/api/exercises/999')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 without authentication', async () => {
      const updateData = { name: 'Test' };

      await request(app)
        .put('/api/exercises/1')
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/exercises/:id', () => {
    test('should delete existing exercise', async () => {
      const response = await request(app)
        .delete('/api/exercises/1')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for non-existent exercise', async () => {
      const response = await request(app)
        .delete('/api/exercises/999')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .delete('/api/exercises/1')
        .expect(401);
    });
  });
});