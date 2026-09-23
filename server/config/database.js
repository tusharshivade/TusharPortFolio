const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(__dirname, '../data/portfolio.db');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper promises for db operations
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Initialize schema
async function initSchema() {
  await db.runAsync('PRAGMA foreign_keys = ON;');

  // Admins table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Profile table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      professional_title TEXT NOT NULL,
      typing_roles TEXT NOT NULL,
      short_intro TEXT,
      bio TEXT,
      profile_image TEXT,
      resume_url TEXT,
      location TEXT,
      email TEXT,
      phone TEXT,
      availability_status TEXT DEFAULT 'Open to opportunities',
      about_heading TEXT,
      about_description TEXT,
      stat_skills TEXT DEFAULT '11+',
      stat_experience TEXT DEFAULT '∞',
      stat_downtime TEXT DEFAULT '0',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Skills table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'DevOps',
      level TEXT DEFAULT 'Advanced',
      icon_class TEXT NOT NULL,
      color TEXT DEFAULT '#38bdf8',
      link_url TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Projects table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      technologies TEXT,
      image_url TEXT,
      github_url TEXT,
      live_demo_url TEXT,
      category TEXT DEFAULT 'Cloud & DevOps',
      project_date TEXT,
      is_featured INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Experience table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS experience (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      is_current INTEGER DEFAULT 0,
      description TEXT,
      technologies TEXT,
      company_logo TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Education table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS education (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      degree TEXT NOT NULL,
      institution TEXT NOT NULL,
      location TEXT,
      start_year TEXT,
      end_year TEXT,
      description TEXT,
      grade_cgpa TEXT,
      certificate_url TEXT,
      logo_url TEXT,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Certifications table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issue_date TEXT,
      credential_id TEXT,
      credential_url TEXT,
      file_url TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Testimonials table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_name TEXT NOT NULL,
      position TEXT,
      company TEXT,
      avatar_url TEXT,
      content TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Social links table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS social_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      icon_class TEXT NOT NULL,
      bg_color TEXT DEFAULT '#1e293b',
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Pipeline steps (for the About section 01-04 cards)
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS pipeline_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      step_number TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Contact messages table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Resumes table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Website settings table (key-value)
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS website_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Media files table
  await db.runAsync(`
    CREATE TABLE IF NOT EXISTS media_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database tables verified and initialized.');
}

module.exports = {
  db,
  initSchema
};
