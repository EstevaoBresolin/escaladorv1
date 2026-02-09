import { cache } from 'react';
import { createClient } from './server';

// Cache da sessão do usuário para evitar múltiplas chamadas
export const getCachedUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

// Cache do perfil do usuário
export const getCachedProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, churches(*)')
    .eq('id', userId)
    .single();
  return profile;
});

// Cache das permissões do usuário
export const getCachedPermissions = cache(async (userId: string) => {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, church_id')
    .eq('id', userId)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isLeader = profile?.role === 'leader';

  // Buscar ministérios que o usuário lidera
  const { data: ledMinistries } = await supabase
    .from('ministry_leaders')
    .select('ministry_id')
    .eq('user_id', userId);

  return {
    isAdmin,
    isLeader,
    ledMinistryIds: ledMinistries?.map(m => m.ministry_id) || [],
    churchId: profile?.church_id || null,
  };
});
