import React from 'react';
import { Task } from '../types/task';
import { formatDueDate } from '../services/cliEngine';
import { Flame, Calendar, UserCheck, Trash2, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EisenhowerMatrixProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onInspectTask: (task: Task) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onToggleTask,
  onInspectTask
}) => {
  const q1Tasks = tasks.filter(t => t.status !== 'completed' && t.priority === 'urgent');
  const q2Tasks = tasks.filter(t => t.status !== 'completed' && t.priority === 'high');
  const q3Tasks = tasks.filter(t => t.status !== 'completed' && t.priority === 'medium');
  const q4Tasks = tasks.filter(t => t.status !== 'completed' && t.priority === 'low');

  const quadrants = [
    {
      title: 'Q1: Urgent & Critique (Faire immédiatement)',
      icon: <Flame className="w-4 h-4 text-rose-400" />,
      tasks: q1Tasks,
      border: 'border-rose-500/20',
      headerBg: 'bg-rose-950/20 text-rose-300'
    },
    {
      title: 'Q2: Stratégique & Important (Planifier)',
      icon: <Calendar className="w-4 h-4 text-amber-400" />,
      tasks: q2Tasks,
      border: 'border-amber-500/20',
      headerBg: 'bg-amber-950/20 text-amber-300'
    },
    {
      title: 'Q3: Opérationnel & Rapide (Déléguer / Traiter)',
      icon: <UserCheck className="w-4 h-4 text-sky-400" />,
      tasks: q3Tasks,
      border: 'border-sky-500/20',
      headerBg: 'bg-sky-950/20 text-sky-300'
    },
    {
      title: 'Q4: Secondaire (Éliminer / Reporter)',
      icon: <Trash2 className="w-4 h-4 text-slate-400" />,
      tasks: q4Tasks,
      border: 'border-white/[0.08]',
      headerBg: 'bg-white/[0.02] text-slate-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full p-1 overflow-y-auto font-sans">
      {quadrants.map((q, idx) => (
        <div
          key={idx}
          className={`flex flex-col rounded-xl border ${q.border} bg-[#080d16] overflow-hidden shadow-xl`}
        >
          {/* Header */}
          <div className={`p-3.5 border-b border-white/[0.06] ${q.headerBg} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              {q.icon}
              <span className="font-semibold text-xs tracking-tight">{q.title}</span>
            </div>
            <span className="text-xs font-mono font-medium tabular-nums">({q.tasks.length})</span>
          </div>

          {/* List */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            <AnimatePresence initial={false}>
              {q.tasks.length === 0 ? (
                <div className="h-28 flex items-center justify-center text-slate-600 text-xs font-mono">
                  Aucune tâche active dans ce cadran.
                </div>
              ) : (
                q.tasks.map(task => (
                  <motion.div
                    key={task.id}
                    layoutId={`matrix-${task.id}`}
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    onClick={() => onInspectTask(task)}
                    className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-colors cursor-pointer flex items-start gap-2.5 group"
                  >
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onToggleTask(task.id);
                      }}
                      className="mt-0.5 text-slate-500 hover:text-emerald-400 transition-colors"
                      title="Valider la tâche"
                    >
                      <Circle className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mb-0.5">
                        <span className="font-semibold text-slate-400 tabular-nums">#{task.id} · {task.project}</span>
                        <span>{task.dueDate ? formatDueDate(task.dueDate) : '—'}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 line-clamp-1 group-hover:text-sky-300 transition-colors">
                        {task.title}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
};
