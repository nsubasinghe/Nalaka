import {
  rateLimit
} from 'express-rate-limit';

/* =========================================================
   LOGIN RATE LIMIT CONFIGURATION
========================================================= */

const LOGIN_WINDOW_MINUTES = 15;

const MAX_LOGIN_ATTEMPTS = 5;

/* =========================================================
   LOGIN RATE LIMIT MIDDLEWARE
========================================================= */

export const loginRateLimit = rateLimit({

  /*
   * Time window: 15 minutes.
   */

  windowMs:
    LOGIN_WINDOW_MINUTES *
    60 *
    1000,

  /*
   * Allow up to 5 unsuccessful login
   * attempts per client IP address
   * within the time window.
   */

  limit:
    MAX_LOGIN_ATTEMPTS,

  /*
   * Successful HTTP responses
   * do not count toward the limit.
   */

  skipSuccessfulRequests:
    true,

  /*
   * Include standard rate-limit
   * response headers.
   */

  standardHeaders:
    'draft-7',

  legacyHeaders:
    false,

  /*
   * Return a consistent JSON
   * response when the limit
   * is exceeded.
   */

  handler: (
    req,
    res
  ) => {
    return res
      .status(429)
      .json({
        success: false,

        error:
          'Too many login attempts. Please try again in 15 minutes.'
      });
  }
});

export default loginRateLimit;