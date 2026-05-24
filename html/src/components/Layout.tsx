import { Outlet } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { logout } = useAuth()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            ATS Inteligente
          </Typography>
          <Button color="inherit" onClick={logout}>
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
