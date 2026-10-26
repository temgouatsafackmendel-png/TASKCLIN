import React, { useState } from 'react';
import { Task } from '../types/task';
import { formatDuration, formatDueDate } from '../services/cliEngine';
import {
  X,
  Download,
  Printer,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PdfReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  pdfBlobUrl?: string;
  pdfDataUri?: string;
  filename?: string;
  onDownloadDirect?: () => void;
}

export const PdfReportViewerModal: React.FC<PdfReportViewerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  pdfBlobUrl,
  pdfDataUri,
  filename = 'Rapport-TaskCLI-2026.pdf',
  onDownloadDirect
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'document' | 'iframe'>('document');

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalTimeSpent = tasks.reduce((acc, t) => acc + t.timeSpent, 0);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const timeFormatted = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (onDownloadDirect) {
      onDownloadDirect();
      return;
    }
    const link = document.createElement('a');
    link.href = pdfBlobUrl || pdfDataUri || '#';
    link.download = filename;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-5xl h-[92vh] bg-[#090d15] border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] bg-black/50 backdrop-blur flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>Rapport Exécutif — TaskCLI 2026</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  jsPDF AutoTable
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Aperçu fidèle du document d'audit prêt à être imprimé ou téléchargé
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-black/50 p-0.5 rounded-lg border border-white/[0.08] text-xs">
              <button
                onClick={() => setActiveTab('document')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'document' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Aperçu Document
              </button>
              <button
                onClick={() => setActiveTab('iframe')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'iframe' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lecteur PDF Natif
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-medium rounded-lg transition-colors border border-white/[0.08]"
              title="Imprimer le document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Imprimer</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-md shadow-emerald-950"
              title="Télécharger le fichier .pdf"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors ml-1"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto bg-black/40 p-4 sm:p-8 flex justify-center">
          {activeTab === 'document' ? (
            /* Printable A4 White Sheet */
            <div className="w-full max-w-4xl bg-white text-slate-900 rounded-lg shadow-2xl p-8 sm:p-12 font-sans relative border border-slate-300 min-h-[950px] flex flex-col justify-between">
              <div>
                {/* Top Teal Accent Bar */}
                <div className="h-1.5 w-full bg-teal-600 rounded-t-sm -mt-8 -mx-8 sm:-mt-12 sm:-mx-12 mb-8" style={{ width: 'calc(100% + 4rem)' }} />

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-sans">
                      RAPPORT EXÉCUTIF TASKCLI 2026
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Gestionnaire de tâches technique & métriques de vélocité opérationnelle
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500 font-mono">
                    <p className="font-semibold text-slate-800">Édité le : {dateFormatted} à {timeFormatted}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Version : TaskCLI v2026.4.1 (Hybrid Shell)</p>
                  </div>
                </div>

                {/* 4 KPI Metrics Boxes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      TÂCHES TOTALES
                    </div>
                    <div className="text-xl font-bold text-slate-900 font-mono mt-0.5 tabular-nums">
                      {total}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {pending} à faire · {inProgress} en cours
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      TAUX D'ACHÈVEMENT
                    </div>
                    <div className="text-xl font-bold text-emerald-600 font-mono mt-0.5 tabular-nums">
                      {completionRate}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {completed} terminées sur {total}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      TEMPS TRAÇÉ
                    </div>
                    <div className="text-xl font-bold text-sky-600 font-mono mt-0.5 tabular-nums">
                      {formatDuration(totalTimeSpent)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Cumul chronométré
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      ATTENTION URGENTE
                    </div>
                    <div className="text-xl font-bold text-rose-600 font-mono mt-0.5 tabular-nums">
                      {urgent}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {blocked} bloquée(s)
                    </div>
                  </div>
                </div>

                {/* Structured Tasks Table */}
                <div className="border border-slate-300 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white font-mono text-[10.5px]">
                        <th className="py-2.5 px-3 text-center w-12">ID</th>
                        <th className="py-2.5 px-3 w-24">Statut</th>
                        <th className="py-2.5 px-3 w-20">Priorité</th>
                        <th className="py-2.5 px-3 w-24">Projet</th>
                        <th className="py-2.5 px-3">Titre & Spécifications</th>
                        <th className="py-2.5 px-3 text-center w-24">Échéance</th>
                        <th className="py-2.5 px-3 text-right w-20">Temps</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-sans text-xs">
                      {tasks.map((task, idx) => {
                        const isEven = idx % 2 === 0;
                        const isDone = task.status === 'completed';
                        const isUrgent = task.priority === 'urgent';

                        return (
                          <tr key={task.id} className={isEven ? 'bg-white' : 'bg-slate-50/70'}>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                              #{task.id}
                            </td>
                            <td className="py-2.5 px-3 font-semibold font-mono text-[11px]">
                              {task.status === 'completed' && <span className="text-emerald-600">✔ Terminé</span>}
                              {task.status === 'in_progress' && <span className="text-sky-600">▶ En cours</span>}
                              {task.status === 'blocked' && <span className="text-rose-600">✕ Bloqué</span>}
                              {task.status === 'pending' && <span className="text-slate-600">○ À faire</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {isUrgent && <span className="text-rose-600 font-bold">⚡ Urgent</span>}
                              {task.priority === 'high' && <span className="text-amber-600 font-medium">▲ Haute</span>}
                              {task.priority === 'medium' && <span className="text-slate-600">• Moyenne</span>}
                              {task.priority === 'low' && <span className="text-slate-400">▽ Basse</span>}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                              {task.project}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-slate-900">{task.title}</div>
                              {task.subtasks.length > 0 && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} sous-tâches validées)
                                </div>
                              )}
                              {task.tags.length > 0 && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {task.tags.map(t => `#${t}`).join(' ')}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                              {task.dueDate ? formatDueDate(task.dueDate) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-700 font-medium">
                              {formatDuration(task.timeSpent)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Document Footer */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[10.5px] text-slate-400 font-mono">
                <span>TaskCLI 2026 — Rapport exécutif confidentiel généré via moteur JS/WebAssembly</span>
                <span>Page 1 sur 1</span>
              </div>
            </div>
          ) : (
            /* Native iframe */
            <div className="w-full h-full min-h-[600px] rounded-xl overflow-hidden border border-white/[0.08] bg-slate-900">
              {pdfBlobUrl || pdfDataUri ? (
                <iframe
                  src={pdfBlobUrl || pdfDataUri}
                  title="PDF Viewer"
                  className="w-full h-full min-h-[650px] border-none"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                  <FileText className="w-12 h-12 text-slate-600 animate-pulse" />
                  <span>Chargement du document PDF...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
