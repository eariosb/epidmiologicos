export function BlackboardSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-ink-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-accent-500" />
      <p className="text-sm">Cargando pizarra…</p>
    </div>
  );
}
