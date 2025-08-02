// server.js - Final ESM Version
import express from 'express';
import cors from 'cors';
import { sequelize } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import exerciseRoutes from './routes/exercises.js';
import progressRoutes from './routes/progress.js';
import adminUsersRoute from './routes/admin/AdminUsers.js';
import adminExercisesRoute from './routes/admin/AdminExercises.js';

// Middleware
import { adminOnly } from './middleware/admin.js';
import { authenticateToken } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FitX Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    routes: [
      'GET /api/health',
      'GET /api/test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/users/profile',
      'GET /api/exercises',
      'GET /api/exercises/:id',
      'POST /api/exercises',
      'PUT /api/exercises/:id',
      'DELETE /api/exercises/:id',
      'GET /api/progress/current',
      'POST /api/progress/weight',
      'POST /api/progress/goal',
      'POST /api/progress/measurements',
      'POST /api/progress/water',
      'POST /api/progress/workout-note',
      'GET /api/progress/history',
      'GET /api/progress/stats'
    ]
  });
});

// ===========================
// 🔹 Core API Routes
// ===========================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);


// ===========================
// 🔥 Admin Routes (Protected)
// ===========================
// app.use('/api/admin', adminOnly, adminUsersRoute);
// app.use('/api/admin', adminOnly, adminExercisesRoute);
// 🔐 Apply authenticateToken FIRST, then adminOnly
app.use('/api/admin', authenticateToken, adminOnly, adminUsersRoute);
app.use('/api/admin', authenticateToken, adminOnly, adminExercisesRoute);

console.log('🔐 Admin routes protected with adminOnly middleware');
// ===========================
// 🔐 Global Error Handler
// ===========================
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ===========================
// 🚫 404 Fallback
// ===========================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/users/profile',
      'GET /api/exercises',
      'GET /api/exercises/:id',
      'POST /api/exercises (admin)',
      'PUT /api/exercises/:id (admin)',
      'DELETE /api/exercises/:id (admin)',
      'GET /api/progress/current',
      'POST /api/progress/weight',
      'POST /api/progress/goal',
      'POST /api/progress/measurements',
      'POST /api/progress/water',
      'POST /api/progress/workout-note',
      'GET /api/progress/history',
      'GET /api/progress/stats',
      'GET /api/admin/users (admin)',
      'PUT /api/admin/users/:id/role (admin)',
      'DELETE /api/admin/users/:id (admin)',
      'POST /api/admin/exercises (admin)',
      'PUT /api/admin/exercises/:id (admin)',
      'DELETE /api/admin/exercises/:id (admin)'
    ]
  });
});

// ===========================
// 🚀 Start Server
// ===========================
async function startServer() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // 🚨 Use { force: false } or { alter: true } in production
    await sequelize.sync({ alter: true }); // Updates schema without losing data
    console.log('✅ Database synced');

    app.listen(PORT, () => {
      console.log('🚀 FitX Backend Server Started!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📍 Server: http://localhost:${PORT}`);
      console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
      console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
      console.log(`🔐 Admin Users: http://localhost:${PORT}/api/admin/users`);
      console.log(`🏋️ Exercise Library: http://localhost:${PORT}/api/exercises`);
      console.log(`📊 Progress Tracking: http://localhost:${PORT}/api/progress`);
      console.log('🌍 Environment: development');
      console.log('📊 Database: fitx_fitness (users + exercises + progress)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();