const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const { Vacante, Postulacion } = require('../models')
const { requireJWT, requireRole } = require('../middleware/auth')
const tenant = require('../middleware/tenant')
const checkStatus = require('../middleware/checkStatus')
const { extractText } = require('../extractor')
const { analyzeCV } = require('../analyzer')
const { exportarExcel } = require('../exporter')

const router = express.Router()

// Uploads directory
const uploadsDir = path.join(__dirname, '..', '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, uuidv4() + '_' + file.originalname),
})

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split('.').pop().toLowerCase()
  if (ext === 'pdf' || ext === 'docx') {
    cb(null, true)
  } else {
    cb(new Error('Solo se aceptan archivos .pdf y .docx'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
})

// All routes require auth + tenant + status check
router.use(requireJWT, tenant, checkStatus)

// GET /vacante — list vacantes for company
router.get('/', async (req, res) => {
  try {
    const where = req.company_id ? { company_id: req.company_id } : {}
    const vacantes = await Vacante.findAll({
      where,
      include: [{ model: Postulacion, as: 'postulaciones', attributes: ['id'] }],
      order: [['createdAt', 'DESC']],
    })
    res.json(vacantes)
  } catch (err) {
    console.error('Error listando vacantes:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /vacante — create
router.post('/', async (req, res) => {
  try {
    const vacante = await Vacante.create({
      company_id: req.company_id,
      puesto: req.body.puesto,
      empresa: req.body.empresa,
      descripcion: req.body.descripcion,
      anios_exp: req.body.anios_exp,
      stack: req.body.stack,
      ingles: req.body.ingles,
      espanol: req.body.espanol,
      otros: req.body.otros || '',
    })
    res.json(vacante)
  } catch (err) {
    console.error('Error creando vacante:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// PUT /vacante/:vid — update
router.put('/:vid', async (req, res) => {
  try {
    const where = { id: req.params.vid }
    if (req.company_id) where.company_id = req.company_id

    const vacante = await Vacante.findOne({ where })
    if (!vacante) return res.status(404).json({ error: 'Vacante no encontrada' })

    await vacante.update({
      puesto: req.body.puesto ?? vacante.puesto,
      empresa: req.body.empresa ?? vacante.empresa,
      descripcion: req.body.descripcion ?? vacante.descripcion,
      anios_exp: req.body.anios_exp ?? vacante.anios_exp,
      stack: req.body.stack ?? vacante.stack,
      ingles: req.body.ingles ?? vacante.ingles,
      espanol: req.body.espanol ?? vacante.espanol,
      otros: req.body.otros ?? vacante.otros,
      activa: req.body.activa !== undefined ? req.body.activa : vacante.activa,
    })

    res.json(vacante)
  } catch (err) {
    console.error('Error actualizando vacante:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /vacante/:vid/dashboard
router.get('/:vid/dashboard', async (req, res) => {
  try {
    const where = { id: req.params.vid }
    if (req.company_id) where.company_id = req.company_id

    const vacante = await Vacante.findOne({ where })
    if (!vacante) return res.status(404).json({ error: 'Vacante no encontrada' })

    let posts = await Postulacion.findAll({ where: { vacante_id: req.params.vid } })

    // Filter by recommendation
    const rec = req.query.recomendacion || ''
    if (rec && ['APTO', 'REVISAR', 'NO APTO'].includes(rec)) {
      posts = posts.filter((p) => p.resultado && p.resultado.recomendacion === rec)
    }

    // Sort
    const orden = req.query.orden || 'score'
    if (orden === 'nombre') {
      posts.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))
    } else if (orden === 'fecha') {
      posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    } else {
      posts.sort((a, b) => (b.resultado?.score_total || 0) - (a.resultado?.score_total || 0))
    }

    res.json({ vacante, postulaciones: posts })
  } catch (err) {
    console.error('Error en dashboard:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /vacante/:vid/exportar
router.get('/:vid/exportar', async (req, res) => {
  try {
    const where = { id: req.params.vid }
    if (req.company_id) where.company_id = req.company_id

    const vacante = await Vacante.findOne({ where })
    if (!vacante) return res.status(404).json({ error: 'Vacante no encontrada' })

    const posts = await Postulacion.findAll({ where: { vacante_id: req.params.vid } })
    posts.sort((a, b) => (b.resultado?.score_total || 0) - (a.resultado?.score_total || 0))

    await exportarExcel(res, vacante, posts)
  } catch (err) {
    console.error('Error exportando:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

module.exports = router
