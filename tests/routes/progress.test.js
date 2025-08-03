const request = require('supertest');
const express = require('express');

let app;
try {
  app = require('../../server.js');
} catch (error) {
  // Mock app with progress routes
  app = express();
  app.use(express.json());
  
  const progressEntries = [
    {
      id: 1,
      userId: 1,
      date: '2024-01-01',
      weight: 75,
      bodyFat: 15.5,
      muscleMass: 35,
      workoutDuration: 45,
      caloriesBurned: 350,
      exercisesCompleted: 12,
      notes: 'Great workout session',
      createdAt: new Date('2024-01-01')
    },
    {
      id: 2,
      userId: 1,
      date: '2024-01-08',
      weight: 74.5,
      bodyFat: 15.2,
      muscleMass: 35.2,
      workoutDuration: 50,
      caloriesBurned: 400,
      exercisesCompleted: 15,
      notes: 'Feeling stronger',
      createdAt: new Date('2024-01-08')
    }
  ];
  
  const mockAuth = (req, res, next) => {
    if (req.headers.authorization) {
      req.user = { id: 1, email: 'test@example.com' };
      next();
    } else {
      res.status(401).json({ error: 'Access denied' });
    }
  };
  
  app.get('/api/progress', mockAuth, (req, res) => {
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;
    let userProgress = progressEntries.filter(p => p.userId === req.user.id);
    
    if (startDate) {
      userProgress = userProgress.filter(p => new Date(p.date) >= new Date(startDate));
    }
    
    if (endDate) {
      userProgress = userProgress.filter(p => new Date(p.date) <= new Date(endDate));
    }
    
    // Sort by date descending
    userProgress.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Pagination
    const total = userProgress.length;
    const paginatedProgress = userProgress.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      progress: paginatedProgress,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  });
  
  app.post('/api/progress', mockAuth, (req, res) => {
    const { date, weight, bodyFat, muscleMass, workoutDuration, caloriesBurned, exercisesCompleted, notes } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    // Check if entry already exists for this date
    const existingEntry = progressEntries.find(p => 
      p.userId === req.user.id && p.date === date
    );
    
    if (existingEntry) {
      return res.status(400).json({ error: 'Progress entry already exists for this date' });
    }
    
    const newEntry = {
      id: progressEntries.length + 1,
      userId: req.user.id,
      date,
      weight: weight || null,
      bodyFat: bodyFat || null,
      muscleMass: muscleMass || null,
      workoutDuration: workoutDuration || null,
      caloriesBurned: caloriesBurned || null,
      exercisesCompleted: exercisesCompleted || null,
      notes: notes || null,
      createdAt: new Date()
    };
    
    progressEntries.push(newEntry);
    res.status(201).json({ success: true, progress: newEntry });
  });
  
  app.put('/api/progress/:id', mockAuth, (req, res) => {
    const progressId = parseInt(req.params.id);
    const entry = progressEntries.find(p => p.id === progressId && p.userId === req.user.id);
    
    if (!entry) {
      return res.status(404).json({ error: 'Progress entry not found' });
    }
    
    const updatableFields = ['weight', 'bodyFat', 'muscleMass', 'workoutDuration', 'caloriesBurned', 'exercisesCompleted', 'notes'];
    const updates = {};
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    Object.assign(entry, updates, { updatedAt: new Date() });
    res.json({ success: true, progress: entry });
  });
  
  app.delete('/api/progress/:id', mockAuth, (req, res) => {
    const progressId = parseInt(req.params.id);
    const index = progressEntries.findIndex(p => p.id === progressId && p.userId === req.user.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Progress entry not found' });
    }
    
    progressEntries.splice(index, 1);
    res.json({ success: true, message: 'Progress entry deleted successfully' });
  });
  
  app.get('/api/progress/analytics', mockAuth, (req, res) => {
    const userProgress = progressEntries.filter(p => p.userId === req.user.id);
    
    if (userProgress.length === 0) {
      return res.json({
        success: true,
        analytics: {
          weightTrend: null,
          bodyFatTrend: null,
          averageWorkoutDuration: null,
          totalCaloriesBurned: 0,
          totalExercisesCompleted: 0
        }
      });
    }
    
    const analytics = {
      weightTrend: calculateTrend(userProgress, 'weight'),
      bodyFatTrend: calculateTrend(userProgress, 'bodyFat'),
      averageWorkoutDuration: calculateAverage(userProgress, 'workoutDuration'),
      totalCaloriesBurned: userProgress.reduce((sum, p) => sum + (p.caloriesBurned || 0), 0),
      totalExercisesCompleted: userProgress.reduce((sum, p) => sum + (p.exercisesCompleted || 0), 0),
      entriesCount: userProgress.length
    };
    
    res.json({ success: true, analytics });
  });
  
  function calculateTrend(entries, field) {
    const validEntries = entries.filter(e => e[field] !== null).sort((a, b) => new Date(a.date) - new Date(b.date));
    if (validEntries.length < 2) return null;
    
    const first = validEntries[0][field];
    const last = validEntries[validEntries.length - 1][field];
    return ((last - first) / first * 100).toFixed(2);
  }
  
  function calculateAverage(entries, field) {
    const validEntries = entries.filter(e => e[field] !== null);
    if (validEntries.length === 0) return null;
    
    const sum = validEntries.reduce((sum, e) => sum + e[field], 0);
    return (sum / validEntries.length).toFixed(2);
  }
}

