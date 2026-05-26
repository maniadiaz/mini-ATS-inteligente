import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Card, CardContent,
  Chip, Grid, Skeleton, Alert, Avatar, alpha, useTheme,
} from '@mui/material'
import { Add, PeopleAlt, CalendarToday } from '@mui/icons-material'
import api from '../api/axios'
import { Vacante } from '../types'

function getVacanteStatus(v: Vacante): { label: string; color: 'success' | 'primary' | 'default' | 'error' } {
  const now = new Date()
  const inicio = v.fecha_inicio ? new Date(v.fecha_inicio) : null
  const fin = v.fecha_fin ? new Date(v.fecha_fin) : null
  if (!v.activa) return { label: 'Cerrada', color: 'default' }
  if (fin && now > fin) return { label: 'Vencida', color: 'error' }
  if (inicio && now < inicio) return { label: 'Programada', color: 'primary' }
  return { label: 'Abierta', color: 'success' }
}

function getInitials(text: string): string {
  return text.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?'
}

const AVATAR_COLORS = ['#1A3C5E', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#E91E63']
function avatarColor(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 10 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="120" height="120" rx="60" fill="currentColor" fillOpacity="0.06" />
          <rect x="28" y="38" width="64" height="10" rx="5" fill="currentColor" fillOpacity="0.15" />
          <rect x="28" y="55" width="48" height="8" rx="4" fill="currentColor" fillOpacity="0.1" />
          <rect x="28" y="70" width="40" height="8" rx="4" fill="currentColor" fillOpacity="0.1" />
          <circle cx="85" cy="85" r="18" fill="currentColor" fillOpacity="0.9" />
          <path d="M85 77v16M77 85h16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Aún no tienes vacantes</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 320, mx: 'auto' }}>
        Crea tu primera vacante para empezar a recibir y analizar candidatos con IA
      </Typography>
      <Button variant="contained" startIcon={<Add />} size="large" onClick={onNew}>
        Crear primera vacante
      </Button>
    </Box>
  )
}

export default function Dashboard() {
  const [vacantes, setVacantes] = useState<Vacante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const theme = useTheme()

  useEffect(() => { loadVacantes() }, [])

  const loadVacantes = async () => {
    try {
      const res = await api.get('/vacante')
      setVacantes(res.data)
    } catch {
      setError('Error cargando vacantes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25 }}>Mis vacantes</Typography>
          <Typography variant="body2" color="text.secondary">
            {vacantes.length > 0
              ? `${vacantes.length} vacante${vacantes.length !== 1 ? 's' : ''} en total`
              : 'Gestiona tus procesos de reclutamiento'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/vacante/nueva')} size="large">
          Nueva vacante
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {loading && (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Skeleton variant="circular" width={44} height={44} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton width="60%" height={20} />
                      <Skeleton width="40%" height={16} sx={{ mt: 0.5 }} />
                    </Box>
                  </Box>
                  <Skeleton width="100%" height={14} />
                  <Skeleton width="80%" height={14} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Skeleton variant="rounded" width={60} height={24} />
                    <Skeleton variant="rounded" width={60} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && vacantes.length === 0 && (
        <EmptyState onNew={() => navigate('/vacante/nueva')} />
      )}

      {!loading && vacantes.length > 0 && (
        <Grid container spacing={3}>
          {vacantes.map((v) => {
            const status = getVacanteStatus(v)
            const skills = v.habilidades_requeridas
              ? v.habilidades_requeridas.split(',').map((s) => s.trim()).filter(Boolean)
              : []
            const maxSkills = 3
            const color = avatarColor(v.empresa || v.puesto)
            return (
              <Grid item xs={12} sm={6} md={4} key={v.id}>
                <Card
                  sx={{
                    height: '100%', cursor: 'pointer',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[4], borderColor: 'primary.main' },
                  }}
                  onClick={() => navigate(`/vacante/${v.id}`)}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: color, width: 44, height: 44, fontSize: '1rem', fontWeight: 700 }}>
                        {getInitials(v.empresa || v.puesto)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                            {v.puesto}
                          </Typography>
                          <Chip label={status.label} color={status.color} size="small" sx={{ height: 20, fontSize: '0.7rem', flexShrink: 0 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {v.empresa}{v.area ? ` · ${v.area}` : ''}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2" color="text.secondary"
                      sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5, minHeight: '3em' }}
                    >
                      {v.descripcion}
                    </Typography>

                    {skills.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {skills.slice(0, maxSkills).map((s) => (
                          <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                        ))}
                        {skills.length > maxSkills && (
                          <Chip
                            label={`+${skills.length - maxSkills}`} size="small"
                            sx={{ fontSize: '0.7rem', height: 20, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }}
                          />
                        )}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleAlt sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {v.postulantes_count ?? 0} candidato{(v.postulantes_count ?? 0) !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 12, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {v.createdAt ? new Date(v.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }) : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}
