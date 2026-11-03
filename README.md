# Oposita · Plataforma de oposiciones docentes con IA

Aplicación para preparar oposiciones de educación secundaria en España. Incluye generación de
temarios, supuestos prácticos, programaciones didácticas, situaciones de aprendizaje y un
**radar diario de noticias y convocatorias del curso 2026-2027** para las 17 comunidades
autónomas y Ceuta y Melilla.

## Radar de noticias 2026-2027

El módulo **Noticias** (`/noticias`) muestra, para cada comunidad:

- Convocatorias, plazas, calendario, requisitos, temario y pruebas.
- Fuente original, fecha, comunidad y etiquetas de cada noticia.
- Última ejecución del agente y número de noticias nuevas.
- Acceso directo al portal oficial de educación de cada comunidad.

### Cómo funciona el agente

1. Consulta un feed de Google News por comunidad (`oposiciones secundaria <CCAA> 2026 OR 2027`),
   un feed nacional y el RSS del BOE.
2. Si Google News falla o no devuelve resultados (por ejemplo, bloquea las IPs de Cloudflare con
   HTTP 503), reintenta automáticamente con **Bing News** usando una consulta simplificada.
3. Normaliza y deduplica titulares (incluye una huella por comunidad + número de plazas para
   agrupar la misma noticia publicada en varios medios).
4. Filtra por foco (secundaria/FP/enseñanzas medias), relevancia y antigüedad.
5. Opcionalmente envía los titulares más relevantes a la IA para clasificarlos y resumirlos.
   Si la IA falla o está desactivada, el agente sigue funcionando con reglas de palabras clave.
6. Guarda las noticias nuevas en D1 (o SQLite en local) y registra la ejecución.

La ejecución se divide en **7 grupos** de comunidades para que cada llamada termine dentro del
límite de tiempo de Cloudflare. El grupo 7 incluye la consulta nacional y el BOE.

La ejecución diaria se lanza desde GitHub Actions
(`.github/workflows/noticias-diarias.yml`), que recorre los 7 grupos contra el endpoint protegido
`POST /api/noticias/actualizar?grupo=1..7`. Los administradores también pueden lanzarlo desde el
botón **Ejecutar agente** de la propia página, que hace el mismo recorrido.

## Puesta en marcha en local

```bash
# 1. Dependencias
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 2. Variables de entorno
# Revisa .env.example y añade a backend/.env las variables que falten.
# No sobrescribas tu backend/.env si ya contiene claves reales.

# 3. Arrancar backend + frontend
./start.sh
```

El backend Node crea automáticamente las tablas de noticias en `backend/oposiciones.db`.
El frontend queda en <http://localhost:5173> y el API en <http://localhost:3001>.

Para probar el agente sin IA:

```bash
cd backend && NEWS_AI=0 node src/index.js
```

## Despliegue en Cloudflare Pages + D1

La aplicación principal usa Pages Functions (`functions/`) y D1.

1. Crea o localiza la base de datos D1 `oposiciones-db`.
2. Aplica la migración del radar:

   ```bash
   npx wrangler d1 execute oposiciones-db --remote --file=./migrations/0001_noticias.sql
   ```

   También puedes pegar el contenido de `migrations/0001_noticias.sql` en la consola SQL de D1
   desde el panel de Cloudflare.

3. Configura las variables de entorno del proyecto Pages:

   | Variable | Obligatoria | Descripción |
   | --- | --- | --- |
   | `JWT_SECRET` | Sí | Firma de los tokens de usuario. |
   | `CRON_SECRET` | Sí | Secreto del endpoint de actualización diaria. |
   | `NEWS_CURSO` | No | Por defecto `2026-2027`. |
   | `NEWS_DIAS_MAX` | No | Antigüedad máxima de las noticias (por defecto `365` días). |
   | `NEWS_UMBRAL` | No | Relevancia mínima para guardar (por defecto `35`). |
   | `NEWS_AI` | No | `0` desactiva la clasificación con IA. |
   | `NEWS_MAX_IA` | No | Titulares que revisa la IA por ejecución (por defecto `45`). |
   | `NEWS_MAX_SIN_IA` | No | Noticias guardadas sin IA (por defecto `80`). |
   | `NEWS_RSS_EXTRA` | No | Feeds RSS adicionales separados por comas. |

   La IA reutiliza la configuración existente (`AI_PROVIDER`, `GOOGLE_API_KEY`/`OPENROUTER_API_KEY`,
   `GOOGLE_MODEL`/`OPENROUTER_MODEL`).

4. Despliega en el proyecto de Pages `plataforma-oposicionesconia`:

   ```bash
   npm run build
   npm run deploy
   ```

   El script `deploy` ya apunta al proyecto correcto y sube `frontend/dist` junto con `functions/`.

5. En GitHub, añade los secrets `APP_URL` (por ejemplo `https://app.oposicionesconia.com`) y
   `NEWS_CRON_SECRET` (el mismo valor que `CRON_SECRET`). El workflow se ejecuta a diario a las
   05:20 UTC (06:20/07:20 en la península según horario de verano) y también puede lanzarse
   manualmente desde la pestaña **Actions**.

### Ejecución manual del agente

El agente se ejecuta por grupos para no superar el límite de Cloudflare:

```bash
for grupo in 1 2 3 4 5 6 7; do
  curl -X POST "https://app.oposicionesconia.com/api/noticias/actualizar?grupo=$grupo" \
    -H "x-cron-secret: TU_CRON_SECRET"
done
```

Respuesta de ejemplo (un grupo):

```json
{
  "ok": true,
  "grupo": 1,
  "id": 6,
  "fuentes_consultadas": 3,
  "encontradas": 33,
  "nuevas": 8,
  "duplicadas": 2,
  "ia": true,
  "duracion_ms": 21341
}
```

## API

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| `GET` | `/api/noticias` | Usuario | Lista paginada con filtros `comunidad`, `tipo`, `q`, `dias`, `limit`, `offset`. |
| `POST` | `/api/noticias/actualizar?grupo=1..7` | Cron o admin | Ejecuta un grupo de comunidades y devuelve estadísticas. Sin `grupo` ejecuta todo en segundo plano. |

## Estructura relevante

```
functions/_shared/noticias.js          Core del agente (portable D1 / SQLite)
functions/api/noticias/index.js        Listado para la plataforma
functions/api/noticias/actualizar.js   Ejecución protegida del agente
backend/src/routes/noticias.js         Equivalente para desarrollo local con Express
frontend/src/pages/Noticias.jsx        Interfaz del radar
migrations/0001_noticias.sql           Tablas D1
.github/workflows/noticias-diarias.yml Cron diario
```

## Aviso

Las noticias se recopilan y resumen automáticamente. Son una ayuda de seguimiento, no una fuente
normativa. Confirma siempre plazos, requisitos y bases oficiales en el boletín o portal de la
consejería de educación correspondiente.
