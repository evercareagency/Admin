#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildTxt = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/\s+$/, '');

assert.strictEqual(buildTxt, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('v=remi-notes-kb1'), 'marker');
assert.ok(html.includes('?v=remi-notes-kb1'), 'probe query stays in the comment');
assert.ok(html.includes('admin-build 2026-09-29-remi-notes-kb1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-notes-kb1">'), 'meta');
assert.ok(html.includes("var REMI_NOTES_KB1_MARKER='v=remi-notes-kb1'"), 'script marker');
assert.ok(html.includes("var REMI_NOTES_KB1_BUILD='2026-09-29-remi-notes-kb1'"), 'script build');
assert.ok(html.includes('GHOST-REMI-NOTES-KB1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('Pure Admin UI'), 'pure UI');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth reseal'), 'hard rules');
assert.ok(html.includes('interactive-widget=resizes-content'), 'viewport meta stays');
assert.ok(html.includes('data-remi-notes-kb1="v=remi-notes-kb1"'), 'compose card marker');
assert.ok(html.includes('Nurse stays out'), 'nurse stays out');
assert.ok(html.includes('Your notes only'), 'scheduler soft copy stays');
assert.ok(html.includes('remi_save_my_note') && html.includes('remiNotesCreate'), 'save paths stay');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-notes-kb1-v1.sql')), 'no SQL patch');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('v=pages-cache-fresh1'), 'pages-cache marker stays');
assert.ok(html.includes('https://evercareagency.github.io/Admin/'), 'Home Screen URL stays clean');
assert.ok(html.indexOf('content="2026-09-29-remi-notes-clarity1"') < html.indexOf('content="2026-09-29-remi-notes-kb1"'), 'kb1 meta follows clarity1');

const notes1Start = html.indexOf('// remi notes v=remi-notes1');
const notes1End = html.indexOf('// end remi notes v=remi-notes1');
const notes1 = html.slice(notes1Start, notes1End);
assert.ok(notes1.includes('function remiNotesKb1Dock'), 'dock helper lives with notes');
assert.ok(notes1.includes('function remiNotesKb1Fit'), 'sheet pin lives with notes');
assert.ok(notes1.includes("getElementById('remiNotesDock')"), 'composer moves into the sheet dock');
assert.ok(notes1.includes('appendChild(card)'), 'dock adopts the compose card');
assert.ok(notes1.includes("classList.add('remi-notes-kb')"), 'keyboard class');
assert.ok(notes1.includes('loginKbFixedFollowsLayout'), 'sheet top follows the Ask fixed-origin check');
assert.ok(notes1.includes('msgComposerKb3FlushBox(sheet, view)'), 'sheet flush matches Ask');
assert.ok(notes1.includes('msgComposerRect1FlushHeight(sheet, view)'), 'sheet height flush matches Ask');
assert.ok(notes1.includes('remiNotesClarity1SheetTop'), 'resting sheet top still clears chrome');
assert.ok(notes1.includes('setTimeout(fit, 80)') && notes1.includes('setTimeout(fit, 320)'), 'focus retries');
assert.ok(notes1.includes("t.id==='remiNotesVisInput'"), 'focusin watches the notes textarea');
assert.ok(!notes1.includes('msgComposerKb3DockForm'), 'notes path does not fixed-dock the nested composer');
assert.ok(!notes1.includes("form.style.position='fixed'"), 'composer is not position fixed');

const fitStart = notes1.indexOf('function remiNotesKb1Fit()');
const fitEnd = notes1.indexOf('function remiNotesClarity1Fit()');
const fitSrc = notes1.slice(fitStart, fitEnd);
assert.ok(fitSrc.includes("sheet.style.bottom='auto'"), 'sheet bottom is auto while the keyboard is up');
assert.ok(fitSrc.includes('view.height'), 'sheet height uses the visual viewport');
assert.ok(!fitSrc.includes('msgComposerRect1FlushBottom'), 'flush runs on the sheet, not a fixed composer');

const askFn = html.slice(html.indexOf('function copilotChatViewport()'), html.indexOf('function copilotChatBindViewport()'));
assert.ok(askFn.includes('remiNotesKb1Fit'), 'notes view uses the sheet pin');
assert.ok(askFn.includes('msgComposerKb3FlushBox'), 'Ask flush stays');

