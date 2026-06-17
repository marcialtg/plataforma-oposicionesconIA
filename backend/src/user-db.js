import supabase from './supabase.js';

export async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createUser({ email, password, name, comunidad, asignatura, cuerpo, isAdmin }) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password,
      name: name || '',
      comunidad: comunidad || '',
      asignatura: asignatura || '',
      cuerpo: cuerpo || '',
      is_admin: isAdmin ? 1 : 0,
      active: 1,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserProfile(id, { name, comunidad, asignatura, cuerpo }) {
  const { data, error } = await supabase
    .from('users')
    .update({ name, comunidad, asignatura, cuerpo })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, is_admin, active, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function setUserActiveStatus(id, active) {
  const { error } = await supabase
    .from('users')
    .update({ active: active ? 1 : 0 })
    .eq('id', id);
  if (error) throw error;
}

export async function getUserCount() {
  const { count, error } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
}
