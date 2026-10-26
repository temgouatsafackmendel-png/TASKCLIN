import { Task, TerminalTheme, ViewMode } from '../types/task';

const TASKS_KEY = 'taskcli_2026_tasks';
const HISTORY_KEY = 'taskcli_2026_history';
const ALIASES_KEY = 'taskcli_2026_aliases';
const THEME_KEY = 'taskcli_2026_theme';
const SOUND_KEY = 'taskcli_2026_sound';
const VIEW_KEY = 'taskcli_2026_view';

export const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Migrer la passerelle API vers HTTP/3 et eBPF',
    status: 'in_progress',
    priority: 'urgent',
    project: 'infra',
    tags: ['performance', 'network', 'rust'],
    dueDate: '2026-10-30',
    estimate: '6h',
    timeSpent: 7200, // 2h
    notes: 'Réduire la latence P99 sous les 8ms sur le cluster européen. Vérifier la compatibilité TLS 1.3 0-RTT.',
    createdAt: '2026-10-24T08:30:00Z',
    updatedAt: '2026-10-26T09:15:00Z',
    subtasks: [
      { id: '1-1', title: 'Profiler les sockets kernel sous forte charge', completed: true },
      { id: '1-2', title: 'Compiler le module eBPF avec bpf-linker', completed: true },
      { id: '1-3', title: 'Valider le benchmark de latence k6', completed: false }
    ]
  },
  {
    id: '2',
    title: 'Audit de sécurité Zero-Trust & rotation des clés ed25519',
    status: 'pending',
    priority: 'high',
    project: 'securite',
    tags: ['audit', 'crypto', 'compliance'],
    dueDate: '2026-11-02',
    estimate: '3h',
    timeSpent: 0,
    notes: 'Contrôler les politiques mTLS et automatiser la révocation des jetons de service orphelins.',
    createdAt: '2026-10-25T11:00:00Z',
    updatedAt: '2026-10-25T11:00:00Z',
    subtasks: [
      { id: '2-1', title: 'Lister les tokens actifs avec TaskCLI audit', completed: false },
      { id: '2-2', title: 'Appliquer la politique de rotation 14 jours', completed: false }
    ]
  },
  {
    id: '3',
    title: 'Finaliser le composant TUI interactif pour le dashboard 2026',
    status: 'in_progress',
    priority: 'high',
    project: 'frontend',
    tags: ['react', 'tui', 'design'],
    dueDate: '2026-10-28',
    estimate: '4h',
    timeSpent: 5400, // 1.5h
    notes: 'Support complet des raccourcis clavier vim-style (j/k/space/x) et vue double panneau fluide.',
    createdAt: '2026-10-26T06:00:00Z',
    updatedAt: '2026-10-26T10:00:00Z',
    subtasks: [
      { id: '3-1', title: 'Implémenter le layout double panneau responsive', completed: true },
      { id: '3-2', title: 'Ajouter les suggestions de commande en temps réel', completed: true },
      { id: '3-3', title: 'Tester la navigation au clavier j/k', completed: true }
    ]
  },
  {
    id: '4',
    title: 'Déployer les pipelines CI/CD isolés avec Firecracker MicroVMs',
    status: 'pending',
    priority: 'medium',
    project: 'infra',
    tags: ['devops', 'virtualization', 'ci'],
    dueDate: '2026-11-08',
    estimate: '5h',
    timeSpent: 0,
    notes: 'Temps de démarrage d’un runner cible : < 150 millisecondes.',
    createdAt: '2026-10-23T14:20:00Z',
    updatedAt: '2026-10-23T14:20:00Z',
    subtasks: [
      { id: '4-1', title: 'Écrire les scripts de boot jailer', completed: false },
      { id: '4-2', title: 'Tester la persistance des caches d’artefacts', completed: false }
    ]
  },
  {
    id: '5',
    title: 'Optimisation de la consommation énergétique des serveurs edge',
    status: 'completed',
    priority: 'medium',
    project: 'greentech',
    tags: ['eco', 'c-states', 'kernel'],
    dueDate: '2026-10-25',
    estimate: '2h',
    timeSpent: 7200,
    notes: 'Gain de 18% mesuré sur la facture énergétique globale sans dégradation de SLA.',
    createdAt: '2026-10-22T09:00:00Z',
    updatedAt: '2026-10-25T16:45:00Z',
    completedAt: '2026-10-25T16:45:00Z',
    subtasks: [
      { id: '5-1', title: 'Ajuster les profils cpu governor', completed: true },
      { id: '5-2', title: 'Mesurer la consommation via IPMI', completed: true }
    ]
  },
  {
    id: '6',
    title: 'Rédiger la documentation technique CLI & cheatsheet',
    status: 'pending',
    priority: 'low',
    project: 'doc',
    tags: ['cli', 'markdown', 'onboarding'],
    dueDate: '2026-11-12',
    estimate: '1h30',
    timeSpent: 0,
    notes: 'Rendre accessible la grammaire des commandes task add, task list, timer et export.',
    createdAt: '2026-10-25T15:30:00Z',
    updatedAt: '2026-10-25T15:30:00Z',
    subtasks: []
  }
];

export const DEFAULT_ALIASES: Record<string, string> = {
  ls: 'task list',
  ll: 'task list --all',
  urgent: 'task list -p urgent',
  today: 'task list -s in_progress',
  add: 'task add',
  stats: 'task stats',
  pomo: 'task pomodoro start'
};

export function loadTasks(): Task[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) {
      localStorage.setItem(TASKS_KEY, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TASKS;
  } catch (e) {
    console.error('Failed to load tasks', e);
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks', e);
  }
}

export function loadHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : ['help', 'task list', 'task stats'];
  } catch {
    return [];
  }
}

export function saveHistory(history: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep last 100 commands
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-100)));
  } catch {}
}

export function loadAliases(): Record<string, string> {
  if (typeof window === 'undefined') return DEFAULT_ALIASES;
  try {
    const raw = localStorage.getItem(ALIASES_KEY);
    return raw ? { ...DEFAULT_ALIASES, ...JSON.parse(raw) } : DEFAULT_ALIASES;
  } catch {
    return DEFAULT_ALIASES;
  }
}

export function saveAliases(aliases: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ALIASES_KEY, JSON.stringify(aliases));
  } catch {}
}

export function loadTheme(): TerminalTheme {
  if (typeof window === 'undefined') return 'tokyo-night';
  try {
    const raw = localStorage.getItem(THEME_KEY);
    return (raw as TerminalTheme) || 'tokyo-night';
  } catch {
    return 'tokyo-night';
  }
}

export function saveTheme(theme: TerminalTheme): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export function loadSoundSetting(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    return raw !== null ? raw === 'true' : true;
  } catch {
    return true;
  }
}

export function saveSoundSetting(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_KEY, String(enabled));
  } catch {}
}

export function loadViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'split';
  try {
    const raw = localStorage.getItem(VIEW_KEY);
    return (raw as ViewMode) || 'split';
  } catch {
    return 'split';
  }
}

export function saveViewMode(view: ViewMode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {}
}
