export const config = { maxDuration: 60 };

const SPOTIFY_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const YT_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const YT_CLIENT_VERSION = "2.20250101.00.00";

const MAX_TRACKS = 1000;
const CHUNK_MAX = 100;
const CONCURRENCY = 8;
const RESOLVE_BUDGET_MS = 45000;

const PF_URL = "https://api-partner.spotify.com/pathfinder/v1/query";
const PF_QUERY_ID = "e4b2953f160e58e38ac025d79b5a9b3aceee5c4c716598e9830bfceb69faff5f";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  const id = (req.query.id || "").toString().trim();

  if (!/^[0-9A-Za-z]{22}$/.test(id)) {
    return json(res, 400, { ok: false, reason: "invalid" });
  }

  const start = clampInt(req.query.start, 0, 0, MAX_TRACKS - 1);
  const count = clampInt(req.query.count, CHUNK_MAX, 0, CHUNK_MAX);

  try {
    const meta = await resolvePlaylist(id);
    if (!meta.ok) {
      return json(res, 200, { ok: false, reason: meta.reason });
    }

    const range = meta.tracks.slice(start, start + count);
    const resolved = await resolveTracks(range);

    const done = start + resolved.tracks.length >= meta.totalCount;
    const empty = start >= meta.tracks.length;

    return json(
      res,
      200,
      {
        ok: true,
        id,
        name: meta.name,
        artwork: meta.artwork,
        totalCount: meta.totalCount,
        start,
        nextStart: resolved.truncated ? start : start + count,
        done,
        truncated: resolved.truncated,
        tracks: empty ? [] : resolved.tracks
      },
      done && !resolved.truncated
    );
  } catch {
    return json(res, 200, { ok: false, reason: "network" });
  }
}

