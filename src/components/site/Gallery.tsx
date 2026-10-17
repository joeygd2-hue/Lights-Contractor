"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryCategory, Photo } from "@/config/site";

type Item = Photo & { key: string };

export function Gallery({
  items,
  categories,
}: {
  items: Item[];
  categories: { id: GalleryCategory; label: string }[];
}) {
  const [filter, setFilter] = useState<GalleryCategory | "all">("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);

  const visible = filter === "all" ? items : items.filter((i) => i.categories.includes(filter));

  const open = (i: number) => {
    lastTrigger.current = triggerRefs.current[i] ?? null;
    setOpenIndex(i);
    dialogRef.current?.showModal();
  };
  const close = useCallback(() => {
    dialogRef.current?.close();
  }, []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    const onClose = () => {
      setOpenIndex(null);
      // Return focus to the photo that opened the viewer.
      requestAnimationFrame(() => lastTrigger.current?.focus());
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const current = openIndex !== null ? visible[openIndex] : null;

  return (
    <div>
      <div role="group" aria-label="Filter photos" className="flex flex-wrap gap-2">
        {[{ id: "all" as const, label: "All" }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={`min-h-11 rounded-sm border px-4 text-[0.95rem] font-medium transition-colors ${
              filter === c.id
                ? "border-evergreen-800 bg-evergreen-800 text-ivory"
                : "border-line bg-paper text-charcoal hover:border-evergreen-700"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        Showing {visible.length} photos
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-3">
        {visible.map((p, i) => (
          <li key={p.key} className={i === 0 ? "sm:col-span-2 lg:row-span-2" : ""}>
            <button
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              type="button"
              onClick={() => open(i)}
              className={`group relative block h-full w-full overflow-hidden rounded-md bg-evergreen-900 text-left ${
                i === 0 ? "aspect-[4/3] lg:aspect-auto lg:min-h-full" : "aspect-[4/3]"
              }`}
              aria-label={`View larger: ${p.alt}`}
            >
              <Image
                src={p.src}
                alt=""
                fill
                sizes={i === 0 ? "(min-width: 1024px) 66vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transition-none"
              />
              {p.source === "stock" ? (
                <span className="absolute bottom-2 right-2 rounded-sm bg-evergreen-950/70 px-2 py-0.5 text-[0.68rem] font-medium tracking-wide text-ivory/85">
                  Representative photo
                </span>
              ) : (
                p.caption && (
                  <span className="absolute bottom-2 left-2 rounded-sm bg-evergreen-950/70 px-2 py-0.5 text-xs text-ivory">
                    {p.caption}
                  </span>
                )
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label="Photo viewer"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-evergreen-950/95 p-0 text-ivory backdrop:bg-evergreen-950/80"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3 md:px-6">
              <p className="text-sm text-ivory/70" aria-live="polite">
                {openIndex! + 1} of {visible.length}
              </p>
              <button
                type="button"
                onClick={close}
                className="flex min-h-11 items-center gap-2 rounded-sm px-3 text-sm hover:bg-ivory/10"
                autoFocus
              >
                Close <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div className="relative flex-1">
              <Image
                key={current.key}
                src={current.src}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
              <button type="button" onClick={() => step(-1)} className="btn btn-outline-light min-w-24">
                <span aria-hidden="true">←</span> Previous
              </button>
              <p className="hidden max-w-2xl text-center text-sm text-ivory/75 md:block">
                {current.alt}
                {current.source === "stock" && " · Representative photo"}
                {current.source === "project" && current.caption && ` · ${current.caption}`}
              </p>
              <button type="button" onClick={() => step(1)} className="btn btn-outline-light min-w-24">
                Next <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
