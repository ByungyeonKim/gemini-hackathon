import { HomeUpload } from "@/components/home-upload";

export default function Home() {
  return (
    <div className="min-h-screen bg-black font-mono text-white selection:bg-accent selection:text-black">
      {/* HUD Background Effects */}
      <div className="scanline-overlay" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(0,255,65,0.05)_0%,transparent_50%)]"
        aria-hidden
      />

      {/* Persistent HUD Top Bar */}
      <nav className="sticky top-0 z-50 border-b-4 border-white bg-black/80 p-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="glitch-text text-2xl font-black tracking-tighter">
              GETA_OS // v2.5.0
            </h1>
            <div className="hidden border-l-2 border-white/20 pl-6 sm:block">
              <p className="text-[10px] uppercase opacity-50">System Status</p>
              <p className="text-xs font-bold text-accent">● OPERATIONAL_ENHANCEMENT</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase opacity-70">
            <span>Core: Gemini_2.5_Flash</span>
            <span className="text-white/20">|</span>
            <span>Local: yolov8n_inference</span>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl p-6">
        <HomeUpload />
      </main>

      {/* System Footer */}
      <footer className="border-t-2 border-white/10 p-8 text-center text-[10px] uppercase opacity-30">
        <p>© 2026 GETA_OS // ALL_DATA_PROPERTY_OF_ENHANCEMENT_PROTOCOL</p>
      </footer>
    </div>
  );
}
