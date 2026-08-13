import { appConfig } from "../data/config.js";

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="font-hand text-xl text-gold">{title}</h2>
      <div className="mt-2 space-y-2 font-serif2 text-sm leading-relaxed text-cream/90">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage({ onClose }) {
  return (
    <main className="screen overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-xl flex-col items-center px-5 py-10">
        <div className="vintage-frame w-full rounded-xl border-sand/40 px-5 py-6 backdrop-blur-md md:px-8 md:py-8">
          <h1 className="font-hand text-3xl text-ivory md:text-4xl">Privacy Policy</h1>
          <p className="mt-1 font-hand text-sm text-cream/60">Last updated: August 2026</p>

          <Section title="What we collect">
            <p>
              {appConfig.title} does not require an account, does not ask for any
              personal details, and does not store your playlists. Your Spotify
              playlist is read on demand to show the track list, nothing more.
            </p>
          </Section>

          <Section title="Visitor counter">
            <p>
              The visitor counter on the page stores only an anonymous running
              count. No location, device or browsing data is collected by us.
            </p>
          </Section>

          <Section title="Third-party services">
            <p>
              The site uses the YouTube player to play music, Spotify
              (via its public API) to read playlists, and Vercel for hosting.
              These services may process data according to their own privacy
              policies.
            </p>
            <p>
              Advertising on this site is provided by the ad partner Adsterra.
              Like most ad networks, it may use cookies to serve and measure
              advertisements. Please see{" "}
              <a
                href="https://adsterra.com/privacy-policy/"
                target="_blank"
                rel="noreferrer"
                className="text-gold underline underline-offset-4"
              >
                Adsterra&apos;s privacy policy
              </a>{" "}
              for details.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              The player itself does not set cookies, but embedded YouTube video
              playback and the advertising partner may place cookies on your
              device. You can block or delete cookies through your browser
              settings.
            </p>
          </Section>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="touch-target mt-6 font-hand text-lg text-cream/80 underline-offset-4 transition-colors duration-200 hover:text-ivory md:text-xl"
        >
          ← Back to the music
        </button>
      </div>
    </main>
  );
}