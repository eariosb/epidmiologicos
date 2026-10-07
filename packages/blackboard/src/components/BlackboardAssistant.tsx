'use client';

import { useState, useRef } from 'react';
import { useBlackboardContext } from '../lib/context';
import { useBlackboardLLM } from '../hooks/useBlackboardLLM';
import type { AssistantMode, LLMMessage } from '../types/blackboard';

interface BlackboardAssistantProps {
  onExecuteR?: (code: string) => void;
}

const MODES: { id: AssistantMode; label: string }[] = [
  { id: 'ask', label: 'Preguntar' },
  { id: 'explain-selection', label: 'Explicar' },
  { id: 'generate-r', label: 'Generar R' },
  { id: 'plot-r', label: 'Graficar' },
];

export function BlackboardAssistant({ onExecuteR }: BlackboardAssistantProps) {
  const { state } = useBlackboardContext();
  const { messages, status, ask, stop, clear } = useBlackboardLLM();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AssistantMode>('ask');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && status !== 'streaming') return;
    await ask(mode, input.trim());
    setInput('');
  };

  const assistantMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div className="flex h-64 flex-col border-t border-ink-200 bg-white">
      <div className="flex items-center justify-between border-b border-ink-200 px-3 py-2">
        <div className="flex gap-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                mode === m.id
                  ? 'bg-accent-100 text-accent-700'
                  : 'text-ink-500 hover:bg-ink-100'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clear}
            className="text-xs text-ink-400 hover:text-ink-600"
          >
            Limpiar
          </button>
          {status === 'streaming' && (
            <button
              type="button"
              onClick={stop}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Detener
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {assistantMessages.length === 0 && (
          <p className="text-center text-xs text-ink-400">
            Escribe una pregunta o dibuja en el lienzo y envíala a la IA.
          </p>
        )}
        {assistantMessages.map((m) => (
          <MessageBlock key={m.id} message={m} onExecuteR={onExecuteR} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-ink-200 p-2">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregunta o instrucción…"
            className="flex-1 rounded border border-ink-200 px-3 py-1.5 text-sm text-ink-800 focus:border-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500"
          />
          <button
            type="submit"
            disabled={status === 'streaming'}
            className="rounded bg-accent-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'streaming' ? '…' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBlock({
  message,
  onExecuteR,
}: {
  message: LLMMessage;
  onExecuteR?: (code: string) => void;
}) {
  const isUser = message.role === 'user';
  const parts = parseContent(message.content);

  return (
    <div className={`rounded border p-2 text-sm ${isUser ? 'ml-4 bg-ink-50 border-ink-200' : 'mr-4 bg-white border-ink-200'}`}>
      {parts.map((part, i) => {
        if (part.type === 'code') {
          return (
            <CodeBlock key={i} lang={part.lang} code={part.content} onExecuteR={onExecuteR} />
          );
        }
        if (part.type === 'latex') {
          return (
            <div key={i} className="my-2 rounded bg-ink-50 p-2 font-mono text-xs text-ink-700">
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-400">{part.inline ? 'LaTeX inline' : 'LaTeX'}</span>
                <CopyButton text={part.content} label="Copiar LaTeX" />
              </div>
              <pre className="mt-1 overflow-x-auto">{part.content}</pre>
            </div>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap text-ink-800">
            {part.content}
          </p>
        );
      })}
    </div>
  );
}

function CodeBlock({
  lang,
  code,
  onExecuteR,
}: {
  lang: string;
  code: string;
  onExecuteR?: (code: string) => void;
}) {
  const isR = lang === 'r';
  return (
    <div className="my-2 overflow-hidden rounded border border-ink-200 bg-ink-900 text-ink-50">
      <div className="flex items-center justify-between border-b border-ink-700 bg-ink-800 px-2 py-1">
        <span className="text-[10px] uppercase tracking-wide">{lang || 'code'}</span>
        <div className="flex gap-2">
          {isR && onExecuteR && (
            <button
              type="button"
              onClick={() => onExecuteR(code)}
              className="text-[10px] text-accent-300 hover:text-white"
            >
              Ejecutar en RCell
            </button>
          )}
          <CopyButton text={code} label="Copiar" />
        </div>
      </div>
      <pre className="overflow-x-auto p-2 text-xs">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[10px] text-accent-600 hover:text-accent-700"
    >
      {copied ? 'Copiado' : label}
    </button>
  );
}

type ContentPart =
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; content: string }
  | { type: 'latex'; content: string; inline: boolean };

function parseContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  let remaining = content;

  const blockCode = /```(\w*)\n?([\s\S]*?)```/;
  const inlineLatex = /\$([^$\n]+?)\$/g;
  const blockLatex = /\$\$([\s\S]+?)\$\$/g;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(blockCode);
    const latexMatch = remaining.match(blockLatex);

    const firstMatch = [
      codeMatch ? { index: codeMatch.index ?? Infinity, match: codeMatch, type: 'code' as const } : null,
      latexMatch ? { index: latexMatch.index ?? Infinity, match: latexMatch, type: 'latex' as const } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => (a!.index as number) - (b!.index as number))[0];

    if (!firstMatch) {
      parts.push({ type: 'text', content: remaining });
      break;
    }

    const { index, match, type } = firstMatch;
    if (index > 0) {
      parts.push({ type: 'text', content: remaining.slice(0, index) });
    }

    if (type === 'code') {
      parts.push({ type: 'code', lang: match[1], content: match[2].trim() });
      remaining = remaining.slice(index + match[0].length);
    } else {
      parts.push({ type: 'latex', content: match[1].trim(), inline: false });
      remaining = remaining.slice(index + match[0].length);
    }
  }

  // Parse inline LaTeX inside text parts
  const finalParts: ContentPart[] = [];
  for (const part of parts) {
    if (part.type !== 'text') {
      finalParts.push(part);
      continue;
    }
    let text = part.content;
    inlineLatex.lastIndex = 0;
    let m: RegExpExecArray | null;
    let lastIndex = 0;
    while ((m = inlineLatex.exec(text)) !== null) {
      if (m.index > lastIndex) {
        finalParts.push({ type: 'text', content: text.slice(lastIndex, m.index) });
      }
      finalParts.push({ type: 'latex', content: m[1], inline: true });
      lastIndex = m.index + m[0].length;
    }
    if (lastIndex < text.length) {
      finalParts.push({ type: 'text', content: text.slice(lastIndex) });
    }
  }

  return finalParts;
}
