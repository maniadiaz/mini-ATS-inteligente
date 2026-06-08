# Backend — ATS Pro

API REST + páginas EJS públicas para el sistema ATS multi-tenant.

## Stack

| Librería | Uso |
|---|---|
| **Express** | Framework HTTP |
| **Sequelize + MySQL** | ORM + base de datos |
| **jsonwebtoken** | Auth JWT para la API |
| **OpenAI GPT-4o** | Análisis de CVs con IA |
| **Stripe** | Checkout, suscripciones y webhooks |
| **Multer** | Upload de CVs y logos |
| **Sharp** | Redimensionar/convertir logos a WebP |
| **pdf-parse + mammoth** | Extracción de texto PDF/DOCX |
| **ExcelJS** | Exportación de candidatos a `.xlsx` |
| **Nodemailer** | Emails transaccionales |
| **node-cron** | Tareas programadas automáticas |
| **EJS** | Templates de páginas públicas de candidatos |

## Instalación

```bash
cd app
cp .env.example .env   # Editar con tus credenciales
npm install
```

## Variables de entorno

Las variables marcadas con **\*** son críticas — el servidor no arranca si faltan (ver `src/env.validator.js`).

### App

| Variable | Requerida | Descripción |
|---|---|---|
| `PORT` | — | Puerto del servidor (default: `3105`) |
| `BASE_URL` | **\*** | URL pública, ej: `https://ats.ejemplo.com` |
| `JWT_SECRET` | **\*** | Secreto para firmar JWTs (mínimo 32 chars, aleatorio) |
| `JWT_EXPIRES_IN` | — | Expiración del token (default: `7d`) |

### Base de datos (MySQL)

| Variable | Requerida | Descripción |
|---|---|---|
| `DB_HOST` | — | Host MySQL (default: `localhost`) |
| `DB_PORT` | — | Puerto MySQL (default: `3306`) |
| `DB_NAME` | **\*** | Nombre de la base de datos |
| `USER_DB` | **\*** | Usuario MySQL |
| `USER_PASSWORD_DB` | **\*** | Contraseña MySQL |

### OpenAI

| Variable | Requerida | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | **\*** | API key de OpenAI (`sk-...`) |

### Stripe

