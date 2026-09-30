const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory presence store
const onlineUsers = new Map(); // userId -> { socketIds: Set, lastSeen: Date }

const initSocketHandlers = (io) => {
  // Auth middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1];
      if (!token) return next(new Error('Authentication error: No token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name role associationId teamId avatar');
      if (!user) return next(new Error('Authentication error: User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.id} | User: ${userId} | Role: ${socket.user.role}`);

    // ── Presence ──────────────────────────────────────────────────────────────
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, { socketIds: new Set(), lastSeen: null });
    }
    onlineUsers.get(userId).socketIds.add(socket.id);

    // Join personal room
    socket.join(userId);

    // Join association room
    if (socket.user.associationId) {
      socket.join(`assoc:${socket.user.associationId}`);
    }

    // Join team room
    if (socket.user.teamId) {
      socket.join(`team:${socket.user.teamId}`);
    }

    // Broadcast online status
    io.emit('user:online', { userId, name: socket.user.name });

    // ── Group chat rooms ───────────────────────────────────────────────────────
    socket.on('group:join', (groupId) => {
      socket.join(`group:${groupId}`);
      // Mark messages as delivered for this user
      const Message = require('../models/Message');
      Message.updateMany(
        { groupId, deliveredTo: { $ne: socket.user._id } },
        { $addToSet: { deliveredTo: socket.user._id } }
      ).then(() => {
        socket.to(`group:${groupId}`).emit('message:delivered', { groupId, userId });
      }).catch(() => {});
    });

    socket.on('group:leave', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    // ── Typing indicators ──────────────────────────────────────────────────────
    socket.on('chat:typing', ({ groupId }) => {
      socket.to(`group:${groupId}`).emit('chat:typing', {
        userId, name: socket.user.name, avatar: socket.user.avatar, groupId,
      });
    });

    socket.on('chat:stop_typing', ({ groupId }) => {
      socket.to(`group:${groupId}`).emit('chat:stop_typing', { userId, groupId });
    });

    // ── Read receipts ──────────────────────────────────────────────────────────
    socket.on('message:read', async ({ messageId, groupId }) => {
      try {
        const Message = require('../models/Message');
        await Message.findByIdAndUpdate(messageId, {
          $addToSet: { readBy: socket.user._id }
        });
        socket.to(`group:${groupId}`).emit('message:read', { messageId, userId });
      } catch {}
    });

    // ── Match live-score rooms ─────────────────────────────────────────────────
    socket.on('match:join', (matchId) => {
      socket.join(`match:${matchId}`);
    });

    socket.on('match:leave', (matchId) => {
      socket.leave(`match:${matchId}`);
    });

    // ── Check online status ────────────────────────────────────────────────────
    socket.on('user:check_online', (userIds) => {
      const result = {};
      userIds.forEach(id => {
        result[id] = onlineUsers.has(id) && onlineUsers.get(id).socketIds.size > 0;
      });
      socket.emit('user:online_status', result);
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const userData = onlineUsers.get(userId);
      if (userData) {
        userData.socketIds.delete(socket.id);
        if (userData.socketIds.size === 0) {
          userData.lastSeen = new Date();
          // Broadcast offline after small delay (to avoid flicker on page reload)
          setTimeout(() => {
            const current = onlineUsers.get(userId);
            if (current && current.socketIds.size === 0) {
              io.emit('user:offline', { userId, lastSeen: current.lastSeen });
            }
          }, 3000);
        }
      }
      console.log(`Socket disconnected: ${socket.id} | User: ${userId}`);
    });
  });
};

// Helper to check if user is online
const isUserOnline = (userId) => {
  const data = onlineUsers.get(userId?.toString());
  return data && data.socketIds.size > 0;
};

const getUserLastSeen = (userId) => {
  const data = onlineUsers.get(userId?.toString());
  return data ? data.lastSeen : null;
};

module.exports = { initSocketHandlers, isUserOnline, getUserLastSeen };
