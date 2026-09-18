import { useState, type ReactNode } from "react";
import type { FlagType, FlaggedTopic } from "./copilotData";

// --- Icons ---------------------------------------------------------------

function BookmarkIcon({ filled = false }: Readonly<{ filled?: boolean }>) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3.5h10a.5.5 0 0 1 .5.5v12.3a.5.5 0 0 1-.77.42L10 13.6l-4.73 3.12a.5.5 0 0 1-.77-.42V4a.5.5 0 0 1 .5-.5Z" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor" aria-hidden="true">
      <path d="M10 1.5a5.5 5.5 0 0 0-3 10.1c.5.35.8.9.8 1.5v.4a1 1 0 0 0 1 1h2.4a1 1 0 0 0 1-1v-.4c0-.6.3-1.15.8-1.5A5.5 5.5 0 0 0 10 1.5Z" />
      <rect x="7.8" y="15.7" width="4.4" height="1.3" rx="0.6" />
      <rect x="8.3" y="17.4" width="3.4" height="1.1" rx="0.55" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 2.5v15" />
      <path d="M4 3.5c1.5-1 3.5-1 5 0s3.5 1 5 0v7c-1.5 1-3.5 1-5 0s-3.5-1-5 0" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 4.5v4h-4" />
      <path d="M4 15.5v-4h4" />
      <path d="M4.6 8.5a5.5 5.5 0 0 1 9.4-3l2 2M15.4 11.5a5.5 5.5 0 0 1-9.4 3l-2-2" />
    </svg>
  );
}

// --- Shared save/flag toggle -------------------------------------------
// One control so every place a topic can be saved (search results, slide
// editor) matches the other pill buttons like "+ Add to Slide".

export function FlagToggleButton({
  flagged,
  onToggle,
  size = "md",
}: Readonly<{
  flagged: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={flagged}
      aria-label={flagged ? "Remove from saved topics" : "Save this topic"}
      className={[
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 font-bold transition",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs",
        flagged
          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
          : "border-teal-700/30 text-teal-700 hover:border-teal-700 hover:bg-teal-50",
      ].join(" ")}
    >
      <BookmarkIcon filled={flagged} />
      {flagged ? "Saved" : "Save"}
    </button>
  );
}

// --- Type badge (interest / struggle) -----------------------------------

function TypeSegmentedControl({
  value,
  onChange,
}: Readonly<{ value: FlagType; onChange: (type: FlagType) => void }>) {
  const options: { value: FlagType; label: string; icon: ReactNode }[] = [
    { value: "interest", label: "Interest", icon: <LightbulbIcon /> },
    { value: "struggle", label: "Struggle", icon: <FlagIcon /> },
  ];

  return (
    <div className="inline-flex rounded-lg border-2 border-teal-700/10 bg-teal-50/50 p-0.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={[
              "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition",
              active
                ? opt.value === "interest"
                  ? "bg-teal-700 text-white shadow-sm"
                  : "bg-amber-500 text-white shadow-sm"
                : "text-teal-900/50 hover:text-teal-900",
            ].join(" ")}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Generic modal shell -------------------------------------------------

function Modal({
  title,
  onClose,
  children,
}: Readonly<{ title: string; onClose: () => void; children: ReactNode }>) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-teal-950/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b-2 border-teal-700/10 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-bold text-teal-900">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <BookmarkIcon filled />
            </span>
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full px-2 py-1 text-xs font-bold text-teal-700/60 transition hover:bg-teal-50 hover:text-teal-900"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

// --- Saved topics modal content -------------------------------------------
// "list" shows the existing saved topics; "add" is a short deliberate form
// so adding a topic from scratch (not from a slide/search result) feels
// like an intentional action rather than a stray text field.

function SavedTopicsModalBody({
  flags,
  initialView,
  onAdd,
  onUpdate,
  onRemove,
}: Readonly<{
  flags: FlaggedTopic[];
  initialView: "list" | "add";
  onAdd: (flag: FlaggedTopic) => void;
  onUpdate: (id: string, patch: Partial<FlaggedTopic>) => void;
  onRemove: (id: string) => void;
}>) {
  const [view, setView] = useState<"list" | "add">(initialView);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FlagType>("interest");
  const [note, setNote] = useState("");

  function submitAdd() {
    if (!label.trim()) return;

    onAdd({ id: crypto.randomUUID(), label: label.trim(), type, note: note.trim() });
    setLabel("");
    setType("interest");
    setNote("");
    setView("list");
  }

  if (view === "add") {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-teal-900">Topic</label>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAdd()}
            placeholder="e.g. Photosynthesis"
            className="w-full rounded-lg border-2 border-teal-700/20 px-2.5 py-2 text-sm text-teal-900 focus:border-teal-600 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-teal-900">Type</label>
          <TypeSegmentedControl value={type} onChange={setType} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-teal-900">
            Note <span className="font-normal text-teal-900/40">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Any context worth remembering..."
            className="w-full rounded-lg border-2 border-teal-700/20 px-2.5 py-2 text-sm text-teal-900 focus:border-teal-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => setView("list")}
            className="rounded-lg px-3 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submitAdd}
            disabled={!label.trim()}
            className="rounded-lg border-2 border-teal-700 bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save Topic
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => setView("add")}
        className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-teal-700/25 py-2 text-xs font-bold text-teal-700 transition hover:border-teal-700 hover:bg-teal-50"
      >
        + Add a new topic
      </button>

      {flags.length === 0 && (
        <p className="rounded-xl bg-teal-50 px-3 py-4 text-center text-xs text-teal-800/70">
          No saved topics yet.
        </p>
      )}

      {flags.map((flag) => (
        <div
          key={flag.id}
          className={[
            "flex flex-col gap-2 rounded-xl border-2 border-l-[3px] bg-white p-2.5",
            flag.type === "interest"
              ? "border-teal-700/10 border-l-teal-600"
              : "border-teal-700/10 border-l-amber-500",
          ].join(" ")}
        >
          <div className="flex items-center gap-1.5">
            <input
              value={flag.label}
              onChange={(e) => onUpdate(flag.id, { label: e.target.value })}
              className="w-full rounded-lg border-2 border-teal-700/10 px-2 py-1 text-xs font-semibold text-teal-900 focus:border-teal-600 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => onRemove(flag.id)}
              className="shrink-0 rounded-md px-1.5 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
              aria-label={`Remove ${flag.label}`}
            >
              ✕
            </button>
          </div>

          <TypeSegmentedControl
            value={flag.type}
            onChange={(t) => onUpdate(flag.id, { type: t })}
          />

          <textarea
            value={flag.note}
            onChange={(e) => onUpdate(flag.id, { note: e.target.value })}
            placeholder="Optional note..."
            rows={1}
            className="rounded-lg border-2 border-teal-700/10 px-2 py-1 text-xs text-teal-900 placeholder:text-teal-900/40 focus:border-teal-600 focus:outline-none"
          />
        </div>
      ))}
    </div>
  );
}

