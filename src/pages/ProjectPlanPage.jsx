import { useEffect, useMemo, useState } from 'react';

const workLocations = [
  'Onsite',
  'Offsite',
  'Hybrid'
];

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

const formatDate = (date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

const getIsoWeekData = (date) => {
  const tempDate = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
  );

  const dayNumber =
    tempDate.getUTCDay() || 7;

  tempDate.setUTCDate(
    tempDate.getUTCDate() + 4 - dayNumber
  );

  const yearStart = new Date(
    Date.UTC(tempDate.getUTCFullYear(), 0, 1)
  );

  const weekNumber = Math.ceil(
    ((tempDate - yearStart) / 86400000 + 1) / 7
  );

  return {
    year: tempDate.getUTCFullYear(),
    weekNumber
  };
};

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
  let displayWeekNumber = 1;

  while (currentStart <= end) {
    /*
     * JavaScript getDay():
     * Sunday = 0
     * Monday = 1
     * Tuesday = 2
     * Wednesday = 3
     * Thursday = 4
     * Friday = 5
     * Saturday = 6
     *
     * Every planning week ends on Sunday.
     */
    const currentDay =
      currentStart.getDay();

    const daysUntilSunday =
      currentDay === 0
        ? 0
        : 7 - currentDay;

    const currentEnd =
      new Date(currentStart);

    currentEnd.setDate(
      currentEnd.getDate() +
        daysUntilSunday
    );

    /*
     * If the selected project phase ends before
     * Sunday, use the real End Date instead.
     */
    if (currentEnd > end) {
      currentEnd.setTime(
        end.getTime()
      );
    }

    const isoWeek =
      getIsoWeekData(currentStart);

    weeks.push({
      id: `week-${displayWeekNumber}`,
      displayWeekNumber,
      year: isoWeek.year,
      weekNumber:
        isoWeek.weekNumber,
      startDate:
        new Date(currentStart),
      endDate:
        new Date(currentEnd)
    });

    /*
     * Move to the next day.
     * After a normal Sunday this becomes Monday.
     */
    currentStart =
      new Date(currentEnd);

    currentStart.setDate(
      currentStart.getDate() + 1
    );

    displayWeekNumber += 1;
  }

  return weeks;
};

