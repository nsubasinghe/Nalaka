import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  activateProjectVersion,
  createProjectVersion,
  getActiveProjectVersion
} from '../services/projectVersion.service.js';

const router =
  express.Router();

/* =========================================================
   GET ACTIVE PROJECT VERSION
========================================================= */

router.get(
  '/:projectcode/active',
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

      const state =
        await getActiveProjectVersion(
          pool,
          req.params
            .projectcode
            ?.trim()
        );

      if (
        state.type === 'missing'
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'No active project version was found.'
          });
      }

      if (
        state.type === 'multiple'
      ) {
        return res
          .status(409)
          .json({
            success: false,
            error:
              'More than one active project version exists.',
            activeVersions:
              state.rows
          });
      }

      return res.json({
        success: true,
        activeVersion:
          state.row
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve active project version.'
      );
    }
  }
);

/* =========================================================
   GET ALL PROJECT VERSIONS
========================================================= */

router.get(
  '/:projectcode',
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

      const projectcode =
        req.params
          .projectcode
          ?.trim();

      const result =
        await pool.query(
          `
            SELECT
              pv."ProjectCode"
                AS projectcode,

              pv."VersionID"
                AS versionid,

              pv."Status"
                AS status,

              pv."VersionNote"
                AS versionnote,

              pv."CreatedDate"
                AS createddate,

              pv."UpdatedDate"
                AS updateddate,

              COUNT(
                DISTINCT
                pvp."PhaseId"
              ) AS phasecount,

              COUNT(
                DISTINCT (
                  h."PhaseId",
                  h."LineId"
                )
              ) AS linecount

            FROM "ProjectVersion" pv

            LEFT JOIN
              "ProjectVersionPhase" pvp
              ON pvp."ProjectCode" =
                 pv."ProjectCode"

              AND pvp."VersionID" =
                  pv."VersionID"

            LEFT JOIN
              "PrjHeaderData" h
              ON h."ProjectCode" =
                 pv."ProjectCode"

              AND h."VersionID" =
                  pv."VersionID"

            WHERE
              pv."ProjectCode" = $1

            GROUP BY
              pv."ProjectCode",
              pv."VersionID",
              pv."Status",
              pv."VersionNote",
              pv."CreatedDate",
              pv."UpdatedDate"

            ORDER BY
              CASE
                WHEN pv."VersionID" ~
                  '^[0-9]+$'
                  THEN
                    pv."VersionID"::INTEGER
                ELSE 999
              END,

              pv."VersionID";
          `,
          [
            projectcode
          ]
        );

      return res.json({
        success: true,
        projectcode,
        versions:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve project versions.'
      );
    }
  }
);

/* =========================================================
   GET INACTIVE PROJECT VERSIONS
========================================================= */

router.get(
  '/:projectcode/inactive',
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

      const projectcode =
        req.params
          .projectcode
          ?.trim();

      const result =
        await pool.query(
          `
            SELECT
              pv."ProjectCode"
                AS projectcode,

              pv."VersionID"
                AS versionid,

              pv."Status"
                AS status,

              pv."VersionNote"
                AS versionnote,

              pv."CreatedDate"
                AS createddate,

              pv."UpdatedDate"
                AS updateddate,

              COUNT(
                DISTINCT
                pvp."PhaseId"
              ) AS phasecount,

              COUNT(
                DISTINCT (
                  h."PhaseId",
                  h."LineId"
                )
              ) AS linecount

            FROM "ProjectVersion" pv

            LEFT JOIN
              "ProjectVersionPhase" pvp
              ON pvp."ProjectCode" =
                 pv."ProjectCode"

              AND pvp."VersionID" =
                  pv."VersionID"

            LEFT JOIN
              "PrjHeaderData" h
              ON h."ProjectCode" =
                 pv."ProjectCode"

              AND h."VersionID" =
                  pv."VersionID"

            WHERE
              pv."ProjectCode" = $1
              AND pv."Status" = 'I'

            GROUP BY
              pv."ProjectCode",
              pv."VersionID",
              pv."Status",
              pv."VersionNote",
              pv."CreatedDate",
              pv."UpdatedDate"

            ORDER BY
              CASE
                WHEN pv."VersionID" ~
                  '^[0-9]+$'
                  THEN
                    pv."VersionID"::INTEGER
                ELSE 999
              END,

              pv."VersionID";
          `,
          [
            projectcode
          ]
        );

      return res.json({
        success: true,
        projectcode,
        inactiveVersions:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve inactive project versions.'
      );
    }
  }
);

/* =========================================================
   ACTIVATE PROJECT VERSION
========================================================= */

router.post(
  '/:projectcode/:versionid/activate',
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

      const projectcode =
        req.params
          .projectcode
          ?.trim();

      const versionid =
        req.params
          .versionid
          ?.trim();

      client =
        await pool.connect();

      await client.query(
        'BEGIN'
      );

      const result =
        await activateProjectVersion(
          client,
          projectcode,
          versionid
        );

      if (
        !result.ok
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(
            result.statusCode
          )
          .json({
            success: false,
            error:
              result.error
          });
      }

      await client.query(
        'COMMIT'
      );

      return res.json({
        success: true,

        message:
          result.alreadyActive
            ? `Version ${versionid} is already active.`
            : `Project Version ${versionid} activated successfully.`,

        projectcode,
        versionid,
        status: 'A',

        versionNote:
          result.versionnote,

        alreadyActive:
          result.alreadyActive
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
        'Failed to activate project version.'
      );
    } finally {
      client?.release();
    }
  }
);

/* =========================================================
   CREATE NEW PROJECT VERSION
========================================================= */

router.post(
  '/:projectcode',
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

      const projectcode =
        req.params
          .projectcode
          ?.trim();

      const versionnote =
        req.body
          .versionnote
          ?.trim() ||
        null;

      if (
        !projectcode
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Project Code is required.'
          });
      }

      if (
        versionnote &&
        versionnote.length > 255
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Version Note cannot exceed 255 characters.'
          });
      }

      client =
        await pool.connect();

      await client.query(
        'BEGIN'
      );

      const result =
        await createProjectVersion(
          client,
          projectcode,
          versionnote
        );

      if (
        !result.ok
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(
            result.statusCode
          )
          .json({
            success: false,
            error:
              result.error
          });
      }

      await client.query(
        'COMMIT'
      );

      return res
        .status(201)
        .json({
          success: true,

          message:
            `Project Version ${result.newVersionId} created successfully and activated.`,

          projectcode,

          previousVersionId:
            result.previousVersionId,

          newVersionId:
            result.newVersionId,

          versionNote:
            result.versionNote,

          copiedPhaseCount:
            result.copiedPhaseCount,

          copiedHeaderRows:
            result.copiedHeaderRows,

          copiedItemRows:
            result.copiedItemRows
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
        'Failed to create new project version.'
      );
    } finally {
      client?.release();
    }
  }
);

export default router;