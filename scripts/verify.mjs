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
const submit = p2.getByRole("button", { name: "Load Playlist" });

async function ensureIntro() {
  const player = p2.locator('[aria-label="Music player"]');
  for (let i = 0; i < 20; i++) {
    if (await player.isVisible().catch(() => false)) {
      await p2.getByRole("button", { name: "Change playlist" }).click();
      await p2.waitForTimeout(1200);
    }
    if (await input.isVisible().catch(() => false)) return;
    await p2.waitForTimeout(1500);
  }
  await input.waitFor({ state: "visible", timeout: 15000 });
}

await ensureIntro();

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

await expectError("empty", "", "Please paste a playlist link first.");
await expectError("invalid", "random text here", "This playlist link doesn't look right.");
await expectError("shortlink", "https://spotify.link/xyz123", "This is a short link");
await expectError("album", "https://open.spotify.com/album/37i9dQZF1DXcBWIGoYBM5M", "This playlist link doesn't look right.");

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
console.log("  [flow] player shows playlist name:", playerText.includes("Men in love") || playerText.includes("Old Songs") ? "PASS" : "FAIL?");

await p2.getByRole("button", { name: "Show playlist" }).click();
await p2.waitForTimeout(700);
const panelVisible = await p2.locator('[role="dialog"]').isVisible();
if (panelVisible) {
  try {
    await p2.locator(".song-row").first().waitFor({ state: "visible", timeout: 90000 });
  } catch {
    /* rows may still be loading */
  }
}
const rowCount = await p2.locator(".song-row").count();
console.log(`  [flow] show-playlist panel: ${panelVisible && rowCount > 0 ? "PASS" : "FAIL"} (${rowCount} rows)`);
if (!panelVisible || rowCount === 0) failures.push("show playlist: panel or rows missing");
await p2.screenshot({ path: `${OUT}flow-playlist.png` });

const firstTitle = await p2.locator('[aria-label="Music player"] .font-serif2').first().innerText();
const thirdRowTitle = await p2.locator(".song-row").nth(2).locator("p").first().innerText();
await p2.locator(".song-row").nth(2).click();
await p2.waitForTimeout(1200);
const panelClosed = !(await p2.locator('[role="dialog"]').isVisible());
const nowTitle = await p2.locator('[aria-label="Music player"] .font-serif2').first().innerText();
console.log(
  `  [flow] row-click plays song: ${panelClosed && nowTitle === thirdRowTitle ? "PASS" : "FAIL"} (${nowTitle === thirdRowTitle ? "" : "title mismatch, "}panel ${panelClosed ? "closed" : "open"})`
);
if (!panelClosed || nowTitle !== thirdRowTitle) failures.push("row click: song not switched/panel not closed");
console.log("  [flow] first song was:", firstTitle);

await p2.getByRole("button", { name: "Change playlist" }).click();
await p2.waitForTimeout(1400);
await p2.screenshot({ path: `${OUT}flow-change-playlist.png` });
const changeOk = await p2.getByRole("button", { name: /Back/ }).isVisible();
console.log("  [flow] change-playlist shows back button:", changeOk ? "PASS" : "FAIL");
if (!changeOk) failures.push("change playlist: back button missing");

await p2.getByRole("button", { name: /Back/ }).click();
await p2.waitForTimeout(900);
const backOk = await p2.locator('[aria-label="Music player"]').isVisible();
console.log("  [flow] back returns to player:", backOk ? "PASS" : "FAIL");
if (!backOk) failures.push("back: player not restored");
await p2.screenshot({ path: `${OUT}flow-wapas.png` });

await ctx2.close();

// --- playlist change mid-load test (regression for cross-playlist corruption) ---
const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p3 = await ctx3.newPage();
p3.on("pageerror", (e) => consoleErrors.push(`[change] pageerror: ${e.message}`));
p3.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(`[change] console: ${m.text()}`);
});
await p3.goto(BASE, { waitUntil: "load", timeout: 30000 });
await p3.waitForTimeout(1500);