const css = html.slice(html.indexOf('html.remi-notes-kb #copilotSheet{'), html.indexOf('#copilotSheet .remi-proof{'));
assert.ok(css.includes('padding-bottom:0'), 'sheet padding clears while the keyboard class is on');
assert.ok(css.includes('flex-shrink:0'), 'composer does not shrink');
assert.ok(css.includes('background:#fff'), 'composer background is solid');
assert.ok(css.includes('z-index:180'), 'sheet stays at least at the Ask keyboard layer');
assert.ok(css.includes('position:static'), 'keyboard class keeps the composer in flow');

function el(id){
  return {
    id: id,
    hidden: false,
    style: {},
    attrs: {},
    children: [],
    parentNode: null,
    value: '',
    scrollTop: 0,
    scrollHeight: 80,
    setAttribute: function(k, v){ this.attrs[k] = v; },
    getAttribute: function(k){ return this.attrs[k]; },
    appendChild: function(node){
      if(node.parentNode && node.parentNode.children){
        var at = node.parentNode.children.indexOf(node);
        if(at >= 0) node.parentNode.children.splice(at, 1);
      }
      node.parentNode = this;
      this.children.push(node);
      return node;
    },
    removeChild: function(node){
      var at = this.children.indexOf(node);
      if(at >= 0) this.children.splice(at, 1);
      node.parentNode = null;
      return node;
    }
  };
}

const all = [];
function track(node){ all.push(node); return node; }
const root = track(el('root'));
root.parentNode = {children: [root]};
const sheet = track(el('copilotSheet'));
const body = track(el('copilotBody'));
const pane = track(el('remiNotesVisPane'));
const dock = track(el('remiNotesDock'));
dock.hidden = true;
root.appendChild(sheet);
sheet.appendChild(body);
body.appendChild(pane);
sheet.appendChild(dock);
const card = track(el('remiNotesClarityCompose'));
card.value = 'Ping Maria';
pane.appendChild(card);

const classes = {};
function classList(){
  return {
    add: function(name){ classes[name] = true; },
    remove: function(name){ delete classes[name]; },
    contains: function(name){ return !!classes[name]; }
  };
}
const documentMock = {
  documentElement: {classList: classList()},
  body: {classList: classList()},
  activeElement: {id: 'remiNotesVisInput'},
  getElementById: function(id){
    for(var i = 0; i < all.length; i++){
      if(all[i].id === id && all[i].parentNode) return all[i];
    }
    return null;
  },
  querySelectorAll: function(sel){
    var m = String(sel).match(/\[id="([^"]+)"\]/);
    var id = m ? m[1] : '';
    var out = [];
    for(var i = 0; i < all.length; i++){
      if(all[i].id === id && all[i].parentNode) out.push(all[i]);
    }
    return out;
  }
};

const flushed = [];
const sandbox = {
  document: documentMock,
  window: {innerWidth: 390, innerHeight: 844, visualViewport: {height: 420, offsetTop: 18}},
  copilotView: 'notes',
  REMI_NOTES_KB1_MARKER: 'v=remi-notes-kb1',
  remiNotesVis1Which: 'my',
  remiNotesVis1ThreadId: '',
  remiNotesVis1IsAdmin: function(){ return true; },
  remiNotesClarity1SheetTop: function(){ return 96; },
  loginKbFixedFollowsLayout: function(view){ return !view || (view.offsetTop || 0) < 40; },
  loginLandSchedule1FitNav: function(){},
  loginLandSchedule1ClearLift: function(){},
  msgComposerKb3FlushBox: function(node, view){ flushed.push(['box', node && node.id, view && view.height]); },
  msgComposerRect1FlushHeight: function(node, view){ flushed.push(['height', node && node.id, view && view.height]); },
  console: console
};
vm.createContext(sandbox);
const sliceStart = notes1.indexOf('function remiNotesClarity1Composer()');
const sliceEnd = notes1.indexOf('function remiNotesClarity1Bind()');
vm.runInContext(notes1.slice(sliceStart, sliceEnd), sandbox);

const moved = sandbox.remiNotesKb1Dock();
assert.strictEqual(moved, card, 'dock returns the compose card');
assert.strictEqual(card.parentNode, dock, 'compose card leaves the scroll pane');
assert.ok(pane.children.indexOf(card) < 0, 'pane does not keep the composer');
assert.strictEqual(dock.hidden, false, 'notes dock is shown with the composer');
assert.strictEqual(card.attrs['data-remi-notes-kb1'], 'v=remi-notes-kb1');
assert.strictEqual(card.value, 'Ping Maria');

