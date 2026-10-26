import React, { useState, useRef, useEffect } from 'react';
import { TerminalEntry, TerminalTheme, Task } from '../types/task';
import { soundManager } from '../utils/audio';
import { Terminal as TerminalIcon, Volume2, VolumeX, Trash2, Copy, Check, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TerminalPromptProps {
  entries: TerminalEntry[];
  onExecute: (command: string) => void;
  onClear: () => void;
  history: string[];
  theme: TerminalTheme;
  soundEnabled: boolean;
  onToggleSound: () => void;
  tasks: Task[];
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const COMMON_COMMANDS = [
  'help',
  'task list',
  'task list -p urgent',
  'task list -s in_progress',
  'task add "Nouvelle tâche" -p high -P infra',
  'task done 1',
  'task stats',
  'task pomodoro start',
  'task show 1',
  'task export --format pdf',
  'theme tokyo-night',
  'theme matrix',
  'theme cyber-slate',
  'view kanban',
  'view split',
  'cls'
];

export const TerminalPrompt: React.FC<TerminalPromptProps> = ({
  entries,
  onExecute,
  onClear,
  history,
  theme,
  soundEnabled,
  onToggleSound,
  tasks,
  inputRef: externalInputRef
}) => {
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [copied, setCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(0);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = externalInputRef || internalInputRef;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [entries]);

  useEffect(() => {
    const trimmed = inputVal.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }

    const matches = COMMON_COMMANDS.filter(c => c.toLowerCase().startsWith(trimmed.toLowerCase()));

    if (trimmed.startsWith('task done ') || trimmed.startsWith('task show ') || trimmed.startsWith('task start ')) {
      const prefix = trimmed.slice(0, trimmed.lastIndexOf(' ') + 1);
      const idMatches = tasks.slice(0, 5).map(t => `${prefix}${t.id}`);
      setSuggestions(idMatches);
      setSelectedSuggestion(0);
      return;
    }

    setSuggestions(matches.slice(0, 4));
    setSelectedSuggestion(0);
  }, [inputVal, tasks]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') {
      soundManager.playKeypress();
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(history[nextIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(history[nextIndex]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInputVal(suggestions[selectedSuggestion]);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = inputVal.trim();
      if (!cmd) return;

      soundManager.playExec();
      onExecute(cmd);
      setInputVal('');
      setHistoryIndex(-1);
    }
  };

  const copyTerminalOutput = () => {
    const text = entries
      .map(e => (e.type === 'input' ? `task@2026:~ $ ${e.command}` : e.rawText || (typeof e.content === 'string' ? e.content : '')))
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'matrix':
        return {
          bg: 'bg-[#040d06]',
          border: 'border-emerald-950/60',
          text: 'text-emerald-400',
          prompt: 'text-emerald-500',
          cursor: 'caret-emerald-400',
          subtext: 'text-emerald-700',
          accent: 'text-emerald-300'
        };
      case 'cyber-slate':
        return {
          bg: 'bg-[#090e17]',
          border: 'border-slate-800/60',
          text: 'text-cyan-300',
          prompt: 'text-sky-400',
          cursor: 'caret-cyan-400',
          subtext: 'text-slate-500',
          accent: 'text-cyan-200'
        };
      case 'catppuccin':
        return {
          bg: 'bg-[#11111b]',
          border: 'border-[#1e1e2e]',
          text: 'text-[#cdd6f4]',
          prompt: 'text-[#f38ba8]',
          cursor: 'caret-[#f5c2e7]',
          subtext: 'text-[#6c7086]',
          accent: 'text-[#89b4fa]'
        };
      case 'monochrome':
        return {
          bg: 'bg-[#0a0a0a]',
          border: 'border-white/[0.08]',
          text: 'text-neutral-300',
          prompt: 'text-white',
          cursor: 'caret-white',
          subtext: 'text-neutral-500',
          accent: 'text-neutral-100'
        };
      case 'tokyo-night':
      default:
        return {
          bg: 'bg-[#080d16]',
          border: 'border-white/[0.08]',
          text: 'text-slate-300',
          prompt: 'text-emerald-400',
          cursor: 'caret-emerald-400',
          subtext: 'text-slate-500',
          accent: 'text-sky-400'
        };
    }
  };

  const themeStyle = getThemeClasses();

  return (
    <div className={`flex flex-col h-full rounded-xl border ${themeStyle.border} ${themeStyle.bg} overflow-hidden shadow-2xl font-mono text-[13px] leading-relaxed transition-colors duration-300`}>
      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-black/40 backdrop-blur select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block hover:opacity-100 transition-opacity"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block hover:opacity-100 transition-opacity"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block hover:opacity-100 transition-opacity"></span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
            <TerminalIcon className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-200">taskcli-v26.4</span>
            <span className="text-slate-600 font-normal">/</span>
            <span className="text-slate-400 font-normal text-[11px]">pty-main</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Désactiver le son tactile' : 'Activer le son tactile'}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-600" />}
          </button>
          <button
            onClick={copyTerminalOutput}
            title="Copier le tampon d'affichage"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClear}
            title="Nettoyer l'écran (cls)"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/[0.05] rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Screen Buffer */}
      <div
        ref={scrollContainerRef}
        onClick={() => activeInputRef.current?.focus()}
        className="flex-1 p-4 overflow-y-auto space-y-2.5 font-mono cursor-text select-text scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {entries.map(entry => {
            if (entry.type === 'input') {
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -3 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start gap-2 pt-1.5"
                >
                  <span className={`${themeStyle.prompt} font-semibold shrink-0 select-none flex items-center gap-1`}>
                    <span>task@2026:~</span>
                    <span className="text-slate-500">$</span>
                  </span>
                  <span className="text-white font-medium break-all">{entry.command}</span>
                  <span className="ml-auto text-[11px] text-slate-600 select-none tabular-nums shrink-0">
                    {entry.timestamp}
                  </span>
                </motion.div>
              );
            }

            let textStyle = themeStyle.text;
            if (entry.type === 'error') textStyle = 'text-rose-400';
            if (entry.type === 'success') textStyle = 'text-emerald-400';
            if (entry.type === 'info') textStyle = themeStyle.accent;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`whitespace-pre-wrap font-mono ${textStyle} text-[12px] leading-relaxed break-words pl-2 border-l border-white/[0.05]`}
              >
                {entry.content}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Autocomplete Hints Dropdown */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-white/[0.06] bg-black/60 backdrop-blur flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider shrink-0 flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-emerald-400" /> [Tab] :
          </span>
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setInputVal(sug);
                activeInputRef.current?.focus();
              }}
              className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-mono transition-colors shrink-0 border border-white/[0.06]"
            >
              {sug}
            </button>
          ))}
        </div>
      )}

      {/* Prompt Input Line */}
      <div className="p-3 border-t border-white/[0.06] bg-black/40 backdrop-blur flex items-center gap-2">
        <span className={`${themeStyle.prompt} font-semibold shrink-0 select-none flex items-center gap-1`}>
          <span>task@2026:~</span>
          <span className="text-slate-500">$</span>
        </span>

        <div className="flex-1 relative">
          <input
            ref={activeInputRef}
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Entrez une commande (ex: task list, task export --format pdf, help)..."
            className={`w-full bg-transparent outline-none text-slate-100 ${themeStyle.cursor} font-mono text-[13px] placeholder:text-slate-600`}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        <button
          onClick={() => {
            const cmd = inputVal.trim();
            if (cmd) {
              soundManager.playExec();
              onExecute(cmd);
              setInputVal('');
              setHistoryIndex(-1);
            }
          }}
          disabled={!inputVal.trim()}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-medium transition-colors disabled:opacity-20 disabled:pointer-events-none shrink-0"
        >
          Exécuter
        </button>
      </div>

      {/* Quick Launch Strip */}
      <div className="px-3 py-1.5 bg-black/60 border-t border-white/[0.04] flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-400 select-none">
        <span className="text-slate-500 font-mono text-[10px] uppercase tracking-wider shrink-0">
          CLI Presets:
        </span>
        {[
          { label: 'ls', cmd: 'task list' },
          { label: 'urgentes', cmd: 'task list -p urgent' },
          { label: 'en cours', cmd: 'task list -s in_progress' },
          { label: '+ tâche', cmd: 'task add "Nouvelle tâche" -p high' },
          { label: 'stats', cmd: 'task stats' },
          { label: 'rapport pdf', cmd: 'task export --format pdf' },
          { label: 'pomodoro', cmd: 'task pomodoro start' },
          { label: 'help', cmd: 'help' }
        ].map(item => (
          <button
            key={item.label}
            onClick={() => {
              onExecute(item.cmd);
              soundManager.playKeypress();
            }}
            className="px-2 py-0.5 rounded border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 font-mono text-[11px]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
