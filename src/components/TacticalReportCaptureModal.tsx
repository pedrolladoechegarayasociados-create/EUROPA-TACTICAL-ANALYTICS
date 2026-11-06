import React, { useRef, useState, useMemo, useEffect } from 'react';
import html2canvas from 'html2canvas';
import {
  X,
  Camera,
  Download,
  Copy,
  Check,
  RefreshCw,
  Trophy,
  Shield,
  Home,
  Plane,
  Target,
  Clock,
  Award,
  Zap,
  Maximize2,
  Minimize2,
  LayoutGrid,
  FileText,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Match, Goal, TACTICAL_CATEGORIES, MINUTE_INTERVALS, TacticalPhase } from '../types/football';
import { LEAGUE_TEAMS, getTeamById } from '../data/teams';

interface TacticalReportCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  goals: Goal[];
  selectedTeamId: string;
  onSelectTeamId: (teamId: string) => void;
  showToast?: (msg: string) => void;
}

export const TacticalReportCaptureModal: React.FC<TacticalReportCaptureModalProps> = ({
  isOpen,
  onClose,
  matches,
  goals,
  selectedTeamId,
  onSelectTeamId,
  showToast,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isCleanCaptureMode, setIsCleanCaptureMode] = useState(false);

  // Layout mode: 'panoramic' (designed to fit 100% in a single screen) vs 'vertical' (A4 report)
  const [layoutMode, setLayoutMode] = useState<'panoramic' | 'vertical'>('panoramic');

  // Manual zoom control
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [autoFitToScreen, setAutoFitToScreen] = useState<boolean>(true);

  // Internal team selection within modal: can be 'ALL' or a specific team id
  const [activeTeamId, setActiveTeamId] = useState<string>(selectedTeamId || 'ALL');

  // Synchronize when selectedTeamId changes from outside
  useEffect(() => {
    setActiveTeamId(selectedTeamId || 'ALL');
  }, [selectedTeamId]);

  // Auto-fit calculation to ensure the entire card fits inside the viewport without scrolling
  useEffect(() => {
    if (!isOpen || !autoFitToScreen) return;

    const handleResize = () => {
      if (!cardRef.current || !containerRef.current) return;
      const availableHeight = window.innerHeight - (isCleanCaptureMode ? 40 : 120);
      const availableWidth = window.innerWidth - (isCleanCaptureMode ? 20 : 60);
      const cardHeight = cardRef.current.offsetHeight || (layoutMode === 'panoramic' ? 820 : 1300);
      const cardWidth = cardRef.current.offsetWidth || (layoutMode === 'panoramic' ? 1160 : 860);

      const scaleY = availableHeight / cardHeight;
      const scaleX = availableWidth / cardWidth;
      const calculatedScale = Math.min(1.05, Math.max(0.45, Math.min(scaleX, scaleY)));
      setZoomLevel(Number(calculatedScale.toFixed(2)));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 150);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [isOpen, autoFitToScreen, layoutMode, isCleanCaptureMode, activeTeamId]);

  const isLeagueWide = activeTeamId === 'ALL';
  const currentTeam = useMemo(() => {
    return isLeagueWide ? LEAGUE_TEAMS[0] : getTeamById(activeTeamId);
  }, [activeTeamId, isLeagueWide]);

  // 1. Calculate Full League Standings
  const allStandings = useMemo(() => {
    const list = LEAGUE_TEAMS.map((t) => {
      let played = 0;
      let won = 0;
      let drawn = 0;
      let lost = 0;
      let gf = 0;
      let gc = 0;

      matches.forEach((m) => {
        if (m.homeTeamId === t.id) {
          played++;
          gf += m.homeScore;
          gc += m.awayScore;
          if (m.homeScore > m.awayScore) won++;
          else if (m.homeScore === m.awayScore) drawn++;
          else lost++;
        } else if (m.awayTeamId === t.id) {
          played++;
          gf += m.awayScore;
          gc += m.homeScore;
          if (m.awayScore > m.homeScore) won++;
          else if (m.awayScore === m.homeScore) drawn++;
          else lost++;
        }
      });

      return {
        team: t,
        played,
        won,
        drawn,
        lost,
        gf,
        gc,
        gd: gf - gc,
        pts: won * 3 + drawn,
      };
    });

    list.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });

    return list;
  }, [matches]);

  const teamPosition = isLeagueWide
    ? 1
    : allStandings.findIndex((s) => s.team.id === activeTeamId) + 1;

  // 2. Filter matches and goals for active selection
  const relevantMatches = useMemo(() => {
    if (isLeagueWide) return matches;
    return matches.filter((m) => m.homeTeamId === activeTeamId || m.awayTeamId === activeTeamId);
  }, [matches, isLeagueWide, activeTeamId]);

  const relevantGoalsFor = useMemo(() => {
    if (isLeagueWide) return goals;
    return goals.filter((g) => g.teamId === activeTeamId);
  }, [goals, isLeagueWide, activeTeamId]);

  const relevantGoalsAgainst = useMemo(() => {
    if (isLeagueWide) return goals;
    return goals.filter((g) => g.concedingTeamId === activeTeamId);
  }, [goals, isLeagueWide, activeTeamId]);

  // Record Breakdown (Home vs Away)
  const homeMatches = useMemo(() => {
    if (isLeagueWide) return matches;
    return matches.filter((m) => m.homeTeamId === activeTeamId);
  }, [matches, isLeagueWide, activeTeamId]);

  const awayMatches = useMemo(() => {
    if (isLeagueWide) return [];
    return matches.filter((m) => m.awayTeamId === activeTeamId);
  }, [matches, isLeagueWide, activeTeamId]);

  let totalWins = 0, totalDraws = 0, totalLosses = 0;
  let homeWins = 0, homeDraws = 0, homeLosses = 0, homeGF = 0, homeGC = 0;
  let awayWins = 0, awayDraws = 0, awayLosses = 0, awayGF = 0, awayGC = 0;

  if (isLeagueWide) {
    matches.forEach((m) => {
      if (m.homeScore > m.awayScore) {
        totalWins++;
        homeWins++;
      } else if (m.homeScore === m.awayScore) {
        totalDraws++;
        homeDraws++;
      } else {
        totalLosses++;
        awayWins++;
      }
      homeGF += m.homeScore;
      homeGC += m.awayScore;
      awayGF += m.awayScore;
      awayGC += m.homeScore;
    });
  } else {
    relevantMatches.forEach((m) => {
      const isHome = m.homeTeamId === activeTeamId;
      const ourScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;

      if (ourScore > oppScore) totalWins++;
      else if (ourScore === oppScore) totalDraws++;
      else totalLosses++;

      if (isHome) {
        homeGF += ourScore;
        homeGC += oppScore;
        if (ourScore > oppScore) homeWins++;
        else if (ourScore === oppScore) homeDraws++;
        else homeLosses++;
      } else {
        awayGF += ourScore;
        awayGC += oppScore;
        if (ourScore > oppScore) awayWins++;
        else if (ourScore === oppScore) awayDraws++;
        else awayLosses++;
      }
    });
  }

  const totalPoints = isLeagueWide
    ? matches.reduce((acc, m) => acc + (m.homeScore === m.awayScore ? 2 : 3), 0)
    : totalWins * 3 + totalDraws;
  const homePoints = homeWins * 3 + homeDraws;
  const awayPoints = awayWins * 3 + awayDraws;

  // =========================================================================
  // GESTIÓN DE MARCADOR: EMPEZAR GANANDO VS EMPEZAR PERDIENDO (USER REQUEST)
  // =========================================================================
  const scoreManagement = useMemo(() => {
    if (isLeagueWide) {
      let startedWinningTotal = 0;
      let startedWinningWon = 0;
      let startedWinningDrawn = 0;
      let startedWinningLost = 0;
      let goalless = 0;

      matches.forEach((m) => {
        if (!m.firstGoalTeamId || m.firstGoalTeamId === 'NONE' || (m.homeScore === 0 && m.awayScore === 0)) {
          goalless++;
          return;
        }

        startedWinningTotal++;
        const isFirstHome = m.firstGoalTeamId === m.homeTeamId;
        const firstTeamWon = isFirstHome ? m.homeScore > m.awayScore : m.awayScore > m.homeScore;
        const firstTeamDrawn = m.homeScore === m.awayScore;
        const firstTeamLost = isFirstHome ? m.homeScore < m.awayScore : m.awayScore < m.homeScore;

        if (firstTeamWon) startedWinningWon++;
        else if (firstTeamDrawn) startedWinningDrawn++;
        else if (firstTeamLost) startedWinningLost++;
      });

      return {
        startedWinning: {
          total: startedWinningTotal,
          won: startedWinningWon,
          drawn: startedWinningDrawn,
          lost: startedWinningLost,
        },
        startedLosing: {
          total: startedWinningTotal,
          won: startedWinningLost, // The team that started losing made a full comeback and won
          drawn: startedWinningDrawn, // Rescued draw
          lost: startedWinningWon, // Suffered defeat
        },
        goalless,
      };
    }

    // Specific Team
    const teamMatches = matches.filter((m) => m.homeTeamId === activeTeamId || m.awayTeamId === activeTeamId);

    // Cuando el equipo empezó ganando (marcó el 1er gol)
    const startedWinningMatches = teamMatches.filter((m) => m.firstGoalTeamId === activeTeamId);
    let winWon = 0, winDrawn = 0, winLost = 0;
    startedWinningMatches.forEach((m) => {
      const isHome = m.homeTeamId === activeTeamId;
      const ourScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;
      if (ourScore > oppScore) winWon++;
      else if (ourScore === oppScore) winDrawn++;
      else winLost++;
    });

    // Cuando el equipo empezó perdiendo (el rival marcó el 1er gol)
    const startedLosingMatches = teamMatches.filter(
      (m) => m.firstGoalTeamId && m.firstGoalTeamId !== 'NONE' && m.firstGoalTeamId !== activeTeamId
    );
    let loseWon = 0, loseDrawn = 0, loseLost = 0;
    startedLosingMatches.forEach((m) => {
      const isHome = m.homeTeamId === activeTeamId;
      const ourScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;
      if (ourScore > oppScore) loseWon++; // Remontó y ganó
      else if (ourScore === oppScore) loseDrawn++; // Rescató empate
      else loseLost++; // Derrota
    });

    const goalless = teamMatches.filter(
      (m) => m.firstGoalTeamId === 'NONE' || (m.homeScore === 0 && m.awayScore === 0)
    ).length;

    return {
      startedWinning: {
        total: startedWinningMatches.length,
        won: winWon,
        drawn: winDrawn,
        lost: winLost,
      },
      startedLosing: {
        total: startedLosingMatches.length,
        won: loseWon,
        drawn: loseDrawn,
        lost: loseLost,
      },
      goalless,
    };
  }, [matches, activeTeamId, isLeagueWide]);

  // 3. MINUTE INTERVALS AS BARS - SEPARATED A FAVOR Y EN CONTRA
  const intervalsList = MINUTE_INTERVALS.filter((i) => i.key !== 'ET');

  const intervalBarsFor = useMemo(() => {
    return intervalsList.map((int) => {
      const count = relevantGoalsFor.filter((g) => g.minuteInterval === int.key).length;
      return {
        key: int.key,
        label: int.label,
        count,
        pct: relevantGoalsFor.length > 0 ? Math.round((count / relevantGoalsFor.length) * 100) : 0,
      };
    });
  }, [relevantGoalsFor, intervalsList]);

  const intervalBarsAgainst = useMemo(() => {
    return intervalsList.map((int) => {
      const count = relevantGoalsAgainst.filter((g) => g.minuteInterval === int.key).length;
      return {
        key: int.key,
        label: int.label,
        count,
        pct: relevantGoalsAgainst.length > 0 ? Math.round((count / relevantGoalsAgainst.length) * 100) : 0,
      };
    });
  }, [relevantGoalsAgainst, intervalsList]);

  const maxIntervalForCount = Math.max(...intervalBarsFor.map((i) => i.count), 1);
  const maxIntervalAgainstCount = Math.max(...intervalBarsAgainst.map((i) => i.count), 1);

  // 1ª Parte vs 2ª Parte
  const firstHalfFor = relevantGoalsFor.filter((g) => ['0-15', '16-30', '31-45'].includes(g.minuteInterval)).length;
  const secondHalfFor = relevantGoalsFor.filter((g) => ['46-60', '61-75', '76-90+'].includes(g.minuteInterval)).length;
  const firstHalfAgainst = relevantGoalsAgainst.filter((g) => ['0-15', '16-30', '31-45'].includes(g.minuteInterval)).length;
  const secondHalfAgainst = relevantGoalsAgainst.filter((g) => ['46-60', '61-75', '76-90+'].includes(g.minuteInterval)).length;

  // 4. TIPOLOGÍA DE GOLES - SEPARADA A FAVOR Y EN CONTRA
  const orderedPhases: TacticalPhase[] = ['POSICIONAL', 'VERTICAL', 'ABP', 'TRANSICION', 'DIRECTO'];

  const typologyFor = useMemo(() => {
    const total = relevantGoalsFor.length;
    return orderedPhases.map((phase) => {
      const phaseGoals = relevantGoalsFor.filter((g) => g.tacticalPhase === phase);
      const count = phaseGoals.length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const subtypesMap: Record<string, number> = {};
      phaseGoals.forEach((g) => {
        const sub = g.tacticalSubtype || 'General';
        subtypesMap[sub] = (subtypesMap[sub] || 0) + 1;
      });
      return {
        phase,
        category: TACTICAL_CATEGORIES[phase],
        count,
        pct,
        subtypes: Object.entries(subtypesMap).sort((a, b) => b[1] - a[1]),
      };
    });
  }, [relevantGoalsFor]);

  const typologyAgainst = useMemo(() => {
    const total = relevantGoalsAgainst.length;
    return orderedPhases.map((phase) => {
      const phaseGoals = relevantGoalsAgainst.filter((g) => g.tacticalPhase === phase);
      const count = phaseGoals.length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      const subtypesMap: Record<string, number> = {};
      phaseGoals.forEach((g) => {
        const sub = g.tacticalSubtype || 'General';
        subtypesMap[sub] = (subtypesMap[sub] || 0) + 1;
      });
      return {
        phase,
        category: TACTICAL_CATEGORIES[phase],
        count,
        pct,
        subtypes: Object.entries(subtypesMap).sort((a, b) => b[1] - a[1]),
      };
    });
  }, [relevantGoalsAgainst]);

  const maxTypologyForCount = Math.max(...typologyFor.map((t) => t.count), 1);
  const maxTypologyAgainstCount = Math.max(...typologyAgainst.map((t) => t.count), 1);

  // =========================================================================
  // 5. PRIMEROS GOLEADORES Y ASISTENTES (CRITICAL: EXCLUSIVELY FOR CURRENT TEAM!)
  // =========================================================================
  const topScorers = useMemo(() => {
    // When inside a specific team, filter ONLY that team's goals
    const goalsPool = isLeagueWide
      ? goals
      : goals.filter((g) => g.teamId === activeTeamId);

    const scorersMap: Record<string, { count: number; teamId: string; minutes: number[] }> = {};
    goalsPool.forEach((g) => {
      if (!g.scorer || g.scorer.trim() === '') return;
      if (!scorersMap[g.scorer]) {
        scorersMap[g.scorer] = { count: 0, teamId: g.teamId, minutes: [] };
      }
      scorersMap[g.scorer].count++;
      scorersMap[g.scorer].minutes.push(g.minute);
    });

    return Object.entries(scorersMap)
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .slice(0, 5);
  }, [goals, activeTeamId, isLeagueWide]);

  const topAssisters = useMemo(() => {
    // When inside a specific team, filter ONLY that team's goals
    const goalsPool = isLeagueWide
      ? goals
      : goals.filter((g) => g.teamId === activeTeamId);

    const assistersMap: Record<string, { count: number; teamId: string; recipients: string[] }> = {};
    goalsPool.forEach((g) => {
      if (g.assister && g.assister.trim() !== '') {
        if (!assistersMap[g.assister]) {
          assistersMap[g.assister] = { count: 0, teamId: g.teamId, recipients: [] };
        }
        assistersMap[g.assister].count++;
        assistersMap[g.assister].recipients.push(g.scorer);
      }
    });

    return Object.entries(assistersMap)
      .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
      .slice(0, 5);
  }, [goals, activeTeamId, isLeagueWide]);

  const getPhaseColorBar = (phase: TacticalPhase, isDefensive = false) => {
    if (isDefensive) {
      switch (phase) {
        case 'ABP': return 'from-rose-600 to-amber-600';
        case 'TRANSICION': return 'from-rose-600 to-red-500';
        case 'POSICIONAL': return 'from-orange-600 to-rose-500';
        case 'VERTICAL': return 'from-red-600 to-pink-600';
        case 'DIRECTO': return 'from-purple-600 to-rose-600';
        default: return 'from-slate-600 to-slate-500';
      }
    }
    switch (phase) {
      case 'POSICIONAL': return 'from-emerald-500 to-teal-400';
      case 'VERTICAL': return 'from-sky-500 to-cyan-400';
      case 'ABP': return 'from-amber-500 to-yellow-400';
      case 'TRANSICION': return 'from-rose-500 to-pink-500';
      case 'DIRECTO': return 'from-violet-500 to-indigo-400';
      default: return 'from-slate-500 to-slate-400';
    }
  };

  // Helper actions for export
  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 120));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2.4,
        useCORS: true,
        backgroundColor: '#020617',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const fileName = isLeagueWide
        ? `Informe_Tactico_Toda_La_Liga_J10.png`
        : `Informe_Tactico_${currentTeam.shortName.replace(/\s+/g, '_')}_J10.png`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      showToast?.('¡Informe táctico descargado en alta resolución (PNG)!');
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating card image:', err);
      alert('Error al generar la imagen. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 120));

      const canvas = await html2canvas(cardRef.current, {
        scale: 2.2,
        useCORS: true,
        backgroundColor: '#020617',
        logging: false,
      });

      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            setCopiedSuccess(true);
            showToast?.('¡Captura copiada en Ultra HD! Ya puedes pulsar Ctrl+V en Word o PowerPoint.');
            setTimeout(() => setCopiedSuccess(false), 3000);
          } catch {
            handleDownloadPNG();
          }
        } else {
          handleDownloadPNG();
        }
      });
    } catch (err) {
      console.error('Clipboard write error:', err);
      handleDownloadPNG();
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 backdrop-blur-md overflow-hidden ${
        isCleanCaptureMode ? 'bg-slate-950 p-2' : 'p-2 sm:p-3'
      }`}
    >
      {/* Top Floating Control Bar */}
      {!isCleanCaptureMode ? (
        <div className="w-full max-w-7xl flex flex-wrap items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-xl gap-2 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white">Captura Táctica Ejecutiva para Informe</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Todo Visible en 1 Pantalla
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Puntos, Casa/Fuera, Gestión de Marcador, Minutos, Tipologías y Goleadores del equipo analizado.
              </p>
            </div>
          </div>

          {/* Tools & View Mode Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Team Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase hidden md:inline">Equipo:</span>
              <select
                value={activeTeamId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setActiveTeamId(newId);
                  onSelectTeamId(newId);
                }}
                className="bg-transparent border-none text-xs font-bold text-emerald-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-emerald-300 font-bold">
                  🌐 Toda la Liga (20 Clubes)
                </option>
                <optgroup label="Clubes Individuales">
                  {LEAGUE_TEAMS.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Layout switch: Panorámica (1 Pantalla) vs Vertical A4 */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => {
                  setLayoutMode('panoramic');
                  setAutoFitToScreen(true);
                }}
                title="Diseño panorámico compacto para ver absolutamente TODO en una sola pantalla sin scroll"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  layoutMode === 'panoramic'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">1 Pantalla</span>
              </button>
              <button
                onClick={() => {
                  setLayoutMode('vertical');
                  setAutoFitToScreen(false);
                  setZoomLevel(1);
                }}
                title="Diseño vertical estándar para informe A4"
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  layoutMode === 'vertical'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">A4 Vertical</span>
              </button>
            </div>

            {/* Auto-Fit / Zoom Toggle */}
            <div className="flex items-center bg-slate-950 px-1 py-0.5 rounded-xl border border-slate-800 text-[11px] gap-1">
              <button
                onClick={() => {
                  setAutoFitToScreen(!autoFitToScreen);
                  if (!autoFitToScreen) {
                    const availH = window.innerHeight - 120;
                    const cardH = layoutMode === 'panoramic' ? 820 : 1300;
                    setZoomLevel(Number(Math.min(1, Math.max(0.5, availH / cardH)).toFixed(2)));
                  } else {
                    setZoomLevel(1);
                  }
                }}
                title="Ajustar automáticamente al 100% de la altura de tu pantalla"
                className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                  autoFitToScreen ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3 inline mr-1" />
                <span>{autoFitToScreen ? 'Auto-Ajuste ON' : 'Ajustar'}</span>
              </button>

              <button
                onClick={() => {
                  setAutoFitToScreen(false);
                  setZoomLevel((z) => Math.max(0.4, Number((z - 0.05).toFixed(2))));
                }}
                title="Reducir zoom"
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="font-mono text-[10px] text-slate-300 w-8 text-center font-bold">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => {
                  setAutoFitToScreen(false);
                  setZoomLevel((z) => Math.min(1.4, Number((z + 0.05).toFixed(2))));
                }}
                title="Aumentar zoom"
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            {/* 1-Click Copy Image Button */}
            <button
              onClick={handleCopyToClipboard}
              disabled={isExporting}
              title="Copiar imagen en Ultra HD al portapapeles. Luego simplemente pulsa Ctrl+V en Word o PowerPoint"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer shadow"
            >
              {copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSuccess ? '¡Copiado HD!' : 'Copiar'}</span>
            </button>

            {/* Download PNG Button */}
            <button
              onClick={handleDownloadPNG}
              disabled={isExporting}
              title="Descargar imagen en PNG de alta resolución"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
            >
              {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadSuccess ? '¡Descargado!' : 'Descargar PNG'}</span>
            </button>

            {/* Clean Capture Mode Button */}
            <button
              onClick={() => {
                setIsCleanCaptureMode(true);
                setAutoFitToScreen(true);
              }}
              title="Ocultar todo el marco para recortar la pantalla con Win+Shift+S / Cmd+Shift+4"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Captura Limpia</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Floating Exit Button in Clean Capture Mode */
        <div className="fixed top-3 right-4 z-50 flex items-center gap-2 bg-slate-900/95 border border-slate-700 px-3 py-1.5 rounded-xl shadow-2xl backdrop-blur-md">
          <span className="text-[11px] font-bold text-emerald-400">Modo Captura Limpia (Listo para Capturar)</span>
          <button
            onClick={() => setIsCleanCaptureMode(false)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
          >
            <Minimize2 className="w-3 h-3" />
            <span>Volver</span>
          </button>
        </div>
      )}

      {/* Main Scaled Viewport Container */}
      <div
        ref={containerRef}
        className="w-full flex-1 flex items-center justify-center overflow-auto p-1 sm:p-2"
      >
        <div
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="shrink-0 flex justify-center items-center"
        >
          {/* ============================================================== */}
          {/* THE CAPTURE CARD (Exported via html2canvas or Windows Clipping) */}
          {/* ============================================================== */}
          <div
            ref={cardRef}
            id="tactical-dossier-card"
            className={`rounded-2xl bg-slate-950 border-2 border-slate-800 text-slate-100 shadow-2xl relative overflow-hidden font-sans space-y-3 p-4 sm:p-5 ${
              layoutMode === 'panoramic' ? 'w-[1140px]' : 'w-[820px]'
            }`}
            style={{
              backgroundImage:
                'radial-gradient(circle at 10% 10%, rgba(30, 58, 138, 0.22) 0%, transparent 40%), radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.16) 0%, transparent 40%)',
            }}
          >
            {/* 1. COMPACT EXECUTIVE HEADER + KPI STRIP (No % efectividad) */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/90 gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg font-black text-xl border border-white/20 shrink-0"
                  style={{ backgroundColor: isLeagueWide ? '#059669' : currentTeam.primaryColor }}
                >
                  {isLeagueWide ? 'FED' : currentTeam.shortName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black tracking-tight text-white uppercase">
                      {isLeagueWide ? 'PRIMERA FEDERACIÓN - GRUPO 2' : currentTeam.name}
                    </h1>
                    <span className="text-[10px] font-extrabold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      DOSSIER TÁCTICO OFICIAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isLeagueWide
                      ? 'Radiografía Integral de los 20 Clubes • 100 Partidos Oficiales'
                      : `Estadio ${currentTeam.stadium} • ${currentTeam.city} • Grupo 2`}
                  </p>
                </div>
              </div>

              {/* Top Integrated KPIs: Puntos, Record, GF, GC, Dif Goles, Casa & Fuera */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Puntos */}
                <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-center min-w-[70px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Puntos</span>
                  <span className="text-xl font-black text-blue-400 leading-tight">
                    {isLeagueWide ? '100 Part.' : totalPoints}
                  </span>
                  <span className="text-[9px] text-slate-500 block">
                    {isLeagueWide ? '20 Clubes' : `${(totalPoints / (relevantMatches.length || 1)).toFixed(2)} pts/p`}
                  </span>
                </div>

                {/* Balance V-E-D */}
                <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-center min-w-[95px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Balance</span>
                  <span className="text-sm font-black text-white leading-tight block mt-0.5">
                    {totalWins}V - {totalDraws}E - {totalLosses}D
                  </span>
                  <span className="text-[9px] text-slate-400 block">
                    {relevantMatches.length} partidos
                  </span>
                </div>

                {/* Goles Marcados y Encajados */}
                <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-center min-w-[100px]">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Goles GF / GC</span>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <span className="text-base font-black text-emerald-400">{relevantGoalsFor.length}</span>
                    <span className="text-xs text-slate-500">/</span>
                    <span className="text-base font-black text-rose-400">{relevantGoalsAgainst.length}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 block">
                    Dif: <strong className={relevantGoalsFor.length - relevantGoalsAgainst.length >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {relevantGoalsFor.length - relevantGoalsAgainst.length > 0 ? `+${relevantGoalsFor.length - relevantGoalsAgainst.length}` : relevantGoalsFor.length - relevantGoalsAgainst.length}
                    </strong>
                  </span>
                </div>

                {/* Rendimiento Casa vs Fuera (Sin % efectividad) */}
                <div className="px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3 text-left">
                  {/* Casa */}
                  <div className="pr-2 border-r border-slate-800">
                    <span className="text-[9px] font-bold text-blue-300 uppercase flex items-center gap-1">
                      <Home className="w-2.5 h-2.5" /> Casa
                    </span>
                    <span className="text-xs font-black text-white font-mono block">
                      {homePoints} pts ({homeWins}V-{homeDraws}E-{homeLosses}D)
                    </span>
                    <span className="text-[9px] text-slate-400 block font-mono">
                      GF {homeGF} : {homeGC} GC
                    </span>
                  </div>
                  {/* Fuera */}
                  <div>
                    <span className="text-[9px] font-bold text-indigo-300 uppercase flex items-center gap-1">
                      <Plane className="w-2.5 h-2.5" /> Fuera
                    </span>
                    <span className="text-xs font-black text-white font-mono block">
                      {awayPoints} pts ({awayWins}V-{awayDraws}E-{awayLosses}D)
                    </span>
                    <span className="text-[9px] text-slate-400 block font-mono">
                      GF {awayGF} : {awayGC} GC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* NUEVA SECCIÓN: GESTIÓN DE MARCADOR: EMPEZAR GANANDO VS EMPEZAR PERDIENDO  */}
            {/* ========================================================================= */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-white">
                    Gestión de Marcador: ¿Cómo acaba el partido al empezar ganando o perdiendo?
                  </h3>
                </div>
                <span className="text-[9.5px] font-mono text-slate-400">
                  {isLeagueWide
                    ? 'Total Liga: 100 Partidos'
                    : `Registro de Partidos del ${currentTeam.shortName}`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {/* 1. CUANDO EMPIEZA GANANDO (Marcó el 1er gol del partido) */}
                <div className="p-2 rounded-lg bg-slate-950/90 border border-emerald-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                      <span>Al Empezar Ganando ({scoreManagement.startedWinning.total} partidos)</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      Marcó 1º
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center my-0.5">
                    <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block">Gana (Mantiene)</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {scoreManagement.startedWinning.won}
                      </span>
                    </div>
                    <div className="p-1 rounded bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block">Empata</span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {scoreManagement.startedWinning.drawn}
                      </span>
                    </div>
                    <div className="p-1 rounded bg-rose-500/10 border border-rose-500/30">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block">Le Remontan</span>
                      <span className="text-sm font-black text-rose-400 font-mono">
                        {scoreManagement.startedWinning.lost}
                      </span>
                    </div>
                  </div>

                  {/* Segmented bar for started winning */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex mt-1">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${
                          scoreManagement.startedWinning.total > 0
                            ? (scoreManagement.startedWinning.won / scoreManagement.startedWinning.total) * 100
                            : 0
                        }%`,
                      }}
                      title={`Gana: ${scoreManagement.startedWinning.won}`}
                    />
                    <div
                      className="bg-amber-400 h-full"
                      style={{
                        width: `${
                          scoreManagement.startedWinning.total > 0
                            ? (scoreManagement.startedWinning.drawn / scoreManagement.startedWinning.total) * 100
                            : 0
                        }%`,
                      }}
                      title={`Empata: ${scoreManagement.startedWinning.drawn}`}
                    />
                    <div
                      className="bg-rose-500 h-full"
                      style={{
                        width: `${
                          scoreManagement.startedWinning.total > 0
                            ? (scoreManagement.startedWinning.lost / scoreManagement.startedWinning.total) * 100
                            : 0
                        }%`,
                      }}
                      title={`Le remontan: ${scoreManagement.startedWinning.lost}`}
                    />
                  </div>
                </div>

                {/* 2. CUANDO EMPIEZA PERDIENDO (Encajó el 1er gol del partido) */}
                <div className="p-2 rounded-lg bg-slate-950/90 border border-amber-500/30 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black text-amber-400 uppercase flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3 text-amber-400" />
                      <span>Al Empezar Perdiendo ({scoreManagement.startedLosing.total} partidos)</span>
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      Encajó 1º
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center my-0.5">
                    <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block">Remonta y Gana</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {scoreManagement.startedLosing.won}
                      </span>
                    </div>
                    <div className="p-1 rounded bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block">Rescata Empate</span>
                      <span className="text-sm font-black text-amber-400 font-mono">
                        {scoreManagement.startedLosing.drawn}
                      </span>
                    </div>
                    <div className="p-1 rounded bg-rose-500/10 border border-rose-500/30">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block">Derrota</span>
                      <span className="text-sm font-black text-rose-400 font-mono">
                        {scoreManagement.startedLosing.lost}
                      </span>
                    </div>
                  </div>

                  {/* Segmented bar for started losing */}
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex mt-1">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{
                        width: `${
                          scoreManagement.startedLosing.total > 0
                            ? (scoreManagement.startedLosing.won / scoreManagement.startedLosing.total) * 100
                            : 0
                        }%`,
                      }}
                      title={`Remonta: ${scoreManagement.startedLosing.won}`}
                    />
                    <div
                      className="bg-amber-400 h-full"
                      style={{
                        width: `${
                          scoreManagement.startedLosing.total > 0
                            ? (scoreManagement.startedLosing.drawn / scoreManagement.startedLosing.total) * 100
                            : 0
                        }%`,
                      }}
                      title={`Empata: ${scoreManagement.startedLosing.drawn}`}
                    />
                    <div
                      className="bg-rose-500 h-full"
                      style={{
                        width: `${
                          scoreManagement.startedLosing.total > 0
                            ? (scoreManagement.startedLosing.lost / scoreManagement.startedLosing.total) * 100
                            : 0
                        }%`,
                      }}
                      title={`Derrota: ${scoreManagement.startedLosing.lost}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. MAIN CORE: INTERVALOS DE MINUTOS (BARRAS) & TIPOLOGÍA TÁCTICA */}
            <div className={`grid gap-2.5 ${layoutMode === 'panoramic' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {/* ======================================================== */}
              {/* BLOQUE A: INTERVALOS DE MINUTOS (BARRAS HORIZONTALES)    */}
              {/* ======================================================== */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-white">
                      Intervalos de Minutos (Barras)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2.5 text-[9.5px] font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded bg-emerald-500 inline-block" /> A Favor ({relevantGoalsFor.length})
                    </span>
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded bg-rose-500 inline-block" /> En Contra ({relevantGoalsAgainst.length})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Columna 1: A Favor */}
                  <div className="p-2 rounded-lg bg-slate-950/90 border border-emerald-500/30 space-y-1">
                    <span className="text-[9.5px] font-black text-emerald-300 uppercase block pb-0.5 border-b border-slate-800/80">
                      ⚽ Goles a Favor (Marcados)
                    </span>

                    <div className="space-y-1">
                      {intervalBarsFor.map((item) => {
                        const barW = maxIntervalForCount > 0 ? (item.count / maxIntervalForCount) * 100 : 0;
                        return (
                          <div key={item.key} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[9.5px] font-mono">
                              <span className="text-slate-300 font-bold">{item.label}</span>
                              <span className="text-emerald-400 font-black">
                                {item.count} <span className="text-slate-500 text-[8.5px]">({item.pct}%)</span>
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-200"
                                style={{ width: `${Math.max(barW, item.count > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 1ª vs 2ª Parte Bar */}
                    <div className="pt-1 border-t border-slate-800/80 text-[8.5px] font-mono flex items-center justify-between text-slate-300">
                      <span>1ªP: <strong className="text-emerald-400">{firstHalfFor}</strong></span>
                      <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${relevantGoalsFor.length > 0 ? (firstHalfFor / relevantGoalsFor.length) * 100 : 50}%` }}
                        />
                        <div
                          className="bg-teal-300 h-full"
                          style={{ width: `${relevantGoalsFor.length > 0 ? (secondHalfFor / relevantGoalsFor.length) * 100 : 50}%` }}
                        />
                      </div>
                      <span>2ªP: <strong className="text-emerald-400">{secondHalfFor}</strong></span>
                    </div>
                  </div>

                  {/* Columna 2: En Contra */}
                  <div className="p-2 rounded-lg bg-slate-950/90 border border-rose-500/30 space-y-1">
                    <span className="text-[9.5px] font-black text-rose-300 uppercase block pb-0.5 border-b border-slate-800/80">
                      🛡️ Goles en Contra (Encajados)
                    </span>

                    <div className="space-y-1">
                      {intervalBarsAgainst.map((item) => {
                        const barW = maxIntervalAgainstCount > 0 ? (item.count / maxIntervalAgainstCount) * 100 : 0;
                        return (
                          <div key={item.key} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[9.5px] font-mono">
                              <span className="text-slate-300 font-bold">{item.label}</span>
                              <span className="text-rose-400 font-black">
                                {item.count} <span className="text-slate-500 text-[8.5px]">({item.pct}%)</span>
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                              <div
                                className="h-full bg-gradient-to-r from-rose-600 to-red-400 rounded-full transition-all duration-200"
                                style={{ width: `${Math.max(barW, item.count > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 1ª vs 2ª Parte Bar */}
                    <div className="pt-1 border-t border-slate-800/80 text-[8.5px] font-mono flex items-center justify-between text-slate-300">
                      <span>1ªP: <strong className="text-rose-400">{firstHalfAgainst}</strong></span>
                      <div className="w-16 h-1.5 bg-slate-900 rounded-full overflow-hidden flex">
                        <div
                          className="bg-rose-500 h-full"
                          style={{ width: `${relevantGoalsAgainst.length > 0 ? (firstHalfAgainst / relevantGoalsAgainst.length) * 100 : 50}%` }}
                        />
                        <div
                          className="bg-red-400 h-full"
                          style={{ width: `${relevantGoalsAgainst.length > 0 ? (secondHalfAgainst / relevantGoalsAgainst.length) * 100 : 50}%` }}
                        />
                      </div>
                      <span>2ªP: <strong className="text-rose-400">{secondHalfAgainst}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* BLOQUE B: TIPOLOGÍA TÁCTICA (A FAVOR Y EN CONTRA)        */}
              {/* ======================================================== */}
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-white">
                      Tipología Táctica de Goles
                    </h3>
                  </div>
                  <div className="flex items-center gap-2.5 text-[9.5px] font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-emerald-400" /> Cómo Marca
                    </span>
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-rose-400" /> Cómo Encaja
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Tipología A Favor */}
                  <div className="p-2 rounded-lg bg-slate-950/90 border border-emerald-500/30 space-y-1">
                    <span className="text-[9.5px] font-black text-emerald-300 uppercase block pb-0.5 border-b border-slate-800/80">
                      ⚡ Tipología a Favor ({relevantGoalsFor.length} GF)
                    </span>

                    <div className="space-y-1">
                      {typologyFor.map(({ phase, category, count, pct, subtypes }) => {
                        const barW = maxTypologyForCount > 0 ? (count / maxTypologyForCount) * 100 : 0;
                        return (
                          <div key={phase} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[9.5px]">
                              <span className="text-slate-300 font-bold">{category.shortName}</span>
                              <span className="text-emerald-400 font-mono font-black">
                                {count} <span className="text-slate-500 text-[8.5px]">({pct}%)</span>
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden p-0.2 border border-slate-800">
                              <div
                                className={`h-full bg-gradient-to-r ${getPhaseColorBar(phase, false)} rounded-full`}
                                style={{ width: `${Math.max(barW, count > 0 ? 6 : 0)}%` }}
                              />
                            </div>
                            {/* Key Subtype Pill */}
                            {subtypes.length > 0 && (
                              <div className="flex flex-wrap gap-1 text-[8px] font-mono text-slate-400">
                                {subtypes.slice(0, 2).map(([sub, subC]) => (
                                  <span key={sub} className="px-1 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                    {sub}: <strong className="text-emerald-400">{subC}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tipología En Contra */}
                  <div className="p-2 rounded-lg bg-slate-950/90 border border-rose-500/30 space-y-1">
                    <span className="text-[9.5px] font-black text-rose-300 uppercase block pb-0.5 border-b border-slate-800/80">
                      🛡️ Tipología en Contra ({relevantGoalsAgainst.length} GC)
                    </span>

                    <div className="space-y-1">
                      {typologyAgainst.map(({ phase, category, count, pct, subtypes }) => {
                        const barW = maxTypologyAgainstCount > 0 ? (count / maxTypologyAgainstCount) * 100 : 0;
                        return (
                          <div key={phase} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[9.5px]">
                              <span className="text-slate-300 font-bold">{category.shortName}</span>
                              <span className="text-rose-400 font-mono font-black">
                                {count} <span className="text-slate-500 text-[8.5px]">({pct}%)</span>
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden p-0.2 border border-slate-800">
                              <div
                                className={`h-full bg-gradient-to-r ${getPhaseColorBar(phase, true)} rounded-full`}
                                style={{ width: `${Math.max(barW, count > 0 ? 6 : 0)}%` }}
                              />
                            </div>
                            {/* Key Subtype Pill */}
                            {subtypes.length > 0 && (
                              <div className="flex flex-wrap gap-1 text-[8px] font-mono text-slate-400">
                                {subtypes.slice(0, 2).map(([sub, subC]) => (
                                  <span key={sub} className="px-1 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                                    {sub}: <strong className="text-rose-400">{subC}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. ROW 3: PRIMEROS GOLEADORES Y ASISTENTES (EXCLUSIVOS DEL EQUIPO ANALIZADO) */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-white">
                    {isLeagueWide
                      ? 'Líderes Oficiales del Campeonato (Toda la Liga)'
                      : `Goleadores y Asistentes Oficiales de ${currentTeam.name}`}
                  </h3>
                </div>

                <span className="text-[9.5px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/30">
                  {isLeagueWide ? 'Grupo 2 (20 Clubes)' : `Solo del ${currentTeam.shortName}`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {/* PRIMEROS GOLEADORES DEL EQUIPO */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                    <span className="text-amber-400 uppercase flex items-center gap-1">
                      <span>⚽ Top Goleadores</span>
                      {!isLeagueWide && <span className="text-slate-400 font-normal">({currentTeam.shortName})</span>}
                    </span>
                    <span className="font-mono text-emerald-400">{relevantGoalsFor.length} goles totales</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                    {topScorers.map(([scorer, data], idx) => {
                      const scorerTeam = getTeamById(data.teamId);
                      return (
                        <div
                          key={scorer}
                          className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-col justify-between text-center relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-0.5">
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center font-black text-[8.5px] ${
                                idx === 0
                                  ? 'bg-amber-400 text-slate-950'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-950'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-emerald-400 font-mono font-black text-[10px]">
                              {data.count} {data.count === 1 ? 'gol' : 'goles'}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-white truncate block mt-0.5" title={scorer}>
                            {scorer}
                          </span>
                          <span className="text-[8.5px] text-slate-400 truncate block font-mono">
                            {data.minutes.slice(0, 3).map((m) => `${m}'`).join(', ')}
                          </span>
                        </div>
                      );
                    })}

                    {topScorers.length === 0 && (
                      <div className="col-span-5 text-center py-2 text-[10px] text-slate-500 italic bg-slate-950/40 rounded-lg">
                        Sin goles registrados para {currentTeam.shortName}
                      </div>
                    )}
                  </div>
                </div>

                {/* PRIMEROS ASISTENTES DEL EQUIPO */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-300">
                    <span className="text-blue-400 uppercase flex items-center gap-1">
                      <span>👟 Top Asistentes</span>
                      {!isLeagueWide && <span className="text-slate-400 font-normal">({currentTeam.shortName})</span>}
                    </span>
                    <span className="font-mono text-blue-400">Pases de gol</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
                    {topAssisters.map(([assister, data], idx) => {
                      const uniqueRecipients = Array.from(new Set(data.recipients));
                      return (
                        <div
                          key={assister}
                          className="p-1.5 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-col justify-between text-center relative overflow-hidden"
                        >
                          <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-0.5">
                            <span
                              className={`w-3.5 h-3.5 rounded flex items-center justify-center font-black text-[8.5px] ${
                                idx === 0
                                  ? 'bg-blue-500 text-white'
                                  : idx === 1
                                  ? 'bg-indigo-500 text-white'
                                  : idx === 2
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-blue-400 font-mono font-black text-[10px]">
                              {data.count} {data.count === 1 ? 'asist.' : 'asist.'}
                            </span>
                          </div>
                          <span className="text-[10px] font-black text-white truncate block mt-0.5" title={assister}>
                            {assister}
                          </span>
                          <span className="text-[8.5px] text-slate-400 truncate block font-mono">
                            a {uniqueRecipients.slice(0, 1).join(', ')}
                          </span>
                        </div>
                      );
                    })}

                    {topAssisters.length === 0 && (
                      <div className="col-span-5 text-center py-2 text-[10px] text-slate-500 italic bg-slate-950/40 rounded-lg">
                        Sin asistencias registradas para {currentTeam.shortName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. FOOTER SIGNATURE & WATERMARK */}
            <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-1.5 border-t border-slate-800/80">
              <span className="font-semibold text-slate-400">
                {isLeagueWide ? 'Primera Federación (Grupo 2)' : currentTeam.name} • Departamento de Análisis Táctico Oficial
              </span>
              <span className="font-mono">
                Informe Técnico de Rendimiento y Escapulario • {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
