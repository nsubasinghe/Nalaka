import { useMemo, useState } from 'react';

import {
  projects,
  projectPhasePlans,
  standardPhases,
  employees
} from '../data/planningData';

const temporaryProjectDetails = {
  PRJ001: {
    description: 'Test Project',
    currency: 'LKR',
    location: 'Sri Lanka'
  },

  PRJ002: {
    description: 'ERP Implementation Project',
    currency: 'USD',
    location: 'Sri Lanka'
  }
};

/*
 * Temporary frontend-only role list.
 * Later this should come from the database.
 */
const projectRoles = [
  'Project Manager',
  'Business Analyst',
  'Consultant',
  'Developer',
  'Technical Lead',
  'QA Engineer'
];

/*
 * Temporary frontend-only work location list.
 * Later this should come from the relevant database/master data.
 */
const workLocations = [
  'Onsite',
  'Offsite',
  'Hybrid'
];

/*
 * Temporary extra employee information.
 * Later Skill, Country and Designation should come from the database.
 */
const employeeDetails = {
  EMP001: {
    country: 'Sri Lanka',
    designation: 'Project Manager'
  },

  EMP002: {
    country: 'Sri Lanka',
    designation: 'Business Analyst'
  },

  EMP003: {
    country: 'Sri Lanka',
    designation: 'ERP Consultant'
  },

  EMP004: {
    country: 'Sri Lanka',
    designation: 'Software Engineer'
  }
};

const createEmptyResourceRow = (weeks) => {
  const weeklyValues = {};

  weeks.forEach((week) => {
    weeklyValues[week.id] = '';
  });

  return {
    id: `${Date.now()}-${Math.random()}`,
    projectRole: '',
    employeeId: '',
    skill: '',
    country: '',
    designation: '',
    workLocation: '',
    weeklyValues
  };
};

const formatDate = (date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

const generateWeeks = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return [];
  }

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end < start
  ) {
    return [];
  }

  const weeks = [];
  let currentStart = new Date(start);
  let weekNumber = 1;

  while (currentStart <= end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);

    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }

    weeks.push({
      id: `week-${weekNumber}`,
      weekNumber,
      startDate: new Date(currentStart),
      endDate: new Date(currentEnd)
    });

    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);

    weekNumber += 1;
  }

  return weeks;
};

