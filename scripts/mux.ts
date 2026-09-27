// --- Mux setup CLI ----------------------------------------------------------
// One-off admin commands for getting the lesson video into Mux. Run as
// `npm run mux -- <command>`. Reads credentials from .env (see .env.example).
//
//   signing-key            Create a URL signing key; prints MUX_SIGNING_KEY /
//                          MUX_PRIVATE_KEY to paste into .env.
//   upload <file|url>      Upload the video with a signed playback policy and
//                          auto-generated English captions. Prints
//                          MUX_PLAYBACK_ID.
//   captions               Translate the English captions to Spanish (Mux
//                          AI), then build a combined English + Spanish VTT
//                          at public/captions/bilingual.vtt.
//   add-bilingual <url>    Attach the combined VTT to the asset. Mux copies
//                          it from a public URL (e.g. the raw GitHub link
//                          once pushed); it only needs to be reachable once.
//   dub                    AI-dub the audio into Spanish (Mux AI). Adds a
//                          Spanish audio track viewers pick in the player.
//   status                 List the asset's text and audio tracks.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import Mux from "@mux/mux-node";

// Keep in sync with BILINGUAL_TRACK_NAME in src/components/MuxLessonVideo.tsx.
const BILINGUAL_TRACK_NAME = "English + Español";
const BILINGUAL_VTT_PATH = "public/captions/bilingual.vtt";
const POLL_INTERVAL_MS = 5_000;

const mux = new Mux();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Add it to .env (see .env.example).`);
  return value;
}

async function getAssetId(): Promise<string> {
  const { object } = await mux.video.playbackIds.retrieve(requireEnv("MUX_PLAYBACK_ID"));
  return object.id;
}

async function waitForAssetReady(assetId: string) {
  for (;;) {
    const asset = await mux.video.assets.retrieve(assetId);
    if (asset.status === "ready") return asset;
    if (asset.status === "errored") {
      throw new Error(`Asset errored: ${JSON.stringify(asset.errors)}`);
    }
    console.log(`  asset is ${asset.status}…`);
    await sleep(POLL_INTERVAL_MS);
  }
}

// --- signing-key ---------------------------------------------------------

async function createSigningKey() {
  const key = await mux.system.signingKeys.create();
  console.log("Add these to .env (the private key is only shown once):\n");
  console.log(`MUX_SIGNING_KEY=${key.id}`);
  console.log(`MUX_PRIVATE_KEY=${key.private_key}`);
}

// --- upload --------------------------------------------------------------

async function upload(source: string | undefined) {
  if (!source) throw new Error("Usage: npm run mux -- upload <file-path-or-url>");

  const generatedCaptions = [{ language_code: "en" as const, name: "English" }];
  let assetId: string;

  if (/^https?:\/\//.test(source)) {
    const asset = await mux.video.assets.create({
      inputs: [{ url: source, generated_subtitles: generatedCaptions }],
      playback_policies: ["signed"],
      video_quality: "basic",
    });
    assetId = asset.id;
  } else {
    // Local file: create a direct upload URL and PUT the bytes to it.
    const directUpload = await mux.video.uploads.create({
      cors_origin: "*",
      new_asset_settings: {
        inputs: [{ generated_subtitles: generatedCaptions }],
        playback_policies: ["signed"],
        video_quality: "basic",
      },
    });
    if (!directUpload.url) throw new Error("Mux didn't return an upload URL.");
    console.log(`Uploading ${basename(source)}…`);
    const response = await fetch(directUpload.url, { method: "PUT", body: await readFile(source) });
    if (!response.ok) throw new Error(`Upload failed (${response.status}).`);

    let uploadStatus = await mux.video.uploads.retrieve(directUpload.id);
    while (!uploadStatus.asset_id) {
      if (uploadStatus.status === "errored") throw new Error(`Upload errored: ${JSON.stringify(uploadStatus.error)}`);
      await sleep(POLL_INTERVAL_MS);
      uploadStatus = await mux.video.uploads.retrieve(directUpload.id);
    }
    assetId = uploadStatus.asset_id;
  }

  console.log(`Asset ${assetId} created. Waiting for it to finish processing…`);
  const asset = await waitForAssetReady(assetId);
  const playbackId = asset.playback_ids?.find((p) => p.policy === "signed")?.id;

  console.log("\nDone. Add this to .env:\n");
  console.log(`MUX_PLAYBACK_ID=${playbackId}`);
  console.log("\nEnglish captions are generated after processing; run `npm run mux -- captions` in a few minutes.");
}

// --- captions ------------------------------------------------------------

interface Cue {
  start: number;
  end: number;
  timing: string;
  text: string;
}

function parseTimestamp(value: string): number {
  const parts = value.trim().split(":").map(Number);
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function parseVtt(vtt: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of vtt.replaceAll("\r\n", "\n").split(/\n{2,}/)) {
    const lines = block.split("\n");
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingIndex === -1) continue;
    const timing = lines[timingIndex];
    const [start, end] = timing.split("-->").map((part) => parseTimestamp(part.trim().split(/\s+/)[0]));
    const text = lines.slice(timingIndex + 1).join("\n").trim();
    if (text) cues.push({ start, end, timing, text });
  }
  return cues;
}

// Pair each English cue with the Spanish cue(s) overlapping it. Mux's
// translation keeps cue timings, so this is normally a 1:1 match; the
// overlap check just keeps things sane if a cue gets split or merged.
function buildBilingualVtt(english: Cue[], spanish: Cue[]): string {
  const blocks = english.map((enCue) => {
    const esText = spanish
      .filter((esCue) => {
        const overlap = Math.min(enCue.end, esCue.end) - Math.max(enCue.start, esCue.start);
        return overlap > (esCue.end - esCue.start) / 2;
      })
      .map((esCue) => esCue.text)
      .join(" ");
    return esText ? `${enCue.timing}\n${enCue.text}\n<i>${esText}</i>` : `${enCue.timing}\n${enCue.text}`;
  });
  return `WEBVTT\n\n${blocks.join("\n\n")}\n`;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetching ${url.split("?")[0]} failed (${response.status}).`);
  return response.text();
}

