import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Grid, ToggleButtonGroup, ToggleButton,
  CircularProgress, Alert,
} from '@mui/material'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../../api/axios'

type Period = 'day' | 'week' | 'month' | 'year'

interface DashboardStats {
  totalSubscriptions: number
  activeSubscriptions: number
  totalRevenue: number
  periodRevenue: number
  mrr: number
  avgRevenuePerCustomer: number
  conversionRate: number
  churnRate: number
  totalCompanies: number
  trialCompanies: number
  chartData: Array<{ date: string; subscriptions: number; revenue: number }>
}

export default function SuperAdminDashboard() {
  const [period, setPeriod] = useState<Period>('week')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/superadmin/dashboard?period=${period}`)
      setStats(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error cargando estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const periodLabels: Record<Period, string> = {
    day: 'Hoy',
    week: 'Últimos 7 días',
    month: 'Este mes',
    year: 'Este año',
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!stats) return null

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Dashboard</Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, val) => val && setPeriod(val)}
          size="small"
        >
          <ToggleButton value="day">Hoy</ToggleButton>
          <ToggleButton value="week">7 días</ToggleButton>
          <ToggleButton value="month">Mes</ToggleButton>
          <ToggleButton value="year">Año</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Stats Cards - Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                MRR (Ingresos Recurrentes)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ${stats.mrr.toLocaleString('es-MX')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                /mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Ingresos {periodLabels[period]}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                ${stats.periodRevenue.toLocaleString('es-MX')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Ingresos Totales
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ${stats.totalRevenue.toLocaleString('es-MX')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Valor Promedio/Cliente
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ${stats.avgRevenuePerCustomer.toLocaleString('es-MX')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Stats Cards - Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Empresas Totales
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {stats.totalCompanies}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Suscripciones Activas
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {stats.activeSubscriptions}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                de {stats.totalSubscriptions} totales
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Tasa de Conversión
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                {stats.conversionRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trial → Activo
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2" gutterBottom>
                Churn Rate
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: stats.churnRate > 5 ? 'error.main' : 'success.main' }}>
                {stats.churnRate.toFixed(1)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cancelaciones
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Suscripciones — {periodLabels[period]}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="subscriptions" fill="#0074d4" name="Suscripciones" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Ingresos (MXN) — {periodLabels[period]}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#00c853" strokeWidth={2} name="Ingresos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
