import type { HomeActivityResult } from "../lib/gemini";
import { UI_STRINGS } from "./copilotData";

export const PLAN_STORAGE_KEY = "parent_copilot_plan";
// Separate from the teacher page's cache: this one is keyed "lang:text".
export const PARENT_CACHE_KEY = "parent_copilot_translation_cache";

export interface PlanItem extends HomeActivityResult {
  id: string;
}

export const PARENT_UI_STRINGS = {
  pageEyebrow: "Grady's Garden · Veggie Adventure",
  pageTitle: "Parent Copilot",
  searchPlaceholder: "Search: e.g. My kid won't eat broccoli",
  searchHelper:
    "Get a home activity, conversation starters, and nutrition ideas. Answers come from the Grady's Garden curriculum when available.",
  loadingActivity: "Finding something to try at home...",
  learning: "What your child is learning",
  tryAtHome: "Try at home",
  materials: "You'll need",
  steps: "Steps",
  talkAboutIt: "Talk about it",
  nutritionTip: "🥕 Nutrition tip",
  myPlan: "My Plan",
  planEmpty: "Nothing saved yet. Search for a topic and tap Save.",
  remove: "Remove",
  tipOfTheDay: "💡 Tip of the Day",
  loadingTip: "Loading today's tip…",
  tipFallbackError: "Couldn't load a tip right now.",
  showDifferentTip: "Show a different tip",

  // tooltips (parent wording)
  tipLanguage: "Translate this page into English, Spanish, or French.",
  tipSearch:
    "Ask anything: a picky eater, something from class, a dinner-table question.",
  tipBadgeCurriculum:
    "This comes straight from the Grady's Garden curriculum your child's class uses.",
  tipBadgeAi:
    "No curriculum match, so AI wrote this. Use your own judgment before trying it with your child.",
} as const;

// Shared strings from UI_STRINGS that the parent page actually uses. Listed
// explicitly (instead of Object.values(UI_STRINGS)) so we don't burn the
// MyMemory quota translating the whole deck editor.
const SHARED_KEYS = [
  "searchButtonIdle",
  "searchButtonLoading",
  "foundInLabel",
  "fromCurriculumBadge",
  "aiGeneratedBadge",
  "save",
  "saved",
  "tipSave",
  "tipReport",
  "report",
  "reportTitle",
  "reasonInaccurate",
  "reasonInappropriate",
  "reasonOffTopic",
  "reasonOther",
  "reportNotePlaceholder",
  "reportSubmit",
  "reportSending",
  "reportThanks",
  "reportFailed",
  "cancel",
] as const;

export const PARENT_STATIC_TEXTS: string[] = [
  ...Object.values(PARENT_UI_STRINGS),
  ...SHARED_KEYS.map((k) => UI_STRINGS[k]),
];

/** Every dynamic string in an activity, for batch translation. */
export function activityTexts(a: HomeActivityResult): string[] {
  return [
    a.title,
    a.learningBlurb,
    a.activity.name,
    a.activity.time,
    ...a.activity.materials,
    ...a.activity.steps,
    ...a.conversationStarters,
    a.nutritionTip,
  ];
}