import {
  NavLink
} from 'react-router-dom';

function Navbar({
  user,
  onLogout,
  loggingOut = false
}) {
  const getNavClass =
    ({
      isActive
    }) =>
      isActive
        ? 'sidebar-link active'
        : 'sidebar-link';

  return (
    <aside className="sidebar">

      {/* =====================================================
          HEADER
      ===================================================== */}

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

      {/* =====================================================
          NAVIGATION
      ===================================================== */}

      <nav className="sidebar-navigation">

        {/* DASHBOARD */}

        <NavLink
          to="/dashboard"
          className={
            getNavClass
          }
        >
          <span className="sidebar-icon">
            ▦
          </span>

          <span>
            Dashboard
          </span>
        </NavLink>

        {/* PROJECT MASTER */}

        <NavLink
          to="/projects"
          className={
            getNavClass
          }
        >
          <span className="sidebar-icon">
            ◫
          </span>

          <span>
            Project Master
          </span>
        </NavLink>

        {/* BUSINESS PARTNER */}

        <NavLink
          to="/business-partners"
          className={
            getNavClass
          }
        >
          <span className="sidebar-icon">
            ◉
          </span>

          <span>
            Business Partner
          </span>
        </NavLink>

        {/* PROJECT PHASES */}

        <NavLink
          to="/project-phases"
          className={
            getNavClass
          }
        >
          <span className="sidebar-icon">
            ◇
          </span>

          <span>
            Project Phases
          </span>
        </NavLink>

        {/* PROJECT PHASE ASSIGNMENT */}

        <NavLink
          to="/project-phase-assignment"
          className={
            getNavClass
          }
        >
          <span className="sidebar-icon">
            ⇄
          </span>

          <span>
            Project Phase Assignment
          </span>
        </NavLink>

        {/* RESOURCE MASTER */}

        <NavLink
          to="/resource-master"
          className={
            getNavClass
          }
        >
          <span className="sidebar-icon">
            ♙
          </span>

          <span>
            Resource Master
          </span>
        </NavLink>

        {/* PROJECT PLAN */}

        <NavLink
          to="/project-plan"
          className={
            getNavClass
          }
        >
          <span className="sidebar-icon">
            ▥
          </span>

          <span>
            Project Plan
          </span>
        </NavLink>
      </nav>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="sidebar-footer">

        {user && (
          <div
            style={{
              marginBottom:
                '12px',
              overflowWrap:
                'anywhere'
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
          onClick={
            onLogout
          }
          disabled={
            loggingOut ||
            !onLogout
          }
          style={{
            display:
              'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            gap:
              '8px',
            width:
              '100%',
            padding:
              '11px 14px',
            marginBottom:
              '14px',
            border:
              'none',
            borderRadius:
              '8px',
            background:
              '#ffffff',
            color:
              '#174679',
            fontWeight:
              600,
            cursor:
              loggingOut
                ? 'wait'
                : 'pointer'
          }}
        >
          <span
            aria-hidden="true"
          >
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