import { useState, useEffect } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Alert,
} from '@mui/material'
import api from '../../api/axios'
import { SubscriptionInfo } from '../../types'

const statusColors: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  authorized: 'success', pending: 'warning', paused: 'error', cancelled: 'default',
}

export default function SuperAdminPagos() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionInfo[]>([])
  const [error, setError] = useState('')

  useEffect(() => { loadPagos() }, [])

  const loadPagos = async () => {
    try {
      const res = await api.get('/superadmin/pagos')
      setSubscriptions(res.data)
    } catch { setError('Error cargando pagos') }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Pagos y Suscripciones</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Empresa</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Monto</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Período actual</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Fecha creación</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">No hay suscripciones registradas</Typography>
                </TableCell>
              </TableRow>
            ) : subscriptions.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell sx={{ fontWeight: 600 }}>{sub.company?.nombre || '—'}</TableCell>
                <TableCell>${sub.amount} MXN</TableCell>
                <TableCell>
                  <Chip label={sub.status} size="small" color={statusColors[sub.status] || 'default'} />
                </TableCell>
                <TableCell>
                  {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('es-MX') : '—'}
                </TableCell>
                <TableCell>
                  {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('es-MX') : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
