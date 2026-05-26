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

// ─── Styles ───────────────────────────────────────────────────────────────
const s = {
  h1: 'font-size:24px;font-weight:700;color:#1A1A1A;margin:0 0 8px 0;line-height:1.25;',
  h2: 'font-size:20px;font-weight:600;color:#1A1A1A;margin:0 0 16px 0;',
  p:  'font-size:15px;color:#4B5563;line-height:1.6;margin:0 0 12px 0;',
  sm: 'font-size:13px;color:#9CA3AF;line-height:1.5;',
  badge: (color) =>
    `display:inline-block;background:${color}20;color:${color};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;`,
  btn: (bg = '#1A3C5E') =>
    `display:inline-block;background:${bg};color:#FFFFFF;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:15px;font-weight:600;`,
  divider: 'border:none;border-top:1px solid #E5E0D8;margin:24px 0;',
  infoBox: (bg = '#EEF2FF', border = '#C7D2FE') =>
    `background:${bg};border:1px solid ${border};border-radius:12px;padding:20px 24px;margin:16px 0;`,
}

// ─── Layout wrapper ───────────────────────────────────────────────────────
function layout(content, title = 'ATS Pro') {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#F9F6F0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F6F0;padding:40px 20px;">
    <tr><td align="center">

      <!-- Logo -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="padding-bottom:20px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:#1A3C5E;letter-spacing:-0.5px;">ATS Pro</span>
          </td>
        </tr>
      </table>

      <!-- Card -->
      <table width="600" cellpadding="0" cellspacing="0"
        style="max-width:600px;width:100%;background:#FFFFFF;border-radius:16px;border:1px solid #E5E0D8;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="padding:40px;">
          ${content}
        </td></tr>
      </table>

      <!-- Footer -->
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="padding-top:24px;text-align:center;">
            <p style="color:#9CA3AF;font-size:12px;margin:0;">
              © 2025 ATS Pro — Sistema de reclutamiento inteligente
            </p>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`
}

// ─── Progress bar helper ──────────────────────────────────────────────────
function progressBar(percent, color = '#1A3C5E') {
  const clamped = Math.min(100, Math.max(0, percent))
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;">
    <tr>
      <td style="background:#F3F4F6;border-radius:99px;height:10px;overflow:hidden;">
        <table width="${clamped}%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:${color};height:10px;border-radius:99px;display:block;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`
}

// ─── sendWelcomeEmail ─────────────────────────────────────────────────────
async function sendWelcomeEmail(company, trialDays) {
  const content = `
    <p style="font-size:36px;margin:0 0 16px 0;text-align:center;">🚀</p>
    <h1 style="${s.h1}text-align:center;">¡Bienvenido a ATS Pro, ${company.nombre}!</h1>
    <p style="${s.p}text-align:center;margin-bottom:20px;">
      Tu período de prueba gratuita ha comenzado.
    </p>
    <p style="text-align:center;margin:0 0 24px 0;">
      <span style="${s.badge('#1A3C5E')}">Período de prueba — ${trialDays} días</span>
    </p>

    <hr style="${s.divider}">

    <p style="${s.p}">Durante tu prueba podrás <strong>analizar hasta 10 CVs con IA</strong>. Al activar tu suscripción el límite sube a <strong>150 CVs/mes</strong>.</p>

    <div style="${s.infoBox('#F0F9FF', '#BAE6FD')}">
      <p style="font-size:14px;font-weight:600;color:#0369A1;margin:0 0 12px 0;">Incluido en tu suscripción:</p>
      <p style="font-size:14px;color:#374151;margin:0 0 6px 0;">✅ &nbsp;Análisis de CV con IA — 150 CVs/mes</p>
      <p style="font-size:14px;color:#374151;margin:0 0 6px 0;">✅ &nbsp;Vacantes ilimitadas</p>
      <p style="font-size:14px;color:#374151;margin:0 0 6px 0;">✅ &nbsp;Múltiples usuarios (admin + reclutadores)</p>
      <p style="font-size:14px;color:#374151;margin:0;">✅ &nbsp;Exportación Excel de candidatos</p>
    </div>

    <p style="${s.p}margin-top:20px;">Tu prueba dura <strong>${trialDays} días</strong>. Sin tarjeta requerida para comenzar.</p>

    <p style="text-align:center;margin:28px 0 0 0;">
      <a href="${process.env.BASE_URL}/dashboard" style="${s.btn()}">Ir al dashboard →</a>
    </p>
  `
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: `Bienvenido a ATS Pro — Tu trial de ${trialDays} días ha comenzado`,
      html: layout(content, 'Bienvenido a ATS Pro'),
    })
  } catch (err) {
    console.error('Error enviando email de bienvenida:', err.message)
  }
}

