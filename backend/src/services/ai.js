const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

async function generateWithOpenRouter(prompt, systemInstruction = '') {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'Oposita',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt },
      ],
      max_tokens: 8192,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function generateWithGemini(prompt, systemInstruction = '') {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemInstruction || undefined,
  });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateContent(prompt, systemInstruction = '') {
  try {
    if (AI_PROVIDER === 'openrouter' && OPENROUTER_API_KEY) {
      return await generateWithOpenRouter(prompt, systemInstruction);
    }
    return await generateWithGemini(prompt, systemInstruction);
  } catch (error) {
    console.error(`${AI_PROVIDER} API error:`, error.message);
    throw new Error('Error al generar contenido con IA: ' + error.message);
  }
}

function contextHeader(comunidad, cuerpo, especialidad) {
  return `Comunidad Autónoma: ${comunidad}\nCuerpo: ${cuerpo}\nEspecialidad: ${especialidad}`;
}

// ============ 1.a LOOKUP ============
export async function lookupTema(comunidad, cuerpo, especialidad, consulta) {
  const system = `Eres un experto en temarios oficiales de oposiciones docentes en España. Conoces los temarios publicados en el BOE para cada cuerpo y especialidad. Tu única tarea es identificar el enunciado OFICIAL del tema solicitado tal cual aparece en la norma estatal vigente. Si el número o título no coincide con un tema real del temario oficial de esa especialidad, debes decirlo claramente y NO inventar.`;

  const prompt = `Especialidad: ${especialidad}
Cuerpo: ${cuerpo}
Comunidad Autónoma (referencia, por si hay temario propio): ${comunidad}
Consulta del opositor: "${consulta}"

Devuelve EXCLUSIVAMENTE un JSON válido (sin texto adicional, sin bloques de código) con esta forma:
{
  "encontrado": true | false,
  "numero": <número de tema si aplica, o null>,
  "enunciado_oficial": "<enunciado literal del tema según el temario oficial, o '' si no se ha encontrado>",
  "fuente": "<referencia normativa>",
  "advertencia": "<si hay dudas, ambigüedad, o el número no existe en esa especialidad, explícalo aquí; en caso contrario ''>"
}

Reglas estrictas:
- Comprueba que el número de tema EXISTE en el temario oficial de "${especialidad}" para "${cuerpo}". Si no existe, pon "encontrado": false.
- No reformules el enunciado: cópialo tal cual de la norma oficial.
- Si no estás razonablemente seguro del enunciado literal, "encontrado": false.`;

  const text = await generateContent(prompt, system);
  const match = text.match(/\{[\s\S]*\}/);
  const raw = match ? match[0] : text;
  try {
    return JSON.parse(raw);
  } catch {
    return {
      encontrado: false, numero: null, enunciado_oficial: '', fuente: '',
      advertencia: 'No se ha podido verificar el enunciado oficial automáticamente.',
    };
  }
}

// ============ 1.b TEMARIO ============
export async function generateTemario(comunidad, cuerpo, especialidad, enunciado, instrucciones) {
  const system = `Eres un experto preparador de oposiciones docentes en España. Redactas temas completos, rigurosos, con estructura académica clara, citas a la legislación vigente aplicable y referencias bibliográficas relevantes. Adaptas el contenido a la normativa autonómica que se indique. REGLA CRÍTICA: te ciñes EXACTAMENTE al enunciado oficial del tema que se te indica. No lo cambias, no lo reinterpretas y no lo sustituyes por otro tema del temario.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}

Enunciado OFICIAL del tema a desarrollar (no lo modifiques, no lo sustituyas):
"${enunciado}"

Antes de empezar, comprueba mentalmente que ese enunciado corresponde realmente al temario oficial de "${especialidad}" (${cuerpo}). Si detectas que el enunciado pertenece a otra especialidad o no existe en el temario oficial, comienza el documento con un bloque de aviso ">  ⚠️ Aviso: ..." explicándolo.

Instrucciones adicionales del opositor:
${instrucciones || '(sin instrucciones específicas)'}

Redacta un tema completo con la siguiente estructura:
1. **Introducción y justificación legal** (citando LOMLOE, normativa estatal y autonómica de ${comunidad}).
2. **Marco teórico y conceptual**.
3. **Desarrollo del tema por epígrafes** (al menos 5-7 epígrafes).
4. **Aplicación didáctica al aula**.
5. **Conclusión**.
6. **Bibliografía y webgrafía** (mínimo 6 fuentes).

Usa Markdown. Extensión: 2.500 - 4.000 palabras.`;

  return await generateContent(prompt, system);
}

