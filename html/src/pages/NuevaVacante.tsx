import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, TextField, Button, MenuItem,
  Card, CardContent, CircularProgress, Alert, Grid, Divider,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import api from '../api/axios'

const nivelesIdioma = ['Ninguno', 'Básico', 'Intermedio', 'Avanzado', 'Nativo']
const areasProfesionales = ['Tecnología','Ventas','Marketing','Finanzas','RRHH','Operaciones','Legal','Diseño','Otro']

export default function NuevaVacante() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    puesto: '', empresa: '', descripcion: '', anios_exp: '',
    habilidades_requeridas: '', ingles: 'Intermedio', espanol: 'Nativo',
    otros: '', area: '', fecha_inicio: '', fecha_fin: '',
  })

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/vacante', {
        ...form,
        fecha_inicio: form.fecha_inicio || null,
        fecha_fin: form.fecha_fin || null,
        area: form.area || null,
      })
      navigate(`/vacante/${res.data.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error creando vacante')
    } finally {
      setLoading(false)
    }
  }

  const sectionLabel = {
    fontWeight: 600, mb: 2, color: 'text.secondary',
    fontSize: '0.75rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em',
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Nueva vacante</Typography>
        <Typography variant="body2" color="text.secondary">
          Completa los requisitos para que la IA evalúe correctamente a los candidatos
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>

            <Typography variant="subtitle1" sx={sectionLabel}>Información del puesto</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Título del puesto" required value={form.puesto} onChange={f('puesto')}
                  placeholder="Ej: Ejecutivo de Ventas Senior" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth select label="Área profesional" required value={form.area} onChange={f('area')}>
                  <MenuItem value=""><em>Seleccionar</em></MenuItem>
                  {areasProfesionales.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Empresa o proyecto" required value={form.empresa} onChange={f('empresa')}
                  placeholder="Ej: Empresa S.A. de C.V." />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Años de experiencia requeridos" required value={form.anios_exp} onChange={f('anios_exp')}
                  placeholder="Ej: 3-5" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Descripción del rol" required multiline minRows={5} maxRows={18}
                  value={form.descripcion} onChange={f('descripcion')}
                  placeholder="Describe las responsabilidades, objetivos y contexto del puesto..." />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={sectionLabel}>Requisitos</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Habilidades y conocimientos requeridos" required multiline rows={2}
                  value={form.habilidades_requeridas} onChange={f('habilidades_requeridas')}
                  placeholder="Ej: Excel avanzado, atención al cliente, inglés B2, Salesforce..." />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Inglés requerido" value={form.ingles} onChange={f('ingles')}>
                  {nivelesIdioma.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Español requerido" value={form.espanol} onChange={f('espanol')}>
                  {nivelesIdioma.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Otros requisitos (opcional)" multiline rows={2}
                  value={form.otros} onChange={f('otros')}
                  placeholder="Ej: Disponibilidad para viajar, certificaciones, licencia de conducir..." />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={sectionLabel}>Vigencia (opcional)</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fecha de inicio" type="date" value={form.fecha_inicio} onChange={f('fecha_inicio')}
                  InputLabelProps={{ shrink: true }}
                  helperText="Si se deja vacío, la vacante estará disponible inmediatamente" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Fecha de cierre" type="date" value={form.fecha_fin} onChange={f('fecha_fin')}
                  InputLabelProps={{ shrink: true }}
                  helperText="La vacante se cerrará automáticamente en esta fecha" />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={loading}>Cancelar</Button>
              <Button
                type="submit" variant="contained" size="large" disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Add />}
              >
                {loading ? 'Creando...' : 'Crear vacante'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
