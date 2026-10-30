import React, { useState } from 'react';
import {
  Trophy,
  Shield,
  TrendingUp,
  Flame,
  Target,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  Sparkles,
  MapPin,
} from 'lucide-react';
import {
  Match,
  Goal,
  TACTICAL_CATEGORIES,
  MINUTE_INTERVALS,
  TacticalPhase,
} from '../types/football';
import { LEAGUE_TEAMS, getTeamById } from '../data/teams';

interface MetricsDashboardProps {
  matches: Match[];
  goals: Goal[];
  selectedTeamId: string;
  onSelectTeamId: (teamId: string) => void;
  onOpenNewGoal: () => void;
  onOpenNewMatch: () => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  matches,
  goals,
  selectedTeamId,
  onSelectTeamId,
  onOpenNewGoal,
  onOpenNewMatch,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<TacticalPhase | 'ALL'>('ALL');
  const [viewSide, setViewSide] = useState<'FOR' | 'AGAINST'>('FOR');

  const currentTeam = selectedTeamId !== 'ALL' ? getTeamById(selectedTeamId) : null;

  // Filter matches involving the selected team
  const relevantMatches = selectedTeamId === 'ALL'
    ? matches
    : matches.filter((m) => m.homeTeamId === selectedTeamId || m.awayTeamId === selectedTeamId);

  // Filter goals scored by or conceded by the team
  const teamGoalsFor = selectedTeamId === 'ALL'
    ? goals
    : goals.filter((g) => g.teamId === selectedTeamId);

  const teamGoalsAgainst = selectedTeamId === 'ALL'
    ? []
    : goals.filter((g) => g.concedingTeamId === selectedTeamId);

  // If specific team:
  let homeMatches: Match[] = [];
  let awayMatches: Match[] = [];
  let teamWins = 0;
  let teamDraws = 0;
  let teamLosses = 0;
  let teamPoints = 0;

  if (selectedTeamId !== 'ALL') {
    homeMatches = relevantMatches.filter((m) => m.homeTeamId === selectedTeamId);
    awayMatches = relevantMatches.filter((m) => m.awayTeamId === selectedTeamId);

    relevantMatches.forEach((m) => {
      const isHome = m.homeTeamId === selectedTeamId;
      const ourScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;

      if (ourScore > oppScore) teamWins++;
      else if (ourScore === oppScore) teamDraws++;
      else teamLosses++;
    });

    teamPoints = teamWins * 3 + teamDraws;
  }

  // Home vs Away breakdown
  const homeWins = homeMatches.filter((m) => m.homeScore > m.awayScore).length;
  const homeDraws = homeMatches.filter((m) => m.homeScore === m.awayScore).length;
  const homeLosses = homeMatches.filter((m) => m.homeScore < m.awayScore).length;
  const homePoints = homeWins * 3 + homeDraws;
  const homeGF = homeMatches.reduce((acc, m) => acc + m.homeScore, 0);
  const homeGC = homeMatches.reduce((acc, m) => acc + m.awayScore, 0);

  const awayWins = awayMatches.filter((m) => m.awayScore > m.homeScore).length;
  const awayDraws = awayMatches.filter((m) => m.awayScore === m.homeScore).length;
  const awayLosses = awayMatches.filter((m) => m.awayScore < m.homeScore).length;
  const awayPoints = awayWins * 3 + awayDraws;
  const awayGF = awayMatches.reduce((acc, m) => acc + m.awayScore, 0);
  const awayGC = awayMatches.reduce((acc, m) => acc + m.homeScore, 0);

  // Score management: Starting winning vs starting losing
  const startedWinningMatches = relevantMatches.filter((m) => m.firstGoalTeamId === selectedTeamId);
  const ptsWhenWinningPossible = startedWinningMatches.length * 3;
  const ptsWhenWinningAchieved = startedWinningMatches.reduce((acc, m) => {
    const isHome = m.homeTeamId === selectedTeamId;
    const ourScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;
    if (ourScore > oppScore) return acc + 3;
    if (ourScore === oppScore) return acc + 1;
    return acc;
  }, 0);
  const winningRetentionPct = ptsWhenWinningPossible > 0 ? Math.round((ptsWhenWinningAchieved / ptsWhenWinningPossible) * 100) : 0;

  const startedLosingMatches = relevantMatches.filter(
    (m) => m.firstGoalTeamId && m.firstGoalTeamId !== 'NONE' && m.firstGoalTeamId !== selectedTeamId
  );
  const ptsWhenLosingPossible = startedLosingMatches.length * 3;
  const ptsWhenLosingRescued = startedLosingMatches.reduce((acc, m) => {
    const isHome = m.homeTeamId === selectedTeamId;
    const ourScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;
    if (ourScore > oppScore) return acc + 3;
    if (ourScore === oppScore) return acc + 1;
    return acc;
  }, 0);
  const comebacksWon = startedLosingMatches.filter((m) => {
    const isHome = m.homeTeamId === selectedTeamId;
    return isHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore;
  }).length;
  const comebacksDrawn = startedLosingMatches.filter((m) => m.homeScore === m.awayScore).length;
  const comebackResiliencePct = ptsWhenLosingPossible > 0 ? Math.round((ptsWhenLosingRescued / ptsWhenLosingPossible) * 100) : 0;

