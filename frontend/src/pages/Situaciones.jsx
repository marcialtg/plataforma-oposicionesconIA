import { useState } from 'react';
import { situaciones } from '../api/client';
import { GeneratedContent, ModuleHero, MissingPrefsNotice } from '../components/ModuleShell';

export default function Situaciones({ user }) {
  const hasPrefs = Boolean(user?.comunidad && user?.cuerpo && user?.asignatura);
  const [titulo, setTitulo] = useState('');
  const [curso, setCurso] = useState('');
  const [duracion, setDuracion] = useState('');
  const [productoFinal, setProductoFinal] = useState('');
  const [pautas, setPautas] = useState('');
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !curso.trim() || !duracion.trim()) return;
    setError(''); setGenerando(true); setResultado(null);
    try {
      const data = await situaciones.generar(titulo, curso, duracion, productoFinal, pautas);
      setResultado(data.contenido);
    } catch (e) { setError(e.message); }
    finally { setGenerando(false); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <ModuleHero eyebrow="Módulo 4" title="Situaciones de aprendizaje"
        description="A partir de tus pautas, la IA crea un borrador completo de Situación de Aprendizaje competencial, con DUA, secuencia didáctica y rúbrica." />

      {!hasPrefs ? <MissingPrefsNotice /> : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Situación</label>
            <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Ej. ¿Cómo construir una ciudad sostenible?" />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso / nivel</label>
              <input type="text" required value={curso} onChange={(e) => setCurso(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Ej. 3º ESO" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duración</label>
              <input type="text" required value={duracion} onChange={(e) => setDuracion(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Ej. 8 sesiones (3 semanas)" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto final (opcional)</label>
            <input type="text" value={productoFinal} onChange={(e) => setProductoFinal(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Ej. maqueta digital con presentación oral" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pautas adicionales (opcional)</label>
            <textarea value={pautas} onChange={(e) => setPautas(e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
              placeholder="Ej. integra ODS 11, trabajo cooperativo, herramientas digitales." />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <button type="submit" disabled={generando}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {generando ? 'Generando situación…' : 'Generar situación'}
          </button>
        </form>
      )}

      <GeneratedContent text={resultado} />
    </div>
  );
}
