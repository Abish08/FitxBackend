// middleware/auth.js
import jwt from 'jsonwebtoken';           // ✅ Required for jwt.verify
import { User } from '../config/database.js';  // ✅ Required for User.findByPk

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, payload) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    try {
      const dbUser = await User.findByPk(payload.id);
      if (!dbUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      req.user = dbUser.get({ plain: true });
      next();
    } catch (dbError) {
      console.error('Database error in auth middleware:', dbError);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Internal server error during authentication',
        });
      }
    }
  });
};

export { authenticateToken };