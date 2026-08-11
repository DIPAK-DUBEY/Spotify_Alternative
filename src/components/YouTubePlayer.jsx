import { useEffect, useRef, useState } from "react";

let apiPromise = null;

function loadYouTubeApi() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiPromise;
}

export default function YouTubePlayer({
  videoId,
  startSeconds = 0,
  onControllerReady,
  onPlayerState,
  onPlayerEnded,
  onPlayerError,
  onPlayerProgress
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const lastLoadedRef = useRef(null);
  const progressTimerRef = useRef(null);
  const [apiReady, setApiReady] = useState(false);

  const handlersRef = useRef({ onPlayerState, onPlayerEnded, onPlayerError });
  handlersRef.current = { onPlayerState, onPlayerEnded, onPlayerError };

  useEffect(() => {
    let disposed = false;
    loadYouTubeApi().then(() => {
      if (!disposed) setApiReady(true);
    });
    return () => {
      disposed = true;
      stopProgressTimer();
      playerRef.current?.destroy?.();
      playerRef.current = null;
      lastLoadedRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!apiReady || !videoId || !containerRef.current) return;

    const YT = window.YT;

    if (!playerRef.current) {
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          start: startSeconds
        },
        events: {
          onReady: () => {
            onControllerReady?.({
              play: () => playerRef.current?.playVideo(),
              pause: () => playerRef.current?.pauseVideo(),
              toggle: () => {
                const state = playerRef.current?.getPlayerState?.();
                if (state === YT.PlayerState.PLAYING) {
                  playerRef.current?.pauseVideo();
                } else {
                  playerRef.current?.playVideo();
                }
              },
              seekToFraction: (fraction) => {
                const duration = playerRef.current?.getDuration?.();
                if (duration && fraction >= 0 && fraction <= 1) {
                  playerRef.current?.seekTo(duration * fraction, true);
                }
              },
              load: (id) => {
                if (lastLoadedRef.current !== id) {
                  lastLoadedRef.current = id;
                  playerRef.current?.loadVideoById({ videoId: id, startSeconds });
                }
                playerRef.current?.playVideo();
              }
            });
            if (lastLoadedRef.current) {
              playerRef.current?.playVideo();
            }
          },
          onStateChange: (event) => {
            const { PLAYING, PAUSED, ENDED } = YT.PlayerState;
            if (event.data === PLAYING) {
              handlersRef.current.onPlayerState?.({ playing: true });
              startProgressTimer();
            } else if (event.data === PAUSED) {
              handlersRef.current.onPlayerState?.({ playing: false });
              stopProgressTimer();
            } else if (event.data === ENDED) {
              handlersRef.current.onPlayerState?.({ playing: false });
              stopProgressTimer();
              handlersRef.current.onPlayerEnded?.();
            }
          },
          onError: () => {
            handlersRef.current.onPlayerState?.({ playing: false });
            stopProgressTimer();
            handlersRef.current.onPlayerError?.();
          }
        }
      });
      lastLoadedRef.current = videoId;
      return;
    }

    if (lastLoadedRef.current !== videoId) {
      lastLoadedRef.current = videoId;
      playerRef.current.loadVideoById({ videoId, startSeconds });
      playerRef.current.playVideo();
    }
  }, [apiReady, videoId, startSeconds]);

  function startProgressTimer() {
    stopProgressTimer();
    progressTimerRef.current = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const current = player.getCurrentTime?.() || 0;
      const duration = player.getDuration?.() || 0;
      onPlayerProgress?.({ current, duration });
    }, 400);
  }

  function stopProgressTimer() {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }

  return (
    <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
      <div ref={containerRef} />
    </div>
  );
}
