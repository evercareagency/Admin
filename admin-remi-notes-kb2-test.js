#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildTxt = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/\s+$/, '');

assert.strictEqual(buildTxt, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('GHOST-REMI-NOTES-KB2-CONTRACT-v1'), 'contract');
assert.ok(html.includes('v=remi-notes-kb2'), 'marker');
assert.ok(html.includes('admin-build 2026-09-29-remi-notes-kb2'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-notes-kb2">'), 'meta');
assert.ok(html.includes("var REMI_NOTES_KB2_MARKER='v=remi-notes-kb2'"), 'script marker');
assert.ok(html.includes("var REMI_NOTES_KB2_BUILD='2026-09-29-remi-notes-kb2'"), 'script build');
assert.ok(html.includes('data-remi-notes-kb2="v=remi-notes-kb2"'), 'compose marker');
assert.ok(html.includes('data-remi-notes-kb1="v=remi-notes-kb1"'), 'kb1 marker stays');
assert.ok(html.includes('interactive-widget=resizes-content'), 'viewport meta stays');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Nurse stays out'), 'nurse stays out');
assert.ok(html.includes('Your notes only'), 'scheduler soft copy stays');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-notes-kb2-v1.sql')), 'no SQL patch');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('https://evercareagency.github.io/Admin/'), 'Home Screen URL stays clean');
assert.ok(html.indexOf('content="2026-09-29-remi-notes-kb1"') < html.indexOf('content="2026-09-29-remi-notes-kb2"'), 'kb2 meta follows kb1');

const bodyTag = html.indexOf('<div id="copilotBody"></div>');
const dockTag = html.indexOf('<div id="remiNotesDock"');
assert.ok(bodyTag > 0 && dockTag > bodyTag, 'dock is outside #copilotBody');
const between = html.slice(bodyTag, dockTag);
assert.ok(between.indexOf('id="copilotBody"') === between.lastIndexOf('id="copilotBody"'), 'dock is not nested in the scroll body');

const notes1Start = html.indexOf('// remi notes v=remi-notes1');
const notes1End = html.indexOf('// end remi notes v=remi-notes1');
const notes1 = html.slice(notes1Start, notes1End);
const fitStart = notes1.indexOf('function remiNotesKb2Fit()');
const fitEnd = notes1.indexOf('function remiNotesKb1Fit()');
const fitSrc = notes1.slice(fitStart, fitEnd);
assert.ok(fitStart > 0 && fitEnd > fitStart, 'remiNotesKb2Fit exists');
assert.ok(fitSrc.includes('msgComposerKb3DockForm'), 'dock uses the message fixed helper');
assert.ok(fitSrc.includes('msgComposerRect1FlushBottom'), 'dock flushes to the visual bottom');
assert.ok(fitSrc.includes('loginLandSchedule1FitNav'), 'fit calls FitNav');
assert.ok(fitSrc.indexOf('loginLandSchedule1FitNav') < fitSrc.indexOf('loginLandSchedule1ClearLift'), 'FitNav then ClearLift');
assert.ok(fitSrc.includes("classList.add('remi-notes-kb')"), 'keyboard class');
assert.ok(fitSrc.includes('remiNotesClarity1SheetTop'), 'resting top stays the safe header');
assert.ok(fitSrc.includes("sheet.style.bottom='auto'"), 'focused sheet bottom is auto');
assert.ok(fitSrc.includes('--remi-notes-dock-h'), 'sheet padding uses the measured dock');
assert.ok(!fitSrc.includes('remiNotesVis1IsAdmin'), 'pin is not Admin-only');
assert.ok(!fitSrc.includes("form.style.position='fixed'"), 'nested card is not the fixed target');
assert.ok(notes1.includes('appendChild(card)'), 'composer stays adopted by the dock');
assert.ok(notes1.includes('setTimeout(fit, 80)') && notes1.includes('setTimeout(fit, 320)'), 'focus retries');
assert.ok(notes1.includes("t.id==='remiNotesVisInput'"), 'textarea focus');
assert.ok(notes1.includes("t.id==='remiNotesClarityRemind'") && notes1.includes("t.id==='remiNotesVisSave'") && notes1.includes("t.id==='remiNotesClarityWhen'"), 'Remind me, Save, and time chip focus');
assert.ok(notes1.slice(notes1.indexOf('function remiNotesKb1Fit()'), notes1.indexOf('function remiNotesClarity1Fit()')).includes('remiNotesKb2Fit()'), 'kb1 fit calls kb2');
assert.ok(notes1.slice(notes1.indexOf('function remiNotesClarity1Fit()'), notes1.indexOf('function remiNotesClarity1Bind()')).includes('remiNotesKb2Fit()'), 'clarity fit calls kb2');
assert.ok(html.includes('z-index:220'), 'dock layer matches aidechat');

console.log('admin-remi-notes-kb2 unit ok');

function loadPuppeteer(){
  try{ return require('puppeteer-core'); }
  catch(e){
    try{ return require('/tmp/probe/node_modules/puppeteer-core'); }
    catch(e2){ return null; }
  }
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-notes-kb2 browser skipped (no puppeteer-core)');
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
    console.log('admin-remi-notes-kb2 browser skipped (' + String(err && err.message || err) + ')');
    return;
  }
  try{
    const phone = await browser.newPage();
    await phone.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1});
    await phone.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 60000});
    await phone.evaluate(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({role: 'Admin', username: 'mo@evercare.test', name: 'Moe', loginAt: Date.now()}));
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function') showScreen('adminScreen');
    });
    const admin = await phone.evaluate(async function(){
      sbRestRpc = async function(){ return {ok: true, data: {success: true, ok: true, notes: []}}; };
      remiNotesShow();
      if(typeof remiNotesVis1Load === 'function') await remiNotesVis1Load();
      var compose = document.getElementById('remiNotesClarityCompose');
      var pane = document.getElementById('remiNotesVisPane');
      var body = document.getElementById('copilotBody');
      var dock = document.getElementById('remiNotesDock');
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var bar = document.querySelector('#adminScreen .shell-top').getBoundingClientRect();
      return {
        parent: compose && compose.parentNode ? compose.parentNode.id : '',
        dockParent: dock && dock.parentNode ? dock.parentNode.id : '',
        inPane: !!(pane && compose && pane.contains(compose)),
        inBody: !!(body && compose && body.contains(compose)),
        sheetTop: sheet.top,
        barBottom: bar.bottom,
        marker: compose ? compose.getAttribute('data-remi-notes-kb2') : '',
        kb1: compose ? compose.getAttribute('data-remi-notes-kb1') : '',
        firstMeta: document.querySelector('meta[name="admin-build"]').content,
        text: document.getElementById('copilotBody').innerText
      };
    });
    fs.mkdirSync('/opt/cursor/artifacts', {recursive: true});
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-kb2-admin.png'});
    assert.strictEqual(admin.parent, 'remiNotesDock', JSON.stringify(admin));
    assert.strictEqual(admin.dockParent, 'copilotSheet', 'dock stays a sheet sibling of the scroll body');
    assert.strictEqual(admin.inPane, false, 'composer is not left inside the scroll pane');
    assert.strictEqual(admin.inBody, false, 'composer is not inside #copilotBody');
    assert.ok(admin.sheetTop + 1 >= admin.barBottom, 'resting sheet clears the EverCare topbar ' + JSON.stringify(admin));
    assert.strictEqual(admin.marker, 'v=remi-notes-kb2');
    assert.strictEqual(admin.kb1, 'v=remi-notes-kb1');
    assert.strictEqual(admin.firstMeta, '2026-09-27-remi-float-hide1b');
    assert.ok(admin.text.indexOf('My notes | Reminders') < 0, admin.text);

    const kb = await phone.evaluate(function(){
      var input = document.getElementById('remiNotesVisInput');
      var fake = {height: 508, offsetTop: 0, offsetLeft: 0, width: 390, pageTop: 0, pageLeft: 0, scale: 1, addEventListener: function(){}, removeEventListener: function(){}};
      var replaced = false;
      try{
        Object.defineProperty(window, 'visualViewport', {configurable: true, get: function(){ return fake; }});
        replaced = window.visualViewport === fake && window.visualViewport.height === 508;
      }catch(e){}
      if(input && input.focus) input.focus();
      if(typeof remiNotesClarity1ToggleRemind === 'function') remiNotesClarity1ToggleRemind();
      if(input && input.focus) input.focus();
      if(typeof remiNotesKb2Fit === 'function') remiNotesKb2Fit();
      var dock = document.getElementById('remiNotesDock');
      var compose = document.getElementById('remiNotesClarityCompose');
      var sheetEl = document.getElementById('copilotSheet');
      var vv = window.visualViewport || {height: 844, offsetTop: 0};
      var vvBottom = Math.round((vv.offsetTop || 0) + (vv.height || 0));
      function box(id){
        var el = document.getElementById(id);
        if(!el || !el.getBoundingClientRect) return null;
        var r = el.getBoundingClientRect();
        return {top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), hidden: !!el.hidden};
      }
      var dockBox = dock.getBoundingClientRect();
      var form = compose.getBoundingClientRect();
      return {
        kb: document.documentElement.classList.contains('remi-notes-kb'),
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        replaced: replaced,
        parent: compose.parentNode.id,
        inBody: document.getElementById('copilotBody').contains(compose),
        listHidden: window.getComputedStyle(document.getElementById('copilotBody')).visibility,
        dockPosition: window.getComputedStyle(dock).position,
        composePosition: window.getComputedStyle(compose).position,
        dockBottom: Math.round(dockBox.bottom),
        dockTop: Math.round(dockBox.top),
        dockH: Math.round(dockBox.height),
        formBottom: Math.round(form.bottom),
        formTop: Math.round(form.top),
        vvBottom: vvBottom,
        vvH: vv.height,
        innerH: window.innerHeight,
        title: (document.getElementById('remiNotesFsTitle')||{}).textContent||'',
        pad: sheetEl.style.getPropertyValue('--remi-notes-dock-h'),
        input: box('remiNotesVisInput'),
        remind: box('remiNotesClarityRemind'),
        save: box('remiNotesFsSave'),
        when: box('remiNotesFsTimes'),
        z: window.getComputedStyle(compose).zIndex,
        nav: window.getComputedStyle(document.getElementById('bottomNav')).display
      };
    });
    await phone.evaluate(function(vvBottom){
      var mask = document.createElement('div');
      mask.id = 'remiNotesKb2SimKb';
      mask.textContent = 'simulated keyboard';
      mask.style.cssText = 'position:fixed;left:0;right:0;top:' + vvBottom + 'px;bottom:0;background:rgba(20,24,32,.55);color:#fff;z-index:40;display:flex;align-items:flex-start;justify-content:center;padding-top:12px;font:700 13px/1.2 sans-serif;pointer-events:none;';
      document.body.appendChild(mask);
    }, kb.vvBottom);
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-kb2-keyboard.png'});
    assert.strictEqual(kb.replaced, true, 'visualViewport stand-in is 508px ' + JSON.stringify(kb));
    assert.strictEqual(kb.fs, true, 'focus opens remi-notes-fs ' + JSON.stringify(kb));
    assert.strictEqual(kb.kb, false, 'fullscreen1 does not keep the kb dock class');
    assert.strictEqual(kb.parent, 'remiNotesDock');
    assert.strictEqual(kb.inBody, false, 'composer stays out of the scroll body');
    assert.strictEqual(kb.listHidden, 'hidden', 'list hides while composing');
    assert.notStrictEqual(kb.dockPosition, 'fixed', 'dock-pin does not fight ' + JSON.stringify(kb));
    assert.strictEqual(kb.composePosition, 'absolute', 'compose panel covers the Remi visual box ' + JSON.stringify(kb));
    assert.strictEqual(kb.title, 'New note');
    assert.strictEqual(kb.nav, 'none', 'bottom nav hides while composing');
    assert.ok(kb.formTop >= 48, 'panel starts under the Remi header ' + JSON.stringify(kb));
    assert.ok(kb.formBottom <= kb.vvBottom + 2 && kb.formBottom >= kb.vvBottom - 48, 'panel sits on the visual viewport ' + JSON.stringify(kb));
    ['input', 'remind', 'save', 'when'].forEach(function(key){
      var box = kb[key];
      assert.ok(box && !box.hidden && box.height >= 20, key + ' visible ' + JSON.stringify(kb));
      assert.ok(box.top >= -1 && box.bottom <= kb.vvBottom + 2, key + ' clears the keyboard ' + JSON.stringify(kb));
    });
    assert.ok(Number(kb.z) >= 180, 'compose paints above the sheet ' + JSON.stringify(kb));

    const rested = await phone.evaluate(function(){
      var mask = document.getElementById('remiNotesKb2SimKb');
      if(mask && mask.parentNode) mask.parentNode.removeChild(mask);
      var input = document.getElementById('remiNotesVisInput');
      if(input && input.blur) input.blur();
      var remind = document.getElementById('remiNotesClarityRemind');
      if(remind && remind.blur) remind.blur();
      document.body.focus && document.body.focus();
      remiNotesKb2Fit();
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var bar = document.querySelector('#adminScreen .shell-top').getBoundingClientRect();
      var dock = document.getElementById('remiNotesDock');
      return {
        kb: document.documentElement.classList.contains('remi-notes-kb'),
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        view: copilotView,
        sheetHidden: document.getElementById('copilotSheet').hidden,
        sheetTop: sheet.top,
        barBottom: bar.bottom,
        dockPosition: window.getComputedStyle(dock).position,
        parent: document.getElementById('remiNotesClarityCompose').parentNode.id
      };
    });
    assert.strictEqual(rested.kb, false, 'blur does not restore the kb dock class');
    assert.strictEqual(rested.fs, true, 'blur alone stays in compose');
    assert.strictEqual(rested.view, 'notes', 'blur stays on Remi Notes');
    assert.strictEqual(rested.sheetHidden, false, 'blur does not close Remi');
    assert.notStrictEqual(rested.dockPosition, 'fixed', 'blur clears the fixed dock ' + JSON.stringify(rested));
    assert.strictEqual(rested.parent, 'remiNotesDock', 'composer stays in the dock');
    assert.ok(rested.sheetTop + 1 >= rested.barBottom, 'header clears chrome again ' + JSON.stringify(rested));

    await phone.evaluate(async function(){
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'jaz@evercare.test';
      if(typeof layoutA1ApplyRoles === 'function') layoutA1ApplyRoles();
      remiNotesVis1ResetTab();
      remiNotesShow();
      await remiNotesVis1Load();
    });
    const sched = await phone.evaluate(function(){
      var compose = document.getElementById('remiNotesClarityCompose');
      var hint = document.getElementById('remiNotesVisHint');
      var dock = document.getElementById('remiNotesDock');
      return {
        parent: compose && compose.parentNode ? compose.parentNode.id : '',
        dockParent: dock && dock.parentNode ? dock.parentNode.id : '',
        inBody: !!(compose && document.getElementById('copilotBody').contains(compose)),
        hint: hint ? hint.textContent : '',
        soft: document.body.innerText.indexOf('Your notes only') >= 0,
        remind: !!document.getElementById('remiNotesClarityRemind'),
        sameFit: typeof remiNotesKb2Fit === 'function'
      };
    });
    assert.strictEqual(sched.parent, 'remiNotesDock', 'scheduler uses the same dock');
    assert.strictEqual(sched.dockParent, 'copilotSheet');
    assert.strictEqual(sched.inBody, false);
    assert.strictEqual(sched.hint, 'Your notes only');
    assert.strictEqual(sched.soft, true);
    assert.strictEqual(sched.remind, true);
    assert.strictEqual(sched.sameFit, true, 'scheduler uses remiNotesKb2Fit');
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-kb2-scheduler.png'});
    console.log('admin-remi-notes-kb2 browser ok');
    console.log('scheduler proof is structural (Jasmine role on the same pin). No Scheduler password in this repo.');
  }finally{
    if(browser) await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
