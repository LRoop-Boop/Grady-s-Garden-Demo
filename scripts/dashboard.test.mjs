import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeResults, parseResult } from '../src/lib/dashboard.ts';

const result = (correct, day) => ({ studentId: 'student', classroomId: 'class', completedAt: new Date(day), answers: correct.map(value => ({ skill: 'Colors', topic: 'Peppers', correct: value })) });
test('quiz average and answer accuracy have different denominators', () => {
  const summary = summarizeResults([result([true], '2026-09-20T23:59:00Z'), result([false, false, false], '2026-09-21T00:00:00Z')]);
  assert.equal(summary.average, 50);
  assert.equal(summary.accuracy, 25);
  assert.equal(summary.skills[0].accuracy, 25);
  assert.deepEqual(summary.weeks.map(week => week.date), ['2026-09-14', '2026-09-21']);
});
test('empty data is unassessed rather than zero percent', () => {
  assert.equal(summarizeResults([]).average, null);
  assert.equal(summarizeResults([]).accuracy, null);
});
test('Firestore parser validates timestamps and answers', () => {
  const raw = { ...result([true], '2026-09-21'), completedAt: { toDate: () => new Date('2026-09-21') } };
  assert.equal(parseResult(raw).answers[0].correct, true);
  assert.throws(() => parseResult({ ...raw, answers: [] }));
  assert.throws(() => parseResult({ ...raw, completedAt: 'yesterday' }));
  assert.throws(() => parseResult({ ...raw, answers: [{ correct: 'false' }] }));
});
