import Link from "next/link";
import { Header } from "@/components/Header";
import { SubmitForm } from "@/components/SubmitForm";

export default function SubmitPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-lg px-4 py-10">
          <Link
            href="/"
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            ← Kembali ke gallery
          </Link>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Kumpulkan UAS IoT
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Upload video ke YouTube terlebih dahulu, lalu isi form di bawah
              dengan link video Anda.
            </p>

            <div className="mt-6">
              <SubmitForm />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Checklist video:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-slate-600">
              <li>Durasi 2–5 menit</li>
              <li>Wajah terlihat jelas, rekaman sendiri</li>
              <li>Tanpa AI avatar atau text-to-speech</li>
              <li>Public atau unlisted</li>
              <li>4 bagian: perkenalan, refleksi & feedback dosen, inovasi, penutup</li>
            </ul>
            <Link
              href="/ketentuan"
              className="mt-3 inline-block font-medium text-blue-700 hover:text-blue-800"
            >
              Baca ketentuan lengkap →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
