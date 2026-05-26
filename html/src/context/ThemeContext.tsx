import { createContext, useContext, useState, ReactNode } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { getTheme } from '../theme'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  mode: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
})

export const useThemeMode = () => useContext(ThemeContext)

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('ats_theme')
    return (saved as ThemeMode) || 'light'
  })

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('ats_theme', next)
      return next
    })
  }

  const theme = getTheme(mode)

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
