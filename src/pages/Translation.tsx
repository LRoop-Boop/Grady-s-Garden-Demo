import { useEffect, useState } from "react";
import { translateTexts, type LanguageCode } from "../lib/translate";

// --- Mock content model -----------------------------------------------
// This is a throwaway data set for the demo. Swap `emoji` for real
// illustrations/photos and `slides` for CMS/API content once this is
// wired up for real. All slide text below is authored in English; other
// languages are produced live via translateTexts (see src/lib/translate.ts).

interface InfoSlide {
  kind: "intro" | "info" | "outro";
  id: string;
  emoji: string;
  title: string;
  body: string;
  accent: string; // tailwind gradient classes for this slide's background
}

interface QuizSlide {
  kind: "quiz";
  id: string;
  emoji: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  accent: string;
}

interface VideoSlide {
  kind: "video";
  id: string;
  emoji: string;
  title: string;
  videoId: string; // YouTube video ID (the part after v= in the URL)
  accent: string;
}

type Slide = InfoSlide | QuizSlide | VideoSlide;

const slides: Slide[] = [
  {
    kind: "intro",
    id: "intro",
    emoji: "🌱",
    title: "Let's Learn About Vegetables!",
    body: "Tap Next to explore the garden. Some slides will ask you a quick question!",
    accent: "from-teal-100 to-emerald-50",
  },
  {
    kind: "info",
    id: "carrot-info",
    emoji: "🥕",
    title: "Carrots",
    body: "Carrots grow underground and are usually orange. They're crunchy and great for your eyes!",
    accent: "from-orange-100 to-amber-50",
  },
  {
    kind: "quiz",
    id: "carrot-quiz",
    emoji: "🥕",
    question: "What color are most carrots?",
    options: ["Purple", "Orange", "Blue"],
    correctIndex: 1,
    explanation: "That's right! Most carrots are orange.",
    accent: "from-orange-100 to-amber-50",
  },
  {
    kind: "info",
    id: "broccoli-info",
    emoji: "🥦",
    title: "Broccoli",
    body: "Broccoli looks like a tiny tree! It grows above the ground and is packed with vitamins.",
    accent: "from-green-100 to-lime-50",
  },
  {
    kind: "quiz",
    id: "broccoli-quiz",
    emoji: "🌳",
    question: "Broccoli looks like a tiny...?",
    options: ["Tree", "Cloud", "Car"],
    correctIndex: 0,
    explanation: "Yes! Broccoli looks just like a little tree.",
    accent: "from-green-100 to-lime-50",
  },
  {
    kind: "info",
    id: "tomato-info",
    emoji: "🍅",
    title: "Tomatoes",
    body: "Surprise! Tomatoes grow from a flower and have seeds inside, so scientists call them a fruit.",
    accent: "from-red-100 to-rose-50",
  },
  {
    kind: "quiz",
    id: "tomato-quiz",
    emoji: "🍅",
    question: "Because it has seeds, a tomato is scientifically a...?",
    options: ["Vegetable", "Fruit", "Grain"],
    correctIndex: 1,
    explanation: "Correct! A tomato has seeds, so it's technically a fruit.",
    accent: "from-red-100 to-rose-50",
  },
  {
    kind: "info",
    id: "test-info",
    emoji: "",
    title: "Test",
    body: "Testing translation on new pages",
    accent: "from-grey-100 to-blue-50",
  },
  {
    kind: "video",
    id: "bonus-video",
    emoji: "🎬",
    title: "Watch and Learn!",
    videoId: "TVWHX6EPUVI",
    accent: "from-indigo-100 to-purple-50",
  },
  {
    kind: "outro",
    id: "outro",
    emoji: "🏆",
    title: "Great job, gardener!",
    body: "You made it through the whole lesson.",
    accent: "from-teal-100 to-emerald-50",
  },
];

const quizSlides = slides.filter((s): s is QuizSlide => s.kind === "quiz");

