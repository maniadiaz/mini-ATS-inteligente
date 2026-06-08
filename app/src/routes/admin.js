const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const sharp = require('sharp')
const stripe = require('../stripe')
const { User, Company, Subscription, Plan, CvPack } = require('../models')
const { requireJWT, requireRole } = require('../middleware/auth')
const tenant = require('../middleware/tenant')
const checkStatus = require('../middleware/checkStatus')

const logosDir = path.join(__dirname, '..', '..', 'public', 'logos')

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logosDir),
  filename: (req, file, cb) => cb(null, `${req.company_id}-${Date.now()}.webp`),
})

const logoUpload = multer({
  storage: logoStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se aceptan imágenes JPG, PNG, SVG o WebP'), false)
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 },
})

const router = express.Router()

// All admin routes require auth + admin role + tenant + status check
router.use(requireJWT, requireRole('admin', 'superadmin'), tenant, checkStatus)

// GET /admin/usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const users = await User.findAll({
      where: { company_id: req.company_id },
      attributes: ['id', 'nombre', 'email', 'role', 'activo', 'createdAt'],
      order: [['createdAt', 'ASC']],
    })
    res.json(users)
  } catch (err) {
    console.error('Error listando usuarios:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /admin/usuarios
router.post('/usuarios', async (req, res) => {
  const { nombre, email, password, role } = req.body
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña requeridos' })
  }

  try {
    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' })
    }

    const password_hash = await User.hashPassword(password)
    const user = await User.create({
      company_id: req.company_id,
      nombre,
      email,
      password_hash,
      role: role || 'recruiter',
    })

    res.status(201).json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role,
      activo: user.activo,
    })
  } catch (err) {
    console.error('Error creando usuario:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// PATCH /admin/usuarios/:id
router.patch('/usuarios/:id', async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, company_id: req.company_id },
    })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const updates = {}
    if (req.body.nombre) updates.nombre = req.body.nombre
    if (req.body.role) updates.role = req.body.role
    if (req.body.activo !== undefined) updates.activo = req.body.activo
    if (req.body.password) {
      updates.password_hash = await User.hashPassword(req.body.password)
    }

    await user.update(updates)
    res.json({ id: user.id, nombre: user.nombre, email: user.email, role: user.role, activo: user.activo })
  } catch (err) {
    console.error('Error actualizando usuario:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// DELETE /admin/usuarios/:id (soft delete)
router.delete('/usuarios/:id', async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'No puedes desactivarte a ti mismo' })
    }

    const user = await User.findOne({
      where: { id: req.params.id, company_id: req.company_id },
    })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    await user.update({ activo: false })
    res.json({ message: 'Usuario desactivado' })
  } catch (err) {
    console.error('Error desactivando usuario:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /admin/suscripcion
router.get('/suscripcion', async (req, res) => {
  try {
    const company = await Company.findByPk(req.company_id, {
      include: [{ model: Subscription, as: 'subscription' }],
    })
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })

    const plan = await Plan.findOne({ where: { activo: true } })

    let daysLeft = null
    if (company.status === 'trial' && company.trial_ends_at) {
      daysLeft = Math.max(0, Math.ceil((new Date(company.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    }

    const cv_analizados_mes = company.cv_analizados_mes || 0
    const cv_limit = company.cv_limit || 150
    const cv_extras = company.cv_extras || 0
    const cv_disponibles = Math.max(0, cv_limit - cv_analizados_mes) + cv_extras
    const cv_porcentaje = Math.round((cv_analizados_mes / cv_limit) * 100)

    res.json({
      company: {
        id: company.id,
        nombre: company.nombre,
        status: company.status,
        trial_ends_at: company.trial_ends_at,
        cv_analizados_mes,
        cv_limit,
        cv_extras,
        cv_disponibles,
        cv_porcentaje,
      },
      subscription: company.subscription || null,
      plan: plan ? { nombre: plan.nombre, precio: plan.precio, trial_days: plan.trial_days } : null,
      daysLeft,
    })
  } catch (err) {
    console.error('Error obteniendo suscripción:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /admin/suscripcion/iniciar
router.post('/suscripcion/iniciar', async (req, res) => {
  try {
    const company = await Company.findByPk(req.company_id)
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })

    // Cancelar suscripciones pendientes anteriores para no acumular basura
    await Subscription.update(
      { status: 'cancelled' },
      { where: { company_id: req.company_id, status: 'pending' } }
    )

    // Get or create Stripe Customer
    let customerId = company.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email,
        name: company.nombre,
        metadata: { company_id: company.id }
      })
      customerId = customer.id
      await company.update({ stripe_customer_id: customerId })
    }

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }],
      success_url: `${process.env.BASE_URL}/admin/suscripcion?sub=success`,
      cancel_url: `${process.env.BASE_URL}/admin/suscripcion?sub=cancelled`,
      metadata: { company_id: company.id },
      subscription_data: {
        metadata: { company_id: company.id }
      },
      allow_promotion_codes: true,
    })

    // Save pending subscription
    await Subscription.upsert({
      company_id: company.id,
      stripe_customer_id: customerId,
      stripe_price_id: process.env.STRIPE_PRICE_ID,
      status: 'pending',
      amount: 999
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Error iniciando suscripción:', err.message)
    res.status(500).json({ error: 'Error creando suscripción en Stripe' })
  }
})

// POST /admin/cvpack/comprar
router.post('/cvpack/comprar', async (req, res) => {
  try {
    const company = await Company.findByPk(req.company_id)
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })

    const cantidad = parseInt(process.env.CV_PACK_QUANTITY) || 50
    const precio = parseFloat(process.env.CV_PACK_PRICE) || 299

    // Reuse or create Stripe Customer
    let customerId = company.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.email,
        name: company.nombre,
        metadata: { company_id: company.id }
      })
      customerId = customer.id
      await company.update({ stripe_customer_id: customerId })
    }

    // Create Stripe Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PACK_PRICE_ID,
        quantity: 1
      }],
      success_url: `${process.env.BASE_URL}/admin/suscripcion?pack=success`,
      cancel_url: `${process.env.BASE_URL}/admin/suscripcion?pack=cancelled`,
      metadata: { company_id: company.id, type: 'cv_pack' },
      allow_promotion_codes: true,
    })

    // Save CvPack record
    await CvPack.create({
      company_id: company.id,
      stripe_session_id: session.id,
      cantidad,
      monto: precio,
      status: 'pending',
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Error comprando paquete CV:', err.message)
    res.status(500).json({ error: 'Error creando pago en Stripe' })
  }
})

