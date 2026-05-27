import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Button, LinearProgress,
  Alert, CircularProgress, Snackbar, Divider, alpha, useTheme,
} from '@mui/material'
import {
  CreditCard, ShoppingCart, CheckCircle, Cancel,
  HourglassEmpty, CreditCardOff, StorefrontOutlined,
  AccessTime,
} from '@mui/icons-material'
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
  const theme = useTheme()
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
    } catch { /* silent */ }
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
    setActivating(true); setError('')
    try {
      const res = await api.post('/admin/suscripcion/iniciar')
      window.location.href = res.data.url
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar suscripción')
      setActivating(false)
    }
  }

  const handleComprarPack = async () => {
    setBuyingPack(true); setError('')
    try {
      const res = await api.post('/admin/cvpack/comprar')
      window.location.href = res.data.url
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear pago')
      setBuyingPack(false)
    }
  }

  if (loading) return (
    <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
  )

  const status = data?.company?.status || 'trial'
  const cvPorcentaje = data?.company?.cv_porcentaje || 0
  const cvColor = cvPorcentaje >= 80 ? 'error' : cvPorcentaje >= 60 ? 'warning' : 'primary'

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25, letterSpacing: '-0.3px' }}>
          Configuración
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {data?.company?.nombre}
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Sección 1: Suscripción ── */}
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', display: 'block', mb: 1.5 }}>
        Estado de suscripción
      </Typography>

      {/* TRIAL */}
      {status === 'trial' && (
        <Card sx={{ mb: 2, borderColor: alpha(theme.palette.info.main, 0.3) }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Box sx={{
                    px: 1.5, py: 0.5, borderRadius: '100px',
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'info.dark' }}>
                      Período de prueba
                    </Typography>
                  </Box>
                  <HourglassEmpty sx={{ fontSize: 16, color: 'info.main' }} />
                </Box>

                {data?.daysLeft !== null && data?.plan && (
                  <Box sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                      <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: '"Sora", sans-serif', color: 'info.dark', lineHeight: 1 }}>
                        {data.daysLeft}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        día{data.daysLeft !== 1 ? 's' : ''} restante{data.daysLeft !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.max(0, ((data.plan.trial_days - (data.daysLeft ?? 0)) / data.plan.trial_days) * 100)}
                      color="info"
                      sx={{ height: 6, borderRadius: 3, mb: 1 }}
                    />
                    {data.company?.trial_ends_at && (
                      <Typography variant="caption" color="text.secondary">
                        Vence el {formatDate(data.company.trial_ends_at)}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                {data?.plan && (
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontFamily: '"Sora", sans-serif' }}>
                    ${data.plan.precio.toLocaleString('es-MX')}<Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}> MXN/mes</Typography>
                  </Typography>
                )}
                <Button
                  variant="contained" size="large" startIcon={<CreditCard />}
                  onClick={handleActivar} disabled={activating}
                  sx={{ mt: 1 }}
                >
                  {activating ? <CircularProgress size={22} color="inherit" /> : 'Activar suscripción'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* ACTIVE */}
      {status === 'active' && (
        <Card sx={{ mb: 2, borderColor: alpha(theme.palette.success.main, 0.3) }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <CheckCircle color="success" />
              <Box sx={{
                px: 1.5, py: 0.5, borderRadius: '100px',
                bgcolor: alpha(theme.palette.success.main, 0.1),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.dark' }}>
                  Suscripción activa
                </Typography>
              </Box>
            </Box>
            {data?.subscription && (
              <Box>
                <Typography variant="body1" sx={{ mb: 0.5 }}>
                  Tu suscripción se renueva el{' '}
                  <strong>
                    {data.subscription.current_period_end
                      ? formatDate(data.subscription.current_period_end)
                      : '—'}
                  </strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monto: <strong>${data.subscription.amount?.toLocaleString('es-MX')} MXN/mes</strong>
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* SUSPENDED */}
      {status === 'suspended' && (
        <Card sx={{ mb: 2, borderColor: alpha(theme.palette.error.main, 0.3), bgcolor: alpha(theme.palette.error.main, 0.03) }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Cancel color="error" />
              <Box sx={{
                px: 1.5, py: 0.5, borderRadius: '100px',
                bgcolor: alpha(theme.palette.error.main, 0.1),
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.dark' }}>
                  Cuenta suspendida
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Tu cuenta está suspendida. Activa tu suscripción para recuperar el acceso completo.
            </Typography>
            <Button variant="contained" color="error" size="large" startIcon={<CreditCard />}
              onClick={handleActivar} disabled={activating}>
              {activating ? <CircularProgress size={22} color="inherit" /> : 'Reactivar suscripción'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending/cancelled/rejected alerts */}
      {data?.subscription?.status === 'pending' && status !== 'active' && (
        <Alert severity="warning" icon={<HourglassEmpty />} sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={handleActivar} disabled={activating}>
            {activating ? <CircularProgress size={16} color="inherit" /> : 'Reintentar'}
          </Button>}>
          Tienes un pago pendiente. Si ya iniciaste el proceso, termínalo o inténtalo de nuevo.
        </Alert>
      )}
      {data?.subscription?.status === 'cancelled' && status !== 'active' && (
        <Alert severity="info" icon={<AccessTime />} sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={handleActivar} disabled={activating}>
            {activating ? <CircularProgress size={16} color="inherit" /> : 'Iniciar pago'}
          </Button>}>
          Tu proceso de pago fue cancelado. Puedes intentarlo cuando quieras.
        </Alert>
      )}
      {data?.subscription?.status === 'rejected' && status !== 'active' && (
        <Alert severity="error" icon={<CreditCardOff />} sx={{ mb: 2 }}
          action={<Button color="inherit" size="small" onClick={handleActivar} disabled={activating}>
            {activating ? <CircularProgress size={16} color="inherit" /> : 'Otra tarjeta'}
          </Button>}>
          Tu pago fue rechazado. Verifica los datos de tu tarjeta e intenta de nuevo.
        </Alert>
      )}

      {/* ── Sección 2: Uso de CVs ── */}
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', display: 'block', mt: 4, mb: 1.5 }}>
        Uso de CVs este mes
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: '"Sora", sans-serif', lineHeight: 1, mb: 0.25 }}>
                {data?.company?.cv_analizados_mes || 0}
                <Typography component="span" variant="h5" color="text.secondary" sx={{ fontWeight: 400, ml: 0.5 }}>
                  / {data?.company?.cv_limit || 150}
                </Typography>
              </Typography>
              <Typography variant="body2" color="text.secondary">CVs analizados este mes</Typography>
            </Box>
            <Box sx={{
              px: 2, py: 1, borderRadius: '100px',
              bgcolor: alpha(
                cvPorcentaje >= 80
                  ? theme.palette.error.main
                  : cvPorcentaje >= 60
                  ? theme.palette.warning.main
                  : theme.palette.primary.main,
                0.1
              ),
            }}>
              <Typography variant="h6" sx={{
                fontWeight: 700,
                color: cvPorcentaje >= 80 ? 'error.main' : cvPorcentaje >= 60 ? 'warning.main' : 'primary.main',
              }}>
                {cvPorcentaje}%
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(100, cvPorcentaje)}
            color={cvColor}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Disponibles del plan</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {Math.max(0, (data?.company?.cv_limit || 150) - (data?.company?.cv_analizados_mes || 0))}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary">CVs extra</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {data?.company?.cv_extras || 0}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box>
              <Typography variant="caption" color="text.secondary">Total disponible</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {data?.company?.cv_disponibles || 0}
              </Typography>
            </Box>
          </Box>

          {status === 'trial' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              En modo de prueba puedes analizar hasta <strong>10 CVs</strong>.
              Al activar tu suscripción sube a <strong>{data?.company?.cv_limit || 150} CVs/mes</strong>.
            </Alert>
          )}
          {cvPorcentaje >= 80 && status !== 'trial' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Estás usando más del 80% de tu límite mensual. Considera comprar un paquete extra.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* ── Sección 3: Paquete extra ── */}
      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', display: 'block', mt: 4, mb: 1.5 }}>
        CVs adicionales
      </Typography>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flex: 1 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: '12px',
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <StorefrontOutlined color="primary" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.25 }}>
                  Paquete 50 CVs adicionales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pago único — no se vencen mensualmente
                </Typography>
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Sora", sans-serif', mb: 1 }}>
                $299<Typography component="span" variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}> MXN</Typography>
              </Typography>
              <Button variant="outlined" startIcon={<ShoppingCart />} onClick={handleComprarPack} disabled={buyingPack}>
                {buyingPack ? <CircularProgress size={20} color="inherit" /> : 'Comprar paquete'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar open={!!snackbar} autoHideDuration={5000} onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnackbar('')}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  )
}
