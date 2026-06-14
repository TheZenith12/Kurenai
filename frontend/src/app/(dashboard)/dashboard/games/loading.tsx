export default function GamesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-2xl bg-surface-2" />
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => <div key={i} className="h-9 w-28 rounded-lg bg-surface-2" />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-44 rounded-2xl bg-surface-2" />)}
      </div>
    </div>
  );
}