// --- Fact of the Day tile ------------------------------------------------

function FactTile({
  fact,
  onRefresh,
  onAddToSlide,
}: Readonly<{ fact: string; onRefresh: () => void; onAddToSlide: () => void }>) {
  return (
    <div className="flex aspect-square flex-col justify-between rounded-2xl border-2 border-teal-700/10 bg-gradient-to-br from-teal-700 to-emerald-600 p-3 text-white shadow-sm">
      <div className="flex items-start justify-between gap-1">
        <span className="text-xs font-bold uppercase leading-tight tracking-wide text-teal-100">
          🌱 Fact of the Day
        </span>

        <button
          type="button"
          onClick={onRefresh}
          aria-label="Show a different fact"
          className="shrink-0 rounded-full p-1 transition hover:bg-white/15"
        >
          <RefreshIcon />
        </button>
      </div>

      <p className="line-clamp-4 text-sm font-medium leading-snug">{fact}</p>

      <button
        type="button"
        onClick={onAddToSlide}
        className="self-start rounded-full border-2 border-white/40 px-2.5 py-1 text-xs font-bold transition hover:bg-white/10"
      >
        + Add to Slide
      </button>
    </div>
  );
}

// --- Saved Topics tile -----------------------------------------------------

function FlagsTile({
  flags,
  onOpenList,
  onOpenAdd,
}: Readonly<{
  flags: FlaggedTopic[];
  onOpenList: () => void;
  onOpenAdd: () => void;
}>) {
  const preview = [...flags].reverse().slice(0, 3);

  return (
    <div className="flex aspect-square flex-col justify-between rounded-2xl border-2 border-teal-700/10 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-teal-700">
          <BookmarkIcon filled />
          Saved Topics
        </span>

        <button
          type="button"
          onClick={onOpenAdd}
          aria-label="Add a saved topic"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold leading-none text-white transition hover:bg-teal-800"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenList}
        className="flex flex-1 flex-col justify-center gap-1.5 text-left"
      >
        {flags.length === 0 ? (
          <p className="text-sm text-teal-900/50">
            Nothing saved yet — tap <span className="font-bold text-teal-700">+</span> to add one.
          </p>
        ) : (
          <>
            <span className="text-3xl font-bold leading-none text-teal-900">
              {flags.length}
            </span>
            <div className="flex flex-wrap gap-1">
              {preview.map((f) => (
                <span
                  key={f.id}
                  className={[
                    "max-w-full truncate rounded-full px-2 py-0.5 text-xs font-semibold",
                    f.type === "interest"
                      ? "bg-teal-100 text-teal-800"
                      : "bg-amber-100 text-amber-800",
                  ].join(" ")}
                >
                  {f.label}
                </span>
              ))}
            </div>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onOpenList}
        className="self-start text-xs font-bold text-teal-700 transition hover:underline"
      >
        View all →
      </button>
    </div>
  );
}

// --- Sidebar (two tiles + shared modal) -----------------------------------

export default function Sidebar({
  fact,
  onRefreshFact,
  onAddFactToSlide,
  flags,
  onAdd,
  onUpdate,
  onRemove,
}: Readonly<{
  fact: string;
  onRefreshFact: () => void;
  onAddFactToSlide: () => void;
  flags: FlaggedTopic[];
  onAdd: (flag: FlaggedTopic) => void;
  onUpdate: (id: string, patch: Partial<FlaggedTopic>) => void;
  onRemove: (id: string) => void;
}>) {
  const [modalView, setModalView] = useState<"list" | "add" | null>(null);

  return (
    <>
      <div className="grid w-full shrink-0 grid-cols-2 gap-3 border-t-2 border-teal-700/10 bg-teal-50/30 p-4 sm:max-w-sm lg:w-72 lg:grid-cols-1 lg:border-l-2 lg:border-t-0">
        <FactTile fact={fact} onRefresh={onRefreshFact} onAddToSlide={onAddFactToSlide} />
        <FlagsTile
          flags={flags}
          onOpenList={() => setModalView("list")}
          onOpenAdd={() => setModalView("add")}
        />
      </div>

      {modalView && (
        <Modal title="Saved Topics" onClose={() => setModalView(null)}>
          <SavedTopicsModalBody
            flags={flags}
            initialView={modalView}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        </Modal>
      )}
    </>
  );
}