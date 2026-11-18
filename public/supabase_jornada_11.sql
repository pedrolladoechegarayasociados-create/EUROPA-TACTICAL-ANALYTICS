-- ========================================================
-- CARGA DE JORNADA 11 (7 PARTIDOS + 21 GOLES CON GOLEADORES Y ASISTENTES)
-- Pega este código en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ========================================================

-- 1. INSERTAR / ACTUALIZAR LOS 7 PARTIDOS DE LA JORNADA 11
INSERT INTO public.matches (
  id, jornada, date, home_team_id, away_team_id, home_score, away_score, competition, stadium, first_goal_team_id, notes
) VALUES
  ('j11-m1', 11, '2026-11-07', 'antequera-cf', 'rayo-majadahonda', 3, 1, 'Primera Federación / Liga', 'El Maulí', 'antequera-cf', NULL),
  ('j11-m2', 11, '2026-11-07', 'real-zaragoza', 'sd-huesca', 2, 0, 'Primera Federación / Liga', 'Estadio Modular - Real Zaragoza', 'real-zaragoza', NULL),
  ('j11-m3', 11, '2026-11-08', 'ce-europa', 'atletico-madrideno', 3, 2, 'Primera Federación / Liga', 'Nou Sardenya', 'atletico-madrideno', NULL),
  ('j11-m4', 11, '2026-11-08', 'cd-teruel', 'ud-ibiza', 1, 1, 'Primera Federación / Liga', 'Campo Pinilla', 'ud-ibiza', NULL),
  ('j11-m5', 11, '2026-11-08', 'villarreal-b', 'juventud-torremolinos', 1, 1, 'Primera Federación / Liga', 'Mini Estadi Villarreal', 'villarreal-b', NULL),
  ('j11-m6', 11, '2026-11-08', 'rm-castilla', 'hercules-alicante', 2, 2, 'Primera Federación / Liga', 'Estadio Alfredo Di Stéfano', 'hercules-alicante', NULL),
  ('j11-m7', 11, '2026-11-08', 'real-murcia', 'algeciras-cf', 1, 1, 'Primera Federación / Liga', 'Enrique Roca de Murcia', 'real-murcia', NULL)
ON CONFLICT (id) DO UPDATE SET
  home_score = EXCLUDED.home_score,
  away_score = EXCLUDED.away_score,
  first_goal_team_id = EXCLUDED.first_goal_team_id,
  notes = EXCLUDED.notes;

-- 2. INSERTAR / ACTUALIZAR LOS 21 GOLES DE LA JORNADA 11
INSERT INTO public.goals (
  id, match_id, team_id, conceding_team_id, scorer, assister, minute, minute_interval, score_before, tactical_phase, tactical_subtype, pitch_zone, body_part, notes
) VALUES
  ('g-j11-m1-1', 'j11-m1', 'antequera-cf', 'rayo-majadahonda', 'Destiny', NULL, 22, '16-30', '0-0', 'ABP', 'Penalti', NULL, NULL, NULL),
  ('g-j11-m1-2', 'j11-m1', 'antequera-cf', 'rayo-majadahonda', 'Rafa Diz', 'Isra Domínguez', 33, '31-45', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m1-3', 'j11-m1', 'rayo-majadahonda', 'antequera-cf', 'D. Gallardo', 'Y. Yoshimura', 43, '31-45', '2-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m1-4', 'j11-m1', 'antequera-cf', 'rayo-majadahonda', 'Moi Parra', NULL, 45, '31-45', '2-1', 'PENDIENTE', 'Sin definir', NULL, NULL, 'Minuto 45''+9'),
  ('g-j11-m2-1', 'j11-m2', 'real-zaragoza', 'sd-huesca', 'Joaquín', 'Jaume Jardí', 23, '16-30', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m2-2', 'j11-m2', 'real-zaragoza', 'sd-huesca', 'Iker Vadillo', NULL, 50, '46-60', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m3-1', 'j11-m3', 'atletico-madrideno', 'ce-europa', 'M. Domènech', NULL, 3, '0-15', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m3-2', 'j11-m3', 'atletico-madrideno', 'ce-europa', 'M. Domènech', NULL, 45, '31-45', '0-1', 'ABP', 'Penalti', NULL, NULL, 'Minuto 45''+3'),
  ('g-j11-m3-3', 'j11-m3', 'ce-europa', 'atletico-madrideno', 'K. Noureddine', NULL, 54, '46-60', '0-2', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m3-4', 'j11-m3', 'ce-europa', 'atletico-madrideno', 'Joan Mascaró', 'F. Ribeiro', 71, '61-75', '1-2', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m3-5', 'j11-m3', 'ce-europa', 'atletico-madrideno', 'Y. Zayzoun', 'F. Ribeiro', 94, '76-90+', '2-2', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m4-1', 'j11-m4', 'ud-ibiza', 'cd-teruel', 'Pedro Ortiz', 'David Astals', 48, '46-60', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m4-2', 'j11-m4', 'cd-teruel', 'ud-ibiza', 'Sergio Moreno', NULL, 52, '46-60', '0-1', 'ABP', 'Penalti', NULL, NULL, NULL),
  ('g-j11-m5-1', 'j11-m5', 'villarreal-b', 'juventud-torremolinos', 'Albert García', 'Cheikh', 14, '0-15', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m5-2', 'j11-m5', 'juventud-torremolinos', 'villarreal-b', 'Dioni', 'Á. Climent', 23, '16-30', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m6-1', 'j11-m6', 'hercules-alicante', 'rm-castilla', 'Antoñín', 'Víctor Narro', 7, '0-15', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m6-2', 'j11-m6', 'rm-castilla', 'hercules-alicante', 'Diego Aguado', 'Alexis Ciria', 59, '46-60', '0-1', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m6-3', 'j11-m6', 'hercules-alicante', 'rm-castilla', 'O. Soldevila', NULL, 85, '76-90+', '1-1', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m6-4', 'j11-m6', 'rm-castilla', 'hercules-alicante', 'Jorge Cestero', 'Álvaro Leiva', 90, '76-90+', '1-2', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m7-1', 'j11-m7', 'real-murcia', 'algeciras-cf', 'Javi Mier', 'Javi Moreno', 19, '16-30', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j11-m7-2', 'j11-m7', 'algeciras-cf', 'real-murcia', 'Raúl Rubio', 'Pau Martínez', 32, '31-45', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  scorer = EXCLUDED.scorer,
  assister = EXCLUDED.assister,
  minute = EXCLUDED.minute,
  minute_interval = EXCLUDED.minute_interval,
  score_before = EXCLUDED.score_before,
  tactical_phase = EXCLUDED.tactical_phase,
  tactical_subtype = EXCLUDED.tactical_subtype,
  notes = EXCLUDED.notes;
