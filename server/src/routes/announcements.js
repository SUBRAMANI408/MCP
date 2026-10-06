const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireAssociation, docAssociationGuard } = require('../middleware/scope');
const Announcement = require('../models/Announcement');
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

router.post('/', authorize('association_head', 'admin'), requireAssociation('associationId'), [
  body('associationId').isMongoId(),
  body('title').notEmpty().trim(),
  body('body').notEmpty(),
], validate, createAnnouncement);

router.get('/', requireAssociation('associationId'), getAnnouncements);
router.get('/:id', docAssociationGuard(Announcement, 'id'), getAnnouncement);
router.post('/:id/read', docAssociationGuard(Announcement, 'id'), markAsRead);
router.put('/:id', authorize('association_head', 'admin'), docAssociationGuard(Announcement, 'id'), updateAnnouncement);
router.delete('/:id', authorize('association_head', 'admin'), docAssociationGuard(Announcement, 'id'), deleteAnnouncement);

module.exports = router;
