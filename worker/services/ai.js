export async function generateContent(prompt, systemInstruction = '') {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001'

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY no configurada')
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.FRONTEND_URL || 'https://app.oposicionesconia.com',
      'X-Title': 'Oposita',
    },
    body: JSON.stringify({
      model,
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: 8192,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter API error (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

function contextHeader(comunidad, cuerpo, especialidad) {
  return `Comunidad Autónoma: ${comunidad}\nCuerpo: ${cuerpo}\nEspecialidad: ${especialidad}`
}

export async function lookupTema(comunidad, cuerpo, especialidad, consulta) {
  const system = 'Eres un experto en temarios oficiales de oposiciones docentes en España.'
  const prompt = `Especialidad: ${especialidad}
Cuerpo: ${cuerpo}
Comunidad Autónoma: ${comunidad}
Consulta: "${consulta}"

Devuelve EXCLUSIVAMENTE un JSON válido:
{
  "encontrado": true | false,
  "numero": <número o null>,
  "enunciado_oficial": "<enunciado literal>",
  "fuente": "<referencia>",
  "advertencia": "<si hay dudas>"
}`
  const text = await generateContent(prompt, system)
  const match = text.match(/\{[\s\S]*\}/)
  const raw = match ? match[0] : text
  try {
    return JSON.parse(raw)
  } catch {
    return { encontrado: false, numero: null, enunciado_oficial: '', fuente: '', advertencia: 'No se ha podido verificar.' }
  }
}

export async function generateTemario(comunidad, cuerpo, especialidad, enunciado, instrucciones) {
  const system = 'Eres un experto preparador de oposiciones docentes en España.'
  const prompt = `Contexto: ${contextHeader(comunidad, cuerpo, especialidad)}
Enunciado: "${enunciado}"
Instrucciones: ${instrucciones || '(ninguna)'}

Redacta un tema completo con estructura académica.`
  return generateContent(prompt, system)
}

export async function describeSupuestoFormat(comunidad, cuerpo, especialidad) {
  const system = 'Eres un experto en el formato de supuestos prácticos de oposiciones docentes.'
  const prompt = `Contexto: ${contextHeader(comunidad, cuerpo, especialidad)}
Describe el formato de la prueba práctica.`
  return generateContent(prompt, system)
}

export async function generarSupuesto(comunidad, cuerpo, especialidad, formato) {
  const system = 'Eres un experto en oposiciones docentes. Generas supuestos prácticos realistas.'
  const prompt = `Contexto: ${contextHeader(comunidad, cuerpo, especialidad)}
Formato: ${formato || '(estándar)'}
Genera un supuesto práctico con resolución modelo.`
  return generateContent(prompt, system)
}

export async function generarProgramacion(comunidad, cuerpo, especialidad, curso, numUnidades, enfoque, contextoCentro) {
  const system = 'Eres experto en programaciones didácticas LOMLOE.'
  const prompt = `Contexto: ${contextHeader(comunidad, cuerpo, especialidad)}
Curso: ${curso} | Unidades: ${numUnidades} | Enfoque: ${enfoque || ''} | Contexto: ${contextoCentro || 'estándar'}
Redacta un borrador de Programación Didáctica completo.`
  return generateContent(prompt, system)
}

export async function generarSituacion(comunidad, cuerpo, especialidad, titulo, curso, duracion, productoFinal, pautas) {
  const system = 'Eres experto en Situaciones de Aprendizaje LOMLOE.'
  const prompt = `Contexto: ${contextHeader(comunidad, cuerpo, especialidad)}
Título: ${titulo} | Curso: ${curso} | Duración: ${duracion} | Producto: ${productoFinal || ''} | Pautas: ${pautas || ''}
Redacta una Situación de Aprendizaje completa.`
  return generateContent(prompt, system)
}
