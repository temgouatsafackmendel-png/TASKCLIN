export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'completed' | 'archived';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  project: string;
  tags: string[];
  dueDate?: string; // YYYY-MM-DD
  estimate?: string; // e.g. "2h", "45m", "1j"
  timeSpent: number; // in seconds
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  completedAt?: string; // ISO
  subtasks: SubTask[];
}

export type ViewMode = 'split' | 'terminal' | 'tui_list' | 'tui_kanban' | 'tui_matrix' | 'stats';

export type TerminalTheme = 'tokyo-night' | 'matrix' | 'cyber-slate' | 'catppuccin' | 'monochrome';

export interface TerminalEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'system';
  command?: string;
  timestamp: string;
  content: string | React.ReactNode;
  rawText?: string;
}

export interface CliCommandDef {
  name: string;
  usage: string;
  description: string;
  aliases?: string[];
  flags?: {
    flag: string;
    description: string;
    hasValue?: boolean;
  }[];
  examples?: string[];
}

export interface PomodoroState {
  isActive: boolean;
  isPaused: boolean;
  timeLeft: number; // in seconds
  duration: number; // total in seconds (e.g. 25 * 60)
  mode: 'work' | 'short_break' | 'long_break';
  taskId?: string;
}
