const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  createSport,
  getSports,
  getSport,
  updateSport,
  deleteSport,
  toggleSport,
  hardDeleteSport,
} = require('../controllers/sportController');

router.use(authenticate);

router.post('/', authorize('admin'), [
  body('name').notEmpty().trim(),
], validate, createSport);
router.get('/', getSports);
router.get('/:id', getSport);
router.put('/:id', authorize('admin'), updateSport);
router.delete('/:id', authorize('admin'), deleteSport);
router.patch('/:id/toggle', authorize('admin'), toggleSport);
router.delete('/:id/hard', authorize('admin'), hardDeleteSport);

module.exports = router;
