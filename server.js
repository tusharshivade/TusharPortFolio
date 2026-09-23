const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initSchema } = require('./server/config/database');
const authRoutes = require('./server/routes/auth');
const portfolioRoutes = require('./server/routes/portfolio');
const adminRoutes = require('./server/routes/admin');
const messageRoutes = require('./server/routes/messages');
const resumeRoutes = require('./server/routes/resume');
const uploadRoutes = require('./server/routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Static directories
app.use('/uploads', express.static(uploadsDir));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Serve root static assets (images, PDFs, styles for existing portfolio)
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/upload', uploadRoutes);

// Admin SPA fallback: any subroute under /admin loads admin/index.html
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Root route: serves existing public portfolio
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
async function startServer() {
  try {
    await initSchema();
    app.listen(PORT, () => {
      console.log('========================================================');
      console.log(`🚀 Portfolio & Admin Server running on port ${PORT}`);
      console.log(`🌐 Public Portfolio:  http://localhost:${PORT}`);
      console.log(`🔒 Admin Panel:       http://localhost:${PORT}/admin`);
      console.log(`📡 API Endpoints:     http://localhost:${PORT}/api/portfolio/content`);
      console.log('========================================================');
    });
  } catch (err) {
    console.error('Failed to initialize database or start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
