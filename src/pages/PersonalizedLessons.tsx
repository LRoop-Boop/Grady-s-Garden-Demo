import {useState} from "react";
import{generatePersonalizedLesson,LessonGenerationError} from "../lib/gemini.ts";

// Stores result of quiz generation call
  export default function PersonalizedLessons(){
  const [lessons,setLessons] = useState<Record<string,string>>({})
  const [errors,setErrors] = useState<Record<string,string>>({})
  const [loadingId,setLoadingId] = useState<string | null>(null)

  async function handleGenerate(result: QuizResults) {
    setLoadingId(result.studentId);
    setErrors((prev) => ({ ...prev, [result.studentId]: "" }));
    try {
      const lesson = await generatePersonalizedLesson(result.questions);
      setLessons((prev) => ({ ...prev, [result.studentId]: lesson }));
    } catch (err) {
      const message = err instanceof LessonGenerationError ? err.message : "Something went wrong.";
      setErrors((prev) => ({ ...prev, [result.studentId]: message }));
    } finally {
      setLoadingId(null);
    }
  }

  // Describes object for student quiz results
  interface QuizResults {
    studentId: string;
    quizId: string;
    score: number;
    questions: Record<string, Record<string, boolean>>;
  }

  const quizResults: QuizResults[] = [
    {studentId: '1', quizId: '000', score: 70, questions: {'Are Carrots Green?': {"Yes": false}}},
    {studentId: '2', quizId: '001', score: 85, questions: {'Is a Tomato a Fruit?': {"Yes": true}, 'Are Bananas Yellow?': {"Yes": true}}},
    {studentId: '3', quizId: '000', score: 60, questions: {'Do Apples Grow on Trees?': {"No": false}}},
    {studentId: '4', quizId: '002', score: 95, questions: {'Is Broccoli a Vegetable?': {"Yes": true}, 'Are Strawberries Red?': {"Yes": true}, 'Do Potatoes Grow Underground?': {"Yes": true}}},
    {studentId: '5', quizId: '001', score: 40, questions: {'Is a Cucumber a Fruit?': {"No": false}, 'Are Oranges Purple?': {"No": true}}},
  ];

    return (
        <div className="p-6 justify-center flex-col items-center text-center">Personalized Lessons page
        <div className="p-6">
          <ul className="space-y-4">
            {quizResults.map((result) => (
                <li key={result.studentId} className="border rounded p-4">
                  <div className="flex items-center justify-between">
                    <span>Student {result.studentId} — Score {result.score}</span>
                    <button
                        disabled={loadingId === result.studentId}
                        onClick={() => handleGenerate(result)}
                    >
                      {loadingId === result.studentId ? "Generating..." : "Generate Lesson"}
                    </button>
                  </div>
                  {errors[result.studentId] && <p>{errors[result.studentId]}</p>}
                  {lessons[result.studentId] && <p>{lessons[result.studentId]}</p>}
                </li>
            ))}
          </ul>
        </div>
        </div>
    );



}