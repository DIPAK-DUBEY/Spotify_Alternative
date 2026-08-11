import { useEffect, useRef, useState } from "react";
import { fetchPlaylistMetadata } from "../utils/spotify.js";

const MIN_LOADING_MS = 1200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function useSpotifyPlaylist() {
  const [playlist, setPlaylist] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const embedKeyRef = useRef(0);

  useEffect(() => {
    function onMessage(event) {
      if (event.origin !== "https://open.spotify.com") return;

      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data || data.type !== "playback_update") return;

      const payload = data.payload;
      if (!payload) return;

      setIsPlaying(Boolean(payload.is_playing));

      const track = payload.current_track;
      if (!track) return;

      setCurrentTrack({
        id: track.id || null,
        name: track.name || "",
        artists: Array.isArray(track.artists)
          ? track.artists.map((a) => a.name).filter(Boolean).join(", ")
          : "",
        artwork: track.image_url || null
      });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function loadPlaylist(id) {
    setIsLoading(true);
    setError(null);
    setCurrentTrack(null);
    setIsPlaying(false);
    embedKeyRef.current += 1;
    const started = Date.now();

    const result = await Promise.race([
      fetchPlaylistMetadata(id),
      sleep(6000).then(() => ({ ok: false, reason: "network" }))
    ]);

    const elapsed = Date.now() - started;
    if (elapsed < MIN_LOADING_MS) {
      await sleep(MIN_LOADING_MS - elapsed);
    }

    setIsLoading(false);

    if (!result.ok) {
      return result;
    }

    return {
      ok: true,
      playlist: { id, name: result.name, artwork: result.artwork },
      embedKey: embedKeyRef.current
    };
  }

  function clearError() {
    setError(null);
  }

  return {
    playlist,
    currentTrack,
    isPlaying,
    isLoading,
    error,
    loadPlaylist,
    clearError
  };
}
