import { useState, useEffect } from 'react';
import { temario } from '../api/client';
import { GeneratedContent, ModuleHero, MissingPrefsNotice } from '../components/ModuleShell';

export default function Temario({ user }) {
  const hasPrefs = Boolean(user?.comunidad && user?.cuerpo && user?.asignatura);
  const [consulta, setConsulta] = useState('');
  const [enunciado, setEnunciado] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [lookup, setLookup] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleLookup = async () => {
    if (!consulta.trim()) { setError('Escribe el número o título del tema'); return; }
    setError(''); setLookupLoading(true); setLookup(null);
    try {
      const res = await temario.lookup(consulta);
      setLookup(res);
      if (res.encontrado && res.enunciado_oficial) setEnunciado(res.enunciado_oficial);
    } catch (e) { setError(e.message); }
    finally { setLookupLoading(false); }
  };

  const handleGenerar = async (e) => {
    e.preventDefault();
    if (!enunciado.trim()) return;
    setError(''); setGenerando(true); setResultado(null);
    try {
      const data = await temario.generar(enunciado, instrucciones);
      setResultado(data.contenido);
    } catch (e) { setError(e.message); }
    finally { setGenerando(false); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <ModuleHero eyebrow="Módulo 1" title="Generador de temas"
        description="Primero verificamos el enunciado oficial según el temario publicado en el BOE para tu especialidad; después la IA redacta el tema completo." />

      {!hasPrefs ? <MissingPrefsNotice /> : (
        <div className="space-y-6">
          <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-primary-800">Paso 1 · Localizar el enunciado oficial</h2>
            <p className="text-sm text-gray-500">
              Escribe el número del tema (p. ej. <em>Tema 42</em>) o un título aproximado.
              Comprobaremos el enunciado oficial del temario de <strong>{user?.asignatura}</strong>.
            </p>
            <div className="flex flex-col gap-2 md:flex-row">
              <input value={consulta} onChange={(e) => setConsulta(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Ej. Tema 42 / La literatura del Renacimiento…" />
              <button onClick={handleLookup} disabled={lookupLoading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50">
                {lookupLoading ? 'Buscando…' : '🔍 Verificar tema'}
              </button>
            </div>
            {lookup && (
              <div className={`rounded-lg border p-4 text-sm ${lookup.encontrado ? 'border-primary-200 bg-primary-50' : 'border-red-200 bg-red-50'}`}>
                <p className="font-medium mb-1">{lookup.encontrado ? '✅ Tema localizado' : '⚠️ No verificado'}</p>
                {lookup.enunciado_oficial && <p className="mb-1"><strong>Enunciado oficial:</strong> {lookup.enunciado_oficial}</p>}
                {lookup.fuente && <p className="text-gray-500"><strong>Fuente:</strong> {lookup.fuente}</p>}
                {lookup.advertencia && <p className="mt-1 text-red-600"><strong>⚠ </strong>{lookup.advertencia}</p>}
              </div>
            )}
          </section>

          <form onSubmit={handleGenerar} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-primary-800">Paso 2 · Desarrollar el tema</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enunciado del tema a desarrollar</label>
              <textarea value={enunciado} onChange={(e) => setEnunciado(e.target.value)} required rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                placeholder="Se rellenará automáticamente tras verificar, pero puedes editarlo." />
              <p className="text-xs text-gray-400 mt-1">Revisa el enunciado: la IA lo desarrollará tal cual.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones (opcional)</label>
              <textarea value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
                placeholder="Ej. Enfatiza autores X e Y. Incluye ejemplos para 4º ESO." />
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
            <button type="submit" disabled={generando || !enunciado.trim()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
              {generando ? 'Generando tema…' : 'Generar tema'}
            </button>
            {generando && <p className="text-xs text-gray-400">Esto puede tardar 30-60 segundos.</p>}
          </form>
        </div>
      )}

      <GeneratedContent text={resultado} />
    </div>
  );
}