const languages: { code: LanguageCode; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

// Small fixed dictionary for the nav chrome (Back/Next/etc). These never
// change, so they're translated once by hand instead of burning API calls
// on them every time the language switches.
const uiText: Record<LanguageCode, Record<
  "moduleTest" | "back" | "next" | "slide" | "of" | "answered" | "scored" | "changeAnswer" | "notQuite",
  string
>> = {
  en: {
    moduleTest: "Module Test",
    back: "Back",
    next: "Next",
    slide: "Slide",
    of: "of",
    answered: "answered",
    scored: "You scored",
    changeAnswer: "Changed your mind? Tap another answer.",
    notQuite: "Not quite —",
  },
  es: {
    moduleTest: "Prueba del módulo",
    back: "Atrás",
    next: "Siguiente",
    slide: "Diapositiva",
    of: "de",
    answered: "respondidas",
    scored: "Obtuviste",
    changeAnswer: "¿Cambiaste de opinión? Toca otra respuesta.",
    notQuite: "No es correcto —",
  },
  fr: {
    moduleTest: "Test du module",
    back: "Retour",
    next: "Suivant",
    slide: "Diapositive",
    of: "sur",
    answered: "répondu(es)",
    scored: "Vous avez obtenu",
    changeAnswer: "Vous avez changé d'avis ? Touchez une autre réponse.",
    notQuite: "Pas tout à fait —",
  },
};

// Locale tags for formatting today's date per selected language.
const localeForLanguage: Record<LanguageCode, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
};

// A row of vegetable emoji, rendered overlapping in the footer to read as
// a "pile". Order/rotation is hand-tuned rather than randomized so the
// layout doesn't jitter on every re-render.
const veggiePile = ["🥕", "🌽", "🍅", "🥦", "🍆", "🫑", "🥔", "🥬", "🧅", "🍠", "🥒", "🫛"];
// translateY per position in the pile, cycled by index % 3.
const veggieOffsets = ["10%", "-10%", "0%"];

// Pull the translatable strings out of a slide, in a fixed order, and
// (separately) rebuild a slide from a translated array in that same order.
function getTranslatableStrings(slide: Slide): string[] {
  if (slide.kind === "quiz") {
    return [slide.question, ...slide.options, slide.explanation];
  }
  if (slide.kind === "video") {
    return [slide.title];
  }
  return [slide.title, slide.body];
}

function withTranslatedStrings(slide: Slide, translated: string[]): Slide {
  if (slide.kind === "quiz") {
    const [question, ...rest] = translated;
    const options = rest.slice(0, slide.options.length);
    const explanation = rest[slide.options.length];
    return { ...slide, question, options, explanation };
  }
  if (slide.kind === "video") {
    const [title] = translated;
    return { ...slide, title };
  }
  const [title, body] = translated;
  return { ...slide, title, body };
}

