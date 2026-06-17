import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateWithGemini(prompt, systemInstruction = '') {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemInstruction || undefined,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error.message);
    throw new Error('Error al generar contenido con IA: ' + error.message);
  }
}

function contextHeader(comunidad, cuerpo, especialidad) {
  return `Comunidad Autónoma: ${comunidad}\nCuerpo: ${cuerpo}\nEspecialidad: ${especialidad}`;
}

// ============ 1.a VERIFICAR ENUNCIADO OFICIAL ============
export async function lookupTema(comunidad, cuerpo, especialidad, consulta) {
  const system = `Eres un experto en temarios oficiales de oposiciones docentes en España. Conoces los temarios publicados en el BOE para cada cuerpo y especialidad (por ejemplo, Orden EDU/3138/2002 y EDU/2886/2011 para Maestros; Orden de 9 de septiembre de 1993 y posteriores para Secundaria). Tu única tarea es identificar el enunciado OFICIAL del tema solicitado tal cual aparece en la norma estatal vigente. Si el número o título no coincide con un tema real del temario oficial de esa especialidad, debes decirlo claramente y NO inventar.`;

  const prompt = `Especialidad: ${especialidad}
Cuerpo: ${cuerpo}
Comunidad Autónoma (referencia, por si hay temario propio): ${comunidad}
Consulta del opositor: "${consulta}"

Devuelve EXCLUSIVAMENTE un JSON válido (sin texto adicional, sin bloques de código) con esta forma:
{
  "encontrado": true | false,
  "numero": <número de tema si aplica, o null>,
  "enunciado_oficial": "<enunciado literal del tema según el temario oficial, o '' si no se ha encontrado>",
  "fuente": "<referencia normativa: p.ej. 'Orden EDU/3138/2002, anexo, Lengua Castellana y Literatura'>",
  "advertencia": "<si hay dudas, ambigüedad, o el número no existe en esa especialidad, explícalo aquí; en caso contrario ''>"
}

Reglas estrictas:
- Comprueba que el número de tema EXISTE en el temario oficial de "${especialidad}" para "${cuerpo}". Si no existe (p. ej. el temario sólo llega a 25 temas), pon "encontrado": false y explica en "advertencia".
- No reformules el enunciado: cópialo tal cual lo recuerdas de la norma oficial.
- Si no estás razonablemente seguro del enunciado literal, "encontrado": false.`;

  const text = await generateWithGemini(prompt, system);
  const match = text.match(/\{[\s\S]*\}/);
  const raw = match ? match[0] : text;
  try {
    return JSON.parse(raw);
  } catch {
    return {
      encontrado: false,
      numero: null,
      enunciado_oficial: '',
      fuente: '',
      advertencia: 'No se ha podido verificar el enunciado oficial automáticamente. Introdúcelo manualmente.',
    };
  }
}

// ============ 1.b TEMARIO ============
export async function generateTemario(comunidad, cuerpo, especialidad, enunciado, instrucciones) {
  const system = `Eres un experto preparador de oposiciones docentes en España. Redactas temas completos, rigurosos, con estructura académica clara, citas a la legislación vigente aplicable y referencias bibliográficas relevantes. Adaptas el contenido a la normativa autonómica que se indique. REGLA CRÍTICA: te ciñes EXACTAMENTE al enunciado oficial del tema que se te indica. No lo cambias, no lo reinterpretas y no lo sustituyes por otro tema del temario. Si el enunciado no corresponde con la especialidad indicada, debes avisarlo al principio del documento antes de desarrollarlo.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}

Enunciado OFICIAL del tema a desarrollar (no lo modifiques, no lo sustituyas):
"${enunciado}"

Antes de empezar, comprueba mentalmente que ese enunciado corresponde realmente al temario oficial de "${especialidad}" (${cuerpo}). Si detectas que el enunciado pertenece a otra especialidad o no existe en el temario oficial, comienza el documento con un bloque de aviso ">  ⚠️ Aviso: ..." explicándolo, y continúa desarrollando el contenido tal como pide el enunciado proporcionado.

Instrucciones adicionales del opositor:
${instrucciones || '(sin instrucciones específicas)'}

Redacta un tema completo y desarrollado, listo para estudiar, sobre EL ENUNCIADO INDICADO ARRIBA, con la siguiente estructura:
1. **Introducción y justificación legal** (citando LOMLOE, normativa estatal y autonómica de ${comunidad} aplicable).
2. **Marco teórico y conceptual** (autores, corrientes, fundamentación).
3. **Desarrollo del tema por epígrafes** (al menos 5-7 epígrafes bien estructurados, directamente relacionados con el enunciado oficial).
4. **Aplicación didáctica al aula** (vinculación con el currículo vigente).
5. **Conclusión**.
6. **Bibliografía y webgrafía** (mínimo 6 fuentes solventes y actuales).

Usa Markdown. Sé exhaustivo: el tema debe tener entre 2.500 y 4.000 palabras.`;

  return await generateWithGemini(prompt, system);
}

