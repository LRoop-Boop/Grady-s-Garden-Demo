// --- Content reports -------------------------------------------------------
// Lets a teacher flag AI-generated content that went off the rails. We store
// a full snapshot of what they saw, since Gemini output is non-deterministic
// and can't be reproduced later from the query alone.
//
// Firestore rules should allow `create` on contentReports but deny
// read/update/delete for clients, so reports are only reviewable from the
// console or an admin tool.

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // TODO: adjust to wherever curriculum.ts gets its db

export type ReportReason = "inaccurate" | "inappropriate" | "off-topic" | "other";

export interface ContentReport {
  kind: "search-result" | "slide";
  reason: ReportReason;
  note: string;
  query?: string;
  /** Snapshot of exactly what the user saw */
  content: unknown;
}

export async function submitContentReport(report: ContentReport) {
  await addDoc(collection(db, "contentReports"), {
    kind: report.kind,
    reason: report.reason,
    note: report.note,
    ...(report.query ? { query: report.query } : {}),
    // Round-trip strips `undefined` fields, which Firestore rejects.
    content: JSON.parse(JSON.stringify(report.content)),
    status: "open",
    createdAt: serverTimestamp(),
  });
}