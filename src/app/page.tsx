import SpockNav from "@/components/SpockNav";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-white">
      <SpockNav />
      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-bold mb-4">Welcome to cardmass</h1>
        <p className="mb-6">Choose your path:</p>
        <ul className="list-disc ml-6 space-y-2">
          <li><a className="underline text-[--color-brand]" href="/creator">Go to Creator</a></li>
          <li><a className="underline text-[--color-brand]" href="/admin">Go to Admin</a></li>
        </ul>
      </section>
    </main>
  );
}
