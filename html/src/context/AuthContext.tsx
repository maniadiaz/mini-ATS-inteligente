import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

interface JWTPayload {
  id: string
  email: string
  role: 'superadmin' | 'admin' | 'recruiter'
  company_id: string | null
  company_nombre: string | null
  company_status: 'trial' | 'active' | 'suspended' | 'cancelled' | null
  trial_ends_at: string | null
  exp: number
}

interface AuthContextType {
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  role: JWTPayload['role'] | null
  companyStatus: JWTPayload['company_status']
  companyNombre: string | null
  isSuperAdmin: boolean
  isAdmin: boolean
  isRecruiter: boolean
  daysLeftTrial: number | null
  login: (token: string) => void
  logout: () => void
}

function decodeToken(token: string | null): JWTPayload | null {
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1])) as JWTPayload
  } catch {
    return null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ats_token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const verifyToken = async () => {
      const stored = localStorage.getItem('ats_token')

      if (!stored) {
        setToken(null)
        setLoading(false)
        return
      }

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/verify`,
          { headers: { Authorization: `Bearer ${stored}` } }
        )
        if (res.data.valid) {
          setToken(stored)
        } else {
          throw new Error('invalid')
        }
      } catch {
        localStorage.removeItem('ats_token')
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [])

  const payload = useMemo(() => decodeToken(token), [token])

  const login = (newToken: string) => {
    localStorage.setItem('ats_token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('ats_token')
    setToken(null)
    navigate('/login')
  }

  let daysLeftTrial: number | null = null
  if (payload?.company_status === 'trial' && payload?.trial_ends_at) {
    const diff = new Date(payload.trial_ends_at).getTime() - Date.now()
    daysLeftTrial = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const value: AuthContextType = {
    token,
    isAuthenticated: !!token && !!payload,
    loading,
    role: payload?.role || null,
    companyStatus: payload?.company_status || null,
    companyNombre: payload?.company_nombre || null,
    isSuperAdmin: payload?.role === 'superadmin',
    isAdmin: payload?.role === 'admin' || payload?.role === 'superadmin',
    isRecruiter: payload?.role === 'recruiter',
    daysLeftTrial,
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
