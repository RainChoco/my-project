const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

// Uploads an in-memory file buffer (from multer) to Cloudinary and resolves with
// the fields tender_documents needs to manage the asset later (public_id, url, etc.).
function uploadBuffer(buffer, { folder, publicId, resourceType = 'raw' }) {
  return new Promise((resolve, reject) => {
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
