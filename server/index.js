import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from 'pg';
import { randomUUID } from 'crypto';

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

/* =========================================================
   DATABASE
========================================================= */

let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

/* =========================================================
   HELPERS
========================================================= */

function requireDatabase(res) {
  if (!pool) {
    res.status(500).json({
      success: false,
      error: 'DATABASE_URL is not configured.'
    });

    return false;
  }

  return true;
}

function sendDatabaseError(
  res,
  error,
  defaultMessage
) {
  console.error(
    defaultMessage,
    error
  );

  if (error.code === '23505') {
    return res.status(409).json({
      success: false,
      error:
        'A record with the same key already exists.'
    });
  }

  if (error.code === '23503') {
    return res.status(409).json({
      success: false,
      error:
        'This operation cannot be completed because the record is referenced by another table.'
    });
  }

  if (error.code === '23514') {
    return res.status(400).json({
      success: false,
      error:
        'One or more values failed a database validation rule.'
    });
  }

  if (error.code === '23502') {
    return res.status(400).json({
      success: false,
      error:
        'One or more required values are missing.'
    });
  }

  if (error.code === '22001') {
    return res.status(400).json({
      success: false,
      error:
        'One or more values exceed the maximum allowed length.'
    });
  }

  return res.status(500).json({
    success: false,
    error:
      error.message ||
      defaultMessage
  });
}

/* =========================================================
   HEALTH
========================================================= */

app.get(
  '/api/health',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
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
          result.rows[0].server_time
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

/* =========================================================
   DATABASE TABLES
========================================================= */

app.get(
  '/api/database/tables',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `);

      return res.json({
        success: true,
        tables:
          result.rows.map(
            (row) =>
              row.table_name
          )
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve database tables.'
      );
    }
  }
);

/* =========================================================
   PROJECT TYPES
========================================================= */

app.get(
  '/api/project-types',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            "ProjectType"
              AS projecttype,
            "Description"
              AS description
          FROM "ProjectType"
          ORDER BY "ProjectType";
        `);

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

app.post(
  '/api/project-types',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      let {
        projecttype,
        description
      } = req.body;

      projecttype =
        projecttype?.trim();

      description =
        description?.trim();

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
            VALUES ($1, $2)
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

/* =========================================================
   BUSINESS PARTNERS
========================================================= */

app.get(
  '/api/business-partners',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            "PartnerId"
              AS partnerid,
            "Description"
              AS description
          FROM "BusinessPartner"
          ORDER BY "PartnerId";
        `);

      return res.json({
        success: true,
        businessPartners:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve business partners.'
      );
    }
  }
);

app.get(
  '/api/customers',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            "PartnerId"
              AS partnerid,
            "Description"
              AS description
          FROM "BusinessPartner"
          ORDER BY "PartnerId";
        `);

      return res.json({
        success: true,
        customers:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve customers.'
      );
    }
  }
);

app.post(
  '/api/business-partners',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      let {
        partnerid,
        description
      } = req.body;

      partnerid =
        partnerid
          ?.trim()
          .toUpperCase();

      description =
        description?.trim();

      if (
        !partnerid ||
        !description
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Partner ID and Description are required.'
          });
      }

      const result =
        await pool.query(
          `
            INSERT INTO "BusinessPartner" (
              "PartnerId",
              "Description"
            )
            VALUES ($1, $2)
            RETURNING
              "PartnerId"
                AS partnerid,
              "Description"
                AS description;
          `,
          [
            partnerid,
            description
          ]
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            'Business Partner saved successfully.',
          businessPartner:
            result.rows[0]
        });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create Business Partner.'
      );
    }
  }
);

app.put(
  '/api/business-partners/:partnerid',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const partnerid =
        req.params.partnerid
          ?.trim()
          .toUpperCase();

      const description =
        req.body.description
          ?.trim();

      if (
        !partnerid ||
        !description
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Partner ID and Description are required.'
          });
      }

      const result =
        await pool.query(
          `
            UPDATE "BusinessPartner"
            SET "Description" = $1
            WHERE "PartnerId" = $2
            RETURNING
              "PartnerId"
                AS partnerid,
              "Description"
                AS description;
          `,
          [
            description,
            partnerid
          ]
        );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'Business Partner was not found.'
          });
      }

      return res.json({
        success: true,
        message:
          'Business Partner updated successfully.',
        businessPartner:
          result.rows[0]
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to update Business Partner.'
      );
    }
  }
);

app.delete(
  '/api/business-partners/:partnerid',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const partnerid =
        req.params.partnerid
          ?.trim()
          .toUpperCase();

      const result =
        await pool.query(
          `
            DELETE FROM "BusinessPartner"
            WHERE "PartnerId" = $1
            RETURNING
              "PartnerId"
                AS partnerid,
              "Description"
                AS description;
          `,
          [partnerid]
        );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'Business Partner was not found.'
          });
      }

      return res.json({
        success: true,
        message:
          'Business Partner deleted successfully.',
        businessPartner:
          result.rows[0]
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to delete Business Partner.'
      );
    }
  }
);

/* =========================================================
   CURRENCIES
========================================================= */

