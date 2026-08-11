import { useState } from "react";
import VintageMusicExperience from "./components/VintageMusicExperience.jsx";
import { parsePlaylistUrl } from "./utils/spotify.js";
import { useYouTubePlaylist } from "./hooks/useYouTubePlaylist.js";

const ERROR_COPY = {
  empty: "Pehle playlist ka link daalo.",
  invalid: "Ye playlist link thoda galat lag raha hai.",
  shortlink: "Ye chhota link hai — Spotify app se playlist ka full link copy karke laao.",
  notfound: "Ye playlist hum tak nahi pahunch paayi. Private ya delete ho sakti hai.",
  network: "Spotify tak pahunch nahi paaye. Thodi der baad dobara koshish karo."
};

export default function App() {
  const [phase, setPhase] = useState("intro");
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [showPlaylist, setShowPlaylist] = useState(false);
  const {
    playlist,
    tracks,
    currentTrack,
    currentIndex,
    isPlaying,
    isLoading,
    progress,
    loadPlaylist,
    playTrack,
    toggle,
    next,
    prev,
    seekToFraction,
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
      onPlayTrack={playTrack}
      tracks={tracks}
      currentIndex={currentIndex}
      playerProps={playerProps}
    />
  );
}
