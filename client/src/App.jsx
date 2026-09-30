import React, { useEffect } from 'react';
import { SocketProvider } from './context/SocketContext';
import { useAuthStore, useNotificationStore } from './app/store';
import { useSocket } from './context/SocketContext';
import { notificationApi } from './api/notificationApi';
import AppRouter from './app/router';

const NotificationLoader = () => {
  const { isAuthenticated } = useAuthStore();
  const { setNotifications } = useNotificationStore();
  const { socket } = useSocket();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (isAuthenticated) {
      notificationApi.getNotifications({ limit: 20 })
        .then(res => setNotifications(res.data.data, res.data.pagination?.unreadCount || 0))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;
    socket.on('notification:new', ({ notification }) => {
      if (notification) addNotification(notification);
    });
    return () => socket.off('notification:new');
  }, [socket]);

  return null;
};

const App = () => {
  return (
    <SocketProvider>
      <NotificationLoader />
      <AppRouter />
    </SocketProvider>
  );
};

export default App;
