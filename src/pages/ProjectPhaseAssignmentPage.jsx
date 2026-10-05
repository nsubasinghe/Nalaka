import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  authenticatedFetch
} from '../api/authenticatedFetch.js';

/* =========================================================
   PROJECT PHASE ASSIGNMENT
========================================================= */

function ProjectPhaseAssignmentPage() {
  /* =========================================================
     MASTER DATA
  ========================================================= */

  const [
    projects,
    setProjects
  ] = useState([]);

  const [
    phaseMaster,
    setPhaseMaster
  ] = useState([]);

  const [
    assignedPhases,
    setAssignedPhases
  ] = useState([]);

  /* =========================================================
     SELECTION STATE
  ========================================================= */

  const [
    selectedProjectCode,
    setSelectedProjectCode
  ] = useState('');

  const [
    selectedAvailablePhaseId,
    setSelectedAvailablePhaseId
  ] = useState('');

  const [
    selectedAssignedPhaseId,
    setSelectedAssignedPhaseId
  ] = useState('');

  /* =========================================================
     LOADING STATE
  ========================================================= */

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    assignmentLoading,
    setAssignmentLoading
  ] = useState(false);

  const [
    processing,
    setProcessing
  ] = useState(false);

  /* =========================================================
     ALERT
  ========================================================= */

  const [
    alert,
    setAlert
  ] = useState({
    open: false,
    type: 'success',
    title: '',
    message: ''
  });

  /* =========================================================
     CONFIRMATION
  ========================================================= */

  const [
    confirmation,
    setConfirmation
  ] = useState({
    open: false,
    type: ''
  });

  /* =========================================================
     ALERT HELPERS
  ========================================================= */

  const showAlert = (
    type,
    title,
    message
  ) => {
    setAlert({
      open: true,
      type,
      title,
      message
    });
  };

  const closeAlert = () => {
    setAlert({
      open: false,
      type: 'success',
      title: '',
      message: ''
    });
  };

  /* =========================================================
     UNIQUE PROJECTS

     Prefer active Project Version when available.
  ========================================================= */

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

          if (!existing) {
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
      ).sort(
        (a, b) =>
          String(
            a.projectcode
          ).localeCompare(
            String(
              b.projectcode
            )
          )
      );
    }, [
      projects
    ]);

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
     ASSIGNED PHASE ID SET
  ========================================================= */

  const assignedPhaseIds =
    useMemo(() => {
      return new Set(
        assignedPhases.map(
          (phase) =>
            String(
              phase.phaseid
            )
        )
      );
    }, [
      assignedPhases
    ]);

  /* =========================================================
     AVAILABLE PHASES
  ========================================================= */

  const availablePhases =
    useMemo(() => {
      return phaseMaster.filter(
        (phase) =>
          !assignedPhaseIds.has(
            String(
              phase.phaseid
            )
          )
      );
    }, [
      phaseMaster,
      assignedPhaseIds
    ]);

  /* =========================================================
     SELECTED AVAILABLE PHASE
  ========================================================= */

  const selectedAvailablePhase =
    useMemo(() => {
      return availablePhases.find(
        (phase) =>
          String(
            phase.phaseid
          ) ===
          String(
            selectedAvailablePhaseId
          )
      );
    }, [
      availablePhases,
      selectedAvailablePhaseId
    ]);

  /* =========================================================
     SELECTED ASSIGNED PHASE
  ========================================================= */

  const selectedAssignedPhase =
    useMemo(() => {
      return assignedPhases.find(
        (phase) =>
          String(
            phase.phaseid
          ) ===
          String(
            selectedAssignedPhaseId
          )
      );
    }, [
      assignedPhases,
      selectedAssignedPhaseId
    ]);

  /* =========================================================
     LOAD PROJECTS
  ========================================================= */

  const loadProjects =
    async () => {
      const response =
        await fetch(
          '/api/projects'
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to load projects.'
        );
      }

      setProjects(
        result.projects || []
      );
    };

  /* =========================================================
     LOAD PHASE MASTER
  ========================================================= */

  const loadPhaseMaster =
    async () => {
      const response =
        await fetch(
          '/api/project-phases'
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            'Failed to load Project Phases.'
        );
      }

      setPhaseMaster(
        (
          result.projectPhases ||
          []
        ).map(
          (phase) => ({
            phaseid:
              phase.phaseid,

            description:
              phase.description ||
              ''
          })
        )
      );
    };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    const loadInitialData =
      async () => {
        setLoading(true);

        try {
          await Promise.all([
            loadProjects(),
            loadPhaseMaster()
          ]);

        } catch (error) {
          showAlert(
            'error',
            'Unable to Load Assignment Data',
            error.message ||
              'Failed to load Project Phase Assignment data.'
          );

        } finally {
          setLoading(false);
        }
      };

    loadInitialData();
  }, []);

  /* =========================================================
     LOAD PROJECT ASSIGNMENTS
  ========================================================= */

  const loadProjectAssignments =
    async (
      projectCode
    ) => {
      if (!projectCode) {
        setAssignedPhases([]);
        return [];
      }

      setAssignmentLoading(
        true
      );

      try {
        const response =
          await fetch(
            `/api/project-phase-assignments/${encodeURIComponent(
              projectCode
            )}`
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Failed to load Project Phase Assignments.'
          );
        }

        const loaded =
          (
            result.phases ||
            []
          ).map(
            (phase) => ({
              projectcode:
                phase.projectcode,

              phaseid:
                phase.phaseid,

              description:
                phase.description ||
                '',

              sequenceno:
                Number(
                  phase.sequenceno ||
                  0
                )
            })
          );

        setAssignedPhases(
          loaded
        );

        return loaded;

      } catch (error) {
        setAssignedPhases([]);

        showAlert(
          'error',
          'Unable to Load Assignments',
          error.message ||
            'Failed to load Project Phase Assignments.'
        );

        return [];

      } finally {
        setAssignmentLoading(
          false
        );
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

      setSelectedAvailablePhaseId(
        ''
      );

      setSelectedAssignedPhaseId(
        ''
      );

      setAssignedPhases([]);

      if (!projectCode) {
        return;
      }

      await loadProjectAssignments(
        projectCode
      );
    };

  /* =========================================================
     ASSIGN PHASE
  ========================================================= */

  const handleAssignPhase =
    async () => {
      if (!selectedProjectCode) {
        showAlert(
          'error',
          'Project Required',
          'Please select a Project Code first.'
        );

        return;
      }

      if (
        !selectedAvailablePhaseId
      ) {
        showAlert(
          'error',
          'Phase Required',
          'Please select an available Project Phase.'
        );

        return;
      }

      setProcessing(true);

      try {
        const response =
          await authenticatedFetch(
            `/api/project-phase-assignments/${encodeURIComponent(
              selectedProjectCode
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
                  phaseids: [
                    selectedAvailablePhaseId
                  ]
                })
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Failed to assign Project Phase.'
          );
        }

        const assignedPhaseId =
          selectedAvailablePhaseId;

        const assignedDescription =
          selectedAvailablePhase
            ?.description ||
          assignedPhaseId;

        setSelectedAvailablePhaseId(
          ''
        );

        await loadProjectAssignments(
          selectedProjectCode
        );

        showAlert(
          'success',
          'Project Phase Assigned',
          `${assignedDescription} (${assignedPhaseId}) was assigned to Project ${selectedProjectCode} successfully.`
        );

      } catch (error) {
        showAlert(
          'error',
          'Assignment Failed',
          error.message ||
            'Failed to assign Project Phase.'
        );

      } finally {
        setProcessing(false);
      }
    };

  /* =========================================================
     REQUEST REMOVE
  ========================================================= */

  const requestRemovePhase =
    () => {
      if (
        !selectedProjectCode ||
        !selectedAssignedPhaseId
      ) {
        showAlert(
          'error',
          'Assigned Phase Required',
          'Please select an assigned Project Phase to remove.'
        );

        return;
      }

      setConfirmation({
        open: true,
        type: 'remove'
      });
    };

  /* =========================================================
     REMOVE ASSIGNMENT
  ========================================================= */

  const removeAssignedPhase =
    async () => {
      const phaseId =
        selectedAssignedPhaseId;

      const description =
        selectedAssignedPhase
          ?.description ||
        phaseId;

      setConfirmation({
        open: false,
        type: ''
      });

      setProcessing(true);

      try {
        const response =
          await authenticatedFetch(
            `/api/project-phase-assignments/${encodeURIComponent(
              selectedProjectCode
            )}/${encodeURIComponent(
              phaseId
            )}`,
            {
              method:
                'DELETE'
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Failed to remove Project Phase Assignment.'
          );
        }

        setSelectedAssignedPhaseId(
          ''
        );

        await loadProjectAssignments(
          selectedProjectCode
        );

        showAlert(
          'success',
          'Project Phase Removed',
          `${description} (${phaseId}) was removed from Project ${selectedProjectCode}.`
        );

      } catch (error) {
        showAlert(
          'error',
          'Removal Failed',
          error.message ||
            'Failed to remove Project Phase Assignment.'
        );

      } finally {
        setProcessing(false);
      }
    };

  /* =========================================================
     ESCAPE
  ========================================================= */

  useEffect(() => {
    if (
      !alert.open &&
      !confirmation.open
    ) {
      return;
    }

    const handleKeyDown =
      (event) => {
        if (
          event.key !==
          'Escape'
        ) {
          return;
        }

        if (alert.open) {
          closeAlert();
          return;
        }

        setConfirmation({
          open: false,
          type: ''
        });
      };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    alert.open,
    confirmation.open
  ]);

  /* =========================================================
     ALERT STYLE
  ========================================================= */

  const alertStyle =
    alert.type ===
      'success'
      ? {
          icon: '✓',
          background:
            '#DCFCE7',
          color:
            '#166534'
        }
      : alert.type ===
          'error'
        ? {
            icon: '✕',
            background:
              '#FEE2E2',
            color:
              '#B91C1C'
          }
        : {
            icon: 'ℹ',
            background:
              '#DBEAFE',
            color:
              '#1D4ED8'
          };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="page-wrap">
      <div className="card phase-card">

        {/* PAGE HEADING */}

        <div className="page-heading">
          <div>
            <h1>
              🔗 Project Phase Assignment
            </h1>

            <p className="page-description">
              Assign Phase Master entries to a project,
              or remove an existing Project Phase Assignment.
            </p>
          </div>
        </div>

        {/* PROJECT SELECTION */}

        <div
          className="phase-section"
        >
          <div
            className="form-grid"
          >
            <label>
              Project Code *

              <select
                value={
                  selectedProjectCode
                }
                onChange={
                  handleProjectChange
                }
                disabled={
                  loading ||
                  assignmentLoading ||
                  processing
                }
              >
                <option value="">
                  {loading
                    ? 'Loading Projects...'
                    : 'Select Project Code'}
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
                      {project.projectcode}
                      {' - '}
                      {project.projectname}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Active Version

              <input
                value={
                  selectedProject
                    ?.versionid
                    ? `V${selectedProject.versionid}`
                    : ''
                }
                readOnly
                placeholder="Auto"
              />
            </label>
          </div>
        </div>

        {/* PROJECT INFORMATION */}

        {selectedProject && (
          <div
            className="project-summary"
            style={{
              marginTop:
                '20px'
            }}
          >
            <div
              className="summary-item"
            >
              <span>
                Project Name
              </span>

              <strong>
                {selectedProject.projectname ||
                  '-'}
              </strong>
            </div>

            <div
              className="summary-item"
            >
              <span>
                Business Partner
              </span>

              <strong>
                {selectedProject.partnerdescription ||
                  selectedProject.partnerid ||
                  '-'}
              </strong>
            </div>

            <div
              className="summary-item"
            >
              <span>
                Project Type
              </span>

              <strong>
                {selectedProject.projecttypedescription ||
                  selectedProject.projecttype ||
                  '-'}
              </strong>
            </div>

            <div
              className="summary-item"
            >
              <span>
                Assigned Phases
              </span>

              <strong>
                {assignedPhases.length}
              </strong>
            </div>
          </div>
        )}

        {/* ASSIGN PHASE */}

        <div
          className="phase-section"
          style={{
            marginTop:
              '24px'
          }}
        >
          <div
            className="section-heading-row"
          >
            <div>
              <h2>
                Assign Project Phase
              </h2>

              <p>
                Select one Phase Master entry
                that is not already assigned to
                the selected project.
              </p>
            </div>
          </div>

          <div
            className="form-grid"
          >
            <label>
              Available Phase

              <select
                value={
                  selectedAvailablePhaseId
                }
                onChange={
                  (event) =>
                    setSelectedAvailablePhaseId(
                      event.target.value
                    )
                }
                disabled={
                  !selectedProjectCode ||
                  assignmentLoading ||
                  processing
                }
              >
                <option value="">
                  {assignmentLoading
                    ? 'Loading Phases...'
                    : availablePhases.length === 0 &&
                        selectedProjectCode
                      ? 'No Available Phases'
                      : 'Select Available Phase'}
                </option>

                {availablePhases.map(
                  (phase) => (
                    <option
                      key={
                        phase.phaseid
                      }
                      value={
                        phase.phaseid
                      }
                    >
                      {phase.phaseid}
                      {' - '}
                      {phase.description}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <div
            style={{
              display:
                'flex',
              gap:
                '12px',
              flexWrap:
                'wrap',
              marginTop:
                '16px'
            }}
          >
            <button
              type="button"
              onClick={
                handleAssignPhase
              }
              disabled={
                processing ||
                assignmentLoading ||
                !selectedProjectCode ||
                !selectedAvailablePhaseId
              }
            >
              {processing
                ? '⏳ Processing...'
                : '➕ Assign Phase'}
            </button>
          </div>
        </div>

        {/* REMOVE ASSIGNMENT */}

        <div
          className="phase-section"
          style={{
            marginTop:
              '24px'
          }}
        >
          <div
            className="section-heading-row"
          >
            <div>
              <h2>
                Existing Project Phase Assignment
              </h2>

              <p>
                Select an assigned phase to remove
                it from the selected project.
              </p>
            </div>
          </div>

          <div
            className="form-grid"
          >
            <label>
              Assigned Phase

              <select
                value={
                  selectedAssignedPhaseId
                }
                onChange={
                  (event) =>
                    setSelectedAssignedPhaseId(
                      event.target.value
                    )
                }
                disabled={
                  !selectedProjectCode ||
                  assignmentLoading ||
                  processing
                }
              >
                <option value="">
                  {assignmentLoading
                    ? 'Loading Assigned Phases...'
                    : assignedPhases.length === 0 &&
                        selectedProjectCode
                      ? 'No Assigned Phases'
                      : 'Select Assigned Phase'}
                </option>

                {assignedPhases.map(
                  (phase) => (
                    <option
                      key={
                        phase.phaseid
                      }
                      value={
                        phase.phaseid
                      }
                    >
                      {phase.phaseid}
                      {' - '}
                      {phase.description}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Sequence

              <input
                value={
                  selectedAssignedPhase
                    ?.sequenceno ||
                  ''
                }
                readOnly
                placeholder="Auto"
              />
            </label>
          </div>

          <div
            style={{
              display:
                'flex',
              gap:
                '12px',
              flexWrap:
                'wrap',
              marginTop:
                '16px'
            }}
          >
            <button
              type="button"
              className="delete-button"
              onClick={
                requestRemovePhase
              }
              disabled={
                processing ||
                assignmentLoading ||
                !selectedProjectCode ||
                !selectedAssignedPhaseId
              }
            >
              🗑 Remove Phase
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          REMOVE CONFIRMATION
      ===================================================== */}

      {confirmation.open && (
        <div
          role="presentation"
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setConfirmation({
                  open: false,
                  type: ''
                });
              }
            }
          }
          style={{
            position:
              'fixed',
            inset:
              0,
            zIndex:
              9999,
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding:
              '20px',
            backgroundColor:
              'rgba(15, 23, 42, 0.60)',
            backdropFilter:
              'blur(3px)'
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="card"
            style={{
              width:
                '100%',
              maxWidth:
                '440px',
              padding:
                '28px',
              borderRadius:
                '14px',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width:
                  '52px',
                height:
                  '52px',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                borderRadius:
                  '50%',
                backgroundColor:
                  '#FEF3C7',
                color:
                  '#B45309',
                fontSize:
                  '26px',
                marginBottom:
                  '18px'
              }}
            >
              ⚠
            </div>

            <h2
              style={{
                fontSize:
                  '21px',
                margin:
                  '0 0 12px'
              }}
            >
              Remove Project Phase?
            </h2>

            <p
              style={{
                fontSize:
                  '14px',
                lineHeight:
                  1.7,
                opacity:
                  0.8,
                marginBottom:
                  '24px'
              }}
            >
              {selectedAssignedPhase
                ? `${selectedAssignedPhase.description} (${selectedAssignedPhase.phaseid}) will be removed from Project ${selectedProjectCode}. If planning data already exists for this phase, the system may prevent removal.`
                : 'The selected phase will be removed from this project.'}
            </p>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end',
                gap:
                  '12px',
                flexWrap:
                  'wrap'
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setConfirmation({
                    open: false,
                    type: ''
                  })
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={
                  removeAssignedPhase
                }
              >
                Remove Phase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SYSTEM ALERT
      ===================================================== */}

      {alert.open && (
        <div
          role="presentation"
          onMouseDown={
            (event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeAlert();
              }
            }
          }
          style={{
            position:
              'fixed',
            inset:
              0,
            zIndex:
              10000,
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            padding:
              '20px',
            backgroundColor:
              'rgba(15, 23, 42, 0.60)',
            backdropFilter:
              'blur(3px)'
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="card"
            style={{
              width:
                '100%',
              maxWidth:
                '440px',
              padding:
                '28px',
              borderRadius:
                '14px',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width:
                  '52px',
                height:
                  '52px',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                borderRadius:
                  '50%',
                backgroundColor:
                  alertStyle.background,
                color:
                  alertStyle.color,
                fontSize:
                  '26px',
                fontWeight:
                  700,
                marginBottom:
                  '18px'
              }}
            >
              {alertStyle.icon}
            </div>

            <h2
              style={{
                fontSize:
                  '21px',
                margin:
                  '0 0 12px'
              }}
            >
              {alert.title}
            </h2>

            <p
              style={{
                fontSize:
                  '14px',
                lineHeight:
                  1.7,
                opacity:
                  0.8,
                marginBottom:
                  '24px'
              }}
            >
              {alert.message}
            </p>

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'flex-end'
              }}
            >
              <button
                type="button"
                onClick={
                  closeAlert
                }
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectPhaseAssignmentPage;