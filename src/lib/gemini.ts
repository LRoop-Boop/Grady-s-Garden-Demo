// --- Gemini lesson generator ----------------------------------------------
// Client-side call to the Gemini API for the personalized lessons demo.
// The API key ships in the browser bundle via VITE_GEMINI_API_KEY, which is
// fine for a local demo but must not be used once this app is deployed
// publicly (see PersonalizedLessons discussion) — move this behind a
// Firebase Cloud Function first if that happens.

import { GoogleGenerativeAI } from "@google/generative-ai";

export class LessonGenerationError extends Error {}

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
