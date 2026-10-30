import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Trophy } from 'lucide-react';
import { Match } from '../types/football';
import { LEAGUE_TEAMS, getTeamById } from '../data/teams';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMatch: (match: Match) => void;
  editingMatch?: Match | null;
  nextJornadaNumber: number;
  defaultHomeTeamId?: string;
}

export const MatchModal: React.FC<MatchModalProps> = ({
  isOpen,
  onClose,
  onSaveMatch,
  editingMatch,
  nextJornadaNumber,
  defaultHomeTeamId,
}) => {
  const [jornada, setJornada] = useState<number>(nextJornadaNumber);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [homeTeamId, setHomeTeamId] = useState<string>(defaultHomeTeamId || 'ce-europa');
  const [awayTeamId, setAwayTeamId] = useState<string>('ue-sant-andreu');
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [competition, setCompetition] = useState<string>('Primera Federación / Liga');
  const [stadium, setStadium] = useState<string>('Nou Sardenya');
  const [firstGoalTeamId, setFirstGoalTeamId] = useState<string>('home');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingMatch) {
      setJornada(editingMatch.jornada);
      setDate(editingMatch.date);
      setHomeTeamId(editingMatch.homeTeamId);
      setAwayTeamId(editingMatch.awayTeamId);
      setHomeScore(editingMatch.homeScore);
      setAwayScore(editingMatch.awayScore);
      setCompetition(editingMatch.competition);
      setStadium(editingMatch.stadium);
      if (editingMatch.firstGoalTeamId === editingMatch.homeTeamId) setFirstGoalTeamId('home');
      else if (editingMatch.firstGoalTeamId === editingMatch.awayTeamId) setFirstGoalTeamId('away');
      else setFirstGoalTeamId('NONE');
      setNotes(editingMatch.notes || '');
    } else {
      setJornada(nextJornadaNumber);
      setDate(new Date().toISOString().split('T')[0]);
      const initialHome = defaultHomeTeamId || 'ce-europa';
      setHomeTeamId(initialHome);
      const homeTeam = getTeamById(initialHome);
      setStadium(homeTeam.stadium);
      // Select an away team different from home
      const initialAway = LEAGUE_TEAMS.find((t) => t.id !== initialHome)?.id || 'ue-sant-andreu';
      setAwayTeamId(initialAway);
      setHomeScore(0);
      setAwayScore(0);
      setCompetition('Primera Federación / Liga');
      setFirstGoalTeamId('home');
      setNotes('');
    }
  }, [editingMatch, nextJornadaNumber, defaultHomeTeamId, isOpen]);

  // When home team changes, auto-update stadium
  const handleHomeTeamChange = (teamId: string) => {
    setHomeTeamId(teamId);
    const team = getTeamById(teamId);
    setStadium(team.stadium);
    if (awayTeamId === teamId) {
      const nextAway = LEAGUE_TEAMS.find((t) => t.id !== teamId)?.id || '';
      setAwayTeamId(nextAway);
    }
  };

  if (!isOpen) return null;

  const homeTeam = getTeamById(homeTeamId);
  const awayTeam = getTeamById(awayTeamId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeTeamId === awayTeamId) {
      alert('El equipo local y visitante no pueden ser el mismo');
      return;
    }

    let actualFirstGoalId: string | 'NONE' = 'NONE';
    if (firstGoalTeamId === 'home') actualFirstGoalId = homeTeamId;
    else if (firstGoalTeamId === 'away') actualFirstGoalId = awayTeamId;

    const match: Match = {
      id: editingMatch ? editingMatch.id : `m-${Date.now()}`,
      jornada: Number(jornada),
      date,
      homeTeamId,
      awayTeamId,
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      competition: competition.trim(),
      stadium: stadium.trim(),
      firstGoalTeamId: actualFirstGoalId,
      notes: notes.trim() || undefined,
    };

    onSaveMatch(match);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                {editingMatch ? `Editar Partido Jornada ${editingMatch.jornada}` : 'Registrar Nuevo Partido de Liga'}
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona los dos equipos participantes entre los 20 clubes oficiales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Número de Jornada *
              </label>
              <input
                type="number"
                min="1"
                max="38"
                value={jornada}
                onChange={(e) => setJornada(parseInt(e.target.value, 10))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-semibold text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Fecha del Encuentro *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Teams Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-blue-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Equipo Local (CASA) *</span>
              </label>
              <select
                value={homeTeamId}
                onChange={(e) => handleHomeTeamChange(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {LEAGUE_TEAMS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>Equipo Visitante (FUERA) *</span>
              </label>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {LEAGUE_TEAMS.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === homeTeamId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Score inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Goles {homeTeam.shortName} (Local)
              </label>
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-xl font-bold text-blue-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Goles {awayTeam.shortName} (Visitante)
              </label>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center text-xl font-bold text-indigo-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Who scored first */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              ¿Quién marcó el primer gol? (Para métrica de resiliencia y ventajas)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFirstGoalTeamId('home')}
                className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition cursor-pointer truncate ${
                  firstGoalTeamId === 'home'
                    ? 'bg-blue-600/30 border-blue-400 text-blue-300 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {homeTeam.shortName} (Local)
              </button>
              <button
                type="button"
                onClick={() => setFirstGoalTeamId('away')}
                className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition cursor-pointer truncate ${
                  firstGoalTeamId === 'away'
                    ? 'bg-indigo-600/30 border-indigo-400 text-indigo-300 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {awayTeam.shortName} (Visitante)
              </button>
              <button
                type="button"
                onClick={() => setFirstGoalTeamId('NONE')}
                className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                  firstGoalTeamId === 'NONE'
                    ? 'bg-slate-700 border-slate-500 text-white font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Sin goles (0-0)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Competición
              </label>
              <input
                type="text"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Estadio
              </label>
              <input
                type="text"
                value={stadium}
                onChange={(e) => setStadium(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Observaciones Tácticas del Partido
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Planteamiento de bloque alto, juego directo, faltas laterales peligrosas..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition active:scale-95 cursor-pointer"
            >
              {editingMatch ? 'Guardar Partido' : 'Registrar Partido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
