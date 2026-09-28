import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import VeggieFooter from "../components/VeggieFooter";
import QuizIllustration from "../components/QuizIllustration";
import SkillRadar from "../components/SkillRadar";
import { generateQuiz, gradeQuiz, skills, skillStats, students, type Student } from "../data/practiceQuiz";

const buttonClass = "rounded-2xl bg-teal-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-40";

export default function StudentPractice() {
  const { studentId } = useParams();
  const student = students.find((item) => item.studentId === studentId);
  if (!student) return <main className="p-8"><h1 className="text-2xl font-bold">Student not found</h1><Link to="/lessons" className="text-teal-700 underline">Back to students</Link></main>;
  return <Practice key={student.studentId} student={student} />;
}

function Practice({ student }: { student: Student }) {
  const [questions] = useState(() => generateQuiz(student.observations));
  const [answers, setAnswers] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [index, complete]);
  const question = questions[index];
  const results = complete ? gradeQuiz(questions, answers) : [];
  const after = [...student.observations, ...results];
  const strengths = skills.filter((skill) => (skillStats(after, skill).accuracy ?? 0) >= 75);
  const improvement = skills.filter((skill) => (skillStats(after, skill).accuracy ?? 0) < 75);
  const knownStrengths = skills.filter((skill) => (skillStats(student.observations, skill).accuracy ?? 0) >= 75);

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-teal-50 to-white text-teal-950">
      <header className="bg-teal-800 px-6 py-4 text-white shadow-md"><div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-teal-200">Grady's Garden · Practice time</p><h1 className="text-xl font-bold">Student {student.studentId}'s garden quiz</h1></div><Link to="/lessons" className="rounded-xl border border-teal-400 px-3 py-2 text-sm hover:bg-teal-700">Back to students</Link></div></header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
        {!complete ? <>
          <p className="text-sm leading-relaxed">{knownStrengths.length ? `Let's build on your strengths in ${knownStrengths.join(", ").toLowerCase()}!` : "Let's grow your garden knowledge, one question at a time!"} Five questions cover familiar skills and new areas to explore.</p>
          <div><p className="mb-2 text-sm font-semibold">Question {index + 1} of 5</p><progress aria-label="Questions answered" value={answers.length} max={5} className="h-3 w-full accent-teal-700" /></div>
          <section className="rounded-3xl border border-teal-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="mb-3 text-sm font-semibold text-teal-700">{question.skill} · {question.challenge ? "Strength challenge" : "Build your skills"}</p>
            <h2 ref={heading} tabIndex={-1} className="mb-6 text-2xl font-bold outline-none">{question.prompt}</h2>
            <QuizIllustration picture={question.picture} />
            <fieldset><legend className="sr-only">Choose one answer</legend><div className="flex flex-col gap-3">{question.options.map((option, choice) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${answers[index] === choice ? "border-teal-700 bg-teal-50" : "border-slate-200 hover:border-teal-400"}`}><input type="radio" name={question.id} checked={answers[index] === choice} onChange={() => setAnswers((previous) => { const next = [...previous]; next[index] = choice; return next; })} className="h-5 w-5 shrink-0 accent-teal-700" /><span>{option}</span></label>)}</div></fieldset>
            <div className="mt-6 flex items-center justify-between gap-4"><button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)} className="rounded-xl px-3 py-2 font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-40">Previous</button><button type="button" className={buttonClass} disabled={answers[index] === undefined} onClick={() => { if (index === 4) { gradeQuiz(questions, answers); setComplete(true); } else setIndex(index + 1); }}>{index === 4 ? "Finish quiz" : "Next question"}</button></div>
          </section>
        </> : <>
          <section className="rounded-3xl bg-teal-800 p-6 text-white"><p className="text-sm text-teal-100">Student {student.studentId} · Practice complete</p><h2 ref={heading} tabIndex={-1} className="mt-2 text-3xl font-bold outline-none">You got {results.filter((result) => result.correct).length} out of 5 correct!</h2><p className="mt-2">Every question helps your knowledge grow. Here's what to celebrate and practice next.</p></section>
          <section className="rounded-3xl border border-teal-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-bold">Your strengths & growing skills</h2><SkillRadar before={student.observations} after={after} /><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-teal-50 p-4"><h3 className="font-bold">Current strengths</h3><p className="mt-2 text-sm">{strengths.length ? strengths.join(" · ") : "You're building your foundations. Keep exploring!"}</p><p className="mt-2 text-xs text-slate-600">75% or higher across recorded answers.</p></div><div className="rounded-2xl bg-amber-50 p-4"><h3 className="font-bold">Keep practicing</h3><p className="mt-2 text-sm">{improvement.length ? improvement.join(" · ") : "Great work across all five skills! Try explaining what you learned to a friend."}</p></div></div></section>
          <section className="rounded-3xl border border-teal-200 bg-white p-6"><h2 className="text-xl font-bold">Learn from your answers</h2><ol className="mt-4 space-y-5">{questions.map((item, i) => <li key={item.id}><QuizIllustration picture={item.picture} review /><h3 className="font-semibold">{i + 1}. {item.prompt}</h3><p className={`mt-1 text-sm font-semibold ${results[i].correct ? "text-teal-700" : "text-amber-800"}`}>{results[i].correct ? "Correct" : "Keep growing"} · Your answer: {item.options[answers[i]]}</p>{!results[i].correct && <p className="mt-1 text-sm">Correct answer: {item.options[item.answer]}</p>}<p className="mt-1 text-sm text-slate-600">{item.explanation}</p></li>)}</ol></section>
          <p className="text-xs text-slate-500">Demo practice results stay on this page until you leave or refresh.</p>
          <Link to="/lessons" className={`${buttonClass} self-start`}>Back to students</Link>
        </>}
      </main>
      <VeggieFooter />
    </div>
  );
}
