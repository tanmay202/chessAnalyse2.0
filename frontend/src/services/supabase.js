import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-publishable-key'
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Auth helper methods
export async function getSession() {
  if (!supabase) return null;
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getUser() {
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}

export async function getCurrentUser() {
  return getUser();
}

export async function signIn(email, password) {
  if (!supabase) throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, displayName = '') {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split('@')[0] }
    }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
  return data;
}

// Database CRUD operations for saved_analyses
export async function saveAnalysis({ title, inputType, pgn, fen, settings, result }) {
  if (!supabase) {
    // Fallback to localStorage for guest or unconfigured mode
    const localSaved = JSON.parse(localStorage.getItem('chess_saved_analyses') || '[]');
    const newEntry = {
      id: 'local_' + Date.now(),
      title: title || (inputType === 'pgn' ? 'Saved PGN Game' : 'Saved FEN Position'),
      input_type: inputType,
      pgn: pgn || null,
      fen: fen || null,
      analysis_settings: settings || {},
      analysis_result: result || {},
      created_at: new Date().toISOString(),
      is_local: true,
    };
    localSaved.unshift(newEntry);
    localStorage.setItem('chess_saved_analyses', JSON.stringify(localSaved.slice(0, 30)));
    return newEntry;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("You must be signed in to save analyses to the cloud.");
  }

  const { data, error } = await supabase
    .from('saved_analyses')
    .insert([
      {
        user_id: user.id,
        title: title || (inputType === 'pgn' ? 'Saved PGN Game' : 'Saved FEN Position'),
        input_type: inputType,
        pgn: pgn || null,
        fen: fen || null,
        analysis_settings: settings || {},
        analysis_result: result || {},
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchSavedAnalyses() {
  if (!supabase) {
    // Return localStorage saved items
    const localSaved = JSON.parse(localStorage.getItem('chess_saved_analyses') || '[]');
    return localSaved;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Return guest local analyses if not signed in
    const localSaved = JSON.parse(localStorage.getItem('chess_saved_analyses') || '[]');
    return localSaved;
  }

  const { data, error } = await supabase
    .from('saved_analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteSavedAnalysis(id) {
  if (!supabase || id.startsWith('local_')) {
    const localSaved = JSON.parse(localStorage.getItem('chess_saved_analyses') || '[]');
    const updated = localSaved.filter(item => item.id !== id);
    localStorage.setItem('chess_saved_analyses', JSON.stringify(updated));
    return;
  }

  const { error } = await supabase
    .from('saved_analyses')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateSavedAnalysisTitle(id, newTitle) {
  if (!supabase || id.startsWith('local_')) {
    const localSaved = JSON.parse(localStorage.getItem('chess_saved_analyses') || '[]');
    const item = localSaved.find(i => i.id === id);
    if (item) item.title = newTitle;
    localStorage.setItem('chess_saved_analyses', JSON.stringify(localSaved));
    return;
  }

  const { error } = await supabase
    .from('saved_analyses')
    .update({ title: newTitle })
    .eq('id', id);

  if (error) throw error;
}
