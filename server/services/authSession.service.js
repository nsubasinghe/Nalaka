import {
  randomBytes,
  createHash
} from 'crypto';

/* =========================================================
   SESSION CONFIGURATION
========================================================= */

const SESSION_DURATION_DAYS = 7;

export const SESSION_COOKIE_NAME =
  'ppbma_session';

/* =========================================================
   GENERATE SECURE SESSION TOKEN
========================================================= */

export function generateSessionToken() {
  return randomBytes(32)
    .toString('hex');
}

/* =========================================================
   HASH SESSION TOKEN
========================================================= */

export function hashSessionToken(
  token
) {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

/* =========================================================
   CREATE AUTHENTICATION SESSION
========================================================= */

export async function createAuthSession(
  db,
  userId
) {
  if (!userId) {
    throw new Error(
      'User ID is required.'
    );
  }

  const token =
    generateSessionToken();

  const tokenHash =
    hashSessionToken(token);

  const expiresDate =
    new Date();

  expiresDate.setUTCDate(
    expiresDate.getUTCDate() +
      SESSION_DURATION_DAYS
  );

  const result =
    await db.query(
      `
        INSERT INTO public."AuthSession" (
          "UserID",
          "TokenHash",
          "ExpiresDate"
        )
        VALUES (
          $1,
          $2,
          $3
        )

        RETURNING
          "SessionID"
            AS sessionid,

          "UserID"
            AS userid,

          "CreatedDate"
            AS createddate,

          "ExpiresDate"
            AS expiresdate;
      `,
      [
        userId,
        tokenHash,
        expiresDate
      ]
    );

  return {
    token,
    session:
      result.rows[0]
  };
}

/* =========================================================
   FIND VALID AUTHENTICATION SESSION
========================================================= */

export async function findValidAuthSession(
  db,
  token
) {
  if (
    typeof token !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    return null;
  }

  const tokenHash =
    hashSessionToken(token);

  const result =
    await db.query(
      `
        SELECT
          s."SessionID"
            AS sessionid,

          s."UserID"
            AS userid,

          s."CreatedDate"
            AS createddate,

          s."ExpiresDate"
            AS expiresdate,

          u."Username"
            AS username,

          u."Email"
            AS email,

          u."FirstName"
            AS firstname,

          u."LastName"
            AS lastname,

          u."RoleID"
            AS roleid,

          r."Description"
            AS roledescription,

          u."Status"
            AS status

        FROM public."AuthSession" s

        INNER JOIN public."AuthUser" u
          ON u."UserID" =
             s."UserID"

        INNER JOIN public."AuthRole" r
          ON r."RoleID" =
             u."RoleID"

        WHERE
          s."TokenHash" = $1

          AND s."RevokedDate"
            IS NULL

          AND s."ExpiresDate" >
            CURRENT_TIMESTAMP

          AND u."Status" = 'A'

        LIMIT 1;
      `,
      [
        tokenHash
      ]
    );

  return result.rows[0] ||
    null;
}

/* =========================================================
   REVOKE AUTHENTICATION SESSION
========================================================= */

export async function revokeAuthSession(
  db,
  token
) {
  if (
    typeof token !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    return false;
  }

  const tokenHash =
    hashSessionToken(token);

  const result =
    await db.query(
      `
        UPDATE public."AuthSession"

        SET
          "RevokedDate" =
            CURRENT_TIMESTAMP

        WHERE
          "TokenHash" = $1

          AND "RevokedDate"
            IS NULL

        RETURNING
          "SessionID";
      `,
      [
        tokenHash
      ]
    );

  return result.rowCount > 0;
}

/* =========================================================
   REVOKE ALL SESSIONS FOR A USER
========================================================= */

export async function revokeAllUserSessions(
  db,
  userId
) {
  if (!userId) {
    throw new Error(
      'User ID is required.'
    );
  }

  const result =
    await db.query(
      `
        UPDATE public."AuthSession"

        SET
          "RevokedDate" =
            CURRENT_TIMESTAMP

        WHERE
          "UserID" = $1

          AND "RevokedDate"
            IS NULL;
      `,
      [
        userId
      ]
    );

  return result.rowCount;
}

/* =========================================================
   DELETE EXPIRED OR REVOKED SESSIONS
========================================================= */

export async function cleanupAuthSessions(
  db
) {
  const result =
    await db.query(
      `
        DELETE FROM public."AuthSession"

        WHERE
          "ExpiresDate" <=
            CURRENT_TIMESTAMP

          OR "RevokedDate"
            IS NOT NULL;
      `
    );

  return result.rowCount;
}

/* =========================================================
   SESSION COOKIE OPTIONS
========================================================= */

export function getSessionCookieOptions() {
  const isProduction =
    process.env.NODE_ENV ===
    'production';

  return {
    httpOnly: true,

    secure:
      isProduction,

    sameSite: 'strict',

    path: '/',

    maxAge:
      SESSION_DURATION_DAYS *
      24 *
      60 *
      60 *
      1000
  };
}

/* =========================================================
   CLEAR SESSION COOKIE OPTIONS
========================================================= */

export function getClearSessionCookieOptions() {
  const {
    maxAge,
    ...options
  } = getSessionCookieOptions();

  return options;
}