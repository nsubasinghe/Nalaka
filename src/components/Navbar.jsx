import { NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-title">
        PPBMA
      </div>

      <div className="navbar-links">
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          ProjectMaster
        </NavLink>

        <NavLink
          to="/business-partners"
          className={({ isActive }) =>
            isActive ? 'nav-link active' : 'nav-link'
          }
        >
          Business Partner
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;