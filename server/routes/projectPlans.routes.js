import express from 'express';

import pool from '../db/pool.js';

import {
  lockProject,
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  makePrjUUID
} from '../utils/projectId.js';

import {
  getActiveProjectVersion
} from '../services/projectVersion.service.js';

import {
  getProjectPlanRows
} from '../services/projectPlan.service.js';

const router =
  express.Router();

/* =========================================================
   SAVE PROJECT PLAN
========================================================= */

router.post(
  '/project-plans',
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
        versionid,
        phaseid,
        startdate,
        enddate,
        rows
      } = req.body;

      if (
        !projectcode ||
        !versionid ||
        !phaseid ||
        !startdate ||
        !enddate
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Project Code, Version ID, Phase, Start Date and End Date are required.'
          });
      }

      if (
        !Array.isArray(rows) ||
        rows.length === 0
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'At least one project planning row is required.'
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

      const invalidWorkLocation =
        rows.find(
          (row) =>
            row.worklocation &&
            ![
              'Onsite',
              'Offsite',
              'Hybrid'
            ].includes(
              row.worklocation
            )
        );

      if (
        invalidWorkLocation
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Work Location must be Onsite, Offsite or Hybrid.'
          });
      }

      /*
       * Generate the exact date periods represented by the current
       * phase planning window.
       *
       * Existing PrjItemData rows whose exact period is different
       * from the current planning intervals are preserved.
       */
      const currentPlanningPeriods =
        [];

      {
        const start =
          new Date(
            `${startdate}T00:00:00Z`
          );

        const end =
          new Date(
            `${enddate}T00:00:00Z`
          );

        if (
          Number.isNaN(
            start.getTime()
          ) ||
          Number.isNaN(
            end.getTime()
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              error:
                'Start Date and End Date must be valid dates.'
            });
        }

        let currentStart =
          new Date(start);

        const toDateOnly =
          (date) =>
            date
              .toISOString()
              .slice(
                0,
                10
              );

        while (
          currentStart <= end
        ) {
          const currentDay =
            currentStart
              .getUTCDay();

          const daysUntilSunday =
            currentDay === 0
              ? 0
              : 7 - currentDay;

          let currentEnd =
            new Date(
              currentStart
            );

          currentEnd.setUTCDate(
            currentEnd.getUTCDate() +
              daysUntilSunday
          );

          if (
            currentEnd > end
          ) {
            currentEnd =
              new Date(end);
          }

          currentPlanningPeriods.push({
            startdate:
              toDateOnly(
                currentStart
              ),

            enddate:
              toDateOnly(
                currentEnd
              )
          });

          currentStart =
            new Date(
              currentEnd
            );

          currentStart.setUTCDate(
            currentStart.getUTCDate() +
              1
          );
        }
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

      const activeState =
        await getActiveProjectVersion(
          client,
          projectcode
        );

      if (
        activeState.type !==
          'ok' ||
        activeState.row.versionid !==
          versionid
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(409)
          .json({
            success: false,
            error:
              'Only the active Project Version can be edited.'
          });
      }

      const phaseMembership =
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
        phaseMembership.rowCount ===
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
              'The selected phase does not belong to the active Project Version.'
          });
      }

      const oldHeaders =
        await client.query(
          `
            SELECT
              "LineId"
                AS lineid,

              "PrjUUID"
                AS prjuuid,

              "ProjectRoleID"
                AS projectroleid,

              "ResourceId"
                AS resourceid,

              "WorkLocation"
                AS worklocation

            FROM "PrjHeaderData"

            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2
              AND "PhaseId" = $3

            ORDER BY
              "LineId";
          `,
          [
            projectcode,
            versionid,
            phaseid
          ]
        );

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

      const usedExistingLineIds =
        new Set();

      const existingLineNumbers =
        oldHeaders.rows
          .map(
            (header) =>
              Number(
                header.lineid
              )
          )
          .filter(
            (value) =>
              Number.isInteger(
                value
              ) &&
              value > 0
          );

      let nextLineNumber =
        existingLineNumbers.length > 0
          ? Math.max(
              ...existingLineNumbers
            ) + 1
          : 1;

      const savedRows =
        [];

      for (
        let index = 0;
        index < rows.length;
        index += 1
      ) {
        const row =
          rows[index];

        const weeklyAllocations =
          Array.isArray(
            row.weeks
          )
            ? row.weeks
            : [];

        const allocation =
          row.allocation === '' ||
          row.allocation == null
            ? null
            : Number(
                row.allocation
              );

        if (
          allocation != null &&
          (
            Number.isNaN(
              allocation
            ) ||
            allocation < 0 ||
            allocation > 100
          )
        ) {
          await client.query(
            'ROLLBACK'
          );

          return res
            .status(400)
            .json({
              success: false,
              error:
                'Resource allocation must be between 0 and 100.'
            });
        }

        for (
          const week of
          weeklyAllocations
        ) {
          if (
            week.allocation === '' ||
            week.allocation == null
          ) {
            continue;
          }

          const value =
            Number(
              week.allocation
            );

          if (
            Number.isNaN(
              value
            ) ||
            value < 0 ||
            value > 100
          ) {
            await client.query(
              'ROLLBACK'
            );

            return res
              .status(400)
              .json({
                success: false,
                error:
                  'Weekly allocation must be between 0 and 100.'
              });
          }

          const periodStartDate =
            week.periodstartdate ||
            week.periodStartDate ||
            null;

          const periodEndDate =
            week.periodenddate ||
            week.periodEndDate ||
            null;

          if (
            (
              periodStartDate &&
              !periodEndDate
            ) ||
            (
              !periodStartDate &&
              periodEndDate
            )
          ) {
            await client.query(
              'ROLLBACK'
            );

            return res
              .status(400)
              .json({
                success: false,
                error:
                  'Each weekly allocation must contain both Period Start Date and Period End Date.'
              });
          }

          if (
            periodStartDate &&
            periodEndDate &&
            periodEndDate <
              periodStartDate
          ) {
            await client.query(
              'ROLLBACK'
            );

            return res
              .status(400)
              .json({
                success: false,
                error:
                  'Weekly Period End Date cannot be earlier than Period Start Date.'
              });
          }
        }

        /*
         * Reuse an existing header when the same logical
         * resource row still exists.
         */
        const matchedHeader =
          oldHeaders.rows.find(
            (header) =>
              !usedExistingLineIds.has(
                header.lineid
              ) &&
              String(
                header.projectroleid ||
                  ''
              ) ===
                String(
                  row.projectroleid ||
                    ''
                ) &&
              String(
                header.resourceid ||
                  ''
              ) ===
                String(
                  row.resourceid ||
                    ''
                ) &&
              String(
                header.worklocation ||
                  ''
              ) ===
                String(
                  row.worklocation ||
                    ''
                )
          );

        let lineid;
        let prjuuid;
        let headerResult;

        if (
          matchedHeader
        ) {
          lineid =
            matchedHeader.lineid;

          prjuuid =
            matchedHeader.prjuuid;

          usedExistingLineIds.add(
            lineid
          );

          headerResult =
            await client.query(
              `
                UPDATE "PrjHeaderData"

                SET
                  "StartDate" = $1,
                  "EndDate" = $2,
                  "ProjectRoleID" = $3,
                  "ResourceId" = $4,
                  "Allocation" = $5,
                  "Status" = 'A',
                  "WorkLocation" = $6

                WHERE
                  "ProjectCode" = $7
                  AND "VersionID" = $8
                  AND "PhaseId" = $9
                  AND "LineId" = $10

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

                  "LineId"
                    AS lineid,

                  "PrjUUID"
                    AS prjuuid,

                  "ProjectRoleID"
                    AS projectroleid,

                  "ResourceId"
                    AS resourceid,

                  "Allocation"
                    AS allocation,

                  "Status"
                    AS status,

                  "WorkLocation"
                    AS worklocation;
              `,
              [
                startdate,
                enddate,

                row.projectroleid ||
                  null,

                row.resourceid ||
                  null,

                allocation,

                row.worklocation ||
                  null,

                projectcode,
                versionid,
                phaseid,
                lineid
              ]
            );
        } else {
          if (
            nextLineNumber > 999
          ) {
            await client.query(
              'ROLLBACK'
            );

            return res
              .status(400)
              .json({
                success: false,
                error:
                  'The maximum number of resource lines for this phase has been reached.'
              });
          }

          lineid =
            String(
              nextLineNumber
            ).padStart(
              3,
              '0'
            );

          nextLineNumber +=
            1;

          prjuuid =
            makePrjUUID();

          headerResult =
            await client.query(
              `
                INSERT INTO "PrjHeaderData" (
                  "ProjectCode",
                  "VersionID",
                  "PhaseId",
                  "StartDate",
                  "EndDate",
                  "LineId",
                  "PrjUUID",
                  "ProjectRoleID",
                  "ResourceId",
                  "Allocation",
                  "Status",
                  "WorkLocation"
                )
                VALUES (
                  $1,
                  $2,
                  $3,
                  $4,
                  $5,
                  $6,
                  $7,
                  $8,
                  $9,
                  $10,
                  'A',
                  $11
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

                  "LineId"
                    AS lineid,

                  "PrjUUID"
                    AS prjuuid,

                  "ProjectRoleID"
                    AS projectroleid,

                  "ResourceId"
                    AS resourceid,

                  "Allocation"
                    AS allocation,

                  "Status"
                    AS status,

                  "WorkLocation"
                    AS worklocation;
              `,
              [
                projectcode,
                versionid,
                phaseid,
                startdate,
                enddate,
                lineid,
                prjuuid,

                row.projectroleid ||
                  null,

                row.resourceid ||
                  null,

                allocation,

                row.worklocation ||
                  null
              ]
            );
        }

        /*
         * Delete only the exact periods represented by the
         * current planning window.
         *
         * Old periods with different exact boundaries remain.
         */
        for (
          const period of
          currentPlanningPeriods
        ) {
          await client.query(
            `
              DELETE FROM "PrjItemData"

              WHERE
                "PrjUUID" = $1
                AND "LineId" = $2
                AND "PeriodStartDate" = $3::DATE
                AND "PeriodEndDate" = $4::DATE;
            `,
            [
              prjuuid,
              lineid,
              period.startdate,
              period.enddate
            ]
          );
        }

        /*
         * Insert the allocations currently displayed in the UI.
         *
         * Exact period dates are part of the primary key,
         * therefore two intervals in the same ISO week can coexist.
         */
        for (
          const week of
          weeklyAllocations
        ) {
          if (
            week.allocation === '' ||
            week.allocation == null
          ) {
            continue;
          }

          const year =
            String(
              week.year
            );

          const weekno =
            String(
              week.weekno
            ).padStart(
              2,
              '0'
            );

          const periodStartDate =
            week.periodstartdate ||
            week.periodStartDate ||
            null;

          const periodEndDate =
            week.periodenddate ||
            week.periodEndDate ||
            null;

          await client.query(
            `
              INSERT INTO "PrjItemData" (
                "PrjUUID",
                "LineId",
                "Year",
                "WeekNo",
                "PeriodStartDate",
                "PeriodEndDate",
                "Allocation"
              )
              VALUES (
                $1::VARCHAR,
                $2::VARCHAR,
                $3::VARCHAR,
                $4::VARCHAR,

                COALESCE(
                  $5::DATE,

                  TO_DATE(
                    $3::TEXT || '-' ||
                    $4::TEXT || '-1',
                    'IYYY-IW-ID'
                  )
                ),

                COALESCE(
                  $6::DATE,

                  (
                    TO_DATE(
                      $3::TEXT || '-' ||
                      $4::TEXT || '-1',
                      'IYYY-IW-ID'
                    ) +
                    INTERVAL '6 days'
                  )::DATE
                ),

                $7::INTEGER
              )

              ON CONFLICT (
                "PrjUUID",
                "LineId",
                "Year",
                "WeekNo",
                "PeriodStartDate",
                "PeriodEndDate"
              )

              DO UPDATE

              SET
                "Allocation" =
                  EXCLUDED."Allocation";
            `,
            [
              prjuuid,
              lineid,
              year,
              weekno,
              periodStartDate,
              periodEndDate,

              Number(
                week.allocation
              )
            ]
          );
        }

        savedRows.push(
          headerResult.rows[0]
        );
      }

      /*
       * A header not matched by any incoming row means
       * that resource row was removed intentionally.
       */
      for (
        const oldHeader of
        oldHeaders.rows
      ) {
        if (
          usedExistingLineIds.has(
            oldHeader.lineid
          )
        ) {
          continue;
        }

        await client.query(
          `
            DELETE FROM "PrjItemData"

            WHERE
              "PrjUUID" = $1
              AND "LineId" = $2;
          `,
          [
            oldHeader.prjuuid,
            oldHeader.lineid
          ]
        );

        await client.query(
          `
            DELETE FROM "PrjHeaderData"

            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2
              AND "PhaseId" = $3
              AND "LineId" = $4;
          `,
          [
            projectcode,
            versionid,
            phaseid,
            oldHeader.lineid
          ]
        );
      }

      await client.query(
        'COMMIT'
      );

      return res
        .status(201)
        .json({
          success: true,

          message:
            'Project Plan saved successfully.',

          projectcode,
          versionid,
          phaseid,
          status: 'A',

          preservedHistoricalPeriods:
            true,

          rows:
            savedRows
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
        'Failed to save Project Plan.'
      );
    } finally {
      client?.release();
    }
  }
);

