// Types, static curriculum data, and small pure helpers for the Copilot page.

import { createContext, useContext } from "react";

// --- Types -------------------------------------------------------------

export type SlideLayout = "bullets" | "bullets-image";

export interface LessonSlide {
  id: string;
  title: string;
  points: string[];
  layout: SlideLayout;
  imageUrl: string;
  accent: string;
  /** Where the content came from; undefined for blank/template slides */
  source?: "curriculum" | "ai";
}

export type FlagType = "interest" | "struggle";

export interface FlaggedTopic {
  id: string;
  label: string;
  type: FlagType;
  note: string;
}

export type RequestStatus = "idle" | "loading" | "error";

// --- Storage -----------------------------------------------------------

export const FLAGS_STORAGE_KEY = "copilot_flagged_topics";
// Persisted so reloading during a demo doesn't re-spend the MyMemory quota.
export const TRANSLATION_CACHE_KEY = "copilot_translation_cache";

// Fact of the day now comes from the RAG (see getFactOfTheDay in lib/gemini.ts)
// instead of a static array.

// --- Translation -------------------------------------------------------
// `Copilot` owns the translation cache and provides `translate` through this
// context, so any child can call `useT()` without prop drilling.
//
// IMPORTANT: every string passed to t() must be a value in UI_STRINGS (or
// dynamic content that Copilot explicitly batches, like slides/facts/results).
// Copilot batch-translates Object.values(UI_STRINGS) when the language flips,
// so a string that isn't listed here will just stay in English.

export const TranslateContext = createContext<(text: string) => string>(
  (text) => text
);

export const useT = () => useContext(TranslateContext);

export const UI_STRINGS = {
  // page
  pageEyebrow: "Grady's Garden · Veggie Adventure",
  pageTitle: "Parent/Teacher Copilot",
  searchPlaceholder: "Search: e.g. Can carrots be purple?",
  searchButtonIdle: "Look Up",
  searchButtonLoading: "Looking up...",
  searchHelper:
    "Answers come from the Grady's Garden curriculum when available; otherwise they're labeled AI-generated.",
  loadingCurriculum: "Checking the curriculum...",
  addToSlide: "+ Add to Slide",
  lastGeneratedLabel: "Last generated slide:",
  foundInLabel: "Found in:",
  fromCurriculumBadge: "📚 From curriculum (Firestore)",
  aiGeneratedBadge: "✨ AI-generated",

  // deck
  lessonDeck: "Lesson Deck",
  blankSlide: "+ Blank Slide",
  generateSlide: "✨ Generate Slide",
  exportSlides: "Export to Google Slides",
  exportAlert:
    "Google Slides export isn't wired up yet — this deck is saved in the app for now.",
  emptyDeckTitle: "Build your lesson in three steps",
  step1: "Search a topic",
  step1Desc: "Type a question or topic in the search bar above.",
  step2: "Add it to your deck",
  step2Desc: "Click “+ Add to Slide” on the answer you like.",
  step3: "Edit, then present",
  step3Desc: "Tweak the wording, then press Present for a full-screen view.",
  generateTitle: "✨ Generate a Slide",
  generateSubtitle: "Built from the Grady's Garden curriculum.",
  topicPlaceholder: "Topic: e.g. Root Vegetables",
  generate: "Generate",
  generating: "Generating...",
  untitled: "Untitled",
  untitledSlide: "Untitled slide",
  noImage: "No image yet",
  slideTitlePlaceholder: "Slide title",
  addPoint: "+ Add point",
  removePoint: "Remove point",
  layoutBullets: "Bullets",
  layoutBulletsImage: "Bullets + Image",
  imageUrlPlaceholder: "Image URL...",
  removeSlide: "Remove slide",

  // sidebar
  factOfTheDay: "🌱 Fact of the Day",
  loadingFact: "Loading today's fact…",
  factFallbackError: "Couldn't load a fact right now.",
  showDifferentFact: "Show a different fact",
  savedTopics: "Saved Topics",
  nothingSaved: "Nothing saved yet. Tap + to add one.",
  viewAll: "View all →",
  save: "Save",
  saved: "Saved",

  // presenter
  present: "▶ Present",
  presentHint: "← → to move · Esc to exit",
  previous: "Previous",
  next: "Next",
  exitPresenting: "Exit",

  // tooltips
  tipLanguage: "Translate this whole page between English and Spanish.",
  tipSearch: "Look up any topic. We check your verified curriculum first.",
  tipBadgeCurriculum: "This answer comes straight from your verified curriculum.",
  tipBadgeAi:
    "No curriculum match, so AI wrote this. Double-check it before teaching.",
  tipAddToSlide: "Add this answer to your lesson deck as a new slide.",
  tipSave: "Bookmark this topic so you can find it later.",
  tipBlankSlide: "Start with an empty slide and write your own.",
  tipGenerateSlide: "Type a topic and we'll draft a slide from your curriculum.",
  tipExport: "Send this deck to Google Slides. Coming soon.",
  tipPresent: "Show your slides full screen for the class.",
  tipReport: "Is something wrong or off-topic? Tell us and we'll review it.",

  // report
  report: "Report",
  reportTitle: "What went wrong?",
  reasonInaccurate: "Inaccurate",
  reasonInappropriate: "Inappropriate",
  reasonOffTopic: "Off-topic",
  reasonOther: "Other",
  reportNotePlaceholder: "Anything else we should know? (optional)",
  reportSubmit: "Send report",
  reportSending: "Sending...",
  reportThanks: "Thanks, reported ✓",
  reportFailed: "Couldn't send the report. Try again.",
  cancel: "Cancel",
} as const;

// --- Curriculum sections -----------------------------------------------

export const CURRICULUM_SECTIONS = [
  "Root Vegetables (Unit 2, Ch. 3)",
  "Fruits vs. Vegetables (Unit 1, Ch. 1)",
  "Leafy Greens (Unit 3, Ch. 2)",
  "Nightshades (Unit 2, Ch. 5)",
  "Garden-to-Table (Unit 4, Ch. 1)",
  "Plant Diversity (Unit 1, Ch. 4)",
];

export function matchCurriculumSection(query: string): string {
  const q = query.toLowerCase();

  const hit = CURRICULUM_SECTIONS.find((section) =>
    section
      .toLowerCase()
      .split(/[^a-z]+/)
      .some((word) => word.length > 3 && q.includes(word))
  );

  return (
    hit ??
    CURRICULUM_SECTIONS[Math.floor(Math.random() * CURRICULUM_SECTIONS.length)]
  );
}

// --- Slide factories ---------------------------------------------------

export function makeTemplateSlide(): LessonSlide {
  return {
    id: crypto.randomUUID(),
    title: "New Topic",
    points: ["Key idea one", "Key idea two", "Key idea three"],
    layout: "bullets",
    imageUrl: "",
    accent: "from-teal-100 to-emerald-50",
  };
}

export function slideFromSearchResult(
  result: {
    title: string;
    teacherSummary: string;
    studentBullets: string[];
    source?: "curriculum" | "ai";
  },
  accent: string
): LessonSlide {
  return {
    id: crypto.randomUUID(),
    title: result.title,
    points:
      result.studentBullets.length > 0
        ? result.studentBullets
        : [result.teacherSummary],
    layout: "bullets",
    imageUrl: "",
    accent,
    source: result.source,
  };
}