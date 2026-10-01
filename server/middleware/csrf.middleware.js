import {
  createHmac,
  timingSafeEqual
} from 'crypto';

/* =========================================================
   CSRF CONFIGURATION
========================================================= */

const CSRF_HEADER_NAME =
  'x-csrf-token';

const SAFE_METHODS =
  new Set([
    'GET',
    'HEAD',
    'OPTIONS'
  ]);

/* =========================================================
   GET CSRF SECRET
========================================================= */

function getCsrfSecret() {
  const secret =
    process.env.CSRF_SECRET;

  if (
    typeof secret !== 'string' ||
    secret.length < 32
  ) {
    throw new Error(
      'CSRF_SECRET must contain at least 32 characters.'
    );
  }

  return secret;
}

/* =========================================================
   GENERATE SESSION-BOUND CSRF TOKEN
========================================================= */

export function generateCsrfToken(
  sessionId
) {
  if (
    !sessionId
  ) {
    throw new Error(
      'A valid session is required to generate a CSRF token.'
    );
  }

  return createHmac(
    'sha256',
    getCsrfSecret()
  )
    .update(
      String(sessionId)
    )
    .digest('hex');
}

/* =========================================================
   VERIFY CSRF TOKEN
========================================================= */

export function verifyCsrfToken(
  sessionId,
  suppliedToken
) {
  if (
    !sessionId ||
    typeof suppliedToken !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(
      suppliedToken
    )
  ) {
    return false;
  }

  const expectedToken =
    generateCsrfToken(
      sessionId
    );

  const expectedBuffer =
    Buffer.from(
      expectedToken,
      'hex'
    );

  const suppliedBuffer =
    Buffer.from(
      suppliedToken,
      'hex'
    );

  return timingSafeEqual(
    expectedBuffer,
    suppliedBuffer
  );
}

/* =========================================================
   VERIFY REQUEST ORIGIN
========================================================= */

function isAllowedOrigin(
  req
) {
  const origin =
    req.get('origin');

  /*
   * Browsers normally send the Origin
   * header on cross-origin requests.
   *
   * When an Origin header is absent,
   * the CSRF token must still be valid.
   */

  if (!origin) {
    return true;
  }

  const allowedOrigins =
    new Set();

  /*
   * Production application origin.
   *
   * Example:
   * https://ppbma.thelikemindedgroup.com
   */

  if (
    process.env.APP_ORIGIN
  ) {
    allowedOrigins.add(
      process.env.APP_ORIGIN
        .trim()
        .replace(/\/$/, '')
    );
  }

  /*
   * Local development origins.
   */

  if (
    process.env.NODE_ENV !==
    'production'
  ) {
    allowedOrigins.add(
      'http://localhost:5000'
    );

    allowedOrigins.add(
      'http://localhost:5173'
    );

    allowedOrigins.add(
      'http://127.0.0.1:5000'
    );

    allowedOrigins.add(
      'http://127.0.0.1:5173'
    );
  }

  return allowedOrigins.has(
    origin
  );
}

/* =========================================================
   REQUIRE CSRF PROTECTION
========================================================= */

export function requireCsrf(
  req,
  res,
  next
) {
  try {
    /*
     * Read-only requests do not need
     * a CSRF token.
     */

    if (
      SAFE_METHODS.has(
        req.method
      )
    ) {
      return next();
    }

    /*
     * This middleware must run after
     * requireAuth.
     */

    if (
      !req.auth ||
      !req.auth.sessionid
    ) {
      return res
        .status(401)
        .json({
          success: false,

          error:
            'Authentication is required.'
        });
    }

    /*
     * Reject requests originating
     * from unauthorized websites.
     */

    if (
      !isAllowedOrigin(req)
    ) {
      return res
        .status(403)
        .json({
          success: false,

          error:
            'Request origin is not allowed.'
        });
    }

    /*
     * Verify the CSRF token supplied
     * in the request header.
     */

    const suppliedToken =
      req.get(
        CSRF_HEADER_NAME
      );

    const validToken =
      verifyCsrfToken(
        req.auth.sessionid,
        suppliedToken
      );

    if (
      !validToken
    ) {
      return res
        .status(403)
        .json({
          success: false,

          error:
            'Invalid or missing CSRF token.'
        });
    }

    return next();

  } catch (error) {
    console.error(
      'CSRF middleware error:',
      error.message
    );

    return res
      .status(503)
      .json({
        success: false,

        error:
          'CSRF protection is temporarily unavailable.'
      });
  }
}

export default requireCsrf;