import { useEffect, useRef, useState } from "react";
import { UI_STRINGS, useT, type LessonSlide } from "./copilotData";

// --- Presenter view ------------------------------------------------------
// Full-screen, read-only walkthrough of the deck. Slide text goes through the
// same translate() as the rest of the page, so a teacher can present in
// Spanish by flipping the language toggle first.
//
// Controls: → / Space / PageDown = next, ← / PageUp = previous, Esc = exit.
// (In browser fullscreen, Esc exits fullscreen first; we listen for that and
// close the view too.)

export default function PresenterView({
  slides,
  startIndex,
  onClose,
}: Readonly<{
  slides: LessonSlide[];
  startIndex: number;
  onClose: () => void;
}>) {
  const t = useT();
  const rootRef = useRef<HTMLDivElement>(null);
  const last = slides.length - 1;
  const [index, setIndex] = useState(Math.min(Math.max(startIndex, 0), last));

  const slide = slides[index];

  function next() {
    setIndex((i) => Math.min(i + 1, last));
  }

  function prev() {
    setIndex((i) => Math.max(i - 1, 0));
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setIndex((i) => Math.min(i + 1, last));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [last, onClose]);

  // Try to go browser-fullscreen. If the browser refuses, the overlay still
  // covers the page, so it degrades fine.
  useEffect(() => {
    Promise.resolve(rootRef.current?.requestFullscreen?.()).catch(() => {});

    function onFullscreenChange() {
      if (!document.fullscreenElement) onClose();
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (document.fullscreenElement) {
        Promise.resolve(document.exitFullscreen()).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Controls fade out after a couple of seconds without input so the slide
  // gets the whole screen; any mouse move / key / touch brings them back.
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function wake() {
      setShowControls(true);
      clearTimeout(timer);
      timer = setTimeout(() => setShowControls(false), 2500);
    }

    wake();
    window.addEventListener("mousemove", wake);
    window.addEventListener("keydown", wake);
    window.addEventListener("touchstart", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, []);

  if (!slide) return null;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Presenting"
      className={[
        "fixed inset-0 z-[60] flex bg-gradient-to-br text-teal-900",
        slide.accent,
        showControls ? "" : "cursor-none",
      ].join(" ")}
    >
      {/* Slide content fills the whole screen; sizes scale with the viewport */}
      <div className="flex h-full w-full gap-[4vw] overflow-y-auto px-[6vw] py-[7vh]">
        <div className="flex flex-1 flex-col justify-center gap-[4vh]">
          <h2 className="text-[clamp(2.5rem,6vw,7rem)] font-bold leading-tight">
            {slide.title ? t(slide.title) : t(UI_STRINGS.untitledSlide)}
          </h2>

          <ul className="flex flex-col gap-[2.5vh] text-[clamp(1.5rem,3.2vw,4rem)] leading-snug text-teal-800">
            {slide.points.filter(Boolean).map((point, i) => (
              <li key={i} className="flex gap-[1.5vw]">
                <span className="text-teal-500">•</span>
                <span>{t(point)}</span>
              </li>
            ))}
          </ul>
        </div>

        {slide.layout === "bullets-image" && slide.imageUrl && (
          <div className="flex w-2/5 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-white/50 shadow-lg">
            <img
              src={slide.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Floating controls: fade out when idle */}
      <div
        className={[
          "absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-teal-950/85 px-3 py-2 text-sm text-white shadow-lg backdrop-blur transition-opacity duration-300",
          showControls ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className="rounded-full border-2 border-white/30 px-4 py-1 font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ← {t(UI_STRINGS.previous)}
        </button>

        <span className="min-w-[4rem] text-center font-semibold tabular-nums">
          {index + 1} / {slides.length}
        </span>

        <button
          type="button"
          onClick={next}
          disabled={index === last}
          className="rounded-full border-2 border-white/30 px-4 py-1 font-bold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {t(UI_STRINGS.next)} →
        </button>

        <span className="hidden text-xs text-teal-200/70 lg:inline">
          {t(UI_STRINGS.presentHint)}
        </span>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-3 py-1 font-bold text-teal-100 transition hover:bg-white/10"
        >
          ✕ {t(UI_STRINGS.exitPresenting)}
        </button>
      </div>
    </div>
  );
}