import { getActiveSession, listCaptures, type Session, type Capture } from './session-store';
import { getChatRecord } from './chat-store';

/**
 * Structured Markdown export of a teaching session — the deliverable the
 * teacher sends to students. Captures are referenced by name (binary lives
 * in IDB; embedding data URLs would bloat the .md).
 */
export function buildSessionMarkdown(
  session: Session | null,
  captures: Capture[],
  chat: { messages: { role: string; content: string; citations?: string[] }[] } | null,
): string {
  const lines: string[] = [];
  lines.push(`# ${session?.title ?? 'Sesión de clase'}`);
  lines.push('');
  if (session?.courseId) lines.push(`**Curso:** ${session.courseId}`);
  if (session?.moduleSlug) lines.push(`**Módulo:** ${session.moduleSlug}`);
  if (session?.startedAt)
    lines.push(`**Inicio:** ${new Date(session.startedAt).toLocaleString('es-CO')}`);
  if (session?.endedAt)
    lines.push(`**Fin:** ${new Date(session.endedAt).toLocaleString('es-CO')}`);
  lines.push(`**Estado:** ${session?.status === 'ended' ? 'Finalizada' : 'En curso'}`);
  lines.push('');

  const sections = session?.visitedSections ?? [];
  if (sections.length > 0) {
    lines.push('## Secciones navegadas');
    for (const s of sections) {
      lines.push(`- ${s.title} (\`${s.slug}\`) · ${new Date(s.timestamp).toLocaleTimeString('es-CO')}`);
    }
    lines.push('');
  }

  if (captures.length > 0) {
    lines.push('## Capturas');
    for (const c of captures) {
      const tags = c.tags.length ? ` · etiquetas: ${c.tags.join(', ')}` : '';
      lines.push(`- **${c.name}** (${c.type}) · ${new Date(c.timestamp).toLocaleString('es-CO')}${tags}`);
      if (c.code) lines.push('  ```r\n' + c.code.trim() + '\n  ```');
      if (c.outputText) lines.push('  ```\n' + c.outputText.trim() + '\n  ```');
    }
    lines.push('');
  }

  const questions = session?.questions ?? [];
  if (questions.length > 0) {
    lines.push('## Preguntas de estudiantes');
    for (const q of questions) {
      lines.push(`- [${q.resolved ? 'x' : ' '}] ${q.text} · ${new Date(q.timestamp).toLocaleTimeString('es-CO')}`);
    }
    lines.push('');
  }

  const msgs = (chat?.messages ?? []).filter((m) => m.role === 'user' || m.role === 'assistant');
  if (msgs.length > 0) {
    lines.push('## Interacciones con el asistente');
    for (const m of msgs) {
      const who = m.role === 'user' ? '**Profesor**' : '**Asistente**';
      lines.push(`### ${who}`);
      lines.push(m.content);
      if (m.citations?.length) lines.push(`\n_Citas verificadas: ${m.citations.join(', ')}_`);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push(`_Generado: ${new Date().toLocaleString('es-CO')}_`);
  return lines.join('\n');
}

export async function exportSessionMarkdown(): Promise<void> {
  const session = await getActiveSession();
  const captures = await listCaptures();
  const chat = session ? await getChatRecord(session.id) : null;
  const md = buildSessionMarkdown(session, captures, chat);

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sesion-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