export default function Translation() {
  const [index, setIndex] = useState(0);
  // slideId -> chosen option index, kept so a quiz slide "remembers" its
  // answer if you navigate back to it.
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const [language, setLanguage] = useState<LanguageCode>("en");
  // `${slideId}:${language}` -> translated strings, so switching languages
  // back and forth doesn't re-request translations already fetched.
  const [translationCache, setTranslationCache] = useState<Record<string, string[]>>({});
  const [translationStatus, setTranslationStatus] = useState<"idle" | "loading" | "error">("idle");
  const [translationError, setTranslationError] = useState<string | null>(null);

  const slide = slides[index];
  const isFirst = index === 0;
  const isLast = index === slides.length - 1;
  const t = uiText[language];

  const cacheKey = `${slide.id}:${language}`;
  const displaySlide =
    language === "en" || !translationCache[cacheKey]
      ? slide
      : withTranslatedStrings(slide, translationCache[cacheKey]);
  const isShowingTranslation = language !== "en" && Boolean(translationCache[cacheKey]);

  const score = quizSlides.reduce((total, q) => {
    return answers[q.id] === q.correctIndex ? total + 1 : total;
  }, 0);
  const answeredCount = quizSlides.filter((q) => answers[q.id] !== undefined).length;

  const formattedDate = new Date().toLocaleDateString(localeForLanguage[language], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Fetch a translation for the current slide whenever the slide or
  // language changes and it isn't already cached.
  useEffect(() => {
    if (language === "en" || translationCache[cacheKey]) return;

    let cancelled = false;
    setTranslationStatus("loading");
    setTranslationError(null);

    translateTexts(getTranslatableStrings(slide), language)
      .then((translated) => {
        if (cancelled) return;
        setTranslationCache((prev) => ({ ...prev, [cacheKey]: translated }));
        setTranslationStatus("idle");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setTranslationStatus("error");
        setTranslationError(error instanceof Error ? error.message : "Translation failed.");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-runs on slide/language; cache is read, not a trigger
  }, [slide, language, cacheKey]);

  function goTo(nextIndex: number) {
    setIndex(Math.max(0, Math.min(slides.length - 1, nextIndex)));
  }

  function selectAnswer(slideId: string, optionIndex: number) {
    // Kids can change their mind — picking again before moving on just
    // overwrites the previous answer for this slide.
    setAnswers((prev) => ({ ...prev, [slideId]: optionIndex }));
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-teal-50 to-white">
      {/* Header bar — full width, spans the top edge of the screen */}
      <header className="flex shrink-0 items-center justify-between bg-teal-800 px-6 py-4 text-white shadow-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
            Grady's Garden · Veggie Adventure
          </p>
          <h1 className="text-xl font-bold sm:text-2xl">{t.moduleTest}</h1>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            aria-label="Choose language"
            className="rounded-lg border-2 border-teal-500 bg-teal-700 px-2 py-1 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-teal-300"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.label}
              </option>
            ))}
          </select>
          <p className="text-sm font-medium text-teal-100 sm:text-base">{formattedDate}</p>
        </div>
      </header>

      {/* Scrollable content between the header and the veggie footer */}
      <main className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-6 py-4">
        <div aria-live="polite" className="min-h-5 text-center text-sm">
          {translationStatus === "loading" && (
            <span className="text-teal-700">Translating…</span>
          )}
          {translationStatus === "error" && (
            <span className="text-rose-600">
              Couldn't translate ({translationError}). Showing English.
            </span>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((s, i) => {
            const isCurrent = i === index;
            let dotColor = "bg-teal-200";
            if (s.kind === "quiz" && answers[s.id] !== undefined) {
              dotColor = answers[s.id] === s.correctIndex ? "bg-emerald-500" : "bg-rose-400";
            }
            return (
              <button
                key={s.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={[
                  "h-2.5 rounded-full transition-all",
                  isCurrent ? "w-6 bg-teal-700" : `w-2.5 ${dotColor}`,
                ].join(" ")}
              />
            );
          })}
        </div>

        {/* Slide card */}
        <div
          className={[
            "flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-teal-700/20 bg-gradient-to-b p-8 text-center shadow-md",
            displaySlide.accent,
          ].join(" ")}
        >
          <div className="text-6xl">{displaySlide.emoji}</div>

          {displaySlide.kind === "quiz" && (
            <QuizSlideView
              slide={displaySlide}
              selected={answers[displaySlide.id]}
              onSelect={(optionIndex) => selectAnswer(displaySlide.id, optionIndex)}
              notQuiteLabel={t.notQuite}
              changeAnswerLabel={t.changeAnswer}
            />
          )}

          {displaySlide.kind === "video" && (
            <VideoSlideView slide={displaySlide} language={language} />
          )}

          {displaySlide.kind !== "quiz" && displaySlide.kind !== "video" && (
            <>
              <h1 className="text-2xl font-bold text-teal-900">{displaySlide.title}</h1>
              <p className="text-lg text-teal-800">{displaySlide.body}</p>
              {displaySlide.kind === "outro" && (
                <p className="mt-2 rounded-2xl bg-white/70 px-4 py-2 text-lg font-semibold text-teal-900">
                  {t.scored} {score} / {quizSlides.length} 🎉
                </p>
              )}
            </>
          )}

          {isShowingTranslation && (
            <p className="text-xs text-teal-900/50">Translated automatically — wording may be rough.</p>
          )}
        </div>

        {/* Nav controls */}
        <div className="flex w-full max-w-2xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={isFirst}
            className="rounded-2xl border-2 border-teal-700 px-5 py-3 font-bold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.back}
          </button>
          <span className="text-sm font-medium text-teal-700">
            {t.slide} {index + 1} {t.of} {slides.length}
            {quizSlides.length > 0 && ` · ${answeredCount}/${quizSlides.length} ${t.answered}`}
          </span>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={isLast}
            className="rounded-2xl border-2 border-teal-700 bg-teal-700 px-5 py-3 font-bold text-white shadow-md transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.next}
          </button>
        </div>
      </main>

      <VeggieFooter />
    </div>
  );
}

// A decorative strip of overlapping vegetable emoji, read as a "pile" —
// purely visual, so it's hidden from assistive tech.
function VeggieFooter() {
  return (
    <footer className="flex h-10 w-full shrink-0 items-end justify-center overflow-hidden border-t-4 border-amber-900/30 bg-gradient-to-b from-amber-100 to-amber-300 sm:h-12">
      <div className="flex items-end" aria-hidden="true">
        {veggiePile.map((veggie, i) => (
          <span
            key={`${veggie}-${i}`}
            className="text-4xl leading-none sm:text-5xl"
            style={{
              marginLeft: i === 0 ? 0 : "-0.75rem",
              transform: `translateY(${veggieOffsets[i % veggieOffsets.length]}) rotate(${((i % 5) - 2) * 8}deg)`,
              zIndex: i,
            }}
          >
            {veggie}
          </span>
        ))}
      </div>
    </footer>
  );
}

// Embeds a YouTube video with its original audio track untouched. Captions
// are YouTube's own (creator-uploaded or auto-generated) — `cc_load_policy=1`
// turns them on, and `cc_lang_pref` requests the language matching whatever
// is selected above. That request only succeeds if the video actually has a
// caption track in that language; there's no reliable way to confirm that
// from the plain embed API, so this doesn't try to detect or warn about it.
// Remounting the iframe (via `key`) on language change is the only way to
// get YouTube to re-apply `cc_lang_pref` — it isn't a live, hot-swappable
// player setting, so switching languages restarts the video.
function VideoSlideView({
  slide,
  language,
}: Readonly<{ slide: VideoSlide; language: LanguageCode }>) {
  const src = `https://www.youtube-nocookie.com/embed/${slide.videoId}?cc_load_policy=1&cc_lang_pref=${language}&hl=${language}&rel=0`;

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-2">
      <h1 className="text-2xl font-bold text-teal-900">{slide.title}</h1>
      <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-md">
        <iframe
          key={language}
          src={src}
          title={slide.title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <p className="text-xs text-teal-900/60">
        Captions come from YouTube and depend on what's available for this video in the
        selected language.
      </p>
    </div>
  );
}

function QuizSlideView({
  slide,
  selected,
  onSelect,
  notQuiteLabel,
  changeAnswerLabel,
}: Readonly<{
  slide: QuizSlide;
  selected: number | undefined;
  onSelect: (optionIndex: number) => void;
  notQuiteLabel: string;
  changeAnswerLabel: string;
}>) {
  const hasAnswered = selected !== undefined;

  return (
    <>
      <h1 className="text-2xl font-bold text-teal-900">{slide.question}</h1>
      <div className="flex w-full flex-col gap-3">
        {slide.options.map((option, i) => {
          const isSelected = selected === i;
          const isCorrectOption = i === slide.correctIndex;

          let optionClasses =
            "w-full rounded-2xl border-2 px-5 py-3 text-left font-semibold transition ";
          if (!hasAnswered) {
            optionClasses += "border-teal-700 bg-white text-teal-900 hover:bg-teal-50";
          } else if (isCorrectOption) {
            optionClasses += "border-emerald-600 bg-emerald-100 text-emerald-900 hover:bg-emerald-200";
          } else if (isSelected) {
            optionClasses += "border-rose-500 bg-rose-100 text-rose-900 hover:bg-rose-200";
          } else {
            optionClasses += "border-teal-700/30 bg-white/60 text-teal-900/60 hover:bg-teal-50";
          }

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(i)}
              className={optionClasses}
            >
              {option}
            </button>
          );
        })}
      </div>
      {hasAnswered && (
        <div className="flex flex-col items-center gap-1">
          <p className="rounded-2xl bg-white/70 px-4 py-2 font-medium text-teal-900">
            {selected === slide.correctIndex ? slide.explanation : `${notQuiteLabel} ${slide.explanation}`}
          </p>
          <p className="text-sm text-teal-800/70">{changeAnswerLabel}</p>
        </div>
      )}
    </>
  );
}
