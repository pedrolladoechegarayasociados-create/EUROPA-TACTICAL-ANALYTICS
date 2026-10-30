import React, { useState, useEffect } from 'react';
import { X, Check, Crosshair } from 'lucide-react';
import {
  Goal,
  Match,
  TacticalPhase,
  MinuteInterval,
  TACTICAL_CATEGORIES,
  MINUTE_INTERVALS,
} from '../types/football';
import { getTeamById } from '../data/teams';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGoal: (goal: Goal) => void;
  matches: Match[];
  editingGoal?: Goal | null;
  defaultMatchId?: string;
  defaultTeamId?: string;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  onSaveGoal,
  matches,
  editingGoal,
  defaultMatchId,
  defaultTeamId,
}) => {
  const [matchId, setMatchId] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [scorer, setScorer] = useState<string>('');
  const [assister, setAssister] = useState<string>('');
  const [minute, setMinute] = useState<number | string>(45);
  const [minuteInterval, setMinuteInterval] = useState<MinuteInterval>('31-45');
  const [scoreBefore, setScoreBefore] = useState<string>('0-0');
  const [tacticalPhase, setTacticalPhase] = useState<TacticalPhase>('DIRECTO');
  const [tacticalSubtype, setTacticalSubtype] = useState<string>(
    TACTICAL_CATEGORIES.DIRECTO.subtypes[0]
  );

  // Auto calculate minute interval when minute changes, allowing clean user typing
  const handleMinuteChange = (valStr: string) => {
    setMinute(valStr);
    const val = parseInt(valStr, 10);
    if (!isNaN(val) && val > 0) {
      if (val <= 15) setMinuteInterval('0-15');
      else if (val <= 30) setMinuteInterval('16-30');
      else if (val <= 45) setMinuteInterval('31-45');
      else if (val <= 60) setMinuteInterval('46-60');
      else if (val <= 75) setMinuteInterval('61-75');
      else if (val <= 90) setMinuteInterval('76-90+');
      else setMinuteInterval('ET');
    }
  };

  const selectedMatch = matches.find((m) => m.id === matchId) || matches[0];
  const currentCategory = (tacticalPhase && TACTICAL_CATEGORIES[tacticalPhase])
    ? TACTICAL_CATEGORIES[tacticalPhase]
    : TACTICAL_CATEGORIES.DIRECTO;

  useEffect(() => {
    if (editingGoal) {
      setMatchId(editingGoal.matchId);
      setSelectedTeamId(editingGoal.teamId);
      setScorer(editingGoal.scorer || '');
      setAssister(editingGoal.assister || '');
      setMinute(editingGoal.minute);
      setMinuteInterval(editingGoal.minuteInterval || '31-45');
      setScoreBefore(editingGoal.scoreBefore || '0-0');

      let targetPhase: TacticalPhase = 'DIRECTO';
      if (editingGoal.tacticalPhase && editingGoal.tacticalPhase !== 'PENDIENTE') {
        const raw = String(editingGoal.tacticalPhase).toUpperCase();
        if (raw in TACTICAL_CATEGORIES) {
          targetPhase = raw as TacticalPhase;
        } else if (raw.includes('DIRECT')) {
          targetPhase = 'DIRECTO';
        } else if (raw.includes('VERTIC')) {
          targetPhase = 'VERTICAL';
        } else if (raw.includes('ABP') || raw.includes('PARAD')) {
          targetPhase = 'ABP';
        } else if (raw.includes('TRANSIC')) {
          targetPhase = 'TRANSICION';
        } else if (raw.includes('POSICION')) {
          targetPhase = 'POSICIONAL';
        }
      }

      const cat = TACTICAL_CATEGORIES[targetPhase] || TACTICAL_CATEGORIES.DIRECTO;
      setTacticalPhase(targetPhase);
      if (
        editingGoal.tacticalPhase !== 'PENDIENTE' &&
        editingGoal.tacticalSubtype &&
        (cat.subtypes as readonly string[]).includes(editingGoal.tacticalSubtype)
      ) {
        setTacticalSubtype(editingGoal.tacticalSubtype);
      } else {
        setTacticalSubtype(cat.subtypes[0]);
      }
    } else {
      const initialMatchId = defaultMatchId || (matches[0]?.id ?? '');
      setMatchId(initialMatchId);
      const m = matches.find((match) => match.id === initialMatchId) || matches[0];
      if (m) {
        setSelectedTeamId(defaultTeamId || m.homeTeamId);
      }
      setScorer('');
      setAssister('');
      setMinute(35);
      setMinuteInterval('31-45');
      setScoreBefore('0-0');
      setTacticalPhase('DIRECTO');
      setTacticalSubtype(TACTICAL_CATEGORIES.DIRECTO.subtypes[0]);
    }
  }, [editingGoal, defaultMatchId, defaultTeamId, matches, isOpen]);

  // When match changes, default scoring team to the match's home team
  const handleMatchChange = (mId: string) => {
    setMatchId(mId);
    const m = matches.find((match) => match.id === mId);
    if (m) {
      setSelectedTeamId(m.homeTeamId);
    }
  };

  const handlePhaseChange = (phase: TacticalPhase) => {
    const validPhase = TACTICAL_CATEGORIES[phase] ? phase : 'DIRECTO';
    setTacticalPhase(validPhase);
    const cat = TACTICAL_CATEGORIES[validPhase] || TACTICAL_CATEGORIES.DIRECTO;
    setTacticalSubtype(cat.subtypes[0]);
  };

  if (!isOpen) return null;

  if (matches.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-center space-y-4">
          <h3 className="text-base font-bold text-white">Primero debes registrar una jornada</h3>
          <p className="text-xs text-slate-400">
            Para asociar un gol táctico a un partido, registra primero al menos una jornada entre los equipos de la liga.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const homeTeam = selectedMatch ? getTeamById(selectedMatch.homeTeamId) : null;
  const awayTeam = selectedMatch ? getTeamById(selectedMatch.awayTeamId) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scorer.trim()) {
      alert('Por favor introduce el nombre del autor del gol');
      return;
    }
    if (!matchId || !selectedMatch) {
      alert('Por favor selecciona un partido');
      return;
    }

    const numMinute = typeof minute === 'number' ? minute : parseInt(minute, 10);
    if (isNaN(numMinute) || numMinute < 1 || numMinute > 130) {
      alert('Por favor introduce un minuto válido (entre 1 y 130)');
      return;
    }

    const concedingTeamId =
      selectedTeamId === selectedMatch.homeTeamId
        ? selectedMatch.awayTeamId
        : selectedMatch.homeTeamId;

    const newGoal: Goal = {
      id: editingGoal ? editingGoal.id : `g-${Date.now()}`,
      matchId,
      teamId: selectedTeamId,
      concedingTeamId,
      scorer: scorer.trim(),
      assister: assister.trim() || undefined,
      minute: numMinute,
      minuteInterval,
      scoreBefore,
      tacticalPhase,
      tacticalSubtype,
    };

    onSaveGoal(newGoal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>{editingGoal ? 'Modificar Gol Registrado' : 'Registrar Gol Táctico'}</span>
                {editingGoal && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    Modo Edición
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {editingGoal
                  ? 'Modifica el minuto exacto, la categoría táctica, el subtipo, autor o marcador.'
                  : 'Selecciona el partido, equipo autor y cataloga la fase ofensiva detallada.'}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* Edit Mode Banner */}
          {editingGoal && (
            <div className="p-3 rounded-2xl bg-blue-950/70 border border-blue-500/40 text-xs text-blue-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shrink-0" />
                <span>
                  Modificando gol de <strong>{editingGoal.scorer}</strong> (registrado anteriormente en el <strong>minuto {editingGoal.minute}'</strong>, fase: <strong>{editingGoal.tacticalPhase}</strong>).
                </span>
              </div>
            </div>
          )}
          
          {/* Row 1: Match Selector & Team Scorer Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Partido Asociado *
              </label>
              <select
                value={matchId}
                onChange={(e) => handleMatchChange(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {matches.map((m) => {
                  const ht = getTeamById(m.homeTeamId);
                  const at = getTeamById(m.awayTeamId);
                  return (
                    <option key={m.id} value={m.id}>
                      Jornada {m.jornada}: {ht.shortName} {m.homeScore}-{m.awayScore} {at.shortName} ({m.date})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Team Scorer selection */}
            {selectedMatch && homeTeam && awayTeam && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Equipo Autor del Gol *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamId(homeTeam.id)}
                    className={`py-2 px-3 rounded-xl font-semibold text-xs transition border flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                      selectedTeamId === homeTeam.id
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: homeTeam.primaryColor }} />
                    <span className="truncate">{homeTeam.name} (Local)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTeamId(awayTeam.id)}
                    className={`py-2 px-3 rounded-xl font-semibold text-xs transition border flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                      selectedTeamId === awayTeam.id
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: awayTeam.primaryColor }} />
                    <span className="truncate">{awayTeam.name} (Visitante)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Scorer, Assister, Minute, Interval */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Goleador / Autor del Gol *
              </label>
              <input
                type="text"
                value={scorer}
                onChange={(e) => setScorer(e.target.value)}
                placeholder="Nombre del jugador que marcó el gol"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Asistente (opcional)
              </label>
              <input
                type="text"
                value={assister}
                onChange={(e) => setAssister(e.target.value)}
                placeholder="Jugador que dio el pase"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Minuto Exacto *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="130"
                  value={minute}
                  onChange={(e) => handleMinuteChange(e.target.value)}
                  required
                  placeholder="Min"
                  className="w-20 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-center font-bold text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs font-medium px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-blue-400">
                  {MINUTE_INTERVALS.find((i) => i.key === minuteInterval)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Tramo de Minutos Manual Selector & Marcador Previo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Tramo de Minutos Táctico
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {MINUTE_INTERVALS.filter((i) => i.key !== 'ET').map((int) => (
                  <button
                    key={int.key}
                    type="button"
                    onClick={() => setMinuteInterval(int.key)}
                    className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold border transition text-center cursor-pointer ${
                      minuteInterval === int.key
                        ? 'bg-blue-600 text-white border-blue-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {int.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Marcador Previo al Gol
              </label>
              <input
                type="text"
                value={scoreBefore}
                onChange={(e) => setScoreBefore(e.target.value)}
                placeholder="ej. 0-0, 1-0, 0-1"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-center text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* TACTICAL CATEGORY & DETAILED SUBTYPES */}
          <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/60 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <span>Categoría Táctica del Gol *</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Fase de juego en la que se originó el tanto
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(TACTICAL_CATEGORIES) as TacticalPhase[])
                  .filter((phase) => phase !== 'PENDIENTE')
                  .map((phase) => {
                  const cat = TACTICAL_CATEGORIES[phase];
                  const isSelected = tacticalPhase === phase;
                  return (
                    <button
                      key={phase}
                      type="button"
                      onClick={() => handlePhaseChange(phase)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? `${cat.badgeClass} ring-2 ring-blue-500/50 shadow-md`
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold leading-tight">{cat.name}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">
                        {cat.hasSubtypes ? `${cat.subtypes.length} subtipos` : 'Sin subtipos'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subtypes selection list */}
            {currentCategory.hasSubtypes ? (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Subtipo Específico ({currentCategory.shortName}) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentCategory.subtypes.map((sub) => {
                    const isSelected = tacticalSubtype === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => setTacticalSubtype(sub)}
                        className={`p-2.5 rounded-xl text-xs text-left border transition flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white font-medium shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                            isSelected ? 'bg-blue-500 text-white' : 'border border-slate-600 text-transparent'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                        </span>
                        <span>{sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>
                  Categoría directa: registrado como <strong>{currentCategory.shortName}</strong>.
                </span>
              </div>
            )}
          </div>



          {/* Footer Actions */}
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
              {editingGoal ? 'Guardar Cambios del Gol' : 'Confirmar y Guardar Gol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
