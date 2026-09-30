#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildTxt = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/\s+$/,'');

assert.strictEqual(buildTxt, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('v=remi-notes-clarity1'), 'marker');
assert.ok(html.includes('?v=remi-notes-clarity1'), 'pages cache bust');
assert.ok(html.includes('admin-build 2026-09-29-remi-notes-clarity1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-notes-clarity1">'), 'meta');
assert.ok(html.includes('<!-- remi notes clarity 2026-09-29 v=remi-notes-clarity1 ?v=remi-notes-clarity1 admin-build 2026-09-29-remi-notes-clarity1'), 'comment');
assert.ok(html.includes("var REMI_NOTES_CLARITY1_MARKER='v=remi-notes-clarity1'"), 'script marker');
assert.ok(html.includes("var REMI_NOTES_CLARITY1_BUILD='2026-09-29-remi-notes-clarity1'"), 'script build');
assert.ok(html.includes('GHOST-REMI-NOTES-CLARITY1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('Pure Admin UI'), 'pure UI');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth reseal'), 'hard rules');
assert.ok(html.includes('data-remi-notes-clarity1="v=remi-notes-clarity1"'), 'data attr');
assert.ok(html.includes('msgComposerKb3DockForm'), 'reuses the keyboard dock helper');
assert.ok(html.includes('msgComposerRect1FlushBottom'), 'reuses the visualViewport flush helper');
assert.ok(html.includes("vv.addEventListener('resize'"), 'visualViewport resize');
assert.ok(html.includes('top:calc(env(safe-area-inset-top, 0px) + 72px)'), 'sheet clears safe area and topbar');
['v=remi-notes-stay1b','v=remi-notes-open1b','v=remi-notes-vis1','v=remi-notes1','v=remi-rail-crud1','v=sched-notes-copy1','v=msg-composer-kb3'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-29-remi-notes-stay1b"') < html.indexOf('content="2026-09-29-remi-notes-clarity1"'), 'clarity follows stay1b');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-notes-clarity1-v1.sql')), 'no SQL patch');

const phoneCssStart = html.indexOf('/* v=remi-phone-rail1');
const phoneCssEnd = html.indexOf('/* v=remi-notes1');
const phoneCss = html.slice(phoneCssStart, phoneCssEnd);
assert.ok(phoneCss.includes('top:64px'), 'prior phone rail offset string stays');

const notes1Start = html.indexOf('// remi notes v=remi-notes1');
const notes1End = html.indexOf('// end remi notes v=remi-notes1');
const notes1 = html.slice(notes1Start, notes1End);
assert.ok(!notes1.includes('ttl">Reminders'), 'paint does not title a second Reminders pad');
assert.ok(notes1.includes('id="remiNotes1Keep" data-reminotes1="v=remi-notes1" data-remi-notes-open1b="v=remi-notes-open1b"'), 'keep marker stays');
assert.ok(notes1.includes('function remiNotesClarity1Fit'), 'keyboard fit lives with notes');
assert.ok(notes1.includes('function remiNotesKb1Fit'), 'kb1 sheet pin lives with notes');
assert.ok(notes1.includes('msgComposerKb3FlushBox'), 'notes pin flushes the sheet');
assert.ok(notes1.includes('msgComposerKb3DockForm(pin, view)'), 'kb2 fixed-docks the notes dock');
assert.ok(!notes1.includes("form.style.position='fixed'"), 'nested composer is not position fixed inline');
assert.ok(!/sbRestRpc|supabase\.|fetch\(/.test(notes1), 'local notes stay off Ace');

const visStart = html.indexOf('// remi notes vis1 v=remi-notes-vis1');
const visEnd = html.indexOf('// end remi notes vis1 v=remi-notes-vis1');
const src = html.slice(visStart, visEnd);
assert.ok(src.includes('Write a note'), 'one composer placeholder');
assert.ok(src.includes('>Remind me<'), 'remind chip inside the composer');
assert.ok(src.includes('id="remiNotesVisSave"'), 'one Save stays');
assert.ok(src.includes('id="remiNotesClarityCompose"'), 'composer id');
assert.ok(src.includes('>NOTE<'), 'sticky rows can wear a NOTE chip');
assert.ok(src.includes('Your notes only'), 'scheduler soft copy stays');
assert.ok(src.includes('>My notes<') && src.includes('>Scheduler notes<'), 'historical admin tabs stay');
assert.ok(!src.includes('placeholder="Add note'), 'pane is not a second Add note pad');
assert.ok(src.includes('remi_save_my_note') && src.includes('remi_edit_my_note') && src.includes('remi_delete_my_note'), 'existing note RPCs stay');

function runSlice(){
  const sandbox = {
    currentAdminRole: 'Admin',
    currentAdminUsername: 'mo@evercare.test',
    copilotView: 'notes',
    console: console
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox;
}

const sandbox = runSlice();
const adminPane = sandbox.remiNotesVis1PaneHtml([{id:'a', body:'Devon pay hold — check Monday.', updates:[]}], '');
assert.ok(adminPane.includes('id="remiNotesClarityCompose"'), adminPane);
assert.ok(adminPane.includes('Write a note'), adminPane);
assert.ok(adminPane.includes('>Remind me<') && adminPane.includes('>Save<'), adminPane);
assert.ok(adminPane.includes('>NOTE<'), adminPane);
assert.strictEqual((adminPane.match(/id="remiNotesVisInput"/g)||[]).length, 1, 'one textarea');
assert.strictEqual((adminPane.match(/id="remiNotesVisSave"/g)||[]).length, 1, 'one save');
assert.ok(adminPane.indexOf('Remind me') < adminPane.indexOf('id="remiNotesVisSave"'), 'chip sits with Save');
assert.ok(!adminPane.includes('>Add<'), 'no second Add button');
assert.ok(adminPane.includes('Scheduler never sees this tab'), 'admin historical hint stays');

sandbox.currentAdminRole = 'Scheduler';
sandbox.remiNotesVis1Which = 'my';
const schedPane = sandbox.remiNotesVis1PaneHtml([], '');
assert.ok(schedPane.includes('Your notes only'), schedPane);
assert.ok(schedPane.includes('id="remiNotesClarityCompose"'), 'scheduler uses the same composer');
assert.strictEqual(sandbox.remiNotesVis1Hint(), 'Your notes only');

const notesBox = {currentAdminRole:'Admin', currentAdminUsername:'mo@evercare.test', copilotView:'notes', console:console, Date:Date, Math:Math, JSON:JSON, isFinite:isFinite, parseInt:parseInt, encodeURIComponent:encodeURIComponent, Object:Object, Number:Number, String:String, Intl:Intl};
const mem = {};
notesBox.localStorage = {getItem:function(k){return Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null;}, setItem:function(k,v){mem[k]=String(v);}, removeItem:function(k){delete mem[k];}};
vm.createContext(notesBox);
vm.runInContext(notes1, notesBox);
const made = notesBox.remiNotesCreate('call payroll', new Date(Date.now()+600000).toISOString(), new Date());
const row = notesBox.remiNotesRowHtml(made, 'open', new Date());
assert.ok(row.includes('>REMIND<'), row);
assert.ok(row.includes('>Edit<') && row.includes('>Delete<'), row);
assert.ok(!row.includes('Open thread'), row);
assert.ok(!row.includes('Add note'), row);

console.log('admin-remi-notes-clarity1 unit ok');

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
    console.log('admin-remi-notes-clarity1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript', '.css':'text/css'};
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
  let browser = null;
  try{
    browser = await puppeteer.launch({
      executablePath: chrome,
      headless: 'new',
      args: ['--no-sandbox','--disable-dev-shm-usage']
    });
  }catch(err){
    server.close();
    console.log('admin-remi-notes-clarity1 browser skipped ('+String(err&&err.message||err)+')');
    return;
  }
  try{
    const phone = await browser.newPage();
    await phone.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await phone.goto('http://127.0.0.1:'+port+'/index.html?v=remi-notes-clarity1', {waitUntil:'domcontentloaded', timeout:60000});
    await phone.evaluate(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({role:'Admin', username:'mo@evercare.test', name:'Moe', loginAt:Date.now()}));
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
    });
    const admin = await phone.evaluate(async function(){
      sbRestRpc = async function(){return {ok:true, data:{success:true, ok:true, notes:[]}};};
      remiNotesCreate('Devon pay hold — check Monday.', null, new Date());
      remiNotesCreate('call payroll', new Date(Date.now()+600000).toISOString(), new Date());
      remiNotesShow();
      if(typeof remiNotesVis1Load==='function')await remiNotesVis1Load();
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var bar = document.querySelector('#adminScreen .shell-top').getBoundingClientRect();
      var head = document.querySelector('#copilotSheet .copilot-top').getBoundingClientRect();
      var save = document.getElementById('remiNotesVisSave').getBoundingClientRect();
      var remind = document.getElementById('remiNotesClarityRemind').getBoundingClientRect();
      var add = document.getElementById('remiNotesAdd').getBoundingClientRect();
      var text = document.getElementById('copilotBody').innerText;
      var composers = 0;
      var areas = document.querySelectorAll('#copilotSheet textarea, #remiNotesInput');
      for(var i=0;i<areas.length;i++){
        var r = areas[i].getBoundingClientRect();
        if(r.height > 8 && r.width > 8)composers++;
      }
      return {
        sheetTop: sheet.top,
        barBottom: bar.bottom,
        headTop: head.top,
        saveH: save.height,
        remindH: remind.height,
        addH: add.height,
        composers: composers,
        text: text,
        marker: document.getElementById('copilotSheet').getAttribute('data-remi-notes-clarity1'),
        firstMeta: document.querySelector('meta[name="admin-build"]').content
      };
    });
    fs.mkdirSync('/opt/cursor/artifacts', {recursive:true});
    await phone.screenshot({path:'/opt/cursor/artifacts/remi-notes-clarity1-admin.png'});
    assert.ok(admin.sheetTop + 1 >= admin.barBottom, 'sheet starts at or below the EverCare topbar '+JSON.stringify(admin));
    assert.ok(admin.headTop + 1 >= admin.barBottom, 'Remi header is below the topbar');
    assert.ok(admin.saveH >= 44 && admin.remindH >= 44, 'composer controls stay tappable');
    assert.strictEqual(admin.addH, 0, 'Add note pad is not a second composer');
    assert.strictEqual(admin.composers, 1, 'one visible composer '+admin.composers);
    assert.ok(admin.text.indexOf('NOTE') >= 0 && admin.text.indexOf('REMIND') >= 0, admin.text);
    assert.ok(admin.text.indexOf('Reminders') < 0, admin.text);
    assert.strictEqual(admin.marker, 'v=remi-notes-clarity1');
    assert.strictEqual(admin.firstMeta, '2026-09-27-remi-float-hide1b');

    const kb = await phone.evaluate(function(){
      var input = document.getElementById('remiNotesVisInput');
      input.focus();
      var fake = {height: 420, offsetTop: 0, addEventListener: function(){}};
      try{
        Object.defineProperty(window, 'visualViewport', {configurable:true, get:function(){return fake;}});
      }catch(e){}
      remiNotesClarity1Fit();
      var form = document.getElementById('remiNotesClarityCompose').getBoundingClientRect();
      var save = document.getElementById('remiNotesVisSave').getBoundingClientRect();
      var remind = document.getElementById('remiNotesClarityRemind').getBoundingClientRect();
      var head = document.querySelector('#copilotSheet .copilot-top').getBoundingClientRect();
      var bar = document.querySelector('#adminScreen .shell-top').getBoundingClientRect();
      var sheetEl = document.getElementById('copilotSheet');
      var compose = document.getElementById('remiNotesClarityCompose');
      return {
        kb: document.documentElement.classList.contains('remi-notes-kb'),
        fs: document.documentElement.classList.contains('remi-notes-fs'),
        formBottom: Math.round(form.bottom),
        saveBottom: Math.round(document.getElementById('remiNotesFsSave').getBoundingClientRect().bottom),
        remindBottom: Math.round(remind.bottom),
        formTop: Math.round(form.top),
        headTop: Math.round(head.top),
        barBottom: Math.round(bar.bottom),
        viewH: fake.height,
        sheetTop: Math.round(sheetEl.getBoundingClientRect().top),
        docked: !!(compose && compose.parentNode && compose.parentNode.id==='remiNotesDock'),
        position: compose ? (window.getComputedStyle(compose).position) : '',
        title: document.getElementById('remiNotesFsTitle').textContent
      };
    });
    assert.strictEqual(kb.fs, true, 'focus opens in-Remi compose');
    assert.strictEqual(kb.kb, false, 'messages dock class stays off');
    assert.strictEqual(kb.docked, true, 'composer lives in the sheet dock');
    assert.strictEqual(kb.position, 'absolute', 'compose panel covers the Remi visual box');
    assert.strictEqual(kb.title, 'New note');
    assert.ok(kb.sheetTop + 1 >= kb.barBottom, 'phone-safe header stays '+JSON.stringify(kb));
    assert.ok(kb.headTop + 1 >= kb.barBottom, 'Remi header stays clear of chrome');
    assert.ok(kb.formTop + 1 >= kb.headTop, 'compose starts under the Remi header');
    assert.ok(kb.formBottom <= kb.viewH + 2, 'composer stays at the visual bottom '+JSON.stringify(kb));
    assert.ok(kb.saveBottom <= kb.viewH + 2 && kb.remindBottom <= kb.viewH + 2, 'Save and Remind me stay above the keyboard');
    assert.ok(kb.formTop < kb.viewH, 'composer is inside the open area');
    await phone.screenshot({path:'/opt/cursor/artifacts/remi-notes-clarity1-keyboard.png'});

    await phone.evaluate(async function(){
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'jaz@evercare.test';
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      remiNotesVis1ResetTab();
      remiNotesShow();
      await remiNotesVis1Load();
    });
    const sched = await phone.evaluate(function(){
      var root = document.getElementById('remiNotesVis1');
      var text = root ? root.innerText : '';
      var add = document.getElementById('remiNotesAdd').getBoundingClientRect();
      var areas = document.querySelectorAll('#copilotSheet textarea, #remiNotesInput');
      var composers = 0;
      for(var i=0;i<areas.length;i++){
        var r = areas[i].getBoundingClientRect();
        if(r.height > 8 && r.width > 8)composers++;
      }
      return {
        hint: document.getElementById('remiNotesVisHint') ? document.getElementById('remiNotesVisHint').textContent : '',
        soft: text.indexOf('Your notes only') >= 0,
        composers: composers,
        addH: add.height,
        remind: !!document.getElementById('remiNotesClarityRemind'),
        tabHidden: document.getElementById('remiNotesVisSched') ? !!document.getElementById('remiNotesVisSched').hidden : true
      };
    });
    assert.strictEqual(sched.hint, 'Your notes only');
    assert.strictEqual(sched.soft, true);
    assert.strictEqual(sched.composers, 1, 'scheduler has the same one composer');
    assert.strictEqual(sched.addH, 0);
    assert.strictEqual(sched.remind, true);
    assert.strictEqual(sched.tabHidden, true);
    await phone.screenshot({path:'/opt/cursor/artifacts/remi-notes-clarity1-scheduler.png'});

    console.log('admin-remi-notes-clarity1 browser ok');
  }finally{
    if(browser)await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
