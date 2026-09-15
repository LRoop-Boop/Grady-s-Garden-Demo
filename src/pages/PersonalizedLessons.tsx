import { useState } from "react";
import { generatePersonalizedLesson, LessonGenerationError } from "../lib/gemini.ts";
import VeggieFooter from "../components/VeggieFooter";

// Stores result of quiz generation call
export default function PersonalizedLessons() {
  const [lessons, setLessons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleGenerate(result: QuizResults) {
    setLoadingId(result.studentId);
    setErrors((prev) => ({ ...prev, [result.studentId]: "" }));
    try {
      const lesson = await generatePersonalizedLesson(result.questions);
      setLessons((prev) => ({ ...prev, [result.studentId]: lesson }));
    } catch (err) {
      const message = err instanceof LessonGenerationError ? err.message : "Something went wrong.";
      setErrors((prev) => ({ ...prev, [result.studentId]: message }));
    } finally {
      setLoadingId(null);
    }
  }

  // Describes object for student quiz results
  interface QuizResults {
    studentId: string;
    quizId: string;
    score: number;
    questions: Record<string, Record<string, boolean>>;
  }

  const quizResults: QuizResults[] = [
    {studentId: '1', quizId: '000', score: 70, questions: {'Are Carrots Green?': {"Yes": false}}},
    {studentId: '2', quizId: '001', score: 85, questions: {'Is a Tomato a Fruit?': {"Yes": true}, 'Are Bananas Yellow?': {"Yes": true}}},
    {studentId: '3', quizId: '000', score: 60, questions: {'Do Apples Grow on Trees?': {"No": false}}},
    {studentId: '4', quizId: '002', score: 95, questions: {'Is Broccoli a Vegetable?': {"Yes": true}, 'Are Strawberries Red?': {"Yes": true}, 'Do Potatoes Grow Underground?': {"Yes": true}}},
    {studentId: '5', quizId: '001', score: 40, questions: {'Is a Cucumber a Fruit?': {"No": false}, 'Are Oranges Purple?': {"No": true}}},
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-linear-to-b from-teal-50 to-white">
      <header className="flex shrink-0 items-center justify-between bg-teal-800 px-6 py-4 text-white shadow-md">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
            Grady's Garden · Veggie Adventure
          </p>
          <h1 className="text-xl font-bold sm:text-2xl">Personalized Lessons</h1>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto px-6 py-6">
        <ul className="flex w-full max-w-2xl flex-col gap-4">
          {quizResults.map((result) => (
            <li
              key={result.studentId}
              className="flex flex-col gap-2 rounded-3xl border-2 border-teal-700/20 bg-linear-to-b from-teal-100 to-emerald-50 p-6 shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-teal-900">
                  Student {result.studentId} · Score {result.score}
                </span>
                <button
                  type="button"
                  disabled={loadingId === result.studentId}
                  onClick={() => handleGenerate(result)}
                  className="rounded-2xl border-2 border-teal-700 bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loadingId === result.studentId ? "Generating..." : "Generate Lesson"}
                </button>
              </div>
              {errors[result.studentId] && (
                <p className="text-sm font-medium text-rose-600">{errors[result.studentId]}</p>
              )}
              {lessons[result.studentId] && (
                <p className="rounded-2xl bg-white/70 px-4 py-2 text-teal-900">
                  {lessons[result.studentId]}
                </p>
              )}
            </li>
          ))}
        </ul>
      </main>

      <VeggieFooter />
    </div>
  );
}
