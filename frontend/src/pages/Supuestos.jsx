import { useState } from 'react';
import { supuestos } from '../api/client';
import { GeneratedContent, ModuleHero, MissingPrefsNotice } from '../components/ModuleShell';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Supuestos({ user }) {
  const hasPrefs = Boolean(user?.comunidad && user?.cuerpo && user?.asignatura);
  const [cargandoFormato, setCargandoFormato] = useState(false);
  const [formato, setFormato] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const verFormato = async () => {
    setError(''); setCargandoFormato(true); setFormato(null);
    try {
      const res = await supuestos.formato();
      setFormato(res.texto);
    } catch (e) { setError(e.message); }
    finally { setCargandoFormato(false); }
  };

  const generar = async () => {
    setError(''); setGenerando(true); setResultado(null);
    try {
      const res = await supuestos.generar(formato || '');
      setResultado(res.resultado);
    } catch (e) { setError(e.message); }
    finally { setGenerando(false); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <ModuleHero eyebrow="Módulo 2" title="Supuestos prácticos"
        description="Descubre cómo es el supuesto práctico en tu Comunidad Autónoma y genera, con un solo clic, un modelo realista con su resolución." />

      {!hasPrefs ? <MissingPrefsNotice /> : (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary-700">Características del supuesto en tu CCAA</h2>
              <p className="mt-1 text-sm text-gray-500">{user?.asignatura} · {user?.comunidad}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={verFormato} disabled={cargandoFormato}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm disabled:opacity-50">
                {cargandoFormato ? 'Analizando…' : (formato ? 'Volver a analizar' : '📋 Ver características')}
              </button>
              <button onClick={generar} disabled={generando}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm disabled:opacity-50">
                {generando ? 'Generando…' : '✨ Generar supuesto modelo'}
              </button>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}

          {formato && (
            <article className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{formato}</ReactMarkdown>
            </article>
          )}
        </section>
      )}

      <GeneratedContent text={resultado} />
    </div>
  );
}
