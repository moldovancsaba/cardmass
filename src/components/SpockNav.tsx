// SpockNav (server): minimal, logical top-level navigation (no breadcrumbs).
// What: Shows brand only; no global Admin link.
// Why: Admin is scoped to organization; global /admin is disabled.
export default function SpockNav() {
  return (
    <nav className="w-full border-b border-black/10 bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-xl">🖖</span>
          <span className="font-semibold tracking-wide">cardmass</span>
        </div>
        <div className="flex items-center gap-3" />
      </div>
    </nav>
  );
}
