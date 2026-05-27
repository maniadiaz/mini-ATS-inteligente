import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, TextField, Button, Typography, Alert,
  CircularProgress, IconButton, InputAdornment, useTheme,
} from '@mui/material'
import {
  Visibility, VisibilityOff, PersonOutline, LockOutlined,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const features = [
  { icon: '🤖', text: 'Análisis de CVs con GPT-4o' },
  { icon: '📊', text: 'Score automático por candidato' },
  { icon: '👥', text: 'Multi-usuario por empresa' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      login(res.data.token)
      navigate(res.data.redirectTo || '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>

      {/* ── Left panel: branding ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '46%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #0D2137 0%, #1A3C5E 50%, #1565C0 100%)',
          p: 7,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dot grid overlay */}
        <Box
          className="dot-grid"
          sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />

        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', top: -100, right: -100,
          width: 340, height: 340, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -80, left: -80,
          width: 280, height: 280, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />

        <Box sx={{ position: 'relative', maxWidth: 380, width: '100%' }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: '14px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                <rect x="3" y="8" width="20" height="15" rx="2" stroke="white" strokeWidth="2"/>
                <path d="M9 8V6a4 4 0 0 1 8 0v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="19" cy="7" r="4" fill="#60A5FA"/>
                <path d="M17.5 7l1 1 2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Box>
            <Typography variant="h4" sx={{ color: 'white', fontFamily: '"Sora", sans-serif', fontWeight: 700, letterSpacing: '-0.5px' }}>
              ATS Pro
            </Typography>
          </Box>

          <Typography variant="h3" sx={{
            color: 'white', fontFamily: '"Sora", sans-serif',
            fontWeight: 800, mb: 1.5, lineHeight: 1.15, letterSpacing: '-0.5px',
            fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
          }}>
            Recluta con inteligencia
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.65)', mb: 5, lineHeight: 1.7 }}>
            Analiza CVs con IA y encuentra al mejor talento en minutos, no semanas.
          </Typography>

          {/* Feature list */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 6 }}>
            {features.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', flexShrink: 0,
                }}>
                  {f.icon}
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                  {f.text}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Stat pill */}
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1.5,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '100px', px: 2.5, py: 1,
            backdropFilter: 'blur(8px)',
          }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4ADE80' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              +500 CVs analizados esta semana
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Right panel: form ── */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 3, sm: 6 },
      }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: '12px',
              bgcolor: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
                <rect x="3" y="8" width="20" height="15" rx="2" stroke="white" strokeWidth="2"/>
                <path d="M9 8V6a4 4 0 0 1 8 0v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Box>
            <Typography variant="h5" sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700 }}>ATS Pro</Typography>
          </Box>

          <Box className="animate-fadeInUp">
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '-0.3px' }}>
              Bienvenido de vuelta
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Ingresa tus credenciales para continuar
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}
              className="animate-fadeIn">
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            className={shake ? 'animate-shake' : ''}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <Box className="animate-fadeInUp delay-100">
              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="medium"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutline fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box className="animate-fadeInUp delay-200">
              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="medium"
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
            </Box>

            <Box className="animate-fadeInUp delay-300">
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ height: 48 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Iniciar sesión'}
              </Button>
            </Box>
          </Box>

          <Box className="animate-fadeInUp delay-400" sx={{ mt: 4, textAlign: 'center' }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 2, mb: 3,
              '&::before, &::after': {
                content: '""', flex: 1, height: '1px',
                bgcolor: 'divider',
              },
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                ¿No tienes cuenta?
              </Typography>
            </Box>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                fullWidth
                sx={{ height: 44 }}
              >
                Registra tu empresa
              </Button>
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
