import { Link } from 'react-router-dom';

function DashboardPage() {
  return (
    <div className="page-wrap">
      <div className="card dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1>📊 Project Planning Dashboard</h1>
            <p className="page-description">
              Manage projects, project phases, weekly planning and resource
              allocation from one place.
            </p>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-label">Total Projects</span>
            <strong className="stat-value">0</strong>
            <span className="stat-description">
              Projects registered in the system
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Active Projects</span>
            <strong className="stat-value">0</strong>
            <span className="stat-description">
              Projects currently in progress
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Project Phases</span>
            <strong className="stat-value">19</strong>
            <span className="stat-description">
              Standard planning phases
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Allocated Resources</span>
            <strong className="stat-value">0</strong>
            <span className="stat-description">
              Employees currently allocated
            </span>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Project Planning</h2>

          <div className="dashboard-actions">
            <Link to="/projects" className="dashboard-action-card">
              <div className="action-icon">📁</div>

              <div>
                <h3>Project Master</h3>
                <p>
                  Create and manage project information.
                </p>
              </div>
            </Link>

            <Link
              to="/project-phases"
              className="dashboard-action-card"
            >
              <div className="action-icon">🗂️</div>

              <div>
                <h3>Project Phases</h3>
                <p>
                  Define phase start dates and end dates.
                </p>
              </div>
            </Link>

            <Link
              to="/weekly-planning"
              className="dashboard-action-card"
            >
              <div className="action-icon">📅</div>

              <div>
                <h3>Weekly Planning</h3>
                <p>
                  View the weeks generated within each project phase.
                </p>
              </div>
            </Link>

            <Link
              to="/resource-allocation"
              className="dashboard-action-card"
            >
              <div className="action-icon">👥</div>

              <div>
                <h3>Resource Allocation</h3>
                <p>
                  Assign employees and resources to project work.
                </p>
              </div>
            </Link>

            <Link
              to="/project-plan"
              className="dashboard-action-card"
            >
              <div className="action-icon">📈</div>

              <div>
                <h3>Project Plan View</h3>
                <p>
                  View phases, weeks and allocated employees together.
                </p>
              </div>
            </Link>

            <Link
              to="/business-partners"
              className="dashboard-action-card"
            >
              <div className="action-icon">🤝</div>

              <div>
                <h3>Business Partners</h3>
                <p>
                  Create and manage project business partners.
                </p>
              </div>
            </Link>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Planning Workflow</h2>

          <div className="workflow">
            <div className="workflow-step">
              <span>1</span>
              <strong>Create Project</strong>
            </div>

            <div className="workflow-arrow">→</div>

            <div className="workflow-step">
              <span>2</span>
              <strong>Define Phases</strong>
            </div>

            <div className="workflow-arrow">→</div>

            <div className="workflow-step">
              <span>3</span>
              <strong>Generate Weeks</strong>
            </div>

            <div className="workflow-arrow">→</div>

            <div className="workflow-step">
              <span>4</span>
              <strong>Allocate Employees</strong>
            </div>

            <div className="workflow-arrow">→</div>

            <div className="workflow-step">
              <span>5</span>
              <strong>View Project Plan</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;