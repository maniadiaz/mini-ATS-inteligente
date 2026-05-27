import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Card, CardContent,
  Chip, Grid, Skeleton, Alert, Avatar, alpha, useTheme,
} from '@mui/material'
import { Add, PeopleAlt, CalendarToday, TrendingUp } from '@mui/icons-material'
import api from '../api/axios'
import { Vacante } from '../types'
import { useAuth } from '../context/AuthContext'

function getVacanteStatus(v: Vacante): { label: string; color: 'success' | 'primary' | 'default' | 'error'; bg: string; fg: string } {
  const now = new Date()
  const inicio = v.fecha_inicio ? new Date(v.fecha_inicio) : null
  const fin = v.fecha_fin ? new Date(v.fecha_fin) : null
  if (!v.activa) return { label: 'Cerrada', color: 'default', bg: '#F3F4F6', fg: '#6B7280' }
  if (fin && now > fin) return { label: 'Vencida', color: 'error', bg: '#FEE2E2', fg: '#991B1B' }
  if (inicio && now < inicio) return { label: 'Programada', color: 'primary', bg: '#DBEAFE', fg: '#1E40AF' }
  return { label: 'Abierta', color: 'success', bg: '#DCFCE7', fg: '#166534' }
}

function getInitials(text: string): string {
  return text.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?'
}

const AVATAR_COLORS = ['#1A3C5E', '#2196F3', '#4CAF50', '#D97706', '#9C27B0', '#0891B2', '#DC2626']
function avatarColor(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) hash = text.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 12, px: 2 }} className="animate-fadeIn">
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Box sx={{
          width: 96, height: 96, borderRadius: '28px',
          bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="14" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.3"/>
            <path d="M16 14v-3a8 8 0 0 1 16 0v3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.3"/>
            <circle cx="34" cy="34" r="10" fill="currentColor" fillOpacity="0.9"/>
            <path d="M34 29v10M29 34h10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </Box>
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Crea tu primera vacante</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 340, mx: 'auto', lineHeight: 1.7 }}>
        Empieza a reclutar de forma inteligente. La IA analizará cada CV y te dará un score automático.
      </Typography>
      <Button variant="contained" startIcon={<Add />} size="large" onClick={onNew} sx={{ px: 4 }}>
        Crear primera vacante
      </Button>
    </Box>
  )
}

