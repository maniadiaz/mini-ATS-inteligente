const { Company } = require('../models')

async function checkCvLimit(req, res, next) {
  try {
    const company = await Company.findByPk(req.company_id)
    if (!company) {
      return res.status(404).json({ error: 'Empresa no encontrada' })
    }

    // Verify if period changed (new month) and reset counter
    const ahora = new Date()
    const periodoActual = new Date(company.periodo_actual)
    if (
      ahora.getMonth() !== periodoActual.getMonth() ||
      ahora.getFullYear() !== periodoActual.getFullYear()
    ) {
      await company.update({
        cv_analizados_mes: 0,
        periodo_actual: ahora,
      })
      company.cv_analizados_mes = 0
    }

    // Calculate available CVs
    const cvDisponibles = (company.cv_limit - company.cv_analizados_mes) + company.cv_extras

    if (cvDisponibles <= 0) {
      return res.status(403).json({
        error: 'limite_cvs',
        message: 'Has alcanzado tu límite de CVs analizados este mes.',
        cv_analizados_mes: company.cv_analizados_mes,
        cv_limit: company.cv_limit,
        cv_extras: company.cv_extras,
        redirect: '/admin/suscripcion',
      })
    }

    req.company = company
    next()
  } catch (err) {
    console.error('Error en checkCvLimit:', err.message)
    res.status(500).json({ error: 'Error interno' })
  }
}

module.exports = checkCvLimit
