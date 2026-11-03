export const COMUNIDADES = [
  'Andalucía', 'Aragón', 'Asturias', 'Islas Baleares', 'Canarias',
  'Cantabria', 'Castilla-La Mancha', 'Castilla y León', 'Cataluña',
  'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra',
  'País Vasco', 'Comunidad Valenciana', 'Ceuta y Melilla'
];

export const CUERPOS = [
  'Maestros (Primaria/Infantil)',
  'Profesores de Enseñanza Secundaria',
  'Profesores Técnicos de FP',
  'Profesores de Escuelas Oficiales de Idiomas',
  'Profesores de Música y Artes Escénicas',
  'Profesores de Artes Plásticas y Diseño'
];

export const ESPECIALIDADES = [
  'Lengua Castellana y Literatura', 'Matemáticas', 'Inglés', 'Francés',
  'Geografía e Historia', 'Biología y Geología', 'Física y Química',
  'Tecnología', 'Informática', 'Educación Física', 'Música', 'Filosofía',
  'Economía', 'Dibujo / Artes Plásticas', 'Pedagogía Terapéutica',
  'Audición y Lenguaje', 'Educación Infantil', 'Educación Primaria',
  'Orientación Educativa'
];

export const CURSO_OPOSICIONES = '2026-2027';

// Número de grupos en los que se divide la ejecución del agente
// para no superar el límite de tiempo de Cloudflare.
export const TOTAL_GRUPOS_NOTICIAS = 7;

export const TIPOS_NOTICIA = [
  { value: '', label: 'Todo' },
  { value: 'convocatoria', label: 'Convocatorias' },
  { value: 'plazas', label: 'Plazas' },
  { value: 'calendario', label: 'Calendario' },
  { value: 'requisitos', label: 'Requisitos' },
  { value: 'temario', label: 'Temario' },
  { value: 'pruebas', label: 'Pruebas' },
  { value: 'noticia', label: 'Actualidad' },
];

export const FUENTES_OFICIALES = {
  'Andalucía': { nombre: 'Procedimientos selectivos · Junta de Andalucía', url: 'https://www.juntadeandalucia.es/educacion/portales/profesorado/procedimientos-selectivos' },
  'Aragón': { nombre: 'Educaragón · Personal docente', url: 'https://educa.aragon.es/personal-docente' },
  'Asturias': { nombre: 'Educastur', url: 'https://www.educastur.es/' },
  'Islas Baleares': { nombre: 'Govern de les Illes Balears', url: 'https://www.caib.es/' },
  'Canarias': { nombre: 'Consejería de Educación · Canarias', url: 'https://www.gobiernodecanarias.org/educacion/' },
  'Cantabria': { nombre: 'Educantabria', url: 'https://www.educantabria.es/' },
  'Castilla-La Mancha': { nombre: 'Educa JCCM', url: 'https://www.educa.jccm.es/' },
  'Castilla y León': { nombre: 'Educa JCYL', url: 'https://www.educa.jcyl.es/' },
  'Cataluña': { nombre: 'Departament d’Educació · Generalitat', url: 'https://educacio.gencat.cat/' },
  'Extremadura': { nombre: 'Educarex', url: 'https://www.educarex.es/' },
  'Galicia': { nombre: 'Consellería de Educación · Xunta', url: 'https://www.edu.xunta.gal/' },
  'La Rioja': { nombre: 'Educación · Gobierno de La Rioja', url: 'https://www.larioja.org/educacion/' },
  'Madrid': { nombre: 'Comunidad de Madrid · Educación', url: 'https://www.comunidad.madrid/servicios/educacion' },
  'Murcia': { nombre: 'Murciaeduca', url: 'https://www.murciaeduca.es/' },
  'Navarra': { nombre: 'Educación · Gobierno de Navarra', url: 'https://www.educacion.navarra.es/' },
  'País Vasco': { nombre: 'Euskadi.eus · Educación', url: 'https://www.euskadi.eus/educacion/' },
  'Comunidad Valenciana': { nombre: 'Conselleria d’Educació · GVA', url: 'https://ceice.gva.es/' },
  'Ceuta y Melilla': { nombre: 'Ministerio de Educación · Ceuta y Melilla', url: 'https://www.educacionyfp.gob.es/' },
  'Nacional': { nombre: 'BOE · Boletín Oficial del Estado', url: 'https://www.boe.es/' },
};

