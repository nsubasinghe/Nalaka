import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

const router =
  express.Router();

/* =========================================================
   HEALTH
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
          'SELECT NOW() AS server_time;'
        );

      return res.json({
        success: true,
        status: 'ok',
        database: 'connected',

        serverTime:
          result.rows[0]
            .server_time
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Database health check failed.'
      );
    }
  }
);

export default router;