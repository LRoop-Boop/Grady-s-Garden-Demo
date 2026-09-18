import { skills, skillStats, type Observation } from "../data/practiceQuiz";

export default function SkillRadar({ before, after }: { before: Observation[]; after: Observation[] }) {
  function point(index: number, percent: number) {
    const angle = index * 2 * Math.PI / skills.length - Math.PI / 2;
    return [220 + Math.cos(angle) * 125 * percent / 100, 180 + Math.sin(angle) * 125 * percent / 100];
  }
  const polygon = (values: number[]) => values.map((value, i) => point(i, value).join(",")).join(" ");
  return (
    <div>
      <svg viewBox="0 0 440 360" className="mx-auto w-full max-w-lg" role="img" aria-labelledby="radar-title radar-description">
        <title id="radar-title">Student skill accuracy before and after practice</title>
        <desc id="radar-description">Accuracy from zero at the center to 100 percent at the outside. Exact scores and question counts are in the table below. Unassessed prior skills are plotted at zero.</desc>
        {[25, 50, 75, 100].map((value) => <polygon key={value} points={polygon(skills.map(() => value))} fill={value === 100 ? "#f0fdfa" : "none"} stroke="#99c9c1" />).reverse()}
        {skills.map((skill, i) => {
          const [x, y] = point(i, 100);
          const [labelX, labelY] = point(i, 120);
          return <g key={skill}><line x1="220" y1="180" x2={x} y2={y} stroke="#99c9c1" /><text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill="#134e4a" fontSize="12">{skill}</text></g>;
        })}
        <polygon points={polygon(skills.map((skill) => skillStats(before, skill).accuracy ?? 0))} fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="6 4" />
        <polygon points={polygon(skills.map((skill) => skillStats(after, skill).accuracy ?? 0))} fill="#0d948833" stroke="#0f766e" strokeWidth="3" />
        {skills.map((skill, i) => { const [x, y] = point(i, skillStats(after, skill).accuracy ?? 0); return <circle key={skill} cx={x} cy={y} r="4" fill="#0f766e" />; })}
        {[25, 50, 75, 100].map((value) => <text key={value} x="225" y={180 - 125 * value / 100 + 4} fill="#475569" fontSize="10">{value}%</text>)}
      </svg>
      <p className="text-center text-sm text-slate-600">Dashed gray: before quiz · Solid teal: after quiz</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Skill accuracy and evidence</caption>
          <thead><tr className="border-b border-teal-200"><th className="py-2">Skill</th><th>Before</th><th>After</th><th>Evidence</th></tr></thead>
          <tbody>{skills.map((skill) => { const prior = skillStats(before, skill); const current = skillStats(after, skill); return <tr key={skill} className="border-b border-teal-100"><th className="py-3 font-medium">{skill}</th><td>{prior.accuracy === null ? "Unassessed" : `${prior.accuracy}%`}</td><td>{current.accuracy}%</td><td>{current.correct}/{current.total} correct</td></tr>; })}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-600">After-quiz accuracy combines recorded prior answers with this practice quiz. Unassessed prior skills appear at the center, not as a measured zero. With only a few answers per skill, these are early practice signals, not a mastery assessment. The original overall score is separate.</p>
    </div>
  );
}
