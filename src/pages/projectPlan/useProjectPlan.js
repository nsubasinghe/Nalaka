import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  activateProjectVersion,
  createProjectVersion,
  fetchActiveProjectPlan,
  fetchProjectPhaseAssignments,
  fetchProjectRoles,
  fetchProjects,
  fetchProjectVersionPlan,
  fetchProjectVersions,
  fetchResources,
  saveProjectPlan
} from './projectPlanApi';

import {
  UNSAVED_MESSAGE,
  buildDisplayWeeks,
  buildHistoricalResourceRows,
  createEmptyResourceRow,
  generateWeeks,
  getWeekPeriodKey,
  remapResourceRowsToWeeks,
  toDateInputValue,
  workLocations
} from './projectPlanUtils';

/* =========================================================
   PROJECT PLAN CONTROLLER HOOK
========================================================= */

function useProjectPlan() {
  /* =======================================================
     MASTER DATA
  ======================================================= */

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

  /* =======================================================
     LOADING / ACTION STATE
  ======================================================= */

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

  /* =======================================================
     PROJECT / VERSION / PHASE SELECTION
  ======================================================= */

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
    viewingInactiveVersion,
    setViewingInactiveVersion
  ] = useState(false);

  const [
    projectVersions,
    setProjectVersions
  ] = useState([]);

  /* =======================================================
     PLANNING PERIOD
  ======================================================= */

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

  /* =======================================================
     RAW SAVED PLAN DATA

     Keeps the complete rows returned by the backend,
     including preserved historical exact-period records.
  ======================================================= */

  const [
    savedPlanRows,
    setSavedPlanRows
  ] = useState([]);

  /* =======================================================
     PAGE MESSAGE
  ======================================================= */

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

  /* =======================================================
     CREATE VERSION MODAL
  ======================================================= */

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

  /* =======================================================
     DERIVED STATE
  ======================================================= */

  const hasActiveVersion =
    Boolean(
      activeVersionId
    );

  const noActiveVersion =
    Boolean(
      selectedProjectCode &&
      !activeVersionId &&
      !versionHistoryLoading
    );

  /* =======================================================
     UNSAVED BROWSER WARNING
  ======================================================= */

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

  /* =======================================================
     LOAD MASTER DATA
  ======================================================= */

  useEffect(() => {
    const loadMasterData =
      async () => {
        setMasterDataLoading(
          true
        );

        try {
          const [
            loadedProjects,
            loadedRoles,
            loadedResources
          ] =
            await Promise.all([
              fetchProjects(),
              fetchProjectRoles(),
              fetchResources()
            ]);

          setProjects(
            loadedProjects
          );

          setProjectRoles(
            loadedRoles
          );

          setResources(
            loadedResources
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

  /* =======================================================
     PROJECT PHASE ASSIGNMENTS
  ======================================================= */

  const loadProjectPhaseAssignments =
    async (
      projectCode
    ) => {
      if (
        !projectCode
      ) {
        setProjectPhases(
          []
        );

        return [];
      }

      const phases =
        await fetchProjectPhaseAssignments(
          projectCode
        );

      setProjectPhases(
        phases
      );

      return phases;
    };

  /* =======================================================
     UNIQUE PROJECTS
  ======================================================= */

  const uniqueProjects =
    useMemo(() => {
      const map =
        new Map();

      projects.forEach(
        (project) => {
          const existing =
            map.get(
              project.projectcode
            );

          if (
            !existing
          ) {
            map.set(
              project.projectcode,
              project
            );

            return;
          }

          if (
            project.versionstatus ===
            'A'
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

  /* =======================================================
     SELECTED PROJECT
  ======================================================= */

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

  /* =======================================================
     SELECTED PHASE
  ======================================================= */

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

  /* =======================================================
     ACTIVE VERSION
  ======================================================= */

  const activeVersion =
    useMemo(() => {
      return projectVersions.find(
        (version) =>
          version.status ===
          'A'
      );
    }, [
      projectVersions
    ]);

  /* =======================================================
     DISPLAY WEEK COLUMNS

     This combines:
     - current generated exact periods
     - preserved historical exact periods

     Example:
     Week 36 | 01 Sep - 06 Sep
     Week 36 | 04 Sep - 06 Sep
  ======================================================= */

  const displayWeeks =
    useMemo(() => {
      return buildDisplayWeeks(
        savedPlanRows,
        generatedWeeks
      );
    }, [
      savedPlanRows,
      generatedWeeks
    ]);

  /* =======================================================
     HISTORICAL RESOURCE ROWS

     These rows are read-only and contain only allocations
     that do not belong to the currently active exact period.
  ======================================================= */

  const historicalResourceRows =
    useMemo(() => {
      return buildHistoricalResourceRows(
        savedPlanRows,
        generatedWeeks,
        displayWeeks,
        resources
      );
    }, [
      savedPlanRows,
      generatedWeeks,
      displayWeeks,
      resources
    ]);

  /* =======================================================
     RESET PLANNING AREA
  ======================================================= */

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

      setSavedPlanRows(
        []
      );

      setHasUnsavedChanges(
        false
      );
    };

  /* =======================================================
     RESET PROJECT VERSION STATE
  ======================================================= */

  const resetProjectVersionState =
    () => {
      setProjectVersions(
        []
      );

      setActiveVersionId(
        ''
      );

      setDisplayedVersionId(
        ''
      );

      setDisplayedVersionNote(
        ''
      );

      setViewingInactiveVersion(
        false
      );
    };

  /* =======================================================
     LOAD PROJECT VERSIONS
  ======================================================= */

  const loadProjectVersions =
    async (
      projectCode
    ) => {
      if (
        !projectCode
      ) {
        resetProjectVersionState();

        return [];
      }

      setVersionHistoryLoading(
        true
      );

      try {
        const versions =
          await fetchProjectVersions(
            projectCode
          );

        setProjectVersions(
          versions
        );

        const active =
          versions.find(
            (version) =>
              version.status ===
              'A'
          );

        if (
          active
        ) {
          setActiveVersionId(
            active.versionid
          );

          if (
            !viewingInactiveVersion
          ) {
            setDisplayedVersionId(
              active.versionid
            );

            setDisplayedVersionNote(
              active.versionnote ||
              ''
            );
          }
        } else {
          setActiveVersionId(
            ''
          );

          if (
            !viewingInactiveVersion
          ) {
            setDisplayedVersionId(
              ''
            );

            setDisplayedVersionNote(
              ''
            );
          }
        }

        return versions;
      } finally {
        setVersionHistoryLoading(
          false
        );
      }
    };

  /* =======================================================
     MAP SAVED PLAN
  ======================================================= */

  const populatePlanFromRows =
    (
      rows,
      versionId
    ) => {
      if (
        !Array.isArray(
          rows
        ) ||
        rows.length ===
          0
      ) {
        resetPlanningArea();

        setDisplayedVersionId(
          versionId ||
          ''
        );

        return false;
      }

      /* ---------------------------------------------------
         STORE ALL RAW DATA INCLUDING HISTORICAL PERIODS
      --------------------------------------------------- */

      setSavedPlanRows(
        rows
      );

      const firstRow =
        rows[0];

      const loadedStartDate =
        firstRow.startdate
          ? String(
              firstRow.startdate
            ).slice(
              0,
              10
            )
          : '';

      const loadedEndDate =
        firstRow.enddate
          ? String(
              firstRow.enddate
            ).slice(
              0,
              10
            )
          : '';

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

      /* ---------------------------------------------------
         BUILD CURRENT EDITABLE RESOURCE ROWS

         Only values matching the current exact periods are
         placed into these rows. Historical values remain in
         savedPlanRows and are exposed separately.
      --------------------------------------------------- */

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
                const generatedPeriodKey =
                  getWeekPeriodKey(
                    week
                  );

                const savedWeek =
                  savedRow.weeks
                    ?.find(
                      (item) => {
                        const savedStart =
                          item.periodstartdate ||
                          item.periodStartDate ||
                          '';

                        const savedEnd =
                          item.periodenddate ||
                          item.periodEndDate ||
                          '';

                        if (
                          savedStart &&
                          savedEnd
                        ) {
                          return (
                            `${String(
                              savedStart
                            ).slice(
                              0,
                              10
                            )}|${String(
                              savedEnd
                            ).slice(
                              0,
                              10
                            )}` ===
                            generatedPeriodKey
                          );
                        }

                        return (
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
                      }
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
                `saved-${savedRow.prjuuid}-${savedRow.lineid || index}`,

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

              weeklyValues,

              lastEditedWeekId:
                '',

              recordType:
                'current',

              readOnly:
                false
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

      return true;
    };

  /* =======================================================
     LOAD ACTIVE PLAN
  ======================================================= */

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
        const {
          found,
          result
        } =
          await fetchActiveProjectPlan(
            projectCode,
            phaseId
          );

        if (
          !found
        ) {
          resetPlanningArea();

          const currentActive =
            projectVersions.find(
              (version) =>
                version.status ===
                'A'
            );

          if (
            currentActive
          ) {
            setActiveVersionId(
              currentActive.versionid
            );

            setDisplayedVersionId(
              currentActive.versionid
            );

            setDisplayedVersionNote(
              currentActive.versionnote ||
              ''
            );
          }

          setViewingInactiveVersion(
            false
          );

          return false;
        }

        setActiveVersionId(
          result.activeVersionId
        );

        setDisplayedVersionId(
          result.activeVersionId
        );

        setDisplayedVersionNote(
          result.versionnote ||
          ''
        );

        setViewingInactiveVersion(
          false
        );

        populatePlanFromRows(
          result.rows,
          result.activeVersionId
        );

        return true;
      } finally {
        setPlanLoading(
          false
        );
      }
    };

  /* =======================================================
     LOAD SPECIFIC VERSION PLAN
  ======================================================= */

  const loadSpecificVersionPlan =
    async (
      versionId,
      phaseId =
        selectedPhaseId
    ) => {
      if (
        !selectedProjectCode ||
        !phaseId ||
        !versionId
      ) {
        return false;
      }

      setPlanLoading(
        true
      );

      try {
        const result =
          await fetchProjectVersionPlan(
            selectedProjectCode,
            versionId,
            phaseId
          );

        setDisplayedVersionId(
          versionId
        );

        setDisplayedVersionNote(
          result.versionnote ||
          ''
        );

        const isInactive =
          result.status !==
          'A';

        setViewingInactiveVersion(
          isInactive
        );

        if (
          !Array.isArray(
            result.rows
          ) ||
          result.rows.length ===
            0
        ) {
          resetPlanningArea();

          setDisplayedVersionId(
            versionId
          );

          setDisplayedVersionNote(
            result.versionnote ||
            ''
          );

          setViewingInactiveVersion(
            isInactive
          );

          return false;
        }

        populatePlanFromRows(
          result.rows,
          versionId
        );

        setViewingInactiveVersion(
          isInactive
        );

        return true;
      } finally {
        setPlanLoading(
          false
        );
      }
    };

  /* =======================================================
     PROJECT CHANGE
  ======================================================= */

  const handleProjectChange =
    async (event) => {
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

      setProjectPhases(
        []
      );

      resetPlanningArea();

      resetProjectVersionState();

      setMessage('');
      setMessageType('');

      if (
        !projectCode
      ) {
        return;
      }

      try {
        await Promise.all([
          loadProjectVersions(
            projectCode
          ),

          loadProjectPhaseAssignments(
            projectCode
          )
        ]);
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to load project versions.'
          }`
        );
      }
    };

  /* =======================================================
     PHASE CHANGE
  ======================================================= */

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

      resetPlanningArea();

      setMessage('');
      setMessageType('');

      if (
        !selectedProjectCode ||
        !phaseId ||
        !displayedVersionId
      ) {
        return;
      }

      try {
        if (
          viewingInactiveVersion
        ) {
          const loaded =
            await loadSpecificVersionPlan(
              displayedVersionId,
              phaseId
            );

          setMessageType(
            loaded
              ? 'success'
              : 'error'
          );

          setMessage(
            loaded
              ? `✓ Version ${displayedVersionId}, Phase ${phaseId} loaded.`
              : `⚠ Version ${displayedVersionId} has no planning rows for Phase ${phaseId}.`
          );

          return;
        }

        const loaded =
          await loadActivePlan(
            selectedProjectCode,
            phaseId
          );

        setMessageType(
          loaded
            ? 'success'
            : 'error'
        );

        setMessage(
          loaded
            ? `✓ Active Project Version ${
                activeVersionId ||
                displayedVersionId
              } loaded for Phase ${phaseId}.`
            : '⚠ The active project version does not currently contain planning rows for this phase.'
        );
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

  /* =======================================================
     VERSION HISTORY CLICK
  ======================================================= */

  const handleVersionHistoryClick =
    async (
      version
    ) => {
      if (
        planLoading ||
        creatingVersion ||
        saving ||
        activatingVersionId
      ) {
        return;
      }

      if (
        String(
          displayedVersionId
        ) ===
        String(
          version.versionid
        )
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

      setDisplayedVersionId(
        version.versionid
      );

      setDisplayedVersionNote(
        version.versionnote ||
        ''
      );

      const isInactive =
        version.status ===
        'I';

      setViewingInactiveVersion(
        isInactive
      );

      resetPlanningArea();

      setDisplayedVersionId(
        version.versionid
      );

      setDisplayedVersionNote(
        version.versionnote ||
        ''
      );

      setViewingInactiveVersion(
        isInactive
      );

      if (
        !selectedPhaseId
      ) {
        setMessageType(
          'success'
        );

        setMessage(
          `✓ Project Version ${version.versionid} selected. Select a Project Phase to view its planning data.`
        );

        return;
      }

      try {
        if (
          version.status ===
          'A'
        ) {
          const loaded =
            await loadActivePlan(
              selectedProjectCode,
              selectedPhaseId
            );

          setMessageType(
            loaded
              ? 'success'
              : 'error'
          );

          setMessage(
            loaded
              ? `✓ Active Project Version ${version.versionid} loaded.`
              : `⚠ Active Version ${version.versionid} has no planning rows for the selected phase.`
          );

          return;
        }

        const loaded =
          await loadSpecificVersionPlan(
            version.versionid,
            selectedPhaseId
          );

        setMessageType(
          loaded
            ? 'success'
            : 'error'
        );

        setMessage(
          loaded
            ? `✓ Inactive Project Version ${version.versionid} loaded in read-only mode.`
            : `⚠ Project Version ${version.versionid} has no planning rows for the selected phase.`
        );
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to load Project Version.'
          }`
        );
      }
    };

  /* =======================================================
     VERSION CHANGE
  ======================================================= */

  const handleVersionChange =
    async (event) => {
      const versionId =
        event.target.value;

      const version =
        projectVersions.find(
          (item) =>
            String(
              item.versionid
            ) ===
            String(
              versionId
            )
        );

      if (
        !version
      ) {
        return;
      }

      await handleVersionHistoryClick(
        version
      );
    };

  /* =======================================================
     ACTIVATE VERSION
  ======================================================= */

  const handleActivateVersion =
    async (
      version
    ) => {
      if (
        !selectedProjectCode ||
        !version?.versionid
      ) {
        return;
      }

      if (
        !confirmDiscardChanges()
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Activate Project Version ${version.versionid}?\n\nThe current active Project Version ${
            activeVersionId ||
            '-'
          } will become inactive.\n\nThis affects the entire project and all phases.`
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
        await activateProjectVersion(
          selectedProjectCode,
          version.versionid
        );

        setViewingInactiveVersion(
          false
        );

        await loadProjectVersions(
          selectedProjectCode
        );

        if (
          selectedPhaseId
        ) {
          await loadActivePlan(
            selectedProjectCode,
            selectedPhaseId
          );
        } else {
          resetPlanningArea();
        }

        setMessageType(
          'success'
        );

        setMessage(
          `✓ Project Version ${version.versionid} activated successfully for the entire project.`
        );
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to activate Project Version.'
          }`
        );
      } finally {
        setActivatingVersionId(
          ''
        );
      }
    };

  /* =======================================================
     OPEN CREATE VERSION MODAL
  ======================================================= */

  const handleOpenCreateVersionModal =
    () => {
      if (
        !selectedProjectCode
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Please select a Project first.'
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
          '✕ An active Project Version is required before creating a new version.'
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

  /* =======================================================
     CLOSE CREATE VERSION MODAL
  ======================================================= */

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

  /* =======================================================
     VERSION NOTE
  ======================================================= */

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

  /* =======================================================
     CREATE NEW VERSION
  ======================================================= */

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

      setCreatingVersion(
        true
      );

      setCreateVersionError(
        ''
      );

      setMessage('');
      setMessageType('');

      try {
        const result =
          await createProjectVersion(
            selectedProjectCode,
            versionNote
          );

        setShowCreateVersionModal(
          false
        );

        setNewVersionNote(
          ''
        );

        setViewingInactiveVersion(
          false
        );

        setHasUnsavedChanges(
          false
        );

        await loadProjectVersions(
          selectedProjectCode
        );

        if (
          selectedPhaseId
        ) {
          await loadActivePlan(
            selectedProjectCode,
            selectedPhaseId
          );
        }

        setMessageType(
          'success'
        );

        setMessage(
          `✓ Project Version ${result.newVersionId} created successfully. Version ${result.previousVersionId} is now inactive. ${result.copiedPhaseCount} phase(s), ${result.copiedHeaderRows} resource line(s) and ${result.copiedItemRows} weekly allocation row(s) were copied.`
        );
      } catch (error) {
        setCreateVersionError(
          error.message ||
          'Failed to create Project Version.'
        );
      } finally {
        setCreatingVersion(
          false
        );
      }
    };

  /* =======================================================
     BACK TO ACTIVE VERSION
  ======================================================= */

  const handleBackToActiveVersion =
    async () => {
      if (
        !activeVersionId
      ) {
        return;
      }

      setViewingInactiveVersion(
        false
      );

      setDisplayedVersionId(
        activeVersionId
      );

      setDisplayedVersionNote(
        activeVersion
          ?.versionnote ||
        ''
      );

      if (
        !selectedPhaseId
      ) {
        resetPlanningArea();

        setDisplayedVersionId(
          activeVersionId
        );

        setDisplayedVersionNote(
          activeVersion
            ?.versionnote ||
          ''
        );

        return;
      }

      try {
        const loaded =
          await loadActivePlan(
            selectedProjectCode,
            selectedPhaseId
          );

        setMessageType(
          loaded
            ? 'success'
            : 'error'
        );

        setMessage(
          loaded
            ? `✓ Active Project Version ${activeVersionId} loaded.`
            : `⚠ Active Version ${activeVersionId} has no planning rows for the selected phase.`
        );
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to load active Project Version.'
          }`
        );
      }
    };

  /* =======================================================
     AUTOMATIC WEEK UPDATE
  ======================================================= */

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

  /* =======================================================
     START DATE CHANGE
  ======================================================= */

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
          '⚠ Start Date is later than the previous End Date. Select a new End Date.'
        );

        return;
      }

      if (
        endDate
      ) {
        automaticallyUpdateWeeklyPlan(
          value,
          endDate
        );
      }
    };

  /* =======================================================
     END DATE CHANGE
  ======================================================= */

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
          '✕ End Date cannot be earlier than Start Date.'
        );

        return;
      }

      if (
        startDate
      ) {
        automaticallyUpdateWeeklyPlan(
          startDate,
          value
        );
      }
    };

  /* =======================================================
     GENERATE WEEKLY PLAN
  ======================================================= */

  const handleGenerateWeeklyPlan =
    () => {
      if (
        viewingInactiveVersion ||
        !activeVersionId
      ) {
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

      const updated =
        automaticallyUpdateWeeklyPlan(
          startDate,
          endDate
        );

      if (
        !updated
      ) {
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

  /* =======================================================
     ADD RESOURCE ROW
  ======================================================= */

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

  /* =======================================================
     REMOVE RESOURCE ROW
  ======================================================= */

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
              row.id !==
              rowId
          )
      );

      setHasUnsavedChanges(
        true
      );
    };

  /* =======================================================
     RESOURCE FIELD CHANGE
  ======================================================= */

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
                row.id !==
                rowId
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

  /* =======================================================
     WEEK VALUE CHANGE
  ======================================================= */

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
              row.id ===
              rowId
                ? {
                    ...row,

                    weeklyValues: {
                      ...row.weeklyValues,

                      [weekId]:
                        cleanValue
                    },

                    lastEditedWeekId:
                      weekId
                  }
                : row
          )
      );

      setHasUnsavedChanges(
        true
      );
    };

  /* =======================================================
     APPLY WEEK VALUE TO ALL
  ======================================================= */

  const handleApplyWeekValueToAll =
    (rowId) => {
      if (
        viewingInactiveVersion ||
        !activeVersionId ||
        displayedVersionId !==
          activeVersionId
      ) {
        return;
      }

      const sourceRow =
        resourceRows.find(
          (row) =>
            row.id ===
            rowId
        );

      if (
        !sourceRow ||
        !sourceRow.lastEditedWeekId
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Enter or change a working percentage in one week before applying it to all weeks.'
        );

        return;
      }

      const sourceValue =
        sourceRow.weeklyValues[
          sourceRow.lastEditedWeekId
        ];

      if (
        sourceValue === '' ||
        sourceValue == null
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Enter or change a working percentage in one week before applying it to all weeks.'
        );

        return;
      }

      const numericValue =
        Number(
          sourceValue
        );

      if (
        Number.isNaN(
          numericValue
        )
      ) {
        return;
      }

      const cleanValue =
        String(
          Math.min(
            100,
            Math.max(
              0,
              numericValue
            )
          )
        );

      setResourceRows(
        (previous) =>
          previous.map(
            (row) => {
              if (
                row.id !==
                rowId
              ) {
                return row;
              }

              const updatedWeeklyValues =
                {};

              generatedWeeks.forEach(
                (week) => {
                  updatedWeeklyValues[
                    week.id
                  ] =
                    cleanValue;
                }
              );

              return {
                ...row,

                weeklyValues:
                  updatedWeeklyValues
              };
            }
          )
      );

      setHasUnsavedChanges(
        true
      );

      setMessageType(
        'success'
      );

      setMessage(
        `✓ ${cleanValue}% applied to all weeks for the selected resource row.`
      );
    };

  /* =======================================================
     SAVE PLAN
  ======================================================= */

  const handleSavePlan =
    async () => {
      if (
        viewingInactiveVersion
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Inactive Project Versions are read-only.'
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
          '✕ No active Project Version exists.'
        );

        return;
      }

      if (
        !selectedProjectCode ||
        !selectedPhaseId
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Select a Project and Project Phase.'
        );

        return;
      }

      if (
        displayedVersionId !==
        activeVersionId
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Only the active Project Version can be edited.'
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
          '✕ Project Role, Planned Resource and Work Location are required for every row.'
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

                    periodstartdate:
                      toDateInputValue(
                        week.startDate
                      ),

                    periodenddate:
                      toDateInputValue(
                        week.endDate
                      ),

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

      setSaving(
        true
      );

      setMessage('');
      setMessageType('');

      try {
        await saveProjectPlan({
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

          rows
        });

        setHasUnsavedChanges(
          false
        );

        await loadProjectVersions(
          selectedProjectCode
        );

        /* -------------------------------------------------
           RELOAD COMPLETE PLAN AFTER SAVE

           This is important because the backend may have
           preserved older exact periods. Reloading makes
           those periods immediately available to the
           historical-row UI.
        ------------------------------------------------- */

        await loadActivePlan(
          selectedProjectCode,
          selectedPhaseId
        );

        setMessageType(
          'success'
        );

        setMessage(
          `✓ Project Version ${activeVersionId}, Phase ${selectedPhaseId} saved successfully.`
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

  /* =======================================================
     RETURN CONTROLLER API
  ======================================================= */

  return {
    /* Master data */
    projects,
    projectPhases,
    projectRoles,
    resources,

    /* Loading */
    masterDataLoading,
    planLoading,
    saving,
    creatingVersion,
    activatingVersionId,
    versionHistoryLoading,

    /* Selection */
    selectedProjectCode,
    selectedPhaseId,
    activeVersionId,
    displayedVersionId,
    displayedVersionNote,
    viewingInactiveVersion,
    projectVersions,

    /* Planning */
    startDate,
    endDate,
    generatedWeeks,
    resourceRows,

    /* Historical planning */
    savedPlanRows,
    displayWeeks,
    historicalResourceRows,

    /* Messages */
    message,
    messageType,
    hasUnsavedChanges,

    /* Modal */
    showCreateVersionModal,
    newVersionNote,
    createVersionError,

    /* Derived */
    hasActiveVersion,
    noActiveVersion,
    uniqueProjects,
    selectedProject,
    selectedPhase,
    activeVersion,

    /* Project / version / phase actions */
    handleProjectChange,
    handlePhaseChange,
    handleVersionChange,
    handleVersionHistoryClick,
    handleActivateVersion,
    handleBackToActiveVersion,

    /* Version creation */
    handleOpenCreateVersionModal,
    handleCloseCreateVersionModal,
    handleVersionNoteChange,
    handleCreateNewVersion,

    /* Planning period */
    handleStartDateChange,
    handleEndDateChange,
    handleGenerateWeeklyPlan,

    /* Resource plan */
    handleAddResourceRow,
    handleRemoveResourceRow,
    handleResourceFieldChange,
    handleWeekValueChange,
    handleApplyWeekValueToAll,
    handleSavePlan,

    /* Loaders */
    loadProjectVersions,
    loadProjectPhaseAssignments,
    loadActivePlan,
    loadSpecificVersionPlan
  };
}

export default useProjectPlan;