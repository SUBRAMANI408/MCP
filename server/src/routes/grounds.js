const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
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

router.post('/', authorize('admin', 'association_head'), [
  body('name').notEmpty().trim(),
  body('associationId').isMongoId(),
], validate, createGround);
router.get('/', getGrounds);
router.get('/:id', getGround);
router.put('/:id', authorize('admin', 'association_head'), updateGround);
router.delete('/:id', authorize('admin', 'association_head'), deleteGround);
router.patch('/:id/toggle-booking', authorize('admin', 'association_head'), toggleGroundBooking);
router.patch('/:id/status', authorize('admin', 'association_head', 'ground_officer'), updateGroundStatus);

module.exports = router;
