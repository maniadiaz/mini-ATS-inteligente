import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, Chip, IconButton, InputAdornment,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Register() {
  const [form, setForm] = useState({
    nombre_empresa: '',
    rfc: '',
    email: '',
    password: '',
    nombre_admin: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const trialDays = import.meta.env.VITE_TRIAL_DAYS || '14'

  const passwordsMatch = form.password === confirmPassword
  const showMismatch = confirmPassword.length > 0 && !passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await api.post('/auth/register', form)
      login(res.data.token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  const passwordAdornment = (show: boolean, toggle: () => void) => ({
    input: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            onClick={toggle}
            edge="end"
            size="small"
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {show ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
    },
  })

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 480, p: 2 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
            ATS Pro
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 1 }}>
            Registra tu empresa y comienza a reclutar con IA
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Chip label={`${trialDays} días gratis`} color="success" size="small" />
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Nombre de la empresa" required
              value={form.nombre_empresa}
              onChange={(e) => setForm({ ...form, nombre_empresa: e.target.value })}
              margin="normal" autoFocus
            />
            <TextField
              fullWidth label="RFC (opcional)"
              value={form.rfc}
              onChange={(e) => setForm({ ...form, rfc: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth label="Email" required type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth label="Contraseña" required
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              margin="normal"
              helperText="Mínimo 6 caracteres"
              slotProps={passwordAdornment(showPassword, () => setShowPassword(!showPassword))}
            />
            <TextField
              fullWidth label="Confirmar contraseña" required
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              error={showMismatch}
              helperText={showMismatch ? 'Las contraseñas no coinciden' : ''}
              slotProps={passwordAdornment(showConfirm, () => setShowConfirm(!showConfirm))}
            />
            <TextField
              fullWidth label="Nombre del administrador" required
              value={form.nombre_admin}
              onChange={(e) => setForm({ ...form, nombre_admin: e.target.value })}
              margin="normal"
            />
            <Button
              fullWidth type="submit" variant="contained" size="large"
              disabled={loading || showMismatch} sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear cuenta'}
            </Button>
          </Box>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'inherit', fontWeight: 600 }}>
              Iniciar sesión
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
