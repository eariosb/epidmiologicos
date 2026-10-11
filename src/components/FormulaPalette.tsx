'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { sendToBlackboard } from '@/lib/send-to-blackboard';
import { latexToDataUrl } from '@/lib/latex-image';

interface FormulaItem {
  id: string;
  label: string;
  latex: string;
  rCode: string;
  category: string;
  custom?: boolean;
}

const BUILTIN_FORMULAS: FormulaItem[] = [
  {
    id: 'lmm',
    label: 'LMM general',
    latex: 'y = X\\beta + Zb + \\varepsilon',
    rCode: 'lmer(y ~ X + (1|Z))',
    category: 'Modelos',
  },
  {
    id: 'ri',
    label: 'Intercepto aleatorio',
    latex: 'y_{ij} = \\beta_{0j} + \\beta_1 x_{ij} + \\varepsilon_{ij}, \\quad \\beta_{0j} = \\gamma_{00} + u_{0j}',
    rCode: 'lmer(y ~ x + (1|id))',
    category: 'Modelos',
  },
  {
    id: 'rs',
    label: 'Pendiente aleatoria',
    latex: 'y_{ij} = \\beta_{0j} + \\beta_{1j} x_{ij} + \\varepsilon_{ij}, \\quad \\beta_{1j} = \\gamma_{10} + u_{1j}',
    rCode: 'lmer(y ~ x + (1 + x|id))',
    category: 'Modelos',
  },
  {
    id: 'cs',
    label: 'Compound Symmetry',
    latex: '\\Sigma = \\sigma^2\\begin{pmatrix} 1 & \\rho & \\cdots \\\\ \\rho & 1 & \\cdots \\\\ \\vdots & \\vdots & \\ddots \\end{pmatrix}',
    rCode: 'corCompSymm(form = ~ 1 | id)',
    category: 'Covarianzas',
  },
  {
    id: 'ar1',
    label: 'AR(1)',
    latex: '\\Sigma_{ij} = \\sigma^2 \\rho^{|i-j|}',
    rCode: 'corAR1(form = ~ time | id)',
    category: 'Covarianzas',
  },
  {
    id: 'un',
    label: 'Unstructured',
    latex: '\\Sigma = \\begin{pmatrix} \\sigma_{11} & \\sigma_{12} & \\cdots \\\\ \\sigma_{21} & \\sigma_{22} & \\cdots \\\\ \\vdots & \\vdots & \\ddots \\end{pmatrix}',
    rCode: 'corSymm(form = ~ 1 | id)',
    category: 'Covarianzas',
  },
  {
    id: 'aic',
    label: 'AIC',
    latex: 'AIC = -2\\ell(\\hat{\\theta}) + 2k',
    rCode: 'AIC(model)',
    category: 'Criterios',
  },
  {
    id: 'bic',
    label: 'BIC',
    latex: 'BIC = -2\\ell(\\hat{\\theta}) + k\\ln(n)',
    rCode: 'BIC(model)',
    category: 'Criterios',
  },
  {
    id: 'lrt',
    label: 'Test de razón de verosimilitud',
    latex: '\\Lambda = -2(\\ell_0 - \\ell_1) \\sim \\chi^2_{\\Delta df}',
    rCode: 'anova(model0, model1)',
    category: 'Criterios',
  },
];

const CATEGORIES = ['Modelos', 'Covarianzas', 'Criterios'];

const STORAGE_KEY = 'mlm-formula-palette';

