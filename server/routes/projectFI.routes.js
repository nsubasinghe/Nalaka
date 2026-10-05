import express from 'express';

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
   HELPERS
========================================================= */

const readText = (value) => {
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

const optionalText = (value) => {
  const text =
    readText(value);

  if (
    text === null
  ) {
    return null;
  }

  return text === ''
    ? null
    : text;
};

const optionalNumber = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return NaN;
  }

  return number;
};

/* =========================================================
   GET PROJECT FINANCIALS
========================================================= */

router.get(
  '/',

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

      const result =
        await pool.query(
          `
            SELECT
              pf."ProjectCode"
                AS projectcode,

              pf."VersionID"
                AS versionid,

              pf."BudgetAmount"
                AS budgetamount,

              pf."ActualCost"
                AS actualcost,

              pf."BillingAmount"
                AS billingamount,

              pf."CurrCode"
                AS currcode,

              pf."CreatedDate"
                AS createddate,

              pf."UpdatedDate"
                AS updateddate

            FROM "ProjectFI" pf

            ORDER BY
              pf."ProjectCode",
              pf."VersionID";
          `
        );

      return res.json({
        success: true,
        projectFinancials:
          result.rows
      });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to retrieve project financial information.'
      );
    }
  }
);

/* =========================================================
   CREATE OR UPDATE PROJECT FINANCIAL INFORMATION

   POST /api/project-fi

   UPSERTS BY:
   - ProjectCode
   - VersionID
========================================================= */

router.post(
  '/',

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

      const body =
        req.body;

      if (
        !body ||
        typeof body !== 'object' ||
        Array.isArray(body)
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'A valid financial information object is required.'
          });
      }

      const projectcode =
        readText(
          body.projectcode
        );

      const versionid =
        readText(
          body.versionid
        );

      const budgetamount =
        optionalNumber(
          body.budgetamount
        );

      const actualcost =
        optionalNumber(
          body.actualcost
        );

      const billingamount =
        optionalNumber(
          body.billingamount
        );

      const currcode =
        optionalText(
          body.currcode
        );

      if (
        !projectcode ||
        typeof projectcode !== 'string' ||
        !/^[A-Z0-9]{1,10}$/i.test(
          projectcode
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'A valid Project Code is required.'
          });
      }

      if (
        !versionid ||
        typeof versionid !== 'string' ||
        !/^[0-9]{1,2}$/.test(
          versionid
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'A valid Version ID is required.'
          });
      }

      if (
        Number.isNaN(
          budgetamount
        ) ||
        (
          budgetamount !== null &&
          budgetamount < 0
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Budget Amount must be a valid non-negative number.'
          });
      }

      if (
        Number.isNaN(
          actualcost
        ) ||
        (
          actualcost !== null &&
          actualcost < 0
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Actual Cost must be a valid non-negative number.'
          });
      }

      if (
        Number.isNaN(
          billingamount
        ) ||
        (
          billingamount !== null &&
          billingamount < 0
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Billing Amount must be a valid non-negative number.'
          });
      }

      if (
        currcode !== null &&
        (
          typeof currcode !== 'string' ||
          currcode.length > 3
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Currency cannot exceed 3 characters.'
          });
      }

      const result =
        await pool.query(
          `
            INSERT INTO "ProjectFI" (
              "ProjectCode",
              "VersionID",
              "BudgetAmount",
              "ActualCost",
              "BillingAmount",
              "CurrCode",
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

            ON CONFLICT (
              "ProjectCode",
              "VersionID"
            )
            DO UPDATE SET
              "BudgetAmount" =
                EXCLUDED."BudgetAmount",

              "ActualCost" =
                EXCLUDED."ActualCost",

              "BillingAmount" =
                EXCLUDED."BillingAmount",

              "CurrCode" =
                EXCLUDED."CurrCode",

              "UpdatedDate" =
                NOW()

            RETURNING
              "ProjectCode"
                AS projectcode,

              "VersionID"
                AS versionid,

              "BudgetAmount"
                AS budgetamount,

              "ActualCost"
                AS actualcost,

              "BillingAmount"
                AS billingamount,

              "CurrCode"
                AS currcode,

              "CreatedDate"
                AS createddate,

              "UpdatedDate"
                AS updateddate;
          `,
          [
            projectcode,
            versionid,
            budgetamount,
            actualcost,
            billingamount,
            currcode
          ]
        );

      return res.json({
        success: true,
        message:
          'Project Financial Information saved successfully.',
        projectFinancial:
          result.rows[0]
      });

    } catch (error) {
      if (
        error.code === '23503'
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'The selected Project, Version or Currency is invalid.'
          });
      }

      if (
        error.code === '22001'
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'One or more financial values exceed the allowed field length.'
          });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to save project financial information.'
      );
    }
  }
);

/* =========================================================
   DELETE PROJECT FINANCIAL INFORMATION

   DELETE /api/project-fi/:projectcode/:versionid
========================================================= */

router.delete(
  '/:projectcode/:versionid',

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

      const projectcode =
        readText(
          req.params.projectcode
        );

      const versionid =
        readText(
          req.params.versionid
        );

      if (
        !projectcode ||
        !/^[A-Z0-9]{1,10}$/i.test(
          projectcode
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'A valid Project Code is required.'
          });
      }

      if (
        !versionid ||
        !/^[0-9]{1,2}$/.test(
          versionid
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'A valid Version ID is required.'
          });
      }

      const result =
        await pool.query(
          `
            DELETE FROM "ProjectFI"

            WHERE
              "ProjectCode" =
                $1

              AND
              "VersionID" =
                $2

            RETURNING
              "ProjectCode"
                AS projectcode,

              "VersionID"
                AS versionid;
          `,
          [
            projectcode,
            versionid
          ]
        );

      if (
        result.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            success: false,
            error:
              'Project Financial Information was not found.'
          });
      }

      return res.json({
        success: true,
        message:
          'Project Financial Information deleted successfully.',
        projectcode:
          result.rows[0].projectcode,
        versionid:
          result.rows[0].versionid
      });

    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to delete project financial information.'
      );
    }
  }
);

export default router;