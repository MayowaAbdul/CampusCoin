const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get Personalized Saving Tips (Ranked by Potential Savings Impact)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const currentMonth = new Date().toISOString().substring(0, 7);

    // Get user details
    const user = await dbGet('SELECT * FROM users WHERE user_id = ?', [userId]);

    // Check existing saved/pinned/dismissed tips
    const existingTips = await dbAll('SELECT * FROM saved_tips WHERE user_id = ? AND status != "dismissed"', [userId]);

    // Dynamic tip generation based on transaction history
    const foodSpentRow = await dbGet(
      `SELECT SUM(amount) as total FROM transactions
       WHERE user_id = ? AND date LIKE ? AND type = 'expense' AND category_id IN
       (SELECT category_id FROM categories WHERE name = 'Food')`,
      [userId, `${currentMonth}%`]
    );
    const foodSpent = foodSpentRow && foodSpentRow.total ? parseFloat(foodSpentRow.total) : 0;

    const subSpentRow = await dbGet(
      `SELECT SUM(amount) as total FROM transactions
       WHERE user_id = ? AND date LIKE ? AND type = 'expense' AND category_id IN
       (SELECT category_id FROM categories WHERE name = 'Subscriptions')`,
      [userId, `${currentMonth}%`]
    );
    const subSpent = subSpentRow && subSpentRow.total ? parseFloat(subSpentRow.total) : 0;

    const generatedTips = [];

    if (foodSpent > 100) {
      generatedTips.push({
        title: 'Switch to Campus Meal Plan & Cook in Hostel',
        content: `You spent $${foodSpent.toFixed(
          2
        )} on food this month. Meal prepping 3 days a week or buying canteen combo passes can save up to 30%.`,
        category_name: 'Food',
        potential_savings: parseFloat((foodSpent * 0.3).toFixed(2))
      });
    }

    if (subSpent > 10) {
      generatedTips.push({
        title: 'Audit & Share Student Subscriptions',
        content: `You are spending $${subSpent.toFixed(
          2
        )}/mo on streaming and software subscriptions. Use Spotify Student Bundle or share multi-user plans.`,
        category_name: 'Subscriptions',
        potential_savings: 8.0
      });
    }

    // Default student tip if few generated
    generatedTips.push({
      title: 'Leverage Student ID Discounts',
      content: 'Always ask for student pricing on public transport, software licenses, book stores, and cinema tickets.',
      category_name: 'Academics',
      potential_savings: 25.0
    });

    generatedTips.push({
      title: 'Automate 10% Allowance Deposit',
      content: `Setting aside 10% of your baseline allowance ($${((user ? user.monthly_allowance_baseline : 500) * 0.1).toFixed(
        2
      )}) at the start of the month guarantees your savings goal.`,
      category_name: 'Allowance',
      potential_savings: parseFloat(((user ? user.monthly_allowance_baseline : 500) * 0.1).toFixed(2))
    });

    // Store new tips in DB if not already present
    for (const tip of generatedTips) {
      const exists = existingTips.find((t) => t.title === tip.title);
      if (!exists) {
        const result = await dbRun(
          `INSERT INTO saved_tips (user_id, title, content, category_name, potential_savings, status)
           VALUES (?, ?, ?, ?, ?, 'active')`,
          [userId, tip.title, tip.content, tip.category_name, tip.potential_savings]
        );
        existingTips.push({
          tip_id: result.id,
          user_id: userId,
          title: tip.title,
          content: tip.content,
          category_name: tip.category_name,
          potential_savings: tip.potential_savings,
          status: 'active'
        });
      }
    }

    // Rank tips by potential savings impact ($ desc), pinned tips first
    existingTips.sort((a, b) => {
      if (a.status === 'pinned' && b.status !== 'pinned') return -1;
      if (b.status === 'pinned' && a.status !== 'pinned') return 1;
      return b.potential_savings - a.potential_savings;
    });

    res.json(existingTips);
  } catch (err) {
    console.error('Fetch tips error:', err);
    res.status(500).json({ error: 'Failed to generate saving tips' });
  }
});

// Update Tip Status (Pin, Dismiss, Bookmark, Active)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tipId = req.params.id;
    const { status } = req.body; // 'active', 'pinned', 'dismissed', 'bookmarked'

    if (!['active', 'pinned', 'dismissed', 'bookmarked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid tip status' });
    }

    await dbRun('UPDATE saved_tips SET status = ? WHERE tip_id = ? AND user_id = ?', [status, tipId, userId]);
    res.json({ message: 'Tip status updated successfully', status });
  } catch (err) {
    console.error('Update tip status error:', err);
    res.status(500).json({ error: 'Failed to update tip status' });
  }
});

module.exports = router;
