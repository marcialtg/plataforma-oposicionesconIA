// Agente de noticias de oposiciones de educación secundaria (curso 2026-2027).
//
// Diseñado para ejecutarse tanto en Cloudflare Pages Functions (D1) como en el
// backend Node local (better-sqlite3). No usa APIs específicas de una plataforma
// salvo `fetch`, `TextDecoder` y `crypto` estándar.

export const CURSO_ACTUAL = '2026-2027'

export const COMUNIDADES = [
  'Andalucía', 'Aragón', 'Asturias', 'Islas Baleares', 'Canarias',
  'Cantabria', 'Castilla-La Mancha', 'Castilla y León', 'Cataluña',
  'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra',
  'País Vasco', 'Comunidad Valenciana', 'Ceuta y Melilla',
]

export const TIPOS = ['convocatoria', 'plazas', 'calendario', 'requisitos', 'temario', 'pruebas', 'noticia']

// Agrupaciones para que cada ejecución quepa en el límite de Cloudflare.
// El grupo 7 recoge la consulta nacional y el BOE.
export const GRUPOS_NOTICIAS = [
  ['Andalucía', 'Aragón', 'Asturias'],
  ['Islas Baleares', 'Canarias', 'Cantabria'],
  ['Castilla-La Mancha', 'Castilla y León', 'Cataluña'],
  ['Extremadura', 'Galicia', 'La Rioja'],
  ['Madrid', 'Murcia', 'Navarra'],
  ['País Vasco', 'Comunidad Valenciana', 'Ceuta y Melilla'],
  ['Nacional'],
]

const ALIAS_COMUNIDAD = {
  'Andalucía': ['andalucia'],
  'Aragón': ['aragon'],
  'Asturias': ['asturias', 'principado de asturias'],
  'Islas Baleares': ['islas baleares', 'illes balears', 'baleares'],
  'Canarias': ['canarias'],
  'Cantabria': ['cantabria'],
  'Castilla-La Mancha': ['castilla-la mancha', 'castilla la mancha'],
  'Castilla y León': ['castilla y leon'],
  'Cataluña': ['cataluna', 'catalunya'],
  'Extremadura': ['extremadura'],
  'Galicia': ['galicia'],
  'La Rioja': ['la rioja'],
  'Madrid': ['comunidad de madrid', 'madrid'],
  'Murcia': ['region de murcia', 'murcia'],
  'Navarra': ['navarra', 'comunidad foral de navarra'],
  'País Vasco': ['pais vasco', 'euskadi', 'euskal'],
  'Comunidad Valenciana': ['comunidad valenciana', 'valencia', 'valenciana'],
  'Ceuta y Melilla': ['ceuta', 'melilla'],
}

// Alias usados en la consulta a Google News (evita resultados ambiguos).
const ALIAS_BUSQUEDA = {
  'Islas Baleares': 'Baleares',
  'Castilla-La Mancha': '"Castilla-La Mancha"',
  'Castilla y León': '"Castilla y León"',
  'La Rioja': '"La Rioja"',
  'Comunidad Valenciana': 'Valencia',
  'Ceuta y Melilla': 'Ceuta Melilla',
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const ENTIDADES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  agrave: 'à', egrave: 'è', igrave: 'ì', ograve: 'ò', ugrave: 'ù',
  acirc: 'â', ecirc: 'ê', icirc: 'î', ocirc: 'ô', ucirc: 'û',
  ntilde: 'ñ', Ntilde: 'Ñ', ccedil: 'ç', Ccedil: 'Ç',
  uuml: 'ü', Uuml: 'Ü', iquest: '¿', iexcl: '¡', ordf: 'ª', ordm: 'º',
  laquo: '«', raquo: '»', mdash: '—', ndash: '–', hellip: '…',
  euro: '€', deg: '°', middot: '·', times: '×',
}

export function normalizar(texto = '') {
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodificarEntidades(texto = '') {
  return String(texto).replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, (m, code) => {
    if (code[0] === '#') {
      const hex = code[1] === 'x' || code[1] === 'X'
      const num = parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10)
      if (Number.isFinite(num)) {
        try { return String.fromCodePoint(num) } catch { return m }
      }
      return m
    }
    return ENTIDADES[code] ?? ENTIDADES[code.toLowerCase()] ?? m
  })
}

