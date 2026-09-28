import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateMockQuizResults } from '../src/data/mockQuizResults.ts';

const questions = Array.from({ length: 8 }, (_, i) => ({
  curriculumPath: `curriculum/lesson-${i}`, prompt: `Example ${i}?`,
  skill: i % 2 ? 'Colors' : 'Plant care', options: ['A', 'B', 'C'], correctAnswerIndex: i % 3,
}));
const config = { datasetId: 'garden-v1', endDate: '2026-09-24T18:00:00Z' };

test('repeatable dataset has consistent grades, references, durations and dates', () => {
  const data = generateMockQuizResults(questions, config);
  assert.deepEqual(data, generateMockQuizResults(questions, config));
  assert.equal(data.students.length, 30);
  assert.equal(data.quizResults.length, 120);
  assert.equal(new Set(data.quizResults.map(result => result.resultId)).size, 120);
  const studentIds = new Set(data.students.map(student => student.studentId));
  for (const result of data.quizResults) {
    assert.ok(studentIds.has(result.studentId));
    assert.ok(result.isMock);
    assert.equal(new Set(result.answers.map(answer => answer.curriculumPath)).size, 5);
    assert.equal(result.correctCount, result.answers.filter(answer => answer.selectedAnswerIndex === answer.correctAnswerIndex).length);
    assert.equal(result.scorePercent, result.correctCount / result.questionCount * 100);
    assert.equal(Date.parse(result.completedAt) - Date.parse(result.startedAt), result.durationSeconds * 1000);
    assert.ok(Date.parse(result.completedAt) <= Date.parse(config.endDate));
  }
  assert.ok(data.quizResults.some(result => result.scorePercent < 60));
  assert.ok(data.quizResults.some(result => result.scorePercent >= 80));
});

test('rejects insufficient questions, duplicate references and invalid answer keys', () => {
  assert.throws(() => generateMockQuizResults(questions.slice(0, 2), config));
  assert.throws(() => generateMockQuizResults([...questions, questions[0]], config));
  assert.throws(() => generateMockQuizResults([{ ...questions[0], correctAnswerIndex: 99 }, ...questions.slice(1)], config));
});

