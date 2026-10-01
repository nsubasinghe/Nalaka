import pool from '../db/pool.js';

/* =========================================================
   PPBMA PROJECT AUTHORIZATION
========================================================= */

const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  PROJECT_MEMBER: 'PROJECT_MEMBER',
  VIEWER: 'VIEWER'
});

const READ_ROLES = [
  ROLES.ADMIN,
  ROLES.PROJECT_MANAGER,
  ROLES.PROJECT_MEMBER,
  ROLES.VIEWER
];

const WRITE_ROLES = [
  ROLES.ADMIN,
  ROLES.PROJECT_MANAGER
];

/* =========================================================
   NORMALIZE PROJECT CODE
========================================================= */

function normalizeProjectCode(value) {
  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  const projectcode = value.trim();

  if (
    !projectcode ||
    projectcode.length > 10
  ) {
    return null;
  }

  return projectcode;
}

/* =========================================================
   EXTRACT PROJECT CODE

   A supplied project code is authoritative.

   An invalid route parameter must never
   fall back to a different body or query value.
========================================================= */

function getProjectCode(req) {
  /*
   * 1. Route parameter takes precedence.
   *
   * Example:
   * GET /api/project-versions/PRJ001
   */

  if (
    req.params?.projectcode !== undefined
  ) {
    return normalizeProjectCode(
      req.params.projectcode
    );
  }

  /*
   * 2. Use the request body only when
   *    no route parameter was supplied.
   *
   * Example:
   * POST /api/project-plans
   */

  if (
    req.body?.projectcode !== undefined
  ) {
    return normalizeProjectCode(
      req.body.projectcode
    );
  }

  /*
   * 3. Use the query string only when
   *    neither of the above exists.
   */

  if (
    req.query?.projectcode !== undefined
  ) {
    return normalizeProjectCode(
      req.query.projectcode
    );
  }

  return null;
}

/* =========================================================
   CHECK USER PROJECT ASSIGNMENT
========================================================= */

export async function hasProjectAccess(
  db,
  userId,
  projectcode
) {
  if (
    !db ||
    !userId ||
    !projectcode
  ) {
    return false;
  }

  const result = await db.query(
    `
      SELECT 1

      FROM public."AuthUserProject"

      WHERE
        "UserID" = $1
        AND "ProjectCode" = $2

      LIMIT 1;
    `,
    [
      userId,
      projectcode
    ]
  );

  return result.rowCount > 0;
}

/* =========================================================
   REQUIRE PROJECT ACCESS
========================================================= */

export function requireProjectAccess(
  allowedRoles = READ_ROLES
) {
  return async (
    req,
    res,
    next
  ) => {
    try {
      /* ===============================================
         AUTHENTICATION CHECK
      =============================================== */

      if (
        !req.auth ||
        !req.auth.userid
      ) {
        return res
          .status(401)
          .json({
            success: false,
            error:
              'Authentication is required.'
          });
      }

      /* ===============================================
         DATABASE AVAILABILITY
      =============================================== */

      if (!pool) {
        return res
          .status(503)
          .json({
            success: false,
            error:
              'Authorization service is temporarily unavailable.'
          });
      }

      /* ===============================================
         ROLE AUTHORIZATION
      =============================================== */

      const roleid =
        req.auth.roleid;

      if (
        !allowedRoles.includes(roleid)
      ) {
        return res
          .status(403)
          .json({
            success: false,
            error:
              'You do not have permission to perform this action.'
          });
      }

      /* ===============================================
         PROJECT CODE VALIDATION
      =============================================== */

      const projectcode =
        getProjectCode(req);

      if (!projectcode) {
        return res
          .status(400)
          .json({
            success: false,
            error:
              'A valid Project Code is required.'
          });
      }

      /* ===============================================
         ADMINISTRATOR ACCESS
      =============================================== */

      if (
        roleid === ROLES.ADMIN
      ) {
        req.authorizedProjectCode =
          projectcode;

        return next();
      }

      /* ===============================================
         PROJECT ASSIGNMENT CHECK
      =============================================== */

      const authorized =
        await hasProjectAccess(
          pool,
          req.auth.userid,
          projectcode
        );

      if (!authorized) {
        return res
          .status(403)
          .json({
            success: false,
            error:
              'You do not have access to this project.'
          });
      }

      /* ===============================================
         AUTHORIZED REQUEST
      =============================================== */

      req.authorizedProjectCode =
        projectcode;

      return next();

    } catch (error) {
      console.error(
        'Project authorization error:',
        error
      );

      return res
        .status(503)
        .json({
          success: false,
          error:
            'Project authorization is temporarily unavailable.'
        });
    }
  };
}

/* =========================================================
   REQUIRE PROJECT READ ACCESS
========================================================= */

export const requireProjectRead =
  requireProjectAccess(
    READ_ROLES
  );

/* =========================================================
   REQUIRE PROJECT WRITE ACCESS
========================================================= */

export const requireProjectWrite =
  requireProjectAccess(
    WRITE_ROLES
  );

/* =========================================================
   REQUIRE ADMINISTRATOR ACCESS
========================================================= */

export function requireSystemAdmin(
  req,
  res,
  next
) {
  if (
    !req.auth ||
    !req.auth.userid
  ) {
    return res
      .status(401)
      .json({
        success: false,
        error:
          'Authentication is required.'
      });
  }

  if (
    req.auth.roleid !==
    ROLES.ADMIN
  ) {
    return res
      .status(403)
      .json({
        success: false,
        error:
          'Administrator permission is required.'
      });
  }

  return next();
}