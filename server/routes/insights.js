const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get or Generate Monthly AI Spending Insights
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const targetMonth = req.query.month || new Date().toISOString().substring(0, 7);

    // Check if insight already generated for this month
    let existingInsight = await dbGet(
      'SELECT * FROM insights WHERE user_id = ? AND month = ? ORDER BY insight_id DESC LIMIT 1',
      [userId, targetMonth]
    );

    if (existingInsight && req.query.forceRegenerate !== 'true') {
      return res.json(existingInsight);
    }

    // Perform analysis on transactions
    const currentTxs = await dbAll(
      `SELECT t.*, c.name as category_name
       FROM transactions t JOIN categories c ON t.category_id = c.category_id
       WHERE t.user_id = ? AND t.date LIKE ? AND t.type = 'expense'`,
      [userId, `${targetMonth}%`]
    );

    // Historical 3 months spending
    const prevMonthDate = new Date(targetMonth + '-01');
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 3);
    const threeMonthsAgo = prevMonthDate.toISOString().substring(0, 7);

    const histTxs = await dbAll(
      `SELECT t.*, c.name as category_name
       FROM transactions t JOIN categories c ON t.category_id = c.category_id
       WHERE t.user_id = ? AND t.date >= ? AND t.date < ? AND t.type = 'expense'`,
      [userId, `${threeMonthsAgo}-01`, `${targetMonth}-01`]
    );

    // Aggregate category totals
    const currentCatTotals = {};
    let totalSpentCurrent = 0;
    currentTxs.forEach((tx) => {
      currentCatTotals[tx.category_name] = (currentCatTotals[tx.category_name] || 0) + tx.amount;
      totalSpentCurrent += tx.amount;
    });

    const histCatTotals = {};
    histTxs.forEach((tx) => {
      histCatTotals[tx.category_name] = (histCatTotals[tx.category_name] || 0) + tx.amount;
    });

    // Find highest growth category compared to monthly average
    let maxGrowth = 0;
    let flaggedCategory = null;

    Object.keys(currentCatTotals).forEach((catName) => {
      const currentVal = currentCatTotals[catName];
      const histAvg = (histCatTotals[catName] || 0) / 3;
      if (histAvg > 0) {
        const growth = ((currentVal - histAvg) / histAvg) * 100;
        if (growth > maxGrowth && growth >= 15) {
          maxGrowth = Math.round(growth);
          flaggedCategory = catName;
        }
      } else if (currentVal > 50) {
        maxGrowth = 100;
        flaggedCategory = catName;
      }
    });

    // Generate narrative summary & actionable tip
    let summaryText = '';
    let tipText = '';

    if (totalSpentCurrent === 0) {
      summaryText = `You have not logged any expenses for ${targetMonth} yet. Keep recording your daily canteen snacks and dorm expenses to receive personalized guidance!`;
      tipText = 'Log at least 3 transactions to unlock detailed spending analysis.';
    } else if (flaggedCategory && maxGrowth > 0) {
      summaryText = `In ${targetMonth}, your total spending reached $${totalSpentCurrent.toFixed(
        2
      )}. Our AI detected a notable spike in your ${flaggedCategory} spending, which rose by ${maxGrowth}% compared to your prior historical trend.`;
      tipText = `Consider setting a weekly cap of $${(currentCatTotals[flaggedCategory] * 0.7 / 4).toFixed(
        2
      )} on ${flaggedCategory} or substituting with lower-cost campus dining alternatives.`;
    } else {
      const topCat = Object.keys(currentCatTotals).reduce(
        (a, b) => (currentCatTotals[a] > currentCatTotals[b] ? a : b),
        Object.keys(currentCatTotals)[0] || 'Miscellaneous'
      );
      summaryText = `In ${targetMonth}, your total spending was $${totalSpentCurrent.toFixed(
        2
      )}. Your primary expenditure was in ${topCat}, accounting for ${Math.round(
        (currentCatTotals[topCat] / totalSpentCurrent) * 100
      )}% of your total expenses. Overall spending is well balanced!`;
      tipText = `Great discipline! Try transferring your remaining monthly balance into your campus savings account.`;
    }

    // Store in DB
    const result = await dbRun(
      `INSERT INTO insights (user_id, month, summary_text, tip_text, flagged_category_name, growth_percentage)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, targetMonth, summaryText, tipText, flaggedCategory, maxGrowth]
    );

    const generated = await dbGet('SELECT * FROM insights WHERE insight_id = ?', [result.id]);
    res.json(generated);
  } catch (err) {
    console.error('Insight generation error:', err);
    res.status(500).json({ error: 'Failed to generate monthly spending insight' });
  }
});

// Insight History timeline
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const history = await dbAll('SELECT * FROM insights WHERE user_id = ? ORDER BY month DESC, insight_id DESC', [userId]);
    res.json(history);
  } catch (err) {
    console.error('Insight history error:', err);
    res.status(500).json({ error: 'Failed to fetch insight history' });
  }
});

// Bookmark/Unbookmark Insight
router.put('/:id/bookmark', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const insightId = req.params.id;

    const insight = await dbGet('SELECT is_bookmarked FROM insights WHERE insight_id = ? AND user_id = ?', [
      insightId,
      userId
    ]);
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }

    const newBookmarkState = insight.is_bookmarked ? 0 : 1;
    await dbRun('UPDATE insights SET is_bookmarked = ? WHERE insight_id = ?', [newBookmarkState, insightId]);

    res.json({ message: 'Bookmark status updated', is_bookmarked: newBookmarkState });
  } catch (err) {
    console.error('Bookmark insight error:', err);
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

module.exports = router;
