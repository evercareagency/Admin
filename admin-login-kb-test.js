#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  if(start < 0)return '';
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  return '';
}

assert.ok(html.includes('v=loginkb1'), 'loginkb1 marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-loginkb1">'), 'loginkb1 admin-build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-isclear1">'), 'prior isclear1 admin-build meta stays');
assert.ok(html.includes('v=isclear1'), 'prior isclear1 marker stays');
assert.ok(html.includes('v=cgreset1'), 'prior cgreset1 marker stays');
assert.ok(html.includes('v=sched1m'), 'prior sched1m marker stays');
assert.ok(html.includes('v=warmoff1'), 'prior warmoff1 marker stays');
assert.ok(html.includes('#loginScreen.active{display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#176868 0%,var(--teal) 46%,#3a9494 100%);min-height:100vh;min-height:100dvh;padding:20px;}'),
  'desktop/resting login stays centered on the teal pack');
assert.ok(html.includes('#loginScreen.active.login-kb{position:fixed;'), 'keyboard scrollport is pinned');
assert.ok(html.includes('overflow-y:auto'), 'login keyboard scrollport can scroll');
assert.ok(html.includes('id="mgrForgotBtn"'), 'forgot password control stays on the login card');
assert.ok(html.includes('id="mgr_role"'), 'account field stays');
assert.ok(html.includes('id="mgr_pass"'), 'password field stays');
assert.ok(html.includes('id="mgrLoginBtn"'), 'sign in button stays');
assert.ok(html.includes('onclick="mgrLogin()"'), 'sign in still calls mgrLogin');

const mgrLogin = extractFn(html, 'async function mgrLogin()');
assert.ok(mgrLogin, 'mgrLogin missing');
assert.ok(!/loginKb|visualViewport/.test(mgrLogin), 'keyboard lift must not change mgrLogin');
const showScreen = extractFn(html, 'function showScreen(id)');
assert.ok(showScreen.includes('loginKbClear'), 'leaving or reopening a screen drops the keyboard scrollport');
assert.ok(showScreen.includes("id==='loginScreen')startLoginWarmKeepAlive()"), 'login warm keep-alive still starts from showScreen');
const doReset = extractFn(html, 'async function doAdminReset()');
assert.ok(doReset && !/loginKb|visualViewport/.test(doReset), 'keyboard lift must not change doAdminReset');

