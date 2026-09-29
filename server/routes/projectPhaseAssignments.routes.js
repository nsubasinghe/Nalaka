import express from 'express';

import pool from '../db/pool.js';

import {
  lockProject,
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

const router =
  express.Router();

/* =========================================================
   GET PROJECT PHASE ASSIGNMENTS
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
              ppa."ProjectCode"
                AS projectcode,

              ppa."PhaseId"
                AS phaseid,

              pp."Description"
                AS description,

              ppa."SequenceNo"
                AS sequenceno,

              ppa."CreatedDate"
                AS createddate,

              ppa."UpdatedDate"
                AS updateddate

            FROM
              "ProjectPhaseAssignment" ppa

            JOIN "ProjectPhase" pp
              ON pp."PhaseId" =
                 ppa."PhaseId"

            WHERE
              ppa."ProjectCode" = $1

            ORDER BY
              ppa."SequenceNo",
              ppa."PhaseId";
          `,
          [
            projectcode
          ]
        );

      return res.json({
        success: true,
        projectcode,
        phases:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve project phase assignments.'
      );
    }
  }
);

/* =========================================================
   ASSIGN PROJECT PHASES
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

      const rawPhaseIds =
        Array.isArray(
          req.body.phaseids
        )
          ? req.body.phaseids
          : req.body.phaseid
            ? [
                req.body.phaseid
              ]
            : [];

      const phaseids =
        [
          ...new Set(
            rawPhaseIds
              .map(
                (phaseid) =>
                  String(
                    phaseid || ''
                  ).trim()
              )
              .filter(Boolean)
          )
        ];

      if (
        !projectcode ||
        phaseids.length === 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Project Code and at least one Phase ID are required.'
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

      const projectExists =
        await client.query(
          `
            SELECT 1

            FROM "ProjectMaster"

            WHERE
              "ProjectCode" = $1

            LIMIT 1;
          `,
          [
            projectcode
          ]
        );

      if (
        projectExists.rowCount ===
        0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              `Project ${projectcode} was not found.`
          });
      }

      const masterPhases =
        await client.query(
          `
            SELECT
              "PhaseId"
                AS phaseid,

              "Description"
                AS description

            FROM "ProjectPhase"

            WHERE
              "PhaseId" = ANY($1::VARCHAR[]);
          `,
          [
            phaseids
          ]
        );

      const foundPhaseIds =
        new Set(
          masterPhases.rows.map(
            (phase) =>
              String(
                phase.phaseid
              )
          )
        );

      const missingPhaseIds =
        phaseids.filter(
          (phaseid) =>
            !foundPhaseIds.has(
              String(
                phaseid
              )
            )
        );

      if (
        missingPhaseIds.length > 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              `The following Project Phase ID(s) do not exist in the phase master: ${missingPhaseIds.join(', ')}.`
          });
      }

      const existingAssignments =
        await client.query(
          `
            SELECT
              "PhaseId"
                AS phaseid

            FROM "ProjectPhaseAssignment"

            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = ANY($2::VARCHAR[]);
          `,
          [
            projectcode,
            phaseids
          ]
        );

      const existingPhaseIds =
        new Set(
          existingAssignments.rows.map(
            (row) =>
              String(
                row.phaseid
              )
          )
        );

      const phaseIdsToAssign =
        phaseids.filter(
          (phaseid) =>
            !existingPhaseIds.has(
              String(
                phaseid
              )
            )
        );

      const maxSequenceResult =
        await client.query(
          `
            SELECT
              COALESCE(
                MAX("SequenceNo"),
                0
              ) AS maxsequence

            FROM "ProjectPhaseAssignment"

            WHERE
              "ProjectCode" = $1;
          `,
          [
            projectcode
          ]
        );

      const currentMaxSequence =
        Number(
          maxSequenceResult
            .rows[0]
            .maxsequence ||
          0
        );

      const versions =
        await client.query(
          `
            SELECT
              "VersionID"
                AS versionid

            FROM "ProjectVersion"

            WHERE
              "ProjectCode" = $1

            ORDER BY
              CASE
                WHEN "VersionID" ~
                  '^[0-9]+$'
                  THEN
                    "VersionID"::INTEGER
                ELSE 999
              END,

              "VersionID";
          `,
          [
            projectcode
          ]
        );

      const descriptionByPhaseId =
        new Map(
          masterPhases.rows.map(
            (phase) => [
              String(
                phase.phaseid
              ),
              phase.description
            ]
          )
        );

      const assignedPhases =
        [];

      for (
        let index = 0;
        index < phaseIdsToAssign.length;
        index += 1
      ) {
        const phaseid =
          phaseIdsToAssign[index];

        const sequenceNo =
          currentMaxSequence +
          index +
          1;

        const assignmentResult =
          await client.query(
            `
              INSERT INTO "ProjectPhaseAssignment" (
                "ProjectCode",
                "PhaseId",
                "SequenceNo",
                "CreatedDate",
                "UpdatedDate"
              )
              VALUES (
                $1,
                $2,
                $3,
                NOW(),
                NOW()
              )

              RETURNING
                "ProjectCode"
                  AS projectcode,

                "PhaseId"
                  AS phaseid,

                "SequenceNo"
                  AS sequenceno;
            `,
            [
              projectcode,
              phaseid,
              sequenceNo
            ]
          );

        for (
          const version of
          versions.rows
        ) {
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
                NULL,
                NULL,
                $4,
                NOW(),
                NOW()
              )

              ON CONFLICT (
                "ProjectCode",
                "VersionID",
                "PhaseId"
              )

              DO UPDATE

              SET
                "SequenceNo" =
                  EXCLUDED."SequenceNo",

                "UpdatedDate" =
                  NOW();
            `,
            [
              projectcode,
              version.versionid,
              phaseid,
              sequenceNo
            ]
          );
        }

        assignedPhases.push({
          ...assignmentResult.rows[0],

          description:
            descriptionByPhaseId.get(
              String(
                phaseid
              )
            ) || ''
        });
      }

      await client.query(
        'COMMIT'
      );

      const skippedExistingPhaseIds =
        phaseids.filter(
          (phaseid) =>
            existingPhaseIds.has(
              String(
                phaseid
              )
            )
        );

      return res
        .status(
          assignedPhases.length > 0
            ? 201
            : 200
        )
        .json({
          success: true,

          message:
            assignedPhases.length > 0
              ? `${assignedPhases.length} phase(s) assigned to Project ${projectcode} and synchronized to all project versions.`
              : `All selected phases are already assigned to Project ${projectcode}.`,

          projectcode,

          assignedPhases,

          assignedCount:
            assignedPhases.length,

          skippedExistingPhaseIds,

          synchronizedVersionCount:
            versions.rowCount
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
        'Failed to assign phases to project.'
      );
    } finally {
      client?.release();
    }
  }
);

/* =========================================================
   UPDATE PROJECT PHASE ASSIGNMENT
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

      const sequenceno =
        Number(
          req.body.sequenceno
        );

      if (
        !Number.isInteger(
          sequenceno
        ) ||
        sequenceno < 1
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

      const result =
        await client.query(
          `
            UPDATE "ProjectPhaseAssignment"

            SET
              "SequenceNo" = $1,
              "UpdatedDate" = NOW()

            WHERE
              "ProjectCode" = $2
              AND "PhaseId" = $3

            RETURNING
              "ProjectCode"
                AS projectcode,

              "PhaseId"
                AS phaseid,

              "SequenceNo"
                AS sequenceno;
          `,
          [
            sequenceno,
            projectcode,
            phaseid
          ]
        );

      if (
        result.rowCount ===
        0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              'Project phase assignment was not found.'
          });
      }

      await client.query(
        `
          UPDATE "ProjectVersionPhase"

          SET
            "SequenceNo" = $1,
            "UpdatedDate" = NOW()

          WHERE
            "ProjectCode" = $2
            AND "PhaseId" = $3;
        `,
        [
          sequenceno,
          projectcode,
          phaseid
        ]
      );

      await client.query(
        'COMMIT'
      );

      return res.json({
        success: true,

        message:
          `Phase ${phaseid} sequence updated for Project ${projectcode}.`,

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
        'Failed to update project phase assignment.'
      );
    } finally {
      client?.release();
    }
  }
);

/* =========================================================
   DELETE PROJECT PHASE ASSIGNMENT
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

      const assignment =
        await client.query(
          `
            SELECT
              "ProjectCode"
                AS projectcode,

              "PhaseId"
                AS phaseid

            FROM "ProjectPhaseAssignment"

            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2;
          `,
          [
            projectcode,
            phaseid
          ]
        );

      if (
        assignment.rowCount ===
        0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              'Project phase assignment was not found.'
          });
      }

      const planningRows =
        await client.query(
          `
            SELECT
              COUNT(*)::INTEGER
                AS count

            FROM "PrjHeaderData"

            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2;
          `,
          [
            projectcode,
            phaseid
          ]
        );

      if (
        planningRows
          .rows[0]
          .count > 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(409)
          .json({
            success: false,
            error:
              'This project phase already contains planning data in one or more project versions. Remove that planning data before unassigning the phase.'
          });
      }

      await client.query(
        `
          DELETE FROM "ProjectVersionPhase"

          WHERE
            "ProjectCode" = $1
            AND "PhaseId" = $2;
        `,
        [
          projectcode,
          phaseid
        ]
      );

      await client.query(
        `
          DELETE FROM "ProjectPhaseAssignment"

          WHERE
            "ProjectCode" = $1
            AND "PhaseId" = $2;
        `,
        [
          projectcode,
          phaseid
        ]
      );

      const remaining =
        await client.query(
          `
            SELECT
              "PhaseId"
                AS phaseid

            FROM "ProjectPhaseAssignment"

            WHERE
              "ProjectCode" = $1

            ORDER BY
              "SequenceNo",
              "PhaseId";
          `,
          [
            projectcode
          ]
        );

      for (
        let index = 0;
        index <
        remaining.rows.length;
        index += 1
      ) {
        const sequenceNo =
          index + 1;

        const remainingPhaseId =
          remaining
            .rows[index]
            .phaseid;

        await client.query(
          `
            UPDATE "ProjectPhaseAssignment"

            SET
              "SequenceNo" = $1,
              "UpdatedDate" = NOW()

            WHERE
              "ProjectCode" = $2
              AND "PhaseId" = $3;
          `,
          [
            sequenceNo,
            projectcode,
            remainingPhaseId
          ]
        );

        await client.query(
          `
            UPDATE "ProjectVersionPhase"

            SET
              "SequenceNo" = $1,
              "UpdatedDate" = NOW()

            WHERE
              "ProjectCode" = $2
              AND "PhaseId" = $3;
          `,
          [
            sequenceNo,
            projectcode,
            remainingPhaseId
          ]
        );
      }

      await client.query(
        'COMMIT'
      );

      return res.json({
        success: true,

        message:
          `Phase ${phaseid} unassigned from Project ${projectcode} and removed from all project versions.`,

        projectcode,
        phaseid
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
        'Failed to unassign phase from project.'
      );
    } finally {
      client?.release();
    }
  }
);

export default router;