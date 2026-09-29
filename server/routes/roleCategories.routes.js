import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

const router =
  express.Router();

/* =========================================================
   GET ROLE CATEGORIES
========================================================= */

router.get(
  '/',
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