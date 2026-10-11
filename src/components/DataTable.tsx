import { Table } from 'lucide-react';

export interface DataTableVariable {
  name: string;
  type: string;
  description: string;
}

export interface DataTableProps {
  title: string;
  description: string;
  variables: DataTableVariable[];
  source: string;
  license?: string;
}

/**
 * Ficha de dataset: título, descripción, diccionario de variables,
 * procedencia y licencia. Toda base de datos usada en el curso lleva una.
 */
export function DataTable({ title, description, variables, source, license }: DataTableProps) {
  return (
    <div className="my-6 overflow-hidden rounded border border-ink-200 bg-white shadow-sm">
      <div className="border-b border-ink-200 bg-brand-50 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-brand-800">
          <Table aria-hidden className="h-4 w-4" />
          {title}
        </p>
        <p className="mt-1 text-sm text-ink-600">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-ink-200 text-sm">
          <thead className="bg-ink-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">
                Variable
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">
                Tipo
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-600">
                Descripción
              </th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v) => (
              <tr key={v.name} className="border-t border-ink-100">
                <td className="px-4 py-2 font-mono text-xs text-brand-700">{v.name}</td>
                <td className="px-4 py-2 text-ink-600">{v.type}</td>
                <td className="px-4 py-2 text-ink-700">{v.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-ink-200 bg-ink-50 px-4 py-2 text-xs text-ink-500">
        <span className="font-medium">Fuente:</span> {source}
        {license && (
          <>
            {' · '}
            <span className="font-medium">Licencia:</span> {license}
          </>
        )}
      </div>
    </div>
  );
}
