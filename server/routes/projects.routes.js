import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

const router =
  express.Router();

/* =========================================================
   GET PROJECTS
========================================================= */

router.get(
  '/',
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
          `
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

export default router;