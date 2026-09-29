import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

const router =
  express.Router();

/* =========================================================
   GET CURRENCIES
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
              "CurrCode"
                AS currcode,

              "Description"
                AS description

            FROM "Currency"

            ORDER BY
              "CurrCode";
          `
        );

      return res.json({
        success: true,
        currencies:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve currencies.'
      );
    }
  }
);

/* =========================================================
   CREATE CURRENCY
========================================================= */

router.post(
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

      const currcode =
        req.body
          .currcode
          ?.trim()
          .toUpperCase();

      const description =
        req.body
          .description
          ?.trim();

      if (
        !currcode ||
        !description
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Currency Code and Description are required.'
          });
      }

      const result =
        await pool.query(
          `
            INSERT INTO "Currency" (
              "CurrCode",
              "Description"
            )
            VALUES (
              $1,
              $2
            )

            RETURNING
              "CurrCode"
                AS currcode,

              "Description"
                AS description;
          `,
          [
            currcode,
            description
          ]
        );

      return res
        .status(201)
        .json({
          success: true,
          currency:
            result.rows[0]
        });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create currency.'
      );
    }
  }
);

export default router;