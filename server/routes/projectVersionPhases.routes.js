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
   GET ACTIVE VERSION PHASES
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

      const state =
        await getActiveProjectVersion(
          pool,
          projectcode
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
              'More than one active project version exists.'
          });
      }

      const versionid =
        state.row.versionid;

      const result =
        await pool.query(
          `
            SELECT
              pvp."ProjectCode"
                AS projectcode,

              pvp."VersionID"
                AS versionid,

              pvp."PhaseId"
                AS phaseid,

              pp."Description"
                AS description,

              TO_CHAR(
                pvp."StartDate",
                'YYYY-MM-DD'
              ) AS startdate,

              TO_CHAR(
                pvp."EndDate",
                'YYYY-MM-DD'
              ) AS enddate,

              pvp."SequenceNo"
                AS sequenceno,

              COUNT(
                h."LineId"
              ) AS linecount

            FROM
              "ProjectVersionPhase" pvp

            JOIN "ProjectPhase" pp
              ON pp."PhaseId" =
                 pvp."PhaseId"

            LEFT JOIN "PrjHeaderData" h
              ON h."ProjectCode" =
                 pvp."ProjectCode"

              AND h."VersionID" =
                  pvp."VersionID"

              AND h."PhaseId" =
                  pvp."PhaseId"

            WHERE
              pvp."ProjectCode" = $1
              AND pvp."VersionID" = $2

            GROUP BY
              pvp."ProjectCode",
              pvp."VersionID",
              pvp."PhaseId",
              pp."Description",
              pvp."StartDate",
              pvp."EndDate",
              pvp."SequenceNo"

            ORDER BY
              pvp."SequenceNo",
              pvp."PhaseId";
          `,
          [
            projectcode,
            versionid
          ]
        );

      return res.json({
        success: true,
        projectcode,
        versionid,
        phases:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve project version phases.'
      );
    }
  }
);

/* =========================================================
   ADD PHASE TO ACTIVE VERSION
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

      const phaseid =
        req.body
          .phaseid
          ?.trim();

      const startdate =
        req.body.startdate ||
        null;

      const enddate =
        req.body.enddate ||
        null;

      if (
        !projectcode ||
        !phaseid
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Project Code and Phase ID are required.'
          });
      }

      if (
        startdate &&
        enddate &&
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

      const masterPhase =
        await client.query(
          `
            SELECT
              "PhaseId"
                AS phaseid,

              "Description"
                AS description

            FROM "ProjectPhase"

            WHERE
              "PhaseId" = $1;
          `,
          [
            phaseid
          ]
        );

      if (
        masterPhase.rowCount === 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              `Project Phase ${phaseid} does not exist in the phase master.`
          });
      }

      const nextSequence =
        await client.query(
          `
            SELECT
              COALESCE(
                MAX("SequenceNo"),
                0
              ) + 1
                AS nextsequence

            FROM "ProjectVersionPhase"

            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2;
          `,
          [
            projectcode,
            versionid
          ]
        );

      const result =
        await client.query(
          `
            INSERT INTO "ProjectVersionPhase" (
              "ProjectCode",
              "VersionID",
              "PhaseId",
              "StartDate",
              "EndDate",
              "SequenceNo",
              "CreatedDate",
              "UpdatedDate"
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              NOW(),
              NOW()
            )

            RETURNING
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
              ) AS enddate,

              "SequenceNo"
                AS sequenceno;
          `,
          [
            projectcode,
            versionid,
            phaseid,
            startdate,
            enddate,

            Number(
              nextSequence
                .rows[0]
                .nextsequence
            )
          ]
        );

      await client.query(
        'COMMIT'
      );

      return res
        .status(201)
        .json({
          success: true,

          message:
            `Phase ${phaseid} added to Project Version ${versionid}.`,

          phase: {
            ...result.rows[0],

            description:
              masterPhase
                .rows[0]
                .description,

            linecount: 0
          }
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
        'Failed to add phase to project version.'
      );
    } finally {
      client?.release();
    }
  }
);

/* =========================================================
   UPDATE ACTIVE VERSION PHASE
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

      const projectcode =
        req.params
          .projectcode
          ?.trim();

      const phaseid =
        req.params
          .phaseid
          ?.trim();

      const startdate =
        req.body.startdate ||
        null;

      const enddate =
        req.body.enddate ||
        null;

      const sequenceno =
        req.body.sequenceno == null
          ? null
          : Number(
              req.body.sequenceno
            );

      if (
        startdate &&
        enddate &&
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

      if (
        sequenceno != null &&
        (
          !Number.isInteger(
            sequenceno
          ) ||
          sequenceno < 1
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Sequence Number must be a positive integer.'
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

      const result =
        await client.query(
          `
            UPDATE "ProjectVersionPhase"

            SET
              "StartDate" = $1,
              "EndDate" = $2,

              "SequenceNo" =
                COALESCE(
                  $3,
                  "SequenceNo"
                ),

              "UpdatedDate" =
                NOW()

            WHERE
              "ProjectCode" = $4
              AND "VersionID" = $5
              AND "PhaseId" = $6

            RETURNING
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
              ) AS enddate,

              "SequenceNo"
                AS sequenceno;
          `,
          [
            startdate,
            enddate,
            sequenceno,
            projectcode,
            versionid,
            phaseid
          ]
        );

      if (
        result.rowCount === 0
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
          `Phase ${phaseid} updated successfully.`,

        phase:
          result.rows[0]
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
        'Failed to update project version phase.'
      );
    } finally {
      client?.release();
    }
  }
);

/* =========================================================
   DELETE ACTIVE VERSION PHASE
========================================================= */

