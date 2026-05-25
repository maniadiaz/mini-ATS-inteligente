const express = require('express')
const crypto = require('crypto')
const { MercadoPagoConfig, PreApproval } = require('mercadopago')
const { Subscription, Company } = require('../models')
const { sendPaymentConfirmedEmail, sendSuspensionEmail } = require('../mailer')

const router = express.Router()

// POST /webhook/mercadopago (public, no auth)
router.post('/mercadopago', async (req, res) => {
  try {
    // Verify signature
    const secret = process.env.MP_WEBHOOK_SECRET
    if (secret) {
      const xSignature = req.headers['x-signature'] || ''
      const xRequestId = req.headers['x-request-id'] || ''
      const dataId = req.query['data.id'] || req.body?.data?.id || ''

      // Build manifest for HMAC
      const parts = xSignature.split(',')
      let ts = ''
      let hash = ''
      for (const part of parts) {
        const [key, val] = part.trim().split('=')
        if (key === 'ts') ts = val
        if (key === 'v1') hash = val
      }

      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
      const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

      if (hash !== expected) {
        console.warn('Webhook MP: firma inválida')
        return res.sendStatus(401)
      }
    }

    const { type, data } = req.body || {}

    if (type === 'subscription_preapproval' && data?.id) {
      const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
      const preApproval = new PreApproval(client)

      const mpSub = await preApproval.get({ id: data.id })

      // Find subscription in our DB
      const sub = await Subscription.findOne({
        where: { mp_subscription_id: data.id },
        include: [{ model: Company, as: 'company' }],
      })

      if (!sub) {
        console.warn(`Webhook MP: suscripción no encontrada ${data.id}`)
        return res.sendStatus(200)
      }

      if (mpSub.status === 'authorized') {
        await sub.update({
          status: 'authorized',
          current_period_end: mpSub.next_payment_date || null,
        })
        if (sub.company) {
          await sub.company.update({ status: 'active' })
          await sendPaymentConfirmedEmail(sub.company)
        }
      } else if (mpSub.status === 'paused' || mpSub.status === 'cancelled') {
        await sub.update({ status: mpSub.status })
        if (sub.company) {
          await sub.company.update({ status: 'suspended' })
          await sendSuspensionEmail(sub.company, 'payment_failed')
        }
      } else {
        await sub.update({ status: mpSub.status === 'pending' ? 'pending' : sub.status })
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Error en webhook MP:', err.message)
    res.sendStatus(500)
  }
})

module.exports = router
