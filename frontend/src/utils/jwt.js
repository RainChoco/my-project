// Client-side JWT payload decoding only - no signature verification.
// Every protected API call is independently re-verified server-side by
// backend/src/middlewares/auth.js; this is used only to drive UI (nav, route guards).

export function decodeJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(decoded) {
  if (!decoded || typeof decoded.exp !== 'number') return true;
  return Date.now() >= decoded.exp * 1000;
}
