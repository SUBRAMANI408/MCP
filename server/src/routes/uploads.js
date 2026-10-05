const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { uploadMiddleware, uploadFile } = require('../controllers/uploadController');

router.use(authenticate);

router.post('/', uploadMiddleware, uploadFile);

module.exports = router;
