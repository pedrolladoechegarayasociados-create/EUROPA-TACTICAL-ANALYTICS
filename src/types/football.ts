export type TacticalPhase = 'DIRECTO' | 'VERTICAL' | 'ABP' | 'TRANSICION' | 'POSICIONAL' | 'PENDIENTE';

export type MinuteInterval = '0-15' | '16-30' | '31-45' | '46-60' | '61-75' | '76-90+' | 'ET';

export type PitchZone = 
  | 'six_yard_box'    // Área pequeña
  | 'penalty_spot'    // Punto de penalti / centro del área
  | 'box_left'        // Costado izquierdo del área
  | 'box_right'       // Costado derecho del área
  | 'box_edge'        // Borde del área / Frontal (16-20m)
  | 'long_range';     // Larga distancia (>20m)

export type BodyPart = 'Pie derecho' | 'Pie izquierdo' | 'Cabeza' | 'Otro';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  stadium: string;
  city: string;
}

export interface Match {
  id: string;
  jornada: number;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  competition: string;
  stadium: string;
  firstGoalTeamId?: string | 'NONE'; // id del equipo que marcó primero o 'NONE'
  notes?: string;
}

export interface Goal {
  id: string;
  matchId: string;
  teamId: string; // Equipo autor del gol
  concedingTeamId: string; // Equipo que encajó el gol
  scorer: string;
  assister?: string;
  minute: number;
  minuteInterval: MinuteInterval;
  scoreBefore: string; // e.g. "0-0", "1-0"
  tacticalPhase: TacticalPhase;
  tacticalSubtype: string;
  pitchZone?: PitchZone;
  bodyPart?: BodyPart;
  notes?: string;
}

export const TACTICAL_CATEGORIES = {
  DIRECTO: {
    id: 'DIRECTO',
    name: '1. Juego Directo',
    shortName: 'Juego Directo',
    color: 'violet',
    badgeClass: 'bg-violet-950/80 text-violet-300 border-violet-700/60',
    hasSubtypes: false,
    subtypes: ['Juego Directo'],
  },
  VERTICAL: {
    id: 'VERTICAL',
    name: '2. Juego Vertical',
    shortName: 'Juego Vertical',
    color: 'sky',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-700/60',
    hasSubtypes: false,
    subtypes: ['Juego Vertical'],
  },
  ABP: {
    id: 'ABP',
    name: '3. ABP (Balón Parado)',
    shortName: 'ABP',
    color: 'amber',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-700/60',
    hasSubtypes: true,
    subtypes: [
      'Falta lateral',
      'Falta frontal',
      'Falta directa',
      'Saque de esquina',
      'Penalti',
      'Saque de banda',
    ],
  },
  TRANSICION: {
    id: 'TRANSICION',
    name: '4. Transición',
    shortName: 'Transición',
    color: 'rose',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-700/60',
    hasSubtypes: false,
    subtypes: ['Transición'],
  },
  POSICIONAL: {
    id: 'POSICIONAL',
    name: '5. Juego Posicional',
    shortName: 'Juego Posicional',
    color: 'emerald',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60',
    hasSubtypes: true,
    subtypes: [
      'Pase final',
      'Centro lateral',
      'Tiro lejano',
    ],
  },
  PENDIENTE: {
    id: 'PENDIENTE',
    name: 'Sin clasificar (Pendiente)',
    shortName: 'Pendiente',
    color: 'amber',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-600/40 border-dashed',
    hasSubtypes: false,
    subtypes: ['Sin definir'],
  },
} as const;

export const MINUTE_INTERVALS: { key: MinuteInterval; label: string; range: string }[] = [
  { key: '0-15', label: "0' - 15'", range: 'Minutos 1 a 15' },
  { key: '16-30', label: "16' - 30'", range: 'Minutos 16 a 30' },
  { key: '31-45', label: "31' - 45'+", range: 'Minutos 31 a 45 + añadido' },
  { key: '46-60', label: "46' - 60'", range: 'Minutos 46 a 60' },
  { key: '61-75', label: "61' - 75'", range: 'Minutos 61 a 75' },
  { key: '76-90+', label: "76' - 90'+", range: 'Minutos 76 a 90 + añadido' },
  { key: 'ET', label: 'Prórroga', range: 'Tiempo Extra' },
];

export const PITCH_ZONES: { key: PitchZone; label: string; coords: { x: number; y: number } }[] = [
  { key: 'six_yard_box', label: 'Área Pequeña (<6m)', coords: { x: 50, y: 15 } },
  { key: 'penalty_spot', label: 'Punto de Penalti / Centro del Área (6-11m)', coords: { x: 50, y: 32 } },
  { key: 'box_left', label: 'Costado Izquierdo del Área', coords: { x: 25, y: 28 } },
  { key: 'box_right', label: 'Costado Derecho del Área', coords: { x: 75, y: 28 } },
  { key: 'box_edge', label: 'Frontal del Área / Balcón (16-20m)', coords: { x: 50, y: 48 } },
  { key: 'long_range', label: 'Larga Distancia (>20m)', coords: { x: 50, y: 70 } },
];
