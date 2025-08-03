const jwt = require('jsonwebtoken');

// Mock auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Invalid token format.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Token verification failed' });
  }
};

// Mock admin middleware
const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.user.isAdmin && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Mock optional auth middleware
const optionalAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    req.user = null;
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    req.user = null;
  }
  
  next();
};

describe('Auth Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('authMiddleware', () => {
    test('should authenticate with valid token', () => {
      const token = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      req.headers.authorization = `Bearer ${token}`;
      
      authMiddleware(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(1);
      expect(req.user.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    test('should reject request without authorization header', () => {
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. No token provided.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with malformed authorization header', () => {
      req.headers.authorization = 'InvalidFormat';
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Invalid token format.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject expired token', () => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );
      
      req.headers.authorization = `Bearer ${expiredToken}`;
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expired'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle token with wrong secret', () => {
      const wrongSecretToken = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        'wrong-secret'
      );
      
      req.headers.authorization = `Bearer ${wrongSecretToken}`;
      
      authMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('adminMiddleware', () => {
    test('should allow access for admin user', () => {
      req.user = {
        userId: 1,
        email: 'admin@example.com',
        isAdmin: true
      };
      
      adminMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    test('should allow access for user with admin role', () => {
      req.user = {
        userId: 1,
        email: 'admin@example.com',
        role: 'admin'
      };
      
      adminMiddleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    test('should deny access for regular user', () => {
      req.user = {
        userId: 1,
        email: 'user@example.com',
        isAdmin: false,
        role: 'user'
      };
      
      adminMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Admin access required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should deny access when no user is set', () => {
      req.user = null;
      
      adminMiddleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    test('should set user with valid token', () => {
      const token = jwt.sign(
        { userId: 1, email: 'test@example.com' },
        process.env.JWT_SECRET
      );
      
      req.headers.authorization = `Bearer ${token}`;
      
      optionalAuthMiddleware(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(1);
      expect(next).toHaveBeenCalled();
    });

    test('should set user to null without token', () => {
      optionalAuthMiddleware(req, res, next);
      
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    test('should set user to null with invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';
      
      optionalAuthMiddleware(req, res, next);
      
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    test('should continue execution even with malformed header', () => {
      req.headers.authorization = 'InvalidFormat';
      
      optionalAuthMiddleware(req, res, next);
      
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });
});