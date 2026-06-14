export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="h-48 rounded-2xl bg-surface-2" />
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-surface-2" />)}
      </div>
      {/* Characters */}
      <div className="h-6 w-40 rounded bg-surface-2" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-surface-2" />)}
      </div>
    </div>
  );
}
