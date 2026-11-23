import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve('demo_recordings');
const FINAL_VIDEO_NAME = 'codebenders_demo.webm';
const ARTIFACTS_DIR = 'C:\\Users\\Sanjay\\.gemini\\antigravity\\brain\\31f065a3-77f9-4e25-958b-94c530d56f80';

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Clear previous demo videos in folder
  const existingFiles = fs.readdirSync(OUTPUT_DIR);
  for (const file of existingFiles) {
    if (file.endsWith('.webm')) {
      try { fs.unlinkSync(path.join(OUTPUT_DIR, file)); } catch (_) {}
    }
  }

  console.log('Launching Chrome for Full Walkthrough Demo (1280x720 HD)...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  page.setDefaultTimeout(6000);

  // Inject Custom HUD Overlay & Animated Virtual Cursor
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      // Create HUD Pill
      const hud = document.createElement('div');
      hud.id = 'demo-hud';
      hud.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 12px;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(99, 102, 241, 0.5);
        box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.85), 0 0 20px rgba(99, 102, 241, 0.3);
        padding: 10px 22px;
        border-radius: 9999px;
        backdrop-filter: blur(16px);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #fff;
        pointer-events: none;
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      `;

      hud.innerHTML = `
        <div style="width: 10px; height: 10px; border-radius: 50%; background: #6366f1; box-shadow: 0 0 12px #6366f1; animation: pulse 2s infinite;"></div>
        <div>
          <div id="demo-hud-title" style="font-size: 13px; font-weight: 700; letter-spacing: -0.01em; color: #f8fafc;">CashPilot AI · BackOffice</div>
          <div id="demo-hud-sub" style="font-size: 11px; font-weight: 500; color: #94a3b8;">Initializing...</div>
        </div>
      `;
      document.body.appendChild(hud);

      // Create Virtual Pointer
      const pointer = document.createElement('div');
      pointer.id = 'demo-cursor';
      pointer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 22px;
        height: 22px;
        z-index: 10000000;
        pointer-events: none;
        transition: transform 0.18s cubic-bezier(0.2, 0, 0, 1), opacity 0.3s ease;
        opacity: 0;
      `;
      pointer.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.9));">
          <path d="M4 4L11 20L14 13L21 10L4 4Z" fill="#6366f1" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
      `;
      document.body.appendChild(pointer);
    });
  });

  // Helpers
  async function setHUD(title, sub) {
    await page.evaluate(({ title, sub }) => {
      const titleEl = document.getElementById('demo-hud-title');
      const subEl = document.getElementById('demo-hud-sub');
      const hud = document.getElementById('demo-hud');
      if (titleEl && subEl && hud) {
        titleEl.textContent = title;
        subEl.textContent = sub;
        hud.style.transform = 'translateX(-50%) scale(1.03)';
        setTimeout(() => {
          hud.style.transform = 'translateX(-50%) scale(1)';
        }, 180);
      }
    }, { title, sub });
  }

  async function moveCursor(x, y) {
    await page.evaluate(({ x, y }) => {
      const c = document.getElementById('demo-cursor');
      if (c) {
        c.style.opacity = '1';
        c.style.transform = `translate(${x}px, ${y}px)`;
      }
    }, { x, y });
    await page.mouse.move(x, y, { steps: 8 });
  }

  async function moveCursorTo(selector, offsetX = 0, offsetY = 0) {
    try {
      const loc = page.locator(selector).first();
      const box = await loc.boundingBox({ timeout: 3000 });
      if (box) {
        const targetX = box.x + box.width / 2 + offsetX;
        const targetY = box.y + box.height / 2 + offsetY;
        await moveCursor(targetX, targetY);
      }
    } catch (_) {}
  }

  async function clickWithEffect(selector) {
    await moveCursorTo(selector);
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      const c = document.getElementById('demo-cursor');
      if (c) c.style.transform += ' scale(0.85)';
    });
    try {
      await page.click(selector, { timeout: 3000 });
    } catch (_) {}
    await page.waitForTimeout(80);
    await page.evaluate(() => {
      const c = document.getElementById('demo-cursor');
      if (c) c.style.transform = c.style.transform.replace(' scale(0.85)', '');
    });
  }

  async function smoothScroll(distance, steps = 8) {
    for (let i = 0; i < steps; i++) {
      await page.evaluate((d) => window.scrollBy(0, d), distance / steps);
      await page.waitForTimeout(30);
    }
  }

  console.log('--- Starting Demo Walkthrough ---');

  // ==========================================
  // SCENE 1: Executive Dashboard & KPIs
  // ==========================================
  console.log('Scene 1: Dashboard Cockpit');
  await page.goto('http://127.0.0.1:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await setHUD('📊 Executive Cockpit', 'Real-time Cash Position, Receivables & Intelligent Alerts');
  await moveCursor(340, 180);
  await page.waitForTimeout(500);
  await moveCursor(640, 180);
  await page.waitForTimeout(500);
  await moveCursor(940, 180);
  await page.waitForTimeout(600);

  // ==========================================
  // SCENE 2: Who Owes Me Ageing Matrix
  // ==========================================
  console.log('Scene 2: Who Owes Me Ageing Matrix');
  await setHUD('⏰ Who Owes Me & Since When?', 'Live Debtor Ageing Matrix (0–15d, 16+d Critical) & 1-Click WhatsApp');
  await smoothScroll(380, 10);
  await page.waitForTimeout(500);

  // Move over 16+ Days Critical ageing tab
  await moveCursor(640, 320);
  await page.waitForTimeout(500);

  // Hover over the WhatsApp Chase link
  await moveCursorTo('a[title="Open WhatsApp with drafted reminder"]');
  await page.waitForTimeout(400);

  // Hover over Copy Reminder button and click
  await clickWithEffect('button[title="Copy drafted reminder script"]');
  await page.waitForTimeout(700);

  // ==========================================
  // SCENE 3: Bad Day Triage Mode
  // ==========================================
  console.log('Scene 3: Bad Day Triage Mode');
  await smoothScroll(-350, 8);
  await page.waitForTimeout(300);
  await setHUD('🚨 Bad Day Triage Mode', 'Instant Action when Multiple Clients are Late at Once');
  await clickWithEffect('button:has-text("Bad Day Triage Mode")');
  await page.waitForTimeout(800);

  // Inspect the triage modal
  await moveCursor(640, 360);
  await page.waitForTimeout(500);

  // Click Copy All Reminders in triage
  await clickWithEffect('button:has-text("Copy All Reminders")');
  await page.waitForTimeout(700);

  // Close Triage modal
  await clickWithEffect('button:has-text("Close")');
  await page.waitForTimeout(500);

  // ==========================================
  // SCENE 4: Cash Forecast & Horizons
  // ==========================================
  console.log('Scene 4: Cash Forecast');
  await setHUD('📈 30–90 Day Cash Forecast', 'Visual Runway Projection across Invoices & Bills');
  await clickWithEffect('aside a[href="/forecast"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);

  // Switch Horizons: 60 Days, 90 Days, 30 Days
  await clickWithEffect('a:has-text("60 Days")');
  await page.waitForTimeout(600);
  await clickWithEffect('a:has-text("90 Days")');
  await page.waitForTimeout(600);
  await clickWithEffect('a:has-text("30 Days")');
  await page.waitForTimeout(600);

  // ==========================================
  // SCENE 5: What-If Delay Simulator
  // ==========================================
  console.log('Scene 5: What-If Simulator');
  await setHUD('⚡ What-If Scenario Simulator', 'Live Impact Analysis of Delayed Key Client Payments');
  await smoothScroll(420, 10);
  await page.waitForTimeout(500);

  // Click preset +15 Days Late
  await clickWithEffect('button:has-text("+15 Days (Scenario)")');
  await page.waitForTimeout(600);

  // Run Delay Simulation
  await clickWithEffect('button:has-text("Run Delay Simulation")');
  await page.waitForTimeout(1000);

  // Show Simulation Outcome card
  await moveCursor(640, 520);
  await page.waitForTimeout(800);

  // Reset simulator
  await clickWithEffect('button:has-text("Reset")');
  await page.waitForTimeout(500);

  // ==========================================
  // SCENE 6: Invoices Directory & Receivables
  // ==========================================
  console.log('Scene 6: Invoices');
  await setHUD('📄 Invoices & Receivables', 'Lifecycle Management, Payment Status & WhatsApp Links');
  await clickWithEffect('aside a[href="/invoices"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // Filter tabs
  await clickWithEffect('a:has-text("Unpaid & Overdue")');
  await page.waitForTimeout(600);
  await clickWithEffect('a:has-text("Paid")');
  await page.waitForTimeout(600);
  await clickWithEffect('a:has-text("All")');
  await page.waitForTimeout(500);

  // ==========================================
  // SCENE 7: Low-Friction Invoice Builder
  // ==========================================
  console.log('Scene 7: New Invoice');
  await setHUD('🚀 Low-Friction Invoice Builder', 'Quick Service Presets & 1-Click Payment Terms');
  await clickWithEffect('a:has-text("New invoice")');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // Use service template preset
  await clickWithEffect('button:has-text("UI/UX Sprint")');
  await page.waitForTimeout(500);

  // Select quick due date (+15d)
  await clickWithEffect('button:has-text("+15 Days")');
  await page.waitForTimeout(600);
  await smoothScroll(240, 6);
  await page.waitForTimeout(600);

  // ==========================================
  // SCENE 8: Bills & Overhead Payables
  // ==========================================
  console.log('Scene 8: Bills & Expenses');
  await setHUD('💳 Bills & Outflow Schedule', 'Monthly Recurring Overhead & 1-Click Settlement');
  await clickWithEffect('aside a[href="/bills"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await moveCursor(640, 320);
  await page.waitForTimeout(600);

  // ==========================================
  // SCENE 9: Client Ledger
  // ==========================================
  console.log('Scene 9: Client Directory & Ledger');
  await setHUD('👥 Client Ledgers & Accounts', 'Individual Debtor Profile, Total Invoiced & Payment History');
  await clickWithEffect('aside a[href="/customers"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);

  // Click on top client view link
  await clickWithEffect('table a:has-text("View")');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await smoothScroll(280, 8);
  await page.waitForTimeout(700);

  // ==========================================
  // SCENE 10: Financial AI Assistant
  // ==========================================
  console.log('Scene 10: Assistant');
  await setHUD('🤖 Financial Intelligence AI', 'Natural-Language Runway Q&A & Invoice Generation');
  await clickWithEffect('aside a[href="/assistant"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);

  // Click suggestion chip
  await clickWithEffect('button:has-text("Check money owed")');
  await page.waitForTimeout(1200);

  // ==========================================
  // SCENE 11: Enterprise Settings & Finale
  // ==========================================
  console.log('Scene 11: Settings & Finale');
  await setHUD('🏢 Business Profile & Banking', 'GSTIN Tax Identifiers, Default Terms & UPI Handle');
  await clickWithEffect('aside a[href="/settings"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);

  // Return to Dashboard for Finale
  await setHUD('✨ Complete One-Person Back Office', 'CashPilot AI · Enterprise Studio Edition');
  await clickWithEffect('aside a[href="/dashboard"]');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1600);

  console.log('Closing recording session to flush video stream...');
  await page.close();
  await context.close();
  await browser.close();

  // Find generated webm file and rename to codebenders_demo.webm
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm'));
  if (files.length > 0) {
    const rawVideo = path.join(OUTPUT_DIR, files[0]);
    const finalVideo = path.join(OUTPUT_DIR, FINAL_VIDEO_NAME);
    if (rawVideo !== finalVideo) {
      if (fs.existsSync(finalVideo)) fs.unlinkSync(finalVideo);
      fs.renameSync(rawVideo, finalVideo);
    }
    console.log('SUCCESS! Demo video saved at:', finalVideo);

    // Also copy to project root
    const rootTarget = path.resolve(FINAL_VIDEO_NAME);
    fs.copyFileSync(finalVideo, rootTarget);
    console.log('Copied to project root:', rootTarget);

    // Also copy to artifacts directory if available
    try {
      if (fs.existsSync(ARTIFACTS_DIR)) {
        const artifactTarget = path.join(ARTIFACTS_DIR, FINAL_VIDEO_NAME);
        fs.copyFileSync(finalVideo, artifactTarget);
        console.log('Copied to artifacts directory:', artifactTarget);
      }
    } catch (_) {}
  } else {
    console.error('No video file produced.');
  }
}

run().catch((err) => {
  console.error('Error during demo recording:', err);
  process.exit(1);
});
