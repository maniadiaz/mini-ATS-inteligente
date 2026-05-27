import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Alert, TextField, Select, MenuItem, FormControl,
  InputLabel, Avatar, Chip, Card, Skeleton, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  Accordion, AccordionSummary, AccordionDetails, InputAdornment,
  useTheme, alpha,
} from '@mui/material'
import {
  ExpandMore, Search, PeopleAlt, Work, CheckCircle,
  RadioButtonUnchecked, Schedule, Inbox, OpenInNew,
} from '@mui/icons-material'
import api from '../../api/axios'
import { EmpresaConVacantes, VacanteResumen } from '../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────

const companyStatusBadge: Record<string, { bg: string; fg: string; label: string }> = {
  trial:     { bg: '#EFF6FF', fg: '#1D4ED8', label: 'Trial' },
  active:    { bg: '#DCFCE7', fg: '#15803D', label: 'Activa' },
  suspended: { bg: '#FEE2E2', fg: '#B91C1C', label: 'Suspendida' },
  cancelled: { bg: '#F3F4F6', fg: '#4B5563', label: 'Cancelada' },
}

const vacanteBadge: Record<string, { bg: string; fg: string; label: string }> = {
  Abierta:    { bg: '#DCFCE7', fg: '#15803D', label: 'Abierta' },
  Programada: { bg: '#EFF6FF', fg: '#1D4ED8', label: 'Programada' },
  Vencida:    { bg: '#FEE2E2', fg: '#B91C1C', label: 'Vencida' },
  Cerrada:    { bg: '#F3F4F6', fg: '#4B5563', label: 'Cerrada' },
}

function getVacanteStatusKey(v: VacanteResumen): string {
  const now = new Date()
  if (!v.activa) return 'Cerrada'
  if (v.fecha_inicio && new Date(v.fecha_inicio) > now) return 'Programada'
  if (v.fecha_fin && new Date(v.fecha_fin) < now) return 'Vencida'
  return 'Abierta'
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function avatarColor(name: string) {
  const colors = ['#1A3C5E', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#E91E63', '#00BCD4']
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % colors.length
  return colors[h]
}

const sectionLabel = {
  fontWeight: 700, fontSize: '0.68rem',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em', color: 'text.secondary',
  display: 'block', mb: 1,
}

// ─── Status badge ─────────────────────────────────────────────────────────

function StatusBadge({ status, map }: { status: string; map: Record<string, { bg: string; fg: string; label: string }> }) {
  const b = map[status] || { bg: '#F3F4F6', fg: '#4B5563', label: status }
  return (
    <Box component="span" sx={{
      display: 'inline-block',
      px: 1, py: 0.25,
      borderRadius: '5px',
      bgcolor: b.bg,
      color: b.fg,
      fontSize: '0.68rem',
      fontWeight: 700,
      letterSpacing: '0.03em',
      lineHeight: 1.6,
    }}>
      {b.label}
    </Box>
  )
}

// ─── Empty vacantes ───────────────────────────────────────────────────────

function EmptyVacantes() {
  return (
    <Box sx={{ py: 5, textAlign: 'center', color: 'text.disabled' }}>
      <Inbox sx={{ fontSize: 36, mb: 1, opacity: 0.4 }} />
      <Typography variant="body2">Esta empresa no ha creado vacantes aún</Typography>
    </Box>
  )
}

// ─── Skeleton de carga ────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: '16px' }} />
      ))}
    </Box>
  )
}

// ─── Tabla de vacantes ────────────────────────────────────────────────────

