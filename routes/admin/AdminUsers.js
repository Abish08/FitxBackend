// routes/admin/AdminUsers.js
import express from 'express';
import { User } from '../../config/database.js';
import { adminOnly } from '../../middleware/admin.js';

const router = express.Router();


 
router.get('/users', adminOnly, async (req, res) => {
  try {
    console.log('📎 [AdminUsers] Fetching all users...');
    
    const users = await User.findAll({
      attributes: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'created_at',
        'updated_at'
      ],
      order: [['created_at', 'DESC']]
    });

    console.log(`🗄️ [AdminUsers] Found ${users.length} users`);

    const userData = users.map(user => {
      const plain = user.get({ plain: true });
      return {
        ...plain,
        createdAt: plain.created_at,
        updatedAt: plain.updated_at
      };
    });

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: { users: userData }
    });
  } catch (error) {
    console.error(' Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});


router.put('/users/:id/role', adminOnly, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role. Use "user" or "admin".'
    });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      data: { id: user.id, role: user.role }
    });
  } catch (error) {
    console.error(' Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
});


router.delete('/users/:id', adminOnly, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(' Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

export default router;