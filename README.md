# ATS Pro — Mini ATS Inteligente

Sistema de seguimiento de candidatos (ATS) multi-tenant con análisis de CVs mediante IA (GPT-4o), gestión de suscripciones con Stripe y panel de superadministrador.

## Arquitectura

```
mini-ATS-inteligente/
├── app/          ← Backend (Node.js + Express + Sequelize + Stripe)
├── html/         ← Frontend (React + Vite + TypeScript + MUI)
├── nginx.conf    ← Configuración Nginx para producción
└── .gitignore
```

| Componente | Tecnología | Puerto |
|---|---|---|
| Backend API | Node.js + Express | 3105 |
| Base de datos | MySQL (Sequelize) | — |
| Frontend | React SPA (build estático) | Servido por Nginx |
| Proxy inverso | Nginx | 443 (SSL) |
| Procesador de pagos | Stripe Checkout + Webhooks | — |

## Modelo de negocio (multi-tenant)

- Cada **empresa** (tenant) tiene sus propios usuarios, vacantes y candidatos.
- Las empresas se registran en **trial** (período de prueba con límite de CVs).
- Al activar pagan una **suscripción mensual** vía Stripe.
- Pueden comprar **paquetes de CVs extra** como pago único.
- El **superadmin** tiene panel propio para gestionar todas las empresas.

## Setup rápido (desarrollo)

```bash
# Backend
cd app
cp .env.example .env   # Editar con tus credenciales
npm install
npm run dev

# Frontend (otra terminal)
cd html
cp .env.example .env
npm install
npm run dev
```

## Despliegue en producción

### Backend (PM2)

```bash
cd /var/www/ats.servercontrol-mzt.com/app
npm install --omit=dev
pm2 start src/app.js --name ats-app
pm2 save
pm2 startup
```

### Frontend (build estático)

```bash
cd /var/www/ats.servercontrol-mzt.com/html
npm install
npm run build
# El directorio dist/ es servido por Nginx
```

### Nginx

Copiar `nginx.conf` a `/etc/nginx/sites-available/ats.servercontrol-mzt.com` y habilitar con `sites-enabled`.

## Flujo de requests

```
Browser → Nginx (443 SSL)
  ├── /                    → html/dist/index.html (React SPA)
  ├── /api/*               → localhost:3105/* (Express JWT API)
  ├── /postular/:vid       → localhost:3105/postular/:vid (EJS público candidatos)
  ├── /confirmacion/:pid   → localhost:3105/confirmacion/:pid (EJS público)
  ├── /logos/*             → archivos estáticos (logos de empresas)
  └── /webhook             → localhost:3105/webhook (Stripe, raw body)
```

## Roles del sistema

| Rol | Acceso |
|---|---|
| `recruiter` | Ver vacantes y candidatos propios |
| `admin` | Recruiter + gestión de usuarios, suscripción y empresa |
| `superadmin` | Todo + panel global de empresas, pagos y configuración del plan |

## Documentación por componente

- [Backend (app/)](app/README.md)
- [Frontend (html/)](html/README.md)
