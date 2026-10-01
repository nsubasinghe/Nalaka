import { NavLink } from 'react-router-dom';

function Navbar({
  user,
  onLogout,
  loggingOut = false
}) {
  const getNavClass = ({ isActive }) =>
    isActive
      ? 'sidebar-link active'
      : 'sidebar-link';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-brand">
          PPBMA
        </div>

        <div className="sidebar-subtitle">
          Planning & Project
          <br />
          Baseline Management
        </div>
      </div>

      <nav className="sidebar-navigation">
        <NavLink
          to="/dashboard"
          className={getNavClass}
        >
          <span className="sidebar-icon">
            ▦
          </span>

          <span>
            Dashboard
          </span>
        </NavLink>

        <NavLink
          to="/projects"
          className={getNavClass}
        >
          <span className="sidebar-icon">
            ◫
          </span>

          <span>
            Project Master
          </span>
        </NavLink>

        <NavLink
          to="/business-partners"
          className={getNavClass}
        >
          <span className="sidebar-icon">
            ◉
          </span>

          <span>
            Business Partner
          </span>
        </NavLink>

        <NavLink
          to="/project-phases"
          className={getNavClass}
        >
          <span className="sidebar-icon">
            ◇
          </span>

          <span>
            Project Phases
          </span>
        </NavLink>

        <NavLink
          to="/resource-master"
          className={getNavClass}
        >
          <span className="sidebar-icon">
            ♙
          </span>

          <span>
            Resource Master
          </span>
        </NavLink>

        <NavLink
          to="/resource-allocation"
          className={getNavClass}
        >
          <span className="sidebar-icon">
            ▤
          </span>

          <span>
            Resource Allocation
          </span>
        </NavLink>

        <NavLink
          to="/project-plan"
          className={getNavClass}
        >
          <span className="sidebar-icon">
            ▥
          </span>

          <span>
            Project Plan
          </span>
        </NavLink>

        <NavLink
          to="/project-fi"
          className={getNavClass}
        >
          <span className="sidebar-icon">
            $
          </span>

          <span>
            Project Financials
          </span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div
            style={{
              marginBottom: '12px',
              overflowWrap: 'anywhere'
            }}
          >
            <div className="sidebar-footer-title">
              {user.username}
            </div>

            <div className="sidebar-footer-text">
              {user.roleid}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          disabled={
            loggingOut ||
            !onLogout
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '11px 14px',
            marginBottom: '14px',
            border: 'none',
            borderRadius: '8px',
            background: '#ffffff',
            color: '#174679',
            fontWeight: 600,
            cursor: loggingOut
              ? 'wait'
              : 'pointer'
          }}
        >
          <span aria-hidden="true">
            ↪
          </span>

          {loggingOut
            ? 'Signing out...'
            : 'Sign out'}
        </button>

        <div className="sidebar-footer-title">
          PPBMA
        </div>

        <div className="sidebar-footer-text">
          Project Planning System
        </div>
      </div>
    </aside>
  );
}

export default Navbar;