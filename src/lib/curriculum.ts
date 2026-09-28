import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export type CurriculumDoc = {
  id: string;
  title: string;
  topic: string;
  subject: string;
  gradeLevel: string;
  content: string;
  verified: boolean;
};

let cache: CurriculumDoc[] | null = null;

// Fetch once per page load, then reuse.
export async function loadCurriculum(): Promise<CurriculumDoc[]> {
  if (cache) return cache;

  const snap = await getDocs(collection(db, "curriculum"));
  cache = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<CurriculumDoc, "id">),
  }));
  return cache;
}

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "can", "do", "does",
  "did", "what", "why", "how", "of", "in", "on", "to", "and", "or", "it",
  "its", "for", "with", "about", "tell", "me", "my", "i", "you", "that",
  "this", "there", "from", "as", "at", "by",
]);

// Lowercase, drop filler words, and strip plurals ("tomatoes" -> "tomato").
function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map((w) => w.replace(/oes$/, "o").replace(/s$/, ""));
}

// Title/topic matches count 3x; matches in the body count 1x.
export function retrieve(query: string, docs: CurriculumDoc[], k = 3) {
  const q = new Set(tokens(query));

  return docs
    .map((doc) => {
      const head = new Set(tokens(`${doc.title} ${doc.topic}`));
      const body = new Set(tokens(doc.content));
      let score = 0;
      for (const t of q) {
        if (head.has(t)) score += 3;
        else if (body.has(t)) score += 1;
      }
      return { doc, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((x) => x.doc);
}