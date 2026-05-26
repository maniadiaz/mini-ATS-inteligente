const express = require('express')
const stripe = require('../stripe')
const { Subscription, Company, CvPack } = require('../models')
const { sendPaymentConfirmedEmail, sendSuspensionEmail, sendCvPackConfirmedEmail } = require('../mailer')

const router = express.Router()

// POST /webhook/stripe (public, no auth)
// IMPORTANT: This route must receive raw body (Buffer), configured in app.js
router.post('/stripe', async (req, res) => {
  try {
    // Verify Stripe signature
    const sig = req.headers['stripe-signature']
    let event
    
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return res.status(400).json({ error: `Webhook Error: ${err.message}` })
    }

    console.log('Stripe webhook received:', event.type)

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const companyId = session.metadata.company_id

      if (session.mode === 'subscription') {
        // Subscription checkout completed
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        
        await Subscription.update({
          stripe_subscription_id: session.subscription,
          stripe_customer_id: session.customer,
          stripe_price_id: process.env.STRIPE_PRICE_ID,
          status: 'authorized',
          current_period_end: new Date(subscription.current_period_end * 1000),
          amount: 999
        }, { where: { company_id: companyId } })

        const company = await Company.findByPk(companyId)
        if (company) {
          await company.update({ status: 'active', cv_limit: 150 })
          await sendPaymentConfirmedEmail(company)
        }
        console.log('Subscription activated for company:', companyId)
      } else if (session.mode === 'payment' && session.metadata.type === 'cv_pack') {
        // CV pack payment completed
        const pack = await CvPack.findOne({
          where: { stripe_session_id: session.id, status: 'pending' }
        })

        if (pack) {
          await pack.update({ 
            stripe_payment_intent_id: session.payment_intent,
            status: 'approved' 
          })
          
          const company = await Company.findByPk(companyId)
          if (company) {
            await company.increment('cv_extras', { by: pack.cantidad })
            await sendCvPackConfirmedEmail(company, pack.cantidad)
          }
          console.log('CV pack activated for company:', companyId)
        }
      }
    }

    // Handle invoice.payment_succeeded (monthly renewal)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const companyId = subscription.metadata.company_id

        await Subscription.update({
          status: 'authorized',
          current_period_end: new Date(subscription.current_period_end * 1000)
        }, { where: { stripe_subscription_id: subscription.id } })

        const company = await Company.findByPk(companyId)
        if (company) {
          await company.update({ status: 'active', cv_limit: 150 })
          await sendPaymentConfirmedEmail(company)
        }
        console.log('Subscription renewed for company:', companyId)
      }
    }

    // Handle invoice.payment_failed
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
        const companyId = subscription.metadata.company_id

        await Subscription.update({
          status: 'paused'
        }, { where: { stripe_subscription_id: subscription.id } })

        const company = await Company.findByPk(companyId)
        if (company) {
          await company.update({ status: 'suspended' })
          await sendSuspensionEmail(company, 'payment_failed')
        }
        console.log('Subscription payment failed for company:', companyId)
      }
    }

    // Handle customer.subscription.deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object
      const companyId = subscription.metadata.company_id

      await Subscription.update({
        status: 'cancelled'
      }, { where: { stripe_subscription_id: subscription.id } })

      const company = await Company.findByPk(companyId)
      if (company) {
        await company.update({ status: 'cancelled' })
        await sendSuspensionEmail(company, 'cancelled')
      }
      console.log('Subscription cancelled for company:', companyId)
    }

    res.sendStatus(200)
  } catch (err) {
    console.error('Error processing Stripe webhook:', err.message)
    res.sendStatus(200)
  }
})

module.exports = router
