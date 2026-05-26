import { createTheme, Theme, alpha } from '@mui/material'

export const getTheme = (mode: 'light' | 'dark'): Theme =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === 'light' ? '#1A3C5E' : '#4A9EDB' },
      secondary: { main: '#2196F3' },
      background: {
        default: mode === 'light' ? '#F9F6F0' : '#1F1F1E',
        paper: mode === 'light' ? '#FFFFFF' : '#2A2A29',
      },
      text: {
        primary: mode === 'light' ? '#1A1A1A' : '#F5F5F5',
        secondary: mode === 'light' ? '#6B7280' : '#9CA3AF',
      },
      divider: mode === 'light' ? '#E5E0D8' : '#3A3A38',
      success: { main: '#4CAF50' },
      warning: { main: '#FF9800' },
      error: { main: '#F44336' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { transition: 'background-color 0.3s ease, color 0.3s ease' },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: mode === 'light' ? '0 1px 3px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease',
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', fontWeight: 600 },
          containedPrimary: {
            background: mode === 'light'
              ? 'linear-gradient(135deg, #1A3C5E 0%, #1565C0 100%)'
              : 'linear-gradient(135deg, #4A9EDB 0%, #2196F3 100%)',
            '&:hover': {
              background: mode === 'light'
                ? 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)'
                : 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 500 } },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: 'none',
          }),
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiTableCell-root': {
              backgroundColor: mode === 'light' ? '#F3F4F6' : '#2A2A29',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: theme.palette.text.secondary,
            },
          }),
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }),
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 4 } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.15) },
            },
          }),
        },
      },
    },
  })

export default getTheme('light')
