import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NuevaVacante from './pages/NuevaVacante'
import VacanteDashboard from './pages/VacanteDashboard'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import AdminSuscripcion from './pages/admin/AdminSuscripcion'
import SuperAdminEmpresas from './pages/superadmin/SuperAdminEmpresas'
import SuperAdminPagos from './pages/superadmin/SuperAdminPagos'
import SuperAdminPlan from './pages/superadmin/SuperAdminPlan'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes — redirect to dashboard if already logged in */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes for all authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vacante/nueva" element={<NuevaVacante />} />
            <Route path="/vacante/:vid" element={<VacanteDashboard />} />
          </Route>
        </Route>

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
          <Route element={<Layout />}>
            <Route path="/admin/usuarios" element={<AdminUsuarios />} />
            <Route path="/admin/suscripcion" element={<AdminSuscripcion />} />
          </Route>
        </Route>

        {/* Superadmin routes */}
        <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
          <Route element={<Layout />}>
            <Route path="/superadmin/empresas" element={<SuperAdminEmpresas />} />
            <Route path="/superadmin/pagos" element={<SuperAdminPagos />} />
            <Route path="/superadmin/plan" element={<SuperAdminPlan />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
