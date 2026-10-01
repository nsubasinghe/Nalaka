/* =========================================================
   AUTHENTICATED FETCH HELPER

   - Uses the current browser session.
   - Requests a CSRF token for data-modifying requests.
   - Sends the token in the X-CSRF-Token header.
   - Preserves existing fetch options.
========================================================= */

const CSRF_TOKEN_URL = '/api/auth/csrf-token';

const SAFE_METHODS = new Set([
  'GET',
  'HEAD',
  'OPTIONS'
]);

/* =========================================================
   FETCH CSRF TOKEN
========================================================= */

async function fetchCsrfToken() {
  const response = await fetch(
    CSRF_TOKEN_URL,
    {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(
      'Unable to obtain a CSRF token. Please sign in again.'
    );
  }

  const result = await response.json();

  if (
    !result.success ||
    typeof result.csrfToken !== 'string' ||
    !result.csrfToken
  ) {
    throw new Error(
      'The authentication service returned an invalid CSRF token.'
    );
  }

  return result.csrfToken;
}

/* =========================================================
   AUTHENTICATED FETCH
========================================================= */

export async function authenticatedFetch(
  url,
  options = {}
) {
  const method = (
    options.method || 'GET'
  ).toUpperCase();

  const headers = new Headers(
    options.headers || {}
  );

  if (!SAFE_METHODS.has(method)) {
    const csrfToken =
      await fetchCsrfToken();

    headers.set(
      'X-CSRF-Token',
      csrfToken
    );
  }

  return fetch(
    url,
    {
      ...options,
      method,
      credentials: 'same-origin',
      headers
    }
  );
}