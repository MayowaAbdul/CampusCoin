const express = require('express');
const router = express.Router();
const { dbAll, dbGet } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Interactive Real-Time AI Category Predictor
router.post('/predict-category', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { description, type } = req.body; // type: 'expense' or 'income'

    if (!description || description.trim().length === 0) {
      return res.json({ suggested_category_id: null, suggested_category_name: null, confidence: 0 });
    }

    const text = description.toLowerCase().trim();
    const categories = await dbAll('SELECT * FROM categories WHERE is_default = 1 OR user_id = ?', [userId]);
    const learnings = await dbAll('SELECT * FROM ai_learnings WHERE user_id = ?', [userId]);

    // 1. Check User AI Learnings (Self-learning from corrections)
    const matchLearning = learnings.find((l) => text.includes(l.keyword.toLowerCase()));
    if (matchLearning) {
      const cat = categories.find((c) => c.category_id === matchLearning.category_id);
      if (cat) {
        return res.json({
          suggested_category_id: cat.category_id,
          suggested_category_name: cat.name,
          confidence: 0.95,
          reason: 'Matched your previous custom categorization'
        });
      }
    }

    // 2. Keyword Classification Rules
    const targetType = type || 'expense';
    let suggestedCat = null;
    let confidence = 0;
    let reason = 'NLP Keyword Pattern Match';

    if (targetType === 'income') {
      if (text.includes('allowance') || text.includes('pocket') || text.includes('parents') || text.includes('family') || text.includes('dad') || text.includes('mom')) {
        suggestedCat = categories.find((c) => c.name === 'Allowance');
        confidence = 0.9;
      } else if (text.includes('job') || text.includes('work') || text.includes('shift') || text.includes('stipend') || text.includes('ta') || text.includes('tutor')) {
        suggestedCat = categories.find((c) => c.name === 'Part-time Job');
        confidence = 0.9;
      } else if (text.includes('scholarship') || text.includes('grant') || text.includes('award') || text.includes('bursary')) {
        suggestedCat = categories.find((c) => c.name === 'Scholarship');
        confidence = 0.95;
      } else if (text.includes('gift') || text.includes('birthday') || text.includes('present')) {
        suggestedCat = categories.find((c) => c.name === 'Gift');
        confidence = 0.85;
      }
    } else {
      if (text.includes('cafe') || text.includes('canteen') || text.includes('dining') || text.includes('food') || text.includes('coffee') || text.includes('starbucks') || text.includes('pizza') || text.includes('burger') || text.includes('groceries')) {
        suggestedCat = categories.find((c) => c.name === 'Food');
        confidence = 0.92;
      } else if (text.includes('bus') || text.includes('uber') || text.includes('lyft') || text.includes('subway') || text.includes('train') || text.includes('metro') || text.includes('cab') || text.includes('gas') || text.includes('fare')) {
        suggestedCat = categories.find((c) => c.name === 'Transport');
        confidence = 0.88;
      } else if (text.includes('rent') || text.includes('dorm') || text.includes('hostel') || text.includes('electricity') || text.includes('room') || text.includes('housing')) {
        suggestedCat = categories.find((c) => c.name === 'Hostel/Rent');
        confidence = 0.94;
      } else if (text.includes('book') || text.includes('tuition') || text.includes('exam') || text.includes('course') || text.includes('stationery') || text.includes('paper') || text.includes('lab') || text.includes('print')) {
        suggestedCat = categories.find((c) => c.name === 'Academics');
        confidence = 0.89;
      } else if (text.includes('spotify') || text.includes('netflix') || text.includes('prime') || text.includes('hulu') || text.includes('youtube') || text.includes('apple') || text.includes('sub') || text.includes('gym')) {
        suggestedCat = categories.find((c) => c.name === 'Subscriptions');
        confidence = 0.93;
      } else if (text.includes('movie') || text.includes('cinema') || text.includes('outing') || text.includes('party') || text.includes('game') || text.includes('ticket') || text.includes('concert')) {
        suggestedCat = categories.find((c) => c.name === 'Entertainment');
        confidence = 0.86;
      }
    }

    if (suggestedCat) {
      return res.json({
        suggested_category_id: suggestedCat.category_id,
        suggested_category_name: suggestedCat.name,
        confidence,
        reason
      });
    }

    // Default response
    const fallback = categories.find((c) => c.type === targetType);
    return res.json({
      suggested_category_id: fallback ? fallback.category_id : null,
      suggested_category_name: fallback ? fallback.name : null,
      confidence: 0.4,
      reason: 'Default fallback suggestion'
    });
  } catch (err) {
    console.error('AI category prediction error:', err);
    res.status(500).json({ error: 'Failed to predict category' });
  }
});

module.exports = router;