async function captions() {
  const playbackId = requireEnv("MUX_PLAYBACK_ID");
  const assetId = await getAssetId();

  // 1. Wait for the auto-generated English track.
  let englishTrack;
  for (;;) {
    const asset = await mux.video.assets.retrieve(assetId);
    englishTrack = asset.tracks?.find((t) => t.type === "text" && t.language_code === "en" && t.name !== BILINGUAL_TRACK_NAME);
    if (englishTrack?.status === "ready") break;
    if (englishTrack?.status === "errored") throw new Error("English caption generation errored.");
    console.log("  waiting for English captions…");
    await sleep(POLL_INTERVAL_MS);
  }

  // 2. Translate to Spanish unless that's already been done.
  const asset = await mux.video.assets.retrieve(assetId);
  let spanishTrackId = asset.tracks?.find((t) => t.type === "text" && t.language_code === "es")?.id;
  let spanishVttUrl: string | undefined;

  if (!spanishTrackId) {
    console.log("Translating captions to Spanish…");
    let job = await mux.robots.jobs.translateCaptions.create({
      parameters: { asset_id: assetId, track_id: englishTrack.id!, to_language_code: "es", never_translate: ["Grady"] },
    });
    while (job.status === "pending" || job.status === "processing") {
      await sleep(POLL_INTERVAL_MS);
      job = await mux.robots.jobs.translateCaptions.retrieve(job.id);
    }
    if (job.status !== "completed") throw new Error(`Translation ${job.status}: ${JSON.stringify(job.errors)}`);
    spanishVttUrl = job.outputs?.temporary_vtt_url;
    spanishTrackId = job.outputs?.uploaded_track_id;
  }
  if (!spanishVttUrl && !spanishTrackId) throw new Error("Translation finished but returned no Spanish track.");

  // 3. Download both and merge. Text tracks on a signed playback ID need a
  //    video ("v") token; a short one is plenty for a one-off download.
  const token = await mux.jwt.signPlaybackId(playbackId, { type: "video", expiration: "10m" });
  const trackUrl = (trackId: string) => `https://stream.mux.com/${playbackId}/text/${trackId}.vtt?token=${token}`;

  const englishVtt = await fetchText(trackUrl(englishTrack.id!));
  const spanishVtt = await fetchText(spanishVttUrl ?? trackUrl(spanishTrackId!));

  await mkdir("public/captions", { recursive: true });
  await writeFile(BILINGUAL_VTT_PATH, buildBilingualVtt(parseVtt(englishVtt), parseVtt(spanishVtt)));

  console.log(`\nSpanish track ready. Combined captions written to ${BILINGUAL_VTT_PATH}.`);
  console.log("Next: make that file reachable at a public URL (e.g. commit + push, then use its raw GitHub");
  console.log("URL), and run: npm run mux -- add-bilingual <url>");
}

async function addBilingual(url: string | undefined) {
  if (!url) throw new Error("Usage: npm run mux -- add-bilingual <public-url-of-bilingual.vtt>");
  const assetId = await getAssetId();
  const track = await mux.video.assets.createTrack(assetId, {
    url,
    type: "text",
    text_type: "subtitles",
    // Primary language is English; the name is what viewers see in the menu.
    language_code: "en",
    name: BILINGUAL_TRACK_NAME,
  });
  console.log(`Added "${BILINGUAL_TRACK_NAME}" track ${track.id}. Run \`npm run mux -- status\` to see when it's ready.`);
}

// --- dub -----------------------------------------------------------------

async function dub() {
  const assetId = await getAssetId();
  console.log("Dubbing audio to Spanish (this can take a while)…");
  let job = await mux.robots.jobs.translateAudio.create({
    parameters: { asset_id: assetId, to_language_code: "es" },
  });
  while (job.status === "pending" || job.status === "processing") {
    await sleep(POLL_INTERVAL_MS * 3);
    job = await mux.robots.jobs.translateAudio.retrieve(job.id);
  }
  if (job.status !== "completed") throw new Error(`Dubbing ${job.status}: ${JSON.stringify(job.errors)}`);
  console.log(`Spanish audio track ${job.outputs?.uploaded_track_id} added. Viewers can pick it from the player's audio menu.`);
}

// --- status --------------------------------------------------------------

async function status() {
  const asset = await mux.video.assets.retrieve(await getAssetId());
  console.log(`Asset ${asset.id}: ${asset.status}, ${asset.duration?.toFixed(1) ?? "?"}s`);
  for (const track of asset.tracks ?? []) {
    if (track.type === "video") continue;
    console.log(`  ${(track.type ?? "?").padEnd(5)} ${track.language_code ?? "-"}  ${track.status ?? ""}  "${track.name ?? ""}"  (${track.id})`);
  }
}

const [command, arg] = process.argv.slice(2);
const commands: Record<string, () => Promise<void>> = {
  "signing-key": createSigningKey,
  upload: () => upload(arg),
  captions,
  "add-bilingual": () => addBilingual(arg),
  dub,
  status,
};

const run = commands[command];
if (!run) {
  console.log(`Commands: ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}
run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
