import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  Shield,
  FileImage,
  Clipboard,
} from 'lucide-react';
import { Match, Goal, TacticalPhase, MinuteInterval, TACTICAL_CATEGORIES } from '../types/football';
import { LEAGUE_TEAMS, getTeamById } from '../data/teams';

interface ScanMatchScreenshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveMatchAndGoals: (newMatch: Match, newGoals: Goal[]) => void;
  showToast?: (msg: string) => void;
}

interface DetectedGoal {
  id: string;
  teamSide: 'HOME' | 'AWAY';
  teamName?: string;
  scorer: string;
  assister: string;
  minute: number;
  tacticalPhase: TacticalPhase;
  tacticalSubtype: string;
  isOwnGoal?: boolean;
  isPenalty?: boolean;
}

// Smart team matcher from OCR / Vision text to LEAGUE_TEAMS ID
export function matchTeamByName(rawName: string): string {
  if (!rawName) return LEAGUE_TEAMS[0].id;
  const clean = rawName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  // Keyword mappings
  if (clean.includes('huesca')) return 'sd-huesca';
  if (clean.includes('gimnastic') || clean.includes('nastic') || clean.includes('tarragona')) return 'gimnastic-tarragona';
  if (clean.includes('hercules') || clean.includes('alicante')) return 'hercules-alicante';
  if (clean.includes('majadahonda') || clean.includes('rayo')) return 'rayo-majadahonda';
  if (clean.includes('torremolinos') || clean.includes('juventud')) return 'juventud-torremolinos';
  if (clean.includes('aguilas')) return 'aguilas-fc';
  if (clean.includes('jaen')) return 'real-jaen';
  if (clean.includes('algeciras')) return 'algeciras-cf';
  if (clean.includes('antequera')) return 'antequera-cf';
  if (clean.includes('murcia')) return 'real-murcia';
  if (clean.includes('europa')) return 'ce-europa';
  if (clean.includes('ibiza')) return 'ud-ibiza';
  if (clean.includes('alcorcon')) return 'ad-alcorcon';
  if (clean.includes('villarreal')) return 'villarreal-b';
  if (clean.includes('madrideno') || clean.includes('atletico')) return 'atletico-madrideno';
  if (clean.includes('castilla') || clean.includes('real madrid')) return 'rm-castilla';
  if (clean.includes('zaragoza') || clean.includes('aragon')) return 'real-zaragoza';
  if (clean.includes('cartagena')) return 'fc-cartagena';
  if (clean.includes('sant andreu') || clean.includes('andreu')) return 'ue-sant-andreu';
  if (clean.includes('betis')) return 'betis-deportivo';

  // Fallback to exact or partial match
  const found = LEAGUE_TEAMS.find((t) => {
    const tClean = t.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sClean = t.shortName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return clean.includes(tClean) || tClean.includes(clean) || clean.includes(sClean);
  });

  return found ? found.id : LEAGUE_TEAMS[0].id;
}

export function calculateMinuteInterval(minute: number): MinuteInterval {
  if (minute <= 15) return '0-15';
  if (minute <= 30) return '16-30';
  if (minute <= 45) return '31-45';
  if (minute <= 60) return '46-60';
  if (minute <= 75) return '61-75';
  return '76-90+';
}

