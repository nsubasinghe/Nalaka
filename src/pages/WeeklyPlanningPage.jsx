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

const samplePhasePlans = {
  PRJ001: [
    {
      id: 1,
      name: 'Preparation',
      startDate: '2026-09-01',
      endDate: '2026-09-13'
    },
    {
      id: 2,
      name: 'Design',
      startDate: '2026-09-14',
      endDate: '2026-10-04'
    },
    {
      id: 3,
      name: 'FRS (High Level Design)',
      startDate: '2026-10-05',
      endDate: '2026-10-18'
    }
  ],

  PRJ002: [
    {
      id: 1,
      name: 'Preparation',
      startDate: '2026-10-01',
      endDate: '2026-10-11'
    },
    {
      id: 2,
      name: 'Design',
      startDate: '2026-10-12',
      endDate: '2026-11-01'
    }
  ]
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
      weekNumber,
      startDate: formatDate(currentStart),
      endDate: formatDate(currentEnd)
    });

    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);

    weekNumber += 1;
  }

  return weeks;
};

function WeeklyPlanningPage() {
  const [selectedProjectCode, setSelectedProjectCode] =
    useState('');

  const phasePlans = useMemo(() => {
    if (!selectedProjectCode) {
      return [];
    }

    return samplePhasePlans[selectedProjectCode] || [];
  }, [selectedProjectCode]);

  const totalWeeks = useMemo(
    () =>
      phasePlans.reduce(
        (total, phase) =>
          total +
          generateWeeks(
            phase.startDate,
            phase.endDate
          ).length,
        0
      ),
    [phasePlans]
  );

  const handleProjectChange = (event) => {
    setSelectedProjectCode(event.target.value);
  };

  return (
    <div className="page-wrap">
      <div className="card phase-card">
        <div className="page-heading">
          <div>
            <h1>📅 Weekly Planning</h1>

            <p className="page-description">
              View the individual planning weeks generated from
              each project phase start and end date.
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

        {!selectedProjectCode && (
          <div className="weekly-empty-state">
            <div className="weekly-empty-icon">
              📅
            </div>

            <h2>Select a Project</h2>

            <p>
              Select a project to view its phases and
              automatically generated weekly planning periods.
            </p>
          </div>
        )}

        {selectedProjectCode && (
          <>
            <div className="weekly-summary">
              <div className="summary-item">
                <span>Project</span>
                <strong>
                  {
                    sampleProjects.find(
                      (project) =>
                        project.projectcode ===
                        selectedProjectCode
                    )?.projectname
                  }
                </strong>
              </div>

              <div className="summary-item">
                <span>Planned Phases</span>
                <strong>{phasePlans.length}</strong>
              </div>

              <div className="summary-item">
                <span>Generated Week Periods</span>
                <strong>{totalWeeks}</strong>
              </div>
            </div>

            {phasePlans.length === 0 ? (
              <div className="weekly-empty-state">
                <h2>No Phase Plan Available</h2>

                <p>
                  Add phase dates before generating weekly
                  planning periods.
                </p>
              </div>
            ) : (
              <div className="weekly-phase-list">
                {phasePlans.map((phase) => {
                  const weeks = generateWeeks(
                    phase.startDate,
                    phase.endDate
                  );

                  return (
                    <div
                      className="weekly-phase-card"
                      key={phase.id}
                    >
                      <div className="weekly-phase-header">
                        <div>
                          <span className="phase-badge">
                            Phase {phase.id}
                          </span>

                          <h2>{phase.name}</h2>
                        </div>

                        <div className="phase-date-range">
                          {formatDate(
                            new Date(
                              `${phase.startDate}T00:00:00`
                            )
                          )}
                          {' — '}
                          {formatDate(
                            new Date(
                              `${phase.endDate}T00:00:00`
                            )
                          )}
                        </div>
                      </div>

                      <div className="week-grid">
                        {weeks.map((week) => (
                          <div
                            className="week-card"
                            key={`${phase.id}-${week.weekNumber}`}
                          >
                            <span className="week-number">
                              Week {week.weekNumber}
                            </span>

                            <strong>
                              {week.startDate}
                            </strong>

                            <span className="week-to">
                              to
                            </span>

                            <strong>
                              {week.endDate}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default WeeklyPlanningPage;