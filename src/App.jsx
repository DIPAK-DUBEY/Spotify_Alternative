import { useState } from "react";
import VintageMusicExperience from "./components/VintageMusicExperience.jsx";
import { parsePlaylistUrl } from "./utils/spotify.js";
import { useYouTubePlaylist } from "./hooks/useYouTubePlaylist.js";

const ERROR_COPY = {
  empty: "Please paste a playlist link first.",
  invalid: "This playlist link doesn't look right.",
  shortlink: "This is a short link — open the playlist in the Spotify app and copy the full link.",
  notfound: "We couldn't find this playlist. It may be private or deleted.",
  network: "We couldn't reach Spotify. Please try again in a moment."
};

export default function App() {
  const [phase, setPhase] = useState("intro");
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const {
    playlist,
    tracks,
    currentTrack,
    currentIndex,
    isPlaying,
    isLoading,
    progress,
    loadPlaylist,
    loadMore,
    playTrack,
    toggle,
    next,
    prev,
    seekToFraction,
    totalCount,
    done,
    canLoadMore,
    truncated,
    isLoadingMore,
    loadMoreError,
    playerProps
  } = useYouTubePlaylist();

  async function handlePlaylistSubmit(url) {
    setError(null);
    setInputValue(url);
    const parsed = parsePlaylistUrl(url);
    if (!parsed.ok) {
      setError(ERROR_COPY[parsed.reason] || ERROR_COPY.invalid);
      return;
    }
    setPhase("loading");
    setShowPlaylist(false);
    const result = await loadPlaylist(parsed.id);
    if (result.ok) {
      setIsChanging(false);
      setPhase("player");
    } else {
      setError(ERROR_COPY[result.reason] || ERROR_COPY.network);
      setPhase("intro");
    }
  }

  function handleChangePlaylist() {
    setIsChanging(true);
    setPhase("intro");
    setInputValue("");
    setError(null);
  }

  function handleCancelChange() {
    setIsChanging(false);
    setPhase("player");
  }

  return (
    <VintageMusicExperience
      phase={phase}
      isChanging={isChanging}
      playlist={playlist}
      currentTrack={currentTrack}
      isPlaying={isPlaying}
      progress={progress}
      trackCount={tracks.length}
      error={error}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSubmit={handlePlaylistSubmit}
      onChangePlaylist={handleChangePlaylist}
      onCancelChange={handleCancelChange}
      onToggle={toggle}
      onNext={next}
      onPrev={prev}
      onSeekFraction={seekToFraction}
      onShowPlaylist={() => setShowPlaylist(true)}
      onClosePlaylist={() => setShowPlaylist(false)}
      showPlaylist={showPlaylist}
      onOpenFaq={() => setShowFaq(true)}
      onCloseFaq={() => setShowFaq(false)}
      showFaq={showFaq}
      tracks={tracks}
      currentIndex={currentIndex}
      totalCount={totalCount}
      canLoadMore={canLoadMore}
      truncated={truncated}
      isLoadingMore={isLoadingMore}
      loadMoreError={loadMoreError}
      onLoadMore={loadMore}
      onPlayTrack={playTrack}
      playerProps={playerProps}
    />
  );
}
