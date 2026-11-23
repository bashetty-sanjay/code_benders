/**
 * CashPilot AI — Full Demo Recording Script (v2)
 * Updated for: smooth page transitions, all 7 screens, all major functions.
 * Scenes: Dashboard → Who Owes Me → Bad Day Triage → Forecast → Simulator →
 *         Invoices (filter+create) → Bills (filter+create) → Customers (ledger) →
 *         AI Assistant → Settings → Grand Finale
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL       = 'http://127.0.0.1:3000';
const OUTPUT_DIR     = path.resolve('demo_recordings');
const FINAL_NAME     = 'codebenders_demo.webm';
const ARTIFACTS_DIR  = 'C:\\Users\\Sanjay\\.gemini\\antigravity\\brain\\31f065a3-77f9-4e25-958b-94c530d56f80';

/* ───────────────────────── helpers ─────────────────────────────── */

async function run() {
  // Prep output dir
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (f.endsWith('.webm')) try { fs.unlinkSync(path.join(OUTPUT_DIR, f)); } catch (_) {}
  }

  console.log('🎬  Launching Chrome (1280×720 HD)…');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--disable-web-security', '--no-sandbox'],
  });

  const context = await browser.newContext({
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1280, height: 720 } },
    viewport:    { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(18000);

  /* Inject HUD + virtual cursor on every page */
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      /* ── HUD pill ── */
      const hud = document.createElement('div');
      hud.id = 'cp-hud';
      hud.style.cssText = `
        position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
        z-index:2147483647; display:flex; align-items:center; gap:12px;
        background:rgba(10,15,30,0.96);
        border:1px solid rgba(99,102,241,0.55);
        box-shadow:0 12px 40px -6px rgba(0,0,0,0.9),0 0 24px rgba(99,102,241,0.25);
        padding:11px 26px; border-radius:9999px;
        backdrop-filter:blur(20px);
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        color:#fff; pointer-events:none;
        transition:all 0.3s cubic-bezier(0.16,1,0.3,1);
        white-space:nowrap;
      `;
      hud.innerHTML = `
        <div style="width:9px;height:9px;border-radius:50%;background:#6366f1;
          box-shadow:0 0 10px #6366f1;flex-shrink:0;"></div>
        <div>
          <div id="cp-hud-title" style="font-size:13px;font-weight:700;
            letter-spacing:-0.01em;color:#f8fafc;">CashPilot AI</div>
          <div id="cp-hud-sub"   style="font-size:11px;font-weight:500;
            color:#94a3b8;margin-top:1px;">Initializing…</div>
        </div>
      `;
      document.body.appendChild(hud);

      /* ── Virtual pointer ── */
      const cur = document.createElement('div');
      cur.id = 'cp-cursor';
      cur.style.cssText = `
        position:fixed;top:0;left:0;width:22px;height:22px;
        z-index:2147483646;pointer-events:none;
        transition:transform 0.16s cubic-bezier(0.2,0,0,1),opacity 0.3s ease;
        opacity:0;
      `;
      cur.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9));">
        <path d="M4 4L11 20L14 13L21 10L4 4Z" fill="#6366f1" stroke="#fff"
          stroke-width="1.8" stroke-linejoin="round"/>
      </svg>`;
      document.body.appendChild(cur);
    });
  });

  /* ── Helper functions ── */

  async function hud(title, sub) {
    await page.evaluate(({ t, s }) => {
      const te = document.getElementById('cp-hud-title');
      const se = document.getElementById('cp-hud-sub');
      const h  = document.getElementById('cp-hud');
      if (te) te.textContent = t;
      if (se) se.textContent = s;
      if (h)  { h.style.transform = 'translateX(-50%) scale(1.04)';
                setTimeout(() => { h.style.transform = 'translateX(-50%) scale(1)'; }, 200); }
    }, { t: title, s: sub });
  }

  async function moveCursor(x, y) {
    await page.evaluate(({ x, y }) => {
      const c = document.getElementById('cp-cursor');
      if (c) { c.style.opacity = '1'; c.style.transform = `translate(${x}px,${y}px)`; }
    }, { x, y });
    await page.mouse.move(x, y, { steps: 10 });
  }

  async function locatorCenter(selector) {
    try {
      const box = await page.locator(selector).first().boundingBox({ timeout: 4000 });
      if (box) return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    } catch (_) {}
    return null;
  }

  async function moveTo(selector) {
    const pt = await locatorCenter(selector);
    if (pt) await moveCursor(pt.x, pt.y);
  }

  async function click(selector, { soft = false } = {}) {
    await moveTo(selector);
    await page.waitForTimeout(90);
    // cursor press effect
    await page.evaluate(() => {
      const c = document.getElementById('cp-cursor');
      if (c) { const t = c.style.transform; c.style.transform = t + ' scale(0.82)'; }
    });
    try { await page.click(selector, { timeout: 4000 }); } catch (e) { if (!soft) console.warn('click miss:', selector, e.message); }
    await page.waitForTimeout(80);
    await page.evaluate(() => {
      const c = document.getElementById('cp-cursor');
      if (c) c.style.transform = c.style.transform.replace(/ scale\(0\.82\)/, '');
    });
  }

  async function typeInto(selector, text, { clear = true } = {}) {
    await click(selector);
    if (clear) await page.fill(selector, '');
    await page.type(selector, text, { delay: 45 });
  }

  async function scroll(px, steps = 10) {
    for (let i = 0; i < steps; i++) {
      await page.evaluate(d => window.scrollBy(0, d), px / steps);
      await page.waitForTimeout(28);
    }
  }

  async function wait(ms) { await page.waitForTimeout(ms); }

  async function nav(url, label) {
    console.log(`  → ${label}`);
    await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(900); // let page-enter animation play
  }

  async function navLink(href) {
    await click(`aside a[href="${href}"]`, { soft: true });
    await wait(900);
  }

  /* ═══════════════════════════════════════════════════════════════
      RECORDING START
     ═══════════════════════════════════════════════════════════════ */

  console.log('\n🎬  SCENE 1 — Executive Dashboard');
  await nav('/dashboard', 'Dashboard');
  await hud('📊 Executive Cockpit', 'Real-time Cash Position · Receivables · Smart Alerts');
  await wait(600);
  // Pan cursor over KPI cards
  for (const x of [340, 530, 730, 930]) {
    await moveCursor(x, 190); await wait(350);
  }
  await moveCursor(640, 190); await wait(400);

  /* ── SCENE 2: Who Owes Me ─────────────────────────────────────── */
  console.log('\n🎬  SCENE 2 — Who Owes Me');
  await hud('⏰ Who Owes Me & Since When?', 'Live Debtor Ageing · 0-15d · 16+ Critical');
  await scroll(360, 10); await wait(500);
  await moveCursor(640, 320); await wait(500);
  // hover WhatsApp link
  await moveTo('a[title="Open WhatsApp with drafted reminder"]'); await wait(500);
  // click Copy Reminder
  await click('button[title="Copy drafted reminder script"]', { soft: true }); await wait(700);

  /* ── SCENE 3: Bad Day Triage ──────────────────────────────────── */
  console.log('\n🎬  SCENE 3 — Bad Day Triage Mode');
  await scroll(-360, 8); await wait(300);
  await hud('🚨 Bad Day Triage Mode', 'Instant bulk-action when multiple clients are late');
  await click('button:has-text("Bad Day Triage Mode")', { soft: true }); await wait(900);
  await moveCursor(640, 360); await wait(500);
  await click('button:has-text("Copy All Reminders")', { soft: true }); await wait(600);
  await click('button:has-text("Close")', { soft: true }); await wait(500);

  /* ── SCENE 4: Cash Forecast ───────────────────────────────────── */
  console.log('\n🎬  SCENE 4 — Cash Forecast (30/60/90 Day)');
  await hud('📈 30–90 Day Cash Forecast', 'Visual Runway Projection · Bills vs Receivables');
  await navLink('/forecast');
  await wait(600);
  for (const label of ['60 Days', '90 Days', '30 Days']) {
    await click(`a:has-text("${label}")`, { soft: true }); await wait(700);
  }
  await moveCursor(640, 320); await wait(500);

  /* ── SCENE 5: What-If Simulator ──────────────────────────────── */
  console.log('\n🎬  SCENE 5 — What-If Delay Simulator');
  await hud('⚡ What-If Scenario Simulator', 'Live impact of delayed client payments');
  await scroll(400, 10); await wait(500);
  await click('button:has-text("+15 Days (Scenario)")', { soft: true }); await wait(500);
  await click('button:has-text("Run Delay Simulation")', { soft: true }); await wait(1200);
  await moveCursor(640, 500); await wait(700);
  await click('button:has-text("Reset")', { soft: true }); await wait(500);

  /* ── SCENE 6: Invoices List ───────────────────────────────────── */
  console.log('\n🎬  SCENE 6 — Invoices & Receivables');
  await hud('📄 Invoices & Receivables', 'Lifecycle · Status Filters · WhatsApp Chase Links');
  await navLink('/invoices');
  await wait(500);
  // Filter tabs
  for (const tab of ['Unpaid & Overdue', 'Paid', 'All']) {
    await click(`a:has-text("${tab}")`, { soft: true }); await wait(600);
  }
  // Hover a row
  await moveCursor(640, 360); await wait(400);
  // Scan down table
  await scroll(200, 6); await wait(400);
  await scroll(-200, 6); await wait(300);

  /* ── SCENE 7: Create New Invoice ─────────────────────────────── */
  console.log('\n🎬  SCENE 7 — New Invoice Builder');
  await hud('🚀 Low-Friction Invoice Builder', 'Service Presets · Smart Due Dates · PDF Export');
  await click('a:has-text("New invoice")', { soft: true });
  await wait(800);
  // Try quick-service preset buttons
  for (const preset of ['UI/UX Sprint', 'Web Dev', 'Consulting']) {
    await click(`button:has-text("${preset}")`, { soft: true }); await wait(400);
  }
  // Set due date preset
  await click('button:has-text("+15 Days")', { soft: true }); await wait(500);
  await scroll(260, 6); await wait(600);
  // Hover submit
  await moveTo('button[type="submit"]'); await wait(500);
  await scroll(-260, 6); await wait(300);

  /* ── SCENE 8: Bills & Expenses ───────────────────────────────── */
  console.log('\n🎬  SCENE 8 — Bills & Outflow');
  await hud('💳 Bills & Outflow Schedule', 'Monthly Recurring Overhead · 1-Click Settlement');
  await navLink('/bills');
  await wait(600);
  await moveCursor(640, 320); await wait(500);
  await scroll(200, 6); await wait(500);
  // Hover a Mark Paid button
  await moveTo('button:has-text("Mark Paid")', ); await wait(500);
  await scroll(-200, 6); await wait(300);
  // Add new bill
  await hud('➕ Add New Bill', 'Log recurring expense in one click');
  await click('a:has-text("Add bill")', { soft: true }); await wait(700);
  await scroll(200, 6); await wait(400);
  await scroll(-200, 6); await wait(300);

  /* ── SCENE 9: Customers Directory ────────────────────────────── */
  console.log('\n🎬  SCENE 9 — Client Directory & Ledger');
  await hud('👥 Client Ledgers & Accounts', 'Individual debtor profile · Invoiced · History');
  await navLink('/customers');
  await wait(600);
  await moveCursor(640, 320); await wait(400);
  // Open first customer detail
  await click('table a:has-text("View")', { soft: true });
  await wait(800);
  await scroll(280, 8); await wait(600);
  await moveCursor(640, 400); await wait(400);
  await scroll(-280, 8); await wait(300);

  /* ── SCENE 10: AI Assistant ───────────────────────────────────── */
  console.log('\n🎬  SCENE 10 — Financial AI Assistant');
  await hud('🤖 Financial Intelligence AI', 'Natural-language runway Q&A · Invoice generation');
  await navLink('/assistant');
  await wait(700);
  // Click a suggestion chip
  await click('button:has-text("Check money owed")', { soft: true }); await wait(1400);
  await moveCursor(640, 400); await wait(500);
  // Type a custom question
  await typeInto('textarea', 'What is my cash runway this month?', { clear: true });
  await wait(400);
  await click('button[type="submit"]', { soft: true }); await wait(1600);
  await moveCursor(640, 420); await wait(500);

  /* ── SCENE 11: Settings ───────────────────────────────────────── */
  console.log('\n🎬  SCENE 11 — Business Settings');
  await hud('🏢 Business Profile & Banking', 'GSTIN · Tax Identifiers · UPI Handle · Default Terms');
  await navLink('/settings');
  await wait(700);
  await scroll(200, 6); await wait(500);
  await moveCursor(640, 400); await wait(400);
  await scroll(-200, 6); await wait(300);

  /* ── FINALE ───────────────────────────────────────────────────── */
  console.log('\n🎬  FINALE — Grand Dashboard Return');
  await hud('✨ Complete One-Person Back Office', 'CashPilot AI · Enterprise Studio · v2.0');
  await navLink('/dashboard');
  await wait(500);
  // Pan all KPIs one more time
  for (const x of [340, 530, 730, 930]) {
    await moveCursor(x, 190); await wait(300);
  }
  await moveCursor(640, 360); await wait(1800);

  /* ═══════════════════════════════════════════════════════════════
      CLOSE & SAVE
     ═══════════════════════════════════════════════════════════════ */
  console.log('\n⏹  Closing recording session…');
  await page.close();
  await context.close();
  await browser.close();

  // Find the recorded webm and rename/copy
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  if (files.length === 0) { console.error('❌  No video file produced!'); process.exit(1); }

  const raw   = path.join(OUTPUT_DIR, files[0]);
  const final = path.join(OUTPUT_DIR, FINAL_NAME);
  if (raw !== final) { if (fs.existsSync(final)) fs.unlinkSync(final); fs.renameSync(raw, final); }
  console.log('✅  Demo video saved:', final);

  // Copy to project root
  const root = path.resolve(FINAL_NAME);
  fs.copyFileSync(final, root);
  console.log('✅  Copied to project root:', root);

  // Copy to Antigravity artifacts dir
  try {
    if (fs.existsSync(ARTIFACTS_DIR)) {
      fs.copyFileSync(final, path.join(ARTIFACTS_DIR, FINAL_NAME));
      console.log('✅  Copied to artifacts dir');
    }
  } catch (_) {}

  console.log('\n🎉  Recording complete! codebenders_demo.webm is ready.');
}

run().catch(err => { console.error('Fatal:', err); process.exit(1); });
