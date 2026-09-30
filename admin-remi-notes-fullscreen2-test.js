#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildTxt = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/\s+$/, '');

assert.strictEqual(buildTxt, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('GHOST-REMI-NOTES-FULLSCREEN2-CONTRACT-v1'), 'contract');
assert.ok(html.includes('GHOST-REMI-NOTES-FULLSCREEN1-CONTRACT-v1'), 'fullscreen1 lineage stays');
assert.ok(html.includes('v=remi-notes-fullscreen2'), 'marker');
assert.ok(html.includes('?v=remi-notes-fullscreen2'), 'pages cache bust');
assert.ok(html.includes('admin-build 2026-09-29-remi-notes-fullscreen2'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-notes-fullscreen2">'), 'meta');
assert.ok(html.includes("var REMI_NOTES_FULLSCREEN2_MARKER='v=remi-notes-fullscreen2'"), 'script marker');
assert.ok(html.includes("var REMI_NOTES_FULLSCREEN2_BUILD='2026-09-29-remi-notes-fullscreen2'"), 'script build');
assert.ok(html.includes('data-remi-notes-fullscreen2="v=remi-notes-fullscreen2"'), 'data attr');
assert.ok(html.includes('data-remi-notes-fullscreen1="v=remi-notes-fullscreen1"'), 'fullscreen1 marker stays');
assert.ok(html.includes('function remiNotesFullscreen2Lock'), 'scroll lock');
assert.ok(html.includes('function remiNotesFullscreen2Unlock'), 'scroll unlock');
assert.ok(html.includes("classList.add('remi-sheet-lock')"), 'lock class');
assert.ok(html.includes('overscroll-behavior:none'), 'overscroll trap');
assert.ok(html.includes('Friday NO MERGE'), 'merge stays held');
assert.ok(html.includes('Nurse stays out'), 'nurse stays out');

const notes1Start = html.indexOf('// remi notes v=remi-notes1');
const notes1End = html.indexOf('// end remi notes v=remi-notes1');
const notes1 = html.slice(notes1Start, notes1End);
const pinStart = notes1.indexOf('function remiNotesFullscreen1Pin(');
const pinEnd = notes1.indexOf('function remiNotesFullscreen1Fit()');
const pinSrc = notes1.slice(pinStart, pinEnd);
assert.ok(pinStart > 0 && pinEnd > pinStart, 'pin stays on the fullscreen1 helper');
assert.ok(pinSrc.includes('visualViewport') || notes1.includes('function remiNotesFullscreen1View()'), 'pin reads visualViewport');
assert.ok(pinSrc.includes('remiNotesFullscreen1AccessoryPad'), 'accessory pad stays on the notes pin');
assert.ok(pinSrc.includes("position='absolute'"), 'compose covers the Remi visual box');
assert.ok(!pinSrc.includes('msgComposerKb3DockForm'), 'does not call the messages dock helper');
assert.ok(!pinSrc.includes('msgComposerRect1FlushBottom'), 'does not call the messages flush helper');
assert.ok(notes1.slice(notes1.indexOf('function remiNotesKb2Fit()'), notes1.indexOf('function remiNotesKb1Fit()')).includes('remiNotesFullscreen1Fit()'), 'kb2 still defers');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('https://evercareagency.github.io/Admin/'), 'Home Screen URL stays clean');

console.log('admin-remi-notes-fullscreen2 unit ok');

function loadPuppeteer(){
  try{ return require('puppeteer-core'); }
  catch(e){
    try{ return require('/tmp/probe/node_modules/puppeteer-core'); }
    catch(e2){ return null; }
  }
}

async function boot(browser, port, role){
  const page = await browser.newPage();
  await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1});
  await page.goto('http://127.0.0.1:' + port + '/index.html?v=remi-notes-fullscreen2', {waitUntil: 'domcontentloaded', timeout: 60000});
  await page.evaluate(function(roleName){
    localStorage.setItem('evercare_sheets', '1');
    localStorage.setItem('admin_session', JSON.stringify({role: roleName, username: roleName === 'Scheduler' ? 'jaz@evercare.test' : 'mo@evercare.test', name: roleName === 'Scheduler' ? 'Jaz' : 'Moe', loginAt: Date.now()}));
    currentAdminRole = roleName;
    currentAdminUsername = roleName === 'Scheduler' ? 'jaz@evercare.test' : 'mo@evercare.test';
    if(typeof showScreen === 'function') showScreen('adminScreen');
    if(typeof layoutA1ApplyRoles === 'function') layoutA1ApplyRoles();
  }, role);
  return page;
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-notes-fullscreen2 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const rootDir = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript', '.css':'text/css'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(rootDir, rel));
    if(!file.startsWith(rootDir)){ res.writeHead(403); res.end(); return; }
    fs.readFile(file, function(err, buf){
      if(err){ res.writeHead(404); res.end('missing'); return; }
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){ server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  let browser = null;
  try{
    browser = await puppeteer.launch({
      executablePath: chrome,
      headless: 'new',
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  }catch(err){
    server.close();
    console.log('admin-remi-notes-fullscreen2 browser skipped (' + String(err && err.message || err) + ')');
    return;
  }
  try{
    fs.mkdirSync('/opt/cursor/artifacts', {recursive: true});
    const phone = await boot(browser, port, 'Admin');
    const locked = await phone.evaluate(async function(){
      sbRestRpc = async function(name, body){
        window.__rpc = window.__rpc || [];
        window.__rpc.push({name: name, body: body});
        if(name === 'remi_list_my_notes') return {ok: true, data: {notes: [{id: 'n1', body: 'Devon pay hold — check Monday.', updates: []}]}};
        if(name === 'remi_save_my_note') return {ok: true, data: {success: true, ok: true, note: {id: 'n-new', body: body.p_body, updates: []}}};
        return {ok: true, data: {success: true, ok: true, notes: []}};
      };
      var page = document.querySelector('#adminScreen .shell-top') || document.getElementById('adminScreen');
      remiNotesShow();
      await remiNotesVis1Load();
      var before = Math.round(page.getBoundingClientRect().top);
      var scrollBefore = window.scrollY || document.documentElement.scrollTop || 0;
      try{ window.scrollTo(0, 640); }catch(e){}
      try{ document.documentElement.scrollTop = 640; }catch(e2){}
      try{ document.body.scrollTop = 640; }catch(e3){}
      var after = Math.round(page.getBoundingClientRect().top);
      return {
        lock: document.documentElement.classList.contains('remi-sheet-lock'),
        bodyPos: window.getComputedStyle(document.body).position,
        overflow: window.getComputedStyle(document.documentElement).overflow,
        before: before,
        after: after,
        scrollBefore: scrollBefore,
        scrollAfter: window.scrollY || document.documentElement.scrollTop || 0,
        sheet: document.getElementById('copilotSheet').hidden,
        view: copilotView,
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        parent: document.getElementById('remiNotesClarityCompose').parentNode.id,
        marker: document.getElementById('copilotSheet').getAttribute('data-remi-notes-fullscreen2')
      };
    });
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-fullscreen2-scroll-lock.png'});
    assert.strictEqual(locked.lock, true, 'Remi open locks the page ' + JSON.stringify(locked));
    assert.strictEqual(locked.bodyPos, 'fixed', JSON.stringify(locked));
    assert.strictEqual(locked.overflow, 'hidden', JSON.stringify(locked));
    assert.strictEqual(locked.before, locked.after, 'homepage does not move when the page is scrolled ' + JSON.stringify(locked));
    assert.strictEqual(locked.sheet, false);
    assert.strictEqual(locked.view, 'notes');
    assert.strictEqual(locked.fs, false, 'resting list is not compose');
    assert.strictEqual(locked.parent, 'remiNotesDock');
    assert.strictEqual(locked.marker, 'v=remi-notes-fullscreen2');

    const compose = await phone.evaluate(function(){
      var fake = {height: 430, offsetTop: 48, offsetLeft: 0, width: 390, addEventListener: function(){}, removeEventListener: function(){}};
      try{ Object.defineProperty(window, 'visualViewport', {configurable: true, get: function(){ return fake; }}); }catch(e){}
      var input = document.getElementById('remiNotesVisInput');
      remiNotesFullscreen2Arm(input);
      input.value = 'Ping Maria about Bowlax CM';
      remiNotesFullscreen1Fit();
      var vv = window.visualViewport;
      var vvTop = Math.round(vv.offsetTop || 0);
      var vvBottom = Math.round(vvTop + vv.height);
      function box(id){
        var el = document.getElementById(id);
        var r = el.getBoundingClientRect();
        var cs = window.getComputedStyle(el);
        return {
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          height: Math.round(r.height),
          hidden: !!el.hidden || cs.display === 'none' || cs.visibility === 'hidden'
        };
      }
      var panel = document.getElementById('remiNotesClarityCompose').getBoundingClientRect();
      var sheet = document.getElementById('copilotSheet');
      var body = document.getElementById('copilotBody');
      return {
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        title: document.getElementById('remiNotesFsTitle').textContent,
        list: window.getComputedStyle(body).visibility,
        pos: window.getComputedStyle(document.getElementById('remiNotesClarityCompose')).position,
        inBody: body.contains(document.getElementById('remiNotesClarityCompose')),
        parent: document.getElementById('remiNotesClarityCompose').parentNode.id,
        panelTop: Math.round(panel.top),
        panelBottom: Math.round(panel.bottom),
        sheetBottom: Math.round(sheet.getBoundingClientRect().bottom),
        vvTop: vvTop,
        vvBottom: vvBottom,
        scroll: window.scrollY || 0,
        cancel: box('remiNotesFsCancel'),
        save: box('remiNotesFsSave'),
        input: box('remiNotesVisInput'),
        remind: box('remiNotesClarityRemind'),
        view: copilotView,
        chat: document.getElementById('tab_aidechat').classList.contains('active')
      };
    });
    await phone.evaluate(function(top){
      var mask = document.getElementById('remiNotesFs2SimKb');
      if(!mask){
        mask = document.createElement('div');
        mask.id = 'remiNotesFs2SimKb';
        mask.textContent = 'simulated keyboard';
        document.body.appendChild(mask);
      }
      mask.style.cssText = 'position:fixed;left:0;right:0;top:' + top + 'px;bottom:0;background:rgba(20,24,32,.72);color:#fff;z-index:40;display:flex;align-items:flex-start;justify-content:center;padding-top:12px;font:700 13px/1.2 sans-serif;pointer-events:none;';
    }, compose.vvBottom);
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-fullscreen2-compose.png'});
    assert.strictEqual(compose.fs, true, JSON.stringify(compose));
    assert.strictEqual(compose.title, 'New note');
    assert.strictEqual(compose.list, 'hidden');
    assert.strictEqual(compose.pos, 'absolute');
    assert.strictEqual(compose.inBody, false, 'compose is not a scrolled pane child');
    assert.strictEqual(compose.parent, 'remiNotesDock');
    assert.strictEqual(compose.view, 'notes');
    assert.strictEqual(compose.chat, false);
    assert.ok(compose.panelTop >= compose.vvTop, 'panel starts in the visual viewport ' + JSON.stringify(compose));
    assert.ok(compose.panelBottom <= compose.vvBottom + 2, 'panel stays above the keyboard ' + JSON.stringify(compose));
    assert.ok(compose.sheetBottom <= compose.vvBottom + 2, 'sheet stays above the keyboard ' + JSON.stringify(compose));
    ['cancel', 'save', 'input', 'remind'].forEach(function(key){
      var box = compose[key];
      assert.ok(box && !box.hidden && box.height >= 44, key + ' visible ' + JSON.stringify(compose));
      assert.ok(box.top >= compose.vvTop - 1 && box.bottom <= compose.vvBottom + 2, key + ' is above the keyboard ' + JSON.stringify(compose));
    });

    const schedPage = await boot(browser, port, 'Scheduler');
    const sched = await schedPage.evaluate(async function(){
      sbRestRpc = async function(){ return {ok: true, data: {success: true, ok: true, notes: []}}; };
      var page = document.querySelector('#adminScreen .shell-top') || document.getElementById('adminScreen');
      remiNotesShow();
      await remiNotesVis1Load();
      var before = Math.round(page.getBoundingClientRect().top);
      try{ window.scrollTo(0, 500); }catch(e){}
      var after = Math.round(page.getBoundingClientRect().top);
      var fake = {height: 430, offsetTop: 36, offsetLeft: 0, width: 390, addEventListener: function(){}, removeEventListener: function(){}};
      try{ Object.defineProperty(window, 'visualViewport', {configurable: true, get: function(){ return fake; }}); }catch(e2){}
      var input = document.getElementById('remiNotesVisInput');
      remiNotesFullscreen2Arm(input);
      input.value = 'Confirm Wed fill before noon blast';
      remiNotesFullscreen1Fit();
      var vv = window.visualViewport;
      var vvBottom = Math.round((vv.offsetTop || 0) + vv.height);
      function box(id){
        var el = document.getElementById(id);
        var r = el.getBoundingClientRect();
        return {top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height)};
      }
      return {
        lock: document.documentElement.classList.contains('remi-sheet-lock'),
        before: before,
        after: after,
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        title: document.getElementById('remiNotesFsTitle').textContent,
        soft: document.getElementById('remiNotesFsSoft').classList.contains('is-on'),
        hint: (document.getElementById('remiNotesVisHint') || {}).textContent || '',
        cancel: box('remiNotesFsCancel'),
        input: box('remiNotesVisInput'),
        remind: box('remiNotesClarityRemind'),
        vvBottom: vvBottom,
        panelBottom: Math.round(document.getElementById('remiNotesClarityCompose').getBoundingClientRect().bottom),
        chat: document.getElementById('tab_aidechat').classList.contains('active'),
        view: copilotView
      };
    });
    await schedPage.evaluate(function(top){
      var mask = document.createElement('div');
      mask.style.cssText = 'position:fixed;left:0;right:0;top:' + top + 'px;bottom:0;background:rgba(20,24,32,.72);color:#fff;z-index:40;display:flex;align-items:flex-start;justify-content:center;padding-top:12px;font:700 13px/1.2 sans-serif;pointer-events:none;';
      mask.textContent = 'simulated keyboard';
      document.body.appendChild(mask);
    }, sched.vvBottom);
    await schedPage.screenshot({path: '/opt/cursor/artifacts/remi-notes-fullscreen2-scheduler.png'});
    assert.strictEqual(sched.lock, true, JSON.stringify(sched));
    assert.strictEqual(sched.before, sched.after, 'scheduler homepage does not scroll behind Remi');
    assert.strictEqual(sched.fs, true, JSON.stringify(sched));
    assert.strictEqual(sched.title, 'New note');
    assert.strictEqual(sched.soft, true);
    assert.strictEqual(sched.hint, 'Your notes only');
    assert.strictEqual(sched.view, 'notes');
    assert.strictEqual(sched.chat, false);
    assert.ok(sched.cancel.top >= 0 && sched.cancel.height >= 44, JSON.stringify(sched));
    assert.ok(sched.input.bottom <= sched.vvBottom + 2 && sched.remind.bottom <= sched.vvBottom + 2, JSON.stringify(sched));
    assert.ok(sched.panelBottom <= sched.vvBottom + 2, JSON.stringify(sched));
    console.log('admin-remi-notes-fullscreen2 browser ok');
  }finally{
    if(browser) await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
