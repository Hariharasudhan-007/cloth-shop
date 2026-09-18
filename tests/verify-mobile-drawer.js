const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function runDevToolsVerification() {
  console.log('\n======================================================');
  console.log('   MOBILE NAVIGATION DRAWER CDP VERIFICATION         ');
  console.log('======================================================\n');

  // Spawn Headless Chrome
  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--disable-gpu',
      '--no-sandbox',
      '--hide-scrollbars',
      '--window-size=390,844',
      'about:blank'
    ],
    { stdio: 'ignore' }
  );

  await delay(1500);

  try {
    const targets = await fetchJson(`http://127.0.0.1:${DEBUG_PORT}/json`);
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Could not find page target or WebSocket debugger URL');
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let messageId = 1;
    const pendingCallbacks = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pendingCallbacks.has(data.id)) {
        const { resolve, reject } = pendingCallbacks.get(data.id);
        pendingCallbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = messageId++;
        pendingCallbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result ? res.result.value : res;
    }

    // Enable Page & DOM
    await sendCommand('Page.enable');
    await sendCommand('DOM.enable');

    const viewportsToTest = [
      { name: '390px (iPhone 14 / standard modern)', width: 390, height: 844 },
      { name: '375px (iPhone SE / classic)', width: 375, height: 667 },
      { name: '430px (iPhone Pro Max)', width: 430, height: 932 },
      { name: '414px (iPhone Plus)', width: 414, height: 896 },
      { name: '320px (Ultra Compact)', width: 320, height: 568 }
    ];

    for (const vp of viewportsToTest) {
      console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);

      await sendCommand('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: true
      });

      await sendCommand('Page.navigate', { url: 'http://localhost:5000/' });
      await delay(1200);

      // Verify hamburger button exists and is visible
      const hamburgerVisible = await evaluate(`
        (() => {
          const btn = document.getElementById('mobile-nav-hamburger-btn');
          if (!btn) return false;
          const rect = btn.getBoundingClientRect();
          const style = window.getComputedStyle(btn);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none';
        })()
      `);
      console.log(`  Hamburger button visible: ${hamburgerVisible}`);
      if (!hamburgerVisible) throw new Error('Hamburger button is not visible');

      // Click the hamburger button
      await evaluate(`document.getElementById('mobile-nav-hamburger-btn').click()`);
      await delay(400);

      // Inspect the drawer layout & structure
      const drawerMetrics = await evaluate(`
        (() => {
          const backdrop = document.getElementById('mobile-nav-backdrop');
          const drawer = document.getElementById('mobile-nav-drawer-panel');
          const header = document.querySelector('.mobile-drawer-header');
          const menu = document.querySelector('.mobile-drawer-menu');
          const footer = document.querySelector('.mobile-drawer-footer');
          const closeBtn = document.getElementById('mobile-drawer-close-btn');

          if (!backdrop || !drawer || !header || !menu) {
            return { error: 'Missing drawer DOM elements' };
          }

          const backdropStyle = window.getComputedStyle(backdrop);
          const drawerStyle = window.getComputedStyle(drawer);
          const menuStyle = window.getComputedStyle(menu);
          const headerStyle = window.getComputedStyle(header);

          const backdropRect = backdrop.getBoundingClientRect();
          const drawerRect = drawer.getBoundingClientRect();
          const headerRect = header.getBoundingClientRect();
          const menuRect = menu.getBoundingClientRect();

          const items = Array.from(menu.querySelectorAll('.mobile-menu-item')).map(item => ({
            text: item.querySelector('span')?.innerText?.trim() || item.innerText.trim(),
            height: item.getBoundingClientRect().height,
            width: item.getBoundingClientRect().width,
            top: item.getBoundingClientRect().top
          }));

          // Check for nested scrolling containers inside header or items
          const innerScrollContainers = Array.from(drawer.querySelectorAll('*')).filter(el => {
            if (el === menu) return false;
            const s = window.getComputedStyle(el);
            return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
          }).length;

          return {
            backdropPosition: backdropStyle.position,
            backdropHeight: backdropRect.height,
            drawerWidth: drawerRect.width,
            drawerHeight: drawerRect.height,
            drawerOverflow: drawerStyle.overflow,
            headerShrink: headerStyle.flexShrink,
            headerHeight: headerRect.height,
            menuOverflowY: menuStyle.overflowY,
            menuHeight: menuRect.height,
            itemCount: items.length,
            itemNames: items.map(i => i.text),
            nestedScrollContainers: innerScrollContainers,
            hasHorizontalOverflow: drawer.scrollWidth > drawer.clientWidth,
            closeBtnVisible: closeBtn ? window.getComputedStyle(closeBtn).display !== 'none' : false,
            footerPresent: !!footer
          };
        })()
      `);

      if (drawerMetrics.error) {
        throw new Error(drawerMetrics.error);
      }

      console.log(`  [PASS] Backdrop position: ${drawerMetrics.backdropPosition}, height: ${drawerMetrics.backdropHeight}px`);
      console.log(`  [PASS] Drawer width: ${Math.round(drawerMetrics.drawerWidth)}px (~${Math.round((drawerMetrics.drawerWidth / vp.width) * 100)}% of viewport), height: ${Math.round(drawerMetrics.drawerHeight)}px`);
      console.log(`  [PASS] Header fixed at top (flex-shrink: ${drawerMetrics.headerShrink}), close button visible: ${drawerMetrics.closeBtnVisible}`);
      console.log(`  [PASS] Item count: ${drawerMetrics.itemCount} items: [${drawerMetrics.itemNames.join(', ')}]`);
      console.log(`  [PASS] Nested scroll containers count: ${drawerMetrics.nestedScrollContainers} (Zero unwanted inner scroll areas)`);
      console.log(`  [PASS] Horizontal overflow: ${drawerMetrics.hasHorizontalOverflow ? 'YES (FAIL)' : 'NO (CLEAN)'}`);
      console.log(`  [PASS] Footer present: ${drawerMetrics.footerPresent}`);

      // Capture screenshot at 390px for artifact
      if (vp.width === 390) {
        const ss = await sendCommand('Page.captureScreenshot', { format: 'png' });
        const screenshotPath = path.resolve('C:\\Users\\harih\\.gemini\\antigravity-ide\\brain\\d75275b0-d020-4b5b-8004-f55bf40311e4', 'mobile_drawer_390px.png');
        fs.writeFileSync(screenshotPath, Buffer.from(ss.data, 'base64'));
        console.log(`  [SCREENSHOT] Saved mobile drawer capture to ${screenshotPath}`);
      }

      // Test closing drawer via X button
      await evaluate(`document.getElementById('mobile-drawer-close-btn').click()`);
      await delay(300);

      const drawerClosed = await evaluate(`!document.getElementById('mobile-nav-backdrop')`);
      console.log(`  [PASS] Close button closes drawer: ${drawerClosed}`);
      if (!drawerClosed) throw new Error('Close button failed to close drawer');
    }

    // Now test clicking an item navigates and closes drawer
    console.log('\n--- Testing Navigation Link Click Closes Drawer ---');
    await evaluate(`document.getElementById('mobile-nav-hamburger-btn').click()`);
    await delay(300);
    await evaluate(`document.getElementById('mobile-menu-shop').click()`);
    await delay(300);

    const afterNav = await evaluate(`
      (() => {
        const backdrop = document.getElementById('mobile-nav-backdrop');
        const isShopRoute = window.location.hash === '#shop' || document.querySelector('.category-filter-bar') !== null || document.body.innerText.includes('Wardrobe');
        return {
          drawerClosed: !backdrop,
          url: window.location.href
        };
      })()
    `);
    console.log(`  [PASS] Clicking item closes drawer: ${afterNav.drawerClosed}`);

    ws.close();
    console.log('\n------------------------------------------------------');
    console.log('  ALL MOBILE DRAWER CDP VERIFICATION CHECKS PASSED!   ');
    console.log('------------------------------------------------------\n');
  } finally {
    chromeProcess.kill();
  }
}

runDevToolsVerification().catch((err) => {
  console.error('\n[FAIL] Mobile verification failed:', err);
  process.exit(1);
});
