import argon2 from 'argon2';

/* =========================================================
   PASSWORD CONFIGURATION
========================================================= */

const PASSWORD_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1
};

/* =========================================================
   HASH PASSWORD
========================================================= */

export async function hashPassword(
  password
) {
  if (
    typeof password !== 'string' ||
    password.length < 12
  ) {
    throw new Error(
      'Password must contain at least 12 characters.'
    );
  }

  return argon2.hash(
    password,
    PASSWORD_OPTIONS
  );
}

/* =========================================================
   VERIFY PASSWORD
========================================================= */

export async function verifyPassword(
  password,
  passwordHash
) {
  if (
    typeof password !== 'string' ||
    !passwordHash
  ) {
    return false;
  }

  try {
    return await argon2.verify(
      passwordHash,
      password
    );
  } catch {
    return false;
  }
}

/* =========================================================
   FIND USER BY USERNAME OR EMAIL
========================================================= */

export async function findUserByLogin(
  db,
  login
) {
  if (
    typeof login !== 'string' ||
    !login.trim()
  ) {
    return null;
  }

  const normalizedLogin =
    login.trim().toLowerCase();

  const result =
    await db.query(
      `
        SELECT
          u."UserID"
            AS userid,

          u."Username"
            AS username,

          u."Email"
            AS email,

          u."PasswordHash"
            AS passwordhash,

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

        FROM public."AuthUser" u

        INNER JOIN public."AuthRole" r
          ON r."RoleID" =
             u."RoleID"

        WHERE
          LOWER(u."Username") = $1
          OR LOWER(u."Email") = $1

        LIMIT 1;
      `,
      [
        normalizedLogin
      ]
    );

  return result.rows[0] || null;
}

/* =========================================================
   GET SAFE USER DATA
========================================================= */

export function getSafeUser(
  user
) {
  if (!user) {
    return null;
  }

  return {
    userid: user.userid,
    username: user.username,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    roleid: user.roleid,
    roledescription:
      user.roledescription,
    status: user.status
  };
}

/* =========================================================
   AUTHENTICATE USER
========================================================= */

export async function authenticateUser(
  db,
  login,
  password
) {
  if (
    typeof login !== 'string' ||
    typeof password !== 'string' ||
    !login.trim() ||
    !password
  ) {
    return null;
  }

  const user =
    await findUserByLogin(
      db,
      login
    );

  if (!user) {
    return null;
  }

  if (
    user.status !== 'A'
  ) {
    return null;
  }

  const passwordValid =
    await verifyPassword(
      password,
      user.passwordhash
    );

  if (!passwordValid) {
    return null;
  }

  /* =======================================================
     UPDATE LAST SUCCESSFUL LOGIN
  ======================================================= */

  const updateResult =
    await db.query(
      `
        UPDATE public."AuthUser"

        SET
          "LastLoginDate" =
            CURRENT_TIMESTAMP

        WHERE
          "UserID" = $1
          AND "Status" = 'A'

        RETURNING
          "UserID";
      `,
      [
        user.userid
      ]
    );

  if (
    updateResult.rowCount === 0
  ) {
    return null;
  }

  return getSafeUser(
    user
  );
}