import express from 'express';

import { randomUUID } from 'node:crypto';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  requireAuth,
  requireAdmin
} from '../middleware/auth.middleware.js';

const router = express.Router();

/* =========================================================
   VALIDATION HELPERS
========================================================= */

const readText = (value) => {
  if (
    value === undefined ||
    value === null
  ) {
    return '';
  }

  if (typeof value !== 'string') {
    return null;
  }

  return value.trim();
};

const optionalText = (value) => {
  const text = readText(value);

  return text === ''
    ? null
    : text;
};

/* =========================================================
   GET PROJECTS

   FILTERED BY AUTHENTICATED USER
========================================================= */

router.get(
  '/',

  requireAuth,

  async (req, res) => {
    try {
      if (!requireDatabase(res, pool)) {
        return;
      }

      /* ===============================================
         AUTHENTICATED USER
      =============================================== */

      const userId =
        req.auth.userid;

      const roleId =
        req.auth.roleid;

      const isAdmin =
        roleId === 'ADMIN';

      /* ===============================================
         RETRIEVE AUTHORIZED PROJECTS
      =============================================== */

      const result =
        await pool.query(
          `
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
                AS status,

              pv."Status"
                AS versionstatus,

              pv."VersionNote"
                AS versionnote

            FROM "ProjectMaster" pm

            LEFT JOIN "ProjectType" pt
              ON pt."ProjectType" =
                 pm."ProjectType"

            LEFT JOIN "BusinessPartner" bp
              ON bp."PartnerId" =
                 pm."PartnerID"

            LEFT JOIN "ProjectVersion" pv
              ON pv."ProjectCode" =
                 pm."ProjectCode"

              AND pv."VersionID" =
                  pm."VersionID"

            /* =========================================
               PROJECT ACCESS FILTER

               Administrators:
                 All projects.

               Other roles:
                 Only assigned Project Codes.
            ========================================= */

            WHERE
              (
                $1::BOOLEAN = TRUE

                OR EXISTS (
                  SELECT 1

                  FROM public."AuthUserProject" aup

                  WHERE
                    aup."UserID" = $2::UUID

                    AND aup."ProjectCode" =
                        pm."ProjectCode"
                )
              )

            ORDER BY
              pm."ProjectCode",

              CASE
                WHEN pm."VersionID" ~
                  '^[0-9]+$'
                THEN
                  pm."VersionID"::INTEGER
                ELSE 999
              END,

              pm."VersionID";
          `,
          [
            isAdmin,
            userId
          ]
        );

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
   CREATE PROJECT

   POST /api/projects

   ALLOWED ROLE:
   - ADMIN

   Creates:
   1. ProjectMaster record
   2. Initial ProjectVersion record

   Both operations are performed in one transaction.
========================================================= */

router.post(
  '/',

  requireAuth,

  requireAdmin,

  async (req, res) => {
    if (!requireDatabase(res, pool)) {
      return;
    }

    /* ===============================================
       READ AND VALIDATE INPUT
    =============================================== */

    const body = req.body;

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return res.status(400).json({
        success: false,
        error: 'A valid project object is required.'
      });
    }

    const projectcode = readText(
      body.projectcode
    );

    const versionid = readText(
      body.versionid
    );

    const projectname = readText(
      body.projectname
    );

    const projectdescription = optionalText(
      body.projectdescription
    );

    const projecttype = optionalText(
      body.projecttype
    );

    const partnerid = optionalText(
      body.partnerid
    );

    const currency = optionalText(
      body.currency
    );

    const location = optionalText(
      body.location
    );

    const region = optionalText(
      body.region
    );

    const status = optionalText(
      body.status
    );

    const createdby = optionalText(
      body.createdby
    );

    const updatedby = optionalText(
      body.updatedby
    );

    const submittedValues = [
      projectcode,
      versionid,
      projectname,
      projectdescription,
      projecttype,
      partnerid,
      currency,
      location,
      region,
      status,
      createdby,
      updatedby
    ];

    if (
      submittedValues.some(
        (value) => value === null &&
          value !== projectdescription &&
          value !== projecttype &&
          value !== partnerid &&
          value !== currency &&
          value !== location &&
          value !== region &&
          value !== status &&
          value !== createdby &&
          value !== updatedby
      )
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project field values.'
      });
    }

    if (
      typeof projectcode !== 'string' ||
      typeof versionid !== 'string' ||
      typeof projectname !== 'string' ||
      !projectcode ||
      !versionid ||
      !projectname
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Project Code, Version ID and Project Name are required.'
      });
    }

    if (
      !/^[A-Z0-9]{1,10}$/.test(
        projectcode
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Project Code must contain 1–10 uppercase letters or numbers.'
      });
    }

    if (
      !/^[0-9]{1,2}$/.test(
        versionid
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Version ID must contain one or two digits.'
      });
    }

    if (projectname.length > 50) {
      return res.status(400).json({
        success: false,
        error:
          'Project Name cannot exceed 50 characters.'
      });
    }

    if (
      projectdescription !== null &&
      (
        typeof projectdescription !== 'string' ||
        projectdescription.length > 50
      )
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Project Description cannot exceed 50 characters.'
      });
    }

    const optionalFields = [
      projecttype,
      partnerid,
      currency,
      location,
      region,
      status,
      createdby,
      updatedby
    ];

    if (
      optionalFields.some(
        (value) =>
          value !== null &&
          typeof value !== 'string'
      )
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid optional project field value.'
      });
    }

    if (
      status !== null &&
      !['P', 'A', 'C', 'X'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid project status.'
      });
    }

    /* ===============================================
       DATABASE TRANSACTION
    =============================================== */

    let client;

    try {
      client = await pool.connect();

      await client.query(
        'BEGIN'
      );

      /* =============================================
         CHECK EXISTING PROJECT CODE

         Project Master creation must not
         overwrite an existing project or
         create another version accidentally.
      ============================================= */

      const existingProject =
        await client.query(
          `
            SELECT
              "ProjectCode"

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
        existingProject.rows.length > 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res.status(409).json({
          success: false,
          error:
            'Project Code already exists. Use the project version functionality for an existing project.'
        });
      }

      /* =============================================
         CHECK EXISTING PROJECT VERSION

         Also prevents creating a master
         record for an existing version-only
         Project Code.
      ============================================= */

      const existingVersion =
        await client.query(
          `
            SELECT
              "ProjectCode"

            FROM "ProjectVersion"

            WHERE
              "ProjectCode" = $1

            LIMIT 1;
          `,
          [
            projectcode
          ]
        );

      if (
        existingVersion.rows.length > 0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res.status(409).json({
          success: false,
          error:
            'A project version already exists for this Project Code.'
        });
      }

      /* =============================================
         CREATE PROJECT MASTER

         UUID is generated by Node.js because
         ProjectMaster.ProjectID has no
         database default.
      ============================================= */

      const projectId = randomUUID();

      const masterResult =
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
            )

            RETURNING
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
                AS status;
          `,
          [
            projectId,
            projectcode,
            versionid,
            projectname,
            projectdescription,
            projecttype,
            partnerid,
            currency,
            location,
            region,
            status,
            createdby,
            updatedby
          ]
        );

      /* =============================================
         CREATE INITIAL ACTIVE VERSION

         Version Status:
         A = Active
         I = Inactive

         This is separate from the
         ProjectMaster.Status field.
      ============================================= */

      const versionResult =
        await client.query(
          `
            INSERT INTO "ProjectVersion" (
              "ProjectCode",
              "VersionID",
              "Status",
              "VersionNote",
              "CreatedDate",
              "UpdatedDate"
            )
            VALUES (
              $1,
              $2,
              'A',
              $3,
              NOW(),
              NOW()
            )

            RETURNING
              "ProjectCode"
                AS projectcode,

              "VersionID"
                AS versionid,

              "Status"
                AS status,

              "VersionNote"
                AS versionnote;
          `,
          [
            projectcode,
            versionid,
            'Initial project version'
          ]
        );

      /* =============================================
         COMMIT TRANSACTION
      ============================================= */

      await client.query(
        'COMMIT'
      );

      return res.status(201).json({
        success: true,

        message:
          'Project saved successfully.',

        project:
          masterResult.rows[0],

        projectVersion:
          versionResult.rows[0]
      });

    } catch (error) {
      if (client) {
        try {
          await client.query(
            'ROLLBACK'
          );
        } catch (rollbackError) {
          console.error(
            'Project creation rollback failed:',
            rollbackError.message
          );
        }
      }

      /* =============================================
         DUPLICATE RECORD
      ============================================= */

      if (
        error.code === '23505'
      ) {
        return res.status(409).json({
          success: false,
          error:
            'This project or project version already exists.'
        });
      }

      /* =============================================
         INVALID MASTER DATA REFERENCE
      ============================================= */

      if (
        error.code === '23503'
      ) {
        return res.status(400).json({
          success: false,
          error:
            'One of the selected master data values is invalid.'
        });
      }

      /* =============================================
         FIELD LENGTH ERROR
      ============================================= */

      if (
        error.code === '22001'
      ) {
        return res.status(400).json({
          success: false,
          error:
            'One or more project field values exceed the database field length.'
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to create project.'
      );

    } finally {
      if (client) {
        client.release();
      }
    }
  }
);

export default router;