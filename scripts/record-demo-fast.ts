/**
 * Silent ~3 minute demo at 1.5x the old four-minute pace.
 *
 *   npm run seed
 *   npm run dev
 *   npm run demo:video:fast
 *
 * Writes:
 *   demo/buildlink-et-demo-fast.mp4        (1280x720)
 *   demo/buildlink-et-demo-fast-1080.mp4   (1920x1080)
 * Never opens .env files in the browser.
 */
import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";
import { chromium, type Locator, type Page } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK = path.join(ROOT, "demo", ".work");
const MEDIA = "/cursor/stores/bc-aee08d9f-2631-4b44-8b3a-13cf7accd8e6/media";
const ARTIFACTS = "/opt/cursor/artifacts";
const BASE = process.env.DEMO_BASE_URL || "http://127.0.0.1:3000";
const TARGET_MS = 180_000;
const TYPE_DELAY = 42;
const AFTER_CLICK = 400;
const SEED_PASSWORD = "demo123";

type Skip = { scene: string; reason: string };
type Size = { width: number; height: number; file: string };

const SIZES: Size[] = [
  { width: 1280, height: 720, file: "buildlink-et-demo-fast.mp4" },
  { width: 1920, height: 1080, file: "buildlink-et-demo-fast-1080.mp4" },
];

const SCREENSHOTS = [
  "demo_home_hero.png",
  "demo_home_about_stats.png",
  "demo_login.png",
  "demo_register.png",
  "demo_jobs.png",
  "demo_job_detail.png",
  "demo_dashboard_menu.png",
] as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function resetAndSeed() {
  if (process.env.DEMO_SKIP_SEED === "1") return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await runCommand("npm", ["run", "seed"]);
}

async function waitForApp() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(BASE, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      /* still booting */
    }
    await sleep(500);
  }
  throw new Error(`App did not respond at ${BASE}`);
}

function overlayJs(captionSize: number) {
  return `(() => {
  if (window.__demoSetCaption) return;
  const cursor = document.createElement("div");
  cursor.setAttribute("data-demo", "cursor");
  cursor.style.cssText = "position:fixed;top:0;left:0;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#e8772e;border:2px solid #fff;z-index:2147483646;pointer-events:none;opacity:0";
  document.documentElement.appendChild(cursor);
  const hideDev = document.createElement("style");
  hideDev.textContent = "nextjs-portal,[data-next-badge-root],#__next-dev-overlay { display:none !important; }";
  document.documentElement.appendChild(hideDev);
  const caption = document.createElement("div");
  caption.setAttribute("data-demo", "caption");
  caption.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483645;background:#14100ce0;color:#fff;font:${captionSize}px/1.35 system-ui,sans-serif;padding:10px 18px 12px;pointer-events:none";
  document.documentElement.appendChild(caption);
  window.__demoSetCaption = function (text) { caption.textContent = text; };
  window.addEventListener("mousemove", function (event) {
    cursor.style.opacity = "1";
    cursor.style.transform = "translate(" + event.clientX + "px, " + event.clientY + "px)";
  }, true);
  window.addEventListener("mousedown", function (event) {
    const ripple = document.createElement("div");
    ripple.style.cssText = "position:fixed;top:" + event.clientY + "px;left:" + event.clientX + "px;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;border:2px solid #e8772e;z-index:2147483647;pointer-events:none;opacity:0.9";
    document.documentElement.appendChild(ripple);
    const start = performance.now();
    const tick = function (now) {
      const t = Math.min(1, (now - start) / 360);
      const size = 12 + t * 28;
      ripple.style.width = size + "px";
      ripple.style.height = size + "px";
      ripple.style.margin = (-size / 2) + "px 0 0 " + (-size / 2) + "px";
      ripple.style.opacity = String(0.9 * (1 - t));
      if (t < 1) requestAnimationFrame(tick);
      else ripple.remove();
    };
    requestAnimationFrame(tick);
  }, true);
})()`;
}

const HIDE_DEV_JS = `(() => {
  const hideDev = document.createElement("style");
  hideDev.textContent = "nextjs-portal,[data-next-badge-root],#__next-dev-overlay { display:none !important; }";
  document.documentElement.appendChild(hideDev);
})()`;

async function setCaption(page: Page, text: string) {
  await page.evaluate(`window.__demoSetCaption && window.__demoSetCaption(${JSON.stringify(text)})`);
}

