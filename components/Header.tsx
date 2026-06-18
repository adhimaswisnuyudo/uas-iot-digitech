import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <Image
            src="/logo_digitech.png"
            alt="Digitech University"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl object-contain"
            priority
          />
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              UAS Internet of Things
            </p>
            <p className="text-xs text-slate-500">Digitech University</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Gallery
          </Link>
          <Link
            href="/ketentuan"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            Ketentuan
          </Link>
          <Link
            href="/submit"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors"
          >
            Kumpulkan UAS
          </Link>
        </nav>
      </div>
    </header>
  );
}
