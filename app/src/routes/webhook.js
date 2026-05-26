const express = require('express')
const crypto = require('crypto')
const { MercadoPagoConfig, PreApproval, Payment: MpPayment } = require('mercadopago')
const { Subscription, Company, CvPack } = require('../models')
const { sendPaymentConfirmedEmail, sendSuspensionEmail, sendCvPackConfirmedEmail } = require('../mailer')

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

    const { type, action, data } = req.body || {}
    console.log('Webhook MP recibido:', JSON.stringify({ type, action, data_id: data?.id }))

    if (type === 'subscription_preapproval' && data?.id) {
      try {
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
        const preApproval = new PreApproval(client)

        const mpSub = await preApproval.get({ id: data.id })
        console.log('Webhook MP preapproval:', data.id, 'status:', mpSub.status, 'payer:', mpSub.payer_email)

        // Find subscription by mp_subscription_id first
        let sub = await Subscription.findOne({
          where: { mp_subscription_id: data.id },
          include: [{ model: Company, as: 'company' }],
        })

        // If not found, try to match by payer_email + mp_plan_id (checkout URL flow)
        if (!sub && mpSub.payer_email && mpSub.preapproval_plan_id) {
          const company = await Company.findOne({ where: { email: mpSub.payer_email } })
          if (company) {
            sub = await Subscription.findOne({
              where: { company_id: company.id, mp_plan_id: mpSub.preapproval_plan_id },
              include: [{ model: Company, as: 'company' }],
            })
            if (sub) {
              await sub.update({ mp_subscription_id: data.id })
              console.log('Webhook MP: suscripción vinculada por email:', mpSub.payer_email)
            }
          }
        }

        if (!sub) {
          console.warn(`Webhook MP: suscripción no encontrada ${data.id}`)
        } else if (mpSub.status === 'authorized') {
          await sub.update({
            status: 'authorized',
            current_period_end: mpSub.next_payment_date || null,
          })
          if (sub.company) {
            await sub.company.update({ status: 'active' })
            await sendPaymentConfirmedEmail(sub.company)
          }
          console.log('Webhook MP: suscripción autorizada para empresa:', sub.company?.nombre)
        } else if (mpSub.status === 'paused' || mpSub.status === 'cancelled') {
          await sub.update({ status: mpSub.status })
          if (sub.company) {
            await sub.company.update({ status: 'suspended' })
            await sendSuspensionEmail(sub.company, 'payment_failed')
          }
        } else {
          await sub.update({ status: mpSub.status === 'pending' ? 'pending' : sub.status })
        }
      } catch (subErr) {
        console.warn('Webhook MP: error procesando suscripción:', data.id, subErr.message)
      }
    }

    // Handle payment (CV pack checkout)
    if (type === 'payment' && data?.id) {
      try {
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
        const mpPayment = new MpPayment(client)

        const paymentInfo = await mpPayment.get({ id: data.id })
        const externalRef = paymentInfo.external_reference

        if (externalRef) {
          // Find pending CvPack for this company
          const pack = await CvPack.findOne({
            where: { company_id: externalRef, status: 'pending' },
            order: [['createdAt', 'DESC']],
          })

          if (pack) {
            if (paymentInfo.status === 'approved') {
              await pack.update({ mp_payment_id: String(data.id), status: 'approved' })
              const company = await Company.findByPk(externalRef)
              if (company) {
                await company.increment('cv_extras', { by: pack.cantidad })
                await sendCvPackConfirmedEmail(company, pack.cantidad)
              }
            } else if (paymentInfo.status === 'rejected') {
              await pack.update({ mp_payment_id: String(data.id), status: 'rejected' })
            }
          }
        }
      } catch (payErr) {
        console.warn('Webhook MP: pago no encontrado o error consultando:', data.id, payErr.message)
      }
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Error en webhook MP:', err.message)
    // Always respond 200 to avoid MP retries on non-critical errors
    res.sendStatus(200)
  }
})

module.exports = router
