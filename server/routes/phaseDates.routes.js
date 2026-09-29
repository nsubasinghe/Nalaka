import express from 'express';

import pool from '../db/pool.js';

import {
  lockProject,
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  getActiveProjectVersion
} from '../services/projectVersion.service.js';

const router =
  express.Router();

/* =========================================================
   GET PHASE DATES
========================================================= */

router.get(
  '/:projectcode/:phaseid',
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

      const {
        projectcode,
        phaseid
      } = req.params;

      const state =
        await getActiveProjectVersion(
          pool,
          projectcode
        );

      if (
        state.type !== 'ok'
      ) {
        return res
          .status(
            state.type ===
              'missing'
              ? 404
              : 409
          )
          .json({
            success: false,
            error:
              state.type ===
                'missing'
                ? 'No active project version was found.'
                : 'More than one active project version exists.'
          });
      }

      const result =
        await pool.query(
          `
            SELECT
              "ProjectCode"
                AS projectcode,

              "VersionID"
                AS versionid,

              "PhaseId"
                AS phaseid,

              TO_CHAR(
                "StartDate",
                'YYYY-MM-DD'
              ) AS startdate,

              TO_CHAR(
                "EndDate",
                'YYYY-MM-DD'
              ) AS enddate

            FROM "ProjectVersionPhase"

            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2
              AND "PhaseId" = $3;
          `,
          [
            projectcode,
            state.row.versionid,
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
              'This phase does not belong to the active project version.'
          });
      }

      return res.json({
        success: true,

        phaseDates: {
          ...result.rows[0],
          status: 'A'
        }
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve phase dates.'
      );
    }
  }
);

/* =========================================================
   UPDATE PHASE DATES
========================================================= */

router.put(
  '/:projectcode/:phaseid',
  async (req, res) => {
    let client =
      null;

    try {
      if (
        !requireDatabase(
          res,
          pool
        )
      ) {
        return;
      }

      const {
        projectcode,
        phaseid
      } = req.params;

      const {
        startdate,
        enddate
      } = req.body;

      if (
        !startdate ||
        !enddate
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Start Date and End Date are required.'
          });
      }

      if (
        enddate < startdate
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'End Date cannot be earlier than Start Date.'
          });
      }

      client =
        await pool.connect();

      await client.query(
        'BEGIN'
      );

      await lockProject(
        client,
        projectcode
      );

      const state =
        await getActiveProjectVersion(
          client,
          projectcode
        );

      if (
        state.type !== 'ok'
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(
            state.type ===
              'missing'
              ? 404
              : 409
          )
          .json({
            success: false,
            error:
              state.type ===
                'missing'
                ? 'No active project version exists.'
                : 'More than one active project version exists.'
          });
      }

      const versionid =
        state.row.versionid;

      const updatePhase =
        await client.query(
          `
            UPDATE "ProjectVersionPhase"

            SET
              "StartDate" = $1,
              "EndDate" = $2,
              "UpdatedDate" =
                NOW()

            WHERE
              "ProjectCode" = $3
              AND "VersionID" = $4
              AND "PhaseId" = $5;
          `,
          [
            startdate,
            enddate,
            projectcode,
            versionid,
            phaseid
          ]
        );

      if (
        updatePhase.rowCount === 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              'This phase does not belong to the active project version.'
          });
      }

      const updateHeaders =
        await client.query(
          `
            UPDATE "PrjHeaderData"

            SET
              "StartDate" = $1,
              "EndDate" = $2

            WHERE
              "ProjectCode" = $3
              AND "VersionID" = $4
              AND "PhaseId" = $5;
          `,
          [
            startdate,
            enddate,
            projectcode,
            versionid,
            phaseid
          ]
        );

      await client.query(
        'COMMIT'
      );

      return res.json({
        success: true,

        message:
          'Phase dates updated successfully.',

        projectcode,
        phaseid,
        versionid,

        updatedRows:
          updateHeaders.rowCount,

        startdate,
        enddate
      });
    } catch (error) {
      if (client) {
        try {
          await client.query(
            'ROLLBACK'
          );
        } catch {
          // Ignore rollback error.
        }
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to update phase dates.'
      );
    } finally {
      client?.release();
    }
  }
);

export default router;