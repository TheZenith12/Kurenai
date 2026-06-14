export default function GuildLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 rounded-2xl bg-surface-2" />
      <div className="h-32 rounded-2xl bg-surface-2" />
      <div className="h-6 w-40 rounded bg-surface-2" />
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-surface-2" />)}
    </div>
  );
}
