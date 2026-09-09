import { useNavigate } from "react-router-dom";

interface NavButtonProps {
  label: string;
  to: string;
}

export default function NavButton({ label, to }: NavButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="w-full rounded-2xl border-2 border-teal-700 bg-teal-700 px-6 py-4 text-left text-lg font-bold text-white shadow-md transition hover:bg-teal-800 hover:shadow-lg active:scale-[0.98]"
    >
      {label}
    </button>
  );
}