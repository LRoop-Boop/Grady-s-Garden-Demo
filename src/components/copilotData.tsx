// Types, static curriculum data, and small pure helpers for the Copilot page.

// --- Types -------------------------------------------------------------

export type SlideLayout = "bullets" | "bullets-image";

export interface LessonSlide {
  id: string;
  title: string;
  points: string[];
  layout: SlideLayout;
  imageUrl: string;
  accent: string;
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

// --- Fact of the day ---------------------------------------------------

export const FACTS_OF_THE_DAY = [
  "Carrots were originally purple — the orange variety was bred in the Netherlands in the 1600s.",
  "A tomato has more genes than a human — about 31,000 compared to our 20,000-ish.",
  "Broccoli is technically a flower — the florets are unopened flower buds.",
  "Potatoes were the first vegetable grown in space, aboard the Columbia shuttle in 1995.",
  "Corn is a grass, not a vegetable in the botanical sense — it's a member of the grain family.",
];

export function todaysFactIndex(): number {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return dayIndex % FACTS_OF_THE_DAY.length;
}

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
  result: { title: string; teacherSummary: string; studentBullets: string[] },
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
  };
}