import { useState } from 'react';

const standardPhases = [
  { id: 1, name: 'Preparation' },
  { id: 2, name: 'Design' },
  { id: 3, name: 'FRS (High Level Design)' },
  { id: 4, name: 'Detailed Design' },
  { id: 5, name: 'Build' },
  { id: 6, name: 'Configuration' },
  { id: 7, name: 'Migration' },
  { id: 8, name: 'Test' },
  { id: 9, name: 'Test Preparation' },
  { id: 10, name: 'Integration Testing' },
  { id: 11, name: 'Mock' },
  { id: 12, name: 'Test Preparation' },
  { id: 13, name: 'Integration Testing' },
  { id: 14, name: 'Bug Fix' },
  { id: 15, name: 'Final Prep and Go Live' },
  { id: 16, name: 'End User Solution Showcase and Training' },
  { id: 17, name: 'Go-live Preparation and Cutover' },
  { id: 18, name: 'Post Go Live Support' },
  { id: 19, name: 'Hypercare' }
];

const sampleProjects = [
  {
    projectcode: 'PRJ001',
    projectname: 'Test Project',
    partner: '00001 - Nuwan',
    projecttype: 'Internal'
  },
  {
    projectcode: 'PRJ002',
    projectname: 'ERP Implementation',
    partner: 'BP0002 - ABC Company',
    projecttype: 'Green Field Implementation'
  }
];

function ProjectPhasesPage() {
  const [selectedProjectCode, setSelectedProjectCode] = useState('');

  const [phases, setPhases] = useState(
    standardPhases.map((phase) => ({
      ...phase,
      startDate: '',
      endDate: ''
    }))
  );

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const selectedProject = sampleProjects.find(
    (project) => project.projectcode === selectedProjectCode
  );

  const handleProjectChange = (event) => {
    setSelectedProjectCode(event.target.value);
    setMessage('');
    setMessageType('');
  };

  const handlePhaseDateChange = (id, field, value) => {
    setPhases((currentPhases) =>
      currentPhases.map((phase) =>
        phase.id === id
          ? {
              ...phase,
              [field]: value
            }
          : phase
      )
    );

    setMessage('');
    setMessageType('');
  };

  const handleClearDates = () => {
    setPhases(
      standardPhases.map((phase) => ({
        ...phase,
        startDate: '',
        endDate: ''
      }))
    );

    setMessage('');
    setMessageType('');
  };

  const handleSave = (event) => {
    event.preventDefault();

    setMessage('');
    setMessageType('');

    if (!selectedProjectCode) {
      setMessageType('error');
      setMessage('✕ Please select a project first.');
      return;
    }

    const invalidPhase = phases.find(
      (phase) =>
        phase.startDate &&
        phase.endDate &&
        phase.endDate < phase.startDate
    );

    if (invalidPhase) {
      setMessageType('error');
      setMessage(
        `✕ End Date cannot be before Start Date for ${invalidPhase.name}.`
      );
      return;
    }

    const plannedPhases = phases.filter(
      (phase) => phase.startDate || phase.endDate
    );

    if (plannedPhases.length === 0) {
      setMessageType('error');
      setMessage('✕ Please enter dates for at least one project phase.');
      return;
    }

    const incompletePhase = phases.find(
      (phase) =>
        (phase.startDate && !phase.endDate) ||
        (!phase.startDate && phase.endDate)
    );

    if (incompletePhase) {
      setMessageType('error');
      setMessage(
        `✕ Please enter both Start Date and End Date for ${incompletePhase.name}.`
      );
      return;
    }

    console.log('Project Phase Plan:', {
      projectcode: selectedProjectCode,
      phases: plannedPhases
    });

    setMessageType('success');
    setMessage('✓ Project phase plan is ready to save.');
  };

  return (
    <div className="page-wrap">
      <div className="card phase-card">
        <div className="page-heading">
          <div>
            <h1>🗂️ Project Phase Planning</h1>

            <p className="page-description">
              Select a project and define the start and end dates
              for the phases included in that project.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="phase-project-selector">
            <label>
              Select Project *
              <select
                value={selectedProjectCode}
                onChange={handleProjectChange}
                required
              >
                <option value="">Select a project</option>

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

          {selectedProject && (
            <div className="project-summary">
              <div className="summary-item">
                <span>Project Code</span>
                <strong>{selectedProject.projectcode}</strong>
              </div>

              <div className="summary-item">
                <span>Project Name</span>
                <strong>{selectedProject.projectname}</strong>
              </div>

              <div className="summary-item">
                <span>Business Partner</span>
                <strong>{selectedProject.partner}</strong>
              </div>

              <div className="summary-item">
                <span>Project Type</span>
                <strong>{selectedProject.projecttype}</strong>
              </div>
            </div>
          )}

          <div className="phase-section">
            <div className="section-heading-row">
              <div>
                <h2>Phase Plan</h2>
                <p>
                  Enter dates only for phases required by the selected
                  project.
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={handleClearDates}
              >
                Clear Dates
              </button>
            </div>

            <div className="table-wrap phase-table-wrap">
              <table className="phase-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Project Phase</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>

                <tbody>
                  {phases.map((phase) => (
                    <tr key={phase.id}>
                      <td className="phase-number">
                        {phase.id}
                      </td>

                      <td className="phase-name">
                        {phase.name}
                      </td>

                      <td>
                        <input
                          type="date"
                          value={phase.startDate}
                          onChange={(event) =>
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
                          value={phase.endDate}
                          min={phase.startDate || undefined}
                          onChange={(event) =>
                            handlePhaseDateChange(
                              phase.id,
                              'endDate',
                              event.target.value
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="phase-form-actions">
            <button type="submit">
              💾 Save Phase Plan
            </button>
          </div>
        </form>

        {message && (
          <p className={`message message-${messageType}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default ProjectPhasesPage;