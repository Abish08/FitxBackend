// import jwt from 'jsonwebtoken';
// import { User } from '../config/database.js';

// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: 'Access token required'
//     });
//   }

//   jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, user) => {
//     if (err) {
//       return res.status(403).json({
//         success: false,
//         message: 'Invalid or expired token'
//       });
//     }

//     try {
//       const dbUser = await User.findByPk(user.id);
//       if (!dbUser) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }
//       req.user = dbUser.get({ plain: true });
//       next();
//     } catch (dbError) {
//       console.error('Database error in auth middleware:', dbError);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error during authentication'
//       });
//     }
//   });
// };

// // ✅ Named export
// export { authenticateToken };


// import jwt from 'jsonwebtoken';
// import { User } from '../config/database.js';

// // 🔐 Authenticate user (JWT verification)
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: 'Access token required'
//     });
//   }

//   jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', async (err, user) => {
//     if (err) {
//       return res.status(403).json({
//         success: false,
//         message: 'Invalid or expired token'
//       });
//     }

//     try {
//       const dbUser = await User.findByPk(user.id);
//       if (!dbUser) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found'
//         });
//       }
//       req.user = dbUser.get({ plain: true });
//       next();
//     } catch (dbError) {
//       console.error('Database error in auth middleware:', dbError);
//       res.status(500).json({
//         success: false,
//         message: 'Internal server error during authentication'
//       });
//     }
//   });
// };

// // 👮‍♂️ Admin-only middleware
// const adminOnly = (req, res, next) => {
//   if (!req.user) {
//     return res.status(401).json({
//       success: false,
//       message: 'Unauthorized: No user authenticated'
//     });
//   }

//   if (req.user.role !== 'admin') {
//     return res.status(403).json({
//       success: false,
//       message: 'Forbidden: Admin access required'
//     });
//   }

//   next();
// };

// // ✅ Export both
// export { authenticateToken, adminOnly };



// middleware/admin.js
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: No user authenticated'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin access required'
    });
  }

  next();
};

export { adminOnly };