// GET /admin/empresa — Get company profile
router.get('/empresa', async (req, res) => {
  try {
    const company = await Company.findByPk(req.company_id, {
      attributes: ['id', 'nombre', 'descripcion', 'sitio_web', 'industria', 'telefono', 'logo_url']
    })
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }
    res.json(company)
  } catch (err) {
    console.error('Error obteniendo empresa:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// PATCH /admin/empresa — Update company profile (with optional logo upload)
router.patch('/empresa', logoUpload.single('logo'), async (req, res) => {
  try {
    const company = await Company.findByPk(req.company_id)
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })

    const updateData = {
      descripcion: req.body.descripcion !== undefined ? req.body.descripcion : company.descripcion,
      sitio_web: req.body.sitio_web !== undefined ? req.body.sitio_web : company.sitio_web,
      industria: req.body.industria !== undefined ? req.body.industria : company.industria,
      telefono: req.body.telefono !== undefined ? req.body.telefono : company.telefono,
    }

    if (req.file) {
      const finalPath = req.file.path
      const tmpPath = finalPath + '_tmp'

      await sharp(req.file.path)
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(tmpPath)

      fs.renameSync(tmpPath, finalPath)

      // Delete previous logo if different
      if (company.logo_url) {
        const oldFilename = company.logo_url.split('/logos/')[1]
        if (oldFilename) {
          const oldPath = path.join(logosDir, oldFilename)
          if (fs.existsSync(oldPath) && oldPath !== finalPath) {
            fs.unlinkSync(oldPath)
          }
        }
      }

      updateData.logo_url = `${process.env.BASE_URL}/logos/${path.basename(finalPath)}`
    }

    await company.update(updateData)
    res.json({ success: true, company })
  } catch (err) {
    console.error('Error actualizando empresa:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
