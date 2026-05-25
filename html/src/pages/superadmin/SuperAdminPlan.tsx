import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Button,
  Alert, Snackbar, Chip, Divider, CircularProgress,
} from '@mui/material'
import { Sync } from '@mui/icons-material'
import api from '../../api/axios'
import { PlanInfo } from '../../types'

export default function SuperAdminPlan() {
  const [plan, setPlan] = useState<PlanInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState('')

  useEffect(() => { loadPlan() }, [])

  const loadPlan = async () => {
    try {
      const res = await api.get('/superadmin/plan')
      setPlan(res.data)
    } catch { setError('Error cargando plan') }
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!plan) return
    setSaving(true)
    try {
      const res = await api.patch('/superadmin/plan', {
        nombre: plan.nombre,
        precio: plan.precio,
        trial_days: plan.trial_days,
      })
      setPlan(res.data)
      setSnackbar('Plan actualizado')
    } catch { setError('Error guardando plan') }
    finally { setSaving(false) }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    try {
      const res = await api.post('/superadmin/plan/sync-mp')
      setPlan((prev) => prev ? { ...prev, mp_plan_id: res.data.mp_plan_id } : prev)
      setSnackbar('Plan sincronizado con Mercado Pago')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error sincronizando con MP')
    } finally { setSyncing(false) }
  }

  if (loading) return <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /></Box>
  if (!plan) return <Alert severity="error">Plan no encontrado</Alert>

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Configuración del Plan</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Datos del Plan</Typography>
          <TextField fullWidth label="Nombre del plan" margin="normal"
            value={plan.nombre} onChange={(e) => setPlan({ ...plan, nombre: e.target.value })} />
          <TextField fullWidth label="Precio MXN/mes" margin="normal" type="number"
            value={plan.precio} onChange={(e) => setPlan({ ...plan, precio: parseFloat(e.target.value) || 0 })} />
          <TextField fullWidth label="Días de trial" margin="normal" type="number"
            value={plan.trial_days} onChange={(e) => setPlan({ ...plan, trial_days: parseInt(e.target.value) || 14 })} />
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ mt: 2 }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : 'Guardar cambios'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Mercado Pago</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Plan ID:</Typography>
            {plan.mp_plan_id ? (
              <Chip label={plan.mp_plan_id} size="small" color="success" />
            ) : (
              <Chip label="No sincronizado" size="small" color="warning" />
            )}
          </Box>
          <Button variant="outlined" startIcon={<Sync />} onClick={handleSync} disabled={syncing}>
            {syncing ? <CircularProgress size={20} color="inherit" /> : 'Sincronizar con Mercado Pago'}
          </Button>
        </CardContent>
      </Card>

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnackbar('')}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  )
}