// ─── sendTrialWarningEmail ────────────────────────────────────────────────
async function sendTrialWarningEmail(company, daysLeft) {
  const totalDays = 14
  const consumed = Math.max(0, totalDays - daysLeft)
  const percent = Math.round((consumed / totalDays) * 100)

  const content = `
    <p style="font-size:36px;margin:0 0 16px 0;text-align:center;">⏰</p>
    <h1 style="${s.h1}text-align:center;">Tu prueba gratuita vence pronto</h1>
    <p style="text-align:center;margin:0 0 24px 0;">
      <span style="${s.badge('#FF9800')}">${daysLeft} día${daysLeft !== 1 ? 's' : ''} restante${daysLeft !== 1 ? 's' : ''}</span>
    </p>

    <div style="${s.infoBox('#FFFBEB', '#FDE68A')}">
      <p style="font-size:13px;color:#92400E;margin:0 0 8px 0;font-weight:600;">Días de prueba consumidos</p>
      ${progressBar(percent, '#FF9800')}
      <p style="font-size:13px;color:#92400E;margin:6px 0 0 0;">${consumed} de ${totalDays} días</p>
    </div>

    <p style="${s.p}margin-top:16px;">Activa tu suscripción por <strong>$999 MXN/mes</strong> para continuar sin interrupciones.</p>

    <div style="${s.infoBox('#FEF2F2', '#FECACA')}">
      <p style="font-size:14px;font-weight:600;color:#991B1B;margin:0 0 10px 0;">Sin suscripción perderás acceso a:</p>
      <p style="font-size:14px;color:#374151;margin:0 0 5px 0;">❌ &nbsp;Análisis de CV con IA</p>
      <p style="font-size:14px;color:#374151;margin:0 0 5px 0;">❌ &nbsp;Creación de nuevas vacantes</p>
      <p style="font-size:14px;color:#374151;margin:0;">❌ &nbsp;Acceso al historial de candidatos</p>
    </div>

    <p style="text-align:center;margin:28px 0 0 0;">
      <a href="${process.env.BASE_URL}/admin/configuracion" style="${s.btn('#FF9800')}">Activar suscripción →</a>
    </p>
  `
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: `Tu prueba gratuita vence en ${daysLeft} día${daysLeft > 1 ? 's' : ''}`,
      html: layout(content, 'Tu prueba vence pronto'),
    })
  } catch (err) {
    console.error('Error enviando aviso de trial:', err.message)
  }
}

