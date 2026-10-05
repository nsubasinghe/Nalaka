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
  const text = readText(value);

  if (text === null) {
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
    !Number.isFinite(number)
  ) {
    return NaN;
  }

  return number;
};

/* =========================================================
   GET RESOURCES
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

              rt."Description"
                AS resourcetypedescription,

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

            LEFT JOIN "ResourceType" rt
              ON rt."ResourceType" =
                 rm."ResourceType"

            LEFT JOIN "ProjectRole" pr
              ON pr."ProjectRoleID" =
                 rm."InternalRoleID"

            ORDER BY
              rm."ResourceId";
          `
        );

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

              resourcetypedescription:
                resource.resourcetypedescription,

              internalroleid:
                resource.internalroleid,

              roledescription:
                resource.roledescription,

              location:
                resource.location
            };
          }
        );

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

/* =========================================================
   CREATE RESOURCE
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
              'A valid resource object is required.'
          });
      }

      const resourceid =
        readText(
          body.resourceid
        );

      const firstname =
        readText(
          body.firstname
        );

      const lastname =
        optionalText(
          body.lastname
        );

      const resourcetype =
        readText(
          body.resourcetype
        );

      const internalroleid =
        readText(
          body.internalroleid
        );

      const location =
        optionalText(
          body.location
        );

      const billrate =
        optionalNumber(
          body.billrate
        );

      const currcode =
        optionalText(
          body.currcode
        );

      const cost2co =
        optionalNumber(
          body.cost2co
        );

      if (
        !resourceid ||
        typeof resourceid !== 'string' ||
        !/^[A-Z0-9]{1,10}$/i.test(
          resourceid
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Resource ID is required and cannot exceed 10 letters or numbers.'
          });
      }

      if (
        !firstname ||
        typeof firstname !== 'string' ||
        firstname.length > 20
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'First Name is required and cannot exceed 20 characters.'
          });
      }

      if (
        lastname !== null &&
        (
          typeof lastname !== 'string' ||
          lastname.length > 20
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Last Name cannot exceed 20 characters.'
          });
      }

      if (
        !resourcetype ||
        typeof resourcetype !== 'string' ||
        resourcetype.length > 2
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Resource Type is required.'
          });
      }

      if (
        !internalroleid ||
        typeof internalroleid !== 'string' ||
        internalroleid.length > 2
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Internal Role is required.'
          });
      }

      if (
        location !== null &&
        (
          typeof location !== 'string' ||
          location.length > 20
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Location cannot exceed 20 characters.'
          });
      }

      if (
        Number.isNaN(
          billrate
        ) ||
        (
          billrate !== null &&
          billrate < 0
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Bill Rate must be a valid non-negative number.'
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

      if (
        Number.isNaN(
          cost2co
        ) ||
        (
          cost2co !== null &&
          cost2co < 0
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Cost to Company must be a valid non-negative number.'
          });
      }

      const result =
        await pool.query(
          `
            INSERT INTO "ResourceMaster" (
              "ResourceId",
              "FirstName",
              "LastName",
              "ResourceType",
              "InternalRoleID",
              "Location",
              "BillRate",
              "CurrCode",
              "Cost2Co"
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
              $9
            )

            RETURNING
              "ResourceId"
                AS resourceid,

              "FirstName"
                AS firstname,

              "LastName"
                AS lastname,

              "ResourceType"
                AS resourcetype,

              "InternalRoleID"
                AS internalroleid,

              "Location"
                AS location,

              "BillRate"
                AS billrate,

              "CurrCode"
                AS currcode,

              "Cost2Co"
                AS cost2co;
          `,
          [
            resourceid,
            firstname,
            lastname,
            resourcetype,
            internalroleid,
            location,
            billrate,
            currcode,
            cost2co
          ]
        );

      return res
        .status(201)
        .json({
          success: true,
          message:
            'Resource saved successfully.',
          resource:
            result.rows[0]
        });

    } catch (error) {
      if (
        error.code === '23505'
      ) {
        return res
          .status(409)
          .json({
            success: false,
            error:
              'Resource ID already exists.'
          });
      }

      if (
        error.code === '23503'
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'One of the selected Resource Type, Internal Role or Currency values is invalid.'
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
              'One or more resource values exceed the allowed field length.'
          });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to save resource.'
      );
    }
  }
);

/* =========================================================
   UPDATE RESOURCE
========================================================= */