app.get(
  '/api/currencies',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            "CurrCode"
              AS currcode,
            "Description"
              AS description
          FROM "Currency"
          ORDER BY "CurrCode";
        `);

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

app.post(
  '/api/currencies',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      let {
        currcode,
        description
      } = req.body;

      currcode =
        currcode
          ?.trim()
          .toUpperCase();

      description =
        description?.trim();

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
            VALUES ($1, $2)
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

/* =========================================================
   PROJECT PHASE MASTER
========================================================= */

app.get(
  '/api/project-phases',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            "PhaseId"
              AS phaseid,
            "Description"
              AS description
          FROM "ProjectPhase"
          ORDER BY "PhaseId";
        `);

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
   ACTIVE VERSION LOOKUP

   ProjectPhaseVersion is now the authoritative
   phase-specific version table.
========================================================= */

app.get(
  '/api/project-phases/:projectcode/:phaseid/active-version',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const {
        projectcode,
        phaseid
      } = req.params;

      const result =
        await pool.query(
          `
            SELECT
              "ProjectCode"
                AS projectcode,
              "PhaseId"
                AS phaseid,
              "VersionID"
                AS versionid,
              "Status"
                AS status,
              "VersionNote"
                AS versionnote
            FROM "ProjectPhaseVersion"
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "Status" = 'A'
            ORDER BY
              "VersionID";
          `,
          [
            projectcode,
            phaseid
          ]
        );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'No active version was found for this project phase.'
          });
      }

      if (result.rowCount > 1) {
        return res
          .status(409)
          .json({
            success: false,
            error:
              'More than one active version exists for this project phase.',
            activeVersions:
              result.rows
          });
      }

      return res.json({
        success: true,
        activeVersion:
          result.rows[0]
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve active version.'
      );
    }
  }
);

/* =========================================================
   ACTIVE PHASE DATES
========================================================= */

app.get(
  '/api/phase-dates/:projectcode/:phaseid',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const {
        projectcode,
        phaseid
      } = req.params;

      const result =
        await pool.query(
          `
            SELECT
              ppv."ProjectCode"
                AS projectcode,
              ppv."PhaseId"
                AS phaseid,
              ppv."VersionID"
                AS versionid,
              ppv."Status"
                AS status,
              TO_CHAR(
                MIN(h."StartDate"),
                'YYYY-MM-DD'
              )
                AS startdate,
              TO_CHAR(
                MAX(h."EndDate"),
                'YYYY-MM-DD'
              )
                AS enddate
            FROM "ProjectPhaseVersion" ppv
            LEFT JOIN "PrjHeaderData" h
              ON
                h."ProjectCode" =
                ppv."ProjectCode"
                AND h."PhaseId" =
                ppv."PhaseId"
                AND h."VersionID" =
                ppv."VersionID"
            WHERE
              ppv."ProjectCode" = $1
              AND ppv."PhaseId" = $2
              AND ppv."Status" = 'A'
            GROUP BY
              ppv."ProjectCode",
              ppv."PhaseId",
              ppv."VersionID",
              ppv."Status";
          `,
          [
            projectcode,
            phaseid
          ]
        );

      if (result.rowCount === 0) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'No active phase plan was found.'
          });
      }

      if (result.rowCount > 1) {
        return res
          .status(409)
          .json({
            success: false,
            error:
              'More than one active VersionID exists for this project phase.'
          });
      }

      return res.json({
        success: true,
        phaseDates:
          result.rows[0]
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
   UPDATE ACTIVE PHASE DATES
========================================================= */

app.put(
  '/api/phase-dates/:projectcode/:phaseid',
  async (req, res) => {
    let client = null;

    try {
      if (!requireDatabase(res)) {
        return;
      }

      client =
        await pool.connect();

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

      if (enddate < startdate) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'End Date cannot be earlier than Start Date.'
          });
      }

      await client.query(
        'BEGIN'
      );

      const activeResult =
        await client.query(
          `
            SELECT
              "VersionID"
                AS versionid
            FROM "ProjectPhaseVersion"
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "Status" = 'A';
          `,
          [
            projectcode,
            phaseid
          ]
        );

      if (
        activeResult.rowCount === 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              'No active version exists for this project phase.'
          });
      }

      if (
        activeResult.rowCount > 1
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(409)
          .json({
            success: false,
            error:
              'More than one active VersionID exists for this project phase.'
          });
      }

      const versionid =
        activeResult
          .rows[0]
          .versionid;

      const updateResult =
        await client.query(
          `
            UPDATE "PrjHeaderData"
            SET
              "StartDate" = $1,
              "EndDate" = $2
            WHERE
              "ProjectCode" = $3
              AND "PhaseId" = $4
              AND "VersionID" = $5
            RETURNING
              "ProjectCode"
                AS projectcode,
              "VersionID"
                AS versionid,
              "PhaseId"
                AS phaseid,
              "LineId"
                AS lineid,
              TO_CHAR(
                "StartDate",
                'YYYY-MM-DD'
              )
                AS startdate,
              TO_CHAR(
                "EndDate",
                'YYYY-MM-DD'
              )
                AS enddate;
          `,
          [
            startdate,
            enddate,
            projectcode,
            phaseid,
            versionid
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
          updateResult.rowCount,
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
      if (client) {
        client.release();
      }
    }
  }
);

