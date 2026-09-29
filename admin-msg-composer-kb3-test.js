#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('v=msg-composer-kb3'), 'msg-composer-kb3 marker');
assert.ok(html.includes('?v=msg-composer-kb3'), 'cache bust query');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-msg-composer-kb3">'), 'admin-build meta');
assert.ok(html.includes("var MSG_COMPOSER_KB3_MARKER='v=msg-composer-kb3'"), 'script marker');
assert.ok(html.includes("var MSG_COMPOSER_KB3_BUILD='2026-09-29-msg-composer-kb3'"), 'script build');
assert.ok(html.includes('GHOST-MSG-COMPOSER-KB3-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'Ace NO CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth'), 'hard rules');
assert.ok(html.includes('data-msg-composer-kb3="v=msg-composer-kb3"'), 'composer carries the marker');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');

['v=msg-composer-kb2','v=sched-creds1','v=care-msg-safe1','v=aides-info1','v=admin-sched-chat-push1','v=pages-cache-fresh1','v=loginkb1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-msg-composer-kb2">'), 'kb2 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-sched-creds1">'), 'sched-creds1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-pages-cache-fresh1">'), 'pages-cache meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-care-msg-safe1">'), 'care-msg meta stays');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('without a sticky ?v='), 'Home Screen URL is not rewritten to a sticky ?v=');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/msg-composer-kb3-v1.sql')), 'no SQL patch');

assert.ok(html.includes('html.aidechat-kb #adminScreen #bottomNav,\nhtml.remi-ask-kb #adminScreen #bottomNav{display:none !important;bottom:auto !important;}'), 'tab bar stays display none while the keyboard class is on');
assert.ok(html.includes('--login-land-vv-lift:0px !important'), 'login-land lift cannot pad the page during keyboard mode');
assert.ok(html.includes('html.aidechat-kb #aidechatComposer{position:fixed'), 'only the composer is fixed');
assert.ok(html.includes('html.aidechat-kb #aidechatThreadView{position:static'), 'thread stays in normal flow');
assert.ok(html.includes('html.aidechat-kb #aidechatComposer{margin-bottom:0;padding:8px 12px 8px;}'), 'padding stays inside the white bar');
assert.ok(html.includes('html.remi-ask-kb #copilotSheet{padding-bottom:0;}'), 'Remi Ask sheet has no padding under the composer');

const pinStart = html.indexOf('function careMsgSafe1PinAide()');
const pinEnd = html.indexOf('function careMsgSafe1FitComposer()');
const pinFn = html.slice(pinStart, pinEnd);
assert.ok(pinStart > 0 && pinFn.length > 40, 'pin helper stays');
assert.ok(!pinFn.includes('gap<80') && !pinFn.includes('gap>=80'), 'aide pin does not wait for a keyboard gap');
assert.ok(pinFn.includes("classList.add('aidechat-kb')"), 'focus adds aidechat-kb immediately');
assert.ok(pinFn.includes('loginLandSchedule1FitNav'), 'pin still calls FitNav');
assert.ok(pinFn.indexOf('loginLandSchedule1FitNav') < pinFn.indexOf('loginLandSchedule1ClearLift'), 'ClearLift runs after FitNav so the call cannot re-lift');
assert.ok(pinFn.includes('loginKbFixedFollowsLayout'), 'composer uses the loginkb1 fixed-origin check');
assert.ok(pinFn.includes("form.style.position='fixed'"), 'composer is position fixed');
assert.ok(pinFn.includes('msgComposerKb3DockForm'), 'pin corrects a floating composer');
assert.ok(!pinFn.includes("thread.style.position='fixed'"), 'thread is not position fixed');
assert.ok(pinFn.includes("getElementById('msgDensePanel')") && pinFn.includes("getElementById('aidechatMessages')"), 'panel and message list shorten above the composer');
assert.ok(!pinFn.includes("role==='Admin'") && !pinFn.includes('currentAdminRole'), 'the keyboard pin is not Admin-only');
assert.ok(html.includes("(window.innerWidth||0)<=899"), 'desktop widths at 900px and up do not tuck');
assert.ok(html.includes('setTimeout(careMsgSafe1PinAide, 80)') && html.includes('setTimeout(careMsgSafe1PinAide, 320)'), 'pin re-runs at 80ms and 320ms');
assert.ok(html.includes("vv.addEventListener('resize', function(){careMsgSafe1PinAide();"), 'visualViewport resize re-pins');
assert.ok(html.includes("vv.addEventListener('scroll', function(){careMsgSafe1PinAide();"), 'visualViewport scroll re-pins');

