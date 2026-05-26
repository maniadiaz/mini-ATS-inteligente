import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ats_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const TOKEN_ERRORS = ['TOKEN_EXPIRED', 'TOKEN_INVALID', 'TOKEN_MISSING']

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.error
      if (TOKEN_ERRORS.includes(errorCode)) {
        localStorage.removeItem('ats_token')
        window.location.href = '/login'
      }
    }
    if (error.response?.status === 403 && error.response?.data?.redirect) {
      window.location.href = error.response.data.redirect
    }
    return Promise.reject(error)
  }
)

export default api
