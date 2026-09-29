/* =========================================================
   GET PROJECT PLAN ROWS
========================================================= */

export async function getProjectPlanRows(
  db,
  projectcode,
  versionid,
  phaseid
) {
  const headerResult =
    await db.query(
      `
        SELECT
          h."ProjectCode"
            AS projectcode,

          h."VersionID"
            AS versionid,

          h."PhaseId"
            AS phaseid,

          pp."Description"
            AS phasedescription,

          TO_CHAR(
            h."StartDate",
            'YYYY-MM-DD'
          ) AS startdate,

          TO_CHAR(
            h."EndDate",
            'YYYY-MM-DD'
          ) AS enddate,

          h."LineId"
            AS lineid,

          h."PrjUUID"
            AS prjuuid,

          h."ProjectRoleID"
            AS projectroleid,

          pr."Description"
            AS projectroledescription,

          h."ResourceId"
            AS resourceid,

          rm."FirstName"
            AS firstname,

          rm."LastName"
            AS lastname,

          rm."ResourceType"
            AS resourcetype,

          rm."Location"
            AS resourcelocation,

          rm."InternalRoleID"
            AS internalroleid,

          h."Allocation"
            AS allocation,

          h."WorkLocation"
            AS worklocation

        FROM "PrjHeaderData" h

        LEFT JOIN "ProjectPhase" pp
          ON pp."PhaseId" =
             h."PhaseId"

        LEFT JOIN "ProjectRole" pr
          ON pr."ProjectRoleID" =
             h."ProjectRoleID"

        LEFT JOIN "ResourceMaster" rm
          ON rm."ResourceId" =
             h."ResourceId"

        WHERE
          h."ProjectCode" = $1
          AND h."VersionID" = $2
          AND h."PhaseId" = $3

        ORDER BY
          h."LineId";
      `,
      [
        projectcode,
        versionid,
        phaseid
      ]
    );

  const rows =
    [];

  for (
    const header of
    headerResult.rows
  ) {
    const itemResult =
      await db.query(
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
          header.prjuuid,
          header.lineid
        ]
      );

    rows.push({
      ...header,

      weeks:
        itemResult.rows
    });
  }

  return rows;
}