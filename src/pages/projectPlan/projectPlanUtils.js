export const workLocations = [
  'Onsite',
  'Offsite',
  'Hybrid'
];

export const UNSAVED_MESSAGE =
  'You have unsaved changes. If you continue, those changes will be lost. Continue?';

/* =========================================================
   EMPTY RESOURCE ROW
========================================================= */

export const createEmptyResourceRow = (weeks) => {
  const weeklyValues = {};

  weeks.forEach((week) => {
    weeklyValues[week.id] = '';
  });

  return {
    id: `${Date.now()}-${Math.random()}`,
    projectRoleId: '',
    resourceId: '',
    skill: '',
    country: '',
    designation: '',
    workLocation: '',
    weeklyValues,
    lastEditedWeekId: '',
    sourcePrjUUID: '',
    sourceLineId: ''
  };
};

/* =========================================================
   DATE HELPERS
========================================================= */

export const formatDate = (date) => {
  if (
    !(date instanceof Date) ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return date.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  );
};

export const toDateInputValue = (date) => {
  if (
    !(date instanceof Date) ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
};

export const normalizeDateValue = (value) => {
  if (!value) {
    return '';
  }

  if (
    value instanceof Date
  ) {
    return toDateInputValue(
      value
    );
  }

  return String(
    value
  ).slice(
    0,
    10
  );
};

/* =========================================================
   EXACT PERIOD KEY
========================================================= */

export const getWeekPeriodKey = (week) => {
  const start =
    normalizeDateValue(
      week.periodstartdate ||
      week.periodStartDate ||
      week.startDate
    );

  const end =
    normalizeDateValue(
      week.periodenddate ||
      week.periodEndDate ||
      week.endDate
    );

  return `${start}|${end}`;
};

export const getYearWeekKey = (
  year,
  weekNumber
) => {
  return `${Number(year)}|${Number(
    weekNumber
  )}`;
};

/* =========================================================
   ISO WEEK
========================================================= */

export const getIsoWeekData = (date) => {
  const tempDate =
    new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )
    );

  const dayNumber =
    tempDate.getUTCDay() || 7;

  tempDate.setUTCDate(
    tempDate.getUTCDate() +
      4 -
      dayNumber
  );

  const yearStart =
    new Date(
      Date.UTC(
        tempDate.getUTCFullYear(),
        0,
        1
      )
    );

  const weekNumber =
    Math.ceil(
      (
        (
          tempDate -
          yearStart
        ) /
          86400000 +
        1
      ) / 7
    );

  return {
    year:
      tempDate.getUTCFullYear(),

    weekNumber
  };
};

/* =========================================================
   GENERATE WEEKS
========================================================= */

export const generateWeeks = (
  startDate,
  endDate
) => {
  if (
    !startDate ||
    !endDate
  ) {
    return [];
  }

  const start =
    new Date(
      `${startDate}T00:00:00`
    );

  const end =
    new Date(
      `${endDate}T00:00:00`
    );

  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      end.getTime()
    ) ||
    end < start
  ) {
    return [];
  }

  const weeks = [];

  let currentStart =
    new Date(start);

  let displayWeekNumber =
    1;

  while (
    currentStart <= end
  ) {
    const currentDay =
      currentStart.getDay();

    const daysUntilSunday =
      currentDay === 0
        ? 0
        : 7 - currentDay;

    const currentEnd =
      new Date(
        currentStart
      );

    currentEnd.setDate(
      currentEnd.getDate() +
        daysUntilSunday
    );

    if (
      currentEnd > end
    ) {
      currentEnd.setTime(
        end.getTime()
      );
    }

    const isoWeek =
      getIsoWeekData(
        currentStart
      );

    weeks.push({
      id:
        `week-${displayWeekNumber}`,

      displayWeekNumber,

      year:
        isoWeek.year,

      weekNumber:
        isoWeek.weekNumber,

      startDate:
        new Date(
          currentStart
        ),

      endDate:
        new Date(
          currentEnd
        )
    });

    currentStart =
      new Date(
        currentEnd
      );

    currentStart.setDate(
      currentStart.getDate() +
        1
    );

    displayWeekNumber +=
      1;
  }

  return weeks;
};

