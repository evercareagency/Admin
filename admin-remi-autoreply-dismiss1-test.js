#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('v=remi-autoreply-dismiss1'), 'marker');
assert.ok(html.includes('?v=remi-autoreply-dismiss1'), 'cache bust query');
assert.ok(html.includes('admin-build 2026-09-29-remi-autoreply-dismiss1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-autoreply-dismiss1">'), 'meta');
assert.ok(html.includes("var REMI_AUTOREPLY_DISMISS1_MARKER='v=remi-autoreply-dismiss1'"), 'script marker');
assert.ok(html.includes("var REMI_AUTOREPLY_DISMISS1_BUILD='2026-09-29-remi-autoreply-dismiss1'"), 'script build');
assert.ok(html.includes('GHOST-REMI-AUTOREPLY-DISMISS1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'Ace NO CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('Pure UI'), 'Pure UI');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-autoreply-dismiss1-v1.sql')), 'no SQL patch');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-pages-cache-fresh1">'), 'pages-cache meta stays');
assert.ok(html.includes('without a sticky ?v='), 'Home Screen URL is not rewritten to a sticky ?v=');
['v=msg-composer-rect1', 'v=aidechat1', 'v=remi-msg-tab1', 'v=pages-cache-fresh1', 'v=care-msg-safe1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

assert.ok(html.includes('#tab_aidechat.is-clients #aidechatSettings{display:none !important;}'), 'clients segment rule stays');
assert.ok(html.includes('data-remi-autoreply-dismiss1="v=remi-autoreply-dismiss1"'), 'settings section marker');
assert.ok(html.includes('id="aidechatSettingsClose"'), 'close control');
assert.ok(html.includes('aria-label="Close"'), 'close name');
assert.ok(html.includes('id="aidechatSettingsDone"'), 'done control');
assert.ok(html.includes('>Done<'), 'done label');
assert.ok(html.includes('id="aidechatSettingsOpen"'), 'reopen control');
assert.ok(html.includes('id="aidechatSettingsTitle">Remi auto-reply</h2>'), 'header title');
assert.ok(html.includes('onclick="aidechatSettingsChanged()"'), 'On/Off still calls aidechatSettingsChanged');
assert.ok(html.includes('min-height:44px'), 'tap target stays at least 44px');

const secStart = html.indexOf('id="aidechatSettings"');
const secEnd = html.indexOf('id="aidechatThreadView"', secStart);
const section = html.slice(secStart, secEnd);
assert.ok(section.includes('data-remi-autoreply-dismiss1="v=remi-autoreply-dismiss1"'), 'marker sits on the settings section');
assert.ok(section.includes('aria-label="Remi auto-reply"'), 'panel name stays');
assert.ok(!/style="[^"]*display:\s*none/.test(section), 'no inline display:none on the settings block');
assert.ok(section.includes('id="aidechatOn"'), 'On control stays');
assert.ok(section.includes('id="aidechatStart"'), 'From stays');
assert.ok(section.includes('id="aidechatEnd"'), 'Until stays');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + sig);
}

const closeFn = extractFn(html, 'function remiAutoreplyDismiss1Close()');
const openFn = extractFn(html, 'function remiAutoreplyDismiss1Open()');
const syncFn = extractFn(html, 'function remiAutoreplyDismiss1Sync(open)');
const changedFn = extractFn(html, 'async function aidechatSettingsChanged()');
[closeFn, openFn, syncFn].forEach(function(fn){
  assert.ok(!fn.includes('aidechatRpc'), 'dismiss does not call aidechatRpc');
  assert.ok(!fn.includes('aidechatSettingsChanged'), 'dismiss does not call aidechatSettingsChanged');
  assert.ok(!fn.includes('style.display'), 'dismiss does not set style.display');
  assert.ok(!fn.includes('fetch('), 'dismiss does not fetch');
  assert.ok(!/sms:|mailto:|quo/i.test(fn), 'dismiss does not touch Quo/SMS');
});
assert.ok(syncFn.includes('box.hidden'), 'dismiss uses the hidden attribute');
assert.ok(changedFn.includes("aidechatRpc('settingsSet'"), 'On/Off still posts settingsSet');
assert.ok(changedFn.includes('p_enabled'), 'enabled flag stays');
assert.ok(changedFn.includes('p_start_local'), 'start stays');
assert.ok(changedFn.includes('p_end_local'), 'end stays');

