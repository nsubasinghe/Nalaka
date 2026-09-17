import {
  useEffect,
  useMemo,
  useState
} from 'react';

const workLocations = [
  'Onsite',
  'Offsite',
  'Hybrid'
];

const UNSAVED_MESSAGE =
  'You have unsaved changes. If you continue, those changes will be lost. Continue?';

/* =========================================================
   EMPTY RESOURCE ROW
========================================================= */

const createEmptyResourceRow = (weeks) => {
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
    weeklyValues
  };
};

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDate = (date) =>
  date.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  );

/* =========================================================
   ISO WEEK
========================================================= */

const getIsoWeekData = (date) => {
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

const generateWeeks = (
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

   Existing values are matched using:
   ISO year + ISO week number.
========================================================= */

const remapResourceRowsToWeeks = (
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
            `${week.year}-${week.weekNumber}`;

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
            `${week.year}-${week.weekNumber}`;

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
   COMPONENT
========================================================= */

function ProjectPlanPage() {
  const [
    projects,
    setProjects
  ] = useState([]);

  const [
    projectPhases,
    setProjectPhases
  ] = useState([]);

  const [
    projectRoles,
    setProjectRoles
  ] = useState([]);

  const [
    resources,
    setResources
  ] = useState([]);

  const [
    masterDataLoading,
    setMasterDataLoading
  ] = useState(true);

  const [
    planLoading,
    setPlanLoading
  ] = useState(false);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    creatingVersion,
    setCreatingVersion
  ] = useState(false);

  const [
    activatingVersionId,
    setActivatingVersionId
  ] = useState('');

  const [
    versionHistoryLoading,
    setVersionHistoryLoading
  ] = useState(false);

  const [
    selectedProjectCode,
    setSelectedProjectCode
  ] = useState('');

  const [
    selectedPhaseId,
    setSelectedPhaseId
  ] = useState('');

  const [
    activeVersionId,
    setActiveVersionId
  ] = useState('');

  const [
    displayedVersionId,
    setDisplayedVersionId
  ] = useState('');

  const [
    displayedVersionNote,
    setDisplayedVersionNote
  ] = useState('');

  const [
    activeVersionSummary,
    setActiveVersionSummary
  ] = useState({
    versionid: '',
    versionnote: '',
    startdate: '',
    enddate: '',
    linecount: 0
  });

  const [
    viewingInactiveVersion,
    setViewingInactiveVersion
  ] = useState(false);

  const [
    inactiveVersions,
    setInactiveVersions
  ] = useState([]);

  const [
    startDate,
    setStartDate
  ] = useState('');

  const [
    endDate,
    setEndDate
  ] = useState('');

  const [
    generatedWeeks,
    setGeneratedWeeks
  ] = useState([]);

  const [
    resourceRows,
    setResourceRows
  ] = useState([]);

  const [
    message,
    setMessage
  ] = useState('');

  const [
    messageType,
    setMessageType
  ] = useState('');

  const [
    hasUnsavedChanges,
    setHasUnsavedChanges
  ] = useState(false);

  /* ======================================================
     CREATE VERSION MODAL
  ====================================================== */

  const [
    showCreateVersionModal,
    setShowCreateVersionModal
  ] = useState(false);

  const [
    newVersionNote,
    setNewVersionNote
  ] = useState('');

  const [
    createVersionError,
    setCreateVersionError
  ] = useState('');

  /* ======================================================
     DERIVED STATE
  ====================================================== */

  const hasActiveVersion =
    Boolean(activeVersionId);

  const noActiveVersion =
    Boolean(
      selectedProjectCode &&
      selectedPhaseId &&
      !activeVersionId &&
      !planLoading
    );

  /* ======================================================
     BROWSER UNSAVED WARNING
  ====================================================== */

  useEffect(() => {
    const handleBeforeUnload =
      (event) => {
        if (
          !hasUnsavedChanges
        ) {
          return;
        }

        event.preventDefault();
        event.returnValue =
          '';
      };

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
    };
  }, [
    hasUnsavedChanges
  ]);

  /* ======================================================
     UNSAVED CHANGES CHECK
  ====================================================== */

  const confirmDiscardChanges =
    () => {
      if (
        !hasUnsavedChanges
      ) {
        return true;
      }

      return window.confirm(
        UNSAVED_MESSAGE
      );
    };

  /* ======================================================
     LOAD MASTER DATA
  ====================================================== */

  useEffect(() => {
    const loadMasterData =
      async () => {
        setMasterDataLoading(
          true
        );

        setMessage('');
        setMessageType('');

        try {
          const [
            projectsResponse,
            phasesResponse,
            rolesResponse,
            resourcesResponse
          ] = await Promise.all([
            fetch(
              '/api/projects'
            ),

            fetch(
              '/api/project-phases'
            ),

            fetch(
              '/api/project-roles'
            ),

            fetch(
              '/api/resources'
            )
          ]);

          const [
            projectsResult,
            phasesResult,
            rolesResult,
            resourcesResult
          ] = await Promise.all([
            projectsResponse.json(),
            phasesResponse.json(),
            rolesResponse.json(),
            resourcesResponse.json()
          ]);

          if (
            !projectsResponse.ok
          ) {
            throw new Error(
              projectsResult.error ||
                'Failed to load projects.'
            );
          }

          if (
            !phasesResponse.ok
          ) {
            throw new Error(
              phasesResult.error ||
                'Failed to load project phases.'
            );
          }

          if (
            !rolesResponse.ok
          ) {
            throw new Error(
              rolesResult.error ||
                'Failed to load project roles.'
            );
          }

          if (
            !resourcesResponse.ok
          ) {
            throw new Error(
              resourcesResult.error ||
                'Failed to load resources.'
            );
          }

          setProjects(
            projectsResult.projects ||
              []
          );

          setProjectPhases(
            phasesResult.projectPhases ||
              []
          );

          setProjectRoles(
            rolesResult.projectRoles ||
              []
          );

          setResources(
            resourcesResult.resources ||
              []
          );
        } catch (error) {
          setMessageType(
            'error'
          );

          setMessage(
            `✕ ${
              error.message ||
              'Failed to load Project Plan data.'
            }`
          );
        } finally {
          setMasterDataLoading(
            false
          );
        }
      };

    loadMasterData();
  }, []);

  /* ======================================================
     UNIQUE PROJECTS
  ====================================================== */

  const uniqueProjects =
    useMemo(() => {
      const map =
        new Map();

      projects.forEach(
        (project) => {
          if (
            !map.has(
              project.projectcode
            )
          ) {
            map.set(
              project.projectcode,
              project
            );
          }
        }
      );

      return Array.from(
        map.values()
      );
    }, [
      projects
    ]);

  /* ======================================================
     SELECTED PROJECT
  ====================================================== */

  const selectedProject =
    useMemo(() => {
      return uniqueProjects.find(
        (project) =>
          String(
            project.projectcode
          ) ===
          String(
            selectedProjectCode
          )
      );
    }, [
      uniqueProjects,
      selectedProjectCode
    ]);

  /* ======================================================
     SELECTED PHASE
  ====================================================== */

  const selectedPhase =
    useMemo(() => {
      return projectPhases.find(
        (phase) =>
          String(
            phase.phaseid
          ) ===
          String(
            selectedPhaseId
          )
      );
    }, [
      projectPhases,
      selectedPhaseId
    ]);

  /* ======================================================
     VERSION HISTORY
  ====================================================== */

  const versionHistory =
    useMemo(() => {
      const history =
        inactiveVersions.map(
          (version) => ({
            versionid:
              version.versionid,

            status:
              'I',

            startdate:
              version.startdate ||
              '',

            enddate:
              version.enddate ||
              '',

            linecount:
              Number(
                version.linecount ||
                  0
              ),

            versionnote:
              version.versionnote ||
              ''
          })
        );

      if (
        activeVersionSummary.versionid
      ) {
        history.push({
          versionid:
            activeVersionSummary.versionid,

          status:
            'A',

          startdate:
            activeVersionSummary.startdate,

          enddate:
            activeVersionSummary.enddate,

          linecount:
            activeVersionSummary.linecount,

          versionnote:
            activeVersionSummary.versionnote
        });
      }

      return history.sort(
        (a, b) =>
          Number(
            a.versionid
          ) -
          Number(
            b.versionid
          )
      );
    }, [
      inactiveVersions,
      activeVersionSummary
    ]);

  /* ======================================================
     RESET
  ====================================================== */

  const resetPlanningArea =
    () => {
      setStartDate('');
      setEndDate('');

      setGeneratedWeeks(
        []
      );

      setResourceRows(
        []
      );

      setHasUnsavedChanges(
        false
      );
    };

  const resetVersionHistory =
    () => {
      setInactiveVersions(
        []
      );

      setViewingInactiveVersion(
        false
      );

      setDisplayedVersionId(
        ''
      );

      setDisplayedVersionNote(
        ''
      );

      setActiveVersionSummary({
        versionid: '',
        versionnote: '',
        startdate: '',
        enddate: '',
        linecount: 0
      });
    };

  /* ======================================================
     PROJECT CHANGE
  ====================================================== */

  const handleProjectChange =
    (event) => {
      const projectCode =
        event.target.value;

      if (
        projectCode ===
        selectedProjectCode
      ) {
        return;
      }

      if (
        !confirmDiscardChanges()
      ) {
        return;
      }

      setHasUnsavedChanges(
        false
      );

      setSelectedProjectCode(
        projectCode
      );

      setSelectedPhaseId(
        ''
      );

      setActiveVersionId(
        ''
      );

      resetPlanningArea();
      resetVersionHistory();

      setMessage('');
      setMessageType('');
    };

  /* ======================================================
     SHARED PHASE DATES
  ====================================================== */

  const loadSharedPhaseDates =
    async (
      projectCode,
      phaseId
    ) => {
      const response =
        await fetch(
          `/api/phase-dates/${encodeURIComponent(
            projectCode
          )}/${encodeURIComponent(
            phaseId
          )}`
        );

      if (
        response.status ===
        404
      ) {
        return null;
      }

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            'Failed to load shared phase dates.'
        );
      }

      return (
        result.phaseDates ||
        null
      );
    };

  /* ======================================================
     LOAD VERSION HISTORY
  ====================================================== */

  const loadVersionHistory =
    async (
      projectCode,
      phaseId
    ) => {
      if (
        !projectCode ||
        !phaseId
      ) {
        setInactiveVersions(
          []
        );

        return [];
      }

      setVersionHistoryLoading(
        true
      );

      try {
        const response =
          await fetch(
            `/api/project-phase-versions/${encodeURIComponent(
              projectCode
            )}/${encodeURIComponent(
              phaseId
            )}/inactive`
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to load version history.'
          );
        }

        const versions =
          result.inactiveVersions ||
          [];

        setInactiveVersions(
          versions
        );

        return versions;
      } finally {
        setVersionHistoryLoading(
          false
        );
      }
    };

  /* ======================================================
     MAP SAVED PLAN
  ====================================================== */

  const populatePlanFromRows =
    (
      rows,
      versionId,
      dateOverride = null
    ) => {
      if (
        !Array.isArray(rows) ||
        rows.length === 0
      ) {
        return false;
      }

      const firstRow =
        rows[0];

      const loadedStartDate =
        dateOverride?.startdate ||
        (
          firstRow.startdate
            ? String(
                firstRow.startdate
              ).slice(
                0,
                10
              )
            : ''
        );

      const loadedEndDate =
        dateOverride?.enddate ||
        (
          firstRow.enddate
            ? String(
                firstRow.enddate
              ).slice(
                0,
                10
              )
            : ''
        );

      setStartDate(
        loadedStartDate
      );

      setEndDate(
        loadedEndDate
      );

      const weeks =
        generateWeeks(
          loadedStartDate,
          loadedEndDate
        );

      setGeneratedWeeks(
        weeks
      );

      const loadedRows =
        rows.map(
          (
            savedRow,
            index
          ) => {
            const weeklyValues =
              {};

            weeks.forEach(
              (week) => {
                const savedWeek =
                  savedRow.weeks
                    ?.find(
                      (item) =>
                        Number(
                          item.year
                        ) ===
                          Number(
                            week.year
                          ) &&
                        Number(
                          item.weekno
                        ) ===
                          Number(
                            week.weekNumber
                          )
                    );

                weeklyValues[
                  week.id
                ] =
                  savedWeek
                    ?.allocation ??
                  '';
              }
            );

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
                `saved-${savedRow.prjuuid}-${index}`,

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

              weeklyValues
            };
          }
        );

      setResourceRows(
        loadedRows
      );

      setDisplayedVersionId(
        versionId ||
          firstRow.versionid ||
          ''
      );

      setHasUnsavedChanges(
        false
      );

      return {
        loaded:
          true,

        startdate:
          loadedStartDate,

        enddate:
          loadedEndDate,

        linecount:
          loadedRows.length
      };
    };

  /* ======================================================
     LOAD ACTIVE PLAN
  ====================================================== */

  const loadActivePlan =
    async (
      projectCode,
      phaseId
    ) => {
      if (
        !projectCode ||
        !phaseId
      ) {
        return false;
      }

      setPlanLoading(
        true
      );

      try {
        const planResponse =
          await fetch(
            `/api/active-project-plan/${encodeURIComponent(
              projectCode
            )}/${encodeURIComponent(
              phaseId
            )}`
          );

        if (
          planResponse.status ===
          404
        ) {
          setActiveVersionId(
            ''
          );

          setDisplayedVersionId(
            ''
          );

          setDisplayedVersionNote(
            ''
          );

          setActiveVersionSummary({
            versionid: '',
            versionnote: '',
            startdate: '',
            enddate: '',
            linecount: 0
          });

          setViewingInactiveVersion(
            false
          );

          resetPlanningArea();

          return false;
        }

        const result =
          await planResponse.json();

        if (
          !planResponse.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to load active Project Plan.'
          );
        }

        let phaseDates = null;

        try {
          phaseDates =
            await loadSharedPhaseDates(
              projectCode,
              phaseId
            );
        } catch {
          phaseDates = null;
        }

        const activeId =
          result.activeVersionId ||
          '';

        const activeNote =
          result.versionnote ||
          '';

        setActiveVersionId(
          activeId
        );

        setDisplayedVersionNote(
          activeNote
        );

        setViewingInactiveVersion(
          false
        );

        const loadedResult =
          populatePlanFromRows(
            result.rows,
            activeId,
            phaseDates
          );

        if (
          !loadedResult
        ) {
          return false;
        }

        setActiveVersionSummary({
          versionid:
            activeId,

          versionnote:
            activeNote,

          startdate:
            loadedResult.startdate,

          enddate:
            loadedResult.enddate,

          linecount:
            loadedResult.linecount
        });

        return true;
      } finally {
        setPlanLoading(
          false
        );
      }
    };

  /* ======================================================
     LOAD HISTORICAL PLAN
  ====================================================== */

  const loadInactivePlan =
    async (
      versionId
    ) => {
      if (
        !selectedProjectCode ||
        !selectedPhaseId ||
        !versionId
      ) {
        return;
      }

      setPlanLoading(
        true
      );

      setMessage('');
      setMessageType('');

      try {
        const response =
          await fetch(
            `/api/project-plans/${encodeURIComponent(
              selectedProjectCode
            )}/${encodeURIComponent(
              versionId
            )}/${encodeURIComponent(
              selectedPhaseId
            )}`
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to load inactive Project Plan.'
          );
        }

        if (
          !Array.isArray(
            result.rows
          ) ||
          result.rows.length ===
            0
        ) {
          throw new Error(
            'No Project Plan data exists for this version.'
          );
        }

        populatePlanFromRows(
          result.rows,
          versionId
        );

        setDisplayedVersionNote(
          result.versionnote ||
            ''
        );

        setViewingInactiveVersion(
          true
        );

        setHasUnsavedChanges(
          false
        );

        setMessageType(
          'success'
        );

        setMessage(
          `✓ Inactive Version ${versionId} loaded in read-only mode.`
        );
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to load inactive Project Plan.'
          }`
        );
      } finally {
        setPlanLoading(
          false
        );
      }
    };

  /* ======================================================
     PHASE CHANGE
  ====================================================== */

  const handlePhaseChange =
    async (event) => {
      const phaseId =
        event.target.value;

      if (
        phaseId ===
        selectedPhaseId
      ) {
        return;
      }

      if (
        !confirmDiscardChanges()
      ) {
        return;
      }

      setHasUnsavedChanges(
        false
      );

      setSelectedPhaseId(
        phaseId
      );

      setActiveVersionId(
        ''
      );

      resetPlanningArea();
      resetVersionHistory();

      setMessage('');
      setMessageType('');

      if (
        !selectedProjectCode ||
        !phaseId
      ) {
        return;
      }

      try {
        const [
          existingPlan
        ] = await Promise.all([
          loadActivePlan(
            selectedProjectCode,
            phaseId
          ),

          loadVersionHistory(
            selectedProjectCode,
            phaseId
          )
        ]);

        if (
          existingPlan
        ) {
          setMessageType(
            'success'
          );

          setMessage(
            '✓ Active Project Plan loaded successfully.'
          );
        } else {
          setMessageType(
            'error'
          );

          setMessage(
            '⚠ No active version exists for this Project Phase. Select an inactive version from Version History or activate a version before editing.'
          );
        }
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to load Project Plan.'
          }`
        );
      }
    };

  /* ======================================================
     VERSION HISTORY ROW CLICK
  ====================================================== */

  const handleVersionHistoryClick =
    async (version) => {
      if (
        planLoading ||
        creatingVersion ||
        saving ||
        activatingVersionId
      ) {
        return;
      }

      const isAlreadyDisplayed =
        String(
          displayedVersionId
        ) ===
        String(
          version.versionid
        );

      if (
        isAlreadyDisplayed
      ) {
        return;
      }

      if (
        !confirmDiscardChanges()
      ) {
        return;
      }

      setHasUnsavedChanges(
        false
      );

      if (
        version.status ===
        'A'
      ) {
        setMessage('');
        setMessageType('');

        try {
          const loaded =
            await loadActivePlan(
              selectedProjectCode,
              selectedPhaseId
            );

          if (
            loaded
          ) {
            setMessageType(
              'success'
            );

            setMessage(
              `✓ Active Version ${version.versionid} loaded successfully.`
            );
          }
        } catch (error) {
          setMessageType(
            'error'
          );

          setMessage(
            `✕ ${
              error.message ||
              'Failed to load active Project Plan.'
            }`
          );
        }

        return;
      }

      await loadInactivePlan(
        version.versionid
      );
    };

  /* ======================================================
     ACTIVATE VERSION
  ====================================================== */

  const handleActivateVersion =
    async (version) => {
      if (
        !selectedProjectCode ||
        !selectedPhaseId ||
        !version?.versionid
      ) {
        return;
      }

      if (
        !confirmDiscardChanges()
      ) {
        return;
      }

      const warning =
        activeVersionId
          ? `Activate Version ${version.versionid}?\n\nCurrent active Version ${activeVersionId} will become inactive.`
          : `Activate Version ${version.versionid}?\n\nThis version will become the active editable version for this Project Phase.`;

      const confirmed =
        window.confirm(
          warning
        );

      if (
        !confirmed
      ) {
        return;
      }

      setActivatingVersionId(
        version.versionid
      );

      setHasUnsavedChanges(
        false
      );

      setMessage('');
      setMessageType('');

      try {
        const response =
          await fetch(
            `/api/project-phase-versions/${encodeURIComponent(
              selectedProjectCode
            )}/${encodeURIComponent(
              selectedPhaseId
            )}/${encodeURIComponent(
              version.versionid
            )}/activate`,
            {
              method: 'POST'
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to activate version.'
          );
        }

        const loaded =
          await loadActivePlan(
            selectedProjectCode,
            selectedPhaseId
          );

        await loadVersionHistory(
          selectedProjectCode,
          selectedPhaseId
        );

        if (
          !loaded
        ) {
          throw new Error(
            'Version was activated but the active Project Plan could not be reloaded.'
          );
        }

        setMessageType(
          'success'
        );

        setMessage(
          `✓ Version ${version.versionid} activated successfully.`
        );
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to activate version.'
          }`
        );
      } finally {
        setActivatingVersionId(
          ''
        );
      }
    };

  /* ======================================================
     OPEN CREATE VERSION MODAL
  ====================================================== */

  const handleOpenCreateVersionModal =
    () => {
      if (
        !selectedProjectCode ||
        !selectedPhaseId
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Please select a Project and Project Phase first.'
        );

        return;
      }

      if (
        !activeVersionId
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ An active version is required before creating a new version.'
        );

        return;
      }

      if (
        !confirmDiscardChanges()
      ) {
        return;
      }

      setCreateVersionError(
        ''
      );

      setNewVersionNote(
        ''
      );

      setShowCreateVersionModal(
        true
      );
    };

  /* ======================================================
     CLOSE CREATE VERSION MODAL
  ====================================================== */

  const handleCloseCreateVersionModal =
    () => {
      if (
        creatingVersion
      ) {
        return;
      }

      setShowCreateVersionModal(
        false
      );

      setNewVersionNote(
        ''
      );

      setCreateVersionError(
        ''
      );
    };

  /* ======================================================
     VERSION NOTE
  ====================================================== */

  const handleVersionNoteChange =
    (event) => {
      const value =
        event.target.value;

      if (
        value.length > 255
      ) {
        return;
      }

      setNewVersionNote(
        value
      );

      if (
        value.trim()
      ) {
        setCreateVersionError(
          ''
        );
      }
    };

  /* ======================================================
     CREATE NEW VERSION
  ====================================================== */

  const handleCreateNewVersion =
    async () => {
      const versionNote =
        newVersionNote.trim();

      if (
        !versionNote
      ) {
        setCreateVersionError(
          'Version Note is required.'
        );

        return;
      }

      if (
        versionNote.length >
        255
      ) {
        setCreateVersionError(
          'Version Note cannot exceed 255 characters.'
        );

        return;
      }

      setCreatingVersion(
        true
      );

      setCreateVersionError(
        ''
      );

      setMessage('');
      setMessageType('');

      try {
        const response =
          await fetch(
            `/api/project-phase-versions/${encodeURIComponent(
              selectedProjectCode
            )}/${encodeURIComponent(
              selectedPhaseId
            )}`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  versionnote:
                    versionNote
                })
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to create new version.'
          );
        }

        setViewingInactiveVersion(
          false
        );

        setHasUnsavedChanges(
          false
        );

        setShowCreateVersionModal(
          false
        );

        setNewVersionNote(
          ''
        );

        const loaded =
          await loadActivePlan(
            selectedProjectCode,
            selectedPhaseId
          );

        await loadVersionHistory(
          selectedProjectCode,
          selectedPhaseId
        );

        if (
          !loaded
        ) {
          throw new Error(
            'New version was created but could not be reloaded.'
          );
        }

        setMessageType(
          'success'
        );

        setMessage(
          `✓ Version ${result.newVersionId} created successfully. Version ${result.previousVersionId} is now inactive.`
        );
      } catch (error) {
        setCreateVersionError(
          error.message ||
            'Failed to create new version.'
        );
      } finally {
        setCreatingVersion(
          false
        );
      }
    };

  /* ======================================================
     BACK TO ACTIVE
  ====================================================== */

  const handleBackToActiveVersion =
    async () => {
      if (
        !activeVersionId
      ) {
        return;
      }

      setMessage('');
      setMessageType('');

      try {
        const loaded =
          await loadActivePlan(
            selectedProjectCode,
            selectedPhaseId
          );

        if (
          loaded
        ) {
          setHasUnsavedChanges(
            false
          );

          setMessageType(
            'success'
          );

          setMessage(
            '✓ Active Project Plan loaded successfully.'
          );
        }
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to return to active Project Plan.'
          }`
        );
      }
    };

  /* ======================================================
     AUTOMATIC WEEKLY PLAN UPDATE

     If rows already exist:
     - rebuild week columns
     - preserve matching allocations

     If no rows exist:
     - generate the weeks
     - create the first empty row automatically
  ====================================================== */

  const automaticallyUpdateWeeklyPlan =
    (
      newStartDate,
      newEndDate
    ) => {
      if (
        !newStartDate ||
        !newEndDate ||
        newEndDate <
          newStartDate
      ) {
        return false;
      }

      const newWeeks =
        generateWeeks(
          newStartDate,
          newEndDate
        );

      if (
        newWeeks.length ===
        0
      ) {
        return false;
      }

      if (
        resourceRows.length >
          0 &&
        generatedWeeks.length >
          0
      ) {
        const preservedRows =
          remapResourceRowsToWeeks(
            resourceRows,
            generatedWeeks,
            newWeeks
          );

        setGeneratedWeeks(
          newWeeks
        );

        setResourceRows(
          preservedRows
        );
      } else {
        setGeneratedWeeks(
          newWeeks
        );

        setResourceRows([
          createEmptyResourceRow(
            newWeeks
          )
        ]);
      }

      return true;
    };

  /* ======================================================
     START DATE
  ====================================================== */

  const handleStartDateChange =
    (event) => {
      if (
        viewingInactiveVersion ||
        !activeVersionId
      ) {
        return;
      }

      const value =
        event.target.value;

      setStartDate(
        value
      );

      setHasUnsavedChanges(
        true
      );

      setMessage('');
      setMessageType('');

      if (
        !value
      ) {
        return;
      }

      if (
        endDate &&
        value > endDate
      ) {
        setEndDate(
          ''
        );

        setMessageType(
          'error'
        );

        setMessage(
          '⚠ Start Date is later than the previous End Date. Please select a new End Date. Existing resource information is being kept.'
        );

        return;
      }

      if (
        endDate
      ) {
        const updated =
          automaticallyUpdateWeeklyPlan(
            value,
            endDate
          );

        if (
          updated
        ) {
          setMessageType(
            'success'
          );

          setMessage(
            '✓ Weekly plan updated automatically. Existing matching allocations were preserved.'
          );
        }
      }
    };

  /* ======================================================
     END DATE
  ====================================================== */

  const handleEndDateChange =
    (event) => {
      if (
        viewingInactiveVersion ||
        !activeVersionId
      ) {
        return;
      }

      const value =
        event.target.value;

      setEndDate(
        value
      );

      setHasUnsavedChanges(
        true
      );

      setMessage('');
      setMessageType('');

      if (
        !value
      ) {
        return;
      }

      if (
        startDate &&
        value < startDate
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ End Date cannot be earlier than Start Date. Existing resource information was not deleted.'
        );

        return;
      }

      if (
        startDate
      ) {
        const updated =
          automaticallyUpdateWeeklyPlan(
            startDate,
            value
          );

        if (
          updated
        ) {
          setMessageType(
            'success'
          );

          setMessage(
            '✓ Weekly plan updated automatically. Existing matching allocations were preserved.'
          );
        }
      }
    };

  /* ======================================================
     UPDATE SHARED DATES
  ====================================================== */

  const updateSharedPhaseDates =
    async () => {
      const response =
        await fetch(
          `/api/phase-dates/${encodeURIComponent(
            selectedProjectCode
          )}/${encodeURIComponent(
            selectedPhaseId
          )}`,
          {
            method:
              'PUT',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                startdate:
                  startDate,

                enddate:
                  endDate
              })
          }
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            'Failed to update shared phase dates.'
        );
      }

      return result;
    };

  /* ======================================================
     MANUAL GENERATE

     Kept as a fallback for a plan that currently has
     no generated weeks.
  ====================================================== */

  const handleGenerateWeeklyPlan =
    () => {
      if (
        viewingInactiveVersion ||
        !activeVersionId
      ) {
        return;
      }

      setMessage('');
      setMessageType('');

      if (
        !startDate ||
        !endDate
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Please select both Start Date and End Date.'
        );

        return;
      }

      if (
        endDate < startDate
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ End Date cannot be earlier than Start Date.'
        );

        return;
      }

      const updated =
        automaticallyUpdateWeeklyPlan(
          startDate,
          endDate
        );

      if (
        !updated
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Unable to generate the Weekly Plan.'
        );

        return;
      }

      setHasUnsavedChanges(
        true
      );

      setMessageType(
        'success'
      );

      setMessage(
        '✓ Weekly Plan generated successfully.'
      );
    };

  /* ======================================================
     RESOURCE ROWS
  ====================================================== */

  const handleAddResourceRow =
    () => {
      if (
        viewingInactiveVersion ||
        !activeVersionId
      ) {
        return;
      }

      setResourceRows(
        (previous) => [
          ...previous,

          createEmptyResourceRow(
            generatedWeeks
          )
        ]
      );

      setHasUnsavedChanges(
        true
      );
    };

  const handleRemoveResourceRow =
    (rowId) => {
      if (
        viewingInactiveVersion ||
        !activeVersionId
      ) {
        return;
      }

      setResourceRows(
        (previous) =>
          previous.filter(
            (row) =>
              row.id !== rowId
          )
      );

      setHasUnsavedChanges(
        true
      );
    };

  const handleResourceFieldChange =
    (
      rowId,
      field,
      value
    ) => {
      if (
        viewingInactiveVersion ||
        !activeVersionId
      ) {
        return;
      }

      setResourceRows(
        (previous) =>
          previous.map(
            (row) => {
              if (
                row.id !== rowId
              ) {
                return row;
              }

              if (
                field ===
                'resourceId'
              ) {
                const resource =
                  resources.find(
                    (item) =>
                      String(
                        item.resourceid
                      ) ===
                      String(
                        value
                      )
                  );

                return {
                  ...row,

                  resourceId:
                    value,

                  projectRoleId:
                    resource
                      ?.internalroleid ||
                    row.projectRoleId ||
                    '',

                  skill:
                    resource
                      ?.roledescription ||
                    '',

                  country:
                    resource
                      ?.location ||
                    '',

                  designation:
                    resource
                      ?.roledescription ||
                    ''
                };
              }

              if (
                field ===
                'projectRoleId'
              ) {
                const role =
                  projectRoles.find(
                    (item) =>
                      String(
                        item.projectroleid
                      ) ===
                      String(
                        value
                      )
                  );

                return {
                  ...row,

                  projectRoleId:
                    value,

                  skill:
                    role
                      ?.rolecategory ||
                    ''
                };
              }

              return {
                ...row,

                [field]:
                  value
              };
            }
          )
      );

      setHasUnsavedChanges(
        true
      );
    };

  /* ======================================================
     WEEK ALLOCATION
  ====================================================== */

  const handleWeekValueChange =
    (
      rowId,
      weekId,
      value
    ) => {
      if (
        viewingInactiveVersion ||
        !activeVersionId
      ) {
        return;
      }

      let cleanValue =
        value;

      if (
        cleanValue !== ''
      ) {
        const numericValue =
          Number(
            cleanValue
          );

        if (
          Number.isNaN(
            numericValue
          )
        ) {
          return;
        }

        if (
          numericValue < 0
        ) {
          cleanValue =
            '0';
        }

        if (
          numericValue > 100
        ) {
          cleanValue =
            '100';
        }
      }

      setResourceRows(
        (previous) =>
          previous.map(
            (row) =>
              row.id === rowId
                ? {
                    ...row,

                    weeklyValues: {
                      ...row.weeklyValues,

                      [weekId]:
                        cleanValue
                    }
                  }
                : row
          )
      );

      setHasUnsavedChanges(
        true
      );
    };

  /* ======================================================
     SAVE PLAN
  ====================================================== */

  const handleSavePlan =
    async () => {
      if (
        viewingInactiveVersion
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Inactive versions are read-only.'
        );

        return;
      }

      if (
        !activeVersionId
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ No active version exists for this Project Phase.'
        );

        return;
      }

      setMessage('');
      setMessageType('');

      if (
        !selectedProjectCode ||
        !selectedPhaseId
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Please select a Project and Project Phase.'
        );

        return;
      }

      if (
        !startDate ||
        !endDate
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Start Date and End Date are required.'
        );

        return;
      }

      if (
        endDate < startDate
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ End Date cannot be earlier than Start Date.'
        );

        return;
      }

      if (
        generatedWeeks.length ===
        0
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ The Weekly Plan has not been generated.'
        );

        return;
      }

      if (
        resourceRows.length ===
        0
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Add at least one resource row.'
        );

        return;
      }

      const incompleteRow =
        resourceRows.find(
          (row) =>
            !row.projectRoleId ||
            !row.resourceId ||
            !row.workLocation
        );

      if (
        incompleteRow
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Project Role, Planned Resource and Work Location are required for every resource row.'
        );

        return;
      }

      const rows =
        resourceRows.map(
          (row) => {
            const weeklyAllocations =
              generatedWeeks
                .map(
                  (week) => ({
                    year:
                      week.year,

                    weekno:
                      week.weekNumber,

                    allocation:
                      row.weeklyValues[
                        week.id
                      ]
                  })
                )
                .filter(
                  (week) =>
                    week.allocation !==
                      '' &&
                    week.allocation !=
                      null
                );

            const numericAllocations =
              weeklyAllocations.map(
                (week) =>
                  Number(
                    week.allocation
                  )
              );

            const headerAllocation =
              numericAllocations.length >
              0
                ? Math.round(
                    numericAllocations.reduce(
                      (
                        total,
                        value
                      ) =>
                        total +
                        value,
                      0
                    ) /
                      numericAllocations.length
                  )
                : null;

            return {
              projectroleid:
                row.projectRoleId,

              resourceid:
                row.resourceId,

              worklocation:
                row.workLocation,

              allocation:
                headerAllocation,

              weeks:
                weeklyAllocations
            };
          }
        );

      try {
        setSaving(
          true
        );

        await updateSharedPhaseDates();

        const response =
          await fetch(
            '/api/project-plans',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  projectcode:
                    selectedProjectCode,

                  versionid:
                    activeVersionId,

                  phaseid:
                    selectedPhaseId,

                  startdate:
                    startDate,

                  enddate:
                    endDate,

                  status:
                    'A',

                  rows
                })
            }
          );

        const result =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            result.error ||
              'Failed to save Project Plan.'
          );
        }

        setActiveVersionSummary(
          (previous) => ({
            ...previous,

            versionid:
              activeVersionId,

            startdate:
              startDate,

            enddate:
              endDate,

            linecount:
              resourceRows.length
          })
        );

        await loadVersionHistory(
          selectedProjectCode,
          selectedPhaseId
        );

        setHasUnsavedChanges(
          false
        );

        setMessageType(
          'success'
        );

        setMessage(
          `✓ Project Plan Version ${activeVersionId} saved successfully.`
        );
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to save Project Plan.'
          }`
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* ======================================================
     UI
  ====================================================== */

  return (
    <div className="page-wrap">

      <div className="card project-plan-card">

        <div className="page-heading">

          <div>

            <h1>
              📊 Project Plan
            </h1>

            <p className="page-description">
              Manage active project phase plans and review previous versions.
            </p>

          </div>

        </div>

        <div className="project-plan-entry-section">

          <h2>
            Project Details
          </h2>

          <div className="form-grid">

            <label>

              Project ID *

              <select
                value={
                  selectedProjectCode
                }
                onChange={
                  handleProjectChange
                }
                disabled={
                  masterDataLoading ||
                  creatingVersion ||
                  Boolean(
                    activatingVersionId
                  )
                }
              >

                <option value="">
                  {masterDataLoading
                    ? 'Loading Projects...'
                    : 'Select Project ID'}
                </option>

                {uniqueProjects.map(
                  (project) => (

                    <option
                      key={
                        project.projectcode
                      }
                      value={
                        project.projectcode
                      }
                    >
                      {
                        project.projectcode
                      }
                      {' - '}
                      {
                        project.projectname
                      }
                    </option>

                  )
                )}

              </select>

            </label>

            <label>

              Project Phase *

              <select
                value={
                  selectedPhaseId
                }
                onChange={
                  handlePhaseChange
                }
                disabled={
                  !selectedProjectCode ||
                  masterDataLoading ||
                  planLoading ||
                  creatingVersion ||
                  Boolean(
                    activatingVersionId
                  )
                }
              >

                <option value="">
                  Select Project Phase
                </option>

                {projectPhases.map(
                  (phase) => (

                    <option
                      key={
                        phase.phaseid
                      }
                      value={
                        phase.phaseid
                      }
                    >
                      {
                        phase.phaseid
                      }
                      {' - '}
                      {
                        phase.description
                      }
                    </option>

                  )
                )}

              </select>

            </label>

          </div>

          {selectedProjectCode &&
            selectedPhaseId &&
            hasActiveVersion && (

              <div
                className="phase-form-actions"
                style={{
                  marginTop:
                    '16px',

                  display:
                    'flex',

                  gap:
                    '10px',

                  flexWrap:
                    'wrap'
                }}
              >

                {!viewingInactiveVersion && (

                  <button
                    type="button"
                    onClick={
                      handleOpenCreateVersionModal
                    }
                    disabled={
                      creatingVersion ||
                      planLoading ||
                      saving ||
                      Boolean(
                        activatingVersionId
                      )
                    }
                  >
                    {creatingVersion
                      ? '⏳ Creating Version...'
                      : '➕ Create New Version'}
                  </button>

                )}

                {viewingInactiveVersion && (

                  <button
                    type="button"
                    onClick={
                      handleBackToActiveVersion
                    }
                    disabled={
                      planLoading ||
                      Boolean(
                        activatingVersionId
                      )
                    }
                  >
                    ↩ Back to Active Version
                  </button>

                )}

              </div>

            )}

          {selectedProject && (

            <div className="project-summary">

              <div className="summary-item">
                <span>
                  Project ID
                </span>
                <strong>
                  {
                    selectedProject.projectcode
                  }
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Displayed Version
                </span>
                <strong>
                  {displayedVersionId
                    ? `V${displayedVersionId}`
                    : '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Version Status
                </span>
                <strong>
                  {viewingInactiveVersion
                    ? 'Inactive'
                    : activeVersionId
                      ? 'Active'
                      : 'No Active Version'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Active Version
                </span>
                <strong>
                  {activeVersionId
                    ? `V${activeVersionId}`
                    : 'None'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Save Status
                </span>
                <strong>
                  {viewingInactiveVersion
                    ? 'Read Only'
                    : !activeVersionId
                      ? 'Not Editable'
                      : hasUnsavedChanges
                        ? '🟠 Unsaved Changes'
                        : '🟢 Saved'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Version Note
                </span>
                <strong>
                  {displayedVersionNote ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Project Description
                </span>
                <strong>
                  {selectedProject
                    .projectdescription ||
                    selectedProject
                      .projectname ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Business Partner
                </span>
                <strong>
                  {selectedProject
                    .partnerdescription ||
                    selectedProject
                      .partnerid ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Project Type
                </span>
                <strong>
                  {selectedProject
                    .projecttypedescription ||
                    selectedProject
                      .projecttype ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Currency
                </span>
                <strong>
                  {
                    selectedProject.currency ||
                    '-'
                  }
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Location
                </span>
                <strong>
                  {
                    selectedProject.location ||
                    '-'
                  }
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Region
                </span>
                <strong>
                  {
                    selectedProject.region ||
                    '-'
                  }
                </strong>
              </div>

            </div>

          )}

        </div>

        {noActiveVersion && (

          <p className="message message-error">
            ⚠ No active version exists for this Project Phase. Select an inactive version from Version History to review it, or click <strong>Activate</strong> to make that version active before editing the Project Plan.
          </p>

        )}

        {selectedProjectCode &&
          selectedPhaseId && (

            <div className="project-plan-entry-section">

              <div className="section-heading-row">

                <div>
                  <h2>
                    📚 Version History
                  </h2>

                  <p>
                    View historical versions or activate a version to make it editable.
                  </p>
                </div>

              </div>

              {versionHistoryLoading ? (

                <p>
                  ⏳ Loading version history...
                </p>

              ) : (

                <div className="table-wrap">

                  <table className="phase-table">

                    <thead>

                      <tr>
                        <th>Version</th>
                        <th>Status</th>
                        <th>Version Note</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Resource Lines</th>
                        <th>Action</th>
                      </tr>

                    </thead>

                    <tbody>

                      {versionHistory.length ===
                      0 ? (

                        <tr>
                          <td colSpan="7">
                            No version history available.
                          </td>
                        </tr>

                      ) : (

                        versionHistory.map(
                          (version) => {

                            const isDisplayed =
                              String(
                                displayedVersionId
                              ) ===
                              String(
                                version.versionid
                              );

                            const isActivating =
                              String(
                                activatingVersionId
                              ) ===
                              String(
                                version.versionid
                              );

                            return (

                              <tr
                                key={
                                  version.versionid
                                }
                                onClick={() =>
                                  handleVersionHistoryClick(
                                    version
                                  )
                                }
                                style={{
                                  cursor:
                                    planLoading ||
                                    activatingVersionId
                                      ? 'wait'
                                      : 'pointer',

                                  fontWeight:
                                    isDisplayed
                                      ? '700'
                                      : '400',

                                  opacity:
                                    planLoading ||
                                    activatingVersionId
                                      ? 0.7
                                      : 1
                                }}
                              >

                                <td>

                                  <strong>
                                    V
                                    {
                                      version.versionid
                                    }
                                  </strong>

                                  {isDisplayed && (
                                    <>
                                      {' '}
                                      👁️
                                    </>
                                  )}

                                </td>

                                <td>
                                  <strong>
                                    {version.status ===
                                    'A'
                                      ? '🟢 Active'
                                      : '⚪ Inactive'}
                                  </strong>
                                </td>

                                <td>
                                  {version.versionnote ||
                                    '-'}
                                </td>

                                <td>
                                  {version.startdate ||
                                    '-'}
                                </td>

                                <td>
                                  {version.enddate ||
                                    '-'}
                                </td>

                                <td>
                                  {
                                    version.linecount
                                  }
                                </td>

                                <td>

                                  <div
                                    style={{
                                      display:
                                        'flex',
                                      gap:
                                        '8px',
                                      flexWrap:
                                        'wrap'
                                    }}
                                  >

                                    <button
                                      type="button"
                                      className="secondary-button"
                                      disabled={
                                        planLoading ||
                                        creatingVersion ||
                                        saving ||
                                        Boolean(
                                          activatingVersionId
                                        ) ||
                                        isDisplayed
                                      }
                                      onClick={(
                                        event
                                      ) => {
                                        event.stopPropagation();

                                        handleVersionHistoryClick(
                                          version
                                        );
                                      }}
                                    >
                                      {isDisplayed
                                        ? 'Viewing'
                                        : version.status ===
                                            'A'
                                          ? 'Open Active'
                                          : 'View'}
                                    </button>

                                    {version.status ===
                                      'I' && (

                                      <button
                                        type="button"
                                        disabled={
                                          planLoading ||
                                          creatingVersion ||
                                          saving ||
                                          Boolean(
                                            activatingVersionId
                                          )
                                        }
                                        onClick={(
                                          event
                                        ) => {
                                          event.stopPropagation();

                                          handleActivateVersion(
                                            version
                                          );
                                        }}
                                      >
                                        {isActivating
                                          ? '⏳ Activating...'
                                          : '✓ Activate'}
                                      </button>

                                    )}

                                  </div>

                                </td>

                              </tr>

                            );
                          }
                        )

                      )}

                    </tbody>

                  </table>

                </div>

              )}

            </div>

          )}

        {viewingInactiveVersion && (

          <p className="message message-success">

            📚 You are viewing inactive Version{' '}

            <strong>
              {displayedVersionId}
            </strong>

            .

            {displayedVersionNote && (
              <>
                {' '}
                Note:{' '}
                <strong>
                  {displayedVersionNote}
                </strong>
                .
              </>
            )}

            {' '}This version is read-only.

          </p>

        )}

        {!viewingInactiveVersion &&
          hasUnsavedChanges &&
          activeVersionId && (

            <p className="message message-error">

              ⚠ You have unsaved changes in Version{' '}

              <strong>
                {displayedVersionId}
              </strong>

              . Save the Project Plan before changing project, phase, or version if you want to keep these changes.

            </p>

          )}

        {selectedProjectCode &&
          selectedPhaseId && (

            <div className="project-plan-entry-section">

              <div className="section-heading-row">

                <div>

                  <h2>
                    Phase Planning Period
                  </h2>

                  <p>
                    {
                      selectedPhase
                        ?.description
                    }

                    {displayedVersionId && (
                      <>
                        {' '}
                        — Version{' '}
                        <strong>
                          {
                            displayedVersionId
                          }
                        </strong>
                      </>
                    )}
                  </p>

                </div>

              </div>

              <div className="form-grid">

                <label>

                  Start Date *

                  <input
                    type="date"
                    value={
                      startDate
                    }
                    onChange={
                      handleStartDateChange
                    }
                    disabled={
                      viewingInactiveVersion ||
                      creatingVersion ||
                      !activeVersionId ||
                      Boolean(
                        activatingVersionId
                      )
                    }
                  />

                </label>

                <label>

                  End Date *

                  <input
                    type="date"
                    value={
                      endDate
                    }
                    min={
                      startDate ||
                      undefined
                    }
                    onChange={
                      handleEndDateChange
                    }
                    disabled={
                      viewingInactiveVersion ||
                      creatingVersion ||
                      !activeVersionId ||
                      Boolean(
                        activatingVersionId
                      )
                    }
                  />

                </label>

              </div>

              {!viewingInactiveVersion &&
                generatedWeeks.length ===
                  0 && (

                <div className="phase-form-actions">

                  <button
                    type="button"
                    onClick={
                      handleGenerateWeeklyPlan
                    }
                    disabled={
                      creatingVersion ||
                      !activeVersionId ||
                      !startDate ||
                      !endDate ||
                      Boolean(
                        activatingVersionId
                      )
                    }
                  >
                    Generate Weekly Plan
                  </button>

                </div>

              )}

              {!viewingInactiveVersion &&
                generatedWeeks.length >
                  0 && (

                <p
                  style={{
                    marginTop:
                      '14px',
                    marginBottom:
                      0
                  }}
                >
                  ✓ Weekly columns update automatically when the planning dates change.
                </p>

              )}

            </div>

          )}

        {message && (

          <p
            className={`message message-${messageType}`}
          >
            {message}
          </p>

        )}

        {generatedWeeks.length >
          0 && (

          <div className="project-plan-entry-section">

            <div className="section-heading-row">

              <div>

                <h2>
                  Weekly Resource Plan
                </h2>

                <p>
                  {viewingInactiveVersion
                    ? 'Historical resource allocations for this inactive version.'
                    : 'Enter planned resource allocation for each generated week.'}
                </p>

              </div>

              {!viewingInactiveVersion &&
                activeVersionId && (

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    handleAddResourceRow
                  }
                  disabled={
                    creatingVersion ||
                    Boolean(
                      activatingVersionId
                    )
                  }
                >
                  + Add Resource Row
                </button>

              )}

            </div>

            <div className="project-entry-grid-wrap">

              <table className="project-entry-grid">

                <thead>

                  <tr>

                    <th>Project Role</th>
                    <th>Skill</th>
                    <th>Planned Resource</th>
                    <th>Country</th>
                    <th>Designation</th>
                    <th>Work Location</th>

                    {generatedWeeks.map(
                      (week) => (

                        <th
                          key={
                            week.id
                          }
                          className="week-column-header"
                        >

                          <strong>
                            Week{' '}
                            {
                              week.weekNumber
                            }
                          </strong>

                          <span>
                            {formatDate(
                              week.startDate
                            )}
                          </span>

                          <span>
                            to
                          </span>

                          <span>
                            {formatDate(
                              week.endDate
                            )}
                          </span>

                        </th>

                      )
                    )}

                    {!viewingInactiveVersion &&
                      activeVersionId && (
                      <th>
                        Action
                      </th>
                    )}

                  </tr>

                </thead>

                <tbody>

                  {resourceRows.map(
                    (row) => (

                      <tr
                        key={
                          row.id
                        }
                      >

                        <td>

                          <select
                            value={
                              row.projectRoleId
                            }
                            onChange={(
                              event
                            ) =>
                              handleResourceFieldChange(
                                row.id,
                                'projectRoleId',
                                event.target.value
                              )
                            }
                            disabled={
                              viewingInactiveVersion ||
                              creatingVersion ||
                              !activeVersionId ||
                              Boolean(
                                activatingVersionId
                              )
                            }
                          >

                            <option value="">
                              Select Role
                            </option>

                            {projectRoles.map(
                              (role) => (

                                <option
                                  key={
                                    role.projectroleid
                                  }
                                  value={
                                    role.projectroleid
                                  }
                                >
                                  {
                                    role.projectroleid
                                  }
                                  {' - '}
                                  {
                                    role.description
                                  }
                                </option>

                              )
                            )}

                          </select>

                        </td>

                        <td>

                          <input
                            value={
                              row.skill
                            }
                            readOnly
                            placeholder="Auto"
                          />

                        </td>

                        <td>

                          <select
                            value={
                              row.resourceId
                            }
                            onChange={(
                              event
                            ) =>
                              handleResourceFieldChange(
                                row.id,
                                'resourceId',
                                event.target.value
                              )
                            }
                            disabled={
                              viewingInactiveVersion ||
                              creatingVersion ||
                              !activeVersionId ||
                              Boolean(
                                activatingVersionId
                              )
                            }
                          >

                            <option value="">
                              Select Resource
                            </option>

                            {resources.map(
                              (resource) => (

                                <option
                                  key={
                                    resource.resourceid
                                  }
                                  value={
                                    resource.resourceid
                                  }
                                >
                                  {
                                    resource.resourceid
                                  }
                                  {' - '}
                                  {
                                    resource.firstname
                                  }
                                  {' '}
                                  {
                                    resource.lastname
                                  }
                                </option>

                              )
                            )}

                          </select>

                        </td>

                        <td>

                          <input
                            value={
                              row.country
                            }
                            readOnly
                            placeholder="Auto"
                          />

                        </td>

                        <td>

                          <input
                            value={
                              row.designation
                            }
                            readOnly
                            placeholder="Auto"
                          />

                        </td>

                        <td>

                          <select
                            value={
                              row.workLocation
                            }
                            onChange={(
                              event
                            ) =>
                              handleResourceFieldChange(
                                row.id,
                                'workLocation',
                                event.target.value
                              )
                            }
                            disabled={
                              viewingInactiveVersion ||
                              creatingVersion ||
                              !activeVersionId ||
                              Boolean(
                                activatingVersionId
                              )
                            }
                          >

                            <option value="">
                              Select
                            </option>

                            {workLocations.map(
                              (location) => (

                                <option
                                  key={
                                    location
                                  }
                                  value={
                                    location
                                  }
                                >
                                  {
                                    location
                                  }
                                </option>

                              )
                            )}

                          </select>

                        </td>

                        {generatedWeeks.map(
                          (week) => (

                            <td
                              key={
                                week.id
                              }
                              className="editable-week-cell"
                            >

                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={
                                  row.weeklyValues[
                                    week.id
                                  ] ?? ''
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleWeekValueChange(
                                    row.id,
                                    week.id,
                                    event.target.value
                                  )
                                }
                                disabled={
                                  viewingInactiveVersion ||
                                  creatingVersion ||
                                  !activeVersionId ||
                                  Boolean(
                                    activatingVersionId
                                  )
                                }
                                placeholder="0"
                              />

                            </td>

                          )
                        )}

                        {!viewingInactiveVersion &&
                          activeVersionId && (

                          <td>

                            <button
                              type="button"
                              className="delete-button"
                              onClick={() =>
                                handleRemoveResourceRow(
                                  row.id
                                )
                              }
                              disabled={
                                creatingVersion ||
                                Boolean(
                                  activatingVersionId
                                )
                              }
                            >
                              Remove
                            </button>

                          </td>

                        )}

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            <div className="project-plan-grid-footer">

              <div className="week-value-help">

                {displayedVersionId ? (

                  <>
                    Version:{' '}

                    <strong>
                      {
                        displayedVersionId
                      }
                    </strong>

                    {' | '}

                    {viewingInactiveVersion
                      ? 'Inactive / Read Only'
                      : hasUnsavedChanges
                        ? 'Active / Unsaved Changes'
                        : 'Active / Saved'}
                  </>

                ) : (

                  <strong>
                    No active version
                  </strong>

                )}

              </div>

              {!viewingInactiveVersion &&
                activeVersionId && (

                <button
                  type="button"
                  onClick={
                    handleSavePlan
                  }
                  disabled={
                    saving ||
                    creatingVersion ||
                    Boolean(
                      activatingVersionId
                    )
                  }
                >
                  {saving
                    ? '⏳ Saving...'
                    : hasUnsavedChanges
                      ? '💾 Save Changes'
                      : '✓ Saved'}
                </button>

              )}

            </div>

          </div>

        )}

      </div>

      {/* =================================================
          CREATE VERSION MODAL
      ================================================= */}

      {showCreateVersionModal && (

        <div
          style={{
            position:
              'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'rgba(0, 0, 0, 0.55)',
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding:
              '20px',
            zIndex:
              9999
          }}
          onClick={
            handleCloseCreateVersionModal
          }
        >

          <div
            style={{
              width:
                '100%',
              maxWidth:
                '560px',
              background:
                '#ffffff',
              borderRadius:
                '12px',
              padding:
                '24px',
              boxShadow:
                '0 20px 50px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                gap:
                  '20px',
                alignItems:
                  'flex-start',
                marginBottom:
                  '20px'
              }}
            >

              <div>

                <h2
                  style={{
                    margin:
                      '0 0 8px 0'
                  }}
                >
                  ➕ Create New Version
                </h2>

                <p
                  style={{
                    margin:
                      0
                  }}
                >
                  A copy of the current active plan will become the new active version.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseCreateVersionModal
                }
                disabled={
                  creatingVersion
                }
              >
                ✕
              </button>

            </div>

            <div
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap:
                  '12px',
                marginBottom:
                  '20px'
              }}
            >

              <div>
                <div
                  style={{
                    fontSize:
                      '12px',
                    opacity:
                      0.7
                  }}
                >
                  Project
                </div>

                <strong>
                  {
                    selectedProjectCode
                  }
                </strong>
              </div>

              <div>
                <div
                  style={{
                    fontSize:
                      '12px',
                    opacity:
                      0.7
                  }}
                >
                  Phase
                </div>

                <strong>
                  {
                    selectedPhaseId
                  }
                </strong>
              </div>

              <div>
                <div
                  style={{
                    fontSize:
                      '12px',
                    opacity:
                      0.7
                  }}
                >
                  Current Active Version
                </div>

                <strong>
                  V
                  {
                    activeVersionId
                  }
                </strong>
              </div>

              <div>
                <div
                  style={{
                    fontSize:
                      '12px',
                    opacity:
                      0.7
                  }}
                >
                  Current Status
                </div>

                <strong>
                  🟢 Active
                </strong>
              </div>

            </div>

            <label
              style={{
                display:
                  'block'
              }}
            >

              Version Note *

              <textarea
                value={
                  newVersionNote
                }
                onChange={
                  handleVersionNoteChange
                }
                disabled={
                  creatingVersion
                }
                rows={
                  5
                }
                maxLength={
                  255
                }
                placeholder="Example: Customer requested resource allocation changes"
                style={{
                  width:
                    '100%',
                  marginTop:
                    '8px',
                  resize:
                    'vertical',
                  boxSizing:
                    'border-box'
                }}
              />

            </label>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                marginTop:
                  '6px'
              }}
            >

              <div>

                {createVersionError && (

                  <span
                    style={{
                      color:
                        '#b42318'
                    }}
                  >
                    ✕ {
                      createVersionError
                    }
                  </span>

                )}

              </div>

              <small>
                {
                  newVersionNote.length
                }
                {' / '}
                255
              </small>

            </div>

            <div
              style={{
                marginTop:
                  '24px',
                padding:
                  '12px',
                borderRadius:
                  '8px',
                background:
                  'rgba(0, 0, 0, 0.04)'
              }}
            >

              <strong>
                What will happen?
              </strong>

              <p
                style={{
                  margin:
                    '8px 0 0 0'
                }}
              >
                Version V
                {
                  activeVersionId
                }{' '}
                will become inactive. Its Project Plan, resources, Work Location values and weekly allocations will be copied into the new active version.
              </p>

            </div>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end',
                gap:
                  '10px',
                marginTop:
                  '24px'
              }}
            >

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleCloseCreateVersionModal
                }
                disabled={
                  creatingVersion
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCreateNewVersion
                }
                disabled={
                  creatingVersion ||
                  !newVersionNote.trim()
                }
              >
                {creatingVersion
                  ? '⏳ Creating...'
                  : '➕ Create Version'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default ProjectPlanPage;