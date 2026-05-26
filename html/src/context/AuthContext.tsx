import { createContext, useContext, useState, useMemo, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface JWTPayload {
  id: string
  email: string
  role: 'superadmin' | 'admin' | 'recruiter'
  company_id: string | null
  company_nombre: string | null
  company_status: 'trial' | 'active' | 'suspended' | 'cancelled' | null
  exp: number
}

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  role: JWTPayload['role'] | null
  companyStatus: JWTPayload['company_status']
  companyNombre: string | null
  isSuperAdmin: boolean
  isAdmin: boolean
  isRecruiter: boolean
  login: (token: string) => void
  logout: () => void
}

function decodeToken(token: string | null): JWTPayload | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload as JWTPayload
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ats_token'))
  const navigate = useNavigate()

  const payload = useMemo(() => decodeToken(token), [token])

  // Clear localStorage if token is invalid or expired
  const isTokenValid = !!token && !!payload && payload.exp * 1000 > Date.now()
  
  if (token && !isTokenValid) {
    localStorage.removeItem('ats_token')
    setToken(null)
  }

  const login = (newToken: string) => {
    localStorage.setItem('ats_token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('ats_token')
    setToken(null)
    navigate('/login')
  }

  const value: AuthContextType = {
    token,
    isAuthenticated: isTokenValid,
    role: payload?.role || null,
    companyStatus: payload?.company_status || null,
    companyNombre: payload?.company_nombre || null,
    isSuperAdmin: payload?.role === 'superadmin',
    isAdmin: payload?.role === 'admin' || payload?.role === 'superadmin',
    isRecruiter: payload?.role === 'recruiter',
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
