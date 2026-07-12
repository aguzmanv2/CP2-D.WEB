import { Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleGuard from './RoleGuard.jsx';
import { ROLES } from '../constants/auth.js';
import LoginPage from '../pages/LoginPage.jsx';
import RegisterPage from '../pages/RegisterPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import PacientesPage from '../pages/PacientesPage.jsx';
import MedicosPage from '../pages/MedicosPage.jsx';
import EspecialidadesPage from '../pages/EspecialidadesPage.jsx';
import CitasPage from '../pages/CitasPage.jsx';
import TurnosPage from '../pages/TurnosPage.jsx';
import ReportesPage from '../pages/ReportesPage.jsx';
import ControlUsuariosPage from '../pages/ControlUsuariosPage.jsx';
import PerfilPage from '../pages/PerfilPage.jsx';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        }
      />
      <Route
        path="/register"
        element={
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<RoleGuard allowedRoles={[ROLES.ADMINISTRADOR]} />}>
            <Route path="/usuarios" element={<ControlUsuariosPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA]} />}>
            <Route path="/pacientes" element={<PacientesPage />} />
            <Route path="/medicos" element={<MedicosPage />} />
            <Route path="/especialidades" element={<EspecialidadesPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO]} />}>
            <Route path="/citas" element={<CitasPage />} />
          </Route>
          <Route element={<RoleGuard allowedRoles={[ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.MEDICO, ROLES.PACIENTE]} />}>
            <Route path="/turnos" element={<TurnosPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