const askFn = html.slice(html.indexOf('function copilotChatViewport()'), html.indexOf('function copilotChatBindViewport()'));
assert.ok(askFn.includes('gap>=80'), 'Remi Ask still waits for gap>=80');
assert.ok(askFn.includes("classList.add('remi-ask-kb')"), 'Remi Ask still sets remi-ask-kb');
assert.ok(askFn.includes('loginLandSchedule1FitNav'), 'Remi Ask keyboard mode also skips the login-land lift');
assert.ok(askFn.includes('msgComposerKb3FlushBox'), 'Remi Ask flushes the sheet when the keyboard class is on');

const dockStart = html.indexOf('function msgComposerKb3ProbeTop()');
const dockEnd = html.indexOf('function careMsgSafe1PinAide()');
assert.ok(dockStart > 0 && dockEnd > dockStart, 'dock helpers');

function dockSandbox(mode, view, innerHeight){
  const box = {
    mode: mode,
    bottom: 0,
    height: 200,
    innerHeight: innerHeight,
    view: view,
    createdProbe: false
  };
  function formRect(){
    const h = 56;
    let edge;
    if(box.mode === 'visual')edge = box.view.height - box.bottom;
    else edge = box.innerHeight - box.bottom;
    return {top: edge - h, bottom: edge, height: h, left: 0, right: 390, width: 390};
  }
  function probeTop(){
    if(box.mode === 'visual')return 0;
    return -(box.view.offsetTop || 0);
  }
  const form = {
    style: {
      set bottom(v){box.bottom = parseFloat(v) || 0;},
      get bottom(){return box.bottom + 'px';}
    },
    setAttribute: function(){},
    getBoundingClientRect: function(){return formRect();}
  };
  const probe = {
    id: 'loginKbProbe',
    style: {},
    setAttribute: function(){},
    getBoundingClientRect: function(){
      const top = probeTop();
      return {top: top, bottom: top, height: 0, left: 0, right: 0, width: 0};
    }
  };
  const sheet = {
    style: {
      set height(v){box.height = parseFloat(v) || box.height;},
      get height(){return box.height + 'px';}
    },
    getBoundingClientRect: function(){
      return {top: 0, bottom: box.height, height: box.height, left: 0, right: 390, width: 390};
    }
  };
  const sandbox = {
    document: {
      body: {appendChild: function(){box.createdProbe = true;}},
      getElementById: function(id){return id === 'loginKbProbe' ? probe : null;},
      createElement: function(){return probe;}
    },
    window: {innerHeight: innerHeight},
    loginKbFixedFollowsLayout: function(v){return !v || (v.offsetTop || 0) < 2;},
    isFinite: isFinite,
    Math: Math,
    Number: Number
  };
  vm.createContext(sandbox);
  vm.runInContext(html.slice(dockStart, dockEnd), sandbox);
  return {sandbox: sandbox, form: form, sheet: sheet, box: box};
}

(function visualFixedBug(){
  const run = dockSandbox('visual', {height: 420, offsetTop: 0, width: 390}, 800);
  const follows = true;
  const bottom = run.sandbox.msgComposerKb3DockForm(run.form, run.view || {height: 420, offsetTop: 0}, follows);
  assert.strictEqual(bottom, 0, 'visual-fixed keyboard does not keep the layoutH-dock lift');
  const rect = run.form.getBoundingClientRect();
  const target = run.sandbox.msgComposerKb3VisualBottom({height: 420, offsetTop: 0});
  assert.ok(Math.abs(rect.bottom - target) <= 2, 'composer bottom matches the visual viewport: ' + rect.bottom + ' vs ' + target);
})();

