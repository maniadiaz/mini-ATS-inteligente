import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, TextField, Button, Typography,
  Alert, CircularProgress, IconButton, InputAdornment, useTheme,
} from '@mui/material'
import {
  Visibility, VisibilityOff, PersonOutline, LockOutlined, WorkspacePremium,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>

      {/* Left column: branding */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '42%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1A3C5E 0%, #1565C0 60%, #2196F3 100%)',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'relative', textAlign: 'center', maxWidth: 360 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 4 }}>
            <WorkspacePremium sx={{ color: 'white', fontSize: 48 }} />
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>ATS Pro</Typography>
          </Box>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 2, lineHeight: 1.3 }}>
            Recluta de forma inteligente
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
            Analiza CVs con IA, gestiona candidatos y encuentra al mejor talento para tu empresa.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5, textAlign: 'left' }}>
            {['Análisis de CVs con GPT-4o', 'Score automático por candidato', 'Multi-usuario por empresa', 'Exportación a Excel'].map((feat) => (
              <Box key={feat} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.6)', flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{feat}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right column: form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 6 } }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1, mb: 4 }}>
            <WorkspacePremium sx={{ color: 'primary.main', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>ATS Pro</Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Bienvenido de vuelta</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Ingresa tus credenciales para continuar
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Correo electrónico"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutline fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 1, py: 1.5 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Iniciar sesión'}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              Regístrate aquí
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
