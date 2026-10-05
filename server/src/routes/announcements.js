const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createAnnouncement,
  getAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
} = require('../controllers/announcementController');

router.use(authenticate);

router.post('/', authorize('association_head', 'admin'), [
  body('associationId').isMongoId(),
  body('title').notEmpty().trim(),
  body('body').notEmpty(),
], validate, createAnnouncement);

router.get('/', getAnnouncements);
router.get('/:id', getAnnouncement);
router.post('/:id/read', markAsRead);
router.put('/:id', authorize('association_head', 'admin'), updateAnnouncement);
router.delete('/:id', authorize('association_head', 'admin'), deleteAnnouncement);

module.exports = router;
