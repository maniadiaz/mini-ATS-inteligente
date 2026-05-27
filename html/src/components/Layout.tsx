import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar, Toolbar, Typography, Box, Drawer, List,
  ListItemButton, ListItemIcon, ListItemText, Alert, Button,
  Tooltip, IconButton, alpha, useTheme, Divider, Avatar, Chip,
} from '@mui/material'
import {
  Dashboard as DashboardIcon, Work, People, Settings, Business,
  Payments, Tune, LightMode, DarkMode, Logout,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { useThemeMode } from '../context/ThemeContext'
import api from '../api/axios'

const DRAWER_WIDTH = 248

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
}

type NavItem = {
  label: string
  icon: JSX.Element
  path: string
  group?: string
}

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

  const navItems: NavItem[] = (() => {
    if (isSuperAdmin) {
      return [
        { label: 'PRINCIPAL', icon: <></>, path: '', group: 'section' },
        { label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 18 }} />, path: '/superadmin/dashboard', group: 'admin' },
        { label: 'Empresas', icon: <Business sx={{ fontSize: 18 }} />, path: '/superadmin/empresas', group: 'admin' },
        { label: 'Vacantes', icon: <Work sx={{ fontSize: 18 }} />, path: '/superadmin/vacantes', group: 'admin' },
        { label: 'Pagos', icon: <Payments sx={{ fontSize: 18 }} />, path: '/superadmin/pagos', group: 'admin' },
        { label: 'Plan', icon: <Tune sx={{ fontSize: 18 }} />, path: '/superadmin/plan', group: 'admin' },
        { label: 'MI CUENTA', icon: <></>, path: '', group: 'section' },
        { label: 'Mis vacantes', icon: <Work sx={{ fontSize: 18 }} />, path: '/dashboard', group: 'personal' },
        { label: 'Mi empresa', icon: <Business sx={{ fontSize: 18 }} />, path: '/admin/empresa', group: 'personal' },
      ]
    }
    const items: NavItem[] = [
      { label: 'PRINCIPAL', icon: <></>, path: '', group: 'section' },
      { label: 'Vacantes', icon: <Work sx={{ fontSize: 18 }} />, path: '/dashboard' },
    ]
    if (role === 'admin') {
      items.push(
        { label: 'CUENTA', icon: <></>, path: '', group: 'section' },
        { label: 'Usuarios', icon: <People sx={{ fontSize: 18 }} />, path: '/admin/usuarios' },
        { label: 'Mi empresa', icon: <Business sx={{ fontSize: 18 }} />, path: '/admin/empresa' },
        { label: 'Configuración', icon: <Settings sx={{ fontSize: 18 }} />, path: '/admin/configuracion' },
      )
    }
    return items
  })()

  const isActive = (path: string) =>
    path !== '' && (location.pathname === path || location.pathname.startsWith(path + '/'))

  const displayName = companyNombre || (isSuperAdmin ? 'Super Admin' : 'Usuario')

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ── AppBar ── */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 1, minHeight: 64 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 'auto' }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '9px',
              background: 'linear-gradient(135deg, #1A3C5E 0%, #1565C0 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 26 26" fill="none">
                <rect x="3" y="8" width="20" height="15" rx="2" stroke="white" strokeWidth="2"/>
                <path d="M9 8V6a4 4 0 0 1 8 0v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Box>
            <Typography variant="h6" sx={{
              fontFamily: '"Sora", sans-serif', fontWeight: 700,
              letterSpacing: '-0.3px', color: 'text.primary',
            }}>
              ATS Pro
            </Typography>
            {companyNombre && (
              <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                · {companyNombre}
              </Typography>
            )}
          </Box>

          {/* Right controls */}
          <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
            <IconButton onClick={toggleTheme} size="small" sx={{ color: 'text.secondary' }}>
              {mode === 'light' ? <DarkMode sx={{ fontSize: 18 }} /> : <LightMode sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>

          <Box sx={{
            width: '1px', height: 20, bgcolor: 'divider', mx: 0.5,
          }} />

          {/* User avatar + chip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{
              width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700,
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main',
            }}>
              {getInitials(displayName)}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', display: 'block', lineHeight: 1.2 }}>
                {displayName}
              </Typography>
              {isSuperAdmin && (
                <Chip label="Super Admin" size="small" color="primary"
                  sx={{ height: 16, fontSize: '0.62rem', mt: 0.25 }} />
              )}
            </Box>
          </Box>

          <Tooltip title="Cerrar sesión">
            <IconButton onClick={logout} size="small" sx={{ ml: 0.5, color: 'text.secondary' }}>
              <Logout sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar ── */}
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
        <Box sx={{ pt: 2, pb: 2 }}>
          <List disablePadding>
            {navItems.map((item, idx) => {
              if (item.group === 'section') {
                return (
                  <Typography
                    key={`section-${idx}`}
                    variant="caption"
                    sx={{
                      display: 'block', px: 2.5, pt: idx === 0 ? 0 : 2, pb: 0.75,
                      fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.65rem',
                      color: 'text.disabled', textTransform: 'uppercase',
                    }}
                  >
                    {item.label}
                  </Typography>
                )
              }

              const active = isActive(item.path)
              return (
                <ListItemButton
                  key={item.path}
                  selected={active}
                  onClick={() => navigate(item.path)}
                  sx={{
                    mx: 1.5, mb: 0.25, borderRadius: 2,
                    pl: active ? 1.5 : 2,
                    borderLeft: active ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                    transition: 'all 0.15s ease',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.09),
                      color: 'primary.main',
                      '& .MuiListItemIcon-root': { color: 'primary.main' },
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.13) },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: active ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { fontSize: '0.86rem', fontWeight: active ? 600 : 400 } }}
                  />
                </ListItemButton>
              )
            })}
          </List>
        </Box>
      </Drawer>

      {/* ── Main ── */}
      <Box
        component="main"
        sx={{ flexGrow: 1, minWidth: 0, pt: '64px', display: 'flex', flexDirection: 'column' }}
      >
        {/* Trial banner */}
        {!isSuperAdmin && companyStatus === 'trial' && daysLeftTrial !== null && (
          <Alert
            severity="info"
            action={<Button size="small" color="inherit" onClick={() => navigate('/admin/configuracion')}>Activar ahora</Button>}
            sx={{ borderRadius: 0, border: 'none', borderBottom: '1px solid', borderColor: 'info.light' }}
          >
            {daysLeftTrial > 0
              ? `Período de prueba: ${daysLeftTrial} día${daysLeftTrial !== 1 ? 's' : ''} restante${daysLeftTrial !== 1 ? 's' : ''}`
              : 'Tu período de prueba ha terminado'}
          </Alert>
        )}
        {!isSuperAdmin && (companyStatus === 'suspended' || companyStatus === 'cancelled') && (
          <Alert
            severity="error"
            action={<Button size="small" color="inherit" onClick={() => navigate('/admin/configuracion')}>Reactivar</Button>}
            sx={{ borderRadius: 0, border: 'none', borderBottom: '1px solid', borderColor: 'error.light' }}
          >
            Tu suscripción está suspendida. Reactiva para continuar usando el servicio.
          </Alert>
        )}

        <Box sx={{
          flexGrow: 1, width: '100%', maxWidth: 1200,
          mx: 'auto', px: { xs: 2, md: 4 }, py: 4,
        }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
