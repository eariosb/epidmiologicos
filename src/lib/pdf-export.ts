import { jsPDF } from 'jspdf';
import { getActiveSession, listCaptures, type Question } from './session-store';
import { getChatRecord, type ChatRecord } from './chat-store';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fitImage(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1);
  return {
    width: img.naturalWidth * ratio,
    height: img.naturalHeight * ratio,
  };
}

function addCover(doc: jsPDF, session: Awaited<ReturnType<typeof getActiveSession>>, margin: number) {
  doc.setFontSize(22);
  doc.text(session?.title ?? 'Reporte de sesión', margin, 30);
  doc.setFontSize(12);
  let y = 40;
  doc.text(`Generado: ${new Date().toLocaleString()}`, margin, y);
  y += 8;
  if (session?.courseId) {
    doc.text(`Curso: ${session.courseId}`, margin, y);
    y += 8;
  }
  if (session?.startedAt) {
    doc.text(`Inicio de sesión: ${new Date(session.startedAt).toLocaleString()}`, margin, y);
    y += 6;
  }
  if (session?.endedAt) {
    doc.text(`Fin de sesión: ${new Date(session.endedAt).toLocaleString()}`, margin, y);
  }
}

function addSections(
  doc: jsPDF,
  sections: { slug: string; title: string; timestamp: number }[],
  pageHeight: number,
  margin: number,
) {
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Secciones navegadas', margin, 20);
  doc.setFontSize(10);
  let y = 30;
  for (const section of sections) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.text(`• ${section.title} (${section.slug})`, margin, y);
    y += 6;
  }
}

function renderCapture(
  doc: jsPDF,
  cap: Awaited<ReturnType<typeof listCaptures>>[number],
  img: HTMLImageElement | null,
  pageWidth: number,
  margin: number,
  startY: number,
): number {
  let y = startY;
  doc.setFontSize(12);
  doc.text(cap.name, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(`${cap.type} · ${new Date(cap.timestamp).toLocaleString()}`, margin, y);
  y += 6;
  if (img) {
    const { width, height } = fitImage(img, pageWidth - margin * 2, 80);
    doc.addImage(cap.dataUrl, 'PNG', margin, y, width, height);
    y += height + 10;
  } else {
    doc.text('(imagen no disponible)', margin, y);
    y += 6;
  }
  return y;
}

async function addCaptures(
  doc: jsPDF,
  captures: Awaited<ReturnType<typeof listCaptures>>,
  pageWidth: number,
  pageHeight: number,
  margin: number,
) {
  if (captures.length === 0) return;
  // Preload images in parallel; layout must stay sequential anyway.
  const images = await Promise.all(
    captures.map((cap) =>
      loadImage(cap.dataUrl).then((img) => ({ cap, img })).catch(() => ({ cap, img: null })),
    ),
  );
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Capturas', margin, 20);
  let y = 30;
  for (const { cap, img } of images) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }
    y = renderCapture(doc, cap, img, pageWidth, margin, y);
  }
}

function addQuestions(
  doc: jsPDF,
  questions: Question[],
  pageHeight: number,
  margin: number,
) {
  if (questions.length === 0) return;
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Preguntas de estudiantes', margin, 20);
  doc.setFontSize(10);
  let y = 30;
  for (const q of questions) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    const mark = q.resolved ? '✓' : '•';
    doc.text(`${mark} ${q.text}  (${new Date(q.timestamp).toLocaleTimeString()})`, margin, y);
    y += 6;
  }
}

export interface BoardPage {
  label: string;
  dataUrl: string;
}

/** One PDF page per board page — a session report must carry them all. */
async function addBoardPages(
  doc: jsPDF,
  boardPages: BoardPage[] | undefined,
  pageWidth: number,
  pageHeight: number,
  margin: number,
) {
  if (!boardPages || boardPages.length === 0) return;
  for (const page of boardPages) {
    doc.addPage();
    doc.setFontSize(16);
    doc.text('Pizarra', margin, 20);
    doc.setFontSize(10);
    doc.text(page.label, margin, 27);
    try {
      const img = await loadImage(page.dataUrl);
      const { width, height } = fitImage(img, pageWidth - margin * 2, pageHeight - 45);
      doc.addImage(page.dataUrl, 'PNG', margin, 32, width, height);
    } catch {
      doc.text('(no se pudo incluir la página)', margin, 35);
    }
  }
}

function addChat(
  doc: jsPDF,
  chat: ChatRecord | null,
  pageHeight: number,
  margin: number,
) {
  const msgs = (chat?.messages ?? []).filter((m) => m.role === 'user' || m.role === 'assistant');
  if (msgs.length === 0) return;
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Interacciones con el asistente', margin, 20);
  doc.setFontSize(10);
  let y = 30;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  for (const m of msgs) {
    const label = m.role === 'user' ? 'Profesor' : 'Asistente';
    const cites = m.citations?.length ? ` [${m.citations.join(', ')}]` : '';
    const lines = doc.splitTextToSize(`${label}: ${m.content.replace(/```[\s\S]*?```/g, '[código]')}${cites}`, maxWidth);
    if (y + lines.length * 4.5 > pageHeight - 15) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 4;
  }
}

export interface PDFExportOptions {
  boardPages?: BoardPage[];
  filename?: string;
}

export async function exportSessionToPDF(opts: PDFExportOptions = {}): Promise<void> {
  const session = await getActiveSession();
  const captures = await listCaptures();
  const chat = session ? await getChatRecord(session.id) : null;

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  addCover(doc, session, margin);
  addSections(doc, session?.visitedSections ?? [], pageHeight, margin);
  await addCaptures(doc, captures, pageWidth, pageHeight, margin);
  addQuestions(doc, session?.questions ?? [], pageHeight, margin);
  addChat(doc, chat, pageHeight, margin);
  await addBoardPages(doc, opts.boardPages, pageWidth, pageHeight, margin);

  doc.save(opts.filename ?? `sesion-${Date.now()}.pdf`);
}
