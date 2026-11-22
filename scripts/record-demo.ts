/**
 * Silent ~4 minute hackathon demo of BuildLink ET.
 *
 *   npm run seed
 *   npm run dev    (or npm run build && npm run start)
 *   npx playwright install chromium
 *   npm run demo:video
 *
 * Writes demo/buildlink-et-demo.mp4. Never opens .env files in the browser.
 */
import { spawn } from "node:child_process";
import { mkdirSync, readdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mongoose from "mongoose";
import { chromium, type Locator, type Page } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK = path.join(ROOT, "demo", ".work");
const OUTPUT = path.join(ROOT, "demo", "buildlink-et-demo.mp4");
const BASE = process.env.DEMO_BASE_URL || "http://127.0.0.1:3000";
const WIDTH = 1280;
const HEIGHT = 720;
const TARGET_MS = 240_000;
const TYPE_DELAY = 65;
const AFTER_CLICK = 620;
const SEED_PASSWORD = "demo123";
const NEW_PASSWORD = "demo12345";

type Skip = { scene: string; reason: string };

const worked: string[] = [];
const skipped: Skip[] = [];

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
      /* app still booting */
    }
    await sleep(500);
  }
  throw new Error(`App did not respond at ${BASE}`);
}

const OVERLAY_JS = `(() => {
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
  caption.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483645;background:rgba(20,16,12,0.88);color:#fff;font:15px/1.35 system-ui,sans-serif;padding:10px 18px 12px;pointer-events:none";
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
      const t = Math.min(1, (now - start) / 420);
      const size = 12 + t * 34;
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

async function setCaption(page: Page, text: string) {
  await page.evaluate(`window.__demoSetCaption && window.__demoSetCaption(${JSON.stringify(text)})`);
}

async function waitPage(page: Page) {
  await page.waitForLoadState("domcontentloaded");
  try {
    await page.waitForLoadState("networkidle", { timeout: 4000 });
  } catch {
    /* Next.js can keep a socket open in dev */
  }
  await page.evaluate(OVERLAY_JS);
}

async function go(page: Page, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitPage(page);
}

async function humanClick(page: Page, locator: Locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center", inline: "nearest" }));
  await sleep(160);
  const box = await locator.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + Math.min(box.height / 2, 18), { steps: 10 });
    await sleep(140);
  }
  await locator.click({ delay: 70 });
  await sleep(AFTER_CLICK);
}

async function typeInto(page: Page, locator: Locator, text: string) {
  await humanClick(page, locator);
  await locator.fill("");
  await locator.pressSequentially(text, { delay: TYPE_DELAY });
}

async function fillField(page: Page, locator: Locator, text: string) {
  await humanClick(page, locator);
  await locator.fill(text);
}

async function chooseOption(page: Page, ariaLabel: string, option: string) {
  const trigger = page.getByRole("button", { name: ariaLabel }).first();
  await humanClick(page, trigger);
  const item = page.getByRole("option", { name: option, exact: true }).first();
  await humanClick(page, item);
}

async function headerLink(page: Page, name: string) {
  return page.locator("header").getByRole("link", { name, exact: true }).first();
}

async function logout(page: Page) {
  const menu = page.locator("header button[aria-haspopup='menu']").first();
  if (!(await menu.count())) return;
  await humanClick(page, menu);
  const item = page.getByRole("menuitem", { name: "Log out" });
  if (await item.count()) await humanClick(page, item);
  else await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(/\/$|\/login/, { timeout: 8000 }).catch(() => {});
  await waitPage(page);
}

async function login(page: Page, email: string, password: string) {
  await go(page, `${BASE}/login`);
  await typeInto(page, page.locator('input[name="email"]'), email);
  await typeInto(page, page.locator('input[name="password"]'), password);
  await humanClick(page, page.getByRole("button", { name: "Log in" }));
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 12000 });
  await waitPage(page);
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
  await sleep(900);
  return Boolean(found);
}

async function smoothScrollY(page: Page, to: number, durationMs: number) {
  await page.evaluate(`(() => new Promise(function (resolve) {
    const toY = ${to};
    const duration = ${durationMs};
    const start = window.scrollY;
    const delta = toY - start;
    const t0 = performance.now();
    const tick = function (now) {
      const t = Math.min(1, (now - t0) / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      window.scrollTo(0, start + delta * ease);
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  }))()`);
}

type SceneCtx = {
  page: Page;
  skip: (reason: string) => void;
  remaining: () => number;
};

async function runScene(page: Page, name: string, caption: string, budgetMs: number, fn: (ctx: SceneCtx) => Promise<void>) {
  const deadline = Date.now() + budgetMs;
  await setCaption(page, caption);
  try {
    await fn({
      page,
      skip: (reason) => {
        skipped.push({ scene: name, reason });
      },
      remaining: () => deadline - Date.now(),
    });
    worked.push(name);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    skipped.push({ scene: name, reason });
    await page.screenshot({ path: path.join(WORK, `${name.replace(/\s+/g, "-")}.png`) }).catch(() => {});
    await go(page, BASE).catch(() => {});
  }
  const left = deadline - Date.now();
  if (left > 0) await sleep(left);
}

async function sceneLanding(ctx: SceneCtx) {
  const { page } = ctx;
  await go(page, `${BASE}/`);
  await page.getByRole("heading", { name: /Build Smarter/ }).waitFor({ timeout: 8000 });
  await sleep(1800);
  const sections = [
    "Hire skilled contractors",
    "What is open today",
    "Featured contractors",
    "Latest jobs",
    "How it works",
    "Who it is for",
    "About us",
  ];
  for (const title of sections) {
    const ok = await scrollToHeading(page, title);
    if (!ok) ctx.skip(`Landing section "${title}" was not on the page`);
    await sleep(1600);
  }
  const max = await page.evaluate(() => document.body.scrollHeight);
  await smoothScrollY(page, max, 1400);
  await sleep(900);
  await smoothScrollY(page, 0, 1400);
  await sleep(800);
}

async function sceneAccessGate(ctx: SceneCtx) {
  const { page } = ctx;
  await go(page, `${BASE}/`);
  await humanClick(page, await headerLink(page, "Jobs"));
  await page.waitForURL(/\/login/, { timeout: 8000 });
  await waitPage(page);
  await page.getByRole("heading", { name: "Log in" }).waitFor();
  await sleep(1200);
}

async function sceneSignUp(ctx: SceneCtx) {
  const { page } = ctx;
  const email = `demo+${Date.now()}@buildlink.et`;
  await go(page, `${BASE}/register`);
  await page.getByRole("heading", { name: "Create an account" }).waitFor();
  await page.getByRole("button", { name: "Town" }).waitFor();
  await typeInto(page, page.locator('input[name="name"]'), "Selam Bekele");
  await typeInto(page, page.locator('input[name="email"]'), email);
  await typeInto(page, page.locator('input[name="password"]'), NEW_PASSWORD);
  await chooseOption(page, "Town", "Jimma, Oromia");
  await humanClick(page, page.getByRole("button", { name: "Create account" }));
  await page.waitForURL(/\/dashboard/, { timeout: 12000 });
  await waitPage(page);
  await page.getByRole("heading", { name: "Dashboard" }).waitFor();
  await go(page, `${BASE}/profile/edit`);
  await page.getByRole("heading", { name: "Edit profile" }).waitFor();
  await typeInto(page, page.locator('input[name="headline"]'), "Mason for house sites in Jimma");
  await chooseOption(page, "Role", "Contractor");
  await typeInto(page, page.locator('input[name="skills"]'), "Masonry, Blockwork, Plaster");
  await typeInto(page, page.locator('input[name="exp-title-0"]'), "Lead mason");
  await typeInto(page, page.locator('input[name="exp-company-0"]'), "Private houses, Jimma");
  await typeInto(page, page.locator('input[name="exp-years-0"]'), "2022 to 2024");
  await fillField(page, page.locator('textarea[name="exp-description-0"]'), "Block walls and plaster on family houses.");
  await typeInto(page, page.locator('input[name="exp-title-1"]'), "Helper");
  await typeInto(page, page.locator('input[name="exp-company-1"]'), "Site crews, Jimma");
  await typeInto(page, page.locator('input[name="exp-years-1"]'), "2020 to 2022");
  await fillField(page, page.locator('textarea[name="exp-description-1"]'), "Mixed mortar and carried blocks.");
  await humanClick(page, page.getByRole("button", { name: "Save" }));
  await page.waitForURL(/\/profile\//, { timeout: 12000 });
  await waitPage(page);
  await page.getByRole("heading", { name: "Selam Bekele" }).waitFor();
  await scrollToHeading(page, "Experience");
  await sleep(900);
}

async function sceneJobsContractor(ctx: SceneCtx) {
  const { page } = ctx;
  await go(page, `${BASE}/jobs`);
  await page.getByRole("heading", { name: "Jobs" }).waitFor();
  await typeInto(page, page.locator('input[name="q"]'), "engineer");
  await chooseOption(page, "Location", "Jimma");
  await humanClick(page, page.getByRole("button", { name: "Filter" }));
  await waitPage(page);
  const job = page.getByRole("link", { name: /Junior site engineer/ }).first();
  if (!(await job.count())) {
    ctx.skip("Could not find the Jimma site engineer job");
    return;
  }
  await humanClick(page, job);
  await waitPage(page);
  await page.getByText("Need", { exact: true }).first().waitFor();
  await page.locator("dt", { hasText: /^Pay$/ }).first().evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(900);
  await typeInto(
    page,
    page.locator('textarea[name="message"]'),
    "I can start this month on the Jimma house site.",
  );
  await typeInto(page, page.locator('input[name="proposedFee"]'), "16000");
  await humanClick(page, page.getByRole("button", { name: "Apply" }));
  await page.getByText(/Sent/).waitFor({ timeout: 8000 });
  await go(page, `${BASE}/dashboard#applications`);
  await waitPage(page);
  await page.getByRole("heading", { name: "My applications" }).evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.getByText("Submitted").first().waitFor();
  await sleep(900);
}

async function sceneEmployer(ctx: SceneCtx) {
  const { page } = ctx;
  await logout(page);
  await login(page, "sara@buildlink.et", SEED_PASSWORD);
  await go(page, `${BASE}/dashboard#offers`);
  await waitPage(page);
  await page.getByRole("heading", { name: "Offers" }).evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(700);
  const selam = page.getByRole("link", { name: "Selam Bekele" }).first();
  if (!(await selam.count())) {
    ctx.skip("Selam's application was not in Sara's incoming offers");
    return;
  }
  await humanClick(page, selam);
  await waitPage(page);
  await page.getByRole("heading", { name: "Selam Bekele" }).waitFor();
  await scrollToHeading(page, "Experience");
  await sleep(700);
  await scrollToHeading(page, "Reviews");
  await sleep(600);
  await go(page, `${BASE}/dashboard#offers`);
  await waitPage(page);
  const selamRow = page.locator("li").filter({ hasText: "Selam Bekele" }).first();
  await humanClick(page, selamRow.getByRole("button", { name: "Shortlisted" }));
  await waitPage(page);
  await humanClick(page, page.locator("li").filter({ hasText: "Selam Bekele" }).getByRole("button", { name: "Accepted" }));
  await waitPage(page);
  await page.getByText("Accepted").first().waitFor();
  await go(page, `${BASE}/jobs/new`);
  await page.getByRole("heading", { name: "Post a job" }).waitFor();
  await typeInto(page, page.locator('input[name="title"]'), "Plumber for Jimma house");
  await fillField(
    page,
    page.locator('textarea[name="description"]'),
    "Need a plumber for kitchen and bath pipes on a two-storey house in Jimma.",
  );
  await chooseOption(page, "Category", "Civil engineering");
  await chooseOption(page, "Town", "Jimma");
  await chooseOption(page, "Experience", "junior");
  await chooseOption(page, "Employment", "contract");
  await fillField(page, page.locator('input[name="workersNeeded"]'), "1");
  await typeInto(page, page.locator('input[name="duration"]'), "2 weeks");
  await fillField(page, page.locator('input[name="startDate"]'), "2027-01-12");
  await chooseOption(page, "Pay type", "fixed fee");
  await fillField(page, page.locator('input[name="payAmount"]'), "15000");
  await fillField(page, page.locator('input[name="applicationDeadline"]'), "2026-12-20");
  await typeInto(page, page.locator('input[name="skills"]'), "plumbing, pipes");
  await humanClick(page, page.getByRole("button", { name: "Save" }));
  await page.waitForURL(/\/jobs\/[a-f\d]{24}/i, { timeout: 12000 });
  await waitPage(page);
  await sleep(800);
}

async function sceneRatings(ctx: SceneCtx) {
  const { page } = ctx;
  await go(page, `${BASE}/dashboard#offers`);
  await waitPage(page);
  const row = page.locator("li").filter({ hasText: "Selam Bekele" }).first();
  if (!(await row.count())) {
    ctx.skip("Accepted Selam row was missing, so the new review was skipped");
    return;
  }
  await row.evaluate((el) => el.scrollIntoView({ block: "center" }));
  const comment = row.locator('textarea[name="comment"]');
  if (!(await comment.count())) {
    ctx.skip("Leave a review form was not on the accepted application");
    return;
  }
  await typeInto(page, comment, "Selam was clear and ready to start. I would hire her again.");
  await humanClick(page, row.getByRole("button", { name: "Leave a review" }));
  await row.getByText("Review saved.").waitFor({ timeout: 8000 });
  await humanClick(page, row.getByRole("link", { name: "Selam Bekele" }));
  await waitPage(page);
  await scrollToHeading(page, "Reviews");
  await page.getByText(/would hire her again/).waitFor({ timeout: 8000 });
  await sleep(900);
}

async function sceneRentals(ctx: SceneCtx) {
  const { page } = ctx;
  await logout(page);
  await login(page, "meron@buildlink.et", SEED_PASSWORD);
  await go(page, `${BASE}/rentals`);
  await page.getByRole("heading", { name: "Rentals" }).waitFor();
  const mixer = page.getByRole("link", { name: /Concrete mixer/ }).first();
  if (!(await mixer.count())) {
    ctx.skip("Concrete mixer listing was missing");
    return;
  }
  await humanClick(page, mixer);
  await waitPage(page);
  const bookings = page.getByRole("heading", { name: "Confirmed bookings" });
  try {
    await bookings.waitFor({ timeout: 8000 });
    await bookings.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await sleep(800);
    const stamp = page.getByText(/2026-12-01 to 2026-12-05/).first();
    if (await stamp.count()) await humanClick(page, stamp);
  } catch {
    ctx.skip("Confirmed bookings section was missing");
  }
  await typeInto(page, page.locator('textarea[name="message"]'), "Need the mixer for two extra days in Jimma.");
  await fillField(page, page.locator('input[name="startDate"]'), "2026-12-03");
  await fillField(page, page.locator('input[name="endDate"]'), "2026-12-04");
  await humanClick(page, page.getByRole("button", { name: "Request these dates" }));
  const notice = page.locator("form").getByText(/overlap|Sent|Could not|already/i).first();
  await notice.waitFor({ timeout: 8000 }).catch(() => {});
  const noticeText = ((await notice.textContent()) || "").trim();
  if (!/overlap/i.test(noticeText)) {
    ctx.skip("Overlap is blocked when the owner approves, not when a renter requests dates");
  }
  await typeInto(page, page.locator('textarea[name="message"]'), "Free week after the current booking, 10 to 12 Dec.");
  await fillField(page, page.locator('input[name="startDate"]'), "2026-12-10");
  await fillField(page, page.locator('input[name="endDate"]'), "2026-12-12");
  await humanClick(page, page.getByRole("button", { name: "Request these dates" }));
  await page.getByText(/Sent/).waitFor({ timeout: 8000 });
  await sleep(700);
}

async function sceneMaterials(ctx: SceneCtx) {
  const { page } = ctx;
  await logout(page);
  await login(page, "dawit@buildlink.et", SEED_PASSWORD);
  await go(page, `${BASE}/materials`);
  await page.getByRole("heading", { name: "Materials" }).waitFor();
  await chooseOption(page, "Category", "Tiles and ceramics");
  await humanClick(page, page.getByRole("button", { name: "Filter" }));
  await waitPage(page);
  const tiles = page.getByRole("link", { name: /Surplus ceramic floor tiles/ }).first();
  if (!(await tiles.count())) {
    ctx.skip("Tiles listing was missing after the category filter");
    return;
  }
  await humanClick(page, tiles);
  await waitPage(page);
  await typeInto(page, page.locator('textarea[name="message"]'), "I can pick these tiles up in Mettu this week.");
  await humanClick(page, page.getByRole("button", { name: "Send inquiry" }));
  await page.getByText(/Sent/).waitFor({ timeout: 8000 });
  await logout(page);
  await login(page, "meron@buildlink.et", SEED_PASSWORD);
  await go(page, `${BASE}/dashboard#offers`);
  await waitPage(page);
  const row = page.locator("li").filter({ hasText: /tiles/i }).first();
  if (!(await row.count())) {
    ctx.skip("Tile inquiry was not in the seller dashboard");
    return;
  }
  await row.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await humanClick(page, row.getByRole("button", { name: "Agreed" }));
  await waitPage(page);
  await humanClick(page, row.getByRole("link").first());
  await waitPage(page);
  const reserved = page.getByText("Reserved").first();
  if (!(await reserved.count())) ctx.skip("Tiles listing did not show Reserved after Agreed");
  else await reserved.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(800);
}

async function sceneProfessionals(ctx: SceneCtx) {
  const { page } = ctx;
  await go(page, `${BASE}/professionals`);
  await page.getByRole("heading", { name: "Professionals" }).waitFor();
  await typeInto(page, page.locator('input[name="q"]'), "engineer");
  await humanClick(page, page.getByRole("button", { name: "Filter" }));
  await waitPage(page);
  const profile = page.getByRole("link", { name: /site engineer/i }).first();
  if (!(await profile.count())) {
    ctx.skip("No engineer profile matched the search");
    return;
  }
  await humanClick(page, profile);
  await waitPage(page);
  const flag = page.getByText(/Review flag:/).first();
  if (await flag.count()) {
    await flag.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const text = ((await flag.textContent()) || "").toLowerCase();
    if (!text.includes("verified")) {
      ctx.skip("No seeded professional is verified, so the verified badge was skipped");
    }
  } else {
    ctx.skip("Verification badge text was not on the professional listing");
  }
  await sleep(700);
  const requestBtn = page.getByRole("button", { name: "Request verification" });
  if (!(await requestBtn.count())) {
    ctx.skip("Request verification is on your own professional listing, not the user profile page");
  } else {
    await humanClick(page, requestBtn);
  }
  await sleep(600);
}

async function sceneAdmin(ctx: SceneCtx) {
  const { page } = ctx;
  await logout(page);
  await login(page, "admin@buildlink.et", SEED_PASSWORD);
  const adminLink = page.locator("header").getByRole("link", { name: "Admin" });
  if (await adminLink.count()) await humanClick(page, adminLink);
  else await go(page, `${BASE}/admin`);
  await waitPage(page);
  await page.getByRole("heading", { name: "Admin" }).waitFor();
  await page.getByText("People").first().evaluate((el) => el.scrollIntoView({ block: "center" }));
  await sleep(700);
  const approve = page.getByRole("button", { name: "Mark reviewed" }).first();
  if (await approve.count()) {
    await humanClick(page, approve);
    await waitPage(page);
  } else {
    ctx.skip("Verification queue was empty");
  }
  const log = page.getByRole("heading", { name: "Audit log" });
  if (await log.count()) {
    await log.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await sleep(800);
  } else {
    ctx.skip("Audit log heading was missing");
  }
  await humanClick(page, page.getByRole("button", { name: /Switch to dark mode/i }));
  await sleep(700);
  await page.setViewportSize({ width: 390, height: 720 });
  await go(page, `${BASE}/`);
  await sleep(3000);
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });
  await go(page, `${BASE}/`);
  await page.getByRole("heading", { name: /Build Smarter/ }).waitFor();
  await sleep(1200);
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

