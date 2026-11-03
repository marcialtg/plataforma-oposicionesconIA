import { useCallback, useEffect, useMemo, useState } from 'react';
import { noticias } from '../api/client';
import { COMUNIDADES, CURSO_OPOSICIONES, FUENTES_OFICIALES, TIPOS_NOTICIA, TOTAL_GRUPOS_NOTICIAS } from '../api/constants';
import { ModuleHero } from '../components/ModuleShell';

const TIPO_ESTILO = {
  convocatoria: 'bg-blue-100 text-blue-700',
  plazas: 'bg-emerald-100 text-emerald-700',
  calendario: 'bg-amber-100 text-amber-800',
  requisitos: 'bg-purple-100 text-purple-700',
  temario: 'bg-indigo-100 text-indigo-700',
  pruebas: 'bg-rose-100 text-rose-700',
  noticia: 'bg-gray-100 text-gray-600',
};

const TIPO_LABEL = {
  convocatoria: 'Convocatoria',
  plazas: 'Plazas',
  calendario: 'Calendario',
  requisitos: 'Requisitos',
  temario: 'Temario',
  pruebas: 'Pruebas',
  noticia: 'Actualidad',
};

function aFecha(valor) {
  if (!valor) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(valor)) {
    return new Date(`${valor.replace(' ', 'T')}Z`);
  }
  return new Date(valor);
}

