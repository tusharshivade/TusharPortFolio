const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// All admin routes require authentication
router.use(authenticateToken);

// ── 1. DASHBOARD STATS ──
router.get('/stats', async (req, res) => {
  try {
    const totalProjects = await db.getAsync('SELECT COUNT(*) as count FROM projects');
    const totalSkills = await db.getAsync('SELECT COUNT(*) as count FROM skills');
    const totalExperience = await db.getAsync('SELECT COUNT(*) as count FROM experience');
    const totalEducation = await db.getAsync('SELECT COUNT(*) as count FROM education');
    const totalCertifications = await db.getAsync('SELECT COUNT(*) as count FROM certifications');
    const totalTestimonials = await db.getAsync('SELECT COUNT(*) as count FROM testimonials');
    const totalMessages = await db.getAsync('SELECT COUNT(*) as count FROM messages');
    const unreadMessages = await db.getAsync('SELECT COUNT(*) as count FROM messages WHERE is_read = 0');
    const activeResume = await db.getAsync('SELECT original_name FROM resumes WHERE is_active = 1 LIMIT 1');
    const recentMessages = await db.allAsync('SELECT * FROM messages ORDER BY id DESC LIMIT 5');

    res.json({
      success: true,
      stats: {
        projects: totalProjects.count,
        skills: totalSkills.count,
        experience: totalExperience.count,
        education: totalEducation.count,
        certifications: totalCertifications.count,
        testimonials: totalTestimonials.count,
        messages: totalMessages.count,
        unreadMessages: unreadMessages.count,
        activeResume: activeResume ? activeResume.original_name : 'None active'
      },
      recentMessages
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics.' });
  }
});

// ── 2. PROFILE ──
router.get('/profile', async (req, res) => {
  try {
    const profile = await db.getAsync('SELECT * FROM profile ORDER BY id DESC LIMIT 1');
    if (profile && profile.typing_roles) {
      try {
        profile.typing_roles = JSON.parse(profile.typing_roles);
      } catch (e) {
        profile.typing_roles = profile.typing_roles.split(',').map((s) => s.trim());
      }
    }
    res.json({ success: true, profile: profile || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const {
      full_name,
      professional_title,
      typing_roles,
      short_intro,
      bio,
      profile_image,
      resume_url,
      location,
      email,
      phone,
      availability_status,
      about_heading,
      about_description,
      stat_skills,
      stat_experience,
      stat_downtime
    } = req.body;

    const rolesString = Array.isArray(typing_roles)
      ? JSON.stringify(typing_roles)
      : typeof typing_roles === 'string'
      ? JSON.stringify(typing_roles.split(',').map((s) => s.trim()).filter(Boolean))
      : JSON.stringify(['DevOps Engineer', 'Cloud Enthusiast']);

    const existing = await db.getAsync('SELECT id FROM profile ORDER BY id DESC LIMIT 1');

    if (existing) {
      await db.runAsync(`
        UPDATE profile SET
          full_name = ?,
          professional_title = ?,
          typing_roles = ?,
          short_intro = ?,
          bio = ?,
          profile_image = ?,
          resume_url = ?,
          location = ?,
          email = ?,
          phone = ?,
          availability_status = ?,
          about_heading = ?,
          about_description = ?,
          stat_skills = ?,
          stat_experience = ?,
          stat_downtime = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        full_name,
        professional_title,
        rolesString,
        short_intro,
        bio,
        profile_image,
        resume_url,
        location,
        email,
        phone,
        availability_status,
        about_heading,
        about_description,
        stat_skills,
        stat_experience,
        stat_downtime,
        existing.id
      ]);
    } else {
      await db.runAsync(`
        INSERT INTO profile (
          full_name, professional_title, typing_roles, short_intro, bio,
          profile_image, resume_url, location, email, phone, availability_status,
          about_heading, about_description, stat_skills, stat_experience, stat_downtime
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        full_name,
        professional_title,
        rolesString,
        short_intro,
        bio,
        profile_image,
        resume_url,
        location,
        email,
        phone,
        availability_status,
        about_heading,
        about_description,
        stat_skills,
        stat_experience,
        stat_downtime
      ]);
    }

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// ── 3. SKILLS ──
router.get('/skills', async (req, res) => {
  try {
    const skills = await db.allAsync('SELECT * FROM skills ORDER BY display_order ASC, id ASC');
    res.json({ success: true, skills });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch skills.' });
  }
});

router.post('/skills', async (req, res) => {
  try {
    const { name, category, level, icon_class, color, link_url, display_order, is_active } = req.body;
    if (!name || !icon_class) {
      return res.status(400).json({ success: false, message: 'Skill Name and Icon Class are required.' });
    }

    const result = await db.runAsync(`
      INSERT INTO skills (name, category, level, icon_class, color, link_url, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      category || 'DevOps',
      level || 'Advanced',
      icon_class.trim(),
      color || '#38bdf8',
      link_url || '',
      display_order || 0,
      is_active !== undefined ? is_active : 1
    ]);

    res.json({ success: true, message: 'Skill added successfully.', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add skill.' });
  }
});

router.put('/skills/:id', async (req, res) => {
  try {
    const { name, category, level, icon_class, color, link_url, display_order, is_active } = req.body;
    await db.runAsync(`
      UPDATE skills SET
        name = ?,
        category = ?,
        level = ?,
        icon_class = ?,
        color = ?,
        link_url = ?,
        display_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name.trim(),
      category,
      level,
      icon_class.trim(),
      color,
      link_url,
      display_order,
      is_active,
      req.params.id
    ]);

    res.json({ success: true, message: 'Skill updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update skill.' });
  }
});

router.patch('/skills/:id/toggle', async (req, res) => {
  try {
    const skill = await db.getAsync('SELECT is_active FROM skills WHERE id = ?', [req.params.id]);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found.' });

    const newStatus = skill.is_active ? 0 : 1;
    await db.runAsync('UPDATE skills SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      newStatus,
      req.params.id
    ]);

    res.json({ success: true, message: `Skill ${newStatus ? 'activated' : 'deactivated'}.`, is_active: newStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle skill.' });
  }
});

router.delete('/skills/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM skills WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Skill deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete skill.' });
  }
});

// ── 4. PROJECTS ──
router.get('/projects', async (req, res) => {
  try {
    const projects = await db.allAsync('SELECT * FROM projects ORDER BY display_order ASC, id ASC');
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      image_url,
      github_url,
      live_demo_url,
      category,
      project_date,
      is_featured,
      is_active,
      display_order
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Project Title and Description are required.' });
    }

    const result = await db.runAsync(`
      INSERT INTO projects (
        title, description, technologies, image_url, github_url, live_demo_url,
        category, project_date, is_featured, is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      description.trim(),
      technologies || '',
      image_url || '',
      github_url || '',
      live_demo_url || '',
      category || 'Cloud & DevOps',
      project_date || '',
      is_featured ? 1 : 0,
      is_active !== undefined ? is_active : 1,
      display_order || 0
    ]);

    res.json({ success: true, message: 'Project created successfully.', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      image_url,
      github_url,
      live_demo_url,
      category,
      project_date,
      is_featured,
      is_active,
      display_order
    } = req.body;

    await db.runAsync(`
      UPDATE projects SET
        title = ?,
        description = ?,
        technologies = ?,
        image_url = ?,
        github_url = ?,
        live_demo_url = ?,
        category = ?,
        project_date = ?,
        is_featured = ?,
        is_active = ?,
        display_order = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title.trim(),
      description.trim(),
      technologies,
      image_url,
      github_url,
      live_demo_url,
      category,
      project_date,
      is_featured ? 1 : 0,
      is_active ? 1 : 0,
      display_order || 0,
      req.params.id
    ]);

    res.json({ success: true, message: 'Project updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update project.' });
  }
});

router.patch('/projects/:id/toggle', async (req, res) => {
  try {
    const project = await db.getAsync('SELECT is_active FROM projects WHERE id = ?', [req.params.id]);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });

    const newStatus = project.is_active ? 0 : 1;
    await db.runAsync('UPDATE projects SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      newStatus,
      req.params.id
    ]);

    res.json({ success: true, message: `Project ${newStatus ? 'activated' : 'deactivated'}.`, is_active: newStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle project.' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Project deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
});

// ── 5. EXPERIENCE ──
router.get('/experience', async (req, res) => {
  try {
    const experience = await db.allAsync('SELECT * FROM experience ORDER BY display_order ASC, id ASC');
    res.json({ success: true, experience });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch experience.' });
  }
});

router.post('/experience', async (req, res) => {
  try {
    const { company, position, start_date, end_date, is_current, description, technologies, company_logo, display_order, is_active } = req.body;
    if (!company || !position || !start_date) {
      return res.status(400).json({ success: false, message: 'Company, Position and Start Date are required.' });
    }

    const result = await db.runAsync(`
      INSERT INTO experience (
        company, position, start_date, end_date, is_current,
        description, technologies, company_logo, display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      company.trim(),
      position.trim(),
      start_date,
      end_date || '',
      is_current ? 1 : 0,
      description || '',
      technologies || '',
      company_logo || '',
      display_order || 0,
      is_active !== undefined ? is_active : 1
    ]);

    res.json({ success: true, message: 'Experience added successfully.', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add experience.' });
  }
});

router.put('/experience/:id', async (req, res) => {
  try {
    const { company, position, start_date, end_date, is_current, description, technologies, company_logo, display_order, is_active } = req.body;
    await db.runAsync(`
      UPDATE experience SET
        company = ?,
        position = ?,
        start_date = ?,
        end_date = ?,
        is_current = ?,
        description = ?,
        technologies = ?,
        company_logo = ?,
        display_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      company.trim(),
      position.trim(),
      start_date,
      end_date || '',
      is_current ? 1 : 0,
      description || '',
      technologies || '',
      company_logo || '',
      display_order || 0,
      is_active ? 1 : 0,
      req.params.id
    ]);

    res.json({ success: true, message: 'Experience updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update experience.' });
  }
});

