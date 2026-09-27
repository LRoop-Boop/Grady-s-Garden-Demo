import { useCallback, useEffect, useRef, useState } from "react";
import MuxPlayer, { type MuxPlayerRefAttributes } from "@mux/mux-player-react";
import type { LanguageCode } from "../lib/translate";

// Plays the lesson video from Mux with signed (tokenized) playback. Tokens
// come from our own server (server/index.ts) — the signing key never
// reaches the browser — and are fetched fresh on every mount.
//
// Captions are Mux text tracks on the asset (see scripts/mux.ts):
//   - "English"            auto-generated from the audio
//   - Spanish              AI-translated from the English track
//   - "English + Español"  both lines per cue, merged from the two above
// They all appear in the player's own CC menu; the buttons below are a
// bigger, kid-friendly shortcut to the same tracks. A Spanish AI dub, if
// added, shows up in the player's audio menu without any code here.

// Keep in sync with BILINGUAL_TRACK_NAME in scripts/mux.ts.
const BILINGUAL_TRACK_NAME = "English + Español";

type CaptionChoice = "off" | "en" | "es" | "bilingual";

const captionLabels: Record<CaptionChoice, string> = {
  off: "Off",
  en: "English",
  es: "Español",
  bilingual: "English + Español",
};

interface PlaybackInfo {
  playbackId: string;
  tokens: { playback: string; thumbnail: string; storyboard: string };
  expiresAt: number;
}

function defaultCaptionFor(language: LanguageCode): CaptionChoice {
  return language === "es" ? "es" : "en";
}

function isCaptionTrack(track: TextTrack): boolean {
  return track.kind === "subtitles" || track.kind === "captions";
}

function choiceForTrack(track: TextTrack): CaptionChoice | null {
  if (track.label === BILINGUAL_TRACK_NAME) return "bilingual";
  if (track.language.startsWith("en")) return "en";
  if (track.language.startsWith("es")) return "es";
  return null;
}

async function fetchPlaybackInfo(): Promise<PlaybackInfo> {
  const response = await fetch("/api/mux/playback-token", { cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as Partial<PlaybackInfo> & { error?: string };
  if (!response.ok || !body.playbackId || !body.tokens) {
    throw new Error(body.error ?? `Token request failed (${response.status}).`);
  }
  return body as PlaybackInfo;
}

export default function MuxLessonVideo({
  title,
  language,
}: Readonly<{ title: string; language: LanguageCode }>) {
  const playerRef = useRef<MuxPlayerRefAttributes>(null);
  const [playback, setPlayback] = useState<PlaybackInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Where to resume if we have to swap in fresh tokens mid-video.
  const [startTime, setStartTime] = useState(0);

  const [captionChoice, setCaptionChoice] = useState<CaptionChoice>(() => defaultCaptionFor(language));
  const [availableChoices, setAvailableChoices] = useState<CaptionChoice[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchPlaybackInfo()
      .then((info) => !cancelled && setPlayback(info))
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Couldn't load the video.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Follow the page's language selector (adjusting state during render,
  // React's recommended alternative to a setState-in-effect).
  const [captionLanguage, setCaptionLanguage] = useState(language);
  if (language !== captionLanguage) {
    setCaptionLanguage(language);
    setCaptionChoice(defaultCaptionFor(language));
  }

  // Show exactly the track matching the current choice. The buttons are the
  // source of truth: picking a track in the player's own CC menu still
  // works, it just isn't reflected back in the buttons — syncing that way
  // would also catch the player's default-track pick while tracks load and
  // override the page language.
  const showChosenTrack = useCallback(() => {
    for (const track of Array.from(playerRef.current?.media?.textTracks ?? [])) {
      if (!isCaptionTrack(track)) continue;
      track.mode = choiceForTrack(track) === captionChoice ? "showing" : "disabled";
    }
  }, [captionChoice]);

  // Mux adds the HLS text tracks asynchronously; refresh the buttons and
  // re-apply the choice as each one arrives.
  const syncTracks = useCallback(() => {
    const tracks = Array.from(playerRef.current?.media?.textTracks ?? []).filter(isCaptionTrack);
    setAvailableChoices(["off", ...new Set(tracks.map(choiceForTrack).filter((c) => c !== null))]);
    showChosenTrack();
  }, [showChosenTrack]);

  useEffect(() => {
    showChosenTrack();
    const textTracks = playerRef.current?.media?.textTracks;
    if (!textTracks) return;
    textTracks.addEventListener("addtrack", syncTracks);
    return () => textTracks.removeEventListener("addtrack", syncTracks);
  }, [showChosenTrack, syncTracks, playback]);

  // A token only lives for the video's length plus a grace period, so a
  // very long pause can outlive it. If playback errors after expiry, get
  // fresh tokens and pick up where the viewer left off.
  async function handleError() {
    if (!playback || Date.now() < playback.expiresAt - 5_000) return;
    setStartTime(playerRef.current?.currentTime ?? 0);
    try {
      setPlayback(await fetchPlaybackInfo());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Couldn't reload the video.");
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-2">
      <h1 className="text-2xl font-bold text-teal-900">{title}</h1>

      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-teal-900/10 shadow-md">
        {playback && (
          <MuxPlayer
            key={playback.tokens.playback}
            ref={playerRef}
            playbackId={playback.playbackId}
            tokens={playback.tokens}
            startTime={startTime}
            title={title}
            accentColor="#0f766e"
            onLoadedMetadata={syncTracks}
            onError={() => void handleError()}
            className="h-full w-full"
          />
        )}
        {!playback && (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-teal-900/70">
            {loadError ? `Couldn't load the video (${loadError}).` : "Loading video…"}
          </div>
        )}
      </div>

      {availableChoices.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Captions">
          <span className="text-sm font-semibold text-teal-800">CC</span>
          {availableChoices.map((choice) => (
            <button
              key={choice}
              type="button"
              aria-pressed={captionChoice === choice}
              onClick={() => setCaptionChoice(choice)}
              className={[
                "rounded-full border-2 px-3 py-1 text-sm font-semibold transition",
                captionChoice === choice
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-teal-700/40 bg-white/70 text-teal-800 hover:bg-white",
              ].join(" ")}
            >
              {captionLabels[choice]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
