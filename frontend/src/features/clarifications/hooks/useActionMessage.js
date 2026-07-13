import { useCallback, useRef, useState } from 'react';

const AUTO_DISMISS_MS = 5000;

// Shared success/error banner state for this feature's pages - shows a message
// after each action and auto-dismisses it, per the "show a success or error
// message after each action" requirement.
export function useActionMessage() {
  const [message, setMessage] = useState(null);
  const timeoutRef = useRef(null);

  const show = useCallback((type, text) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage({ type, text });
    timeoutRef.current = setTimeout(() => setMessage(null), AUTO_DISMISS_MS);
  }, []);

  const showSuccess = useCallback((text) => show('success', text), [show]);
  const showError = useCallback((text) => show('error', text), [show]);
  const clear = useCallback(() => setMessage(null), []);

  return { message, showSuccess, showError, clear };
}

// Extracts a human-readable message from an Axios error, falling back to a
// generic message for network/timeout failures with no response body.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. The server may be slow - please try again.';
  }
  if (!error?.response) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  const body = error.response.data;
  if (body?.errors?.length) {
    return body.errors.join(' ');
  }
  return body?.message || fallback;
}
