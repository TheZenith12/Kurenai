export default function ChatLoading() {
  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] animate-pulse">
      {/* Sidebar */}
      <div className="w-64 hidden md:flex flex-col gap-2">
        <div className="h-10 rounded-xl bg-surface-2" />
        {[...Array(6)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-surface-2" />)}
      </div>
      {/* Chat area */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="h-14 rounded-2xl bg-surface-2" />
        <div className="flex-1 rounded-2xl bg-surface-2" />
        <div className="h-14 rounded-2xl bg-surface-2" />
      </div>
    </div>
  );
}
