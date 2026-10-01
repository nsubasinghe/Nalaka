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
   GET RESOURCES
   AUTHENTICATED USERS
========================================================= */

router.get(
  '/',

  requireAuth,

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

      /* ===============================================
         CHECK USER ROLE
      =============================================== */

      const roleId =
        req.auth.roleid;

      const allowedRoles = [
        'ADMIN',
        'PROJECT_MANAGER',
        'PROJECT_MEMBER',
        'VIEWER'
      ];

      if (
        !allowedRoles.includes(
          roleId
        )
      ) {
        return res
          .status(403)
          .json({
            success: false,
            error:
              'You do not have permission to view resources.'
          });
      }

      const isAdmin =
        roleId === 'ADMIN';

      /* ===============================================
         RETRIEVE RESOURCE INFORMATION
      =============================================== */

      const result =
        await pool.query(
          `
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
              ON pr."ProjectRoleID" =
                 rm."InternalRoleID"

            ORDER BY
              rm."ResourceId";
          `
        );

      /* ===============================================
         FILTER SENSITIVE FINANCIAL FIELDS
      =============================================== */

      const resources =
        result.rows.map(
          (resource) => {
            if (isAdmin) {
              return resource;
            }

            return {
              resourceid:
                resource.resourceid,

              firstname:
                resource.firstname,

              lastname:
                resource.lastname,

              resourcetype:
                resource.resourcetype,

              internalroleid:
                resource.internalroleid,

              roledescription:
                resource.roledescription,

              location:
                resource.location
            };
          }
        );

      /* ===============================================
         RETURN AUTHORIZED RESOURCE DATA
      =============================================== */

      return res.json({
        success: true,

        resources
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

export default router;