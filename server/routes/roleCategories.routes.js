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
   GET ROLE CATEGORIES

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
              "RoleCatID"
                AS rolecatid,

              "Description"
                AS description

            FROM "RoleCategory"

            ORDER BY
              "RoleCatID";
          `
        );

      return res.json({
        success: true,

        roleCategories:
          result.rows
      });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve Role Categories.'
      );
    }
  }
);

export default router;