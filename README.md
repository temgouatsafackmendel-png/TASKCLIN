# TaskCLI 2026 — Gestionnaire de Tâches Terminal Haute Performance

> **Gestionnaire de tâches technique de nouvelle génération (style 2026)** : Invite de commande interactive, TUI structuré haute densité (inspiré de Linear & Warp), synthétiseur audio tactile, chronomètre Pomodoro et générateur de rapports exécutifs PDF professionnels.

---

## ⚡ Aperçu Rapide

TaskCLI 2026 est un environnement hybride combinant la puissance d'un terminal Unix moderne et l'ergonomie d'un tableau de bord de pilotage d'ingénierie :

* **Invite de commande interactive (`task@2026:~ $`)** : syntaxe enrichie avec drapeaux, auto-complétion intelligente via `[Tab]`, historique de commandes (`[↑]` / `[↓]`), et retour audio mécanique discret synthétisé en Web Audio API.
* **Double Vue Structurée (Split View)** : Terminal à gauche, grille de données haute densité à droite.
* **Vues Métiers Interchangeables** :
  * **Tableau TUI** : navigation au clavier style Vim (`j`/`k`, `Espace`, `x`), filtres instantanés, suivi du temps cumulé.
  * **Kanban** : 4 colonnes opérationnelles (*À faire*, *En cours*, *Bloqué*, *Terminé*).
  * **Matrice d'Eisenhower** : priorisation stratégique en cadrans 2x2.
  * **Vélocité & Analytique** : calcul des taux d'achèvement, répartition horaire par projet et par priorité.
* **Générateur de Rapports PDF Exécutifs (jsPDF)** :
  * Visualiseur de rapport complet à l'écran (rendu imprimable A4 haute résolution et lecteur natif).
  * En-tête exécutif, 4 métriques clés (KPIs), tableau structuré avec colorimétrie sémantique et pied de page institutionnel.
  * Boutons d'impression directe et de téléchargement de fichier `.pdf`.

---

## 🛠️ Stack Technique

* **Framework** : React 19 + TypeScript (Strict)
* **Bundler & Dev Server** : Vite 8
* **Styling & Système Design** : Tailwind CSS v4 + Palette Obsidian 2026 (Zéro-pill, bordures capillaires 1px)
* **Animations Systèmes** : Motion v12 (`motion/react`)
* **Moteur PDF** : jsPDF + jspdf-autotable
* **Moteur Audio** : Synthétiseur Web Audio API custom (sans assets externes, 0ms latence)
* **Stockage** : Persistance automatique en LocalStorage (tâches, historique, alias, thèmes)

---

## 💻 Manuel des Commandes CLI

### 1. Gestion des Tâches
```bash
# Ajouter une tâche avec drapeaux
task add "Migrer la passerelle vers HTTP/3" -p urgent -P infra -t network,rust -d 2026-11-05 -e 4h

# Lister les tâches avec rendu tableau ASCII
task list
task list -p urgent          # Filtrer par priorité urgente
task list -s in_progress     # Filtrer par tâches en cours
task list --all              # Inclure les tâches archivées

# Inspecter la fiche détaillée
task show 1

# Mettre à jour l'état
task start 1                 # Passer en cours
task done 1 2                # Marquer terminée(s)
task block 3                 # Marquer comme bloquée

# Modifier une tâche existante
task edit 1 --priority high --due 2026-11-10

# Supprimer une tâche
task rm 4
```

### 2. Sous-tâches & Chronomètre
```bash
# Ajouter et cocher des sous-tâches
task subtask add 1 "Valider les benchmarks k6"
task subtask check 1 1

# Suivi du temps réel
task timer start 1           # Démarrer le chronomètre sur la tâche #1
task timer stop              # Arrêter le chronomètre
task timer status            # Afficher le temps cumulé

# Focus Pomodoro (25 min)
task pomodoro start          # Lancer la session
task pomodoro pause          # Mettre en pause
task pomodoro reset          # Réinitialiser
```

