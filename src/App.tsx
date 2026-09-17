import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Translation from "./pages/Translation";
import Copilot from "./pages/Copilot";
import StudentPractice from "./pages/StudentPractice";
import PersonalizedLessons from "./pages/PersonalizedLessons";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/translation" element={<Translation />} />
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/lessons/:studentId/practice" element={<StudentPractice />} />
        <Route path="/lessons" element={<PersonalizedLessons />} />
      </Routes>
    </BrowserRouter>
  );
}