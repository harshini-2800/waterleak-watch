import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

let io = null;

export function initSocket(httpServer, clientUrl) {
  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl || 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    // Allow user to join personal room for notifications
    socket.on('join:user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        logger.debug(`User ${userId} joined room user:${userId}`);
      }
    });

    // Allow joining incident-specific room
    socket.on('join:incident', (incidentId) => {
      if (incidentId) {
        socket.join(`incident:${incidentId}`);
        logger.debug(`Socket ${socket.id} joined incident:${incidentId}`);
      }
    });

    socket.on('leave:incident', (incidentId) => {
      if (incidentId) {
        socket.leave(`incident:${incidentId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitNewIncident(incident) {
  if (io) {
    io.emit('incident:new', incident);
  }
}

export function emitIncidentUpdated(incident) {
  if (io) {
    io.emit('incident:updated', incident);
    io.to(`incident:${incident._id}`).emit('incident:timeline_updated', incident);
  }
}

export function emitNotification(userId, notification) {
  if (io && userId) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
}