export function limpiarHtml(entrada = '') {
  return decodificarEntidades(
    String(entrada)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim()
}

function contenidoTag(bloque, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = bloque.match(re)
  if (!m) return ''
  return m[1]
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .trim()
}

/** Parser RSS sencillo y tolerante (Google News y BOE). */
export function parsearRss(xml = '') {
  const items = []
  const re = /<item>([\s\S]*?)<\/item>/gi
  let m
  while ((m = re.exec(xml)) !== null) {
    const bloque = m[1]
    const sourceMatch = bloque.match(/<source[^>]*>([\s\S]*?)<\/source>/i)
    items.push({
      title: limpiarHtml(contenidoTag(bloque, 'title')),
      link: decodificarEntidades(contenidoTag(bloque, 'link') || contenidoTag(bloque, 'guid')),
      pubDate: contenidoTag(bloque, 'pubDate'),
      description: contenidoTag(bloque, 'description'),
      source: sourceMatch ? limpiarHtml(sourceMatch[1]) : '',
      category: limpiarHtml(contenidoTag(bloque, 'category')),
    })
  }
  return items
}

/** Google News decodifica según el charset declarado (el BOE usa ISO-8859-1). */
async function leerTexto(res) {
  const buffer = await res.arrayBuffer()
  const cabecera = new TextDecoder('utf-8').decode(buffer.slice(0, 300))
  const charset = cabecera.match(/encoding=["']([^"']+)["']/i)?.[1] || ''
  const encoding = /iso-8859-1|windows-1252|latin1/i.test(charset) ? 'iso-8859-1' : 'utf-8'
  try { return new TextDecoder(encoding).decode(buffer) } catch { return new TextDecoder('utf-8').decode(buffer) }
}

function parsearFecha(valor) {
  if (!valor) return null
  const d = new Date(valor)
  if (Number.isNaN(d.getTime())) return null
  // Guardamos en UTC y con formato SQLite para poder ordenar y filtrar con date().
  return d.toISOString().replace('T', ' ').slice(0, 19)
}

function numeroPlazas(titulo) {
  const conPlazas = titulo.match(/([\d.]{2,7})\s*(?:nuevas\s+)?(?:plazas|vacantes)/i)
  const candidatos = conPlazas ? [conPlazas[1]] : (titulo.match(/\b\d{1,2}\.\d{3}\b|\b\d{3,5}\b/g) || [])
  const numeros = candidatos
    .map((n) => Number(String(n).replace(/\./g, '')))
    .filter((n) => Number.isFinite(n) && n >= 100 && !(n >= 2024 && n <= 2030))
  return numeros.length ? Math.max(...numeros) : null
}

function huellaDe(item) {
  const numero = numeroPlazas(item.titulo)
  if (numero) {
    const comunidad = normalizar(item.comunidad).replace(/\s/g, '')
    const familia = item.tipo === 'convocatoria' || item.tipo === 'plazas' ? 'plazas' : item.tipo
    return `p-${comunidad}-${numero}-${familia}`
  }

  const s = normalizar(item.titulo)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `t-${(h >>> 0).toString(36)}-${s.length.toString(36)}`
}

function detectarComunidad(texto) {
  const t = ` ${normalizar(texto)} `
  let mejor = null
  let mejorLargo = 0
  for (const [nombre, alias] of Object.entries(ALIAS_COMUNIDAD)) {
    for (const a of alias) {
      if (t.includes(` ${a} `) && a.length > mejorLargo) {
        mejor = nombre
        mejorLargo = a.length
      }
    }
  }
  return mejor
}

function detectarTipo(texto) {
  const t = normalizar(texto)
  if (/convocatoria|bases|oferta de empleo|publicacion|publicado|resolucion/.test(t)) return 'convocatoria'
  if (/plazas|vacantes|oferta/.test(t)) return 'plazas'
  if (/calendario|fechas|examen|pruebas|convocado/.test(t)) return 'calendario'
  if (/requisitos|baremo|titulacion|habilitacion|meritos/.test(t)) return 'requisitos'
  if (/temario|programa|contenidos/.test(t)) return 'temario'
  if (/prueba practica|supuesto|defensa|programacion/.test(t)) return 'pruebas'
  return 'noticia'
}

function evaluarRelevancia(texto) {
  const t = normalizar(texto)
  let score = 10
  const suma = (re, n) => { if (re.test(t)) score += n }
  suma(/oposici/, 30)
  suma(/convocatoria|bases/, 28)
  suma(/plazas|vacantes|oferta de empleo/, 20)
  suma(/secundaria|ensenanza media|\beso\b|bachillerato/, 24)
  suma(/profesor|profesorado|docente/, 14)
  suma(/educacion|ensenanza/, 8)
  suma(/2026|2027/, 12)
  suma(/requisitos|temario|examen|prueba|calendario|baremo|meritos|interinos|bolsa/, 10)
  suma(/andalucia|aragon|asturias|baleares|canarias|cantabria|castilla|cataluna|extremadura|galicia|rioja|madrid|murcia|navarra|pais vasco|valencia|ceuta|melilla/, 6)

  const negativos = [
    [/universidad|selectividad|evau|grado universitario|master universitario|beca erasmus/, -30],
    [/policia|guardia civil|sanidad|justicia|bombero|ejercito/, -30],
    [/ayuntamiento|administracion local|libre designacion|concurso de meritos/, -35],
    [/futbol|deportes|sucesos|elecciones|economia/, -20],
  ]
  for (const [re, n] of negativos) if (re.test(t)) score += n

  // Si habla solo de maestros/primaria y no menciona secundaria, no es el foco.
  if (/maestro|primaria|infantil/.test(t) && !/secundaria|profesor|\beso\b|bachillerato|fp|formacion profesional/.test(t)) {
    score -= 22
  }
  return Math.max(0, Math.min(100, score))
}

function esTemaSecundaria(texto) {
  const t = normalizar(texto)
  const foco = /\bsecundaria\b|\bprofesor(es|ado)?\b|\bdocente|\beso\b|\bbachillerato\b|formacion profesional|\bfp\b|ensenanza media/.test(t)
  const oposicion = /oposici|convocatoria|plazas|docente|educacion|ensenanza/.test(t)
  return foco && oposicion
}

function resumenDesdeDescripcion(descripcion, titulo) {
  const limpio = limpiarHtml(descripcion)
  if (!limpio) return ''
  const tn = normalizar(titulo).slice(0, 45)
  if (tn && normalizar(limpio).includes(tn)) return ''
  return limpio.slice(0, 400)
}

function etiquetasDe(texto) {
  const t = normalizar(texto)
  const etiquetas = []
  if (/secundaria|eso|bachillerato/.test(t)) etiquetas.push('Secundaria')
  if (/formacion profesional|\bfp\b/.test(t)) etiquetas.push('FP')
  if (/interinos|bolsa/.test(t)) etiquetas.push('Interinos')
  if (/temario/.test(t)) etiquetas.push('Temario')
  if (/requisitos|baremo/.test(t)) etiquetas.push('Requisitos')
  if (/plazas|vacantes/.test(t)) etiquetas.push('Plazas')
  if (/calendario|fechas|examen/.test(t)) etiquetas.push('Calendario')
  return [...new Set(etiquetas)]
}

function prepararItem(raw, fuente, curso) {
  const tituloOriginal = limpiarHtml(raw.title || '').trim()
  let titulo = tituloOriginal
  const nombreFuente = limpiarHtml(raw.source || '')
  // Google News añade " - Medio" al titular. Lo quitamos solo si coincide con <source>.
  const separador = titulo.lastIndexOf(' - ')
  if (separador > 0 && nombreFuente && normalizar(titulo.slice(separador + 3)) === normalizar(nombreFuente)) {
    titulo = titulo.slice(0, separador).trim()
  }
  titulo = titulo.replace(/^\d{8}\s+/, '').trim()
  titulo = titulo.replace(/^[A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s]{2,25}\.\s*-\s*/, '').trim()
  if (!titulo) return null

  const texto = `${tituloOriginal} ${limpiarHtml(raw.description || '')} ${raw.category || ''}`
  const relevancia = evaluarRelevancia(texto)
  const comunidad = detectarComunidad(tituloOriginal) || detectarComunidad(raw.source) || fuente.comunidad || detectarComunidad(texto) || 'Nacional'
  const tipo = detectarTipo(texto)
  const fecha = parsearFecha(raw.pubDate)

  const item = {
    curso,
    comunidad,
    titulo,
    resumen: resumenDesdeDescripcion(raw.description, titulo),
    fuente: raw.source || fuente.nombre,
    url: (raw.link || '').trim(),
    huella: '',
    fecha_publicacion: fecha,
    tipo,
    relevancia,
    etiquetas: etiquetasDe(texto),
    origen: fuente.tipo,
  }
  item.huella = huellaDe(item)
  return item
}

export function construirFuentes(env = {}, comunidades = null) {
  const incluir = Array.isArray(comunidades) && comunidades.length ? new Set(comunidades) : null
  const fuentes = COMUNIDADES.filter((c) => !incluir || incluir.has(c)).map((comunidad) => {
    const alias = ALIAS_BUSQUEDA[comunidad] || comunidad
    const q = `oposiciones secundaria ${alias} 2026 OR 2027`
    const params = encodeURIComponent(q)
    // Bing no entiende bien el operador OR: usamos una consulta más simple.
    const qBing = `oposiciones secundaria ${alias}`
    const paramsBing = encodeURIComponent(qBing)
    return {
      id: `google:${comunidad}`,
      nombre: `Google News · ${comunidad}`,
      comunidad,
      tipo: 'google_news',
      url: `https://news.google.com/rss/search?q=${params}&hl=es&gl=ES&ceid=ES:es`,
      // Google News bloquea muchas IPs de Cloudflare (HTTP 503).
      // Bing se usa cuando Google falla o no devuelve resultados.
      fallbackUrl: `https://www.bing.com/news/search?q=${paramsBing}&format=RSS&setlang=es&cc=ES`,
    }
  })

  const incluirNacional = !incluir || incluir.has('Nacional')

  if (incluirNacional) {
    const qNacional = 'oposiciones docentes secundaria España 2026 OR 2027'
    const paramsNacional = encodeURIComponent(qNacional)
    const qNacionalBing = 'oposiciones docentes secundaria España'
    const paramsNacionalBing = encodeURIComponent(qNacionalBing)
    fuentes.push({
      id: 'google:nacional',
      nombre: 'Google News · España',
      comunidad: 'Nacional',
      tipo: 'google_news',
      url: `https://news.google.com/rss/search?q=${paramsNacional}&hl=es&gl=ES&ceid=ES:es`,
      fallbackUrl: `https://www.bing.com/news/search?q=${paramsNacionalBing}&format=RSS&setlang=es&cc=ES`,
    })

    // Boletín Oficial del Estado: fuente oficial para convocatorias estatales.
    fuentes.push({
      id: 'boe',
      nombre: 'BOE',
      comunidad: 'Nacional',
      tipo: 'boe',
      url: 'https://www.boe.es/rss/boe.php',
    })

    const extra = String(env.NEWS_RSS_EXTRA || '')
      .split(',')
      .map((u) => u.trim())
      .filter((u) => /^https?:\/\//i.test(u))

    extra.forEach((url, i) => {
      fuentes.push({
        id: `extra:${i + 1}`,
        nombre: `Fuente extra ${i + 1}`,
        comunidad: (env.NEWS_EXTRA_COMUNIDAD || 'Nacional').trim() || 'Nacional',
        tipo: 'rss',
        url,
      })
    })
  }

  return fuentes
}

async function ejecutarEnLotes(items, tamano, fn) {
  const resultados = []
  for (let i = 0; i < items.length; i += tamano) {
    const lote = items.slice(i, i + tamano)
    resultados.push(...await Promise.all(lote.map(fn)))
  }
  return resultados
}

function parsearJsonLista(texto) {
  if (!texto) return null
  const limpio = String(texto).trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const inicio = limpio.indexOf('[')
  const fin = limpio.lastIndexOf(']')
  if (inicio === -1 || fin <= inicio) return null
  try {
    const valor = JSON.parse(limpio.slice(inicio, fin + 1))
    return Array.isArray(valor) ? valor : null
  } catch {
    return null
  }
}

const SYSTEM_IA = `Eres el editor de un radar diario de noticias sobre las oposiciones de educación secundaria en España para el curso 2026-2027.
Recibes una lista numerada de titulares recientes y debes devolver EXCLUSIVAMENTE un array JSON válido, sin texto adicional ni bloques de código.
Para cada titular relevante devuelve: {"i": <índice>, "tipo": "convocatoria|plazas|calendario|requisitos|temario|pruebas|noticia", "comunidad": "<comunidad o Nacional>", "relevancia": <0-100>, "resumen": "<1-2 frases objetivas>"}.
Reglas estrictas:
- Incluye solo noticias sobre convocatorias, plazas, calendario, requisitos, temario o pruebas de oposiciones de profesores de secundaria, FP o enseñanzas medias en España para 2026 o 2027.
- Descarta noticias de maestros, primaria o infantil salvo que mencionen también secundaria.
- Descarta cualquier asunto que no sea oposiciones docentes (policía, sanidad, universidad, etc.).
- La comunidad debe ser una de: ${COMUNIDADES.join(', ')}, o "Nacional".
- No inventes fechas, cifras ni datos: el resumen debe basarse solo en el titular y la fuente.
- Si dudas, incluye la noticia con relevancia baja (30-50).`

function construirPromptIA(lote) {
  const lineas = lote.map((n, i) => {
    const fecha = n.fecha_publicacion ? n.fecha_publicacion.slice(0, 10) : 'sin fecha'
    return `${i}. [${n.comunidad} | ${n.fuente} | ${fecha}] ${n.titulo}`
  })
  return `Titulares:\n${lineas.join('\n')}\n\nDevuelve ahora el array JSON.`
}

function aplicarIA(lote, respuesta) {
  const parsed = parsearJsonLista(respuesta)
  if (!parsed) return null

  const aceptados = []
  for (const r of parsed) {
    const i = Number(r?.i)
    if (!Number.isInteger(i) || i < 0 || i >= lote.length) continue
    const relevancia = Number(r.relevancia)
    if (!Number.isFinite(relevancia) || relevancia < 30) continue

    const item = { ...lote[i] }
    const tipoIA = typeof r.tipo === 'string' ? r.tipo.trim().toLowerCase() : ''
    if (TIPOS.includes(tipoIA)) item.tipo = tipoIA
    const comunidadIA = typeof r.comunidad === 'string' ? r.comunidad.trim() : ''
    if (comunidadIA === 'Nacional' || COMUNIDADES.includes(comunidadIA)) item.comunidad = comunidadIA
    item.relevancia = Math.max(0, Math.min(100, Math.round(relevancia)))
    if (typeof r.resumen === 'string' && r.resumen.trim()) item.resumen = r.resumen.trim().slice(0, 350)
    aceptados.push(item)
  }
  return aceptados
}

const CAMPOS_INSERT = `(curso, comunidad, titulo, resumen, fuente, url, huella, fecha_publicacion, tipo, relevancia, etiquetas, origen)`

export async function ejecutarAgente({ db, env = {}, generar, fetchImpl = fetch, ahora = new Date(), log = console, comunidades = null } = {}) {
  const curso = String(env.NEWS_CURSO || CURSO_ACTUAL).trim() || CURSO_ACTUAL
  const diasMax = Math.max(1, Number(env.NEWS_DIAS_MAX) || 365)
  const umbral = Math.max(0, Number(env.NEWS_UMBRAL) || 35)
  const inicio = Date.now()

  const run = await db.run(
    'INSERT INTO noticias_actualizaciones (estado, curso) VALUES (?, ?)',
    ['en_curso', curso]
  )
  const runId = run.lastRowId

  const stats = {
    curso,
    fuentes_consultadas: 0,
    encontradas: 0,
    descartadas: 0,
    nuevas: 0,
    duplicadas: 0,
    ia: false,
    errores: [],
  }

  try {
    const fuentes = construirFuentes(env, comunidades)
    const limiteFecha = ahora.getTime() - diasMax * 86400000

    const descargar = async (url, timeout = 8000) => {
      const res = await fetchImpl(url, {
        headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' },
        signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(timeout) : undefined,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return leerTexto(res)
    }

    const resultados = await ejecutarEnLotes(fuentes, 10, async (fuente) => {
      try {
        let items = []
        const timeout = fuente.tipo === 'boe' ? 15000 : 8000
        try {
          items = parsearRss(await descargar(fuente.url, timeout))
        } catch (e) {
          // Google News puede bloquear las IPs de Cloudflare (HTTP 503).
          // Si hay respaldo (Bing), no abortamos: lo intentamos abajo.
          if (!fuente.fallbackUrl) throw e
        }
        if (!items.length && fuente.fallbackUrl) {
          items = parsearRss(await descargar(fuente.fallbackUrl, timeout))
        }

        if (fuente.tipo === 'boe') {
          return items
            .filter((i) => /secundaria|profesorado|docente|educaci[oó]n|ense[ñn]anza/i.test(`${i.title} ${i.description} ${i.category}`))
            .filter((i) => !/administraci[oó]n local|ayuntamiento/i.test(`${i.title} ${i.category}`))
            .map((i) => prepararItem(i, fuente, curso))
            .filter(Boolean)
        }

        return items.map((i) => prepararItem(i, fuente, curso)).filter(Boolean)
      } catch (e) {
        if (stats.errores.length < 12) stats.errores.push(`${fuente.nombre}: ${e.message}`)
        return []
      } finally {
        stats.fuentes_consultadas++
      }
    })

    const todos = resultados.flat()
    stats.encontradas = todos.length

    // Filtro de foco, relevancia y antigüedad.
    const filtrados = todos.filter((n) => {
      if (!n || !n.url || n.titulo.length < 12) return false
      if (n.relevancia < umbral) return false
      if (!esTemaSecundaria(n.titulo)) return false
      if (n.fecha_publicacion && new Date(`${n.fecha_publicacion.replace(' ', 'T')}Z`).getTime() < limiteFecha) return false
      return true
    })

    // Deduplicación dentro de la propia ejecución.
    const unicos = new Map()
    for (const n of filtrados) {
      const previo = unicos.get(n.huella)
      if (!previo || n.relevancia > previo.relevancia) unicos.set(n.huella, n)
    }

    let candidatos = [...unicos.values()].sort((a, b) => {
      if (b.relevancia !== a.relevancia) return b.relevancia - a.relevancia
      return String(b.fecha_publicacion || '').localeCompare(String(a.fecha_publicacion || ''))
    })

    // La IA solo revisa el lote más relevante para mantener el coste y la latencia bajos.
    const maxIA = Math.max(0, Number(env.NEWS_MAX_IA) || 45)
    const maxSinIA = Math.max(0, Number(env.NEWS_MAX_SIN_IA) || 80)
    const loteIA = candidatos.slice(0, maxIA)
    if (candidatos.length > loteIA.length) stats.descartadas += candidatos.length - loteIA.length

    if (generar && loteIA.length) {
      try {
        const respuesta = await generar(construirPromptIA(loteIA), SYSTEM_IA)
        const aceptados = aplicarIA(loteIA, respuesta)
        if (aceptados) {
          candidatos = aceptados
          stats.descartadas += Math.max(0, loteIA.length - aceptados.length)
          stats.ia = true
        }
      } catch (e) {
        if (stats.errores.length < 12) stats.errores.push(`IA: ${e.message}`)
      }
    } else {
      candidatos = candidatos.slice(0, maxSinIA)
    }

    stats.descartadas += Math.max(0, filtrados.length - unicos.size)
    if (!stats.ia) stats.descartadas += Math.max(0, unicos.size - candidatos.length)

    for (const n of candidatos) {
      const res = await db.run(
        `INSERT OR IGNORE INTO noticias ${CAMPOS_INSERT} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          n.curso, n.comunidad, n.titulo, n.resumen || '', n.fuente || '', n.url,
          n.huella, n.fecha_publicacion || null, n.tipo, n.relevancia,
          JSON.stringify(n.etiquetas || []), n.origen || 'rss',
        ]
      )
      if (res.changes) stats.nuevas++
      else stats.duplicadas++
    }

    const duracion = Date.now() - inicio
    await db.run(
      `UPDATE noticias_actualizaciones
       SET finalizada_en = CURRENT_TIMESTAMP, estado = ?, fuentes_consultadas = ?,
           encontradas = ?, nuevas = ?, detalle = ?, error = NULL
       WHERE id = ?`,
      [
        'ok', stats.fuentes_consultadas, stats.encontradas, stats.nuevas,
        JSON.stringify({ ...stats, duracion_ms: duracion }), runId,
      ]
    )

    return { id: runId, ok: true, duracion_ms: duracion, ...stats }
  } catch (e) {
    log?.error?.('Agente de noticias:', e)
    try {
      await db.run(
        `UPDATE noticias_actualizaciones
         SET finalizada_en = CURRENT_TIMESTAMP, estado = 'error', fuentes_consultadas = ?,
             encontradas = ?, nuevas = ?, detalle = ?, error = ?
         WHERE id = ?`,
        [stats.fuentes_consultadas, stats.encontradas, stats.nuevas, JSON.stringify(stats), String(e.message || e).slice(0, 500), runId]
      )
    } catch { /* la tabla puede no existir todavía */ }
    throw e
  }
}

/** Consulta paginada reutilizada por Cloudflare Functions y el backend Node. */
export async function consultarNoticias(db, filtros = {}) {
  const comunidad = (filtros.comunidad || '').trim()
  const tipo = (filtros.tipo || '').trim()
  const q = (filtros.q || '').trim()
  const dias = Number(filtros.dias) || 0
  const limit = Math.max(1, Math.min(100, Number(filtros.limit) || 24))
  const offset = Math.max(0, Number(filtros.offset) || 0)

  const where = []
  const params = []

  if (comunidad && comunidad !== 'Todas') {
    where.push('comunidad = ?')
    params.push(comunidad)
  }
  if (tipo && tipo !== 'Todo') {
    where.push('tipo = ?')
    params.push(tipo)
  }
  if (q) {
    where.push('(titulo LIKE ? OR resumen LIKE ? OR fuente LIKE ?)')
    const like = `%${q}%`
    params.push(like, like, like)
  }
  if (dias > 0) {
    where.push("(fecha_publicacion IS NULL OR date(fecha_publicacion) >= date('now', ?))")
    params.push(`-${dias} days`)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const totalRow = await db.first(`SELECT COUNT(*) AS total FROM noticias ${whereSql}`, params)
  const noticias = await db.all(
    `SELECT id, curso, comunidad, titulo, resumen, fuente, url, fecha_publicacion,
            tipo, relevancia, etiquetas, origen, created_at
     FROM noticias ${whereSql}
     ORDER BY (fecha_publicacion IS NULL) ASC,
              COALESCE(fecha_publicacion, created_at) DESC,
              relevancia DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  const porComunidad = await db.all(
    'SELECT comunidad, COUNT(*) AS total FROM noticias GROUP BY comunidad ORDER BY total DESC, comunidad ASC'
  )
  const ultima = await db.first(
    "SELECT * FROM noticias_actualizaciones WHERE estado = 'ok' ORDER BY id DESC LIMIT 1"
  )
  const ultimoIntento = await db.first('SELECT * FROM noticias_actualizaciones ORDER BY id DESC LIMIT 1')

  return {
    noticias,
    total: Number(totalRow?.total) || 0,
    limit,
    offset,
    por_comunidad: porComunidad,
    ultima_actualizacion: ultima || null,
    ultimo_intento: ultimoIntento || null,
  }
}

/** Adaptador Cloudflare D1. */
export function d1Adapter(DB) {
  return {
    async all(sql, params = []) {
      const { results } = await DB.prepare(sql).bind(...params).all()
      return results || []
    },
    async first(sql, params = []) {
      return (await DB.prepare(sql).bind(...params).first()) || null
    },
    async run(sql, params = []) {
      const res = await DB.prepare(sql).bind(...params).run()
      return {
        lastRowId: res.meta?.last_row_id ?? null,
        changes: res.meta?.changes ?? 0,
      }
    },
  }
}

/** Adaptador better-sqlite3 (backend Node local). */
export function sqliteAdapter(db) {
  return {
    async all(sql, params = []) { return db.prepare(sql).all(...params) },
    async first(sql, params = []) { return db.prepare(sql).get(...params) || null },
    async run(sql, params = []) {
      const res = db.prepare(sql).run(...params)
      return { lastRowId: Number(res.lastInsertRowid), changes: res.changes }
    },
  }
}

export function compararSeguro(a = '', b = '') {
  const sa = String(a)
  const sb = String(b)
  const largo = Math.max(sa.length, sb.length)
  let diff = sa.length ^ sb.length
  for (let i = 0; i < largo; i++) diff |= (sa.charCodeAt(i) || 0) ^ (sb.charCodeAt(i) || 0)
  return diff === 0
}
