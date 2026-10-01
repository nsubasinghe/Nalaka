import express from 'express';

import {
  requireAuth
} from '../middleware/auth.middleware.js';

import {
  generateCsrfToken
} from '../middleware/csrf.middleware.js';

const router = express.Router();

/* =========================================================
   GET /api/auth/csrf-token
========================================================= */

router.get(
  '/csrf-token',

  requireAuth,

  (req, res) => {
    try {
      /* ===============================================
         VERIFY AUTHENTICATED SESSION
      =============================================== */

      const sessionId =
        req.auth?.sessionid;

      if (!sessionId) {
        return res
          .status(401)
          .json({
            success: false,
            error:
              'A valid authentication session is required.'
          });
      }

      /* ===============================================
         GENERATE SESSION-BOUND CSRF TOKEN
      =============================================== */

      const csrfToken =
        generateCsrfToken(
          sessionId
        );

      /* ===============================================
         PREVENT RESPONSE CACHING
      =============================================== */

      res.set(
        'Cache-Control',
        'no-store'
      );

      /* ===============================================
         RETURN CSRF TOKEN
      =============================================== */

      return res.json({
        success: true,

        csrfToken
      });

    } catch (error) {
      console.error(
        'Failed to generate CSRF token:',
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
);

export default router;