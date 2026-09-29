/* =========================================================
   DATABASE REQUIREMENT
========================================================= */

export function requireDatabase(
  res,
  pool
) {
  if (!pool) {
    res
      .status(500)
      .json({
        success: false,
        error:
          'DATABASE_URL is not configured.'
      });

    return false;
  }

  return true;
}

/* =========================================================
   DATABASE ERROR RESPONSE
========================================================= */

export function sendDatabaseError(
  res,
  error,
  defaultMessage
) {
  console.error(
    defaultMessage,
    error
  );

  if (
    error.code === '23505'
  ) {
    return res
      .status(409)
      .json({
        success: false,
        error:
          'A record with the same key already exists.'
      });
  }

  if (
    error.code === '23503'
  ) {
    return res
      .status(409)
      .json({
        success: false,
        error:
          'This operation cannot be completed because the record is referenced by another table.'
      });
  }

  if (
    error.code === '23514'
  ) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          'One or more values failed a database validation rule.'
      });
  }

  if (
    error.code === '23502'
  ) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          'One or more required values are missing.'
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
          'One or more values exceed the maximum allowed length.'
      });
  }

  return res
    .status(500)
    .json({
      success: false,
      error:
        error.message ||
        defaultMessage
    });
}

/* =========================================================
   PROJECT TRANSACTION LOCK
========================================================= */

export async function lockProject(
  client,
  projectcode
) {
  await client.query(
    `
      SELECT pg_advisory_xact_lock(
        hashtext($1)
      );
    `,
    [
      projectcode
    ]
  );
}