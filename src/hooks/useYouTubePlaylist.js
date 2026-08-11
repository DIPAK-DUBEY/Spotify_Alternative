import { useEffect, useRef, useState } from "react";
import YouTubePlayer from "../components/YouTubePlayer.jsx";

const MIN_LOADING_MS = 1200;
const CACHE_KEY = "purane-geet:v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function useYouTubePlaylist() {
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });

  const controllerRef = useRef(null);
  const pendingLoadRef = useRef(null);
  const tracksRef = useRef([]);
  const indexRef = useRef(-1);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const currentTrack = currentIndex >= 0 ? tracks[currentIndex] || null : null;

  function onControllerReady(controller) {
    controllerRef.current = controller;
    if (pendingLoadRef.current) {
      const id = pendingLoadRef.current;
      pendingLoadRef.current = null;
      controller.load(id);
    }
  }

  function onPlayerState({ playing }) {
    setIsPlaying(playing);
  }

  function onPlayerEnded() {
    next();
  }

  function onPlayerError() {
    next();
  }

  function onPlayerProgress(update) {
    setProgress(update);
  }

  function playTrack(index) {
    const track = tracksRef.current[index];
    if (!track) return;
    setCurrentIndex(index);
    setIsPlaying(true);
    if (controllerRef.current) {
      controllerRef.current.load(track.videoId);
    } else {
      pendingLoadRef.current = track.videoId;
    }
  }

  async function loadPlaylist(id) {
    setIsLoading(true);
    setError(null);
    setCurrentIndex(-1);
    setTracks([]);
    setPlaylist(null);
    setIsPlaying(false);
    const started = Date.now();

    const result = await Promise.race([fetchPlaylist(id), sleep(60000)]);

    const elapsed = Date.now() - started;
    if (elapsed < MIN_LOADING_MS) {
      await sleep(MIN_LOADING_MS - elapsed);
    }

    setIsLoading(false);

    if (!result || !result.ok) {
      const reason = !result ? "network" : result.reason;
      return { ok: false, reason };
    }

    const data = {
      id,
      name: result.name,
      artwork: result.artwork,
      tracks: result.tracks
    };
    cachePlaylist(id, data);
    setPlaylist({ id, name: result.name, artwork: result.artwork });
    setTracks(result.tracks);
    return { ok: true };
  }

  function toggle() {
    if (!tracksRef.current.length) return;
    if (currentIndex < 0) {
      playTrack(0);
      return;
    }
    if (isPlaying) {
      controllerRef.current?.pause();
    } else {
      controllerRef.current?.play();
    }
  }

  function next() {
    const tracks = tracksRef.current;
    if (!tracks.length) return;
    if (currentIndex < 0) {
      playTrack(0);
      return;
    }
    if (currentIndex + 1 >= tracks.length) {
      controllerRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    playTrack(currentIndex + 1);
  }

  function prev() {
    const tracks = tracksRef.current;
    if (!tracks.length) return;
    if (currentIndex <= 0) {
      playTrack(0);
      return;
    }
    playTrack(currentIndex - 1);
  }

  function seekToFraction(fraction) {
    controllerRef.current?.seekToFraction(fraction);
  }

  function clearError() {
    setError(null);
  }

  return {
    playlist,
    tracks,
    currentTrack,
    currentIndex,
    isPlaying,
    isReady,
    isLoading,
    error,
    progress,
    loadPlaylist,
    playTrack,
    toggle,
    next,
    prev,
    seekToFraction,
    clearError,
    playerProps: {
      videoId: currentTrack?.videoId || null,
      startSeconds: 0,
      onControllerReady,
      onPlayerState,
      onPlayerEnded,
      onPlayerError,
      onPlayerProgress
    }
  };
}

async function fetchPlaylist(id) {
  const cached = readCache(id);
  if (cached) return cached;

  let res;
  try {
    res = await fetch(`/api/playlist?id=${encodeURIComponent(id)}`);
  } catch {
    return { ok: false, reason: "network" };
  }

  if (!res.ok) {
    return { ok: false, reason: "network" };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: "network" };
  }

  if (!data.ok) {
    return { ok: false, reason: data.reason || "network" };
  }

  return data;
}

function readCache(id) {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}:${id}`);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || !entry.at || Date.now() - entry.at > CACHE_TTL_MS) {
      localStorage.removeItem(`${CACHE_KEY}:${id}`);
      return null;
    }
    if (entry.data?.ok && Array.isArray(entry.data.tracks) && entry.data.tracks.length) {
      return entry.data;
    }
  } catch {
    /* cache unavailable */
  }
  return null;
}

function cachePlaylist(id, data) {
  try {
    localStorage.setItem(
      `${CACHE_KEY}:${id}`,
      JSON.stringify({ at: Date.now(), data })
    );
  } catch {
    /* storage full or unavailable */
  }
}
