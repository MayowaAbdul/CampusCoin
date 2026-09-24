const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 1. Category-wise Monthly Spending Summary & Balance
router.get('/monthly-summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const month = req.query.month || new Date().toISOString().substring(0, 7);

    // Total Income & Total Expenses for month
    const totals = await dbAll(
      `SELECT type, SUM(amount) as total FROM transactions
       WHERE user_id = ? AND date LIKE ? GROUP BY type`,
      [userId, `${month}%`]
    );

    let totalIncome = 0;
    let totalExpense = 0;
    totals.forEach((t) => {
      if (t.type === 'income') totalIncome = parseFloat(t.total);
      if (t.type === 'expense') totalExpense = parseFloat(t.total);
    });

    // Category-wise Breakdown
    const categories = await dbAll(
      `SELECT c.category_id, c.name, c.color, c.icon, SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.category_id
       WHERE t.user_id = ? AND t.date LIKE ? AND t.type = 'expense'
       GROUP BY c.category_id, c.name, c.color, c.icon
       ORDER BY total DESC`,
      [userId, `${month}%`]
    );

    const breakdown = categories.map((c) => ({
      category_id: c.category_id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      total: parseFloat(c.total),
      percentage: totalExpense > 0 ? Math.round((parseFloat(c.total) / totalExpense) * 100) : 0
    }));

    res.json({
      month,
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      breakdown,
      topCategory: breakdown.length > 0 ? breakdown[0] : null
    });
  } catch (err) {
    console.error('Monthly summary error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly summary report' });
  }
});

// 2. 6-Month Income vs Expense Trend
router.get('/six-month-trend', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toISOString().substring(0, 7);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });

      const incomeRow = await dbGet(
        `SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND date LIKE ? AND type = 'income'`,
        [userId, `${monthStr}%`]
      );
      const expenseRow = await dbGet(
        `SELECT SUM(amount) as total FROM transactions WHERE user_id = ? AND date LIKE ? AND type = 'expense'`,
        [userId, `${monthStr}%`]
      );

      result.push({
        month: monthStr,
        label: monthLabel,
        income: incomeRow && incomeRow.total ? parseFloat(incomeRow.total) : 0,
        expense: expenseRow && expenseRow.total ? parseFloat(expenseRow.total) : 0,
        savings: (incomeRow && incomeRow.total ? parseFloat(incomeRow.total) : 0) - (expenseRow && expenseRow.total ? parseFloat(expenseRow.total) : 0)
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Six month trend error:', err);
    res.status(500).json({ error: 'Failed to fetch 6-month trend report' });
  }
});

// 3. Daily and Weekly Summaries for Current Month
router.get('/daily-weekly', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const month = req.query.month || new Date().toISOString().substring(0, 7);

    // Daily breakdown
    const daily = await dbAll(
      `SELECT date, type, SUM(amount) as total FROM transactions
       WHERE user_id = ? AND date LIKE ? GROUP BY date, type ORDER BY date ASC`,
      [userId, `${month}%`]
    );

    // Group into 4 weeks of the month
    const weekly = [
      { week: 'Week 1 (Days 1-7)', income: 0, expense: 0 },
      { week: 'Week 2 (Days 8-14)', income: 0, expense: 0 },
      { week: 'Week 3 (Days 15-21)', income: 0, expense: 0 },
      { week: 'Week 4+ (Days 22+)', income: 0, expense: 0 }
    ];

    daily.forEach((d) => {
      const dayNum = parseInt(d.date.split('-')[2], 10);
      let weekIdx = 0;
      if (dayNum >= 8 && dayNum <= 14) weekIdx = 1;
      else if (dayNum >= 15 && dayNum <= 21) weekIdx = 2;
      else if (dayNum >= 22) weekIdx = 3;

      if (d.type === 'income') weekly[weekIdx].income += parseFloat(d.total);
      if (d.type === 'expense') weekly[weekIdx].expense += parseFloat(d.total);
    });

    res.json({ daily, weekly });
  } catch (err) {
    console.error('Daily weekly report error:', err);
    res.status(500).json({ error: 'Failed to fetch daily and weekly report' });
  }
});

// 4. Upcoming Month Forecast (System Intelligence)
router.get('/forecast', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const pastMonths = await dbAll(
      `SELECT strftime('%Y-%m', date) as m, type, SUM(amount) as total
       FROM transactions WHERE user_id = ?
       GROUP BY m, type ORDER BY m DESC LIMIT 6`,
      [userId]
    );

    let totalExpensesSum = 0;
    let monthCount = 0;
    const monthSet = new Set();

    pastMonths.forEach((p) => {
      if (p.type === 'expense') {
        totalExpensesSum += parseFloat(p.total);
        monthSet.add(p.m);
      }
    });

    monthCount = monthSet.size || 1;
    const forecastedExpense = Math.round((totalExpensesSum / monthCount) * 1.05); // Slight inflation/seasonal factor

    res.json({
      forecastedExpense,
      averageMonthlyExpense: Math.round(totalExpensesSum / monthCount),
      basedOnMonthsCount: monthCount,
      advice: `Based on your recent history, projected expenses for next month are around $${forecastedExpense}.`
    });
  } catch (err) {
    console.error('Forecast error:', err);
    res.status(500).json({ error: 'Failed to generate forecast' });
  }
});

// 5. Unusually Large & Duplicate Transaction Detection (System Intelligence)
router.get('/anomalies', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Calculate user's average transaction amount
    const avgRow = await dbGet(
      'SELECT AVG(amount) as avg_amt, MAX(amount) as max_amt FROM transactions WHERE user_id = ? AND type = "expense"',
      [userId]
    );
    const avgAmt = avgRow && avgRow.avg_amt ? parseFloat(avgRow.avg_amt) : 25;

    // Large transactions (amount > 3x average)
    const largeTxs = await dbAll(
      `SELECT t.*, c.name as category_name
       FROM transactions t JOIN categories c ON t.category_id = c.category_id
       WHERE t.user_id = ? AND t.type = 'expense' AND t.amount > ?
       ORDER BY t.amount DESC LIMIT 5`,
      [userId, avgAmt * 3]
    );

    // Potential duplicates (same amount, category, date, and description)
    const duplicates = await dbAll(
      `SELECT amount, date, description, category_id, COUNT(*) as count
       FROM transactions WHERE user_id = ?
       GROUP BY amount, date, description, category_id
       HAVING count > 1`,
      [userId]
    );

    res.json({ largeTransactions: largeTxs, duplicates });
  } catch (err) {
    console.error('Anomalies detection error:', err);
    res.status(500).json({ error: 'Failed to scan transaction anomalies' });
  }
});

module.exports = router;
