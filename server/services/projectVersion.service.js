import {
  randomUUID
} from 'crypto';

import {
  lockProject
} from '../utils/database.js';

/* =========================================================
   PROJECT PLAN UUID
========================================================= */

function makePrjUUID() {
  return randomUUID()
    .replaceAll(
      '-',
      ''
    )
    .slice(
      0,
      16
    );
}

/* =========================================================
   GET ACTIVE PROJECT VERSION
========================================================= */

export async function getActiveProjectVersion(
  db,
  projectcode
) {
  const result =
    await db.query(
      `
        SELECT
          "ProjectCode"
            AS projectcode,

          "VersionID"
            AS versionid,

          "Status"
            AS status,

          "VersionNote"
            AS versionnote,

          "CreatedDate"
            AS createddate,

          "UpdatedDate"
            AS updateddate

        FROM "ProjectVersion"

        WHERE
          "ProjectCode" = $1
          AND "Status" = 'A'

        ORDER BY
          CASE
            WHEN "VersionID" ~ '^[0-9]+$'
              THEN "VersionID"::INTEGER
            ELSE 999
          END,

          "VersionID";
      `,
      [
        projectcode
      ]
    );

  if (
    result.rowCount === 0
  ) {
    return {
      type: 'missing',
      row: null
    };
  }

  if (
    result.rowCount > 1
  ) {
    return {
      type: 'multiple',
      rows:
        result.rows
    };
  }

  return {
    type: 'ok',
    row:
      result.rows[0]
  };
}

/* =========================================================
   ACTIVATE PROJECT VERSION
========================================================= */

export async function activateProjectVersion(
  client,
  projectcode,
  versionid
) {
  await lockProject(
    client,
    projectcode
  );

  const targetResult =
    await client.query(
      `
        SELECT
          "Status"
            AS status,

          "VersionNote"
            AS versionnote

        FROM "ProjectVersion"

        WHERE
          "ProjectCode" = $1
          AND "VersionID" = $2;
      `,
      [
        projectcode,
        versionid
      ]
    );

  if (
    targetResult.rowCount === 0
  ) {
    return {
      ok: false,
      statusCode: 404,
      error:
        `Version ${versionid} was not found for Project ${projectcode}.`
    };
  }

  if (
    targetResult
      .rows[0]
      .status === 'A'
  ) {
    return {
      ok: true,
      alreadyActive: true,
      projectcode,
      versionid,

      versionnote:
        targetResult
          .rows[0]
          .versionnote ||
        null
    };
  }

  await client.query(
    `
      UPDATE "ProjectVersion"

      SET
        "Status" = 'I',
        "UpdatedDate" = NOW()

      WHERE
        "ProjectCode" = $1
        AND "Status" = 'A';
    `,
    [
      projectcode
    ]
  );

  await client.query(
    `
      UPDATE "ProjectVersion"

      SET
        "Status" = 'A',
        "UpdatedDate" = NOW()

      WHERE
        "ProjectCode" = $1
        AND "VersionID" = $2;
    `,
    [
      projectcode,
      versionid
    ]
  );

  await client.query(
    `
      UPDATE "PrjHeaderData"

      SET
        "Status" =
          CASE
            WHEN "VersionID" = $2
              THEN 'A'
            ELSE 'I'
          END

      WHERE
        "ProjectCode" = $1;
    `,
    [
      projectcode,
      versionid
    ]
  );

  return {
    ok: true,
    alreadyActive: false,
    projectcode,
    versionid,

    versionnote:
      targetResult
        .rows[0]
        .versionnote ||
      null
  };
}

/* =========================================================
   CREATE PROJECT VERSION
========================================================= */

