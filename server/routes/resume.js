const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/resume/active - Public: get active resume info
router.get('/active', async (req, res) => {
  try {
    const resume = await db.getAsync(
      'SELECT id, filename, original_name, file_path, file_size, created_at FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
    );
    if (!resume) {
      // Fallback to default in portfolio
      return res.json({
        success: true,
        resume: {
          filename: 'aws_certificate.pdf',
          original_name: 'Resume.pdf',
          file_path: '/aws_certificate.pdf',
          is_default: true
        }
      });
    }

    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch active resume.' });
  }
});

// GET /api/resume/download - Public: direct download active resume
router.get('/download', async (req, res) => {
  try {
    const resume = await db.getAsync(
      'SELECT * FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
    );

    if (resume) {
      const filePath = path.join(__dirname, '../../uploads', resume.filename);
      if (fs.existsSync(filePath)) {
        return res.download(filePath, resume.original_name);
      }
    }

    // Fallback to existing aws_certificate.pdf if no uploaded resume
    const fallbackPath = path.join(__dirname, '../../aws_certificate.pdf');
    if (fs.existsSync(fallbackPath)) {
      return res.download(fallbackPath, 'Tushar_Shivade_Resume.pdf');
    }

    res.status(404).json({ success: false, message: 'No resume available for download.' });
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ success: false, message: 'Download failed.' });
  }
});

// GET /api/resume/list - Protected: list all uploaded resumes
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const resumes = await db.allAsync('SELECT * FROM resumes ORDER BY id DESC');
    res.json({ success: true, resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list resumes.' });
  }
});

// POST /api/resume/upload - Protected: upload new resume
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded or file type not allowed.' });
    }

    // Set all other resumes to inactive
    await db.runAsync('UPDATE resumes SET is_active = 0');

    const relativePath = `/uploads/${req.file.filename}`;

    const result = await db.runAsync(`
      INSERT INTO resumes (filename, original_name, file_path, file_size, mime_type, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [
      req.file.filename,
      req.file.originalname,
      relativePath,
      req.file.size,
      req.file.mimetype
    ]);

    // Update profile resume_url
    await db.runAsync('UPDATE profile SET resume_url = ?, updated_at = CURRENT_TIMESTAMP', [relativePath]);

    res.json({
      success: true,
      message: 'Resume uploaded and set as active.',
      resume: {
        id: result.lastID,
        filename: req.file.filename,
        original_name: req.file.originalname,
        file_path: relativePath
      }
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ success: false, message: 'Failed to upload resume.' });
  }
});

// PATCH /api/resume/:id/active - Protected: set active resume
router.patch('/:id/active', authenticateToken, async (req, res) => {
  try {
    const resume = await db.getAsync('SELECT * FROM resumes WHERE id = ?', [req.params.id]);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

    await db.runAsync('UPDATE resumes SET is_active = 0');
    await db.runAsync('UPDATE resumes SET is_active = 1 WHERE id = ?', [req.params.id]);
    await db.runAsync('UPDATE profile SET resume_url = ?, updated_at = CURRENT_TIMESTAMP', [resume.file_path]);

    res.json({ success: true, message: `"${resume.original_name}" is now the active resume.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to set active resume.' });
  }
});

// DELETE /api/resume/:id - Protected: delete resume
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const resume = await db.getAsync('SELECT * FROM resumes WHERE id = ?', [req.params.id]);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found.' });

    // Remove physical file
    const filePath = path.join(__dirname, '../../uploads', resume.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not remove file on disk:', e.message);
      }
    }

    await db.runAsync('DELETE FROM resumes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Resume deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete resume.' });
  }
});

module.exports = router;
