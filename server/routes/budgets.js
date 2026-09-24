const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get budgets for a given month with spending consumption & alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const month = req.query.month || new Date().toISOString().substring(0, 7); // YYYY-MM

    const budgets = await dbAll(
      `SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM budgets b
       JOIN categories c ON b.category_id = c.category_id
       WHERE b.user_id = ? AND b.month = ?`,
      [userId, month]
    );

    // Calculate real-time consumption per budget category
    const result = [];
    for (const b of budgets) {
      const spentRow = await dbGet(
        `SELECT SUM(amount) as total FROM transactions
         WHERE user_id = ? AND category_id = ? AND date LIKE ? AND type = 'expense'`,
        [userId, b.category_id, `${month}%`]
      );

      const spentAmount = spentRow && spentRow.total ? parseFloat(spentRow.total) : 0.0;
      const limitAmount = parseFloat(b.limit_amount);
      const percentage = limitAmount > 0 ? Math.round((spentAmount / limitAmount) * 100) : 0;

      let alertStatus = 'ok'; // 'ok', 'warning' (>=80%), 'exceeded' (>100%)
      if (percentage >= 100) {
        alertStatus = 'exceeded';
      } else if (percentage >= 80) {
        alertStatus = 'warning';
      }

      result.push({
        ...b,
        spent_amount: spentAmount,
        remaining_amount: Math.max(0, limitAmount - spentAmount),
        percentage,
        alert_status: alertStatus
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Fetch budgets error:', err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
});

// Set or Update Budget Goal per Category
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { category_id, limit_amount, month } = req.body;

    if (!category_id || limit_amount === undefined) {
      return res.status(400).json({ error: 'Category ID and limit amount are required' });
    }

    const targetMonth = month || new Date().toISOString().substring(0, 7);

    const existing = await dbGet(
      'SELECT budget_id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ?',
      [userId, category_id, targetMonth]
    );

    if (existing) {
      await dbRun('UPDATE budgets SET limit_amount = ? WHERE budget_id = ?', [parseFloat(limit_amount), existing.budget_id]);
    } else {
      await dbRun(
        `INSERT INTO budgets (user_id, category_id, month, limit_amount) VALUES (?, ?, ?, ?)`,
        [userId, category_id, targetMonth, parseFloat(limit_amount)]
      );
    }

    res.json({ message: 'Budget limit set successfully' });
  } catch (err) {
    console.error('Save budget error:', err);
    res.status(500).json({ error: 'Failed to save budget goal' });
  }
});

// Delete Budget Goal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const budgetId = req.params.id;

    await dbRun('DELETE FROM budgets WHERE budget_id = ? AND user_id = ?', [budgetId, userId]);
    res.json({ message: 'Budget deleted successfully' });
  } catch (err) {
    console.error('Delete budget error:', err);
    res.status(500).json({ error: 'Failed to delete budget' });
  }
});

module.exports = router;
