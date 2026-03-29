export default function Loading() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-border border-t-accent rounded-full animate-spin" />
        <p className="text-text-muted text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
