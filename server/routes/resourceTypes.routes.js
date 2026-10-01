import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  requireAuth,
  requireRole
} from '../middleware/auth.middleware.js';

const router = express.Router();

/* =========================================================
   GET RESOURCE TYPES

   ALLOWED ROLES:
   - ADMIN
   - PROJECT_MANAGER
   - PROJECT_MEMBER
   - VIEWER
========================================================= */

router.get(
  '/',

  requireAuth,

  requireRole(
    'ADMIN',
    'PROJECT_MANAGER',
    'PROJECT_MEMBER',
    'VIEWER'
  ),

  async (req, res) => {
    try {
      if (
        !requireDatabase(
          res,
          pool
        )
      ) {
        return;
      }

      const result =
        await pool.query(
          `
            SELECT
              "ResourceType"
                AS resourcetype,

              "Description"
                AS description

            FROM "ResourceType"

            ORDER BY
              "ResourceType";
          `
        );

      return res.json({
        success: true,

        resourceTypes:
          result.rows
      });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve Resource Types.'
      );
    }
  }
);

export default router;