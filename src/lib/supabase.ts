import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Match, Goal } from '../types/football';

// Default from environment variables or custom configuration
const envUrl = import.meta.env.VITE_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const getSupabaseConfig = () => {
  const customUrl = localStorage.getItem('supabase_project_url') || envUrl || '';
  const customKey = localStorage.getItem('supabase_anon_key') || envKey || '';
  const isConfigured = Boolean(
    customUrl &&
    customKey &&
    customUrl.startsWith('https://') &&
    !customUrl.includes('your-project-id')
  );

  return {
    url: customUrl,
    anonKey: customKey,
    isConfigured,
  };
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const getSupabase = (): SupabaseClient | null => {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey);
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Faltan las credenciales (URL de proyecto y clave anon pública).',
    };
  }

  try {
    const { error } = await client.from('matches').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Conectado a Supabase, pero falta crear las tablas "matches" y "goals" en el SQL Editor.',
        };
      }
      return { success: false, message: `Error Supabase: ${error.message}` };
    }
    return { success: true, message: '¡Conexión establecida con éxito con tu base de datos Supabase!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Error de conexión a Supabase.' };
  }
};

// Supabase SQL Schema for the user to run in Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- SCHEMA TÁCTICO DE FÚTBOL PARA TU PROYECTO SUPABASE
-- Pega este código en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ========================================================

-- 1. Tabla de Partidos (Jornadas)
CREATE TABLE IF NOT EXISTS public.matches (
  id TEXT PRIMARY KEY,
  jornada INTEGER NOT NULL,
  date TEXT NOT NULL,
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  competition TEXT,
  stadium TEXT,
  first_goal_team_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Goles Tácticos
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES public.matches(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  conceding_team_id TEXT NOT NULL,
  scorer TEXT NOT NULL,
  assister TEXT,
  minute INTEGER NOT NULL,
  minute_interval TEXT NOT NULL,
  score_before TEXT DEFAULT '0-0',
  tactical_phase TEXT NOT NULL,
  tactical_subtype TEXT NOT NULL,
  pitch_zone TEXT,
  body_part TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Seguridad por Fila (Row Level Security - RLS)
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas para permitir lectura y escritura mediante la clave pública (Anon Key)
CREATE POLICY "Permitir lectura publica de partidos" 
  ON public.matches FOR SELECT USING (true);

CREATE POLICY "Permitir insercion y edicion de partidos" 
  ON public.matches FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir lectura publica de goles" 
  ON public.goals FOR SELECT USING (true);

CREATE POLICY "Permitir insercion y edicion de goles" 
  ON public.goals FOR ALL USING (true) WITH CHECK (true);
`;

// Sync helpers
export const fetchMatchesFromSupabase = async (): Promise<Match[] | null> => {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client.from('matches').select('*').order('jornada', { ascending: true });
  if (error || !data) return null;

  return data.map((row: any) => ({
    id: row.id,
    jornada: row.jornada,
    date: row.date,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    homeScore: row.home_score,
    awayScore: row.away_score,
    competition: row.competition || 'Liga',
    stadium: row.stadium || '',
    firstGoalTeamId: row.first_goal_team_id || 'NONE',
    notes: row.notes || undefined,
  }));
};

export const saveMatchToSupabase = async (m: Match): Promise<boolean> => {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('matches').upsert({
    id: m.id,
    jornada: m.jornada,
    date: m.date,
    home_team_id: m.homeTeamId,
    away_team_id: m.awayTeamId,
    home_score: m.homeScore,
    away_score: m.awayScore,
    competition: m.competition,
    stadium: m.stadium,
    first_goal_team_id: m.firstGoalTeamId || 'NONE',
    notes: m.notes || null,
  });

  return !error;
};

export const deleteMatchFromSupabase = async (matchId: string): Promise<boolean> => {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('matches').delete().eq('id', matchId);
  return !error;
};

export const fetchGoalsFromSupabase = async (): Promise<Goal[] | null> => {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client.from('goals').select('*').order('minute', { ascending: true });
  if (error || !data) return null;

  return data.map((row: any) => ({
    id: row.id,
    matchId: row.match_id,
    teamId: row.team_id,
    concedingTeamId: row.conceding_team_id,
    scorer: row.scorer,
    assister: row.assister || undefined,
    minute: row.minute,
    minuteInterval: row.minute_interval,
    scoreBefore: row.score_before || '0-0',
    tacticalPhase: row.tactical_phase,
    tacticalSubtype: row.tactical_subtype,
    pitchZone: row.pitch_zone || undefined,
    bodyPart: row.body_part || undefined,
    notes: row.notes || undefined,
  }));
};

export const saveGoalToSupabase = async (g: Goal): Promise<boolean> => {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('goals').upsert({
    id: g.id,
    match_id: g.matchId,
    team_id: g.teamId,
    conceding_team_id: g.concedingTeamId,
    scorer: g.scorer,
    assister: g.assister || null,
    minute: g.minute,
    minute_interval: g.minuteInterval,
    score_before: g.scoreBefore,
    tactical_phase: g.tacticalPhase,
    tactical_subtype: g.tacticalSubtype,
    pitch_zone: g.pitchZone || null,
    body_part: g.bodyPart || null,
    notes: g.notes || null,
  });

  return !error;
};

export const deleteGoalFromSupabase = async (goalId: string): Promise<boolean> => {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('goals').delete().eq('id', goalId);
  return !error;
};
