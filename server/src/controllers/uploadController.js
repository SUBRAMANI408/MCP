const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { successResponse } = require('../utils/apiResponse');

const storage = multer.memoryStorage();
const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('file');

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded. Please send a file under field "file"' });
  }

  const tenantPrefix = req.user.role === 'admin' ? 'global' : (req.user.associationId?.toString() || req.user._id.toString());
  const folder = req.body.folder ? `${tenantPrefix}/${req.body.folder}` : `${tenantPrefix}/uploads`;

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `sports_platform/${folder}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    successResponse(res, {
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.file.originalname,
      format: result.format,
      bytes: result.bytes,
    }, 'File uploaded successfully', 201);
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file to cloud storage',
      error: error.message,
    });
  }
};

module.exports = {
  uploadMiddleware,
  uploadFile,
};
