import SpockNav from "@/components/SpockNav";
import Link from 'next/link'
import OrgHome from '@/components/OrgHome'

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">cardmass</h1>
        <p className="mb-6">Manage organizations and boards (UUID routes, org-scoped).</p>

        {/* Primary SSO login CTA */}
        <div className="mb-8">
          <Link
            href="/api/auth/sso/login?return_to=/organizations"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-white font-medium shadow-sm hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Sign in with SSO
          </Link>
          <p className="mt-2 text-xs text-gray-500">Single Sign-On for all DoneIsBetter apps</p>
        </div>

        {/* Legacy login fallback */}
        <div className="mb-8">
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-white text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Sign In (Legacy)
          </Link>
        </div>

        <OrgHome />
      </section>
    </main>
  );
}
