const express = require('express')
const { Op } = require('sequelize')
const stripe = require('../stripe')
const { Company, User, Subscription, Vacante, Plan, CvPack } = require('../models')
const { requireJWT, requireRole } = require('../middleware/auth')

const router = express.Router()

// All superadmin routes
router.use(requireJWT, requireRole('superadmin'))

// GET /superadmin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { period = 'week' } = req.query
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    let groupFormat = '%Y-%m-%d'
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0)
        groupFormat = '%H:00'
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setDate(1)
        break
      case 'year':
        startDate.setMonth(0, 1)
        groupFormat = '%Y-%m'
        break
    }

    // Company stats
    const totalCompanies = await Company.count()
    const trialCompanies = await Company.count({ where: { status: 'trial' } })
    const activeCompanies = await Company.count({ where: { status: 'active' } })
    const cancelledCompanies = await Company.count({ where: { status: 'cancelled' } })

    // Total subscriptions
    const totalSubscriptions = await Subscription.count()
    
    // Active subscriptions
    const activeSubscriptions = await Subscription.count({
      where: { status: 'authorized' }
    })

    // Total revenue (all time)
    const allSubs = await Subscription.findAll({
      where: { status: 'authorized' },
      attributes: ['amount']
    })
    const allPacks = await CvPack.findAll({
      where: { status: 'approved' },
      attributes: ['monto']
    })
    const totalRevenue = 
      allSubs.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0) +
      allPacks.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)

    // MRR (Monthly Recurring Revenue) - only active subscriptions
    const mrr = allSubs.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)

    // Average revenue per customer
    const avgRevenuePerCustomer = activeCompanies > 0 
      ? Math.round(totalRevenue / activeCompanies) 
      : 0

    // Conversion rate (trial → active)
    const conversionRate = totalCompanies > 0
      ? (activeCompanies / totalCompanies) * 100
      : 0

    // Churn rate (cancelled / total that had subscription)
    const churnRate = totalSubscriptions > 0
      ? (cancelledCompanies / totalSubscriptions) * 100
      : 0

    // Period revenue
    const periodSubs = await Subscription.findAll({
      where: { 
        status: 'authorized',
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['amount']
    })
    const periodPacks = await CvPack.findAll({
      where: { 
        status: 'approved',
        createdAt: { [Op.gte]: startDate }
      },
      attributes: ['monto']
    })
    const periodRevenue = 
      periodSubs.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0) +
      periodPacks.reduce((sum, p) => sum + parseFloat(p.monto || 0), 0)

    // Chart data - group by date
    const subscriptions = await Subscription.findAll({
      where: { createdAt: { [Op.gte]: startDate } },
      attributes: ['createdAt', 'amount', 'status'],
      order: [['createdAt', 'ASC']]
    })

    const cvPacks = await CvPack.findAll({
      where: { createdAt: { [Op.gte]: startDate } },
      attributes: ['createdAt', 'monto', 'status'],
      order: [['createdAt', 'ASC']]
    })

    // Group data by date
    const dataMap = new Map()
    
    subscriptions.forEach(sub => {
      const date = formatDate(sub.createdAt, period)
      if (!dataMap.has(date)) {
        dataMap.set(date, { date, subscriptions: 0, revenue: 0 })
      }
      const data = dataMap.get(date)
      data.subscriptions++
      if (sub.status === 'authorized') {
        data.revenue += parseFloat(sub.amount || 0)
      }
    })

    cvPacks.forEach(pack => {
      const date = formatDate(pack.createdAt, period)
      if (!dataMap.has(date)) {
        dataMap.set(date, { date, subscriptions: 0, revenue: 0 })
      }
      const data = dataMap.get(date)
      if (pack.status === 'approved') {
        data.revenue += parseFloat(pack.monto || 0)
      }
    })

    const chartData = Array.from(dataMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    res.json({
      totalSubscriptions,
      activeSubscriptions,
      totalRevenue: Math.round(totalRevenue),
      periodRevenue: Math.round(periodRevenue),
      mrr: Math.round(mrr),
      avgRevenuePerCustomer,
      conversionRate,
      churnRate,
      totalCompanies,
      trialCompanies,
      chartData
    })
  } catch (err) {
    console.error('Error en dashboard:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

function formatDate(date, period) {
  const d = new Date(date)
  switch (period) {
    case 'day':
      return `${d.getHours()}:00`
    case 'week':
      return d.toISOString().split('T')[0]
    case 'month':
      return d.toISOString().split('T')[0]
    case 'year':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    default:
      return d.toISOString().split('T')[0]
  }
}

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

// GET /superadmin/stats — company-focused metrics for the superadmin overview dashboard
router.get('/stats', async (req, res) => {
  try {
    const { Postulacion } = require('../models')
    const now = new Date()
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)

    // Company counts by status
    const totalEmpresas = await Company.count()
    const empresasActivas = await Company.count({ where: { status: 'active' } })
    const empresasTrial = await Company.count({ where: { status: 'trial' } })
    const empresasSuspendidas = await Company.count({ where: { status: 'suspended' } })
    const empresasCanceladas = await Company.count({ where: { status: 'cancelled' } })

    // Vacantes & postulaciones
    const totalVacantes = await Vacante.count()
    const vacantesActivas = await Vacante.count({ where: { activa: true } })
    const totalPostulaciones = await (require('../models').Postulacion).count()

    // Nuevas empresas este mes
    const empresasEsteMes = await Company.count({
      where: { createdAt: { [Op.gte]: inicioMes } }
    })

    // Top 5 empresas por número de vacantes
    const top5Companies = await Company.findAll({
      include: [
        { model: Vacante, as: 'vacantes', attributes: ['id', 'activa'] },
      ],
      order: [['createdAt', 'DESC']],
    })
    const top5 = top5Companies
      .map(c => ({
        id: c.id,
        nombre: c.nombre,
        status: c.status,
        total_vacantes: c.vacantes?.length || 0,
        vacantes_activas: c.vacantes?.filter(v => v.activa).length || 0,
      }))
      .sort((a, b) => b.total_vacantes - a.total_vacantes)
      .slice(0, 5)

    // Last 5 registered companies
    const last5Companies = await Company.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'nombre', 'status', 'createdAt'],
    })
    const ultimasEmpresas = last5Companies.map(c => ({
      id: c.id,
      nombre: c.nombre,
      status: c.status,
      createdAt: c.createdAt,
    }))

    // Empresas registradas por mes — last 6 months
    const empresasPorMes = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const fin = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const count = await Company.count({
        where: { createdAt: { [Op.gte]: d, [Op.lt]: fin } }
      })
      const label = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })
      empresasPorMes.push({ mes: label, empresas: count })
    }

    res.json({
      totalEmpresas,
      empresasActivas,
      empresasTrial,
      empresasSuspendidas,
      empresasCanceladas,
      empresasEsteMes,
      totalVacantes,
      vacantesActivas,
      totalPostulaciones,
      top5,
      ultimasEmpresas,
      empresasPorMes,
    })
  } catch (err) {
    console.error('Error en stats superadmin:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
})