/* =========================================================
   INACTIVE PHASE VERSIONS
========================================================= */

app.get(
  '/api/project-phase-versions/:projectcode/:phaseid/inactive',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const {
        projectcode,
        phaseid
      } = req.params;

      const result =
        await pool.query(
          `
            SELECT
              ppv."ProjectCode"
                AS projectcode,
              ppv."PhaseId"
                AS phaseid,
              ppv."VersionID"
                AS versionid,
              ppv."Status"
                AS status,
              ppv."VersionNote"
                AS versionnote,
              TO_CHAR(
                MIN(h."StartDate"),
                'YYYY-MM-DD'
              )
                AS startdate,
              TO_CHAR(
                MAX(h."EndDate"),
                'YYYY-MM-DD'
              )
                AS enddate,
              COUNT(h."LineId")
                AS linecount
            FROM "ProjectPhaseVersion" ppv
            LEFT JOIN "PrjHeaderData" h
              ON
                h."ProjectCode" =
                ppv."ProjectCode"
                AND h."PhaseId" =
                ppv."PhaseId"
                AND h."VersionID" =
                ppv."VersionID"
            WHERE
              ppv."ProjectCode" = $1
              AND ppv."PhaseId" = $2
              AND ppv."Status" = 'I'
            GROUP BY
              ppv."ProjectCode",
              ppv."PhaseId",
              ppv."VersionID",
              ppv."Status",
              ppv."VersionNote"
            ORDER BY
              CASE
                WHEN ppv."VersionID" ~ '^[0-9]+$'
                THEN ppv."VersionID"::INTEGER
                ELSE 999
              END,
              ppv."VersionID";
          `,
          [
            projectcode,
            phaseid
          ]
        );

      return res.json({
        success: true,
        projectcode,
        phaseid,
        inactiveVersions:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve inactive versions.'
      );
    }
  }
);

/* =========================================================
   ACTIVATE EXISTING PHASE VERSION
========================================================= */