export async function createProjectVersion(
  client,
  projectcode,
  versionnote
) {
  await lockProject(
    client,
    projectcode
  );

  const activeState =
    await getActiveProjectVersion(
      client,
      projectcode
    );

  if (
    activeState.type ===
    'missing'
  ) {
    return {
      ok: false,
      statusCode: 404,
      error:
        'No active project version exists for this project.'
    };
  }

  if (
    activeState.type ===
    'multiple'
  ) {
    return {
      ok: false,
      statusCode: 409,
      error:
        'More than one active project version exists for this project.'
    };
  }

  const oldVersionId =
    activeState
      .row
      .versionid;

  /* =======================================================
     LOAD SOURCE PROJECT
  ======================================================= */

  const sourceProjectResult =
    await client.query(
      `
        SELECT
          "ProjectName"
            AS projectname,

          "ProjectDescription"
            AS projectdescription,

          "ProjectType"
            AS projecttype,

          "PartnerID"
            AS partnerid,

          "Currency"
            AS currency,

          "Location"
            AS location,

          "Region"
            AS region,

          "Status"
            AS status,

          "CreatedBy"
            AS createdby,

          "UpdatedBy"
            AS updatedby

        FROM "ProjectMaster"

        WHERE
          "ProjectCode" = $1
          AND "VersionID" = $2;
      `,
      [
        projectcode,
        oldVersionId
      ]
    );

  if (
    sourceProjectResult
      .rowCount === 0
  ) {
    return {
      ok: false,
      statusCode: 404,
      error:
        `ProjectMaster Version ${oldVersionId} was not found for ${projectcode}.`
    };
  }

  const sourceProject =
    sourceProjectResult
      .rows[0];

  /* =======================================================
     DETERMINE NEXT VERSION
  ======================================================= */

  const nextVersionResult =
    await client.query(
      `
        SELECT
          LPAD(
            (
              COALESCE(
                MAX(
                  CASE
                    WHEN "VersionID" ~
                      '^[0-9]+$'
                      THEN "VersionID"::INTEGER
                    ELSE 0
                  END
                ),
                0
              ) + 1
            )::TEXT,
            2,
            '0'
          ) AS versionid

        FROM "ProjectVersion"

        WHERE
          "ProjectCode" = $1;
      `,
      [
        projectcode
      ]
    );

  const newVersionId =
    nextVersionResult
      .rows[0]
      .versionid;

  if (
    Number(
      newVersionId
    ) > 99
  ) {
    return {
      ok: false,
      statusCode: 400,
      error:
        'VersionID limit reached for this project.'
    };
  }

  /* =======================================================
     LOAD PROJECT PHASE ASSIGNMENTS
  ======================================================= */

  const sourcePhasesResult =
    await client.query(
      `
        SELECT
          ppa."PhaseId"
            AS phaseid,

          pvp."StartDate"
            AS startdate,

          pvp."EndDate"
            AS enddate,

          ppa."SequenceNo"
            AS sequenceno

        FROM "ProjectPhaseAssignment" ppa

        LEFT JOIN "ProjectVersionPhase" pvp
          ON pvp."ProjectCode" =
             ppa."ProjectCode"

          AND pvp."VersionID" = $2

          AND pvp."PhaseId" =
              ppa."PhaseId"

        WHERE
          ppa."ProjectCode" = $1

        ORDER BY
          ppa."SequenceNo",
          ppa."PhaseId";
      `,
      [
        projectcode,
        oldVersionId
      ]
    );

  /* =======================================================
     LOAD SOURCE PLANNING HEADERS
  ======================================================= */

  const sourceHeadersResult =
    await client.query(
      `
        SELECT
          "PhaseId"
            AS phaseid,

          "StartDate"
            AS startdate,

          "EndDate"
            AS enddate,

          "LineId"
            AS lineid,

          "PrjUUID"
            AS prjuuid,

          "ProjectRoleID"
            AS projectroleid,

          "ResourceId"
            AS resourceid,

          "Allocation"
            AS allocation,

          "WorkLocation"
            AS worklocation

        FROM "PrjHeaderData"

        WHERE
          "ProjectCode" = $1
          AND "VersionID" = $2

        ORDER BY
          "PhaseId",
          "LineId";
      `,
      [
        projectcode,
        oldVersionId
      ]
    );

  /* =======================================================
     COPY PROJECT MASTER
  ======================================================= */

  await client.query(
    `
      INSERT INTO "ProjectMaster" (
        "ProjectID",
        "ProjectCode",
        "VersionID",
        "ProjectName",
        "ProjectDescription",
        "ProjectType",
        "PartnerID",
        "Currency",
        "Location",
        "Region",
        "Status",
        "CreatedBy",
        "CreatedDate",
        "UpdatedBy",
        "UpdatedDate",
        "VersionNote"
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
        $9,
        $10,
        $11,
        $12,
        NOW(),
        $13,
        NOW(),
        NULL
      );
    `,
    [
      randomUUID(),
      projectcode,
      newVersionId,
      sourceProject.projectname,
      sourceProject.projectdescription,
      sourceProject.projecttype,
      sourceProject.partnerid,
      sourceProject.currency,
      sourceProject.location,
      sourceProject.region,
      sourceProject.status,
      sourceProject.createdby,
      sourceProject.updatedby
    ]
  );

  /* =======================================================
     DEACTIVATE OLD VERSION
  ======================================================= */

  await client.query(
    `
      UPDATE "ProjectVersion"

      SET
        "Status" = 'I',
        "UpdatedDate" = NOW()

      WHERE
        "ProjectCode" = $1
        AND "Status" = 'A';
    `,
    [
      projectcode
    ]
  );

  await client.query(
    `
      UPDATE "PrjHeaderData"

      SET
        "Status" = 'I'

      WHERE
        "ProjectCode" = $1
        AND "VersionID" = $2;
    `,
    [
      projectcode,
      oldVersionId
    ]
  );

  /* =======================================================
     CREATE NEW ACTIVE VERSION
  ======================================================= */

  await client.query(
    `
      INSERT INTO "ProjectVersion" (
        "ProjectCode",
        "VersionID",
        "Status",
        "VersionNote",
        "CreatedDate",
        "UpdatedDate"
      )
      VALUES (
        $1,
        $2,
        'A',
        $3,
        NOW(),
        NOW()
      );
    `,
    [
      projectcode,
      newVersionId,
      versionnote
    ]
  );

  /* =======================================================
     COPY PHASES
  ======================================================= */

  for (
    const phase of
    sourcePhasesResult.rows
  ) {
    await client.query(
      `
        INSERT INTO "ProjectVersionPhase" (
          "ProjectCode",
          "VersionID",
          "PhaseId",
          "StartDate",
          "EndDate",
          "SequenceNo",
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
        );
      `,
      [
        projectcode,
        newVersionId,
        phase.phaseid,
        phase.startdate,
        phase.enddate,
        phase.sequenceno
      ]
    );
  }

  let copiedHeaderRows =
    0;

  let copiedItemRows =
    0;

  /* =======================================================
     COPY RESOURCE HEADERS + ALLOCATIONS
  ======================================================= */

  for (
    const sourceHeader of
    sourceHeadersResult.rows
  ) {
    const newPrjUUID =
      makePrjUUID();

    await client.query(
      `
        INSERT INTO "PrjHeaderData" (
          "ProjectCode",
          "VersionID",
          "PhaseId",
          "StartDate",
          "EndDate",
          "LineId",
          "PrjUUID",
          "ProjectRoleID",
          "ResourceId",
          "Allocation",
          "Status",
          "WorkLocation"
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
          $9,
          $10,
          'A',
          $11
        );
      `,
      [
        projectcode,
        newVersionId,
        sourceHeader.phaseid,
        sourceHeader.startdate,
        sourceHeader.enddate,
        sourceHeader.lineid,
        newPrjUUID,
        sourceHeader.projectroleid,
        sourceHeader.resourceid,
        sourceHeader.allocation,
        sourceHeader.worklocation
      ]
    );

    copiedHeaderRows +=
      1;

    const sourceItemsResult =
      await client.query(
        `
          SELECT
            "Year"
              AS year,

            "WeekNo"
              AS weekno,

            TO_CHAR(
              "PeriodStartDate",
              'YYYY-MM-DD'
            ) AS periodstartdate,

            TO_CHAR(
              "PeriodEndDate",
              'YYYY-MM-DD'
            ) AS periodenddate,

            "Allocation"
              AS allocation

          FROM "PrjItemData"

          WHERE
            "PrjUUID" = $1
            AND "LineId" = $2

          ORDER BY
            "PeriodStartDate",
            "PeriodEndDate",
            "Year",
            "WeekNo";
        `,
        [
          sourceHeader.prjuuid,
          sourceHeader.lineid
        ]
      );

    for (
      const sourceItem of
      sourceItemsResult.rows
    ) {
      await client.query(
        `
          INSERT INTO "PrjItemData" (
            "PrjUUID",
            "LineId",
            "Year",
            "WeekNo",
            "PeriodStartDate",
            "PeriodEndDate",
            "Allocation"
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7
          );
        `,
        [
          newPrjUUID,
          sourceHeader.lineid,
          sourceItem.year,
          sourceItem.weekno,
          sourceItem.periodstartdate,
          sourceItem.periodenddate,
          sourceItem.allocation
        ]
      );

      copiedItemRows +=
        1;
    }
  }

  /* =======================================================
     RESULT
  ======================================================= */

  return {
    ok: true,
    projectcode,

    previousVersionId:
      oldVersionId,

    newVersionId,

    versionNote:
      versionnote,

    copiedPhaseCount:
      sourcePhasesResult.rowCount,

    copiedHeaderRows,

    copiedItemRows
  };
}