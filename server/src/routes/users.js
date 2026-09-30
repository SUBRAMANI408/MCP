const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile, getUser, getUsers } = require('../controllers/userController');

router.use(authenticate);

router.get('/', getUsers);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/:id', getUser);

module.exports = router;
