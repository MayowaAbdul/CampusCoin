const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { dbAll, dbGet, dbRun } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// 1. Get Transactions with filtering & search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { month, startDate, endDate, categoryId, type, search } = req.query;

    let query = `
      SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.category_id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (month) {
      query += ` AND t.date LIKE ?`;
      params.push(`${month}%`);
    }
    if (startDate && endDate) {
      query += ` AND t.date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
    if (categoryId) {
      query += ` AND t.category_id = ?`;
      params.push(categoryId);
    }
    if (type) {
      query += ` AND t.type = ?`;
      params.push(type);
    }
    if (search) {
      query += ` AND (t.description LIKE ? OR c.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.date DESC, t.transaction_id DESC`;

    const transactions = await dbAll(query, params);
    res.json(transactions);
  } catch (err) {
    console.error('Fetch transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// 2. Add New Transaction (Quick-add form)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { category_id, amount, type, description, is_recurring, recurrence_period, date, ai_suggested_category_id } = req.body;

    if (!category_id || !amount || !type || !date) {
      return res.status(400).json({ error: 'Category, amount, type, and date are required' });
    }

    const result = await dbRun(
      `INSERT INTO transactions (user_id, category_id, amount, type, description, ai_suggested_category_id, is_recurring, recurrence_period, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        category_id,
        parseFloat(amount),
        type,
        description || '',
        ai_suggested_category_id || null,
        is_recurring ? 1 : 0,
        recurrence_period || null,
        date
      ]
    );

    // If student corrected AI suggestion or added description, learn from it
    if (description && description.length > 2) {
      const words = description.toLowerCase().split(/\s+/);
      const significantWord = words.find((w) => w.length > 3 && !['with', 'from', 'paid', 'for', 'the', 'and'].includes(w));
      if (significantWord) {
        await dbRun(
          `INSERT OR REPLACE INTO ai_learnings (user_id, keyword, category_id) VALUES (?, ?, ?)`,
          [userId, significantWord, category_id]
        );
      }
    }

    // Log recent activity
    await dbRun(`INSERT INTO activity_logs (user_id, transaction_id, action_type) VALUES (?, ?, 'created')`, [userId, result.id]);

    const created = await dbGet(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t JOIN categories c ON t.category_id = c.category_id WHERE t.transaction_id = ?`,
      [result.id]
    );

    res.status(201).json(created);
  } catch (err) {
    console.error('Add transaction error:', err);
    res.status(500).json({ error: 'Failed to add transaction' });
  }
});

