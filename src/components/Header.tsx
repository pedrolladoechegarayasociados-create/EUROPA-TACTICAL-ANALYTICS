import React from 'react';
import { Shield, Plus, Download, BarChart3, Calendar, FileCode, Trash2, ListOrdered, Database } from 'lucide-react';
import { Team } from '../types/football';
import { LEAGUE_TEAMS } from '../data/teams';

interface HeaderProps {
  activeTab: 'dashboard' | 'standings' | 'matches' | 'card';
  setActiveTab: (tab: 'dashboard' | 'standings' | 'matches' | 'card') => void;
  selectedTeamId: string;
  onSelectTeamId: (teamId: string) => void;
  onOpenNewGoal: () => void;
  onOpenNewMatch: () => void;
  onDownloadHtml: () => void;
  onOpenCodeViewer: () => void;
  onOpenSupabase: () => void;
  isSupabaseConnected: boolean;
  onClearData: () => void;
  totalMatches: number;
  totalGoals: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedTeamId,
  onSelectTeamId,
  onOpenNewGoal,
  onOpenNewMatch,
  onDownloadHtml,
  onOpenCodeViewer,
  onOpenSupabase,
  isSupabaseConnected,
  onClearData,
  totalMatches,
  totalGoals,
}) => {
  const currentTeam = selectedTeamId !== 'ALL' ? LEAGUE_TEAMS.find((t) => t.id === selectedTeamId) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Brand & Actions Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          
          {/* Logo & League Selector */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <Shield className="w-6 h-6 text-white" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-black text-slate-950">
                20
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Liga Tactical Hub</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    20 Equipos Oficiales
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Captura y análisis táctico de goles, ABP, posicional y métricas para todos los clubes
              </p>
            </div>
          </div>

          {/* Active Team Filter Dropdown & Actions */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Team Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-2 pr-1 hidden sm:inline">
                Equipo:
              </span>
              <select
                value={selectedTeamId}
                onChange={(e) => onSelectTeamId(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer max-w-[200px]"
              >
                <option value="ALL">🌐 Toda la Liga (20 Equipos)</option>
                {LEAGUE_TEAMS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenNewGoal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar Gol</span>
            </button>

            <button
              onClick={onOpenNewMatch}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Jornada</span>
            </button>

            {/* Supabase Connection Button */}
            <button
              onClick={onOpenSupabase}
              title="Conectar con tu base de datos Supabase"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition active:scale-95 cursor-pointer ${
                isSupabaseConnected
                  ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Supabase</span>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            </button>

            {/* Standalone HTML Download Button */}
            <button
              onClick={onDownloadHtml}
              title="Descargar la app en un único archivo app_europa.html funcional para usar sin internet"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/40 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Descargar</span>
              <span className="font-mono text-[11px] bg-emerald-950 px-1 py-0.5 rounded border border-emerald-600/40">app_europa.html</span>
            </button>

            <button
              onClick={onOpenCodeViewer}
              title="Ver código fuente HTML único"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition cursor-pointer"
            >
              <FileCode className="w-4 h-4" />
            </button>

            <button
              onClick={onClearData}
              title="Limpiar datos introducidos"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg border border-slate-800 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-800/80 -mb-px space-x-6 overflow-x-auto text-sm">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 py-3 border-b-2 font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>
              {currentTeam ? `Análisis Táctico: ${currentTeam.shortName}` : 'Análisis Táctico de Liga'}
            </span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
              {totalGoals} goles
            </span>
          </button>

          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-2 py-3 border-b-2 font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'standings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Clasificación y Tabla (20 Equipos)</span>
          </button>

          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 py-3 border-b-2 font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'matches'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jornadas y Partidos</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] bg-slate-800 text-slate-300 border border-slate-700">
              {totalMatches} partidos
            </span>
          </button>

          <button
            onClick={() => setActiveTab('card')}
            className={`flex items-center gap-2 py-3 border-b-2 font-medium transition whitespace-nowrap cursor-pointer ${
              activeTab === 'card'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Tarjeta Táctica (Exportar PNG)</span>
            <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              html2canvas
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
