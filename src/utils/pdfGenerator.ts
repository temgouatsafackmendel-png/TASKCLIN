import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Task, Priority, TaskStatus } from '../types/task';
import { formatDuration } from '../services/cliEngine';

export interface GeneratedPdfResult {
  doc: jsPDF;
  dataUri: string;
  blobUrl: string;
  filename: string;
}

export function buildTasksPdfDocument(tasks: Task[]): GeneratedPdfResult {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const blocked = tasks.filter(t => t.status === 'blocked').length;
  const urgent = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalTimeSpent = tasks.reduce((acc, t) => acc + t.timeSpent, 0);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const timeFormatted = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Top Accent Brand Bar
  doc.setFillColor(13, 148, 136); // Teal/Emerald accent
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Document Title Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('RAPPORT EXÉCUTIF TASKCLI 2026', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Gestionnaire de tâches technique & métriques de vélocité opérationnelle', margin, 24);

  // Date & Generation Metadata (Right aligned)
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Édité le : ${dateFormatted} à ${timeFormatted}`, pageWidth - margin, 18, { align: 'right' });
  doc.text(`Version : TaskCLI v2026.4.1 (Hybrid Shell)`, pageWidth - margin, 24, { align: 'right' });

  // Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(margin, 28, pageWidth - margin, 28);

  // KPI Summary Metric Boxes
  const boxY = 32;
  const boxHeight = 18;
  const boxGap = 4;
  const boxWidth = (pageWidth - margin * 2 - boxGap * 3) / 4;

  const kpis = [
    { label: 'TÂCHES TOTALES', val: `${total}`, sub: `${pending} à faire · ${inProgress} en cours`, color: [15, 23, 42] },
    { label: "TAUX D'ACHÈVEMENT", val: `${completionRate}%`, sub: `${completed} terminées sur ${total}`, color: [16, 185, 129] },
    { label: 'TEMPS TRAÇÉ', val: formatDuration(totalTimeSpent), sub: 'Cumul chronométré', color: [2, 132, 199] },
    { label: 'ATTENTION URGENTE', val: `${urgent}`, sub: `${blocked} bloquée(s)`, color: [225, 29, 72] }
  ];

  kpis.forEach((kpi, index) => {
    const x = margin + index * (boxWidth + boxGap);
    // Background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(x, boxY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, boxY + 5);

    // Value
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 3.5, boxY + 11.5);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3.5, boxY + 15.5);
  });

  // Section: Detailed Tasks Table
  const tableStartY = boxY + boxHeight + 8;

  // Prepare table data
  const statusLabels: Record<TaskStatus, string> = {
    pending: 'À faire',
    in_progress: 'En cours',
    blocked: 'Bloqué',
    completed: 'Terminé',
    archived: 'Archivé'
  };

  const priorityLabels: Record<Priority, string> = {
    urgent: 'Urgent',
    high: 'Haute',
    medium: 'Moyenne',
    low: 'Basse'
  };

  const tableRows = tasks.map(t => {
    let titleStr = t.title;
    if (t.subtasks && t.subtasks.length > 0) {
      const doneSubs = t.subtasks.filter(s => s.completed).length;
      titleStr += ` (${doneSubs}/${t.subtasks.length} sous-tâches)`;
    }
    if (t.tags && t.tags.length > 0) {
      titleStr += `\n[${t.tags.map(tag => `#${tag}`).join(' ')}]`;
    }

    return [
      `#${t.id}`,
      statusLabels[t.status] || t.status,
      priorityLabels[t.priority] || t.priority,
      t.project,
      titleStr,
      t.dueDate ? t.dueDate : '—',
      formatDuration(t.timeSpent)
    ];
  });

  const renderTable = typeof autoTable === 'function' ? autoTable : (autoTable as unknown as { default: typeof autoTable }).default;

  renderTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin, bottom: 18 },
    head: [['ID', 'Statut', 'Priorité', 'Projet', 'Titre & Spécifications', 'Échéance', 'Temps']],
    body: tableRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [51, 65, 85]
    },
    headStyles: {
      fillColor: [15, 23, 42], // deep slate
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.2,
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 20 },
      2: { cellWidth: 18 },
      3: { cellWidth: 22 },
      4: { cellWidth: 'auto' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 16, halign: 'right' }
    },
    didParseCell: (data) => {
      // Color status cells
      if (data.section === 'body' && data.column.index === 1) {
        const text = data.cell.raw as string;
        if (text === 'Terminé') {
          data.cell.styles.textColor = [22, 163, 74];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'En cours') {
          data.cell.styles.textColor = [2, 132, 199];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'Bloqué') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      // Color priority cells
      if (data.section === 'body' && data.column.index === 2) {
        const text = data.cell.raw as string;
        if (text === 'Urgent') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'Haute') {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
    didDrawPage: (data) => {
      // Footer on every page
      const current = data.pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      // Left footer
      doc.text(
        'TaskCLI 2026 — Rapport exécutif confidentiel généré via moteur JS/WebAssembly',
        margin,
        pageHeight - 8
      );

      // Right footer page count
      doc.text(
        `Page ${current}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );

      // Hairline footer separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    }
  });

  const filename = `Rapport-TaskCLI-${now.toISOString().split('T')[0]}.pdf`;
  const dataUri = doc.output('datauristring');
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  return {
    doc,
    dataUri,
    blobUrl,
    filename
  };
}

export function generateTasksPdfReport(tasks: Task[]): GeneratedPdfResult {
  const result = buildTasksPdfDocument(tasks);
  try {
    result.doc.save(result.filename);
  } catch (err) {
    console.warn('Direct file download may have been prevented by iframe sandbox:', err);
  }
  return result;
}
