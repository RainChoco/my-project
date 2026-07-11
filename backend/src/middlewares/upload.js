const multer = require('multer');

// Memory storage: files are held as a Buffer on req.file.buffer and streamed
// straight to Cloudinary (services/cloudinaryService.js) - never written to local disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

module.exports = upload;
