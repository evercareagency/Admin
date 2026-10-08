#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildTxt = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/\s+$/,'');

assert.strictEqual(buildTxt, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('v=remi-notes-open1b'), 'marker');
assert.ok(html.includes('?v=remi-notes-open1b'), 'pages cache bust');
assert.ok(html.includes('admin-build 2026-09-29-remi-notes-open1b'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-notes-open1b">'), 'meta');
assert.ok(html.includes('<!-- remi notes open thread unlinked 2026-09-29 v=remi-notes-open1b ?v=remi-notes-open1b admin-build 2026-09-29-remi-notes-open1b'), 'comment');
assert.ok(html.includes("var REMI_NOTES_OPEN1B_MARKER='v=remi-notes-open1b'"), 'script marker');
assert.ok(html.includes("var REMI_NOTES_OPEN1B_BUILD='2026-09-29-remi-notes-open1b'"), 'script build');
assert.ok(html.includes('GHOST-REMI-NOTES-OPEN1B-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('Pure Admin UI'), 'pure UI');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth reseal'), 'hard rules');
assert.ok(html.includes('data-remi-notes-open1b="v=remi-notes-open1b"'), 'data attr');
assert.ok(html.includes('data-remi-notes-open1="v=remi-notes-open1" data-remi-notes-open1b="v=remi-notes-open1b"'), 'attr sits beside open1');
['v=remi-notes-open1','v=remi-notes-vis1','v=remi-notes1','v=remi-open-thread1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-29-remi-notes-open1"'), 'open1 follows the first meta');
assert.ok(html.indexOf('content="2026-09-29-remi-notes-open1"') < html.indexOf('content="2026-09-29-remi-notes-open1b"'), 'open1b follows open1');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-notes-open1b-v1.sql')), 'no SQL patch');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-notes-open1-v1.sql')), 'open1 SQL stays absent');

const notes1Start = html.indexOf('// remi notes v=remi-notes1');
const notes1End = html.indexOf('// end remi notes v=remi-notes1');
assert.ok(notes1Start > 0 && notes1End > notes1Start, 'notes1 block');
const notes1 = html.slice(notes1Start, notes1End);
assert.ok(!notes1.includes('>Open thread<'), 'local Reminders never paint Open thread');
assert.ok(notes1.includes('Never paint Open thread here'), 'reminders stay marked as not a Messages thread');
assert.ok(notes1.includes('id="remiNotes1Keep" data-reminotes1="v=remi-notes1" data-remi-notes-open1b="v=remi-notes-open1b"'), 'reminders marker has no button');

const goFn = html.slice(html.indexOf('function remiNotesOpen1Go('), html.indexOf('async function remiNotesOpen1Refetch'));
assert.ok(goFn.includes('if(!linked)return remiNotesOpen1Stay()'), 'unlinked stays');
assert.ok(goFn.includes('remiNotesOpen1Stay()'), 'linked stays in Remi');
assert.ok(!goFn.includes('remiNotesOpen1Messages();'), 'go does not call the messages hop');
assert.ok(!goFn.includes("showTab('aidechat')"), 'go itself does not open Messages');
assert.ok(!goFn.includes('copilotClose'), 'go does not close Remi');
assert.ok(!goFn.includes('aideOfficeVis1OpenAide'), 'go does not open the office thread');
assert.ok(!goFn.includes('copilotShowChat') && !goFn.includes('copilotPaintAsk') && !goFn.includes("copilotView='ask'") && !goFn.includes("copilotView='chat'"), 'notes path does not open Ask');

const start = html.indexOf('// remi notes vis1 v=remi-notes-vis1');
const end = html.indexOf('// end remi notes vis1 v=remi-notes-vis1');
assert.ok(start > 0 && end > start, 'notes vis script block');
const src = html.slice(start, end);

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