### 3. Rapports & Exportations
```bash
# Générer le rapport PDF haute définition (jsPDF)
task export --format pdf

# Exporter les données brutes
task export --format json
task export --format csv
task export --format markdown

# Nettoyer les tâches terminées
task clear
```

### 4. Personnalisation & Système
```bash
# Thèmes disponibles : tokyo-night, matrix, cyber-slate, catppuccin, monochrome
theme matrix

# Vues : split, terminal, list, kanban, matrix, stats
view kanban

# Alias personnalisés
alias set urgents "task list -p urgent"
alias list

# Audio tactile
sound on
sound off

# Nettoyer le tampon
cls
```

---

## ⌨️ Raccourcis Clavier Rapides

| Raccourci | Action |
| :--- | :--- |
| `⌘K` / `Ctrl+K` | Ouvrir la **Palette de Commandes** rapide |
| `/` | Donner le focus immédiat à l'**invite CLI** |
| `[Tab]` | **Auto-compléter** la commande ou l'identifiant de tâche |
| `[↑]` / `[↓]` | Parcourir l'**historique des commandes** |
| `j` / `k` (ou flèches) | Naviguer dans les lignes du **Tableau TUI** |
| `Espace` | **Valider / Cocher** la tâche sélectionnée |
| `x` | **Supprimer** la tâche sélectionnée |
| `e` | **Éditer** la tâche sélectionnée |
| `F2` | **Basculer la disposition** (Split, Terminal, Tableau, Kanban, Matrice) |
| `Échap` | Fermer toute modale active |

---

## 🚀 Installation & Lancement Local

1. Cloner le dépôt :
```bash
git clone https://github.com/<votre-nom-d-utilisateur>/taskcli-2026.git
cd taskcli-2026
```

2. Installer les dépendances :
```bash
npm install
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

4. Compiler pour la production :
```bash
npm run build
```

---

## 📂 Structure du Répertoire

```text
├── index.html                # Point d'entrée HTML + Métadonnées 2026
├── metadata.json             # Métadonnées de l'application
├── package.json              # Dépendances (React 19, Motion, jsPDF, Tailwind 4)
├── tsconfig.json             # Configuration TypeScript stricte
├── vite.config.ts            # Configuration Vite
├── src/
│   ├── main.tsx              # Montage React DOM
│   ├── App.tsx               # Orchestration principale & Top Bar
│   ├── index.css             # Styles de base Tailwind & scrollbars
│   ├── types/
│   │   └── task.ts           # Types TypeScript (Task, Priority, Status, etc.)
│   ├── services/
│   │   └── cliEngine.ts      # Tokenizer, analyseur de flags, commandes & ASCII
│   ├── components/
│   │   ├── TerminalPrompt.tsx       # Terminal interactif avec autocomplétion
│   │   ├── TaskTable.tsx            # Grille de données TUI haute densité
│   │   ├── KanbanBoard.tsx          # Tableau Kanban 4 colonnes
│   │   ├── EisenhowerMatrix.tsx     # Matrice d'Eisenhower 2x2
│   │   ├── StatsView.tsx            # Tableau de bord de vélocité
│   │   ├── PomodoroWidget.tsx       # Widget chronomètre 25m Focus
│   │   ├── TaskModal.tsx            # Modale d'inspection et création
│   │   ├── CommandPaletteModal.tsx  # Palette de commandes rapide
│   │   └── PdfReportViewerModal.tsx # Lecteur et visualiseur de rapport PDF
│   └── utils/
│       ├── audio.ts          # Synthétiseur sonore mécanique Web Audio
│       ├── storage.ts        # Synchronisation LocalStorage & jeu d'essai
│       └── pdfGenerator.ts   # Générateur de rapport PDF jsPDF + autoTable
```

---

## 🔒 Licence

Distribué sous licence **Apache-2.0**. Développé avec excellence selon les standards de design d'ingénierie 2026.
