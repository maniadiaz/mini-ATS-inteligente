const express = require('express')
const path = require('path')
const fs = require('fs')
const { Postulacion } = require('../models')
const { requireJWT } = require('../middleware/auth')
const tenant = require('../middleware/tenant')
const checkStatus = require('../middleware/checkStatus')

const router = express.Router()
const uploadsDir = path.join(__dirname, '..', '..', 'uploads')

// All routes require auth + tenant + status check
router.use(requireJWT, tenant, checkStatus)

// GET /cv/:pid
router.get('/:pid', async (req, res) => {
  try {
    const post = await Postulacion.findByPk(req.params.pid)
    if (!post) return res.status(404).json({ error: 'Postulación no encontrada' })

    // Verify company ownership
    if (req.company_id && post.company_id !== req.company_id) {
      return res.status(403).json({ error: 'Sin permisos' })
    }

    const filepath = path.join(uploadsDir, post.filename)
    if (!fs.existsSync(filepath)) {
      console.error(`CV no encontrado: ${filepath}`)
      return res.status(404).json({ error: 'Archivo no encontrado en disco' })
    }

    res.download(filepath, post.filename.split('_').slice(1).join('_'))
  } catch (err) {
    console.error('Error descargando CV:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
