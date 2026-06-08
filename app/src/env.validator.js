/**
 * Fail-fast environment validator.
 * Called once at startup (before any module that reads env vars).
 * If any required variable is missing, the process exits immediately
 * with a clear message — never starts with insecure defaults.
 */

const REQUIRED = [
  // Security
  { key: 'JWT_SECRET',              hint: 'Secreto para firmar JWTs (mínimo 32 chars, aleatorio)' },

  // OpenAI
  { key: 'OPENAI_API_KEY',          hint: 'API key de OpenAI (sk-...)' },

  // Stripe
  { key: 'STRIPE_SECRET_KEY',       hint: 'Secret key de Stripe (sk_live_... o sk_test_...)' },
  { key: 'STRIPE_WEBHOOK_SECRET',   hint: 'Webhook signing secret de Stripe (whsec_...)' },
  { key: 'STRIPE_PRICE_ID',         hint: 'Price ID del plan mensual en Stripe (price_...)' },
  { key: 'STRIPE_PACK_PRICE_ID',    hint: 'Price ID del paquete de CVs extra en Stripe (price_...)' },

  // App
  { key: 'BASE_URL',                hint: 'URL pública de la app, ej: https://ats.ejemplo.com' },

  // Superadmin seed
  { key: 'SUPERADMIN_EMAIL',        hint: 'Email del superadmin (se crea en el primer arranque)' },
  { key: 'SUPERADMIN_PASSWORD',     hint: 'Contraseña del superadmin (mínimo 12 chars)' },

  // Database
  { key: 'DB_NAME',                 hint: 'Nombre de la base de datos MySQL' },
  { key: 'USER_DB',                 hint: 'Usuario de la base de datos MySQL' },
  { key: 'USER_PASSWORD_DB',        hint: 'Contraseña del usuario de la base de datos MySQL' },

  // Mail
  { key: 'MAIL_HOST',               hint: 'Servidor SMTP, ej: smtp.mailgun.org' },
  { key: 'MAIL_USER',               hint: 'Usuario SMTP / dirección de envío' },
  { key: 'MAIL_PASS',               hint: 'Contraseña SMTP' },
]

const OPTIONAL_WITH_DEFAULTS = [
  // These have safe, non-secret defaults — no need to fail
  'PORT',
  'JWT_EXPIRES_IN',
  'DB_HOST',
  'DB_PORT',
  'MAIL_PORT',
  'CV_PACK_QUANTITY',
  'CV_PACK_PRICE',
  'PLAN_NAME',
  'PLAN_PRICE',
  'SUPERADMIN_COMPANY_NAME',
  'SUPERADMIN_NOMBRE',
]

function validateEnv() {
  const missing = REQUIRED.filter(({ key }) => !process.env[key]?.trim())

  if (missing.length === 0) return

  const lines = missing.map(({ key, hint }) => `  ✗  ${key.padEnd(26)} → ${hint}`)

  console.error(`
╔══════════════════════════════════════════════════════════════╗
║  ERROR: Variables de entorno críticas no configuradas        ║
║  El servidor NO puede iniciar con valores por defecto        ║
╚══════════════════════════════════════════════════════════════╝

Variables faltantes:
${lines.join('\n')}

Solución:
  1. Copia app/.env.example → app/.env
  2. Rellena cada variable con sus valores reales
  3. Reinicia el servidor

`)
  process.exit(1)
}

module.exports = { validateEnv }