router.delete('/experience/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM experience WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Experience deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete experience.' });
  }
});

// ── 6. EDUCATION ──
router.get('/education', async (req, res) => {
  try {
    const education = await db.allAsync('SELECT * FROM education ORDER BY display_order ASC, id ASC');
    res.json({ success: true, education });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch education.' });
  }
});

router.post('/education', async (req, res) => {
  try {
    const { degree, institution, location, start_year, end_year, description, grade_cgpa, certificate_url, logo_url, display_order, is_active } = req.body;
    if (!degree || !institution) {
      return res.status(400).json({ success: false, message: 'Degree and Institution are required.' });
    }

    const result = await db.runAsync(`
      INSERT INTO education (
        degree, institution, location, start_year, end_year,
        description, grade_cgpa, certificate_url, logo_url, display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      degree.trim(),
      institution.trim(),
      location || '',
      start_year || '',
      end_year || '',
      description || '',
      grade_cgpa || '',
      certificate_url || '',
      logo_url || '',
      display_order || 0,
      is_active !== undefined ? is_active : 1
    ]);

    res.json({ success: true, message: 'Education added successfully.', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add education.' });
  }
});

router.put('/education/:id', async (req, res) => {
  try {
    const { degree, institution, location, start_year, end_year, description, grade_cgpa, certificate_url, logo_url, display_order, is_active } = req.body;
    await db.runAsync(`
      UPDATE education SET
        degree = ?,
        institution = ?,
        location = ?,
        start_year = ?,
        end_year = ?,
        description = ?,
        grade_cgpa = ?,
        certificate_url = ?,
        logo_url = ?,
        display_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      degree.trim(),
      institution.trim(),
      location,
      start_year,
      end_year,
      description,
      grade_cgpa,
      certificate_url,
      logo_url,
      display_order,
      is_active ? 1 : 0,
      req.params.id
    ]);

    res.json({ success: true, message: 'Education updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update education.' });
  }
});

