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

// Fact of the day now comes from the RAG (see getFactOfTheDay in lib/gemini.ts)
// instead of a static array.

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