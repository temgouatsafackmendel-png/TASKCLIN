import React from 'react';
import { Task, TaskStatus, Priority } from '../types/task';
import { formatDuration, formatDueDate } from '../services/cliEngine';
import { Plus, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onInspectTask: (task: Task) => void;
  onQuickAddTask: (defaultStatus?: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; title: string; countColor: string; dotColor: string }[] = [
  { id: 'pending', title: 'À faire', countColor: 'text-slate-400', dotColor: 'bg-slate-400' },
  { id: 'in_progress', title: 'En cours', countColor: 'text-sky-400', dotColor: 'bg-sky-400' },
  { id: 'blocked', title: 'Bloqué', countColor: 'text-rose-400', dotColor: 'bg-rose-400' },
  { id: 'completed', title: 'Terminé', countColor: 'text-emerald-400', dotColor: 'bg-emerald-400' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
  onInspectTask,
  onQuickAddTask
}) => {
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(t => t.status === status);
  };

  const renderPriority = (p: Priority) => {
    switch (p) {
      case 'urgent':
        return <span className="text-rose-400 font-semibold text-[11px] font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Urgent</span>;
      case 'high':
        return <span className="text-amber-400 font-medium text-[11px] font-mono flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Haute</span>;
      case 'medium':
        return <span className="text-slate-400 text-[11px] font-mono">• Moyenne</span>;
      case 'low':
        return <span className="text-slate-600 text-[11px] font-mono">▽ Basse</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full overflow-x-auto p-1 font-sans">
      {COLUMNS.map(col => {
        const columnTasks = getTasksByStatus(col.id);

        return (
          <div
            key={col.id}
            className="flex flex-col rounded-xl border border-white/[0.08] bg-[#080d16] min-w-[260px] h-full overflow-hidden shadow-xl"
          >
            {/* Column Header */}
            <div className="p-3 border-b border-white/[0.06] bg-black/40 backdrop-blur flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <span className="font-semibold text-xs text-slate-200">{col.title}</span>
                <span className={`text-xs font-mono font-medium tabular-nums ${col.countColor}`}>
                  ({columnTasks.length})
                </span>
              </div>
              <button
                onClick={() => onQuickAddTask(col.id)}
                title={`Ajouter dans ${col.title}`}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Column List */}
            <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5">
              <AnimatePresence initial={false}>
                {columnTasks.length === 0 ? (
                  <div className="h-28 flex items-center justify-center border border-dashed border-white/[0.06] rounded-lg text-slate-600 text-xs font-mono">
                    Aucune tâche
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <motion.div
                      key={task.id}
                      layoutId={`task-card-${task.id}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => onInspectTask(task)}
                      className="p-3 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.16] transition-all cursor-pointer group shadow-sm flex flex-col gap-2"
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-semibold tabular-nums">#{task.id}</span>
                          <span aria-hidden="true" className="text-slate-700">·</span>
                          <span className="text-slate-400">{task.project}</span>
                        </div>
                        {renderPriority(task.priority)}
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-medium text-slate-200 line-clamp-2 group-hover:text-sky-300 transition-colors">
                        {task.title}
                      </h4>

                      {/* Metadata */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-white/[0.04]">
                        <span className="tabular-nums">
                          {task.dueDate ? formatDueDate(task.dueDate) : 'Sans échéance'}
                        </span>
                        {task.timeSpent > 0 && (
                          <span className="flex items-center gap-1 text-slate-400 tabular-nums">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {formatDuration(task.timeSpent)}
                          </span>
                        )}
                      </div>

                      {/* Quick Move Button Group */}
                      <div className="flex items-center justify-between pt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-slate-500 font-mono">Déplacer :</span>
                        <div className="flex items-center gap-1">
                          {col.id !== 'pending' && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onStatusChange(task.id, 'pending');
                              }}
                              className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                            >
                              À faire
                            </button>
                          )}
                          {col.id !== 'in_progress' && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onStatusChange(task.id, 'in_progress');
                              }}
                              className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/[0.04] hover:bg-sky-500/20 text-sky-400 hover:text-sky-200 transition-colors"
                            >
                              En cours
                            </button>
                          )}
                          {col.id !== 'completed' && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onStatusChange(task.id, 'completed');
                              }}
                              className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/[0.04] hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-200 transition-colors"
                            >
                              Terminé
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};