app.post(
  '/api/project-phase-versions/:projectcode/:phaseid/:versionid/activate',
  async (req, res) => {
    let client = null;

    try {
      if (!requireDatabase(res)) {
        return;
      }

      client =
        await pool.connect();

      const projectcode =
        req.params.projectcode
          ?.trim();

      const phaseid =
        req.params.phaseid
          ?.trim();

      const versionid =
        req.params.versionid
          ?.trim();

      if (
        !projectcode ||
        !phaseid ||
        !versionid
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Project Code, Phase ID and Version ID are required.'
          });
      }

      await client.query(
        'BEGIN'
      );

      /*
       * Prevent two activation/version operations for
       * the same project phase from running concurrently.
       */
      await client.query(
        `
          SELECT pg_advisory_xact_lock(
            hashtext($1)
          );
        `,
        [
          `${projectcode}:${phaseid}`
        ]
      );

      const targetResult =
        await client.query(
          `
            SELECT
              "Status"
                AS status,
              "VersionNote"
                AS versionnote
            FROM "ProjectPhaseVersion"
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "VersionID" = $3;
          `,
          [
            projectcode,
            phaseid,
            versionid
          ]
        );

      if (
        targetResult.rowCount === 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              `Version ${versionid} was not found for Project ${projectcode}, Phase ${phaseid}.`
          });
      }

      const headerCheckResult =
        await client.query(
          `
            SELECT
              COUNT(*)
                AS linecount
            FROM "PrjHeaderData"
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "VersionID" = $3;
          `,
          [
            projectcode,
            phaseid,
            versionid
          ]
        );

      const lineCount =
        Number(
          headerCheckResult
            .rows[0]
            .linecount
        );

      if (lineCount === 0) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              `Version ${versionid} has no Project Plan rows to activate.`
          });
      }

      if (
        targetResult.rows[0].status ===
        'A'
      ) {
        await client.query(
          'COMMIT'
        );

        return res.json({
          success: true,
          message:
            `Version ${versionid} is already active.`,
          projectcode,
          phaseid,
          versionid,
          status: 'A',
          alreadyActive: true,
          activatedRows:
            lineCount
        });
      }

      /*
       * ProjectPhaseVersion becomes the authoritative
       * status source.
       */
      await client.query(
        `
          UPDATE "ProjectPhaseVersion"
          SET
            "Status" = 'I'
          WHERE
            "ProjectCode" = $1
            AND "PhaseId" = $2
            AND "Status" = 'A';
        `,
        [
          projectcode,
          phaseid
        ]
      );

      await client.query(
        `
          UPDATE "ProjectPhaseVersion"
          SET
            "Status" = 'A'
          WHERE
            "ProjectCode" = $1
            AND "PhaseId" = $2
            AND "VersionID" = $3;
        `,
        [
          projectcode,
          phaseid,
          versionid
        ]
      );

      /*
       * Keep the existing PrjHeaderData.Status values
       * synchronized for backward compatibility.
       */
      await client.query(
        `
          UPDATE "PrjHeaderData"
          SET
            "Status" = 'I'
          WHERE
            "ProjectCode" = $1
            AND "PhaseId" = $2
            AND "VersionID" <> $3;
        `,
        [
          projectcode,
          phaseid,
          versionid
        ]
      );

      const activateResult =
        await client.query(
          `
            UPDATE "PrjHeaderData"
            SET
              "Status" = 'A'
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "VersionID" = $3
            RETURNING
              "ProjectCode"
                AS projectcode,
              "VersionID"
                AS versionid,
              "PhaseId"
                AS phaseid,
              "LineId"
                AS lineid,
              "Status"
                AS status;
          `,
          [
            projectcode,
            phaseid,
            versionid
          ]
        );

      await client.query(
        'COMMIT'
      );

      return res.json({
        success: true,
        message:
          `Version ${versionid} activated successfully.`,
        projectcode,
        phaseid,
        versionid,
        status: 'A',
        versionNote:
          targetResult
            .rows[0]
            .versionnote ||
          null,
        activatedRows:
          activateResult.rowCount
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
        'Failed to activate Project Phase version.'
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

/* =========================================================
   CREATE NEW PHASE-SPECIFIC VERSION

   IMPORTANT:
   Version numbering is now determined from:

   ProjectCode + PhaseId

   Example:

   PRJ001 / Phase 01:
   01, 02, 03

   PRJ001 / Phase 02:
   01, 02, 03

   If legacy data contains:
   01, 06

   the next version becomes:
   02

   because the backend selects the first unused
   phase-specific number.
========================================================= */

app.post(
  '/api/project-phase-versions/:projectcode/:phaseid',
  async (req, res) => {
    let client = null;

    try {
      if (!requireDatabase(res)) {
        return;
      }

      client =
        await pool.connect();

      const projectcode =
        req.params.projectcode
          ?.trim();

      const phaseid =
        req.params.phaseid
          ?.trim();

      const versionnote =
        req.body
          ?.versionnote
          ?.trim() || null;

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

      await client.query(
        'BEGIN'
      );

      /*
       * Protect phase-specific version generation
       * against concurrent requests.
       */
      await client.query(
        `
          SELECT pg_advisory_xact_lock(
            hashtext($1)
          );
        `,
        [
          `${projectcode}:${phaseid}`
        ]
      );

      /* -----------------------------------------------------
         1. FIND CURRENT ACTIVE PHASE VERSION
      ----------------------------------------------------- */

      const activeResult =
        await client.query(
          `
            SELECT
              "VersionID"
                AS versionid,
              "VersionNote"
                AS versionnote
            FROM "ProjectPhaseVersion"
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "Status" = 'A'
            ORDER BY
              "VersionID";
          `,
          [
            projectcode,
            phaseid
          ]
        );

      if (
        activeResult.rowCount === 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              'No active Project Plan exists for this Project Phase.'
          });
      }

      if (
        activeResult.rowCount > 1
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(409)
          .json({
            success: false,
            error:
              'More than one active version exists for this Project Phase.'
          });
      }

      const oldVersionId =
        activeResult
          .rows[0]
          .versionid;

      /* -----------------------------------------------------
         2. LOAD SOURCE PROJECT MASTER

         ProjectMaster is still needed because PrjHeaderData
         has an FK to ProjectCode + VersionID.

         If the target VersionID already exists in
         ProjectMaster because another phase uses that same
         project-level VersionID, we simply reuse it.
      ----------------------------------------------------- */

      const sourceProjectResult =
        await client.query(
          `
            SELECT
              "ProjectID"
                AS projectid,
              "ProjectCode"
                AS projectcode,
              "VersionID"
                AS versionid,
              "ProjectName"
                AS projectname,
              "ProjectDescription"
                AS projectdescription,
              "ProjectType"
                AS projecttype,
              "PartnerID"
                AS partnerid,
              "Currency"
                AS currency,
              "Location"
                AS location,
              "Region"
                AS region,
              "Status"
                AS status,
              "CreatedBy"
                AS createdby,
              "CreatedDate"
                AS createddate,
              "UpdatedBy"
                AS updatedby,
              "UpdatedDate"
                AS updateddate
            FROM "ProjectMaster"
            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2;
          `,
          [
            projectcode,
            oldVersionId
          ]
        );

      if (
        sourceProjectResult
          .rowCount === 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              `ProjectMaster Version ${oldVersionId} was not found for ${projectcode}.`
          });
      }

      const sourceProject =
        sourceProjectResult.rows[0];

      /* -----------------------------------------------------
         3. FIND FIRST UNUSED VERSION FOR THIS PHASE

         Example:
         phase has 01 and 06
         result = 02

         phase has 01,02,03
         result = 04
      ----------------------------------------------------- */

      const nextVersionResult =
        await client.query(
          `
            SELECT
              LPAD(
                candidate::TEXT,
                2,
                '0'
              )
                AS versionid
            FROM generate_series(
              1,
              99
            ) AS candidate
            WHERE NOT EXISTS (
              SELECT 1
              FROM "ProjectPhaseVersion" ppv
              WHERE
                ppv."ProjectCode" = $1
                AND ppv."PhaseId" = $2
                AND ppv."VersionID" =
                  LPAD(
                    candidate::TEXT,
                    2,
                    '0'
                  )
            )
            ORDER BY
              candidate
            LIMIT 1;
          `,
          [
            projectcode,
            phaseid
          ]
        );

      if (
        nextVersionResult.rowCount ===
        0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(400)
          .json({
            success: false,
            error:
              'VersionID limit reached for this Project Phase.'
          });
      }

      const newVersionId =
        nextVersionResult
          .rows[0]
          .versionid;

      /* -----------------------------------------------------
         4. ENSURE PROJECTMASTER VERSION EXISTS

         Because ProjectMaster still has:
         UNIQUE(ProjectCode, VersionID)

         Phase 01 V02 and Phase 02 V02 both reference
         the same ProjectMaster V02 record.

         VersionNote does NOT come from ProjectMaster anymore.
         It is phase-specific in ProjectPhaseVersion.
      ----------------------------------------------------- */

      const projectMasterExistsResult =
        await client.query(
          `
            SELECT
              "ProjectID"
                AS projectid
            FROM "ProjectMaster"
            WHERE
              "ProjectCode" = $1
              AND "VersionID" = $2
            LIMIT 1;
          `,
          [
            projectcode,
            newVersionId
          ]
        );

      if (
        projectMasterExistsResult
          .rowCount === 0
      ) {
        const newProjectId =
          randomUUID();

        await client.query(
          `
            INSERT INTO "ProjectMaster" (
              "ProjectID",
              "ProjectCode",
              "VersionID",
              "ProjectName",
              "ProjectDescription",
              "ProjectType",
              "PartnerID",
              "Currency",
              "Location",
              "Region",
              "Status",
              "CreatedBy",
              "CreatedDate",
              "UpdatedBy",
              "UpdatedDate",
              "VersionNote"
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
              $11,
              $12,
              NOW(),
              $13,
              NOW(),
              NULL
            );
          `,
          [
            newProjectId,
            projectcode,
            newVersionId,
            sourceProject.projectname,
            sourceProject.projectdescription,
            sourceProject.projecttype,
            sourceProject.partnerid,
            sourceProject.currency,
            sourceProject.location,
            sourceProject.region,
            sourceProject.status,
            sourceProject.createdby,
            sourceProject.updatedby
          ]
        );
      }

      /* -----------------------------------------------------
         5. LOAD ACTIVE HEADER ROWS
      ----------------------------------------------------- */

      const sourceHeadersResult =
        await client.query(
          `
            SELECT
              "ProjectCode"
                AS projectcode,
              "VersionID"
                AS versionid,
              "PhaseId"
                AS phaseid,
              "StartDate"
                AS startdate,
              "EndDate"
                AS enddate,
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
            oldVersionId,
            phaseid
          ]
        );

      if (
        sourceHeadersResult
          .rowCount === 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(404)
          .json({
            success: false,
            error:
              'The active version has no project planning rows to copy.'
          });
      }

      /* -----------------------------------------------------
         6. MARK OLD PHASE VERSION INACTIVE
      ----------------------------------------------------- */

      await client.query(
        `
          UPDATE "ProjectPhaseVersion"
          SET
            "Status" = 'I'
          WHERE
            "ProjectCode" = $1
            AND "PhaseId" = $2
            AND "Status" = 'A';
        `,
        [
          projectcode,
          phaseid
        ]
      );

      await client.query(
        `
          UPDATE "PrjHeaderData"
          SET
            "Status" = 'I'
          WHERE
            "ProjectCode" = $1
            AND "PhaseId" = $2
            AND "VersionID" = $3;
        `,
        [
          projectcode,
          phaseid,
          oldVersionId
        ]
      );

      /* -----------------------------------------------------
         7. CREATE NEW PROJECTPHASEVERSION
      ----------------------------------------------------- */

      await client.query(
        `
          INSERT INTO "ProjectPhaseVersion" (
            "ProjectCode",
            "PhaseId",
            "VersionID",
            "Status",
            "VersionNote"
          )
          VALUES (
            $1,
            $2,
            $3,
            'A',
            $4
          );
        `,
        [
          projectcode,
          phaseid,
          newVersionId,
          versionnote
        ]
      );

      /* -----------------------------------------------------
         8. COPY HEADER + WEEKLY ITEMS
      ----------------------------------------------------- */

      let copiedHeaderRows = 0;
      let copiedItemRows = 0;

      for (
        const sourceHeader of
        sourceHeadersResult.rows
      ) {
        const newPrjUUID =
          randomUUID()
            .replaceAll(
              '-',
              ''
            )
            .slice(
              0,
              16
            );

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
            );
          `,
          [
            projectcode,
            newVersionId,
            phaseid,
            sourceHeader.startdate,
            sourceHeader.enddate,
            sourceHeader.lineid,
            newPrjUUID,
            sourceHeader.projectroleid,
            sourceHeader.resourceid,
            sourceHeader.allocation,
            sourceHeader.worklocation
          ]
        );

        copiedHeaderRows += 1;

        const sourceItemsResult =
          await client.query(
            `
              SELECT
                "Year"
                  AS year,
                "WeekNo"
                  AS weekno,
                "Allocation"
                  AS allocation
              FROM "PrjItemData"
              WHERE
                "PrjUUID" = $1
                AND "LineId" = $2
              ORDER BY
                "Year",
                "WeekNo";
            `,
            [
              sourceHeader.prjuuid,
              sourceHeader.lineid
            ]
          );

        for (
          const sourceItem of
          sourceItemsResult.rows
        ) {
          await client.query(
            `
              INSERT INTO "PrjItemData" (
                "PrjUUID",
                "LineId",
                "Year",
                "WeekNo",
                "Allocation"
              )
              VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
              );
            `,
            [
              newPrjUUID,
              sourceHeader.lineid,
              sourceItem.year,
              sourceItem.weekno,
              sourceItem.allocation
            ]
          );

          copiedItemRows += 1;
        }
      }

      await client.query(
        'COMMIT'
      );

      return res
        .status(201)
        .json({
          success: true,
          message:
            `Phase Version ${newVersionId} created successfully and activated.`,
          projectcode,
          phaseid,
          previousVersionId:
            oldVersionId,
          newVersionId,
          versionNote:
            versionnote,
          previousStatus:
            'I',
          newStatus:
            'A',
          copiedHeaderRows,
          copiedItemRows
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
        'Failed to create new Project Phase version.'
      );
    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

/* =========================================================
   RESOURCE TYPES
========================================================= */

app.get(
  '/api/resource-types',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            "ResourceType"
              AS resourcetype,
            "Description"
              AS description
          FROM "ResourceType"
          ORDER BY
            "ResourceType";
        `);

      return res.json({
        success: true,
        resourceTypes:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve Resource Types.'
      );
    }
  }
);

/* =========================================================
   ROLE CATEGORIES
========================================================= */

app.get(
  '/api/role-categories',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            "RoleCatID"
              AS rolecatid,
            "Description"
              AS description
          FROM "RoleCategory"
          ORDER BY
            "RoleCatID";
        `);

      return res.json({
        success: true,
        roleCategories:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve Role Categories.'
      );
    }
  }
);

