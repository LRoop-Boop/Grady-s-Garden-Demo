import { useState } from "react";
import {
  searchCurriculum,
  CurriculumSearchError,
  type CurriculumSearchResult,
} from "../lib/gemini";

import {
  FACTS_OF_THE_DAY,
  FLAGS_STORAGE_KEY,
  makeTemplateSlide,
  matchCurriculumSection,
  slideFromSearchResult,
  todaysFactIndex,
  type FlaggedTopic,
  type LessonSlide,
  type RequestStatus,
} from "../components/copilotData";
import DeckWorkspace from "../components/DeckWorkspace";
import Sidebar, { FlagToggleButton } from "../components/Flagsidebar";

export default function Copilot() {
  // --- Saved topics ----------------------------------------------------

  const [flags, setFlags] = useState<FlaggedTopic[]>(() => {
    const stored = localStorage.getItem(FLAGS_STORAGE_KEY);
    if (!stored) return [];

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  function persistFlags(next: FlaggedTopic[]) {
    setFlags(next);
    localStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify(next));
  }

  function isLabelFlagged(label: string) {
    return flags.some((f) => f.label.toLowerCase() === label.toLowerCase());
  }

  function toggleQuickFlag(label: string) {
    const existing = flags.find(
      (f) => f.label.toLowerCase() === label.toLowerCase()
    );

    if (existing) {
      persistFlags(flags.filter((f) => f.id !== existing.id));
    } else {
      persistFlags([
        ...flags,
        { id: crypto.randomUUID(), label, type: "interest", note: "" },
      ]);
    }
  }

  // --- Fact of the day -------------------------------------------------

  const [factIndex, setFactIndex] = useState(todaysFactIndex);

  function refreshFact() {
    if (FACTS_OF_THE_DAY.length <= 1) return;

    let next = Math.floor(Math.random() * FACTS_OF_THE_DAY.length);

    while (next === factIndex) {
      next = Math.floor(Math.random() * FACTS_OF_THE_DAY.length);
    }

    setFactIndex(next);
  }

  // --- Slide deck ------------------------------------------------------

  const [slides, setSlides] = useState<LessonSlide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

  function addSlide(slide: LessonSlide) {
    setSlides((prev) => [...prev, slide]);
    setActiveSlideId(slide.id);
  }

  function updateSlide(id: string, patch: Partial<LessonSlide>) {
    setSlides((prev) =>
      prev.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide))
    );
  }

  function removeSlide(id: string) {
    setSlides((prev) => {
      const next = prev.filter((slide) => slide.id !== id);

      if (activeSlideId === id) {
        setActiveSlideId(next[0]?.id ?? null);
      }

      return next;
    });
  }

  function addFactSlide() {
    addSlide({
      id: crypto.randomUUID(),
      title: "Fact of the Day",
      points: [FACTS_OF_THE_DAY[factIndex]],
      layout: "bullets",
      imageUrl: "",
      accent: "from-green-100 to-lime-50",
    });
  }

  // --- Smart curriculum lookup ----------------------------------------

  const [query, setQuery] = useState("");
  const [matchedSection, setMatchedSection] = useState<string | null>(null);
  const [result, setResult] = useState<CurriculumSearchResult | null>(null);
  const [searchStatus, setSearchStatus] = useState<RequestStatus>("idle");
  const [searchError, setSearchError] = useState<string | null>(null);

  async function runSearch() {
    if (!query.trim()) return;

    setMatchedSection(matchCurriculumSection(query.trim()));
    setSearchStatus("loading");
    setSearchError(null);

    try {
      const found = await searchCurriculum(query.trim());
      setResult(found);
      setSearchStatus("idle");
    } catch (err) {
      setSearchStatus("error");
      setSearchError(errorMessage(err));
    }
  }

  // --- Generate a slide directly from a topic -------------------------

  const [generateStatus, setGenerateStatus] = useState<RequestStatus>("idle");
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function generateSlideFromTopic(topic: string): Promise<boolean> {
    if (!topic.trim()) return false;

    setGenerateStatus("loading");
    setGenerateError(null);

    try {
      const found = await searchCurriculum(topic.trim());
      addSlide(slideFromSearchResult(found, "from-purple-100 to-indigo-50"));
      setGenerateStatus("idle");
      return true;
    } catch (err) {
      setGenerateStatus("error");
      setGenerateError(errorMessage(err));
      return false;
    }
  }

  const activeSlide = slides.find((slide) => slide.id === activeSlideId) ?? null;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-teal-50 to-white">
      <header className="flex items-center justify-between bg-teal-800 px-6 py-4 text-white shadow-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
            Grady's Garden · Veggie Adventure
          </p>
          <h1 className="text-xl font-bold sm:text-2xl">
            Parent/Teacher Copilot
          </h1>
        </div>
      </header>

      <div className="border-b-2 border-teal-700/10 bg-white px-6 py-4">
        <SmartSearchBar
          query={query}
          onQueryChange={setQuery}
          onSearch={runSearch}
          status={searchStatus}
        />

        {(result || searchStatus === "loading" || searchStatus === "error") && (
          <LookupResultPanel
            matchedSection={matchedSection}
            result={result}
            status={searchStatus}
            error={searchError}
            isFlagged={result ? isLabelFlagged(result.title) : false}
            onToggleFlag={() => result && toggleQuickFlag(result.title)}
            onAddToSlide={() => {
              if (result) {
                addSlide(
                  slideFromSearchResult(result, "from-orange-100 to-amber-50")
                );
              }
            }}
            onDismiss={() => {
              setResult(null);
              setMatchedSection(null);
              setSearchStatus("idle");
            }}
          />
        )}
      </div>

      <main className="flex min-h-0 flex-col lg:flex-row">
        <DeckWorkspace
          slides={slides}
          activeSlide={activeSlide}
          onSelect={setActiveSlideId}
          onAddTemplate={() => addSlide(makeTemplateSlide())}
          onGenerate={generateSlideFromTopic}
          generateStatus={generateStatus}
          generateError={generateError}
          onUpdateSlide={updateSlide}
          onRemoveSlide={removeSlide}
          isLabelFlagged={isLabelFlagged}
          onToggleFlag={toggleQuickFlag}
        />

        <Sidebar
          fact={FACTS_OF_THE_DAY[factIndex]}
          onRefreshFact={refreshFact}
          onAddFactToSlide={addFactSlide}
          flags={flags}
          onAdd={(flag) => persistFlags([...flags, flag])}
          onUpdate={(id, patch) =>
            persistFlags(
              flags.map((flag) =>
                flag.id === id ? { ...flag, ...patch } : flag
              )
            )
          }
          onRemove={(id) => persistFlags(flags.filter((flag) => flag.id !== id))}
        />
      </main>
    </div>
  );
}

