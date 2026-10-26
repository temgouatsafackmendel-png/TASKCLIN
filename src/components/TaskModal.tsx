import React, { useState } from 'react';
import { Task, Priority, TaskStatus, SubTask } from '../types/task';
import { formatDuration } from '../services/cliEngine';
import {
  X,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Tag,
  Folder,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TaskModalProps {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  isCreateMode?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  isCreateMode = false
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(task?.title || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'pending');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'medium');
  const [project, setProject] = useState(task?.project || 'general');
  const [tagsStr, setTagsStr] = useState(task?.tags.join(', ') || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || '');
  const [estimate, setEstimate] = useState(task?.estimate || '');
  const [notes, setNotes] = useState(task?.notes || '');
  const [subtasks, setSubtasks] = useState<SubTask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsStr
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    onSave({
      title: title.trim(),
      status,
      priority,
      project: project.trim() || 'general',
      tags: parsedTags,
      dueDate: dueDate || undefined,
      estimate: estimate || undefined,
      notes: notes.trim() || undefined,
      subtasks
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-[#0b0f17] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/[0.08] bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold tracking-wider text-slate-300">
              {isCreateMode ? 'NOUVELLE TÂCHE SYSTÈME' : `INSPECTION TÂCHE #${task?.id}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs font-sans">
          {/* Title */}
          <div>
            <label className="block font-mono text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
              Titre de la tâche *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Refactoriser le cache Redis en cluster"
              required
              className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 font-medium text-sm transition-colors"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">Statut</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 focus:outline-none font-mono"
              >
                <option value="pending" className="bg-slate-900">○ À faire</option>
                <option value="in_progress" className="bg-slate-900">▶ En cours</option>
                <option value="blocked" className="bg-slate-900">✕ Bloqué</option>
                <option value="completed" className="bg-slate-900">✔ Terminé</option>
                <option value="archived" className="bg-slate-900">⌸ Archivé</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">Priorité</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 focus:outline-none font-mono"
              >
                <option value="urgent" className="bg-slate-900">⚡ Urgent</option>
                <option value="high" className="bg-slate-900">▲ Haute</option>
                <option value="medium" className="bg-slate-900">• Moyenne</option>
                <option value="low" className="bg-slate-900">▽ Basse</option>
              </select>
            </div>
          </div>

          {/* Project & Due date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
                <Folder className="w-3 h-3 inline mr-1 text-slate-500" /> Projet
              </label>
              <input
                type="text"
                value={project}
                onChange={e => setProject(e.target.value)}
                placeholder="infra, frontend, securite..."
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
                <Calendar className="w-3 h-3 inline mr-1 text-slate-500" /> Échéance
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Tags & Estimate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
                <Tag className="w-3 h-3 inline mr-1 text-slate-500" /> Tags
              </label>
              <input
                type="text"
                value={tagsStr}
                onChange={e => setTagsStr(e.target.value)}
                placeholder="dev, audit, perf (séparés par virgule)"
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-mono text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
                <Clock className="w-3 h-3 inline mr-1 text-slate-500" /> Estimation
              </label>
              <input
                type="text"
                value={estimate}
                onChange={e => setEstimate(e.target.value)}
                placeholder="Ex: 2h, 45m"
                className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-mono text-[11px] text-slate-400 mb-1.5 uppercase tracking-wider">
              <FileText className="w-3 h-3 inline mr-1 text-slate-500" /> Spécifications & Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Détails techniques, protocoles, critères d'acceptation..."
              className="w-full px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Subtasks Section */}
          <div className="border-t border-white/[0.08] pt-3.5">
            <label className="block font-mono text-[11px] text-slate-400 mb-2 uppercase tracking-wider">
              Sous-tâches checklist ({subtasks.filter(s => s.completed).length}/{subtasks.length})
            </label>
            <div className="space-y-1.5 mb-2.5">
              {subtasks.map(st => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(st.id)}
                      className="text-slate-500 hover:text-emerald-400"
                    >
                      {st.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </button>
                    <span
                      className={`text-xs ${
                        st.completed ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Nouvelle sous-tâche..."
                className="flex-1 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-slate-200 font-mono"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 rounded-lg text-xs font-mono transition-colors"
              >
                + Ajouter
              </button>
            </div>
          </div>

          {!isCreateMode && task && (
            <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <span>Créée : {new Date(task.createdAt).toLocaleString('fr-FR')}</span>
              <span className="tabular-nums">Temps passé : {formatDuration(task.timeSpent)}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.06] text-slate-300 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-md shadow-emerald-950"
            >
              {isCreateMode ? 'Créer la tâche' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
