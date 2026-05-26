import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Button, Box, Container,
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, Alert,
} from '@mui/material'
import {
  People, CreditCard, Business, Payment, Settings, Work, Dashboard as DashboardIcon,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const DRAWER_WIDTH = 220

export default function Layout() {
  const { logout, role, companyStatus, companyNombre, isSuperAdmin, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [cvPorcentaje, setCvPorcentaje] = useState(0)
  const [cvDisponibles, setCvDisponibles] = useState<number | null>(null)

  useEffect(() => {
    if (!isSuperAdmin && isAdmin) {
      api.get('/admin/suscripcion')
        .then((res) => {
          setCvPorcentaje(res.data.company?.cv_porcentaje || 0)
          setCvDisponibles(res.data.company?.cv_disponibles ?? null)
        })
        .catch(() => {})
    }
  }, [location.pathname])

  const navItems = (() => {
    if (isSuperAdmin) {
      return [
        { label: 'Dashboard', icon: <DashboardIcon />, path: '/superadmin/dashboard' },
        { label: 'Empresas', icon: <Business />, path: '/superadmin/empresas' },
        { label: 'Pagos', icon: <Payment />, path: '/superadmin/pagos' },
        { label: 'Plan', icon: <Settings />, path: '/superadmin/plan' },
      ]
    }
    const items = [
      { label: 'Vacantes', icon: <Work />, path: '/dashboard' },
    ]
    if (role === 'admin') {
      items.push(
        { label: 'Usuarios', icon: <People />, path: '/admin/usuarios' },
        { label: 'Suscripción', icon: <CreditCard />, path: '/admin/suscripcion' },
      )
    }
    return items
  })()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1} sx={{ zIndex: 1201 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ATS Pro {companyNombre ? `— ${companyNombre}` : ''}
          </Typography>
          <Button color="inherit" onClick={logout}>
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>

      {/* Banners */}
      {!isSuperAdmin && companyStatus === 'trial' && (
        <Alert severity="warning" sx={{ borderRadius: 0 }} action={
          <Button color="inherit" size="small" onClick={() => navigate('/admin/suscripcion')}>
            Activar →
          </Button>
        }>
          Tu prueba gratuita está activa — Activa tu suscripción para no perder acceso.
        </Alert>
      )}
      {!isSuperAdmin && companyStatus === 'suspended' && (
        <Alert severity="error" sx={{ borderRadius: 0 }} action={
          <Button color="inherit" size="small" onClick={() => navigate('/admin/suscripcion')}>
            Renovar →
          </Button>
        }>
          Cuenta suspendida — Renueva tu suscripción para continuar.
        </Alert>
      )}
      {!isSuperAdmin && cvDisponibles === 0 && (
        <Alert severity="error" sx={{ borderRadius: 0 }} action={
          <Button color="inherit" size="small" onClick={() => navigate('/admin/suscripcion')}>
            Comprar →
          </Button>
        }>
          Sin CVs disponibles — No puedes analizar más CVs este mes.
        </Alert>
      )}
      {!isSuperAdmin && cvDisponibles !== null && cvDisponibles > 0 && cvPorcentaje >= 80 && cvPorcentaje < 100 && (
        <Alert severity="warning" sx={{ borderRadius: 0 }} action={
          <Button color="inherit" size="small" onClick={() => navigate('/admin/suscripcion')}>
            Comprar extra →
          </Button>
        }>
          Llevas el {cvPorcentaje}% de tus CVs este mes — Compra un paquete extra.
        </Alert>
      )}

      <Box sx={{ display: 'flex', flex: 1 }}>
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, position: 'relative' },
          }}
        >
          <List sx={{ pt: 2 }}>
            {navItems.map((item) => (
              <ListItemButton
                key={item.path}
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>

        <Container maxWidth="xl" sx={{ flex: 1, py: 4 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
