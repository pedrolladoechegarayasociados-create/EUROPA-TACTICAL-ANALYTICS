-- ========================================================
-- CARGA DE JORNADA 12 (9 PARTIDOS + 20 GOLES CON GOLEADORES Y ASISTENTES)
-- Pega este código en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ========================================================

-- 1. INSERTAR / ACTUALIZAR LOS 9 PARTIDOS DE LA JORNADA 12
INSERT INTO public.matches (
  id, jornada, date, home_team_id, away_team_id, home_score, away_score, competition, stadium, first_goal_team_id, notes
) VALUES
  ('j12-m1', 12, '2026-11-13', 'gimnastic-tarragona', 'rm-castilla', 0, 1, 'Primera Federación / Liga', 'Nou Estadi Costa Daurada', 'rm-castilla', NULL),
  ('j12-m2', 12, '2026-11-14', 'ce-europa', 'ue-sant-andreu', 0, 2, 'Primera Federación / Liga', 'Nou Sardenya', 'ue-sant-andreu', NULL),
  ('j12-m3', 12, '2026-11-14', 'hercules-alicante', 'villarreal-b', 2, 2, 'Primera Federación / Liga', 'José Rico Pérez', 'villarreal-b', NULL),
  ('j12-m4', 12, '2026-11-14', 'juventud-torremolinos', 'sd-huesca', 1, 0, 'Primera Federación / Liga', 'El Pozuelo', 'juventud-torremolinos', NULL),
  ('j12-m5', 12, '2026-11-14', 'real-jaen', 'real-zaragoza', 0, 4, 'Primera Federación / Liga', 'Nuevo La Victoria', 'real-zaragoza', NULL),
  ('j12-m6', 12, '2026-11-15', 'atletico-madrideno', 'cd-teruel', 1, 0, 'Primera Federación / Liga', 'Cerro del Espino', 'atletico-madrideno', NULL),
  ('j12-m7', 12, '2026-11-15', 'ud-ibiza', 'fc-cartagena', 0, 1, 'Primera Federación / Liga', 'Palladium Can Misses', 'fc-cartagena', NULL),
  ('j12-m8', 12, '2026-11-15', 'algeciras-cf', 'antequera-cf', 2, 1, 'Primera Federación / Liga', 'Nuevo Mirador', 'algeciras-cf', NULL),
  ('j12-m9', 12, '2026-11-15', 'real-murcia', 'ad-alcorcon', 1, 2, 'Primera Federación / Liga', 'Enrique Roca de Murcia', 'real-murcia', NULL)
ON CONFLICT (id) DO UPDATE SET
  home_score = EXCLUDED.home_score,
  away_score = EXCLUDED.away_score,
  first_goal_team_id = EXCLUDED.first_goal_team_id,
  notes = EXCLUDED.notes;

-- 2. INSERTAR / ACTUALIZAR LOS 20 GOLES DE LA JORNADA 12
INSERT INTO public.goals (
  id, match_id, team_id, conceding_team_id, scorer, assister, minute, minute_interval, score_before, tactical_phase, tactical_subtype, pitch_zone, body_part, notes
) VALUES
  ('g-j12-m1-1', 'j12-m1', 'rm-castilla', 'gimnastic-tarragona', 'Pol Fortuny', 'Daniel Yáñez', 10, '0-15', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m2-1', 'j12-m2', 'ue-sant-andreu', 'ce-europa', 'A. García', 'Jaume Tovar', 65, '61-75', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m2-2', 'j12-m2', 'ue-sant-andreu', 'ce-europa', 'A. García', 'Àlex Bermejo', 84, '76-90+', '0-1', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m3-1', 'j12-m3', 'villarreal-b', 'hercules-alicante', 'Nizar', 'Arnau Forés', 45, '31-45', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, 'Minuto 45''+5'),
  ('g-j12-m3-2', 'j12-m3', 'hercules-alicante', 'villarreal-b', 'Víctor Narro', NULL, 66, '61-75', '0-1', 'ABP', 'Penalti', NULL, NULL, NULL),
  ('g-j12-m3-3', 'j12-m3', 'villarreal-b', 'hercules-alicante', 'Nico Barattucci', 'Albert García', 68, '61-75', '1-1', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m3-4', 'j12-m3', 'hercules-alicante', 'villarreal-b', 'A. Toril', NULL, 96, '76-90+', '1-2', 'ABP', 'Penalti', NULL, NULL, NULL),
  ('g-j12-m4-1', 'j12-m4', 'juventud-torremolinos', 'sd-huesca', 'I. Matiti', 'M. Diaby', 84, '76-90+', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m5-1', 'j12-m5', 'real-zaragoza', 'real-jaen', 'Jaume Jardí', NULL, 45, '31-45', '0-0', 'ABP', 'Penalti', NULL, NULL, 'Minuto 45''+3'),
  ('g-j12-m5-2', 'j12-m5', 'real-zaragoza', 'real-jaen', 'Marcos Cuenca', 'Rubén Díez', 54, '46-60', '0-1', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m5-3', 'j12-m5', 'real-zaragoza', 'real-jaen', 'Pau Sans', NULL, 78, '76-90+', '0-2', 'ABP', 'Penalti', NULL, NULL, NULL),
  ('g-j12-m5-4', 'j12-m5', 'real-zaragoza', 'real-jaen', 'Óscar Ureña', NULL, 80, '76-90+', '0-3', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m6-1', 'j12-m6', 'atletico-madrideno', 'cd-teruel', 'D. García', 'R. Hueso', 81, '76-90+', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m7-1', 'j12-m7', 'fc-cartagena', 'ud-ibiza', 'Ibán Ribeiro', NULL, 38, '31-45', '0-0', 'ABP', 'Penalti', NULL, NULL, NULL),
  ('g-j12-m8-1', 'j12-m8', 'algeciras-cf', 'antequera-cf', 'Pau Martínez', NULL, 59, '46-60', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m8-2', 'j12-m8', 'algeciras-cf', 'antequera-cf', 'Ángel Gómez', 'Pau Martínez', 74, '61-75', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m8-3', 'j12-m8', 'antequera-cf', 'algeciras-cf', 'Luismi Gutiérrez', NULL, 94, '76-90+', '2-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m9-1', 'j12-m9', 'real-murcia', 'ad-alcorcon', 'Flakus', 'Joan Rojas', 43, '31-45', '0-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m9-2', 'j12-m9', 'ad-alcorcon', 'real-murcia', 'Javier Lancho', 'Á. Mayorga', 55, '46-60', '1-0', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL),
  ('g-j12-m9-3', 'j12-m9', 'ad-alcorcon', 'real-murcia', 'Irurita', 'Esteban Aparicio', 68, '61-75', '1-1', 'PENDIENTE', 'Sin definir', NULL, NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  scorer = EXCLUDED.scorer,
  assister = EXCLUDED.assister,
  minute = EXCLUDED.minute,
  minute_interval = EXCLUDED.minute_interval,
  score_before = EXCLUDED.score_before,
  tactical_phase = EXCLUDED.tactical_phase,
  tactical_subtype = EXCLUDED.tactical_subtype,
  notes = EXCLUDED.notes;
