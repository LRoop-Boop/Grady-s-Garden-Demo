# Mock student quiz data

Project: `grady-s-garden-ai-demo`, default Firestore database.
Dataset: `garden-demo-v1`.

The seed creates 30 fictional students in `students` and 120 attempts in
`quizResults` (four weekly quizzes per student, five answers per quiz).
Every document has `isMock: true`, `datasetId`, and `schemaVersion: 1`.
Student IDs start with `mock-garden-demo-v1-`. Two mock classrooms contain
15 students each. Dates are fixed and generated scores are reproducible.

The existing `curriculum` collection stores verified lesson facts, not question
documents. The script uses ten mock multiple-choice prompts based on these
facts, checks that their source documents remain verified, and preserves each
source's content and update time in the answer snapshot. The prompts themselves
are marked `questionOrigin: "mock-seed"`; they are not independently verified.
Curriculum documents are never modified.

## Run with Node 24+

```sh
node scripts/seedFirestore.mjs
node scripts/seedFirestore.mjs --write
node scripts/seedFirestore.mjs --verify
node --test scripts/mockQuizResults.test.mjs
```

The default command reads curriculum and previews totals without writing.
`--write` creates all 150 documents in one atomic commit with create-only
preconditions. Rerunning against existing IDs fails without changing data.
`--verify` reads every expected document and compares its saved fields.
Firestore security rules must permit these operations; the script does not
change rules or bypass permissions.

## Dashboard fields

- Filter both collections by `datasetId == "garden-demo-v1"` for this demo.
- Join `quizResults.studentId` to `students.studentId`.
- Overall quiz average: mean of `scorePercent` across attempts.
- Student average: mean of `scorePercent` grouped by `studentId`.
- Question-weighted accuracy: sum of `correctCount` divided by sum of
  `questionCount`, multiplied by 100.
- Skill/topic accuracy: group `answers` by `skill` or `topic`, then divide
  correct answers by total answers. Unassessed groups should show no data.
- Trends: group by `completedAt` (stored as a native Firestore timestamp).
- Each answer includes `curriculumPath`, `questionId`, prompt, options,
  selected and correct answer indices, correctness, duration, topic, subject,
  and grade level. Answer indices are zero-based.

The seeded mean quiz score is approximately 61.17%. All students have four
attempts of equal length, so the mean student score and question-weighted
accuracy coincide for this dataset; they can differ with real usage.

The Student Dashboard at `/dashboard`, linked from the home page, subscribes
to both collections for this dataset. It includes classroom filtering, weekly
quiz averages, skill accuracy, and searchable student summaries. All calendar
grouping uses UTC. Scores are calculated from recorded answers.
The existing hardcoded practice UI does not yet save new quiz attempts.