const fresh = track(el('remiNotesClarityCompose'));
fresh.value = '';
pane.appendChild(fresh);
const kept = sandbox.remiNotesKb1Dock();
assert.strictEqual(kept, card, 'a list refresh keeps the live composer');
assert.strictEqual(card.value, 'Ping Maria', 'draft text stays');
assert.strictEqual(fresh.parentNode, null, 'the replacement card does not stay in the pane');
assert.strictEqual(documentMock.querySelectorAll('[id="remiNotesClarityCompose"]').length, 1, 'one composer');

sandbox.remiNotesVis1Which = 'scheduler';
assert.strictEqual(sandbox.remiNotesKb1Dock(), null, 'scheduler notes tab does not keep the my-notes composer');
assert.strictEqual(card.parentNode, null);
sandbox.remiNotesVis1Which = 'my';
pane.appendChild(card);
sandbox.remiNotesKb1Dock();
assert.strictEqual(card.parentNode, dock);

sandbox.remiNotesKb1Fit();
assert.strictEqual(classes['remi-notes-kb'], true, 'focus adds remi-notes-kb');
assert.strictEqual(sheet.style.top, '18px', 'sheet top follows visualViewport offset');
assert.strictEqual(sheet.style.bottom, 'auto');
assert.strictEqual(sheet.style.height, '420px', 'sheet height is the visual viewport');
assert.notStrictEqual(card.style.position, 'fixed', 'composer stays in flex flow');
assert.deepStrictEqual(flushed, [['box', 'copilotSheet', 420], ['height', 'copilotSheet', 420]]);

documentMock.activeElement = {id: 'copilotTitle'};
sandbox.remiNotesKb1Fit();
assert.ok(!classes['remi-notes-kb'], 'blur clears the keyboard class');
assert.strictEqual(sheet.style.top, '96px', 'resting top uses the measured header clearance');
assert.strictEqual(sheet.style.height, '');
assert.strictEqual(sheet.style.bottom, '');
assert.notStrictEqual(card.style.position, 'fixed');

