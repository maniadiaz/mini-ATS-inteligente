import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Alert, Snackbar,
} from '@mui/material'
import { Add, Edit, PersonOff } from '@mui/icons-material'
import api from '../../api/axios'
import { UserInfo } from '../../types'
import { useAuth } from '../../context/AuthContext'

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null)
  const [form, setForm] = useState({ nombre: '', email: '', password: '', role: 'recruiter' })
  const { role: myRole } = useAuth()

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/usuarios')
      setUsers(res.data)
    } catch { setError('Error cargando usuarios') }
  }

  const handleOpenNew = () => {
    setEditingUser(null)
    setForm({ nombre: '', email: '', password: '', role: 'recruiter' })
    setDialogOpen(true)
  }

  const handleOpenEdit = (user: UserInfo) => {
    setEditingUser(user)
    setForm({ nombre: user.nombre, email: user.email, password: '', role: user.role })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingUser) {
        const body: any = { nombre: form.nombre, role: form.role }
        if (form.password) body.password = form.password
        await api.patch(`/admin/usuarios/${editingUser.id}`, body)
        setSnackbar('Usuario actualizado')
      } else {
        await api.post('/admin/usuarios', form)
        setSnackbar('Usuario creado')
      }
      setDialogOpen(false)
      loadUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error guardando usuario')
    }
  }

  const handleDeactivate = async (user: UserInfo) => {
    try {
      await api.delete(`/admin/usuarios/${user.id}`)
      setSnackbar('Usuario desactivado')
      loadUsers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error desactivando usuario')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Usuarios</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenNew}>
          Agregar usuario
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Nombre</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rol</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.nombre}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Chip label={u.role} size="small" color={u.role === 'admin' ? 'primary' : 'default'} />
                </TableCell>
                <TableCell>
                  <Chip label={u.activo ? 'Activo' : 'Inactivo'} size="small" color={u.activo ? 'success' : 'default'} />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleOpenEdit(u)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  {u.activo && (
                    <IconButton size="small" color="error" onClick={() => handleDeactivate(u)}>
                      <PersonOff fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Nombre" margin="normal" value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          {!editingUser && (
            <TextField fullWidth label="Email" margin="normal" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          )}
          <TextField fullWidth label={editingUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            margin="normal" type="password" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editingUser} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select value={form.role} label="Rol" onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="recruiter">Reclutador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={3000} onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnackbar('')}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  )
}
