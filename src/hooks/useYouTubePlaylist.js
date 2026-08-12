import { useEffect, useRef, useState } from "react";
import YouTubePlayer from "../components/YouTubePlayer.jsx";

const MIN_LOADING_MS = 1200;
const CACHE_KEY = "purane-geet:v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INITIAL_CHUNK = 50;
const CHUNK_SIZE = 50;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function useYouTubePlaylist() {
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const [totalCount, setTotalCount] = useState(null);
  const [done, setDone] = useState(true);
  const [truncated, setTruncated] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const nextStartRef = useRef(0);
  const doneRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const loadMoreRef = useRef(null);
  const playlistIdRef = useRef(null);
  const pendingPlayRef = useRef(false);

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

  useEffect(() => {
    doneRef.current = done;
  }, [done]);

  useEffect(() => {
    playlistIdRef.current = playlist?.id || null;
  }, [playlist?.id]);

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
    setCurrentIndex(-1);
    setTracks([]);
    setPlaylist(null);
    setIsPlaying(false);
    setProgress({ current: 0, duration: 0 });
    setTotalCount(null);
    setDone(true);
    setTruncated(false);
    setLoadMoreError(null);
    setInitialLoaded(false);
    nextStartRef.current = 0;
    pendingPlayRef.current = false;
    pendingLoadRef.current = null;
    controllerRef.current?.stop?.();
    const started = Date.now();

    const metaPromise = fetchChunk(id, 0, 0);
    const chunkPromise = fetchChunk(id, 0, INITIAL_CHUNK);
    const meta = await Promise.race([metaPromise, sleep(60000)]);

    const elapsed = Date.now() - started;
    if (elapsed < MIN_LOADING_MS) {
      await sleep(MIN_LOADING_MS - elapsed);
    }

    if (!meta || !meta.ok) {
      return { ok: false, reason: !meta ? "network" : meta.reason };
    }

    setPlaylist({ id, name: meta.name, artwork: meta.artwork });

    if (meta.tracks && meta.tracks.length) {
      // cached complete playlist — show it all at once
      setTracks(meta.tracks);
      setTotalCount(meta.totalCount ?? meta.tracks.length);
      setDone(true);
      setTruncated(false);
      nextStartRef.current = meta.tracks.length;
      setInitialLoaded(true);
      return { ok: true };
    }

    setTotalCount(meta.totalCount ?? 0);
    setDone(false);
    nextStartRef.current = meta.nextStart ?? 0;

    setIsLoadingMore(true);
    applyChunk(id, chunkPromise);

    return { ok: true };
  }

  async function applyChunk(id, promise) {
    const result = await promise;

    if (playlistIdRef.current !== id) {
      setIsLoadingMore(false);
      return;
    }

    if (!result || !result.ok) {
      setLoadMoreError("Couldn't load the first songs yet — press 'Load more songs' in a moment.");
      setInitialLoaded(true);
      setIsLoadingMore(false);
      return;
    }

    const incoming = result.tracks || [];
    const seen = new Set(tracksRef.current.map((t) => t.videoId));
    const fresh = incoming.filter((t) => t.videoId && !seen.has(t.videoId));
    const nextTracks = fresh.length ? [...tracksRef.current, ...fresh] : tracksRef.current;

    const nextDone = !!result.done;
    tracksRef.current = nextTracks;
    setTracks(nextTracks);
    setTotalCount(result.totalCount ?? nextTracks.length);
    setDone(nextDone);
    setTruncated(!!result.truncated);
    nextStartRef.current = result.nextStart ?? nextTracks.length;
    setInitialLoaded(true);
    setIsLoadingMore(false);

    if (nextDone && !result.truncated && nextTracks.length) {
      cachePlaylist(id, {
        ok: true,
        id,
        name: result.name,
        artwork: result.artwork,
        totalCount: result.totalCount ?? nextTracks.length,
        done: true,
        truncated: false,
        tracks: nextTracks
      });
    }

    if (pendingPlayRef.current && nextTracks.length) {
      pendingPlayRef.current = false;
      playTrack(0);
    }
  }

  async function loadMore() {
    if (loadingMoreRef.current || doneRef.current || !playlist) {
      return { ok: false, stopped: true };
    }
    loadingMoreRef.current = true;
    const id = playlist.id;
    const start = nextStartRef.current;
    setIsLoadingMore(true);
    setLoadMoreError(null);

    const result = await fetchChunk(id, start);

    setIsLoadingMore(false);
    loadingMoreRef.current = false;

    if (playlistIdRef.current !== id) {
      return { ok: false, stopped: true };
    }

    if (!result || !result.ok) {
      setLoadMoreError("Couldn't load more songs right now.");
      return { ok: false, stopped: true };
    }

    const incoming = result.tracks || [];
    const seen = new Set(tracksRef.current.map((t) => t.videoId));
    const fresh = incoming.filter((t) => t.videoId && !seen.has(t.videoId));
    const nextTracks = fresh.length ? [...tracksRef.current, ...fresh] : tracksRef.current;

    const nextDone = !!result.done;
    setTracks(nextTracks);
    setTotalCount(result.totalCount ?? nextTracks.length);
    setDone(nextDone);
    setTruncated(!!result.truncated);
    nextStartRef.current = result.nextStart ?? nextTracks.length;

    if (nextDone && !result.truncated) {
      cachePlaylist(playlist.id, {
        ok: true,
        id: playlist.id,
        name: playlist.name,
        artwork: playlist.artwork,
        totalCount: result.totalCount ?? nextTracks.length,
        done: true,
        truncated: false,
        tracks: nextTracks
      });
    }

    return { ok: true, stopped: nextDone || fresh.length === 0 };
  }

  loadMoreRef.current = loadMore;

  useEffect(() => {
    const id = playlist?.id;
    if (!id || !initialLoaded || doneRef.current) return;
    let cancelled = false;

    (async () => {
      while (!cancelled && !doneRef.current) {
        const res = await loadMoreRef.current();
        if (cancelled) return;
        if (!res || !res.ok || res.stopped) return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [playlist?.id, initialLoaded]);

  function toggle() {
    if (!tracksRef.current.length) {
      pendingPlayRef.current = true;
      return;
    }
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

  return {
    playlist,
    tracks,
    currentTrack,
    currentIndex,
    isPlaying,
    progress,
    totalCount,
    done,
    canLoadMore: !done && (tracks.length > 0 || !initialLoaded),
    truncated,
    isLoadingMore,
    loadMoreError,
    loadPlaylist,
    loadMore,
    playTrack,
    toggle,
    next,
    prev,
    seekToFraction,
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

async function fetchChunk(id, start, count = CHUNK_SIZE) {
  const cacheKey = `${CACHE_KEY}:${id}`;
  if (start === 0) {
    const cached = readCache(id);
    if (cached) return cached;
  }

  let res;
  try {
    res = await fetch(`/api/playlist?id=${encodeURIComponent(id)}&start=${start}&count=${count}`);
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
