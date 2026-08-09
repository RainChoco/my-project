const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const REQUIRED_ENV_VARS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
const isCloudinaryConfigured = missingEnvVars.length === 0;

// Logged once at boot (not just on first failed upload) so a misconfigured
// deployment is obvious in the server logs immediately, rather than only
// surfacing as a generic "upload failed" error the first time a user tries
// to attach a file.
if (!isCloudinaryConfigured) {
  console.error(
    `[cloudinary] Not configured - missing env var(s): ${missingEnvVars.join(', ')}. ` +
    'Tender document/image uploads will fail until these are set (see backend/.env.example).'
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Attached to the SDK object itself (rather than changing this module's export
// shape) so every existing `const cloudinary = require('../config/cloudinary')`
// call site keeps working unchanged and can also check cloudinary.isCloudinaryConfigured.
cloudinary.isCloudinaryConfigured = isCloudinaryConfigured;

module.exports = cloudinary;
