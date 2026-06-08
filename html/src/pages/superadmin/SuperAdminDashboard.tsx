import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress,
  Alert, Avatar, Skeleton, useTheme, alpha,
} from '@mui/material'
import {
  Business, WorkspacePremium, TrendingUp, Work,
  Group, CheckCircle, HourglassEmpty, Cancel, Pause,
} from '@mui/icons-material'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '../../api/axios'

interface CompanyRow {
  id: string
  nombre: string
  status: string
  total_vacantes: number
  vacantes_activas: number
  createdAt?: string
}

interface AdminStats {
  totalEmpresas: number
  empresasActivas: number
  empresasTrial: number
  empresasSuspendidas: number
  empresasCanceladas: number
  empresasEsteMes: number
  totalVacantes: number
  vacantesActivas: number
  totalPostulaciones: number
  top5: CompanyRow[]
  ultimasEmpresas: CompanyRow[]
  empresasPorMes: Array<{ mes: string; empresas: number }>
}

const STATUS_META: Record<string, { label: string; color: 'success' | 'info' | 'warning' | 'error' | 'default'; bg: string; fg: string }> = {
  active:    { label: 'Activa',     color: 'success', bg: '#DCFCE7', fg: '#166534' },
  trial:     { label: 'Trial',      color: 'info',    bg: '#DBEAFE', fg: '#1E40AF' },
  suspended: { label: 'Suspendida', color: 'warning', bg: '#FEF3C7', fg: '#92400E' },
  cancelled: { label: 'Cancelada',  color: 'error',   bg: '#FEE2E2', fg: '#991B1B' },
}

const PIE_COLORS = ['#2196F3', '#16A34A', '#D97706', '#DC2626']