async function waitPage(page: Page, overlay: string) {
  await page.waitForLoadState("domcontentloaded");
  try {
    await page.waitForLoadState("networkidle", { timeout: 3000 });
  } catch {
    /* Next.js can keep a socket open in dev */
  }
  await page.evaluate(overlay);
}

async function go(page: Page, url: string, overlay: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitPage(page, overlay);
}

async function humanClick(page: Page, locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
  await sleep(90);
  const box = await locator.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 16), { steps: 7 });
    await sleep(80);
  }
  await locator.click({ delay: 45 });
  await sleep(AFTER_CLICK);
}

async function typeInto(page: Page, locator: Locator, text: string) {
  await humanClick(page, locator);
  await locator.fill("");
  await locator.pressSequentially(text, { delay: TYPE_DELAY });
}

async function headerLink(page: Page, name: string) {
  return page.locator("header").getByRole("link", { name, exact: true }).first();
}

async function scrollToHeading(page: Page, title: string) {
  const found = await page.evaluate(`(() => {
    const text = ${JSON.stringify(title)};
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, p"));
    const el = headings.find(function (item) { return item.textContent && item.textContent.trim() === text; });
    if (!el) return false;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  })()`);
  await sleep(550);
  return Boolean(found);
}

type SceneCtx = {
  page: Page;
  overlay: string;
  skip: (reason: string) => void;
};

async function runScene(
  page: Page,
  overlay: string,
  worked: string[],
  skipped: Skip[],
  name: string,
  caption: string,
  budgetMs: number,
  fn: (ctx: SceneCtx) => Promise<void>,
) {
  const deadline = Date.now() + budgetMs;
  await setCaption(page, caption);
  try {
    await fn({
      page,
      overlay,
      skip: (reason) => {
        skipped.push({ scene: name, reason });
      },
    });
    worked.push(name);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    skipped.push({ scene: name, reason });
    await page.screenshot({ path: path.join(WORK, `${name.replace(/\s+/g, "-")}.png`) }).catch(() => {});
    await go(page, BASE, overlay).catch(() => {});
  }
  const left = deadline - Date.now();
  if (left > 0) await sleep(left);
}

async function sceneLanding(ctx: SceneCtx) {
  const { page, overlay } = ctx;
  await go(page, `${BASE}/`, overlay);
  await page.getByRole("heading", { name: /Build Smarter/ }).waitFor({ timeout: 8000 });
  await sleep(900);
  await page.locator('form button[type="submit"]').first().waitFor();
  await sleep(700);
  for (const title of ["What is open today", "Featured contractors", "Latest jobs", "How it works", "About us"]) {
    const ok = await scrollToHeading(page, title);
    if (!ok) ctx.skip(`Landing section "${title}" was not on the page`);
    await sleep(700);
  }
  await humanClick(page, await headerLink(page, "How it works"));
  await sleep(800);
}

async function sceneLogin(ctx: SceneCtx) {
  const { page, overlay } = ctx;
  await go(page, `${BASE}/`, overlay);
  await humanClick(page, page.locator("header").getByRole("link", { name: "Log in" }).first());
  await page.waitForURL(/\/login/, { timeout: 8000 });
  await waitPage(page, overlay);
  await page.getByRole("heading", { name: "Log in" }).waitFor();
  await typeInto(page, page.locator('input[name="email"]'), "dawit@buildlink.et");
  await typeInto(page, page.locator('input[name="password"]'), SEED_PASSWORD);
  await humanClick(page, page.getByRole("button", { name: "Log in" }));
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 12000 });
  await waitPage(page, overlay);
}

async function sceneJobs(ctx: SceneCtx) {
  const { page, overlay } = ctx;
  const jobsNav = page.locator("header").getByRole("link", { name: "Jobs", exact: true }).first();
  if (await jobsNav.count()) await humanClick(page, jobsNav);
  else await go(page, `${BASE}/jobs`, overlay);
  await page.waitForURL(/\/jobs/, { timeout: 8000 });
  await waitPage(page, overlay);
  await page.getByRole("heading", { name: "Jobs" }).waitFor();
  await sleep(600);
  const job = page.getByRole("link", { name: /Junior site engineer/ }).first();
  if (!(await job.count())) {
    const fallback = page.locator("main a").filter({ hasText: /.+/ }).first();
    if (!(await fallback.count())) {
      ctx.skip("No job links were on the jobs page");
      return;
    }
    await humanClick(page, fallback);
  } else {
    await humanClick(page, job);
  }
  await waitPage(page, overlay);
}

