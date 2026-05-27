import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, TextField, Button, MenuItem,
  Card, CardContent, CircularProgress, Alert, Grid, Divider,
  Switch, FormControlLabel, Breadcrumbs, Link,
} from '@mui/material'
import { Add, NavigateNext, NotificationsActive } from '@mui/icons-material'
import api from '../api/axios'

const nivelesIdioma = ['Ninguno', 'Básico', 'Intermedio', 'Avanzado', 'Nativo']
const areasProfesionales = [
  'Tecnología', 'Ventas', 'Marketing', 'Finanzas', 'RRHH',
  'Operaciones', 'Legal', 'Diseño', 'Servicio al cliente', 'Otro',
]

const sectionStyle = {
  fontWeight: 700, mb: 2, fontSize: '0.72rem',
  textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'text.secondary',
}

export default function NuevaVacante() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    puesto: '', empresa: '', descripcion: '', anios_exp: '',
    habilidades_requeridas: '', ingles: 'Intermedio', espanol: 'Nativo',
    otros: '', area: '', fecha_inicio: '', fecha_fin: '', notify_email: true,
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

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      {/* ── Breadcrumb ── */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component="button" underline="hover" color="text.secondary"
          variant="body2" onClick={() => navigate('/dashboard')} sx={{ cursor: 'pointer' }}
        >
          Vacantes
        </Link>
        <Typography variant="body2" color="text.primary" fontWeight={500}>Nueva vacante</Typography>
      </Breadcrumbs>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25, letterSpacing: '-0.3px' }}>
            Nueva vacante
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Completa los requisitos para que la IA evalúe correctamente a los candidatos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
          <Button variant="outlined" onClick={() => navigate(-1)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit" form="nueva-vacante-form" variant="contained" disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Add />}
          >
            {loading ? 'Creando...' : 'Crear vacante'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <Box
        component="form"
        id="nueva-vacante-form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
      >
        {/* ── Section 1: Información básica ── */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={sectionStyle}>Información del puesto</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Título del puesto *" required size="medium"
                  value={form.puesto} onChange={f('puesto')}
                  placeholder="Ej: Ejecutivo de Ventas Senior" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth select label="Área profesional *" required size="medium"
                  value={form.area} onChange={f('area')}>
                  <MenuItem value=""><em>Seleccionar</em></MenuItem>
                  {areasProfesionales.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField fullWidth label="Empresa o proyecto *" required size="medium"
                  value={form.empresa} onChange={f('empresa')}
                  placeholder="Ej: Acme S.A. de C.V." />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth label="Años de experiencia *" required size="medium"
                  value={form.anios_exp} onChange={f('anios_exp')}
                  placeholder="Ej: 3-5 o mínimo 2" />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ── Section 2: Descripción ── */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={sectionStyle}>Descripción del rol</Typography>
            <TextField
              fullWidth label="Descripción *" required multiline minRows={5} maxRows={18}
              size="medium" value={form.descripcion} onChange={f('descripcion')}
              placeholder="Describe las responsabilidades, objetivos y contexto del puesto..."
              helperText="Una descripción detallada mejora la precisión del análisis IA"
            />
          </CardContent>
        </Card>

        {/* ── Section 3: Requisitos ── */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={sectionStyle}>Requisitos</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Habilidades y conocimientos requeridos *" required
                  multiline rows={3} size="medium"
                  value={form.habilidades_requeridas} onChange={f('habilidades_requeridas')}
                  placeholder="Ej: React, Node.js, trabajo en equipo, inglés B2, Salesforce..."
                  helperText="Separa cada habilidad con coma. Sé específico para mejores resultados."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Inglés requerido" size="medium"
                  value={form.ingles} onChange={f('ingles')}>
                  {nivelesIdioma.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth select label="Español requerido" size="medium"
                  value={form.espanol} onChange={f('espanol')}>
                  {nivelesIdioma.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Otros requisitos (opcional)" multiline rows={2} size="medium"
                  value={form.otros} onChange={f('otros')}
                  placeholder="Ej: Disponibilidad para viajar, licencia de conducir, certificaciones específicas..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ── Section 4: Configuración ── */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Typography sx={sectionStyle}>Configuración de postulaciones</Typography>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Fecha de inicio (opcional)" type="date" size="medium"
                  value={form.fecha_inicio} onChange={f('fecha_inicio')}
                  InputLabelProps={{ shrink: true }}
                  helperText="Si se deja vacío, estará disponible inmediatamente"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth label="Fecha de cierre (opcional)" type="date" size="medium"
                  value={form.fecha_fin} onChange={f('fecha_fin')}
                  InputLabelProps={{ shrink: true }}
                  helperText="La vacante se cerrará automáticamente en esta fecha"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }} />
                <FormControlLabel
                  sx={{ mt: 1.5 }}
                  control={
                    <Switch
                      checked={form.notify_email}
                      onChange={(e) => setForm({ ...form, notify_email: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <NotificationsActive sx={{ fontSize: 16, color: form.notify_email ? 'primary.main' : 'text.disabled' }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Notificaciones por email
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
                        Recibirás un email cada vez que alguien aplique a esta vacante
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
