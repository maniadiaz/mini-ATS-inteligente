export interface Vacante {
  id: string
  puesto: string
  empresa: string
  descripcion: string
  anios_exp: string
  stack: string
  ingles: string
  espanol: string
  otros: string
  activa: boolean
  postulaciones: { id: string }[] | string[]
  createdAt?: string
  updatedAt?: string
}

export interface StackMatch {
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
    stack: StackMatch
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
  vacante_id: string
  nombre: string
  telefono: string
  email: string
  filename: string
  resultado: ResultadoIA
  createdAt?: string
  updatedAt?: string
}
