import {
  Navigate,
  Route,
  Routes
} from 'react-router-dom';

import Navbar from './components/Navbar';

import DashboardPage from './pages/DashboardPage';
import ProjectMasterPage from './pages/ProjectMasterPage';
import BusinessPartnerPage from './pages/BusinessPartnerPage';
import ProjectPhasesPage from './pages/ProjectPhasesPage';
import ResourceMasterPage from './pages/ResourceMasterPage';
import ResourceAllocationPage from './pages/ResourceAllocationPage';
import ProjectPlanPage from './pages/ProjectPlanPage';
import ProjectFIPage from './pages/ProjectFIPage';

function App() {
  return (
    <div className="app-shell">

      <Navbar />

      <main className="app-main">

        <Routes>

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="/dashboard"
            element={
              <DashboardPage />
            }
          />

          <Route
            path="/projects"
            element={
              <ProjectMasterPage />
            }
          />

          <Route
            path="/business-partners"
            element={
              <BusinessPartnerPage />
            }
          />

          <Route
            path="/project-phases"
            element={
              <ProjectPhasesPage />
            }
          />

          <Route
            path="/resource-master"
            element={
              <ResourceMasterPage />
            }
          />

          <Route
            path="/resource-allocation"
            element={
              <ResourceAllocationPage />
            }
          />

          <Route
            path="/project-plan"
            element={
              <ProjectPlanPage />
            }
          />

          <Route
            path="/project-fi"
            element={
              <ProjectFIPage />
            }
          />

        </Routes>

      </main>

    </div>
  );
}

export default App;