function wire(sandbox){
  const calls = [];
  sandbox.calls = calls;
  sandbox.copilotClose = function(){calls.push('close');};
  sandbox.showTab = function(tab){calls.push('tab:'+tab);};
  sandbox.remiOpenThread1Desk = function(){calls.push('desk');};
  sandbox.showTempMsg = function(msg){calls.push('toast:'+msg);};
  sandbox.copilotShowChat = function(){calls.push('ask');};
  sandbox.copilotPaintAsk = function(){calls.push('paint-ask');};
  sandbox.copilotPaintChat = function(){calls.push('paint-chat');};
  sandbox.remiNotesShow = function(){
    calls.push('notes-tab');
    sandbox.copilotView = 'notes';
  };
  sandbox.aideOfficeVis1OfficeOk = function(){
    var role = sandbox.currentAdminRole==null?'':String(sandbox.currentAdminRole);
    return role==='Admin'||role==='Scheduler';
  };
  sandbox.aideOfficeVis1OpenAide = function(aide, thread){
    calls.push('open:'+aide+':'+thread);
    return Promise.resolve({id:thread||aide});
  };
  return calls;
}

(async function unit(){
  const sandbox = runSlice();
  const shell = sandbox.remiNotesVis1Html();
  assert.ok(shell.includes('data-remi-notes-open1="v=remi-notes-open1"'), shell);
  assert.ok(shell.includes('data-remi-notes-open1b="v=remi-notes-open1b"'), shell);

  const unlinked = sandbox.remiNotesVis1CardHtml({
    id:'note-plain',
    body:'remind me in 10mins',
    updates:[]
  }, 'my', true);
  assert.ok(!unlinked.includes('Open thread'), unlinked);
  assert.ok(!unlinked.includes('remiNotesVis1OpenThread'), unlinked);
  assert.ok(unlinked.includes("onclick=\"remiNotesStay1bOpen('note-plain')\""), unlinked);

  const linked = sandbox.remiNotesVis1CardHtml({
    id:'note-test',
    body:'Cover note',
    aide_id:'sara-id',
    thread_id:'t-sara',
    updates:[]
  }, 'my', true);
  assert.ok(!linked.includes('Open thread'), linked);
  assert.ok(linked.includes('data-remi-notes-stay1b="v=remi-notes-stay1b"'), linked);
  assert.ok(linked.includes("onclick=\"remiNotesStay1bOpen('note-test')\""), linked);
  assert.ok(linked.includes('>Edit<') && linked.includes('>Delete<'), linked);

  const deep = sandbox.remiNotesVis1CardHtml({
    id:'note-deep',
    body:'Deep',
    deep_link:'admin/messages?aide_id=jaz-id',
    updates:[]
  }, 'my', true);
  assert.ok(!deep.includes('Open thread'), deep);
  assert.ok(deep.includes("onclick=\"remiNotesStay1bOpen('note-deep')\""), deep);

  const objectLink = sandbox.remiNotesVis1CardHtml({
    id:'note-obj',
    body:'Object',
    deep_link:{aide_id:'ignored'},
    updates:[]
  }, 'my', true);
  assert.ok(!objectLink.includes('Open thread'), objectLink);

  const hidden = sandbox.remiNotesVis1CardHtml({
    id:'note-test',
    body:'Cover note',
    aide_id:'sara-id',
    updates:[]
  }, 'my', false);
  assert.ok(!hidden.includes('Open thread'), 'thread view still hides the button');

  const pane = sandbox.remiNotesVis1PaneHtml([
    {id:'note-test', body:'Cover note', aide_id:'sara-id', thread_id:'t-sara', updates:[]},
    {id:'note-plain', body:'remind me in 10 mins', updates:[]},
    {id:'note-office', body:'Office only', office_thread_id:'t-office', updates:[]}
  ], '');
  assert.strictEqual(pane.split('>Open thread<').length - 1, 0, pane);
  assert.ok(pane.indexOf('Notes stay here')>=0, pane);
  assert.ok(pane.indexOf("remiNotesVis1OpenThread(")<0, pane);
  assert.ok(pane.indexOf("remiNotesStay1bOpen('note-plain')")>=0, pane);
  assert.ok(pane.indexOf("remiNotesStay1bOpen('note-test')")>=0, pane);
  assert.ok(pane.indexOf("remiNotesStay1bOpen('note-office')")>=0, pane);

  sandbox.remiNotesVis1Cache = [
    {id:'note-plain', body:'remind me in 10mins'},
    {id:'note-test', body:'Cover note', aide_id:'sara-id', thread_id:'t-sara'},
    {id:'note-deep', body:'Deep', deep_link:'admin/messages?aide_id=jaz-id&thread_id=t-jaz'}
  ];
  const calls = wire(sandbox);

  let got = await sandbox.remiNotesVis1OpenThread('note-plain');
  assert.strictEqual(got.linked, false);
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(calls.length, 0, 'already on Notes: no navigation');
  assert.strictEqual(sandbox.copilotView, 'notes');

  sandbox.copilotView = 'ask';
  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('note-plain');
  assert.strictEqual(got.linked, false);
  assert.deepStrictEqual(calls, ['notes-tab']);
  assert.strictEqual(sandbox.copilotView, 'notes');

  sandbox.copilotView = 'chat';
  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('note-plain');
  assert.strictEqual(got.linked, false);
  assert.ok(calls.indexOf('notes-tab')>=0);
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c==='desk'||c==='ask'||c==='paint-ask'||c==='paint-chat'||c.indexOf('toast:')===0;}), calls.join(','));

  calls.length = 0;
  sandbox.copilotView = 'notes';
  got = await sandbox.remiNotesVis1OpenThread('note-test');
  assert.strictEqual(got.linked, true);
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(got.aideId, 'sara-id');
  assert.strictEqual(got.threadId, 't-sara');
  assert.strictEqual(sandbox.remiNotesVis1EditId, 'note-test');
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c==='desk'||c==='ask'||c.indexOf('open:')===0;}), calls.join(','));

  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('note-deep');
  assert.strictEqual(got.linked, true);
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(got.aideId, 'jaz-id');
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c.indexOf('open:')===0;}), calls.join(','));

  sandbox.currentAdminRole = 'Nurse';
  calls.length = 0;
  const denied = await sandbox.remiNotesVis1OpenThread('note-plain');
  assert.strictEqual(denied.forbidden, true);
  assert.strictEqual(calls.length, 0, 'nurse does not navigate');

  console.log('admin-remi-notes-open1b unit ok');
  await runBrowser();
})().catch(function(err){
  console.error(err);
  process.exit(1);
});

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function installStub(pack, email){
  window.__calls = [];
  window.__pack = JSON.parse(JSON.stringify(pack));
  readSbSession = function(){return {access_token:'office-jwt', email:email, user:{email:email}};};
  sbRestRpc = async function(name, body){
    window.__calls.push({name:name, body:body||{}});
    if(name==='remi_list_my_notes')return {ok:true, data:{success:true, tab:'my_notes', notes:window.__pack.my}};
    if(name==='remi_list_scheduler_notes')return {ok:true, data:{success:true, tab:'scheduler_notes', notes:window.__pack.sched}};
    if(name==='remi_save_my_note')return {ok:true, data:{success:true, note:{id:'saved', body:body&&body.p_body}}};
    if(name==='remi_list_my_note_thread')return {ok:true, data:{success:true, note:(window.__pack.my[0]||{})}};
    if(name==='admin_get_aide_office_unread_badge')return {ok:true, data:{unread_threads:1, unread_messages:1, deep_link_base:'admin/messages'}};
    if(name==='admin_list_due_aide_office_alerts')return {ok:true, data:{alerts:[], deep_link_base:'admin/messages'}};
    if(name==='admin_list_aide_office_threads')return {ok:true, data:{threads:window.__pack.threads}};
    if(name==='admin_list_aide_office_messages'){
      return {ok:true, data:{messages:[
        {id:'aide-1', sender:'aide', body:'Yes I can cover Ada AM.', created_at:'2026-09-29T15:00:00Z'}
      ]}};
    }
    if(name==='admin_mark_aide_office_messages_read')return {ok:true, data:{success:true}};
    if(name==='admin_get_aide_chat_remi_settings')return {ok:true, data:{enabled:false, start_local:'14:00', end_local:'08:00'}};
    if(name==='admin_list_radar_signals')return {ok:true, data:{signals:[]}};
    if(name==='admin_get_quiet_hours')return {ok:true, data:{enabled:false, start_local:'20:00', end_local:'07:00', timezone:'America/New_York'}};
    return {ok:true, data:{success:true}};
  };
}

