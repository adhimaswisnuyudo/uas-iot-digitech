import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}

export default function KetentuanPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Link
            href="/"
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            ← Kembali ke gallery
          </Link>

          <div className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Ketentuan UAS
            </h1>
            <p className="mt-2 text-slate-600">
              Mata Kuliah Internet of Things — Video Refleksi dan Gagasan
              Inovasi IoT
            </p>
          </div>

          <div className="mt-8 space-y-5">
            <Section title="Tujuan">
              <p>Mahasiswa mampu:</p>
              <ul className="list-inside list-disc space-y-1.5 pl-1">
                <li>
                  Merefleksikan seluruh materi Internet of Things yang telah
                  dipelajari selama satu semester.
                </li>
                <li>
                  Menjelaskan konsep-konsep utama IoT dengan bahasa sendiri.
                </li>
                <li>
                  Menyampaikan evaluasi terhadap proses pembelajaran.
                </li>
                <li>
                  Mengemukakan ide inovasi IoT yang dapat diterapkan di masa
                  mendatang.
                </li>
              </ul>
            </Section>

            <Section title="Ketentuan Umum">
              <ul className="list-inside list-disc space-y-1.5 pl-1">
                <li>UAS dikerjakan secara individu.</li>
                <li>
                  Mahasiswa wajib membuat video dan mengunggahnya ke YouTube.
                </li>
                <li>Video harus menampilkan wajah mahasiswa secara jelas.</li>
                <li>
                  Video harus direkam sendiri dan tidak menggunakan AI avatar
                  atau text-to-speech.
                </li>
                <li>
                  Durasi video <strong>minimal 2 menit</strong> dan{" "}
                  <strong>maksimal 5 menit</strong>.
                </li>
                <li>
                  Video bersifat publik atau unlisted agar dapat ditinjau oleh
                  dosen.
                </li>
                <li>
                  Link video wajib dikumpulkan melalui sistem pengumpulan UAS
                  di halaman{" "}
                  <Link href="/submit" className="font-medium text-blue-700 hover:text-blue-800">
                    Kumpulkan UAS
                  </Link>
                  .
                </li>
              </ul>
            </Section>

            <Section title="Bagian 1 — Perkenalan Diri">
              <p>Mahasiswa wajib menyebutkan:</p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>Nama Lengkap</li>
                <li>NPM</li>
                <li>Kelas</li>
              </ul>
              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-slate-700">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-800">
                  Contoh
                </p>
                <p className="mt-1 italic">
                  &ldquo;Perkenalkan, nama saya Adi Nugraha, NPM 23110001, kelas
                  C123.&rdquo;
                </p>
              </div>
            </Section>

            <Section title="Bagian 2 — Pemahaman Internet of Things">
              <p>Jelaskan secara singkat:</p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>Apa itu Internet of Things</li>
                <li>Komponen utama IoT</li>
                <li>Cara kerja sistem IoT</li>
              </ul>
            </Section>

            <Section title="Bagian 3 — Refleksi Perkuliahan dan Feedback Dosen">
              <p>
                Mahasiswa wajib menyampaikan pendapat secara jujur, objektif,
                dan santun mengenai pengalaman mengikuti mata kuliah Internet
                of Things selama satu semester. Minimal membahas:
              </p>

              <p className="font-medium text-slate-800">Refleksi Perkuliahan</p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>Materi yang paling menarik selama satu semester</li>
                <li>Materi yang paling menantang / sulit dipahami</li>
                <li>Materi yang paling bermanfaat</li>
                <li>Pengalaman saat praktikum IoT</li>
                <li>Praktikum yang paling berkesan dan kendala yang dialami</li>
                <li>Manfaat yang diperoleh dari mata kuliah dan praktikum</li>
              </ul>

              <p className="font-medium text-slate-800">Feedback terhadap Dosen</p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>Cara dosen menyampaikan materi</li>
                <li>Kejelasan penjelasan materi</li>
                <li>Kesesuaian materi dengan praktik</li>
                <li>Interaksi dosen dengan mahasiswa</li>
                <li>Hal yang sudah baik dan perlu dipertahankan</li>
                <li>Saran untuk peningkatan pembelajaran di masa mendatang</li>
              </ul>
            </Section>

            <Section title="Bagian 4 — Gagasan Inovasi IoT">
              <p>
                Mahasiswa wajib menjelaskan satu ide inovasi IoT yang dapat
                diterapkan di masa depan. Minimal menjelaskan:
              </p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>Nama inovasi</li>
                <li>Permasalahan yang ingin diselesaikan</li>
                <li>Cara kerja sistem</li>
                <li>Sensor yang digunakan</li>
                <li>Manfaat bagi masyarakat</li>
              </ul>
            </Section>

            <Section title="Bagian 5 — Penutup">
              <p>
                Kesimpulan dan harapan terhadap perkembangan IoT di masa
                mendatang.
              </p>
            </Section>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
              <p className="font-semibold text-slate-900">
                Sudah siap mengumpulkan?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Upload video ke YouTube, lalu submit link-nya di form
                pengumpulan.
              </p>
              <Link
                href="/submit"
                className="mt-4 inline-flex rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
              >
                Kumpulkan UAS
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
