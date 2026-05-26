import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Button, Chip, LinearProgress,
  Alert, CircularProgress, Snackbar, Divider,
} from '@mui/material'
import { CreditCard, ShoppingCart, CheckCircle, Warning, Cancel } from '@mui/icons-material'
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

export default function AdminConfiguracion() {
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

    const subStatus = searchParams.get('sub')
    if (subStatus === 'success') {
      setSnackbar('¡Suscripción activada exitosamente!')
      searchParams.delete('sub')
      setSearchParams(searchParams, { replace: true })
      refreshToken()
    } else if (subStatus === 'cancelled') {
      setError('Pago cancelado')
      searchParams.delete('sub')
      setSearchParams(searchParams, { replace: true })
    }

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
    } catch { setError('Error cargando información') }
    finally { setLoading(false) }
  }

  const handleActivar = async () => {
    setActivating(true)
    setError('')
    try {
      const res = await api.post('/admin/suscripcion/iniciar')
      window.location.href = res.data.url
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
      window.location.href = res.data.url
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear pago')
      setBuyingPack(false)
    }
  }

  if (loading) return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>

  const status = data?.company?.status || 'trial'
  const cvPorcentaje = data?.company?.cv_porcentaje || 0
  const cvColor = cvPorcentaje >= 100 ? 'error' : cvPorcentaje >= 80 ? 'warning' : 'primary'

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Configuración</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ─── Sección 1: Estado de suscripción ─── */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>Estado de suscripción</Typography>

      {status === 'trial' && (
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'info.light' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Warning color="info" />
              <Chip label="Período de prueba" color="info" />
            </Box>
            {data?.daysLeft !== null && data?.plan && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Te quedan <strong>{data.daysLeft}</strong> día{data.daysLeft !== 1 ? 's' : ''} de tu período gratuito
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(0, ((data.plan.trial_days - data.daysLeft!) / data.plan.trial_days) * 100)}
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                {data.company?.trial_ends_at && (
                  <Typography variant="body2" color="text.secondary">
                    Vence el {new Date(data.company.trial_ends_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                )}
              </Box>
            )}
            {data?.plan && (
              <Button
                variant="contained" size="large" startIcon={<CreditCard />}
                onClick={handleActivar} disabled={activating}
              >
                {activating
                  ? <CircularProgress size={24} color="inherit" />
                  : `Activar suscripción — $${data.plan.precio} MXN/mes`}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {status === 'active' && (
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'success.light' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CheckCircle color="success" />
              <Chip label="Suscripción activa" color="success" />
            </Box>
            {data?.subscription && (
              <>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  Tu suscripción se renueva el{' '}
                  <strong>
                    {data.subscription.current_period_end
                      ? new Date(data.subscription.current_period_end).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                      : '—'}
                  </strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monto: <strong>${data.subscription.amount} MXN/mes</strong>
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {status === 'suspended' && (
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'error.light' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Cancel color="error" />
              <Chip label="Cuenta suspendida" color="error" />
            </Box>
            <Typography variant="body2" color="error" sx={{ mb: 2 }}>
              Tu cuenta está suspendida. Activa tu suscripción para recuperar el acceso completo.
            </Typography>
            {data?.plan && (
              <Button
                variant="contained" color="error" size="large" startIcon={<CreditCard />}
                onClick={handleActivar} disabled={activating}
              >
                {activating ? <CircularProgress size={24} color="inherit" /> : 'Reactivar suscripción'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Sección 2: Uso de CVs ─── */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>Uso de CVs este mes</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
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

          {status === 'trial' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              En modo de prueba puedes analizar hasta <strong>10 CVs</strong>.
              Al activar tu suscripción el límite sube a <strong>150 CVs/mes</strong>.
            </Alert>
          )}

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

      {/* Buy CV Pack */}
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

      <Snackbar open={!!snackbar} autoHideDuration={5000} onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnackbar('')}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  )
}
