const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/upload - Protected single file upload
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file received or invalid file format.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const category = req.body.category || 'general';

    const result = await db.runAsync(`
      INSERT INTO media_files (filename, original_name, file_path, file_size, mime_type, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      req.file.filename,
      req.file.originalname,
      fileUrl,
      req.file.size,
      req.file.mimetype,
      category
    ]);

    res.json({
      success: true,
      message: 'File uploaded successfully.',
      file: {
        id: result.lastID,
        filename: req.file.filename,
        original_name: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'File upload failed.' });
  }
});

// GET /api/upload/media - Protected: list all media
router.get('/media', authenticateToken, async (req, res) => {
  try {
    const files = await db.allAsync('SELECT * FROM media_files ORDER BY id DESC');
    res.json({ success: true, media: files });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch media library.' });
  }
});

// DELETE /api/upload/media/:id - Protected: delete media file
router.delete('/media/:id', authenticateToken, async (req, res) => {
  try {
    const item = await db.getAsync('SELECT * FROM media_files WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ success: false, message: 'File record not found.' });

    const diskPath = path.join(__dirname, '../../uploads', item.filename);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (e) {
        console.warn('Could not remove file on disk:', e.message);
      }
    }

    await db.runAsync('DELETE FROM media_files WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'File deleted from media library.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete file.' });
  }
});

module.exports = router;