function errorMessage(err: unknown) {
  return err instanceof CurriculumSearchError
    ? err.message
    : "Something went wrong.";
}

// --- Smart search bar --------------------------------------------------

function SmartSearchBar({
  query,
  onQueryChange,
  onSearch,
  status,
}: Readonly<{
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  status: RequestStatus;
}>) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-teal-700/60">
            🔎
          </span>

          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            placeholder="Search: e.g. Can carrots be purple?"
            className="w-full rounded-full border-2 border-teal-700/20 bg-teal-50/60 py-2.5 pl-9 pr-3 text-sm text-teal-900 placeholder:text-teal-900/40 focus:border-teal-600 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onSearch}
          disabled={status === "loading" || !query.trim()}
          className="shrink-0 rounded-full border-2 border-teal-700 bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading" ? "Looking up..." : "Look Up"}
        </button>
      </div>

      <p className="pl-1 text-xs text-teal-900/50">
        Checked against the Grady's Garden curriculum.
      </p>
    </div>
  );
}

// --- Curriculum result -------------------------------------------------

function LookupResultPanel({
  matchedSection,
  result,
  status,
  error,
  isFlagged,
  onToggleFlag,
  onAddToSlide,
  onDismiss,
}: Readonly<{
  matchedSection: string | null;
  result: CurriculumSearchResult | null;
  status: RequestStatus;
  error: string | null;
  isFlagged: boolean;
  onToggleFlag: () => void;
  onAddToSlide: () => void;
  onDismiss: () => void;
}>) {
  return (
    <div className="mt-3 rounded-2xl border-2 border-teal-700/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {matchedSection && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800">
            📖 Found in: {matchedSection}
          </span>
        )}

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-full px-2 py-0.5 text-teal-700/60 hover:bg-teal-50"
        >
          ✕
        </button>
      </div>

      {status === "loading" && (
        <p className="mt-2 text-sm text-teal-800/70">
          Pulling the answer from that section...
        </p>
      )}

      {status === "error" && (
        <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
      )}

      {result && status !== "loading" && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-900">{result.title}</span>

            <FlagToggleButton
              flagged={isFlagged}
              onToggle={onToggleFlag}
              size="sm"
            />
          </div>

          <p className="text-sm text-teal-800">{result.teacherSummary}</p>

          {result.studentBullets.length > 0 && (
            <ul className="list-disc rounded-xl bg-teal-50/60 py-2 pl-8 pr-3 text-sm text-teal-900">
              {result.studentBullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={onAddToSlide}
            className="self-start rounded-xl border-2 border-teal-700 px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
          >
            + Add to Slide
          </button>
        </div>
      )}
    </div>
  );
}