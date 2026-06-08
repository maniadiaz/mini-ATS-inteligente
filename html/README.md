# Frontend — ATS Pro

Panel de reclutamiento SPA construido con React + TypeScript + Material UI.

## Stack

| Librería | Uso |
|---|---|
| **React 18 + Vite** | Framework + build tool |
| **TypeScript** | Tipado estático |
| **Material UI v6 (MUI)** | Sistema de diseño |
| **React Router v6** | Enrutamiento SPA |
| **Axios** | HTTP con interceptores JWT |
| **Recharts** | Gráficas (BarChart, PieChart) |
| **DM Sans + Sora** | Tipografías via Google Fonts |

## Instalación

```bash
cd html
cp .env.example .env
npm install
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | Base URL de la API (default: `/api`) |

En producción Nginx proxea `/api/` al backend — no se necesita cambiar esta variable.

## Comandos

```bash
npm run dev      # Vite dev server con HMR
npm run build    # Build de producción → dist/
npm run preview  # Preview del build local
```

## Estructura

```
html/
├── src/
│   ├── main.tsx                         ← Entry point (React + MUI + Router + CSS)
│   ├── App.tsx                          ← Árbol de rutas con roles
│   ├── theme.ts                         ← Tema MUI (colores, tipografía, radios, overrides)
│   ├── index.css                        ← Animaciones CSS (fadeInUp, shake, scaleIn…)
│   ├── api/
│   │   └── axios.ts                     ← Instancia Axios + interceptor JWT + redirect 401
│   ├── context/
│   │   ├── AuthContext.tsx              ← Token, user, login(), logout(), role helpers
│   │   └── ThemeContext.tsx             ← Toggle light/dark mode
│   ├── types/
│   │   └── index.ts                     ← Interfaces TypeScript (Vacante, Postulacion, etc.)
│   ├── components/
│   │   ├── Layout.tsx                   ← Drawer 248px + AppBar + sección labels por rol
│   │   ├── ProtectedRoute.tsx           ← Guard por rol (allowedRoles)
│   │   ├── PublicRoute.tsx              ← Redirige a dashboard si ya hay sesión
│   │   ├── CandidatoRow.tsx             ← Fila expandible con detalle del candidato
│   │   ├── ScoreBadge.tsx              ← Badge numérico coloreado por score
│   │   └── RecomendacionBadge.tsx      ← APTO / REVISAR / NO APTO
│   └── pages/
│       ├── Login.tsx                    ← Split panel + shake on error
│       ├── Register.tsx                 ← Split panel + password strength bar
│       ├── Dashboard.tsx                ← Grid de vacantes con hover CTA
│       ├── NuevaVacante.tsx             ← Formulario 4-secciones para crear vacante
│       ├── VacanteDashboard.tsx         ← Ranking de candidatos + filtros + export
│       ├── admin/
│       │   ├── AdminUsuarios.tsx        ← CRUD de usuarios de la empresa
│       │   ├── AdminEmpresa.tsx         ← Perfil de empresa + upload de logo
│       │   ├── AdminConfiguracion.tsx   ← Suscripción, uso de CVs, paquetes extra
│       │   └── AdminSuscripcion.tsx     ← (redirect legacy → /admin/configuracion)
│       └── superadmin/
│           ├── SuperAdminDashboard.tsx  ← KPIs globales + BarChart + PieChart
│           ├── SuperAdminEmpresas.tsx   ← Lista y gestión de todas las empresas
│           ├── SuperAdminVacantes.tsx   ← Vacantes agrupadas por empresa (Accordion)
│           ├── SuperAdminPagos.tsx      ← Historial de pagos y suscripciones
│           └── SuperAdminPlan.tsx       ← Configuración del plan global
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── deploy.sh
```

## Rutas

### Públicas

| Ruta | Página |
|---|---|
| `/login` | Login |
| `/register` | Registro de empresa |

### Protegidas (cualquier rol autenticado)

| Ruta | Página |
|---|---|
| `/dashboard` | Lista de vacantes de la empresa |
| `/vacante/nueva` | Crear nueva vacante |
| `/vacante/:vid` | Dashboard de candidatos de una vacante |

### Admin (`admin` o `superadmin`)

| Ruta | Página |
|---|---|
| `/admin/usuarios` | Gestión de usuarios |
| `/admin/empresa` | Perfil y logo de empresa |
| `/admin/configuracion` | Suscripción, CVs y paquetes |

### Superadmin

| Ruta | Página |
|---|---|
| `/superadmin/dashboard` | Panel global con KPIs y gráficas |
| `/superadmin/empresas` | Todas las empresas registradas |
| `/superadmin/vacantes` | Vacantes agrupadas por empresa |
| `/superadmin/pagos` | Historial de pagos Stripe |
| `/superadmin/plan` | Configuración del plan |

## Autenticación

- JWT guardado en `localStorage` con key `ats_token`
- `AuthContext` expone: `user`, `token`, `login()`, `logout()`, `isSuperAdmin`, `isAdmin`, `isAuthenticated`
- Interceptor Axios agrega `Authorization: Bearer <token>` en cada request
- Si el backend responde 401 → limpia token y redirige a `/login`
- Al hacer login, el backend devuelve `redirectTo` (`/dashboard` o `/superadmin/dashboard` según el rol)

## Sistema de diseño

- **Tipografía:** DM Sans (body) + Sora (headings `h1`–`h6`, fontWeight 800)
- **Color primario:** `#1A3C5E` con gradiente en botones principales
- **Border radius:** 16px en Cards, 10px global, 8px en botones
- **Animaciones:** `fadeInUp`, `fadeIn`, `shake`, `scaleIn` definidas en `index.css`
- **Stagger:** `animationDelay: idx * 40ms` en listas de cards/accordions
- **Sin colores hardcodeados** — siempre `theme.palette.*`
- **Status badges:** colores semánticos con `{ bg, fg }` custom (no Chip `color` prop)

## Despliegue

```bash
# En el servidor
cd /var/www/ats.servercontrol-mzt.com/html
npm install
npm run build
# dist/ es servido por Nginx como archivos estáticos
```

El frontend no necesita PM2 — es un build estático.

```bash
# Script rápido
./deploy.sh
```
