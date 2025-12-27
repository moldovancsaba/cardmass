'use client'

import SpockNav from "@/components/SpockNav";
import OrgHome from '@/components/OrgHome'

// WHAT: Temporary - Authentication removed for testing
// WHY: Get app working without SSO to test deployment
function HomePageContent() {
  // WHAT: Show organizations UI without authentication check
  // WHY: Temporary - removed auth to get app working
  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">cardmass</h1>
            <p className="text-sm text-gray-600 mt-1">Manage organizations and boards</p>
          </div>
        </div>
        <OrgHome />
      </section>
    </main>
  );
}

export default function HomePage() {
  return <HomePageContent />
}