/* =========================================================
   PROJECT ROLES
========================================================= */

app.get(
  '/api/project-roles',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            pr."ProjectRoleID"
              AS projectroleid,
            pr."RoleCatID"
              AS rolecatid,
            pr."Description"
              AS description,
            rc."Description"
              AS rolecategory
          FROM "ProjectRole" pr
          LEFT JOIN "RoleCategory" rc
            ON
              rc."RoleCatID" =
              pr."RoleCatID"
          ORDER BY
            pr."ProjectRoleID";
        `);

      return res.json({
        success: true,
        projectRoles:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve Project Roles.'
      );
    }
  }
);

/* =========================================================
   PROJECT MASTER
========================================================= */

app.get(
  '/api/projects',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
          SELECT
            pm."ProjectID"
              AS projectid,
            pm."ProjectCode"
              AS projectcode,
            pm."VersionID"
              AS versionid,
            pm."ProjectName"
              AS projectname,
            pm."ProjectDescription"
              AS projectdescription,
            pm."ProjectType"
              AS projecttype,
            pt."Description"
              AS projecttypedescription,
            pm."PartnerID"
              AS partnerid,
            bp."Description"
              AS partnerdescription,
            pm."Currency"
              AS currency,
            pm."Location"
              AS location,
            pm."Region"
              AS region,
            pm."Status"
              AS status
          FROM "ProjectMaster" pm
          LEFT JOIN "ProjectType" pt
            ON
              pt."ProjectType" =
              pm."ProjectType"
          LEFT JOIN "BusinessPartner" bp
            ON
              bp."PartnerId" =
              pm."PartnerID"
          ORDER BY
            pm."ProjectCode",
            pm."VersionID";
        `);

      return res.json({
        success: true,
        projects:
          result.rows
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve projects.'
      );
    }
  }
);