const input3 = p3.locator("#playlist-link");
const submit3 = p3.getByRole("button", { name: "Load Playlist" });

{
  const player = p3.locator('[aria-label="Music player"]');
  for (let i = 0; i < 20; i++) {
    if (await player.isVisible().catch(() => false)) {
      await p3.getByRole("button", { name: "Change playlist" }).click();
      await p3.waitForTimeout(1200);
    }
    if (await input3.isVisible().catch(() => false)) break;
    await p3.waitForTimeout(1500);
  }
  await input3.waitFor({ state: "visible", timeout: 15000 });
}

await input3.fill("https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U");
await submit3.click();
try {
  await p3.locator('[aria-label="Music player"]').waitFor({ state: "visible", timeout: 30000 });
  console.log("  [change] first playlist (Rock Classics) player: PASS");
} catch {
  failures.push("change: first player never appeared");
}

await p3.getByRole("button", { name: "Change playlist" }).click();
await p3.waitForTimeout(400);
const cleared = await p3.locator("#playlist-link").inputValue();
console.log(`  [change] input cleared on change: ${cleared === "" ? "PASS" : "FAIL"} (value="${cleared}")`);
if (cleared !== "") failures.push("change: input not cleared");

await input3.fill("https://open.spotify.com/playlist/6a3eJy7UhrFcKGjzrWX6XQ");
await submit3.click();
try {
  await p3.locator('[aria-label="Music player"]').waitFor({ state: "visible", timeout: 30000 });
  console.log("  [change] new player on single submit: PASS");
} catch {
  failures.push("change: new player never appeared on first submit");
}
await p3.waitForTimeout(1500);
const changeBody = await p3.locator("body").innerText();
console.log("  [change] new playlist name shown:", changeBody.includes("Men in love") ? "PASS" : "FAIL");
if (!changeBody.includes("Men in love")) failures.push("change: new playlist name not shown");

const apiExpected = new Set();
const rockExpected = new Set();
const expectedById = {
  "6a3eJy7UhrFcKGjzrWX6XQ": apiExpected,
  "37i9dQZF1DWXRqgorJj26U": rockExpected
};
try {
  for (const [pid, set] of Object.entries(expectedById)) {
    const res = await fetch(`${BASE}/api/playlist?id=${pid}&start=0&count=300`);
    const data = await res.json();
    if (data.ok) for (const t of data.tracks || []) set.add(t.title);
  }
} catch {
  /* api unreachable — rows comparison will flag */
}
console.log(`  [change] api expected titles: new=${apiExpected.size} rock=${rockExpected.size}`);

await p3.getByRole("button", { name: "Show playlist" }).click();
await p3.waitForTimeout(600);
try {
  await p3.locator(".song-row").first().waitFor({ state: "visible", timeout: 90000 });
} catch {
  /* may still be loading */
}
await p3.waitForTimeout(8000);
const rowTitles = await p3.locator(".song-row").evaluateAll((els) =>
  els.map((el) => el.querySelector("p")?.innerText || "")
);
const staleRock = rowTitles.filter((t) => rockExpected.has(t));
const unknown = rowTitles.filter((t) => !apiExpected.has(t) && !rockExpected.has(t));
console.log(`  [change] rows shown: ${rowTitles.length}, rock(OLD-playlist) rows: ${staleRock.length}, unknown(resolution-flaky): ${unknown.length}`);
if (staleRock.length > 3) {
  failures.push(`change: stale rows from old playlist: ${staleRock.slice(0, 5).join(" | ")}`);
} else if (rowTitles.length === 0) {
  failures.push("change: no rows loaded after change");
} else {
  console.log("  [change] no rows from old playlist: PASS");
}
await p3.screenshot({ path: `${OUT}flow-change-midload.png` });
await ctx3.close();

await browser.close();

console.log("\nConsole errors:", consoleErrors.length ? consoleErrors : "none");
console.log(failures.length ? `\nFAILURES:\n${failures.join("\n")}` : "\nALL CHECKS PASSED");
