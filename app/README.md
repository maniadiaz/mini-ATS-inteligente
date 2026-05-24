# Backend — Mini ATS Inteligente

API REST + páginas EJS públicas para el sistema ATS.

## Stack

- **Runtime:** Node.js + Express
- **Auth API:** JWT (jsonwebtoken)
- **Auth EJS:** express-session (cookie-based)
- **IA:** OpenAI GPT-4o
- **Extracción de texto:** pdf-parse (PDF), mammoth (DOCX)
- **Exportación:** ExcelJS
- **Uploads:** Multer (diskStorage)

## Instalación

```bash
cd app
cp .env.example .env
npm install
```

## Variables de entorno (.env)

| Variable | Descripción |
|----------|-------------|
| `OPENAI_API_KEY` | API key de OpenAI |
| `ADMIN_USER` | Usuario para login del reclutador |
| `ADMIN_PASS` | Contraseña para login |
| `SESSION_SECRET` | Secreto para firmar sesión y JWT |
| `PORT` | Puerto del servidor (default: 3105) |
| `BASE_URL` | URL pública base para links de postulación |

## Uso

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## Estructura

```
app/
├── src/
│   ├── app.js           ← Entry point, rutas EJS + API REST
│   ├── analyzer.js      ← Análisis de CV con OpenAI GPT-4o
│   ├── exporter.js      ← Exportación a Excel (.xlsx)
│   ├── auth.js          ← express-session + middleware
│   └── extractor.js     ← Extracción de texto PDF/DOCX
├── views/               ← Templates EJS (páginas públicas de candidatos)
│   ├── postular.ejs
│   └── confirmacion.ejs
├── public/
│   └── style.css
├── uploads/             ← CVs subidos (gitignored)
├── .env.example
└── package.json
```

## API Endpoints (JSON + JWT)

Estas rutas son consumidas por el frontend React. Nginx proxea `/api/*` → `localhost:3105/*`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/login` | Login, retorna `{ token }` |
| `GET` | `/vacante` | Lista todas las vacantes |
| `POST` | `/vacante` | Crear vacante |
| `GET` | `/vacante/:vid/dashboard` | Vacante + postulaciones (filtros/orden) |
| `GET` | `/vacante/:vid/exportar` | Descargar Excel |
| `GET` | `/cv/:pid` | Descargar CV del candidato |

## Rutas EJS (públicas, sin JWT)

Nginx proxea `/postular/*` y `/confirmacion/*` directamente.

| Ruta | Descripción |
|------|-------------|
| `GET /postular/:vid` | Formulario de postulación |
| `POST /postular/:vid` | Enviar postulación + CV |
| `GET /confirmacion/:pid` | Confirmación de recepción |

## Análisis con IA

1. Extrae texto del CV (pdf-parse / mammoth)
2. Envía prompt estructurado a GPT-4o con requisitos de la vacante
3. Recibe JSON con: score total, legibilidad ATS, match de requisitos, fortalezas, debilidades, recomendación y resumen ejecutivo

## Despliegue (PM2)

```bash
pm2 start src/app.js --name ats-api
pm2 save
pm2 startup
```
