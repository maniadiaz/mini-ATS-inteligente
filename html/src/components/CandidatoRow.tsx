import { useState } from 'react'
import {
  TableRow, TableCell, Collapse, Box, Typography, Chip,
  IconButton, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material'
import { KeyboardArrowDown, KeyboardArrowUp, Download, CheckCircle, Cancel } from '@mui/icons-material'
import { Postulacion } from '../types'
import ScoreBadge from './ScoreBadge'
import RecomendacionBadge from './RecomendacionBadge'
import api from '../api/axios'

interface Props {
  postulacion: Postulacion
  index: number
}

export default function CandidatoRow({ postulacion, index }: Props) {
  const [open, setOpen] = useState(false)
  const r = postulacion.resultado
  const match = r?.match_requisitos

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await api.get(`/cv/${postulacion.id}`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = postulacion.filename.split('_').slice(1).join('_') || 'cv.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando CV:', err)
    }
  }

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& > *': { borderBottom: open ? 'none' : undefined } }}
        onClick={() => setOpen(!open)}
      >
        <TableCell>
          <IconButton size="small">
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell>{index + 1}</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{postulacion.nombre}</TableCell>
        <TableCell>{postulacion.telefono}</TableCell>
        <TableCell>{postulacion.email}</TableCell>
        <TableCell><ScoreBadge score={r?.score_total || 0} /></TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {(match?.stack?.encontrados || []).map((tech) => (
              <Chip key={tech} label={tech} size="small" color="success" variant="outlined" />
            ))}
          </Box>
        </TableCell>
        <TableCell>{match?.ingles?.detalle?.substring(0, 25) || '-'}</TableCell>
        <TableCell><RecomendacionBadge recomendacion={r?.recomendacion || 'REVISAR'} /></TableCell>
        <TableCell>
          <IconButton size="small" onClick={handleDownload} color="primary">
            <Download />
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={10} sx={{ py: 0, borderBottom: open ? undefined : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 2, px: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                Resumen Ejecutivo
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {r?.resumen_ejecutivo}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Fortalezas</Typography>
                  <List dense>
                    {(r?.fortalezas || []).map((f, i) => (
                      <ListItem key={i} disablePadding>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={f} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Debilidades</Typography>
                  <List dense>
                    {(r?.debilidades || []).map((d, i) => (
                      <ListItem key={i} disablePadding>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Cancel color="error" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={d} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Stack Faltante</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(match?.stack?.faltantes || []).map((tech) => (
                    <Chip key={tech} label={tech} size="small" color="error" variant="outlined" />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>ATS Legibilidad</Typography>
                <Typography variant="body2">
                  Score: {r?.ats_legibilidad?.score}% — {r?.ats_legibilidad?.resumen}
                </Typography>
                {(r?.ats_legibilidad?.problemas || []).length > 0 && (
                  <List dense>
                    {r.ats_legibilidad.problemas.map((p, i) => (
                      <ListItem key={i} disablePadding>
                        <ListItemText primary={`• ${p}`} primaryTypographyProps={{ variant: 'body2', color: 'error' }} />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}