function json(res, status, payload, cacheable) {
  res.status(status);
  if (cacheable) {
    res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=86400");
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function clampInt(value, fallback, min, max) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

async function resolvePlaylist(id) {
  const [embedResult, oembedResult] = await Promise.allSettled([
    fetchSpotifyEmbed(id),
    fetchOembed(id)
  ]);

  const embed = embedResult.status === "fulfilled" ? embedResult.value : null;
  const oembed = oembedResult.status === "fulfilled" ? oembedResult.value : null;

  if (!embed || !embed.tracks.length) {
    return { ok: false, reason: !embed ? (oembed ? "notfound" : "network") : "notfound" };
  }

  let tracks = embed.tracks.slice(0, MAX_TRACKS);
  let totalCount = embed.tracks.length;

  if (embed.tracks.length >= 50 && embed.token) {
    try {
      const first = await fetchPlaylistContents(id, embed.token, 0, 100);
      if (first && first.totalCount > 0) {
        totalCount = Math.min(first.totalCount, MAX_TRACKS);
        tracks = first.items.slice(0, MAX_TRACKS);
        while (tracks.length < totalCount) {
          const page = await fetchPlaylistContents(id, embed.token, tracks.length, 100);
          if (!page || !page.items.length) break;
          tracks = tracks.concat(page.items.slice(0, Math.max(0, MAX_TRACKS - tracks.length)));
        }
      }
    } catch {
      /* paging unavailable — fall back to the embed's track list */
    }
  }

  return {
    ok: true,
    name: embed.name || oembed?.name,
    artwork: embed.artwork || oembed?.artwork,
    totalCount: Math.max(totalCount, tracks.length),
    tracks
  };
}

async function fetchSpotifyEmbed(id) {
  const res = await fetch(`https://open.spotify.com/embed/playlist/${id}`, {
    headers: {
      "User-Agent": SPOTIFY_UA,
      "Accept-Language": "en",
      Accept: "text/html"
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!res.ok) return null;

  const html = await res.text();
  const token = (html.match(/"accessToken":"([^"]+)"/) || [])[1] || null;
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;

  const data = JSON.parse(match[1]);
  const entity = data?.props?.pageProps?.state?.data?.entity;
  if (!entity) return null;

  const name = entity.name || entity.title || null;
  const artwork = extractVisualIdentity(entity.visualIdentity);

  const rawTracks = Array.isArray(entity.trackList) ? entity.trackList : [];
  const tracks = rawTracks
    .filter((t) => t && typeof t.title === "string" && t.title.trim() && t.entityType !== "episode")
    .slice(0, MAX_TRACKS)
    .map((t) => ({
      title: t.title,
      artist: String(t.subtitle || "").trim(),
      durationMs: Number(t.duration) || 0
    }));

  return { name, artwork, tracks, token };
}

async function fetchPlaylistContents(id, token, offset, limit) {
  const variables = {
    uri: `spotify:playlist:${id}`,
    offset,
    limit,
    order: "default"
  };
  const extensions = { persistedQuery: { version: 1, sha256Hash: PF_QUERY_ID } };

  const res = await fetch(
    `${PF_URL}?operationName=fetchPlaylistContents&variables=${encodeURIComponent(
      JSON.stringify(variables)
    )}&extensions=${encodeURIComponent(JSON.stringify(extensions))}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": SPOTIFY_UA
      },
      signal: AbortSignal.timeout(8000)
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  const content = data?.data?.playlistV2?.content;
  if (!content) return null;

  return {
    totalCount: Number(content.totalCount) || 0,
    items: mapPfItems(content.items)
  };
}

function mapPfItems(items) {
  const out = [];
  if (!Array.isArray(items)) return out;

  for (const item of items) {
    const d = item?.itemV2?.data;
    if (!d || d.__typename !== "Track") continue;
    if (typeof d.name !== "string" || !d.name.trim()) continue;

    out.push({
      title: d.name,
      artist: (d.artists?.items || [])
        .map((a) => a?.profile?.name)
        .filter(Boolean)
        .join(", "),
      durationMs: Number(d.trackDuration?.totalMilliseconds) || 0
    });
  }
  return out;
}

function extractVisualIdentity(visualIdentity) {
  if (!visualIdentity) return null;
  const img =
    visualIdentity.image?.url ||
    visualIdentity.imageUrl ||
    visualIdentity.images?.[0]?.url ||
    (Array.isArray(visualIdentity.image) ? visualIdentity.image[0]?.url : null);
  if (typeof img === "string" && img) {
    return img.replace(/^https?:\/\/[^/]+/, "https://i.scdn.co");
  }
  return null;
}

async function fetchOembed(id) {
  const res = await fetch(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(
      `https://open.spotify.com/playlist/${id}`
    )}`,
    { signal: AbortSignal.timeout(6000) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return { name: data?.title || null, artwork: data?.thumbnail_url || null };
}

async function resolveTracks(tracks) {
  const deadline = Date.now() + RESOLVE_BUDGET_MS;
  const results = [];
  let truncated = false;

  for (let i = 0; i < tracks.length; i += CONCURRENCY) {
    if (Date.now() > deadline) {
      truncated = true;
      break;
    }
    const chunk = tracks.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(chunk.map((t) => searchYouTube(t)));
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value) {
        results.push(s.value);
      }
    }
  }

  return { tracks: results, truncated };
}

async function searchYouTube(track) {
  const query = [track.title, firstArtist(track.artist)].filter(Boolean).join(" ").slice(0, 180);
  if (!query) return null;

  const candidates = await trySearch(query, track);
  if (!candidates || !candidates.length) return null;

  const pick = pickBest(candidates, track);
  if (!pick) return null;

  return {
    videoId: pick.videoId,
    title: track.title,
    artist: track.artist,
    artwork: pick.thumbnail || null,
    videoTitle: pick.videoTitle || null,
    videoDuration: pick.durationSeconds || null
  };
}

async function trySearch(query, track) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const res = await fetch(`https://www.youtube.com/youtubei/v1/search?key=${YT_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": SPOTIFY_UA
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: YT_CLIENT_VERSION,
              hl: "en"
            }
          },
          query,
          params: "EgIQAQ%3D%3D"
        }),
        signal: AbortSignal.timeout(6000)
      });

      if (!res.ok) {
        await sleep(300 * (attempt + 1));
        continue;
      }

      const data = await res.json();
      return parseVideoRenderers(data);
    } catch {
      await sleep(300 * (attempt + 1));
    }
  }
  return null;
}

function parseVideoRenderers(data) {
  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
      ?.contents;

  const out = [];
  if (!Array.isArray(contents)) return out;

  for (const section of contents) {
    const items = section?.itemSectionRenderer?.contents;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const vr = item?.videoRenderer;
      if (!vr?.videoId || !vr?.title?.runs?.[0]?.text) continue;

      const lengthText = vr.lengthText?.simpleText;
      if (!lengthText) continue;

      const thumbnails = vr.thumbnail?.thumbnails;
      const thumbnail = thumbnails?.[thumbnails.length - 1]?.url || null;

      out.push({
        videoId: vr.videoId,
        videoTitle: vr.title.runs[0].text,
        durationSeconds: parseDuration(lengthText),
        channel: vr.ownerText?.runs?.[0]?.text || "",
        thumbnail
      });
    }
  }
  return out;
}

function pickBest(candidates, track) {
  const targetSec = track.durationMs ? track.durationMs / 1000 : null;

  if (targetSec) {
    const ranked = candidates
      .filter((c) => c.durationSeconds)
      .sort((a, b) => Math.abs(a.durationSeconds - targetSec) - Math.abs(b.durationSeconds - targetSec));
    const close = ranked.find((c) => Math.abs(c.durationSeconds - targetSec) <= 15);
    if (close) return close;
  }

  return candidates[0] || null;
}

function firstArtist(artist) {
  return (artist || "").split(",")[0].trim();
}

function parseDuration(text) {
  const parts = String(text || "")
    .split(":")
    .map(Number);
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || null;
}
