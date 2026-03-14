import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrganizationsPage from './pages/OrganizationsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import AssignmentsPage from './pages/AssignmentsPage';
import AssignmentDetailPage from './pages/AssignmentDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import UsersPage from './pages/UsersPage';
import MyProjectsPage from './pages/MyProjectsPage';
import MyTasksPage from './pages/MyTasksPage';
import SettingsPage from './pages/SettingsPage';
import ServicesPage from './pages/ServicesPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  return user ? <Navigate to="/" /> : children;
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  const roleName = user.role_name || '';
  if (!roles.includes(roleName)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        {/* Old /organizations path redirects to /clients */}
        <Route path="organizations" element={<Navigate to="/clients" replace />} />
        <Route path="services" element={<RoleRoute roles={['Director', 'Manager']}><ServicesPage /></RoleRoute>} />
        <Route path="clients" element={<RoleRoute roles={['Director', 'Manager']}><OrganizationsPage /></RoleRoute>} />
        <Route path="clients/:id" element={<RoleRoute roles={['Director', 'Manager']}><ClientDetailPage /></RoleRoute>} />
        <Route path="assignments" element={<RoleRoute roles={['Director', 'Manager']}><AssignmentsPage /></RoleRoute>} />
        <Route path="assignments/:id" element={<RoleRoute roles={['Director', 'Manager', 'Senior Consultant']}><AssignmentDetailPage /></RoleRoute>} />
        <Route path="projects" element={<RoleRoute roles={['Director', 'Manager']}><ProjectsPage /></RoleRoute>} />
        <Route path="projects/:id" element={<RoleRoute roles={['Director', 'Manager', 'Senior Consultant']}><ProjectDetailPage /></RoleRoute>} />
        <Route path="users" element={<RoleRoute roles={['Director', 'Manager']}><UsersPage /></RoleRoute>} />
        <Route path="my-projects" element={<RoleRoute roles={['Senior Consultant']}><MyProjectsPage /></RoleRoute>} />
        <Route path="my-tasks" element={<RoleRoute roles={['Consultant']}><MyTasksPage /></RoleRoute>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
