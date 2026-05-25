import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, Button, Chip, LinearProgress,
  Alert, CircularProgress,
} from '@mui/material'
import { CreditCard } from '@mui/icons-material'
import api from '../../api/axios'

interface SuscripcionData {
  company: { id: string; nombre: string; status: string; trial_ends_at: string }
  subscription: { status: string; current_period_end: string; amount: number } | null
  plan: { nombre: string; precio: number; trial_days: number } | null
  daysLeft: number | null
}

export default function AdminSuscripcion() {
  const [data, setData] = useState<SuscripcionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await api.get('/admin/suscripcion')
      setData(res.data)
    } catch { setError('Error cargando información de suscripción') }
    finally { setLoading(false) }
  }

  const handleActivar = async () => {
    setActivating(true)
    setError('')
    try {
      const res = await api.post('/admin/suscripcion/iniciar')
      window.location.href = res.data.init_point
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar suscripción')
      setActivating(false)
    }
  }

  if (loading) return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>

  const status = data?.company?.status || 'trial'
  const statusColors: Record<string, 'info' | 'success' | 'error' | 'default'> = {
    trial: 'info', active: 'success', suspended: 'error', cancelled: 'default',
  }
  const statusLabels: Record<string, string> = {
    trial: 'Período de prueba', active: 'Activa', suspended: 'Suspendida', cancelled: 'Cancelada',
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Suscripción</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Estado actual</Typography>
            <Chip label={statusLabels[status]} color={statusColors[status]} />
          </Box>

          {status === 'trial' && data?.daysLeft !== null && data?.plan && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Te quedan <strong>{data.daysLeft}</strong> día{data.daysLeft !== 1 ? 's' : ''} de prueba gratuita
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, ((data.plan.trial_days - data.daysLeft) / data.plan.trial_days) * 100)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {status === 'active' && data?.subscription && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                Próxima renovación: {data.subscription.current_period_end
                  ? new Date(data.subscription.current_period_end).toLocaleDateString('es-MX')
                  : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monto: ${data.subscription.amount} MXN/mes
              </Typography>
            </Box>
          )}

          {status === 'suspended' && (
            <Typography variant="body2" color="error">
              Tu cuenta está suspendida. Activa tu suscripción para recuperar el acceso completo.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Plan info + activate */}
      {status !== 'active' && data?.plan && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{data.plan.nombre}</Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ${data.plan.precio} <Typography component="span" variant="body1" color="text.secondary">MXN/mes</Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Acceso completo: vacantes ilimitadas, análisis con IA, múltiples usuarios y exportación Excel.
            </Typography>
            <Button
              variant="contained" size="large" startIcon={<CreditCard />}
              onClick={handleActivar} disabled={activating}
            >
              {activating ? <CircularProgress size={24} color="inherit" /> : 'Activar suscripción'}
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
