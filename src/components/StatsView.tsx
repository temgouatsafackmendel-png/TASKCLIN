import React, { useState } from 'react';
import { Task, Priority } from '../types/task';
import { formatDuration } from '../services/cliEngine';
import { generateTasksPdfReport } from '../utils/pdfGenerator';
import { soundManager } from '../utils/audio';
import { PdfReportViewerModal } from './PdfReportViewerModal';
import {
  Download,
  FileText,
  Eye,
  TrendingUp,
  Activity,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface StatsViewProps {
  tasks: Task[];
  onExport: (format: 'json' | 'csv' | 'markdown') => void;
}

export const StatsView: React.FC<StatsViewProps> = ({ tasks, onExport }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalData, setPdfModalData] = useState<{ blobUrl: string; dataUri: string; filename: string } | null>(null);

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalTimeSpent = tasks.reduce((acc, t) => acc + t.timeSpent, 0);

  const priorities: Priority[] = ['urgent', 'high', 'medium', 'low'];
  const prioData = priorities.map(p => {
    const count = tasks.filter(t => t.priority === p).length;
    const comp = tasks.filter(t => t.priority === p && t.status === 'completed').length;
    return { priority: p, total: count, completed: comp };
  });

  const projectMap: Record<string, { total: number; completed: number; time: number }> = {};
  tasks.forEach(t => {
    if (!projectMap[t.project]) {
      projectMap[t.project] = { total: 0, completed: 0, time: 0 };
    }
    projectMap[t.project].total += 1;
    if (t.status === 'completed') projectMap[t.project].completed += 1;
    projectMap[t.project].time += t.timeSpent;
  });

  const handleGeneratePdf = () => {
    try {
      soundManager.playKeypress();
      setIsGeneratingPdf(true);
      setTimeout(() => {
        const result = generateTasksPdfReport(tasks);
        setPdfModalData({
          blobUrl: result.blobUrl,
          dataUri: result.dataUri,
          filename: result.filename
        });
        setIsPdfModalOpen(true);
        soundManager.playSuccess();
        setIsGeneratingPdf(false);
      }, 150);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      soundManager.playError();
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080d16] border border-white/[0.08] rounded-xl overflow-y-auto p-6 space-y-6 font-sans">
      {/* Executive Report Banner */}
      <div className="p-5 rounded-xl border border-white/[0.08] bg-gradient-to-r from-white/[0.03] to-transparent flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider">
              Synthèse Opérationnelle & Rapports Exécutifs
            </h3>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Audit complet de vélocité calculé en temps réel. Générez un rapport PDF prêt à l’impression ou exportez les données brutes.
          </p>
        </div>

        <button
          onClick={handleGeneratePdf}
          disabled={isGeneratingPdf}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs font-mono transition-all shadow-lg shadow-emerald-950/60 shrink-0"
        >
          {isGeneratingPdf ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Compilation jsPDF...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-emerald-200" />
              <span>Afficher & Générer Rapport PDF (jsPDF)</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
            </>
          )}
        </button>
      </div>

      {/* 4 Quantitative KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="text-slate-400 text-[11px] font-mono uppercase tracking-wider mb-1">Tâches Totales</div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">{total}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {pending} en attente · {inProgress} en cours
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="text-slate-400 text-[11px] font-mono uppercase tracking-wider mb-1">Taux d'Achèvement</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {completionRate}%
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {completed} sur {total} terminées
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="text-slate-400 text-[11px] font-mono uppercase tracking-wider mb-1">Temps Cumulé Traçé</div>
          <div className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
            {formatDuration(totalTimeSpent)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">chronométré en direct</div>
        </div>

        <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="text-slate-400 text-[11px] font-mono uppercase tracking-wider mb-1">Blocages & Risques</div>
          <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">{blocked}</div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            {tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length} urgentes restantes
          </div>
        </div>
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority breakdown */}
        <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              Répartition par Priorité
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Actives vs Terminées</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {prioData.map(item => {
              const pct = total > 0 ? Math.round((item.total / total) * 100) : 0;
              const prioLabels: Record<Priority, string> = {
                urgent: '⚡ URGENT',
                high: '▲ HAUTE',
                medium: '• MOYENNE',
                low: '▽ BASSE'
              };
              return (
                <div key={item.priority} className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{prioLabels[item.priority]}</span>
                    <span className="tabular-nums text-slate-400">
                      {item.completed}/{item.total} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${
                        item.priority === 'urgent'
                          ? 'bg-rose-500'
                          : item.priority === 'high'
                          ? 'bg-amber-500'
                          : item.priority === 'medium'
                          ? 'bg-sky-500'
                          : 'bg-slate-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project breakdown */}
        <div className="p-5 rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
              Vélocité par Projet
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">{Object.keys(projectMap).length} Projets</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {Object.entries(projectMap).map(([proj, data]) => {
              const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
              return (
                <div key={proj} className="p-3 rounded-lg border border-white/[0.06] bg-black/30">
                  <div className="flex items-center justify-between text-slate-200 mb-1">
                    <span className="font-semibold">{proj}</span>
                    <span className="tabular-nums text-slate-400">
                      {data.completed}/{data.total} terminées ({pct}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Temps : {formatDuration(data.time)}</span>
                    <span className="text-emerald-400">{pct}% complété</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="p-5 rounded-xl border border-white/[0.08] bg-black/40 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-200 font-mono uppercase tracking-wider">
            Exportations Systèmes & Données Brutes
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Générez le document PDF instantané ou exportez en JSON pour API, CSV pour tableur ou Markdown pour rapport standup.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGeneratePdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono rounded-lg transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF (Afficher / Télécharger)</span>
          </button>
          <button
            onClick={() => onExport('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-mono rounded-lg transition-colors border border-white/[0.06]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <button
            onClick={() => onExport('csv')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-mono rounded-lg transition-colors border border-white/[0.06]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={() => onExport('markdown')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-mono rounded-lg transition-colors border border-white/[0.06]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>
        </div>
      </div>

      {/* Embedded PDF Report Viewer Modal */}
      <PdfReportViewerModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        tasks={tasks}
        pdfBlobUrl={pdfModalData?.blobUrl}
        pdfDataUri={pdfModalData?.dataUri}
        filename={pdfModalData?.filename}
      />
    </div>
  );
};