function VacantesTable({ vacantes, onClickVacante }: {
  vacantes: VacanteResumen[]
  onClickVacante: (id: string) => void
}) {
  const theme = useTheme()
  if (vacantes.length === 0) return <EmptyVacantes />

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {['Puesto', 'Área', 'Estado', 'Total', 'APTOs', 'Revisar', 'No aptos', 'Fechas', 'Creada'].map(h => (
              <TableCell key={h} sx={{
                fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.06em',
                textTransform: 'uppercase', color: 'text.secondary',
                py: 1.25,
              }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {vacantes.map(v => {
            const key = getVacanteStatusKey(v)
            return (
              <TableRow
                key={v.id}
                hover
                sx={{ cursor: 'pointer', '& td': { py: 1.25 } }}
                onClick={() => onClickVacante(v.id)}
              >
                <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{v.puesto}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{v.area || '—'}</TableCell>
                <TableCell><StatusBadge status={key} map={vacanteBadge} /></TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={700} color="text.primary">{v.total_postulaciones}</Typography>
                </TableCell>
                <TableCell>
                  {v.aptos > 0
                    ? <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: '5px', bgcolor: '#DCFCE7', color: '#15803D', fontSize: '0.72rem', fontWeight: 700 }}>{v.aptos}</Box>
                    : <Typography variant="body2" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell>
                  {v.revisar > 0
                    ? <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: '5px', bgcolor: '#FEF3C7', color: '#92400E', fontSize: '0.72rem', fontWeight: 700 }}>{v.revisar}</Box>
                    : <Typography variant="body2" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell>
                  {v.no_aptos > 0
                    ? <Box component="span" sx={{ px: 1, py: 0.25, borderRadius: '5px', bgcolor: '#FEE2E2', color: '#B91C1C', fontSize: '0.72rem', fontWeight: 700 }}>{v.no_aptos}</Box>
                    : <Typography variant="body2" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {v.fecha_inicio || v.fecha_fin
                    ? `${fmtDate(v.fecha_inicio)} → ${fmtDate(v.fecha_fin)}`
                    : '—'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {fmtDate(v.createdAt)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ─── Mini metric card ─────────────────────────────────────────────────────

function MiniMetric({ value, label, icon, color }: {
  value: number; label: string; icon: React.ReactNode; color: string
}) {
  return (
    <Card variant="outlined" sx={{
      p: 1.75, borderRadius: '12px', textAlign: 'center',
      border: '1px solid', borderColor: 'divider',
      transition: 'box-shadow 0.2s ease',
      '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
    }}>
      <Box sx={{ color, mb: 0.5, display: 'flex', justifyContent: 'center' }}>{icon}</Box>
      <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1.1, fontFamily: '"Sora", sans-serif' }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.3, mt: 0.25, fontSize: '0.7rem' }}>
        {label}
      </Typography>
    </Card>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────

export default function SuperAdminVacantes() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [empresas, setEmpresas] = useState<EmpresaConVacantes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('vacantes')
  const [expanded, setExpanded] = useState<string | false>(false)

  useEffect(() => {
    api.get('/superadmin/vacantes')
      .then(res => setEmpresas(res.data))
      .catch(() => setError('Error cargando vacantes'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let list = empresas

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e => e.nombre.toLowerCase().includes(q))
    }

    if (filterStatus !== 'all') {
      list = list.filter(e => e.status === filterStatus)
    }

    switch (sortBy) {
      case 'vacantes':
        list = [...list].sort((a, b) => b.total_vacantes - a.total_vacantes)
        break
      case 'postulaciones':
        list = [...list].sort((a, b) => b.total_postulaciones - a.total_postulaciones)
        break
      case 'nombre':
        list = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre))
        break
    }

    return list
  }, [empresas, search, filterStatus, sortBy])

  const handleAccordion = (id: string) => (_: React.SyntheticEvent, isOpen: boolean) => {
    setExpanded(isOpen ? id : false)
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease' }}>
      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Sora", sans-serif', letterSpacing: '-0.5px' }}>
          Vacantes por empresa
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Explora y monitorea las vacantes de todas las empresas en la plataforma
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Filtros ── */}
      <Card sx={{ p: 2, mb: 3, borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }} elevation={0}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ minWidth: 240, flex: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Estado</InputLabel>
            <Select value={filterStatus} label="Estado" onChange={e => setFilterStatus(e.target.value)}>
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="trial">Trial</MenuItem>
              <MenuItem value="active">Activa</MenuItem>
              <MenuItem value="suspended">Suspendida</MenuItem>
              <MenuItem value="cancelled">Cancelada</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select value={sortBy} label="Ordenar por" onChange={e => setSortBy(e.target.value)}>
              <MenuItem value="vacantes">Más vacantes</MenuItem>
              <MenuItem value="postulaciones">Más postulaciones</MenuItem>
              <MenuItem value="reciente">Más reciente</MenuItem>
              <MenuItem value="nombre">Nombre A-Z</MenuItem>
            </Select>
          </FormControl>
          {(search || filterStatus !== 'all') && (
            <Chip
              label={`${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
              size="small"
              sx={{ borderRadius: '6px', fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}
            />
          )}
        </Box>
      </Card>

      {/* ── Contenido ── */}
      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length === 0 ? (
        <Card sx={{ py: 8, textAlign: 'center', borderRadius: '16px', border: `1px solid ${theme.palette.divider}` }} elevation={0}>
          <Inbox sx={{ fontSize: 48, mb: 1.5, color: 'text.disabled', opacity: 0.4 }} />
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            {search || filterStatus !== 'all'
              ? 'No se encontraron empresas con esos filtros'
              : 'No hay empresas registradas aún'}
          </Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtered.map((empresa, idx) => (
            <Accordion
              key={empresa.id}
              expanded={expanded === empresa.id}
              onChange={handleAccordion(empresa.id)}
              disableGutters
              sx={{
                borderRadius: '16px !important',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                '&:before': { display: 'none' },
                '&.Mui-expanded': {
                  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                  borderColor: alpha(theme.palette.primary.main, 0.25),
                },
                animation: 'fadeInUp 0.3s ease both',
                animationDelay: `${idx * 40}ms`,
                transition: 'box-shadow 0.25s ease, border-color 0.25s ease',
              }}
            >
              {/* ── AccordionSummary ── */}
              <AccordionSummary
                expandIcon={<ExpandMore sx={{ color: 'text.secondary', transition: 'transform 0.25s ease' }} />}
                sx={{
                  px: 2.5, py: 1.25, minHeight: 80,
                  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': { transform: 'rotate(180deg)' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', mr: 1 }}>
                  {/* Avatar */}
                  {empresa.logo_url ? (
                    <Avatar
                      src={empresa.logo_url}
                      variant="rounded"
                      sx={{ width: 44, height: 44, borderRadius: '10px', border: `1px solid ${theme.palette.divider}` }}
                    />
                  ) : (
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: avatarColor(empresa.nombre),
                        width: 44, height: 44, borderRadius: '10px',
                        fontWeight: 800, fontSize: '1rem', color: 'white',
                      }}
                    >
                      {empresa.nombre[0]?.toUpperCase()}
                    </Avatar>
                  )}

                  {/* Nombre + badge */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {empresa.nombre}
                      </Typography>
                      <StatusBadge status={empresa.status} map={companyStatusBadge} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                      {empresa.email}
                    </Typography>
                  </Box>

                  {/* Métricas rápidas */}
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 4, mr: 1 }}>
                    {[
                      { value: empresa.total_vacantes, label: 'Vacantes', color: 'primary.main' },
                      { value: empresa.vacantes_activas, label: 'Activas', color: 'success.main' },
                      { value: empresa.total_postulaciones, label: 'Postulaciones', color: 'text.primary' },
                      { value: empresa.vacantes_este_mes, label: 'Este mes', color: 'warning.main' },
                    ].map(m => (
                      <Box key={m.label} textAlign="center">
                        <Typography variant="h6" fontWeight={800} sx={{ color: m.color, lineHeight: 1, fontFamily: '"Sora", sans-serif' }}>
                          {m.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                          {m.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Mobile: solo vacantes */}
                  <Box textAlign="center" sx={{ display: { xs: 'block', sm: 'none' }, mr: 0.5 }}>
                    <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ fontFamily: '"Sora", sans-serif', lineHeight: 1 }}>
                      {empresa.total_vacantes}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                      Vacantes
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>

              {/* ── AccordionDetails ── */}
              <AccordionDetails sx={{ px: 2.5, pb: 3, pt: 0 }}>
                {/* Mini-cards métricas */}
                <Typography sx={{ ...sectionLabel, mb: 2 }}>Resumen de actividad</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5, mb: 3 }}>
                  <MiniMetric value={empresa.total_vacantes} label="Total vacantes" color="primary.main" icon={<Work fontSize="small" />} />
                  <MiniMetric value={empresa.vacantes_activas} label="Activas" color="success.main" icon={<CheckCircle fontSize="small" />} />
                  <MiniMetric value={empresa.vacantes_cerradas} label="Cerradas" color="text.secondary" icon={<RadioButtonUnchecked fontSize="small" />} />
                  <MiniMetric value={empresa.total_postulaciones} label="Postulaciones" color="text.primary" icon={<PeopleAlt fontSize="small" />} />
                  <MiniMetric value={empresa.postulaciones_este_mes} label="Este mes" color="warning.main" icon={<Schedule fontSize="small" />} />
                  <MiniMetric value={empresa.aptos} label="Candidatos APTOS" color="success.main" icon={<CheckCircle fontSize="small" />} />
                </Box>

                {/* Tabla */}
                <Typography sx={{ ...sectionLabel, mb: 1.5 }}>
                  Vacantes — haz clic en una fila para ver candidatos
                </Typography>
                <VacantesTable
                  vacantes={empresa.vacantes}
                  onClickVacante={id => navigate(`/vacante/${id}`)}
                />

                {/* Enlace empresa */}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Box
                    component="button"
                    onClick={() => navigate('/superadmin/empresas')}
                    sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.75,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px', px: 1.5, py: 0.75,
                      bgcolor: 'transparent', cursor: 'pointer',
                      color: 'primary.main', fontSize: '0.8rem', fontWeight: 600,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                        borderColor: 'primary.main',
                      },
                    }}
                  >
                    <OpenInNew sx={{ fontSize: 14 }} />
                    Ver detalle completo de la empresa
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  )
}
