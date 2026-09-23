const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/Email and Password are required.'
      });
    }

    const admin = await db.getAsync(
      'SELECT * FROM admins WHERE username = ? OR email = ?',
      [username.trim(), username.trim()]
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email/username and password.'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your email/username and password.'
      });
    }

    // Sign JWT (valid for 24 hours)
    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
});

// GET /api/auth/verify
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const admin = await db.getAsync(
      'SELECT id, username, email, created_at FROM admins WHERE id = ?',
      [req.user.id]
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found.'
      });
    }

    res.json({
      success: true,
      admin
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const admin = await db.getAsync('SELECT * FROM admins WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    await db.runAsync(
      'UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hash, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
});

module.exports = router;
