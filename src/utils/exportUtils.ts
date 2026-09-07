import { TaskItem } from '../types';

export function exportTasksToCSV(tasks: TaskItem[], filename = 'To_Do_List_Pusat_Matesih.csv') {
  const headers = [
    'Tanggal',
    'Anggota Tim (Tab)',
    'Deskripsi Tugas',
    'Jenis Teknis',
    'Timeline',
    'Arahan Atasan',
    'Prioritas',
    'Status',
    'Penyelesaian / Outcome',
    'Tanggal FU / Tindak Lanjut'
  ];

  const rows = tasks.map(t => [
    `"${t.tanggal}"`,
    `"${t.assignedTo}"`,
    `"${t.deskripsiTugas.replace(/"/g, '""')}"`,
    `"${t.jenisTeknis}"`,
    `"${t.timeline}"`,
    `"${t.arahanAtasan.replace(/"/g, '""')}"`,
    `"${t.prioritas}"`,
    `"${t.status}"`,
    `"${t.penyelesaian?.replace(/"/g, '""') || ''}"`,
    `"${t.tanggalFU || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTasksToPDF(tasks: TaskItem[], title: string, filename = 'BEIS_Report.pdf') {
  console.log("Mock PDF Export", tasks, title, filename);
  alert("PDF Export is currently mocked to avoid jsPDF dependency.");
}

export const generateGoogleCalendarUrl = (task: TaskItem): string => {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  
  const text = encodeURIComponent(`[${task.prioritas}] ${task.deskripsiTugas}`);
  const details = encodeURIComponent(
    `Tugas BEIS: ${task.taskId || '-'}\n` +
    `PIC: ${task.assignedTo}\n` +
    `Kategori: ${task.jenisTeknis}\n` +
    `Arahan: ${task.arahanAtasan}\n\n` +
    `---\nDibuat otomatis oleh Sistem BEIS BPR ARA`
  );
  
  const date = task.tanggalFU || task.tanggal || new Date().toISOString().split('T')[0];
  const formattedDate = date.replace(/-/g, '');
  const dates = encodeURIComponent(`${formattedDate}T090000Z/${formattedDate}T100000Z`);

  return `${baseUrl}&text=${text}&details=${details}&dates=${dates}`;
};
