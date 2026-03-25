#!/usr/bin/env node
/**
 * capture-premium-screenshots.cjs
 *
 * Captures App Store screenshots of the PremiumModal for the 3 paid plans
 * at 6.7" and 6.1" iPhone resolutions.
 *
 * Usage: node scripts/capture-premium-screenshots.cjs
 */

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const PROJECT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(PROJECT_DIR, 'dist');
const SCREENSHOTS_DIR = path.join(PROJECT_DIR, 'screenshots');

// iPhone viewport configs (logical pixels; deviceScaleFactor handles retina)
const DEVICES = [
  { name: '6.7', width: 430, height: 932, scale: 3 },  // 1290x2796
  { name: '6.1', width: 428, height: 926, scale: 3 },  // 1284x2778
];

// The 3 paid plans (indices in the tiers array: 0=Free, 1=Contributor, 2=Standard, 3=Ultimate, 4=Traveler)
const PAID_PLANS = [
  { id: 'standard_plan', label: 'standard', index: 2 },
  { id: 'ultimate_plan', label: 'ultimate', index: 3 },
  { id: 'traveler_plan', label: 'traveler', index: 4 },
];

// Card width (w-64 = 256px) + gap (gap-4 = 16px)
const CARD_WIDTH = 256;
const CARD_GAP = 16;

/**
 * Simple static file server for the dist folder
 */
