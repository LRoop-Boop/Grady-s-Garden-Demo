import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { parseResult, summarizeResults, type DashboardResult, type DashboardStudent } from '../lib/dashboard';

const datasetId = 'garden-demo-v1';
const percent = (value: number | null) => value === null ? '—' : `${value.toFixed(1)}%`;
const dateLabel = (value: Date) => value.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
const panel = 'rounded-3xl border border-teal-900/10 bg-white p-6 shadow-sm';

export default function Dashboard() {
  const [students, setStudents] = useState<DashboardStudent[] | null>(null);
  const [results, setResults] = useState<DashboardResult[] | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [classroom, setClassroom] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const fail = (cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load Firestore data.');
    const stopStudents = onSnapshot(query(collection(db, 'students'), where('datasetId', '==', datasetId)), snapshot => {
      try {
        setStudents(snapshot.docs.map(document => {
          const value = document.data();
          if (typeof value.studentId !== 'string' || typeof value.displayName !== 'string' || typeof value.classroomId !== 'string') throw new Error('A student record has missing fields.');
          return { studentId: value.studentId, displayName: value.displayName, classroomId: value.classroomId };
        }));
      } catch (cause) { fail(cause); }
    }, fail);
    const stopResults = onSnapshot(query(collection(db, 'quizResults'), where('datasetId', '==', datasetId)), snapshot => {
      try { setResults(snapshot.docs.map(document => parseResult(document.data()))); } catch (cause) { fail(cause); }
    }, fail);
    return () => { stopStudents(); stopResults(); };
  }, [retry]);
  const classrooms = [...new Set([...(students ?? []).map(student => student.classroomId), ...(results ?? []).map(result => result.classroomId)])].sort();
  const selectedResults = useMemo(() => (results ?? []).filter(result => classroom === 'all' || result.classroomId === classroom), [results, classroom]);
  const selectedStudents = (students ?? []).filter(student => classroom === 'all' || student.classroomId === classroom);
  const summary = useMemo(() => summarizeResults(selectedResults), [selectedResults]);
  const rows = selectedStudents.map(student => {
    const attempts = selectedResults.filter(result => result.studentId === student.studentId).sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
    return { ...student, attempts, average: summarizeResults(attempts).average, latest: attempts.at(-1) };
  }).filter(student => student.displayName.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.displayName.localeCompare(b.displayName));
  const loading = students === null || results === null;
  const assessed = new Set(selectedResults.map(result => result.studentId)).size;

  return <div className="min-h-screen bg-[#f7f9f4] text-teal-950">
    <header className="border-b border-teal-900/10 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
      <Link to="/" className="flex items-center gap-3"><span aria-hidden="true" className="rounded-2xl bg-teal-800 p-3 text-xl">🌱</span><span><strong className="block text-lg">Grady's Garden</strong><span className="text-xs text-teal-700">Little lessons. Big growth.</span></span></Link>
      <nav aria-label="Main navigation" className="flex gap-4 text-sm font-semibold"><Link to="/">Home</Link><Link to="/lessons">Personalized Lessons</Link></nav>
    </div></header>
    <main className="mx-auto max-w-7xl space-y-7 px-5 py-8 sm:px-8">
      <section className="rounded-4xl bg-teal-900 p-7 text-white sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-200">Classroom insights</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">See your garden grow.</h1>
        <p className="mt-3 max-w-xl text-teal-100">Explore what students are learning, celebrate their progress, and find the skills that need a little more care.</p>
        <span className="mt-5 inline-block rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">Demo dataset · Fictional students and quiz results</span>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Learning overview</h2><p className="mt-1 text-sm text-slate-600">All recorded dates · Updates from Firestore automatically</p></div>
        <label className="flex items-center gap-3 text-sm font-semibold">Classroom<select value={classroom} onChange={event => setClassroom(event.target.value)} className="rounded-xl border border-teal-900/20 bg-white p-3"><option value="all">All classrooms</option>{classrooms.map((id, index) => <option key={id} value={id}>Demo classroom {index + 1}</option>)}</select></label>
      </div>
      {error ? <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h2 className="font-bold">Couldn't load the dashboard</h2><p className="mt-2 break-words text-sm">{error}</p><button type="button" className="mt-4 rounded-xl bg-teal-800 px-4 py-2 font-semibold text-white" onClick={() => { setError(''); setStudents(null); setResults(null); setRetry(value => value + 1); }}>Try again</button></div> : loading ? <p role="status" className={panel}>Loading student results…</p> : <>
        <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
          ['Average quiz score', percent(summary.average), 'Each completed quiz counts equally'],
          ['Students assessed', `${assessed} / ${selectedStudents.length}`, 'Students with a recorded quiz'],
          ['Quizzes completed', String(selectedResults.length), `${summary.total} answers recorded`],
          ['Answer accuracy', percent(summary.accuracy), 'Correct answers ÷ all answers'],
        ].map(([label, value, detail]) => <div className={panel} key={label}><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-3 text-3xl font-bold text-teal-800">{value}</p><p className="mt-2 text-xs text-slate-500">{detail}</p></div>)}</section>
        {!selectedResults.length && <p role="status" className={panel}>No quiz results yet for this classroom. Recorded results will appear here automatically.</p>}
        <div className="grid gap-6 lg:grid-cols-2">
          <section className={panel}><h2 className="text-lg font-bold">Progress over time</h2><p className="mt-1 text-sm text-slate-500">Average quiz score by week · UTC</p>
            <div className="mt-6 space-y-5">{summary.weeks.map(week => <div key={week.date}><div className="mb-2 flex justify-between gap-3 text-sm"><span>Week of {dateLabel(new Date(week.date))} <span className="text-slate-500">· {week.count} quizzes</span></span><strong>{percent(week.average)}</strong></div><div aria-hidden="true" className="h-3 rounded-full bg-teal-50"><div className="h-3 rounded-full bg-teal-600" style={{ width: `${week.average}%` }} /></div></div>)}{!summary.weeks.length && <p className="text-sm text-slate-500">No progress data yet.</p>}</div>
          </section>
          <section className={panel}><h2 className="text-lg font-bold">Room to grow</h2><p className="mt-1 text-sm text-slate-500">Skill accuracy, starting with the most practice needed</p><div className="mt-6 space-y-4">{summary.skills.map(skill => <div key={skill.name}><div className="mb-2 flex justify-between gap-3 text-sm"><span>{skill.name} <span className="text-slate-500">· {skill.total} answers</span></span><strong>{percent(skill.accuracy)}</strong></div><div aria-hidden="true" className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${skill.accuracy < 60 ? 'bg-amber-500' : 'bg-teal-600'}`} style={{ width: `${skill.accuracy}%` }} /></div></div>)}{!summary.skills.length && <p className="text-sm text-slate-500">No skills assessed yet.</p>}</div></section>
        </div>
        <section className={panel}><div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Your growing gardeners</h2><p className="mt-1 text-sm text-slate-500">Individual averages across all recorded attempts</p></div><label className="text-sm"><span className="sr-only">Search students</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search students…" className="w-full rounded-xl border border-teal-900/20 p-3 sm:w-64" /></label></div>
          <div className="mt-5 overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><caption className="sr-only">Student quiz performance</caption><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr>{['Student', 'Quizzes', 'Average', 'Latest score', 'Last activity (UTC)'].map(label => <th key={label} scope="col" className="px-3 py-4">{label}</th>)}</tr></thead><tbody>{rows.map(student => <tr key={student.studentId} className="border-b border-slate-100 last:border-0"><th scope="row" className="px-3 py-4 font-semibold">{student.displayName}</th><td className="px-3 py-4">{student.attempts.length}</td><td className="px-3 py-4 font-bold text-teal-800">{percent(student.average)}</td><td className="px-3 py-4">{percent(student.latest ? summarizeResults([student.latest]).average : null)}</td><td className="px-3 py-4 text-slate-500">{student.latest ? dateLabel(student.latest.completedAt) : 'Not assessed'}</td></tr>)}</tbody></table>{!rows.length && <p className="py-8 text-center text-sm text-slate-500">No students match this selection.</p>}</div>
        </section>
        <p className="pb-4 text-xs leading-relaxed text-slate-500">These mock results are based on verified curriculum. Skill accuracy reflects recorded answers, not a mastery assessment. The separate practice demo does not yet save new quiz attempts.</p>
      </>}
    </main>
  </div>;
}
