const cron = require('node-cron')
const { Op } = require('sequelize')
const { Company, Subscription } = require('./models')
const { sendSuspensionEmail, sendTrialWarningEmail } = require('./mailer')

function initCrons() {
  // Job 1 — Every day at 00:00: suspend expired trials
  cron.schedule('0 0 * * *', async () => {
    try {
      const expired = await Company.findAll({
        where: { status: 'trial', trial_ends_at: { [Op.lt]: new Date() } },
      })
      for (const company of expired) {
        await company.update({ status: 'suspended' })
        await sendSuspensionEmail(company, 'trial_expired')
        console.log(`Trial expirado — empresa suspendida: ${company.nombre}`)
      }
    } catch (err) {
      console.error('Cron suspender trials:', err.message)
    }
  })

  // Job 2 — Every day at 09:00: warn 3 days before trial ends
  cron.schedule('0 9 * * *', async () => {
    try {
      const now = new Date()
      const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const companies = await Company.findAll({
        where: {
          status: 'trial',
          trial_ends_at: { [Op.gt]: now, [Op.lte]: in3days },
        },
      })
      for (const company of companies) {
        const daysLeft = Math.ceil((new Date(company.trial_ends_at) - now) / (1000 * 60 * 60 * 24))
        await sendTrialWarningEmail(company, daysLeft)
        console.log(`Aviso trial — ${company.nombre}: ${daysLeft} días restantes`)
      }
    } catch (err) {
      console.error('Cron aviso trial:', err.message)
    }
  })

  // Job 3 — Every day at 01:00: suspend subscriptions with expired period
  cron.schedule('0 1 * * *', async () => {
    try {
      const expired = await Subscription.findAll({
        where: { status: 'authorized', current_period_end: { [Op.lt]: new Date() } },
        include: [{ model: Company, as: 'company' }],
      })
      for (const sub of expired) {
        await sub.update({ status: 'paused' })
        if (sub.company) {
          await sub.company.update({ status: 'suspended' })
          await sendSuspensionEmail(sub.company, 'payment_failed')
          console.log(`Suscripción vencida — empresa suspendida: ${sub.company.nombre}`)
        }
      }
    } catch (err) {
      console.error('Cron suspender suscripciones:', err.message)
    }
  })

  // Job 4 — Day 1 of each month at 00:01: reset monthly CV counters
  cron.schedule('1 0 1 * *', async () => {
    try {
      await Company.update(
        { cv_analizados_mes: 0, periodo_actual: new Date() },
        { where: { status: ['active', 'trial'] } }
      )
      console.log('Contadores de CVs reiniciados')
    } catch (err) {
      console.error('Cron reinicio CVs:', err.message)
    }
  })

  console.log('Cron jobs inicializados.')
}

module.exports = { initCrons }