router.put(
  '/:resourceid',

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

      const resourceid =
        readText(
          req.params.resourceid
        );

      if (
        !resourceid ||
        !/^[A-Z0-9]{1,10}$/i.test(
          resourceid
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'A valid Resource ID is required.'
          });
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
              'A valid resource object is required.'
          });
      }

      const firstname =
        readText(
          body.firstname
        );

      const lastname =
        optionalText(
          body.lastname
        );

      const resourcetype =
        readText(
          body.resourcetype
        );

      const internalroleid =
        readText(
          body.internalroleid
        );

      const location =
        optionalText(
          body.location
        );

      const billrate =
        optionalNumber(
          body.billrate
        );

      const currcode =
        optionalText(
          body.currcode
        );

      const cost2co =
        optionalNumber(
          body.cost2co
        );

      if (
        !firstname ||
        firstname.length > 20
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'First Name is required and cannot exceed 20 characters.'
          });
      }

      if (
        lastname !== null &&
        lastname.length > 20
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Last Name cannot exceed 20 characters.'
          });
      }

      if (
        !resourcetype ||
        resourcetype.length > 2
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Resource Type is required.'
          });
      }

      if (
        !internalroleid ||
        internalroleid.length > 2
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Internal Role is required.'
          });
      }

      if (
        location !== null &&
        location.length > 20
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Location cannot exceed 20 characters.'
          });
      }

      if (
        Number.isNaN(
          billrate
        ) ||
        (
          billrate !== null &&
          billrate < 0
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Bill Rate must be a valid non-negative number.'
          });
      }

      if (
        currcode !== null &&
        currcode.length > 3
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Currency cannot exceed 3 characters.'
          });
      }

      if (
        Number.isNaN(
          cost2co
        ) ||
        (
          cost2co !== null &&
          cost2co < 0
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'Cost to Company must be a valid non-negative number.'
          });
      }

      const result =
        await pool.query(
          `
            UPDATE "ResourceMaster"

            SET
              "FirstName" =
                $1,

              "LastName" =
                $2,

              "ResourceType" =
                $3,

              "InternalRoleID" =
                $4,

              "Location" =
                $5,

              "BillRate" =
                $6,

              "CurrCode" =
                $7,

              "Cost2Co" =
                $8

            WHERE
              "ResourceId" =
                $9

            RETURNING
              "ResourceId"
                AS resourceid,

              "FirstName"
                AS firstname,

              "LastName"
                AS lastname,

              "ResourceType"
                AS resourcetype,

              "InternalRoleID"
                AS internalroleid,

              "Location"
                AS location,

              "BillRate"
                AS billrate,

              "CurrCode"
                AS currcode,

              "Cost2Co"
                AS cost2co;
          `,
          [
            firstname,
            lastname,
            resourcetype,
            internalroleid,
            location,
            billrate,
            currcode,
            cost2co,
            resourceid
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
              'Resource was not found.'
          });
      }

      return res.json({
        success: true,
        message:
          'Resource updated successfully.',
        resource:
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
              'One of the selected Resource Type, Internal Role or Currency values is invalid.'
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
              'One or more resource values exceed the allowed field length.'
          });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to update resource.'
      );
    }
  }
);

/* =========================================================
   DELETE RESOURCE
========================================================= */

router.delete(
  '/:resourceid',

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

      const resourceid =
        readText(
          req.params.resourceid
        );

      if (
        !resourceid ||
        !/^[A-Z0-9]{1,10}$/i.test(
          resourceid
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'A valid Resource ID is required.'
          });
      }

      const result =
        await pool.query(
          `
            DELETE FROM "ResourceMaster"

            WHERE
              "ResourceId" =
                $1

            RETURNING
              "ResourceId"
                AS resourceid;
          `,
          [
            resourceid
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
              'Resource was not found.'
          });
      }

      return res.json({
        success: true,
        message:
          'Resource deleted successfully.',
        resourceid:
          result.rows[0].resourceid
      });

    } catch (error) {
      if (
        error.code === '23503'
      ) {
        return res
          .status(409)
          .json({
            success: false,
            error:
              'This resource is already used in project planning and cannot be deleted.'
          });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to delete resource.'
      );
    }
  }
);

export default router;