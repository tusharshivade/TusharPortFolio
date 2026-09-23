const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'portfolio_super_secure_jwt_secret_key_987654321';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token required.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired session. Please log in again.'
      });
    }

    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken,
  JWT_SECRET
};
