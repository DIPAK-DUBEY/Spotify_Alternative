# दिलवर सलाम — A Little Memory

Ek purani yaad ka music experience. Ek playlist, ek gaon, ek shaam.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Images

Optimize artwork again after replacing `image.png`:

```bash
npm run images
```

## Deploy (Vercel)

```bash
npm i -g vercel
vercel
```

Zero keys, zero config. Ek `api/playlist.mjs` serverless function hai jo:

1. Spotify playlist ka public embed page padhkar track list nikalta hai
   (koi Spotify API key nahi chahiye)
2. Har gaane ke liye YouTube search karke video dhunda leta hai
   (koi YouTube API key nahi chahiye)
3. Full songs browser me chalti hain — koi login, koi Premium nahi

## Personalization

Edit `src/data/config.js` — title, tagline, personal name, accent colors.

For a custom social share image, set an absolute URL on the `og:image` meta
tag in `index.html` (WhatsApp needs an absolute URL).

## Honest limitations

- Private playlists ka track list bina login ke nahi milta (public playlists
  chalti hain)
- Embed page se at most 50 tracks milte hain (typical playlists ke liye kaafi)
- Playback YouTube se hota hai — monetized videos pe ads aa sakti hain
  (purane gaano ke uploads zyada tar ad-free hote hain)
- Koi gaana YouTube pe na mile to wo skip ho jata hai