function ProjectPlanPage() {
  const [selectedProjectCode, setSelectedProjectCode] =
    useState('');

  const [selectedPhaseId, setSelectedPhaseId] =
    useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [generatedWeeks, setGeneratedWeeks] =
    useState([]);

  const [resourceRows, setResourceRows] =
    useState([]);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] =
    useState('');

  const selectedProject = useMemo(() => {
    return projects.find(
      (project) =>
        project.projectcode === selectedProjectCode
    );
  }, [selectedProjectCode]);

  const selectedProjectDetails = useMemo(() => {
    if (!selectedProjectCode) {
      return null;
    }

    return (
      temporaryProjectDetails[selectedProjectCode] || {
        description: '',
        currency: '',
        location: ''
      }
    );
  }, [selectedProjectCode]);

  const selectedPhase = useMemo(() => {
    return standardPhases.find(
      (phase) =>
        String(phase.id) ===
        String(selectedPhaseId)
    );
  }, [selectedPhaseId]);

  const handleProjectChange = (event) => {
    const projectCode = event.target.value;

    setSelectedProjectCode(projectCode);
    setSelectedPhaseId('');
    setStartDate('');
    setEndDate('');
    setGeneratedWeeks([]);
    setResourceRows([]);

    setMessage('');
    setMessageType('');
  };

  const handlePhaseChange = (event) => {
    const phaseId = event.target.value;

    setSelectedPhaseId(phaseId);
    setGeneratedWeeks([]);
    setResourceRows([]);

    setMessage('');
    setMessageType('');

    if (!selectedProjectCode || !phaseId) {
      setStartDate('');
      setEndDate('');
      return;
    }

    const existingPhase =
      projectPhasePlans[selectedProjectCode]?.find(
        (phase) =>
          String(phase.id) === String(phaseId)
      );

    if (existingPhase) {
      setStartDate(
        existingPhase.startDate || ''
      );

      setEndDate(
        existingPhase.endDate || ''
      );
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleStartDateChange = (event) => {
    const value = event.target.value;

    setStartDate(value);
    setGeneratedWeeks([]);
    setResourceRows([]);

    setMessage('');
    setMessageType('');

    if (endDate && value > endDate) {
      setEndDate('');
    }
  };

  const handleEndDateChange = (event) => {
    const value = event.target.value;

    setEndDate(value);
    setGeneratedWeeks([]);
    setResourceRows([]);

    setMessage('');
    setMessageType('');

    if (startDate && value < startDate) {
      setMessageType('error');
      setMessage(
        '✕ End Date cannot be earlier than Start Date.'
      );
    }
  };

  const handleGenerateWeeklyPlan = () => {
    setMessage('');
    setMessageType('');

    if (!selectedProjectCode) {
      setMessageType('error');
      setMessage(
        '✕ Please select a Project ID.'
      );
      return;
    }

    if (!selectedPhaseId) {
      setMessageType('error');
      setMessage(
        '✕ Please select a Project Phase.'
      );
      return;
    }

    if (!startDate || !endDate) {
      setMessageType('error');
      setMessage(
        '✕ Please select both Start Date and End Date.'
      );
      return;
    }

    if (endDate < startDate) {
      setMessageType('error');
      setMessage(
        '✕ End Date cannot be earlier than Start Date.'
      );
      return;
    }

    const weeks = generateWeeks(
      startDate,
      endDate
    );

    setGeneratedWeeks(weeks);

    setResourceRows([
      createEmptyResourceRow(weeks)
    ]);

    setMessageType('success');
    setMessage(
      `✓ ${weeks.length} weekly planning period${
        weeks.length === 1 ? '' : 's'
      } generated successfully.`
    );
  };

  const handleAddResourceRow = () => {
    setResourceRows((previous) => [
      ...previous,
      createEmptyResourceRow(
        generatedWeeks
      )
    ]);
  };

  const handleRemoveResourceRow = (rowId) => {
    setResourceRows((previous) =>
      previous.filter(
        (row) => row.id !== rowId
      )
    );
  };

  const handleResourceFieldChange = (
    rowId,
    field,
    value
  ) => {
    setResourceRows((previous) =>
      previous.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (field === 'employeeId') {
          const employee = employees.find(
            (item) => item.id === value
          );

          const details =
            employeeDetails[value] || {};

          return {
            ...row,
            employeeId: value,
            skill: employee?.skill || '',
            country:
              details.country || '',
            designation:
              details.designation || ''
          };
        }

        return {
          ...row,
          [field]: value
        };
      })
    );
  };

  const handleWeekValueChange = (
    rowId,
    weekId,
    value
  ) => {
    let cleanValue = value;

    if (cleanValue !== '') {
      const numericValue =
        Number(cleanValue);

      if (Number.isNaN(numericValue)) {
        return;
      }

      if (numericValue < 0) {
        cleanValue = '0';
      }

      if (numericValue > 100) {
        cleanValue = '100';
      }
    }

    setResourceRows((previous) =>
      previous.map((row) =>
        row.id === rowId
          ? {
              ...row,
              weeklyValues: {
                ...row.weeklyValues,
                [weekId]: cleanValue
              }
            }
          : row
      )
    );
  };

  const handleSavePlan = () => {
    setMessage('');
    setMessageType('');

    if (resourceRows.length === 0) {
      setMessageType('error');
      setMessage(
        '✕ Add at least one resource row.'
      );
      return;
    }

    const incompleteRow =
      resourceRows.find(
        (row) =>
          !row.projectRole ||
          !row.employeeId ||
          !row.workLocation
      );

    if (incompleteRow) {
      setMessageType('error');
      setMessage(
        '✕ Project Role, Planned Resource and Work Location are required for every resource row.'
      );
      return;
    }

    console.log('Project Plan:', {
      projectId: selectedProjectCode,
      phaseId: selectedPhaseId,
      startDate,
      endDate,
      weeks: generatedWeeks,
      resources: resourceRows
    });

    setMessageType('success');
    setMessage(
      '✓ Project plan is ready to save.'
    );
  };

  return (
    <div className="page-wrap">
      <div className="card project-plan-card">
        <div className="page-heading">
          <div>
            <h1>📊 Project Plan</h1>

            <p className="page-description">
              Manage phase dates, generated weeks,
              planned resources and weekly resource
              allocations from one screen.
            </p>
          </div>
        </div>

        <div className="project-plan-entry-section">
          <h2>Project Details</h2>

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
              >
                <option value="">
                  Select Project ID
                </option>

                {projects.map(
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
                value={selectedPhaseId}
                onChange={
                  handlePhaseChange
                }
                disabled={
                  !selectedProjectCode
                }
              >
                <option value="">
                  Select Project Phase
                </option>

                {standardPhases.map(
                  (phase) => (
                    <option
                      key={phase.id}
                      value={phase.id}
                    >
                      {phase.id}
                      {' - '}
                      {phase.name}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          {selectedProject && (
            <div className="project-summary">
              <div className="summary-item">
                <span>Project ID</span>
                <strong>
                  {
                    selectedProject.projectcode
                  }
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Project Description
                </span>

                <strong>
                  {selectedProjectDetails
                    ?.description ||
                    selectedProject.projectname}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Business Partner
                </span>

                <strong>
                  {selectedProject.partner ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>Project Type</span>

                <strong>
                  {selectedProject.projecttype ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>Currency</span>

                <strong>
                  {selectedProjectDetails
                    ?.currency || '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>Location</span>

                <strong>
                  {selectedProjectDetails
                    ?.location || '-'}
                </strong>
              </div>
            </div>
          )}
        </div>

        {selectedProjectCode &&
          selectedPhaseId && (
            <div className="project-plan-entry-section">
              <div className="section-heading-row">
                <div>
                  <h2>
                    Phase Planning Period
                  </h2>

                  <p>
                    Set the planning dates
                    for{' '}
                    <strong>
                      {
                        selectedPhase?.name
                      }
                    </strong>
                    .
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  Start Date *
                  <input
                    type="date"
                    value={startDate}
                    onChange={
                      handleStartDateChange
                    }
                  />
                </label>

                <label>
                  End Date *
                  <input
                    type="date"
                    value={endDate}
                    min={
                      startDate ||
                      undefined
                    }
                    onChange={
                      handleEndDateChange
                    }
                  />
                </label>
              </div>

              <div className="phase-form-actions">
                <button
                  type="button"
                  onClick={
                    handleGenerateWeeklyPlan
                  }
                >
                  Generate Weekly Plan
                </button>
              </div>
            </div>
          )}

        {message && (
          <p
            className={`message message-${messageType}`}
          >
            {message}
          </p>
        )}

        {generatedWeeks.length > 0 && (
          <div className="project-plan-entry-section">
            <div className="section-heading-row">
              <div>
                <h2>
                  Weekly Resource Plan
                </h2>

                <p>
                  Enter planned resource
                  allocation for each
                  generated week.
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  handleAddResourceRow
                }
              >
                + Add Resource Row
              </button>
            </div>

            <div className="project-entry-grid-wrap">
              <table className="project-entry-grid">
                <thead>
                  <tr>
                    <th>
                      Project Role
                    </th>

                    <th>Skill</th>

                    <th>
                      Planned Resource
                    </th>

                    <th>Country</th>

                    <th>
                      Designation
                    </th>

                    <th>
                      Work Location
                    </th>

                    {generatedWeeks.map(
                      (week) => (
                        <th
                          key={week.id}
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

                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {resourceRows.map(
                    (row) => (
                      <tr key={row.id}>
                        <td>
                          <select
                            value={
                              row.projectRole
                            }
                            onChange={(
                              event
                            ) =>
                              handleResourceFieldChange(
                                row.id,
                                'projectRole',
                                event.target
                                  .value
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
                                    role
                                  }
                                  value={
                                    role
                                  }
                                >
                                  {
                                    role
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
                              row.employeeId
                            }
                            onChange={(
                              event
                            ) =>
                              handleResourceFieldChange(
                                row.id,
                                'employeeId',
                                event.target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              Select Resource
                            </option>

                            {employees.map(
                              (
                                employee
                              ) => (
                                <option
                                  key={
                                    employee.id
                                  }
                                  value={
                                    employee.id
                                  }
                                >
                                  {
                                    employee.id
                                  }
                                  {' - '}
                                  {
                                    employee.name
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
                                event.target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              Select
                            </option>

                            {workLocations.map(
                              (
                                location
                              ) => (
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
                                  row
                                    .weeklyValues[
                                    week.id
                                  ] ?? ''
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleWeekValueChange(
                                    row.id,
                                    week.id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="0"
                              />
                            </td>
                          )
                        )}

                        <td>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() =>
                              handleRemoveResourceRow(
                                row.id
                              )
                            }
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="project-plan-grid-footer">
              <div className="week-value-help">
                Weekly cells accept values
                from 0 to 100.
              </div>

              <button
                type="button"
                onClick={
                  handleSavePlan
                }
              >
                💾 Save Project Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectPlanPage;