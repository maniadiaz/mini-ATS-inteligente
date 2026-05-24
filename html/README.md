# Frontend — Mini ATS Inteligente

Panel de reclutamiento SPA construido con React + TypeScript + Material UI.

## Stack

- **Framework:** React 18 + Vite + TypeScript
- **UI:** Material UI v6 (MUI)
- **Routing:** React Router v6
- **HTTP:** Axios con interceptores JWT
- **Estado:** Context API (AuthContext)
- **Fuente:** Inter (Google Fonts)

## Instalación

```bash
cd html
cp .env.example .env
npm install
```

## Variables de entorno (.env)

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | Base URL de la API (default: `/api`) |

En producción, Nginx sirve el build estático y proxea `/api/` al backend.

## Uso

```bash
# Desarrollo (Vite dev server con HMR)
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Estructura

```
html/
├── src/
│   ├── main.tsx                ← Entry point (React + MUI + Router)
│   ├── App.tsx                 ← Router principal
│   ├── theme.ts               ← Tema MUI (#1A3C5E + Inter)
│   ├── api/
│   │   └── axios.ts           ← Instancia Axios + interceptores JWT
│   ├── context/
│   │   └── AuthContext.tsx    ← Token, login(), logout(), isAuthenticated
│   ├── types/
│   │   └── index.ts           ← Interfaces TypeScript
│   ├── components/
│   │   ├── Layout.tsx         ← AppBar + Outlet
│   │   ├── ProtectedRoute.tsx ← Redirect a /login si no hay token
│   │   ├── ScoreBadge.tsx     ← Chip color por score
│   │   ├── RecomendacionBadge.tsx ← APTO/REVISAR/NO APTO
│   │   └── CandidatoRow.tsx   ← Fila expandible de la tabla
│   └── pages/
│       ├── Login.tsx
│       ├── Dashboard.tsx      ← Grid de vacantes
│       ├── NuevaVacante.tsx   ← Formulario crear vacante
│       └── VacanteDashboard.tsx ← Ranking + filtros + export
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── deploy.sh
```

## Páginas

| Ruta | Página | Acceso |
|------|--------|--------|
| `/login` | Login | Pública |
| `/dashboard` | Lista de vacantes | Protegida |
| `/vacante/nueva` | Crear vacante | Protegida |
| `/vacante/:vid` | Ranking de candidatos | Protegida |

## Autenticación

- JWT guardado en `localStorage` con key `ats_token`
- Interceptor Axios agrega `Authorization: Bearer <token>` automáticamente
- Si el backend responde 401 → limpia token y redirige a `/login`
- `ProtectedRoute` verifica el token antes de renderizar rutas protegidas

## Despliegue

```bash
# En el servidor
cd /var/www/ats.servercontrol-mzt.com/html
npm install
npm run build
```

El build genera `dist/` que Nginx sirve como archivos estáticos. No necesita PM2.

### Script rápido

```bash
./deploy.sh
```
