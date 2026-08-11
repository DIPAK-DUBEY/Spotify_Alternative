import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { appConfig } from "../data/config.js";

export default function ArtworkBackground({ zooming = false, trackArtwork = null }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [trackArt, setTrackArt] = useState(null);
  const [showTrack, setShowTrack] = useState(false);
  const parallaxRef = useRef(null);

  useEffect(() => {
    if (!trackArtwork) {
      setShowTrack(false);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setTrackArt(trackArtwork);
      setShowTrack(true);
    };
    img.src = trackArtwork;
  }, [trackArtwork]);

  useEffect(() => {
    if (!isDesktop || reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
    const el = parallaxRef.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", `${(x * 6).toFixed(2)}px`);
        el.style.setProperty("--py", `${(y * 6).toFixed(2)}px`);
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [isDesktop, reduceMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div ref={parallaxRef} className="parallax absolute -inset-2">
        <img
          src={appConfig.artworkMobile}
          srcSet={`${appConfig.artworkMobile} 767w, ${appConfig.artworkDesktop} 1600w`}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className={`absolute inset-0 h-full w-full object-cover object-bottom ${
            zooming ? "kenburns-zoom" : "kenburns"
          }`}
        />
      </div>

      <div
        className="absolute inset-0 transition-opacity duration-[1400ms] ease-cin"
        style={{ opacity: showTrack && trackArt ? 0.92 : 0 }}
      >
        {trackArt && (
          <img
            src={trackArt}
            alt=""
            className="absolute inset-0 h-full w-full scale-[1.03] object-cover object-center"
          />
        )}
      </div>
    </div>
  );
}
