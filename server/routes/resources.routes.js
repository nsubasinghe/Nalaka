import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

const router =
  express.Router();

/* =========================================================
   GET RESOURCES
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
              rm."ResourceId"
                AS resourceid,

              rm."FirstName"
                AS firstname,

              rm."LastName"
                AS lastname,

              rm."ResourceType"
                AS resourcetype,

              rm."InternalRoleID"
                AS internalroleid,

              pr."Description"
                AS roledescription,

              rm."Location"
                AS location,

              rm."BillRate"
                AS billrate,

              rm."CurrCode"
                AS currcode,

              rm."Cost2Co"
                AS cost2co

            FROM "ResourceMaster" rm

            LEFT JOIN "ProjectRole" pr
              ON pr."ProjectRoleID" =
                 rm."InternalRoleID"

            ORDER BY
              rm."ResourceId";
          `
        );

      return res.json({
        success: true,
        resources:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve resources.'
      );
    }
  }
);

export default router;