// GET /superadmin/vacantes — todas las empresas con sus vacantes agrupadas
router.get('/vacantes', async (req, res) => {
  try {
    const { Postulacion } = require('../models')
    const empresas = await Company.findAll({
      include: [{
        model: Vacante,
        as: 'vacantes',
        include: [{
          model: Postulacion,
          as: 'postulaciones',
          attributes: ['id', 'createdAt', 'resultado'],
        }],
      }],
      order: [['createdAt', 'DESC']],
    })

    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

    const data = empresas.map(empresa => {
      const vacantes = empresa.vacantes || []

      return {
        id: empresa.id,
        nombre: empresa.nombre,
        logo_url: empresa.logo_url || null,
        status: empresa.status,
        total_vacantes: vacantes.length,
        vacantes_activas: vacantes.filter(v => v.activa).length,
        vacantes_cerradas: vacantes.filter(v => !v.activa).length,
        vacantes_este_mes: vacantes.filter(v => new Date(v.createdAt) >= inicioMes).length,
        total_postulaciones: vacantes.reduce((acc, v) => acc + (v.postulaciones?.length || 0), 0),
        postulaciones_este_mes: vacantes.reduce((acc, v) => {
          const posts = v.postulaciones?.filter(p => new Date(p.createdAt) >= inicioMes) || []
          return acc + posts.length
        }, 0),
        aptos: vacantes.reduce((acc, v) => {
          return acc + (v.postulaciones?.filter(p => p.resultado?.recomendacion === 'APTO').length || 0)
        }, 0),
        vacantes: vacantes.map(v => ({
          id: v.id,
          puesto: v.puesto,
          area: v.area || null,
          activa: v.activa,
          fecha_inicio: v.fecha_inicio || null,
          fecha_fin: v.fecha_fin || null,
          total_postulaciones: v.postulaciones?.length || 0,
          aptos: v.postulaciones?.filter(p => p.resultado?.recomendacion === 'APTO').length || 0,
          no_aptos: v.postulaciones?.filter(p => p.resultado?.recomendacion === 'NO APTO').length || 0,
          revisar: v.postulaciones?.filter(p => p.resultado?.recomendacion === 'REVISAR').length || 0,
          createdAt: v.createdAt,
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      }
    })

    res.json(data)
  } catch (err) {
    console.error('Error obteniendo vacantes por empresa:', err.message)
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