const els = {};
function fakeEl(id){
  const el = {
    id: id,
    hidden: false,
    attrs: {},
    scrolled: 0,
    setAttribute: function(k, v){this.attrs[k] = v;},
    scrollIntoView: function(){this.scrolled++;}
  };
  els[id] = el;
  return el;
}
const sandbox = {
  document: {getElementById: function(id){return els[id] || null;}},
  els: els
};
vm.createContext(sandbox);
fakeEl('aidechatSettings');
fakeEl('aidechatSettingsOpen');
fakeEl('aidechatList');
vm.runInContext(syncFn + '\n' + closeFn + '\n' + openFn, sandbox);
sandbox.remiAutoreplyDismiss1Close();
assert.strictEqual(els.aidechatSettings.hidden, true, 'close hides the panel');
assert.strictEqual(els.aidechatSettingsOpen.attrs['aria-expanded'], 'false', 'reopen button reports closed');
assert.ok(els.aidechatList.scrolled >= 1, 'close returns focus toward the inbox list');
sandbox.remiAutoreplyDismiss1Open();
assert.strictEqual(els.aidechatSettings.hidden, false, 'reopen shows the panel');
assert.strictEqual(els.aidechatSettingsOpen.attrs['aria-expanded'], 'true', 'reopen button reports open');

