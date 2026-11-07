import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log in dev/test
  if (process.env.NODE_ENV !== 'production') {
    logger.error('Error encountered:', {
      message: err.message,
      stack: err.stack,
      statusCode: error.statusCode
    });
  }

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new AppError(message, 404);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `A record with that ${field} already exists.`;
    error = new AppError(message, 409);
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new AppError(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Internal Server Error',
      statusCode: error.statusCode || 500,
      details: error.details || null
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

