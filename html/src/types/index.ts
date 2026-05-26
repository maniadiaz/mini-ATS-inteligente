export interface Company {
  id: string
  nombre: string
  rfc?: string
  email: string
  status: 'trial' | 'active' | 'suspended' | 'cancelled'
  trial_ends_at?: string
  cv_analizados_mes: number
  cv_limit: number
  cv_extras: number
  cv_disponibles: number
  cv_porcentaje: number
  createdAt?: string
}

export interface UserInfo {
  id: string
  nombre: string
  email: string
  role: 'superadmin' | 'admin' | 'recruiter'
  activo: boolean
  company_id?: string
  createdAt?: string
}

export interface PlanInfo {
  id?: string
  nombre: string
  precio: number
  trial_days: number
  cv_limit: number
  stripe_price_id?: string | null
  activo?: boolean
}

export interface CvPack {
  id: string
  company_id: string
  stripe_payment_intent_id?: string
  stripe_session_id?: string
  cantidad: number
  monto: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface SubscriptionInfo {
  id: string
  company_id: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  stripe_price_id?: string
  status: 'authorized' | 'paused' | 'cancelled' | 'pending'
  current_period_end?: string
  amount?: number
  company?: { id: string; nombre: string; email: string }
  createdAt?: string
}

export interface Vacante {
  id: string
  company_id: string
  puesto: string
  empresa: string
  descripcion: string
  anios_exp: string
  stack: string
  ingles: string
  espanol: string
  otros: string
  activa: boolean
  notify_email: boolean
  fecha_inicio?: string | null
  fecha_fin?: string | null
  area?: string | null
  habilidades_requeridas?: string | null
  postulaciones: { id: string }[] | string[]
  postulantes_count?: number
  createdAt?: string
  updatedAt?: string
}

/** @deprecated Use HabilidadesMatch */
export interface StackMatch {
  cumple: boolean
  encontrados: string[]
  faltantes: string[]
}

export interface HabilidadesMatch {
  cumple: boolean
  encontrados: string[]
  faltantes: string[]
}

export interface RequisitoSimple {
  cumple: boolean
  detalle: string
}

export interface ResultadoIA {
  score_total: number
  ats_legibilidad: {
    score: number
    detectable: boolean
    problemas: string[]
    resumen: string
  }
  match_requisitos: {
    score: number
    anios_exp: RequisitoSimple
    habilidades: HabilidadesMatch
    /** @deprecated use habilidades */
    stack?: StackMatch
    ingles: RequisitoSimple
    espanol: RequisitoSimple
    otros: RequisitoSimple
  }
  fortalezas: string[]
  debilidades: string[]
  recomendacion: 'APTO' | 'NO APTO' | 'REVISAR'
  resumen_ejecutivo: string
}

export interface Postulacion {
  id: string
  company_id: string
  vacante_id: string
  nombre: string
  telefono: string
  email: string
  filename: string
  resultado: ResultadoIA
  createdAt?: string
  updatedAt?: string
}
