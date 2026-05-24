import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  Chip, Grid, Skeleton, Alert,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import api from '../api/axios'
import { Vacante } from '../types'

export default function Dashboard() {
  const [vacantes, setVacantes] = useState<Vacante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadVacantes()
  }, [])

  const loadVacantes = async () => {
    try {
      const res = await api.get('/vacante')
      setVacantes(res.data)
    } catch (err: any) {
      setError('Error cargando vacantes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Vacantes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/vacante/nueva')}
        >
          Nueva Vacante
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} md={6} lg={4} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : vacantes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No hay vacantes aún
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Crea tu primera vacante para empezar a recibir candidatos
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/vacante/nueva')}>
            Crear Vacante
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {vacantes.map((v) => (
            <Grid item xs={12} md={6} lg={4} key={v.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {v.puesto}
                    </Typography>
                    <Chip
                      label={v.activa ? 'Activa' : 'Inactiva'}
                      color={v.activa ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {v.empresa}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {v.descripcion.substring(0, 120)}{v.descripcion.length > 120 ? '...' : ''}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {v.stack.split(',').slice(0, 4).map((tech) => (
                      <Chip key={tech.trim()} label={tech.trim()} size="small" variant="outlined" />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {v.postulaciones.length} postulante{v.postulaciones.length !== 1 ? 's' : ''}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/vacante/${v.id}`)}
                  >
                    Ver candidatos
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