export function FormulaPalette() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [insertingId, setInsertingId] = useState<string | null>(null);
  const [formulas, setFormulas] = useState<FormulaItem[]>(BUILTIN_FORMULAS);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ label: '', latex: '', rCode: '', category: CATEGORIES[0] });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FormulaItem[];
        const custom = parsed.filter((f) => f.custom);
        setFormulas([...BUILTIN_FORMULAS, ...custom]);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const custom = formulas.filter((f) => f.custom);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    } catch {
      // ignore
    }
  }, [formulas]);

  const filtered = formulas.filter((f) => f.category === activeCategory);

  const handleCopy = (item: FormulaItem, what: 'rCode' | 'latex') => {
    void navigator.clipboard.writeText(what === 'rCode' ? item.rCode : item.latex);
    setCopiedId(`${item.id}-${what}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsert = async (item: FormulaItem) => {
    setInsertingId(item.id);
    try {
      const dataUrl = await latexToDataUrl(item.latex);
      sendToBlackboard({
        dataUrl,
        opts: {
          meta: {
            boardKind: 'math',
            boardId: item.id,
            payload: { latex: item.latex, display: true, label: item.label },
          },
        },
      });
    } finally {
      setInsertingId(null);
    }
  };

  const handleAdd = () => {
    if (!draft.label || !draft.latex || !draft.rCode) return;
    const newItem: FormulaItem = {
      id: `custom-${Date.now()}`,
      label: draft.label,
      latex: draft.latex,
      rCode: draft.rCode,
      category: draft.category || CATEGORIES[0],
      custom: true,
    };
    setFormulas((prev) => [...prev, newItem]);
    setDraft({ label: '', latex: '', rCode: '', category: CATEGORIES[0] });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setFormulas((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded border border-ink-200 bg-white shadow-sm">
      <div className="border-b border-ink-200 bg-ink-50 px-4 py-2">
        <p className="text-sm font-semibold text-ink-800">Paleta de fórmulas</p>
      </div>

      <div className="flex gap-1 border-b border-ink-200 px-3 py-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              'rounded px-2 py-0.5 text-xs font-medium transition-colors',
              activeCategory === cat
                ? 'bg-brand-100 text-brand-700'
                : 'text-ink-500 hover:bg-ink-100'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded border border-ink-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/30"
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-medium text-ink-700">{item.label}</p>
              {item.custom && (
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="text-[10px] text-danger-500 hover:text-danger-700"
                >
                  Borrar
                </button>
              )}
            </div>
            <div className="mb-2 overflow-x-auto rounded bg-ink-50 px-2 py-1.5">
              <code className="text-xs text-ink-600">{item.latex}</code>
            </div>
            <div className="flex items-center justify-between">
              <code className="font-mono text-xs text-brand-700">{item.rCode}</code>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleInsert(item)}
                  disabled={insertingId === item.id}
                  className="text-[10px] text-ink-400 hover:text-brand-600 disabled:opacity-50"
                >
                  {insertingId === item.id ? '…' : 'Insertar en pizarra'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(item, 'latex')}
                  className="text-[10px] text-ink-400 hover:text-brand-600"
                >
                  {copiedId === `${item.id}-latex` ? '✓' : 'Copiar LaTeX'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(item, 'rCode')}
                  className="text-[10px] text-ink-400 hover:text-brand-600"
                >
                  {copiedId === `${item.id}-rCode` ? '✓' : 'Copiar R'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-ink-200 bg-ink-50 p-3">
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full rounded border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            + Nueva fórmula
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nombre (ej. Intercepto aleatorio)"
              value={draft.label}
              onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
              className="w-full rounded border border-ink-200 px-2 py-1 text-xs"
            />
            <textarea
              placeholder="LaTeX"
              value={draft.latex}
              onChange={(e) => setDraft((d) => ({ ...d, latex: e.target.value }))}
              className="w-full rounded border border-ink-200 px-2 py-1 text-xs font-mono"
              rows={2}
            />
            <input
              type="text"
              placeholder="Código R equivalente"
              value={draft.rCode}
              onChange={(e) => setDraft((d) => ({ ...d, rCode: e.target.value }))}
              className="w-full rounded border border-ink-200 px-2 py-1 text-xs font-mono"
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="w-full rounded border border-ink-200 px-2 py-1 text-xs"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                className="rounded bg-brand-500 px-3 py-1 text-xs font-medium text-white hover:bg-brand-600"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded border border-ink-200 px-3 py-1 text-xs text-ink-600 hover:bg-ink-100"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
