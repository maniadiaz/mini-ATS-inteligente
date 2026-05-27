import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Box, Drawer, List,
  ListItemButton, ListItemIcon, ListItemText, Alert, Button,
  Tooltip, IconButton, alpha, useTheme,
} from '@mui/material'
import {
  Dashboard as DashboardIcon, Work, People, Settings, Business,
  Payments, Tune, LightMode, DarkMode, WorkspacePremium, Logout,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { useThemeMode } from '../context/ThemeContext'
import api from '../api/axios'

const DRAWER_WIDTH = 240

export default function Layout() {
  const { logout, role, companyStatus, companyNombre, isSuperAdmin, isAdmin, daysLeftTrial } = useAuth()
  const { mode, toggleTheme } = useThemeMode()
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()

  useEffect(() => {
    if (!isSuperAdmin && isAdmin) {
      api.get('/admin/suscripcion').catch(() => {})
    }
  }, [location.pathname])

  const navItems = (() => {
    if (isSuperAdmin) {
      return [
        { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, path: '/superadmin/dashboard' },
        { label: 'Empresas', icon: <Business fontSize="small" />, path: '/superadmin/empresas' },
        { label: 'Pagos', icon: <Payments fontSize="small" />, path: '/superadmin/pagos' },
        { label: 'Plan', icon: <Tune fontSize="small" />, path: '/superadmin/plan' },
      ]
    }
    const items: { label: string; icon: JSX.Element; path: string }[] = [
      { label: 'Vacantes', icon: <Work fontSize="small" />, path: '/dashboard' },
    ]
    if (role === 'admin') {
      items.push(
        { label: 'Usuarios', icon: <People fontSize="small" />, path: '/admin/usuarios' },
        { label: 'Perfil de empresa', icon: <Business fontSize="small" />, path: '/admin/empresa' },
        { label: 'Configuración', icon: <Settings fontSize="small" />, path: '/admin/configuracion' },
      )
    }
    return items
  })()

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 'auto' }}>
            <WorkspacePremium sx={{ color: 'primary.main', fontSize: 26 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.3px' }}>
              ATS Pro
            </Typography>
            {companyNombre && (
              <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                — {companyNombre}
              </Typography>
            )}
          </Box>
          <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
            <IconButton onClick={toggleTheme} size="small" sx={{ color: 'text.secondary' }}>
              {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Cerrar sesión">
            <IconButton onClick={logout} size="small" sx={{ ml: 0.5, color: 'text.secondary' }}>
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            top: '64px',
            height: 'calc(100% - 64px)',
          },
        }}
      >
        <Box sx={{ pt: 1.5, pb: 2 }}>
          <List disablePadding>
            {navItems.map((item) => {
              const active = isActive(item.path)
              return (
                <ListItemButton
                  key={item.path}
                  selected={active}
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1, mb: 0.5, borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' },
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.15) },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: active ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { fontSize: '0.875rem', fontWeight: active ? 600 : 400 } }}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Box>
      </Drawer>

      {/* Main — ocupa el espacio restante después del drawer */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          pt: '64px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {!isSuperAdmin && companyStatus === 'trial' && daysLeftTrial !== null && (
          <Alert
            severity="info"
            action={<Button size="small" color="inherit" onClick={() => navigate('/admin/configuracion')}>Activar ahora</Button>}
            sx={{ borderRadius: 0, border: 'none' }}
          >
            {daysLeftTrial > 0
              ? `Período de prueba: ${daysLeftTrial} día${daysLeftTrial !== 1 ? 's' : ''} restante${daysLeftTrial !== 1 ? 's' : ''}`
              : 'Tu período de prueba ha terminado'}
          </Alert>
        )}
        {!isSuperAdmin && companyStatus === 'suspended' && (
          <Alert
            severity="error"
            action={<Button size="small" color="inherit" onClick={() => navigate('/admin/configuracion')}>Reactivar</Button>}
            sx={{ borderRadius: 0, border: 'none' }}
          >
            Tu suscripción está suspendida. Reactiva para continuar usando el servicio.
          </Alert>
        )}
        {/* Área de contenido centrada dentro del espacio disponible */}
        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: 1200,
            mx: 'auto',
            px: { xs: 2, md: 4 },
            py: 4,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
