import { useState } from 'react'
import {
  TableRow, TableCell, Collapse, Box, Typography, Chip,
  IconButton, List, ListItem, ListItemIcon, ListItemText,
  Avatar, alpha, useTheme,
} from '@mui/material'
import {
  KeyboardArrowDown, KeyboardArrowUp, Download,
  CheckCircle, Cancel,
} from '@mui/icons-material'
import { Postulacion } from '../types'
import ScoreBadge from './ScoreBadge'
import RecomendacionBadge from './RecomendacionBadge'
import api from '../api/axios'

interface Props {
  postulacion: Postulacion
  index: number
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?'
}

const AVATAR_COLORS = ['#1A3C5E', '#2196F3', '#4CAF50', '#D97706', '#9C27B0', '#0891B2', '#DC2626']
function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function CandidatoRow({ postulacion, index }: Props) {
  const [open, setOpen] = useState(false)
  const theme = useTheme()
  const r = postulacion.resultado
  const match = r?.match_requisitos
  const habilidades = match?.habilidades || match?.stack

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await api.get(`/cv/${postulacion.id}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = postulacion.filename.split('_').slice(1).join('_') || 'cv.pdf'
      document.body.appendChild(link); link.click(); link.remove()
      window.URL.revokeObjectURL(url)
    } catch { /* silent */ }
  }

  const color = avatarColor(postulacion.nombre)

  return (
    <>
      <TableRow
        hover
        sx={{
          cursor: 'pointer',
          '& > *': { borderBottom: open ? 'none' : undefined },
          ...(open && { bgcolor: alpha(theme.palette.primary.main, 0.03) }),
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell sx={{ py: 1.5 }}>
          <IconButton size="small" sx={{ color: 'text.secondary', transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'none' }}>
            <KeyboardArrowDown fontSize="small" />
          </IconButton>
        </TableCell>

        <TableCell sx={{ color: 'text.disabled', fontSize: '0.78rem', fontWeight: 600 }}>
          {index + 1}
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{
              width: 34, height: 34, fontSize: '0.75rem', fontWeight: 700,
              bgcolor: color, color: 'white', borderRadius: '9px',
            }}>
              {getInitials(postulacion.nombre)}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {postulacion.nombre}
              </Typography>
            </Box>
          </Box>
        </TableCell>

        <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
          {postulacion.telefono}
        </TableCell>

        <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
          {postulacion.email}
        </TableCell>

        <TableCell>
          <ScoreBadge score={r?.score_total || 0} />
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
            {(habilidades?.encontrados || []).slice(0, 3).map((item) => (
              <Chip key={item} label={item} size="small" color="success" variant="outlined"
                sx={{ fontSize: '0.68rem', height: 20, borderRadius: '4px' }} />
            ))}
            {(habilidades?.encontrados || []).length > 3 && (
              <Chip
                label={`+${(habilidades?.encontrados || []).length - 3}`} size="small"
                sx={{ fontSize: '0.68rem', height: 20, borderRadius: '4px' }}
              />
            )}
          </Box>
        </TableCell>

        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          {match?.ingles?.detalle?.substring(0, 18) || '—'}
        </TableCell>

        <TableCell>
          <RecomendacionBadge recomendacion={r?.recomendacion || 'REVISAR'} />
        </TableCell>

        <TableCell>
          <IconButton size="small" onClick={handleDownload} color="primary">
            <Download fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* ── Expanded detail ── */}
      <TableRow>
        <TableCell colSpan={10} sx={{ py: 0, border: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{
              py: 3, px: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.025),
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}>
              {/* Resumen ejecutivo */}
              {r?.resumen_ejecutivo && (
                <Box sx={{
                  p: 2, borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.04),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  mb: 3,
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Resumen ejecutivo
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {r.resumen_ejecutivo}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                {/* Fortalezas */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'success.dark', display: 'block', mb: 1 }}>
                    Fortalezas
                  </Typography>
                  <List dense disablePadding>
                    {(r?.fortalezas || []).map((f, i) => (
                      <ListItem key={i} disablePadding sx={{ mb: 0.5, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 24, mt: 0.25 }}>
                          <CheckCircle color="success" sx={{ fontSize: 14 }} />
                        </ListItemIcon>
                        <ListItemText primary={f} primaryTypographyProps={{ variant: 'body2', lineHeight: 1.5 }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {/* Debilidades */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'error.dark', display: 'block', mb: 1 }}>
                    Áreas de mejora
                  </Typography>
                  <List dense disablePadding>
                    {(r?.debilidades || []).map((d, i) => (
                      <ListItem key={i} disablePadding sx={{ mb: 0.5, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 24, mt: 0.25 }}>
                          <Cancel color="error" sx={{ fontSize: 14 }} />
                        </ListItemIcon>
                        <ListItemText primary={d} primaryTypographyProps={{ variant: 'body2', lineHeight: 1.5 }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {/* Habilidades + Score */}
                <Box>
                  {habilidades && (
                    <>
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 1 }}>
                        Habilidades encontradas
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {(habilidades.encontrados || []).map(s => (
                          <Chip key={s} label={s} size="small" color="success" variant="outlined" sx={{ fontSize: '0.68rem', borderRadius: '4px' }} />
                        ))}
                      </Box>
                      {(habilidades.faltantes || []).length > 0 && (
                        <>
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 1 }}>
                            Faltantes
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                            {(habilidades.faltantes || []).map(s => (
                              <Chip key={s} label={s} size="small" color="error" variant="outlined" sx={{ fontSize: '0.68rem', borderRadius: '4px' }} />
                            ))}
                          </Box>
                        </>
                      )}
                    </>
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mb: 1 }}>
                    Score ATS
                  </Typography>
                  <Chip
                    label={`${r?.score_total || 0} / 100`}
                    color={(r?.score_total || 0) >= 75 ? 'success' : (r?.score_total || 0) >= 50 ? 'warning' : 'error'}
                    sx={{ fontWeight: 700, fontSize: '0.82rem', borderRadius: '6px' }}
                  />
                </Box>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}
