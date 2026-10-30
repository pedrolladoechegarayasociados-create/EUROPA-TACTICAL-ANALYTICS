import React from 'react';
import { PitchZone, Goal } from '../types/football';

interface TacticalPitchMapProps {
  goals: (Goal & { team?: 'FOR' | 'AGAINST' })[];
  selectedZone?: PitchZone | null;
  onSelectZone?: (zone: PitchZone | null) => void;
  interactive?: boolean;
}

export const TacticalPitchMap: React.FC<TacticalPitchMapProps> = ({
  goals,
  selectedZone,
  onSelectZone,
  interactive = false,
}) => {
  // Count goals per zone
  const getZoneGoals = (zone: PitchZone) => goals.filter((g) => g.pitchZone === zone);

  const zones: { id: PitchZone; name: string; top: string; left: string; width: string; height: string }[] = [
    { id: 'six_yard_box', name: 'Área Pequeña', top: '2%', left: '35%', width: '30%', height: '14%' },
    { id: 'penalty_spot', name: 'Centro Área / Punto Penalti', top: '16%', left: '28%', width: '44%', height: '22%' },
    { id: 'box_left', name: 'Costado Izquierdo', top: '10%', left: '10%', width: '18%', height: '28%' },
    { id: 'box_right', name: 'Costado Derecho', top: '10%', left: '72%', width: '18%', height: '28%' },
    { id: 'box_edge', name: 'Frontal del Área (16-20m)', top: '38%', left: '20%', width: '60%', height: '20%' },
    { id: 'long_range', name: 'Larga Distancia (>20m)', top: '58%', left: '10%', width: '80%', height: '36%' },
  ];

  return (
    <div className="relative w-full aspect-[4/3] max-w-md mx-auto rounded-xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl bg-gradient-to-b from-emerald-900 to-emerald-950 select-none">
      {/* Grass Striping Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none flex flex-col">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-black/25' : 'bg-white/10'}`} />
        ))}
      </div>

      {/* Football Field Pitch Markings (White Lines) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 240">
        {/* Outer boundary */}
        <rect x="10" y="8" width="180" height="224" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
        
        {/* Goal Frame at top */}
        <rect x="80" y="2" width="40" height="6" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5" />
        
        {/* Six-yard box */}
        <rect x="70" y="8" width="60" height="28" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        
        {/* Penalty area (18-yard box) */}
        <rect x="40" y="8" width="120" height="74" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        
        {/* Penalty spot */}
        <circle cx="100" cy="54" r="2" fill="white" />
        
        {/* Penalty arc */}
        <path d="M 75 82 A 25 25 0 0 0 125 82" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        
        {/* Halfway line & Center Circle */}
        <line x1="10" y1="210" x2="190" y2="210" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <path d="M 70 210 A 30 30 0 0 1 130 210" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
        <circle cx="100" cy="210" r="2" fill="white" />

        {/* Corner arcs */}
        <path d="M 10 16 A 8 8 0 0 0 18 8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <path d="M 190 16 A 8 8 0 0 1 182 8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </svg>

      {/* Target Net Indicator */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-white/20 shadow-sm pointer-events-none">
        Portería Rival
      </div>

      {/* Interactive / Display Zones */}
      {zones.map((zone) => {
        const zoneGoals = getZoneGoals(zone.id);
        const goalsFor = zoneGoals.filter((g) => g.team === 'FOR').length;
        const goalsAgainst = zoneGoals.filter((g) => g.team === 'AGAINST').length;
        const totalZone = zoneGoals.length;
        const isSelected = selectedZone === zone.id;

        return (
          <button
            key={zone.id}
            type="button"
            disabled={!interactive && !onSelectZone}
            onClick={() => onSelectZone && onSelectZone(isSelected ? null : zone.id)}
            style={{
              top: zone.top,
              left: zone.left,
              width: zone.width,
              height: zone.height,
            }}
            className={`absolute rounded-lg flex flex-col items-center justify-center transition-all p-1 text-center group cursor-pointer ${
              isSelected
                ? 'bg-blue-500/40 border-2 border-blue-400 ring-2 ring-blue-400/50 shadow-lg'
                : interactive
                ? 'hover:bg-white/20 border border-white/20 bg-black/20'
                : 'bg-black/15 border border-white/10 hover:bg-black/30'
            }`}
          >
            <span className="text-[10px] font-semibold text-white/90 drop-shadow line-clamp-1">
              {zone.name}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {goalsFor > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-600 text-white shadow">
                  {goalsFor} GF
                </span>
              )}
              {goalsAgainst > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white shadow">
                  {goalsAgainst} GC
                </span>
              )}
              {goalsFor === 0 && goalsAgainst === 0 && totalZone > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-600 text-white shadow">
                  {totalZone} goles
                </span>
              )}
              {totalZone === 0 && (
                <span className="text-[9px] text-white/40 font-mono">0</span>
              )}
            </div>
          </button>
        );
      })}

      {/* Direction of Attack */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[9px] uppercase font-bold text-white/60 pointer-events-none">
        <span>▲ Sentido de Ataque</span>
      </div>
    </div>
  );
};
