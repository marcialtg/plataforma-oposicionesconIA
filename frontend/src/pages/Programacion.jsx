import { useState } from 'react';
import { programacion } from '../api/client';
import { GeneratedContent, ModuleHero, MissingPrefsNotice } from '../components/ModuleShell';

export default function Programacion({ user }) {
  const hasPrefs = Boolean(user?.comunidad && user?.cuerpo && user?.asignatura);
  const [curso, setCurso] = useState('');
  const [numUnidades, setNumUnidades] = useState(12);
  const [enfoque, setEnfoque] = useState('');
  const [contextoCentro, setContextoCentro] = useState('');
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!curso.trim()) return;
    setError(''); setGenerando(true); setResultado(null);
    try {
      const data = await programacion.generar(curso, numUnidades, enfoque, contextoCentro);
      setResultado(data.contenido);
    } catch (e) { setError(e.message); }
    finally { setGenerando(false); }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <ModuleHero eyebrow="Módulo 3" title="Programación didáctica"
        description="Genera un borrador de programación didáctica ajustado a la normativa LOMLOE y a los decretos vigentes de tu Comunidad Autónoma." />

      {!hasPrefs ? <MissingPrefsNotice /> : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Curso / nivel</label>
              <input type="text" required value={curso} onChange={(e) => setCurso(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Ej. 2º ESO, 4º Primaria, 1º Bachillerato…" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº de Unidades Didácticas</label>
              <input type="number" min={1} max={20} value={numUnidades} onChange={(e) => setNumUnidades(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enfoque metodológico (opcional)</label>
            <input type="text" value={enfoque} onChange={(e) => setEnfoque(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Ej. ABP, aprendizaje cooperativo, gamificación…" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contexto del centro (opcional)</label>
            <textarea value={contextoCentro} onChange={(e) => setContextoCentro(e.target.value)} rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-y"
              placeholder="Ej. IES de 600 alumnos, entorno urbano, plurilingüe…" />
          </div>
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <button type="submit" disabled={generando || !curso.trim()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">
            {generando ? 'Generando programación…' : 'Generar borrador'}
          </button>
          {generando && <p className="text-xs text-gray-400">Una programación completa puede tardar hasta 1 minuto.</p>}
        </form>
      )}

      <GeneratedContent text={resultado} />
    </div>
  );
}