function ProjectPlanPage() {
  const [projects, setProjects] =
    useState([]);

  const [
    projectPhases,
    setProjectPhases
  ] = useState([]);

  const [
    projectRoles,
    setProjectRoles
  ] = useState([]);

  const [resources, setResources] =
    useState([]);

  const [
    masterDataLoading,
    setMasterDataLoading
  ] = useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    selectedProjectKey,
    setSelectedProjectKey
  ] = useState('');

  const [
    selectedPhaseId,
    setSelectedPhaseId
  ] = useState('');

  const [startDate, setStartDate] =
    useState('');

  const [endDate, setEndDate] =
    useState('');

  const [
    generatedWeeks,
    setGeneratedWeeks
  ] = useState([]);

  const [
    resourceRows,
    setResourceRows
  ] = useState([]);

  const [message, setMessage] =
    useState('');

  const [
    messageType,
    setMessageType
  ] = useState('');

  useEffect(() => {
    const loadMasterData =
      async () => {
        setMasterDataLoading(true);
        setMessage('');
        setMessageType('');

        try {
          const [
            projectsResponse,
            phasesResponse,
            rolesResponse,
            resourcesResponse
          ] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/project-phases'),
            fetch('/api/project-roles'),
            fetch('/api/resources')
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

          if (!projectsResponse.ok) {
            throw new Error(
              projectsResult.error ||
                'Failed to load projects.'
            );
          }

          if (!phasesResponse.ok) {
            throw new Error(
              phasesResult.error ||
                'Failed to load project phases.'
            );
          }

          if (!rolesResponse.ok) {
            throw new Error(
              rolesResult.error ||
                'Failed to load project roles.'
            );
          }

          if (!resourcesResponse.ok) {
            throw new Error(
              resourcesResult.error ||
                'Failed to load resources.'
            );
          }

          setProjects(
            projectsResult.projects || []
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
          setMessageType('error');

          setMessage(
            `✕ ${
              error.message ||
              'Failed to load Project Plan data.'
            }`
          );
        } finally {
          setMasterDataLoading(false);
        }
      };

    loadMasterData();
  }, []);

  const selectedProject =
    useMemo(() => {
      return projects.find(
        (project) =>
          `${project.projectcode}::${project.versionid}` ===
          selectedProjectKey
      );
    }, [
      projects,
      selectedProjectKey
    ]);

  const selectedPhase =
    useMemo(() => {
      return projectPhases.find(
        (phase) =>
          String(phase.phaseid) ===
          String(selectedPhaseId)
      );
    }, [
      projectPhases,
      selectedPhaseId
    ]);

  const resetPlanningArea = () => {
    setStartDate('');
    setEndDate('');
    setGeneratedWeeks([]);
    setResourceRows([]);
  };

  const handleProjectChange = (
    event
  ) => {
    setSelectedProjectKey(
      event.target.value
    );

    setSelectedPhaseId('');

    resetPlanningArea();

    setMessage('');
    setMessageType('');
  };

  const loadExistingPlan = async (
    project,
    phaseId
  ) => {
    if (!project || !phaseId) {
      return false;
    }

    const response =
      await fetch(
        `/api/project-plans/${encodeURIComponent(
          project.projectcode
        )}/${encodeURIComponent(
          project.versionid
        )}/${encodeURIComponent(
          phaseId
        )}`
      );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          'Failed to load existing Project Plan.'
      );
    }

    if (
      !Array.isArray(result.rows) ||
      result.rows.length === 0
    ) {
      return false;
    }

    const firstRow =
      result.rows[0];

    const loadedStartDate =
      firstRow.startdate
        ? String(
            firstRow.startdate
          ).slice(0, 10)
        : '';

    const loadedEndDate =
      firstRow.enddate
        ? String(
            firstRow.enddate
          ).slice(0, 10)
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

    setGeneratedWeeks(weeks);

    const loadedRows =
      result.rows.map(
        (savedRow, index) => {
          const weeklyValues = {};

          weeks.forEach(
            (week) => {
              const savedWeek =
                savedRow.weeks?.find(
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
                savedWeek?.allocation ??
                '';
            }
          );

          const resource =
            resources.find(
              (item) =>
                item.resourceid ===
                savedRow.resourceid
            );

          return {
            id: `saved-${savedRow.prjuuid}-${index}`,

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
              '',

            designation:
              resource?.roledescription ||
              '',

            workLocation:
              savedRow.resourcelocation ||
              resource?.location ||
              '',

            weeklyValues
          };
        }
      );

    setResourceRows(
      loadedRows
    );

    return true;
  };

  const handlePhaseChange =
    async (event) => {
      const phaseId =
        event.target.value;

      setSelectedPhaseId(
        phaseId
      );

      resetPlanningArea();

      setMessage('');
      setMessageType('');

      if (
        !selectedProject ||
        !phaseId
      ) {
        return;
      }

      try {
        const existingPlan =
          await loadExistingPlan(
            selectedProject,
            phaseId
          );

        if (existingPlan) {
          setMessageType(
            'success'
          );

          setMessage(
            '✓ Existing Project Plan loaded from the database.'
          );
        }
      } catch (error) {
        setMessageType('error');

        setMessage(
          `✕ ${
            error.message ||
            'Failed to load existing Project Plan.'
          }`
        );
      }
    };

  const handleStartDateChange = (
    event
  ) => {
    const value =
      event.target.value;

    setStartDate(value);

    setGeneratedWeeks([]);
    setResourceRows([]);

    setMessage('');
    setMessageType('');

    if (
      endDate &&
      value > endDate
    ) {
      setEndDate('');
    }
  };

  const handleEndDateChange = (
    event
  ) => {
    const value =
      event.target.value;

    setEndDate(value);

    setGeneratedWeeks([]);
    setResourceRows([]);

    setMessage('');
    setMessageType('');

    if (
      startDate &&
      value < startDate
    ) {
      setMessageType('error');

      setMessage(
        '✕ End Date cannot be earlier than Start Date.'
      );
    }
  };

  const handleGenerateWeeklyPlan =
    () => {
      setMessage('');
      setMessageType('');

      if (!selectedProject) {
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

      if (
        !startDate ||
        !endDate
      ) {
        setMessageType('error');

        setMessage(
          '✕ Please select both Start Date and End Date.'
        );

        return;
      }

      if (
        endDate < startDate
      ) {
        setMessageType('error');

        setMessage(
          '✕ End Date cannot be earlier than Start Date.'
        );

        return;
      }

      const weeks =
        generateWeeks(
          startDate,
          endDate
        );

      setGeneratedWeeks(
        weeks
      );

      setResourceRows([
        createEmptyResourceRow(
          weeks
        )
      ]);

      setMessageType(
        'success'
      );

      setMessage(
        `✓ ${weeks.length} weekly planning period${
          weeks.length === 1
            ? ''
            : 's'
        } generated successfully.`
      );
    };

  const handleAddResourceRow =
    () => {
      setResourceRows(
        (previous) => [
          ...previous,
          createEmptyResourceRow(
            generatedWeeks
          )
        ]
      );
    };

  const handleRemoveResourceRow =
    (rowId) => {
      setResourceRows(
        (previous) =>
          previous.filter(
            (row) =>
              row.id !== rowId
          )
      );
    };

  const handleResourceFieldChange = (
    rowId,
    field,
    value
  ) => {
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
                    item.resourceid ===
                    value
                );

              return {
                ...row,

                resourceId:
                  value,

                projectRoleId:
                  resource?.internalroleid ||
                  row.projectRoleId ||
                  '',

                skill:
                  resource?.roledescription ||
                  '',

                country:
                  resource?.location ||
                  '',

                designation:
                  resource?.roledescription ||
                  '',

                workLocation:
                  row.workLocation ||
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
                    item.projectroleid ===
                    value
                );

              return {
                ...row,

                projectRoleId:
                  value,

                skill:
                  role?.rolecategory ||
                  ''
              };
            }

            return {
              ...row,
              [field]: value
            };
          }
        )
    );
  };

  const handleWeekValueChange = (
    rowId,
    weekId,
    value
  ) => {
    let cleanValue =
      value;

    if (
      cleanValue !== ''
    ) {
      const numericValue =
        Number(cleanValue);

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
        cleanValue = '0';
      }

      if (
        numericValue > 100
      ) {
        cleanValue = '100';
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
  };

  const handleSavePlan =
    async () => {
      setMessage('');
      setMessageType('');

      if (!selectedProject) {
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

      if (
        !startDate ||
        !endDate
      ) {
        setMessageType('error');

        setMessage(
          '✕ Start Date and End Date are required.'
        );

        return;
      }

      if (
        resourceRows.length === 0
      ) {
        setMessageType('error');

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

      if (incompleteRow) {
        setMessageType('error');

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

              allocation:
                headerAllocation,

              weeks:
                weeklyAllocations
            };
          }
        );

      try {
        setSaving(true);

        const response =
          await fetch(
            '/api/project-plans',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body: JSON.stringify({
                projectcode:
                  selectedProject.projectcode,

                versionid:
                  selectedProject.versionid,

                phaseid:
                  selectedPhaseId,

                startdate:
                  startDate,

                enddate:
                  endDate,

                rows
              })
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              'Failed to save Project Plan.'
          );
        }

        setMessageType(
          'success'
        );

        setMessage(
          '✓ Project Plan saved successfully to Neon database.'
        );
      } catch (error) {
        setMessageType('error');

        setMessage(
          `✕ ${
            error.message ||
            'Failed to save Project Plan.'
          }`
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="page-wrap">
      <div className="card project-plan-card">
        <div className="page-heading">
          <div>
            <h1>
              📊 Project Plan
            </h1>

            <p className="page-description">
              Manage phase dates,
              generated weeks, planned
              resources and weekly
              resource allocations from
              one screen.
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
                  selectedProjectKey
                }
                onChange={
                  handleProjectChange
                }
                disabled={
                  masterDataLoading
                }
              >
                <option value="">
                  {masterDataLoading
                    ? 'Loading Projects...'
                    : 'Select Project ID'}
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={`${project.projectcode}-${project.versionid}`}
                      value={`${project.projectcode}::${project.versionid}`}
                    >
                      {
                        project.projectcode
                      }
                      {' - '}
                      {
                        project.projectname
                      }
                      {' - V'}
                      {
                        project.versionid
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
                  !selectedProject ||
                  masterDataLoading
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
                  Version
                </span>

                <strong>
                  {
                    selectedProject.versionid
                  }
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Project Description
                </span>

                <strong>
                  {selectedProject.projectdescription ||
                    selectedProject.projectname ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Business Partner
                </span>

                <strong>
                  {selectedProject.partnerdescription ||
                    selectedProject.partnerid ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Project Type
                </span>

                <strong>
                  {selectedProject.projecttypedescription ||
                    selectedProject.projecttype ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Currency
                </span>

                <strong>
                  {selectedProject.currency ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Location
                </span>

                <strong>
                  {selectedProject.location ||
                    '-'}
                </strong>
              </div>

              <div className="summary-item">
                <span>
                  Region
                </span>

                <strong>
                  {selectedProject.region ||
                    '-'}
                </strong>
              </div>
            </div>
          )}
        </div>

        {selectedProject &&
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
                        selectedPhase?.description
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
                    value={
                      startDate
                    }
                    onChange={
                      handleStartDateChange
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

        {generatedWeeks.length >
          0 && (
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

                    <th>
                      Skill
                    </th>

                    <th>
                      Planned Resource
                    </th>

                    <th>
                      Country
                    </th>

                    <th>
                      Designation
                    </th>

                    <th>
                      Work Location
                    </th>

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

                    <th>
                      Action
                    </th>
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
                                event.target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              Select Resource
                            </option>

                            {resources.map(
                              (
                                resource
                              ) => (
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
                                    event.target
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
                Weekly cells accept
                values from 0 to 100.
              </div>

              <button
                type="button"
                onClick={
                  handleSavePlan
                }
                disabled={
                  saving
                }
              >
                {saving
                  ? '⏳ Saving...'
                  : '💾 Save Project Plan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectPlanPage;