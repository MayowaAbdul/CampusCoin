const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { dbAll, dbGet, dbRun } = require('../database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Require authentication and Admin role for all admin endpoints
router.use(authenticateToken);
router.use(requireAdmin);

// 1. System Usage Statistics
router.get('/stats', async (req, res) => {
  try {
    const activeUsersRow = await dbGet('SELECT COUNT(*) as count FROM users WHERE role = "student" AND is_active = 1');
    const totalTxsRow = await dbGet('SELECT COUNT(*) as count FROM transactions');
    const volumeRow = await dbGet(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM transactions
    `);

    const topCategories = await dbAll(`
      SELECT c.name, c.type, c.color, COUNT(t.transaction_id) as tx_count, SUM(t.amount) as total_amount
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      GROUP BY c.category_id, c.name, c.type, c.color
      ORDER BY tx_count DESC
      LIMIT 5
    `);

    res.json({
      activeUsers: activeUsersRow ? activeUsersRow.count : 0,
      totalTransactions: totalTxsRow ? totalTxsRow.count : 0,
      totalIncomeVolume: volumeRow && volumeRow.total_income ? parseFloat(volumeRow.total_income) : 0,
      totalExpenseVolume: volumeRow && volumeRow.total_expense ? parseFloat(volumeRow.total_expense) : 0,
      topCategories
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// 2. Manage Users
router.get('/users', async (req, res) => {
  try {
    const users = await dbAll(
      `SELECT u.user_id, u.name, u.email, u.role, u.academic_year, u.monthly_allowance_baseline, u.monthly_savings_goal, u.is_active, u.created_at,
              (SELECT COUNT(*) FROM transactions t WHERE t.user_id = u.user_id) as total_transactions
       FROM users u
       ORDER BY u.created_at DESC`
    );
    res.json(users);
  } catch (err) {
    console.error('Admin fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Toggle Disable/Enable User
router.put('/users/:id/toggle', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await dbGet('SELECT is_active, role FROM users WHERE user_id = ?', [userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot disable administrator account' });
    }

    const newStatus = user.is_active ? 0 : 1;
    await dbRun('UPDATE users SET is_active = ? WHERE user_id = ?', [newStatus, userId]);

    res.json({ message: `User status changed to ${newStatus ? 'active' : 'disabled'}`, is_active: newStatus });
  } catch (err) {
    console.error('Toggle user status error:', err);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Reset User Password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const userId = req.params.id;
    const defaultPassword = 'password123';
    const hash = await bcrypt.hash(defaultPassword, 10);

    await dbRun('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, userId]);
    res.json({ message: `Password for user ID ${userId} has been reset to "${defaultPassword}"` });
  } catch (err) {
    console.error('Admin reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// 3. Manage Default Categories (System-Wide)
router.get('/default-categories', async (req, res) => {
  try {
    const categories = await dbAll('SELECT * FROM categories WHERE is_default = 1 ORDER BY type, name');
    res.json(categories);
  } catch (err) {
    console.error('Admin fetch default categories error:', err);
    res.status(500).json({ error: 'Failed to fetch default categories' });
  }
});

router.post('/default-categories', async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const result = await dbRun(
      `INSERT INTO categories (name, type, is_default, icon, color) VALUES (?, ?, 1, ?, ?)`,
      [name, type, icon || 'Tag', color || '#6366f1']
    );

    const created = await dbGet('SELECT * FROM categories WHERE category_id = ?', [result.id]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Admin add default category error:', err);
    res.status(500).json({ error: 'Failed to add default category' });
  }
});

router.delete('/default-categories/:id', async (req, res) => {
  try {
    const categoryId = req.params.id;
    await dbRun('DELETE FROM categories WHERE category_id = ? AND is_default = 1', [categoryId]);
    res.json({ message: 'Default category removed successfully' });
  } catch (err) {
    console.error('Admin delete default category error:', err);
    res.status(500).json({ error: 'Failed to delete default category' });
  }
});

// 4. System Announcements & Tip Templates
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await dbAll('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(announcements);
  } catch (err) {
    console.error('Admin fetch announcements error:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, content, type } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await dbRun(
      `INSERT INTO announcements (title, content, type, created_by) VALUES (?, ?, ?, ?)`,
      [title, content, type || 'info', req.user.user_id]
    );

    const created = await dbGet('SELECT * FROM announcements WHERE announcement_id = ?', [result.id]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Admin post announcement error:', err);
    res.status(500).json({ error: 'Failed to publish announcement' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const announcementId = req.params.id;
    await dbRun('DELETE FROM announcements WHERE announcement_id = ?', [announcementId]);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Admin delete announcement error:', err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
