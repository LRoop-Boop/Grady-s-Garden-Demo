import NavButton from "../components/NavButton";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 p-6">
      <NavButton label="Translation" to="/translation" />
      <NavButton label="Copilot" to="/copilot" />
      <NavButton label="Parent Copilot" to="/parentcopilot" />
      <NavButton label="Personalized Lessons" to="/lessons" />
    </div>
  );
}