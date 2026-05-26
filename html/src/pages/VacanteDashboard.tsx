import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, TextField, IconButton, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, Button, Snackbar,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Skeleton, Grid, Chip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Switch, FormControlLabel,
  Breadcrumbs, Link, alpha, useTheme,
} from '@mui/material'
import {
  ContentCopy, Download, Edit, Block, NotificationsActive, NotificationsOff,
  PeopleAlt, CheckCircle, Cancel, HelpOutline, NavigateNext,
} from '@mui/icons-material'
import api from '../api/axios'
import { Vacante, Postulacion } from '../types'
import CandidatoRow from '../components/CandidatoRow'

function getVacanteStatus(vacante: Vacante): { label: string; color: 'success' | 'primary' | 'default' | 'error' } {
  const now = new Date()
  const inicio = vacante.fecha_inicio ? new Date(vacante.fecha_inicio) : null
  const fin = vacante.fecha_fin ? new Date(vacante.fecha_fin) : null
  if (!vacante.activa) return { label: 'Cerrada manualmente', color: 'default' }
  if (fin && now > fin) return { label: 'Vencida', color: 'error' }
  if (inicio && now < inicio) return { label: 'Programada', color: 'primary' }
  return { label: 'Abierta', color: 'success' }
}

interface MetricCardProps {
  value: number | string
  label: string
  icon: React.ReactNode
  color: string
  bg: string
}
function MetricCard({ value, label, icon, color, bg }: MetricCardProps) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: bg, color, display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>{value}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function VacanteDashboard() {
  const { vid } = useParams<{ vid: string }>()
  const navigate = useNavigate()
  const theme = useTheme()

  const [vacante, setVacante] = useState<Vacante | null>(null)
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState('')
  const [filtroRec, setFiltroRec] = useState('')
  const [orden, setOrden] = useState('score')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    puesto: '', empresa: '', descripcion: '', anios_exp: '',
    stack: '', ingles: '', espanol: '', otros: '',
    area: '', fecha_inicio: '', fecha_fin: '',
  })
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)

  useEffect(() => { loadData() }, [vid, filtroRec, orden])

  const loadData = async () => {
    try {
      const params: Record<string, string> = {}
      if (filtroRec) params.recomendacion = filtroRec
      if (orden) params.orden = orden
      const res = await api.get(`/vacante/${vid}/dashboard`, { params })
      setVacante(res.data.vacante)
      setPostulaciones(res.data.postulaciones)
    } catch { setError('Error cargando datos') }
    finally { setLoading(false) }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/postular/${vid}`)
    setSnackbar('Link copiado al portapapeles')
  }

  const handleExport = async () => {
    try {
      const response = await api.get(`/vacante/${vid}/exportar`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url; a.download = `candidatos_${vacante?.puesto || 'export'}.xlsx`
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)
    } catch { setError('Error exportando Excel') }
  }

  const handleOpenEdit = () => {
    if (!vacante) return
    setEditForm({
      puesto: vacante.puesto, empresa: vacante.empresa,
      descripcion: vacante.descripcion, anios_exp: vacante.anios_exp,
      stack: vacante.habilidades_requeridas || vacante.stack,
      ingles: vacante.ingles, espanol: vacante.espanol,
      otros: vacante.otros, area: vacante.area || '',
      fecha_inicio: vacante.fecha_inicio || '', fecha_fin: vacante.fecha_fin || '',
    })
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      const res = await api.put(`/vacante/${vid}`, {
        ...editForm,
        habilidades_requeridas: editForm.stack,
        fecha_inicio: editForm.fecha_inicio || null,
        fecha_fin: editForm.fecha_fin || null,
        area: editForm.area || null,
      })
      setVacante(res.data); setEditOpen(false); setSnackbar('Vacante actualizada')
    } catch { setError('Error actualizando vacante') }
  }

  const handleConfirmClose = async () => {
    try {
      const res = await api.put(`/vacante/${vid}`, { activa: false })
      setVacante(res.data); setCloseDialogOpen(false)
      setSnackbar('Vacante cerrada')
    } catch { setError('Error cerrando vacante') }
  }

  const handleReactivar = async () => {
    try {
      const res = await api.put(`/vacante/${vid}`, { activa: true })
      setVacante(res.data); setSnackbar('Vacante reactivada')
    } catch { setError('Error reactivando vacante') }
  }

  const handleToggleNotify = async (checked: boolean) => {
    try {
      const res = await api.patch(`/vacante/${vid}/notify`, { notify_email: checked })
      setVacante((v) => v ? { ...v, notify_email: res.data.notify_email } : v)
      setSnackbar(res.data.notify_email ? 'Notificaciones activadas' : 'Notificaciones desactivadas')
    } catch { setError('Error actualizando notificaciones') }
  }

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 2, width: 300 }} />
      <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
      <Grid container spacing={2}>
        {[1,2,3,4].map(i => <Grid item xs={3} key={i}><Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} /></Grid>)}
      </Grid>
      <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
    </Box>
  )

  if (!vacante) return <Alert severity="error">Vacante no encontrada</Alert>

  const statusInfo = getVacanteStatus(vacante)
  const total = postulaciones.length
  const aptos = postulaciones.filter(p => p.resultado?.recomendacion === 'APTO').length
  const revisar = postulaciones.filter(p => p.resultado?.recomendacion === 'REVISAR').length
  const noAptos = postulaciones.filter(p => p.resultado?.recomendacion === 'NO APTO').length

  const formatFecha = (f: string) =>
    new Date(f).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
        <Link
          component="button" underline="hover" color="text.secondary"
          variant="body2" onClick={() => navigate('/dashboard')}
          sx={{ cursor: 'pointer' }}
        >
          Vacantes
        </Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
          {vacante.puesto}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{vacante.puesto}</Typography>
            <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
            {vacante.area && <Chip label={vacante.area} variant="outlined" size="small" />}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {vacante.empresa}
            {vacante.fecha_inicio && ` · Desde ${formatFecha(vacante.fecha_inicio)}`}
            {vacante.fecha_fin && ` · Hasta ${formatFecha(vacante.fecha_fin)}`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button startIcon={<Edit />} size="small" variant="outlined" onClick={handleOpenEdit}>
            Editar
          </Button>
          {vacante.activa ? (
            <Button startIcon={<Block />} size="small" variant="outlined" color="error"
              onClick={() => setCloseDialogOpen(true)}>
              Cerrar postulaciones
            </Button>
          ) : (
            <Button size="small" variant="outlined" color="success" onClick={handleReactivar}>
              Reactivar
            </Button>
          )}
        </Box>
      </Box>

      {/* Notification toggle */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch checked={vacante.notify_email ?? true}
              onChange={(e) => handleToggleNotify(e.target.checked)} size="small" />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {vacante.notify_email
                ? <NotificationsActive fontSize="small" color="primary" />
                : <NotificationsOff fontSize="small" color="disabled" />}
              <Typography variant="body2" color="text.secondary">
                Notificaciones de postulación
              </Typography>
            </Box>
          }
        />
      </Box>

      {/* Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <MetricCard value={total} label="Total candidatos" icon={<PeopleAlt fontSize="small" />}
            color={theme.palette.primary.main} bg={alpha(theme.palette.primary.main, 0.1)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard value={aptos} label="Aptos" icon={<CheckCircle fontSize="small" />}
            color={theme.palette.success.main} bg={alpha(theme.palette.success.main, 0.1)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard value={revisar} label="A revisar" icon={<HelpOutline fontSize="small" />}
            color={theme.palette.warning.main} bg={alpha(theme.palette.warning.main, 0.1)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard value={noAptos} label="No aptos" icon={<Cancel fontSize="small" />}
            color={theme.palette.error.main} bg={alpha(theme.palette.error.main, 0.1)} />
        </Grid>
      </Grid>

      {/* Public link */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
            Link público para candidatos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField fullWidth size="small" value={`${window.location.origin}/postular/${vid}`}
              InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.82rem' } }} />
            <IconButton color="primary" onClick={handleCopyLink} size="small">
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Filters + Export */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Recomendación</InputLabel>
          <Select value={filtroRec} label="Recomendación" onChange={(e) => setFiltroRec(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="APTO">APTO</MenuItem>
            <MenuItem value="REVISAR">REVISAR</MenuItem>
            <MenuItem value="NO APTO">NO APTO</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select value={orden} label="Ordenar por" onChange={(e) => setOrden(e.target.value)}>
            <MenuItem value="score">Score (desc)</MenuItem>
            <MenuItem value="nombre">Nombre A-Z</MenuItem>
            <MenuItem value="fecha">Más reciente</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<Download />} onClick={handleExport} sx={{ ml: 'auto' }}>
          Exportar Excel
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Table */}
      {postulaciones.length > 0 ? (
        <Card sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell>#</TableCell>
                  <TableCell>Candidato</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Habilidades encontradas</TableCell>
                  <TableCell>Inglés</TableCell>
                  <TableCell>Recomendación</TableCell>
                  <TableCell>CV</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {postulaciones.map((p, idx) => (
                  <CandidatoRow key={p.id} postulacion={p} index={idx} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            No hay candidatos{filtroRec ? ` con filtro "${filtroRec}"` : ' aún'}.
          </Typography>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar vacante</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Puesto" margin="normal" value={editForm.puesto}
            onChange={(e) => setEditForm({ ...editForm, puesto: e.target.value })} />
          <TextField fullWidth label="Empresa" margin="normal" value={editForm.empresa}
            onChange={(e) => setEditForm({ ...editForm, empresa: e.target.value })} />
          <TextField fullWidth select label="Área profesional" margin="normal"
            value={editForm.area} onChange={(e) => setEditForm({ ...editForm, area: e.target.value })}>
            <MenuItem value="">Sin especificar</MenuItem>
            {['Tecnología','Ventas','Marketing','Finanzas','RRHH','Operaciones','Legal','Diseño','Otro'].map(a => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </TextField>
          <TextField fullWidth label="Descripción" margin="normal" multiline minRows={4}
            value={editForm.descripcion} onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })} />
          <TextField fullWidth label="Años de experiencia" margin="normal"
            value={editForm.anios_exp} onChange={(e) => setEditForm({ ...editForm, anios_exp: e.target.value })} />
          <TextField fullWidth label="Habilidades requeridas" margin="normal" multiline rows={2}
            value={editForm.stack} onChange={(e) => setEditForm({ ...editForm, stack: e.target.value })}
            placeholder="Ej: Excel avanzado, atención al cliente, inglés B2..." />
          <TextField fullWidth label="Inglés" margin="normal" value={editForm.ingles}
            onChange={(e) => setEditForm({ ...editForm, ingles: e.target.value })} />
          <TextField fullWidth label="Español" margin="normal" value={editForm.espanol}
            onChange={(e) => setEditForm({ ...editForm, espanol: e.target.value })} />
          <TextField fullWidth label="Otros requisitos" margin="normal" multiline value={editForm.otros}
            onChange={(e) => setEditForm({ ...editForm, otros: e.target.value })} />
          <TextField fullWidth label="Fecha inicio (opcional)" margin="normal" type="date"
            InputLabelProps={{ shrink: true }} value={editForm.fecha_inicio}
            onChange={(e) => setEditForm({ ...editForm, fecha_inicio: e.target.value })} />
          <TextField fullWidth label="Fecha límite (opcional)" margin="normal" type="date"
            InputLabelProps={{ shrink: true }} value={editForm.fecha_fin}
            onChange={(e) => setEditForm({ ...editForm, fecha_fin: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Guardar cambios</Button>
        </DialogActions>
      </Dialog>

      {/* Close confirmation */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)}>
        <DialogTitle>¿Cerrar esta vacante?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Los candidatos ya no podrán postularse. Puedes reactivarla en cualquier momento.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleConfirmClose}>
            Sí, cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        message={snackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
