import express from 'express';

import pool from '../db/pool.js';

import {
  requireDatabase,
  sendDatabaseError
} from '../utils/database.js';

import {
  requireAuth,
  requireRole,
  requireAdmin
} from '../middleware/auth.middleware.js';

const router = express.Router();

/* =========================================================
   AUTHORIZED MASTER DATA READ ACCESS
========================================================= */

const requireMasterDataRead = requireRole(
  'ADMIN',
  'PROJECT_MANAGER',
  'PROJECT_MEMBER',
  'VIEWER'
);

/* =========================================================
   GET BUSINESS PARTNERS

   ALLOWED ROLES:
   - ADMIN
   - PROJECT_MANAGER
   - PROJECT_MEMBER
   - VIEWER
========================================================= */

router.get(
  '/business-partners',

  requireAuth,
  requireMasterDataRead,

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
              "PartnerId"
                AS partnerid,

              "Description"
                AS description

            FROM "BusinessPartner"

            ORDER BY
              "PartnerId";
          `
        );

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

/* =========================================================
   GET CUSTOMERS

   ALLOWED ROLES:
   - ADMIN
   - PROJECT_MANAGER
   - PROJECT_MEMBER
   - VIEWER
========================================================= */

router.get(
  '/customers',

  requireAuth,
  requireMasterDataRead,

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
              "PartnerId"
                AS partnerid,

              "Description"
                AS description

            FROM "BusinessPartner"

            ORDER BY
              "PartnerId";
          `
        );

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

/* =========================================================
   CREATE BUSINESS PARTNER

   ALLOWED ROLE:
   - ADMIN
========================================================= */

router.post(
  '/business-partners',

  requireAuth,
  requireAdmin,

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

      const partnerid =
        req.body
          .partnerid
          ?.trim()
          .toUpperCase();

      const description =
        req.body
          .description
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
            INSERT INTO "BusinessPartner" (
              "PartnerId",
              "Description"
            )

            VALUES (
              $1,
              $2
            )

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

/* =========================================================
   UPDATE BUSINESS PARTNER

   ALLOWED ROLE:
   - ADMIN
========================================================= */

router.put(
  '/business-partners/:partnerid',

  requireAuth,
  requireAdmin,

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

      const partnerid =
        req.params
          .partnerid
          ?.trim()
          .toUpperCase();

      const description =
        req.body
          .description
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

            SET
              "Description" = $1

            WHERE
              "PartnerId" = $2

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

      if (
        result.rowCount === 0
      ) {
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

/* =========================================================
   DELETE BUSINESS PARTNER

   ALLOWED ROLE:
   - ADMIN
========================================================= */

router.delete(
  '/business-partners/:partnerid',

  requireAuth,
  requireAdmin,

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

      const partnerid =
        req.params
          .partnerid
          ?.trim()
          .toUpperCase();

      const result =
        await pool.query(
          `
            DELETE FROM "BusinessPartner"

            WHERE
              "PartnerId" = $1

            RETURNING
              "PartnerId"
                AS partnerid,

              "Description"
                AS description;
          `,
          [
            partnerid
          ]
        );

      if (
        result.rowCount === 0
      ) {
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

export default router;