console.log('admin-remi-autoreply-dismiss1-test: unit ok');

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
    console.log('admin-remi-autoreply-dismiss1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  if(!fs.existsSync(chrome)){
    console.log('admin-remi-autoreply-dismiss1 browser skipped (no chrome)');
    return;
  }
  const shotDir = process.env.REMI_AUTOREPLY_DISMISS1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript', '.css':'text/css', '.txt':'text/plain'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const errors = [];
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=remi-autoreply-dismiss1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(){
      localStorage.clear();
      sessionStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      if(typeof navEditApply === 'function')navEditApply();
      showScreen('adminScreen');
      showTab('aidechat');
      if(typeof remiMsgTab1SetSegment === 'function')remiMsgTab1SetSegment('aides');
      aidechatThreads = [{
        id: 't-ada',
        aide_id: 'ada-id',
        username: 'ada',
        name: 'Ada Cole',
        preview_from_aide: 'I can cover tomorrow morning.',
        last_message: 'I can cover tomorrow morning.',
        last_message_at: '2026-09-29T14:05:00.000Z',
        has_unread: true,
        unread: 1,
        messages: []
      }];
      aidechatPaintInbox();
    });
    await page.waitForSelector('#aidechatSettings', {visible: true, timeout: 8000});
    const openBox = await page.$eval('#aidechatSettings', function(el){
      const cs = getComputedStyle(el);
      const close = document.getElementById('aidechatSettingsClose');
      const done = document.getElementById('aidechatSettingsDone');
      const reopen = document.getElementById('aidechatSettingsOpen');
      const closeBox = close.getBoundingClientRect();
      const doneBox = done.getBoundingClientRect();
      const reopenBox = reopen.getBoundingClientRect();
      return {
        hidden: el.hidden,
        display: cs.display,
        clients: document.getElementById('tab_aidechat').classList.contains('is-clients'),
        closeH: closeBox.height,
        doneH: doneBox.height,
        reopenH: reopenBox.height,
        title: document.getElementById('aidechatSettingsTitle').textContent
      };
    });
    assert.strictEqual(openBox.hidden, false, 'panel starts visible');
    assert.notStrictEqual(openBox.display, 'none', 'panel is painted');
    assert.strictEqual(openBox.clients, false, 'Aides segment');
    assert.ok(openBox.closeH >= 44, 'X is at least 44px, got ' + openBox.closeH);
    assert.ok(openBox.doneH >= 44, 'Done is at least 44px, got ' + openBox.doneH);
    assert.ok(openBox.reopenH >= 44, 'reopen is at least 44px, got ' + openBox.reopenH);
    assert.strictEqual(openBox.title, 'Remi auto-reply');
    await page.evaluate(function(){
      document.getElementById('aidechatSettings').scrollIntoView({block: 'start'});
    });
    await page.screenshot({path: path.join(shotDir, 'remi-autoreply-dismiss1-open.png')});

    await page.click('#aidechatSettingsClose');
    const closed = await page.evaluate(function(){
      var box = document.getElementById('aidechatSettings');
      var list = document.getElementById('aidechatList');
      var card = list.querySelector('.aidechat-card');
      var cs = getComputedStyle(box);
      var listCs = getComputedStyle(list);
      return {
        hidden: box.hidden,
        display: cs.display,
        listDisplay: listCs.display,
        card: card ? card.textContent : '',
        expanded: document.getElementById('aidechatSettingsOpen').getAttribute('aria-expanded'),
        on: document.getElementById('aidechatOn').checked
      };
    });
    assert.strictEqual(closed.hidden, true, 'X sets hidden');
    assert.strictEqual(closed.display, 'none', 'hidden rule hides the panel');
    assert.notStrictEqual(closed.listDisplay, 'none', 'inbox list stays painted');
    assert.ok(closed.card.indexOf('Ada Cole') >= 0, 'thread stays on the list');
    assert.strictEqual(closed.expanded, 'false');
    await page.screenshot({path: path.join(shotDir, 'remi-autoreply-dismiss1-inbox.png')});

    await page.click('#aidechatSettingsOpen');
    await page.waitForSelector('#aidechatSettings', {visible: true, timeout: 4000});
    await page.evaluate(function(){
      document.getElementById('aidechatOn').checked = true;
      document.getElementById('aidechatStart').value = '15:30';
      document.getElementById('aidechatEnd').value = '07:15';
      document.getElementById('aidechatOn').dispatchEvent(new Event('change'));
    });
    await page.waitForFunction(function(){
      return document.getElementById('aidechatOn').checked === true
        && document.getElementById('aidechatStart').value === '15:30'
        && document.getElementById('aidechatEnd').value === '07:15';
    }, {timeout: 4000});
    const fields = await page.evaluate(function(){
      return {
        hidden: document.getElementById('aidechatSettings').hidden,
        on: document.getElementById('aidechatOn').checked,
        start: document.getElementById('aidechatStart').value,
        end: document.getElementById('aidechatEnd').value,
        enabled: aidechatSettings.enabled,
        startLocal: aidechatSettings.start_local,
        endLocal: aidechatSettings.end_local
      };
    });
    assert.strictEqual(fields.hidden, false, 'header control brings the panel back');
    assert.strictEqual(fields.on, true, 'On still toggles');
    assert.strictEqual(fields.start, '15:30', 'From still edits');
    assert.strictEqual(fields.end, '07:15', 'Until still edits');
    assert.strictEqual(fields.enabled, true, 'settings object follows On');
    assert.strictEqual(fields.startLocal, '15:30');
    assert.strictEqual(fields.endLocal, '07:15');
    await page.screenshot({path: path.join(shotDir, 'remi-autoreply-dismiss1-reopen.png')});

    await page.click('#aidechatSettingsDone');
    const done = await page.$eval('#aidechatSettings', function(el){return el.hidden;});
    assert.strictEqual(done, true, 'Done hides the panel');

    await page.evaluate(function(){
      if(typeof remiMsgTab1SetSegment === 'function')remiMsgTab1SetSegment('clients');
    });
    const clients = await page.evaluate(function(){
      var box = document.getElementById('aidechatSettings');
      return {
        isClients: document.getElementById('tab_aidechat').classList.contains('is-clients'),
        display: getComputedStyle(box).display
      };
    });
    assert.strictEqual(clients.isClients, true, 'Clients segment');
    assert.strictEqual(clients.display, 'none', 'clients rule still hides settings');

    const relevant = errors.filter(function(msg){
      return /remiAutoreplyDismiss1|aidechatSettings/.test(msg);
    });
    assert.deepStrictEqual(relevant, [], 'no settings page errors: ' + relevant.join(' | '));
    console.log('admin-remi-autoreply-dismiss1-test: browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