// ─── sendSuspensionEmail ──────────────────────────────────────────────────
async function sendSuspensionEmail(company, reason) {
  const configs = {
    trial_expired: {
      emoji: '⏱️',
      title: 'Tu período de prueba ha terminado',
      body: 'Tu período de prueba gratuita ha vencido. Tu cuenta ha sido suspendida temporalmente.',
    },
    payment_failed: {
      emoji: '💳',
      title: 'No pudimos procesar tu pago',
      body: 'Hubo un problema al cobrar tu suscripción. Tu cuenta ha sido suspendida hasta regularizar el pago.',
    },
  }
  const cfg = configs[reason] || {
    emoji: '⚠️',
    title: 'Tu cuenta ha sido suspendida',
    body: 'Tu cuenta ha sido suspendida. Reactiva tu suscripción para recuperar el acceso.',
  }

  const content = `
    <p style="font-size:36px;margin:0 0 16px 0;text-align:center;">${cfg.emoji}</p>
    <h1 style="${s.h1}text-align:center;">${cfg.title}</h1>
    <p style="text-align:center;margin:0 0 24px 0;">
      <span style="${s.badge('#F44336')}">Cuenta suspendida</span>
    </p>

    <p style="${s.p}text-align:center;">${cfg.body}</p>

    <div style="${s.infoBox('#FEF2F2', '#FECACA')}">
      <p style="font-size:14px;color:#374151;margin:0;">
        Para recuperar el acceso activa o renueva tu suscripción. El proceso toma menos de 2 minutos.
      </p>
    </div>

    <p style="text-align:center;margin:28px 0 0 0;">
      <a href="${process.env.BASE_URL}/admin/configuracion" style="${s.btn('#F44336')}">Reactivar ahora →</a>
    </p>
  `
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: 'Tu cuenta ha sido suspendida — ATS Pro',
      html: layout(content, 'Cuenta suspendida'),
    })
  } catch (err) {
    console.error('Error enviando email de suspensión:', err.message)
  }
}

// ─── sendPaymentConfirmedEmail ────────────────────────────────────────────
async function sendPaymentConfirmedEmail(company) {
  const content = `
    <p style="font-size:36px;margin:0 0 16px 0;text-align:center;">✅</p>
    <h1 style="${s.h1}text-align:center;">¡Pago confirmado!</h1>
    <p style="text-align:center;margin:0 0 24px 0;">
      <span style="${s.badge('#4CAF50')}">Suscripción activa</span>
    </p>

    <p style="${s.p}text-align:center;">Gracias <strong>${company.nombre}</strong>. Tu suscripción está activa y puedes seguir reclutando sin interrupciones.</p>

    <div style="${s.infoBox('#F0FDF4', '#BBF7D0')}">
      <p style="font-size:14px;font-weight:600;color:#166534;margin:0 0 12px 0;">Detalles de tu plan</p>
      <p style="font-size:14px;color:#374151;margin:0 0 6px 0;">📊 &nbsp;<strong>Límite de CVs:</strong> 150 análisis/mes</p>
      <p style="font-size:14px;color:#374151;margin:0 0 6px 0;">💳 &nbsp;<strong>Monto:</strong> $999 MXN/mes</p>
      <p style="font-size:14px;color:#374151;margin:0;">🔄 &nbsp;Renovación automática mensual</p>
    </div>

    <p style="text-align:center;margin:28px 0 0 0;">
      <a href="${process.env.BASE_URL}/dashboard" style="${s.btn('#4CAF50')}">Ir al dashboard →</a>
    </p>
  `
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: 'Pago confirmado — Suscripción activa — ATS Pro',
      html: layout(content, 'Pago confirmado'),
    })
  } catch (err) {
    console.error('Error enviando confirmación de pago:', err.message)
  }
}

