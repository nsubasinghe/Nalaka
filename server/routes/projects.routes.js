import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  requireAuth
} from '../middleware/auth.middleware.js';

const router = express.Router();

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

      /* ===============================================
         RETURN PROJECTS
      =============================================== */

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

export default router;