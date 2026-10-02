import { useEffect, useState } from "react";
import {
  searchCurriculum,
  getFactOfTheDay,
  CurriculumSearchError,
  type CurriculumSearchResult,
  type FactOfTheDay,
} from "../lib/gemini";
import {
  translateTexts,
  TranslationError,
  type LanguageCode,
} from "../lib/translate";

import {
  FLAGS_STORAGE_KEY,
  UI_STRINGS,
  TRANSLATION_CACHE_KEY,
  TranslateContext,
  makeTemplateSlide,
  slideFromSearchResult,
  type FlaggedTopic,
  type LessonSlide,
  type RequestStatus,
} from "../components/copilotData";
import DeckWorkspace from "../components/DeckWorkspace";
import Sidebar, { FlagToggleButton } from "../components/Flagsidebar";
import ReportButton from "../components/ReportButton";
import Tip from "../components/Tip";

// UI_STRINGS now lives in copilotData.ts so child components can import the
// keys too. They're batch-translated by the effect below.

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

  // --- Fact of the day (now RAG-backed) --------------------------------

  const [fact, setFact] = useState<FactOfTheDay | null>(null);
  const [factStatus, setFactStatus] = useState<RequestStatus>("idle");
  const [factError, setFactError] = useState<string | null>(null);

  useEffect(() => {
    loadDailyFact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDailyFact() {
    setFactStatus("loading");
    setFactError(null);
    try {
      setFact(await getFactOfTheDay("daily"));
      setFactStatus("idle");
    } catch (err) {
      setFactStatus("error");
      setFactError(
        err instanceof CurriculumSearchError
          ? err.message
          : "Couldn't load today's fact."
      );
    }
  }

  async function refreshFact() {
    setFactStatus("loading");
    setFactError(null);
    try {
      setFact(await getFactOfTheDay("random", fact?.source));
      setFactStatus("idle");
    } catch (err) {
      setFactStatus("error");
      setFactError(
        err instanceof CurriculumSearchError
          ? err.message
          : "Couldn't load a new fact."
      );
    }
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
    if (!fact) return;

    addSlide({
      id: crypto.randomUUID(),
      title: "Fact of the Day",
      points: [fact.text],
      layout: "bullets",
      imageUrl: "",
      accent: "from-green-100 to-lime-50",
    });
  }

  // --- Smart curriculum lookup ----------------------------------------

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<CurriculumSearchResult | null>(null);
  // The query that produced `result`, so reports aren't affected by whatever
  // the user has typed into the search box since.
  const [resultQuery, setResultQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<RequestStatus>("idle");
  const [searchError, setSearchError] = useState<string | null>(null);

  async function runSearch() {
    if (!query.trim()) return;

    setSearchStatus("loading");
    setSearchError(null);

    try {
      const found = await searchCurriculum(query.trim());
      setResult(found);
      setResultQuery(query.trim());
      setSearchStatus("idle");
    } catch (err) {
      setSearchStatus("error");
      setSearchError(errorMessage(err));
    }
  }

  // --- Generate a slide directly from a topic -------------------------

  const [generateStatus, setGenerateStatus] = useState<RequestStatus>("idle");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] =
    useState<CurriculumSearchResult | null>(null);

  async function generateSlideFromTopic(topic: string): Promise<boolean> {
    if (!topic.trim()) return false;

    setGenerateStatus("loading");
    setGenerateError(null);

    try {
      const found = await searchCurriculum(topic.trim());
      addSlide(slideFromSearchResult(found, "from-purple-100 to-indigo-50"));
      setLastGenerated(found);
      setGenerateStatus("idle");
      return true;
    } catch (err) {
      setGenerateStatus("error");
      setGenerateError(errorMessage(err));
      return false;
    }
  }

  const activeSlide = slides.find((slide) => slide.id === activeSlideId) ?? null;

  // --- Translation -------------------------------------------------------
  // Single toggle (EN <-> ES) using the translate.ts provider. Translated
  // strings are cached by their English source so repeat toggles don't
  // re-hit MyMemory. `translate` is shared with all children through
  // TranslateContext (see useT in copilotData.ts), so DeckWorkspace and
  // Sidebar don't need it as a prop.
  //
  // Slide text is translated for display only (thumbnails + preview). The
  // editor keeps the English source text so edits don't write translated
  // text back into the slide data.

  const [language, setLanguage] = useState<LanguageCode>("en");
  const [translationCache, setTranslationCache] = useState<Record<string, string>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY) ?? "{}");
      } catch {
        return {};
      }
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(translationCache));
    } catch {
      // storage full or unavailable; the cache just won't persist
    }
  }, [translationCache]);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  function translate(text: string): string {
    if (language === "en" || !text) return text;
    return translationCache[text] ?? text;
  }

  async function ensureTranslated(texts: string[]) {
    if (language === "en") return;

    const missing = Array.from(
      new Set(texts.filter((t) => t.trim() && !(t in translationCache)))
    );
    if (missing.length === 0) return;

    setTranslating(true);
    setTranslationError(null);

    try {
      const translated = await translateTexts(missing, language);
      setTranslationCache((prev) => {
        const next = { ...prev };
        missing.forEach((original, i) => {
          next[original] = translated[i];
        });
        return next;
      });
    } catch (err) {
      setTranslationError(
        err instanceof TranslationError ? err.message : "Translation failed."
      );
    } finally {
      setTranslating(false);
    }
  }

  // Static UI copy, fact, and search result: translate immediately.
  useEffect(() => {
    if (language === "en") return;

    const texts: string[] = [...Object.values(UI_STRINGS)];

    if (fact) texts.push(fact.text);
    if (result) {
      texts.push(result.title, result.teacherSummary, ...result.studentBullets);
    }

    ensureTranslated(texts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, fact, result]);

  // Slides: debounced so typing in the editor doesn't fire a request per
  // keystroke.
  useEffect(() => {
    if (language === "en" || slides.length === 0) return;

    const timer = setTimeout(() => {
      ensureTranslated(slides.flatMap((s) => [s.title, ...s.points]));
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, slides]);

  // Editing while translated: the editor shows translated text, so whatever
  // the teacher types counts as authored text. We seed the cache with identity
  // entries so it isn't sent back through MyMemory. Edited text therefore
  // stays in the language it was typed in.
  function handleSlideEdit(id: string, patch: Partial<LessonSlide>) {
    updateSlide(id, patch);
    if (language === "en") return;

    const current = slides.find((s) => s.id === id);
    const before = new Set([current?.title, ...(current?.points ?? [])]);
    const authored = [patch.title, ...(patch.points ?? [])].filter(
      (s): s is string => !!s && s.trim() !== "" && !before.has(s)
    );
    if (authored.length === 0) return;

    setTranslationCache((prev) => {
      const next = { ...prev };
      authored.forEach((s) => {
        next[s] = s;
      });
      return next;
    });
  }

  function toggleLanguage() {
    setLanguage((prev) => (prev === "en" ? "es" : "en"));
  }

  return (
    <TranslateContext.Provider value={translate}>
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-teal-50 to-white">
        <header className="flex items-center justify-between bg-teal-800 px-6 py-4 text-white shadow-md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
              {translate(UI_STRINGS.pageEyebrow)}
            </p>
            <h1 className="text-xl font-bold sm:text-2xl">
              {translate(UI_STRINGS.pageTitle)}
            </h1>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Tip text={UI_STRINGS.tipLanguage} align="right">
            <button
              type="button"
              onClick={toggleLanguage}
              disabled={translating}
              className="rounded-full border-2 border-white/30 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {translating ? "…" : language === "en" ? "🌐 Español" : "🌐 English"}
            </button>
            </Tip>
            {translationError && (
              <span className="max-w-[10rem] text-right text-[10px] text-rose-200">
                {translationError}
              </span>
            )}
          </div>
        </header>

        <div className="border-b-2 border-teal-700/10 bg-white px-6 py-4">
          <SmartSearchBar
            query={query}
            onQueryChange={setQuery}
            onSearch={runSearch}
            status={searchStatus}
            translate={translate}
          />

          {(result || searchStatus === "loading" || searchStatus === "error") && (
            <LookupResultPanel
              result={result}
              query={resultQuery}
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
                setSearchStatus("idle");
              }}
              translate={translate}
            />
          )}
        </div>

        {lastGenerated && (
          <div className="flex flex-wrap items-center gap-2 border-b border-teal-700/10 bg-white px-6 py-2 text-xs text-teal-900/70">
            <span>{translate(UI_STRINGS.lastGeneratedLabel)}</span>
            <SourceBadge source={lastGenerated.source} translate={translate} />
            {lastGenerated.source === "curriculum" &&
              lastGenerated.sourceTitles.length > 0 && (
                <span>
                  {translate(UI_STRINGS.foundInLabel)}{" "}
                  {lastGenerated.sourceTitles.join(" · ")}
                </span>
              )}
          </div>
        )}

        <main className="flex min-h-0 flex-col lg:flex-row">
          <DeckWorkspace
            slides={slides}
            activeSlide={activeSlide}
            onSelect={setActiveSlideId}
            onAddTemplate={() => addSlide(makeTemplateSlide())}
            onGenerate={generateSlideFromTopic}
            generateStatus={generateStatus}
            generateError={generateError}
            onUpdateSlide={handleSlideEdit}
            onRemoveSlide={removeSlide}
            isLabelFlagged={isLabelFlagged}
            onToggleFlag={toggleQuickFlag}
          />

          <Sidebar
            fact={
              factStatus === "loading"
                ? translate(UI_STRINGS.loadingFact)
                : factStatus === "error"
                ? factError ?? translate(UI_STRINGS.factFallbackError)
                : fact
                ? translate(fact.text)
                : ""
            }
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
    </TranslateContext.Provider>
  );
}