function hace(valor) {
  const fecha = aFecha(valor);
  if (!fecha || Number.isNaN(fecha.getTime())) return '';
  const segundos = Math.max(0, Math.floor((Date.now() - fecha.getTime()) / 1000));
  if (segundos < 60) return 'ahora mismo';
  if (segundos < 3600) return `hace ${Math.floor(segundos / 60)} min`;
  if (segundos < 86400) return `hace ${Math.floor(segundos / 3600)} h`;
  if (segundos < 604800) return `hace ${Math.floor(segundos / 86400)} días`;
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fechaLarga(valor) {
  const fecha = aFecha(valor);
  if (!fecha || Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function etiquetasDe(noticia) {
  try {
    const lista = JSON.parse(noticia.etiquetas || '[]');
    return Array.isArray(lista) ? lista.slice(0, 3) : [];
  } catch {
    return [];
  }
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
      <div className="h-4 w-24 rounded bg-gray-100" />
      <div className="mt-4 h-5 w-full rounded bg-gray-100" />
      <div className="mt-2 h-5 w-4/5 rounded bg-gray-100" />
      <div className="mt-4 h-3 w-full rounded bg-gray-100" />
      <div className="mt-2 h-3 w-2/3 rounded bg-gray-100" />
    </div>
  );
}

export default function Noticias({ user }) {
  const [comunidad, setComunidad] = useState(user?.comunidad || '');
  const [tipo, setTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = useCallback(async (offset = 0, acumular = false) => {
    if (acumular) setCargandoMas(true);
    else setCargando(true);
    setError('');

    try {
      const res = await noticias.listar({
        comunidad,
        tipo,
        q,
        limit: 24,
        offset,
      });
      setData((prev) => {
        if (acumular && prev) {
          return { ...res, noticias: [...prev.noticias, ...res.noticias] };
        }
        return res;
      });
    } catch (e) {
      setError(e.message || 'No se pudieron cargar las noticias');
    } finally {
      setCargando(false);
      setCargandoMas(false);
    }
  }, [comunidad, tipo, q]);

  useEffect(() => {
    cargar(0, false);
  }, [cargar]);

  const actualizarAhora = async () => {
    setActualizando(true);
    setAviso('');
    setError('');
    try {
      let totalNuevas = 0;
      let totalEncontradas = 0;
      for (let grupo = 1; grupo <= TOTAL_GRUPOS_NOTICIAS; grupo++) {
        setAviso(`Actualizando grupo ${grupo} de ${TOTAL_GRUPOS_NOTICIAS}…`);
        const res = await noticias.actualizar({ grupo });
        totalNuevas += res.nuevas || 0;
        totalEncontradas += res.encontradas || 0;
      }
      setAviso(`Agente completado: ${totalNuevas} noticias nuevas de ${totalEncontradas} titulares revisados.`);
      await cargar(0, false);
    } catch (e) {
      setError(e.message || 'El agente no pudo completar la actualización');
    } finally {
      setActualizando(false);
    }
  };

  const conteos = useMemo(() => {
    const mapa = {};
    (data?.por_comunidad || []).forEach((c) => { mapa[c.comunidad] = c.total; });
    return mapa;
  }, [data]);

  const ultima = data?.ultima_actualizacion;
  const ultimoIntento = data?.ultimo_intento;
  const fuenteOficial = FUENTES_OFICIALES[comunidad] || null;
  const mostrarTodo = !comunidad && !tipo && !q;

  return (
    <div className="mx-auto max-w-6xl">
      <ModuleHero
        eyebrow={`Radar diario · Curso ${CURSO_OPOSICIONES}`}
        title="Noticias y convocatorias de Secundaria"
        description="Un agente revisa cada día los medios y boletines oficiales de las 17 comunidades autónomas más Ceuta y Melilla, filtra lo relevante para las oposiciones de educación secundaria y lo publica aquí."
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${ultima ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <p className="text-sm font-semibold text-gray-800">Agente de noticias</p>
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-700">
              {CURSO_OPOSICIONES}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {ultima
              ? `Última actualización correcta: ${fechaLarga(ultima.finalizada_en)} · ${ultima.nuevas} noticias nuevas`
              : 'Todavía no hay ninguna ejecución registrada.'}
          </p>
          {ultimoIntento?.estado === 'error' && (
            <p className="mt-1 text-xs text-red-600">
              Último intento fallido: {ultimoIntento.error || 'error desconocido'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => cargar(0, false)}
            disabled={cargando}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {cargando ? 'Cargando…' : '↻ Recargar'}
          </button>
          {user?.is_admin && (
            <button
              type="button"
              onClick={actualizarAhora}
              disabled={actualizando}
              className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {actualizando ? 'Agente trabajando…' : '⚡ Ejecutar agente'}
            </button>
          )}
        </div>
      </div>

      {aviso && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          ✅ {aviso}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Comunidad
            </label>
            <select
              value={comunidad}
              onChange={(e) => setComunidad(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Todas las comunidades</option>
              <option value="Nacional">Nacional / BOE</option>
              {COMUNIDADES.map((c) => (
                <option key={c} value={c}>
                  {c}{conteos[c] ? ` (${conteos[c]})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Buscar
            </label>
            <form
              onSubmit={(e) => { e.preventDefault(); setQ(busqueda.trim()); }}
              className="flex gap-2"
            >
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Temario, plazas, fecha de examen…"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Buscar
              </button>
              {(q || busqueda) && (
                <button
                  type="button"
                  onClick={() => { setBusqueda(''); setQ(''); }}
                  className="rounded-lg px-2 py-2 text-sm text-gray-400 hover:text-gray-600"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </form>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {TIPOS_NOTICIA.map((t) => {
            const activo = tipo === t.value;
            return (
              <button
                key={t.value || 'todo'}
                type="button"
                onClick={() => setTipo(t.value)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  activo ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {fuenteOficial && (
        <a
          href={fuenteOficial.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-primary-100 bg-primary-50/60 px-4 py-3 text-sm text-primary-800 transition hover:bg-primary-50"
        >
          <span>
            <strong>Fuente oficial de {comunidad}:</strong> {fuenteOficial.nombre}
          </span>
          <span className="whitespace-nowrap text-xs font-medium">Abrir portal ↗</span>
        </a>
      )}

      {cargando && !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data && data.noticias.length > 0 ? (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
            <p>
              <strong className="text-gray-700">{data.total}</strong>{' '}
              {data.total === 1 ? 'noticia' : 'noticias'}
              {comunidad ? ` en ${comunidad}` : ' en toda España'}
              {q ? ` para “${q}”` : ''}
            </p>
            <p>Ordenadas por fecha y relevancia</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {data.noticias.map((n) => (
              <article key={n.id} className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${TIPO_ESTILO[n.tipo] || TIPO_ESTILO.noticia}`}>
                    {TIPO_LABEL[n.tipo] || 'Actualidad'}
                  </span>
                  <span className="text-[11px] text-gray-400" title={fechaLarga(n.fecha_publicacion || n.created_at)}>
                    {hace(n.fecha_publicacion || n.created_at)}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-semibold leading-snug text-gray-800">
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary-700">
                    {n.titulo}
                  </a>
                </h3>

                {n.resumen && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">{n.resumen}</p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-[11px] text-gray-500">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">{n.comunidad}</span>
                  <span className="text-gray-300">·</span>
                  <span className="truncate">{n.fuente || 'Fuente'}</span>
                  {etiquetasDe(n).map((etiqueta) => (
                    <span key={etiqueta} className="rounded-full bg-primary-50 px-2 py-0.5 text-primary-700">
                      {etiqueta}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {data.noticias.length < data.total && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => cargar(data.noticias.length, true)}
                disabled={cargandoMas}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {cargandoMas ? 'Cargando…' : `Cargar más (${data.total - data.noticias.length} restantes)`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center">
          <div className="text-4xl">🛰️</div>
          <h3 className="mt-3 text-lg font-semibold text-gray-800">
            {mostrarTodo ? 'El radar está despegando' : 'Sin noticias para este filtro'}
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            {mostrarTodo
              ? 'Todavía no hay noticias guardadas. El agente se ejecuta a diario; si eres administrador puedes lanzarlo ahora mismo.'
              : 'Prueba con otra comunidad, otro tipo de noticia o limpia la búsqueda. También puedes ejecutar el agente si eres administrador.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {!mostrarTodo && (
              <button
                type="button"
                onClick={() => { setComunidad(''); setTipo(''); setBusqueda(''); setQ(''); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Ver todas las noticias
              </button>
            )}
            {user?.is_admin && (
              <button
                type="button"
                onClick={actualizarAhora}
                disabled={actualizando}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {actualizando ? 'Agente trabajando…' : '⚡ Ejecutar el agente ahora'}
              </button>
            )}
          </div>
        </div>
      )}

      <details className="mt-10 rounded-xl border border-gray-200 bg-white shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-gray-800">
          🏛️ Canales oficiales por comunidad autónoma
          <span className="ml-2 text-xs font-normal text-gray-400">(consulta siempre la fuente original)</span>
        </summary>
        <div className="grid gap-2 border-t border-gray-100 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...COMUNIDADES, 'Nacional'].map((c) => {
            const fuente = FUENTES_OFICIALES[c];
            if (!fuente) return null;
            return (
              <a
                key={c}
                href={fuente.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-100 px-3 py-2 text-xs transition hover:border-primary-200 hover:bg-primary-50/40"
              >
                <span className="block font-semibold text-gray-700">{c}</span>
                <span className="block truncate text-gray-500">{fuente.nombre}</span>
              </a>
            );
          })}
        </div>
      </details>

      <p className="mt-6 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
        ⚠️ Este radar es una ayuda de seguimiento: las noticias se recopilan y resumen automáticamente.
        Antes de tomar decisiones sobre plazos, requisitos o solicitudes, confirma siempre la información
        en el boletín oficial de tu comunidad y en el portal de la consejería de educación.
      </p>
    </div>
  );
}
