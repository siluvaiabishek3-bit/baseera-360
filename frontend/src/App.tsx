import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailsPage from "@/pages/ProjectDetailsPage";
import InspectionViewerPage from "@/pages/InspectionViewerPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import SettingsPage from "@/pages/SettingsPage";
import CADViewerPage from "@/pages/CADViewerPage";
import ModelViewerPage from "@/pages/ModelViewerPage";
import MultiImageViewerPage from "@/pages/MultiImageViewerPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Layout><DashboardPage /></Layout>} />
        <Route path="/projects" element={<Layout><ProjectsPage /></Layout>} />
        <Route path="/projects/:id" element={<Layout><ProjectDetailsPage /></Layout>} />
        <Route path="/projects/:id/cad" element={<Layout><CADViewerPage /></Layout>} />
        <Route path="/projects/:id/model" element={<Layout><ModelViewerPage /></Layout>} />
        <Route path="/projects/:id/images" element={<Layout><MultiImageViewerPage /></Layout>} />
        <Route path="/analytics" element={<Layout><AnalyticsPage /></Layout>} />
        <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
        <Route path="/projects/:projectId/inspection/:imageId" element={<InspectionViewerPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;