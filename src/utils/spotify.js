const PLAYLIST_ID_PATTERN = /^[0-9A-Za-z]{22}$/;

const SPOTIFY_URL_PATTERN = /https?:\/\/[^\s"'<>]*open\.spotify\.com[^\s"'<>]*/i;
const SPOTIFY_URI_PATTERN = /spotify:playlist:([0-9A-Za-z]+)/i;

export function parsePlaylistUrl(raw) {
  if (!raw || !raw.trim()) {
    return { ok: false, reason: "empty" };
  }

  const text = raw.trim();

  if (text.includes("spotify.link")) {
    return { ok: false, reason: "shortlink" };
  }

  const uriMatch = text.match(SPOTIFY_URI_PATTERN);
  if (uriMatch) {
    return validateId(uriMatch[1]);
  }

  const urlMatch = text.match(SPOTIFY_URL_PATTERN);
  if (urlMatch) {
    return parseSpotifyUrl(urlMatch[0]);
  }

  return { ok: false, reason: "invalid" };
}

function parseSpotifyUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (!/open\.spotify\.com$/.test(parsed.hostname) && !parsed.hostname.endsWith(".open.spotify.com")) {
    return { ok: false, reason: "invalid" };
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  const playlistIndex = parts.findIndex((p) => p === "playlist");
  if (playlistIndex === -1 || !parts[playlistIndex + 1]) {
    return { ok: false, reason: "invalid" };
  }

  return validateId(parts[playlistIndex + 1]);
}

function validateId(id) {
  if (!PLAYLIST_ID_PATTERN.test(id)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, id, url: `https://open.spotify.com/playlist/${id}` };
}

export function shareUrl(id) {
  return `https://open.spotify.com/playlist/${id}`;
}