/* =========================================================
   REMAP RESOURCE ALLOCATIONS
========================================================= */

export const remapResourceRowsToWeeks = (
  rows,
  oldWeeks,
  newWeeks
) => {
  return rows.map(
    (row) => {
      const oldAllocationMap =
        new Map();

      oldWeeks.forEach(
        (week) => {
          const key =
            getWeekPeriodKey(
              week
            );

          oldAllocationMap.set(
            key,
            row.weeklyValues[
              week.id
            ] ?? ''
          );
        }
      );

      const newWeeklyValues =
        {};

      newWeeks.forEach(
        (week) => {
          const key =
            getWeekPeriodKey(
              week
            );

          newWeeklyValues[
            week.id
          ] =
            oldAllocationMap.has(
              key
            )
              ? oldAllocationMap.get(
                  key
                )
              : '';
        }
      );

      return {
        ...row,

        weeklyValues:
          newWeeklyValues
      };
    }
  );
};

/* =========================================================
   CURRENT PERIOD KEYS
========================================================= */

export const getCurrentPeriodKeys = (
  currentWeeks
) => {
  return new Set(
    currentWeeks.map(
      (week) =>
        getWeekPeriodKey(
          week
        )
    )
  );
};

/* =========================================================
   CURRENT YEAR/WEEK KEYS
========================================================= */

export const getCurrentYearWeekKeys = (
  currentWeeks
) => {
  return new Set(
    currentWeeks.map(
      (week) =>
        getYearWeekKey(
          week.year,
          week.weekNumber
        )
    )
  );
};

/* =========================================================
   CHECK WHETHER SAVED WEEK IS CURRENT
========================================================= */

export const isSavedWeekCurrent = (
  savedWeek,
  currentWeeks
) => {
  const savedStart =
    normalizeDateValue(
      savedWeek.periodstartdate ||
      savedWeek.periodStartDate
    );

  const savedEnd =
    normalizeDateValue(
      savedWeek.periodenddate ||
      savedWeek.periodEndDate
    );

  if (
    savedStart &&
    savedEnd
  ) {
    const currentPeriodKeys =
      getCurrentPeriodKeys(
        currentWeeks
      );

    return currentPeriodKeys.has(
      `${savedStart}|${savedEnd}`
    );
  }

  const currentYearWeekKeys =
    getCurrentYearWeekKeys(
      currentWeeks
    );

  return currentYearWeekKeys.has(
    getYearWeekKey(
      savedWeek.year,
      savedWeek.weekno
    )
  );
};

/* =========================================================
   DISPLAY PERIOD ID
========================================================= */

export const createDisplayPeriodId = (
  startDate,
  endDate,
  year,
  weekNumber
) => {
  const start =
    normalizeDateValue(
      startDate
    );

  const end =
    normalizeDateValue(
      endDate
    );

  if (
    start &&
    end
  ) {
    return `period-${start}-${end}`;
  }

  return `legacy-${year}-${weekNumber}`;
};

/* =========================================================
   BUILD DISPLAY WEEK COLUMNS

   Combines:
   - current generated periods
   - preserved historical periods

   Exact date boundaries remain separate even when they
   belong to the same ISO week.
========================================================= */