  // Scorers map
  const scorersMap: Record<string, { count: number; teamName: string }> = {};
  (selectedTeamId === 'ALL' ? goals : teamGoalsFor).forEach((g) => {
    if (!scorersMap[g.scorer]) {
      const team = getTeamById(g.teamId);
      scorersMap[g.scorer] = { count: 0, teamName: team.shortName };
    }
    scorersMap[g.scorer].count++;
  });
  const topScorers = Object.entries(scorersMap).sort((a, b) => b[1].count - a[1].count).slice(0, 10);

  const activeGoalsToInspect = viewSide === 'FOR' ? teamGoalsFor : teamGoalsAgainst;

  return (
    <div className="space-y-8">
      {/* Team Selection Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border border-white/20 text-white"
            style={{ backgroundColor: currentTeam ? currentTeam.primaryColor : '#2563eb' }}
          >
            {currentTeam ? currentTeam.shortName.slice(0, 2).toUpperCase() : '20'}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white">
                {currentTeam ? currentTeam.name : 'Vista General de los 20 Equipos de la Liga'}
              </h2>
              {currentTeam && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {currentTeam.city}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTeam ? `Estadio: ${currentTeam.stadium}` : 'Selecciona cualquier equipo en el menú desplegable para ver su análisis táctico particular.'}</span>
            </p>
          </div>
        </div>

        {/* Quick Team Changer */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedTeamId}
            onChange={(e) => onSelectTeamId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">🌐 Vista General (Toda la Liga)</option>
            {LEAGUE_TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenNewGoal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition cursor-pointer"
          >
            + Registrar Gol
          </button>
        </div>
      </div>

      {/* Top Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {selectedTeamId === 'ALL' ? 'Partidos Totales' : 'Partidos Jugados'}
          </span>
          <div className="text-2xl font-black text-white">{relevantMatches.length}</div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {selectedTeamId === 'ALL' ? `${matches.length} en la liga` : `${teamWins}V ${teamDraws}E ${teamLosses}D`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {selectedTeamId === 'ALL' ? 'Goles Totales' : 'Puntos Obtenidos'}
          </span>
          <div className="text-2xl font-black text-blue-400">
            {selectedTeamId === 'ALL' ? goals.length : teamPoints}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {selectedTeamId === 'ALL' ? `${(goals.length / (matches.length || 1)).toFixed(1)} por partido` : `${relevantMatches.length > 0 ? (teamPoints / relevantMatches.length).toFixed(2) : 0} pts/p`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {selectedTeamId === 'ALL' ? 'Goles en Posicional' : 'Goles a Favor'}
          </span>
          <div className="text-2xl font-black text-emerald-400">
            {selectedTeamId === 'ALL' ? goals.filter((g) => g.tacticalPhase === 'POSICIONAL').length : teamGoalsFor.length}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {selectedTeamId === 'ALL' ? 'Ataque estructurado' : `${(teamGoalsFor.length / (relevantMatches.length || 1)).toFixed(1)} por partido`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {selectedTeamId === 'ALL' ? 'Goles en ABP' : 'Goles Encajados'}
          </span>
          <div className="text-2xl font-black text-rose-400">
            {selectedTeamId === 'ALL' ? goals.filter((g) => g.tacticalPhase === 'ABP').length : teamGoalsAgainst.length}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {selectedTeamId === 'ALL' ? 'Balón parado' : `${(teamGoalsAgainst.length / (relevantMatches.length || 1)).toFixed(1)} encajados/p`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Goles en ABP (Balón Parado)
          </span>
          <div className="text-2xl font-black text-amber-400">
            {teamGoalsFor.filter((g) => g.tacticalPhase === 'ABP').length}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {teamGoalsFor.length > 0 ? Math.round((teamGoalsFor.filter((g) => g.tacticalPhase === 'ABP').length / teamGoalsFor.length) * 100) : 0}% de los goles
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Goles en Transición
          </span>
          <div className="text-2xl font-black text-rose-400">
            {teamGoalsFor.filter((g) => g.tacticalPhase === 'TRANSICION').length}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Transiciones rápidas
          </span>
        </div>
      </div>

      {/* TEAM SPECIFIC: HOME/AWAY TABLE & COMEBACK RESILIENCE */}
      {selectedTeamId !== 'ALL' && currentTeam ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Casa vs Fuera del Equipo (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Rendimiento: Casa ({currentTeam.stadium}) vs Fuera
                </h3>
                <p className="text-xs text-slate-400">
                  Desglose de puntos y goles del {currentTeam.name}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Condición</th>
                    <th className="py-2.5 px-2 text-center">PJ</th>
                    <th className="py-2.5 px-2 text-center">V</th>
                    <th className="py-2.5 px-2 text-center">E</th>
                    <th className="py-2.5 px-2 text-center">D</th>
                    <th className="py-2.5 px-2 text-center">GF</th>
                    <th className="py-2.5 px-2 text-center">GC</th>
                    <th className="py-2.5 px-2 text-center">DG</th>
                    <th className="py-2.5 px-2 text-center">PTS</th>
                    <th className="py-2.5 px-3 text-center">Eficacia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-3 px-3 font-sans font-bold text-blue-300">CASA ({currentTeam.stadium})</td>
                    <td className="py-3 px-2 text-center">{homeMatches.length}</td>
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">{homeWins}</td>
                    <td className="py-3 px-2 text-center text-amber-400 font-bold">{homeDraws}</td>
                    <td className="py-3 px-2 text-center text-rose-400 font-bold">{homeLosses}</td>
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">{homeGF}</td>
                    <td className="py-3 px-2 text-center text-rose-400 font-bold">{homeGC}</td>
                    <td className="py-3 px-2 text-center">{homeGF - homeGC > 0 ? `+${homeGF - homeGC}` : homeGF - homeGC}</td>
                    <td className="py-3 px-2 text-center text-blue-400 font-black">{homePoints}</td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px]">
                        {homeMatches.length > 0 ? Math.round((homePoints / (homeMatches.length * 3)) * 100) : 0}%
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-sans font-bold text-indigo-300">FUERA (Visitante)</td>
                    <td className="py-3 px-2 text-center">{awayMatches.length}</td>
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">{awayWins}</td>
                    <td className="py-3 px-2 text-center text-amber-400 font-bold">{awayDraws}</td>
                    <td className="py-3 px-2 text-center text-rose-400 font-bold">{awayLosses}</td>
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">{awayGF}</td>
                    <td className="py-3 px-2 text-center text-rose-400 font-bold">{awayGC}</td>
                    <td className="py-3 px-2 text-center">{awayGF - awayGC > 0 ? `+${awayGF - awayGC}` : awayGF - awayGC}</td>
                    <td className="py-3 px-2 text-center text-indigo-400 font-black">{awayPoints}</td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px]">
                        {awayMatches.length > 0 ? Math.round((awayPoints / (awayMatches.length * 3)) * 100) : 0}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Resiliencia & Puntos al adelantarse/remontar (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Gestión de Ventajas & Remontadas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Capacidad de retener ventajas y resiliencia tras empezar perdiendo
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-emerald-400">Al Adelantarse en el Marcador</span>
                    <span className="font-mono">{winningRetentionPct}% retenido</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Marcó 1º en <strong>{startedWinningMatches.length}</strong> partidos • Retuvo <strong>{ptsWhenWinningAchieved}</strong> de <strong>{ptsWhenWinningPossible}</strong> pts posibles.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-amber-400">Al Empezar Perdiendo (Remontadas)</span>
                    <span className="font-mono">{comebackResiliencePct}% resiliencia</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Empezó abajo en <strong>{startedLosingMatches.length}</strong> partidos ({comebacksWon}V {comebacksDrawn}E) • Rescató <strong>{ptsWhenLosingRescued}</strong> de <strong>{ptsWhenLosingPossible}</strong> pts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* TACTICAL CATEGORIES BREAKDOWN & MINUTE INTERVALS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Categorías Tácticas (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/15 text-indigo-400 border border-indigo-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Tipos de Gol: 1. Directo, 2. Vertical, 3. ABP, 4. Transición, 5. Posicional
                </h3>
                <p className="text-xs text-slate-400">
                  Desglose de goles por tipología {currentTeam ? `del ${currentTeam.name}` : 'de la Liga'}
                </p>
              </div>
            </div>

            {selectedTeamId !== 'ALL' && (
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setViewSide('FOR')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    viewSide === 'FOR' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  A Favor ({teamGoalsFor.length})
                </button>
                <button
                  onClick={() => setViewSide('AGAINST')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    viewSide === 'AGAINST' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  En Contra ({teamGoalsAgainst.length})
                </button>
              </div>
            )}
          </div>

          {activeGoalsToInspect.filter((g) => g.tacticalPhase === 'PENDIENTE').length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-600/30 text-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span>
                  Hay <strong>{activeGoalsToInspect.filter((g) => g.tacticalPhase === 'PENDIENTE').length} goles</strong> con tipo de gol pendiente por asignar a mano.
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-900/40 px-2.5 py-1 rounded-lg border border-amber-600/30">
                Ve a "Partidos & Goles" para asignarlos
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Object.keys(TACTICAL_CATEGORIES) as TacticalPhase[])
              .filter((phase) => phase !== 'PENDIENTE')
              .map((phase) => {
              const cat = TACTICAL_CATEGORIES[phase];
              const phaseGoals = activeGoalsToInspect.filter((g) => g.tacticalPhase === phase);
              const pct = activeGoalsToInspect.length > 0 ? Math.round((phaseGoals.length / activeGoalsToInspect.length) * 100) : 0;

              // Top subtype
              const subtypesMap: Record<string, number> = {};
              phaseGoals.forEach((g) => {
                subtypesMap[g.tacticalSubtype] = (subtypesMap[g.tacticalSubtype] || 0) + 1;
              });
              const topSubtype = Object.entries(subtypesMap).sort((a, b) => b[1] - a[1])[0];

              return (
                <div
                  key={phase}
                  onClick={() => setSelectedPhase(selectedPhase === phase ? 'ALL' : phase)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    selectedPhase === phase
                      ? 'bg-slate-800 border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">{cat.name}</span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200">
                      {phaseGoals.length} goles ({pct}%)
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>

                  {topSubtype ? (
                    <div className="text-[11px] text-slate-400 bg-slate-900/90 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Subtipo clave:</span>
                      <span className="text-slate-200 font-medium line-clamp-1">{topSubtype[0]} ({topSubtype[1]})</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">0 goles registrados</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Subtipos Detallados: ABP (6) y Juego Posicional (3) */}
          <div className="space-y-3">
            {/* ABP (6 subtipos) */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Sparkles className="w-4 h-4" />
                  <span>3. Subtipos de ABP (Acciones a Balón Parado):</span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono">6 subtipos oficiales</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                {TACTICAL_CATEGORIES.ABP.subtypes.map((sub) => {
                  const count = activeGoalsToInspect.filter((g) => g.tacticalSubtype === sub).length;
                  return (
                    <div key={sub} className="bg-slate-950/80 p-2.5 rounded-xl border border-amber-800/30 flex items-center justify-between">
                      <span className="text-slate-300 font-medium">{sub}</span>
                      <span className="font-mono font-bold text-amber-400 text-xs">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Juego Posicional (3 subtipos) */}
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                  <span>5. Subtipos de Juego Posicional:</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono">3 subtipos oficiales</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                {TACTICAL_CATEGORIES.POSICIONAL.subtypes.map((sub) => {
                  const count = activeGoalsToInspect.filter((g) => g.tacticalSubtype === sub).length;
                  return (
                    <div key={sub} className="bg-slate-950/80 p-2.5 rounded-xl border border-emerald-800/30 flex items-center justify-between">
                      <span className="text-slate-300 font-medium">{sub}</span>
                      <span className="font-mono font-bold text-emerald-400 text-xs">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tramos de Minutos (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Goles por Tramos de Minutos
                </h3>
                <p className="text-xs text-slate-400">
                  Distribución temporal de tantos anotados
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              {MINUTE_INTERVALS.filter((i) => i.key !== 'ET').map((int) => {
                const count = activeGoalsToInspect.filter((g) => g.minuteInterval === int.key).length;
                const total = activeGoalsToInspect.length || 1;
                const pct = Math.round((count / total) * 100);

                return (
                  <div key={int.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300 w-16">{int.label}</span>
                        <span className="text-[11px] text-slate-400 font-normal">{int.range}</span>
                      </div>
                      <span className="font-mono text-blue-400 font-bold">{count} goles ({pct}%)</span>
                    </div>

                    <div className="h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${pct}%` }}
                        className="bg-blue-500 h-full transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            Captura los goles con sus tramos de minutos para detectar patrones de fatiga, arrancadas de partido y eficacia en los tramos finales.
          </div>
        </div>
      </div>

      {/* TOP SCORERS & SQUAD IMPACT */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Tabla de Goleadores Registrados
              </h3>
              <p className="text-xs text-slate-400">
                Goleadores de la liga según los tantos introducidos en cada jornada
              </p>
            </div>
          </div>
          <button
            onClick={onOpenNewGoal}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition cursor-pointer"
          >
            + Añadir Gol
          </button>
        </div>

        {topScorers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            No hay goles registrados todavía. Pulsa "+ Registrar Gol" o entra en cualquier jornada para anotar los goles de los partidos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Goleador</th>
                  <th className="py-2.5 px-3">Equipo</th>
                  <th className="py-2.5 px-3 text-right">Goles Marcados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topScorers.map(([name, data], idx) => (
                  <tr key={name} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-400 font-bold w-10">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-[11px] text-slate-300 flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs">
                        {data.teamName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-base">
                      {data.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
