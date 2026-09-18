import { useEffect, useState } from "react";
import type { LessonSlide, RequestStatus } from "./copilotData";
import { FlagToggleButton } from "./Flagsidebar";

// --- Central slide deck workspace --------------------------------------

export default function DeckWorkspace({
  slides,
  activeSlide,
  onSelect,
  onAddTemplate,
  onGenerate,
  generateStatus,
  generateError,
  onUpdateSlide,
  onRemoveSlide,
  isLabelFlagged,
  onToggleFlag,
}: Readonly<{
  slides: LessonSlide[];
  activeSlide: LessonSlide | null;
  onSelect: (id: string) => void;
  onAddTemplate: () => void;
  onGenerate: (topic: string) => Promise<boolean>;
  generateStatus: RequestStatus;
  generateError: string | null;
  onUpdateSlide: (id: string, patch: Partial<LessonSlide>) => void;
  onRemoveSlide: (id: string) => void;
  isLabelFlagged: (label: string) => boolean;
  onToggleFlag: (label: string) => void;
}>) {
  const [generateOpen, setGenerateOpen] = useState(false);

  function exportToSlides() {
    alert(
      "Google Slides export isn't wired up yet — this deck is saved in the app for now."
    );
  }

  return (
    <section className="min-w-0 flex-1 px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-teal-900">Lesson Deck</h2>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onAddTemplate}
            className="rounded-full border-2 border-teal-700 px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
          >
            + Blank Slide
          </button>

          <button
            type="button"
            onClick={() => setGenerateOpen(true)}
            className="rounded-full border-2 border-teal-700 px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
          >
            ✨ Generate Slide
          </button>

          <button
            type="button"
            onClick={exportToSlides}
            className="rounded-full border-2 border-teal-700 bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"
          >
            Export to Google Slides
          </button>
        </div>
      </div>

      {generateOpen && (
        <GenerateSlideModal
          onClose={() => setGenerateOpen(false)}
          onGenerate={onGenerate}
          status={generateStatus}
          error={generateError}
        />
      )}

      {slides.length === 0 ? (
        <div className="mt-3 flex min-h-72 items-center justify-center rounded-3xl border-2 border-dashed border-teal-700/20 bg-white/60 text-center">
          <p className="max-w-xs text-sm text-teal-800/70">
            No slides yet — add a blank one, generate from a topic above, or
            pull in a search result to get started.
          </p>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {/* Thumbnail rail */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {slides.map((slide, index) => (
              <SlideThumbnail
                key={slide.id}
                index={index}
                slide={slide}
                active={activeSlide?.id === slide.id}
                onClick={() => onSelect(slide.id)}
              />
            ))}
          </div>

          {/* Preview + editor */}
          {activeSlide && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SlidePreviewCard slide={activeSlide} />

              <SlideEditorPanel
                slide={activeSlide}
                onUpdate={(patch) => onUpdateSlide(activeSlide.id, patch)}
                onRemove={() => onRemoveSlide(activeSlide.id)}
                isFlagged={isLabelFlagged(activeSlide.title)}
                onToggleFlag={() => onToggleFlag(activeSlide.title)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// --- Generate slide modal ----------------------------------------------
// Deliberately echoes the main curriculum search: same pill input, same
// icon-in-field treatment, same primary button — just focused in a dialog
// so it doesn't read as a dropdown hanging off the toolbar.

function GenerateSlideModal({
  onClose,
  onGenerate,
  status,
  error,
}: Readonly<{
  onClose: () => void;
  onGenerate: (topic: string) => Promise<boolean>;
  status: RequestStatus;
  error: string | null;
}>) {
  const [topic, setTopic] = useState("");

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleGenerate() {
    if (!topic.trim() || status === "loading") return;

    const ok = await onGenerate(topic.trim());
    if (ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-teal-950/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Generate a slide"
        className="relative w-full max-w-lg rounded-3xl border-2 border-teal-700/15 bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-teal-900">
              ✨ Generate a Slide
            </h3>
            <p className="mt-0.5 text-xs text-teal-900/60">
              Built from the Grady's Garden curriculum.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full px-2 py-0.5 text-teal-700/60 hover:bg-teal-50"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-700/60">
              ✨
            </span>

            <input
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="Topic: e.g. Root Vegetables"
              className="w-full rounded-full border-2 border-teal-700/20 bg-teal-50/60 py-2.5 pl-9 pr-3 text-sm text-teal-900 placeholder:text-teal-900/40 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={status === "loading" || !topic.trim()}
            className="shrink-0 rounded-full border-2 border-teal-700 bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "loading" ? "Generating..." : "Generate"}
          </button>
        </div>

        {status === "error" && (
          <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>
        )}
      </div>
    </div>
  );
}

// --- Slide thumbnail ---------------------------------------------------

function SlideThumbnail({
  slide,
  index,
  active,
  onClick,
}: Readonly<{
  slide: LessonSlide;
  index: number;
  active: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-16 w-28 shrink-0 flex-col justify-start gap-0.5 rounded-lg border-2 bg-gradient-to-b p-1.5 text-left transition",
        slide.accent,
        active
          ? "border-teal-700 ring-2 ring-teal-400"
          : "border-teal-700/15 hover:border-teal-700/40",
      ].join(" ")}
    >
      <span className="line-clamp-1 text-[10px] font-bold text-teal-900">
        {index + 1}. {slide.title || "Untitled"}
      </span>

      <span className="flex flex-col gap-0.5">
        {slide.points.slice(0, 2).map((point, index) => (
          <span
            key={index}
            className="line-clamp-1 text-[9px] text-teal-900/70"
          >
            • {point || "..."}
          </span>
        ))}
      </span>
    </button>
  );
}

// --- Slide preview -----------------------------------------------------

function SlidePreviewCard({ slide }: Readonly<{ slide: LessonSlide }>) {
  return (
    <div className="flex aspect-video w-full flex-col overflow-hidden rounded-2xl border-2 border-teal-700/15 bg-white shadow-sm">
      <div
        className={["h-2 w-full bg-gradient-to-r", slide.accent].join(" ")}
      />

      <div className="flex flex-1 gap-4 p-5">
        <div className="flex flex-1 flex-col gap-2">
          <h3 className="text-lg font-bold text-teal-900">
            {slide.title || "Untitled slide"}
          </h3>

          <ul className="flex flex-col gap-1 text-sm text-teal-800">
            {slide.points.filter(Boolean).map((point, index) => (
              <li key={index} className="flex gap-1.5">
                <span className="text-teal-500">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {slide.layout === "bullets-image" && (
          // Widened from w-1/3 to w-2/5 so the image reads more clearly.
          <div className="flex w-2/5 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-teal-50">
            {slide.imageUrl ? (
              <img
                src={slide.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="px-2 text-center text-xs text-teal-700/50">
                No image yet
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Slide editor ------------------------------------------------------

function SlideEditorPanel({
  slide,
  onUpdate,
  onRemove,
  isFlagged,
  onToggleFlag,
}: Readonly<{
  slide: LessonSlide;
  onUpdate: (patch: Partial<LessonSlide>) => void;
  onRemove: () => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
}>) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border-2 border-teal-700/15 bg-white p-4">
      <div className="flex items-center gap-2">
        <input
          value={slide.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full rounded-xl border-2 border-teal-700/20 px-3 py-1.5 text-sm font-bold text-teal-900"
          placeholder="Slide title"
        />

        <FlagToggleButton flagged={isFlagged} onToggle={onToggleFlag} />
      </div>

      <div className="flex flex-col gap-1">
        {slide.points.map((point, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={point}
              onChange={(e) => {
                const next = [...slide.points];
                next[index] = e.target.value;
                onUpdate({ points: next });
              }}
              className="w-full rounded-xl border-2 border-teal-700/10 px-3 py-1.5 text-sm text-teal-900"
            />

            <button
              type="button"
              onClick={() =>
                onUpdate({
                  points: slide.points.filter(
                    (_, pointIndex) => pointIndex !== index
                  ),
                })
              }
              className="text-teal-700/50 hover:text-rose-600"
              aria-label="Remove point"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => onUpdate({ points: [...slide.points, ""] })}
          className="self-start text-xs font-semibold text-teal-700 hover:underline"
        >
          + Add point
        </button>
      </div>

      <div className="flex items-center gap-1.5 rounded-xl bg-teal-50/60 p-1">
        <button
          type="button"
          onClick={() => onUpdate({ layout: "bullets" })}
          className={[
            "flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition",
            slide.layout === "bullets"
              ? "bg-white text-teal-900 shadow-sm"
              : "text-teal-700/60",
          ].join(" ")}
        >
          Bullets
        </button>

        <button
          type="button"
          onClick={() => onUpdate({ layout: "bullets-image" })}
          className={[
            "flex-1 rounded-lg px-2 py-1 text-xs font-semibold transition",
            slide.layout === "bullets-image"
              ? "bg-white text-teal-900 shadow-sm"
              : "text-teal-700/60",
          ].join(" ")}
        >
          Bullets + Image
        </button>
      </div>

      {slide.layout === "bullets-image" && (
        <input
          value={slide.imageUrl}
          onChange={(e) => onUpdate({ imageUrl: e.target.value })}
          placeholder="Image URL..."
          className="w-full rounded-xl border-2 border-teal-700/10 px-3 py-1.5 text-sm text-teal-900"
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        className="self-start text-xs font-medium text-rose-600 hover:underline"
      >
        Remove slide
      </button>
    </div>
  );
}