function VacanteCardSkeleton() {
  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="55%" height={18} />
            <Skeleton width="35%" height={14} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} sx={{ mt: 0.5 }} />
        <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5 }}>
          <Skeleton variant="rounded" width={52} height={22} />
          <Skeleton variant="rounded" width={52} height={22} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 1.5 }}>
          <Skeleton width={80} height={14} />
          <Skeleton width={60} height={14} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const [vacantes, setVacantes] = useState<Vacante[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)
  const navigate = useNavigate()
  const theme = useTheme()
  const { isSuperAdmin, companyNombre } = useAuth()

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

  const activas = vacantes.filter(v => v.activa).length
  const conCandidatos = vacantes.filter(v => (v.postulantes_count ?? 0) > 0).length

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.25, letterSpacing: '-0.3px' }}>
            {isSuperAdmin ? 'Mis vacantes' : 'Vacantes'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSuperAdmin && companyNombre
              ? companyNombre
              : vacantes.length > 0
                ? `${vacantes.length} vacante${vacantes.length !== 1 ? 's' : ''} en total`
                : 'Gestiona tus procesos de reclutamiento'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/vacante/nueva')}
          size="large"
          sx={{ flexShrink: 0 }}
        >
          Nueva vacante
        </Button>
      </Box>

      {/* ── Quick stats ── */}
      {!loading && vacantes.length > 0 && (
        <Box sx={{
          display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap',
        }}>
          {[
            { label: `${vacantes.length} total`, icon: <TrendingUp sx={{ fontSize: 13 }} /> },
            { label: `${activas} activa${activas !== 1 ? 's' : ''}`, icon: null, color: 'success.main' },
            { label: `${conCandidatos} con candidatos`, icon: <PeopleAlt sx={{ fontSize: 13 }} /> },
          ].map((stat, i) => (
            <Box key={i} sx={{
              display: 'flex', alignItems: 'center', gap: 0.5,
              px: 1.5, py: 0.5, borderRadius: '100px',
              bgcolor: alpha(theme.palette.primary.main, 0.06),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            }}>
              {stat.icon && <Box sx={{ color: 'text.secondary', display: 'flex' }}>{stat.icon}</Box>}
              <Typography variant="caption" sx={{ fontWeight: 600, color: stat.color || 'text.secondary' }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      {/* ── Skeleton loading ── */}
      {loading && (
        <Grid container spacing={2.5}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <VacanteCardSkeleton />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Empty state ── */}
      {!loading && vacantes.length === 0 && (
        <EmptyState onNew={() => navigate('/vacante/nueva')} />
      )}

      {/* ── Vacante grid ── */}
      {!loading && vacantes.length > 0 && (
        <Grid container spacing={2.5}>
          {vacantes.map((v) => {
            const status = getVacanteStatus(v)
            const skills = v.habilidades_requeridas
              ? v.habilidades_requeridas.split(',').map((s) => s.trim()).filter(Boolean)
              : []
            const maxSkills = 3
            const color = avatarColor(v.empresa || v.puesto)
            const isHovered = hovered === v.id

            return (
              <Grid item xs={12} sm={6} md={4} key={v.id}>
                <Card
                  sx={{
                    height: '100%', cursor: 'pointer', position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: theme.shadows[8],
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                  onClick={() => navigate(`/vacante/${v.id}`)}
                  onMouseEnter={() => setHovered(v.id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Status badge — absolute top-right */}
                  <Box sx={{
                    position: 'absolute', top: 14, right: 14,
                    px: 1, py: 0.25, borderRadius: '100px',
                    bgcolor: status.bg,
                    border: `1px solid ${alpha(status.fg, 0.2)}`,
                  }}>
                    <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: status.fg }}>
                      {status.label}
                    </Typography>
                  </Box>

                  <CardContent sx={{ p: 2.5, pb: '16px !important', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5, pr: 7 }}>
                      <Avatar sx={{
                        bgcolor: color, width: 44, height: 44,
                        fontSize: '0.95rem', fontWeight: 700, flexShrink: 0,
                        borderRadius: '12px',
                      }}>
                        {getInitials(v.empresa || v.puesto)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.25 }} noWrap>
                          {v.puesto}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {v.empresa}{v.area ? ` · ${v.area}` : ''}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" sx={{
                      mb: 1.5, lineHeight: 1.6, flexGrow: 1,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      minHeight: '3.2em',
                    }}>
                      {v.descripcion}
                    </Typography>

                    {/* Skills */}
                    {skills.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {skills.slice(0, maxSkills).map((s) => (
                          <Chip key={s} label={s} size="small" variant="outlined"
                            sx={{ fontSize: '0.68rem', height: 20, borderRadius: '4px' }} />
                        ))}
                        {skills.length > maxSkills && (
                          <Chip
                            label={`+${skills.length - maxSkills}`} size="small"
                            sx={{
                              fontSize: '0.68rem', height: 20, borderRadius: '4px',
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              color: 'primary.main', border: 'none',
                            }}
                          />
                        )}
                      </Box>
                    )}

                    {/* Footer */}
                    <Box sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      pt: 1.5, borderTop: `1px solid ${theme.palette.divider}`,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PeopleAlt sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {v.postulantes_count ?? 0} candidato{(v.postulantes_count ?? 0) !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: 11, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {v.createdAt
                            ? new Date(v.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                            : ''}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Hover CTA */}
                    {isHovered && (
                      <Box
                        className="animate-fadeIn"
                        sx={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          p: 1.5, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          borderRadius: '0 0 16px 16px',
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          Ver candidatos →
                        </Typography>
                      </Box>
                    )}
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
