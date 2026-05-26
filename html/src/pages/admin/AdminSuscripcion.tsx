import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Button, Chip, LinearProgress,
  Alert, CircularProgress, Snackbar, Divider,
} from '@mui/material'
import { CreditCard, ShoppingCart } from '@mui/icons-material'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'

interface SuscripcionData {
  company: {
    id: string; nombre: string; status: string; trial_ends_at: string
    cv_analizados_mes: number; cv_limit: number; cv_extras: number
    cv_disponibles: number; cv_porcentaje: number
  }
  subscription: { status: string; current_period_end: string; amount: number } | null
  plan: { nombre: string; precio: number; trial_days: number } | null
  daysLeft: number | null
}

export default function AdminSuscripcion() {
  const { login } = useAuth()
  const [data, setData] = useState<SuscripcionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [buyingPack, setBuyingPack] = useState(false)
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  const refreshToken = async () => {
    try {
      const res = await api.get('/auth/refresh')
      login(res.data.token)
    } catch (err) {
      console.error('Error refrescando token:', err)
    }
  }

  useEffect(() => {
    loadData()
    
    // Handle subscription status
    const subStatus = searchParams.get('sub')
    if (subStatus === 'success') {
      setSnackbar('¡Suscripción activada exitosamente!')
      searchParams.delete('sub')
      setSearchParams(searchParams, { replace: true })
      refreshToken() // Refresh token to update company status
    } else if (subStatus === 'cancelled') {
      setError('Pago cancelado')
      searchParams.delete('sub')
      setSearchParams(searchParams, { replace: true })
    }
    
    // Handle CV pack status
    const packStatus = searchParams.get('pack')
    if (packStatus === 'success') {
      setSnackbar('¡Paquete de CVs activado exitosamente!')
      searchParams.delete('pack')
      setSearchParams(searchParams, { replace: true })
    } else if (packStatus === 'cancelled') {
      setError('Compra cancelada')
      searchParams.delete('pack')
      setSearchParams(searchParams, { replace: true })
    }
  }, [])

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
      window.location.href = res.data.url  // Stripe Checkout URL
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar suscripción')
      setActivating(false)
    }
  }

  const handleComprarPack = async () => {
    setBuyingPack(true)
    setError('')
    try {
      const res = await api.post('/admin/cvpack/comprar')
      window.location.href = res.data.url  // Stripe Checkout URL
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear pago')
      setBuyingPack(false)
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

  const cvPorcentaje = data?.company?.cv_porcentaje || 0
  const cvColor = cvPorcentaje >= 100 ? 'error' : cvPorcentaje >= 80 ? 'warning' : 'primary'

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Suscripción</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Subscription status card */}
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
                value={Math.max(0, ((data.plan.trial_days - data.daysLeft!) / data.plan.trial_days) * 100)}
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

      {/* CV Usage Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Uso de CVs este mes</Typography>

          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>{data?.company?.cv_analizados_mes || 0}</strong> de {data?.company?.cv_limit || 150} CVs analizados
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {cvPorcentaje}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, cvPorcentaje)}
              color={cvColor}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          {(data?.company?.cv_extras || 0) > 0 && (
            <Chip
              label={`+ ${data?.company?.cv_extras} CVs extra disponibles`}
              color="success" size="small" sx={{ mb: 1 }}
            />
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {data?.company?.cv_disponibles || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">CVs disponibles</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Del plan: <strong>{Math.max(0, (data?.company?.cv_limit || 150) - (data?.company?.cv_analizados_mes || 0))}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Extras: <strong>{data?.company?.cv_extras || 0}</strong>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Buy CV Pack Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>¿Necesitas más CVs?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paquete de 50 CVs adicionales — pago único, no se vencen mensualmente.
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
            $299 <Typography component="span" variant="body1" color="text.secondary">MXN</Typography>
          </Typography>
          <Button
            variant="outlined" size="large" startIcon={<ShoppingCart />}
            onClick={handleComprarPack} disabled={buyingPack}
          >
            {buyingPack ? <CircularProgress size={24} color="inherit" /> : 'Comprar paquete'}
          </Button>
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

      <Snackbar open={!!snackbar} autoHideDuration={5000} onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnackbar('')}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  )
}
