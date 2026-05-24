const OpenAI = require('openai');

let client = null;
function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder' });
  }
  return client;
}

function stripMarkdownFences(text) {
  text = text.trim();
  text = text.replace(/^```(?:json)?\s*\n?/, '');
  text = text.replace(/\n?```\s*$/, '');
  return text.trim();
}

async function analyzeCV(vacante, cvText) {
  const prompt = `Eres un sistema ATS (Applicant Tracking System) experto en reclutamiento tech.

Analiza el siguiente CV contra los requisitos de la vacante y devuelve ÚNICAMENTE un JSON válido (sin backticks, sin markdown, sin texto adicional).

## VACANTE
- Puesto: ${vacante.puesto}
- Empresa/Proyecto: ${vacante.empresa}
- Descripción: ${vacante.descripcion}
- Años de experiencia requeridos: ${vacante.anios_exp}
- Stack tecnológico requerido: ${vacante.stack}
- Inglés requerido: ${vacante.ingles}
- Español requerido: ${vacante.espanol}
- Otros requisitos: ${vacante.otros || 'Ninguno'}

## CV DEL CANDIDATO
${cvText.slice(0, 4000)}

## FORMATO DE RESPUESTA (JSON puro, sin markdown)
{
  "score_total": <0-100>,
  "ats_legibilidad": {
    "score": <0-100>,
    "detectable": <true|false>,
    "problemas": ["..."],
    "resumen": "..."
  },
  "match_requisitos": {
    "score": <0-100>,
    "anios_exp": { "cumple": true|false, "detalle": "..." },
    "stack": { "cumple": true|false, "encontrados": ["..."], "faltantes": ["..."] },
    "ingles": { "cumple": true|false, "detalle": "..." },
    "espanol": { "cumple": true|false, "detalle": "..." },
    "otros": { "cumple": true|false, "detalle": "..." }
  },
  "fortalezas": ["...", "..."],
  "debilidades": ["...", "..."],
  "recomendacion": "APTO|NO APTO|REVISAR",
  "resumen_ejecutivo": "2-3 oraciones resumiendo perfil vs vacante"
}`;

  try {
    const response = await getClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    const raw = response.choices[0].message.content;
    const cleaned = stripMarkdownFences(raw);
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Error en análisis IA:', err.message);
    return {
      score_total: 0,
      ats_legibilidad: {
        score: 0,
        detectable: false,
        problemas: [err.message],
        resumen: 'Error en análisis',
      },
      match_requisitos: {
        score: 0,
        anios_exp: { cumple: false, detalle: 'No analizado' },
        stack: { cumple: false, encontrados: [], faltantes: [] },
        ingles: { cumple: false, detalle: 'No analizado' },
        espanol: { cumple: false, detalle: 'No analizado' },
        otros: { cumple: false, detalle: 'No analizado' },
      },
      fortalezas: [],
      debilidades: ['Error al procesar el análisis'],
      recomendacion: 'REVISAR',
      resumen_ejecutivo: `Error durante el análisis: ${err.message}`,
    };
  }
}

module.exports = { analyzeCV };
