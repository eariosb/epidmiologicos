'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  /** Panel name shown in the fallback, e.g. "canvas", "assistant". */
  name: string;
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Isolates a panel crash: a failing child renders an inline fallback and
 * never takes sibling panels (canvas, toolbar, chat) down with it.
 */
export class PanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    console.error(`[blackboard] panel "${this.props.name}" crashed`, error);
  }

  render() {
    const { error } = this.state;
    if (error === null) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="m-2 rounded border border-danger-300 bg-danger-50 p-3 text-xs text-danger-700">
        <p className="font-medium">El panel “{this.props.name}” falló.</p>
        <p className="mt-1 font-mono">{error.message}</p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-2 rounded border border-danger-300 px-2 py-0.5 hover:bg-danger-100"
        >
          Reintentar
        </button>
      </div>
    );
  }
}
