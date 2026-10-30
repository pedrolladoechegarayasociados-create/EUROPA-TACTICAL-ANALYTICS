import { Team } from '../types/football';

export const LEAGUE_TEAMS: Team[] = [
  {
    id: 'atletico-madrideno',
    name: 'Atlético Madrileño',
    shortName: 'At. Madrileño',
    primaryColor: '#dc2626', // red
    secondaryColor: '#1e3a8a', // navy
    stadium: 'Cerro del Espino',
    city: 'Majadahonda, Madrid',
  },
  {
    id: 'ud-ibiza',
    name: 'UD Ibiza',
    shortName: 'Ibiza',
    primaryColor: '#38bdf8', // sky
    secondaryColor: '#ffffff',
    stadium: 'Palladium Can Misses',
    city: 'Ibiza',
  },
  {
    id: 'ue-sant-andreu',
    name: 'UE Sant Andreu',
    shortName: 'Sant Andreu',
    primaryColor: '#eab308', // yellow
    secondaryColor: '#dc2626', // red
    stadium: 'Narcís Sala',
    city: 'Barcelona',
  },
  {
    id: 'rm-castilla',
    name: 'Real Madrid Castilla',
    shortName: 'RM Castilla',
    primaryColor: '#ffffff',
    secondaryColor: '#7c3aed', // purple
    stadium: 'Alfredo Di Stéfano',
    city: 'Madrid',
  },
  {
    id: 'real-zaragoza',
    name: 'Real Zaragoza',
    shortName: 'Zaragoza',
    primaryColor: '#2563eb', // royal blue
    secondaryColor: '#ffffff',
    stadium: 'La Romareda',
    city: 'Zaragoza',
  },
  {
    id: 'antequera-cf',
    name: 'Antequera CF',
    shortName: 'Antequera',
    primaryColor: '#16a34a', // green
    secondaryColor: '#ffffff',
    stadium: 'El Maulí',
    city: 'Antequera, Málaga',
  },
  {
    id: 'juventud-torremolinos',
    name: 'Juventud de Torremolinos CF',
    shortName: 'Torremolinos',
    primaryColor: '#15803d', // dark green
    secondaryColor: '#000000',
    stadium: 'El Pozuelo',
    city: 'Torremolinos, Málaga',
  },
  {
    id: 'hercules-alicante',
    name: 'Hércules de Alicante CF',
    shortName: 'Hércules',
    primaryColor: '#2563eb', // blue
    secondaryColor: '#ffffff',
    stadium: 'José Rico Pérez',
    city: 'Alicante',
  },
  {
    id: 'real-jaen',
    name: 'Real Jaén CF',
    shortName: 'Real Jaén',
    primaryColor: '#a855f7', // purple
    secondaryColor: '#ffffff',
    stadium: 'Nuevo La Victoria',
    city: 'Jaén',
  },
  {
    id: 'sd-huesca',
    name: 'SD Huesca',
    shortName: 'Huesca',
    primaryColor: '#b91c1c', // claret / azulgrana
    secondaryColor: '#1d4ed8',
    stadium: 'El Alcoraz',
    city: 'Huesca',
  },
  {
    id: 'ad-alcorcon',
    name: 'AD Alcorcón',
    shortName: 'Alcorcón',
    primaryColor: '#facc15', // yellow
    secondaryColor: '#1e3a8a',
    stadium: 'Santo Domingo',
    city: 'Alcorcón, Madrid',
  },
  {
    id: 'ce-europa',
    name: 'CE Europa',
    shortName: 'Europa',
    primaryColor: '#3b82f6', // blue
    secondaryColor: '#ffffff',
    stadium: 'Nou Sardenya',
    city: 'Gràcia, Barcelona',
  },
  {
    id: 'cd-teruel',
    name: 'CD Teruel',
    shortName: 'Teruel',
    primaryColor: '#dc2626', // red
    secondaryColor: '#ffffff',
    stadium: 'Pinilla',
    city: 'Teruel',
  },
  {
    id: 'fc-cartagena',
    name: 'FC Cartagena',
    shortName: 'Cartagena',
    primaryColor: '#1e293b', // black/white
    secondaryColor: '#ffffff',
    stadium: 'Cartagonova',
    city: 'Cartagena, Murcia',
  },
  {
    id: 'villarreal-b',
    name: 'Villarreal CF "B"',
    shortName: 'Villarreal B',
    primaryColor: '#eab308', // yellow submarine
    secondaryColor: '#1d4ed8',
    stadium: 'Mini Estadi Villarreal',
    city: 'Villarreal, Castellón',
  },
  {
    id: 'real-murcia',
    name: 'Real Murcia CF',
    shortName: 'Real Murcia',
    primaryColor: '#dc2626', // grana
    secondaryColor: '#ffffff',
    stadium: 'Enrique Roca de Murcia',
    city: 'Murcia',
  },
  {
    id: 'aguilas-fc',
    name: 'Águilas FC',
    shortName: 'Águilas',
    primaryColor: '#2563eb', // blue
    secondaryColor: '#ffffff',
    stadium: 'El Rubial',
    city: 'Águilas, Murcia',
  },
  {
    id: 'rayo-majadahonda',
    name: 'CF Rayo Majadahonda',
    shortName: 'Rayo Majadahonda',
    primaryColor: '#ef4444', // red
    secondaryColor: '#ffffff',
    stadium: 'Cerro del Espino',
    city: 'Majadahonda, Madrid',
  },
  {
    id: 'algeciras-cf',
    name: 'Algeciras CF',
    shortName: 'Algeciras',
    primaryColor: '#dc2626', // red
    secondaryColor: '#ffffff',
    stadium: 'Nuevo Mirador',
    city: 'Algeciras, Cádiz',
  },
  {
    id: 'gimnastic-tarragona',
    name: 'Gimnàstic de Tarragona',
    shortName: 'Nàstic',
    primaryColor: '#b91c1c', // grana
    secondaryColor: '#ffffff',
    stadium: 'Nou Estadi Costa Daurada',
    city: 'Tarragona',
  },
];

export const getTeamById = (id: string): Team => {
  const team = LEAGUE_TEAMS.find((t) => t.id === id);
  if (team) return team;
  return {
    id,
    name: id,
    shortName: id,
    primaryColor: '#3b82f6',
    secondaryColor: '#ffffff',
    stadium: 'Estadio Local',
    city: 'Ciudad',
  };
};