export const buildDisplayWeeks = (
  savedRows,
  currentWeeks
) => {
  const periodMap =
    new Map();

  /* -------------------------------------------------------
     CURRENT PERIODS
  ------------------------------------------------------- */

  currentWeeks.forEach(
    (week) => {
      const start =
        toDateInputValue(
          week.startDate
        );

      const end =
        toDateInputValue(
          week.endDate
        );

      const id =
        createDisplayPeriodId(
          start,
          end,
          week.year,
          week.weekNumber
        );

      periodMap.set(
        id,
        {
          id,

          year:
            Number(
              week.year
            ),

          weekNumber:
            Number(
              week.weekNumber
            ),

          startDate:
            new Date(
              `${start}T00:00:00`
            ),

          endDate:
            new Date(
              `${end}T00:00:00`
            ),

          periodStartDate:
            start,

          periodEndDate:
            end,

          currentWeekId:
            week.id,

          isCurrent:
            true,

          isHistorical:
            false
        }
      );
    }
  );

  /* -------------------------------------------------------
     SAVED / HISTORICAL PERIODS
  ------------------------------------------------------- */

  (
    Array.isArray(
      savedRows
    )
      ? savedRows
      : []
  ).forEach(
    (savedRow) => {
      (
        Array.isArray(
          savedRow.weeks
        )
          ? savedRow.weeks
          : []
      ).forEach(
        (savedWeek) => {
          const savedStart =
            normalizeDateValue(
              savedWeek.periodstartdate ||
              savedWeek.periodStartDate
            );

          const savedEnd =
            normalizeDateValue(
              savedWeek.periodenddate ||
              savedWeek.periodEndDate
            );

          const year =
            Number(
              savedWeek.year
            );

          const weekNumber =
            Number(
              savedWeek.weekno
            );

          /* -----------------------------------------------
             LEGACY PERIOD WITHOUT EXACT DATES
          ----------------------------------------------- */

          if (
            !savedStart ||
            !savedEnd
          ) {
            const matchingCurrentWeek =
              currentWeeks.find(
                (week) =>
                  Number(
                    week.year
                  ) ===
                    year &&
                  Number(
                    week.weekNumber
                  ) ===
                    weekNumber
              );

            if (
              matchingCurrentWeek
            ) {
              return;
            }

            const id =
              createDisplayPeriodId(
                '',
                '',
                year,
                weekNumber
              );

            if (
              !periodMap.has(
                id
              )
            ) {
              periodMap.set(
                id,
                {
                  id,

                  year,

                  weekNumber,

                  startDate:
                    null,

                  endDate:
                    null,

                  periodStartDate:
                    '',

                  periodEndDate:
                    '',

                  currentWeekId:
                    '',

                  isCurrent:
                    false,

                  isHistorical:
                    true,

                  isLegacy:
                    true
                }
              );
            }

            return;
          }

          /* -----------------------------------------------
             EXACT PERIOD
          ----------------------------------------------- */

          const id =
            createDisplayPeriodId(
              savedStart,
              savedEnd,
              year,
              weekNumber
            );

          const existing =
            periodMap.get(
              id
            );

          if (
            existing
          ) {
            periodMap.set(
              id,
              {
                ...existing,

                isHistorical:
                  existing.isHistorical ||
                  !existing.isCurrent
              }
            );

            return;
          }

          periodMap.set(
            id,
            {
              id,

              year,

              weekNumber,

              startDate:
                new Date(
                  `${savedStart}T00:00:00`
                ),

              endDate:
                new Date(
                  `${savedEnd}T00:00:00`
                ),

              periodStartDate:
                savedStart,

              periodEndDate:
                savedEnd,

              currentWeekId:
                '',

              isCurrent:
                false,

              isHistorical:
                true
            }
          );
        }
      );
    }
  );

  /* -------------------------------------------------------
     SORT PERIODS BY EXACT DATES
  ------------------------------------------------------- */

  return Array.from(
    periodMap.values()
  ).sort(
    (left, right) => {
      const leftStart =
        left.periodStartDate ||
        `${left.year}-W${String(
          left.weekNumber
        ).padStart(
          2,
          '0'
        )}`;

      const rightStart =
        right.periodStartDate ||
        `${right.year}-W${String(
          right.weekNumber
        ).padStart(
          2,
          '0'
        )}`;

      const startComparison =
        leftStart.localeCompare(
          rightStart
        );

      if (
        startComparison !== 0
      ) {
        return startComparison;
      }

      const leftEnd =
        left.periodEndDate ||
        '';

      const rightEnd =
        right.periodEndDate ||
        '';

      return leftEnd.localeCompare(
        rightEnd
      );
    }
  );
};

