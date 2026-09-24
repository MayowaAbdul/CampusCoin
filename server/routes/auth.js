const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('../database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// 1. Student Registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, academic_year, monthly_allowance_baseline, monthly_savings_goal } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await dbGet('SELECT user_id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      `INSERT INTO users (name, email, password_hash, role, academic_year, monthly_allowance_baseline, monthly_savings_goal)
       VALUES (?, ?, ?, 'student', ?, ?, ?)`,
      [
        name,
        email.toLowerCase().trim(),
        password_hash,
        academic_year || 'Freshman',
        parseFloat(monthly_allowance_baseline) || 0.0,
        parseFloat(monthly_savings_goal) || 0.0
      ]
    );

    const user = {
      user_id: result.id,
      name,
      email: email.toLowerCase().trim(),
      role: 'student',
      academic_year: academic_year || 'Freshman',
      monthly_allowance_baseline: parseFloat(monthly_allowance_baseline) || 0.0,
      monthly_savings_goal: parseFloat(monthly_savings_goal) || 0.0
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 2. Student & User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'This account has been disabled by an administrator' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const userPayload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      academic_year: user.academic_year,
      monthly_allowance_baseline: user.monthly_allowance_baseline,
      monthly_savings_goal: user.monthly_savings_goal
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: userPayload });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 3. Direct Administrator Login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await dbGet('SELECT * FROM users WHERE email = ? AND role = "admin"', [email.toLowerCase().trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid administrator credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid administrator credentials' });
    }

    const userPayload = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: 'admin',
      academic_year: user.academic_year
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: userPayload });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});

// 4. Password Recovery - Token Link Simulation
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await dbGet('SELECT user_id, name, email FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!user) {
      return res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }

    const resetToken = jwt.sign({ user_id: user.user_id, purpose: 'reset_password' }, JWT_SECRET, { expiresIn: '1h' });
    const resetUrl = `http://localhost:5000/?reset_token=${resetToken}`;

    res.json({
      message: 'Password reset link generated successfully.',
      simulated_email: {
        to: user.email,
        subject: 'Campus Coin Password Reset',
        resetToken,
        resetUrl,
        instructions: 'Click the link or paste the token in the reset password modal to restore access.'
      }
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error sending password reset token' });
  }
});

// 5. Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, new_password } = req.body;
    if (!token || !new_password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.purpose !== 'reset_password') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    const new_hash = await bcrypt.hash(new_password, 10);
    await dbRun('UPDATE users SET password_hash = ? WHERE user_id = ?', [new_hash, decoded.user_id]);

    res.json({ message: 'Password updated successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(400).json({ error: 'Invalid or expired password reset token' });
  }
});

// 6. Get Current User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT user_id, name, email, role, academic_year, monthly_allowance_baseline, monthly_savings_goal, created_at FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, academic_year, monthly_allowance_baseline, monthly_savings_goal } = req.body;
    await dbRun(
      `UPDATE users SET name = ?, academic_year = ?, monthly_allowance_baseline = ?, monthly_savings_goal = ? WHERE user_id = ?`,
      [
        name,
        academic_year,
        parseFloat(monthly_allowance_baseline) || 0.0,
        parseFloat(monthly_savings_goal) || 0.0,
        req.user.user_id
      ]
    );

    const updated = await dbGet(
      'SELECT user_id, name, email, role, academic_year, monthly_allowance_baseline, monthly_savings_goal FROM users WHERE user_id = ?',
      [req.user.user_id]
    );
    res.json(updated);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

module.exports = router;
