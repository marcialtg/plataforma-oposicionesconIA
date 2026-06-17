import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function GeneratedContent({ text }) {
  if (!text) return null;
  const copy = () => { navigator.clipboard.writeText(text); alert('Copiado al portapapeles'); };
  const download = () => {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'oposita-resultado.md'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-primary-700">
          ✨ Resultado generado
        </div>
        <div className="flex gap-2">
          <button onClick={copy} className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50">📋 Copiar</button>
          <button onClick={download} className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50">⬇ Descargar</button>
        </div>
      </div>
      <article className="prose prose-sm max-w-none prose-headings:text-primary-800 prose-a:text-primary-600">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </article>
    </div>
  );
}

export function ModuleHero({ eyebrow, title, description }) {
  return (
    <div className="mb-8">
      <div className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
        {eyebrow}
      </div>
      <h1 className="mt-3 text-3xl md:text-4xl font-bold text-primary-800">{title}</h1>
      <p className="mt-2 max-w-2xl text-gray-500">{description}</p>
    </div>
  );
}

export function useGenerator(fn) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const run = async (...args) => {
    setLoading(true); setText('');
    try {
      const res = await fn(...args);
      setText(res.text || res.contenido || res.resultado || res);
    } catch (e) {
      alert(e.message || 'Error generando contenido');
    } finally { setLoading(false); }
  };
  return { loading, text, run, setText };
}

export function MissingPrefsNotice() {
  return (
    <div className="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-6 text-center">
      <p className="text-sm text-gray-700">
        Antes de generar, configura tu <strong>Comunidad Autónoma</strong>, <strong>cuerpo</strong> y{' '}
        <strong>especialidad</strong> desde tu <a href="/perfil" className="text-primary-600 underline">perfil</a>.
      </p>
    </div>
  );
}
