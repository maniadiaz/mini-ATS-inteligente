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

const AVATAR_COLORS = ['#1A3C5E','#2196F3','#4CAF50','#FF9800','#9C27B0','#00BCD4','#E91E63']
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
    } catch (err) {
      console.error('Error descargando CV:', err)
    }
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
        <TableCell sx={{ py: 1 }}>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            {open ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{index + 1}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, bgcolor: color, color: 'white' }}>
              {getInitials(postulacion.nombre)}
            </Avatar>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{postulacion.nombre}</Typography>
          </Box>
        </TableCell>
        <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{postulacion.telefono}</TableCell>
        <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{postulacion.email}</TableCell>
        <TableCell><ScoreBadge score={r?.score_total || 0} /></TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
            {(habilidades?.encontrados || []).slice(0, 3).map((item) => (
              <Chip key={item} label={item} size="small" color="success" variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }} />
            ))}
            {(habilidades?.encontrados || []).length > 3 && (
              <Chip label={`+${(habilidades?.encontrados || []).length - 3}`} size="small" variant="outlined"
                sx={{ fontSize: '0.7rem', height: 22 }} />
            )}
          </Box>
        </TableCell>
        <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
          {match?.ingles?.detalle?.substring(0, 20) || '—'}
        </TableCell>
        <TableCell><RecomendacionBadge recomendacion={r?.recomendacion || 'REVISAR'} /></TableCell>
        <TableCell>
          <IconButton size="small" onClick={handleDownload} color="primary">
            <Download fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Expanded detail */}
      <TableRow>
        <TableCell colSpan={10} sx={{ py: 0, border: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{
              py: 2.5, px: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.03),
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}>
              {/* Resumen ejecutivo */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.7, fontStyle: 'italic' }}>
                {r?.resumen_ejecutivo}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Fortalezas */}
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', display: 'block', mb: 1 }}>
                    Fortalezas
                  </Typography>
                  <List dense disablePadding>
                    {(r?.fortalezas || []).map((f, i) => (
                      <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <CheckCircle color="success" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText primary={f} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', display: 'block', mb: 1, mt: 2 }}>
                    Áreas de mejora
                  </Typography>
                  <List dense disablePadding>
                    {(r?.debilidades || []).map((d, i) => (
                      <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <Cancel color="error" sx={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText primary={d} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {/* Habilidades + Score detalle */}
                <Box>
                  {habilidades && (
                    <>
                      <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', display: 'block', mb: 1 }}>
                        Habilidades encontradas
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {(habilidades.encontrados || []).map(s => (
                          <Chip key={s} label={s} size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        ))}
                      </Box>
                      {(habilidades.faltantes || []).length > 0 && (
                        <>
                          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', display: 'block', mb: 1 }}>
                            Habilidades faltantes
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                            {(habilidades.faltantes || []).map(s => (
                              <Chip key={s} label={s} size="small" color="error" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                            ))}
                          </Box>
                        </>
                      )}
                    </>
                  )}

                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', display: 'block', mb: 1 }}>
                    Score ATS
                  </Typography>
                  <Chip
                    label={`${r?.score_total || 0}/100`}
                    size="small"
                    color={
                      (r?.score_total || 0) >= 75 ? 'success'
                      : (r?.score_total || 0) >= 50 ? 'warning'
                      : 'error'
                    }
                    sx={{ fontWeight: 700, fontSize: '0.85rem' }}
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
