-- Ejecuta este SQL en el SQL Editor de tu proyecto Supabase (https://supabase.com/dashboard)
-- Crea la tabla de usuarios que la aplicación necesita.

CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT DEFAULT '',
  comunidad TEXT DEFAULT '',
  asignatura TEXT DEFAULT '',
  cuerpo TEXT DEFAULT '',
  is_admin INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permitir que la app lea/escriba en la tabla
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: permitir todo con la service_role key (recomendado para backend)
CREATE POLICY "Service role full access" ON public.users
  FOR ALL USING (true) WITH CHECK (true);
