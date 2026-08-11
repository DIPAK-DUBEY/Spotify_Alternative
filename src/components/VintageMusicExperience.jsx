import { AnimatePresence, motion } from "framer-motion";
import ArtworkBackground from "./ArtworkBackground.jsx";
import CinematicOverlay from "./CinematicOverlay.jsx";
import GrainOverlay from "./GrainOverlay.jsx";
import Vignette from "./Vignette.jsx";
import PlaylistInput from "./PlaylistInput.jsx";
import PlaylistPanel from "./PlaylistPanel.jsx";
import LoadingMemory from "./LoadingMemory.jsx";
import MusicPlayer from "./MusicPlayer.jsx";
import TulipMark from "./TulipMark.jsx";
import YouTubePlayer from "./YouTubePlayer.jsx";
import { appConfig } from "../data/config.js";

const phaseTransition = { duration: 0.7, ease: [0.22, 1, 0.36, 1] };

export default function VintageMusicExperience({
  phase,
  isChanging,
  playlist,
  currentTrack,
  isPlaying,
  progress,
  trackCount,
  error,
  inputValue,
  onInputChange,
  onSubmit,
  onChangePlaylist,
  onCancelChange,
  onToggle,
  onNext,
  onPrev,
  onSeekFraction,
  onShowPlaylist,
  onClosePlaylist,
  showPlaylist,
  tracks,
  currentIndex,
  totalCount,
  canLoadMore,
  truncated,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  onPlayTrack,
  playerProps
}) {
  const { tagline, footer, personal } = appConfig;
  const isPlayer = phase === "player";

  return (
    <main className="screen">
      <ArtworkBackground
        zooming={phase === "loading"}
        trackArtwork={null}
      />
      <CinematicOverlay />
      <Vignette />
      <GrainOverlay />
      <YouTubePlayer {...playerProps} />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col items-center px-5 pt-[max(env(safe-area-inset-top),1.5rem)] text-center md:items-start md:px-12 md:text-left">
        <div className="flex w-full flex-col items-center md:items-start">
          <p
            className={`text-balance font-serif2 italic text-shadow-cinematic text-ivory/95 transition-all duration-1000 ease-cin ${
              isPlayer ? "text-[clamp(0.8rem,2.2vw,0.95rem)]" : "text-[clamp(0.9rem,2.6vw,1.1rem)]"
            }`}
          >
            {tagline}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-[#120c08]/70 px-3.5 py-1 font-dev text-sm text-gold backdrop-blur-sm md:hidden">
            <TulipMark className="h-3.5 w-3.5 text-accent/90" />
            <span>{personal.greeting}</span>
          </p>
        </div>
      </header>

      <div className="absolute right-4 top-[max(env(safe-area-inset-top),1.6rem)] z-20 hidden items-center gap-2 rounded-full border border-gold/30 bg-[#120c08]/70 px-4 py-1.5 backdrop-blur-sm md:flex md:right-8">
        <TulipMark className="h-3.5 w-3.5 text-accent/90" />
        <span className="font-dev text-base text-gold md:text-lg">For {personal.name}</span>
      </div>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div
            key="intro"
            className="absolute inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12, filter: "blur(5px)" }}
            transition={phaseTransition}
          >
            <PlaylistInput
              isChanging={isChanging}
              error={error}
              inputValue={inputValue}
              onInputChange={onInputChange}
              onSubmit={onSubmit}
              onCancel={onCancelChange}
            />
          </motion.div>
        )}

        {phase === "loading" && (
          <motion.div
            key="loading"
            className="absolute inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <LoadingMemory isChanging={isChanging} />
          </motion.div>
        )}

        {phase === "player" && (
          <motion.div
            key="player"
            className="absolute inset-0 z-30"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <MusicPlayer
              playlist={playlist}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              progress={progress}
              trackCount={trackCount}
              totalCount={totalCount}
              canLoadMore={canLoadMore}
              truncated={truncated}
              isLoadingMore={isLoadingMore}
              loadMoreError={loadMoreError}
              onLoadMore={onLoadMore}
              onToggle={onToggle}
              onNext={onNext}
              onPrev={onPrev}
              onSeekFraction={onSeekFraction}
              onChangePlaylist={onChangePlaylist}
              onShowPlaylist={onShowPlaylist}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {isPlayer && (
        <PlaylistPanel
          open={showPlaylist}
          onClose={onClosePlaylist}
          playlist={playlist}
          tracks={tracks}
          currentIndex={currentIndex}
          isPlaying={isPlaying}
          totalCount={totalCount}
          canLoadMore={canLoadMore}
          truncated={truncated}
          isLoadingMore={isLoadingMore}
          loadMoreError={loadMoreError}
          onLoadMore={onLoadMore}
          onPlayTrack={onPlayTrack}
        />
      )}

      {!isPlayer && (
        <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 pb-[max(env(safe-area-inset-bottom),1rem)] text-center">
          <p className="font-hand text-base text-shadow-cinematic text-cream/65">{footer}</p>
        </footer>
      )}
    </main>
  );
}
