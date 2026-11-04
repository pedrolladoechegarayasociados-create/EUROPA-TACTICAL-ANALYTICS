-- ========================================================
-- INSERTAR ÚNICAMENTE LA JORNADA 10 (5 PARTIDOS Y 13 GOLES)
-- Copia este código, ve a tu Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ========================================================

-- 1. Insertar los 5 partidos de la Jornada 10
INSERT INTO public.matches (
  id, jornada, date, home_team_id, away_team_id, home_score, away_score,
  competition, stadium, first_goal_team_id, notes
) VALUES
  ('j10-m1', 10, '2026-10-30', 'atletico-madrideno', 'ad-alcorcon', 1, 1, 'Primera Federación / Liga', 'Estadio Alcalá de Henares', 'atletico-madrideno', NULL),
  ('j10-m2', 10, '2026-10-31', 'rm-castilla', 'fc-cartagena', 2, 0, 'Primera Federación / Liga', 'Estadio Alfredo Di Stéfano', 'rm-castilla', NULL),
  ('j10-m3', 10, '2026-10-30', 'ud-ibiza', 'ce-europa', 3, 0, 'Primera Federación / Liga', 'Estadi Municipal Can Misses', 'ud-ibiza', NULL),
  ('j10-m4', 10, '2026-10-31', 'real-zaragoza', 'villarreal-b', 2, 2, 'Primera Federación / Liga', 'Estadio Modular - Real Zaragoza', 'villarreal-b', NULL),
  ('j10-m5', 10, '2026-10-31', 'ue-sant-andreu', 'cd-teruel', 2, 0, 'Primera Federación / Liga', 'Estadio Can Dragó', 'ue-sant-andreu', NULL)
ON CONFLICT (id) DO UPDATE SET
  home_score = EXCLUDED.home_score,
  away_score = EXCLUDED.away_score,
  first_goal_team_id = EXCLUDED.first_goal_team_id;

-- 2. Insertar los 13 goles de la Jornada 10 (con fase PENDIENTE)
INSERT INTO public.goals (
  id, match_id, team_id, conceding_team_id, scorer, assister, minute,
  minute_interval, score_before, tactical_phase, tactical_subtype, pitch_zone, body_part, notes
) VALUES
  ('g-j10-m1-1', 'j10-m1', 'atletico-madrideno', 'ad-alcorcon', 'M. Domènech', 'M. Gil', 50, '46-60', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m1-2', 'j10-m1', 'ad-alcorcon', 'atletico-madrideno', 'Javier Lancho', 'Esteban Aparicio', 96, '76-90+', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m2-1', 'j10-m2', 'rm-castilla', 'fc-cartagena', 'Pol Fortuny', NULL, 12, '0-15', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m2-2', 'j10-m2', 'rm-castilla', 'fc-cartagena', 'Alexis Ciria', 'Jesús Fortea', 17, '16-30', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m3-1', 'j10-m3', 'ud-ibiza', 'ce-europa', 'J. Calavera', NULL, 9, '0-15', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m3-2', 'j10-m3', 'ud-ibiza', 'ce-europa', 'Georges Nsukula', 'Théo Valls', 51, '46-60', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m3-3', 'j10-m3', 'ud-ibiza', 'ce-europa', 'Manu Justo', 'David Astals', 78, '76-90+', '2-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m4-1', 'j10-m4', 'villarreal-b', 'real-zaragoza', 'Albert García', 'Joselillo Gaitán', 64, '61-75', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m4-2', 'j10-m4', 'villarreal-b', 'real-zaragoza', 'Álvaro García', 'Eneko Ortiz', 70, '61-75', '0-1', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m4-3', 'j10-m4', 'real-zaragoza', 'villarreal-b', 'Jaume Jardí', NULL, 86, '76-90+', '0-2', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m4-4', 'j10-m4', 'real-zaragoza', 'villarreal-b', 'Diego González', 'Pau Sans', 93, '76-90+', '1-2', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m5-1', 'j10-m5', 'ue-sant-andreu', 'cd-teruel', 'Jaume Tovar', 'Álex Bermejo', 52, '46-60', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j10-m5-2', 'j10-m5', 'ue-sant-andreu', 'cd-teruel', 'Pau', 'S. Serrano', 89, '76-90+', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
