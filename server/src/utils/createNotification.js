const Notification = require('../models/Notification');

/**
 * Create a notification and emit it via Socket.IO.
 * @param {Object} io - Socket.IO server instance
 * @param {Object} params
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.type - Notification type
 * @param {string} params.message - Notification message
 * @param {string} [params.refId] - Reference document ID
 * @param {string} [params.refModel] - Reference model name
 */
const createNotification = async (io, { userId, type, message, refId, refModel }) => {
  const notification = await Notification.create({
    userId, type, message,
    refId: refId || undefined,
    refModel: refModel || undefined,
    isRead: false,
  });
  if (io) {
    io.to(userId.toString()).emit('notification:new', {
      notification,
    });
  }
  return notification;
};

module.exports = createNotification;
