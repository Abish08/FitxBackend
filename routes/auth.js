// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../config/database.js';
import { Op } from 'sequelize';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key-here',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Validation middleware
const registerValidation = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().trim().isLength({ min: 1 }).withMessage('First name cannot be empty'),
  body('lastName').optional().trim().isLength({ min: 1 }).withMessage('Last name cannot be empty')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { username, email, password, firstName, lastName } = req.body; // ❌ Remove `role`

    // Check for existing user
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName: firstName || null,
      lastName: lastName || null,
      role: 'user',     // ✅ Always 'user'
      isActive: true
    });

    // Generate token
    const token = generateToken(newUser);

    // Send response
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: userResponse, token }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    // Send response
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: userResponse, token }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});
export default router;