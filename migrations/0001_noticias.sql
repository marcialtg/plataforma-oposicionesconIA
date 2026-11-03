-- Radar de noticias de oposiciones de educación secundaria (curso 2026-2027)
-- Aplicar con: npx wrangler d1 execute oposiciones-db --remote --file=./migrations/0001_noticias.sql

CREATE TABLE IF NOT EXISTS noticias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curso TEXT NOT NULL DEFAULT '2026-2027',
  comunidad TEXT NOT NULL DEFAULT 'Nacional',
  titulo TEXT NOT NULL,
  resumen TEXT DEFAULT '',
  fuente TEXT DEFAULT '',
  url TEXT NOT NULL,
  huella TEXT NOT NULL UNIQUE,
  fecha_publicacion DATETIME,
  tipo TEXT DEFAULT 'noticia',
  relevancia INTEGER DEFAULT 50,
  etiquetas TEXT DEFAULT '[]',
  origen TEXT DEFAULT 'rss',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_noticias_comunidad ON noticias(comunidad);
CREATE INDEX IF NOT EXISTS idx_noticias_fecha ON noticias(fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_tipo ON noticias(tipo);
CREATE INDEX IF NOT EXISTS idx_noticias_relevancia ON noticias(relevancia DESC);

CREATE TABLE IF NOT EXISTS noticias_actualizaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  iniciada_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  finalizada_en DATETIME,
  estado TEXT DEFAULT 'en_curso',
  curso TEXT DEFAULT '2026-2027',
  fuentes_consultadas INTEGER DEFAULT 0,
  encontradas INTEGER DEFAULT 0,
  nuevas INTEGER DEFAULT 0,
  detalle TEXT DEFAULT '{}',
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_actualizaciones_estado ON noticias_actualizaciones(estado, id DESC);
