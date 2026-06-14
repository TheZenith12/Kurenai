export default function LeaderboardLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-2xl bg-surface-2" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-24 rounded-lg bg-surface-2" />)}
      </div>
      {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-2" />)}
    </div>
  );
}
