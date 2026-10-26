import React, { useState, useEffect } from 'react';
import { X, Search, Terminal, ArrowRight, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCommand: (cmd: string) => void;
}

interface CommandItem {
  cmd: string;
  category: string;
  description: string;
  example?: string;
}

const COMMAND_CATALOG: CommandItem[] = [
  {
    cmd: 'task list',
    category: 'Lecture',
    description: 'Afficher les tâches actives dans un tableau ASCII formaté',
    example: 'task list -p urgent -s in_progress'
  },
  {
    cmd: 'task add "<titre>" [options]',
    category: 'Création',
    description: 'Créer une nouvelle tâche avec priorité (-p), projet (-P) et échéance (-d)',
    example: 'task add "Audit API v3" -p high -P securite -d 2026-11-04'
  },
  {
    cmd: 'task export --format pdf',
    category: 'Rapport',
    description: 'Générer et afficher le rapport PDF exécutif haute définition (jsPDF)',
    example: 'task export --format pdf'
  },
  {
    cmd: 'task done <id>',
    category: 'Action',
    description: 'Marquer une tâche comme terminée',
    example: 'task done 1 2'
  },
  {
    cmd: 'task start <id>',
    category: 'Action',
    description: 'Passer la tâche au statut En cours',
    example: 'task start 3'
  },
  {
    cmd: 'task block <id>',
    category: 'Action',
    description: 'Signaler la tâche comme bloquée',
    example: 'task block 4'
  },
  {
    cmd: 'task show <id>',
    category: 'Inspection',
    description: 'Afficher la fiche détaillée complète en carte terminal',
    example: 'task show 1'
  },
  {
    cmd: 'task timer start <id>',
    category: 'Chronomètre',
    description: 'Lancer le chronomètre en temps réel sur une tâche',
    example: 'task timer start 1'
  },
  {
    cmd: 'task pomodoro start',
    category: 'Focus',
    description: 'Démarrer une session de travail Pomodoro de 25 minutes',
    example: 'task pomodoro start'
  },
  {
    cmd: 'task stats',
    category: 'Analytique',
    description: 'Afficher le rapport de vélocité, taux de complétion et temps passé',
    example: 'task stats'
  },
  {
    cmd: 'task search <mot-clé>',
    category: 'Recherche',
    description: 'Rechercher des tâches par mot-clé, tags ou notes',
    example: 'task search redis'
  },
  {
    cmd: 'theme <nom>',
    category: 'Système',
    description: 'Changer le thème terminal (tokyo-night, matrix, cyber-slate, catppuccin, monochrome)',
    example: 'theme matrix'
  },
  {
    cmd: 'view <mode>',
    category: 'Système',
    description: 'Basculer la vue (split, terminal, list, kanban, matrix, stats)',
    example: 'view kanban'
  },
  {
    cmd: 'cls',
    category: 'Système',
    description: 'Nettoyer le tampon du terminal',
    example: 'cls'
  }
];

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onRunCommand
}) => {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const filtered = COMMAND_CATALOG.filter(c =>
    c.cmd.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => Math.min(filtered.length - 1, prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Enter' && filtered[activeIndex]) {
        e.preventDefault();
        onRunCommand(filtered[activeIndex].example || filtered[activeIndex].cmd);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, activeIndex, onRunCommand, onClose]);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-[#090d15] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-white/[0.08] bg-black/40 flex items-center gap-3">
          <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher une commande, syntaxe, drapeau CLI..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-slate-400 border border-white/[0.08] font-mono">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 font-sans">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              Aucune commande trouvée pour "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = activeIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    onRunCommand(item.example || item.cmd);
                    onClose();
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                    isSelected
                      ? 'bg-white/[0.06] border-white/[0.14]'
                      : 'bg-transparent border-transparent hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-semibold text-emerald-400">
                        {item.cmd}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        · {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{item.description}</p>
                    {item.example && (
                      <div className="mt-1 text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                        <span className="text-slate-600">Exemple:</span>
                        <code className="text-slate-400">{item.example}</code>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-80">
                    <button
                      onClick={e => handleCopy(item.example || item.cmd, e)}
                      title="Copier"
                      className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
                    >
                      {copiedCmd === (item.example || item.cmd) ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      title="Lancer"
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white/[0.06] text-slate-300'
                      }`}
                    >
                      <span>Lancer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-white/[0.06] bg-black/40 text-[11px] text-slate-500 font-mono flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">↓</kbd> naviguer</span>
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">Enter</kbd> exécuter</span>
          </div>
          <span>TaskCLI v2026.4</span>
        </div>
      </motion.div>
    </div>
  );
};