/* =========================================================
   RESOURCE MASTER
========================================================= */

app.get(
  '/api/resources',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const result =
        await pool.query(`
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
            ON
              pr."ProjectRoleID" =
              rm."InternalRoleID"
          ORDER BY
            rm."ResourceId";
        `);

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

/* =========================================================
   SAVE PROJECT PLAN
========================================================= */

app.post(
  '/api/project-plans',
  async (req, res) => {
    let client = null;

    try {
      if (!requireDatabase(res)) {
        return;
      }

      client =
        await pool.connect();

      const {
        projectcode,
        versionid,
        phaseid,
        startdate,
        enddate,
        status = 'I',
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
        !['A', 'I'].includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Status must be A or I.'
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

      await client.query(
        'BEGIN'
      );

      await client.query(
        `
          SELECT pg_advisory_xact_lock(
            hashtext($1)
          );
        `,
        [
          `${projectcode}:${phaseid}`
        ]
      );

      /*
       * Ensure this phase-specific version exists.
       */
      const phaseVersionResult =
        await client.query(
          `
            SELECT
              "Status"
                AS status
            FROM "ProjectPhaseVersion"
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "VersionID" = $3;
          `,
          [
            projectcode,
            phaseid,
            versionid
          ]
        );

      if (
        phaseVersionResult.rowCount ===
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
              'The selected Project Phase Version does not exist.'
          });
      }

      if (status === 'A') {
        await client.query(
          `
            UPDATE "ProjectPhaseVersion"
            SET
              "Status" = 'I'
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "VersionID" <> $3
              AND "Status" = 'A';
          `,
          [
            projectcode,
            phaseid,
            versionid
          ]
        );

        await client.query(
          `
            UPDATE "ProjectPhaseVersion"
            SET
              "Status" = 'A'
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "VersionID" = $3;
          `,
          [
            projectcode,
            phaseid,
            versionid
          ]
        );

        await client.query(
          `
            UPDATE "PrjHeaderData"
            SET
              "Status" = 'I'
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "VersionID" <> $3
              AND "Status" = 'A';
          `,
          [
            projectcode,
            phaseid,
            versionid
          ]
        );
      }

      const oldHeaders =
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
        const oldHeader of
        oldHeaders.rows
      ) {
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

      const savedRows =
        [];

      for (
        let index = 0;
        index < rows.length;
        index += 1
      ) {
        const row =
          rows[index];

        const lineid =
          String(
            index + 1
          ).padStart(
            3,
            '0'
          );

        const prjuuid =
          randomUUID()
            .replaceAll(
              '-',
              ''
            )
            .slice(
              0,
              16
            );

        const allocation =
          row.allocation === '' ||
          row.allocation == null
            ? null
            : Number(
                row.allocation
              );

        const worklocation =
          row.worklocation ||
          null;

        const headerResult =
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
                $11,
                $12
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
                )
                  AS startdate,
                TO_CHAR(
                  "EndDate",
                  'YYYY-MM-DD'
                )
                  AS enddate,
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
              status,
              worklocation
            ]
          );

        if (
          Array.isArray(
            row.weeks
          )
        ) {
          for (
            const week of
            row.weeks
          ) {
            if (
              week.allocation === '' ||
              week.allocation == null
            ) {
              continue;
            }

            await client.query(
              `
                INSERT INTO "PrjItemData" (
                  "PrjUUID",
                  "LineId",
                  "Year",
                  "WeekNo",
                  "Allocation"
                )
                VALUES (
                  $1,
                  $2,
                  $3,
                  $4,
                  $5
                );
              `,
              [
                prjuuid,
                lineid,
                String(
                  week.year
                ),
                String(
                  week.weekno
                ).padStart(
                  2,
                  '0'
                ),
                Number(
                  week.allocation
                )
              ]
            );
          }
        }

        savedRows.push(
          headerResult.rows[0]
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
          status,
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
      if (client) {
        client.release();
      }
    }
  }
);

