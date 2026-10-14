'use client';

import { useRef, useState } from 'react';
import { Copy, Delete, X } from 'lucide-react';
import { copyText } from '../lib/clipboard';

interface BlackboardCalculatorProps {
  onClose?: () => void;
}

interface HistoryEntry {
  expression: string;
  result: string;
}

const FUNCTIONS: Record<string, (args: number[]) => number> = {
  sqrt: ([x]) => Math.sqrt(x),
  ln: ([x]) => Math.log(x),
  log: ([x]) => Math.log10(x),
  exp: ([x]) => Math.exp(x),
  abs: ([x]) => Math.abs(x),
  sin: ([x]) => Math.sin(x),
  cos: ([x]) => Math.cos(x),
  tan: ([x]) => Math.tan(x),
  ncr: ([n, k]) => comb(n, k),
  npr: ([n, k]) => perm(n, k),
  min: (args) => Math.min(...args),
  max: (args) => Math.max(...args),
};

function comb(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) {
    throw new Error('nCr exige enteros 0 ≤ k ≤ n');
  }
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

function perm(n: number, k: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(k) || n < 0 || k < 0 || k > n) {
    throw new Error('nPr exige enteros 0 ≤ k ≤ n');
  }
  let r = 1;
  for (let i = 0; i < k; i++) r *= n - i;
  return r;
}

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) {
    throw new Error('n! exige un entero entre 0 y 170');
  }
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** Safe recursive-descent evaluator; never uses eval(). */
class Parser {
  private pos = 0;

  constructor(
    private readonly src: string,
    private readonly ans: number,
  ) {}

  parse(): number {
    const value = this.expr();
    this.skipSpaces();
    if (this.pos < this.src.length) throw new Error('Expresión incompleta');
    if (!Number.isFinite(value)) throw new Error('Resultado fuera de dominio');
    return value;
  }

  private expr(): number {
    let value = this.term();
    for (;;) {
      this.skipSpaces();
      if (this.peek() === '+') { this.pos++; value += this.term(); }
      else if (this.peek() === '-') { this.pos++; value -= this.term(); }
      else return value;
    }
  }

  private term(): number {
    let value = this.factor();
    for (;;) {
      this.skipSpaces();
      if (this.peek() === '*') { this.pos++; value *= this.factor(); }
      else if (this.peek() === '/') { this.pos++; value /= this.factor(); }
      else return value;
    }
  }

  private factor(): number {
    const base = this.unary();
    this.skipSpaces();
    if (this.peek() === '^') {
      this.pos++;
      return base ** this.factor();
    }
    return base;
  }

  private unary(): number {
    this.skipSpaces();
    if (this.peek() === '-') { this.pos++; return -this.unary(); }
    if (this.peek() === '+') { this.pos++; return this.unary(); }
    return this.postfix();
  }

  private postfix(): number {
    let value = this.primary();
    for (;;) {
      this.skipSpaces();
      if (this.peek() === '!') { this.pos++; value = factorial(value); }
      else if (this.peek() === '%') { this.pos++; value /= 100; }
      else return value;
    }
  }

  private primary(): number {
    this.skipSpaces();
    const ch = this.peek();
    if (ch === '(') {
      this.pos++;
      const value = this.expr();
      this.expect(')');
      return value;
    }
    if (ch === '|') {
      this.pos++;
      const value = this.expr();
      this.expect('|');
      return Math.abs(value);
    }
    if (ch >= '0' && ch <= '9' || ch === '.') return this.number();
    if (ch >= 'a' && ch <= 'z' || ch >= 'A' && ch <= 'Z') return this.identifier();
    throw new Error('Se esperaba un número');
  }

