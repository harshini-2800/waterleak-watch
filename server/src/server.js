import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocket } from './services/socketService.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server, CLIENT_URL);

async function startServer() {
  try {
    await connectDB();

    // Auto-seed if running empty database (ensures rich data out-of-the-box)
    const { Incident } = await import('./models/Incident.js');
    const incidentCount = await Incident.countDocuments();
    if (incidentCount === 0) {
      logger.info('Database is empty. Populating with initial demonstration seed data...');
      try {
        const { runSeed } = await import('./seeds/seed.js');
        await runSeed(true);
      } catch (seedErr) {
        logger.warn('Auto-seed warning:', seedErr.message);
      }
    }

    server.listen(PORT, () => {
      logger.info(`WaterLeak Watch API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
      logger.info(`Swagger UI available at http://localhost:${PORT}/api/docs`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing HTTP server and database...');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Closing HTTP server and database...');
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
});

startServer();

export { app, server };
