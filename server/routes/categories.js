const express = require('express');
const router = express.Router();
const { dbAll, dbGet, dbRun } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get categories for current user (Default system categories + User custom categories)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await dbAll(
      `SELECT * FROM categories WHERE is_default = 1 OR user_id = ? ORDER BY type DESC, name ASC`,
      [req.user.user_id]
    );
    res.json(categories);
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create Custom Category ('Manage Own Categories')
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type (income or expense) are required' });
    }

    const result = await dbRun(
      `INSERT INTO categories (user_id, name, type, is_default, icon, color) VALUES (?, ?, ?, 0, ?, ?)`,
      [req.user.user_id, name, type, icon || 'Tag', color || '#6366f1']
    );

    const created = await dbGet('SELECT * FROM categories WHERE category_id = ?', [result.id]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Edit Custom Category
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, icon, color } = req.body;

    const existing = await dbGet('SELECT * FROM categories WHERE category_id = ? AND user_id = ?', [
      categoryId,
      req.user.user_id
    ]);

    if (!existing) {
      return res.status(404).json({ error: 'Custom category not found or unauthorized' });
    }

    await dbRun(`UPDATE categories SET name = ?, icon = ?, color = ? WHERE category_id = ?`, [
      name || existing.name,
      icon || existing.icon,
      color || existing.color,
      categoryId
    ]);

    const updated = await dbGet('SELECT * FROM categories WHERE category_id = ?', [categoryId]);
    res.json(updated);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete Custom Category
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const categoryId = req.params.id;

    const existing = await dbGet('SELECT * FROM categories WHERE category_id = ? AND user_id = ?', [
      categoryId,
      req.user.user_id
    ]);

    if (!existing) {
      return res.status(404).json({ error: 'Custom category not found or default categories cannot be deleted' });
    }

    await dbRun('DELETE FROM categories WHERE category_id = ?', [categoryId]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
