import React, { useState, useEffect, useRef } from 'react';
import { Task, ViewMode, TerminalTheme, TerminalEntry, PomodoroState } from './types/task';
import {
  loadTasks,
  saveTasks,
  loadHistory,
  saveHistory,
  loadAliases,
  saveAliases,
  loadTheme,
  saveTheme,
  loadSoundSetting,
  saveSoundSetting,
  loadViewMode,
  saveViewMode
} from './utils/storage';
import { soundManager } from './utils/audio';
import { executeCliCommand } from './services/cliEngine';
import { generateTasksPdfReport } from './utils/pdfGenerator';
import { TerminalPrompt } from './components/TerminalPrompt';
import { TaskTable } from './components/TaskTable';
import { KanbanBoard } from './components/KanbanBoard';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { StatsView } from './components/StatsView';
import { PomodoroWidget } from './components/PomodoroWidget';
import { TaskModal } from './components/TaskModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { PdfReportViewerModal } from './components/PdfReportViewerModal';
import {
  Terminal as TerminalIcon,
  Plus,
  LayoutGrid,
  Columns,
  List,
  BarChart2,
  Sliders,
  Sparkles,
  FileText,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<TerminalTheme>('tokyo-night');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);

  // Active time tracking state
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<string | null>(null);

  // Pomodoro state
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    isActive: false,
    isPaused: true,
    timeLeft: 25 * 60,
    duration: 25 * 60,
    mode: 'work'
  });

  // PDF Viewer Modal state
  const [isGlobalPdfModalOpen, setIsGlobalPdfModalOpen] = useState(false);
  const [globalPdfData, setGlobalPdfData] = useState<{ blobUrl: string; dataUri: string; filename: string } | null>(null);

  // Modals state
  const [inspectTask, setInspectTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const cliInputRef = useRef<HTMLInputElement>(null);

  // Initial load
  useEffect(() => {
    const loadedTasks = loadTasks();
    const loadedHistory = loadHistory();
    const loadedAliases = loadAliases();
    const loadedTheme = loadTheme();
    const loadedSound = loadSoundSetting();
    const loadedView = loadViewMode();

    setTasks(loadedTasks);
    setHistory(loadedHistory);
    setAliases(loadedAliases);
    setTheme(loadedTheme);
    setSoundEnabled(loadedSound);
    soundManager.enabled = loadedSound;
    setViewMode(loadedView);

    // Initial greeting in terminal
    const welcomeEntry: TerminalEntry = {
      id: 'welcome-0',
      type: 'info',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      content: `TaskCLI 2026.4 [Session hybride x86_64-systems-core]
Système de gestion de tâches haute performance en ligne de commande.
Tapez 'help' pour le manuel complet ou 'task list' pour afficher vos tâches.
Générez un rapport exécutif avec 'task export --format pdf'.
Appuyez sur [Ctrl+K] pour la palette de commandes ou [/] pour focaliser l'invite.`
    };
    setTerminalEntries([welcomeEntry]);
  }, []);

  // Save changes
  useEffect(() => {
    if (tasks.length > 0) saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  useEffect(() => {
    saveAliases(aliases);
  }, [aliases]);

  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveSoundSetting(soundEnabled);
    soundManager.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    saveViewMode(viewMode);
  }, [viewMode]);

  // Real-time second counter for active timer task
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeTimerTaskId) {
      interval = setInterval(() => {
        setTasks(prev =>
          prev.map(t => (t.id === activeTimerTaskId ? { ...t, timeSpent: t.timeSpent + 1 } : t))
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimerTaskId]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
        return;
      }

      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        cliInputRef.current?.focus();
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        setViewMode(curr => {
          if (curr === 'split') return 'terminal';
          if (curr === 'terminal') return 'tui_list';
          if (curr === 'tui_list') return 'tui_kanban';
          if (curr === 'tui_kanban') return 'tui_matrix';
          return 'split';
        });
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Open and display PDF Report modal
  const handleOpenPdfReport = () => {
    try {
      soundManager.playKeypress();
      const res = generateTasksPdfReport(tasks);
      setGlobalPdfData({
        blobUrl: res.blobUrl,
        dataUri: res.dataUri,
        filename: res.filename
      });
      setIsGlobalPdfModalOpen(true);
      soundManager.playSuccess();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      soundManager.playError();
    }
  };

  // CLI Command Execution handler
  const handleExecuteCommand = (rawCommand: string) => {
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const inputEntry: TerminalEntry = {
      id: `in-${Date.now()}`,
      type: 'input',
      command: rawCommand,
      timestamp: now,
      content: ''
    };

    setHistory(prev => [...prev.filter(c => c !== rawCommand), rawCommand]);

    const res = executeCliCommand(rawCommand, tasks, aliases, activeTimerTaskId);

    if (res.clearScreen) {
      setTerminalEntries([]);
      return;
    }

    if (res.updatedTasks) {
      setTasks(res.updatedTasks);
    }

    if (res.themeChange) {
      setTheme(res.themeChange);
    }

    if (res.viewChange) {
      setViewMode(res.viewChange);
    }

    if (res.soundChange !== undefined) {
      setSoundEnabled(res.soundChange);
    }

    if (res.aliasesChange) {
      setAliases(res.aliasesChange);
    }

    if (res.activeTimerTaskId !== undefined) {
      setActiveTimerTaskId(res.activeTimerTaskId);
    }

    if (res.pomodoroAction) {
      if (res.pomodoroAction === 'start') {
        setPomodoro(p => ({ ...p, isActive: true, isPaused: false }));
      } else if (res.pomodoroAction === 'pause') {
        setPomodoro(p => ({ ...p, isPaused: true }));
      } else if (res.pomodoroAction === 'reset') {
        setPomodoro(p => ({ ...p, isActive: false, isPaused: true, timeLeft: p.duration }));
      }
    }

    if (res.rawExportData) {
      const blob = new Blob([res.rawExportData.data], { type: res.rawExportData.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.rawExportData.filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    if (res.pdfExportRequested) {
      handleOpenPdfReport();
    }

    if (res.type === 'success') {
      soundManager.playSuccess();
    } else if (res.type === 'error') {
      soundManager.playError();
    }

    const outputEntry: TerminalEntry = {
      id: `out-${Date.now()}`,
      type: res.type,
      timestamp: now,
      content: res.output,
      rawText: res.output
    };

    setTerminalEntries(prev => [...prev, inputEntry, outputEntry]);
  };

  const handleToggleTask = (id: string) => {
    soundManager.playKeypress();
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const isDone = t.status === 'completed';
          return {
            ...t,
            status: isDone ? 'pending' : 'completed',
            completedAt: isDone ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    soundManager.playKeypress();
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeTimerTaskId === id) setActiveTimerTaskId(null);
  };

  const handleStatusChange = (id: string, newStatus: Task['status']) => {
    soundManager.playKeypress();
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
              updatedAt: new Date().toISOString()
            }
          : t
      )
    );
  };

  const handleSaveModalTask = (taskData: Partial<Task>) => {
    if (isCreateMode) {
      const maxId = tasks.reduce((max, t) => {
        const num = parseInt(t.id, 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      const newId = String(maxId + 1);

      const newTask: Task = {
        id: newId,
        title: taskData.title || 'Nouvelle tâche',
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        project: taskData.project || 'general',
        tags: taskData.tags || [],
        dueDate: taskData.dueDate,
        estimate: taskData.estimate,
        timeSpent: 0,
        notes: taskData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: taskData.subtasks || []
      };

      setTasks([newTask, ...tasks]);
      soundManager.playSuccess();
    } else if (inspectTask) {
      setTasks(prev =>
        prev.map(t =>
          t.id === inspectTask.id
            ? {
                ...t,
                ...taskData,
                updatedAt: new Date().toISOString()
              }
            : t
        )
      );
      soundManager.playSuccess();
    }
  };

  const handleExport = (format: 'json' | 'csv' | 'markdown' | 'pdf') => {
    if (format === 'pdf') {
      handleOpenPdfReport();
    } else {
      handleExecuteCommand(`task export --format ${format}`);
    }
  };

  const activeTaskForTimer = tasks.find(t => t.id === activeTimerTaskId);

  const navItems: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'split', label: 'Split', icon: <Columns className="w-3.5 h-3.5" /> },
    { id: 'terminal', label: 'Terminal', icon: <TerminalIcon className="w-3.5 h-3.5" /> },
    { id: 'tui_list', label: 'Tableau', icon: <List className="w-3.5 h-3.5" /> },
    { id: 'tui_kanban', label: 'Kanban', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'tui_matrix', label: 'Matrice', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'stats', label: 'Vélocité', icon: <BarChart2 className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/25 selection:text-emerald-300 antialiased">
      {/* 
        TOP BAR CONTRACT:
        Zone 1: Brand title wordmark, single line
        Zone 2: 4-5 single-line nav links with sliding motion indicator
        Zone 3: 1 primary action button + utility controls
      */}
      <header className="flex items-center justify-between gap-6 px-5 py-3 border-b border-white/[0.08] bg-[#090d15]/90 backdrop-blur-md sticky top-0 z-30 select-none">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
            <TerminalIcon className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-white font-mono whitespace-nowrap">
              TaskCLI
            </span>
            <span className="text-slate-600 font-mono text-xs">/</span>
            <span className="text-slate-400 font-mono text-xs">2026.4</span>
          </div>
        </div>

        {/* Zone 2: Animated Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-black/50 rounded-xl border border-white/[0.08] text-xs font-medium relative">
          {navItems.map(item => {
            const isActive = viewMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id)}
                className={`relative px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 z-10 ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute inset-0 bg-white/[0.1] rounded-lg -z-10 border border-white/[0.12] shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Pomodoro, PDF, Command Palette & Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <PomodoroWidget
            pomodoro={pomodoro}
            setPomodoro={setPomodoro}
            activeTask={activeTaskForTimer}
          />

          {/* Quick PDF Report button */}
          <button
            onClick={handleOpenPdfReport}
            title="Afficher le Rapport PDF exécutif (jsPDF)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-200 text-xs font-mono transition-colors whitespace-nowrap shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Rapport PDF</span>
            <span className="lg:hidden">PDF</span>
          </button>

          {/* Command Palette Trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Ouvrir la palette de commandes (Ctrl+K)"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Commandes</span>
            <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-slate-400 border border-white/[0.08]">
              ⌘K
            </kbd>
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              setIsCreateMode(true);
              setInspectTask(null);
              setIsTaskModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md shadow-emerald-950 font-sans"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Tâche</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Viewport with smooth view transitions */}
      <main className="flex-1 p-4 md:p-6 max-w-[1680px] w-full mx-auto flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {viewMode === 'split' && (
            <motion.div
              key="view-split"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-130px)] min-h-[560px]"
            >
              {/* Left Column: Interactive Terminal Prompt */}
              <div className="lg:col-span-6 h-full flex flex-col">
                <TerminalPrompt
                  entries={terminalEntries}
                  onExecute={handleExecuteCommand}
                  onClear={() => setTerminalEntries([])}
                  history={history}
                  theme={theme}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled(!soundEnabled)}
                  tasks={tasks}
                  inputRef={cliInputRef}
                />
              </div>

              {/* Right Column: Live Structured TUI Data Grid */}
              <div className="lg:col-span-6 h-full flex flex-col">
                <TaskTable
                  tasks={tasks}
                  onToggleTask={handleToggleTask}
                  onDeleteTask={handleDeleteTask}
                  onInspectTask={task => {
                    setInspectTask(task);
                    setIsCreateMode(false);
                    setIsTaskModalOpen(true);
                  }}
                  onEditTask={task => {
                    setInspectTask(task);
                    setIsCreateMode(false);
                    setIsTaskModalOpen(true);
                  }}
                  onStartTimer={id => handleExecuteCommand(`task timer start ${id}`)}
                  onStopTimer={() => handleExecuteCommand('task timer stop')}
                  activeTimerId={activeTimerTaskId}
                  onQuickAddTask={() => {
                    setIsCreateMode(true);
                    setInspectTask(null);
                    setIsTaskModalOpen(true);
                  }}
                />
              </div>
            </motion.div>
          )}

          {viewMode === 'terminal' && (
            <motion.div
              key="view-terminal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="h-[calc(100vh-130px)] min-h-[580px] flex flex-col"
            >
              <TerminalPrompt
                entries={terminalEntries}
                onExecute={handleExecuteCommand}
                onClear={() => setTerminalEntries([])}
                history={history}
                theme={theme}
                soundEnabled={soundEnabled}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                tasks={tasks}
                inputRef={cliInputRef}
              />
            </motion.div>
          )}

          {viewMode === 'tui_list' && (
            <motion.div
              key="view-list"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="h-[calc(100vh-130px)] min-h-[580px] flex flex-col"
            >
              <TaskTable
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
                onInspectTask={task => {
                  setInspectTask(task);
                  setIsCreateMode(false);
                  setIsTaskModalOpen(true);
                }}
                onEditTask={task => {
                  setInspectTask(task);
                  setIsCreateMode(false);
                  setIsTaskModalOpen(true);
                }}
                onStartTimer={id => handleExecuteCommand(`task timer start ${id}`)}
                onStopTimer={() => handleExecuteCommand('task timer stop')}
                activeTimerId={activeTimerTaskId}
                onQuickAddTask={() => {
                  setIsCreateMode(true);
                  setInspectTask(null);
                  setIsTaskModalOpen(true);
                }}
              />
            </motion.div>
          )}

          {viewMode === 'tui_kanban' && (
            <motion.div
              key="view-kanban"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="h-[calc(100vh-130px)] min-h-[580px] flex flex-col"
            >
              <KanbanBoard
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onInspectTask={task => {
                  setInspectTask(task);
                  setIsCreateMode(false);
                  setIsTaskModalOpen(true);
                }}
                onQuickAddTask={defaultStatus => {
                  setIsCreateMode(true);
                  setInspectTask(defaultStatus ? ({ status: defaultStatus } as Task) : null);
                  setIsTaskModalOpen(true);
                }}
              />
            </motion.div>
          )}

          {viewMode === 'tui_matrix' && (
            <motion.div
              key="view-matrix"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="h-[calc(100vh-130px)] min-h-[580px] flex flex-col"
            >
              <EisenhowerMatrix
                tasks={tasks}
                onToggleTask={handleToggleTask}
                onInspectTask={task => {
                  setInspectTask(task);
                  setIsCreateMode(false);
                  setIsTaskModalOpen(true);
                }}
              />
            </motion.div>
          )}

          {viewMode === 'stats' && (
            <motion.div
              key="view-stats"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="h-[calc(100vh-130px)] min-h-[580px] flex flex-col"
            >
              <StatsView tasks={tasks} onExport={handleExport} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modern Developer Status Bar */}
      <footer className="px-5 py-2 border-t border-white/[0.06] bg-[#090d15] text-[11px] text-slate-500 font-mono flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Session active</span>
          </div>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span>{tasks.length} tâches ({tasks.filter(t => t.status === 'completed').length} validées)</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="hidden md:inline">Moteur x86_64 WebCore</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-500">
          <span><kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">⌘K</kbd> Palette</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">/</kbd> CLI</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">F2</kbd> Vues</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">Space</kbd> Cocher</span>
        </div>
      </footer>

      {/* Task Creation & Inspection Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={inspectTask}
        isCreateMode={isCreateMode}
        onClose={() => {
          setIsTaskModalOpen(false);
          setInspectTask(null);
        }}
        onSave={handleSaveModalTask}
      />

      {/* Command Palette Modal */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onRunCommand={cmd => {
          handleExecuteCommand(cmd);
          if (viewMode !== 'split' && viewMode !== 'terminal') {
            setViewMode('split');
          }
        }}
      />

      {/* Global PDF Report Viewer Modal */}
      <PdfReportViewerModal
        isOpen={isGlobalPdfModalOpen}
        onClose={() => setIsGlobalPdfModalOpen(false)}
        tasks={tasks}
        pdfBlobUrl={globalPdfData?.blobUrl}
        pdfDataUri={globalPdfData?.dataUri}
        filename={globalPdfData?.filename}
      />
    </div>
  );
}