function errorMessage(err: unknown) {
  return err instanceof CurriculumSearchError
    ? err.message
    : "Something went wrong.";
}

// --- Source badge ------------------------------------------------------

function SourceBadge({
  source,
  translate,
}: Readonly<{
  source: CurriculumSearchResult["source"];
  translate: (text: string) => string;
}>) {
  const fromCurriculum = source === "curriculum";

  return (
    <Tip
      text={fromCurriculum ? UI_STRINGS.tipBadgeCurriculum : UI_STRINGS.tipBadgeAi}
      align="left"
    >
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
        fromCurriculum
          ? "bg-emerald-100 text-emerald-800"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {fromCurriculum
        ? translate(UI_STRINGS.fromCurriculumBadge)
        : translate(UI_STRINGS.aiGeneratedBadge)}
    </span>
    </Tip>
  );
}

// --- Smart search bar --------------------------------------------------

function SmartSearchBar({
  query,
  onQueryChange,
  onSearch,
  status,
  translate,
}: Readonly<{
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  status: RequestStatus;
  translate: (text: string) => string;
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
            placeholder={translate(UI_STRINGS.searchPlaceholder)}
            className="w-full rounded-full border-2 border-teal-700/20 bg-teal-50/60 py-2.5 pl-9 pr-3 text-sm text-teal-900 placeholder:text-teal-900/40 focus:border-teal-600 focus:outline-none"
          />
        </div>

        <Tip text={UI_STRINGS.tipSearch} align="right" className="shrink-0">
        <button
          type="button"
          onClick={onSearch}
          disabled={status === "loading" || !query.trim()}
          className="shrink-0 rounded-full border-2 border-teal-700 bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "loading"
            ? translate(UI_STRINGS.searchButtonLoading)
            : translate(UI_STRINGS.searchButtonIdle)}
        </button>
        </Tip>
      </div>

      <p className="pl-1 text-xs text-teal-900/50">
        {translate(UI_STRINGS.searchHelper)}
      </p>
    </div>
  );
}

