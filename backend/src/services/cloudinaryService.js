const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

// Uploads an in-memory file buffer (from multer) to Cloudinary and resolves with
// the fields tender_documents needs to manage the asset later (public_id, url, etc.).
function uploadBuffer(buffer, { folder, publicId, resourceType = 'raw' }) {
  return new Promise((resolve, reject) => {
    // Fail fast with a clearly-tagged error instead of making a network call
    // that's guaranteed to fail auth - lets callers log "not configured"
    // distinctly from an actual Cloudinary-side failure (network issue, quota,
    // invalid file, etc.), which matters when diagnosing why uploads are down.
    if (!cloudinary.isCloudinaryConfigured) {
      const error = new Error('Cloudinary is not configured (missing CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)');
      error.code = 'CLOUDINARY_NOT_CONFIGURED';
      return reject(error);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

module.exports = { uploadBuffer };
