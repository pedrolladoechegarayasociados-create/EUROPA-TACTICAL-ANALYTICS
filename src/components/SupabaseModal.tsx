import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
} from 'lucide-react';
import {
  getSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
  fetchMatchesFromSupabase,
  fetchGoalsFromSupabase,
  saveMatchToSupabase,
  saveGoalToSupabase,
} from '../lib/supabase';
import { Match, Goal } from '../types/football';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: Match[];
  goals: Goal[];
  onDataSynced: (matches: Match[], goals: Goal[]) => void;
  showToast: (msg: string) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  matches,
  goals,
  onDataSynced,
  showToast,
}) => {
  const currentConfig = getSupabaseConfig();
  const [projectUrl, setProjectUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    localStorage.setItem('supabase_project_url', projectUrl.trim());
    localStorage.setItem('supabase_anon_key', anonKey.trim());
    setTestResult(null);
    showToast('Configuración de Supabase guardada.');
  };

  const handleTestConnection = async () => {
    handleSaveConfig();
    setIsTesting(true);
    setTestResult(null);

    const result = await testSupabaseConnection();
    setIsTesting(false);
    setTestResult(result);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleUploadAllToSupabase = async () => {
    setIsSyncing(true);
    let uploadedMatches = 0;
    let uploadedGoals = 0;

    for (const m of matches) {
      const ok = await saveMatchToSupabase(m);
      if (ok) uploadedMatches++;
    }

    for (const g of goals) {
      const ok = await saveGoalToSupabase(g);
      if (ok) uploadedGoals++;
    }

    setIsSyncing(false);
    showToast(`¡${uploadedMatches} partidos y ${uploadedGoals} goles subidos a Supabase con éxito!`);
  };

  const handleDownloadAllFromSupabase = async () => {
    setIsSyncing(true);
    const remoteMatches = await fetchMatchesFromSupabase();
    const remoteGoals = await fetchGoalsFromSupabase();
    setIsSyncing(false);

    if (remoteMatches) {
      onDataSynced(remoteMatches, remoteGoals || []);
      showToast(`¡Descargados ${remoteMatches.length} partidos y ${(remoteGoals || []).length} goles de Supabase!`);
    } else {
      alert('No se pudieron descargar los datos. Verifica la conexión y que las tablas existan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Conexión con tu Proyecto Supabase</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  PostgreSQL Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sincroniza tus partidos y goles en la nube en tiempo real
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
          
          {/* STEP 1: CREDENTIALS */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Credenciales de tu Proyecto en Supabase</span>
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
              >
                <span>Ir al Dashboard de Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Project URL (Project Settings &rarr; API)
              </label>
              <input
                type="text"
                value={projectUrl}
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://xyzabcdefghijklmnop.supabase.co"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Project API Anon Key (Public Key)
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Probando conexión...' : 'Guardar y Probar Conexión'}</span>
              </button>

              {testResult && (
                <div className={`flex items-center gap-1.5 font-bold ${testResult.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {testResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: SQL SCHEMA RUNNER */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Crear las Tablas en Supabase (Solo la primera vez)</span>
              </span>

              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? '¡SQL Copiado!' : 'Copiar Código SQL'}</span>
              </button>
            </div>

            <p className="text-slate-400">
              Para que tu proyecto en Supabase pueda guardar los partidos y goles, ve a tu proyecto en Supabase, entra en <strong>SQL Editor</strong>, pulsa <strong>"New query"</strong>, pega este código y pulsa <strong>"Run"</strong>:
            </p>

            <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 font-mono text-[10px] text-slate-300 max-h-36 overflow-y-auto">
              <pre>{SUPABASE_SQL_SCHEMA}</pre>
            </div>
          </div>

          {/* STEP 3: SYNC DATA */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">3</span>
              <span>Sincronización de Datos</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleUploadAllToSupabase}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-500/30 bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 font-bold transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-blue-400" />
                <span>Subir datos locales a Supabase</span>
              </button>

              <button
                onClick={handleDownloadAllFromSupabase}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-emerald-500/30 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-300 font-bold transition cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4 text-emerald-400" />
                <span>Descargar datos desde Supabase</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
