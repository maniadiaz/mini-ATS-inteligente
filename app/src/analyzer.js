const OpenAI = require('openai')
const { z } = require('zod')

// ─── OpenAI client (lazy) ─────────────────────────────────────────────────

let client = null
function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}

// ─── Zod schema — expected shape from GPT-4o ─────────────────────────────

const BoolDetail = z.object({
  cumple: z.boolean(),
  detalle: z.string(),
})

const ResultadoSchema = z.object({
  score_total: z.number().int().min(0).max(100),
  ats_legibilidad: z.object({
    score: z.number().int().min(0).max(100),
    detectable: z.boolean(),
    problemas: z.array(z.string()),
    resumen: z.string(),
  }),
  match_requisitos: z.object({
    score: z.number().int().min(0).max(100),
    anios_exp: BoolDetail,
    habilidades: z.object({
      cumple: z.boolean(),
      encontrados: z.array(z.string()),
      faltantes: z.array(z.string()),
    }),
    ingles: BoolDetail,
    espanol: BoolDetail,
    otros: BoolDetail,
  }),
  fortalezas: z.array(z.string()),
  debilidades: z.array(z.string()),
  recomendacion: z.enum(['APTO', 'NO APTO', 'REVISAR']),
  resumen_ejecutivo: z.string(),
})

// ─── Prompt injection sanitization ───────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/gi,
  /forget\s+(all\s+)?previous\s+instructions?/gi,
  /you\s+are\s+now\s+/gi,
  /system\s*:/gi,
  /assistant\s*:/gi,
  /\[INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
]

const MAX_CV_CHARS = 12000 // ~3 000 tokens — safe budget leaving room for prompt

function sanitizeCvText(raw) {
  let text = raw.slice(0, MAX_CV_CHARS)

  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, '[CONTENIDO FILTRADO]')
  }

  // Strip XML/HTML tags that could interfere with delimiters
  text = text.replace(/<\/?[a-zA-Z][^>]{0,200}>/g, ' ')

  return text.trim()
}

// ─── Retry with exponential backoff ──────────────────────────────────────

const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504])

async function withRetry(fn, maxAttempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      const isRetryable =
        RETRYABLE_CODES.has(err.status) ||
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        err.message?.includes('rate limit')

      if (!isRetryable || attempt === maxAttempts) break

      const delayMs = 2 ** attempt * 500 // 1s, 2s, 4s
      console.warn(`[analyzer] intento ${attempt} fallido (${err.message}). Reintentando en ${delayMs}ms…`)
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  throw lastError
}

// ─── Fallback result ──────────────────────────────────────────────────────

function buildFallback(reason) {
  return {
    score_total: 0,
    ats_legibilidad: {
      score: 0,
      detectable: false,
      problemas: [reason],
      resumen: 'Error en análisis',
    },
    match_requisitos: {
      score: 0,
      anios_exp: { cumple: false, detalle: 'No analizado' },
      habilidades: { cumple: false, encontrados: [], faltantes: [] },
      ingles: { cumple: false, detalle: 'No analizado' },
      espanol: { cumple: false, detalle: 'No analizado' },
      otros: { cumple: false, detalle: 'No analizado' },
    },
    fortalezas: [],
    debilidades: ['Error al procesar el análisis'],
    recomendacion: 'REVISAR',
    resumen_ejecutivo: `Error durante el análisis: ${reason}`,
  }
}

// ─── Main export ──────────────────────────────────────────────────────────

async function analyzeCV(vacante, cvText) {
  const areaInfo = vacante.area ? `\n- Área profesional: ${vacante.area}` : ''
  const sanitizedCv = sanitizeCvText(cvText)

  const systemPrompt = `Eres un sistema ATS experto en reclutamiento y selección de personal.
Analizas CVs contra los requisitos de vacantes de CUALQUIER industria o área profesional (tecnología, ventas, marketing, finanzas, recursos humanos, operaciones, legal, diseño, etc.).
Evalúas objetivamente según los requisitos específicos de cada vacante.
Respondes ÚNICAMENTE con un objeto JSON válido que siga exactamente el schema indicado.`

  const userPrompt = `## VACANTE
- Puesto: ${vacante.puesto}
- Empresa/Proyecto: ${vacante.empresa}${areaInfo}
- Descripción: ${vacante.descripcion}
- Años de experiencia requeridos: ${vacante.anios_exp}
- Habilidades y conocimientos requeridos: ${vacante.stack}
- Inglés requerido: ${vacante.ingles}
- Español requerido: ${vacante.espanol}
- Otros requisitos: ${vacante.otros || 'Ninguno'}

## CV DEL CANDIDATO
<cv_content>
${sanitizedCv}
</cv_content>

## SCHEMA DE RESPUESTA (JSON estricto)
{
  "score_total": <entero 0-100>,
  "ats_legibilidad": {
    "score": <entero 0-100>,
    "detectable": <boolean>,
    "problemas": ["..."],
    "resumen": "..."
  },
  "match_requisitos": {
    "score": <entero 0-100>,
    "anios_exp": { "cumple": <boolean>, "detalle": "..." },
    "habilidades": { "cumple": <boolean>, "encontrados": ["..."], "faltantes": ["..."] },
    "ingles": { "cumple": <boolean>, "detalle": "..." },
    "espanol": { "cumple": <boolean>, "detalle": "..." },
    "otros": { "cumple": <boolean>, "detalle": "..." }
  },
  "fortalezas": ["...", "..."],
  "debilidades": ["...", "..."],
  "recomendacion": "APTO|NO APTO|REVISAR",
  "resumen_ejecutivo": "2-3 oraciones resumiendo el perfil del candidato vs la vacante"
}`

  try {
    const raw = await withRetry(() =>
      getClient().chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      }).then(r => r.choices[0].message.content)
    )

    const parsed = JSON.parse(raw)
    const validated = ResultadoSchema.parse(parsed)
    return validated
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error('[analyzer] Schema inválido:', JSON.stringify(err.issues, null, 2))
      return buildFallback(`Respuesta de IA con estructura inesperada: ${err.issues[0]?.message}`)
    }
    console.error('[analyzer] Error en análisis IA:', err.message)
    return buildFallback(err.message)
  }
}

module.exports = { analyzeCV }
