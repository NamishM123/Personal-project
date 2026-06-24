"use client";

import InkReveal from "@/components/ui/ink-reveal";

export function InkHero({ name }: { name?: string }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-border shadow-card">
      <div className="relative h-[320px] w-full md:h-[400px]">
        <img
          src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=80"
          alt="A still mountain lake at first light"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <InkReveal maskColor={[252, 250, 248]} brushSize={140} />
        <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col justify-end p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.18em] text-fg/60">
            Summer, in ink
          </p>
          <h1 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-fg md:text-4xl">
            {name ? `Hey ${name},` : "Hey,"} reveal the day.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-fg/70 md:text-base">
            Sweep across the canvas. Every stroke uncovers a little more of what
            you&apos;ve built this season.
          </p>
        </div>
      </div>
    </div>
  );
}