function StatCard({
  icon, label, value, sub, iconBg, iconColor, loading = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  iconBg: string
  iconColor: string
  loading?: boolean
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: '14px',
          bgcolor: iconBg, color: iconColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.5 }}>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={56} height={36} />
          ) : (
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1, fontFamily: '"Sora", sans-serif' }}>
              {value}
            </Typography>
          )}
          {sub && !loading && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
              {sub}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const theme = useTheme()

  useEffect(() => {
    api.get('/superadmin/stats')
      .then(res => setStats(res.data))
      .catch(err => setError(err.response?.data?.error || 'Error cargando estadísticas'))
      .finally(() => setLoading(false))
  }, [])

  if (error) return <Alert severity="error">{error}</Alert>

  const pieData = stats
    ? [
        { name: 'Trial',       value: stats.empresasTrial,       color: PIE_COLORS[0] },
        { name: 'Activas',     value: stats.empresasActivas,      color: PIE_COLORS[1] },
        { name: 'Suspendidas', value: stats.empresasSuspendidas,  color: PIE_COLORS[2] },
        { name: 'Canceladas',  value: stats.empresasCanceladas,   color: PIE_COLORS[3] },
      ].filter(d => d.value > 0)
    : []

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25, letterSpacing: '-0.3px' }}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {today}
          </Typography>
        </Box>
        <Chip
          label="Super Admin"
          icon={<WorkspacePremium sx={{ fontSize: 14 }} />}
          color="primary"
          sx={{ fontWeight: 600, borderRadius: '8px' }}
        />
      </Box>

      {/* ── Row 1: 4 KPI cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Business />} label="Empresas totales"
            value={loading ? '–' : stats!.totalEmpresas}
            sub={loading ? undefined : `+${stats!.empresasEsteMes} este mes`}
            iconBg={alpha(theme.palette.primary.main, 0.1)}
            iconColor={theme.palette.primary.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CheckCircle />} label="Empresas activas"
            value={loading ? '–' : stats!.empresasActivas}
            iconBg={alpha(theme.palette.success.main, 0.1)}
            iconColor={theme.palette.success.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<HourglassEmpty />} label="En período de prueba"
            value={loading ? '–' : stats!.empresasTrial}
            iconBg={alpha(theme.palette.info.main, 0.1)}
            iconColor={theme.palette.info.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Work />} label="Vacantes activas"
            value={loading ? '–' : stats!.vacantesActivas}
            sub={loading ? undefined : `de ${stats!.totalVacantes} totales`}
            iconBg={alpha(theme.palette.warning.main, 0.1)}
            iconColor={theme.palette.warning.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Row 2: 3 secondary cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<Group />} label="Postulaciones totales"
            value={loading ? '–' : stats!.totalPostulaciones}
            iconBg={alpha(theme.palette.secondary.main, 0.1)}
            iconColor={theme.palette.secondary.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<Pause />} label="Empresas suspendidas"
            value={loading ? '–' : stats!.empresasSuspendidas}
            iconBg={alpha(theme.palette.warning.main, 0.08)}
            iconColor={theme.palette.warning.dark}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<Cancel />} label="Empresas canceladas"
            value={loading ? '–' : stats!.empresasCanceladas}
            iconBg={alpha(theme.palette.error.main, 0.08)}
            iconColor={theme.palette.error.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Row 3: Charts ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }} alignItems="stretch">
        {/* Bar chart */}
        <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ flex: 1 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
                Empresas registradas — últimos 6 meses
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats!.empresasPorMes} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 12, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} axisLine={false} tickLine={false} />
                    <ReTooltip
                      contentStyle={{
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8, fontSize: 13,
                      }}
                    />
                    <Bar dataKey="empresas" name="Empresas" fill={theme.palette.primary.main} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pie chart */}
        <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>
                Distribución por estado
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <CircularProgress />
                </Box>
              ) : pieData.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <Typography color="text.secondary" variant="body2">Sin datos</Typography>
                </Box>
              ) : (
                <Box sx={{ flex: 1, minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={58}
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value, entry: any) => (
                        <span style={{ fontSize: 12, color: theme.palette.text.secondary }}>
                          {value} — <strong style={{ color: theme.palette.text.primary }}>{entry.payload?.value}</strong>
                        </span>
                      )}
                    />
                    <ReTooltip
                      formatter={(value, name) => [`${value} empresas`, String(name)]}
                      contentStyle={{
                        background: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8, fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Row 4: Tables ── */}
      <Grid container spacing={2.5}>
        {/* Top 5 */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <TrendingUp sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Top 5 — más vacantes
                </Typography>
              </Box>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={44} sx={{ mb: 0.5 }} />
                ))
              ) : stats!.top5.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Sin empresas registradas</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {stats!.top5.map((c, idx) => {
                    const meta = STATUS_META[c.status] || STATUS_META.trial
                    return (
                      <Box key={c.id} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, px: 1,
                        borderRadius: 2,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}>
                        <Avatar sx={{
                          width: 28, height: 28, fontSize: '0.72rem', fontWeight: 700,
                          bgcolor: theme.palette.primary.main, color: 'white', borderRadius: '7px',
                        }}>
                          {idx + 1}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{c.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.vacantes_activas} activas · {c.total_vacantes} total
                          </Typography>
                        </Box>
                        <Box sx={{
                          px: 1, py: 0.25, borderRadius: '100px',
                          bgcolor: meta.bg,
                        }}>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: meta.fg }}>
                            {meta.label}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Last 5 registered */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <WorkspacePremium sx={{ fontSize: 18, color: 'primary.main' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Últimas registradas
                </Typography>
              </Box>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={44} sx={{ mb: 0.5 }} />
                ))
              ) : stats!.ultimasEmpresas.length === 0 ? (
                <Typography color="text.secondary" variant="body2">Sin empresas registradas</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {stats!.ultimasEmpresas.map((c) => {
                    const meta = STATUS_META[c.status] || STATUS_META.trial
                    return (
                      <Box key={c.id} sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, px: 1,
                        borderRadius: 2,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}>
                        <Avatar sx={{
                          width: 32, height: 32, fontWeight: 700, fontSize: '0.8rem',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          color: 'primary.main', borderRadius: '9px',
                        }}>
                          {c.nombre.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{c.nombre}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '–'}
                          </Typography>
                        </Box>
                        <Box sx={{ px: 1, py: 0.25, borderRadius: '100px', bgcolor: meta.bg }}>
                          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: meta.fg }}>
                            {meta.label}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