router.delete(
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

      const projectcode =
        req.params
          .projectcode
          ?.trim();

      const phaseid =
        req.params
          .phaseid
          ?.trim();

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

      const phaseResult =
        await client.query(
          `
            SELECT 1

            FROM "ProjectVersionPhase"

            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2
              AND "PhaseId" = $3;
          `,
          [
            projectcode,
            versionid,
            phaseid
          ]
        );

      if (
        phaseResult.rowCount === 0
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

      const headers =
        await client.query(
          `
            SELECT
              "PrjUUID"
                AS prjuuid,

              "LineId"
                AS lineid

            FROM "PrjHeaderData"

            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2
              AND "PhaseId" = $3;
          `,
          [
            projectcode,
            versionid,
            phaseid
          ]
        );

      for (
        const header of
        headers.rows
      ) {
        await client.query(
          `
            DELETE FROM "PrjItemData"

            WHERE
              "PrjUUID" = $1
              AND "LineId" = $2;
          `,
          [
            header.prjuuid,
            header.lineid
          ]
        );
      }

      await client.query(
        `
          DELETE FROM "PrjHeaderData"

          WHERE
            "ProjectCode" = $1
            AND "VersionID" = $2
            AND "PhaseId" = $3;
        `,
        [
          projectcode,
          versionid,
          phaseid
        ]
      );

      await client.query(
        `
          DELETE FROM "ProjectVersionPhase"

          WHERE
            "ProjectCode" = $1
            AND "VersionID" = $2
            AND "PhaseId" = $3;
        `,
        [
          projectcode,
          versionid,
          phaseid
        ]
      );

      const remaining =
        await client.query(
          `
            SELECT
              "PhaseId"
                AS phaseid

            FROM "ProjectVersionPhase"

            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2

            ORDER BY
              "SequenceNo",
              "PhaseId";
          `,
          [
            projectcode,
            versionid
          ]
        );

      for (
        let index = 0;
        index <
        remaining.rows.length;
        index += 1
      ) {
        await client.query(
          `
            UPDATE "ProjectVersionPhase"

            SET
              "SequenceNo" = $1,
              "UpdatedDate" = NOW()

            WHERE
              "ProjectCode" = $2
              AND "VersionID" = $3
              AND "PhaseId" = $4;
          `,
          [
            index + 1,
            projectcode,
            versionid,

            remaining
              .rows[index]
              .phaseid
          ]
        );
      }

      await client.query(
        'COMMIT'
      );

      return res.json({
        success: true,

        message:
          `Phase ${phaseid} removed from Project Version ${versionid}.`,

        projectcode,
        versionid,
        phaseid,

        removedResourceLines:
          headers.rowCount
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
        'Failed to remove phase from project version.'
      );
    } finally {
      client?.release();
    }
  }
);

export default router;