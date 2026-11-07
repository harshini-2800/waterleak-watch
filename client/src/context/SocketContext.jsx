import React, { createContext, useContext, useEffect } from 'react';
import { socket } from '../lib/socket.js';
import { useAuth } from './AuthContext.jsx';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.id) {
      socket.emit('join:user', user.id);
    }

    const handleNewIncident = (incident) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast((t) => (
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-aqua animate-ping" />
          <span className="text-sm font-medium">
            New Leak Reported: {incident.incidentNumber} ({incident.address?.area})
          </span>
        </div>
      ), { duration: 4000 });
    };

    const handleIncidentUpdated = (incident) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['incident', incident._id] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    };

    const handleNotification = (notif) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(`${notif.title}: ${notif.message}`, { duration: 6000 });
    };

    socket.on('incident:new', handleNewIncident);
    socket.on('incident:updated', handleIncidentUpdated);
    socket.on('notification:new', handleNotification);

    return () => {
      socket.off('incident:new', handleNewIncident);
      socket.off('incident:updated', handleIncidentUpdated);
      socket.off('notification:new', handleNotification);
    };
  }, [user, queryClient]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

