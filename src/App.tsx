import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import PatientEdit from './pages/PatientEdit';
import Users from './pages/Users';
import Indicators from './pages/Indicators';
import Settings from './pages/Settings';
import Appointments from './pages/Appointments';
import MicroAreas from './pages/MicroAreas';
import Alerts from './pages/Alerts';
import { Vaccines } from './pages/Vaccines';
import { LabExams } from './pages/LabExams';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import DashboardPeriod from './pages/DashboardPeriod';
import Territorialization from './pages/Territorialization';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import Telemedicine from './pages/Telemedicine';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useThemeStore } from './stores/themeStore';

function App() {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetails />} />
          <Route path="patients/:id/edit" element={<PatientEdit />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="vaccines" element={<Vaccines />} />
          <Route path="lab-exams" element={<LabExams />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reports" element={<Reports />} />
          <Route path="dashboard-period" element={<DashboardPeriod />} />
          <Route path="territorialization" element={<Territorialization />} />
          <Route path="predictive" element={<PredictiveAnalytics />} />
          <Route path="telemedicine" element={<Telemedicine />} />
          <Route path="micro-areas" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <MicroAreas />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="indicators" element={<Indicators />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
