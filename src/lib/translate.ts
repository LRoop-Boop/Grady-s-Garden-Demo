// --- Translation provider ------------------------------------------------
// Single seam for text translation. UI code only calls `translateTexts` —
// swap the implementation below (e.g. for the Google Cloud Translation API
// once a billed project is set up) without touching any component code.
//
// Currently backed by MyMemory (https://mymemory.translated.net): free,
// keyless, no billing account required — good for a demo. Caveats to know
// about when reading this:
//   - No batch endpoint: one HTTP request per string, fired in parallel.
//   - Anonymous quota is modest (~5,000 words/day) and can be exhausted by
//     heavy demoing; MyMemory reports quota errors as HTTP 200 with an
//     error message in the body, which is why we check `responseStatus`.
//   - Translation quality is machine/community-sourced, not Google-grade.

export type LanguageCode = "en" | "es" | "fr";

export class TranslationError extends Error {}

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

interface MyMemoryResponse {
  responseData?: { translatedText?: string };
  responseStatus?: number;
}

async function translateOne(text: string, source: LanguageCode, target: LanguageCode): Promise<string> {
  if (!text.trim() || source === target) return text;

  const params = new URLSearchParams({ q: text, langpair: `${source}|${target}` });
  const response = await fetch(`${MYMEMORY_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new TranslationError(`Translation request failed (${response.status}).`);
  }

  const data = (await response.json()) as MyMemoryResponse;
  const translated = data.responseData?.translatedText;

  if (typeof translated !== "string") {
    throw new TranslationError("Unexpected response from translation service.");
  }
  if (data.responseStatus && data.responseStatus !== 200) {
    // MyMemory still returns HTTP 200 for quota/error conditions.
    throw new TranslationError(translated || "Translation service returned an error.");
  }

  return translated;
}

/**
 * Translate a batch of English strings to `target`, preserving order.
 * Returns `texts` unchanged when target is "en" (nothing to translate).
 */
export async function translateTexts(texts: string[], target: LanguageCode): Promise<string[]> {
  if (target === "en" || texts.length === 0) return texts;
  return Promise.all(texts.map((text) => translateOne(text, "en", target)));
}

/**
 * Translate a batch of strings from `source` back to English — used for a
 * "round-trip" translation-quality check (translate out, then back, and see
 * how close the result is to the original). Returns `texts` unchanged when
 * source is already "en".
 */
export async function translateToEnglish(texts: string[], source: LanguageCode): Promise<string[]> {
  if (source === "en" || texts.length === 0) return texts;
  return Promise.all(texts.map((text) => translateOne(text, source, "en")));
}
