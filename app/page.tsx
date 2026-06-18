import { Header } from "@/components/Header";
import { Gallery } from "@/components/Gallery";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <section className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Gallery Video
            </h1>
          </section>
          <Gallery />
        </div>
      </main>
    </>
  );
}
