import React, { useState, useMemo, useEffect } from 'react';
import { Task, Priority, TaskStatus } from '../types/task';
import { formatDuration, formatDueDate } from '../services/cliEngine';
import { soundManager } from '../utils/audio';
import {
  CheckCircle2,
  Circle,
  Play,
  Square,
  Trash2,
  Edit3,
  Clock,
  Search,
  Check,
  Plus,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskTableProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onInspectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onStartTimer: (id: string) => void;
  onStopTimer: () => void;
  activeTimerId: string | null;
  onQuickAddTask: () => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
  onInspectTask,
  onEditTask,
  onStartTimer,
  onStopTimer,
  activeTimerId,
  onQuickAddTask
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [projectFilter, setProjectFilter] = useState<'all' | string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const uniqueProjects = useMemo(() => {
    return Array.from(new Set(tasks.map(t => t.project))).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (projectFilter !== 'all' && t.project !== projectFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchProject = t.project.toLowerCase().includes(query);
        const matchTags = t.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchTitle && !matchProject && !matchTags) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, projectFilter, search]);

  // Keyboard navigation for table rows (j/k or arrows)
  useEffect(() => {
    const handleTableKeys = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(filteredTasks.length - 1, prev + 1));
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === ' ' && filteredTasks[selectedIndex]) {
        e.preventDefault();
        onToggleTask(filteredTasks[selectedIndex].id);
      } else if (e.key === 'x' && filteredTasks[selectedIndex]) {
        e.preventDefault();
        onDeleteTask(filteredTasks[selectedIndex].id);
      } else if (e.key === 'e' && filteredTasks[selectedIndex]) {
        e.preventDefault();
        onEditTask(filteredTasks[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleTableKeys);
    return () => window.removeEventListener('keydown', handleTableKeys);
  }, [filteredTasks, selectedIndex, onToggleTask, onDeleteTask, onEditTask]);

  const renderPriority = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return <span className="text-rose-400 font-semibold tracking-wide flex items-center gap-1 font-mono text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Urgent</span>;
      case 'high':
        return <span className="text-amber-400 font-medium flex items-center gap-1 font-mono text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Haute</span>;
      case 'medium':
        return <span className="text-slate-400 font-normal flex items-center gap-1 font-mono text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Moyenne</span>;
      case 'low':
        return <span className="text-slate-600 font-normal flex items-center gap-1 font-mono text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span> Basse</span>;
    }
  };

  const renderStatus = (s: TaskStatus) => {
    switch (s) {
      case 'completed':
        return <span className="text-emerald-400 font-medium font-mono text-[11px] flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Terminé</span>;
      case 'in_progress':
        return <span className="text-sky-400 font-medium font-mono text-[11px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span> En cours</span>;
      case 'blocked':
        return <span className="text-rose-400 font-medium font-mono text-[11px]">✕ Bloqué</span>;
      case 'pending':
      default:
        return <span className="text-slate-400 font-normal font-mono text-[11px]">○ À faire</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080d16] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
      {/* Top Filter & Toolbar */}
      <div className="p-3 border-b border-white/[0.06] bg-black/40 backdrop-blur flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrer titre, tag, projet..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-white/20 font-mono transition-colors"
          />
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-white/[0.08] text-xs">
            {(['all', 'pending', 'in_progress', 'completed'] as const).map(s => {
              const labels: Record<string, string> = {
                all: 'Tous',
                pending: 'À faire',
                in_progress: 'En cours',
                completed: 'Terminé'
              };
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {labels[s]}
                </button>
              );
            })}
          </div>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as Priority | 'all')}
            className="bg-black/50 text-xs text-slate-300 border border-white/[0.08] rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
          >
            <option value="all">Priorités (toutes)</option>
            <option value="urgent">⚡ Urgent</option>
            <option value="high">▲ Haute</option>
            <option value="medium">• Moyenne</option>
            <option value="low">▽ Basse</option>
          </select>

          <select
            value={projectFilter}
            onChange={e => setProjectFilter(e.target.value)}
            className="bg-black/50 text-xs text-slate-300 border border-white/[0.08] rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
          >
            <option value="all">Projets (tous)</option>
            {uniqueProjects.map(p => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <button
            onClick={onQuickAddTask}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>

      {/* High Density Table Body */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-black/30 text-slate-400 font-mono text-[10.5px] uppercase tracking-wider sticky top-0 z-10 backdrop-blur">
              <th className="py-2.5 pl-4 pr-2 w-12 text-center">#</th>
              <th className="py-2.5 px-2 w-10 text-center">État</th>
              <th className="py-2.5 px-3 min-w-[280px]">Tâche & Sous-tâches</th>
              <th className="py-2.5 px-3 w-32">Priorité</th>
              <th className="py-2.5 px-3 w-28">Projet</th>
              <th className="py-2.5 px-3 w-36">Échéance</th>
              <th className="py-2.5 px-3 w-24 text-right">Temps</th>
              <th className="py-2.5 pr-4 pl-2 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] font-sans">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-slate-500 font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <SlidersHorizontal className="w-6 h-6 text-slate-600 stroke-1" />
                    <span>Aucune tâche ne correspond aux critères filtrés.</span>
                    <button
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                        setPriorityFilter('all');
                        setProjectFilter('all');
                      }}
                      className="text-xs text-sky-400 hover:underline font-mono mt-1"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTasks.map((task, idx) => {
                const isSelected = selectedIndex === idx;
                const isTimerActive = activeTimerId === task.id;
                const isDone = task.status === 'completed';

                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`group transition-colors h-11 relative ${
                      isSelected
                        ? 'bg-white/[0.06]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* ID */}
                    <td className="py-2 pl-4 pr-2 text-center font-mono text-slate-500 tabular-nums text-[11px]">
                      {task.id}
                    </td>

                    {/* Toggle check */}
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onToggleTask(task.id);
                        }}
                        className="text-slate-500 hover:text-emerald-400 transition-colors p-1"
                        title={isDone ? 'Marquer comme non terminé' : 'Marquer comme terminé'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 hover:text-slate-300" />
                        )}
                      </button>
                    </td>

                    {/* Title & Unboxed Metadata */}
                    <td className="py-2 px-3">
                      <div className="flex flex-col">
                        <span
                          onClick={() => onInspectTask(task)}
                          className={`font-medium cursor-pointer transition-colors ${
                            isDone ? 'line-through text-slate-500' : 'text-slate-100 hover:text-sky-300'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Unboxed inline metadata */}
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                          {task.subtasks.length > 0 && (
                            <>
                              <span className="tabular-nums">
                                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} sous-tâches
                              </span>
                              <span aria-hidden="true" className="text-slate-700">·</span>
                            </>
                          )}
                          {task.tags.length > 0 && (
                            <span className="text-slate-400">
                              {task.tags.map(t => `#${t}`).join(' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      {renderPriority(task.priority)}
                    </td>

                    {/* Project */}
                    <td className="py-2 px-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {task.project}
                    </td>

                    {/* Due Date */}
                    <td className="py-2 px-3 font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap">
                      {formatDueDate(task.dueDate)}
                    </td>

                    {/* Time Spent */}
                    <td className="py-2 px-3 text-right font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                      <span className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatDuration(task.timeSpent)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2 pr-4 pl-2 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            if (isTimerActive) onStopTimer();
                            else onStartTimer(task.id);
                          }}
                          title={isTimerActive ? 'Arrêter timer' : 'Démarrer timer'}
                          className={`p-1.5 rounded transition-colors ${
                            isTimerActive
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-slate-400 hover:text-sky-300 hover:bg-white/[0.05]'
                          }`}
                        >
                          {isTimerActive ? (
                            <Square className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onEditTask(task);
                          }}
                          title="Modifier"
                          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                          }}
                          title="Supprimer"
                          className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-white/[0.05] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Keycap Strip */}
      <div className="px-4 py-2 bg-black/40 border-t border-white/[0.06] text-[11px] text-slate-500 font-mono flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="tabular-nums">{filteredTasks.length} sur {tasks.length} tâches</span>
          <span aria-hidden="true" className="text-slate-700">·</span>
          <span className="tabular-nums">{tasks.filter(t => t.status === 'completed').length} terminées</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-500">
          <span><kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">j</kbd>/<kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">k</kbd> navigation</span>
          <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">Space</kbd> valider</span>
          <span><kbd className="px-1 py-0.5 rounded bg-white/[0.06] border border-white/[0.08]">x</kbd> supprimer</span>
        </div>
      </div>
    </div>
  );
};