| Variable | Requerida | Descripción |
|---|---|---|
| `STRIPE_SECRET_KEY` | **\*** | Secret key de Stripe (`sk_live_...` o `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | **\*** | Webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_ID` | **\*** | Price ID del plan mensual (`price_...`) |
| `STRIPE_PACK_PRICE_ID` | **\*** | Price ID del paquete de CVs extra (`price_...`) |
| `CV_PACK_QUANTITY` | — | CVs del paquete extra (default: `50`) |
| `CV_PACK_PRICE` | — | Precio del paquete en MXN (default: `299`) |

### Mail (SMTP)

| Variable | Requerida | Descripción |
|---|---|---|
| `MAIL_HOST` | **\*** | Servidor SMTP, ej: `smtp.mailgun.org` |
| `MAIL_PORT` | — | Puerto SMTP (default: `587`) |
| `MAIL_USER` | **\*** | Usuario SMTP / dirección de envío |
| `MAIL_PASS` | **\*** | Contraseña SMTP |
| `SMTP_FROM` | — | Email remitente alternativo |

### Superadmin y plan (seed inicial)

| Variable | Requerida | Descripción |
|---|---|---|
| `SUPERADMIN_EMAIL` | **\*** | Email del superadmin (se crea en el primer arranque) |
| `SUPERADMIN_PASSWORD` | **\*** | Contraseña del superadmin |
| `SUPERADMIN_COMPANY_NAME` | — | Nombre de la empresa interna (default: `ServerControl`) |
| `SUPERADMIN_NOMBRE` | — | Nombre display del superadmin (default: `Super Admin`) |
| `PLAN_NAME` | — | Nombre del plan (default: `ATS Pro`) |
| `PLAN_PRICE` | — | Precio del plan en MXN (default: `999`) |

## Comandos

```bash
npm run dev    # Nodemon con hot reload
npm start      # Producción
```

## Estructura

```
app/
├── src/
│   ├── app.js                   ← Entry point: valida env, rutas EJS, monta routers
│   ├── env.validator.js         ← Fail-fast: verifica vars críticas al arrancar
│   ├── analyzer.js              ← Análisis de CV con GPT-4o (JSON mode + Zod + reintentos)
│   ├── extractor.js             ← Extracción de texto PDF/DOCX
│   ├── exporter.js              ← Exportación a Excel (.xlsx)
│   ├── mailer.js                ← Emails transaccionales (Nodemailer)
│   ├── cron.js                  ← Tareas automáticas diarias/mensuales
│   ├── stripe.js                ← Instancia de Stripe
│   ├── database.js              ← Conexión Sequelize
│   ├── models/
│   │   ├── index.js             ← Asociaciones + seed inicial
│   │   ├── Company.js           ← Tenant: empresa con límites de CVs
│   │   ├── User.js              ← Usuarios con roles (recruiter/admin/superadmin)
│   │   ├── Vacante.js           ← Vacante laboral por empresa
│   │   ├── Postulacion.js       ← Candidato + resultado IA
│   │   ├── Subscription.js      ← Suscripción Stripe por empresa
│   │   ├── Plan.js              ← Configuración del plan (precio, límites)
│   │   └── CvPack.js            ← Paquetes de CVs extra comprados
│   ├── middleware/
│   │   ├── auth.js              ← requireJWT, requireRole
│   │   ├── tenant.js            ← Resuelve company_id del JWT → req.company_id
│   │   ├── checkStatus.js       ← Bloquea empresas suspendidas/canceladas
│   │   └── checkCvLimit.js      ← Verifica disponibilidad de CVs
│   └── routes/
│       ├── auth.js              ← POST /auth/login, POST /auth/register
│       ├── vacantes.js          ← CRUD vacantes + análisis IA + export
│       ├── cv.js                ← GET /cv/:id (descarga CV)
│       ├── admin.js             ← Gestión usuarios, empresa, suscripción
│       ├── superadmin.js        ← Panel global empresas, pagos, plan
│       └── webhook.js           ← Stripe webhook events
├── views/
│   ├── postular.ejs             ← Formulario público de postulación
│   └── confirmacion.ejs        ← Confirmación de postulación recibida
├── public/
│   ├── style.css
│   └── logos/                  ← Logos de empresas (subidos vía API)
├── uploads/                    ← CVs de candidatos (gitignored)
├── .env.example
└── package.json
```

## API Endpoints

### Auth

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/login` | Login → `{ token, redirectTo, user }` |
| `POST` | `/auth/register` | Registro de empresa + admin → `{ token, user }` |

### Vacantes (`requireJWT` + tenant)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/vacante` | Lista vacantes de la empresa con `postulantes_count` |
| `POST` | `/vacante` | Crear vacante |
| `PATCH` | `/vacante/:vid` | Editar vacante |
| `DELETE` | `/vacante/:vid` | Eliminar vacante |
| `GET` | `/vacante/:vid/dashboard` | Vacante + postulaciones (filtros, orden, búsqueda) |
| `GET` | `/vacante/:vid/exportar` | Descargar Excel de candidatos |
| `POST` | `/vacante/:vid/postular` | Subir CV y analizar con IA (requiere checkCvLimit) |

### CV

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/cv/:pid` | Descargar CV de un candidato |

### Admin (`requireRole admin/superadmin`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/admin/usuarios` | Lista usuarios de la empresa |
| `POST` | `/admin/usuarios` | Crear usuario |
| `PATCH` | `/admin/usuarios/:id` | Editar usuario (nombre, rol, activo, password) |
| `DELETE` | `/admin/usuarios/:id` | Desactivar usuario (soft delete) |
| `GET` | `/admin/empresa` | Obtener perfil de empresa |
| `PATCH` | `/admin/empresa` | Editar empresa + upload logo (Multer + Sharp) |
| `GET` | `/admin/suscripcion` | Datos de suscripción, plan y uso de CVs |
| `POST` | `/admin/suscripcion/iniciar` | Crear Stripe Checkout Session (suscripción mensual) |
| `POST` | `/admin/cvpack/comprar` | Crear Stripe Checkout Session (paquete CVs extra) |

### Superadmin (`requireRole superadmin`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/superadmin/stats` | KPIs globales + empresas por mes + top5 |
| `GET` | `/superadmin/empresas` | Lista todas las empresas con filtros/búsqueda |
| `GET` | `/superadmin/vacantes` | Vacantes agrupadas por empresa |
| `GET` | `/superadmin/pagos` | Historial de pagos/suscripciones |
| `GET` | `/superadmin/plan` | Configuración del plan global |
| `PATCH` | `/superadmin/plan` | Actualizar plan (precio, días trial, etc.) |
| `PATCH` | `/superadmin/empresas/:id/status` | Cambiar status de una empresa |

### Webhook Stripe

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/webhook` | Procesa eventos: `checkout.session.completed`, `invoice.paid`, `customer.subscription.deleted` |

## Rutas EJS (públicas, sin JWT)

| Ruta | Descripción |
|---|---|
| `GET /postular/:vid` | Formulario público de postulación |
| `POST /postular/:vid` | Enviar postulación + CV → análisis IA → redirige a confirmación |
| `GET /confirmacion/:pid` | Página de confirmación de recepción |

## Análisis con IA

1. Extrae texto del CV (pdf-parse para PDF, mammoth para DOCX)
2. Construye prompt con los requisitos de la vacante (puesto, habilidades, idiomas, experiencia, descripción)
3. Envía a GPT-4o y recibe JSON estructurado:
   - `score_total` (0–100)
   - `recomendacion` (APTO / REVISAR / NO APTO)
   - `resumen_ejecutivo`
   - `fortalezas` y `debilidades`
   - `match_requisitos` (habilidades encontradas/faltantes, nivel de inglés)

## Cron jobs automáticos

| Hora | Tarea |
|---|---|
| Diario `00:00` | Suspende empresas con trial expirado + envía email |
| Diario `09:00` | Avisa a empresas con 3 días o menos de trial restante |
| Diario `01:00` | Suspende suscripciones con período de pago vencido |
| Día 1 `00:01` | Reinicia contadores de CVs mensuales |

## Emails transaccionales

- Nuevo candidato en vacante (si `notify_email` está activo)
- Aviso de 80% de límite de CVs consumido
- Aviso de trial próximo a vencer (3 días antes)
- Suspensión por trial expirado o pago fallido

## Despliegue (PM2)

```bash
pm2 start src/app.js --name ats-app
pm2 save
pm2 startup
```

La base de datos se sincroniza con `sequelize.sync({ alter: true })` al arrancar. El seed inicial crea el superadmin y su empresa interna si no existen (idempotente via `findOrCreate`).
