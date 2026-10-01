import express from 'express';

import pool from '../db/pool.js';

import {
  authenticateUser
} from '../services/auth.service.js';

import {
  createAuthSession,
  getSessionCookieOptions,
  getClearSessionCookieOptions
} from '../services/authSession.service.js';

import {
  requireAuth
} from '../middleware/auth.middleware.js';

import {
  requireCsrf
} from '../middleware/csrf.middleware.js';

const router = express.Router();

/* =========================================================
   LOGIN ORIGIN PROTECTION
========================================================= */

function requireLoginOrigin(req, res, next) {
  const origin = req.get('Origin');

  const fetchSite =
    req.get('Sec-Fetch-Site');

  const configuredOrigin =
    process.env.APP_ORIGIN;

  const allowedOrigins =
    new Set();

  if (configuredOrigin) {
    try {
      allowedOrigins.add(
        new URL(configuredOrigin).origin
      );
    } catch {
      console.error(
        'APP_ORIGIN is not a valid URL.'
      );

      return res.status(503).json({
        success: false,
        error:
          'Authentication configuration is unavailable.'
      });
    }
  }

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
  }

  /*
   * Production must have an explicitly configured
   * application origin.
   */

  if (
    process.env.NODE_ENV ===
      'production' &&
    !configuredOrigin
  ) {
    console.error(
      'APP_ORIGIN must be configured in production.'
    );

    return res.status(503).json({
      success: false,
      error:
        'Authentication configuration is unavailable.'
    });
  }

  /*
   * Reject an untrusted Origin, including "null".
   */

  if (origin) {
    if (!allowedOrigins.has(origin)) {
      return res.status(403).json({
        success: false,
        error:
          'Login request origin is not allowed.'
      });
    }

    return next();
  }

  /*
   * Browsers can identify a cross-site request
   * using Sec-Fetch-Site even when Origin is absent.
   */

  if (
    fetchSite === 'cross-site' ||
    fetchSite === 'same-site'
  ) {
    return res.status(403).json({
      success: false,
      error:
        'Login request origin is not allowed.'
    });
  }

  /*
   * No Origin header:
   *
   * Allow non-browser clients such as PowerShell.
   * Requests identifying themselves as browser
   * navigations still need an Origin header.
   */

  if (
    req.get('Sec-Fetch-Mode') &&
    !origin
  ) {
    return res.status(403).json({
      success: false,
      error:
        'A browser login request must include an Origin header.'
    });
  }

  return next();
}

/* =========================================================
   POST /api/auth/login
========================================================= */

router.post(
  '/login',

  requireLoginOrigin,

  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          success: false,
          error:
            'Authentication service is temporarily unavailable.'
        });
      }

      const {
        login,
        password
      } = req.body || {};

      if (
        typeof login !== 'string' ||
        typeof password !== 'string' ||
        !login.trim() ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Username or email and password are required.'
        });
      }

      if (
        login.length > 255 ||
        password.length > 1024
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid login request.'
        });
      }

      /* ===============================================
         VERIFY USER CREDENTIALS
      =============================================== */

      const user =
        await authenticateUser(
          pool,
          login,
          password
        );

      if (!user) {
        return res.status(401).json({
          success: false,
          error:
            'Invalid username, email, or password.'
        });
      }

      /* ===============================================
         CREATE AUTHENTICATION SESSION
      =============================================== */

      const {
        token,
        session
      } = await createAuthSession(
        pool,
        user.userid
      );

      /* ===============================================
         SET SESSION COOKIE
      =============================================== */

      res.cookie(
        'ppbma_session',
        token,
        getSessionCookieOptions()
      );

      return res.json({
        success: true,

        message:
          'Login successful.',

        user,

        session: {
          expiresdate:
            session.expiresdate
        }
      });

    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      return res.status(503).json({
        success: false,
        error:
          'Authentication service is temporarily unavailable.'
      });
    }
  }
);

/* =========================================================
   GET /api/auth/me
========================================================= */

router.get(
  '/me',

  requireAuth,

  (req, res) => {
    return res.json({
      success: true,

      user: {
        userid:
          req.auth.userid,

        username:
          req.auth.username,

        email:
          req.auth.email,

        firstname:
          req.auth.firstname,

        lastname:
          req.auth.lastname,

        roleid:
          req.auth.roleid,

        roledescription:
          req.auth.roledescription
      },

      session: {
        expiresdate:
          req.auth.sessionExpiresDate
      }
    });
  }
);

/* =========================================================
   POST /api/auth/logout
========================================================= */

router.post(
  '/logout',

  requireAuth,

  requireCsrf,

  async (req, res) => {
    try {
      if (!pool) {
        return res.status(503).json({
          success: false,
          error:
            'Authentication service is temporarily unavailable.'
        });
      }

      /* ===============================================
         REVOKE CURRENT SESSION
      =============================================== */

      await pool.query(
        `
          UPDATE public."AuthSession"

          SET
            "RevokedDate" =
              CURRENT_TIMESTAMP

          WHERE
            "SessionID" = $1

            AND "UserID" = $2

            AND "RevokedDate"
              IS NULL;
        `,
        [
          req.auth.sessionid,
          req.auth.userid
        ]
      );

      /* ===============================================
         CLEAR SESSION COOKIE
      =============================================== */

      res.clearCookie(
        'ppbma_session',
        getClearSessionCookieOptions()
      );

      return res.json({
        success: true,

        message:
          'Logout successful.'
      });

    } catch (error) {
      console.error(
        'Logout error:',
        error
      );

      return res.status(503).json({
        success: false,
        error:
          'Failed to complete logout.'
      });
    }
  }
);

export default router;