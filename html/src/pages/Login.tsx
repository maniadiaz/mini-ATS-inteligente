import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress,
} from '@mui/material'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400, p: 2 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
            ATS Pro
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Inicia sesión para acceder al panel de reclutamiento
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
            </Button>
          </Box>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'inherit', fontWeight: 600 }}>
              Registra tu empresa
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
