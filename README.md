# Mini ATS Inteligente

Sistema de seguimiento de candidatos (ATS) con análisis de CVs mediante inteligencia artificial (GPT-4o).

## Arquitectura

El proyecto está dividido en dos partes independientes:

```
mini-ATS-inteligente/
├── app/          ← Backend (Node.js + Express + API REST + EJS)
├── html/         ← Frontend (React + Vite + TypeScript + MUI)
├── nginx.conf    ← Configuración de Nginx para producción
└── .gitignore
```

| Componente | Tecnología | Puerto |
|-----------|------------|--------|
| Backend | Node.js + Express | 3105 |
| Frontend | React (SPA estática) | Servida por Nginx |
| Proxy | Nginx | 443 (SSL) |

## Requisitos

- Node.js >= 18
- npm >= 9
- Cuenta de OpenAI con acceso a GPT-4o

## Setup rápido

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
npm install
pm2 start src/app.js --name ats-api
pm2 save
```

### Frontend (build estático)

```bash
cd /var/www/ats.servercontrol-mzt.com/html
npm install
npm run build
# dist/ servido por Nginx
```

### Nginx

Copiar `nginx.conf` a `/etc/nginx/sites-available/ats.servercontrol-mzt.com` y habilitar.

## Flujo de requests

```
Browser → Nginx (443)
  ├── /               → html/dist/index.html (React SPA)
  ├── /api/*          → localhost:3105/* (Express API, JWT)
  ├── /postular/*     → localhost:3105/postular/* (EJS público)
  └── /confirmacion/* → localhost:3105/confirmacion/* (EJS público)
```

## Documentación por componente

- [Backend (app/)](app/README.md)
- [Frontend (html/)](html/README.md)

## Licencia

MIT
