import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useChatStore } from '../app/store';

export const useChat = (groupId) => {
  const { socket } = useSocket();
  const { addMessage, setTyping } = useChatStore();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !groupId) return;
    socket.emit('group:join', groupId);
    const handleNewMessage = (message) => addMessage(groupId, message);
    const handleTyping = (data) => setTyping(groupId, data, true);
    const handleStopTyping = (data) => setTyping(groupId, data, false);
    socket.on('message:new', handleNewMessage);
    socket.on('chat:typing', handleTyping);
    socket.on('chat:stop_typing', handleStopTyping);
    return () => {
      socket.emit('group:leave', groupId);
      socket.off('message:new', handleNewMessage);
      socket.off('chat:typing', handleTyping);
      socket.off('chat:stop_typing', handleStopTyping);
    };
  }, [socket, groupId]);

  const sendTyping = () => {
    if (!socket) return;
    socket.emit('chat:typing', { groupId });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:stop_typing', { groupId });
    }, 2000);
  };

  return { sendTyping };
};