// ============ 2.a CARACTERÍSTICAS DEL SUPUESTO ============
export async function describeSupuestoFormat(comunidad, cuerpo, especialidad) {
  const system = `Eres un experto preparador de oposiciones docentes en España. Conoces en detalle el formato de la prueba práctica (supuesto práctico) que se exige en cada Comunidad Autónoma para cada cuerpo y especialidad, según las convocatorias más recientes. Tu información se basa en las órdenes de convocatoria publicadas en los boletines oficiales autonómicos.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}

Describe con precisión el formato de la PRUEBA PRÁCTICA / SUPUESTO PRÁCTICO tal y como se viene planteando en las convocatorias recientes de oposiciones a "${cuerpo}" - "${especialidad}" en "${comunidad}".

Estructura tu respuesta en Markdown con estos apartados:

## Formato y estructura
- Tipología del ejercicio (ejercicio escrito, resolución de caso, comentario, ejercicio técnico…)
- Número de partes o preguntas habituales
- Duración aproximada
- Materiales permitidos (calculadora, diccionario, normativa, etc.)

## Contenidos y temáticas frecuentes
- Bloques de contenido más recurrentes en convocatorias recientes
- Tipo de situaciones planteadas (didácticas, atención a la diversidad, resolución técnica, comentario de texto, problemas, etc.)

## Criterios de evaluación del tribunal
- Qué valoran los tribunales en esa CCAA y especialidad
- Errores habituales a evitar

## Marco normativo de referencia
- Orden de convocatoria autonómica más reciente que regula la prueba (cítala si la conoces).
- Normativa estatal y autonómica a la que conviene aludir en la resolución.

## Consejos específicos
- Recomendaciones de estructura de respuesta, extensión y enfoque adaptadas a "${comunidad}".

Sé concreto y específico de la CCAA: no des una descripción genérica. Si hay diferencias importantes entre la convocatoria de "${comunidad}" y otras CCAA, destácalas. Si en algún punto no estás seguro, indícalo con un aviso ">  ⚠️ Verifica en la convocatoria oficial vigente".`;

  return await generateWithGemini(prompt, system);
}

// ============ 2.b GENERAR SUPUESTO ============
export async function generarSupuesto(comunidad, cuerpo, especialidad, formato) {
  const system = `Eres un experto en oposiciones docentes y conoces el estilo, formato y temáticas de los supuestos prácticos planteados en convocatorias reales de las distintas Comunidades Autónomas de España. Tu tarea es generar un supuesto práctico realista y una resolución modelo, ajustados ESTRICTAMENTE al formato real de la CCAA y especialidad indicadas. REGLA CRÍTICA: no impongas estructuras genéricas (por ejemplo, "aplicación didáctica", "DUA", "temporalización por sesiones") si no son parte del formato real de esa convocatoria. Si en esa CCAA el supuesto es un ejercicio técnico, un comentario de texto, un problema, un análisis lingüístico, una traducción, un caso jurídico, etc., adapta la respuesta a ESE formato y no a una unidad didáctica.`;

  const formatoBloque = formato?.trim()
    ? `Características reales del supuesto en esta CCAA (debes respetarlas al pie de la letra):\n---\n${formato}\n---`
    : `No se ha proporcionado un análisis previo del formato. Antes de redactar, recuerda mentalmente cómo es realmente el supuesto práctico de "${especialidad}" en "${comunidad}" en las convocatorias recientes (tipología, número de preguntas, duración, materiales, tipo de tareas) y AJÚSTATE a ese formato real, sin inventar un formato genérico.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}

${formatoBloque}

Tarea:
1. Decide internamente cuál es el formato real del supuesto (tipología, nº de partes/preguntas, duración, materiales). NO añadas apartados que no formen parte de ese formato real.
2. Elige un nivel/curso y una temática verosímiles y representativos de los que suelen aparecer en esa convocatoria.
3. Redacta el supuesto y su resolución usando EXACTAMENTE la misma estructura, número de preguntas y estilo que un tribunal de "${comunidad}" plantearía para "${especialidad}".

Devuelve en Markdown con estos apartados:

## Formato aplicado
2-4 líneas indicando qué formato real estás imitando (tipología, nº de partes, duración) y la fuente normativa de referencia si la conoces.

## Supuesto práctico (modelo)
Enunciado realista, con todos los datos y preguntas tal y como aparecerían en la convocatoria real. Respeta el nº de preguntas/partes propio de esa CCAA. No incluyas instrucciones meta del tipo "ahora resuelve".

## Resolución modelo
Resuelve el supuesto respondiendo punto por punto a las preguntas planteadas en el enunciado anterior, con la profundidad y enfoque que un tribunal de "${comunidad}" esperaría. Cita la normativa estatal (LOMLOE u otra que proceda) y autonómica concreta SOLO cuando sea pertinente al tipo de supuesto. Incluye atención a la diversidad, secuencias didácticas, etc. ÚNICAMENTE si el formato real del supuesto lo exige.`;

  return await generateWithGemini(prompt, system);
}