function startServer(dir, port) {
  return new Promise((resolve, reject) => {
    const mimeTypes = {
      '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
      '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff',
      '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.map': 'application/json',
    };

    const server = http.createServer((req, res) => {
      let urlPath = req.url.split('?')[0];
      if (urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(dir, urlPath);
      const ext = path.extname(filePath);

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // SPA fallback
          fs.readFile(path.join(dir, 'index.html'), (err2, fallback) => {
            if (err2) { res.writeHead(404); res.end('Not found'); return; }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(fallback);
          });
          return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`  Static server on http://127.0.0.1:${port}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function main() {
  console.log('=== Wise Weather Premium Screenshot Capture ===\n');

  // 1. Build
  console.log('[1/5] Building the app...');
  try {
    execSync('npm run build', { cwd: PROJECT_DIR, stdio: 'inherit' });
  } catch (e) {
    console.error('Build failed:', e.message);
    process.exit(1);
  }

  if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
    console.error('Build output not found at', DIST_DIR);
    process.exit(1);
  }

  // 2. Start server
  console.log('\n[2/5] Starting local server...');
  const PORT = 4173;
  const server = await startServer(DIST_DIR, PORT);
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  let browser;
  try {
    // 3. Launch browser
    console.log('\n[3/5] Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    let screenshotCount = 0;

    for (const device of DEVICES) {
      console.log(`\n[4/5] Capturing ${device.name}" screenshots (${device.width}x${device.height} @${device.scale}x)...`);

      const page = await browser.newPage();
      await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: device.scale,
      });

      // CRITICAL: Mock Capacitor before page loads — the app crashes without it
      await page.evaluateOnNewDocument(() => {
        window.Capacitor = {
          isNativePlatform: () => false,
          getPlatform: () => 'web',
          isPluginAvailable: () => false,
          Plugins: {},
        };

        // Mock CdvPurchase (Cordova Purchase plugin)
        window.CdvPurchase = {
          store: null,
          Platform: { APPLE_APPSTORE: 'ios-appstore' },
          ProductType: { PAID_SUBSCRIPTION: 'paid subscription' },
        };

        // Suppress Firebase messaging errors (no SW in puppeteer)
        window.__WISE_SCREENSHOT_MODE = true;
      });

      // Navigate
      console.log('  Loading app...');
      await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for React to render
      await new Promise(r => setTimeout(r, 4000));

      // Check if the app rendered
      const appState = await page.evaluate(() => {
        const root = document.getElementById('root');
        const btns = Array.from(document.querySelectorAll('button')).length;
        const html = root ? root.innerHTML.length : 0;
        return { btns, htmlLen: html, hasContent: html > 100 };
      });
      console.log(`  App state: ${appState.btns} buttons, ${appState.htmlLen} chars HTML`);

      if (!appState.hasContent) {
        // Check errors
        console.log('  App did not render. Checking console errors...');
        const logs = await page.evaluate(() => {
          // We can't get past console logs, but we can check if root is populated
          return document.getElementById('root')?.innerHTML?.substring(0, 500) || 'empty';
        });
        console.log('  Root content:', logs);
        console.log('  Will attempt React fiber injection anyway after waiting more...');
        await new Promise(r => setTimeout(r, 5000));
      }

      // Try to open PremiumModal
      console.log('  Opening PremiumModal...');

      // STRATEGY A: Try clicking UI buttons
      let hasModal = false;

      const clickResult = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        // Look for Settings / gear / Reglages button in nav
        for (const btn of btns) {
          const text = (btn.textContent || '').toLowerCase();
          if (text.includes('réglages') || text.includes('settings') || text.includes('paramètres')) {
            btn.click();
            return 'clicked-settings-text';
          }
        }
        // Look in bottom nav for the last button (Settings)
        const allDivs = Array.from(document.querySelectorAll('div'));
        for (const div of allDivs) {
          const style = getComputedStyle(div);
          if (style.position === 'fixed' && parseInt(style.bottom) <= 5) {
            const navBtns = div.querySelectorAll('button');
            if (navBtns.length >= 4) {
              navBtns[navBtns.length - 1].click();
              return `clicked-nav-last-of-${navBtns.length}`;
            }
          }
        }
        return 'no-nav-found';
      });
      console.log(`  Nav click: ${clickResult}`);
      await new Promise(r => setTimeout(r, 1500));

      // Now try to click Premium button
      const premClick = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        for (const btn of btns) {
          const text = btn.textContent || '';
          if (text.includes('Premium') || text.includes('offres') || text.includes('Plans')) {
            btn.click();
            return text.trim().substring(0, 60);
          }
        }
        return 'not-found';
      });
      console.log(`  Premium click: ${premClick}`);
      await new Promise(r => setTimeout(r, 1500));

      hasModal = await page.evaluate(() => !!document.querySelector('[class*="z-\\[12000\\]"]'));

      // STRATEGY B: React fiber walk to find setShowPremium dispatch
      if (!hasModal) {
        console.log('  Trying React fiber state injection...');
        const fiberResult = await page.evaluate(() => {
          const rootEl = document.getElementById('root');
          if (!rootEl) return 'no-root';
          const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
          if (!fiberKey) return 'no-fiber-key';

          // Walk ALL fibers and collect boolean useState dispatchers
          const allDispatchers = [];

          function walkFiber(fiber, depth) {
            if (!fiber || depth > 800) return;

            if (fiber.memoizedState) {
              let state = fiber.memoizedState;
              while (state) {
                if (state.queue && state.queue.dispatch && typeof state.memoizedState === 'boolean') {
                  allDispatchers.push({
                    value: state.memoizedState,
                    dispatch: state.queue.dispatch,
                    depth: depth,
                  });
                }
                state = state.next;
              }
            }

            walkFiber(fiber.child, depth + 1);
            walkFiber(fiber.sibling, depth + 1);
          }

          walkFiber(rootEl[fiberKey], 0);

          if (allDispatchers.length === 0) return `no-dispatchers (fiber key: ${fiberKey})`;

          // Try each false-valued boolean state dispatcher
          const falseStates = allDispatchers.filter(d => d.value === false);
          for (let i = 0; i < falseStates.length; i++) {
            falseStates[i].dispatch(true);
          }

          // Wait a tick for React to process
          return `toggled-${falseStates.length}-of-${allDispatchers.length}-states`;
        });

        console.log(`  Fiber result: ${fiberResult}`);
        await new Promise(r => setTimeout(r, 2000));

        hasModal = await page.evaluate(() => {
          // Check for the premium modal (z-index 12000, has Crown icon + "Wise Weather Premium")
          const modals = Array.from(document.querySelectorAll('div'));
          for (const div of modals) {
            if (div.className && div.className.includes('z-[12000]')) return true;
            // Also check inline style
            const z = getComputedStyle(div).zIndex;
            if (z === '12000') return true;
          }
          return false;
        });

        if (hasModal) {
          console.log('  Modal opened via fiber injection!');

          // Close any OTHER modals that may have opened by reverting wrong states
          // The premium modal has z-[12000], others have lower z-index
          // We just need the premium modal to be visible on top
        } else {
          // Try a more targeted approach: set only states one at a time, check after each
          console.log('  Batch toggle did not work. Trying one-at-a-time...');

          // First, reset all states back to false
          await page.evaluate(() => {
            const rootEl = document.getElementById('root');
            const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
            if (!fiberKey) return;

            function walkFiber(fiber, depth) {
              if (!fiber || depth > 800) return;
              if (fiber.memoizedState) {
                let state = fiber.memoizedState;
                while (state) {
                  if (state.queue && state.queue.dispatch && state.memoizedState === true) {
                    state.queue.dispatch(false);
                  }
                  state = state.next;
                }
              }
              walkFiber(fiber.child, depth + 1);
              walkFiber(fiber.sibling, depth + 1);
            }
            walkFiber(rootEl[fiberKey], 0);
          });
          await new Promise(r => setTimeout(r, 1000));

          // Now try one state at a time
          const stateCount = await page.evaluate(() => {
            const rootEl = document.getElementById('root');
            const fiberKey = Object.keys(rootEl).find(k => k.startsWith('__reactFiber'));
            if (!fiberKey) return 0;

            window.__WISE_DISPATCHERS = [];

            function walkFiber(fiber, depth) {
              if (!fiber || depth > 800) return;
              if (fiber.memoizedState) {
                let state = fiber.memoizedState;
                while (state) {
                  if (state.queue && state.queue.dispatch && typeof state.memoizedState === 'boolean' && state.memoizedState === false) {
                    window.__WISE_DISPATCHERS.push(state.queue.dispatch);
                  }
                  state = state.next;
                }
              }
              walkFiber(fiber.child, depth + 1);
              walkFiber(fiber.sibling, depth + 1);
            }
            walkFiber(rootEl[fiberKey], 0);
            return window.__WISE_DISPATCHERS.length;
          });

          console.log(`  Found ${stateCount} false boolean states to try...`);

          for (let i = 0; i < stateCount; i++) {
            await page.evaluate((idx) => {
              if (window.__WISE_DISPATCHERS && window.__WISE_DISPATCHERS[idx]) {
                window.__WISE_DISPATCHERS[idx](true);
              }
            }, i);

            await new Promise(r => setTimeout(r, 800));

            hasModal = await page.evaluate(() => {
              const divs = Array.from(document.querySelectorAll('div'));
              for (const div of divs) {
                if (div.className && typeof div.className === 'string' && div.className.includes('z-[12000]')) return true;
              }
              return false;
            });

            if (hasModal) {
              console.log(`  Found premium modal at dispatcher index ${i}!`);
              break;
            }

            // Revert
            await page.evaluate((idx) => {
              if (window.__WISE_DISPATCHERS && window.__WISE_DISPATCHERS[idx]) {
                window.__WISE_DISPATCHERS[idx](false);
              }
            }, i);
            await new Promise(r => setTimeout(r, 300));
          }
        }
      }

      if (!hasModal) {
        console.error('  FATAL: Could not open PremiumModal. Skipping this device size.');
        // Take a debug screenshot to see what's on screen
        const debugPath = path.join(SCREENSHOTS_DIR, `debug_${device.name}.png`);
        await page.screenshot({ path: debugPath, type: 'png' });
        console.log(`  Debug screenshot saved: debug_${device.name}.png`);
        await page.close();
        continue;
      }

      console.log('  PremiumModal is visible!');

      // Capture screenshots for each paid plan
      for (const plan of PAID_PLANS) {
        console.log(`  Scrolling to ${plan.label} card (index ${plan.index})...`);

        await page.evaluate((planIndex, cardW, cardGap, viewportW) => {
          // Find the scrollable container inside the premium modal
          const allDivs = Array.from(document.querySelectorAll('div'));
          let modal = null;
          for (const div of allDivs) {
            if (div.className && typeof div.className === 'string' && div.className.includes('z-[12000]')) {
              modal = div;
              break;
            }
          }
          if (!modal) return;

          // Find the overflow-x-auto scrollable container
          const scrollContainer = modal.querySelector('.overflow-x-auto');
          if (!scrollContainer) return;

          // Each card: 256px wide + 16px gap, with 16px initial padding (px-4)
          const cardStart = 16 + planIndex * (cardW + cardGap);
          const cardCenter = cardStart + cardW / 2;
          const containerCenter = viewportW / 2;
          const scrollTarget = cardCenter - containerCenter;

          scrollContainer.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'instant' });
        }, plan.index, CARD_WIDTH, CARD_GAP, device.width);

        await new Promise(r => setTimeout(r, 500));

        const filename = `premium_${plan.label}_${device.name}.png`;
        const filepath = path.join(SCREENSHOTS_DIR, filename);

        await page.screenshot({ path: filepath, type: 'png', fullPage: false });

        const stats = fs.statSync(filepath);
        console.log(`  Saved: ${filename} (${Math.round(stats.size / 1024)} KB)`);
        screenshotCount++;
      }

      await page.close();
    }

    console.log(`\n[5/5] Done! ${screenshotCount} screenshots saved to: ${SCREENSHOTS_DIR}`);
    console.log('\nGenerated files:');
    const files = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.startsWith('premium_'));
    files.forEach(f => {
      const s = fs.statSync(path.join(SCREENSHOTS_DIR, f));
      console.log(`  ${f} -- ${Math.round(s.size / 1024)} KB`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main();