/* =========================================================
   ACTIVE PROJECT PLAN
========================================================= */

router.get(
  '/active-project-plan/:projectcode/:phaseid',
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

      const versionid =
        state.row.versionid;

      const membership =
        await pool.query(
          `
            SELECT
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
            versionid,
            phaseid
          ]
        );

      if (
        membership.rowCount ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'The selected phase does not belong to the active Project Version.'
          });
      }

      const rows =
        await getProjectPlanRows(
          pool,
          projectcode,
          versionid,
          phaseid
        );

      return res.json({
        success: true,

        projectcode,
        phaseid,

        activeVersionId:
          versionid,

        versionnote:
          state.row
            .versionnote ||
          null,

        phaseDates:
          membership.rows[0],

        rows:
          rows.map(
            (row) => ({
              ...row,
              status: 'A'
            })
          )
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve active Project Plan.'
      );
    }
  }
);

/* =========================================================
   SPECIFIC PROJECT PLAN VERSION
========================================================= */

router.get(
  '/project-plans/:projectcode/:versionid/:phaseid',
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
        versionid,
        phaseid
      } = req.params;

      const versionResult =
        await pool.query(
          `
            SELECT
              "Status"
                AS status,

              "VersionNote"
                AS versionnote

            FROM "ProjectVersion"

            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2;
          `,
          [
            projectcode,
            versionid
          ]
        );

      if (
        versionResult.rowCount ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'Project Version was not found.'
          });
      }

      const membership =
        await pool.query(
          `
            SELECT
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
            versionid,
            phaseid
          ]
        );

      if (
        membership.rowCount ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'This phase does not belong to the selected Project Version.'
          });
      }

      const version =
        versionResult.rows[0];

      const rows =
        await getProjectPlanRows(
          pool,
          projectcode,
          versionid,
          phaseid
        );

      return res.json({
        success: true,

        projectcode,
        versionid,
        phaseid,

        status:
          version.status,

        versionnote:
          version.versionnote ||
          null,

        phaseDates:
          membership.rows[0],

        rows:
          rows.map(
            (row) => ({
              ...row,

              status:
                version.status
            })
          )
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve Project Plan.'
      );
    }
  }
);

export default router;