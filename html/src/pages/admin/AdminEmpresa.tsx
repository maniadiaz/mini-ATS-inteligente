import { useState, useEffect } from 'react'
import {
  Box, Typography, TextField, Button, Card, CardContent,
  CircularProgress, Alert, Snackbar, Skeleton,
} from '@mui/material'
import { Save, Business, Upload as UploadIcon } from '@mui/icons-material'
import api from '../../api/axios'

interface EmpresaData {
  id: string
  nombre: string
  descripcion: string | null
  sitio_web: string | null
  industria: string | null
  telefono: string | null
  logo_url: string | null
}

export default function AdminEmpresa() {
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [snackbar, setSnackbar] = useState('')

  const [form, setForm] = useState({
    descripcion: '',
    sitio_web: '',
    industria: '',
    telefono: '',
  })

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')

  useEffect(() => {
    loadEmpresa()
  }, [])

  useEffect(() => {
    if (empresa?.logo_url) setLogoPreview(empresa.logo_url)
  }, [empresa])

  useEffect(() => {
    return () => {
      if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  const loadEmpresa = async () => {
    try {
      const res = await api.get('/admin/empresa')
      setEmpresa(res.data)
      setForm({
        descripcion: res.data.descripcion || '',
        sitio_web: res.data.sitio_web || '',
        industria: res.data.industria || '',
        telefono: res.data.telefono || '',
      })
    } catch {
      setError('Error cargando información de la empresa')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value })
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('descripcion', form.descripcion)
      formData.append('industria', form.industria)
      formData.append('sitio_web', form.sitio_web)
      formData.append('telefono', form.telefono)
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      const res = await api.patch('/admin/empresa', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const updated: EmpresaData = res.data.company
      setEmpresa(updated)
      if (updated.logo_url) {
        if (logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview)
        setLogoPreview(updated.logo_url)
      }
      setLogoFile(null)
      setSnackbar('Perfil de empresa actualizado')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error guardando cambios')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Business color="primary" />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Perfil de empresa
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Card>
        <CardContent>
          {/* Nombre (readonly) */}
          <TextField
            fullWidth label="Nombre de la empresa"
            value={empresa?.nombre || ''}
            InputProps={{ readOnly: true }}
            margin="normal"
            helperText="El nombre de la empresa no puede modificarse desde aquí"
          />

          {/* Logo upload */}
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Logo de la empresa
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 100, height: 100,
                border: '2px dashed',
                borderColor: logoPreview ? 'primary.main' : 'divider',
                borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: 'background.default',
                flexShrink: 0,
              }}>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
                  />
                ) : (
                  <Business sx={{ fontSize: 40, color: 'text.disabled' }} />
                )}
              </Box>
              <Box>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  size="small"
                  sx={{ mb: 1, display: 'block' }}
                >
                  {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                  <input
                    type="file"
                    hidden
                    accept="image/jpeg,image/png,image/svg+xml,image/webp"
                    onChange={handleLogoChange}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block">
                  JPG, PNG, SVG o WebP
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Máximo 2MB — se optimiza automáticamente
                </Typography>
              </Box>
            </Box>
          </Box>

          <TextField
            fullWidth label="Descripción de la empresa" multiline minRows={4} maxRows={10}
            value={form.descripcion} onChange={handleChange('descripcion')}
            margin="normal"
            placeholder="Describe tu empresa, su misión y lo que la hace especial para los candidatos..."
          />

          <TextField
            fullWidth label="Industria"
            value={form.industria} onChange={handleChange('industria')}
            margin="normal"
            placeholder="Ej: Tecnología, Retail, Finanzas, Manufactura..."
          />

          <TextField
            fullWidth label="Sitio web"
            value={form.sitio_web} onChange={handleChange('sitio_web')}
            margin="normal"
            placeholder="https://www.tuempresa.com"
          />

          <TextField
            fullWidth label="Teléfono de contacto"
            value={form.telefono} onChange={handleChange('telefono')}
            margin="normal"
            placeholder="+52 55 1234 5678"
          />

          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <Save />}
              onClick={handleSave}
              disabled={uploading}
            >
              {uploading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbar('')}>{snackbar}</Alert>
      </Snackbar>
    </Box>
  )
}