/* =========================================================
   ACTIVE PROJECT PLAN
========================================================= */

app.get(
  '/api/active-project-plan/:projectcode/:phaseid',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const {
        projectcode,
        phaseid
      } = req.params;

      const activeVersionResult =
        await pool.query(
          `
            SELECT
              "VersionID"
                AS versionid,
              "VersionNote"
                AS versionnote
            FROM "ProjectPhaseVersion"
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "Status" = 'A'
            ORDER BY
              "VersionID";
          `,
          [
            projectcode,
            phaseid
          ]
        );

      if (
        activeVersionResult
          .rowCount === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'No active version was found for this project phase.'
          });
      }

      if (
        activeVersionResult
          .rowCount > 1
      ) {
        return res
          .status(409)
          .json({
            success: false,
            error:
              'More than one active version exists for this project phase.'
          });
      }

      const versionid =
        activeVersionResult
          .rows[0]
          .versionid;

      const versionnote =
        activeVersionResult
          .rows[0]
          .versionnote ||
        null;

      const headerResult =
        await pool.query(
          `
            SELECT
              h."ProjectCode"
                AS projectcode,
              h."VersionID"
                AS versionid,
              h."PhaseId"
                AS phaseid,
              pp."Description"
                AS phasedescription,
              TO_CHAR(
                h."StartDate",
                'YYYY-MM-DD'
              )
                AS startdate,
              TO_CHAR(
                h."EndDate",
                'YYYY-MM-DD'
              )
                AS enddate,
              h."LineId"
                AS lineid,
              h."PrjUUID"
                AS prjuuid,
              h."ProjectRoleID"
                AS projectroleid,
              pr."Description"
                AS projectroledescription,
              h."ResourceId"
                AS resourceid,
              rm."FirstName"
                AS firstname,
              rm."LastName"
                AS lastname,
              rm."ResourceType"
                AS resourcetype,
              rm."Location"
                AS resourcelocation,
              rm."InternalRoleID"
                AS internalroleid,
              h."Allocation"
                AS allocation,
              h."Status"
                AS status,
              h."WorkLocation"
                AS worklocation
            FROM "PrjHeaderData" h
            LEFT JOIN "ProjectPhase" pp
              ON
                pp."PhaseId" =
                h."PhaseId"
            LEFT JOIN "ProjectRole" pr
              ON
                pr."ProjectRoleID" =
                h."ProjectRoleID"
            LEFT JOIN "ResourceMaster" rm
              ON
                rm."ResourceId" =
                h."ResourceId"
            WHERE
              h."ProjectCode" = $1
              AND h."PhaseId" = $2
              AND h."VersionID" = $3
            ORDER BY
              h."LineId";
          `,
          [
            projectcode,
            phaseid,
            versionid
          ]
        );

      if (
        headerResult.rowCount ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'The active phase version exists, but it has no Project Plan rows.'
          });
      }

      const rows =
        [];

      for (
        const header of
        headerResult.rows
      ) {
        const itemResult =
          await pool.query(
            `
              SELECT
                "Year"
                  AS year,
                "WeekNo"
                  AS weekno,
                "Allocation"
                  AS allocation
              FROM "PrjItemData"
              WHERE
                "PrjUUID" = $1
                AND "LineId" = $2
              ORDER BY
                "Year",
                "WeekNo";
            `,
            [
              header.prjuuid,
              header.lineid
            ]
          );

        rows.push({
          ...header,
          status: 'A',
          weeks:
            itemResult.rows
        });
      }

      return res.json({
        success: true,
        projectcode,
        phaseid,
        activeVersionId:
          versionid,
        versionnote,
        rows
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

app.get(
  '/api/project-plans/:projectcode/:versionid/:phaseid',
  async (req, res) => {
    try {
      if (!requireDatabase(res)) {
        return;
      }

      const {
        projectcode,
        versionid,
        phaseid
      } = req.params;

      const phaseVersionResult =
        await pool.query(
          `
            SELECT
              "Status"
                AS status,
              "VersionNote"
                AS versionnote
            FROM "ProjectPhaseVersion"
            WHERE
              "ProjectCode" = $1
              AND "PhaseId" = $2
              AND "VersionID" = $3;
          `,
          [
            projectcode,
            phaseid,
            versionid
          ]
        );

      if (
        phaseVersionResult.rowCount ===
        0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'Project Phase Version was not found.'
          });
      }

      const phaseVersion =
        phaseVersionResult.rows[0];

      const headerResult =
        await pool.query(
          `
            SELECT
              h."ProjectCode"
                AS projectcode,
              h."VersionID"
                AS versionid,
              h."PhaseId"
                AS phaseid,
              pp."Description"
                AS phasedescription,
              TO_CHAR(
                h."StartDate",
                'YYYY-MM-DD'
              )
                AS startdate,
              TO_CHAR(
                h."EndDate",
                'YYYY-MM-DD'
              )
                AS enddate,
              h."LineId"
                AS lineid,
              h."PrjUUID"
                AS prjuuid,
              h."ProjectRoleID"
                AS projectroleid,
              pr."Description"
                AS projectroledescription,
              h."ResourceId"
                AS resourceid,
              rm."FirstName"
                AS firstname,
              rm."LastName"
                AS lastname,
              rm."ResourceType"
                AS resourcetype,
              rm."Location"
                AS resourcelocation,
              rm."InternalRoleID"
                AS internalroleid,
              h."Allocation"
                AS allocation,
              h."Status"
                AS headerstatus,
              h."WorkLocation"
                AS worklocation
            FROM "PrjHeaderData" h
            LEFT JOIN "ProjectPhase" pp
              ON
                pp."PhaseId" =
                h."PhaseId"
            LEFT JOIN "ProjectRole" pr
              ON
                pr."ProjectRoleID" =
                h."ProjectRoleID"
            LEFT JOIN "ResourceMaster" rm
              ON
                rm."ResourceId" =
                h."ResourceId"
            WHERE
              h."ProjectCode" = $1
              AND h."VersionID" = $2
              AND h."PhaseId" = $3
            ORDER BY
              h."LineId";
          `,
          [
            projectcode,
            versionid,
            phaseid
          ]
        );

      const rows =
        [];

      for (
        const header of
        headerResult.rows
      ) {
        const itemResult =
          await pool.query(
            `
              SELECT
                "Year"
                  AS year,
                "WeekNo"
                  AS weekno,
                "Allocation"
                  AS allocation
              FROM "PrjItemData"
              WHERE
                "PrjUUID" = $1
                AND "LineId" = $2
              ORDER BY
                "Year",
                "WeekNo";
            `,
            [
              header.prjuuid,
              header.lineid
            ]
          );

        const {
          headerstatus,
          ...cleanHeader
        } = header;

        rows.push({
          ...cleanHeader,
          status:
            phaseVersion.status,
          weeks:
            itemResult.rows
        });
      }

      return res.json({
        success: true,
        projectcode,
        versionid,
        phaseid,
        status:
          phaseVersion.status,
        versionnote:
          phaseVersion.versionnote ||
          null,
        rows
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

/* =========================================================
   API 404
========================================================= */

app.use(
  '/api',
  (req, res) => {
    return res
      .status(404)
      .json({
        success: false,
        error:
          `API route not found: ${req.method} ${req.originalUrl}`
      });
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  port,
  () => {
    console.log(
      `Server running on http://localhost:${port}`
    );
  }
);