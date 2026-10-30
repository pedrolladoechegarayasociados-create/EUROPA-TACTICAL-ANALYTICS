import React, { useState } from 'react';
import { X, Download, Copy, Check, FileCode, CheckCircle, ExternalLink } from 'lucide-react';

interface StandaloneHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const StandaloneHtmlModal: React.FC<StandaloneHtmlModalProps> = ({
  isOpen,
  onClose,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');

  React.useEffect(() => {
    if (isOpen && !htmlContent) {
      setLoading(true);
      fetch('/app_europa.html')
        .then((res) => res.text())
        .then((text) => {
          setHtmlContent(text);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, htmlContent]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (htmlContent) {
        await navigator.clipboard.writeText(htmlContent);
      } else {
        const res = await fetch('/app_europa.html');
        const text = await res.text();
        await navigator.clipboard.writeText(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      alert('Código copiado al portapapeles');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-8 text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Archivo Único Autónomo:</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                  app_europa.html
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Guarda este archivo en tu ordenador y ábrelo directamente en cualquier navegador
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

        {/* Body */}
        <div className="p-6 space-y-4">
          
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-600/30 text-xs text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>100% Autónomo y Listo para Usar</span>
            </div>
            <p>
              Este archivo HTML contiene <strong>todo el código integrado</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 ml-1">
              <li>Framework React 18 y ReactDOM via CDN oficial.</li>
              <li>Estilos Tailwind CSS via CDN oficial.</li>
              <li>Formularios interactivos para registro de goles (ABP, posicional, vertical, directo, minutos).</li>
              <li>Librería <strong>html2canvas</strong> para descargar tarjetas estadísticas en imagen PNG de alta calidad.</li>
              <li>Métricas completas de partidos en casa vs fuera y resiliencia al empezar ganando/perdiendo.</li>
              <li>Datos de prueba precargados del CE Europa y persistencia automática en tu navegador (LocalStorage).</li>
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar "app_europa.html" a mi Ordenador</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">¡Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Código Completo</span>
                </>
              )}
            </button>

            <a
              href="/app_europa.html"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-white transition"
            >
              <span>Abrir archivo en nueva pestaña</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Code preview box */}
          <div className="space-y-1 pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vista previa del código fuente (fragmento inicial)
            </span>
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-slate-300 max-h-56 overflow-y-auto">
              {loading ? (
                <div className="text-slate-500 italic">Cargando código fuente...</div>
              ) : (
                <pre className="whitespace-pre-wrap">{htmlContent ? htmlContent.slice(0, 1500) + '\n\n... [Contenido completo listo para descarga] ...' : '<!DOCTYPE html> ...'}</pre>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
