// --- Gemini lesson generator ----------------------------------------------
// Client-side call to the Gemini API for the personalized lessons demo.
// The API key ships in the browser bundle via VITE_GEMINI_API_KEY, which is
// fine for a local demo but must not be used once this app is deployed
// publicly (see PersonalizedLessons discussion) — move this behind a
// Firebase Cloud Function first if that happens.

import { GoogleGenerativeAI } from "@google/generative-ai";

export class LessonGenerationError extends Error {}
export class CurriculumSearchError extends Error {}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export type QuestionResults = Record<string, Record<string, boolean>>;

function buildPrompt(questions: QuestionResults): string {
    const lines = Object.entries(questions).map(([question, answerMap]) => {
        const [studentAnswer, wasCorrect] = Object.entries(answerMap)[0] ?? ["", false];
        return `- "${question}" — student answered "${studentAnswer}" (${wasCorrect ? "correct" : "incorrect"})`;
    });

    return [
        "You are creating a short, encouraging personalized lesson for a young child",
        "learning about fruits and vegetables, based on their quiz results below.",
        "Focus on the questions they got wrong, gently correct any misconceptions, ask a new question to reinforce learning,",
        "and keep it under 70 words in simple, friendly language. dont use * character or hearts unless necessary but food icons are lightly encouraged ",
        "",
        "Quiz results:",
        ...lines,
    ].join("\n");
}

export async function generatePersonalizedLesson(questions: QuestionResults): Promise<string> {
    if (!apiKey) {
        throw new LessonGenerationError(
            "Missing VITE_GEMINI_API_KEY. Add it to a .env file to enable lesson generation."
        );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    try {
        const result = await model.generateContent(buildPrompt(questions));
        return result.response.text();
    } catch (err) {
        throw new LessonGenerationError(
            err instanceof Error ? err.message : "Lesson generation failed."
        );
    }
}

// --- Curriculum "search" (copilot demo) ------------------------------------
// This stands in for RAG search over the verified curriculum db. For the
// pitch demo there's no vector index behind it yet, so a query just asks
// Gemini to answer as if it had already retrieved the matching curriculum
// section. Once the Firestore vector db + Vertex AI retrieval step exists,
// swap this out for: retrieve top-k chunks -> pass them in as context ->
// generate the same shape of result.
//
// Two reading levels come back on purpose: `teacherSummary` is prep-level
// context for the adult, `studentBullets` is what actually lands on the
// slide — short (5-10 words), present tense, K-6 vocabulary. The search
// result card is also reused as the "generate a slide from a topic" input,
// since both are really the same request: "tell me about X at both levels."

export interface CurriculumSearchResult {
    title: string;
    teacherSummary: string;
    studentBullets: string[];
}

function buildSearchPrompt(query: string): string {
    return [
        "You are helping a K-6 teacher prep a lesson from a fruits-and-vegetables",
        "curriculum. Given the topic or question below, respond with ONLY valid JSON",
        "(no markdown fences, no extra text) in exactly this shape:",
        '{"title": "...", "teacherSummary": "...", "studentBullets": ["...", "..."]}',
        "",
        "- title: short topic title, under 8 words.",
        "- teacherSummary: 2-3 sentences of prep context, written for the teacher.",
        "- studentBullets: 3-5 bullet points a K-6 student could read or hear aloud.",
        "  Each bullet is 5-10 words, present tense, simple everyday vocabulary,",
        "  no jargon, one idea per bullet — this is what goes on the slide.",
        "",
        `Topic: "${query}"`,
    ].join("\n");
}

function parseSearchResponse(rawText: string, fallbackQuery: string): CurriculumSearchResult {
    const cleaned = rawText.trim().replace(/^```json\s*|^```\s*|```$/g, "").trim();

    try {
        const parsed = JSON.parse(cleaned);
        if (
            typeof parsed.title === "string" &&
            typeof parsed.teacherSummary === "string" &&
            Array.isArray(parsed.studentBullets)
        ) {
            return {
                title: parsed.title,
                teacherSummary: parsed.teacherSummary,
                studentBullets: parsed.studentBullets.filter(
                    (b: unknown): b is string => typeof b === "string"
                ),
            };
        }
    } catch {
        // fall through — the model didn't return valid JSON this time
    }

    // Best-effort fallback so the feature still works even if the model
    // ignores the JSON instruction: use the raw text as the teacher summary
    // and naively split it into bullets (not guaranteed to be kid-level).
    return {
        title: fallbackQuery,
        teacherSummary: cleaned,
        studentBullets: cleaned
            .split(/(?<=[.!?])\s+/)
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 5),
    };
}

export async function searchCurriculum(query: string): Promise<CurriculumSearchResult> {
    if (!apiKey) {
        throw new CurriculumSearchError(
            "Missing VITE_GEMINI_API_KEY. Add it to a .env file to enable search."
        );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    try {
        const result = await model.generateContent(buildSearchPrompt(query));
        return parseSearchResponse(result.response.text(), query);
    } catch (err) {
        throw new CurriculumSearchError(
            err instanceof Error ? err.message : "Curriculum search failed."
        );
    }
}