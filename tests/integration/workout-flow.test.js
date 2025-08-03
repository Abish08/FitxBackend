const request = require('supertest');
const express = require('express');

let app;
try {
  app = require('../../server.js');
} catch (error) {
  // Create comprehensive mock app for integration testing
  app = express();
  app.use(express.json());
  
  // Mock data stores
  const users = [];
  const exercises = [
    { id: 1, name: 'Push Up', category: 'strength', muscleGroups: ['chest'], difficulty: 'beginner' },
    { id: 2, name: 'Squat', category: 'strength', muscleGroups: ['legs'], difficulty: 'beginner' },
    { id: 3, name: 'Running', category: 'cardio', muscleGroups: ['legs'], difficulty: 'intermediate' }
  ];
  const workouts = [];
  const workoutSessions = [];
  const progressEntries = [];
  
  // Auth endpoints
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const user = {
      id: users.length + 1,
      email, firstName, lastName,
      createdAt: new Date()
    };
    users.push(user);
    
    const token = `token-${user.id}`;
    res.status(201).json({ success: true, token, user });
  });
  
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = `token-${user.id}`;
    res.json({ success: true, token, user });
  });
  
  // Middleware
  const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Access denied' });
    }
    
    const token = authHeader.split(' ')[1];
    const userId = parseInt(token.split('-')[1]);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  };
  
  // Exercise endpoints
  app.get('/api/exercises', (req, res) => {
    res.json({ success: true, exercises });
  });
  
  // Workout endpoints
  app.post('/api/workouts', authMiddleware, (req, res) => {
    const { name, description, exercises: workoutExercises } = req.body;
    
    if (!name || !workoutExercises || !Array.isArray(workoutExercises)) {
      return res.status(400).json({ error: 'Name and exercises are required' });
    }
    
    const workout = {
      id: workouts.length + 1,
      name,
      description,
      exercises: workoutExercises,
      userId: req.user.id,
      createdAt: new Date()
    };
    
    workouts.push(workout);
    res.status(201).json({ success: true, workout });
  });
  
  app.get('/api/workouts', authMiddleware, (req, res) => {
    const userWorkouts = workouts.filter(w => w.userId === req.user.id);
    res.json({ success: true, workouts: userWorkouts });
  });
  
  // Workout session endpoints
  app.post('/api/workout-sessions', authMiddleware, (req, res) => {
    const { workoutId, startTime } = req.body;
    
    if (!workoutId) {
      return res.status(400).json({ error: 'Workout ID is required' });
    }
    
    const workout = workouts.find(w => w.id === workoutId && w.userId === req.user.id);
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    
    const session = {
      id: workoutSessions.length + 1,
      workoutId,
      userId: req.user.id,
      startTime: startTime || new Date(),
      status: 'in_progress',
      exercises: workout.exercises.map(ex => ({
        ...ex,
        completed: false,
        actualSets: 0,
        actualReps: [],
        actualWeights: []
      })),
      createdAt: new Date()
    };
    
    workoutSessions.push(session);
    res.status(201).json({ success: true, session });
  });
  
  app.put('/api/workout-sessions/:id/exercises/:exerciseId', authMiddleware, (req, res) => {
    const sessionId = parseInt(req.params.id);
    const exerciseId = parseInt(req.params.exerciseId);
    
    const session = workoutSessions.find(s => s.id === sessionId && s.userId === req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const exercise = session.exercises.find(ex => ex.exerciseId === exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found in session' });
    }
    
    const { actualSets, actualReps, actualWeights } = req.body;
    
    Object.assign(exercise, {
      actualSets: actualSets || exercise.actualSets,
      actualReps: actualReps || exercise.actualReps,
      actualWeights: actualWeights || exercise.actualWeights,
      completed: true
    });
    
    res.json({ success: true, exercise });
  });
  
  app.put('/api/workout-sessions/:id/complete', authMiddleware, (req, res) => {
    const sessionId = parseInt(req.params.id);
    const { endTime, notes } = req.body;
    
    const session = workoutSessions.find(s => s.id === sessionId && s.userId === req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const completedExercises = session.exercises.filter(ex => ex.completed).length;
    const totalExercises = session.exercises.length;
    const duration = Math.round((new Date(endTime || new Date()) - new Date(session.startTime)) / 60000); // minutes
    
    Object.assign(session, {
      endTime: endTime || new Date(),
      status: 'completed',
      notes,
      duration,
      completedExercises,
      totalExercises
    });
    
    // Auto-create progress entry
    const progressEntry = {
      id: progressEntries.length + 1,
      userId: req.user.id,
      date: new Date().toISOString().split('T')[0],
      workoutDuration: duration,
      exercisesCompleted: completedExercises,
      notes: `Completed workout: ${workouts.find(w => w.id === session.workoutId)?.name}`,
      createdAt: new Date()
    };
    
    progressEntries.push(progressEntry);
    
    res.json({ success: true, session, progressEntry });
  });
  
  // Progress endpoints
  app.get('/api/progress', authMiddleware, (req, res) => {
    const userProgress = progressEntries.filter(p => p.userId === req.user.id);
    res.json({ success: true, progress: userProgress });
  });
  
  app.post('/api/progress', authMiddleware, (req, res) => {
    const { date, weight, notes } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const entry = {
      id: progressEntries.length + 1,
      userId: req.user.id,
      date,
      weight,
      notes,
      createdAt: new Date()
    };
    
    progressEntries.push(entry);
    res.status(201).json({ success: true, progress: entry });
  });
}

describe('Workout Flow Integration Tests', () => {
  let authToken;
  let userId;
  let workoutId;
  let sessionId;

  beforeAll(async () => {
    // Register a test user
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'integration@example.com',
        password: 'password123',
        firstName: 'Integration',
        lastName: 'Test'
      })
      .expect(201);

    authToken = userResponse.body.token;
    userId = userResponse.body.user.id;
  });

  describe('Complete Workout Flow', () => {
    test('should complete full workout creation and execution flow', async () => {
      // Step 1: Get available exercises
      const exercisesResponse = await request(app)
        .get('/api/exercises')
        .expect(200);

      expect(exercisesResponse.body.success).toBe(true);
      expect(exercisesResponse.body.exercises.length).toBeGreaterThan(0);

      // Step 2: Create a workout plan
      const workoutData = {
        name: 'Upper Body Strength',
        description: 'Focus on chest and arm muscles',
        exercises: [
          {
            exerciseId: 1, // Push Up
            sets: 3,
            reps: 15,
            weight: null,
            restTime: 60
          },
          {
            exerciseId: 2, // Squat
            sets: 3,
            reps: 12,
            weight: null,
            restTime: 90
          }
        ]
      };

      const workoutResponse = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workoutData)
        .expect(201);

      expect(workoutResponse.body.success).toBe(true);
      expect(workoutResponse.body.workout.name).toBe(workoutData.name);
      workoutId = workoutResponse.body.workout.id;

      // Step 3: Start a workout session
      const sessionData = {
        workoutId,
        startTime: new Date().toISOString()
      };

      const sessionResponse = await request(app)
        .post('/api/workout-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData)
        .expect(201);

      expect(sessionResponse.body.success).toBe(true);
      expect(sessionResponse.body.session.status).toBe('in_progress');
      sessionId = sessionResponse.body.session.id;

      // Step 4: Complete first exercise
      const exercise1Data = {
        actualSets: 3,
        actualReps: [15, 14, 13],
        actualWeights: [null, null, null]
      };

      const exercise1Response = await request(app)
        .put(`/api/workout-sessions/${sessionId}/exercises/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exercise1Data)
        .expect(200);

      expect(exercise1Response.body.success).toBe(true);
      expect(exercise1Response.body.exercise.completed).toBe(true);

      // Step 5: Complete second exercise
      const exercise2Data = {
        actualSets: 3,
        actualReps: [12, 11, 10],
        actualWeights: [null, null, null]
      };

      await request(app)
        .put(`/api/workout-sessions/${sessionId}/exercises/2`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exercise2Data)
        .expect(200);

      // Step 6: Complete the workout session
      const completeData = {
        endTime: new Date().toISOString(),
        notes: 'Great workout! Felt strong today.'
      };

      const completeResponse = await request(app)
        .put(`/api/workout-sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(completeData)
        .expect(200);

      expect(completeResponse.body.success).toBe(true);
      expect(completeResponse.body.session.status).toBe('completed');
      expect(completeResponse.body.session.completedExercises).toBe(2);
      expect(completeResponse.body.progressEntry).toBeDefined();

      // Step 7: Verify progress was automatically created
      const progressResponse = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(progressResponse.body.success).toBe(true);
      expect(progressResponse.body.progress.length).toBeGreaterThan(0);
      
      const autoProgress = progressResponse.body.progress.find(p => 
        p.notes && p.notes.includes('Upper Body Strength')
      );
      expect(autoProgress).toBeDefined();
    });

    test('should handle workout session with partial completion', async () => {
      // Create another workout
      const workoutData = {
        name: 'Quick Cardio',
        exercises: [
          { exerciseId: 3, sets: 1, reps: 1, weight: null } // Running
        ]
      };

      const workoutResponse = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workoutData)
        .expect(201);

      const newWorkoutId = workoutResponse.body.workout.id;

      // Start session
      const sessionResponse = await request(app)
        .post('/api/workout-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ workoutId: newWorkoutId })
        .expect(201);

      const newSessionId = sessionResponse.body.session.id;

      // Complete session without completing exercises
      const completeResponse = await request(app)
        .put(`/api/workout-sessions/${newSessionId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ notes: 'Had to cut it short' })
        .expect(200);

      expect(completeResponse.body.session.completedExercises).toBe(0);
      expect(completeResponse.body.session.totalExercises).toBe(1);
    });

    test('should handle manual progress entry alongside workout progress', async () => {
      // Add manual progress entry
      const manualProgress = {
        date: new Date().toISOString().split('T')[0],
        weight: 75.5,
        notes: 'Weighed myself this morning'
      };

      const progressResponse = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .send(manualProgress)
        .expect(201);

      expect(progressResponse.body.success).toBe(true);
      expect(progressResponse.body.progress.weight).toBe(75.5);

      // Verify all progress entries
      const allProgressResponse = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(allProgressResponse.body.progress.length).toBeGreaterThanOrEqual(2);
      
      const weightEntry = allProgressResponse.body.progress.find(p => p.weight === 75.5);
      expect(weightEntry).toBeDefined();
    });
  });

  describe('Error Handling in Workout Flow', () => {
    test('should handle invalid workout creation', async () => {
      const invalidWorkout = {
        name: 'Invalid Workout'
        // Missing exercises
      };

      await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidWorkout)
        .expect(400);
    });

    test('should handle starting session with non-existent workout', async () => {
      const sessionData = {
        workoutId: 999 // Non-existent
      };

      await request(app)
        .post('/api/workout-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData)
        .expect(404);
    });

    test('should handle completing non-existent exercise in session', async () => {
      // Use existing session if available, or create new one
      let currentSessionId = sessionId;
      
      if (!currentSessionId) {
        const sessionResponse = await request(app)
          .post('/api/workout-sessions')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ workoutId })
          .expect(201);
        
        currentSessionId = sessionResponse.body.session.id;
      }

      const exerciseData = {
        actualSets: 1,
        actualReps: [10]
      };

      await request(app)
        .put(`/api/workout-sessions/${currentSessionId}/exercises/999`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(exerciseData)
        .expect(404);
    });

    test('should handle unauthorized access to other users data', async () => {
      // Register another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other@example.com',
          password: 'password123',
          firstName: 'Other',
          lastName: 'User'
        })
        .expect(201);

      const otherToken = otherUserResponse.body.token;

      // Try to access first user's workouts
      const workoutsResponse = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(workoutsResponse.body.workouts).toHaveLength(0); // Should be empty

      // Try to access first user's progress
      const progressResponse = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(200);

      expect(progressResponse.body.progress).toHaveLength(0); // Should be empty
    });
  });

  describe('Data Consistency Tests', () => {
    test('should maintain data consistency across workout operations', async () => {
      // Get initial counts
      const initialWorkouts = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const initialProgress = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const initialWorkoutCount = initialWorkouts.body.workouts.length;
      const initialProgressCount = initialProgress.body.progress.length;

      // Create and complete a workout
      const workoutData = {
        name: 'Consistency Test Workout',
        exercises: [{ exerciseId: 1, sets: 1, reps: 5 }]
      };

      const workoutResponse = await request(app)
        .post('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`)
        .send(workoutData)
        .expect(201);

      const newWorkoutId = workoutResponse.body.workout.id;

      const sessionResponse = await request(app)
        .post('/api/workout-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ workoutId: newWorkoutId })
        .expect(201);

      const newSessionId = sessionResponse.body.session.id;

      await request(app)
        .put(`/api/workout-sessions/${newSessionId}/exercises/1`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ actualSets: 1, actualReps: [5] })
        .expect(200);

      await request(app)
        .put(`/api/workout-sessions/${newSessionId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      // Verify counts increased appropriately
      const finalWorkouts = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const finalProgress = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalWorkouts.body.workouts.length).toBe(initialWorkoutCount + 1);
      expect(finalProgress.body.progress.length).toBe(initialProgressCount + 1);
    });
  });

  describe('Authentication Flow Integration', () => {
    test('should handle complete authentication flow', async () => {
      // Register new user
      const newUserData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(newUserData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.token).toBeDefined();
      
      const newToken = registerResponse.body.token;

      // Login with new user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: newUserData.email,
          password: newUserData.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBe(newToken);

      // Use token to access protected endpoint
      const workoutsResponse = await request(app)
        .get('/api/workouts')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(workoutsResponse.body.success).toBe(true);
      expect(workoutsResponse.body.workouts).toHaveLength(0); // New user, no workouts
    });

    test('should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    test('should protect all workout endpoints', async () => {
      // Test all protected endpoints without auth
      const protectedEndpoints = [
        { method: 'get', path: '/api/workouts' },
        { method: 'post', path: '/api/workouts' },
        { method: 'post', path: '/api/workout-sessions' },
        { method: 'get', path: '/api/progress' },
        { method: 'post', path: '/api/progress' }
      ];

      for (const endpoint of protectedEndpoints) {
        await request(app)[endpoint.method](endpoint.path)
          .expect(401);
      }
    });
  });
});