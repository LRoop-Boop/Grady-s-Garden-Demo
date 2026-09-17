// Lesson generation is temporarily disabled.
// import { useState } from "react";
import { Link } from "react-router-dom";
import { skills, skillStats, students } from "../data/practiceQuiz";
// import { type Student } from "../data/practiceQuiz";
// import { generatePersonalizedLesson, LessonGenerationError } from "../lib/gemini.ts";
import VeggieFooter from "../components/VeggieFooter";

export default function PersonalizedLessons() {
  /* Lesson generation state and handler disabled for now.
  const [lessons, setLessons] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleGenerate(result: Student) {
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
  */

  const gardenIcons = ["🥕", "🍅", "🥦", "🌽", "🍓"];

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9f4] text-teal-950">
      <header className="border-b border-teal-900/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">
            <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-800 text-2xl">🌱</span>
            <span><span className="block text-lg font-bold tracking-tight">Grady's Garden</span><span className="block text-xs text-teal-700">Little lessons. Big growth.</span></span>
          </Link>
          <Link to="/" className="rounded-xl border border-teal-900/15 px-4 py-2 text-sm font-semibold transition hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">Home <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <section aria-labelledby="page-title" className="relative overflow-hidden rounded-4xl bg-teal-900 p-7 text-white sm:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-24 h-80 w-80 rounded-full border-45 border-teal-800/70" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">A little practice, a lot of possibility</p>
            <h1 id="page-title" className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Personalized Lessons</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-teal-100">Help every learner bloom. Choose a student to start a garden quiz built around their strengths and growing skills.</p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2"><strong>{students.length}</strong> students</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2"><strong>5</strong> questions per quiz</span>
              <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2"><strong>{skills.length}</strong> garden skills</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="students-title" className="mt-9">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><h2 id="students-title" className="text-2xl font-bold tracking-tight">Your growing gardeners</h2><p className="mt-1 text-sm text-slate-600">A personal starting point for every student.</p></div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">Demo classroom</span>
          </div>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {students.map((result, index) => {
              const strengths = skills.filter((skill) => (skillStats(result.observations, skill).accuracy ?? 0) >= 75);
              const practice = skills.filter((skill) => {
                const accuracy = skillStats(result.observations, skill).accuracy;
                return accuracy !== null && accuracy < 75;
              });
              return (
                <li key={result.studentId} className="flex flex-col rounded-3xl border border-teal-900/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f1f5e9] text-3xl">{gardenIcons[index % gardenIcons.length]}</span>
                    <div><h3 className="text-lg font-bold">Student {result.studentId}</h3><p className="mt-0.5 text-xs text-slate-500">Garden explorer</p></div>
                  </div>
                  <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2"><span className="text-xs font-medium text-slate-600">Prior quiz score</span><span className="text-2xl font-bold tracking-tight text-teal-800">{result.score}<span className="ml-0.5 text-sm font-medium">%</span></span></div>
                    <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-teal-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${result.score}%` }} /></div>
                  </div>
                  <div className="mb-6 mt-5 flex-1 space-y-4">
                    <div><p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-700">Build on strengths</p>{strengths.length ? <ul className="flex flex-wrap gap-1.5">{strengths.map((skill) => <li key={skill} className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">{skill}</li>)}</ul> : <p className="text-sm text-slate-500">Let's discover their strengths.</p>}</div>
                    <div><p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">Room to grow</p><p className="text-sm leading-relaxed text-slate-600">{practice.length ? practice.join(" · ") : "Explore new skills and stretch what they know."}</p></div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <p className="mb-3 text-xs text-slate-500">5 questions · Skill radar at the finish</p>
                    <Link to={`/lessons/${result.studentId}/practice`} aria-label={`Generate Quiz for Student ${result.studentId}`} className="flex w-full items-center justify-between rounded-xl bg-teal-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">Generate Quiz <span aria-hidden="true">→</span></Link>
                {/* Lesson generation disabled for now.
                <button
                  type="button"
                  disabled={loadingId === result.studentId}
                  onClick={() => handleGenerate(result)}
                  className="rounded-2xl border-2 border-teal-700 bg-teal-700 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loadingId === result.studentId ? "Generating..." : "Generate Lesson"}
                </button>
                */}
                  </div>
              {/* Lesson generation feedback disabled for now.
              {errors[result.studentId] && (
                <p className="text-sm font-medium text-rose-600">{errors[result.studentId]}</p>
              )}
              {lessons[result.studentId] && (
                <p className="rounded-2xl bg-white/70 px-4 py-2 text-teal-900">
                  {lessons[result.studentId]}
                </p>
              )}
              */}
                </li>
              );
            })}
          </ul>
          <p className="mt-5 text-xs leading-relaxed text-slate-500">Skill highlights come from recorded answers. Each practice quiz also introduces areas the student hasn't explored yet.</p>
        </section>
      </main>
      <VeggieFooter />
    </div>
  );
}