  private number(): number {
    const start = this.pos;
    while (this.pos < this.src.length && /[0-9.]/.test(this.src[this.pos])) this.pos++;
    if (this.peek() === 'e' && /[0-9+\-]/.test(this.src[this.pos + 1] ?? '')) {
      this.pos += 2;
      while (this.pos < this.src.length && /[0-9]/.test(this.src[this.pos])) this.pos++;
    }
    const value = Number(this.src.slice(start, this.pos));
    if (Number.isNaN(value)) throw new Error('Número inválido');
    return value;
  }

  private identifier(): number {
    const start = this.pos;
    while (this.pos < this.src.length && /[a-zA-Z]/.test(this.src[this.pos])) this.pos++;
    const name = this.src.slice(start, this.pos).toLowerCase();
    if (name === 'ans') return this.ans;
    if (name === 'pi') return Math.PI;
    if (name === 'e') return Math.E;
    const fn = FUNCTIONS[name];
    if (!fn) throw new Error(`Función desconocida: ${name}`);
    this.skipSpaces();
    this.expect('(');
    const args = [this.expr()];
    while (this.peek() === ',') {
      this.pos++;
      args.push(this.expr());
    }
    this.expect(')');
    const value = fn(args);
    if (Number.isNaN(value) || !Number.isFinite(value)) throw new Error('Resultado fuera de dominio');
    return value;
  }

  private peek(): string {
    this.skipSpaces();
    return this.src[this.pos] ?? '';
  }

  private expect(ch: string): void {
    this.skipSpaces();
    if (this.src[this.pos] !== ch) throw new Error(`Se esperaba «${ch}»`);
    this.pos++;
  }

  private skipSpaces(): void {
    while (this.src[this.pos] === ' ') this.pos++;
  }
}

function normalize(expression: string): string {
  return expression
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('√', 'sqrt')
    .replaceAll('π', 'pi');
}

function format(value: number): string {
  if (Number.isInteger(value) && Math.abs(value) < 1e15) return String(value);
  const s = value.toPrecision(12);
  return s.includes('e') ? s : String(Number(s));
}

const SCI_KEYS: { label: string; insert: string }[] = [
  { label: '√', insert: '√(' },
  { label: 'x²', insert: '^2' },
  { label: 'xʸ', insert: '^' },
  { label: 'ln', insert: 'ln(' },
  { label: 'log', insert: 'log(' },
  { label: 'eˣ', insert: 'e^(' },
  { label: 'π', insert: 'π' },
  { label: 'e', insert: 'e' },
  { label: 'n!', insert: '!' },
  { label: 'nCr', insert: 'ncr(' },
  { label: 'nPr', insert: 'npr(' },
  { label: 'Ans', insert: 'ans' },
  { label: 'sin', insert: 'sin(' },
  { label: 'cos', insert: 'cos(' },
  { label: 'tan', insert: 'tan(' },
  { label: '%', insert: '%' },
  { label: '|x|', insert: '|' },
  { label: 'x⁻¹', insert: '^(-1)' },
];

const PAD_KEYS: { label: string; insert?: string; action?: 'clear' | 'back' | 'eval' }[] = [
  { label: 'C', action: 'clear' },
  { label: '⌫', action: 'back' },
  { label: '(' , insert: '(' },
  { label: ')', insert: ')' },
  { label: '7', insert: '7' },
  { label: '8', insert: '8' },
  { label: '9', insert: '9' },
  { label: '÷', insert: '÷' },
  { label: '4', insert: '4' },
  { label: '5', insert: '5' },
  { label: '6', insert: '6' },
  { label: '×', insert: '×' },
  { label: '1', insert: '1' },
  { label: '2', insert: '2' },
  { label: '3', insert: '3' },
  { label: '−', insert: '−' },
  { label: '0', insert: '0' },
  { label: '.', insert: '.' },
  { label: ',', insert: ',' },
  { label: '=', action: 'eval' },
];