(function layoutFixedAlreadyFlush(){
  const run = dockSandbox('layout', {height: 420, offsetTop: 0, width: 390}, 800);
  const bottom = run.sandbox.msgComposerKb3DockForm(run.form, {height: 420, offsetTop: 0}, true);
  assert.strictEqual(bottom, 380, 'layout-fixed keeps the single lift');
  const rect = run.form.getBoundingClientRect();
  assert.ok(Math.abs(rect.bottom - 420) <= 2, 'layout-fixed composer sits on the visual bottom');
})();

(function layoutFixedScrolled(){
  const run = dockSandbox('layout', {height: 400, offsetTop: 40, width: 390}, 800);
  run.sandbox.msgComposerKb3DockForm(run.form, {height: 400, offsetTop: 40}, true);
  const rect = run.form.getBoundingClientRect();
  const target = run.sandbox.msgComposerKb3VisualBottom({height: 400, offsetTop: 40});
  assert.ok(Math.abs(rect.bottom - target) <= 2, 'scrolled layout dock stays within 2px: ' + rect.bottom + ' vs ' + target);
})();

(function remiFlush(){
  const run = dockSandbox('visual', {height: 480, offsetTop: 0, width: 390}, 800);
  run.box.height = 300;
  const delta = run.sandbox.msgComposerKb3FlushBox(run.sheet, {height: 480, offsetTop: 0});
  assert.ok(Math.abs(delta) <= 2, 'Remi sheet flushes: ' + delta);
  assert.strictEqual(run.box.height, 480, 'short Remi sheet grows to the visual viewport');
})();

