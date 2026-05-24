import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box, Typography, TextField, IconButton, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, Button, Snackbar,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Skeleton, Grid,
} from '@mui/material'
import { ContentCopy, Download } from '@mui/icons-material'
import api from '../api/axios'
import { Vacante, Postulacion } from '../types'
import CandidatoRow from '../components/CandidatoRow'

export default function VacanteDashboard() {
  const { vid } = useParams<{ vid: string }>()
  const [vacante, setVacante] = useState<Vacante | null>(null)
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState('')
  const [filtroRec, setFiltroRec] = useState('')
  const [orden, setOrden] = useState('score')

  useEffect(() => {
    loadData()
  }, [vid, filtroRec, orden])

  const loadData = async () => {
    try {
      const params: Record<string, string> = {}
      if (filtroRec) params.recomendacion = filtroRec
      if (orden) params.orden = orden

      const res = await api.get(`/vacante/${vid}/dashboard`, { params })
      setVacante(res.data.vacante)
      setPostulaciones(res.data.postulaciones)
    } catch (err: any) {
      setError('Error cargando datos de la vacante')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/postular/${vid}`
    navigator.clipboard.writeText(link)
    setSnackbar('Link copiado al portapapeles')
  }

  const handleExport = async () => {
    try {
      const response = await api.get(`/vacante/${vid}/exportar`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `candidatos_${vacante?.puesto || 'export'}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error exportando Excel')
    }
  }

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      </Box>
    )
  }

  if (!vacante) {
    return <Alert severity="error">Vacante no encontrada</Alert>
  }

  // Calculate metrics
  const total = postulaciones.length
  const aptos = postulaciones.filter(p => p.resultado?.recomendacion === 'APTO').length
  const revisar = postulaciones.filter(p => p.resultado?.recomendacion === 'REVISAR').length
  const noAptos = postulaciones.filter(p => p.resultado?.recomendacion === 'NO APTO').length

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {vacante.puesto}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {vacante.empresa} &middot; {vacante.anios_exp} años exp. &middot; Stack: {vacante.stack}
        </Typography>
      </Box>

      {/* Public link */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Link público para candidatos
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              value={`${window.location.origin}/postular/${vid}`}
              InputProps={{ readOnly: true }}
            />
            <IconButton color="primary" onClick={handleCopyLink}>
              <ContentCopy />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{total}</Typography>
              <Typography variant="body2" color="text.secondary">Total</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#4CAF50' }}>
                {total > 0 ? Math.round((aptos / total) * 100) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Aptos</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#FF9800' }}>
                {total > 0 ? Math.round((revisar / total) * 100) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">Revisar</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#F44336' }}>
                {total > 0 ? Math.round((noAptos / total) * 100) : 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary">No Aptos</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters + Export */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Recomendación</InputLabel>
          <Select
            value={filtroRec}
            label="Recomendación"
            onChange={(e) => setFiltroRec(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="APTO">APTO</MenuItem>
            <MenuItem value="REVISAR">REVISAR</MenuItem>
            <MenuItem value="NO APTO">NO APTO</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Ordenar por</InputLabel>
          <Select
            value={orden}
            label="Ordenar por"
            onChange={(e) => setOrden(e.target.value)}
          >
            <MenuItem value="score">Score % (desc)</MenuItem>
            <MenuItem value="nombre">Nombre A-Z</MenuItem>
            <MenuItem value="fecha">Más reciente</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExport}
          sx={{ ml: 'auto' }}
        >
          Exportar Excel
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Table */}
      {postulaciones.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', width: 40 }} />
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Teléfono</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Score %</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Stack encontrado</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Inglés</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Recomendación</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>CV</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {postulaciones.map((p, idx) => (
                <CandidatoRow key={p.id} postulacion={p} index={idx} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            No hay postulantes{filtroRec ? ` con filtro "${filtroRec}"` : ''}.
          </Typography>
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbar('')}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  )
}
