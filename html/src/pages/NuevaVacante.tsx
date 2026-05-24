import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, TextField, Button, MenuItem,
  Card, CardContent, CircularProgress, Alert,
} from '@mui/material'
import api from '../api/axios'

const nivelesIdioma = ['Ninguno', 'Básico', 'Intermedio', 'Avanzado', 'Nativo']

export default function NuevaVacante() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    puesto: '',
    empresa: '',
    descripcion: '',
    anios_exp: '',
    stack: '',
    ingles: 'Intermedio',
    espanol: 'Nativo',
    otros: '',
  })

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/vacante', form)
      navigate(`/vacante/${res.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creando vacante')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Crear Nueva Vacante
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Puesto / Título" required
              value={form.puesto} onChange={handleChange('puesto')}
              margin="normal" placeholder="Ej: Desarrollador Backend Senior"
            />
            <TextField
              fullWidth label="Empresa o Proyecto" required
              value={form.empresa} onChange={handleChange('empresa')}
              margin="normal" placeholder="Ej: TechCorp"
            />
            <TextField
              fullWidth label="Descripción del rol" required multiline minRows={6} maxRows={20}
              value={form.descripcion} onChange={handleChange('descripcion')}
              margin="normal" placeholder={"Describe las responsabilidades y el contexto del puesto...\n\nEjemplo:\n• Desarrollar nuevas funcionalidades\n• Consumir y crear APIs REST\n• Participar en revisiones de código"}
            />
            <TextField
              fullWidth label="Años de experiencia requeridos" required
              value={form.anios_exp} onChange={handleChange('anios_exp')}
              margin="normal" placeholder="Ej: 3-5"
            />
            <TextField
              fullWidth label="Stack tecnológico requerido" required multiline rows={2}
              value={form.stack} onChange={handleChange('stack')}
              margin="normal" placeholder="Ej: React, Node.js, PostgreSQL, Docker"
            />
            <TextField
              fullWidth select label="Inglés requerido"
              value={form.ingles} onChange={handleChange('ingles')}
              margin="normal"
            >
              {nivelesIdioma.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
            <TextField
              fullWidth select label="Español requerido"
              value={form.espanol} onChange={handleChange('espanol')}
              margin="normal"
            >
              {nivelesIdioma.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </TextField>
            <TextField
              fullWidth label="Otros requisitos (opcional)" multiline rows={2}
              value={form.otros} onChange={handleChange('otros')}
              margin="normal" placeholder="Ej: Disponibilidad para viajar, certificaciones..."
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate('/dashboard')}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear Vacante'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