export const ScanMatchScreenshotModal: React.FC<ScanMatchScreenshotModalProps> = ({
  isOpen,
  onClose,
  onSaveMatchAndGoals,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Extracted / Editable Match State
  const [jornada, setJornada] = useState<number>(10);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [homeTeamId, setHomeTeamId] = useState<string>(LEAGUE_TEAMS[0].id);
  const [awayTeamId, setAwayTeamId] = useState<string>(LEAGUE_TEAMS[1].id);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [stadium, setStadium] = useState<string>('');
  const [detectedGoals, setDetectedGoals] = useState<DetectedGoal[]>([]);
  const [hasScannedResult, setHasScannedResult] = useState<boolean>(false);

  // Global paste handler to support Ctrl+V anywhere
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleImageFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Por favor sube un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      // Auto-trigger scan
      scanImageWithAI(result, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const scanImageWithAI = async (base64Image: string, mimeType: string) => {
    try {
      setIsScanning(true);
      setError(null);
      setScanStep('Analizando captura con Gemini Vision...');

      const response = await fetch('/api/scan-match-screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType: mimeType || 'image/jpeg',
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.details || `Error del servidor (${response.status})`);
      }

      setScanStep('Extrayendo equipos, marcador y detalles de goles...');
      const resData = await response.json();
      const matchData = resData.data;

      if (!matchData) {
        throw new Error('No se han podido extraer datos de la captura.');
      }

      // 1. Process teams
      const detectedHomeId = matchTeamByName(matchData.homeTeamName || '');
      let detectedAwayId = matchTeamByName(matchData.awayTeamName || '');
      if (detectedAwayId === detectedHomeId) {
        detectedAwayId = LEAGUE_TEAMS.find((t) => t.id !== detectedHomeId)?.id || LEAGUE_TEAMS[1].id;
      }

      setHomeTeamId(detectedHomeId);
      setAwayTeamId(detectedAwayId);
      setHomeScore(Number(matchData.homeScore ?? 0));
      setAwayScore(Number(matchData.awayScore ?? 0));

      if (matchData.jornada) {
        setJornada(Number(matchData.jornada));
      }

      if (matchData.date) {
        setDate(matchData.date);
      }

      const homeTeamObj = getTeamById(detectedHomeId);
      setStadium(homeTeamObj.stadium || '');

      // 2. Process goals
      const rawGoals = Array.isArray(matchData.goals) ? matchData.goals : [];
      const parsedGoals: DetectedGoal[] = rawGoals.map((g: any, idx: number) => {
        const side = g.teamSide === 'AWAY' ? 'AWAY' : 'HOME';
        const minute = Math.max(1, Math.min(120, Number(g.minute) || (idx + 1) * 20));

        // Suggested preliminary typology based on notes or penalty
        let suggestedPhase: TacticalPhase = 'POSICIONAL';
        let suggestedSubtype = 'Centro lateral';

        if (g.isPenalty) {
          suggestedPhase = 'ABP';
          suggestedSubtype = 'Penalti';
        } else if (g.isOwnGoal) {
          suggestedPhase = 'DIRECTO';
          suggestedSubtype = 'Juego Directo';
        } else if (minute >= 75) {
          suggestedPhase = 'TRANSICION';
          suggestedSubtype = 'Transición';
        }

        return {
          id: `scanned-goal-${Date.now()}-${idx}`,
          teamSide: side,
          teamName: side === 'HOME' ? homeTeamObj.name : getTeamById(detectedAwayId).name,
          scorer: String(g.scorer || `Goleador ${idx + 1}`).trim(),
          assister: String(g.assister || '').trim(),
          minute,
          tacticalPhase: suggestedPhase,
          tacticalSubtype: suggestedSubtype,
          isOwnGoal: Boolean(g.isOwnGoal),
          isPenalty: Boolean(g.isPenalty),
        };
      });

      setDetectedGoals(parsedGoals);
      setHasScannedResult(true);
      showToast?.('¡Captura procesada con éxito! Revisa y asigna las tipologías de los goles.');
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err?.message || 'Error al procesar la imagen con Gemini Vision.');
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  // Add goal manually
  const handleAddGoal = () => {
    const newG: DetectedGoal = {
      id: `scanned-goal-${Date.now()}-${detectedGoals.length}`,
      teamSide: 'HOME',
      scorer: 'Goleador',
      assister: '',
      minute: 45,
      tacticalPhase: 'POSICIONAL',
      tacticalSubtype: 'Pase final',
    };
    setDetectedGoals([...detectedGoals, newG]);
  };

  // Remove goal
  const handleRemoveGoal = (id: string) => {
    setDetectedGoals(detectedGoals.filter((g) => g.id !== id));
  };

  // Update goal field
  const handleUpdateGoal = (id: string, field: keyof DetectedGoal, value: any) => {
    setDetectedGoals(
      detectedGoals.map((g) => {
        if (g.id !== id) return g;
        if (field === 'tacticalPhase') {
          // Reset subtype to first available subtype of this phase
          const cat = TACTICAL_CATEGORIES[value as TacticalPhase];
          const newSubtype = cat?.subtypes?.[0] || 'General';
          return { ...g, tacticalPhase: value, tacticalSubtype: newSubtype };
        }
        return { ...g, [field]: value };
      })
    );
  };

  // Final Submit: Create Match and Goals objects and pass to parent
  const handleSubmit = () => {
    if (homeTeamId === awayTeamId) {
      setError('El equipo local y el visitante no pueden ser el mismo.');
      return;
    }

    const matchId = `match-j${jornada}-${homeTeamId}-vs-${awayTeamId}-${Date.now().toString().slice(-4)}`;

    // Determine firstGoalTeamId based on earliest minute
    let firstGoalTeamId: string | 'NONE' = 'NONE';
    if (detectedGoals.length > 0) {
      const sorted = [...detectedGoals].sort((a, b) => a.minute - b.minute);
      firstGoalTeamId = sorted[0].teamSide === 'HOME' ? homeTeamId : awayTeamId;
    }

    const newMatch: Match = {
      id: matchId,
      jornada: Number(jornada),
      date: date || new Date().toISOString().split('T')[0],
      homeTeamId,
      awayTeamId,
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      competition: 'Primera Federación Grupo 2',
      stadium: stadium || getTeamById(homeTeamId).stadium,
      firstGoalTeamId,
    };

    let currentHome = 0;
    let currentAway = 0;
    const sortedGoals = [...detectedGoals].sort((a, b) => a.minute - b.minute);

    const newGoals: Goal[] = sortedGoals.map((dg, idx) => {
      const isHome = dg.teamSide === 'HOME';
      const scoringTeamId = isHome ? homeTeamId : awayTeamId;
      const concedingTeamId = isHome ? awayTeamId : homeTeamId;
      const scoreBefore = `${currentHome}-${currentAway}`;

      if (isHome) currentHome++;
      else currentAway++;

      return {
        id: `goal-${matchId}-${idx + 1}`,
        matchId,
        teamId: scoringTeamId,
        concedingTeamId,
        scorer: dg.scorer,
        assister: dg.assister && dg.assister.trim() !== '' ? dg.assister : undefined,
        minute: dg.minute,
        minuteInterval: calculateMinuteInterval(dg.minute),
        scoreBefore,
        tacticalPhase: dg.tacticalPhase,
        tacticalSubtype: dg.tacticalSubtype || 'General',
        notes: dg.isPenalty ? 'Penalti' : dg.isOwnGoal ? 'Gol en propia puerta' : undefined,
      };
    });

    onSaveMatchAndGoals(newMatch, newGoals);
    showToast?.(`¡Jornada ${jornada}: ${getTeamById(homeTeamId).shortName} ${homeScore}-${awayScore} ${getTeamById(awayTeamId).shortName} registrado con éxito!`);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setImagePreview(null);
    setHasScannedResult(false);
    setError(null);
    setDetectedGoals([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto text-slate-100 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white shadow-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Auto-Registro con Captura de Pantalla</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                  IA Gemini Vision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pasa la captura de BeSoccer, RFEF o TV. La IA extrae jornada, resultado, minutos, goleadores y asistentes; tú solo seleccionas la tipología.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Upload / Paste Section */}
          {!hasScannedResult && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3.5 ${
                  isScanning
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-slate-800 hover:border-blue-500/60 bg-slate-900/60 hover:bg-slate-900/90'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleImageFile(e.target.files[0]);
                    }
                  }}
                />

                {isScanning ? (
                  <div className="py-6 flex flex-col items-center gap-3">
                    <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
                    <span className="text-sm font-bold text-white">{scanStep}</span>
                    <span className="text-xs text-slate-400">
                      Identificando equipos, resultado y eventos por minuto...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/15 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-lg">
                      <Upload className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Haz clic para subir captura o tómala con la cámara móvil
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        También puedes arrastrar la imagen aquí o pulsar <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-white">Ctrl + V</kbd> para pegarla directamente desde el portapapeles.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <span className="px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300 text-xs font-semibold border border-slate-700">
                        📱 Móvil: Galería o Cámara
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300 text-xs font-semibold border border-slate-700">
                        💻 PC: Recorte / Captura
                      </span>
                    </div>
                  </>
                )}
              </div>

              {imagePreview && !isScanning && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <img src={imagePreview} alt="Captura subida" className="w-14 h-14 object-cover rounded-xl border border-slate-700" />
                    <div>
                      <span className="text-xs font-bold text-white block">Captura cargada</span>
                      <span className="text-[11px] text-slate-400">Haz clic en Escanear si no empezó automáticamente</span>
                    </div>
                  </div>
                  <button
                    onClick={() => scanImageWithAI(imagePreview, 'image/jpeg')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Escanear con IA</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Scanned Result Review & Typology Assignation */}
          {hasScannedResult && (
            <div className="space-y-6">
              {/* Match Details Ribbon */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>Datos Generales del Partido Detectado</span>
                  </span>
                  <button
                    onClick={handleReset}
                    className="text-xs font-semibold text-slate-400 hover:text-white transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Subir otra captura</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Jornada */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Jornada</label>
                    <input
                      type="number"
                      min={1}
                      max={38}
                      value={jornada}
                      onChange={(e) => setJornada(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fecha</label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  {/* Local Team */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Equipo Local</label>
                    <select
                      value={homeTeamId}
                      onChange={(e) => setHomeTeamId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {LEAGUE_TEAMS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Visitante Team */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Equipo Visitante</label>
                    <select
                      value={awayTeamId}
                      onChange={(e) => setAwayTeamId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {LEAGUE_TEAMS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Score Big Display */}
                <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-right">
                    <span className="text-sm font-black text-white">{getTeamById(homeTeamId).shortName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Local</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={homeScore}
                      onChange={(e) => setHomeScore(Number(e.target.value))}
                      className="w-14 text-center text-2xl font-black bg-slate-900 border border-slate-700 rounded-xl py-1 text-emerald-400 font-mono"
                    />
                    <span className="text-lg font-black text-slate-500">-</span>
                    <input
                      type="number"
                      min={0}
                      value={awayScore}
                      onChange={(e) => setAwayScore(Number(e.target.value))}
                      className="w-14 text-center text-2xl font-black bg-slate-900 border border-slate-700 rounded-xl py-1 text-emerald-400 font-mono"
                    />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-black text-white">{getTeamById(awayTeamId).shortName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Visitante</span>
                  </div>
                </div>
              </div>

              {/* DETECTED GOALS LIST: USER JUST PICKS THE TACTICAL TYPOLOGY! */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black uppercase text-white tracking-wider">
                      Goles Detectados ({detectedGoals.length}) — Selecciona la Tipología Táctica
                    </h3>
                  </div>
                  <button
                    onClick={handleAddGoal}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-blue-300 border border-slate-700 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir Gol</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {detectedGoals.map((g, idx) => {
                    const currentCategory = TACTICAL_CATEGORIES[g.tacticalPhase];
                    return (
                      <div
                        key={g.id}
                        className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5 shadow-sm"
                      >
                        {/* Goal Identification Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center font-mono">
                              {idx + 1}
                            </span>

                            {/* Equipo autor del gol */}
                            <select
                              value={g.teamSide}
                              onChange={(e) => handleUpdateGoal(g.id, 'teamSide', e.target.value)}
                              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-200 cursor-pointer"
                            >
                              <option value="HOME">Local: {getTeamById(homeTeamId).shortName}</option>
                              <option value="AWAY">Visitante: {getTeamById(awayTeamId).shortName}</option>
                            </select>

                            {/* Minuto */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Minuto:</span>
                              <input
                                type="number"
                                min={1}
                                max={120}
                                value={g.minute}
                                onChange={(e) => handleUpdateGoal(g.id, 'minute', Number(e.target.value))}
                                className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-black text-emerald-400 font-mono text-center"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveGoal(g.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer self-end sm:self-center"
                            title="Eliminar este gol"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Player Names: Scorer & Assister */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                              ⚽ Goleador (Anotador)
                            </label>
                            <input
                              type="text"
                              value={g.scorer}
                              onChange={(e) => handleUpdateGoal(g.id, 'scorer', e.target.value)}
                              placeholder="Nombre del goleador"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                              👟 Asistente (Pase de Gol - opcional)
                            </label>
                            <input
                              type="text"
                              value={g.assister}
                              onChange={(e) => handleUpdateGoal(g.id, 'assister', e.target.value)}
                              placeholder="Sin asistente o nombre de quien asistió"
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* Tactical Phase Buttons (User sets by hand with 1 click!) */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
                          <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                            🎯 Asigna la Tipología Táctica:
                          </span>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                            {(['POSICIONAL', 'ABP', 'TRANSICION', 'VERTICAL', 'DIRECTO'] as TacticalPhase[]).map((phase) => {
                              const isSelected = g.tacticalPhase === phase;
                              const cat = TACTICAL_CATEGORIES[phase];
                              return (
                                <button
                                  key={phase}
                                  type="button"
                                  onClick={() => handleUpdateGoal(g.id, 'tacticalPhase', phase)}
                                  className={`px-2 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer text-center border ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-md scale-[1.02]'
                                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                                  }`}
                                >
                                  {cat.shortName}
                                </button>
                              );
                            })}
                          </div>

                          {/* Subtype Selector */}
                          {currentCategory.hasSubtypes && (
                            <div className="flex items-center gap-2 pt-1 flex-wrap">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Subtipo:</span>
                              <div className="flex flex-wrap gap-1">
                                {currentCategory.subtypes.map((sub) => {
                                  const isSubSelected = g.tacticalSubtype === sub;
                                  return (
                                    <button
                                      key={sub}
                                      type="button"
                                      onClick={() => handleUpdateGoal(g.id, 'tacticalSubtype', sub)}
                                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition cursor-pointer border ${
                                        isSubSelected
                                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                      }`}
                                    >
                                      {sub}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {detectedGoals.length === 0 && (
                    <div className="p-6 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                      Partido finalizado 0 - 0 (o sin goles detectados). Puedes añadir goles con el botón superior si lo necesitas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Cancelar
          </button>

          {hasScannedResult && (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Partido y Goles en la Base de Datos</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
