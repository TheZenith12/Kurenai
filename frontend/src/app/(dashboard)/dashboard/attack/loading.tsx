export default function AttackLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-2xl bg-surface-2" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="h-6 w-32 rounded bg-surface-2" />
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-2" />)}
        </div>
        <div className="space-y-3">
          <div className="h-6 w-32 rounded bg-surface-2" />
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-2" />)}
        </div>
      </div>
    </div>
  );
}
