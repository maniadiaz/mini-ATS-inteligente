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
  createdAt: string
}

const statusColors: Record<string, 'info' | 'success' | 'error' | 'default'> = {
  trial: 'info', active: 'success', suspended: 'error', cancelled: 'default',
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
                  <TableCell colSpan={9} sx={{ py: 0 }}>
                    <Collapse in={expanded === e.id} unmountOnExit>
                      <Box sx={{ py: 2, px: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Registrada: {new Date(e.createdAt).toLocaleDateString('es-MX')}
                        </Typography>
                        {e.subscription && (
                          <Typography variant="body2" color="text.secondary">
                            Suscripción: {e.subscription.status} — ${e.subscription.amount} MXN
                          </Typography>
                        )}
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