// ─── sendCvPackConfirmedEmail ─────────────────────────────────────────────
async function sendCvPackConfirmedEmail(company, cantidad) {
  const newExtras = (company.cv_extras || 0) + cantidad
  const content = `
    <p style="font-size:36px;margin:0 0 16px 0;text-align:center;">📦</p>
    <h1 style="${s.h1}text-align:center;">¡Paquete activado!</h1>
    <p style="text-align:center;margin:0 0 24px 0;">
      <span style="${s.badge('#4CAF50')}">${cantidad} CVs agregados</span>
    </p>

    <p style="${s.p}text-align:center;">Tu compra de <strong>${cantidad} CVs adicionales</strong> ha sido confirmada y ya están disponibles en tu cuenta.</p>

    <div style="${s.infoBox('#F0FDF4', '#BBF7D0')}">
      <p style="font-size:14px;font-weight:600;color:#166534;margin:0 0 12px 0;">Tu saldo actual</p>
      <p style="font-size:28px;font-weight:700;color:#166534;margin:0 0 4px 0;">${newExtras}</p>
      <p style="font-size:13px;color:#4B5563;margin:0;">CVs extras disponibles (no vencen mensualmente)</p>
    </div>

    <p style="text-align:center;margin:28px 0 0 0;">
      <a href="${process.env.BASE_URL}/dashboard" style="${s.btn()}">Ir al dashboard →</a>
    </p>
  `
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: `Paquete de ${cantidad} CVs activado — ATS Pro`,
      html: layout(content, 'Paquete de CVs activado'),
    })
  } catch (err) {
    console.error('Error enviando confirmación de paquete CV:', err.message)
  }
}

// ─── sendCvLimitWarningEmail ──────────────────────────────────────────────
async function sendCvLimitWarningEmail(company) {
  const usado = company.cv_analizados_mes || 0
  const limite = company.cv_limit || 150
  const restantes = Math.max(0, limite - usado)
  const percent = Math.min(100, Math.round((usado / limite) * 100))

  const content = `
    <p style="font-size:36px;margin:0 0 16px 0;text-align:center;">⚠️</p>
    <h1 style="${s.h1}text-align:center;">Te quedan pocos CVs este mes</h1>

    <div style="${s.infoBox('#FFFBEB', '#FDE68A')}">
      <p style="font-size:13px;color:#92400E;margin:0 0 8px 0;font-weight:600;">CVs utilizados este mes</p>
      ${progressBar(percent, '#FF9800')}
      <p style="font-size:13px;color:#92400E;margin:6px 0 0 0;">${usado} de ${limite} CVs — ${percent}% utilizado</p>
    </div>

    <div style="${s.infoBox('#FFF7ED', '#FED7AA')}">
      <p style="font-size:26px;font-weight:700;color:#C2410C;margin:0 0 4px 0;">${restantes}</p>
      <p style="font-size:13px;color:#4B5563;margin:0;">CVs restantes este mes</p>
    </div>

    <p style="${s.p}">Cuando alcances el límite no podrás analizar más CVs hasta el próximo mes. Puedes comprar CVs extra en cualquier momento.</p>

    <p style="text-align:center;margin:28px 0 0 0;">
      <a href="${process.env.BASE_URL}/admin/configuracion" style="${s.btn('#FF9800')}">Comprar más CVs →</a>
    </p>
  `
  try {
    await transporter.sendMail({
      from,
      to: company.email,
      subject: 'Te quedan pocos CVs este mes — ATS Pro',
      html: layout(content, 'Límite de CVs'),
    })
  } catch (err) {
    console.error('Error enviando aviso de límite CVs:', err.message)
  }
}

