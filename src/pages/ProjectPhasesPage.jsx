import { useEffect, useMemo, useState } from 'react';
import { authenticatedFetch } from '../api/authenticatedFetch.js';

function ProjectPhasesPage() {
  /* =========================================================
     MASTER DATA
  ========================================================= */

  const [projects, setProjects] = useState([]);
  const [projectPhaseMaster, setProjectPhaseMaster] = useState([]);

  /* =========================================================
     MASTER PHASE FORM
  ========================================================= */

  const [newPhaseId, setNewPhaseId] = useState('');
  const [newPhaseDescription, setNewPhaseDescription] = useState('');

  const [creatingMasterPhase, setCreatingMasterPhase] = useState(false);
  const [savingMasterPhaseId, setSavingMasterPhaseId] = useState('');
  const [deletingMasterPhaseId, setDeletingMasterPhaseId] = useState('');

  /* =========================================================
     PROJECT PHASE ASSIGNMENTS
  ========================================================= */

  const [selectedProjectCode, setSelectedProjectCode] = useState('');
  const [assignedPhases, setAssignedPhases] = useState([]);
  const [selectedPhaseIds, setSelectedPhaseIds] = useState([]);

  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [addingAssignment, setAddingAssignment] = useState(false);
  const [removingAssignmentPhaseId, setRemovingAssignmentPhaseId] =
    useState('');

  /* =========================================================
     PAGE STATE
  ========================================================= */

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  /* =========================================================
     LOAD PROJECTS
  ========================================================= */

  const loadProjects = async () => {
    const response = await fetch('/api/projects');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || 'Failed to load projects.'
      );
    }

    setProjects(result.projects || []);
  };

  /* =========================================================
     LOAD PHASE MASTER
  ========================================================= */

  const loadProjectPhaseMaster = async () => {
    const response = await fetch('/api/project-phases');
    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || 'Failed to load Project Phase Master.'
      );
    }

    setProjectPhaseMaster(
      (result.projectPhases || []).map((phase) => ({
        phaseid: phase.phaseid,
        description: phase.description || ''
      }))
    );
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      try {
        await Promise.all([
          loadProjects(),
          loadProjectPhaseMaster()
        ]);
      } catch (error) {
        setMessageType('error');

        setMessage(
          `✕ ${
            error.message ||
            'Failed to load Project Phase data.'
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  /* =========================================================
     UNIQUE PROJECTS
  ========================================================= */

  const uniqueProjects = useMemo(() => {
    const map = new Map();

    projects.forEach((project) => {
      const existing = map.get(project.projectcode);

      if (!existing) {
        map.set(project.projectcode, project);
        return;
      }

      if (project.versionstatus === 'A') {
        map.set(project.projectcode, project);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      String(a.projectcode).localeCompare(
        String(b.projectcode)
      )
    );
  }, [projects]);

  /* =========================================================
     SELECTED PROJECT
  ========================================================= */

  const selectedProject = useMemo(() => {
    return uniqueProjects.find(
      (project) =>
        String(project.projectcode) ===
        String(selectedProjectCode)
    );
  }, [uniqueProjects, selectedProjectCode]);

  /* =========================================================
     ASSIGNED PHASE IDS
  ========================================================= */

  const assignedPhaseIds = useMemo(() => {
    return new Set(
      assignedPhases.map((phase) =>
        String(phase.phaseid)
      )
    );
  }, [assignedPhases]);

  /* =========================================================
     AVAILABLE PHASES
  ========================================================= */

  const availablePhases = useMemo(() => {
    return projectPhaseMaster.filter(
      (phase) =>
        !assignedPhaseIds.has(
          String(phase.phaseid)
        )
    );
  }, [projectPhaseMaster, assignedPhaseIds]);

  /* =========================================================
     LOAD PROJECT PHASE ASSIGNMENTS
  ========================================================= */

  const loadProjectAssignments = async (projectCode) => {
    if (!projectCode) {
      setAssignedPhases([]);
      return;
    }

    setAssignmentLoading(true);

    try {
      const response = await fetch(
        `/api/project-phase-assignments/${encodeURIComponent(
          projectCode
        )}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          'Failed to load project phase assignments.'
        );
      }

      setAssignedPhases(
        (result.phases || []).map((phase) => ({
          projectcode: phase.projectcode,
          phaseid: phase.phaseid,
          description: phase.description || '',
          sequenceno: Number(phase.sequenceno || 0)
        }))
      );
    } catch (error) {
      setAssignedPhases([]);
      throw error;
    } finally {
      setAssignmentLoading(false);
    }
  };

  /* =========================================================
     REFRESH PHASE DATA
  ========================================================= */

  const refreshPhaseData = async () => {
    await loadProjectPhaseMaster();

    if (selectedProjectCode) {
      await loadProjectAssignments(selectedProjectCode);
    }
  };

  /* =========================================================
     PROJECT CHANGE
  ========================================================= */

  const handleProjectChange = async (event) => {
    const projectCode = event.target.value;

    setSelectedProjectCode(projectCode);
    setSelectedPhaseIds([]);
    setAssignedPhases([]);
    setMessage('');
    setMessageType('');

    if (!projectCode) {
      return;
    }

    try {
      await loadProjectAssignments(projectCode);
    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to load project phases.'
        }`
      );
    }
  };

  /* =========================================================
     MASTER DESCRIPTION CHANGE
  ========================================================= */

  const handleMasterDescriptionChange = (
    phaseId,
    value
  ) => {
    setProjectPhaseMaster((current) =>
      current.map((phase) =>
        String(phase.phaseid) === String(phaseId)
          ? {
              ...phase,
              description: value
            }
          : phase
      )
    );

    setMessage('');
    setMessageType('');
  };

  /* =========================================================
     CREATE MASTER PHASE
     CSRF PROTECTED POST
  ========================================================= */

  const handleCreateMasterPhase = async () => {
    const phaseId = newPhaseId
      .trim()
      .toUpperCase();

    const description = newPhaseDescription.trim();

    if (!phaseId || !description) {
      setMessageType('error');
      setMessage(
        '✕ Phase ID and Description are required.'
      );
      return;
    }

    if (phaseId.length > 2) {
      setMessageType('error');
      setMessage(
        '✕ Phase ID cannot exceed 2 characters.'
      );
      return;
    }

    setCreatingMasterPhase(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await authenticatedFetch(
        '/api/project-phases',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phaseid: phaseId,
            description
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          'Failed to create Project Phase.'
        );
      }

      setNewPhaseId('');
      setNewPhaseDescription('');

      await refreshPhaseData();

      setMessageType('success');
      setMessage(
        `✓ Phase ${phaseId} created successfully.`
      );
    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to create Project Phase.'
        }`
      );
    } finally {
      setCreatingMasterPhase(false);
    }
  };

  /* =========================================================
     UPDATE MASTER PHASE
     CSRF PROTECTED PUT
  ========================================================= */

  const handleUpdateMasterPhase = async (phase) => {
    const description = String(
      phase.description || ''
    ).trim();

    if (!description) {
      setMessageType('error');
      setMessage(
        `✕ Description is required for Phase ${phase.phaseid}.`
      );
      return;
    }

    setSavingMasterPhaseId(phase.phaseid);
    setMessage('');
    setMessageType('');

    try {
      const response = await authenticatedFetch(
        `/api/project-phases/${encodeURIComponent(
          phase.phaseid
        )}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            description
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          'Failed to update Project Phase.'
        );
      }

      await refreshPhaseData();

      setMessageType('success');
      setMessage(
        `✓ Phase ${phase.phaseid} updated successfully.`
      );
    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to update Project Phase.'
        }`
      );
    } finally {
      setSavingMasterPhaseId('');
    }
  };

  /* =========================================================
     DELETE MASTER PHASE
     CSRF PROTECTED DELETE
  ========================================================= */

  const handleDeleteMasterPhase = async (phase) => {
    const confirmed = window.confirm(
      `Delete Phase ${phase.phaseid} - ${phase.description} from the Phase Master?\n\nA phase cannot be deleted while it is assigned to a project or project version.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingMasterPhaseId(phase.phaseid);
    setMessage('');
    setMessageType('');

    try {
      const response = await authenticatedFetch(
        `/api/project-phases/${encodeURIComponent(
          phase.phaseid
        )}`,
        {
          method: 'DELETE'
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          'Failed to delete Project Phase.'
        );
      }

      await refreshPhaseData();

      setMessageType('success');
      setMessage(
        `✓ Phase ${phase.phaseid} deleted from the Phase Master.`
      );
    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to delete Project Phase.'
        }`
      );
    } finally {
      setDeletingMasterPhaseId('');
    }
  };

  /* =========================================================
     MULTI PHASE SELECTION
  ========================================================= */

  const handlePhaseSelectionChange = (
    phaseId,
    checked
  ) => {
    setSelectedPhaseIds((current) => {
      if (checked) {
        if (current.includes(phaseId)) {
          return current;
        }

        return [
          ...current,
          phaseId
        ];
      }

      return current.filter(
        (id) => id !== phaseId
      );
    });

    setMessage('');
    setMessageType('');
  };

  const handleSelectAllAvailablePhases = () => {
    setSelectedPhaseIds(
      availablePhases.map(
        (phase) => phase.phaseid
      )
    );

    setMessage('');
    setMessageType('');
  };

  const handleClearPhaseSelection = () => {
    setSelectedPhaseIds([]);
    setMessage('');
    setMessageType('');
  };

  /* =========================================================
     ASSIGN MULTIPLE PHASES TO PROJECT
     CSRF PROTECTED POST
  ========================================================= */

  const handleAssignSelectedPhases = async () => {
    if (!selectedProjectCode) {
      setMessageType('error');
      setMessage(
        '✕ Please select a project first.'
      );
      return;
    }

    if (selectedPhaseIds.length === 0) {
      setMessageType('error');
      setMessage(
        '✕ Select at least one phase to assign.'
      );
      return;
    }

    const phaseIdsToAssign = [
      ...selectedPhaseIds
    ];

    setAddingAssignment(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await authenticatedFetch(
        `/api/project-phase-assignments/${encodeURIComponent(
          selectedProjectCode
        )}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phaseids: phaseIdsToAssign
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          'Failed to assign phases to project.'
        );
      }

      setSelectedPhaseIds([]);

      await loadProjectAssignments(
        selectedProjectCode
      );

      setMessageType('success');
      setMessage(
        `✓ ${phaseIdsToAssign.length} phase(s) assigned to Project ${selectedProjectCode} successfully.`
      );
    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to assign phases to project.'
        }`
      );
    } finally {
      setAddingAssignment(false);
    }
  };

  /* =========================================================
     REMOVE PHASE FROM PROJECT
     CSRF PROTECTED DELETE
  ========================================================= */

  const handleRemoveAssignment = async (phase) => {
    const confirmed = window.confirm(
      `Remove ${phase.description} (${phase.phaseid}) from Project ${selectedProjectCode}?\n\nThis phase will be removed from the project's version memberships. If planning data already exists for this phase, the system will prevent the removal.`
    );

    if (!confirmed) {
      return;
    }

    setRemovingAssignmentPhaseId(
      phase.phaseid
    );

    setMessage('');
    setMessageType('');

    try {
      const response = await authenticatedFetch(
        `/api/project-phase-assignments/${encodeURIComponent(
          selectedProjectCode
        )}/${encodeURIComponent(
          phase.phaseid
        )}`,
        {
          method: 'DELETE'
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          'Failed to remove phase from project.'
        );
      }

      await loadProjectAssignments(
        selectedProjectCode
      );

      setMessageType('success');
      setMessage(
        `✓ ${phase.description} removed from Project ${selectedProjectCode}.`
      );
    } catch (error) {
      setMessageType('error');

      setMessage(
        `✕ ${
          error.message ||
          'Failed to remove phase from project.'
        }`
      );
    } finally {
      setRemovingAssignmentPhaseId('');
    }
  };

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="page-wrap">
      <div className="card phase-card">

        {/* =================================================
            PAGE HEADING
        ================================================= */}

        <div className="page-heading">
          <div>
            <h1>
              🗂️ Project Phases
            </h1>

            <p className="page-description">
              Manage the system Phase Master and
              select which phases belong to each
              project.
            </p>
          </div>
        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <p
            className={`message message-${messageType}`}
          >
            {message}
          </p>
        )}

        {/* =================================================
            PHASE MASTER
        ================================================= */}

        <div className="phase-section">
          <div className="section-heading-row">
            <div>
              <h2>
                Phase Master
              </h2>

              <p>
                These are the baseline phases
                available throughout the system.
                They are not tied to a particular
                project.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Phase ID *

              <input
                type="text"
                value={newPhaseId}
                maxLength="2"
                placeholder="e.g. 03"
                onChange={(event) =>
                  setNewPhaseId(
                    event.target.value.toUpperCase()
                  )
                }
                disabled={creatingMasterPhase}
              />
            </label>

            <label>
              Description *

              <input
                type="text"
                value={newPhaseDescription}
                placeholder="e.g. Development"
                onChange={(event) =>
                  setNewPhaseDescription(
                    event.target.value
                  )
                }
                disabled={creatingMasterPhase}
              />
            </label>
          </div>

          <div className="phase-form-actions">
            <button
              type="button"
              onClick={handleCreateMasterPhase}
              disabled={
                creatingMasterPhase ||
                !newPhaseId.trim() ||
                !newPhaseDescription.trim()
              }
            >
              {creatingMasterPhase
                ? '⏳ Adding Phase...'
                : '➕ Add Phase'}
            </button>
          </div>

          <div className="table-wrap phase-table-wrap">
            <table className="phase-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Phase ID</th>
                  <th>Description</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4">
                      ⏳ Loading Phase Master...
                    </td>
                  </tr>
                ) : projectPhaseMaster.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      No phases are defined in the
                      Phase Master.
                    </td>
                  </tr>
                ) : (
                  projectPhaseMaster.map(
                    (phase, index) => {
                      const isSaving =
                        String(savingMasterPhaseId) ===
                        String(phase.phaseid);

                      const isDeleting =
                        String(deletingMasterPhaseId) ===
                        String(phase.phaseid);

                      return (
                        <tr key={phase.phaseid}>
                          <td className="phase-number">
                            {index + 1}
                          </td>

                          <td>
                            <strong>
                              {phase.phaseid}
                            </strong>
                          </td>

                          <td>
                            <input
                              type="text"
                              value={phase.description}
                              onChange={(event) =>
                                handleMasterDescriptionChange(
                                  phase.phaseid,
                                  event.target.value
                                )
                              }
                              disabled={
                                isSaving ||
                                isDeleting
                              }
                            />
                          </td>

                          <td>
                            <div
                              style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateMasterPhase(
                                    phase
                                  )
                                }
                                disabled={
                                  isSaving ||
                                  isDeleting ||
                                  Boolean(
                                    savingMasterPhaseId &&
                                    savingMasterPhaseId !==
                                      phase.phaseid
                                  ) ||
                                  Boolean(
                                    deletingMasterPhaseId
                                  )
                                }
                              >
                                {isSaving
                                  ? '⏳ Saving...'
                                  : '💾 Save'}
                              </button>

                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  handleDeleteMasterPhase(
                                    phase
                                  )
                                }
                                disabled={
                                  isSaving ||
                                  isDeleting ||
                                  Boolean(
                                    savingMasterPhaseId
                                  ) ||
                                  Boolean(
                                    deletingMasterPhaseId &&
                                    deletingMasterPhaseId !==
                                      phase.phaseid
                                  )
                                }
                              >
                                {isDeleting
                                  ? '⏳ Deleting...'
                                  : 'Delete'}
                              </button>
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
        </div>

        {/* =================================================
            PROJECT PHASE ASSIGNMENT
        ================================================= */}

        <div className="phase-section">
          <div className="section-heading-row">
            <div>
              <h2>
                Project Phase Assignment
              </h2>

              <p>
                Select one or more phases that belong
                to the project. Assigned phases are
                synchronized across all versions of
                that project.
              </p>
            </div>
          </div>

          <div className="phase-project-selector">
            <label>
              Select Project *

              <select
                value={selectedProjectCode}
                onChange={handleProjectChange}
                disabled={
                  loading ||
                  assignmentLoading ||
                  addingAssignment ||
                  Boolean(removingAssignmentPhaseId)
                }
              >
                <option value="">
                  {loading
                    ? 'Loading projects...'
                    : 'Select a project'}
                </option>

                {uniqueProjects.map((project) => (
                  <option
                    key={project.projectcode}
                    value={project.projectcode}
                  >
                    {project.projectcode}
                    {' - '}
                    {project.projectname}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedProject && (
            <div className="project-summary">
              <div className="summary-item">
                <span>Project Code</span>
                <strong>
                  {selectedProject.projectcode}
                </strong>
              </div>

              <div className="summary-item">
                <span>Project Name</span>
                <strong>
                  {selectedProject.projectname}
                </strong>
              </div>

              <div className="summary-item">
                <span>Active Version</span>
                <strong>
                  {selectedProject.versionid
                    ? `V${selectedProject.versionid}`
                    : '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>Assigned Phases</span>
                <strong>
                  {assignedPhases.length}
                </strong>
              </div>

              <div className="summary-item">
                <span>Business Partner</span>
                <strong>
                  {selectedProject.partnerdescription ||
                    selectedProject.partnerid ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>Project Type</span>
                <strong>
                  {selectedProject.projecttypedescription ||
                    selectedProject.projecttype ||
                    '-'}
                </strong>
              </div>
            </div>
          )}

          {/* =================================================
              MULTI SELECT AVAILABLE PHASES
          ================================================= */}

          {selectedProjectCode && (
            <div
              style={{
                marginTop: '20px'
              }}
            >
              <div className="section-heading-row">
                <div>
                  <h3>
                    Available Phases
                  </h3>

                  <p>
                    Select all phases you want to
                    assign to this project.
                  </p>
                </div>

                {availablePhases.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        handleSelectAllAvailablePhases
                      }
                      disabled={
                        addingAssignment ||
                        assignmentLoading
                      }
                    >
                      Select All
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        handleClearPhaseSelection
                      }
                      disabled={
                        addingAssignment ||
                        selectedPhaseIds.length === 0
                      }
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>

              {assignmentLoading ? (
                <p>
                  ⏳ Loading available phases...
                </p>
              ) : availablePhases.length === 0 ? (
                <p>
                  ✓ All Phase Master entries are
                  already assigned to this project.
                </p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '10px',
                    marginTop: '12px'
                  }}
                >
                  {availablePhases.map((phase) => {
                    const checked =
                      selectedPhaseIds.includes(
                        phase.phaseid
                      );

                    return (
                      <label
                        key={phase.phaseid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px',
                          border:
                            '1px solid rgba(0, 0, 0, 0.12)',
                          borderRadius: '8px',
                          cursor: addingAssignment
                            ? 'not-allowed'
                            : 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            handlePhaseSelectionChange(
                              phase.phaseid,
                              event.target.checked
                            )
                          }
                          disabled={addingAssignment}
                        />

                        <span>
                          <strong>
                            {phase.phaseid}
                          </strong>

                          {' - '}

                          {phase.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {availablePhases.length > 0 && (
                <div
                  className="phase-form-actions"
                  style={{
                    marginTop: '16px'
                  }}
                >
                  <button
                    type="button"
                    onClick={
                      handleAssignSelectedPhases
                    }
                    disabled={
                      addingAssignment ||
                      assignmentLoading ||
                      selectedPhaseIds.length === 0
                    }
                  >
                    {addingAssignment
                      ? '⏳ Assigning Phases...'
                      : `➕ Assign Selected Phases (${selectedPhaseIds.length})`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* =================================================
              ASSIGNED PHASE TABLE
          ================================================= */}

          {selectedProjectCode && (
            <div
              className="table-wrap phase-table-wrap"
              style={{
                marginTop: '24px'
              }}
            >
              <table className="phase-table">
                <thead>
                  <tr>
                    <th>Sequence</th>
                    <th>Phase ID</th>
                    <th>Project Phase</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {assignmentLoading ? (
                    <tr>
                      <td colSpan="4">
                        ⏳ Loading assigned phases...
                      </td>
                    </tr>
                  ) : assignedPhases.length === 0 ? (
                    <tr>
                      <td colSpan="4">
                        No phases are currently
                        assigned to this project.
                      </td>
                    </tr>
                  ) : (
                    assignedPhases.map(
                      (phase, index) => {
                        const isRemoving =
                          String(
                            removingAssignmentPhaseId
                          ) ===
                          String(
                            phase.phaseid
                          );

                        return (
                          <tr
                            key={phase.phaseid}
                          >
                            <td className="phase-number">
                              {phase.sequenceno ||
                                index + 1}
                            </td>

                            <td>
                              <strong>
                                {phase.phaseid}
                              </strong>
                            </td>

                            <td className="phase-name">
                              {phase.description}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="delete-button"
                                onClick={() =>
                                  handleRemoveAssignment(
                                    phase
                                  )
                                }
                                disabled={
                                  isRemoving ||
                                  addingAssignment ||
                                  Boolean(
                                    removingAssignmentPhaseId &&
                                    removingAssignmentPhaseId !==
                                      phase.phaseid
                                  )
                                }
                              >
                                {isRemoving
                                  ? '⏳ Removing...'
                                  : 'Remove from Project'}
                              </button>
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

        {/* =================================================
            INFORMATION
        ================================================= */}

        <div
          className="phase-section"
          style={{
            marginTop: '20px'
          }}
        >
          <div className="section-heading-row">
            <div>
              <h2>
                Phase Structure
              </h2>

              <p>
                Phase Master defines all available
                system phases. Project Phase
                Assignment determines which of
                those phases belong to a project.
                Project versions use those assigned
                phases for planning.
              </p>
            </div>
          </div>

          <div className="project-summary">
            <div className="summary-item">
              <span>1</span>
              <strong>
                Phase Master
              </strong>
            </div>

            <div className="summary-item">
              <span>2</span>
              <strong>
                Project Phase Assignment
              </strong>
            </div>

            <div className="summary-item">
              <span>3</span>
              <strong>
                Project Versions
              </strong>
            </div>

            <div className="summary-item">
              <span>4</span>
              <strong>
                Project Plan
              </strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ProjectPhasesPage;