const express = require('express');
const router = express.Router();
const { db } = require('../config/database');

// GET /api/portfolio/content - Public dynamic portfolio hydration
router.get('/content', async (req, res) => {
  try {
    const profile = await db.getAsync('SELECT * FROM profile ORDER BY id DESC LIMIT 1');
    if (profile && profile.typing_roles) {
      try {
        profile.typing_roles = JSON.parse(profile.typing_roles);
      } catch (e) {
        profile.typing_roles = profile.typing_roles.split(',').map((s) => s.trim());
      }
    }

    const skills = await db.allAsync(
      'SELECT * FROM skills WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );

    const certifications = await db.allAsync(
      'SELECT * FROM certifications WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );

    const projects = await db.allAsync(
      'SELECT * FROM projects WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );

    const experience = await db.allAsync(
      'SELECT * FROM experience WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );

    const education = await db.allAsync(
      'SELECT * FROM education WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );

    const testimonials = await db.allAsync(
      'SELECT * FROM testimonials WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );

    const social_links = await db.allAsync(
      'SELECT * FROM social_links WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );

    const pipeline_steps = await db.allAsync(
      'SELECT * FROM pipeline_steps WHERE is_active = 1 ORDER BY display_order ASC, id ASC'
    );

    const activeResume = await db.getAsync(
      'SELECT id, filename, original_name, file_path, file_size FROM resumes WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
    );

    const settingsRows = await db.allAsync('SELECT key, value FROM website_settings');
    const settings = {};
    settingsRows.forEach((r) => {
      settings[r.key] = r.value;
    });

    res.json({
      success: true,
      data: {
        profile: profile || {},
        skills,
        certifications,
        projects,
        experience,
        education,
        testimonials,
        social_links,
        pipeline_steps,
        resume: activeResume || null,
        settings
      }
    });
  } catch (error) {
    console.error('Error fetching public portfolio content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load portfolio content.'
    });
  }
});

module.exports = router;
