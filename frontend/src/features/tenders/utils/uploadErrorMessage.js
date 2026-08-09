// Shared upload-failure messaging for tender image/document uploads
// (TenderFormPage's "Tender Document Package" dropzone and DocumentsManager's
// Documents section both submit to endpoints that proxy the file to Cloudinary -
// see backend/src/controllers/tenderController.js). A 502 there specifically
// means the Cloudinary call itself failed (bad/missing credentials, the service
// being down, etc.) - not something the user did wrong, and not something that
// should read as a data-loss error, since the tender/document record the file
// was attached to is already saved by the time this fires. Distinguishing this
// case reassures the user their data is safe and this is a transient,
// upload-only problem worth retrying later.
export function getUploadErrorMessage(error, fallback = 'Could not upload the file. Please try again.') {
  if (error?.response?.status === 502) {
    return 'Document upload service currently unavailable. Your data was saved - please try uploading the file again later.';
  }
  if (error?.code === 'ECONNABORTED') {
    return 'The upload timed out. Please try again.';
  }
  if (!error?.response) {
    return 'Could not reach the server to upload the file. Check your connection and try again.';
  }
  return error.response.data?.message || fallback;
}