// --- Curriculum result -------------------------------------------------

function LookupResultPanel({
  result,
  query,
  status,
  error,
  isFlagged,
  onToggleFlag,
  onAddToSlide,
  onDismiss,
  translate,
}: Readonly<{
  result: CurriculumSearchResult | null;
  query: string;
  status: RequestStatus;
  error: string | null;
  isFlagged: boolean;
  onToggleFlag: () => void;
  onAddToSlide: () => void;
  onDismiss: () => void;
  translate: (text: string) => string;
}>) {
  return (
    <div className="mt-3 rounded-2xl border-2 border-teal-700/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {result && status !== "loading" && (
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={result.source} translate={translate} />

            {result.source === "curriculum" &&
              result.sourceTitles.length > 0 && (
                <span className="text-xs text-teal-800/70">
                  {translate(UI_STRINGS.foundInLabel)}{" "}
                  {result.sourceTitles.join(" · ")}
                </span>
              )}
          </div>
        )}

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-teal-700/60 hover:bg-teal-50"
        >
          ✕
        </button>
      </div>

      {status === "loading" && (
        <p className="mt-2 text-sm text-teal-800/70">
          {translate(UI_STRINGS.loadingCurriculum)}
        </p>
      )}

      {status === "error" && (
        <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
      )}

      {result && status !== "loading" && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-900">
              {translate(result.title)}
            </span>

            <FlagToggleButton
              flagged={isFlagged}
              onToggle={onToggleFlag}
              size="sm"
            />
          </div>

          <p className="text-sm text-teal-800">
            {translate(result.teacherSummary)}
          </p>

          {result.studentBullets.length > 0 && (
            <ul className="list-disc rounded-xl bg-teal-50/60 py-2 pl-8 pr-3 text-sm text-teal-900">
              {result.studentBullets.map((bullet, index) => (
                <li key={index}>{translate(bullet)}</li>
              ))}
            </ul>
          )}

          <Tip text={UI_STRINGS.tipAddToSlide} className="self-start">
          <button
            type="button"
            onClick={onAddToSlide}
            className="self-start rounded-xl border-2 border-teal-700 px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
          >
            {translate(UI_STRINGS.addToSlide)}
          </button>
          </Tip>

          {/* Snapshot is the English original, never the translated text. */}
          <ReportButton
            key={result.teacherSummary}
            kind="search-result"
            query={query}
            content={result}
          />
        </div>
      )}
    </div>
  );
}