// ============ 3. PROGRAMACIÓN DIDÁCTICA ============
export async function generarProgramacion(comunidad, cuerpo, especialidad, curso, numUnidades, enfoque, contextoCentro) {
  const system = `Eres experto en programaciones didácticas para oposiciones docentes en España. Conoces el currículo LOMLOE y los decretos autonómicos vigentes. Redactas programaciones ajustadas estrictamente a la normativa de la Comunidad Autónoma indicada, con la estructura y terminología que exigen los tribunales.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}
Curso/nivel: ${curso}
Número de Unidades Didácticas: ${numUnidades}
Enfoque metodológico preferido: ${enfoque || '(sin preferencia, elige el más adecuado)'}
Contexto del centro: ${contextoCentro || '(centro tipo de la CCAA)'}

Redacta un BORRADOR de Programación Didáctica completo, ajustado a la normativa vigente de ${comunidad} (cita decretos autonómicos concretos cuando proceda) y a la LOMLOE. Estructura:

1. **Introducción y justificación normativa** (normativa estatal y de ${comunidad}).
2. **Contexto del centro y del aula**.
3. **Objetivos de etapa y de la materia**.
4. **Competencias clave y específicas**.
5. **Saberes básicos / contenidos**.
6. **Criterios de evaluación e instrumentos**.
7. **Metodología y principios pedagógicos**.
8. **Atención a las diferencias individuales (DUA, ACS, ACI)**.
9. **Elementos transversales**.
10. **Secuenciación de las ${numUnidades} Unidades Didácticas** (título, temporalización, breve descripción y CE asociados).
11. **Evaluación de la práctica docente**.
12. **Bibliografía y recursos**.

Usa Markdown con encabezados, tablas cuando aporten claridad y citas legales precisas.`;

  return await generateWithGemini(prompt, system);
}

// ============ 4. SITUACIONES DE APRENDIZAJE ============
export async function generarSituacion(comunidad, cuerpo, especialidad, titulo, curso, duracion, productoFinal, pautas) {
  const system = `Eres experto en el diseño de Situaciones de Aprendizaje dentro del marco LOMLOE y de la normativa autonómica vigente. Diseñas Situaciones de Aprendizaje competenciales, contextualizadas, con DUA, y alineadas con saberes básicos, competencias específicas y criterios de evaluación.`;

  const prompt = `Contexto del opositor:
${contextHeader(comunidad, cuerpo, especialidad)}
Título de la Situación de Aprendizaje: ${titulo}
Curso/nivel: ${curso}
Duración estimada: ${duracion}
Producto final deseado: ${productoFinal || '(propón uno coherente)'}
Pautas del opositor: ${pautas || '(libre)'}

Redacta un BORRADOR completo de Situación de Aprendizaje según el marco LOMLOE y la normativa de ${comunidad}. Estructura:

1. **Título y justificación** (vinculación con el contexto del centro y el currículo).
2. **Descripción y reto / pregunta motriz**.
3. **Competencias específicas y descriptores operativos del perfil de salida**.
4. **Saberes básicos** implicados.
5. **Criterios de evaluación** asociados.
6. **Secuencia didáctica por sesiones** (tabla: sesión, actividad, agrupamiento, recursos, tiempo).
7. **Producto final** y su sentido competencial.
8. **Metodologías activas** empleadas (ABP, aprendizaje cooperativo, etc.).
9. **Atención a la diversidad (DUA)**: pautas de representación, acción/expresión e implicación.
10. **Evaluación**: instrumentos, rúbrica del producto final, autoevaluación y coevaluación.
11. **Conexión con los ODS y elementos transversales**.

Usa Markdown e incluye al menos una tabla con la secuencia didáctica.`;

  return await generateWithGemini(prompt, system);
}
