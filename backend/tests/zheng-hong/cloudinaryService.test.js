// Unit tests for the real cloudinaryService/config modules (not the module-level
// mock used in tenderScopeA.test.js's controller tests) - specifically the
// fail-fast "not configured" path, since the controller tests never actually
// exercise this code (they replace the whole cloudinaryService module).
const ENV_KEYS = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

describe('cloudinaryService.uploadBuffer - credential validation', () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects immediately with a CLOUDINARY_NOT_CONFIGURED error when credentials are missing - no network call attempted', async () => {
    ENV_KEYS.forEach((key) => delete process.env[key]);
    const cloudinaryService = require('../../src/services/cloudinaryService');

    await expect(
      cloudinaryService.uploadBuffer(Buffer.from('test'), { folder: 'town-council-tender/TEST', publicId: 'x' })
    ).rejects.toMatchObject({ code: 'CLOUDINARY_NOT_CONFIGURED' });
  });

  it('logs a clear diagnostic at module load time when credentials are missing, naming the missing vars', () => {
    ENV_KEYS.forEach((key) => delete process.env[key]);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.isolateModules(() => {
      require('../../src/config/cloudinary');
    });

    const loggedLine = consoleErrorSpy.mock.calls.map(([line]) => line).find((line) => /not configured/i.test(line));
    expect(loggedLine).toBeDefined();
    ENV_KEYS.forEach((key) => expect(loggedLine).toContain(key));
    consoleErrorSpy.mockRestore();
  });

  it('exposes isCloudinaryConfigured as false when any credential is missing', () => {
    delete process.env.CLOUDINARY_API_SECRET;
    let cloudinary;
    jest.isolateModules(() => {
      cloudinary = require('../../src/config/cloudinary');
    });
    expect(cloudinary.isCloudinaryConfigured).toBe(false);
  });

  it('exposes isCloudinaryConfigured as true when all three credentials are present', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = '123456789012345';
    process.env.CLOUDINARY_API_SECRET = 'demo-secret';
    let cloudinary;
    jest.isolateModules(() => {
      cloudinary = require('../../src/config/cloudinary');
    });
    expect(cloudinary.isCloudinaryConfigured).toBe(true);
  });
});
