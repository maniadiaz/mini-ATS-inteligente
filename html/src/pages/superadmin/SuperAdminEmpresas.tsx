import { useState, useEffect } from 'react'
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Alert, Snackbar,
  Button, Collapse,
} from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp, Block, CheckCircle } from '@mui/icons-material'
import api from '../../api/axios'

interface EmpresaRow {
  id: string
  nombre: string
  rfc: string
  email: string
  status: string
  trial_ends_at: string
  subscription: any
  users_count: number
  vacantes_count: number
  cv_analizados_mes: number
  cv_limit: number
  cv_extras: number
  cv_porcentaje: number
  createdAt: string
}

const statusColors: Record<string, 'info' | 'success' | 'error' | 'default' | 'warning'> = {
  trial: 'info', active: 'success', suspended: 'error', cancelled: 'default',
}

type SubBadge = { label: string; color: 'success' | 'warning' | 'error' | 'default' }
const subscriptionBadge = (status: string): SubBadge => {
  const map: Record<string, SubBadge> = {
    authorized: { label: 'Activa',     color: 'success' },
    pending:    { label: 'Pendiente',  color: 'warning' },
    cancelled:  { label: 'Cancelada', color: 'default' },
    rejected:   { label: 'Rechazada', color: 'error'   },
    paused:     { label: 'Pausada',   color: 'warning' },
  }
  return map[status] ?? { label: status, color: 'default' }
}

export default function SuperAdminEmpresas() {
  const [empresas, setEmpresas] = useState<EmpresaRow[]>([])
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => { loadEmpresas() }, [])

  const loadEmpresas = async () => {
    try {
      const res = await api.get('/superadmin/empresas')
      setEmpresas(res.data)
    } catch { setError('Error cargando empresas') }
  }

  const handleToggleStatus = async (empresa: EmpresaRow) => {
    const newStatus = empresa.status === 'suspended' ? 'active' : 'suspended'
    try {
      await api.patch(`/superadmin/empresas/${empresa.id}/status`, { status: newStatus })
      setSnackbar(`Empresa ${newStatus === 'active' ? 'activada' : 'suspendida'}`)
      loadEmpresas()
    } catch { setError('Error actualizando status') }
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Empresas</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', width: 40 }} />
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Empresa</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>RFC</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Trial</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Usuarios</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Vacantes</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>CVs mes</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {empresas.map((e) => (
              <>
                <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                  <TableCell>
                    <IconButton size="small">
                      {expanded === e.id ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{e.nombre}</TableCell>
                  <TableCell>{e.rfc || '—'}</TableCell>
                  <TableCell>{e.email}</TableCell>
                  <TableCell><Chip label={e.status} size="small" color={statusColors[e.status] || 'default'} /></TableCell>
                  <TableCell>{e.trial_ends_at ? new Date(e.trial_ends_at).toLocaleDateString('es-MX') : '—'}</TableCell>
                  <TableCell>{e.users_count}</TableCell>
                  <TableCell>{e.vacantes_count}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, color: e.cv_porcentaje >= 100 ? 'error.main' : e.cv_porcentaje >= 80 ? 'warning.main' : 'text.primary' }}
                    >
                      {e.cv_analizados_mes} / {e.cv_limit}
                      {e.cv_extras > 0 && ` (+${e.cv_extras})`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {e.status === 'suspended' ? (
                      <IconButton size="small" color="success" onClick={(ev) => { ev.stopPropagation(); handleToggleStatus(e) }}>
                        <CheckCircle />
                      </IconButton>
                    ) : (
                      <IconButton size="small" color="error" onClick={(ev) => { ev.stopPropagation(); handleToggleStatus(e) }}>
                        <Block />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow key={`${e.id}-detail`}>
                  <TableCell colSpan={10} sx={{ py: 0 }}>
                    <Collapse in={expanded === e.id} unmountOnExit>
                      <Box sx={{ py: 2, px: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Registrada: {new Date(e.createdAt).toLocaleDateString('es-MX')}
                        </Typography>
                        {e.subscription && (() => {
                          const badge = subscriptionBadge(e.subscription.status)
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">Suscripción:</Typography>
                              <Chip label={badge.label} color={badge.color} size="small" />
                              {e.subscription.amount && (
                                <Typography variant="body2" color="text.secondary">— ${e.subscription.amount} MXN/mes</Typography>
                              )}
                            </Box>
                          )
                        })()}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnackbar('')}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  )
}
