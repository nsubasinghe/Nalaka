import { useMemo, useState } from 'react';

const sampleProjects = [
  {
    projectcode: 'PRJ001',
    projectname: 'Test Project'
  },
  {
    projectcode: 'PRJ002',
    projectname: 'ERP Implementation'
  }
];

const sampleWeeks = {
  PRJ001: [
    {
      id: 'PREP-W1',
      phase: 'Preparation',
      week: 'Week 1',
      startDate: '01 Sep 2026',
      endDate: '07 Sep 2026'
    },
    {
      id: 'PREP-W2',
      phase: 'Preparation',
      week: 'Week 2',
      startDate: '08 Sep 2026',
      endDate: '13 Sep 2026'
    },
    {
      id: 'DES-W1',
      phase: 'Design',
      week: 'Week 1',
      startDate: '14 Sep 2026',
      endDate: '20 Sep 2026'
    },
    {
      id: 'DES-W2',
      phase: 'Design',
      week: 'Week 2',
      startDate: '21 Sep 2026',
      endDate: '27 Sep 2026'
    },
    {
      id: 'DES-W3',
      phase: 'Design',
      week: 'Week 3',
      startDate: '28 Sep 2026',
      endDate: '04 Oct 2026'
    }
  ],

  PRJ002: [
    {
      id: 'PREP-W1',
      phase: 'Preparation',
      week: 'Week 1',
      startDate: '01 Oct 2026',
      endDate: '07 Oct 2026'
    },
    {
      id: 'PREP-W2',
      phase: 'Preparation',
      week: 'Week 2',
      startDate: '08 Oct 2026',
      endDate: '11 Oct 2026'
    },
    {
      id: 'DES-W1',
      phase: 'Design',
      week: 'Week 1',
      startDate: '12 Oct 2026',
      endDate: '18 Oct 2026'
    }
  ]
};

const sampleEmployees = [
  {
    id: 'EMP001',
    name: 'Nuwan',
    role: 'Project Manager',
    skill: 'Project Management'
  },
  {
    id: 'EMP002',
    name: 'Kasun',
    role: 'Business Analyst',
    skill: 'Business Analysis'
  },
  {
    id: 'EMP003',
    name: 'Amal',
    role: 'Consultant',
    skill: 'ERP'
  },
  {
    id: 'EMP004',
    name: 'Saman',
    role: 'Developer',
    skill: 'Development'
  }
];

const initialAllocation = {
  weekId: '',
  employeeId: '',
  allocationPercentage: '100'
};

