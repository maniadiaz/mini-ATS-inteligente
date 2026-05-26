const express = require('express')
const stripe = require('../stripe')
const { Company, User, Subscription, Vacante, Plan } = require('../models')
const { requireJWT, requireRole } = require('../middleware/auth')

const router = express.Router()

// All superadmin routes
router.use(requireJWT, requireRole('superadmin'))

// GET /superadmin/empresas
router.get('/empresas', async (req, res) => {
  try {
    const companies = await Company.findAll({
      include: [
        { model: Subscription, as: 'subscription' },
        { model: User, as: 'users', attributes: ['id'] },
        { model: Vacante, as: 'vacantes', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
    })

    const result = companies.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      rfc: c.rfc,
      email: c.email,
      status: c.status,
      trial_ends_at: c.trial_ends_at,
      subscription: c.subscription || null,
      users_count: c.users?.length || 0,
      vacantes_count: c.vacantes?.length || 0,
      cv_analizados_mes: c.cv_analizados_mes || 0,
      cv_limit: c.cv_limit || 150,
      cv_extras: c.cv_extras || 0,
      cv_porcentaje: Math.round(((c.cv_analizados_mes || 0) / (c.cv_limit || 150)) * 100),
      createdAt: c.createdAt,
    }))

    res.json(result)
  } catch (err) {
    console.error('Error listando empresas:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /superadmin/empresas/:id
router.get('/empresas/:id', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id, {
      include: [
        { model: Subscription, as: 'subscription' },
        { model: User, as: 'users', attributes: ['id', 'nombre', 'email', 'role', 'activo', 'createdAt'] },
        { model: Vacante, as: 'vacantes', attributes: ['id', 'puesto', 'activa', 'createdAt'] },
      ],
    })
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })
    res.json(company)
  } catch (err) {
    console.error('Error obteniendo empresa:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// PATCH /superadmin/empresas/:id/status
router.patch('/empresas/:id/status', async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id)
    if (!company) return res.status(404).json({ error: 'Empresa no encontrada' })

    const { status } = req.body
    if (!['trial', 'active', 'suspended', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' })
    }

    await company.update({ status })
    res.json({ id: company.id, nombre: company.nombre, status: company.status })
  } catch (err) {
    console.error('Error actualizando status:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /superadmin/pagos
router.get('/pagos', async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      include: [{ model: Company, as: 'company', attributes: ['id', 'nombre', 'email'] }],
      order: [['createdAt', 'DESC']],
    })
    res.json(subscriptions)
  } catch (err) {
    console.error('Error listando pagos:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /superadmin/plan
router.get('/plan', async (req, res) => {
  try {
    const plan = await Plan.findOne({ where: { activo: true } })
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' })
    res.json(plan)
  } catch (err) {
    console.error('Error obteniendo plan:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// PATCH /superadmin/plan
router.patch('/plan', async (req, res) => {
  try {
    const plan = await Plan.findOne({ where: { activo: true } })
    if (!plan) return res.status(404).json({ error: 'Plan no encontrado' })

    const updates = {}
    if (req.body.nombre) updates.nombre = req.body.nombre
    if (req.body.precio !== undefined) updates.precio = req.body.precio
    if (req.body.trial_days !== undefined) updates.trial_days = req.body.trial_days
    if (req.body.cv_limit !== undefined) updates.cv_limit = req.body.cv_limit

    await plan.update(updates)

    // If cv_limit changed, update all active/trial companies
    if (req.body.cv_limit !== undefined) {
      await Company.update(
        { cv_limit: req.body.cv_limit },
        { where: { status: ['active', 'trial'] } }
      )
    }

    res.json(plan)
  } catch (err) {
    console.error('Error actualizando plan:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// POST /superadmin/plan/sync-stripe
router.post('/plan/sync-stripe', async (req, res) => {
  try {
    if (!process.env.STRIPE_PRICE_ID) {
      return res.status(400).json({ error: 'STRIPE_PRICE_ID no configurado en .env' })
    }

    // Verify that the price exists in Stripe
    const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID)
    
    const plan = await Plan.findOne({ where: { activo: true } })
    if (plan) {
      await plan.update({ stripe_price_id: process.env.STRIPE_PRICE_ID })
    }

    res.json({ 
      price_id: price.id,
      amount: price.unit_amount / 100,
      currency: price.currency.toUpperCase(),
      interval: price.recurring?.interval || 'one-time',
      message: 'Price ID verificado en Stripe'
    })
  } catch (err) {
    console.error('Error verificando con Stripe:', err.message)
    res.status(500).json({ error: 'Error verificando con Stripe: ' + err.message })
  }
})

module.exports = router
