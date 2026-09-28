import { generateMockQuizResults } from '../src/data/mockQuizResults.ts';

// These mock prompts are grounded in curriculum facts, not independently verified questions.
const templates = [
  ['beans-are-seeds', 'What is a bean?', ['A seed', 'A flower petal', 'A rock'], 0, 'Plant parts'],
  ['bell-peppers-change-color', 'What can happen as a bell pepper matures?', ['It turns into a carrot', 'It can change color', 'It becomes a stone'], 1, 'Colors'],
  ['broccoli-is-a-flower', 'Which part of broccoli do we eat?', ['Roots', 'Bark', 'Tiny flower buds'], 2, 'Plant parts'],
  ['carrots-are-root-vegetables', 'Where does the carrot part we eat grow?', ['On a tree', 'Underground', 'On top of a flower'], 1, 'Growing places'],
  ['cucumbers-have-seeds', 'Why are cucumbers botanically fruits?', ['They grow from flowers and contain seeds', 'They are always sweet', 'They grow underground'], 0, 'Fruit & vegetables'],
  ['lettuce-is-a-leaf', 'Which part of lettuce do we eat?', ['Bark', 'Roots', 'Leaves'], 2, 'Plant parts'],
  ['peas-grow-inside-pods', 'Where do peas grow?', ['Inside pods', 'Inside tree bark', 'Inside potatoes'], 0, 'Growing places'],
  ['plants-need-water', 'What do plants need to grow and stay healthy?', ['Soda', 'Water', 'Candy'], 1, 'Plant care'],
  ['plants-use-sunlight', 'What helps plants make their own food?', ['Plastic', 'Paint', 'Sunlight'], 2, 'Plant care'],
  ['tomatoes-are-fruits', 'A tomato grows from a flower and contains seeds. Botanically, it is a...', ['Root', 'Fruit', 'Leaf'], 1, 'Fruit & vegetables'],
];

const projectId = 'grady-s-garden-ai-demo';
const root = `projects/${projectId}/databases/(default)/documents`;
const endpoint = `https://firestore.googleapis.com/v1/${root}`;
const flags = new Set(process.argv.slice(2));
if ([...flags].some(flag => !['--write', '--verify'].includes(flag)) || flags.size > 1) throw new Error('Usage: node scripts/seedFirestore.mjs [--write | --verify]');

async function request(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(30000) });
  const body = await response.json();
  if (!response.ok) throw new Error(`Firestore ${response.status}: ${body.error?.message ?? JSON.stringify(body)}`);
  return body;
}

const sources = [];
let pageToken;
do {
  const url = new URL(`${endpoint}/curriculum`);
  url.searchParams.set('pageSize', '100');
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  const page = await request(url);
  sources.push(...(page.documents ?? []));
  pageToken = page.nextPageToken;
} while (pageToken);

const questions = templates.map(([id, prompt, options, correctAnswerIndex, skill]) => {
  const source = sources.find(doc => doc.name === `${root}/curriculum/${id}`);
  if (source?.fields?.verified?.booleanValue !== true) throw new Error(`Missing verified curriculum: ${id}`);
  const field = name => {
    const value = source.fields[name]?.stringValue;
    if (!value) throw new Error(`Missing ${name} on ${id}`);
    return value;
  };
  return {
    curriculumPath: `curriculum/${id}`, questionId: `mock-${id}-v1`,
    prompt, options, correctAnswerIndex, skill,
    topic: field('topic'), subject: field('subject'), gradeLevel: field('gradeLevel'),
    sourceContent: field('content'), sourceUpdateTime: source.updateTime,
    questionOrigin: 'mock-seed',
  };
});

const data = generateMockQuizResults(questions, { datasetId: 'garden-demo-v1', endDate: '2026-09-24T18:00:00Z' });

function encode(value, key = '') {
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string') return ['startedAt', 'completedAt', 'sourceUpdateTime'].includes(key) ? { timestampValue: value } : { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(item => encode(item)) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([name, item]) => [name, encode(item, name)])) } };
}

const documents = [
  ...data.students.map(student => ({ name: `${root}/students/${student.studentId}`, fields: encode(student).mapValue.fields })),
  ...data.quizResults.map(result => ({ name: `${root}/quizResults/${result.resultId}`, fields: encode(result).mapValue.fields })),
];
console.log(JSON.stringify({ projectId, datasetId: 'garden-demo-v1', students: data.students.length, quizResults: data.quizResults.length, answers: data.quizResults.reduce((sum, result) => sum + result.questionCount, 0), averageScorePercent: data.quizResults.reduce((sum, result) => sum + result.scorePercent, 0) / data.quizResults.length }, null, 2));

if (flags.has('--write')) {
  // One atomic commit. Existing IDs cause the entire commit to fail, never overwrite.
  const result = await request(`${endpoint}:commit`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes: documents.map(document => ({ update: document, currentDocument: { exists: false } })) }),
  });
  console.log(`Created ${result.writeResults.length} documents atomically at ${result.commitTime}.`);
} else if (flags.has('--verify')) {
  const normalize = value => {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, normalize(value[key])]));
    return value;
  };
  for (let i = 0; i < documents.length; i += 10) {
    await Promise.all(documents.slice(i, i + 10).map(async expected => {
      const actual = await request(`https://firestore.googleapis.com/v1/${expected.name}`);
      if (JSON.stringify(normalize(actual.fields)) !== JSON.stringify(normalize(expected.fields))) throw new Error(`Verification mismatch: ${expected.name}`);
    }));
  }
  console.log(`Verified all ${documents.length} documents against the generated dataset.`);
} else {
  console.log('Preview only. Use --write to create the dataset, then --verify to read it back.');
}