async function sceneDetailRequest(ctx: SceneCtx) {
  const { page, overlay } = ctx;
  const apply = page.getByRole("button", { name: "Apply" });
  if (!(await apply.count())) {
    ctx.skip("Apply form was not on the job detail");
    return;
  }
  await apply.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(500);
  await typeInto(page, page.locator('textarea[name="message"]'), "I can join the Jimma house crew this month.");
  const fee = page.locator('input[name="proposedFee"]');
  if (await fee.count()) await typeInto(page, fee, "16000");
  await humanClick(page, apply);
  const notice = page.getByText(/Sent|already|Could not/i).first();
  try {
    await notice.waitFor({ timeout: 8000 });
  } catch {
    ctx.skip("Apply did not show a confirmation");
  }
  await sleep(600);
}

async function sceneDashboardMenu(ctx: SceneCtx) {
  const { page, overlay } = ctx;
  await go(page, `${BASE}/dashboard#applications`, overlay);
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  const apps = page.getByRole("heading", { name: "My applications" });
  if (await apps.count()) {
    await apps.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await sleep(800);
  } else {
    ctx.skip("My applications heading was missing");
  }
  const menu = page.locator("header button[aria-haspopup='menu']").first();
  if (!(await menu.count())) {
    ctx.skip("Account menu was not in the header");
    return;
  }
  await humanClick(page, menu);
  await page.getByRole("menuitem", { name: "My listings" }).waitFor();
  await sleep(700);
  await humanClick(page, page.getByRole("menuitem", { name: "My listings" }));
  await waitPage(page, overlay);
  const listings = page.getByRole("heading", { name: "My listings" });
  if (await listings.count()) {
    await listings.evaluate((el) => el.scrollIntoView({ block: "center" }));
  }
  await sleep(900);
}

function ffprobeSeconds(file: string) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
    let out = "";
    child.stdout.on("data", (chunk) => {
      out += String(chunk);
    });
    child.on("exit", (code) => {
      const value = Number.parseFloat(out.trim());
      if (code === 0 && Number.isFinite(value)) resolve(value);
      else reject(new Error(`ffprobe failed on ${file}`));
    });
  });
}

async function convertToMp4(input: string, output: string) {
  mkdirSync(path.dirname(output), { recursive: true });
  await runCommand("ffmpeg", [
    "-y",
    "-i",
    input,
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-r",
    "30",
    "-movflags",
    "+faststart",
    output,
  ]);
}

async function fitDuration(output: string) {
  let seconds = await ffprobeSeconds(output);
  const tmp = path.join(WORK, `padded-${path.basename(output)}`);
  if (seconds >= 165 && seconds <= 195) return seconds;
  if (seconds < 165) {
    const pad = (180 - seconds).toFixed(3);
    await runCommand("ffmpeg", [
      "-y",
      "-i",
      output,
      "-vf",
      `tpad=stop_mode=clone:stop_duration=${pad}`,
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-movflags",
      "+faststart",
      tmp,
    ]);
    await runCommand("cp", [tmp, output]);
    seconds = await ffprobeSeconds(output);
  } else {
    const speed = seconds / 180;
    await runCommand("ffmpeg", [
      "-y",
      "-i",
      output,
      "-filter:v",
      `setpts=PTS/${speed.toFixed(4)}`,
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-movflags",
      "+faststart",
      tmp,
    ]);
    await runCommand("cp", [tmp, output]);
    seconds = await ffprobeSeconds(output);
  }
  return seconds;
}