/* =========================================================
   BUILD HISTORICAL RESOURCE ROWS

   One historical row is produced for each saved resource
   header that contains at least one allocation period that
   is not part of the current exact planning period.
========================================================= */

export const buildHistoricalResourceRows = (
  savedRows,
  currentWeeks,
  displayWeeks,
  resources
) => {
  if (
    !Array.isArray(
      savedRows
    )
  ) {
    return [];
  }

  return savedRows
    .map(
      (
        savedRow,
        index
      ) => {
        const historicalWeeklyValues =
          {};

        let containsHistoricalValue =
          false;

        (
          Array.isArray(
            savedRow.weeks
          )
            ? savedRow.weeks
            : []
        ).forEach(
          (savedWeek) => {
            if (
              isSavedWeekCurrent(
                savedWeek,
                currentWeeks
              )
            ) {
              return;
            }

            const savedStart =
              normalizeDateValue(
                savedWeek.periodstartdate ||
                savedWeek.periodStartDate
              );

            const savedEnd =
              normalizeDateValue(
                savedWeek.periodenddate ||
                savedWeek.periodEndDate
              );

            const year =
              Number(
                savedWeek.year
              );

            const weekNumber =
              Number(
                savedWeek.weekno
              );

            let displayPeriodId =
              '';

            if (
              savedStart &&
              savedEnd
            ) {
              displayPeriodId =
                createDisplayPeriodId(
                  savedStart,
                  savedEnd,
                  year,
                  weekNumber
                );
            } else {
              const matchingDisplayWeek =
                displayWeeks.find(
                  (displayWeek) =>
                    Number(
                      displayWeek.year
                    ) ===
                      year &&
                    Number(
                      displayWeek.weekNumber
                    ) ===
                      weekNumber &&
                    !displayWeek.isCurrent
                );

              displayPeriodId =
                matchingDisplayWeek
                  ?.id ||
                createDisplayPeriodId(
                  '',
                  '',
                  year,
                  weekNumber
                );
            }

            historicalWeeklyValues[
              displayPeriodId
            ] =
              savedWeek.allocation ??
              '';

            containsHistoricalValue =
              true;
          }
        );

        if (
          !containsHistoricalValue
        ) {
          return null;
        }

        const resource =
          resources.find(
            (item) =>
              String(
                item.resourceid
              ) ===
              String(
                savedRow.resourceid
              )
          );

        return {
          id:
            `history-${savedRow.prjuuid || index}-${savedRow.lineid || index}`,

          sourcePrjUUID:
            savedRow.prjuuid ||
            '',

          sourceLineId:
            savedRow.lineid ||
            '',

          projectRoleId:
            savedRow.projectroleid ||
            '',

          resourceId:
            savedRow.resourceid ||
            '',

          skill:
            savedRow.projectroledescription ||
            resource?.roledescription ||
            '',

          country:
            resource?.location ||
            savedRow.resourcelocation ||
            '',

          designation:
            resource?.roledescription ||
            savedRow.projectroledescription ||
            '',

          workLocation:
            workLocations.includes(
              savedRow.worklocation
            )
              ? savedRow.worklocation
              : '',

          weeklyValues:
            historicalWeeklyValues,

          recordType:
            'historical',

          readOnly:
            true
        };
      }
    )
    .filter(
      Boolean
    );
};

/* =========================================================
   FIND DISPLAY COLUMN FOR CURRENT WEEK
========================================================= */

export const getCurrentDisplayWeek = (
  displayWeeks,
  currentWeek
) => {
  const currentKey =
    getWeekPeriodKey(
      currentWeek
    );

  return displayWeeks.find(
    (displayWeek) => {
      const displayKey =
        `${displayWeek.periodStartDate}|${displayWeek.periodEndDate}`;

      return (
        displayKey ===
        currentKey
      );
    }
  );
};