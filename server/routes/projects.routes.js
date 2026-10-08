import express from 'express';

import {
  randomUUID
} from 'node:crypto';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  requireAuth,
  requireAdmin
} from '../middleware/auth.middleware.js';

const router =
  express.Router();

/* =========================================================
   VALIDATION HELPERS
========================================================= */

const readText = (
  value
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return '';
  }

  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  return value.trim();
};

const optionalText = (
  value
) => {
  const text =
    readText(
      value
    );

  if (
    text === null
  ) {
    return null;
  }

  return text === ''
    ? null
    : text;
};

const isValidUuid = (
  value
) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
};

const validateOptionalString = (
  value,
  maxLength
) => {
  if (
    value === null
  ) {
    return true;
  }

  return (
    typeof value ===
      'string' &&
    value.length <=
      maxLength
  );
};

const getAuditUsername = (
  req
) => {
  if (
    !req.auth ||
    typeof req.auth.username !==
      'string'
  ) {
    return null;
  }

  const username =
    req.auth.username.trim();

  if (
    !username ||
    username.length > 10
  ) {
    return null;
  }

  return username;
};

/* =========================================================
   GET PROJECTS

   FILTERED BY AUTHENTICATED USER
========================================================= */

router.get(
  '/',

  requireAuth,

  async (
    req,
    res
  ) => {
    try {
      if (
        !requireDatabase(
          res,
          pool
        )
      ) {
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
        roleId ===
        'ADMIN';

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

              pm."CreatedBy"
                AS createdby,

              pm."CreatedDate"
                AS createddate,

              pm."UpdatedBy"
                AS updatedby,

              pm."UpdatedDate"
                AS updateddate,

              pm."VersionNote"
                AS versionnote,

              pv."Status"
                AS versionstatus

            FROM "ProjectMaster" pm

            LEFT JOIN "ProjectType" pt
              ON
                pt."ProjectType" =
                pm."ProjectType"

            LEFT JOIN "BusinessPartner" bp
              ON
                bp."PartnerId" =
                pm."PartnerID"

            LEFT JOIN "ProjectVersion" pv
              ON
                pv."ProjectCode" =
                pm."ProjectCode"

              AND
                pv."VersionID" =
                pm."VersionID"

            WHERE
              (
                $1::BOOLEAN = TRUE

                OR EXISTS (
                  SELECT 1

                  FROM public."AuthUserProject" aup

                  WHERE
                    aup."UserID" =
                    $2::UUID

                    AND
                    aup."ProjectCode" =
                    pm."ProjectCode"
                )
              )

            ORDER BY
              pm."ProjectCode",

              CASE
                WHEN
                  pm."VersionID" ~
                  '^[0-9]+$'
                THEN
                  pm."VersionID"::INTEGER
                ELSE
                  999
              END,

              pm."VersionID";
          `,
          [
            isAdmin,
            userId
          ]
        );

      return res.json({
        success:
          true,

        projects:
          result.rows
      });

    } catch (
      error
    ) {
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

   CREATES:
   1. ProjectMaster record
   2. Initial ProjectVersion record

   AUDIT:
   - CreatedBy = signed-in username
   - UpdatedBy = signed-in username
========================================================= */

router.post(
  '/',

  requireAuth,

  requireAdmin,

  async (
    req,
    res
  ) => {
    if (
      !requireDatabase(
        res,
        pool
      )
    ) {
      return;
    }

    /* ===============================================
       VALIDATE REQUEST BODY
    =============================================== */

    const body =
      req.body;

    if (
      !body ||
      typeof body !==
        'object' ||
      Array.isArray(
        body
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'A valid project object is required.'
        });
    }

    /* ===============================================
       AUTHENTICATED AUDIT USER
    =============================================== */

    const auditUsername =
      getAuditUsername(
        req
      );

    if (
      !auditUsername
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'The signed-in username is invalid for Project audit fields. The username must contain 1 to 10 characters.'
        });
    }

    const createdby =
      auditUsername;

    const updatedby =
      auditUsername;

    /* ===============================================
       READ REQUEST VALUES
    =============================================== */

    const projectcode =
      readText(
        body.projectcode
      );

    const versionid =
      readText(
        body.versionid
      );

    const projectname =
      readText(
        body.projectname
      );

    const projectdescription =
      optionalText(
        body.projectdescription
      );

    const projecttype =
      optionalText(
        body.projecttype
      );

    const partnerid =
      optionalText(
        body.partnerid
      );

    const currency =
      optionalText(
        body.currency
      );

    const location =
      optionalText(
        body.location
      );

    const region =
      optionalText(
        body.region
      );

    const status =
      optionalText(
        body.status
      );

    /* ===============================================
       REQUIRED VALUES
    =============================================== */

    if (
      !projectcode ||
      !versionid ||
      !projectname
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Project Code, Version ID and Project Name are required.'
        });
    }

    /* ===============================================
       PROJECT CODE VALIDATION
    =============================================== */

    if (
      typeof projectcode !==
        'string' ||
      !/^[A-Z0-9]{1,10}$/.test(
        projectcode
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Project Code must contain 1–10 uppercase letters or numbers.'
        });
    }

    /* ===============================================
       VERSION VALIDATION
    =============================================== */

    if (
      typeof versionid !==
        'string' ||
      !/^[0-9]{1,2}$/.test(
        versionid
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Version ID must contain one or two digits.'
        });
    }

    /* ===============================================
       PROJECT NAME
    =============================================== */

    if (
      typeof projectname !==
        'string' ||
      projectname.length >
        50
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Project Name cannot exceed 50 characters.'
        });
    }

    /* ===============================================
       OPTIONAL FIELD LENGTHS
    =============================================== */

    if (
      !validateOptionalString(
        projectdescription,
        500
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Project Description cannot exceed 500 characters.'
        });
    }

    if (
      !validateOptionalString(
        projecttype,
        2
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Project Type cannot exceed 2 characters.'
        });
    }

    if (
      !validateOptionalString(
        partnerid,
        10
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Business Partner cannot exceed 10 characters.'
        });
    }

    if (
      !validateOptionalString(
        currency,
        3
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Currency cannot exceed 3 characters.'
        });
    }

    if (
      !validateOptionalString(
        location,
        20
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Location cannot exceed 20 characters.'
        });
    }

    if (
      !validateOptionalString(
        region,
        20
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Region cannot exceed 20 characters.'
        });
    }

    /* ===============================================
       STATUS VALIDATION
    =============================================== */

    if (
      status !==
        null &&
      ![
        'P',
        'A',
        'C',
        'X'
      ].includes(
        status
      )
    ) {
      return res
        .status(400)
        .json({
          success:
            false,

          error:
            'Invalid project status.'
        });
    }

    /* ===============================================
       DATABASE TRANSACTION
    =============================================== */

    let client;

    try {
      client =
        await pool.connect();

      await client.query(
        'BEGIN'
      );

      /* =============================================
         DUPLICATE PROJECT CHECK
      ============================================= */

      const existingProject =
        await client.query(
          `
            SELECT
              "ProjectCode"

            FROM "ProjectMaster"

            WHERE
              "ProjectCode" =
              $1

            LIMIT 1;
          `,
          [
            projectcode
          ]
        );

      if (
        existingProject
          .rows
          .length >
        0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(409)
          .json({
            success:
              false,

            error:
              'Project Code already exists. Use the project version functionality for an existing project.'
          });
      }

      /* =============================================
         DUPLICATE VERSION CHECK
      ============================================= */

      const existingVersion =
        await client.query(
          `
            SELECT
              "ProjectCode"

            FROM "ProjectVersion"

            WHERE
              "ProjectCode" =
              $1

            LIMIT 1;
          `,
          [
            projectcode
          ]
        );

      if (
        existingVersion
          .rows
          .length >
        0
      ) {
        await client.query(
          'ROLLBACK'
        );

        return res
          .status(409)
          .json({
            success:
              false,

            error:
              'A project version already exists for this Project Code.'
          });
      }

      /* =============================================
         CREATE PROJECT MASTER
      ============================================= */

      const projectId =
        randomUUID();

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
                AS status,

              "CreatedBy"
                AS createdby,

              "CreatedDate"
                AS createddate,

              "UpdatedBy"
                AS updatedby,

              "UpdatedDate"
                AS updateddate,

              "VersionNote"
                AS versionnote;
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
         COMMIT
      ============================================= */

      await client.query(
        'COMMIT'
      );

      return res
        .status(201)
        .json({
          success:
            true,

          message:
            'Project saved successfully.',

          project:
            masterResult.rows[0],

          projectVersion:
            versionResult.rows[0]
        });

    } catch (
      error
    ) {
      if (
        client
      ) {
        try {
          await client.query(
            'ROLLBACK'
          );

        } catch (
          rollbackError
        ) {
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
        error.code ===
        '23505'
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            error:
              'This project or project version already exists.'
          });
      }

      /* =============================================
         FOREIGN KEY FAILURE
      ============================================= */

      if (
        error.code ===
        '23503'
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'One of the selected master data values is invalid.'
          });
      }

      /* =============================================
         FIELD LENGTH FAILURE
      ============================================= */

      if (
        error.code ===
        '22001'
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

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
      if (
        client
      ) {
        client.release();
      }
    }
  }
);

/* =========================================================
   UPDATE PROJECT MASTER

   PUT /api/projects/:projectid

   ALLOWED ROLE:
   - ADMIN

   READ-ONLY IDENTITY / AUDIT FIELDS:
   - ProjectID
   - ProjectCode
   - VersionID
   - CreatedBy
   - CreatedDate

   EDITABLE BUSINESS FIELDS:
   - ProjectName
   - ProjectDescription
   - ProjectType
   - PartnerID
   - Currency
   - Location
   - Region
   - Status

   AUTOMATIC AUDIT FIELD:
   - UpdatedBy = signed-in username
========================================================= */

router.put(
  '/:projectid',

  requireAuth,

  requireAdmin,

  async (
    req,
    res
  ) => {
    try {
      if (
        !requireDatabase(
          res,
          pool
        )
      ) {
        return;
      }

      /* ===============================================
         PROJECT ID
      =============================================== */

      const projectid =
        req.params
          .projectid
          ?.trim();

      if (
        !projectid ||
        !isValidUuid(
          projectid
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'A valid Project ID is required.'
          });
      }

      /* ===============================================
         REQUEST BODY
      =============================================== */

      const body =
        req.body;

      if (
        !body ||
        typeof body !==
          'object' ||
        Array.isArray(
          body
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'A valid project object is required.'
          });
      }

      /* ===============================================
         AUTHENTICATED AUDIT USER
      =============================================== */

      const updatedby =
        getAuditUsername(
          req
        );

      if (
        !updatedby
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'The signed-in username is invalid for Project audit fields. The username must contain 1 to 10 characters.'
          });
      }

      /* ===============================================
         EDITABLE VALUES
      =============================================== */

      const projectname =
        readText(
          body.projectname
        );

      const projectdescription =
        optionalText(
          body.projectdescription
        );

      const projecttype =
        optionalText(
          body.projecttype
        );

      const partnerid =
        optionalText(
          body.partnerid
        );

      const currency =
        optionalText(
          body.currency
        );

      const location =
        optionalText(
          body.location
        );

      const region =
        optionalText(
          body.region
        );

      const status =
        optionalText(
          body.status
        );

      /* ===============================================
         PROJECT NAME VALIDATION
      =============================================== */

      if (
        !projectname ||
        typeof projectname !==
          'string'
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'Project Name is required.'
          });
      }

      if (
        projectname.length >
        50
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'Project Name cannot exceed 50 characters.'
          });
      }

      /* ===============================================
         OPTIONAL FIELD VALIDATION
      =============================================== */

      if (
        !validateOptionalString(
          projectdescription,
          500
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'Project Description cannot exceed 500 characters.'
          });
      }

      if (
        !validateOptionalString(
          projecttype,
          2
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'Project Type cannot exceed 2 characters.'
          });
      }

      if (
        !validateOptionalString(
          partnerid,
          10
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'Business Partner cannot exceed 10 characters.'
          });
      }

      if (
        !validateOptionalString(
          currency,
          3
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'Currency cannot exceed 3 characters.'
          });
      }

      if (
        !validateOptionalString(
          location,
          20
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'Location cannot exceed 20 characters.'
          });
      }

      if (
        !validateOptionalString(
          region,
          20
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'Region cannot exceed 20 characters.'
          });
      }

      /* ===============================================
         STATUS VALIDATION
      =============================================== */

      if (
        status !==
          null &&
        ![
          'P',
          'A',
          'C',
          'X'
        ].includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'Invalid project status.'
          });
      }

      /* ===============================================
         UPDATE PROJECT MASTER

         ProjectID, ProjectCode, VersionID,
         CreatedBy and CreatedDate are intentionally
         NOT updated.

         UpdatedBy always comes from req.auth.username.
      =============================================== */

      const result =
        await pool.query(
          `
            UPDATE "ProjectMaster"

            SET
              "ProjectName" =
                $1,

              "ProjectDescription" =
                $2,

              "ProjectType" =
                $3,

              "PartnerID" =
                $4,

              "Currency" =
                $5,

              "Location" =
                $6,

              "Region" =
                $7,

              "Status" =
                $8,

              "UpdatedBy" =
                $9,

              "UpdatedDate" =
                NOW()

            WHERE
              "ProjectID" =
                $10::UUID

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
                AS status,

              "CreatedBy"
                AS createdby,

              "CreatedDate"
                AS createddate,

              "UpdatedBy"
                AS updatedby,

              "UpdatedDate"
                AS updateddate,

              "VersionNote"
                AS versionnote;
          `,
          [
            projectname,
            projectdescription,
            projecttype,
            partnerid,
            currency,
            location,
            region,
            status,
            updatedby,
            projectid
          ]
        );

      /* ===============================================
         PROJECT NOT FOUND
      =============================================== */

      if (
        result.rows.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            error:
              'Project was not found.'
          });
      }

      /* ===============================================
         SUCCESS
      =============================================== */

      return res.json({
        success:
          true,

        message:
          'Project updated successfully.',

        project:
          result.rows[0]
      });

    } catch (
      error
    ) {
      /* =============================================
         FOREIGN KEY FAILURE
      ============================================= */

      if (
        error.code ===
        '23503'
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'One of the selected master data values is invalid.'
          });
      }

      /* =============================================
         FIELD LENGTH FAILURE
      ============================================= */

      if (
        error.code ===
        '22001'
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            error:
              'One or more project field values exceed the database field length.'
          });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to update project.'
      );
    }
  }
);

export default router;