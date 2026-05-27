import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, TextField, IconButton, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, Button, Snackbar,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Skeleton, Grid, Chip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Switch, FormControlLabel,
  Breadcrumbs, Link, alpha, useTheme, Tooltip,
} from '@mui/material'
import {
  ContentCopy, Download, Edit, Block, NotificationsActive, NotificationsOff,
  PeopleAlt, CheckCircle, Cancel, HelpOutline, NavigateNext,
  TableChart, Inbox,
} from '@mui/icons-material'
import api from '../api/axios'
import { Vacante, Postulacion } from '../types'
import CandidatoRow from '../components/CandidatoRow'

function getVacanteStatus(vacante: Vacante): { label: string; bg: string; fg: string } {
  const now = new Date()
  const inicio = vacante.fecha_inicio ? new Date(vacante.fecha_inicio) : null
  const fin = vacante.fecha_fin ? new Date(vacante.fecha_fin) : null
  if (!vacante.activa) return { label: 'Cerrada', bg: '#F3F4F6', fg: '#6B7280' }
  if (fin && now > fin) return { label: 'Vencida', bg: '#FEE2E2', fg: '#991B1B' }
  if (inicio && now < inicio) return { label: 'Programada', bg: '#DBEAFE', fg: '#1E40AF' }
  return { label: 'Abierta', bg: '#DCFCE7', fg: '#166534' }
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
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: '12px',
          bgcolor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, fontFamily: '"Sora", sans-serif' }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
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
    setSnackbar('¡Link copiado!')
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
      ingles: vacante.ingles, espanol: vacante.espanol, otros: vacante.otros,
      area: vacante.area || '', fecha_inicio: vacante.fecha_inicio || '', fecha_fin: vacante.fecha_fin || '',
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
      setVacante(res.data); setCloseDialogOpen(false); setSnackbar('Vacante cerrada')
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Skeleton variant="rectangular" height={28} sx={{ borderRadius: 2, width: 260 }} />
      <Skeleton variant="rectangular" height={72} sx={{ borderRadius: 2 }} />
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map(i => <Grid item xs={6} sm={3} key={i}><Skeleton variant="rectangular" height={84} sx={{ borderRadius: 2 }} /></Grid>)}
      </Grid>
      <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 2 }} />
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
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2.5 }}>
        <Link component="button" underline="hover" color="text.secondary"
          variant="body2" onClick={() => navigate('/dashboard')} sx={{ cursor: 'pointer' }}>
          Vacantes
        </Link>
        <Typography variant="body2" color="text.primary" fontWeight={500}>
          {vacante.puesto}
        </Typography>
      </Breadcrumbs>

      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.3px' }}>{vacante.puesto}</Typography>
              <Box sx={{
                px: 1.25, py: 0.3, borderRadius: '100px',
                bgcolor: statusInfo.bg,
                border: `1px solid ${alpha(statusInfo.fg, 0.2)}`,
              }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: statusInfo.fg }}>
                  {statusInfo.label}
                </Typography>
              </Box>
              {vacante.area && (
                <Chip label={vacante.area} variant="outlined" size="small" sx={{ borderRadius: '6px' }} />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {vacante.empresa}
              {vacante.fecha_inicio && ` · Desde ${formatFecha(vacante.fecha_inicio)}`}
              {vacante.fecha_fin && ` · Hasta ${formatFecha(vacante.fecha_fin)}`}
            </Typography>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch checked={vacante.notify_email ?? true}
                  onChange={(e) => handleToggleNotify(e.target.checked)} size="small" />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {vacante.notify_email
                    ? <NotificationsActive sx={{ fontSize: 14, color: 'primary.main' }} />
                    : <NotificationsOff sx={{ fontSize: 14, color: 'text.disabled' }} />}
                  <Typography variant="caption" color="text.secondary">Notificaciones</Typography>
                </Box>
              }
              sx={{ mr: 0 }}
            />
            <Button startIcon={<Edit />} size="small" variant="outlined" onClick={handleOpenEdit}>
              Editar
            </Button>
            {vacante.activa ? (
              <Button startIcon={<Block />} size="small" variant="outlined" color="error"
                onClick={() => setCloseDialogOpen(true)}>
                Cerrar
              </Button>
            ) : (
              <Button size="small" variant="outlined" color="success" onClick={handleReactivar}>
                Reactivar
              </Button>
            )}
            <Button variant="contained" startIcon={<TableChart />} size="small" onClick={handleExport}>
              Excel
            </Button>
          </Box>
        </Box>

        {/* Public link */}
        <Card sx={{ mt: 2 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 0.75 }}>
              Link público para candidatos
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth size="small"
                value={`${window.location.origin}/postular/${vid}`}
                InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
              />
              <Tooltip title="Copiar link">
                <IconButton color="primary" onClick={handleCopyLink} size="small">
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ── Metrics ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <MetricCard value={total} label="Total candidatos"
            icon={<PeopleAlt sx={{ fontSize: 20 }} />}
            color={theme.palette.primary.main}
            bg={alpha(theme.palette.primary.main, 0.1)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard value={aptos} label="Aptos"
            icon={<CheckCircle sx={{ fontSize: 20 }} />}
            color={theme.palette.success.main}
            bg={alpha(theme.palette.success.main, 0.1)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard value={revisar} label="A revisar"
            icon={<HelpOutline sx={{ fontSize: 20 }} />}
            color={theme.palette.warning.main}
            bg={alpha(theme.palette.warning.main, 0.1)} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard value={noAptos} label="No aptos"
            icon={<Cancel sx={{ fontSize: 20 }} />}
            color={theme.palette.error.main}
            bg={alpha(theme.palette.error.main, 0.1)} />
        </Grid>
      </Grid>

      {/* ── Filters ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Recomendación</InputLabel>
          <Select value={filtroRec} label="Recomendación" onChange={(e) => setFiltroRec(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="APTO">APTO</MenuItem>
            <MenuItem value="REVISAR">REVISAR</MenuItem>
            <MenuItem value="NO APTO">NO APTO</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select value={orden} label="Ordenar por" onChange={(e) => setOrden(e.target.value)}>
            <MenuItem value="score">Score (desc)</MenuItem>
            <MenuItem value="nombre">Nombre A-Z</MenuItem>
            <MenuItem value="fecha">Más reciente</MenuItem>
          </Select>
        </FormControl>
        {filtroRec && (
          <Chip
            label={`Mostrando ${postulaciones.length} resultado${postulaciones.length !== 1 ? 's' : ''}`}
            size="small" onDelete={() => setFiltroRec('')}
            sx={{ borderRadius: '6px' }}
          />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Table ── */}
      {postulaciones.length > 0 ? (
        <Card sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 36 }} />
                  <TableCell sx={{ width: 32 }}>#</TableCell>
                  <TableCell>Candidato</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Habilidades</TableCell>
                  <TableCell>Inglés</TableCell>
                  <TableCell>Recomendación</TableCell>
                  <TableCell sx={{ width: 44 }}>CV</TableCell>
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
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '18px',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
            }}>
              <Inbox sx={{ fontSize: 32, color: 'text.disabled' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {filtroRec ? `Sin resultados para "${filtroRec}"` : 'Aún no hay postulaciones'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filtroRec
                ? 'Prueba cambiando el filtro de recomendación'
                : 'Comparte el link público para empezar a recibir candidatos'}
            </Typography>
            {filtroRec && (
              <Button size="small" sx={{ mt: 2 }} onClick={() => setFiltroRec('')}>
                Limpiar filtro
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700 }}>Editar vacante</DialogTitle>
        <DialogContent>
          {[
            { label: 'Puesto', field: 'puesto' },
            { label: 'Empresa', field: 'empresa' },
            { label: 'Área profesional', field: 'area' },
            { label: 'Descripción', field: 'descripcion', multiline: true, rows: 4 },
            { label: 'Años de experiencia', field: 'anios_exp' },
            { label: 'Habilidades requeridas', field: 'stack', multiline: true, rows: 2 },
            { label: 'Inglés', field: 'ingles' },
            { label: 'Español', field: 'espanol' },
            { label: 'Otros requisitos', field: 'otros', multiline: true },
            { label: 'Fecha inicio (opcional)', field: 'fecha_inicio', type: 'date' },
            { label: 'Fecha límite (opcional)', field: 'fecha_fin', type: 'date' },
          ].map(({ label, field, multiline, rows, type }) => (
            <TextField
              key={field} fullWidth label={label} margin="normal"
              multiline={multiline} rows={rows} type={type}
              InputLabelProps={type === 'date' ? { shrink: true } : undefined}
              value={(editForm as any)[field]}
              onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
            />
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Guardar cambios</Button>
        </DialogActions>
      </Dialog>

      {/* ── Close confirmation ── */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)}>
        <DialogTitle sx={{ fontFamily: '"Sora", sans-serif', fontWeight: 700 }}>¿Cerrar esta vacante?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Los candidatos ya no podrán postularse. Puedes reactivarla en cualquier momento.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCloseDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleConfirmClose}>Sí, cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar('')}
        message={snackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  )
}