// 3. Edit Transaction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const txId = req.params.id;
    const { category_id, amount, type, description, is_recurring, recurrence_period, date } = req.body;

    const existing = await dbGet('SELECT * FROM transactions WHERE transaction_id = ? AND user_id = ?', [txId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    await dbRun(
      `UPDATE transactions SET category_id = ?, amount = ?, type = ?, description = ?, is_recurring = ?, recurrence_period = ?, date = ?
       WHERE transaction_id = ? AND user_id = ?`,
      [
        category_id || existing.category_id,
        parseFloat(amount) || existing.amount,
        type || existing.type,
        description !== undefined ? description : existing.description,
        is_recurring !== undefined ? (is_recurring ? 1 : 0) : existing.is_recurring,
        recurrence_period || existing.recurrence_period,
        date || existing.date,
        txId,
        userId
      ]
    );

    // Log edit action for System Intelligence
    await dbRun(`INSERT INTO activity_logs (user_id, transaction_id, action_type) VALUES (?, ?, 'edited')`, [userId, txId]);

    const updated = await dbGet(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM transactions t JOIN categories c ON t.category_id = c.category_id WHERE t.transaction_id = ?`,
      [txId]
    );

    res.json(updated);
  } catch (err) {
    console.error('Edit transaction error:', err);
    res.status(500).json({ error: 'Failed to edit transaction' });
  }
});

// 4. Delete Transaction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const txId = req.params.id;

    const existing = await dbGet('SELECT * FROM transactions WHERE transaction_id = ? AND user_id = ?', [txId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    await dbRun('DELETE FROM activity_logs WHERE transaction_id = ?', [txId]);
    await dbRun('DELETE FROM transactions WHERE transaction_id = ?', [txId]);

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// 5. CSV Bulk Import with AI Batch Categorization Preview
router.post('/csv-import', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const userId = req.user.user_id;
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a CSV file' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const userCategories = await dbAll(
      'SELECT category_id, name, type FROM categories WHERE is_default = 1 OR user_id = ?',
      [userId]
    );
    const learnings = await dbAll('SELECT * FROM ai_learnings WHERE user_id = ?', [userId]);

    const previewList = [];
    const createdTx = [];

    for (const row of records) {
      // Common CSV column names: date, amount, type, description, category
      const date = row.date || row.Date || new Date().toISOString().split('T')[0];
      const rawAmount = row.amount || row.Amount || '0';
      const amount = Math.abs(parseFloat(rawAmount.replace(/[^0-9.-]+/g, '')) || 0);
      const desc = row.description || row.Description || row.memo || row.Note || 'CSV Import';
      const rawType = (row.type || row.Type || (parseFloat(rawAmount) < 0 ? 'expense' : 'expense')).toLowerCase();
      const type = rawType.includes('inc') ? 'income' : 'expense';

      let matchedCat = userCategories.find(
        (c) => c.name.toLowerCase() === (row.category || '').toLowerCase() && c.type === type
      );

      let aiSuggestedCatId = null;

      if (!matchedCat && desc) {
        // AI Learning match
        const lowerDesc = desc.toLowerCase();
        const learning = learnings.find((l) => lowerDesc.includes(l.keyword.toLowerCase()));
        if (learning) {
          matchedCat = userCategories.find((c) => c.category_id === learning.category_id);
          if (matchedCat) aiSuggestedCatId = matchedCat.category_id;
        }
      }

      // Keyword fallbacks
      if (!matchedCat && desc) {
        const lowerDesc = desc.toLowerCase();
        if (lowerDesc.includes('cafe') || lowerDesc.includes('canteen') || lowerDesc.includes('food') || lowerDesc.includes('pizza') || lowerDesc.includes('lunch')) {
          matchedCat = userCategories.find((c) => c.name === 'Food');
        } else if (lowerDesc.includes('bus') || lowerDesc.includes('uber') || lowerDesc.includes('subway') || lowerDesc.includes('ride')) {
          matchedCat = userCategories.find((c) => c.name === 'Transport');
        } else if (lowerDesc.includes('rent') || lowerDesc.includes('dorm') || lowerDesc.includes('hostel')) {
          matchedCat = userCategories.find((c) => c.name === 'Hostel/Rent');
        } else if (lowerDesc.includes('book') || lowerDesc.includes('tuition') || lowerDesc.includes('exam')) {
          matchedCat = userCategories.find((c) => c.name === 'Academics');
        } else if (lowerDesc.includes('spotify') || lowerDesc.includes('netflix') || lowerDesc.includes('sub')) {
          matchedCat = userCategories.find((c) => c.name === 'Subscriptions');
        } else if (lowerDesc.includes('allowance') || lowerDesc.includes('parent')) {
          matchedCat = userCategories.find((c) => c.name === 'Allowance');
        } else if (lowerDesc.includes('job') || lowerDesc.includes('salary') || lowerDesc.includes('work')) {
          matchedCat = userCategories.find((c) => c.name === 'Part-time Job');
        }
      }

      if (!matchedCat) {
        matchedCat = userCategories.find((c) => c.name === (type === 'income' ? 'Other Income' : 'Miscellaneous')) || userCategories[0];
      }

      if (req.body.previewOnly === 'true') {
        previewList.push({
          date,
          amount,
          type,
          description: desc,
          category_id: matchedCat.category_id,
          category_name: matchedCat.name,
          is_ai_suggested: !!aiSuggestedCatId
        });
      } else {
        const resInsert = await dbRun(
          `INSERT INTO transactions (user_id, category_id, amount, type, description, ai_suggested_category_id, date)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userId, matchedCat.category_id, amount, type, desc, ai_suggested_category_id, date]
        );
        createdTx.push(resInsert.id);
      }
    }

    if (req.body.previewOnly === 'true') {
      res.json({ totalParsed: records.length, preview: previewList });
    } else {
      res.json({ message: `Successfully imported ${createdTx.length} transactions!`, importedCount: createdTx.length });
    }
  } catch (err) {
    console.error('CSV import error:', err);
    res.status(500).json({ error: 'Failed to process CSV file. Ensure valid CSV format.' });
  }
});

// 6. Get Activity Log (Recently viewed and edited transactions tracer)
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const logs = await dbAll(
      `SELECT a.log_id, a.action_type, a.timestamp, t.transaction_id, t.amount, t.description, t.date, c.name as category_name, c.icon as category_icon, c.color as category_color
       FROM activity_logs a
       JOIN transactions t ON a.transaction_id = t.transaction_id
       JOIN categories c ON t.category_id = c.category_id
       WHERE a.user_id = ?
       ORDER BY a.timestamp DESC
       LIMIT 10`,
      [userId]
    );
    res.json(logs);
  } catch (err) {
    console.error('Fetch activity error:', err);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

module.exports = router;
