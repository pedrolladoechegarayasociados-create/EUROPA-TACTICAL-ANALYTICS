import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Match, Goal } from './types/football';
import { INITIAL_MATCHES, INITIAL_GOALS, SAMPLE_MATCHES, SAMPLE_GOALS } from './data/initialData';
import { LEAGUE_TEAMS } from './data/teams';
import { Header } from './components/Header';
import { MetricsDashboard } from './components/MetricsDashboard';
import { LeagueStandings } from './components/LeagueStandings';
import { MatchesList } from './components/MatchesList';
import { ExportableTacticalCard } from './components/ExportableTacticalCard';
import { GoalModal } from './components/GoalModal';
import { MatchModal } from './components/MatchModal';
import { StandaloneHtmlModal } from './components/StandaloneHtmlModal';
import { SupabaseModal } from './components/SupabaseModal';
import {
  getSupabaseConfig,
  saveMatchToSupabase,
  saveGoalToSupabase,
  deleteMatchFromSupabase,
  deleteGoalFromSupabase,
  fetchMatchesFromSupabase,
  fetchGoalsFromSupabase,
} from './lib/supabase';

export default function App() {
  // Empty data by default as explicitly requested by user:
  // "los datos los puedes eliminar y los ire metiendo yo. pero necesito poder ver y capturar datos de todos los equipos de la liga, no solo del europa."
  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem('liga_tactical_matches_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_MATCHES;
    } catch (e) {
      return INITIAL_MATCHES;
    }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem('liga_tactical_goals_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((g: Goal) => g.id));
          const missing = INITIAL_GOALS.filter((g) => !existingIds.has(g.id));
          return [...parsed, ...missing];
        }
      }
      return INITIAL_GOALS;
    } catch (e) {
      return INITIAL_GOALS;
    }
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'standings' | 'matches' | 'card'>('standings');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [defaultMatchIdForGoal, setDefaultMatchIdForGoal] = useState<string>('');
  const [defaultTeamIdForGoal, setDefaultTeamIdForGoal] = useState<string>('');

  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const supabaseConfig = getSupabaseConfig();
  const isSupabaseConnected = supabaseConfig.isConfigured;

  // On mount, if Supabase is configured, fetch remote data
  useEffect(() => {
    if (supabaseConfig.isConfigured) {
      fetchMatchesFromSupabase().then((remoteMatches) => {
        if (remoteMatches && remoteMatches.length > 0) {
          setMatches(remoteMatches);
        }
      });
      fetchGoalsFromSupabase().then((remoteGoals) => {
        if (remoteGoals && remoteGoals.length > 0) {
          setGoals(remoteGoals);
        }
      });
    }
  }, [supabaseConfig.isConfigured]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('liga_tactical_matches_v4', JSON.stringify(matches));
    } catch (e) {
      console.error('Failed to save matches', e);
    }
  }, [matches]);

  useEffect(() => {
    try {
      localStorage.setItem('liga_tactical_goals_v4', JSON.stringify(goals));
    } catch (e) {
      console.error('Failed to save goals', e);
    }
  }, [goals]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Clear data
  const handleClearData = () => {
    if (confirm('¿Vaciar los datos actuales para empezar desde cero o prefieres restaurar las 9 jornadas oficiales?')) {
      setMatches([]);
      setGoals([]);
      showToast('Base de datos vaciada.');
    }
  };

  // Restore the 90 official matches extracted from the user's screenshots
  const handleRestoreOfficialMatches = () => {
    if (confirm('¿Cargar las 9 jornadas oficiales (90 partidos) registradas a partir de tus actas?')) {
      setMatches(INITIAL_MATCHES);
      showToast('90 partidos oficiales (Jornadas 1 a 9) cargados.');
    }
  };

  // Load sample data for quick preview if requested
  const handleLoadSampleData = () => {
    if (confirm('¿Cargar algunos partidos y goles de muestra de la liga para probar la app?')) {
      setMatches(SAMPLE_MATCHES);
      setGoals(SAMPLE_GOALS);
      showToast('Partidos de muestra cargados.');
    }
  };

  // Download standalone app_europa.html directly
  const handleDownloadStandaloneHtml = async () => {
    try {
      const res = await fetch('/app_europa.html');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'app_europa.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('¡Archivo único "app_europa.html" descargado a tu ordenador!');
    } catch (err) {
      console.error('Download error:', err);
      window.open('/app_europa.html', '_blank');
    }
  };

  // Goal actions
  const handleOpenNewGoal = (matchId?: string, teamId?: string) => {
    if (matches.length === 0) {
      alert('Primero debes registrar al menos un partido para poder asociarle goles.');
      setIsMatchModalOpen(true);
      return;
    }
    setEditingGoal(null);
    setDefaultMatchIdForGoal(matchId || matches[0]?.id || '');
    setDefaultTeamIdForGoal(teamId || (selectedTeamId !== 'ALL' ? selectedTeamId : ''));
    setIsGoalModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setDefaultMatchIdForGoal(goal.matchId);
    setDefaultTeamIdForGoal(goal.teamId);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (goalToSave: Goal) => {
    setGoals((prev) => {
      const exists = prev.some((g) => g.id === goalToSave.id);
      if (exists) {
        return prev.map((g) => (g.id === goalToSave.id ? goalToSave : g));
      } else {
        return [...prev, goalToSave];
      }
    });

    if (!editingGoal) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    saveGoalToSupabase(goalToSave);
    showToast(`Gol de ${goalToSave.scorer} (${goalToSave.minute}') guardado.`);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    deleteGoalFromSupabase(goalId);
    showToast('Gol eliminado.');
  };

  // Match actions
  const handleOpenNewMatch = () => {
    setEditingMatch(null);
    setIsMatchModalOpen(true);
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setIsMatchModalOpen(true);
  };

  const handleSaveMatch = (matchToSave: Match) => {
    setMatches((prev) => {
      const exists = prev.some((m) => m.id === matchToSave.id);
      if (exists) {
        return prev.map((m) => (m.id === matchToSave.id ? matchToSave : m));
      } else {
        return [...prev, matchToSave];
      }
    });
    saveMatchToSupabase(matchToSave);
    showToast(`Jornada ${matchToSave.jornada} guardada.`);
  };

  const handleDeleteMatch = (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
    setGoals((prev) => prev.filter((g) => g.matchId !== matchId));
    deleteMatchFromSupabase(matchId);
    showToast('Partido eliminado.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 text-white font-semibold text-xs shadow-xl shadow-blue-600/30 border border-blue-400/40 animate-bounce">
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedTeamId={selectedTeamId}
        onSelectTeamId={setSelectedTeamId}
        onOpenNewGoal={() => handleOpenNewGoal()}
        onOpenNewMatch={handleOpenNewMatch}
        onDownloadHtml={handleDownloadStandaloneHtml}
        onOpenCodeViewer={() => setIsCodeModalOpen(true)}
        onOpenSupabase={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        onClearData={handleClearData}
        totalMatches={matches.length}
        totalGoals={goals.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* If empty, show helpful empty state banner */}
        {matches.length === 0 && (
          <div className="mb-6 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>📋 Base de datos limpia y lista para tus registros</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Hemos preparado la liga con los <strong>20 equipos oficiales</strong> de tu grupo. Puedes empezar a introducir tus jornadas y goles ahora.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleRestoreOfficialMatches}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow transition cursor-pointer"
              >
                Restaurar 90 Partidos Oficiales (J1-J9)
              </button>
              <button
                onClick={handleOpenNewMatch}
                className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              >
                + Registrar Partido
              </button>
            </div>
          </div>
        )}

        {activeTab === 'standings' && (
          <LeagueStandings
            matches={matches}
            goals={goals}
            onSelectTeam={(teamId) => {
              setSelectedTeamId(teamId);
              setActiveTab('dashboard');
            }}
            onOpenNewMatch={handleOpenNewMatch}
          />
        )}

        {activeTab === 'dashboard' && (
          <MetricsDashboard
            matches={matches}
            goals={goals}
            selectedTeamId={selectedTeamId}
            onSelectTeamId={setSelectedTeamId}
            onOpenNewGoal={() => handleOpenNewGoal()}
            onOpenNewMatch={handleOpenNewMatch}
          />
        )}

        {activeTab === 'matches' && (
          <MatchesList
            matches={matches}
            goals={goals}
            selectedTeamId={selectedTeamId}
            onSelectTeamId={setSelectedTeamId}
            onOpenNewMatch={handleOpenNewMatch}
            onEditMatch={handleEditMatch}
            onDeleteMatch={handleDeleteMatch}
            onOpenNewGoalForMatch={(mId, tId) => handleOpenNewGoal(mId, tId)}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'card' && (
          <ExportableTacticalCard
            matches={matches}
            goals={goals}
            selectedTeamId={selectedTeamId}
            onSelectTeamId={setSelectedTeamId}
          />
        )}
      </main>

      {/* Modals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSaveGoal={handleSaveGoal}
        matches={matches}
        editingGoal={editingGoal}
        defaultMatchId={defaultMatchIdForGoal}
        defaultTeamId={defaultTeamIdForGoal}
      />

      <MatchModal
        isOpen={isMatchModalOpen}
        onClose={() => setIsMatchModalOpen(false)}
        onSaveMatch={handleSaveMatch}
        editingMatch={editingMatch}
        nextJornadaNumber={matches.length > 0 ? Math.max(...matches.map((m) => m.jornada)) + 1 : 1}
        defaultHomeTeamId={selectedTeamId !== 'ALL' ? selectedTeamId : 'ce-europa'}
      />

      <StandaloneHtmlModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        onDownload={handleDownloadStandaloneHtml}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        matches={matches}
        goals={goals}
        onDataSynced={(syncedMatches, syncedGoals) => {
          setMatches(syncedMatches);
          setGoals(syncedGoals);
        }}
        showToast={showToast}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Liga Tactical Hub</span>
            <span>•</span>
            <span>20 Clubes Oficiales</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Posicional, ABP, Vertical, Directo, Contra</span>
            <span>•</span>
            <button
              onClick={handleDownloadStandaloneHtml}
              className="text-emerald-400 hover:text-emerald-300 font-mono transition cursor-pointer"
            >
              app_europa.html (Descargar)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
