import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

const router =
  express.Router();

/* =========================================================
   GET PROJECT TYPES
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
              "ProjectType"
                AS projecttype,

              "Description"
                AS description

            FROM "ProjectType"

            ORDER BY
              "ProjectType";
          `
        );

      return res.json({
        success: true,
        projectTypes:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve project types.'
      );
    }
  }
);

/* =========================================================
   CREATE PROJECT TYPE
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

      const projecttype =
        req.body
          .projecttype
          ?.trim();

      const description =
        req.body
          .description
          ?.trim();

      if (
        !projecttype ||
        !description
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Project Type and Description are required.'
          });
      }

      const result =
        await pool.query(
          `
            INSERT INTO "ProjectType" (
              "ProjectType",
              "Description"
            )
            VALUES (
              $1,
              $2
            )

            RETURNING
              "ProjectType"
                AS projecttype,

              "Description"
                AS description;
          `,
          [
            projecttype,
            description
          ]
        );

      return res
        .status(201)
        .json({
          success: true,
          projectType:
            result.rows[0]
        });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create project type.'
      );
    }
  }
);

export default router;