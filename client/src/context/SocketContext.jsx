import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../app/store';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const { token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) {
      socketRef.current = io(window.location.origin, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      socketRef.current.on('connect', () => {
        setConnected(true);
        console.log('Socket connected:', socketRef.current.id);
      });

      socketRef.current.on('disconnect', () => {
        setConnected(false);
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Socket error:', err.message);
      });

      return () => {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setConnected(false);
      };
    }
  }, [isAuthenticated, token]);

  const value = useMemo(() => ({ socket: socketRef.current, connected }), [connected]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
