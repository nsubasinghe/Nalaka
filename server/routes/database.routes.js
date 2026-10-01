import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  requireAdmin
} from '../middleware/auth.middleware.js';

const router =
  express.Router();

/* =========================================================
   GET DATABASE TABLES
   ADMINISTRATOR ONLY
========================================================= */

router.get(
  '/tables',

  requireAdmin,

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
              table_name

            FROM information_schema.tables

            WHERE
              table_schema = 'public'

            ORDER BY
              table_name;
          `
        );

      return res.json({
        success: true,

        tables:
          result.rows.map(
            (row) =>
              row.table_name
          )
      });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve database tables.'
      );
    }
  }
);

export default router;