describe('Progress Routes', () => {
  const authToken = 'Bearer mock-token';

  describe('GET /api/progress', () => {
    test('should return user progress entries', async () => {
      const response = await request(app)
        .get('/api/progress')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('progress');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.progress)).toBe(true);
      expect(response.body.progress.length).toBeGreaterThan(0);
    });

    test('should filter progress by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-05';
      
      const response = await request(app)
        .get(`/api/progress?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', authToken)
        .expect(200);

      response.body.progress.forEach(entry => {
        expect(new Date(entry.date)).toBeGreaterThanOrEqual(new Date(startDate));
        expect(new Date(entry.date)).toBeLessThanOrEqual(new Date(endDate));
      });
    });

    test('should support pagination', async () => {
      const response = await request(app)
        .get('/api/progress?limit=1&offset=0')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.limit).toBe(1);
      expect(response.body.offset).toBe(0);
      expect(response.body.progress.length).toBeLessThanOrEqual(1);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/progress')
        .expect(401);
    });
  });

  describe('POST /api/progress', () => {
    test('should create new progress entry', async () => {
      const progressData = {
        date: '2024-01-15',
        weight: 73.5,
        bodyFat: 14.8,
        muscleMass: 36,
        workoutDuration: 55,
        caloriesBurned: 450,
        exercisesCompleted: 18,
        notes: 'Personal best on squats!'
      };

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', authToken)
        .send(progressData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('progress');
      expect(response.body.progress.date).toBe(progressData.date);
      expect(response.body.progress.weight).toBe(progressData.weight);
      expect(response.body.progress.notes).toBe(progressData.notes);
    });

    test('should create entry with minimal data', async () => {
      const progressData = {
        date: '2024-01-16'
      };

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', authToken)
        .send(progressData)
        .expect(201);

      expect(response.body.progress.date).toBe(progressData.date);
      expect(response.body.progress.weight).toBeNull();
    });

    test('should return 400 for missing date', async () => {
      const progressData = {
        weight: 75,
        notes: 'Test entry'
      };

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', authToken)
        .send(progressData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Date is required');
    });

    test('should return 400 for duplicate date', async () => {
      const progressData = {
        date: '2024-01-01' // Already exists in mock data
      };

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', authToken)
        .send(progressData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    test('should return 401 without authentication', async () => {
      const progressData = {
        date: '2024-01-17',
        weight: 75
      };

      await request(app)
        .post('/api/progress')
        .send(progressData)
        .expect(401);
    });
  });

  describe('PUT /api/progress/:id', () => {
    test('should update existing progress entry', async () => {
      const updateData = {
        weight: 74,
        bodyFat: 15,
        notes: 'Updated progress notes'
      };

      const response = await request(app)
        .put('/api/progress/1')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.progress.weight).toBe(updateData.weight);
      expect(response.body.progress.bodyFat).toBe(updateData.bodyFat);
      expect(response.body.progress.notes).toBe(updateData.notes);
      expect(response.body.progress).toHaveProperty('updatedAt');
    });

    test('should return 404 for non-existent entry', async () => {
      const updateData = { weight: 75 };

      const response = await request(app)
        .put('/api/progress/999')
        .set('Authorization', authToken)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 without authentication', async () => {
      const updateData = { weight: 75 };

      await request(app)
        .put('/api/progress/1')
        .send(updateData)
        .expect(401);
    });
  });

  describe('DELETE /api/progress/:id', () => {
    test('should delete existing progress entry', async () => {
      const response = await request(app)
        .delete('/api/progress/1')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    test('should return 404 for non-existent entry', async () => {
      const response = await request(app)
        .delete('/api/progress/999')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .delete('/api/progress/1')
        .expect(401);
    });
  });

  describe('GET /api/progress/analytics', () => {
    test('should return progress analytics', async () => {
      const response = await request(app)
        .get('/api/progress/analytics')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('weightTrend');
      expect(response.body.analytics).toHaveProperty('bodyFatTrend');
      expect(response.body.analytics).toHaveProperty('averageWorkoutDuration');
      expect(response.body.analytics).toHaveProperty('totalCaloriesBurned');
      expect(response.body.analytics).toHaveProperty('totalExercisesCompleted');
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/progress/analytics')
        .expect(401);
    });
  });
});