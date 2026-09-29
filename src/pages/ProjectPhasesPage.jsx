import {
  useEffect,
  useMemo,
  useState
} from 'react';

function ProjectPhasesPage() {
  const [
    projects,
    setProjects
  ] = useState([]);

  const [
    projectPhases,
    setProjectPhases
  ] = useState([]);

  const [
    selectedProjectCode,
    setSelectedProjectCode
  ] = useState('');

  const [
    phases,
    setPhases
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    phaseLoading,
    setPhaseLoading
  ] = useState(false);

  const [
    saving,
    setSaving
  ] = useState(false);

  const [
    message,
    setMessage
  ] = useState('');

  const [
    messageType,
    setMessageType
  ] = useState('');

  /* =========================================================
     LOAD MASTER DATA
  ========================================================= */

  useEffect(() => {
    const loadMasterData =
      async () => {
        setLoading(true);

        try {
          const [
            projectsResponse,
            phasesResponse
          ] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/project-phases')
          ]);

          const [
            projectsResult,
            phasesResult
          ] = await Promise.all([
            projectsResponse.json(),
            phasesResponse.json()
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

          setProjects(
            projectsResult.projects ||
              []
          );

          setProjectPhases(
            phasesResult.projectPhases ||
              []
          );

          setPhases(
            (
              phasesResult.projectPhases ||
              []
            ).map(
              (
                phase,
                index
              ) => ({
                id:
                  phase.phaseid,

                number:
                  index + 1,

                name:
                  phase.description,

                startDate:
                  '',

                endDate:
                  '',

                activeVersionId:
                  ''
              })
            )
          );
        } catch (error) {
          setMessageType(
            'error'
          );

          setMessage(
            `✕ ${
              error.message ||
              'Failed to load Project Phase Planning data.'
            }`
          );
        } finally {
          setLoading(false);
        }
      };

    loadMasterData();
  }, []);

  /* =========================================================
     UNIQUE PROJECTS
  ========================================================= */

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
    }, [projects]);

  /* =========================================================
     SELECTED PROJECT
  ========================================================= */

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

  /* =========================================================
     RESET PHASE DATES
  ========================================================= */

  const resetPhaseDates =
    () => {
      setPhases(
        projectPhases.map(
          (
            phase,
            index
          ) => ({
            id:
              phase.phaseid,

            number:
              index + 1,

            name:
              phase.description,

            startDate:
              '',

            endDate:
              '',

            activeVersionId:
              ''
          })
        )
      );
    };

  /* =========================================================
     LOAD EXISTING ACTIVE PHASE DATES
  ========================================================= */

  const loadProjectPhaseDates =
    async (
      projectCode
    ) => {
      if (!projectCode) {
        resetPhaseDates();
        return;
      }

      setPhaseLoading(true);

      setMessage('');
      setMessageType('');

      try {
        const loadedPhases =
          await Promise.all(
            projectPhases.map(
              async (
                phase,
                index
              ) => {
                try {
                  const response =
                    await fetch(
                      `/api/phase-dates/${encodeURIComponent(
                        projectCode
                      )}/${encodeURIComponent(
                        phase.phaseid
                      )}`
                    );

                  if (
                    response.status ===
                    404
                  ) {
                    return {
                      id:
                        phase.phaseid,

                      number:
                        index + 1,

                      name:
                        phase.description,

                      startDate:
                        '',

                      endDate:
                        '',

                      activeVersionId:
                        ''
                    };
                  }

                  const result =
                    await response.json();

                  if (
                    !response.ok
                  ) {
                    throw new Error(
                      result.error ||
                        `Failed to load Phase ${phase.phaseid}.`
                    );
                  }

                  return {
                    id:
                      phase.phaseid,

                    number:
                      index + 1,

                    name:
                      phase.description,

                    startDate:
                      result.phaseDates
                        ?.startdate ||
                      '',

                    endDate:
                      result.phaseDates
                        ?.enddate ||
                      '',

                    activeVersionId:
                      result.phaseDates
                        ?.versionid ||
                      ''
                  };
                } catch (
                  error
                ) {
                  throw error;
                }
              }
            )
          );

        setPhases(
          loadedPhases
        );

        const plannedCount =
          loadedPhases.filter(
            (phase) =>
              phase.startDate ||
              phase.endDate
          ).length;

        if (
          plannedCount > 0
        ) {
          setMessageType(
            'success'
          );

          setMessage(
            `✓ Loaded ${plannedCount} existing phase plan${
              plannedCount === 1
                ? ''
                : 's'
            }.`
          );
        }
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to load phase dates.'
          }`
        );
      } finally {
        setPhaseLoading(false);
      }
    };

  /* =========================================================
     PROJECT CHANGE
  ========================================================= */

  const handleProjectChange =
    async (event) => {
      const projectCode =
        event.target.value;

      setSelectedProjectCode(
        projectCode
      );

      setMessage('');
      setMessageType('');

      resetPhaseDates();

      if (
        projectCode
      ) {
        await loadProjectPhaseDates(
          projectCode
        );
      }
    };

  /* =========================================================
     PHASE DATE CHANGE
  ========================================================= */

  const handlePhaseDateChange =
    (
      id,
      field,
      value
    ) => {
      setPhases(
        (
          currentPhases
        ) =>
          currentPhases.map(
            (phase) =>
              String(
                phase.id
              ) ===
              String(
                id
              )
                ? {
                    ...phase,
                    [field]:
                      value
                  }
                : phase
          )
      );

      setMessage('');
      setMessageType('');
    };

  /* =========================================================
     CLEAR DATES
  ========================================================= */

  const handleClearDates =
    () => {
      setPhases(
        (
          currentPhases
        ) =>
          currentPhases.map(
            (phase) => ({
              ...phase,
              startDate:
                '',
              endDate:
                ''
            })
          )
      );

      setMessage('');
      setMessageType('');
    };

  /* =========================================================
     SAVE PHASE PLAN
  ========================================================= */

  const handleSave =
    async (event) => {
      event.preventDefault();

      setMessage('');
      setMessageType('');

      if (
        !selectedProjectCode
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Please select a project first.'
        );

        return;
      }

      const invalidPhase =
        phases.find(
          (phase) =>
            phase.startDate &&
            phase.endDate &&
            phase.endDate <
              phase.startDate
        );

      if (
        invalidPhase
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ End Date cannot be before Start Date for ${invalidPhase.name}.`
        );

        return;
      }

      const plannedPhases =
        phases.filter(
          (phase) =>
            phase.startDate ||
            phase.endDate
        );

      if (
        plannedPhases.length ===
        0
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          '✕ Please enter dates for at least one project phase.'
        );

        return;
      }

      const incompletePhase =
        phases.find(
          (phase) =>
            (
              phase.startDate &&
              !phase.endDate
            ) ||
            (
              !phase.startDate &&
              phase.endDate
            )
        );

      if (
        incompletePhase
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ Please enter both Start Date and End Date for ${incompletePhase.name}.`
        );

        return;
      }

      /*
       * Important:
       *
       * At the moment the shared PUT API updates
       * an EXISTING ACTIVE phase version.
       *
       * Therefore a phase without an active version
       * cannot yet be created from this page.
       */

      const phaseWithoutActiveVersion =
        plannedPhases.find(
          (phase) =>
            !phase.activeVersionId
        );

      if (
        phaseWithoutActiveVersion
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${phaseWithoutActiveVersion.name} does not currently have an active VersionID. Create the phase version first before saving dates.`
        );

        return;
      }

      try {
        setSaving(true);

        for (
          const phase of
          plannedPhases
        ) {
          const response =
            await fetch(
              `/api/phase-dates/${encodeURIComponent(
                selectedProjectCode
              )}/${encodeURIComponent(
                phase.id
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
                      phase.startDate,

                    enddate:
                      phase.endDate
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
                `Failed to save ${phase.name}.`
            );
          }
        }

        /*
         * Reload from the database after saving.
         * This makes the screen reflect the same
         * data that Project Plan will read.
         */

        await loadProjectPhaseDates(
          selectedProjectCode
        );

        setMessageType(
          'success'
        );

        setMessage(
          `✓ ${plannedPhases.length} project phase plan${
            plannedPhases.length ===
            1
              ? ''
              : 's'
          } saved successfully.`
        );
      } catch (error) {
        setMessageType(
          'error'
        );

        setMessage(
          `✕ ${
            error.message ||
            'Failed to save Project Phase Plan.'
          }`
        );
      } finally {
        setSaving(false);
      }
    };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="page-wrap">
      <div className="card phase-card">

        <div className="page-heading">
          <div>
            <h1>
              🗂️ Project Phase Planning
            </h1>

            <p className="page-description">
              Select a project and define the
              start and end dates for the phases
              included in that project.
            </p>
          </div>
        </div>

        <form
          onSubmit={
            handleSave
          }
        >

          {/* =============================================
              PROJECT SELECTOR
          ============================================== */}

          <div className="phase-project-selector">

            <label>
              Select Project *

              <select
                value={
                  selectedProjectCode
                }
                onChange={
                  handleProjectChange
                }
                required
                disabled={
                  loading ||
                  phaseLoading ||
                  saving
                }
              >

                <option value="">
                  {loading
                    ? 'Loading projects...'
                    : 'Select a project'}
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

          </div>

          {/* =============================================
              PROJECT SUMMARY
          ============================================== */}

          {selectedProject && (
            <div className="project-summary">

              <div className="summary-item">
                <span>
                  Project Code
                </span>

                <strong>
                  {
                    selectedProject.projectcode
                  }
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Project Name
                </span>

                <strong>
                  {
                    selectedProject.projectname
                  }
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

            </div>
          )}

          {/* =============================================
              PHASE PLAN
          ============================================== */}

          <div className="phase-section">

            <div className="section-heading-row">

              <div>
                <h2>
                  Phase Plan
                </h2>

                <p>
                  Dates are shared with the
                  Project Plan page. Updating
                  an active phase here updates
                  the same dates used throughout
                  the application.
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleClearDates
                }
                disabled={
                  !selectedProjectCode ||
                  phaseLoading ||
                  saving
                }
              >
                Clear Dates
              </button>

            </div>

            {phaseLoading ? (
              <p>
                ⏳ Loading phase dates...
              </p>
            ) : (
              <div className="table-wrap phase-table-wrap">

                <table className="phase-table">

                  <thead>
                    <tr>
                      <th>
                        No.
                      </th>

                      <th>
                        Phase ID
                      </th>

                      <th>
                        Project Phase
                      </th>

                      <th>
                        Active Version
                      </th>

                      <th>
                        Start Date
                      </th>

                      <th>
                        End Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {phases.map(
                      (phase) => (
                        <tr
                          key={
                            phase.id
                          }
                        >

                          <td className="phase-number">
                            {
                              phase.number
                            }
                          </td>

                          <td>
                            {
                              phase.id
                            }
                          </td>

                          <td className="phase-name">
                            {
                              phase.name
                            }
                          </td>

                          <td>
                            {phase.activeVersionId
                              ? `V${phase.activeVersionId}`
                              : '-'}
                          </td>

                          <td>
                            <input
                              type="date"
                              value={
                                phase.startDate
                              }
                              disabled={
                                !selectedProjectCode ||
                                saving
                              }
                              onChange={(
                                event
                              ) =>
                                handlePhaseDateChange(
                                  phase.id,
                                  'startDate',
                                  event.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <input
                              type="date"
                              value={
                                phase.endDate
                              }
                              min={
                                phase.startDate ||
                                undefined
                              }
                              disabled={
                                !selectedProjectCode ||
                                saving
                              }
                              onChange={(
                                event
                              ) =>
                                handlePhaseDateChange(
                                  phase.id,
                                  'endDate',
                                  event.target.value
                                )
                              }
                            />
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

          {/* =============================================
              SAVE
          ============================================== */}

          <div className="phase-form-actions">

            <button
              type="submit"
              disabled={
                !selectedProjectCode ||
                phaseLoading ||
                saving
              }
            >
              {saving
                ? '⏳ Saving...'
                : '💾 Save Phase Plan'}
            </button>

          </div>

        </form>

        {/* =============================================
            MESSAGE
        ============================================== */}

        {message && (
          <p
            className={`message message-${messageType}`}
          >
            {message}
          </p>
        )}

      </div>
    </div>
  );
}

export default ProjectPhasesPage;