async function recordSize(size: Size) {
  const worked: string[] = [];
  const skipped: Skip[] = [];
  const overlay = overlayJs(size.height >= 1080 ? 18 : 15);
  const output = path.join(ROOT, "demo", size.file);
  const workDir = path.join(WORK, `${size.width}x${size.height}`);
  mkdirSync(workDir, { recursive: true });

  const browser = await chromium.launch({
    headless: process.env.DEMO_HEADED !== "1",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    recordVideo: { dir: workDir, size: { width: size.width, height: size.height } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  await page.addInitScript({ content: overlay });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("buildlink-theme", "light");
    } catch {
      /* ignore */
    }
  });

  await runScene(page, overlay, worked, skipped, "1 landing", "Jobs, crews, materials and rentals in Southwest Ethiopia", 38_000, sceneLanding);
  await runScene(page, overlay, worked, skipped, "2 login", "Sign in to browse and apply", 24_000, sceneLogin);
  await runScene(page, overlay, worked, skipped, "3 jobs", "Open jobs around Jimma", 22_000, sceneJobs);
  await runScene(page, overlay, worked, skipped, "4 detail", "Read the pay, then apply", 36_000, sceneDetailRequest);
  await runScene(page, overlay, worked, skipped, "5 dashboard", "Applications stay on your dashboard. Use the account menu for listings.", 30_000, sceneDashboardMenu);

  const video = page.video();
  await context.close();
  await browser.close();
  if (!video) throw new Error("Playwright did not write a video");
  const webm = await video.path();
  await convertToMp4(webm, output);
  const seconds = await fitDuration(output);
  return { output, seconds, worked, skipped, width: size.width, height: size.height };
}

async function captureScreenshots() {
  mkdirSync(MEDIA, { recursive: true });
  mkdirSync(ARTIFACTS, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  await page.addInitScript({ content: HIDE_DEV_JS });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("buildlink-theme", "light");
    } catch {
      /* ignore */
    }
  });

  async function snap(name: string) {
    await page.evaluate(HIDE_DEV_JS);
    const dest = path.join(MEDIA, name);
    await page.screenshot({ path: dest, type: "png" });
    copyFileSync(dest, path.join(ARTIFACTS, name));
  }

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: /Build Smarter/ }).waitFor();
  await sleep(400);
  await snap("demo_home_hero.png");

  await page.evaluate(`(() => {
    const el = Array.from(document.querySelectorAll("h2")).find(function (item) { return item.textContent && item.textContent.trim() === "About us"; });
    if (el) el.scrollIntoView({ block: "center" });
  })()`);
  await sleep(400);
  await snap("demo_home_about_stats.png");

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Log in" }).waitFor();
  await sleep(300);
  await snap("demo_login.png");

  await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Create an account" }).waitFor();
  await sleep(400);
  await snap("demo_register.png");

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill("dawit@buildlink.et");
  await page.locator('input[name="password"]').fill(SEED_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 12000 });

  await page.goto(`${BASE}/jobs`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Jobs" }).waitFor();
  await sleep(400);
  await snap("demo_jobs.png");

  const job = page.getByRole("link", { name: /Junior site engineer/ }).first();
  if (await job.count()) await job.click();
  else await page.locator("main a").first().click();
  await page.waitForURL(/\/jobs\//, { timeout: 8000 });
  await sleep(500);
  await snap("demo_job_detail.png");

  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  const menu = page.locator("header button[aria-haspopup='menu']").first();
  await menu.click();
  await page.getByRole("menuitem", { name: "My listings" }).waitFor();
  await sleep(250);
  await snap("demo_dashboard_menu.png");

  await context.close();
  await browser.close();
}

async function copyOutputs(files: string[]) {
  mkdirSync(MEDIA, { recursive: true });
  for (const file of files) {
    copyFileSync(file, path.join(MEDIA, path.basename(file)));
  }
}

async function main() {
  mkdirSync(WORK, { recursive: true });
  mkdirSync(path.join(ROOT, "demo"), { recursive: true });
  await resetAndSeed();
  await waitForApp();

  const results = [];
  for (const size of SIZES) {
    results.push(await recordSize(size));
  }
  await captureScreenshots();
  await copyOutputs(results.map((item) => item.output));

  for (const file of readdirSync(WORK)) {
    if (file.endsWith(".webm")) unlinkSync(path.join(WORK, file));
  }

  for (const item of results) {
    console.log(`Demo MP4: ${item.output}`);
    console.log(`Size: ${item.width}x${item.height}`);
    console.log(`Duration: ${item.seconds.toFixed(3)} seconds`);
    console.log(`Worked: ${item.worked.join(", ") || "(none)"}`);
    if (item.skipped.length) {
      console.log("Skipped:");
      for (const skip of item.skipped) console.log(`- ${skip.scene}: ${skip.reason}`);
    }
  }
  console.log(`Screenshots: ${SCREENSHOTS.join(", ")}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
