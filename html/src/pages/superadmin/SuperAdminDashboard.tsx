import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, Chip, CircularProgress,
  Alert, Avatar, Skeleton, useTheme,
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

const STATUS_META: Record<string, { label: string; color: 'success' | 'info' | 'warning' | 'error' | 'default' }> = {
  active:    { label: 'Activa',     color: 'success' },
  trial:     { label: 'Trial',      color: 'info'    },
  suspended: { label: 'Suspendida', color: 'warning' },
  cancelled: { label: 'Cancelada',  color: 'error'   },
}

const PIE_COLORS = ['#2196f3', '#4caf50', '#ff9800', '#f44336']

function StatCard({
  icon,
  label,
  value,
  sub,
  color = 'primary.main',
  loading = false,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  color?: string
  loading?: boolean
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Avatar sx={{ bgcolor: color, width: 44, height: 44, flexShrink: 0 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={36} />
          ) : (
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
              {value}
            </Typography>
          )}
          {sub && (
            <Typography variant="caption" color="text.secondary">
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

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  const pieData = stats
    ? [
        { name: 'Trial',      value: stats.empresasTrial,      color: PIE_COLORS[0] },
        { name: 'Activas',    value: stats.empresasActivas,     color: PIE_COLORS[1] },
        { name: 'Suspendidas',value: stats.empresasSuspendidas, color: PIE_COLORS[2] },
        { name: 'Canceladas', value: stats.empresasCanceladas,  color: PIE_COLORS[3] },
      ].filter(d => d.value > 0)
    : []

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Dashboard
      </Typography>

      {/* ── Row 1: 4 main metric cards ── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Business fontSize="small" />}
            label="Empresas totales"
            value={loading ? '–' : stats!.totalEmpresas}
            sub={loading ? undefined : `+${stats!.empresasEsteMes} este mes`}
            color="primary.main"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<CheckCircle fontSize="small" />}
            label="Empresas activas"
            value={loading ? '–' : stats!.empresasActivas}
            color={theme.palette.success.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<HourglassEmpty fontSize="small" />}
            label="En período de prueba"
            value={loading ? '–' : stats!.empresasTrial}
            color={theme.palette.info.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={<Work fontSize="small" />}
            label="Vacantes activas"
            value={loading ? '–' : stats!.vacantesActivas}
            sub={loading ? undefined : `de ${stats!.totalVacantes} totales`}
            color={theme.palette.warning.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Row 2: 3 secondary metrics ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<Group fontSize="small" />}
            label="Postulaciones totales"
            value={loading ? '–' : stats!.totalPostulaciones}
            color={theme.palette.secondary.main}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<Pause fontSize="small" />}
            label="Empresas suspendidas"
            value={loading ? '–' : stats!.empresasSuspendidas}
            color={theme.palette.warning.dark}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            icon={<Cancel fontSize="small" />}
            label="Empresas canceladas"
            value={loading ? '–' : stats!.empresasCanceladas}
            color={theme.palette.error.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Row 3: Charts ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Bar chart — empresas por mes */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Empresas registradas — últimos 6 meses
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={260} />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats!.empresasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <ReTooltip
                      contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}
                    />
                    <Bar dataKey="empresas" name="Empresas" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pie chart — empresa por estado */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Distribución por estado
              </Typography>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
                  <CircularProgress />
                </Box>
              ) : pieData.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 260 }}>
                  <Typography color="text.secondary">Sin datos</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <ReTooltip
                      contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Row 4: Tables ── */}
      <Grid container spacing={3}>
        {/* Top 5 by vacantes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp color="primary" fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top 5 por vacantes
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
                  {stats!.top5.map((c, idx) => (
                    <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        {idx + 1}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{c.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.vacantes_activas} activas de {c.total_vacantes}
                        </Typography>
                      </Box>
                      <Chip
                        label={STATUS_META[c.status]?.label || c.status}
                        color={STATUS_META[c.status]?.color || 'default'}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Last 5 registered */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WorkspacePremium color="primary" fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Últimas empresas registradas
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
                  {stats!.ultimasEmpresas.map((c) => (
                    <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.200', color: 'text.primary', fontSize: '0.8rem' }}>
                        {c.nombre.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{c.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {c.createdAt
                            ? new Date(c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '–'}
                        </Typography>
                      </Box>
                      <Chip
                        label={STATUS_META[c.status]?.label || c.status}
                        color={STATUS_META[c.status]?.color || 'default'}
                        size="small"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
