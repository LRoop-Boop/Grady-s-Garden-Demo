import type { ReactNode } from "react";
import { useT } from "./copilotData";

// Lightweight hover/focus tooltip. `text` should be a value from UI_STRINGS so
// it gets batch-translated with everything else.
//
// `align` picks which edge the tooltip anchors to, so it doesn't spill off
// the screen: use "right" for things near the right edge, "left" near the left.
// Don't use inside overflow-hidden/overflow-auto containers (it would clip).
export default function Tip({
  text,
  children,
  align = "center",
  className = "",
}: Readonly<{
  text: string;
  children: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}>) {
  const t = useT();

  const position =
    align === "left"
      ? "left-0"
      : align === "right"
      ? "right-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full z-40 mt-1.5 w-max max-w-[15rem] rounded-lg bg-teal-950 px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity delay-300 group-hover:opacity-100 group-focus-within:opacity-100 ${position}`}
      >
        {t(text)}
      </span>
    </span>
  );
}