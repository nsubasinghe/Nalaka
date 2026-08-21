import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProjectMasterPage from './pages/ProjectMasterPage';
import BusinessPartnerPage from './pages/BusinessPartnerPage';

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<Navigate to="/projects" replace />}
        />

        <Route
          path="/projects"
          element={<ProjectMasterPage />}
        />

        <Route
          path="/business-partners"
          element={<BusinessPartnerPage />}
        />
      </Routes>
    </>
  );
}

export default App;