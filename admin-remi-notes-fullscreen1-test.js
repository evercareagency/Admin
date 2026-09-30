#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildTxt = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/\s+$/, '');

assert.strictEqual(buildTxt, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('GHOST-REMI-NOTES-FULLSCREEN1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('GHOST-REMI-NOTES-FULLSCREEN1'), 'ghost marker');
assert.ok(html.includes('v=remi-notes-fullscreen1'), 'marker');
assert.ok(html.includes('?v=remi-notes-fullscreen1'), 'pages cache bust');
assert.ok(html.includes('admin-build 2026-09-29-remi-notes-fullscreen1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-notes-fullscreen1">'), 'meta');
assert.ok(html.includes("var REMI_NOTES_FULLSCREEN1_MARKER='v=remi-notes-fullscreen1'"), 'script marker');
assert.ok(html.includes("var REMI_NOTES_FULLSCREEN1_BUILD='2026-09-29-remi-notes-fullscreen1'"), 'script build');
assert.ok(html.includes('data-remi-notes-fullscreen1="v=remi-notes-fullscreen1"'), 'data attr');
assert.ok(html.includes('data-remi-notes-kb2="v=remi-notes-kb2"'), 'kb2 marker stays');
assert.ok(html.includes('data-remi-notes-kb1="v=remi-notes-kb1"'), 'kb1 marker stays');
assert.ok(html.includes('data-remi-notes-clarity1="v=remi-notes-clarity1"'), 'clarity marker stays');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not squash-merge'), 'no squash-merge');
assert.ok(html.includes('Nurse stays out'), 'nurse stays out');
assert.ok(html.includes('Your notes only'), 'scheduler soft copy stays');
assert.ok(html.includes('Friday SHIP GO'), 'ship gate');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-notes-fullscreen1-v1.sql')), 'no SQL patch');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('https://evercareagency.github.io/Admin/'), 'Home Screen URL stays clean');
assert.ok(html.indexOf('content="2026-09-29-remi-notes-kb2"') < html.indexOf('content="2026-09-29-remi-notes-fullscreen1"'), 'fullscreen meta follows kb2');

const notes1Start = html.indexOf('// remi notes v=remi-notes1');
const notes1End = html.indexOf('// end remi notes v=remi-notes1');
const notes1 = html.slice(notes1Start, notes1End);
const fsStart = notes1.indexOf('function remiNotesFullscreen1Fit()');
const fsEnd = notes1.indexOf('function remiNotesFullscreen1SyncRemind()');
const fsSrc = notes1.slice(fsStart, fsEnd);
assert.ok(fsStart > 0 && fsEnd > fsStart, 'remiNotesFullscreen1Fit exists');
assert.ok(!fsSrc.includes('msgComposerKb3DockForm'), 'compose pin does not use the messages dock helper');
assert.ok(!fsSrc.includes('msgComposerRect1FlushBottom'), 'compose pin does not use the messages flush helper');
assert.ok(notes1.slice(notes1.indexOf('function remiNotesFullscreen1View()'), notes1.indexOf('function remiNotesFullscreen1SyncRemind()')).includes('visualViewport'), 'pin reads visualViewport');
assert.ok(notes1.slice(notes1.indexOf('function remiNotesFullscreen1View()'), notes1.indexOf('function remiNotesFullscreen1SyncRemind()')).includes('remiNotesFullscreen1AccessoryPad'), 'accessory pad lives on the notes pin');
assert.ok(fsSrc.includes("classList.add('remi-notes-fs')") || notes1.includes("classList.add('remi-notes-fs')"), 'compose class');
assert.ok(notes1.includes('function remiNotesFullscreen1Cancel'), 'cancel stays in notes');
assert.ok(notes1.includes('function remiNotesFullscreen1Save'), 'save helper');
assert.ok(notes1.includes('Edit note'), 'edit title');
assert.ok(notes1.includes('New note'), 'new title');
assert.ok(notes1.slice(notes1.indexOf('function remiNotesKb2Fit()'), notes1.indexOf('function remiNotesKb1Fit()')).includes('remiNotesFullscreen1Fit()'), 'kb2 fit defers');
assert.ok(notes1.slice(notes1.indexOf('function remiNotesKb1Fit()'), notes1.indexOf('function remiNotesClarity1Fit()')).includes('remiNotesFullscreen1Fit()'), 'kb1 fit defers');
assert.ok(html.includes('html.remi-notes-fs #adminScreen #bottomNav'), 'bottom nav hides while composing');
assert.ok(html.includes('in 10 min') && html.includes('Tomorrow 9am'), 'time chips');

console.log('admin-remi-notes-fullscreen1 unit ok');

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
    console.log('admin-remi-notes-fullscreen1 browser skipped (no puppeteer-core)');
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
    console.log('admin-remi-notes-fullscreen1 browser skipped (' + String(err && err.message || err) + ')');
    return;
  }
  try{
    const phone = await browser.newPage();
    await phone.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1});
    await phone.goto('http://127.0.0.1:' + port + '/index.html?v=remi-notes-fullscreen1', {waitUntil: 'domcontentloaded', timeout: 60000});
    await phone.evaluate(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({role: 'Admin', username: 'mo@evercare.test', name: 'Moe', loginAt: Date.now()}));
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function') showScreen('adminScreen');
    });
    const resting = await phone.evaluate(async function(){
      sbRestRpc = async function(name, body){
        window.__rpc = window.__rpc || [];
        window.__rpc.push({name: name, body: body});
        if(name === 'remi_save_my_note') return {ok: true, data: {success: true, ok: true, note: {id: 'n-new', body: body.p_body, updates: []}}};
        if(name === 'remi_edit_my_note') return {ok: true, data: {success: true, ok: true, note: {id: body.p_note_id, body: body.p_body, updates: []}}};
        if(name === 'remi_list_my_notes') return {ok: true, data: {notes: [{id: 'n1', body: 'Devon pay hold — check Monday.', updates: []}]}};
        return {ok: true, data: {success: true, ok: true, notes: []}};
      };
      remiNotesCreate('call payroll', new Date(Date.now() + 600000).toISOString(), new Date());
      remiNotesShow();
      await remiNotesVis1Load();
      var compose = document.getElementById('remiNotesClarityCompose');
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var bar = document.querySelector('#adminScreen .shell-top').getBoundingClientRect();
      var tabs = document.querySelector('#copilotSheet .copilot-tabs').getBoundingClientRect();
      return {
        parent: compose && compose.parentNode ? compose.parentNode.id : '',
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        list: window.getComputedStyle(document.getElementById('copilotBody')).visibility,
        nav: window.getComputedStyle(document.getElementById('bottomNav')).display,
        sheetTop: Math.round(sheet.top),
        barBottom: Math.round(bar.bottom),
        tabsTop: Math.round(tabs.top),
        title: document.getElementById('remiNotesFsTitle').textContent,
        marker: compose.getAttribute('data-remi-notes-fullscreen1'),
        sheetMarker: document.getElementById('copilotSheet').getAttribute('data-remi-notes-fullscreen1'),
        firstMeta: document.querySelector('meta[name="admin-build"]').content,
        text: document.getElementById('copilotBody').innerText,
        view: copilotView
      };
    });
    fs.mkdirSync('/opt/cursor/artifacts', {recursive: true});
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-fullscreen1-resting.png'});
    assert.strictEqual(resting.parent, 'remiNotesDock', JSON.stringify(resting));
    assert.strictEqual(resting.fs, false, 'resting is not compose mode');
    assert.strictEqual(resting.list, 'visible', 'list shows when not typing');
    assert.notStrictEqual(resting.nav, 'none', 'bottom nav stays at rest');
    assert.ok(resting.sheetTop + 1 >= resting.barBottom, 'sheet clears the top bar ' + JSON.stringify(resting));
    assert.ok(resting.tabsTop + 1 >= resting.barBottom, 'tabs stay under the header');
    assert.strictEqual(resting.view, 'notes');
    assert.strictEqual(resting.marker, 'v=remi-notes-fullscreen1');
    assert.strictEqual(resting.sheetMarker, 'v=remi-notes-fullscreen1');
    assert.strictEqual(resting.firstMeta, '2026-09-27-remi-float-hide1b');
    assert.ok(resting.text.indexOf('Devon pay hold') >= 0, resting.text);
    assert.ok(resting.text.indexOf('call payroll') >= 0, resting.text);

    const compose = await phone.evaluate(function(){
      var fake = {height: 520, offsetTop: 0, offsetLeft: 0, width: 390, addEventListener: function(){}, removeEventListener: function(){}};
      try{ Object.defineProperty(window, 'visualViewport', {configurable: true, get: function(){ return fake; }}); }catch(e){}
      var input = document.getElementById('remiNotesVisInput');
      input.focus();
      input.value = 'Ping Maria about Bowlax CM';
      remiNotesFullscreen1Fit();
      var panel = document.getElementById('remiNotesClarityCompose').getBoundingClientRect();
      var tabs = document.querySelector('#copilotSheet .copilot-tabs').getBoundingClientRect();
      var head = document.querySelector('#copilotSheet .copilot-top').getBoundingClientRect();
      var vv = window.visualViewport;
      var vvBottom = Math.round((vv.offsetTop || 0) + vv.height);
      function box(id){
        var el = document.getElementById(id);
        var r = el.getBoundingClientRect();
        return {top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), hidden: !!el.hidden};
      }
      return {
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        kb: document.documentElement.classList.contains('remi-notes-kb'),
        title: document.getElementById('remiNotesFsTitle').textContent,
        list: window.getComputedStyle(document.getElementById('copilotBody')).visibility,
        nav: window.getComputedStyle(document.getElementById('bottomNav')).display,
        dockPos: window.getComputedStyle(document.getElementById('remiNotesDock')).position,
        panelPos: window.getComputedStyle(document.getElementById('remiNotesClarityCompose')).position,
        panelTop: Math.round(panel.top),
        panelBottom: Math.round(panel.bottom),
        tabsBottom: Math.round(tabs.bottom),
        headTop: Math.round(head.top),
        vvBottom: vvBottom,
        input: box('remiNotesVisInput'),
        cancel: box('remiNotesFsCancel'),
        save: box('remiNotesFsSave'),
        remind: box('remiNotesClarityRemind'),
        timesHidden: document.getElementById('remiNotesFsTimes').hidden,
        view: copilotView,
        chat: document.getElementById('tab_aidechat').classList.contains('active')
      };
    });
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-fullscreen1-compose.png'});
    assert.strictEqual(compose.fs, true, JSON.stringify(compose));
    assert.strictEqual(compose.kb, false, 'no kb dock class');
    assert.strictEqual(compose.title, 'New note');
    assert.strictEqual(compose.list, 'hidden', 'list hidden while composing');
    assert.strictEqual(compose.nav, 'none');
    assert.notStrictEqual(compose.dockPos, 'fixed');
    assert.strictEqual(compose.panelPos, 'fixed');
    assert.ok(compose.panelTop + 1 >= compose.tabsBottom, 'panel starts under the tabs ' + JSON.stringify(compose));
    assert.ok(compose.headTop > 40, 'Remi header stays');
    assert.ok(compose.panelBottom <= compose.vvBottom + 2 && compose.panelBottom >= compose.vvBottom - 48, 'panel bottom sits on the visual viewport ' + JSON.stringify(compose));
    ['input', 'cancel', 'save', 'remind'].forEach(function(key){
      var box = compose[key];
      assert.ok(box && box.height >= 44 && box.bottom <= compose.panelBottom + 2, key + ' ' + JSON.stringify(compose));
    });
    assert.strictEqual(compose.timesHidden, true, 'time chips wait for Remind me');
    assert.strictEqual(compose.view, 'notes');
    assert.strictEqual(compose.chat, false, 'compose does not open Messages');

    const reminded = await phone.evaluate(function(){
      remiNotesClarity1ToggleRemind();
      remiNotesFullscreen1Pick('30min');
      var times = document.getElementById('remiNotesFsTimes');
      var on = times.querySelector('button.on');
      return {
        hidden: times.hidden,
        label: on ? on.textContent : '',
        kind: on ? on.getAttribute('data-kind') : '',
        timed: document.getElementById('remiNotesFsTimed').hidden,
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        title: document.getElementById('remiNotesFsTitle').textContent
      };
    });
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-fullscreen1-remind.png'});
    assert.strictEqual(reminded.hidden, false, JSON.stringify(reminded));
    assert.strictEqual(reminded.kind, '30min');
    assert.ok(reminded.label.indexOf('30') >= 0, reminded.label);
    assert.strictEqual(reminded.timed, false);
    assert.strictEqual(reminded.fs, true, 'chips stay in compose');
    assert.strictEqual(reminded.title, 'New note');

    const blurred = await phone.evaluate(function(){
      var input = document.getElementById('remiNotesVisInput');
      if(input) input.blur();
      document.body.focus();
      remiNotesFullscreen1Fit();
      return {
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        view: copilotView,
        sheet: document.getElementById('copilotSheet').hidden,
        chat: document.getElementById('tab_aidechat').classList.contains('active'),
        value: document.getElementById('remiNotesVisInput').value
      };
    });
    assert.strictEqual(blurred.fs, true, 'blur stays in compose ' + JSON.stringify(blurred));
    assert.strictEqual(blurred.view, 'notes');
    assert.strictEqual(blurred.sheet, false);
    assert.strictEqual(blurred.chat, false);
    assert.ok(blurred.value.indexOf('Bowlax') >= 0, blurred.value);

    const cancelled = await phone.evaluate(function(){
      remiNotesFullscreen1Cancel();
      return {
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        view: copilotView,
        sheet: document.getElementById('copilotSheet').hidden,
        chat: document.getElementById('tab_aidechat').classList.contains('active'),
        list: window.getComputedStyle(document.getElementById('copilotBody')).visibility,
        value: document.getElementById('remiNotesVisInput').value,
        tab: document.getElementById('tab_schedule').classList.contains('active')
      };
    });
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-fullscreen1-cancel.png'});
    assert.strictEqual(cancelled.fs, false, JSON.stringify(cancelled));
    assert.strictEqual(cancelled.view, 'notes');
    assert.strictEqual(cancelled.sheet, false);
    assert.strictEqual(cancelled.chat, false, 'cancel does not hop to Messages');
    assert.strictEqual(cancelled.list, 'visible');
    assert.strictEqual(cancelled.value, '');
    assert.strictEqual(cancelled.tab, true, 'Schedule stays behind Remi');

    const edited = await phone.evaluate(function(){
      remiNotesVis1BeginEdit('n1');
      var input = document.getElementById('remiNotesVisInput');
      return {
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        title: document.getElementById('remiNotesFsTitle').textContent,
        value: input ? input.value : '',
        view: copilotView,
        chat: document.getElementById('tab_aidechat').classList.contains('active')
      };
    });
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-fullscreen1-edit.png'});
    assert.strictEqual(edited.fs, true, JSON.stringify(edited));
    assert.strictEqual(edited.title, 'Edit note');
    assert.ok(edited.value.indexOf('Devon pay hold') >= 0, edited.value);
    assert.strictEqual(edited.view, 'notes');
    assert.strictEqual(edited.chat, false);

    const editCancel = await phone.evaluate(function(){
      remiNotesFullscreen1Cancel();
      return {
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        view: copilotView,
        chat: document.getElementById('tab_aidechat').classList.contains('active'),
        edit: !!document.getElementById('remiNotesVisEdit'),
        list: window.getComputedStyle(document.getElementById('copilotBody')).visibility
      };
    });
    assert.strictEqual(editCancel.fs, false, JSON.stringify(editCancel));
    assert.strictEqual(editCancel.view, 'notes');
    assert.strictEqual(editCancel.chat, false);
    assert.strictEqual(editCancel.edit, false, 'cancel leaves the list');
    assert.strictEqual(editCancel.list, 'visible');

    const saved = await phone.evaluate(async function(){
      var input = document.getElementById('remiNotesVisInput');
      input.focus();
      input.value = 'Ping Maria about Bowlax CM';
      remiNotesClarity1On = false;
      remiNotesPending = null;
      remiNotesClarity1SyncRemind();
      var got = await remiNotesFullscreen1Save();
      return {
        ok: !!(got && got.ok),
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        view: copilotView,
        chat: document.getElementById('tab_aidechat').classList.contains('active'),
        names: (window.__rpc || []).map(function(row){ return row.name; })
      };
    });
    assert.strictEqual(saved.ok, true, JSON.stringify(saved));
    assert.strictEqual(saved.fs, false, 'save returns to the list');
    assert.strictEqual(saved.view, 'notes');
    assert.strictEqual(saved.chat, false, 'save does not hop to Messages');
    assert.ok(saved.names.indexOf('remi_save_my_note') >= 0, saved.names.join(','));

    await phone.evaluate(async function(){
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'jaz@evercare.test';
      if(typeof layoutA1ApplyRoles === 'function') layoutA1ApplyRoles();
      remiNotesVis1ResetTab();
      remiNotesShow();
      await remiNotesVis1Load();
      var input = document.getElementById('remiNotesVisInput');
      input.focus();
      input.value = 'Confirm Wed fill before noon blast';
      remiNotesFullscreen1Fit();
    });
    const sched = await phone.evaluate(function(){
      var hint = document.getElementById('remiNotesVisHint');
      var soft = document.getElementById('remiNotesFsSoft');
      return {
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        title: document.getElementById('remiNotesFsTitle').textContent,
        hint: hint ? hint.textContent : '',
        softOn: !!(soft && soft.classList.contains('is-on')),
        softText: soft ? soft.textContent : '',
        remind: !!document.getElementById('remiNotesClarityRemind'),
        parent: document.getElementById('remiNotesClarityCompose').parentNode.id,
        chat: document.getElementById('tab_aidechat').classList.contains('active')
      };
    });
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-fullscreen1-scheduler.png'});
    assert.strictEqual(sched.fs, true, JSON.stringify(sched));
    assert.strictEqual(sched.title, 'New note');
    assert.strictEqual(sched.hint, 'Your notes only');
    assert.strictEqual(sched.softOn, true);
    assert.strictEqual(sched.softText, 'Your notes only');
    assert.strictEqual(sched.remind, true);
    assert.strictEqual(sched.parent, 'remiNotesDock');
    assert.strictEqual(sched.chat, false);
    console.log('admin-remi-notes-fullscreen1 browser ok');
  }finally{
    if(browser) await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