router.delete('/education/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM education WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Education deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete education.' });
  }
});

// ── 7. CERTIFICATIONS ──
router.get('/certifications', async (req, res) => {
  try {
    const certs = await db.allAsync('SELECT * FROM certifications ORDER BY display_order ASC, id ASC');
    res.json({ success: true, certifications: certs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch certifications.' });
  }
});

router.post('/certifications', async (req, res) => {
  try {
    const { name, issuer, issue_date, credential_id, credential_url, file_url, display_order, is_active } = req.body;
    if (!name || !issuer || !file_url) {
      return res.status(400).json({ success: false, message: 'Name, Issuer and Certificate File are required.' });
    }

    const result = await db.runAsync(`
      INSERT INTO certifications (
        name, issuer, issue_date, credential_id, credential_url, file_url, display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name.trim(),
      issuer.trim(),
      issue_date || '',
      credential_id || '',
      credential_url || '',
      file_url.trim(),
      display_order || 0,
      is_active !== undefined ? is_active : 1
    ]);

    res.json({ success: true, message: 'Certification added successfully.', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add certification.' });
  }
});

router.put('/certifications/:id', async (req, res) => {
  try {
    const { name, issuer, issue_date, credential_id, credential_url, file_url, display_order, is_active } = req.body;
    await db.runAsync(`
      UPDATE certifications SET
        name = ?,
        issuer = ?,
        issue_date = ?,
        credential_id = ?,
        credential_url = ?,
        file_url = ?,
        display_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name.trim(),
      issuer.trim(),
      issue_date,
      credential_id,
      credential_url,
      file_url.trim(),
      display_order,
      is_active ? 1 : 0,
      req.params.id
    ]);

    res.json({ success: true, message: 'Certification updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update certification.' });
  }
});

router.delete('/certifications/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM certifications WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Certification deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete certification.' });
  }
});