// ─── sendNewApplicationEmail ──────────────────────────────────────────────
async function sendNewApplicationEmail(adminEmail, companyName, vacante, postulacion) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3105'
  const resultado = postulacion.resultado || postulacion.resultado_ia || {}
  const scoreTotal = resultado.score_total || 0
  const recomendacion = resultado.recomendacion || 'REVISAR'

  let scoreColor = '#FF9800'
  let recBadgeColor = '#FF9800'
  if (scoreTotal >= 80) { scoreColor = '#4CAF50'; recBadgeColor = '#4CAF50' }
  else if (scoreTotal < 60) { scoreColor = '#F44336'; recBadgeColor = '#F44336' }

  const habilidades = resultado.match_requisitos?.habilidades?.encontrados || resultado.match_requisitos?.stack?.encontrados || []
  const resumen = resultado.resumen_ejecutivo || ''

  const chipsHtml = habilidades.length > 0
    ? habilidades.map(h =>
        `<span style="display:inline-block;background:#EEF2FF;color:#3730A3;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:500;margin:3px 4px 3px 0;">${h}</span>`
      ).join('')
    : '<span style="font-size:13px;color:#9CA3AF;">No detectadas</span>'

  const content = `
    <p style="font-size:13px;color:#6B7280;margin:0 0 4px 0;font-weight:500;">NUEVA POSTULACIÓN</p>
    <h1 style="${s.h1}">${vacante.puesto}</h1>
    <p style="${s.p}margin-bottom:24px;">${companyName}</p>

    <div style="${s.infoBox('#F9FAFB', '#E5E7EB')}">
      <p style="font-size:14px;font-weight:600;color:#374151;margin:0 0 12px 0;">Candidato</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:14px;color:#4B5563;padding-bottom:6px;width:30%;font-weight:500;">Nombre</td>
          <td style="font-size:14px;color:#1A1A1A;padding-bottom:6px;font-weight:600;">${postulacion.nombre}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#4B5563;padding-bottom:6px;font-weight:500;">Email</td>
          <td style="font-size:14px;color:#1A1A1A;padding-bottom:6px;">${postulacion.email}</td>
        </tr>
        <tr>
          <td style="font-size:14px;color:#4B5563;font-weight:500;">Teléfono</td>
          <td style="font-size:14px;color:#1A1A1A;">${postulacion.telefono || 'No proporcionado'}</td>
        </tr>
      </table>
    </div>

    <!-- Score -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr>
        <td width="50%" style="text-align:center;padding:20px;background:${scoreColor}10;border-radius:12px;border:1px solid ${scoreColor}30;">
          <p style="font-size:40px;font-weight:700;color:${scoreColor};margin:0 0 4px 0;">${scoreTotal}</p>
          <p style="font-size:12px;color:#6B7280;margin:0;">Score IA / 100</p>
        </td>
        <td width="8%">&nbsp;</td>
        <td width="42%" style="text-align:center;padding:20px;background:${recBadgeColor}10;border-radius:12px;border:1px solid ${recBadgeColor}30;">
          <p style="font-size:18px;font-weight:700;color:${recBadgeColor};margin:0 0 4px 0;">${recomendacion}</p>
          <p style="font-size:12px;color:#6B7280;margin:0;">Recomendación</p>
        </td>
      </tr>
    </table>

    ${habilidades.length > 0 ? `
    <hr style="${s.divider}">
    <p style="font-size:14px;font-weight:600;color:#374151;margin:0 0 10px 0;">Habilidades encontradas</p>
    <div style="margin-bottom:16px;">${chipsHtml}</div>
    ` : ''}

    ${resumen ? `
    <hr style="${s.divider}">
    <p style="font-size:14px;font-weight:600;color:#374151;margin:0 0 10px 0;">Resumen ejecutivo</p>
    <p style="font-size:14px;color:#4B5563;line-height:1.65;margin:0;">${resumen}</p>
    ` : ''}

    <p style="text-align:center;margin:32px 0 0 0;">
      <a href="${baseUrl}/vacante/${vacante.id}" style="${s.btn()}">Ver perfil completo →</a>
    </p>

    <hr style="${s.divider}margin-top:32px;">
    <p style="${s.sm}text-align:center;">
      Puedes desactivar estas notificaciones desde el dashboard de la vacante.
    </p>
  `
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || from,
      to: adminEmail,
      subject: `Nueva postulación — ${vacante.puesto}`,
      html: layout(content, `Nueva postulación — ${vacante.puesto}`),
    })
    console.log(`Email de nueva postulación enviado a ${adminEmail}`)
  } catch (err) {
    console.error('Error enviando email de nueva postulación:', err.message)
  }
}

module.exports = {
  sendWelcomeEmail,
  sendTrialWarningEmail,
  sendSuspensionEmail,
  sendPaymentConfirmedEmail,
  sendCvPackConfirmedEmail,
  sendCvLimitWarningEmail,
  sendNewApplicationEmail,
}
