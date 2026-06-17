import { Link, useLocation, useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/temario', label: 'Temario' },
  { to: '/supuestos', label: 'Supuestos' },
  { to: '/programacion', label: 'Programación' },
  { to: '/situaciones', label: 'Situaciones' },
];

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-700">
            📚 Oposita<span className="text-primary-500">.</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {NAV.map((n) => {
                const active = location.pathname === n.to;
                return (
                  <Link key={n.to} to={n.to}
                    className={`rounded-md px-3 py-2 transition-colors ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.comunidad && (
                  <span className="hidden sm:inline text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{user.comunidad}</span>
                )}
                <Link to="/perfil" className="text-sm text-gray-400 hover:text-gray-600">Perfil</Link>
                {user.is_admin && <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600">Admin</Link>}
                <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-600">Salir</button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium text-primary-600 hover:underline">Entrar</Link>
            )}
          </div>
        </div>

        {user && (
          <nav className="md:hidden flex items-center justify-around border-t border-gray-200 px-2 py-1 text-xs">
            {NAV.map((n) => {
              const active = location.pathname === n.to;
              return (
                <Link key={n.to} to={n.to}
                  className={`rounded-md px-2 py-1.5 ${active ? 'text-primary-700 font-semibold' : 'text-gray-500'}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        Oposita · Asistente IA para opositores docentes. Resultados orientativos: revisa la normativa vigente.
      </footer>
    </div>
  );
}
