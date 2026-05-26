const express = require('express')
const { MercadoPagoConfig, Preference } = require('mercadopago')
const { User, Company, Subscription, Plan, CvPack } = require('../models')
const { requireJWT, requireRole } = require('../middleware/auth')
const tenant = require('../middleware/tenant')
const checkStatus = require('../middleware/checkStatus')

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
    const plan = await Plan.findOne({ where: { activo: true } })
    if (!plan || !plan.mp_plan_id) {
      return res.status(400).json({ error: 'Plan no configurado en Mercado Pago' })
    }

    const company = await Company.findByPk(req.company_id)
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })

    // Save pending subscription record
    await Subscription.upsert({
      company_id: company.id,
      mp_plan_id: plan.mp_plan_id,
      status: 'pending',
      amount: plan.precio,
    })

    // Redirect user to MP checkout for the plan (MP handles card collection)
    const init_point = `https://www.mercadopago.com.mx/subscriptions/checkout?preapproval_plan_id=${plan.mp_plan_id}&payer_email=${encodeURIComponent(company.email)}`

    res.json({ init_point })
  } catch (err) {
    console.error('Error iniciando suscripción:', err.message)
    res.status(500).json({ error: 'Error creando suscripción en Mercado Pago' })
  }
})

// POST /admin/cvpack/comprar
router.post('/cvpack/comprar', async (req, res) => {
  try {
    const company = await Company.findByPk(req.company_id)
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })

    const cantidad = parseInt(process.env.CV_PACK_QUANTITY) || 50
    const precio = parseFloat(process.env.CV_PACK_PRICE) || 299

    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
    const preference = new Preference(client)

    const result = await preference.create({
      body: {
        items: [{
          title: `Paquete ${cantidad} CVs adicionales — ATS Pro`,
          quantity: 1,
          unit_price: precio,
          currency_id: 'MXN',
        }],
        back_urls: {
          success: `${process.env.BASE_URL}/admin/suscripcion?pack=success`,
          failure: `${process.env.BASE_URL}/admin/suscripcion?pack=failure`,
          pending: `${process.env.BASE_URL}/admin/suscripcion?pack=pending`,
        },
        auto_return: 'approved',
        external_reference: company.id,
        notification_url: `${process.env.BASE_URL}/webhook/mercadopago`,
      },
    })

    // Save CvPack record
    await CvPack.create({
      company_id: company.id,
      mp_payment_id: result.id,
      cantidad,
      monto: precio,
      status: 'pending',
    })

    res.json({ init_point: result.init_point })
  } catch (err) {
    console.error('Error comprando paquete CV:', err.message)
    res.status(500).json({ error: 'Error creando pago en Mercado Pago' })
  }
})

module.exports = router
