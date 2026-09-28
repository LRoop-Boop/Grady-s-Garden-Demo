export interface DashboardStudent { studentId: string; displayName: string; classroomId: string }
export interface DashboardResult {
  studentId: string;
  classroomId: string;
  completedAt: Date;
  answers: { skill: string; topic: string; correct: boolean }[];
}

export function summarizeResults(results: DashboardResult[]) {
  const groups = new Map<string, { correct: number; total: number }>();
  const weeks = new Map<string, { sum: number; count: number }>();
  let correct = 0;
  let total = 0;
  let scoreSum = 0;
  for (const result of results) {
    const count = result.answers.filter(answer => answer.correct).length;
    const score = count / result.answers.length * 100;
    correct += count;
    total += result.answers.length;
    scoreSum += score;
    const monday = new Date(result.completedAt);
    monday.setUTCHours(0, 0, 0, 0);
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    const key = monday.toISOString().slice(0, 10);
    const week = weeks.get(key) ?? { sum: 0, count: 0 };
    week.sum += score;
    week.count++;
    weeks.set(key, week);
    for (const answer of result.answers) {
      const group = groups.get(answer.skill) ?? { correct: 0, total: 0 };
      group.total++;
      group.correct += Number(answer.correct);
      groups.set(answer.skill, group);
    }
  }
  return {
    average: results.length ? scoreSum / results.length : null,
    accuracy: total ? correct / total * 100 : null,
    total,
    skills: [...groups].map(([name, value]) => ({ name, ...value, accuracy: value.correct / value.total * 100 })).sort((a, b) => a.accuracy - b.accuracy),
    weeks: [...weeks].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, count: value.count, average: value.sum / value.count })),
  };
}

/** Reject malformed records instead of silently showing incorrect averages. */
export function parseResult(value: Record<string, unknown>): DashboardResult {
  const timestamp = value.completedAt as { toDate?: () => Date } | undefined;
  const completedAt = timestamp?.toDate?.();
  if (typeof value.studentId !== 'string' || typeof value.classroomId !== 'string' || !completedAt || !Number.isFinite(completedAt.getTime()) || !Array.isArray(value.answers) || !value.answers.length) throw new Error('A quiz result has missing or invalid fields.');
  const answers = value.answers.map((answer: unknown) => {
    if (!answer || typeof answer !== 'object' || !('skill' in answer) || typeof answer.skill !== 'string' || !('topic' in answer) || typeof answer.topic !== 'string' || !('correct' in answer) || typeof answer.correct !== 'boolean') throw new Error('A quiz result contains an invalid answer.');
    return { skill: answer.skill, topic: answer.topic, correct: answer.correct };
  });
  return { studentId: value.studentId, classroomId: value.classroomId, completedAt, answers };
}
