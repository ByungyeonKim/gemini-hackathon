import { HomeUpload } from "@/components/home-upload";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(251,146,60,0.15)_0%,transparent_50%)]"
        aria-hidden
      />
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-16">
        <header className="mb-10 text-center sm:text-left">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            <span aria-hidden>✨</span>
            <span>Gemini Enhance Training Algorithm</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Geta
          </h1>
          <p className="mt-2 text-muted">
            동영상 올리고 프레임만큼 포인트 받아가요
          </p>
        </header>
        <HomeUpload />
      </main>
    </div>
  );
}
