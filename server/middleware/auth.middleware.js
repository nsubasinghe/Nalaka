import pool from '../db/pool.js';

import {
  findValidAuthSession,
  SESSION_COOKIE_NAME
} from '../services/authSession.service.js';

/* =========================================================
   READ COOKIE
========================================================= */

function readCookie(
  req,
  cookieName
) {
  const cookieHeader =
    req.headers.cookie;

  if (
    typeof cookieHeader !== 'string'
  ) {
    return null;
  }

  const cookies =
    cookieHeader.split(';');

  for (const cookie of cookies) {
    const separatorIndex =
      cookie.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const name =
      cookie
        .slice(
          0,
          separatorIndex
        )
        .trim();

    if (
      name !== cookieName
    ) {
      continue;
    }

    const value =
      cookie
        .slice(
          separatorIndex + 1
        )
        .trim();

    try {
      return decodeURIComponent(
        value
      );
    } catch {
      return null;
    }
  }

  return null;
}

/* =========================================================
   REQUIRE AUTHENTICATED USER
========================================================= */

export async function requireAuth(
  req,
  res,
  next
) {
  try {
    if (!pool) {
      return res
        .status(503)
        .json({
          success: false,
          error:
            'Authentication service is temporarily unavailable.'
        });
    }

    const token =
      readCookie(
        req,
        SESSION_COOKIE_NAME
      );

    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          error:
            'Authentication is required.'
        });
    }

    const session =
      await findValidAuthSession(
        pool,
        token
      );

    if (!session) {
      return res
        .status(401)
        .json({
          success: false,
          error:
            'Your session is invalid or has expired. Please sign in again.'
        });
    }

    /*
     * Attach authenticated information
     * to the current request.
     *
     * Never attach the raw session token
     * or a password hash.
     */

    req.auth = {
      sessionid:
        session.sessionid,

      userid:
        session.userid,

      username:
        session.username,

      email:
        session.email,

      firstname:
        session.firstname,

      lastname:
        session.lastname,

      roleid:
        session.roleid,

      roledescription:
        session.roledescription,

      sessionExpiresDate:
        session.expiresdate
    };

    return next();

  } catch (error) {
    console.error(
      'Authentication middleware error:',
      error
    );

    return res
      .status(503)
      .json({
        success: false,
        error:
          'Authentication service is temporarily unavailable.'
      });
  }
}

/* =========================================================
   REQUIRE APPLICATION ROLE
========================================================= */

export function requireRole(
  ...allowedRoles
) {
  return (
    req,
    res,
    next
  ) => {
    if (!req.auth) {
      return res
        .status(401)
        .json({
          success: false,
          error:
            'Authentication is required.'
        });
    }

    if (
      !allowedRoles.includes(
        req.auth.roleid
      )
    ) {
      return res
        .status(403)
        .json({
          success: false,
          error:
            'You do not have permission to perform this action.'
        });
    }

    return next();
  };
}

/* =========================================================
   REQUIRE ADMINISTRATOR
========================================================= */

export function requireAdmin(
  req,
  res,
  next
) {
  return requireRole(
    'ADMIN'
  )(
    req,
    res,
    next
  );
}