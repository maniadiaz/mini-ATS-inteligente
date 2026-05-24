import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NuevaVacante from './pages/NuevaVacante'
import VacanteDashboard from './pages/VacanteDashboard'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/vacante/nueva" element={<NuevaVacante />} />
            <Route path="/vacante/:vid" element={<VacanteDashboard />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
