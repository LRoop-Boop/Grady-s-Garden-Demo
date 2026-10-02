import { useState } from "react";
import {
  submitContentReport,
  type ContentReport,
  type ReportReason,
} from "../lib/reports";
import { UI_STRINGS, useT } from "./copilotData";
import Tip from "./Tip";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "inaccurate", label: UI_STRINGS.reasonInaccurate },
  { value: "inappropriate", label: UI_STRINGS.reasonInappropriate },
  { value: "off-topic", label: UI_STRINGS.reasonOffTopic },
  { value: "other", label: UI_STRINGS.reasonOther },
];

// Give this a `key` tied to the content being reported (result text, slide id)
// so it resets when the content changes instead of staying on "Thanks".
export default function ReportButton({
  kind,
  content,
  query,
}: Readonly<{
  kind: ContentReport["kind"];
  content: unknown;
  query?: string;
}>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inaccurate");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function submit() {
    setStatus("sending");
    try {
      await submitContentReport({
        kind,
        reason,
        note: note.trim(),
        query,
        content,
      });
      setStatus("sent");
      setOpen(false);
    } catch (err) {
      console.error("Report failed", err);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <span className="self-start text-xs font-semibold text-emerald-700">
        {t(UI_STRINGS.reportThanks)}
      </span>
    );
  }

  if (!open) {
    return (
      <Tip text={UI_STRINGS.tipReport} align="left" className="self-start">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start text-xs font-medium text-teal-700/60 transition hover:text-rose-600 hover:underline"
      >
        ⚑ {t(UI_STRINGS.report)}
      </button>
      </Tip>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border-2 border-rose-200 bg-rose-50/40 p-3">
      <p className="text-xs font-bold text-teal-900">
        {t(UI_STRINGS.reportTitle)}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setReason(r.value)}
            aria-pressed={reason === r.value}
            className={[
              "rounded-full border-2 px-2.5 py-1 text-xs font-bold transition",
              reason === r.value
                ? "border-rose-500 bg-rose-500 text-white"
                : "border-teal-700/20 text-teal-700 hover:bg-white",
            ].join(" ")}
          >
            {t(r.label)}
          </button>
        ))}
      </div>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder={t(UI_STRINGS.reportNotePlaceholder)}
        className="rounded-lg border-2 border-teal-700/10 px-2 py-1 text-xs text-teal-900 focus:border-teal-600 focus:outline-none"
      />

      {status === "error" && (
        <p className="text-xs font-medium text-rose-600">
          {t(UI_STRINGS.reportFailed)}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={status === "sending"}
          className="rounded-full border-2 border-rose-500 bg-rose-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-rose-600 disabled:opacity-50"
        >
          {status === "sending"
            ? t(UI_STRINGS.reportSending)
            : t(UI_STRINGS.reportSubmit)}
        </button>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-bold text-teal-700 hover:underline"
        >
          {t(UI_STRINGS.cancel)}
        </button>
      </div>
    </div>
  );
}