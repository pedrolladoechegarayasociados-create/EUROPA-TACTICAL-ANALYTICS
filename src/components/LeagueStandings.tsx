import React from 'react';
import { Trophy, ArrowUpRight, ArrowDownRight, ChevronRight, MapPin, Eye } from 'lucide-react';
import { Match, Goal } from '../types/football';
import { LEAGUE_TEAMS } from '../data/teams';

interface LeagueStandingsProps {
  matches: Match[];
  goals: Goal[];
  onSelectTeam: (teamId: string) => void;
  onOpenNewMatch: () => void;
}

export const LeagueStandings: React.FC<LeagueStandingsProps> = ({
  matches,
  goals,
  onSelectTeam,
  onOpenNewMatch,
}) => {
  // Compute table for each of the 20 teams
  const standings = LEAGUE_TEAMS.map((team) => {
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let gf = 0;
    let gc = 0;

    matches.forEach((m) => {
      if (m.homeTeamId === team.id) {
        played++;
        gf += m.homeScore;
        gc += m.awayScore;
        if (m.homeScore > m.awayScore) won++;
        else if (m.homeScore === m.awayScore) drawn++;
        else lost++;
      } else if (m.awayTeamId === team.id) {
        played++;
        gf += m.awayScore;
        gc += m.homeScore;
        if (m.awayScore > m.homeScore) won++;
        else if (m.awayScore === m.homeScore) drawn++;
        else lost++;
      }
    });

    const pts = won * 3 + drawn;
    const gd = gf - gc;
    const teamGoals = goals.filter((g) => g.teamId === team.id);
    const abpGoals = teamGoals.filter((g) => g.tacticalPhase === 'ABP').length;

    return {
      team,
      played,
      won,
      drawn,
      lost,
      gf,
      gc,
      gd,
      pts,
      abpGoals,
    };
  });

  // Sort by Points (descending), then Goal Difference, then Goals For
  standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Clasificación y Rendimiento de la Liga
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
              20 Equipos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Haz clic en cualquier equipo para acceder a su ficha táctica detallada, zonas de remate y análisis de ABP.
          </p>
        </div>

        <button
          onClick={onOpenNewMatch}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition cursor-pointer self-start sm:self-center"
        >
          <span>+ Registrar Partido de Liga</span>
        </button>
      </div>

      {/* Standings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">Pos</th>
                <th className="py-3 px-4">Equipo</th>
                <th className="py-3 px-2 text-center">PJ</th>
                <th className="py-3 px-2 text-center">V</th>
                <th className="py-3 px-2 text-center">E</th>
                <th className="py-3 px-2 text-center">D</th>
                <th className="py-3 px-2 text-center">GF</th>
                <th className="py-3 px-2 text-center">GC</th>
                <th className="py-3 px-2 text-center">DG</th>
                <th className="py-3 px-3 text-center">PTS</th>
                <th className="py-3 px-2 text-center">Goles ABP</th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {standings.map((row, idx) => {
                const pos = idx + 1;
                const isLeader = pos === 1;
                const isPlayoff = pos >= 2 && pos <= 5;
                const isRelegation = pos >= 16;

                return (
                  <tr
                    key={row.team.id}
                    onClick={() => onSelectTeam(row.team.id)}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    <td className="py-3 px-3 text-center font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${
                          isLeader
                            ? 'bg-blue-600 text-white shadow'
                            : isPlayoff
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : isRelegation
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {pos}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-sm"
                          style={{ backgroundColor: row.team.primaryColor }}
                        />
                        <div>
                          <div className="font-bold text-slate-100 group-hover:text-blue-400 transition flex items-center gap-1.5">
                            <span>{row.team.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-normal flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{row.team.stadium}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center text-slate-200">{row.played}</td>
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">{row.won}</td>
                    <td className="py-3 px-2 text-center text-amber-400 font-bold">{row.drawn}</td>
                    <td className="py-3 px-2 text-center text-rose-400 font-bold">{row.lost}</td>
                    <td className="py-3 px-2 text-center text-emerald-400 font-bold">{row.gf}</td>
                    <td className="py-3 px-2 text-center text-rose-400 font-bold">{row.gc}</td>
                    <td className="py-3 px-2 text-center text-slate-300 font-bold">
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </td>
                    <td className="py-3 px-3 text-center text-blue-400 font-black text-sm">
                      {row.pts}
                    </td>
                    <td className="py-3 px-2 text-center text-amber-300 font-semibold">
                      {row.abpGoals}
                    </td>

                    <td className="py-3 px-3 text-center font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTeam(row.team.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[11px] font-semibold transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Ver Táctica</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-600" />
            <span>1º Ascenso Directo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
            <span>2º - 5º Playoff de Ascenso</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-600" />
            <span>16º - 20º Descenso</span>
          </div>
        </div>
      </div>
    </div>
  );
};
