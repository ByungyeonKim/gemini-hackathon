import { HomeUpload } from "@/components/home-upload";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-mono selection:bg-accent selection:text-black">
      <div className="scanline-overlay" />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, var(--accent) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
        aria-hidden
      />
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-16">
        <header className="mb-12 border-b-4 border-white pb-8">
          <div className="mb-4 inline-flex items-center gap-2 bg-accent px-4 py-1.5 text-sm font-black text-black">
            <span aria-hidden>[v1.0.0]</span>
            <span>SYSTEM_OVERRIDE: GEMINI_ENHANCE</span>
          </div>
          <h1 className="glitch-text text-6xl font-black uppercase tracking-tighter text-foreground">
            GETA_OS
          </h1>
          <p className="mt-4 text-xl font-bold text-accent-secondary">
            {'>'} UPLOAD_DATA // EARN_CREDITS
          </p>
        </header>
        <HomeUpload />
      </main>
    </div>
  );
}
