import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, TextField, Button, Typography, Alert,
  CircularProgress, IconButton, InputAdornment, useTheme,
} from '@mui/material'
import { Visibility, VisibilityOff, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const steps = [
  { icon: '🏢', title: 'Crea tu cuenta', desc: 'En menos de 2 minutos' },
  { icon: '⏱️', title: '14 días gratis', desc: 'Sin tarjeta de crédito' },
  { icon: '🤖', title: 'Analiza CVs con IA', desc: 'Resultados inmediatos' },
]

function passwordStrength(p: string): number {
  let s = 0
  if (p.length >= 6) s++
  if (p.length >= 10) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9!@#$%^&*]/.test(p)) s++
  return s
}

const strengthColors = ['#E5E7EB', '#EF4444', '#F59E0B', '#3B82F6', '#16A34A']
const strengthLabels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']

export default function Register() {
  const [form, setForm] = useState({
    nombre_empresa: '', rfc: '', email: '', password: '', nombre_admin: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const trialDays = import.meta.env.VITE_TRIAL_DAYS || '14'

  const passwordsMatch = form.password === confirmPassword
  const showMismatch = confirmPassword.length > 0 && !passwordsMatch
  const strength = passwordStrength(form.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!passwordsMatch) { setError('Las contraseñas no coinciden'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token)
      navigate(res.data.redirectTo || '/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>

      {/* ── Left panel ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '42%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1A3C5E 0%, #1565C0 60%, #2196F3 100%)',
          p: 7,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box className="dot-grid" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <Box sx={{ position: 'relative', maxWidth: 340 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 26 26" fill="none">
                <rect x="3" y="8" width="20" height="15" rx="2" stroke="white" strokeWidth="2"/>
                <path d="M9 8V6a4 4 0 0 1 8 0v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Box>
            <Typography variant="h4" sx={{ color: 'white', fontFamily: '"Sora", sans-serif', fontWeight: 700 }}>ATS Pro</Typography>
          </Box>

          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            bgcolor: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '100px', px: 2, py: 0.75, mb: 3,
          }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4ADE80' }} />
            <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
              {trialDays} días gratis — sin tarjeta
            </Typography>
          </Box>

          <Typography variant="h3" sx={{
            color: 'white', fontFamily: '"Sora", sans-serif',
            fontWeight: 800, mb: 1.5, lineHeight: 1.2,
            fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
          }}>
            Empieza a reclutar de forma inteligente
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 5, lineHeight: 1.7 }}>
            Únete a cientos de empresas que ya contratan mejor con IA.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {steps.map((s, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', flexShrink: 0,
                }}>
                  {s.icon}
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.3 }}>{s.title}</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>{s.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Right panel ── */}
      <Box sx={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: { xs: 3, sm: 5 }, overflowY: 'auto',
      }}>
        <Box sx={{ width: '100%', maxWidth: 440 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 4 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
                <rect x="3" y="8" width="20" height="15" rx="2" stroke="white" strokeWidth="2"/>
                <path d="M9 8V6a4 4 0 0 1 8 0v2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </Box>
            <Typography variant="h6" sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700 }}>ATS Pro</Typography>
          </Box>

          <Box className="animate-fadeInUp">
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '-0.3px' }}>
              Crea tu cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              {trialDays} días gratis, sin tarjeta. Analiza hasta <strong>10 CVs con IA</strong>.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')} className="animate-fadeIn">
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
                Empresa
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField fullWidth label="Nombre de la empresa" required size="medium"
                  value={form.nombre_empresa} onChange={f('nombre_empresa')} autoFocus
                  placeholder="Ej: Empresa S.A. de C.V." />
                <TextField fullWidth label="RFC (opcional)" size="medium"
                  value={form.rfc} onChange={f('rfc')} placeholder="Ej: EMP123456ABC" />
              </Box>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}>
                Administrador
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField fullWidth label="Tu nombre completo" required size="medium"
                  value={form.nombre_admin} onChange={f('nombre_admin')} />
                <TextField fullWidth label="Correo electrónico" type="email" required size="medium"
                  value={form.email} onChange={f('email')} autoComplete="email" />
                <Box>
                  <TextField
                    fullWidth label="Contraseña" required size="medium"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={f('password')}
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {form.password.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                        {[1, 2, 3, 4].map((i) => (
                          <Box key={i} sx={{
                            flex: 1, height: 3, borderRadius: 2,
                            bgcolor: i <= strength ? strengthColors[strength] : 'divider',
                            transition: 'background-color 0.2s ease',
                          }} />
                        ))}
                      </Box>
                      <Typography variant="caption" sx={{ color: strengthColors[strength] || 'text.secondary' }}>
                        {strengthLabels[strength] || 'Débil'}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <TextField
                  fullWidth label="Confirmar contraseña" required size="medium"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={showMismatch}
                  helperText={showMismatch ? 'Las contraseñas no coinciden' : ''}
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {confirmPassword.length > 0 && (
                          passwordsMatch
                            ? <CheckCircle fontSize="small" color="success" />
                            : <RadioButtonUnchecked fontSize="small" color="error" />
                        )}
                        <IconButton size="small" onClick={() => setShowConfirm(!showConfirm)} edge="end" sx={{ ml: 0.5 }}>
                          {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>

            <Button type="submit" variant="contained" size="large" fullWidth
              disabled={loading || showMismatch} sx={{ height: 48, mt: 1 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Crear cuenta gratis'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: theme.palette.primary.main, fontWeight: 600, textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
