import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Camera, Shield, Flame, CheckCircle, RefreshCw } from 'lucide-react';
import { Match, Goal, TACTICAL_CATEGORIES, MINUTE_INTERVALS } from '../types/football';
import { LEAGUE_TEAMS, getTeamById } from '../data/teams';

interface ExportableTacticalCardProps {
  matches: Match[];
  goals: Goal[];
  selectedTeamId: string;
  onSelectTeamId: (teamId: string) => void;
}

export const ExportableTacticalCard: React.FC<ExportableTacticalCardProps> = ({
  matches,
  goals,
  selectedTeamId,
  onSelectTeamId,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const team = selectedTeamId !== 'ALL' ? getTeamById(selectedTeamId) : LEAGUE_TEAMS[11]; // default to CE Europa or selected

  // Matches for this team
  const teamMatches = matches.filter((m) => m.homeTeamId === team.id || m.awayTeamId === team.id);
  const teamGoalsFor = goals.filter((g) => g.teamId === team.id);
  const teamGoalsAgainst = goals.filter((g) => g.concedingTeamId === team.id);

  // Home / Away
  const homeMatches = teamMatches.filter((m) => m.homeTeamId === team.id);
  const awayMatches = teamMatches.filter((m) => m.awayTeamId === team.id);

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let homeWins = 0;
  let homeDraws = 0;
  let homeGF = 0;
  let homeGC = 0;
  let awayWins = 0;
  let awayDraws = 0;
  let awayGF = 0;
  let awayGC = 0;

  teamMatches.forEach((m) => {
    const isHome = m.homeTeamId === team.id;
    const ourScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;

    if (ourScore > oppScore) wins++;
    else if (ourScore === oppScore) draws++;
    else losses++;

    if (isHome) {
      homeGF += ourScore;
      homeGC += oppScore;
      if (ourScore > oppScore) homeWins++;
      else if (ourScore === oppScore) homeDraws++;
    } else {
      awayGF += ourScore;
      awayGC += oppScore;
      if (ourScore > oppScore) awayWins++;
      else if (ourScore === oppScore) awayDraws++;
    }
  });

  const totalPoints = wins * 3 + draws;
  const homePoints = homeWins * 3 + homeDraws;
  const awayPoints = awayWins * 3 + awayDraws;

  // Score management
  const startedWinningMatches = teamMatches.filter((m) => m.firstGoalTeamId === team.id);
  const ptsWhenWinningAchieved = startedWinningMatches.reduce((acc, m) => {
    const isHome = m.homeTeamId === team.id;
    const ourScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;
    if (ourScore > oppScore) return acc + 3;
    if (ourScore === oppScore) return acc + 1;
    return acc;
  }, 0);
  const winningRetentionPct = startedWinningMatches.length > 0
    ? Math.round((ptsWhenWinningAchieved / (startedWinningMatches.length * 3)) * 100)
    : 0;

  const startedLosingMatches = teamMatches.filter(
    (m) => m.firstGoalTeamId && m.firstGoalTeamId !== 'NONE' && m.firstGoalTeamId !== team.id
  );
  const ptsWhenLosingRescued = startedLosingMatches.reduce((acc, m) => {
    const isHome = m.homeTeamId === team.id;
    const ourScore = isHome ? m.homeScore : m.awayScore;
    const oppScore = isHome ? m.awayScore : m.homeScore;
    if (ourScore > oppScore) return acc + 3;
    if (ourScore === oppScore) return acc + 1;
    return acc;
  }, 0);
  const resiliencePct = startedLosingMatches.length > 0
    ? Math.round((ptsWhenLosingRescued / (startedLosingMatches.length * 3)) * 100)
    : 0;

  // Top scorers
  const scorersMap: Record<string, number> = {};
  teamGoalsFor.forEach((g) => {
    scorersMap[g.scorer] = (scorersMap[g.scorer] || 0) + 1;
  });
  const topScorers = Object.entries(scorersMap).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Native html2canvas download handler
  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#030712',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Ficha_Tactica_${team.shortName.replace(/\s+/g, '_')}_Jornadas_${teamMatches.length}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating canvas with html2canvas:', err);
      alert('Error al generar la imagen. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Tarjeta Táctica Oficial para Exportar (html2canvas)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Selecciona el equipo del que deseas generar la ficha y descárgala en PNG de alta resolución.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={team.id}
            onChange={(e) => onSelectTeamId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 cursor-pointer"
          >
            {LEAGUE_TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {exportSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              ¡PNG descargado!
            </span>
          )}

          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generando PNG...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Descargar Ficha Táctica (PNG)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* THE ACTUAL EXPORTABLE CARD (Captured by html2canvas) */}
      <div className="overflow-x-auto pb-4">
        <div
          ref={cardRef}
          id="tactical-stats-card"
          className="w-full min-w-[760px] max-w-4xl mx-auto p-8 rounded-3xl bg-slate-950 border-2 border-slate-800 text-slate-100 shadow-2xl relative overflow-hidden font-sans"
        >
          {/* Card Header */}
          <div className="relative z-10 flex items-center justify-between pb-6 border-b border-slate-800/80">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl font-black text-2xl border border-white/20"
                style={{ backgroundColor: team.primaryColor }}
              >
                {team.shortName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white uppercase">
                    {team.name}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    DEPARTAMENTO TÁCTICO
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Estadio {team.stadium} • {team.city} • Informe de Fases Tácticas y ABP
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                FICHA TÁCTICA
              </div>
              <div className="text-sm font-bold text-white">
                {teamMatches.length} Partidos Registrados
              </div>
              <div className="text-[11px] text-blue-400 font-semibold">
                {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-5 gap-3 my-6">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Partidos</span>
              <span className="text-2xl font-black text-white">{teamMatches.length}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{wins}V {draws}E {losses}D</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Puntos</span>
              <span className="text-2xl font-black text-blue-400">{totalPoints}</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                {teamMatches.length > 0 ? (totalPoints / teamMatches.length).toFixed(2) : 0} pts/p
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Goles Favor</span>
              <span className="text-2xl font-black text-emerald-400">{teamGoalsFor.length}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {teamMatches.length > 0 ? (teamGoalsFor.length / teamMatches.length).toFixed(1) : 0} por partido
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Goles Contra</span>
              <span className="text-2xl font-black text-rose-400">{teamGoalsAgainst.length}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {teamMatches.length > 0 ? (teamGoalsAgainst.length / teamMatches.length).toFixed(1) : 0} encajados/p
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dif. Goles</span>
              <span className={`text-2xl font-black ${teamGoalsFor.length - teamGoalsAgainst.length >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {teamGoalsFor.length - teamGoalsAgainst.length > 0 ? `+${teamGoalsFor.length - teamGoalsAgainst.length}` : teamGoalsFor.length - teamGoalsAgainst.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Balance</span>
            </div>
          </div>

          {/* Core Tactical Insights: Resilience & Home/Away */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            
            {/* Casa vs Fuera Box */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Rendimiento Casa vs Fuera
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="font-semibold text-blue-300">CASA ({team.stadium})</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-300">{homeMatches.length} PJ ({homeWins}V)</span>
                    <span className="text-emerald-400 font-bold">{homeGF} GF / {homeGC} GC</span>
                    <span className="px-2 py-0.5 rounded font-black bg-blue-500/20 text-blue-300 text-[11px]">{homePoints} pts</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="font-semibold text-indigo-300">FUERA (Visitante)</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-slate-300">{awayMatches.length} PJ ({awayWins}V)</span>
                    <span className="text-emerald-400 font-bold">{awayGF} GF / {awayGC} GC</span>
                    <span className="px-2 py-0.5 rounded font-black bg-indigo-500/20 text-indigo-300 text-[11px]">{awayPoints} pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Marcador Management & Comebacks */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                <span>Gestión de Marcador & Resiliencia</span>
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <Flame className="w-3 h-3" /> COMPETITIVIDAD
                </span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div>
                    <span className="font-semibold text-emerald-300 block">Al Empezar Ganando</span>
                    <span className="text-[10px] text-slate-400">{startedWinningMatches.length} partidos adelantándose</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{winningRetentionPct}% puntos retenidos</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div>
                    <span className="font-semibold text-amber-300 block">Al Empezar Perdiendo (Remontadas)</span>
                    <span className="text-[10px] text-slate-400">{startedLosingMatches.length} partidos por detrás</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">{resiliencePct}% resiliencia ({ptsWhenLosingRescued} pts)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Tactical Phases & Minute Distribution */}
          <div className="grid grid-cols-12 gap-4 mb-6">
            
            {/* Categorías Tácticas (7 cols) */}
            <div className="col-span-7 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Goles a Favor por Fase Táctica
              </h3>

              <div className="space-y-2">
                {(['DIRECTO', 'VERTICAL', 'ABP', 'TRANSICION', 'POSICIONAL'] as const).map((catKey) => {
                  const cat = TACTICAL_CATEGORIES[catKey];
                  const count = teamGoalsFor.filter((g) => g.tacticalPhase === catKey).length;
                  const pct = teamGoalsFor.length > 0 ? Math.round((count / teamGoalsFor.length) * 100) : 0;
                  return (
                    <div key={catKey} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-200">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white">{count}</span>
                          <span className="font-mono text-[11px] text-slate-400">{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subtipos de ABP */}
              <div className="mt-3 pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Especialidad ABP (Falta lateral, frontal, directa, esquina, penalti, banda):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {teamGoalsFor
                    .filter((g) => g.tacticalPhase === 'ABP')
                    .map((g) => (
                      <span
                        key={g.id}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-800/60"
                      >
                        {g.tacticalSubtype} ({g.scorer} {g.minute}')
                      </span>
                    ))}
                  {teamGoalsFor.filter((g) => g.tacticalPhase === 'ABP').length === 0 && (
                    <span className="text-[10px] text-slate-500 italic">0 goles de ABP catalogados</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tramos de Minutos (5 cols) */}
            <div className="col-span-5 p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Tramos de Minutos (Goles Anotados)
                </h3>

                <div className="space-y-2">
                  {MINUTE_INTERVALS.filter((i) => i.key !== 'ET').map((int) => {
                    const count = teamGoalsFor.filter((g) => g.minuteInterval === int.key).length;
                    return (
                      <div key={int.key} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-slate-400 w-12 text-[11px]">{int.label}</span>
                        <div className="flex-1 h-3 bg-slate-950 rounded overflow-hidden p-0.5 border border-slate-800">
                          {count > 0 && (
                            <div
                              style={{ width: `${Math.min(100, count * 33)}%` }}
                              className="bg-blue-500 rounded-sm text-[8px] font-black text-white flex items-center justify-center h-full"
                            >
                              {count}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Scorers */}
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Máximos Goleadores
                </span>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 flex-wrap">
                  {topScorers.map(([scorer, count]) => (
                    <span key={scorer} className="bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                      {scorer} <span className="text-blue-400 font-mono">({count})</span>
                    </span>
                  ))}
                  {topScorers.length === 0 && (
                    <span className="text-[11px] text-slate-500 italic">Sin goleadores registrados</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer watermark */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-800/80">
            <span>{team.name} • Tactical Hub Liga Oficial</span>
            <span className="font-mono">Generado nativamente con html2canvas</span>
          </div>
        </div>
      </div>
    </div>
  );
};
