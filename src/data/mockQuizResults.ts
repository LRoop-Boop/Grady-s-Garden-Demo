/** Mock question grounded in a verified curriculum document. */
export interface SeedQuestion {
  curriculumPath: string;
  prompt: string;
  skill: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface MockSeedOptions {
  datasetId: string;
  endDate: string;
  studentCount?: number;
  attemptsPerStudent?: number;
  questionsPerAttempt?: number;
  seed?: number;
}

/** Pure, repeatable data generation; does not write to Firestore. */
export function generateMockQuizResults(questions: SeedQuestion[], config: MockSeedOptions) {
  const { datasetId, endDate, studentCount = 30, attemptsPerStudent = 4, questionsPerAttempt = 5, seed = 42 } = config;
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(datasetId)) throw new Error("Use a short dataset ID containing letters, digits, underscores or hyphens.");
  const end = Date.parse(endDate);
  if (!Number.isFinite(end)) throw new Error("Provide a valid end date.");
  for (const count of [studentCount, attemptsPerStudent, questionsPerAttempt]) {
    if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error("Counts must be integers between 1 and 1000.");
  }
  if (studentCount * attemptsPerStudent > 10000) throw new Error("Limit each mock dataset to 10,000 attempts.");
  if (questions.length < questionsPerAttempt) throw new Error("Not enough verified questions for a quiz.");
  const paths = new Set<string>();
  for (const question of questions) {
    const segments = question.curriculumPath.split("/");
    if (segments.length % 2 !== 0 || segments.some(segment => !segment) || paths.has(question.curriculumPath)) throw new Error("Question paths must be unique Firestore document paths.");
    if (!question.prompt.trim() || !question.skill.trim() || question.options.length < 2 || question.options.some(option => !option.trim())) throw new Error("Each question needs a prompt, skill and at least two nonempty options.");
    if (!Number.isInteger(question.correctAnswerIndex) || question.correctAnswerIndex < 0 || question.correctAnswerIndex >= question.options.length) throw new Error("Invalid correct answer index.");
    paths.add(question.curriculumPath);
  }
  if (!Number.isInteger(seed)) throw new Error("Seed must be an integer.");
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const metadata = { isMock: true as const, datasetId, schemaVersion: 1 };
  const students = Array.from({ length: studentCount }, (_, i) => ({
    ...metadata,
    studentId: `mock-${datasetId}-${String(i + 1).padStart(3, "0")}`,
    displayName: `Demo Student ${String(i + 1).padStart(3, "0")}`,
    classroomId: `mock-${datasetId}-class-${Math.floor(i / 15) + 1}`,
  }));
  const quizResults = students.flatMap((student) => {
    const baseline = 0.35 + random() * 0.5;
    return Array.from({ length: attemptsPerStudent }, (_, attempt) => {
      const pool = [...questions];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const answers = pool.slice(0, questionsPerAttempt).map(question => {
        const shouldBeCorrect = random() < Math.min(0.95, baseline + attempt * 0.04);
        const wrongOffset = 1 + Math.floor(random() * (question.options.length - 1));
        const selectedAnswerIndex = shouldBeCorrect ? question.correctAnswerIndex : (question.correctAnswerIndex + wrongOffset) % question.options.length;
        return { ...question, options: [...question.options], selectedAnswerIndex, correct: selectedAnswerIndex === question.correctAnswerIndex, durationSeconds: 8 + Math.floor(random() * 53) };
      });
      const correctCount = answers.filter(answer => answer.correct).length;
      const durationSeconds = answers.reduce((sum, answer) => sum + answer.durationSeconds, 0);
      const completed = end - (attemptsPerStudent - attempt - 1) * 7 * 86400000 - Math.floor(random() * 86400000);
      return {
        ...metadata,
        resultId: `${student.studentId}-attempt-${attempt + 1}`,
        studentId: student.studentId,
        classroomId: student.classroomId,
        attemptNumber: attempt + 1,
        startedAt: new Date(completed - durationSeconds * 1000).toISOString(),
        completedAt: new Date(completed).toISOString(),
        correctCount,
        questionCount: answers.length,
        scorePercent: correctCount / answers.length * 100,
        durationSeconds,
        answers,
      };
    });
  });
  return { students, quizResults };
}

