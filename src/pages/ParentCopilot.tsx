import { useEffect, useState } from "react";
import {
  searchHomeActivities,
  getParentTip,
  CurriculumSearchError,
  type HomeActivityResult,
  type FactOfTheDay,
} from "../lib/gemini";
import {
  translateTexts,
  TranslationError,
  type LanguageCode,
} from "../lib/translate";
import {
  TranslateContext,
  UI_STRINGS,
  useT,
  type RequestStatus,
} from "../components/copilotData";
import {
  PARENT_UI_STRINGS as P,
  PARENT_STATIC_TEXTS,
  PARENT_CACHE_KEY,
  PLAN_STORAGE_KEY,
  activityTexts,
  type PlanItem,
} from "../components/parentCopilotData";
import { FlagToggleButton } from "../components/Flagsidebar";
import ReportButton from "../components/ReportButton";
import Tip from "../components/Tip";

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "en", label: "🌐 English" },
  { code: "es", label: "🌐 Español" },
  { code: "fr", label: "🌐 Français" },
];

export default function ParentCopilot() {
  // --- My Plan (saved activities) -------------------------------------

  const [plan, setPlan] = useState<PlanItem[]>(() => {
    const stored = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  });

  function persistPlan(next: PlanItem[]) {
    setPlan(next);
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(next));
  }

  function findInPlan(title: string) {
    return plan.find((p) => p.title.toLowerCase() === title.toLowerCase());
  }

  function toggleSave(result: HomeActivityResult) {
    const existing = findInPlan(result.title);
    if (existing) {
      persistPlan(plan.filter((p) => p.id !== existing.id));
    } else {
      persistPlan([...plan, { ...result, id: crypto.randomUUID() }]);
    }
  }

  // --- Tip of the day --------------------------------------------------

  const [tip, setTip] = useState<FactOfTheDay | null>(null);
  const [tipStatus, setTipStatus] = useState<RequestStatus>("idle");
  const [tipError, setTipError] = useState<string | null>(null);

  useEffect(() => {
    loadTip("daily");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTip(mode: "daily" | "random") {
    setTipStatus("loading");
    setTipError(null);
    try {
      setTip(await getParentTip(mode, mode === "random" ? tip?.source : undefined));
      setTipStatus("idle");
    } catch (err) {
      setTipStatus("error");
      setTipError(
        err instanceof CurriculumSearchError ? err.message : "Couldn't load a tip."
      );
    }
  }

  // --- Search ----------------------------------------------------------

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<HomeActivityResult | null>(null);
  const [resultQuery, setResultQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState<RequestStatus>("idle");
  const [searchError, setSearchError] = useState<string | null>(null);

  async function runSearch() {
    if (!query.trim()) return;
    setSearchStatus("loading");
    setSearchError(null);
    try {
      const found = await searchHomeActivities(query.trim());
      setResult(found);
      setResultQuery(query.trim());
      setSearchStatus("idle");
    } catch (err) {
      setSearchStatus("error");
      setSearchError(
        err instanceof CurriculumSearchError ? err.message : "Something went wrong."
      );
    }
  }

  // --- Translation (copied from Copilot.tsx; cache is keyed "lang:text") --

  const [language, setLanguage] = useState<LanguageCode>("en");
  const [translationCache, setTranslationCache] = useState<Record<string, string>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(PARENT_CACHE_KEY) ?? "{}");
      } catch {
        return {};
      }
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem(PARENT_CACHE_KEY, JSON.stringify(translationCache));
    } catch {
      // storage full or unavailable; the cache just won't persist
    }
  }, [translationCache]);

  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  function translate(text: string): string {
    if (language === "en" || !text) return text;
    return translationCache[`${language}:${text}`] ?? text;
  }

  async function ensureTranslated(texts: string[]) {
    if (language === "en") return;
    const lang = language; // capture, in case the user switches mid-request

    const missing = Array.from(
      new Set(texts.filter((t) => t.trim() && !(`${lang}:${t}` in translationCache)))
    );
    if (missing.length === 0) return;

    setTranslating(true);
    setTranslationError(null);

    try {
      const translated = await translateTexts(missing, lang);
      setTranslationCache((prev) => {
        const next = { ...prev };
        missing.forEach((original, i) => {
          next[`${lang}:${original}`] = translated[i];
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

  // Static copy, tip, and the current search result: translate immediately.
  useEffect(() => {
    if (language === "en") return;
    const texts = [...PARENT_STATIC_TEXTS];
    if (tip) texts.push(tip.text);
    if (result) texts.push(...activityTexts(result));
    ensureTranslated(texts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, tip, result]);

  // Saved plan items: debounced like the slides effect on the teacher page.
  useEffect(() => {
    if (language === "en" || plan.length === 0) return;
    const timer = setTimeout(() => {
      ensureTranslated(plan.flatMap(activityTexts));
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, plan]);

  // --- Render ----------------------------------------------------------

  return (
    <TranslateContext.Provider value={translate}>
      <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-teal-50 to-white">
        <header className="flex items-center justify-between bg-teal-800 px-6 py-4 text-white shadow-md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
              {translate(P.pageEyebrow)}
            </p>
            <h1 className="text-xl font-bold sm:text-2xl">{translate(P.pageTitle)}</h1>
          </div>

          <div className="flex flex-col items-end gap-1">
            <Tip text={P.tipLanguage} align="right">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                disabled={translating}
                className="rounded-full border-2 border-white/30 bg-teal-800 px-3 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </Tip>
            {translating && (
              <span className="text-[10px] text-teal-200">…</span>
            )}
            {translationError && (
              <span className="max-w-[10rem] text-right text-[10px] text-rose-200">
                {translationError}
              </span>
            )}
          </div>
        </header>

        <div className="border-b-2 border-teal-700/10 bg-white px-6 py-4">
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            onSearch={runSearch}
            status={searchStatus}
          />

          {(result || searchStatus === "loading" || searchStatus === "error") && (
            <ResultPanel
              result={result}
              query={resultQuery}
              status={searchStatus}
              error={searchError}
              isSaved={result ? !!findInPlan(result.title) : false}
              onToggleSave={() => result && toggleSave(result)}
              onDismiss={() => {
                setResult(null);
                setSearchStatus("idle");
              }}
            />
          )}
        </div>

        <main className="flex min-h-0 flex-col lg:flex-row">
          <section className="flex-1 p-6">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-teal-700">
              {translate(P.myPlan)}
            </h2>

            {plan.length === 0 && (
              <p className="rounded-xl bg-teal-50 px-3 py-4 text-center text-sm text-teal-800/70">
                {translate(P.planEmpty)}
              </p>
            )}

            <div className="flex flex-col gap-3">
              {plan.map((item) => (
                <details
                  key={item.id}
                  className="rounded-2xl border-2 border-teal-700/10 bg-white p-3 shadow-sm"
                >
                  <summary className="cursor-pointer text-sm font-bold text-teal-900">
                    {translate(item.title)}
                    <span className="ml-2 text-xs font-medium text-teal-700/60">
                      {translate(item.activity.name)}
                      {item.activity.time && ` · ${translate(item.activity.time)}`}
                    </span>
                  </summary>

                  <div className="mt-3 flex flex-col gap-3">
                    <ActivityBody result={item} />
                    <button
                      type="button"
                      onClick={() => persistPlan(plan.filter((p) => p.id !== item.id))}
                      className="self-start text-xs font-medium text-rose-600 hover:underline"
                    >
                      {translate(P.remove)}
                    </button>
                  </div>
                </details>
              ))}
            </div>
          </section>

          <div className="w-full shrink-0 border-t-2 border-teal-700/10 bg-teal-50/30 p-4 sm:max-w-sm lg:w-72 lg:border-l-2 lg:border-t-0">
            <TipTile
              tip={
                tipStatus === "loading"
                  ? translate(P.loadingTip)
                  : tipStatus === "error"
                  ? tipError ?? translate(P.tipFallbackError)
                  : tip
                  ? translate(tip.text)
                  : ""
              }
              onRefresh={() => loadTip("random")}
            />
          </div>
        </main>
      </div>
    </TranslateContext.Provider>
  );
}

// --- Source badge ------------------------------------------------------

function SourceBadge({ source }: Readonly<{ source: HomeActivityResult["source"] }>) {
  const t = useT();
  const fromCurriculum = source === "curriculum";

  return (
    <Tip text={fromCurriculum ? P.tipBadgeCurriculum : P.tipBadgeAi} align="left">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
          fromCurriculum ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
        }`}
      >
        {fromCurriculum
          ? t(UI_STRINGS.fromCurriculumBadge)
          : t(UI_STRINGS.aiGeneratedBadge)}
      </span>
    </Tip>
  );
}

// --- Search bar --------------------------------------------------------

function SearchBar({
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
  const t = useT();

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
            placeholder={t(P.searchPlaceholder)}
            className="w-full rounded-full border-2 border-teal-700/20 bg-teal-50/60 py-2.5 pl-9 pr-3 text-sm text-teal-900 placeholder:text-teal-900/40 focus:border-teal-600 focus:outline-none"
          />
        </div>

        <Tip text={P.tipSearch} align="right" className="shrink-0">
          <button
            type="button"
            onClick={onSearch}
            disabled={status === "loading" || !query.trim()}
            className="shrink-0 rounded-full border-2 border-teal-700 bg-teal-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "loading"
              ? t(UI_STRINGS.searchButtonLoading)
              : t(UI_STRINGS.searchButtonIdle)}
          </button>
        </Tip>
      </div>

      <p className="pl-1 text-xs text-teal-900/50">{t(P.searchHelper)}</p>
    </div>
  );
}

// --- Activity body (shared by the result panel and My Plan) --------------

function ActivityBody({ result }: Readonly<{ result: HomeActivityResult }>) {
  const t = useT();
  const { activity } = result;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-teal-700">
          {t(P.learning)}
        </h4>
        <p className="mt-1 text-sm text-teal-800">{t(result.learningBlurb)}</p>
      </div>

      <div className="rounded-xl bg-teal-50/60 p-3">
        <h4 className="text-xs font-bold uppercase tracking-wide text-teal-700">
          {t(P.tryAtHome)}
          {activity.time && ` · ${t(activity.time)}`}
        </h4>
        <p className="mt-1 text-sm font-semibold text-teal-900">{t(activity.name)}</p>

        {activity.materials.length > 0 && (
          <>
            <p className="mt-2 text-xs font-bold text-teal-900">{t(P.materials)}</p>
            <ul className="list-disc pl-5 text-sm text-teal-900">
              {activity.materials.map((m, i) => (
                <li key={i}>{t(m)}</li>
              ))}
            </ul>
          </>
        )}

        {activity.steps.length > 0 && (
          <>
            <p className="mt-2 text-xs font-bold text-teal-900">{t(P.steps)}</p>
            <ol className="list-decimal pl-5 text-sm text-teal-900">
              {activity.steps.map((s, i) => (
                <li key={i}>{t(s)}</li>
              ))}
            </ol>
          </>
        )}
      </div>

      {result.conversationStarters.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wide text-teal-700">
            {t(P.talkAboutIt)}
          </h4>
          <ul className="mt-1 list-disc pl-5 text-sm text-teal-900">
            {result.conversationStarters.map((q, i) => (
              <li key={i}>{t(q)}</li>
            ))}
          </ul>
        </div>
      )}

      {result.nutritionTip && (
        <div className="rounded-xl bg-emerald-50 p-3">
          <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            {t(P.nutritionTip)}
          </h4>
          <p className="mt-1 text-sm text-emerald-900">{t(result.nutritionTip)}</p>
        </div>
      )}
    </div>
  );
}

// --- Result panel ------------------------------------------------------

function ResultPanel({
  result,
  query,
  status,
  error,
  isSaved,
  onToggleSave,
  onDismiss,
}: Readonly<{
  result: HomeActivityResult | null;
  query: string;
  status: RequestStatus;
  error: string | null;
  isSaved: boolean;
  onToggleSave: () => void;
  onDismiss: () => void;
}>) {
  const t = useT();

  return (
    <div className="mt-3 rounded-2xl border-2 border-teal-700/15 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {result && status !== "loading" && (
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={result.source} />
            {result.source === "curriculum" && result.sourceTitles.length > 0 && (
              <span className="text-xs text-teal-800/70">
                {t(UI_STRINGS.foundInLabel)} {result.sourceTitles.join(" · ")}
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
        <p className="mt-2 text-sm text-teal-800/70">{t(P.loadingActivity)}</p>
      )}

      {status === "error" && (
        <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
      )}

      {result && status !== "loading" && (
        <div className="mt-2 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-teal-900">{t(result.title)}</span>
            <Tip text={UI_STRINGS.tipSave} align="left">
              <FlagToggleButton flagged={isSaved} onToggle={onToggleSave} size="sm" />
            </Tip>
          </div>

          <ActivityBody result={result} />

          {/* Report snapshot is the English original, never translated text. */}
          <Tip text={UI_STRINGS.tipReport} align="left" className="self-start">
            <ReportButton
              key={result.title + result.learningBlurb}
              kind="search-result"
              query={query}
              content={result}
            />
          </Tip>
        </div>
      )}
    </div>
  );
}

// --- Tip tile ----------------------------------------------------------

function TipTile({ tip, onRefresh }: Readonly<{ tip: string; onRefresh: () => void }>) {
  const t = useT();

  return (
    <div className="flex flex-col justify-between gap-3 rounded-2xl border-2 border-teal-700/10 bg-gradient-to-br from-teal-700 to-emerald-600 p-3 text-white shadow-sm">
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs font-bold uppercase leading-tight tracking-wide text-teal-100">
          {t(P.tipOfTheDay)}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          aria-label={t(P.showDifferentTip)}
          className="shrink-0 rounded-full px-1.5 text-sm transition hover:bg-white/15"
        >
          ↻
        </button>
      </div>
      <p className="text-sm font-medium leading-snug">{tip}</p>
    </div>
  );
}