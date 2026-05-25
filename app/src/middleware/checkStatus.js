const { Company } = require('../models')

async function checkStatus(req, res, next) {
  // Superadmin skips status check
  if (req.user.role === 'superadmin') return next()

  if (!req.company_id) {
    return res.status(403).json({ error: 'Empresa no encontrada', redirect: '/admin/suscripcion' })
  }

  try {
    const company = await Company.findByPk(req.company_id)
    if (!company) {
      return res.status(403).json({ error: 'Empresa no encontrada', redirect: '/admin/suscripcion' })
    }

    if (company.status === 'suspended' || company.status === 'cancelled') {
      return res.status(403).json({ error: 'Suscripción suspendida', redirect: '/admin/suscripcion' })
    }

    // Auto-suspend expired trial
    if (company.status === 'trial' && company.trial_ends_at && new Date(company.trial_ends_at) < new Date()) {
      await company.update({ status: 'suspended' })
      return res.status(403).json({ error: 'Período de prueba vencido', redirect: '/admin/suscripcion' })
    }

    next()
  } catch (err) {
    console.error('Error en checkStatus:', err.message)
    return res.status(500).json({ error: 'Error interno' })
  }
}

module.exports = checkStatus
