import { Chip } from '@mui/material'

interface Props {
  score: number
}

export default function ScoreBadge({ score }: Props) {
  const color = score >= 70 ? '#4CAF50' : score >= 40 ? '#FF9800' : '#F44336'
  const bg = score >= 70 ? '#E8F5E9' : score >= 40 ? '#FFF3E0' : '#FFEBEE'

  return (
    <Chip
      label={`${score}%`}
      size="small"
      sx={{
        backgroundColor: bg,
        color: color,
        fontWeight: 700,
        fontSize: '0.85rem',
      }}
    />
  )
}