function ResourceAllocationPage() {
  const [selectedProjectCode, setSelectedProjectCode] =
    useState('');

  const [form, setForm] = useState(initialAllocation);

  const [allocations, setAllocations] = useState([]);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const projectWeeks = useMemo(() => {
    if (!selectedProjectCode) {
      return [];
    }

    return sampleWeeks[selectedProjectCode] || [];
  }, [selectedProjectCode]);

  const selectedEmployee = sampleEmployees.find(
    (employee) => employee.id === form.employeeId
  );

  const handleProjectChange = (event) => {
    setSelectedProjectCode(event.target.value);

    setForm(initialAllocation);
    setAllocations([]);

    setMessage('');
    setMessageType('');
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));

    setMessage('');
    setMessageType('');
  };

  const handleAddAllocation = (event) => {
    event.preventDefault();

    if (!selectedProjectCode) {
      setMessageType('error');
      setMessage('✕ Please select a project first.');
      return;
    }

    if (!form.weekId) {
      setMessageType('error');
      setMessage('✕ Please select a project week.');
      return;
    }

    if (!form.employeeId) {
      setMessageType('error');
      setMessage('✕ Please select an employee.');
      return;
    }

    const percentage = Number(form.allocationPercentage);

    if (
      Number.isNaN(percentage) ||
      percentage <= 0 ||
      percentage > 100
    ) {
      setMessageType('error');
      setMessage(
        '✕ Allocation percentage must be between 1 and 100.'
      );
      return;
    }

    const selectedWeek = projectWeeks.find(
      (week) => week.id === form.weekId
    );

    const employee = sampleEmployees.find(
      (item) => item.id === form.employeeId
    );

    const duplicate = allocations.some(
      (allocation) =>
        allocation.weekId === form.weekId &&
        allocation.employeeId === form.employeeId
    );

    if (duplicate) {
      setMessageType('error');
      setMessage(
        '✕ This employee is already assigned to the selected week.'
      );
      return;
    }

    const newAllocation = {
      id: `${Date.now()}-${form.employeeId}`,
      projectcode: selectedProjectCode,
      weekId: selectedWeek.id,
      phase: selectedWeek.phase,
      week: selectedWeek.week,
      startDate: selectedWeek.startDate,
      endDate: selectedWeek.endDate,
      employeeId: employee.id,
      employeeName: employee.name,
      role: employee.role,
      skill: employee.skill,
      allocationPercentage: percentage
    };

    setAllocations((previous) => [
      ...previous,
      newAllocation
    ]);

    setForm((previous) => ({
      ...initialAllocation,
      weekId: previous.weekId
    }));

    setMessageType('success');
    setMessage('✓ Employee allocated successfully.');
  };

  const handleRemoveAllocation = (allocationId) => {
    setAllocations((previous) =>
      previous.filter(
        (allocation) => allocation.id !== allocationId
      )
    );

    setMessageType('success');
    setMessage('✓ Allocation removed.');
  };

  return (
    <div className="page-wrap">
      <div className="card phase-card">
        <div className="page-heading">
          <div>
            <h1>👥 Resource Allocation</h1>

            <p className="page-description">
              Assign employees to the generated weekly periods
              of each project phase.
            </p>
          </div>
        </div>

        <div className="phase-project-selector">
          <label>
            Select Project *
            <select
              value={selectedProjectCode}
              onChange={handleProjectChange}
            >
              <option value="">
                Select a project
              </option>

              {sampleProjects.map((project) => (
                <option
                  key={project.projectcode}
                  value={project.projectcode}
                >
                  {project.projectcode} - {project.projectname}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedProjectCode && (
          <>
            <div className="allocation-form-section">
              <h2>Assign Employee</h2>

              <form
                className="project-form"
                onSubmit={handleAddAllocation}
              >
                <div className="form-grid">
                  <label>
                    Phase / Week *
                    <select
                      name="weekId"
                      value={form.weekId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        Select phase and week
                      </option>

                      {projectWeeks.map((week) => (
                        <option
                          key={week.id}
                          value={week.id}
                        >
                          {week.phase} - {week.week} (
                          {week.startDate} - {week.endDate})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Employee *
                    <select
                      name="employeeId"
                      value={form.employeeId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        Select employee
                      </option>

                      {sampleEmployees.map((employee) => (
                        <option
                          key={employee.id}
                          value={employee.id}
                        >
                          {employee.id} - {employee.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Allocation %
                    <input
                      type="number"
                      name="allocationPercentage"
                      value={form.allocationPercentage}
                      onChange={handleChange}
                      min="1"
                      max="100"
                    />
                  </label>
                </div>

                {selectedEmployee && (
                  <div className="employee-preview">
                    <div className="summary-item">
                      <span>Employee</span>
                      <strong>
                        {selectedEmployee.name}
                      </strong>
                    </div>

                    <div className="summary-item">
                      <span>Role</span>
                      <strong>
                        {selectedEmployee.role}
                      </strong>
                    </div>

                    <div className="summary-item">
                      <span>Skill</span>
                      <strong>
                        {selectedEmployee.skill}
                      </strong>
                    </div>
                  </div>
                )}

                <button type="submit">
                  + Add Allocation
                </button>
              </form>
            </div>

            {message && (
              <p
                className={`message message-${messageType}`}
              >
                {message}
              </p>
            )}

            <div className="allocation-list-section">
              <div className="section-heading-row">
                <div>
                  <h2>Current Allocations</h2>

                  <p>
                    Employees assigned to this project's weekly
                    planning periods.
                  </p>
                </div>

                <span className="allocation-count">
                  {allocations.length} Allocations
                </span>
              </div>

              {allocations.length === 0 ? (
                <div className="weekly-empty-state">
                  <div className="weekly-empty-icon">
                    👥
                  </div>

                  <h2>No Employees Allocated</h2>

                  <p>
                    Select a week and employee above to create
                    the first resource allocation.
                  </p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="partner-table">
                    <thead>
                      <tr>
                        <th>Phase</th>
                        <th>Week</th>
                        <th>Period</th>
                        <th>Employee</th>
                        <th>Role</th>
                        <th>Skill</th>
                        <th>Allocation</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {allocations.map((allocation) => (
                        <tr key={allocation.id}>
                          <td>{allocation.phase}</td>

                          <td>{allocation.week}</td>

                          <td>
                            {allocation.startDate}
                            <br />
                            <small>
                              to {allocation.endDate}
                            </small>
                          </td>

                          <td>
                            <strong>
                              {allocation.employeeName}
                            </strong>
                            <br />
                            <small>
                              {allocation.employeeId}
                            </small>
                          </td>

                          <td>{allocation.role}</td>

                          <td>{allocation.skill}</td>

                          <td>
                            {allocation.allocationPercentage}%
                          </td>

                          <td>
                            <button
                              type="button"
                              className="delete-button"
                              onClick={() =>
                                handleRemoveAllocation(
                                  allocation.id
                                )
                              }
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {!selectedProjectCode && (
          <div className="weekly-empty-state">
            <div className="weekly-empty-icon">
              👥
            </div>

            <h2>Select a Project</h2>

            <p>
              Select a project before assigning employees to
              project weeks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResourceAllocationPage;