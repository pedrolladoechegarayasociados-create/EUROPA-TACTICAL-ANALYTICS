import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import 'dotenv/config';

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Accept up to 25MB for high-resolution mobile camera screenshots / gallery images
  app.use(express.json({ limit: '25mb' }));

  // Initialize server-side Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API endpoint: Scan match screenshot using Gemini Vision
  app.post('/api/scan-match-screenshot', async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen.' });
      }

      // Extract base64 payload
      const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
      const detectedMime =
        mimeType || (image.startsWith('data:') ? image.split(';')[0].replace('data:', '') : 'image/jpeg');

      const prompt = `Analiza detalladamente esta captura de pantalla de un partido de fútbol (de BeSoccer, RFEF, TV o marcador oficial) y extrae todos los datos del partido y sus goles con la máxima fidelidad.

Devuelve estrictamente un objeto JSON con la siguiente estructura:
{
  "jornada": 10, // número de jornada si aparece en la captura (ej. 10), o null si no se ve
  "competition": "Primera Federación Grupo 2", // nombre de la competición si aparece
  "date": "02/11/2026", // fecha si aparece
  "homeTeamName": "SD Huesca", // nombre exacto del equipo local
  "awayTeamName": "Gimnàstic Tarragona", // nombre exacto del equipo visitante
  "homeScore": 2, // marcador final del equipo local
  "awayScore": 0, // marcador final del equipo visitante
  "goals": [
    {
      "teamSide": "HOME", // "HOME" si el gol sube al marcador del equipo local, o "AWAY" si es del visitante
      "teamName": "SD Huesca",
      "scorer": "Diego Collado",
      "assister": "", // nombre del asistente si aparece debajo del goleador o con icono de bota/asistencia. Si no hay, dejar en blanco ""
      "minute": 81, // minuto numérico entero del gol (si pone 90'+5 pon 95, si pone 45'+2 pon 47)
      "isOwnGoal": false, // true si es gol en propia puerta
      "isPenalty": false // true si es de penalti
    }
  ]
}

Instrucciones críticas:
1. Goleadores y Asistentes: Identifica los nombres de los goleadores y si debajo aparece un asistente (ejemplo: "I. Obeng", "Moha Keita", "Dani Garrido", "Pau Martinez", "Adrià Gené"). Extráelo tal cual.
2. Minutos: Extrae el minuto del gol como número entero positivo.
3. Goles en propia meta: Si el gol lo anota un jugador en su propia meta (autogoal), el gol sube al casillero del equipo rival.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            inlineData: {
              mimeType: detectedMime,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText);

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error('Error scanning match screenshot:', err);
      return res.status(500).json({
        error: 'Error al procesar la captura con Gemini Vision',
        details: err?.message || String(err),
      });
    }
  });

  // Mount Vite development middlewares or serve static build
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
