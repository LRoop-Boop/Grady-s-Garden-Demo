import type { QuizPicture } from "../components/QuizIllustration";

export const skills = ["Colors", "Fruit & vegetables", "Growing places", "Plant parts", "Plant care"] as const;
export type Skill = typeof skills[number];
export type Observation = { skill: Skill; correct: boolean };
export interface Student {
  studentId: string;
  score: number;
  questions: Record<string, Record<string, boolean>>;
  observations: Observation[];
}

export const students: Student[] = [
  { studentId: "1", score: 70, questions: { "Are Carrots Green?": { Yes: false } }, observations: [{ skill: "Colors", correct: false }] },
  { studentId: "2", score: 85, questions: { "Is a Tomato a Fruit?": { Yes: true }, "Are Bananas Yellow?": { Yes: true } }, observations: [{ skill: "Fruit & vegetables", correct: true }, { skill: "Colors", correct: true }] },
  { studentId: "3", score: 60, questions: { "Do Apples Grow on Trees?": { No: false } }, observations: [{ skill: "Growing places", correct: false }] },
  { studentId: "4", score: 95, questions: { "Is Broccoli a Vegetable?": { Yes: true }, "Are Strawberries Red?": { Yes: true }, "Do Potatoes Grow Underground?": { Yes: true } }, observations: [{ skill: "Fruit & vegetables", correct: true }, { skill: "Colors", correct: true }, { skill: "Growing places", correct: true }] },
  { studentId: "5", score: 40, questions: { "Is a Cucumber a Fruit?": { No: false }, "Are Oranges Purple?": { No: true } }, observations: [{ skill: "Fruit & vegetables", correct: false }, { skill: "Colors", correct: true }] },
];

export interface PracticeQuestion {
  id: string;
  skill: Skill;
  challenge: boolean;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  picture: QuizPicture;
}

const bank: PracticeQuestion[] = [
  { id: "colors-basic", picture: "strawberry", skill: "Colors", challenge: false, prompt: "What color is a strawberry usually?", options: ["Blue", "Red", "Purple"], answer: 1, explanation: "Most strawberries turn red when they are ripe and ready to eat." },
  { id: "colors-challenge", picture: "vegetables", skill: "Colors", challenge: true, prompt: "Which pair of vegetables can BOTH be green?", options: ["Broccoli and peas", "Orange carrots and beets", "Red tomatoes and orange pumpkins"], answer: 0, explanation: "Broccoli and peas are both green vegetables. A garden can grow many colors!" },
  { id: "fruit-basic", picture: "tomato", skill: "Fruit & vegetables", challenge: false, prompt: "A tomato is a...", options: ["Root", "Leaf", "Fruit"], answer: 2, explanation: "A fruit grows from a flower and contains seeds. Tomatoes and cucumbers are fruits to plant scientists." },
  { id: "fruit-challenge", picture: "cucumber", skill: "Fruit & vegetables", challenge: true, prompt: "Whats one reason a cucumber is a fruit?", options: ["It is green", "It grows from a flower and contains seeds", "It tastes sweet"], answer: 1, explanation: "Fruits grow from flowers and contain seeds. They do not have to taste sweet!" },
  { id: "places-basic", picture: "apple", skill: "Growing places", challenge: false, prompt: "Where do apples grow?", options: ["On trees", "Under the soil", "On ocean plants"], answer: 0, explanation: "Apples grow on the branches of apple trees." },
  { id: "places-challenge", picture: "harvest", skill: "Growing places", challenge: true, prompt: "Which pair grows below the soil?", options: ["Apples and pears", "Tomatoes and peas", "Carrots and potatoes"], answer: 2, explanation: "Carrots are roots and potatoes are underground stems. Both grow below the soil." },
  { id: "parts-basic", picture: "carrot", skill: "Plant parts", challenge: false, prompt: "Which part of a carrot plant do we usually eat?", options: ["Flower", "Root", "Seeds"], answer: 1, explanation: "The crunchy carrot we eat is the plant's root." },
  { id: "parts-challenge", picture: "leaves", skill: "Plant parts", challenge: true, prompt: "Lettuce and spinach give us which plant part to eat?", options: ["Leaves", "Roots", "Flowers"], answer: 0, explanation: "We eat the leaves of lettuce and spinach plants." },
  { id: "care-basic", picture: "seedling", skill: "Plant care", challenge: false, prompt: "What does a garden plant need to help it grow?", options: ["Candy and soda", "Darkness all day", "Water and sunlight"], answer: 2, explanation: "Plants use water and sunlight to help them grow." },
  { id: "care-challenge", picture: "drooping", skill: "Plant care", challenge: true, prompt: "A seedling has dry soil and drooping leaves. What should you try first?", options: ["Keep it in a dark box", "Gently water its soil", "Pull off its leaves"], answer: 1, explanation: "Dry soil and drooping leaves can mean a plant needs water. Gently water the soil around its roots." },
];

export function skillStats(observations: Observation[], skill: Skill) {
  const matching = observations.filter((item) => item.skill === skill);
  const correct = matching.filter((item) => item.correct).length;
  return { total: matching.length, correct, accuracy: matching.length ? Math.round(correct / matching.length * 100) : null };
}

export function generateQuiz(observations: Observation[]): PracticeQuestion[] {
  return skills.map((skill) => {
    const stats = skillStats(observations, skill);
    const challenge = stats.accuracy !== null && stats.accuracy >= 75;
    return bank.find((question) => question.skill === skill && question.challenge === challenge)!;
  });
}

export function gradeQuiz(questions: PracticeQuestion[], answers: number[]): Observation[] {
  if (questions.length !== 5 || answers.length !== questions.length || answers.some((answer, i) => !Number.isInteger(answer) || answer < 0 || answer >= questions[i].options.length)) {
    throw new Error("Answer all five questions before viewing results.");
  }
  return questions.map((question, i) => ({ skill: question.skill, correct: answers[i] === question.answer }));
}
