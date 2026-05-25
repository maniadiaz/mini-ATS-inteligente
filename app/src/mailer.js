const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
})

const from = `"ATS Pro" <${process.env.MAIL_USER || 'no-reply@ats.com'}>`

async function sendWelcomeEmail(company, trialDays) {
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: `Bienvenido a ATS Pro — Tu trial de ${trialDays} días ha comenzado`,
      html: `
        <h2>¡Bienvenido, ${company.nombre}!</h2>
        <p>Tu período de prueba gratuita de <strong>${trialDays} días</strong> ha comenzado.</p>
        <p>Durante este tiempo tendrás acceso completo a todas las funciones:</p>
        <ul>
          <li>Vacantes ilimitadas</li>
          <li>Análisis de CV con IA</li>
          <li>Múltiples usuarios</li>
          <li>Exportación Excel</li>
        </ul>
        <p>¡Empieza a reclutar de forma inteligente!</p>
      `,
    })
  } catch (err) {
    console.error('Error enviando email de bienvenida:', err.message)
  }
}

async function sendTrialWarningEmail(company, daysLeft) {
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: `Tu prueba gratuita vence en ${daysLeft} día${daysLeft > 1 ? 's' : ''}`,
      html: `
        <h2>Hola, ${company.nombre}</h2>
        <p>Tu período de prueba vence en <strong>${daysLeft} día${daysLeft > 1 ? 's' : ''}</strong>.</p>
        <p>Para seguir usando ATS Pro sin interrupciones, activa tu suscripción ahora.</p>
        <p><a href="${process.env.BASE_URL}/admin/suscripcion">Activar suscripción →</a></p>
      `,
    })
  } catch (err) {
    console.error('Error enviando aviso de trial:', err.message)
  }
}

async function sendSuspensionEmail(company, reason) {
  const reasons = {
    trial_expired: 'Tu período de prueba gratuita ha vencido.',
    payment_failed: 'No pudimos procesar tu pago de suscripción.',
  }
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: 'Tu cuenta ha sido suspendida',
      html: `
        <h2>Hola, ${company.nombre}</h2>
        <p>${reasons[reason] || 'Tu cuenta ha sido suspendida.'}</p>
        <p>Para reactivar tu acceso, activa o renueva tu suscripción.</p>
        <p><a href="${process.env.BASE_URL}/admin/suscripcion">Reactivar cuenta →</a></p>
      `,
    })
  } catch (err) {
    console.error('Error enviando email de suspensión:', err.message)
  }
}

async function sendPaymentConfirmedEmail(company) {
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: 'Pago confirmado — Suscripción activa',
      html: `
        <h2>¡Gracias, ${company.nombre}!</h2>
        <p>Tu pago ha sido confirmado y tu suscripción está activa.</p>
        <p>Continúa usando ATS Pro sin limitaciones.</p>
      `,
    })
  } catch (err) {
    console.error('Error enviando confirmación de pago:', err.message)
  }
}

async function sendCvPackConfirmedEmail(company, cantidad) {
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: `Paquete de ${cantidad} CVs activado — ATS Pro`,
      html: `
        <h2>¡Paquete activado, ${company.nombre}!</h2>
        <p>Tu compra de <strong>${cantidad} CVs adicionales</strong> ha sido confirmada.</p>
        <p>Los CVs extra se han sumado a tu cuenta y no se vencen mensualmente.</p>
        <p>Nuevo saldo de CVs extras: <strong>${(company.cv_extras || 0) + cantidad}</strong></p>
      `,
    })
  } catch (err) {
    console.error('Error enviando confirmación de paquete CV:', err.message)
  }
}

async function sendCvLimitWarningEmail(company) {
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: 'Te quedan pocos CVs este mes — ATS Pro',
      html: `
        <h2>Hola, ${company.nombre}</h2>
        <p>Has utilizado el <strong>80%</strong> de tus CVs de este mes (${company.cv_analizados_mes} de ${company.cv_limit}).</p>
        <p>Cuando alcances el límite, no podrás analizar más CVs hasta el próximo mes.</p>
        <p>Puedes comprar paquetes adicionales de CVs en cualquier momento.</p>
        <p><a href="${process.env.BASE_URL}/admin/suscripcion">Comprar CVs extras →</a></p>
      `,
    })
  } catch (err) {
    console.error('Error enviando aviso de límite CVs:', err.message)
  }
}

module.exports = {
  sendWelcomeEmail,
  sendTrialWarningEmail,
  sendSuspensionEmail,
  sendPaymentConfirmedEmail,
  sendCvPackConfirmedEmail,
  sendCvLimitWarningEmail,
}
