"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/* ─── Icon SVGs (inline to avoid extra deps) ─── */
const UploadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <polyline points="9 15 12 12 15 15" />
  </svg>
);
const PenIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);
const DownloadIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const SmartphoneIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);
const SparklesIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813L20 10.5l-6.088 1.687L12 18l-1.912-5.813L4 10.5l6.088-1.687L12 3z" />
    <path d="M18 14l.944 2.869L22 18l-3.056.831L18 22l-.944-2.869L14 18l3.056-.831L18 14z" />
  </svg>
);

const ArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const FEATURES = [
  {
    icon: <ZapIcon />,
    title: "Instan & Cepat",
    desc: "Proses di browser — tidak perlu upload ke server. Hasilnya siap dalam hitungan detik.",
  },
  {
    icon: <SparklesIcon />,
    title: "Human-Like Realistis",
    desc: "Variasi tekanan pena, jitter huruf, baseline bergelombang — bukan sekadar ganti font.",
  },
  {
    icon: <ShieldIcon />,
    title: "Privasi Terjaga",
    desc: "Dokumen diproses 100% di perangkatmu. Tidak ada data yang dikirim ke server manapun.",
  },
  {
    icon: <SmartphoneIcon />,
    title: "PWA — Install di HP",
    desc: "Bisa diinstall langsung dari browser, berjalan offline setelah pemuatan pertama.",
  },
];

const STEPS = [
  { num: "01", icon: <UploadIcon />, label: "Upload PDF", desc: "Drag-drop atau pilih file PDF dari perangkatmu" },
  { num: "02", icon: <PenIcon />, label: "Kustomisasi", desc: "Pilih gaya tulisan, jenis kertas, dan warna tinta" },
  { num: "03", icon: <DownloadIcon />, label: "Unduh Hasil", desc: "Download sebagai gambar atau PDF siap kumpul" },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        heroRef.current.style.setProperty("--mouse-x", `${x}%`);
        heroRef.current.style.setProperty("--mouse-y", `${y}%`);
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <main className="flex flex-col min-h-screen overflow-hidden">
      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-[rgba(10,10,18,0.7)] border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gradient">TulisTangan</span>
          <span className="text-xs text-[var(--color-text-muted)] font-medium">.id</span>
        </div>
        <Link href="/convert" className="btn-primary text-sm !py-2 !px-5">
          <span className="flex items-center gap-1.5">Mulai Konversi <ArrowRight /></span>
        </Link>
      </nav>

      {/* ─── Hero ─── */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center justify-center text-center pt-36 pb-24 px-6 min-h-[85vh]"
        style={{ background: "var(--gradient-glow)" }}
      >
        {/* Ambient orbs */}
        <div className="ambient-orb w-[500px] h-[500px] bg-[#6366f1] -top-40 -left-40 animate-float" />
        <div className="ambient-orb w-[400px] h-[400px] bg-[#14b8a6] -bottom-32 -right-32 animate-float" style={{ animationDelay: "3s" }} />
        <div className="ambient-orb w-[300px] h-[300px] bg-[#a855f7] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-float" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10 max-w-3xl mx-auto animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(99,102,241,0.12)] border border-[rgba(99,102,241,0.25)] text-sm text-[var(--color-primary-300)] mb-6 backdrop-blur-md">
            <SparklesIcon />
            <span>Simulasi tulisan tangan paling realistis</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
            Ubah <span className="text-gradient">PDF</span> Jadi{" "}
            <span className="text-gradient">Tulisan Tangan</span> Dalam Sekejap
          </h1>

          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Konversi dokumen PDF menjadi gambar tulisan tangan yang tampak asli — 
            lengkap dengan variasi huruf, tekanan pena, dan tekstur kertas. 
            100% di browser, tanpa upload ke server.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/convert" className="btn-primary text-base !py-3.5 !px-8 animate-pulse-glow">
              <span className="flex items-center gap-2">
                Mulai Konversi Gratis
                <ArrowRight />
              </span>
            </Link>
            <a href="#cara-kerja" className="btn-secondary text-base !py-3.5 !px-8">
              Lihat Cara Kerja
            </a>
          </div>
        </div>

        {/* Handwriting preview teaser */}
        <div className="relative z-10 mt-16 w-full max-w-2xl mx-auto opacity-0 animate-fade-in-up stagger-3">
          <div className="glass-card p-6 sm:p-8 rounded-2xl">
            <div className="bg-[#faf8f0] rounded-xl p-6 sm:p-8 relative overflow-hidden" style={{ fontFamily: "Caveat, cursive" }}>
              {/* Fake lined paper */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-8 sm:left-10 top-0 bottom-0 w-[1px] bg-red-300/30" />
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="absolute left-0 right-0 h-[1px] bg-blue-300/25" style={{ top: `${26 + i * 32}px` }} />
                ))}
              </div>
              <div className="relative text-[#1a3c8f] text-xl sm:text-2xl leading-[32px] pl-6 sm:pl-8" style={{ transform: "rotate(-0.5deg)" }}>
                <p style={{ transform: "translateY(2px) rotate(0.3deg)" }}>Ini adalah contoh hasil tulisan</p>
                <p style={{ transform: "translateY(-1px) rotate(-0.2deg)" }}>tangan yang dihasilkan oleh</p>
                <p style={{ transform: "translateY(1px) rotate(0.4deg)" }}>TulisTangan.id — terlihat</p>
                <p style={{ transform: "translateY(-0.5px) rotate(-0.3deg)" }}>natural dan meyakinkan ✍️</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <p className="section-label">Kenapa TulisTangan?</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2">Fitur yang Membedakan</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`glass-card p-6 opacity-0 animate-fade-in-up stagger-${i + 1}`}
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[rgba(99,102,241,0.12)] text-[var(--color-primary-400)] mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="cara-kerja" className="py-24 px-6 bg-[var(--color-bg-surface)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <p className="section-label">Cara Kerja</p>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2">3 Langkah Mudah</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className={`text-center opacity-0 animate-fade-in-up stagger-${i + 1}`}>
                <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.1)] border border-[var(--color-border)] text-[var(--color-primary-400)] mb-5">
                  {s.icon}
                </div>
                <span className="text-xs font-bold text-[var(--color-primary-400)] tracking-widest">{s.num}</span>
                <h3 className="text-xl font-bold mt-1 mb-2">{s.label}</h3>
                <p className="text-[var(--color-text-secondary)] text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="ambient-orb w-[400px] h-[400px] bg-[#6366f1] -left-40 top-0" />
        <div className="ambient-orb w-[350px] h-[350px] bg-[#14b8a6] -right-32 bottom-0" />
        <div className="relative z-10 max-w-2xl mx-auto text-center animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Siap Mengubah PDF-mu?
          </h2>
          <p className="text-[var(--color-text-secondary)] mb-8 text-lg">
            Gratis, tanpa registrasi, langsung dari browser.
          </p>
          <Link href="/convert" className="btn-primary text-lg !py-4 !px-10 animate-pulse-glow">
            <span className="flex items-center gap-2">
              Mulai Sekarang
              <ArrowRight />
            </span>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--color-text-muted)]">
          <span className="font-semibold text-gradient">TulisTangan.id</span>
          <p>© 2026 TulisTangan.id — Alat bantu membuat catatan pribadi lebih cepat.</p>
          <p className="text-xs">
            Gunakan secara bertanggung jawab. Tidak mendukung penyalahgunaan akademik.
          </p>
        </div>
      </footer>
    </main>
  );
}
