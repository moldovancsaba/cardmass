import SpockNav from "@/components/SpockNav";

import OrgHome from '@/components/OrgHome'

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">cardmass</h1>
        <p className="mb-6">Manage organizations and boards (UUID routes, org-scoped).</p>
        <OrgHome />
      </section>
    </main>
  );
}
