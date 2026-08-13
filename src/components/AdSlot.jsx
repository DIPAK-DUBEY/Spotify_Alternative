import { useEffect, useRef } from "react";
import { appConfig } from "../data/config.js";

export default function AdSlot({ code, className = "" }) {
  const ads = appConfig.ads || {};
  const activeCode = (code || ads.bannerCode || "").trim();
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !activeCode) return;

    container.innerHTML = "";
    const doc = new DOMParser().parseFromString(activeCode, "text/html");
    const scripts = Array.from(doc.querySelectorAll("script"));

    const body = doc.body.cloneNode(true);
    body.querySelectorAll("script").forEach((s) => s.remove());
    const inert = body.innerHTML.trim();
    if (inert) container.innerHTML = inert;

    for (const script of scripts) {
      const el = document.createElement("script");
      if (script.src) el.src = script.src;
      if (script.textContent && script.textContent.trim()) {
        el.textContent = script.textContent;
      }
      for (const attr of Array.from(script.attributes)) {
        if (attr.name !== "src") el.setAttribute(attr.name, attr.value);
      }
      container.appendChild(el);
    }

    return () => {
      container.innerHTML = "";
    };
  }, [activeCode]);

  if (!ads.enabled || !activeCode) return null;

  return <div ref={containerRef} className={className} />;
}