// ============ 2.a CARACTERÍSTICAS DEL SUPUESTO ============
export async function describeSupuestoFormat(comunidad, cuerpo, especialidad) {
  const system = `Eres un experto preparador de oposiciones docentes en España. Conoces en detalle el formato de la prueba práctica (supuesto práctico) que se exige en cada Comunidad Autónoma para cada cuerpo y especialidad, según las convocatorias más recientes.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}

Describe con precisión el formato de la PRUEBA PRÁCTICA / SUPUESTO PRÁCTICO en las convocatorias recientes de oposiciones a "${cuerpo}" - "${especialidad}" en "${comunidad}".

Estructura en Markdown:

## Formato y estructura
- Tipología, número de partes, duración, materiales permitidos

## Contenidos y temáticas frecuentes
- Bloques más recurrentes, tipo de situaciones

## Criterios de evaluación del tribunal
- Qué valoran, errores habituales

## Marco normativo de referencia
- Orden de convocatoria autonómica más reciente

## Consejos específicos
- Recomendaciones adaptadas a "${comunidad}"

Sé concreto y específico de la CCAA.`;

  return await generateContent(prompt, system);
}

// ============ 2.b GENERAR SUPUESTO ============
export async function generarSupuesto(comunidad, cuerpo, especialidad, formato) {
  const system = `Eres un experto en oposiciones docentes. Generas supuestos prácticos realistas y resoluciones modelo, ajustados ESTRICTAMENTE al formato real de la CCAA y especialidad. REGLA CRÍTICA: no impongas estructuras genéricas si no son parte del formato real de esa convocatoria.`;

  const formatoBloque = formato?.trim()
    ? `Características reales del supuesto en esta CCAA:\n---\n${formato}\n---`
    : `Recuerda mentalmente cómo es el supuesto práctico de "${especialidad}" en "${comunidad}" en las convocatorias recientes y AJÚSTATE a ese formato real.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}

${formatoBloque}

Devuelve en Markdown:

## Formato aplicado
2-4 líneas indicando qué formato real imitas.

## Supuesto práctico (modelo)
Enunciado realista con todas las preguntas.

## Resolución modelo
Resolución punto por punto.`;

  return await generateContent(prompt, system);
}

// ============ 3. PROGRAMACIÓN DIDÁCTICA ============
export async function generarProgramacion(comunidad, cuerpo, especialidad, curso, numUnidades, enfoque, contextoCentro) {
  const system = `Eres experto en programaciones didácticas para oposiciones docentes en España. Conoces el currículo LOMLOE y los decretos autonómicos vigentes.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}
Curso/nivel: ${curso}
Unidades: ${numUnidades}
Enfoque: ${enfoque || '(sin preferencia)'}
Contexto: ${contextoCentro || '(centro tipo)'}

Redacta un BORRADOR de Programación Didáctica completo:

1. Introducción y justificación normativa
2. Contexto del centro y del aula
3. Objetivos de etapa y de la materia
4. Competencias clave y específicas
5. Saberes básicos / contenidos
6. Criterios de evaluación e instrumentos
7. Metodología y principios pedagógicos
8. Atención a las diferencias individuales (DUA)
9. Elementos transversales
10. Secuenciación de las ${numUnidades} Unidades Didácticas
11. Evaluación de la práctica docente
12. Bibliografía y recursos

Usa Markdown. Cita normativa de ${comunidad}.`;

  return await generateContent(prompt, system);
}

// ============ 4. SITUACIONES DE APRENDIZAJE ============
export async function generarSituacion(comunidad, cuerpo, especialidad, titulo, curso, duracion, productoFinal, pautas) {
  const system = `Eres experto en Situaciones de Aprendizaje LOMLOE. Diseñas SA competenciales, contextualizadas, con DUA, alineadas con saberes básicos, competencias específicas y criterios de evaluación.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}
Título: ${titulo}
Curso: ${curso}
Duración: ${duracion}
Producto final: ${productoFinal || '(a proponer)'}
Pautas: ${pautas || '(libre)'}

Redacta un BORRADOR completo de Situación de Aprendizaje:

1. Título y justificación
2. Descripción y reto / pregunta motriz
3. Competencias específicas y descriptores operativos
4. Saberes básicos implicados
5. Criterios de evaluación asociados
6. Secuencia didáctica por sesiones (tabla)
7. Producto final
8. Metodologías activas
9. Atención a la diversidad (DUA)
10. Evaluación (instrumentos, rúbrica)
11. Conexión con ODS

Usa Markdown con tabla de secuencia didáctica.`;

  return await generateContent(prompt, system);
}
