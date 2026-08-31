import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';

import DashboardPage from './pages/DashboardPage';
import ProjectMasterPage from './pages/ProjectMasterPage';
import BusinessPartnerPage from './pages/BusinessPartnerPage';
import ProjectPhasesPage from './pages/ProjectPhasesPage';
import WeeklyPlanningPage from './pages/WeeklyPlanningPage';
import ResourceAllocationPage from './pages/ResourceAllocationPage';
import ProjectPlanPage from './pages/ProjectPlanPage';

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/projects"
          element={<ProjectMasterPage />}
        />

        <Route
          path="/business-partners"
          element={<BusinessPartnerPage />}
        />

        <Route
          path="/project-phases"
          element={<ProjectPhasesPage />}
        />

        <Route
          path="/weekly-planning"
          element={<WeeklyPlanningPage />}
        />

        <Route
          path="/resource-allocation"
          element={<ResourceAllocationPage />}
        />

        <Route
          path="/project-plan"
          element={<ProjectPlanPage />}
        />
      </Routes>
    </>
  );
}

export default App;