import { describe, expect, it } from 'vitest';
import { getUploadErrorMessage } from './uploadErrorMessage';

describe('getUploadErrorMessage', () => {
  it('returns a reassuring, retry-oriented message for a 502 (Cloudinary failure)', () => {
    const error = { response: { status: 502, data: { status: 'error', message: 'Cloudinary upload failed' } } };
    const message = getUploadErrorMessage(error);
    expect(message).toMatch(/temporarily unavailable/i);
    expect(message).toMatch(/data was saved/i);
  });

  it('returns a timeout-specific message for ECONNABORTED', () => {
    const error = { code: 'ECONNABORTED' };
    expect(getUploadErrorMessage(error)).toMatch(/timed out/i);
  });

  it('returns a connectivity message when there is no response at all', () => {
    const error = { request: {} };
    expect(getUploadErrorMessage(error)).toMatch(/could not reach the server/i);
  });

  it('falls back to the backend message for other error statuses', () => {
    const error = { response: { status: 400, data: { message: 'file_type is required' } } };
    expect(getUploadErrorMessage(error)).toBe('file_type is required');
  });

  it('falls back to the provided default when the backend gives no message', () => {
    const error = { response: { status: 500, data: {} } };
    expect(getUploadErrorMessage(error, 'Custom fallback.')).toBe('Custom fallback.');
  });
});
