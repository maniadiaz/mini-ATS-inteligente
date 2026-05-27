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
      success: { main: '#16A34A', light: '#DCFCE7', dark: '#15803D' },
      warning: { main: '#D97706', light: '#FEF3C7', dark: '#B45309' },
      error: { main: '#DC2626', light: '#FEE2E2', dark: '#991B1B' },
      info: { main: '#2563EB', light: '#DBEAFE', dark: '#1E40AF' },
    },
    typography: {
      fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
      h1: { fontFamily: '"Sora", sans-serif', fontWeight: 800 },
      h2: { fontFamily: '"Sora", sans-serif', fontWeight: 700 },
      h3: { fontFamily: '"Sora", sans-serif', fontWeight: 700 },
      h4: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
      h5: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"Sora", sans-serif', fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' as const },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
              background: mode === 'light' ? '#D1CBC1' : '#3A3A38',
              borderRadius: '3px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            boxShadow:
              mode === 'light'
                ? '0 1px 4px rgba(0,0,0,0.05), 0 0 0 0 transparent'
                : '0 1px 4px rgba(0,0,0,0.4)',
            borderRadius: 16,
            transition: 'box-shadow 0.25s ease, transform 0.25s ease, border-color 0.2s ease',
          }),
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            letterSpacing: '0.01em',
          },
          containedPrimary: {
            background:
              mode === 'light'
                ? 'linear-gradient(135deg, #1A3C5E 0%, #1565C0 100%)'
                : 'linear-gradient(135deg, #4A9EDB 0%, #2196F3 100%)',
            boxShadow: 'none',
            '&:hover': {
              background:
                mode === 'light'
                  ? 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)'
                  : 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
              boxShadow: mode === 'light'
                ? '0 4px 14px rgba(26,60,94,0.35)'
                : '0 4px 14px rgba(74,158,219,0.35)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'scale(0.98)' },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': { borderWidth: '1.5px' },
          },
          sizeLarge: { height: 48, fontSize: '0.9375rem', px: 3 },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              transition: 'box-shadow 0.2s ease',
              '&.Mui-focused': {
                boxShadow: mode === 'light'
                  ? '0 0 0 3px rgba(26,60,94,0.12)'
                  : '0 0 0 3px rgba(74,158,219,0.2)',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500, borderRadius: 6 },
          sizeSmall: { fontSize: '0.72rem' },
        },
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
            backgroundColor:
              mode === 'light' ? '#F5F2EB' : '#252524',
            borderRight: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: ({ theme }) => ({
            '& .MuiTableCell-root': {
              backgroundColor: mode === 'light' ? '#F5F2EB' : '#252524',
              fontWeight: 700,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: theme.palette.text.secondary,
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
          }),
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: ({ theme }) => ({
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
          }),
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor: theme.palette.divider,
            padding: '12px 16px',
          }),
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 4, height: 6 } },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 8,
            transition: 'background-color 0.15s ease',
            '&.Mui-selected': {
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderLeft: `3px solid ${theme.palette.primary.main}`,
              color: theme.palette.primary.main,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.14) },
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 16 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: ({ theme }) => ({
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px !important',
            boxShadow: 'none',
            '&:before': { display: 'none' },
            '&.Mui-expanded': {
              boxShadow:
                mode === 'light'
                  ? '0 4px 16px rgba(0,0,0,0.08)'
                  : '0 4px 16px rgba(0,0,0,0.4)',
            },
          }),
        },
      },
    },
  })

export default getTheme('light')
