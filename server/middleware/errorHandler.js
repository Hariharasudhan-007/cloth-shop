const multer = require('multer');
const config = require('../config');

function errorHandler(err, req, res, next) {
  // Status code
  const statusCode = err.status || err.statusCode || 500;

  // Only log console.error for internal server errors
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`, err);
  }

  // Handle Multer upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Uploaded file is too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  // Handle custom upload filter errors
  if (err.message && err.message.includes('Invalid file format')) {
    return res.status(400).json({ error: err.message });
  }

  // Production-safe error payload
  const responsePayload = {
    error: err.userMessage || (statusCode === 500 ? 'An unexpected server error occurred. Please try again later.' : err.message)
  };

  // Only include details/stack in non-production
  if (!config.isProduction && statusCode === 500) {
    responsePayload.debug = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}

module.exports = errorHandler;