const insetFrom = extractFn(html, 'function loginKbInsetFrom(baseHeight, viewHeight, innerHeight)');
const shouldLift = extractFn(html, 'function loginKbShouldLift(isPhone, fieldFocused, inset)');
const scrollDelta = extractFn(html, 'function loginKbScrollDelta(fieldRect, btnRect, extraRect, viewTop, viewHeight, pad)');
assert.ok(insetFrom && shouldLift && scrollDelta, 'keyboard helpers missing');
assert.ok(html.includes('function loginKbReadViewport()'), 'viewport read uses visualViewport');
assert.ok(html.includes("vv.addEventListener('resize', loginKbApply)"), 'visualViewport resize retargets the card');
assert.ok(!/window\.scrollTo\(/.test(html.slice(html.indexOf('function loginKbReadViewport()'), html.indexOf('bindLoginKeyboard();'))),
  'lift must not blind-scroll the window');

const sandbox = {Math: Math, isFinite: isFinite};
vm.createContext(sandbox);
vm.runInContext(insetFrom + '\n' + shouldLift + '\n' + scrollDelta, sandbox);

assert.strictEqual(sandbox.loginKbInsetFrom(844, 844, 844), 0, 'no keyboard inset at rest');
assert.strictEqual(sandbox.loginKbInsetFrom(844, 400, 844), 444, 'inset from a shrunk visual viewport');
assert.strictEqual(sandbox.loginKbInsetFrom(844, 400, 400), 444, 'inset still known when innerHeight shrinks with the keyboard');
assert.strictEqual(sandbox.loginKbShouldLift(true, true, 444), true, 'phone focus with keyboard lifts');
assert.strictEqual(sandbox.loginKbShouldLift(false, true, 444), false, 'desktop does not lift');
assert.strictEqual(sandbox.loginKbShouldLift(true, true, 40), false, 'url-bar inset is not a keyboard');
assert.strictEqual(sandbox.loginKbShouldLift(true, false, 444), false, 'lift only while a login field is focused');

// Password and Sign In sit under a 400px visual viewport. Forgot fits with them.
const delta = sandbox.loginKbScrollDelta(
  {top: 520, bottom: 572},
  {top: 586, bottom: 634},
  {top: 646, bottom: 690},
  0,
  400,
  14
);
assert.ok(delta > 0, 'covered password must scroll up');
assert.ok(690 - delta <= 400 - 14 + 0.5, 'forgot, password, and sign in land above the keyboard');
assert.ok(520 - delta >= 14 - 0.5, 'password stays below the top pad when the group fits');

// When forgot does not fit, password and Sign In still clear the keyboard.
const tight = sandbox.loginKbScrollDelta(
  {top: 300, bottom: 352},
  {top: 360, bottom: 408},
  {top: 800, bottom: 860},
  0,
  220,
  14
);
assert.ok(408 - tight <= 220 - 14 + 0.5, 'sign in clears a short visual viewport');
assert.ok(300 - tight >= 14 - 0.5, 'password stays in view when forgot does not fit');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-login-kb browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.normalize(path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath));
    if(!file.startsWith(__dirname)){res.writeHead(403);res.end();return;}
    fs.readFile(file, (err, buf) => {
      if(err){res.writeHead(404);res.end('missing');return;}
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(r){server.listen(0, '127.0.0.1', r);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const outDir = process.env.LOGIN_KB_SHOTS || '';
  try{
    const desktop = await browser.newPage();
    await desktop.setViewport({width: 1280, height: 800, isMobile: false, hasTouch: false});
    await desktop.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    await desktop.waitForSelector('#mgr_pass');
    await desktop.focus('#mgr_pass');
    await new Promise(r => setTimeout(r, 200));
    const desk = await desktop.evaluate(() => {
      const screen = document.getElementById('loginScreen');
      const cs = getComputedStyle(screen);
      const card = screen.querySelector('.login-box').getBoundingClientRect();
      const viewH = window.innerHeight;
      return {
        kb: document.documentElement.classList.contains('login-kb'),
        position: cs.position,
        align: cs.alignItems,
        justify: cs.justifyContent,
        cardTop: card.top,
        cardBottom: card.bottom,
        viewH: viewH,
        build: document.querySelector('meta[name="admin-build"]').content
      };
    });
    assert.strictEqual(desk.build, '2026-09-25-payready1d');
    assert.strictEqual(desk.kb, false, 'desktop focus must not add login-kb');
    assert.strictEqual(desk.position, 'static', 'desktop login screen stays in normal flow');
    assert.strictEqual(desk.align, 'center', 'desktop login stays vertically centered');
    assert.ok(desk.cardTop > 8, 'desktop card is not pinned to the top');
    assert.ok(desk.cardBottom < desk.viewH - 8, 'desktop card is not pinned to the bottom');
    if(outDir) await desktop.screenshot({path: path.join(outDir, 'loginkb1-desktop.png')});
    await desktop.close();

    const phone = await browser.newPage();
    await phone.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await phone.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    await phone.waitForSelector('#mgr_pass');
    await phone.evaluate(() => {
      window.loginKbReadViewport = function(){
        return {height: 400, offsetTop: 0, inner: 844, width: 390};
      };
    });
    await phone.focus('#mgr_role');
    await phone.focus('#mgr_pass');
    await new Promise(r => setTimeout(r, 120));
    const lifted = await phone.evaluate(() => {
      const screen = document.getElementById('loginScreen');
      const port = screen.getBoundingClientRect();
      const pass = document.getElementById('mgr_pass').getBoundingClientRect();
      const btn = document.getElementById('mgrLoginBtn').getBoundingClientRect();
      const forgot = document.getElementById('mgrForgotBtn').getBoundingClientRect();
      const pad = 2;
      function inside(r){
        return r.top >= port.top - pad && r.bottom <= port.bottom + pad && r.height > 10;
      }
      const maxScroll = screen.scrollHeight - screen.clientHeight;
      const saved = screen.scrollTop;
      screen.scrollTop = screen.scrollHeight;
      const forgotAtEnd = document.getElementById('mgrForgotBtn').getBoundingClientRect();
      const port2 = screen.getBoundingClientRect();
      const forgotReachable = forgotAtEnd.bottom <= port2.bottom + 2 && forgotAtEnd.top >= port2.top - 2;
      screen.scrollTop = saved;
      return {
        kb: screen.classList.contains('login-kb'),
        position: getComputedStyle(screen).position,
        height: Math.round(port.height),
        overflowY: getComputedStyle(screen).overflowY,
        pass: inside(pass),
        btn: inside(btn),
        forgot: inside(forgot),
        passTop: Math.round(pass.top),
        passBottom: Math.round(pass.bottom),
        btnTop: Math.round(btn.top),
        btnBottom: Math.round(btn.bottom),
        forgotTop: Math.round(forgot.top),
        forgotBottom: Math.round(forgot.bottom),
        portTop: Math.round(port.top),
        portBottom: Math.round(port.bottom),
        maxScroll: maxScroll,
        forgotReachable: forgotReachable,
        onclick: document.getElementById('mgrLoginBtn').getAttribute('onclick')
      };
    });
    assert.strictEqual(lifted.kb, true, 'phone password focus with a keyboard inset lifts the card');
    assert.strictEqual(lifted.position, 'fixed', 'lifted login screen is the scrollport');
    assert.strictEqual(lifted.height, 400, 'scrollport height follows the visual viewport');
    assert.strictEqual(lifted.overflowY, 'auto', 'card stays scrollable while the keyboard is open');
    assert.strictEqual(lifted.pass, true, 'password is inside the visual viewport: ' + JSON.stringify(lifted));
    assert.strictEqual(lifted.btn, true, 'sign in is inside the visual viewport: ' + JSON.stringify(lifted));
    assert.ok(lifted.forgot || lifted.forgotReachable, 'forgot password is visible or scrollable into view: ' + JSON.stringify(lifted));
    assert.ok(lifted.maxScroll > 20, 'login card can scroll inside the keyboard scrollport');
    assert.strictEqual(lifted.onclick, 'mgrLogin()', 'sign in handler unchanged');
    if(outDir){
      await phone.screenshot({
        path: path.join(outDir, 'loginkb1-phone-password.png'),
        clip: {x: 0, y: 0, width: 390, height: 400}
      });
      await phone.evaluate(() => {
        const screen = document.getElementById('loginScreen');
        const forgot = document.getElementById('mgrForgotBtn');
        const port = screen.getBoundingClientRect();
        const rect = forgot.getBoundingClientRect();
        if(rect.bottom > port.bottom - 8) screen.scrollTop += rect.bottom - (port.bottom - 14);
      });
      await phone.screenshot({
        path: path.join(outDir, 'loginkb1-phone-forgot.png'),
        clip: {x: 0, y: 0, width: 390, height: 400}
      });
    }
    await phone.close();
    console.log('admin-login-kb browser phone+desktop ok');
  }finally{
    await browser.close();
    await new Promise(r => server.close(r));
  }
}

runBrowser().then(function(){
  console.log('admin-login-kb-test ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
