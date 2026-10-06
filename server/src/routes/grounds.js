const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { requireAssociation, docAssociationGuard } = require('../middleware/scope');
const Ground = require('../models/Ground');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createGround,
  getGrounds,
  getGround,
  updateGround,
  deleteGround,
  toggleGroundBooking,
  updateGroundStatus,
} = require('../controllers/groundController');

router.use(authenticate);

router.post('/', authorize('admin', 'association_head'), requireAssociation('associationId'), [
  body('name').notEmpty().trim(),
  body('associationId').isMongoId(),
], validate, createGround);
router.get('/', getGrounds);
router.get('/:id', getGround);
router.put('/:id', authorize('admin', 'association_head'), docAssociationGuard(Ground, 'id'), updateGround);
router.delete('/:id', authorize('admin', 'association_head'), docAssociationGuard(Ground, 'id'), deleteGround);
router.patch('/:id/toggle-booking', authorize('admin', 'association_head'), docAssociationGuard(Ground, 'id'), toggleGroundBooking);
router.patch('/:id/status', authorize('admin', 'association_head', 'ground_officer'), docAssociationGuard(Ground, 'id'), updateGroundStatus);

module.exports = router;