console.log('admin-remi-notes-kb1 unit ok');

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
    console.log('admin-remi-notes-kb1 browser skipped (no puppeteer-core)');
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
    console.log('admin-remi-notes-kb1 browser skipped (' + String(err && err.message || err) + ')');
    return;
  }
  try{
    const phone = await browser.newPage();
    await phone.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1});
    await phone.goto('http://127.0.0.1:' + port + '/index.html?v=remi-notes-kb1', {waitUntil: 'domcontentloaded', timeout: 60000});
    await phone.evaluate(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({role: 'Admin', username: 'mo@evercare.test', name: 'Moe', loginAt: Date.now()}));
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function') showScreen('adminScreen');
    });
    const admin = await phone.evaluate(async function(){
      sbRestRpc = async function(){ return {ok: true, data: {success: true, ok: true, notes: []}}; };
      remiNotesCreate('Devon pay hold — check Monday.', null, new Date());
      remiNotesShow();
      if(typeof remiNotesVis1Load === 'function') await remiNotesVis1Load();
      var compose = document.getElementById('remiNotesClarityCompose');
      var pane = document.getElementById('remiNotesVisPane');
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var bar = document.querySelector('#adminScreen .shell-top').getBoundingClientRect();
      var save = document.getElementById('remiNotesVisSave').getBoundingClientRect();
      return {
        parent: compose && compose.parentNode ? compose.parentNode.id : '',
        inPane: !!(pane && compose && pane.contains(compose)),
        sheetTop: sheet.top,
        barBottom: bar.bottom,
        saveH: save.height,
        marker: compose ? compose.getAttribute('data-remi-notes-kb1') : '',
        firstMeta: document.querySelector('meta[name="admin-build"]').content,
        text: document.getElementById('copilotBody').innerText
      };
    });
    fs.mkdirSync('/opt/cursor/artifacts', {recursive: true});
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-kb1-admin.png'});
    assert.strictEqual(admin.parent, 'remiNotesDock', JSON.stringify(admin));
    assert.strictEqual(admin.inPane, false, 'composer is not left inside the scroll pane');
    assert.ok(admin.sheetTop + 1 >= admin.barBottom, 'resting sheet clears the EverCare topbar ' + JSON.stringify(admin));
    assert.ok(admin.saveH >= 44, 'Save stays tappable');
    assert.strictEqual(admin.marker, 'v=remi-notes-kb1');
    assert.strictEqual(admin.firstMeta, '2026-09-27-remi-float-hide1b');
    assert.ok(admin.text.indexOf('NOTE') >= 0 || admin.text.indexOf('No notes yet') >= 0, admin.text);
    assert.ok(admin.text.indexOf('My notes | Reminders') < 0, admin.text);

    const kb = await phone.evaluate(function(){
      var input = document.getElementById('remiNotesVisInput');
      input.focus();
      var fake = {height: 420, offsetTop: 0, addEventListener: function(){}};
      var replaced = false;
      try{
        Object.defineProperty(window, 'visualViewport', {configurable: true, get: function(){ return fake; }});
        replaced = window.visualViewport === fake;
      }catch(e){}
      remiNotesKb1Fit();
      var compose = document.getElementById('remiNotesClarityCompose');
      var sheetEl = document.getElementById('copilotSheet');
      var form = compose.getBoundingClientRect();
      var sheet = sheetEl.getBoundingClientRect();
      var save = document.getElementById('remiNotesVisSave').getBoundingClientRect();
      var remind = document.getElementById('remiNotesClarityRemind').getBoundingClientRect();
      var vv = window.visualViewport || {height: 844, offsetTop: 0};
      return {
        kb: document.documentElement.classList.contains('remi-notes-kb'),
        body: document.body.classList.contains('remi-notes-kb'),
        replaced: replaced,
        parent: compose.parentNode.id,
        position: window.getComputedStyle(compose).position,
        formBottom: Math.round(form.bottom),
        saveBottom: Math.round(save.bottom),
        remindBottom: Math.round(remind.bottom),
        sheetBottom: Math.round(sheet.bottom),
        sheetTop: Math.round(sheet.top),
        height: sheetEl.style.height,
        bottom: sheetEl.style.bottom,
        viewH: vv.height
      };
    });
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-kb1-keyboard.png'});
    assert.strictEqual(kb.kb, true, 'focus adds the keyboard class');
    assert.strictEqual(kb.body, true, 'body gets the same class');
    assert.strictEqual(kb.parent, 'remiNotesDock');
    assert.notStrictEqual(kb.position, 'fixed', 'composer is not position fixed ' + JSON.stringify(kb));
    assert.strictEqual(kb.bottom, 'auto');
    assert.ok(kb.formBottom <= kb.sheetBottom + 2, 'composer stays inside the sheet ' + JSON.stringify(kb));
    assert.ok(kb.saveBottom <= kb.formBottom + 2 && kb.remindBottom <= kb.formBottom + 2, 'Save and Remind me stay in the composer');
    assert.ok(kb.formBottom <= kb.viewH + 2, 'composer stays at the visual bottom ' + JSON.stringify(kb));
    if(kb.replaced){
      assert.ok(kb.sheetTop <= 2, 'fake keyboard pins the sheet to the visual viewport');
      assert.strictEqual(kb.height, '420px');
    }

    const rested = await phone.evaluate(function(){
      var input = document.getElementById('remiNotesVisInput');
      if(input && input.blur) input.blur();
      remiNotesKb1Fit();
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var bar = document.querySelector('#adminScreen .shell-top').getBoundingClientRect();
      return {
        kb: document.documentElement.classList.contains('remi-notes-kb'),
        sheetTop: sheet.top,
        barBottom: bar.bottom,
        height: document.getElementById('copilotSheet').style.height
      };
    });
    assert.strictEqual(rested.kb, false, 'blur clears the keyboard class');
    assert.strictEqual(rested.height, '');
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
      return {
        parent: compose && compose.parentNode ? compose.parentNode.id : '',
        hint: hint ? hint.textContent : '',
        remind: !!document.getElementById('remiNotesClarityRemind')
      };
    });
    assert.strictEqual(sched.parent, 'remiNotesDock', 'scheduler uses the same dock');
    assert.strictEqual(sched.hint, 'Your notes only');
    assert.strictEqual(sched.remind, true);
    await phone.screenshot({path: '/opt/cursor/artifacts/remi-notes-kb1-scheduler.png'});
    console.log('admin-remi-notes-kb1 browser ok');
  }finally{
    if(browser) await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
