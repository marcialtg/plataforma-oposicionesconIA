import { Link } from 'react-router-dom';

const MODULES = [
  { to: '/temario', icon: '📖', title: 'Temario', desc: 'Indica el enunciado y obtén un tema completo, estructurado y con bibliografía, al estilo NotebookLM.' },
  { to: '/supuestos', icon: '✍️', title: 'Supuestos prácticos', desc: 'Genera supuestos al estilo de las convocatorias reales de tu CCAA, con resolución modelo.' },
  { to: '/programacion', icon: '📋', title: 'Programación didáctica', desc: 'Borrador de programación ajustado a la normativa LOMLOE y a tu Comunidad Autónoma.' },
  { to: '/situaciones', icon: '🎯', title: 'Situaciones de aprendizaje', desc: 'Crea situaciones de aprendizaje competenciales con DUA y rúbrica de evaluación.' },
];

export default function Dashboard({ user }) {
  const hasPrefs = user?.comunidad && user?.cuerpo && user?.asignatura;

  return (
    <>
      {!hasPrefs && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-amber-800 text-sm">
            ⚠️ Completa tu perfil (CCAA, cuerpo y especialidad) para usar los módulos.{' '}
            <Link to="/perfil" className="underline font-medium">Ir a mi perfil</Link>
          </p>
        </div>
      )}

      <section className="relative overflow-hidden text-white rounded-2xl mb-12" style={{ background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)' }}>
        <div className="relative px-6 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur mb-4">
            ✨ Asistente IA para oposiciones docentes
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Prepara tu oposición<br />
            <span className="text-amber-300">con la fuerza de la IA.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Temarios, supuestos prácticos, programaciones didácticas y situaciones de aprendizaje
            generados al instante y adaptados a la normativa de tu Comunidad Autónoma.
          </p>
          {hasPrefs && (
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">📍 {user.comunidad}</span>
              <span className="bg-white/20 text-white text-sm px-3 py-1 rounded-full">📚 {user.asignatura}</span>
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-gray-800">Cuatro herramientas, una sola plataforma</h2>
        <p className="mt-1 text-gray-500">Elige el módulo que necesites para avanzar hoy.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {MODULES.map((m, i) => (
            <Link key={m.to} to={hasPrefs ? m.to : '/perfil'}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-2xl">{m.icon}</div>
                <span className="text-5xl font-bold text-gray-100">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-800">{m.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{m.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