export function BlackboardCalculator({ onClose }: Readonly<BlackboardCalculatorProps>) {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ans, setAns] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const evaluate = (expr?: string) => {
    const src = (expr ?? expression).trim();
    if (!src) return;
    try {
      const value = new Parser(normalize(src), ans).parse();
      const rendered = format(value);
      setResult(rendered);
      setAns(value);
      setError(null);
      setHistory((h) => [{ expression: src, result: rendered }, ...h].slice(0, 4));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setResult(null);
    }
  };

  const insert = (text: string) => {
    const input = inputRef.current;
    if (!input) {
      setExpression((e) => e + text);
      return;
    }
    const start = input.selectionStart ?? expression.length;
    const end = input.selectionEnd ?? expression.length;
    const next = expression.slice(0, start) + text + expression.slice(end);
    setExpression(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const backspace = () => {
    const input = inputRef.current;
    const start = input?.selectionStart ?? expression.length;
    const end = input?.selectionEnd ?? expression.length;
    if (start !== end) {
      setExpression(expression.slice(0, start) + expression.slice(end));
    } else if (start > 0) {
      setExpression(expression.slice(0, start - 1) + expression.slice(start));
    }
    input?.focus();
  };

  const copyResult = async () => {
    if (!result) return;
    if (await copyText(result)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <div className="w-64 rounded border border-ink-200 bg-white p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-ink-800">Calculadora</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-ink-400 hover:text-ink-600"
          aria-label="Cerrar calculadora"
        >
          <X aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-2 space-y-0.5 border-b border-ink-100 pb-1.5">
          {history.map((entry, i) => (
            <button
              key={`${entry.expression}-${i}`}
              type="button"
              onClick={() => setExpression(entry.expression)}
              title="Reusar esta expresión"
              className="block w-full truncate text-right font-mono text-[10px] text-ink-400 hover:text-ink-600"
            >
              {entry.expression} = <span className="text-ink-500">{entry.result}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-2">
        <input
          ref={inputRef}
          value={expression}
          onChange={(e) => { setExpression(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') evaluate(); }}
          placeholder="2 × ncr(20, 5) / pi"
          aria-label="Expresión"
          className="w-full rounded border border-ink-200 bg-ink-50 px-2 py-1.5 font-mono text-xs text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-1 focus:ring-accent-500"
        />
        <div className="mt-1 flex items-center justify-between gap-1">
          <span
            data-testid="calc-result"
            className={`min-h-4 font-mono text-sm font-semibold ${error ? 'text-danger-600' : 'text-ink-900'}`}
          >
            {error ?? result ?? ''}
          </span>
          {result && (
            <button
              type="button"
              onClick={copyResult}
              title="Copiar resultado"
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            >
              <Copy aria-hidden className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-6 gap-1">
        {SCI_KEYS.map((key) => (
          <button
            key={key.label}
            type="button"
            onClick={() => insert(key.insert)}
            className="rounded border border-ink-100 bg-ink-50 px-0.5 py-1 text-[10px] font-medium text-ink-600 hover:bg-ink-100 hover:text-ink-900"
          >
            {key.label}
          </button>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-4 gap-1">
        {PAD_KEYS.map((key) => {
          const isEquals = key.action === 'eval';
          const base = 'rounded px-1 py-1.5 text-xs transition-colors';
          const style = isEquals
            ? `${base} bg-brand-600 font-semibold text-white hover:bg-brand-700`
            : `${base} border border-ink-200 bg-white text-ink-800 hover:bg-ink-100`;
          return (
            <button
              key={key.label}
              type="button"
              onClick={() => {
                if (key.action === 'clear') { setExpression(''); setResult(null); setError(null); }
                else if (key.action === 'back') backspace();
                else if (key.action === 'eval') evaluate();
                else if (key.insert) insert(key.insert);
              }}
              className={style}
            >
              {key.action === 'back' ? <Delete aria-hidden className="mx-auto h-3.5 w-3.5" /> : key.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[10px] leading-snug text-ink-400">
        nCr(n, k) combinaciones · log = base 10 · ángulos en radianes · Enter evalúa
      </p>
    </div>
  );
}
