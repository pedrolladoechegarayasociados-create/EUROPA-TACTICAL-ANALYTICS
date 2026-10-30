import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Search,
  Crosshair,
  AlertTriangle,
  Sparkles,
  Check,
} from 'lucide-react';
import { Match, Goal, TACTICAL_CATEGORIES } from '../types/football';
import { LEAGUE_TEAMS, getTeamById } from '../data/teams';

interface MatchesListProps {
  matches: Match[];
  goals: Goal[];
  selectedTeamId: string;
  onSelectTeamId: (teamId: string) => void;
  onOpenNewMatch: () => void;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenNewGoalForMatch: (matchId: string, teamId?: string) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

export const MatchesList: React.FC<MatchesListProps> = ({
  matches,
  goals,
  selectedTeamId,
  onSelectTeamId,
  onOpenNewMatch,
  onEditMatch,
  onDeleteMatch,
  onOpenNewGoalForMatch,
  onEditGoal,
  onDeleteGoal,
}) => {
  const [viewMode, setViewMode] = useState<'matches' | 'goals'>('matches');
  const [searchTerm, setSearchTerm] = useState('');
  const [jornadaFilter, setJornadaFilter] = useState<string>('ALL');
  const [phaseFilter, setPhaseFilter] = useState<string>('ALL');
  const [goalStatusFilter, setGoalStatusFilter] = useState<'ALL' | 'MISSING' | 'PENDING_TYPE' | 'COMPLETE'>('ALL');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(matches[0]?.id || null);

  const getMatchGoals = (matchId: string) => {
    return goals
      .filter((g) => g.matchId === matchId)
      .sort((a, b) => a.minute - b.minute);
  };

  // Filter matches
  const filteredMatches = matches.filter((m) => {
    if (selectedTeamId !== 'ALL' && m.homeTeamId !== selectedTeamId && m.awayTeamId !== selectedTeamId) {
      return false;
    }
    if (jornadaFilter !== 'ALL' && m.jornada !== Number(jornadaFilter)) {
      return false;
    }
    if (searchTerm) {
      const home = getTeamById(m.homeTeamId).name.toLowerCase();
      const away = getTeamById(m.awayTeamId).name.toLowerCase();
      const term = searchTerm.toLowerCase();
      if (!home.includes(term) && !away.includes(term)) return false;
    }

    const mGoals = getMatchGoals(m.id);
    const totalGoalsInScore = m.homeScore + m.awayScore;

    if (goalStatusFilter === 'MISSING') {
      if (totalGoalsInScore === 0 || mGoals.length >= totalGoalsInScore) return false;
    } else if (goalStatusFilter === 'PENDING_TYPE') {
      if (!mGoals.some((g) => g.tacticalPhase === 'PENDIENTE')) return false;
    } else if (goalStatusFilter === 'COMPLETE') {
      if (totalGoalsInScore > 0 && (mGoals.length < totalGoalsInScore || mGoals.some((g) => g.tacticalPhase === 'PENDIENTE'))) return false;
    }

    return true;
  });

  const missingGoalsMatchesCount = matches.filter((m) => {
    const total = m.homeScore + m.awayScore;
    return total > 0 && goals.filter((g) => g.matchId === m.id).length < total;
  }).length;

  const pendingTypeMatchesCount = matches.filter((m) => {
    return goals.some((g) => g.matchId === m.id && g.tacticalPhase === 'PENDIENTE');
  }).length;

  // Filter goals for the goals table view
  const filteredGoals = goals.filter((g) => {
    if (selectedTeamId !== 'ALL' && g.teamId !== selectedTeamId && g.concedingTeamId !== selectedTeamId) {
      return false;
    }
    if (phaseFilter !== 'ALL' && g.tacticalPhase !== phaseFilter) {
      return false;
    }
    if (searchTerm) {
      const scorer = g.scorer.toLowerCase();
      const assister = (g.assister || '').toLowerCase();
      const subtype = (g.tacticalSubtype || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      if (!scorer.includes(term) && !assister.includes(term) && !subtype.includes(term)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    const matchA = matches.find((m) => m.id === a.matchId);
    const matchB = matches.find((m) => m.id === b.matchId);
    const jA = matchA ? matchA.jornada : 0;
    const jB = matchB ? matchB.jornada : 0;
    if (jA !== jB) return jA - jB;
    return a.minute - b.minute;
  });

  // Distinct jornadas
  const jornadasList = Array.from(new Set(matches.map((m) => m.jornada))).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {/* View Switcher & Actions Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('matches')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'matches'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Partidos de Jornadas ({filteredMatches.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('goals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'goals'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Goles Registrados ({goals.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {viewMode === 'goals' && (
            <button
              onClick={() => onOpenNewGoalForMatch(matches[0]?.id || '')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Registrar Nuevo Gol</span>
            </button>
          )}

          {viewMode === 'matches' && (
            <button
              onClick={onOpenNewMatch}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nueva Jornada</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                viewMode === 'matches'
                  ? 'Buscar por equipo (Zaragoza, Europa, Sant Andreu...)'
                  : 'Buscar por goleador, asistente o subtipo...'
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Team filter */}
          <select
            value={selectedTeamId}
            onChange={(e) => onSelectTeamId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">Todos los Equipos</option>
            {LEAGUE_TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Jornada filter for matches */}
          {viewMode === 'matches' && jornadasList.length > 0 && (
            <select
              value={jornadaFilter}
              onChange={(e) => setJornadaFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Todas las Jornadas</option>
              {jornadasList.map((j) => (
                <option key={j} value={j}>
                  Jornada {j}
                </option>
              ))}
            </select>
          )}

          {/* Goal Status Filter for matches */}
          {viewMode === 'matches' && (
            <select
              value={goalStatusFilter}
              onChange={(e) => setGoalStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Todos los Estados ({matches.length})</option>
              <option value="MISSING">⚠️ Faltan Goleadores / Tipo ({missingGoalsMatchesCount})</option>
              <option value="PENDING_TYPE">📝 Con Tipo Pendiente ({pendingTypeMatchesCount})</option>
              <option value="COMPLETE">✓ Partidos Completos</option>
            </select>
          )}

          {/* Phase filter for goals view */}
          {viewMode === 'goals' && (
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Todas las Fases Tácticas</option>
              <option value="DIRECTO">1. Juego Directo</option>
              <option value="VERTICAL">2. Juego Vertical</option>
              <option value="ABP">3. ABP (Balón Parado)</option>
              <option value="TRANSICION">4. Transición</option>
              <option value="POSICIONAL">5. Juego Posicional</option>
            </select>
          )}
        </div>
      </div>


      {/* VIEW 1: GOALS TABLE */}
      {viewMode === 'goals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/15 text-blue-400 border border-blue-500/20">
                <Crosshair className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Listado de Todos los Goles Registrados ({filteredGoals.length})
                </h3>
                <p className="text-xs text-slate-400">
                  Haz clic en "Modificar" en cualquier gol para cambiar su minuto, categoría táctica o autor
                </p>
              </div>
            </div>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 space-y-3">
              <Crosshair className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="font-bold text-white text-sm">No hay goles registrados con estos filtros</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Registra los goles de tus jornadas para clasificarlos en juego directo, vertical, ABP, transición o posicional.
              </p>
              <button
                onClick={() => onOpenNewGoalForMatch(matches[0]?.id || '')}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow cursor-pointer"
              >
                + Registrar Gol
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Minuto</th>
                    <th className="py-2.5 px-3">Goleador</th>
                    <th className="py-2.5 px-3">Equipo</th>
                    <th className="py-2.5 px-3">Partido / Jornada</th>
                    <th className="py-2.5 px-3">Fase Táctica</th>
                    <th className="py-2.5 px-3">Subtipo</th>
                    <th className="py-2.5 px-3 text-center">Previo</th>
                    <th className="py-2.5 px-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredGoals.map((goal) => {
                    const match = matches.find((m) => m.id === goal.matchId);
                    const team = getTeamById(goal.teamId);
                    const cat = TACTICAL_CATEGORIES[goal.tacticalPhase] || TACTICAL_CATEGORIES.DIRECTO;

                    return (
                      <tr key={goal.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3">
                          <span className="font-bold text-blue-400 text-sm">{goal.minute}'</span>
                          <span className="ml-1 text-[10px] font-sans px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {goal.minuteInterval}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans font-bold text-white">
                          <div>{goal.scorer}</div>
                          {goal.assister && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              Asist: {goal.assister}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: team.primaryColor }} />
                            <span>{team.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                          {match ? (
                            <div>
                              <span className="font-bold text-slate-300">Jornada {match.jornada}</span>
                              <div className="text-[10px] text-slate-500">
                                {getTeamById(match.homeTeamId).shortName} vs {getTeamById(match.awayTeamId).shortName}
                              </div>
                            </div>
                          ) : (
                            'Partido general'
                          )}
                        </td>
                        <td className="py-3 px-3 font-sans">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeClass}`}>
                            {cat.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-200 font-medium">
                          {goal.tacticalSubtype}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400 font-bold">
                          {goal.scoreBefore}
                        </td>
                        <td className="py-3 px-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onEditGoal(goal)}
                              className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                              title="Modificar minuto, tipo de gol, autor..."
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Modificar</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar el gol de ${goal.scorer} (${goal.minute}')?`)) {
                                  onDeleteGoal(goal.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Eliminar gol"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MATCHES LIST */}
      {viewMode === 'matches' && (
        <div className="space-y-4">
          {missingGoalsMatchesCount > 0 && goalStatusFilter === 'ALL' && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between gap-3 flex-wrap text-xs text-amber-200">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Hay <strong>{missingGoalsMatchesCount} partidos</strong> con resultado en acta pero sin goleadores ni tipos catalogados todavía.
                </span>
              </div>
              <button
                onClick={() => setGoalStatusFilter('MISSING')}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 font-bold text-amber-300 text-xs transition cursor-pointer"
              >
                Ver solo partidos pendientes ({missingGoalsMatchesCount})
              </button>
            </div>
          )}

          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 text-slate-400 space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="font-bold text-white text-base">No hay partidos con los filtros seleccionados</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Prueba a cambiar los filtros de jornada, equipo o estado de goles.
              </p>
              <button
                onClick={() => {
                  setJornadaFilter('ALL');
                  setGoalStatusFilter('ALL');
                  setSearchTerm('');
                }}
                className="px-4 py-2 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            filteredMatches.map((match) => {
              const homeTeam = getTeamById(match.homeTeamId);
              const awayTeam = getTeamById(match.awayTeamId);
              const matchGoals = getMatchGoals(match.id);
              const totalScoreGoals = match.homeScore + match.awayScore;
              const missingGoals = Math.max(0, totalScoreGoals - matchGoals.length);
              const pendingTypeCount = matchGoals.filter((g) => g.tacticalPhase === 'PENDIENTE').length;
              const isExpanded = expandedMatchId === match.id;

              return (
                <div
                  key={match.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm transition hover:border-slate-700"
                >
                  {/* Match Header Bar */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Left: Jornada, Date, Stadium & Score */}
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-blue-300 border border-slate-700">
                            Jornada {match.jornada}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {match.stadium}
                          </span>

                          {/* Status Pill */}
                          {totalScoreGoals > 0 && matchGoals.length === 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Sin goleadores ({match.homeScore}-{match.awayScore})
                            </span>
                          ) : missingGoals > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Faltan {missingGoals} de {totalScoreGoals} goles
                            </span>
                          ) : pendingTypeCount > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                              📝 {pendingTypeCount} tipo(s) pendiente(s)
                            </span>
                          ) : totalScoreGoals > 0 ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              Goles y tipos completos
                            </span>
                          ) : null}
                        </div>

                        {/* Scoreboard line with team indicators */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {/* Home Team */}
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: homeTeam.primaryColor }} />
                            <span className="text-base font-bold text-white">
                              {homeTeam.name}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Local</span>
                          </div>

                          {/* Score Box - clickable to edit match */}
                          <button
                            type="button"
                            onClick={() => onEditMatch(match)}
                            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500 font-mono text-lg font-black tracking-wider transition cursor-pointer shadow-inner group"
                            title="Haz clic para modificar el resultado del partido"
                          >
                            <span className="text-blue-400">{match.homeScore}</span>
                            <span className="text-slate-600">-</span>
                            <span className="text-indigo-400">{match.awayScore}</span>
                            <Edit2 className="w-3 h-3 text-slate-600 group-hover:text-blue-400 ml-1 opacity-0 group-hover:opacity-100 transition" />
                          </button>

                          {/* Away Team */}
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: awayTeam.primaryColor }} />
                            <span className="text-base font-bold text-white">
                              {awayTeam.name}
                            </span>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Visitante</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2.5 self-end md:self-center flex-wrap">

                      <button
                        onClick={() => onOpenNewGoalForMatch(match.id, homeTeam.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 transition cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Gol</span>
                      </button>

                      <button
                        onClick={() => onEditMatch(match)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Modificar resultado / partido"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la jornada ${match.jornada}: ${homeTeam.shortName} vs ${awayTeam.shortName}?`)) {
                            onDeleteMatch(match.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Eliminar partido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title={isExpanded ? 'Plegar goles' : 'Desplegar goles'}
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Interactive Goals Section on Card */}
                  <div className="px-5 pb-4 pt-1 space-y-2.5">
                    {/* Registered goals chips */}
                    {matchGoals.length > 0 && (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                            ⚽ Goles registrados ({matchGoals.length}):
                          </span>
                          {matchGoals.map((g) => {
                            const cat = TACTICAL_CATEGORIES[g.tacticalPhase] || TACTICAL_CATEGORIES.PENDIENTE;
                            const isPending = g.tacticalPhase === 'PENDIENTE';
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => onEditGoal(g)}
                                className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 text-xs shadow-sm group ${
                                  isPending
                                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 hover:bg-amber-900/60'
                                    : 'bg-slate-950 hover:bg-blue-900/40 border-slate-700/80 hover:border-blue-500 text-slate-200 hover:text-white'
                                }`}
                                title={isPending ? 'Gol pendiente de clasificar táctica. Haz clic para asignar su tipo.' : 'Haz clic para modificar este gol.'}
                              >
                                <span className={`font-mono font-bold ${isPending ? 'text-amber-400' : 'text-blue-400'}`}>{g.minute}'</span>
                                <span className="font-semibold">{g.scorer}</span>
                                <span className={`text-[10px] ${isPending ? 'text-amber-300 font-bold' : 'text-slate-400 group-hover:text-blue-300'}`}>
                                  • {isPending ? '⚠️ Asignar tipo' : (g.tacticalSubtype || cat.shortName)}
                                </span>
                                <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-blue-400 ml-0.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Missing goals warning banner with quick action buttons */}
                    {missingGoals > 0 && (
                      <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap text-xs">
                        <div className="flex items-center gap-2 text-amber-200">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            {matchGoals.length === 0
                              ? `Resultado ${match.homeScore}-${match.awayScore}: faltan los ${totalScoreGoals} goleadores y tipos tácticos.`
                              : `Faltan ${missingGoals} de los ${totalScoreGoals} goles por catalogar.`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onOpenNewGoalForMatch(match.id, homeTeam.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-blue-300 font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Gol {homeTeam.shortName}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenNewGoalForMatch(match.id, awayTeam.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-indigo-300 font-medium transition cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Gol {awayTeam.shortName}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Match Notes if any */}
                  {match.notes && (
                    <div className="px-5 pb-3 text-xs text-slate-400 italic">
                      «{match.notes}»
                    </div>
                  )}

                  {/* Expanded Goals Breakdown */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                        <span>Goles Tácticos Registrados ({matchGoals.length})</span>
                        <button
                          onClick={() => onOpenNewGoalForMatch(match.id)}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Añadir otro gol al partido
                        </button>
                      </div>

                      {matchGoals.length === 0 ? (
                        <div className="p-4 text-center rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-500">
                          No hay goles tácticos catalogados para este encuentro. Pulsa "+ Gol" para registrar el autor, minuto y fase táctica (ABP, posicional, vertical, etc.).
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {matchGoals.map((goal) => {
                            const goalTeam = getTeamById(goal.teamId);
                            const cat = TACTICAL_CATEGORIES[goal.tacticalPhase] || TACTICAL_CATEGORIES.DIRECTO;

                            return (
                              <div
                                key={goal.id}
                                className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
                              >
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: goalTeam.primaryColor }}
                                      />
                                      <span className="font-mono font-bold text-sm text-blue-400">
                                        {goal.minute}'
                                      </span>
                                      <span className="font-bold text-xs text-slate-100">
                                        {goal.scorer}
                                      </span>
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                        {goalTeam.shortName}
                                      </span>
                                      {goal.assister && (
                                        <span className="text-[11px] text-slate-400">
                                          (asist. {goal.assister})
                                        </span>
                                      )}
                                    </div>

                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeClass}`}>
                                      {cat.name}
                                    </span>
                                  </div>

                                  <div className="text-[11px] text-slate-300 pl-4 border-l border-slate-800 space-y-0.5">
                                    <div>
                                      <span className="text-slate-400">Subtipo: </span>
                                      <span className="font-medium text-slate-200">{goal.tacticalSubtype}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                                      <span>Marcador previo: <strong>{goal.scoreBefore}</strong></span>
                                      <span>Tramo: <strong>{goal.minuteInterval}</strong></span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-900 text-xs">
                                  <span className="text-[10px] text-slate-500 font-mono">ID: {goal.id}</span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => onEditGoal(goal)}
                                      className="px-3 py-1 rounded-xl text-xs font-bold bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                      <span>Modificar Gol</span>
                                    </button>
                                    <span className="text-slate-700">•</span>
                                    <button
                                      onClick={() => {
                                        if (confirm(`¿Eliminar el gol de ${goal.scorer} al minuto ${goal.minute}?`)) {
                                          onDeleteGoal(goal.id);
                                        }
                                      }}
                                      className="text-[11px] text-rose-400 hover:text-rose-300 transition cursor-pointer"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
