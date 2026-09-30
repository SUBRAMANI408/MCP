import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useMatchStore } from '../app/store';

export const useLiveMatch = (matchId) => {
  const { socket } = useSocket();
  const { activeMatch, updateMatchScore } = useMatchStore();

  useEffect(() => {
    if (!socket || !matchId) return;
    socket.emit('match:join', matchId);
    const handleUpdate = ({ scoreSummary, event }) => {
      updateMatchScore(matchId, scoreSummary, event);
    };
    socket.on('match:update', handleUpdate);
    return () => {
      socket.emit('match:leave', matchId);
      socket.off('match:update', handleUpdate);
    };
  }, [socket, matchId]);

  return { activeMatch };
};
