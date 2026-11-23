/**
 * CashPilot AI — Professional Walkthrough Video Generator (v3)
 * Optimized for: ZERO LAG, 60fps native interpolation, 1280x720 HD,
 * and comprehensive coverage of all Problem Statement 1 features.
 */

import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL      = 'http://127.0.0.1:3000';
const OUTPUT_DIR    = path.resolve('demo_recordings');
const FINAL_NAME    = 'codebenders_demo.webm';
const ARTIFACTS_DIR = 'C:\\Users\\Sanjay\\.gemini\\antigravity\\brain\\31f065a3-77f9-4e25-958b-94c530d56f80';

async function run() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (f.endsWith('.webm')) try { fs.unlinkSync(path.join(OUTPUT_DIR, f)); } catch (_) {}
  }

  console.log('🚀 Launching Chrome in High-Performance Mode (1280x720 HD)...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--window-size=1280,720',
    ],
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 720 },
    },
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  // Injected high-performance DOM overlays: hardware-accelerated cursor & sleek HUD
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      // 1. Sleek HUD pill (no heavy blur filter for max framerate)
      if (!document.getElementById('cp-hud')) {
        const hud = document.createElement('div');
        hud.id = 'cp-hud';
        hud.style.cssText = `
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #0d1321;
          border: 1.5px solid #4f46e5;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.95), 0 0 15px rgba(79, 70, 229, 0.35);
          padding: 10px 22px;
          border-radius: 9999px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #ffffff;
          pointer-events: none;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
        `;
        hud.innerHTML = `
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #6366f1; box-shadow: 0 0 10px #6366f1; flex-shrink: 0;"></div>
          <div>
            <div id="cp-hud-title" style="font-size: 13px; font-weight: 700; letter-spacing: -0.01em; color: #f8fafc;">CashPilot AI</div>
            <div id="cp-hud-sub" style="font-size: 11px; font-weight: 500; color: #a5b4fc; margin-top: 1px;">Starting Walkthrough…</div>
          </div>
        `;
        document.body.appendChild(hud);
      }

      // 2. Hardware-accelerated cursor element
      if (!document.getElementById('cp-cursor')) {
        const cur = document.createElement('div');
        cur.id = 'cp-cursor';
        cur.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          z-index: 2147483646;
          pointer-events: none;
          opacity: 0;
          transform: translate3d(640px, 360px, 0);
          transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.3, 1), opacity 0.2s ease;
          will-change: transform;
        `;
        cur.innerHTML = `
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));">
            <path d="M4 4L11 20L14 13L21 10L4 4Z" fill="#6366f1" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
        `;
        document.body.appendChild(cur);
      }

      // 3. Native 60fps smooth scroll function
      window.cpSmoothScrollTo = (targetY, duration = 380) => {
        return new Promise((resolve) => {
          const startY = window.scrollY;
          const diff = targetY - startY;
          const startTime = performance.now();
          function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // smooth easeOutCubic
            const ease = 1 - Math.pow(1 - progress, 3);
            window.scrollTo(0, startY + diff * ease);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              resolve();
            }
          }
          requestAnimationFrame(step);
        });
      };
    });
  });

  // Helper functions
  async function setHUD(title, sub) {
    await page.evaluate(({ t, s }) => {
      const te = document.getElementById('cp-hud-title');
      const se = document.getElementById('cp-hud-sub');
      const h  = document.getElementById('cp-hud');
      if (te) te.textContent = t;
      if (se) se.textContent = s;
      if (h) {
        h.style.transform = 'translateX(-50%) scale(1.04)';
        setTimeout(() => { h.style.transform = 'translateX(-50%) scale(1)'; }, 180);
      }
    }, { t: title, s: sub });
  }

  async function moveCursor(x, y) {
    await page.evaluate(({ x, y }) => {
      const c = document.getElementById('cp-cursor');
      if (c) {
        c.style.opacity = '1';
        c.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    }, { x, y });
  }

  async function clickSelector(selector, { waitAfter = 500 } = {}) {
    try {
      const loc = page.locator(selector).first();
      const box = await loc.boundingBox({ timeout: 3500 });
      if (box) {
        const x = Math.round(box.x + box.width / 2);
        const y = Math.round(box.y + box.height / 2);
        await moveCursor(x, y);
        await page.waitForTimeout(140);
        // visual click press
        await page.evaluate(() => {
          const c = document.getElementById('cp-cursor');
          if (c) c.style.transform += ' scale(0.8)';
        });
        await page.waitForTimeout(70);
        await loc.click({ force: true, timeout: 2500 });
        await page.evaluate(() => {
          const c = document.getElementById('cp-cursor');
          if (c) c.style.transform = c.style.transform.replace(' scale(0.8)', '');
        });
        await page.waitForTimeout(waitAfter);
        return true;
      }
    } catch (_) {}
    return false;
  }

  async function nativeScroll(targetY, duration = 380) {
    await page.evaluate((y) => window.cpSmoothScrollTo?.(y, 380), targetY);
    await page.waitForTimeout(duration + 80);
  }

  async function navTo(pathUrl, hudTitle, hudSub) {
    console.log(`🎬 Navigating: ${pathUrl}`);
    await page.goto(`${BASE_URL}${pathUrl}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    if (hudTitle) await setHUD(hudTitle, hudSub);
    await page.waitForTimeout(700); // let pageEnter animation smoothly complete
  }

  // Pre-load initial page
  await navTo('/dashboard', '📊 Executive Cockpit', 'Real-time Cash Position, Overdue Metrics & Runway');
  await moveCursor(640, 360);
  await page.waitForTimeout(800);

  // =========================================================================
  // SCENE 1: Executive Cockpit & KPI Cards
  // =========================================================================
  console.log('Scene 1: Cockpit KPIs');
  await setHUD('📊 Executive Cockpit', 'Live Cash ($38.4k) · Outstanding Receivables · 4.2 Mo Runway');
  await moveCursor(340, 190);
  await page.waitForTimeout(450);
  await moveCursor(540, 190);
  await page.waitForTimeout(450);
  await moveCursor(740, 190);
  await page.waitForTimeout(450);
  await moveCursor(940, 190);
  await page.waitForTimeout(600);

  // Highlight Actionable Alert Banner
  await moveCursor(640, 270);
  await page.waitForTimeout(600);

  // =========================================================================
  // SCENE 2: "Who Owes Me, How Much, and Since When?"
  // =========================================================================
  console.log('Scene 2: Who Owes Me Ageing Matrix');
  await setHUD('⏰ "Who Owes Me & Since When?"', 'Live Ageing Matrix (0–15d & 16+d Critical) with WhatsApp Chase');
  await nativeScroll(340);
  await page.waitForTimeout(400);

  // Move over Critical Overdue Debtors
  await moveCursor(580, 290);
  await page.waitForTimeout(500);

  // Hover WhatsApp Chase Link
  await clickSelector('a[title="Open WhatsApp with drafted reminder"]', { waitAfter: 400 });
  // Click Copy Reminder Script button with feedback toast
  await clickSelector('button[title="Copy drafted reminder script"]', { waitAfter: 700 });

  // =========================================================================
  // SCENE 3: Bad Day Triage Mode (5 Customers Late at Once)
  // =========================================================================
  console.log('Scene 3: Bad Day Triage');
  await nativeScroll(0);
  await setHUD('🚨 Bad Day Triage Mode', 'Instant Action when Multiple Clients are Late at Once');
  await clickSelector('button:has-text("Bad Day Triage Mode")', { waitAfter: 800 });

  // Inspect triage priority list
  await moveCursor(640, 340);
  await page.waitForTimeout(500);
  // Click Copy All Reminders
  await clickSelector('button:has-text("Copy All Reminders")', { waitAfter: 600 });
  // Close modal
  await clickSelector('button:has-text("Close")', { waitAfter: 500 });

  // =========================================================================
  // SCENE 4: 30–90 Day Cash Forecast & Horizon Toggles
  // =========================================================================
  console.log('Scene 4: Cash Forecast');
  await clickSelector('aside a[href="/forecast"]', { waitAfter: 700 });
  await setHUD('📈 30–90 Day Cash Forecast', 'Visual Runway Trajectory · Inflows vs Outflows Over Time');
  await page.waitForTimeout(600);

  // Switch Horizons
  await clickSelector('a:has-text("60 Days")', { waitAfter: 650 });
  await clickSelector('a:has-text("90 Days")', { waitAfter: 650 });
  await clickSelector('a:has-text("30 Days")', { waitAfter: 600 });

  // =========================================================================
  // SCENE 5: What-If Delay Simulator (Client Paying 15 Days Late)
  // =========================================================================
  console.log('Scene 5: What-If Simulator');
  await nativeScroll(420);
  await setHUD('⚡ What-If Scenario Simulator', 'Simulate Key Client Paying 15 Days Late & Runway Impact');
  await page.waitForTimeout(400);

  // Click scenario preset: +15 Days Late
  await clickSelector('button:has-text("+15 Days (Scenario)")', { waitAfter: 500 });
  // Run delay simulation
  await clickSelector('button:has-text("Run Delay Simulation")', { waitAfter: 1100 });

  // Inspect simulation results
  await moveCursor(640, 500);
  await page.waitForTimeout(700);
  // Reset simulation
  await clickSelector('button:has-text("Reset")', { waitAfter: 500 });

  // =========================================================================
  // SCENE 6: Invoices & Receivables Lifecycle
  // =========================================================================
  console.log('Scene 6: Invoices List');
  await clickSelector('aside a[href="/invoices"]', { waitAfter: 600 });
  await setHUD('📄 Invoices & Receivables', 'Full Lifecycle · Filter Overdue / Paid · WhatsApp Follow-Up');
  await page.waitForTimeout(500);

  // Switch filter tabs
  await clickSelector('a:has-text("Unpaid & Overdue")', { waitAfter: 500 });
  await clickSelector('a:has-text("Paid")', { waitAfter: 500 });
  await clickSelector('a:has-text("All")', { waitAfter: 500 });

  // =========================================================================
  // SCENE 7: Invoice Details, PDF Export & Assisted Reminders
  // =========================================================================
  console.log('Scene 7: Invoice Details');
  await clickSelector('table tbody tr:first-child a:has-text("View"), table tbody tr:first-child a', { waitAfter: 800 });
  await setHUD('📑 Invoice Detail & PDF Export', 'Assisted Follow-Up Escalation (Polite/Firm/Urgent) & Timeline');
  await page.waitForTimeout(500);

  // Hover over PDF export and reminder section
  await moveCursor(640, 260);
  await page.waitForTimeout(400);
  await nativeScroll(300);
  await moveCursor(640, 420);
  await page.waitForTimeout(600);
  await nativeScroll(0);

  // =========================================================================
  // SCENE 8: Low-Friction Invoice Builder (Presets & Quick Due Dates)
  // =========================================================================
  console.log('Scene 8: Invoice Builder');
  await clickSelector('aside a[href="/invoices/new"]', { waitAfter: 700 });
  await setHUD('🚀 Low-Friction Invoice Builder', 'Quick Service Presets & 1-Click Due Date Calculators');
  await page.waitForTimeout(500);

  // Click Service Presets
  await clickSelector('button:has-text("UI/UX Sprint")', { waitAfter: 400 });
  await clickSelector('button:has-text("Web Dev")', { waitAfter: 400 });

  // Select Quick Terms (+15 Days)
  await clickSelector('button:has-text("+15 Days")', { waitAfter: 450 });
  await nativeScroll(260);
  await page.waitForTimeout(500);

  // =========================================================================
  // SCENE 9: Bills & Outflow Schedule
  // =========================================================================
  console.log('Scene 9: Bills & Expenses');
  await clickSelector('aside a[href="/bills"]', { waitAfter: 700 });
  await setHUD('💳 Bills & Outflow Schedule', 'Monthly Recurring Overhead · Rent, Payroll & 1-Click Pay');
  await page.waitForTimeout(600);

  // Scroll through bills schedule
  await nativeScroll(200);
  await moveCursor(640, 320);
  await page.waitForTimeout(500);
  await nativeScroll(0);

  // =========================================================================
  // SCENE 10: Client Directory & 360 Ledger
  // =========================================================================
  console.log('Scene 10: Customer Ledger');
  await clickSelector('aside a[href="/customers"]', { waitAfter: 700 });
  await setHUD('👥 Customer Ledgers & Accounts', 'Individual Debtor Profile, Total Invoiced & Payment History');
  await page.waitForTimeout(600);

  // Click on top client view link
  await clickSelector('table tbody tr:first-child a:has-text("View")', { waitAfter: 800 });
  await setHUD('👤 Client 360 Ledger', 'Historical Invoices, Overdue Balances & Direct Contact');
  await page.waitForTimeout(500);
  await nativeScroll(280);
  await page.waitForTimeout(600);
  await nativeScroll(0);

  // =========================================================================
  // SCENE 11: Financial AI Assistant (Qwen / Groq)
  // =========================================================================
  console.log('Scene 11: AI Assistant');
  await clickSelector('aside a[href="/assistant"]', { waitAfter: 700 });
  await setHUD('🤖 Financial AI Assistant', 'Natural-Language Runway Q&A & Local Intelligence');
  await page.waitForTimeout(600);

  // Click a pre-made prompt chip
  await clickSelector('button:has-text("Check money owed")', { waitAfter: 1400 });
  await moveCursor(640, 420);
  await page.waitForTimeout(600);

  // =========================================================================
  // SCENE 12: Business Profile & Settings
  // =========================================================================
  console.log('Scene 12: Settings');
  await clickSelector('aside a[href="/settings"]', { waitAfter: 700 });
  await setHUD('🏢 Business Profile & Banking', 'GSTIN Tax Identifiers, UPI Handle & Default Payment Terms');
  await page.waitForTimeout(600);
  await nativeScroll(180);
  await page.waitForTimeout(500);
  await nativeScroll(0);

  // =========================================================================
  // GRAND FINALE: Dashboard Return
  // =========================================================================
  console.log('Finale');
  await clickSelector('aside a[href="/dashboard"]', { waitAfter: 800 });
  await setHUD('✨ CashPilot AI · The One-Person Back Office', 'Complete, Beautiful & Hackathon-Ready');
  await moveCursor(640, 340);
  await page.waitForTimeout(2000);

  // Finish and close cleanly
  console.log('⏹ Finalizing video encoding...');
  await page.close();
  await context.close();
  await browser.close();

  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.webm'));
  if (files.length > 0) {
    const rawVideo = path.join(OUTPUT_DIR, files[0]);
    const finalVideo = path.join(OUTPUT_DIR, FINAL_NAME);
    if (rawVideo !== finalVideo) {
      if (fs.existsSync(finalVideo)) fs.unlinkSync(finalVideo);
      fs.renameSync(rawVideo, finalVideo);
    }
    console.log('✅ Demo video saved at:', finalVideo);

    // Copy to project root
    const rootTarget = path.resolve(FINAL_NAME);
    fs.copyFileSync(finalVideo, rootTarget);
    console.log('✅ Copied to project root:', rootTarget);

    // Copy to artifacts directory
    try {
      if (fs.existsSync(ARTIFACTS_DIR)) {
        const artifactTarget = path.join(ARTIFACTS_DIR, FINAL_NAME);
        fs.copyFileSync(finalVideo, artifactTarget);
        console.log('✅ Copied to artifacts directory:', artifactTarget);
      }
    } catch (_) {}
  } else {
    console.error('❌ No video produced.');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Error during demo recording:', err);
  process.exit(1);
});
