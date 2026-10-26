import { Task, Priority, TaskStatus, TerminalTheme, ViewMode } from '../types/task';

export interface CommandResult {
  output: string;
  type: 'output' | 'error' | 'success' | 'info' | 'system';
  updatedTasks?: Task[];
  clearScreen?: boolean;
  themeChange?: TerminalTheme;
  viewChange?: ViewMode;
  soundChange?: boolean;
  aliasesChange?: Record<string, string>;
  activeTimerTaskId?: string | null;
  pomodoroAction?: 'start' | 'pause' | 'reset';
  rawExportData?: { data: string; filename: string; mimeType: string };
  pdfExportRequested?: boolean;
  openTaskModalId?: string;
}

// Tokenize command line preserving quotes
export function tokenizeCommandLine(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inDouble = false;
  let inSingle = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"' && !inSingle) {
      inDouble = !inDouble;
    } else if (char === "'" && !inDouble) {
      inSingle = !inSingle;
    } else if (char === ' ' && !inDouble && !inSingle) {
      if (current.trim().length > 0) {
        tokens.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    tokens.push(current.trim());
  }

  return tokens;
}

// Parse flags from tokens
export function parseFlags(tokens: string[]): { args: string[]; flags: Record<string, string | boolean> } {
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      if (key.includes('=')) {
        const [k, v] = key.split('=');
        flags[k] = v;
      } else if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
        flags[key] = tokens[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else if (token.startsWith('-') && token.length > 1) {
      const key = token.slice(1);
      if (i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
        flags[key] = tokens[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      args.push(token);
    }
  }

  return { args, flags };
}

// Format relative date or days
export function formatDueDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return `${dateStr} (Aujourd'hui)`;
    if (diffDays === 1) return `${dateStr} (Demain)`;
    if (diffDays === -1) return `${dateStr} (Hier - En retard)`;
    if (diffDays < -1) return `${dateStr} (${Math.abs(diffDays)}j de retard)`;
    if (diffDays > 1) return `${dateStr} (dans ${diffDays}j)`;
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  if (mins > 0) return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  return `${secs}s`;
}

// Generate formatted ASCII/Unicode Box Table for CLI output
export function renderAsciiTable(tasks: Task[]): string {
  if (tasks.length === 0) {
    return 'Aucune tâche trouvée pour ces critères.';
  }

  const headers = ['ID', 'STATUT', 'PRIORITÉ', 'PROJET', 'TITRE', 'ÉCHÉANCE', 'TEMPS'];
  const rows = tasks.map(t => {
    const statusMap: Record<TaskStatus, string> = {
      pending: '○ À faire',
      in_progress: '▶ En cours',
      blocked: '✕ Bloqué',
      completed: '✔ Terminé',
      archived: '⌸ Archivé'
    };
    const prioMap: Record<Priority, string> = {
      urgent: 'URGENT ⚡',
      high: 'HAUTE ▲',
      medium: 'MOYENNE •',
      low: 'BASSE ▽'
    };

    const titleWithSubtasks = t.subtasks.length > 0
      ? `${t.title} [${t.subtasks.filter(s => s.completed).length}/${t.subtasks.length}]`
      : t.title;

    return [
      `#${t.id}`,
      statusMap[t.status],
      prioMap[t.priority],
      t.project,
      titleWithSubtasks.length > 34 ? titleWithSubtasks.slice(0, 31) + '...' : titleWithSubtasks,
      t.dueDate ? t.dueDate : '—',
      formatDuration(t.timeSpent)
    ];
  });

  // Calculate column widths
  const colWidths = headers.map((h, i) => {
    const maxRow = Math.max(...rows.map(r => r[i].length));
    return Math.max(h.length, maxRow);
  });

  const sep = (left: string, mid: string, right: string, fill: string) =>
    left + colWidths.map(w => fill.repeat(w + 2)).join(mid) + right;

  const topBorder = sep('┌', '┬', '┐', '─');
  const midBorder = sep('├', '┼', '┤', '─');
  const botBorder = sep('└', '┴', '┘', '─');

  const formatRow = (cols: string[]) =>
    '│ ' + cols.map((col, idx) => col.padEnd(colWidths[idx])).join(' │ ') + ' │';

  const outputLines = [
    topBorder,
    formatRow(headers),
    midBorder,
    ...rows.map(r => formatRow(r)),
    botBorder,
    `Total: ${tasks.length} tâche(s) affichée(s).`
  ];

  return outputLines.join('\n');
}

// Generate Detailed ASCII Inspect Card
export function renderTaskCard(task: Task): string {
  const lines = [
    `╔═══════════════════════════════════════════════════════════════════════════╗`,
    `║  TÂCHE #${task.id.padEnd(4)}  ${task.title.slice(0, 52).padEnd(54)} ║`,
    `╠═══════════════════════════════════════════════════════════════════════════╣`,
    `║  Statut     : ${task.status.toUpperCase().padEnd(14)}  Priorité  : ${task.priority.toUpperCase().padEnd(20)} ║`,
    `║  Projet     : ${task.project.padEnd(14)}  Échéance  : ${(task.dueDate || 'Non définie').padEnd(20)} ║`,
    `║  Estimation : ${(task.estimate || '—').padEnd(14)}  Temps passé: ${formatDuration(task.timeSpent).padEnd(20)} ║`,
    `║  Créée le   : ${new Date(task.createdAt).toLocaleString('fr-FR').padEnd(14)}  Tags      : ${task.tags.join(', ').padEnd(20)} ║`
  ];

  if (task.notes) {
    lines.push(`╟───────────────────────────────────────────────────────────────────────────╢`);
    lines.push(`║  Notes :                                                                  ║`);
    const noteLines = task.notes.match(/.{1,68}/g) || [task.notes];
    noteLines.forEach(l => {
      lines.push(`║    ${l.padEnd(69)}║`);
    });
  }

  if (task.subtasks.length > 0) {
    lines.push(`╟───────────────────────────────────────────────────────────────────────────╢`);
    lines.push(`║  Sous-tâches :                                                            ║`);
    task.subtasks.forEach((st, idx) => {
      const check = st.completed ? '[✔]' : '[ ]';
      const label = `${idx + 1}. ${check} ${st.title}`;
      lines.push(`║    ${label.slice(0, 68).padEnd(69)}║`);
    });
  }

  lines.push(`╚═══════════════════════════════════════════════════════════════════════════╝`);
  return lines.join('\n');
}

// The main CLI Engine execution
export function executeCliCommand(
  inputLine: string,
  tasks: Task[],
  aliases: Record<string, string> = {},
  activeTimerTaskId: string | null = null
): CommandResult {
  const trimmed = inputLine.trim();
  if (!trimmed) {
    return { output: '', type: 'output' };
  }

  // Expand alias if first token matches
  let tokens = tokenizeCommandLine(trimmed);
  const first = tokens[0]?.toLowerCase();

  if (aliases[first]) {
    const aliasExpanded = aliases[first];
    const rest = tokens.slice(1);
    tokens = tokenizeCommandLine(`${aliasExpanded} ${rest.join(' ')}`);
  }

  const { args, flags } = parseFlags(tokens);
  const root = args[0]?.toLowerCase();

  // Route commands
  switch (root) {
    case 'help':
    case '?':
    case 'man': {
      const sub = args[1]?.toLowerCase();
      if (sub === 'add') {
        return {
          type: 'info',
          output: `MANUEL: task add
Usage:
  task add "<titre>" [options]

Options:
  -p, --priority <low|medium|high|urgent>  (Défaut: medium)
  -P, --project  <nom_projet>              (Défaut: general)
  -t, --tags     <tag1,tag2>               Tags séparés par virgules
  -d, --due      <YYYY-MM-DD|today|+3d>    Date d'échéance
  -e, --estimate <ex: 2h, 45m>             Estimation de temps
  -n, --notes    "<description détaillée>"

Exemples:
  task add "Refonte cache Redis" -p urgent -P infra -t cache,ops -d 2026-11-05
  task add "Relire PR de Paul" -p low -e 30m`
        };
      }

      return {
        type: 'info',
        output: `╔═══════════════════════════════════════════════════════════════════════════╗
║                      TaskCLI 2026 — Manuel des Commandes                  ║
╚═══════════════════════════════════════════════════════════════════════════╝

GESTION DES TÂCHES :
  task add "<titre>" [flags]    Ajouter une nouvelle tâche
  task list [flags] / ls        Lister les tâches avec tableau ASCII formaté
  task show <id> / view <id>    Inspecter une tâche complète en mode fiche
  task done <id...> / check     Marquer une ou plusieurs tâches terminées
  task wip <id...> / start      Marquer en cours de traitement
  task block <id...>            Signaler une tâche comme bloquée
  task edit <id> [flags]        Modifier une tâche existante
  task rm <id...> / delete      Supprimer une ou plusieurs tâches
  task search <mot-clé>         Recherche rapide plein texte

SOUS-TÂCHES & TEMPS :
  task subtask add <id> "<txt>" Ajouter une sous-tâche
  task subtask check <id> <num> Basculer l'état d'une sous-tâche
  task timer start <id>         Démarrer le chronomètre de temps réel
  task timer stop               Arrêter le chronomètre actif
  task pomodoro [start|pause]   Lancer une session Pomodoro 25min

STATS & EXPORT :
  task stats / summary          Tableau de bord de vélocité & métriques
  task export [--format=json]   Exporter les données (json, csv, md)
  task clear [--completed]      Nettoyer les tâches terminées

ENVIRONNEMENT & TUI :
  view <split|list|kanban|matrix|stats>  Changer la disposition active
  theme <tokyo-night|matrix|cyber-slate|catppuccin|monochrome>  Thème terminal
  sound <on|off>                Activer/désactiver les sons de clavier tactile
  alias list | set <nom> <cmd>  Créer des raccourcis CLI personnalisés
  cls / clear                   Effacer le tampon du terminal

RACCOURCIS RAPIDES TUI :
  [j / k] : Naviguer les lignes     [Space] : Valider/Terminer tâche
  [x]     : Supprimer la sélection  [e]     : Inspecter/Éditer
  [/]     : Focus sur l'invite CLI  [F2]    : Basculer vue Terminal/TUI`
      };
    }

    case 'cls':
    case 'clear': {
      return { output: '', type: 'output', clearScreen: true };
    }

    case 'version': {
      return {
        type: 'info',
        output: `TaskCLI Engine v2026.4.1 (x86_64-pc-web-hybrid)
Built with React 19 + TypeScript + TailWindCSS 4
Features: Realtime Lexer, Tab Completion, Audio Synth, ANSI Box Drawing, Pomodoro Timer.`
      };
    }

    case 'theme': {
      const targetTheme = (args[1] || flags['name'] || '').toString().toLowerCase() as TerminalTheme;
      const validThemes: TerminalTheme[] = ['tokyo-night', 'matrix', 'cyber-slate', 'catppuccin', 'monochrome'];
      if (!targetTheme || !validThemes.includes(targetTheme)) {
        return {
          type: 'error',
          output: `Thème invalide. Disponibles: ${validThemes.join(', ')}`
        };
      }
      return {
        type: 'success',
        output: `Thème terminal mis à jour : ${targetTheme}`,
        themeChange: targetTheme
      };
    }

    case 'view': {
      const mode = (args[1] || '').toLowerCase() as ViewMode;
      const validModes: Record<string, ViewMode> = {
        split: 'split',
        term: 'terminal',
        terminal: 'terminal',
        list: 'tui_list',
        table: 'tui_list',
        kanban: 'tui_kanban',
        board: 'tui_kanban',
        matrix: 'tui_matrix',
        stats: 'stats'
      };
      if (!mode || !validModes[mode]) {
        return {
          type: 'error',
          output: `Vue inconnue. Disponibles: split, terminal, list, kanban, matrix, stats`
        };
      }
      return {
        type: 'success',
        output: `Disposition basculée vers: ${validModes[mode]}`,
        viewChange: validModes[mode]
      };
    }

    case 'sound': {
      const val = (args[1] || '').toLowerCase();
      if (val === 'on' || val === '1' || val === 'true') {
        return { type: 'success', output: 'Effets sonores tactiles ACTIVÉS.', soundChange: true };
      }
      if (val === 'off' || val === '0' || val === 'false') {
        return { type: 'success', output: 'Effets sonores tactiles DÉSACTIVÉS.', soundChange: false };
      }
      return { type: 'info', output: 'Usage: sound on | sound off' };
    }

    case 'alias': {
      const action = args[1]?.toLowerCase();
      if (!action || action === 'list') {
        const lines = Object.entries(aliases).map(([k, v]) => `  ${k.padEnd(10)} => ${v}`);
        return {
          type: 'info',
          output: `Aliases CLI configurés :\n${lines.join('\n')}`
        };
      }
      if (action === 'set') {
        const name = args[2];
        const cmd = args.slice(3).join(' ');
        if (!name || !cmd) {
          return { type: 'error', output: 'Usage: alias set <nom> <commande>' };
        }
        const updated = { ...aliases, [name]: cmd };
        return {
          type: 'success',
          output: `Alias défini : ${name} => "${cmd}"`,
          aliasesChange: updated
        };
      }
      if (action === 'rm' || action === 'delete') {
        const name = args[2];
        if (!name || !aliases[name]) {
          return { type: 'error', output: `Alias '${name}' introuvable.` };
        }
        const updated = { ...aliases };
        delete updated[name];
        return {
          type: 'success',
          output: `Alias '${name}' supprimé.`,
          aliasesChange: updated
        };
      }
      return { type: 'error', output: 'Usage: alias list | alias set <nom> <cmd> | alias rm <nom>' };
    }

    // task command or root shortcuts (add, ls, done, etc.)
    case 'task':
    case 't':
    case 'add':
    case 'ls':
    case 'list':
    case 'done':
    case 'check':
    case 'wip':
    case 'start':
    case 'block':
    case 'show':
    case 'view_task':
    case 'edit':
    case 'rm':
    case 'delete':
    case 'subtask':
    case 'stats':
    case 'summary':
    case 'timer':
    case 'pomodoro':
    case 'search':
    case 'grep':
    case 'export':
    case 'clear_tasks': {
      // If root was "task" or "t", shift command
      let action: string = root;
      let actionArgs: string[] = args.slice(1);
      if (root === 'task' || root === 't') {
        action = actionArgs[0]?.toLowerCase() || 'list';
        actionArgs = actionArgs.slice(1);
      }

      // 1. ADD TASK
      if (action === 'add' || action === 'new' || action === 'create') {
        const title = actionArgs.join(' ') || (flags['title'] as string);
        if (!title) {
          return {
            type: 'error',
            output: 'Erreur: Le titre de la tâche est obligatoire.\nEx: task add "Déployer sur AWS" -p high -P infra'
          };
        }

        let priority: Priority = 'medium';
        const pFlag = (flags['priority'] || flags['p']) as string;
        if (pFlag && ['low', 'medium', 'high', 'urgent'].includes(pFlag.toLowerCase())) {
          priority = pFlag.toLowerCase() as Priority;
        }

        const project = ((flags['project'] || flags['P']) as string) || 'general';
        const tagsRaw = (flags['tags'] || flags['tag'] || flags['t']) as string;
        const tags = tagsRaw ? tagsRaw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];

        // Parse due date if provided
        let dueDate: string | undefined = undefined;
        const dueRaw = (flags['due'] || flags['d']) as string;
        if (dueRaw) {
          const now = new Date();
          if (dueRaw.toLowerCase() === 'today' || dueRaw.toLowerCase() === "aujourd'hui") {
            dueDate = now.toISOString().split('T')[0];
          } else if (dueRaw.toLowerCase() === 'tomorrow' || dueRaw.toLowerCase() === 'demain') {
            now.setDate(now.getDate() + 1);
            dueDate = now.toISOString().split('T')[0];
          } else if (dueRaw.startsWith('+') && dueRaw.endsWith('d')) {
            const days = parseInt(dueRaw.slice(1, -1), 10) || 1;
            now.setDate(now.getDate() + days);
            dueDate = now.toISOString().split('T')[0];
          } else {
            dueDate = dueRaw;
          }
        }

        const estimate = (flags['estimate'] || flags['e']) as string | undefined;
        const notes = (flags['notes'] || flags['n']) as string | undefined;

        // Auto ID: max existing numeric ID + 1
        const maxId = tasks.reduce((max, t) => {
          const num = parseInt(t.id, 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        const newId = String(maxId + 1);

        const newTask: Task = {
          id: newId,
          title,
          status: 'pending',
          priority,
          project,
          tags,
          dueDate,
          estimate,
          timeSpent: 0,
          notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtasks: []
        };

        const updated = [newTask, ...tasks];
        return {
          type: 'success',
          output: `✔ Tâche #${newTask.id} créée avec succès !\n  Titre    : "${newTask.title}"\n  Priorité : ${newTask.priority.toUpperCase()} | Projet: ${newTask.project} | Échéance: ${newTask.dueDate || 'Non définie'}`,
          updatedTasks: updated
        };
      }

      // 2. LIST TASKS
      if (action === 'list' || action === 'ls') {
        let filtered = [...tasks];

        // Filter by all
        const showAll = flags['all'] || flags['a'];
        if (!showAll) {
          filtered = filtered.filter(t => t.status !== 'archived');
        }

        // Filter by status
        const sFlag = (flags['status'] || flags['s']) as string;
        if (sFlag) {
          filtered = filtered.filter(t => t.status.toLowerCase() === sFlag.toLowerCase());
        }

        // Filter by priority
        const pFlag = (flags['priority'] || flags['p']) as string;
        if (pFlag) {
          filtered = filtered.filter(t => t.priority.toLowerCase() === pFlag.toLowerCase());
        }

        // Filter by project
        const projFlag = (flags['project'] || flags['P']) as string;
        if (projFlag) {
          filtered = filtered.filter(t => t.project.toLowerCase() === projFlag.toLowerCase());
        }

        // Filter by tag
        const tagFlag = (flags['tag'] || flags['t']) as string;
        if (tagFlag) {
          filtered = filtered.filter(t => t.tags.some(tag => tag.toLowerCase() === tagFlag.toLowerCase()));
        }

        // Sort
        const sortFlag = (flags['sort'] || '') as string;
        if (sortFlag === 'prio' || sortFlag === 'priority') {
          const prioScore: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          filtered.sort((a, b) => prioScore[b.priority] - prioScore[a.priority]);
        } else if (sortFlag === 'due') {
          filtered.sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
        } else if (sortFlag === 'date') {
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return {
          type: 'output',
          output: renderAsciiTable(filtered)
        };
      }

      // 3. SHOW / VIEW TASK
      if (action === 'show' || action === 'view' || action === 'inspect') {
        const id = actionArgs[0];
        if (!id) {
          return { type: 'error', output: 'Usage: task show <id>' };
        }
        const task = tasks.find(t => t.id === id);
        if (!task) {
          return { type: 'error', output: `Erreur: Tâche #${id} non trouvée.` };
        }
        return {
          type: 'output',
          output: renderTaskCard(task)
        };
      }

      // 4. DONE / COMPLETE
      if (action === 'done' || action === 'check' || action === 'complete') {
        const ids = actionArgs.length > 0 ? actionArgs : [(flags['id'] as string)];
        if (ids.length === 0 || !ids[0]) {
          return { type: 'error', output: 'Usage: task done <id1> [id2...]' };
        }

        let count = 0;
        const updated = tasks.map(t => {
          if (ids.includes(t.id)) {
            count++;
            return {
              ...t,
              status: 'completed' as TaskStatus,
              completedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        });

        if (count === 0) {
          return { type: 'error', output: `Aucune tâche trouvée avec les identifiants : ${ids.join(', ')}` };
        }

        return {
          type: 'success',
          output: `✔ ${count} tâche(s) marquée(s) comme TERMINÉE(S).`,
          updatedTasks: updated
        };
      }

      // 5. START / WIP
      if (action === 'wip' || action === 'start' || action === 'progress') {
        const id = actionArgs[0];
        if (!id) return { type: 'error', output: 'Usage: task start <id>' };
        const found = tasks.find(t => t.id === id);
        if (!found) return { type: 'error', output: `Tâche #${id} introuvable.` };

        const updated = tasks.map(t => t.id === id ? { ...t, status: 'in_progress' as TaskStatus, updatedAt: new Date().toISOString() } : t);
        return {
          type: 'success',
          output: `▶ Tâche #${id} "${found.title}" passée en statut EN COURS.`,
          updatedTasks: updated
        };
      }

      // 6. BLOCK
      if (action === 'block') {
        const id = actionArgs[0];
        if (!id) return { type: 'error', output: 'Usage: task block <id>' };
        const found = tasks.find(t => t.id === id);
        if (!found) return { type: 'error', output: `Tâche #${id} introuvable.` };

        const updated = tasks.map(t => t.id === id ? { ...t, status: 'blocked' as TaskStatus, updatedAt: new Date().toISOString() } : t);
        return {
          type: 'info',
          output: `✕ Tâche #${id} "${found.title}" marquée comme BLOQUÉE.`,
          updatedTasks: updated
        };
      }

      // 7. EDIT TASK
      if (action === 'edit' || action === 'modify') {
        const id = actionArgs[0];
        if (!id) return { type: 'error', output: 'Usage: task edit <id> [--title="..."] [--priority=high] [--due=...] [--project=...]' };

        const existing = tasks.find(t => t.id === id);
        if (!existing) return { type: 'error', output: `Tâche #${id} introuvable.` };

        const newTitle = (flags['title'] as string) || (actionArgs.slice(1).join(' ') || undefined);
        const newPrio = (flags['priority'] || flags['p']) as Priority | undefined;
        const newProj = (flags['project'] || flags['P']) as string | undefined;
        const newDue = (flags['due'] || flags['d']) as string | undefined;
        const newEst = (flags['estimate'] || flags['e']) as string | undefined;
        const newNotes = (flags['notes'] || flags['n']) as string | undefined;

        const updated = tasks.map(t => {
          if (t.id === id) {
            return {
              ...t,
              title: newTitle || t.title,
              priority: newPrio && ['low', 'medium', 'high', 'urgent'].includes(newPrio) ? newPrio : t.priority,
              project: newProj || t.project,
              dueDate: newDue !== undefined ? newDue : t.dueDate,
              estimate: newEst !== undefined ? newEst : t.estimate,
              notes: newNotes !== undefined ? newNotes : t.notes,
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        });

        return {
          type: 'success',
          output: `✔ Tâche #${id} modifiée avec succès.`,
          updatedTasks: updated
        };
      }

      // 8. DELETE / REMOVE
      if (action === 'rm' || action === 'delete' || action === 'remove') {
        const ids = actionArgs.length > 0 ? actionArgs : [(flags['id'] as string)];
        if (ids.length === 0 || !ids[0]) {
          return { type: 'error', output: 'Usage: task rm <id1> [id2...]' };
        }

        const remaining = tasks.filter(t => !ids.includes(t.id));
        const deletedCount = tasks.length - remaining.length;

        if (deletedCount === 0) {
          return { type: 'error', output: `Aucune tâche trouvée avec les identifiants : ${ids.join(', ')}` };
        }

        return {
          type: 'success',
          output: `✔ ${deletedCount} tâche(s) supprimée(s).`,
          updatedTasks: remaining
        };
      }

      // 9. SUBTASKS
      if (action === 'subtask') {
        const subAction = actionArgs[0]?.toLowerCase();
        const taskId = actionArgs[1];
        if (!taskId) {
          return { type: 'error', output: 'Usage: task subtask add <id> "<titre>" | task subtask check <id> <index>' };
        }
        const task = tasks.find(t => t.id === taskId);
        if (!task) return { type: 'error', output: `Tâche #${taskId} introuvable.` };

        if (subAction === 'add') {
          const subTitle = actionArgs.slice(2).join(' ');
          if (!subTitle) return { type: 'error', output: 'Usage: task subtask add <id> "<titre>"' };

          const newSub = {
            id: `${taskId}-${task.subtasks.length + 1}`,
            title: subTitle,
            completed: false
          };

          const updated = tasks.map(t => t.id === taskId ? {
            ...t,
            subtasks: [...t.subtasks, newSub],
            updatedAt: new Date().toISOString()
          } : t);

          return {
            type: 'success',
            output: `✔ Sous-tâche ajoutée à #${taskId} : "${subTitle}"`,
            updatedTasks: updated
          };
        }

        if (subAction === 'check' || subAction === 'toggle') {
          const index = parseInt(actionArgs[2], 10) - 1;
          if (isNaN(index) || index < 0 || index >= task.subtasks.length) {
            return { type: 'error', output: `Index invalide. La tâche #${taskId} a ${task.subtasks.length} sous-tâche(s).` };
          }

          const updated = tasks.map(t => {
            if (t.id === taskId) {
              const subs = [...t.subtasks];
              subs[index] = { ...subs[index], completed: !subs[index].completed };
              return { ...t, subtasks: subs, updatedAt: new Date().toISOString() };
            }
            return t;
          });

          return {
            type: 'success',
            output: `✔ Sous-tâche #${index + 1} de #${taskId} basculée.`,
            updatedTasks: updated
          };
        }

        return { type: 'error', output: 'Usage: task subtask add <id> "<titre>" | task subtask check <id> <index>' };
      }

      // 10. TIMER
      if (action === 'timer') {
        const timerAction = actionArgs[0]?.toLowerCase() || 'status';
        if (timerAction === 'start') {
          const targetId = actionArgs[1];
          if (!targetId) {
            return { type: 'error', output: 'Usage: task timer start <id>' };
          }
          const targetTask = tasks.find(t => t.id === targetId);
          if (!targetTask) return { type: 'error', output: `Tâche #${targetId} introuvable.` };

          return {
            type: 'success',
            output: `⏱ Chronomètre DÉMARRÉ sur la tâche #${targetId} : "${targetTask.title}"`,
            activeTimerTaskId: targetId
          };
        }

        if (timerAction === 'stop') {
          if (!activeTimerTaskId) {
            return { type: 'info', output: 'Aucun chronomètre actif en cours.' };
          }
          return {
            type: 'info',
            output: `⏱ Chronomètre ARRÊTÉ sur la tâche #${activeTimerTaskId}.`,
            activeTimerTaskId: null
          };
        }

        if (timerAction === 'status') {
          if (!activeTimerTaskId) {
            return { type: 'info', output: 'Chronomètre inactif. Démarrer avec: task timer start <id>' };
          }
          const current = tasks.find(t => t.id === activeTimerTaskId);
          return {
            type: 'info',
            output: `⏱ Chronomètre ACTIF sur la tâche #${activeTimerTaskId} : "${current?.title}" (Temps cumulé: ${formatDuration(current?.timeSpent || 0)})`
          };
        }

        return { type: 'error', output: 'Usage: task timer start <id> | task timer stop | task timer status' };
      }

      // 11. POMODORO
      if (action === 'pomodoro' || action === 'pomo') {
        const pomoAction = actionArgs[0]?.toLowerCase() || 'start';
        if (pomoAction === 'start') {
          return {
            type: 'success',
            output: `🍅 Session Pomodoro 25min DÉMARRÉE. Restez concentré sur votre tâche en cours !`,
            pomodoroAction: 'start'
          };
        }
        if (pomoAction === 'pause') {
          return {
            type: 'info',
            output: `⏸ Session Pomodoro mise en pause.`,
            pomodoroAction: 'pause'
          };
        }
        if (pomoAction === 'reset') {
          return {
            type: 'info',
            output: `↺ Pomodoro réinitialisé à 25:00.`,
            pomodoroAction: 'reset'
          };
        }
        return { type: 'error', output: 'Usage: task pomodoro start | pause | reset' };
      }

      // 12. STATS & SUMMARY
      if (action === 'stats' || action === 'summary') {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const blocked = tasks.filter(t => t.status === 'blocked').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const totalTimeSpent = tasks.reduce((acc, t) => acc + t.timeSpent, 0);

        // Priorities breakdown
        const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
        const highCount = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length;

        // Progress bar in ASCII
        const barLength = 24;
        const filled = Math.round((completionRate / 100) * barLength);
        const progressBar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

        const lines = [
          `┌───────────────────────────────────────────────────────────────────────────┐`,
          `│                 TABLEAU DE BORD DE VÉLOCITÉ TASKCLI 2026                  │`,
          `├───────────────────────────────────────────────────────────────────────────┤`,
          `│  Taux de complétion : [${progressBar}] ${completionRate.toString().padStart(3)}%  │`,
          `│  Tâches totales     : ${total.toString().padEnd(6)} | Terminées   : ${completed.toString().padEnd(6)} | En cours : ${inProgress.toString().padEnd(6)} │`,
          `│  En attente         : ${pending.toString().padEnd(6)} | Bloquées    : ${blocked.toString().padEnd(6)} | Urgentes : ${urgentCount.toString().padEnd(6)} │`,
          `│  Temps total tracé  : ${formatDuration(totalTimeSpent).padEnd(14)} | Tâches haute priorité : ${highCount.toString().padEnd(4)}  │`,
          `└───────────────────────────────────────────────────────────────────────────┘`
        ];

        return {
          type: 'info',
          output: lines.join('\n')
        };
      }

      // 13. SEARCH / GREP
      if (action === 'search' || action === 'grep' || action === 'find') {
        const query = actionArgs.join(' ').toLowerCase();
        if (!query) {
          return { type: 'error', output: 'Usage: task search <mot-clé>' };
        }

        const results = tasks.filter(t =>
          t.title.toLowerCase().includes(query) ||
          t.project.toLowerCase().includes(query) ||
          t.tags.some(tag => tag.toLowerCase().includes(query)) ||
          (t.notes && t.notes.toLowerCase().includes(query))
        );

        if (results.length === 0) {
          return { type: 'info', output: `Aucune tâche ne correspond au motif "${query}".` };
        }

        return {
          type: 'output',
          output: `Résultats de recherche pour "${query}":\n` + renderAsciiTable(results)
        };
      }

      // 14. EXPORT
      if (action === 'export') {
        const format = ((flags['format'] || flags['f']) as string || 'json').toLowerCase();
        if (format === 'json') {
          const jsonStr = JSON.stringify(tasks, null, 2);
          return {
            type: 'success',
            output: `✔ Export JSON généré (${tasks.length} tâches). Téléchargement automatique initié.`,
            rawExportData: {
              data: jsonStr,
              filename: `taskcli-export-${new Date().toISOString().split('T')[0]}.json`,
              mimeType: 'application/json'
            }
          };
        } else if (format === 'csv') {
          const header = 'id,title,status,priority,project,tags,dueDate,estimate,timeSpent\n';
          const rows = tasks.map(t =>
            `"${t.id}","${t.title.replace(/"/g, '""')}","${t.status}","${t.priority}","${t.project}","${t.tags.join(';')}","${t.dueDate || ''}","${t.estimate || ''}",${t.timeSpent}`
          ).join('\n');
          return {
            type: 'success',
            output: `✔ Export CSV généré (${tasks.length} tâches). Téléchargement automatique initié.`,
            rawExportData: {
              data: header + rows,
              filename: `taskcli-export-${new Date().toISOString().split('T')[0]}.csv`,
              mimeType: 'text/csv'
            }
          };
        } else if (format === 'md' || format === 'markdown') {
          const md = `# TaskCLI 2026 Export\n\n` + tasks.map(t =>
            `- [${t.status === 'completed' ? 'x' : ' '}] **#${t.id} ${t.title}** (Projet: ${t.project}, Priorité: ${t.priority.toUpperCase()}${t.dueDate ? `, Échéance: ${t.dueDate}` : ''})`
          ).join('\n');
          return {
            type: 'success',
            output: `✔ Export Markdown généré. Téléchargement automatique initié.`,
            rawExportData: {
              data: md,
              filename: `tasks-${new Date().toISOString().split('T')[0]}.md`,
              mimeType: 'text/markdown'
            }
          };
        } else if (format === 'pdf') {
          return {
            type: 'success',
            output: `✔ Rapport PDF professionnel généré (${tasks.length} tâches). Téléchargement automatique initié.`,
            pdfExportRequested: true
          };
        }
        return { type: 'error', output: 'Formats supportés: pdf, json, csv, markdown' };
      }

      // 15. CLEAR COMPLETED
      if (action === 'clear' || action === 'clean') {
        const remaining = tasks.filter(t => t.status !== 'completed');
        const removed = tasks.length - remaining.length;
        return {
          type: 'success',
          output: `✔ ${removed} tâche(s) terminée(s) nettoyée(s).`,
          updatedTasks: remaining
        };
      }

      return {
        type: 'error',
        output: `Sous-commande 'task ${action}' inconnue. Tapez 'help' pour la liste des commandes.`
      };
    }

    default:
      return {
        type: 'error',
        output: `Commande inconnue: "${root}". Tapez 'help' ou '?' pour afficher la documentation complète.`
      };
  }
}
