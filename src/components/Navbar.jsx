import { NavLink } from 'react-router-dom';

function Navbar() {
  const getNavClass = ({ isActive }) =>
    isActive ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-title">
        PPBMA
      </div>

      <div className="navbar-links">
        <NavLink
          to="/dashboard"
          className={getNavClass}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/projects"
          className={getNavClass}
        >
          Project Master
        </NavLink>

        <NavLink
          to="/project-phases"
          className={getNavClass}
        >
          Project Phases
        </NavLink>

        <NavLink
          to="/weekly-planning"
          className={getNavClass}
        >
          Weekly Planning
        </NavLink>

        <NavLink
          to="/resource-allocation"
          className={getNavClass}
        >
          Resource Allocation
        </NavLink>

        <NavLink
          to="/project-plan"
          className={getNavClass}
        >
          Project Plan
        </NavLink>

        <NavLink
          to="/business-partners"
          className={getNavClass}
        >
          Business Partner
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;