async function boot(page, role, email){
  await page.evaluate(installStub, {
    my: [
      {id:'note-test', body:'Cover note', aide_id:'sara-id', thread_id:'t-sara', updates:[]},
      {id:'note-plain', body:'remind me in 10mins', updates:[]},
      {id:'note-deep', body:'Deep link', deep_link:'admin/messages?aide_id=sara-id', updates:[]}
    ],
    sched: [],
    threads: [
      {thread_id:'t-sara', aide_id:'sara-id', aide_username:'sara', aide_name:'Sara Alvarez', has_unread:true, unread:1, preview_from_aide:'Yes I can cover Ada AM.', last_message:'Yes I can cover Ada AM.', last_message_at:'2026-09-29T15:00:00Z'}
    ]
  }, email);
  await page.evaluate(async function(role, email){
    localStorage.clear();
    currentAdminRole = role;
    currentAdminUsername = email;
    if(typeof layoutA1ApplyRoles==='function')layoutA1ApplyRoles();
    if(typeof navEditApply==='function')navEditApply();
    showScreen('adminScreen');
    showTab('schedule');
    if(typeof aideOfficeVis1Boot==='function')aideOfficeVis1Boot();
  }, role, email);
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-notes-open1b browser skipped (no puppeteer-core)');
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
    console.log('admin-remi-notes-open1b browser skipped ('+String(err&&err.message||err)+')');
    return;
  }
  const errors = [];
  try{
    const phone = await browser.newPage();
    phone.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await phone.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await phone.goto('http://127.0.0.1:'+port+'/index.html?v=remi-notes-open1b', {waitUntil:'domcontentloaded', timeout:60000});
    await boot(phone, 'Admin', 'admin@roles.evercare.local');
    await phone.evaluate(async function(){
      remiNotesShow();
      await remiNotesVis1Load();
      remiNotesFromAsk('remind me in 10 mins');
    });
    const painted = await phone.evaluate(function(){
      var plain = document.querySelector('#remiNotesVis1 [data-note-id="note-plain"]');
      var linked = document.querySelector('#remiNotesVis1 [data-note-id="note-test"] .remi-stay-body');
      var deep = document.querySelector('#remiNotesVis1 [data-note-id="note-deep"] .remi-stay-body');
      var keep = document.getElementById('remiNotes1Keep');
      var buttons = keep ? Array.prototype.map.call(keep.querySelectorAll('button'), function(b){return b.textContent;}) : [];
      return {
        plainButton: plain ? !!plain.querySelector('[data-remi-notes-open1], [data-remi-notes-open1b]') : false,
        plainOpen: plain ? plain.textContent.indexOf('Open thread') : -1,
        plainText: plain ? plain.textContent : '',
        linkedLabel: linked ? linked.textContent : '',
        linkedOnclick: linked ? linked.getAttribute('onclick') : '',
        deepLabel: deep ? deep.textContent : '',
        deepOpen: deep ? (deep.closest('[data-note-id]') ? deep.closest('[data-note-id]').textContent.indexOf('Open thread') : -1) : -1,
        keepMarker: keep ? keep.getAttribute('data-remi-notes-open1b') : '',
        keepStay: keep ? keep.getAttribute('data-remi-notes-stay1b') : '',
        reminderButtons: buttons,
        reminderOpen: keep ? keep.textContent.indexOf('Open thread') : -1,
        view: copilotView,
        sheetHidden: document.getElementById('copilotSheet') ? !!document.getElementById('copilotSheet').hidden : true
      };
    });
    assert.strictEqual(painted.plainButton, false, 'unlinked Ace note has no Open thread');
    assert.ok(painted.plainOpen<0, 'unlinked card text has no Open thread');
    assert.ok(painted.plainText.indexOf('remind me in 10mins')>=0, painted.plainText);
    assert.strictEqual(painted.linkedLabel, 'Cover note');
    assert.ok(painted.linkedOnclick.indexOf("remiNotesStay1bOpen('note-test')")>=0, painted.linkedOnclick);
    assert.strictEqual(painted.deepLabel, 'Deep link');
    assert.ok(painted.deepOpen<0, 'deep link note has no Open thread');
    assert.strictEqual(painted.keepMarker, 'v=remi-notes-open1b');
    assert.strictEqual(painted.keepStay, 'v=remi-notes-stay1b');
    assert.ok(painted.reminderButtons.indexOf('Open thread')<0, painted.reminderButtons.join(','));
    assert.ok(painted.reminderOpen<0, 'local reminder has no Open thread');
    assert.strictEqual(painted.view, 'notes');
    assert.strictEqual(painted.sheetHidden, false);

    const unlinked = await phone.evaluate(async function(){
      copilotShowChat();
      var tabs = [];
      var closes = 0;
      var prevTab = showTab;
      var prevClose = copilotClose;
      showTab = function(tab){ tabs.push(tab); return prevTab.apply(this, arguments); };
      copilotClose = function(){ closes += 1; return prevClose.apply(this, arguments); };
      var result = await remiNotesVis1OpenThread('note-plain');
      showTab = prevTab;
      copilotClose = prevClose;
      var ask = document.getElementById('copilotTabAsk');
      var notes = document.getElementById('copilotTabNotes');
      var dock = document.getElementById('copilotComposer');
      var sheet = document.getElementById('copilotSheet');
      var chat = document.getElementById('tab_aidechat');
      return {
        linked: !!(result && result.linked),
        stayed: !!(result && result.stayed),
        view: copilotView,
        tabs: tabs,
        closes: closes,
        askOn: ask ? ask.getAttribute('aria-selected') : '',
        notesOn: notes ? notes.getAttribute('aria-selected') : '',
        askHidden: dock ? !!dock.hidden : false,
        sheetHidden: sheet ? !!sheet.hidden : true,
        chatActive: !!(chat && chat.classList.contains('active')),
        keepOpen: document.getElementById('remiNotes1Keep') ? document.getElementById('remiNotes1Keep').textContent.indexOf('Open thread') : -1
      };
    });
    assert.strictEqual(unlinked.linked, false);
    assert.strictEqual(unlinked.stayed, true);
    assert.strictEqual(unlinked.view, 'notes');
    assert.deepStrictEqual(unlinked.tabs, []);
    assert.strictEqual(unlinked.closes, 0);
    assert.strictEqual(unlinked.askOn, 'false');
    assert.strictEqual(unlinked.notesOn, 'true');
    assert.strictEqual(unlinked.askHidden, true, 'Ask composer stays closed');
    assert.strictEqual(unlinked.sheetHidden, false, 'Remi Notes stays open');
    assert.strictEqual(unlinked.chatActive, false, 'no Messages hop');
    assert.ok(unlinked.keepOpen<0, 'reminder still has no Open thread');

    await phone.click('#remiNotesVis1 [data-note-id="note-test"] .remi-stay-body');
    const opened = await phone.evaluate(function(){
      var thread = document.getElementById('aidechatThreadView');
      var sheet = document.getElementById('copilotSheet');
      var chat = document.getElementById('tab_aidechat');
      var edit = document.getElementById('remiNotesVisEdit');
      return {
        threadHidden: thread ? !!thread.hidden : true,
        sheetHidden: sheet ? !!sheet.hidden : true,
        chatActive: !!(chat && chat.classList.contains('active')),
        editing: !!(edit && edit.value.indexOf('Cover note')>=0),
        view: copilotView
      };
    });
    assert.strictEqual(opened.threadHidden, true, 'linked tap does not open a Messages thread');
    assert.strictEqual(opened.sheetHidden, false, 'linked tap stays in Remi');
    assert.strictEqual(opened.chatActive, false, 'linked tap does not hop to Messages');
    assert.strictEqual(opened.editing, true, 'linked tap opens in-rail edit');
    assert.strictEqual(opened.view, 'notes');
    assert.strictEqual(errors.length, 0, errors.join('\n'));
    console.log('admin-remi-notes-open1b browser ok');
  }finally{
    if(browser)await browser.close();
    server.close();
  }
}