console.log('admin-msg-composer-kb3-test: unit ok');

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
    console.log('admin-msg-composer-kb3 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.KB3_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript', '.css':'text/css'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403); res.end(); return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404); res.end('missing'); return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store'});
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
    await page.setViewport({width: 390, height: 844, deviceScaleFactor: 1});
    await page.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 30000});
    const boot = await page.evaluate(function(){
      localStorage.clear();
      sessionStorage.clear();
      var metas = document.querySelectorAll('meta[name="admin-build"]');
      return {
        first: metas[0] ? metas[0].content : '',
        buildFileNote: document.querySelector('meta[name="pages-cache-fresh1"]') ? document.querySelector('meta[name="pages-cache-fresh1"]').content : '',
        kb3: typeof MSG_COMPOSER_KB3_BUILD === 'string' ? MSG_COMPOSER_KB3_BUILD : '',
        header: typeof AIDE_THREAD_HEADER1_BUILD === 'string' ? AIDE_THREAD_HEADER1_BUILD : ''
      };
    });
    assert.strictEqual(boot.first, '2026-09-27-remi-float-hide1b');
    assert.strictEqual(boot.buildFileNote, '2026-09-29-pages-cache-fresh1');
    assert.strictEqual(boot.kb3, '2026-09-29-msg-composer-kb3');
    assert.strictEqual(boot.header, '2026-09-29-aide-thread-header1');

    async function openThread(role){
      return page.evaluate(function(roleName){
        currentAdminRole = roleName;
        currentAdminUsername = roleName === 'Scheduler' ? 'jaz' : 'moe';
        if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
        if(typeof showScreen === 'function')showScreen('adminScreen');
        aidechatRefresh = async function(){return;};
        aidechatLoadSettings = async function(){return;};
        if(typeof clienthrs1dLoadNames === 'function')clienthrs1dLoadNames = function(){};
        if(typeof clienthrs1dKickDue === 'function')clienthrs1dKickDue = function(){};
        var id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
        aidesInfo1ByKey = {};
        aidesInfo1ByKey['keisha.w'] = {
          id: id,
          username: 'keisha.w',
          name: 'Keisha Williams',
          _raw: {
            id: id,
            username: 'keisha.w',
            full_name: 'Keisha Williams',
            clients: [
              {name: 'Mae Johnson', insurance_label: 'Blue Cross'},
              {name: 'Andre Park', insurance_plan: 'passport'}
            ]
          }
        };
        var thread = aidechatMapThread({
          thread_id: 't-keisha',
          aide_id: id,
          aide_username: 'keisha.w',
          aide_name: 'Keisha Williams',
          status: 'open',
          messages: [
            {id: 'm1', sender: 'aide', body: 'Can I swap Sunday AM with Sara?', created_at: '2026-09-29T14:00:00Z'},
            {id: 'm2', sender: 'office', display_name: roleName === 'Scheduler' ? 'Jaz (Scheduler)' : 'Moe (Admin)', body: "Checking Mae's Blue Cross hours — one sec.", created_at: '2026-09-29T14:01:00Z'},
            {id: 'm3', sender: 'aide', body: 'Also Andre needs Passport form signed.', created_at: '2026-09-29T14:02:00Z'}
          ]
        });
        aidechatThreads = [thread];
        aidechatSelectedId = thread.id;
        aidechatView = 'thread';
        showTab('aidechat');
        aidechatShow('thread');
        aidechatPaintThread();
        var reply = document.getElementById('aidechatReply');
        if(reply)reply.value = 'See you Sunday — start at 9.';
        var title = document.getElementById('aidechatThreadTitle').textContent;
        var meta = document.getElementById('aidechatThreadMeta').textContent;
        var chips = Array.prototype.map.call(document.querySelectorAll('#aidechatThreadChips .aide-thread-chip'), function(el){return el.textContent;});
        var nav = document.getElementById('nav_aidechat');
        return {
          title: title,
          meta: meta,
          chips: chips,
          hidden: document.getElementById('aidechatThreadChips').hidden,
          marker: document.querySelector('.msg-dense-head').getAttribute('data-aide-thread-header1'),
          composer: document.getElementById('aidechatComposer').getAttribute('data-msg-composer-kb3'),
          roles: document.getElementById('aidechatComposer').getAttribute('data-layout-roles'),
          navHidden: !!(nav && nav.hidden),
          role: currentAdminRole
        };
      }, role);
    }

    const adminHead = await openThread('Admin');
    assert.strictEqual(adminHead.title, 'Keisha Williams');
    assert.strictEqual(adminHead.meta, '@keisha.w · Aide · Open');
    assert.ok(adminHead.meta.indexOf('signed in as') < 0, adminHead.meta);
    assert.ok(adminHead.meta.indexOf('Moe') < 0, adminHead.meta);
    assert.deepStrictEqual(adminHead.chips, ['Mae Johnson · Blue Cross', 'Andre Park · Passport']);
    assert.strictEqual(adminHead.hidden, false);
    assert.strictEqual(adminHead.marker, 'v=aide-thread-header1');
    assert.strictEqual(adminHead.composer, 'v=msg-composer-kb3');
    assert.strictEqual(adminHead.roles, 'Admin Scheduler');
    await page.screenshot({path: path.join(shotDir, 'aide-thread-header1-admin.png')});

    const schedHead = await openThread('Scheduler');
    assert.strictEqual(schedHead.title, 'Keisha Williams');
    assert.strictEqual(schedHead.meta, '@keisha.w · Aide · Open');
    assert.ok(schedHead.meta.indexOf('Jaz') < 0, schedHead.meta);
    assert.deepStrictEqual(schedHead.chips, ['Mae Johnson · Blue Cross', 'Andre Park · Passport']);
    await page.screenshot({path: path.join(shotDir, 'aide-thread-header1-scheduler.png')});

    async function tuck(role){
      await openThread(role);
      return page.evaluate(function(){
        careMsgSafe1ReadVv = function(){return {height: 520, offsetTop: 0, width: 390};};
        var reply = document.getElementById('aidechatReply');
        reply.focus();
        careMsgSafe1PinAide();
        var form = document.getElementById('aidechatComposer');
        var rect = form.getBoundingClientRect();
        var view = careMsgSafe1ReadVv();
        var target = msgComposerKb3VisualBottom(view);
        var nav = document.getElementById('bottomNav');
        var navCs = window.getComputedStyle(nav);
        var old = document.getElementById('kb3ShotChrome');
        if(old && old.parentNode)old.parentNode.removeChild(old);
        var chrome = document.createElement('div');
        chrome.id = 'kb3ShotChrome';
        chrome.setAttribute('aria-hidden', 'true');
        chrome.style.cssText = 'position:fixed;left:0;right:0;z-index:210;background:#1c1c1e;display:flex;flex-direction:column;pointer-events:none;';
        chrome.style.top = Math.round(rect.bottom) + 'px';
        chrome.style.bottom = '0px';
        chrome.innerHTML = '<div style="height:44px;background:#d1d1d6;color:#111;display:flex;align-items:center;justify-content:space-between;padding:0 14px;font:600 15px -apple-system,sans-serif"><span style="color:#007aff">\u2039</span><span>evercare.app/admin/messages</span><span style="color:#007aff">Done</span></div><div style="flex:1"></div>';
        document.body.appendChild(chrome);
        var panel = document.getElementById('msgDensePanel');
        var panelRect = panel.getBoundingClientRect();
        return {
          delta: Math.round(rect.bottom - target),
          kb: document.documentElement.classList.contains('aidechat-kb'),
          navDisplay: navCs.display,
          lift: document.documentElement.style.getPropertyValue('--login-land-vv-lift'),
          navBottom: nav.style.bottom || '',
          formBottom: Math.round(rect.bottom),
          panelBottom: Math.round(panelRect.bottom),
          gapUnderPanel: Math.round(rect.top - panelRect.bottom),
          bubbles: document.querySelectorAll('#aidechatMessages .aidechat-bubble').length
        };
      });
    }

    const adminKb = await tuck('Admin');
    assert.ok(Math.abs(adminKb.delta) <= 2, 'admin composer flush ' + JSON.stringify(adminKb));
    assert.strictEqual(adminKb.kb, true);
    assert.strictEqual(adminKb.navDisplay, 'none');
    assert.ok(adminKb.bubbles >= 2, 'thread bubbles stay above the composer');
    assert.ok(Math.abs(adminKb.gapUnderPanel) <= 8, 'panel ends at the composer ' + adminKb.gapUnderPanel);
    await page.screenshot({path: path.join(shotDir, 'msg-composer-kb3-admin.png')});

    const schedKb = await tuck('Scheduler');
    assert.ok(Math.abs(schedKb.delta) <= 2, 'scheduler composer flush ' + JSON.stringify(schedKb));
    assert.strictEqual(schedKb.kb, true);
    assert.strictEqual(schedKb.navDisplay, 'none');
    await page.screenshot({path: path.join(shotDir, 'msg-composer-kb3-scheduler.png')});

    await page.evaluate(function(){
      var reply = document.getElementById('aidechatReply');
      if(reply)reply.blur();
    });
    await new Promise(function(resolve){setTimeout(resolve, 120);});
    const cleared = await page.evaluate(function(){
      return document.documentElement.classList.contains('aidechat-kb');
    });
    assert.strictEqual(cleared, false, 'blur clears the tuck');

    await page.setViewport({width: 1100, height: 800, deviceScaleFactor: 1});
    const desk = await page.evaluate(function(){
      careMsgSafe1ReadVv = function(){return {height: 400, offsetTop: 0, width: 1100};};
      var reply = document.getElementById('aidechatReply');
      if(reply)reply.focus();
      careMsgSafe1PinAide();
      return {
        phone: careMsgSafe1Phone(),
        kb: document.documentElement.classList.contains('aidechat-kb'),
        width: window.innerWidth
      };
    });
    assert.strictEqual(desk.phone, false, 'desktop is not the phone tuck');
    assert.strictEqual(desk.kb, false, 'desktop focus does not tuck');
    assert.ok(!errors.length, errors.join('\n'));
    console.log('admin-msg-composer-kb3 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
