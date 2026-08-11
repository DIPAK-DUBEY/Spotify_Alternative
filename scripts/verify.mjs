import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:4173";
const OUT = new URL("../scripts/shots/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 640 },
  { name: "mobile-375", width: 375, height: 667 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-412", width: 412, height: 915 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "desktop", width: 1440, height: 900 }
];

const failures = [];
const consoleErrors = [];

function checkNoScroll(page, label) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollW: doc.scrollWidth,
      innerW: window.innerWidth,
      scrollH: doc.scrollHeight,
      innerH: window.innerHeight,
      bodyOverflow: getComputedStyle(document.body).overflow
    };
  }).then((r) => {
    if (r.scrollW > r.innerW + 1) failures.push(`${label}: horizontal overflow (${r.scrollW} > ${r.innerW})`);
    if (r.scrollH > r.innerH + 1) failures.push(`${label}: vertical overflow (${r.scrollH} > ${r.innerH})`);
    console.log(`  [${label}] ${r.scrollW}x${r.scrollH} viewport=${r.innerW}x${r.innerH} body-overflow=${r.bodyOverflow}`);
  });
}

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(`[${vp.name}] ${m.text()}`);
  });
  page.on("pageerror", (e) => consoleErrors.push(`[${vp.name}] pageerror: ${e.message}`));

  await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}${vp.name}-intro.png` });
  await checkNoScroll(page, `${vp.name}-intro`);

  await ctx.close();
}

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
page.on("pageerror", (e) => consoleErrors.push(`[reduced] pageerror: ${e.message}`));
await page.goto(BASE, { waitUntil: "load", timeout: 30000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}reduced-motion-intro.png` });
await ctx.close();

const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p2 = await ctx2.newPage();
p2.on("pageerror", (e) => consoleErrors.push(`[flow] pageerror: ${e.message}`));
p2.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(`[flow] console: ${m.text()}`);
});
p2.on("requestfailed", (r) => consoleErrors.push(`[flow] reqfail: ${r.url().slice(0, 120)} ${r.failure()?.errorText}`));
await p2.goto(BASE, { waitUntil: "load", timeout: 30000 });
await p2.waitForTimeout(1500);

const input = p2.locator("#playlist-link");
const submit = p2.getByRole("button", { name: "Laayein" });

async function expectError(caseName, value, expectedText) {
  await input.fill(value);
  await submit.click();
  await p2.waitForTimeout(400);
  const body = await p2.locator("body").innerText();
  const ok = body.includes(expectedText);
  console.log(`  [flow] ${caseName}: ${ok ? "PASS" : "FAIL"} (expected "${expectedText}")`);
  if (!ok) failures.push(`${caseName}: expected "${expectedText}"`);
  await p2.screenshot({ path: `${OUT}flow-${caseName}.png` });
}

await expectError("empty", "", "Pehle playlist ka link daalo.");
await expectError("invalid", "random text here", "Ye playlist link thoda galat lag raha hai.");
await expectError("shortlink", "https://spotify.link/xyz123", "Ye chhota link hai");
await expectError("album", "https://open.spotify.com/album/37i9dQZF1DXcBWIGoYBM5M", "Ye playlist link thoda galat lag raha hai.");

const IFRAME_HTML =
  '<iframe data-testid="embed-iframe" style="border-radius:12px" src="https://open.spotify.com/embed/playlist/6a3eJy7UhrFcKGjzrWX6XQ?utm_source=generator&si=fe2b4c2131f54b71" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';

await input.fill(IFRAME_HTML);
await submit.click();
await p2.waitForTimeout(600);
await p2.screenshot({ path: `${OUT}flow-loading.png` });

try {
  await p2.locator('[aria-label="Music player"]').waitFor({ state: "visible", timeout: 20000 });
  console.log("  [flow] iframe-paste -> player: PASS");
} catch {
  failures.push("iframe-paste: player never appeared");
  const state = await p2.evaluate(() => ({
    url: location.href,
    text: document.body.innerText.slice(0, 600),
    iframeCount: document.querySelectorAll("iframe").length,
    images: [...document.images].map((i) => i.currentSrc || i.src).slice(0, 4)
  }));
  console.log("  [flow] player never appeared. state:", JSON.stringify(state, null, 2));
}
await p2.waitForTimeout(1500);
await p2.screenshot({ path: `${OUT}flow-player.png` });
await checkNoScroll(p2, "flow-player");

const playerText = await p2.locator("body").innerText();
console.log("  [flow] player shows playlist name:", playerText.includes("Men in love") || playerText.includes("Purane Geet") ? "PASS" : "FAIL?");

await p2.getByRole("button", { name: "Change playlist" }).click();
await p2.waitForTimeout(1400);
await p2.screenshot({ path: `${OUT}flow-change-playlist.png` });
const changeOk = await p2.getByRole("button", { name: /Wapas/ }).isVisible();
console.log("  [flow] change-playlist shows back button:", changeOk ? "PASS" : "FAIL");
if (!changeOk) failures.push("change playlist: back button missing");

await p2.getByRole("button", { name: /Wapas/ }).click();
await p2.waitForTimeout(900);
const backOk = await p2.locator('[aria-label="Music player"]').isVisible();
console.log("  [flow] wapas returns to player:", backOk ? "PASS" : "FAIL");
if (!backOk) failures.push("wapas: player not restored");
await p2.screenshot({ path: `${OUT}flow-wapas.png` });

await ctx2.close();
await browser.close();

console.log("\nConsole errors:", consoleErrors.length ? consoleErrors : "none");
console.log(failures.length ? `\nFAILURES:\n${failures.join("\n")}` : "\nALL CHECKS PASSED");
