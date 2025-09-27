import { Suspense } from "react";
import SpockNav from "@/components/SpockNav";
import CreatorApp from "./ui/CreatorApp";

export default function CreatorPage() {
  return (
    <main className="min-h-dvh bg-white text-slate-900">
      <SpockNav />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Creator</h1>
        <Suspense fallback={null}>
          <CreatorApp />
        </Suspense>
      </section>
    </main>
  );
}