// ── 8. TESTIMONIALS ──
router.get('/testimonials', async (req, res) => {
  try {
    const testimonials = await db.allAsync('SELECT * FROM testimonials ORDER BY display_order ASC, id ASC');
    res.json({ success: true, testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch testimonials.' });
  }
});

router.post('/testimonials', async (req, res) => {
  try {
    const { person_name, position, company, avatar_url, content, rating, display_order, is_active } = req.body;
    if (!person_name || !content) {
      return res.status(400).json({ success: false, message: 'Person Name and Testimonial Content are required.' });
    }

    const result = await db.runAsync(`
      INSERT INTO testimonials (
        person_name, position, company, avatar_url, content, rating, display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      person_name.trim(),
      position || '',
      company || '',
      avatar_url || '',
      content.trim(),
      rating || 5,
      display_order || 0,
      is_active !== undefined ? is_active : 1
    ]);

    res.json({ success: true, message: 'Testimonial added successfully.', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add testimonial.' });
  }
});

router.put('/testimonials/:id', async (req, res) => {
  try {
    const { person_name, position, company, avatar_url, content, rating, display_order, is_active } = req.body;
    await db.runAsync(`
      UPDATE testimonials SET
        person_name = ?,
        position = ?,
        company = ?,
        avatar_url = ?,
        content = ?,
        rating = ?,
        display_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      person_name.trim(),
      position,
      company,
      avatar_url,
      content.trim(),
      rating || 5,
      display_order,
      is_active ? 1 : 0,
      req.params.id
    ]);

    res.json({ success: true, message: 'Testimonial updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update testimonial.' });
  }
});

router.delete('/testimonials/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM testimonials WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Testimonial deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete testimonial.' });
  }
});

// ── 9. SOCIAL LINKS ──
router.get('/social-links', async (req, res) => {
  try {
    const links = await db.allAsync('SELECT * FROM social_links ORDER BY display_order ASC, id ASC');
    res.json({ success: true, social_links: links });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch social links.' });
  }
});

router.post('/social-links', async (req, res) => {
  try {
    const { platform, url, icon_class, bg_color, display_order, is_active } = req.body;
    if (!platform || !url) {
      return res.status(400).json({ success: false, message: 'Platform and URL are required.' });
    }

    const result = await db.runAsync(`
      INSERT INTO social_links (platform, url, icon_class, bg_color, display_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      platform.trim(),
      url.trim(),
      icon_class || 'fas fa-link',
      bg_color || '#1e293b',
      display_order || 0,
      is_active !== undefined ? is_active : 1
    ]);

    res.json({ success: true, message: 'Social link added successfully.', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add social link.' });
  }
});

router.put('/social-links/:id', async (req, res) => {
  try {
    const { platform, url, icon_class, bg_color, display_order, is_active } = req.body;
    await db.runAsync(`
      UPDATE social_links SET
        platform = ?,
        url = ?,
        icon_class = ?,
        bg_color = ?,
        display_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      platform.trim(),
      url.trim(),
      icon_class,
      bg_color,
      display_order,
      is_active ? 1 : 0,
      req.params.id
    ]);

    res.json({ success: true, message: 'Social link updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update social link.' });
  }
});

router.delete('/social-links/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM social_links WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Social link deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete social link.' });
  }
});

// ── 10. PIPELINE STEPS (About 01-04 Cards) ──
router.get('/pipeline-steps', async (req, res) => {
  try {
    const steps = await db.allAsync('SELECT * FROM pipeline_steps ORDER BY display_order ASC, id ASC');
    res.json({ success: true, pipeline_steps: steps });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pipeline steps.' });
  }
});

router.post('/pipeline-steps', async (req, res) => {
  try {
    const { step_number, title, description, display_order, is_active } = req.body;
    const result = await db.runAsync(`
      INSERT INTO pipeline_steps (step_number, title, description, display_order, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [
      step_number || '01',
      title.trim(),
      description.trim(),
      display_order || 0,
      is_active !== undefined ? is_active : 1
    ]);
    res.json({ success: true, message: 'Step added successfully.', id: result.lastID });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add pipeline step.' });
  }
});

router.put('/pipeline-steps/:id', async (req, res) => {
  try {
    const { step_number, title, description, display_order, is_active } = req.body;
    await db.runAsync(`
      UPDATE pipeline_steps SET
        step_number = ?,
        title = ?,
        description = ?,
        display_order = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      step_number,
      title.trim(),
      description.trim(),
      display_order,
      is_active ? 1 : 0,
      req.params.id
    ]);
    res.json({ success: true, message: 'Step updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update pipeline step.' });
  }
});

router.delete('/pipeline-steps/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM pipeline_steps WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Step deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete step.' });
  }
});

// ── 11. WEBSITE SETTINGS ──
router.get('/settings', async (req, res) => {
  try {
    const rows = await db.allAsync('SELECT key, value FROM website_settings');
    const settings = {};
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings.' });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      const exists = await db.getAsync('SELECT key FROM website_settings WHERE key = ?', [key]);
      if (exists) {
        await db.runAsync(
          'UPDATE website_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
          [String(value), key]
        );
      } else {
        await db.runAsync('INSERT INTO website_settings (key, value) VALUES (?, ?)', [key, String(value)]);
      }
    }
    res.json({ success: true, message: 'Website settings updated successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
});

module.exports = router;
