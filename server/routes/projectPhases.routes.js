import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  requireAuth,
  requireRole,
  requireAdmin
} from '../middleware/auth.middleware.js';

const router = express.Router();

/* =========================================================
   PROJECT PHASE MASTER READ PERMISSIONS
========================================================= */

const requireMasterDataRead = requireRole(
  'ADMIN',
  'PROJECT_MANAGER',
  'PROJECT_MEMBER',
  'VIEWER'
);

/* =========================================================
   GET PROJECT PHASES

   ALLOWED:
   - ADMIN
   - PROJECT_MANAGER
   - PROJECT_MEMBER
   - VIEWER
========================================================= */

router.get(
  '/',

  requireAuth,
  requireMasterDataRead,

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
              "PhaseId"
                AS phaseid,

              "Description"
                AS description

            FROM "ProjectPhase"

            ORDER BY
              "PhaseId";
          `
        );

      return res.json({
        success: true,
        projectPhases:
          result.rows
      });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve Project Phases.'
      );
    }
  }
);

/* =========================================================
   CREATE PROJECT PHASE

   ALLOWED:
   - ADMIN ONLY
========================================================= */

router.post(
  '/',

  requireAuth,
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

      const phaseid =
        req.body
          .phaseid
          ?.trim();

      const description =
        req.body
          .description
          ?.trim();

      if (
        !phaseid ||
        !description
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Phase ID and Description are required.'
          });
      }

      if (
        phaseid.length > 2
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Phase ID cannot exceed 2 characters.'
          });
      }

      const result =
        await pool.query(
          `
            INSERT INTO "ProjectPhase" (
              "PhaseId",
              "Description"
            )

            VALUES (
              $1,
              $2
            )

            RETURNING
              "PhaseId"
                AS phaseid,

              "Description"
                AS description;
          `,
          [
            phaseid,
            description
          ]
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            'Project Phase created successfully.',
          projectPhase:
            result.rows[0]
        });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create Project Phase.'
      );
    }
  }
);

/* =========================================================
   UPDATE PROJECT PHASE

   ALLOWED:
   - ADMIN ONLY
========================================================= */

router.put(
  '/:phaseid',

  requireAuth,
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

      const phaseid =
        req.params
          .phaseid
          ?.trim();

      const description =
        req.body
          .description
          ?.trim();

      if (
        !phaseid ||
        !description
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Phase ID and Description are required.'
          });
      }

      const result =
        await pool.query(
          `
            UPDATE "ProjectPhase"

            SET
              "Description" = $1

            WHERE
              "PhaseId" = $2

            RETURNING
              "PhaseId"
                AS phaseid,

              "Description"
                AS description;
          `,
          [
            description,
            phaseid
          ]
        );

      if (
        result.rowCount === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'Project Phase was not found.'
          });
      }

      return res.json({
        success: true,
        message:
          'Project Phase updated successfully.',
        projectPhase:
          result.rows[0]
      });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to update Project Phase.'
      );
    }
  }
);

/* =========================================================
   DELETE PROJECT PHASE

   ALLOWED:
   - ADMIN ONLY
========================================================= */

router.delete(
  '/:phaseid',

  requireAuth,
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

      const phaseid =
        req.params
          .phaseid
          ?.trim();

      /* ===============================================
         CHECK PROJECT ASSIGNMENTS
      =============================================== */

      const assignmentCount =
        await pool.query(
          `
            SELECT
              COUNT(*)::INTEGER
                AS count

            FROM "ProjectPhaseAssignment"

            WHERE
              "PhaseId" = $1;
          `,
          [
            phaseid
          ]
        );

      /* ===============================================
         CHECK PROJECT VERSION ASSIGNMENTS
      =============================================== */

      const versionCount =
        await pool.query(
          `
            SELECT
              COUNT(*)::INTEGER
                AS count

            FROM "ProjectVersionPhase"

            WHERE
              "PhaseId" = $1;
          `,
          [
            phaseid
          ]
        );

      /* ===============================================
         PREVENT DELETION OF ASSIGNED PHASES
      =============================================== */

      if (
        assignmentCount
          .rows[0]
          .count > 0 ||
        versionCount
          .rows[0]
          .count > 0
      ) {
        return res
          .status(409)
          .json({
            success: false,
            error:
              'This phase is assigned to one or more projects or project versions. Remove those assignments before deleting the master phase.'
          });
      }

      /* ===============================================
         DELETE UNASSIGNED PHASE
      =============================================== */

      const result =
        await pool.query(
          `
            DELETE FROM "ProjectPhase"

            WHERE
              "PhaseId" = $1

            RETURNING
              "PhaseId"
                AS phaseid,

              "Description"
                AS description;
          `,
          [
            phaseid
          ]
        );

      if (
        result.rowCount === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'Project Phase was not found.'
          });
      }

      return res.json({
        success: true,
        message:
          'Project Phase deleted successfully.',
        projectPhase:
          result.rows[0]
      });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to delete Project Phase.'
      );
    }
  }
);

export default router;