async function convertToMp4(input: string) {
  mkdirSync(path.dirname(OUTPUT), { recursive: true });
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
    OUTPUT,
  ]);
}

async function fitDuration() {
  let seconds = await ffprobeSeconds(OUTPUT);
  if (seconds >= 225 && seconds <= 255) return seconds;
  const tmp = path.join(WORK, "padded.mp4");
  if (seconds < 225) {
    const pad = (240 - seconds).toFixed(3);
    await runCommand("ffmpeg", [
      "-y",
      "-i",
      OUTPUT,
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
    await runCommand("cp", [tmp, OUTPUT]);
    seconds = await ffprobeSeconds(OUTPUT);
  } else if (seconds > 255) {
    const speed = seconds / 240;
    await runCommand("ffmpeg", [
      "-y",
      "-i",
      OUTPUT,
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
    await runCommand("cp", [tmp, OUTPUT]);
    seconds = await ffprobeSeconds(OUTPUT);
  }
  return seconds;
}

async function record() {
  mkdirSync(WORK, { recursive: true });
  mkdirSync(path.join(ROOT, "demo"), { recursive: true });
  const browser = await chromium.launch({
    headless: process.env.DEMO_HEADED !== "1",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: { dir: WORK, size: { width: WIDTH, height: HEIGHT } },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  await page.addInitScript({ content: OVERLAY_JS });
  await page.addInitScript(() => {
    try {
      localStorage.setItem("buildlink-theme", "light");
    } catch {
      /* ignore */
    }
  });

  await runScene(page, "1 landing", "One platform for jobs, contractors, materials and equipment", 30_000, sceneLanding);
  await runScene(page, "2 access gate", "Everyone signs in first", 15_000, sceneAccessGate);
  await runScene(page, "3 sign up", "Create an account and build a profile with experience", 30_000, sceneSignUp);
  await runScene(page, "4 jobs", "Find jobs and apply with your proposed fee", 35_000, sceneJobsContractor);
  await runScene(
    page,
    "5 employer",
    "Employers state the need and the fee, then pick from rated contractors",
    40_000,
    sceneEmployer,
  );
  await runScene(page, "6 ratings", "Ratings from past employers build trust", 15_000, sceneRatings);
  await runScene(page, "7 rentals", "Double-bookings are blocked automatically", 30_000, sceneRentals);
  await runScene(page, "8 materials", "Surplus materials find a second life", 20_000, sceneMaterials);
  await runScene(page, "9 professionals", "Verified professionals, reviewed by admins", 13_000, sceneProfessionals);
  await runScene(page, "10 admin", "Admin moderation, dark mode and mobile ready", 12_000, sceneAdmin);

  const video = page.video();
  await context.close();
  await browser.close();
  if (!video) throw new Error("Playwright did not write a video");
  const webm = await video.path();
  return webm;
}

async function main() {
  await resetAndSeed();
  await waitForApp();
  const webm = await record();
  await convertToMp4(webm);
  const seconds = await fitDuration();
  for (const file of readdirSync(WORK)) {
    if (file.endsWith(".webm")) unlinkSync(path.join(WORK, file));
  }
  console.log(`Demo MP4: ${OUTPUT}`);
  console.log(`Duration: ${seconds.toFixed(3)} seconds`);
  console.log(`Worked: ${worked.join(", ") || "(none)"}`);
  if (skipped.length) {
    console.log("Skipped:");
    for (const item of skipped) console.log(`- ${item.scene}: ${item.reason}`);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
