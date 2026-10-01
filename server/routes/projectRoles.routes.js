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
   GET PROJECT ROLES

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
              pr."ProjectRoleID"
                AS projectroleid,

              pr."RoleCatID"
                AS rolecatid,

              pr."Description"
                AS description,

              rc."Description"
                AS rolecategory

            FROM "ProjectRole" pr

            LEFT JOIN "RoleCategory" rc
              ON rc."RoleCatID" =
                 pr."RoleCatID"

            ORDER BY
              pr."ProjectRoleID";
          `
        );

      return res.json({
        success: true,

        projectRoles:
          result.rows
      });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve Project Roles.'
      );
    }
  }
);

export default router;