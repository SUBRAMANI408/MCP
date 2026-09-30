const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getGroup, updateGroup, getMyGroups,
  getMessages, sendMessage, editMessage, forwardMessage,
  addReaction, removeReaction,
  pinMessage, getPinnedMessages,
  markRead, markAllRead, searchMessages, deleteMessage,
  postAnnouncement, getAnnouncements,
} = require('../controllers/groupController');

router.use(authenticate);

// Group info
router.get('/', getMyGroups);
router.get('/:id', getGroup);
router.put('/:id', updateGroup);

// Messages
router.get('/:id/messages', getMessages);
router.post('/:id/messages', [
  body('content').if(body('type').equals('text')).notEmpty(),
  body('type').isIn(['text', 'image', 'document', 'voice', 'audio', 'announcement']),
], validate, sendMessage);
router.put('/messages/:msgId/edit', editMessage);
router.post('/messages/:msgId/forward', forwardMessage);
router.post('/messages/:msgId/react', addReaction);
router.delete('/messages/:msgId/react', removeReaction);
router.put('/messages/:msgId/pin', pinMessage);
router.put('/messages/:msgId/read', markRead);
router.put('/:id/read-all', markAllRead);
router.get('/:id/messages/search', searchMessages);
router.delete('/messages/:msgId', deleteMessage);
router.get('/:id/pinned', getPinnedMessages);

// Announcements
router.get('/:id/announcements', getAnnouncements);
router.post('/:id/announcements', postAnnouncement);

module.exports = router;
