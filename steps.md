# Site Cleanup — Steps (Hinglish)

Ye file har step ko record karti hai jo site cleanup me kiye gaye. Har step Hinglish me likha hai.

## Step 1 — Poori codebase explore kiya

- `src/` me saare components, hooks, utils padhe
- Har file ka usage check kiya (kaun kise import karta hai)
- Build aur serve setup samjha (`vite dev` + `scripts/serve.mjs` port 4173)
- Unused files aur dead code identify kiye

## Step 2 — Unused components/hooks delete kiye

Ye files kisi ko import nahi karte the — dead code the:

- `src/components/PlaybackControls.jsx` — purana Spotify lid-style player control, kahin use nahi hota
- `src/components/SongInfo.jsx` — purana song info display, kahin import nahi hota
- `src/hooks/useSpotifyPlaylist.js` — Spotify embed-based hook, kahin use nahi hota (site ab YouTubePlayer use karti hai)

**Kyun safe:** Inhe koi component/hook import nahi karta tha — sirf self-reference tha. Delete karne se app pe koi asar nahi.

## Step 3 — useYouTubePlaylist hook se dead state/export hataye

`src/hooks/useYouTubePlaylist.js` me ye cheeze unused thi:

- `isReady` — kabhi set hi nahi hota tha (always `false`)
- `isLoading` — koi component use nahi karta
- `error` — koi receive nahi karta
- `clearError()` — koi call nahi karta

App.jsx me bhi `isLoading`, `done` destructure ho rahe the par pass nahi ho rahe the — unhe bhi hataya.

**Kyun safe:** Ye states sirf set ho rahe the, render me kahin use nahi hote the.

## Step 4 — config.js cleanup

`src/data/config.js` me se hataye:

- `previewNotice` — purana "log in to Spotify" message, UI me kahin use nahi
- `theme` block — colors ab CSS variables + tailwind config me hain, ye duplicate tha
- `personal.flower` — koi use nahi karta
- `personal.accent` — koi use nahi karta

**Kyun safe:** In values ko koi component read nahi karta tha.

## Step 5 — spotify.js me unused export hataya

`src/utils/spotify.js` me `shareUrl()` function tha jo kahin use nahi hota — hataya.
`parsePlaylistUrl` aur uska validation flow wahi rehne diya (App.jsx use karta hai).

**Kyun safe:** `shareUrl` ka koi caller nahi tha.

## Step 6 — index.css cleanup (unused classes/keyframes)

In unused CSS rules ko hataya:

- `.safe-pad` — kahin use nahi
- `.focus-ring-violet` — kahin use nahi (`.focus-ring` use hota hai)
- `@keyframes kenburns-fast` / `.kenburns-fast` — kahin use nahi
- `@keyframes fade-up` / `.fade-up` — SongInfo component ke saath dead ho gaya
- `@keyframes warm-pulse` / `.warm-pulse` — kahin use nahi
- `.img-zoom` — kahin use nahi
- `.vinyl-paused` — kahin use nahi
- Unused CSS variables (`--ink`, `--earth`, etc.) — sirf `--paper`, `--ivory`, `--gold` use hote hain

**Kyun safe:** Ye saare classes/knows kisi JSX me use nahi hote the — bundle size chhota hua.

## Step 7 — index.html preload fix

`index.html` me preload links `village-desktop.webp` / `village-mobile.webp` ko point kar rahe the,
par actual artwork `baground.webp` (desktop) aur `phone-bg.webp` (mobile) hai (config.js me).
Preload ab actual images ko point karta hai — browser galat image preload nahi karega.

**Kyun safe:** Preload sirf performance hint hai; actual image path same hi display me use hota hai.

## Step 8 — Unused images delete + optimize script update

- `public/assets/village-desktop.webp`, `village-mobile.webp` delete — site inhe kabhi use nahi karti
  (actual artwork baground.webp / phone-bg.webp hai)
- `scripts/optimize-images.mjs` update — purane village images generate karna band,
  ab sahi sources (`baground.png` + `Phone.png`) se actual used images banata hai

## Step 9 — Build + verify

- `npm run build` — production build (CSS size ghat gaya: 28.87 kB → 26.92 kB)
- `scripts/verify.mjs` — Playwright se full flow test:
  - 6 viewports (mobile + desktop) pe layout check — no overflow
  - Playlist flow: paste link → player → playlist panel → row click → change playlist
  - `ALL CHECKS PASSED`
