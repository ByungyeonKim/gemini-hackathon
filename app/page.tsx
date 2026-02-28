import { HomeUpload } from "@/components/home-upload";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(180deg,transparent_0%,var(--background)_70%)],bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(34,211,238,0.08)_0%,transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(var(--accent) 1px, transparent 1px),
            linear-gradient(90deg, var(--accent) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden
      />
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-16">
        <header className="mb-10">
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
            Geta
          </h1>
          <p className="mt-1 font-mono text-sm text-muted">
            Gemini Enhance Training Algorithm
          </p>
          <p className="mt-3 font-mono text-xs text-muted">
            // MP4, WebM, MOV, AVI · max 500MB
          </p>
        </header>
        <HomeUpload />
      </main>
    </div>
  );
}
