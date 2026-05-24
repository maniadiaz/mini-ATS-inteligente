import { Chip } from '@mui/material'

interface Props {
  recomendacion: 'APTO' | 'NO APTO' | 'REVISAR'
}

export default function RecomendacionBadge({ recomendacion }: Props) {
  const colorMap: Record<string, 'success' | 'warning' | 'error'> = {
    'APTO': 'success',
    'REVISAR': 'warning',
    'NO APTO': 'error',
  }

  return (
    <Chip
      label={recomendacion}
      color={colorMap[recomendacion] || 'default'}
      size="small"
      sx={{ fontWeight: 700, fontSize: '0.75rem' }}
    />
  )
}
