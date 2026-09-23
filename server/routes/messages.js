const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// POST /api/messages - Public contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, Email, and Message are required fields.'
      });
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.'
      });
    }

    const result = await db.runAsync(`
      INSERT INTO messages (name, email, subject, message, is_read)
      VALUES (?, ?, ?, ?, 0)
    `, [
      name.trim(),
      email.trim(),
      (subject || 'General Inquiry').trim(),
      message.trim()
    ]);

    res.json({
      success: true,
      message: 'Thank you! Your message has been sent successfully.',
      id: result.lastID
    });
  } catch (error) {
    console.error('Error submitting contact message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

// GET /api/messages - Protected list for admin
router.get('/', authenticateToken, async (req, res) => {
  try {
    const messages = await db.allAsync('SELECT * FROM messages ORDER BY id DESC');
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
});

// PATCH /api/messages/:id/read - Toggle read status
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const msg = await db.getAsync('SELECT is_read FROM messages WHERE id = ?', [req.params.id]);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });

    const newStatus = msg.is_read ? 0 : 1;
    await db.runAsync('UPDATE messages SET is_read = ? WHERE id = ?', [newStatus, req.params.id]);

    res.json({ success: true, message: `Message marked as ${newStatus ? 'read' : 'unread'}.`, is_read: newStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update message.' });
  }
});

// DELETE /api/messages/:id - Delete message
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.runAsync('DELETE FROM messages WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});

module.exports = router;
