#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildTxt = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/\s+$/,'');

assert.strictEqual(buildTxt, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('v=remi-notes-open1'), 'marker');
assert.ok(html.includes('?v=remi-notes-open1'), 'pages cache bust');
assert.ok(html.includes('admin-build 2026-09-29-remi-notes-open1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-notes-open1">'), 'meta');
assert.ok(html.includes('<!-- remi notes open thread 2026-09-29 v=remi-notes-open1 ?v=remi-notes-open1 admin-build 2026-09-29-remi-notes-open1'), 'comment');
assert.ok(html.includes("var REMI_NOTES_OPEN1_MARKER='v=remi-notes-open1'"), 'script marker');
assert.ok(html.includes("var REMI_NOTES_OPEN1_BUILD='2026-09-29-remi-notes-open1'"), 'script build');
assert.ok(html.includes('v=sched-notes-copy1'), 'sched notes copy marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-sched-notes-copy1">'), 'sched notes copy meta');
assert.ok(html.includes("var SCHED_NOTES_COPY1_MARKER='v=sched-notes-copy1'"), 'sched notes copy script marker');
assert.ok(html.includes("var SCHED_NOTES_COPY1_BUILD='2026-09-29-sched-notes-copy1'"), 'sched notes copy script build');
assert.ok(html.includes('data-sched-notes-copy1="v=sched-notes-copy1"'), 'sched notes copy data attr');
assert.ok(html.includes("return 'Your notes only'"), 'scheduler hint copy');
assert.ok(!html.includes('Admin My notes never appear here.'), 'old scheduler hint is gone');
assert.ok(html.includes('GHOST-REMI-NOTES-OPEN1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth reseal'), 'hard rules');
assert.ok(html.includes('data-remi-notes-open1="v=remi-notes-open1"'), 'data attr');
['v=remi-notes-vis1','v=remi-open-thread1','v=remi-msg-tab1','v=aide-office-vis1','v=remi-notes1','v=care-msg-safe1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-29-remi-notes-open1"'), 'new meta follows the first');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-notes-open1-v1.sql')), 'no SQL patch');

const openStart = html.indexOf('function remiNotesOpen1Messages()');
const openEnd = html.indexOf('function remiNotesVis1CloseThread');
const openFn = html.slice(openStart, openEnd);
assert.ok(openStart > 0 && openFn.length > 80, 'open helpers present');
assert.ok(openFn.includes('remiNotesVis1SafeId'), 'resolves the note id safely');
assert.ok(openFn.includes('remiNotesVis1Cache') || html.includes('remiNotesVis1FindCached'), 'uses the list cache');
assert.ok(!openFn.includes("copilotClose()"), 'notes open does not close Remi');
assert.ok(!openFn.includes("showTab('aidechat')"), 'notes open does not showTab aidechat');
assert.ok(!openFn.includes('remiOpenThread1Desk()'), 'notes open does not jump to the Messages desk');
assert.ok(!openFn.includes('aideOfficeVis1OpenAide'), 'notes open does not open the office thread');
assert.ok(!openFn.includes("showTab('more')"), 'does not showTab more');
assert.ok(openFn.includes('if(!linked)return remiNotesOpen1Stay()'), 'unlinked stays');
assert.ok(openFn.includes('remiNotesOpen1Stay()'), 'linked path stays in Remi');
assert.ok(!openFn.includes('remiNotesOpen1Messages();'), 'messages hop is not called');
assert.ok(!openFn.includes('No linked Messages thread on this note.'), 'unlinked tap does not toast a dead thread');
assert.ok(openFn.includes("remiNotesVis1ThreadId=''"), 'does not stay in the in-notes thread');
const refetch = html.slice(html.indexOf('async function remiNotesOpen1Refetch'), html.indexOf('function remiNotesVis1PaintPane'));
assert.ok(refetch.includes('remi_list_my_notes') && refetch.includes('remi_list_scheduler_notes'), 're-fetches the existing list');
assert.ok(!refetch.includes('remi_list_my_note_thread'), 'open path does not post the in-notes thread rpc');
assert.ok(!html.includes('onclick="remiNotesVis1OpenThread('), 'Open thread onclick is gone');
assert.ok(html.includes('onclick="remiNotesStay1bOpen('), 'tap opens in-rail detail');
assert.ok(html.includes('async function remiNotesVis1Save'), 'save stays');
assert.ok(html.includes('async function remiNotesVis1Update'), 'update stays');
assert.ok(html.includes('function remiNotesVis1CloseThread'), 'back from an in-notes thread stays');

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
  assert.strictEqual(sandbox.REMI_NOTES_VIS1_MARKER, 'v=remi-notes-vis1');
  const shell = sandbox.remiNotesVis1Html();
  assert.ok(shell.includes('data-remi-notes-open1="v=remi-notes-open1"'), shell);
  assert.ok(shell.includes('data-sched-notes-copy1="v=sched-notes-copy1"'), shell);
  assert.strictEqual(sandbox.remiNotesVis1Hint(), 'Save \u2192 only on My notes. Scheduler never sees this tab.');
  sandbox.currentAdminRole = 'Scheduler';
  sandbox.remiNotesVis1Which = 'my';
  assert.strictEqual(sandbox.remiNotesVis1Hint(), 'Your notes only');
  sandbox.remiNotesVis1Which = 'scheduler';
  assert.strictEqual(sandbox.remiNotesVis1Hint(), 'This tab only. Your My notes stay off her screen.');
  sandbox.currentAdminRole = 'Admin';
  sandbox.remiNotesVis1Which = 'my';
  assert.ok(shell.includes('>My notes<') && shell.includes('>Scheduler notes<'), 'tabs stay');
  const card = sandbox.remiNotesVis1CardHtml({
    id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    body:'Test',
    aide_id:'sara-id',
    updates:[]
  }, 'my', true);
  assert.ok(card.includes('data-remi-notes-stay1b="v=remi-notes-stay1b"'), card);
  assert.ok(card.includes("onclick=\"remiNotesStay1bOpen('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')\""), card);
  assert.ok(!card.includes('Open thread'), card);
  assert.ok(card.includes('>Edit<') && card.includes('>Delete<'), card);
  const plainCard = sandbox.remiNotesVis1CardHtml({
    id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    body:'remind me in 10 mins',
    updates:[]
  }, 'my', true);
  assert.ok(!plainCard.includes('Open thread'), plainCard);
  assert.ok(plainCard.includes("onclick=\"remiNotesStay1bOpen('cccccccc-cccc-4ccc-8ccc-cccccccccccc')\""), plainCard);

  sandbox.remiNotesVis1PaintPane([
    {id:'n-linked', body:'Test', aide_id:'sara-id', thread_id:'t-sara'},
    {id:'n-deep', body:'Scheduler note', deep_link:'admin/messages?aide_id=jaz-id&x=1'},
    {id:'n-obj', body:'Object link', deep_link:{aide_id:'ignored'}},
    {id:'n-plain', body:'No link'},
    {id:'n-office', body:'Office only', office_thread_id:'t-office'}
  ], '');
  assert.strictEqual(sandbox.remiNotesVis1Cache.length, 5, 'paint fills the cache');

  const calls = wire(sandbox);
  let got = await sandbox.remiNotesVis1OpenThread('n-linked');
  assert.strictEqual(got.linked, true);
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(got.aideId, 'sara-id');
  assert.strictEqual(got.threadId, 't-sara');
  assert.strictEqual(sandbox.remiNotesVis1EditId, 'n-linked', 'linked tap opens in-rail edit');
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c==='desk'||c==='tab:more'||c.indexOf('open:')===0||c.indexOf('toast:')===0;}), calls.join(','));
  assert.strictEqual(sandbox.remiNotesVis1ThreadId, '', 'does not open an in-notes messages thread');

  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('n-deep');
  assert.strictEqual(got.aideId, 'jaz-id');
  assert.strictEqual(got.stayed, true);
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c.indexOf('open:')===0;}), calls.join(','));

  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('n-obj');
  assert.strictEqual(got.linked, false);
  assert.strictEqual(got.stayed, true);
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c==='desk'||c.indexOf('toast:')===0||c.indexOf('open:')===0;}), calls.join(','));

  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('n-plain');
  assert.strictEqual(got.linked, false);
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(calls.length, 0, 'unlinked tap does not navigate');

  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('n-office');
  assert.strictEqual(got.linked, true);
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(got.threadId, 't-office');
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c.indexOf('open:')===0;}), calls.join(','));

  const link = sandbox.remiNotesOpen1Link({
    linked_aide_id:' aide-2 ',
    deep_link:'admin/messages?aide_id=other&thread_id=from-query'
  });
  assert.strictEqual(link.aideId, 'aide-2');
  assert.strictEqual(link.threadId, 'from-query');

  calls.length = 0;
  sandbox.remiNotesVis1Cache = [];
  sandbox.remiNotesVis1Which = 'my';
  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='remi_list_my_notes'){
      return {ok:true, data:{notes:[{id:'n-miss', linked_aide_id:'miss-aide', office_thread_id:'t-miss'}]}};
    }
    return {ok:false, error:'unexpected '+name};
  };
  got = await sandbox.remiNotesVis1OpenThread('n-miss');
  assert.strictEqual(rpc.length, 1);
  assert.strictEqual(rpc[0].name, 'remi_list_my_notes');
  assert.strictEqual(rpc[0].body.p_limit, 50);
  assert.strictEqual(got.aideId, 'miss-aide');
  assert.strictEqual(got.threadId, 't-miss');
  assert.strictEqual(got.stayed, true);
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c.indexOf('open:')===0;}), calls.join(','));

  rpc.length = 0;
  calls.length = 0;
  sandbox.remiNotesVis1Cache = [];
  sandbox.remiNotesVis1Which = 'scheduler';
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='remi_list_scheduler_notes'){
      return {ok:true, data:{notes:[{id:'n-sched', aide_id:'sched-aide', thread_id:'t-sched'}]}};
    }
    return {ok:false, error:'unexpected '+name};
  };
  got = await sandbox.remiNotesVis1OpenThread('n-sched');
  assert.strictEqual(rpc[0].name, 'remi_list_scheduler_notes');
  assert.strictEqual(got.aideId, 'sched-aide');
  assert.strictEqual(got.stayed, true);
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c.indexOf('open:')===0;}), calls.join(','));

  sandbox.currentAdminRole = 'Scheduler';
  sandbox.remiNotesVis1Which = 'my';
  sandbox.remiNotesVis1Cache = [{id:'n-jaz', body:'Mine', deep_link:'admin/messages?aide_id=sara-id'}];
  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('n-jaz');
  assert.strictEqual(got.linked, true);
  assert.strictEqual(got.stayed, true);
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c.indexOf('open:')===0;}), 'scheduler stays in Remi');

  sandbox.currentAdminRole = 'Nurse';
  calls.length = 0;
  rpc.length = 0;
  const denied = await sandbox.remiNotesVis1OpenThread('n-jaz');
  assert.strictEqual(denied.forbidden, true);
  assert.strictEqual(calls.length, 0, 'nurse does not navigate');
  assert.strictEqual(rpc.length, 0, 'nurse does not call Ace');

  sandbox.currentAdminRole = 'Admin';
  sandbox.remiNotesVis1Which = 'my';
  sandbox.remiNotesVis1ThreadId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  rpc.length = 0;
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    return {ok:true, data:{note:{id:body.p_note_id, body:'still here', updates:[]}}};
  };
  await sandbox.remiNotesVis1Load();
  assert.strictEqual(rpc[0].name, 'remi_list_my_note_thread', 'residual in-notes thread load stays');

  const input = {value:'Devon pay hold — check Monday.'};
  sandbox.document = {getElementById: function(id){return id==='remiNotesVisInput'?input:null;}};
  rpc.length = 0;
  sandbox.remiNotesVis1ThreadId = '';
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='remi_save_my_note')return {ok:true, data:{success:true, note:{id:'n1', body:body.p_body}}};
    if(name==='remi_list_my_notes')return {ok:true, data:{notes:[{id:'n1', body:body.p_body, updates:[]}]}};
    return {ok:false, error:'unexpected '+name};
  };
  const saved = await sandbox.remiNotesVis1Save();
  assert.strictEqual(saved.ok, true);
  assert.strictEqual(rpc[0].name, 'remi_save_my_note');
  assert.strictEqual(rpc[1].name, 'remi_list_my_notes');
  assert.strictEqual(input.value, '');

  console.log('admin-remi-notes-open1 unit ok');
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
    if(name==='remi_update_scheduler_note')return {ok:true, data:{success:true, note:{id:body&&body.p_note_id}}};
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
      {id:'note-test', body:'Test', aide_id:'sara-id', thread_id:'t-sara', updates:[]},
      {id:'note-plain', body:'Plain note', updates:[]}
    ],
    sched: [
      {id:'note-sched', author_display_name:'Jazmine (Scheduler)', body:'Maria said yes.', aide_id:'sara-id', thread_id:'t-sara', updates:[], deep_link:'admin/messages?aide_id=sara-id'}
    ],
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
    console.log('admin-remi-notes-open1 browser skipped (no puppeteer-core)');
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
    console.log('admin-remi-notes-open1 browser skipped ('+String(err&&err.message||err)+')');
    return;
  }
  const errors = [];
  try{
    const phone = await browser.newPage();
    phone.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await phone.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await phone.goto('http://127.0.0.1:'+port+'/index.html?v=remi-notes-open1', {waitUntil:'domcontentloaded', timeout:60000});
    await boot(phone, 'Admin', 'admin@roles.evercare.local');
    await phone.evaluate(async function(){
      remiNotesShow();
      await remiNotesVis1Load();
    });
    const before = await phone.evaluate(function(){
      var card = document.querySelector('#remiNotesVis1 [data-note-id="note-test"]');
      var btn = card ? card.querySelector('.remi-stay-body') : null;
      var open = card ? card.querySelector('[data-remi-notes-open1], [data-remi-notes-open1b]') : null;
      var sheet = document.getElementById('copilotSheet');
      var schedTab = document.getElementById('tab_schedule');
      return {
        label: btn ? btn.textContent : '',
        marker: btn ? btn.getAttribute('data-remi-notes-stay1b') : '',
        onclick: btn ? btn.getAttribute('onclick') : '',
        openThread: card ? card.textContent.indexOf('Open thread') : -1,
        openButton: !!open,
        sheetHidden: sheet ? !!sheet.hidden : true,
        scheduleActive: !!(schedTab && schedTab.classList.contains('active')),
        root: document.getElementById('remiNotesVis1') ? document.getElementById('remiNotesVis1').getAttribute('data-remi-notes-stay1b') : '',
        chip: document.querySelector('#remiNotesVis1 .remi-stay-chip') ? document.querySelector('#remiNotesVis1 .remi-stay-chip').textContent : ''
      };
    });
    assert.strictEqual(before.label, 'Test');
    assert.strictEqual(before.marker, 'v=remi-notes-stay1b');
    assert.ok(before.onclick.indexOf("remiNotesStay1bOpen('note-test')")>=0, before.onclick);
    assert.ok(before.openThread<0, 'linked note has no Open thread');
    assert.strictEqual(before.openButton, false);
    assert.strictEqual(before.sheetHidden, false, 'notes sheet starts open');
    assert.strictEqual(before.scheduleActive, true, 'Schedule tab stays active behind Remi');
    assert.strictEqual(before.root, 'v=remi-notes-stay1b');
    assert.ok(before.chip.indexOf('Notes stay here')>=0, before.chip);
    await phone.click('#remiNotesVis1 [data-note-id="note-test"] .remi-stay-body');
    const linked = await phone.evaluate(function(){
      var chat = document.getElementById('tab_aidechat');
      var sched = document.getElementById('tab_schedule');
      var sheet = document.getElementById('copilotSheet');
      var edit = document.getElementById('remiNotesVisEdit');
      var names = (window.__calls||[]).map(function(c){return c.name;});
      return {
        chatActive: !!(chat && chat.classList.contains('active')),
        scheduleActive: !!(sched && sched.classList.contains('active')),
        sheetHidden: sheet ? !!sheet.hidden : true,
        view: copilotView,
        editing: !!(edit && edit.value.indexOf('Test')>=0),
        save: !!document.querySelector('#remiNotesVis1 .remi-crud-edit .go'),
        threadRpc: names.indexOf('remi_list_my_note_thread')>=0,
        openThread: document.getElementById('remiNotesVis1') ? document.getElementById('remiNotesVis1').textContent.indexOf('Open thread') : -1
      };
    });
    assert.strictEqual(linked.chatActive, false, 'messages tab stays inactive');
    assert.strictEqual(linked.scheduleActive, true, 'Schedule stays the desk');
    assert.strictEqual(linked.sheetHidden, false, 'Remi stays open');
    assert.strictEqual(linked.view, 'notes');
    assert.strictEqual(linked.editing, true, 'tap opens in-rail edit');
    assert.strictEqual(linked.save, true, 'Save stays');
    assert.strictEqual(linked.threadRpc, false, 'tap does not post the in-notes thread rpc');
    assert.ok(linked.openThread<0, 'Open thread stays absent after tap');

    await phone.evaluate(async function(){
      remiNotesShow();
      remiNotesVis1Which = 'my';
      remiNotesVis1ThreadId = '';
      await remiNotesVis1Load();
    });
    const plain = await phone.evaluate(async function(){
      var btn = document.querySelector('#remiNotesVis1 [data-note-id="note-plain"] [data-remi-notes-open1], #remiNotesVis1 [data-note-id="note-plain"] [data-remi-notes-open1b]');
      var sheet = document.getElementById('copilotSheet');
      var ask = document.getElementById('copilotTabAsk');
      window.__tabs = [];
      var prev = showTab;
      showTab = function(tab){ window.__tabs.push(tab); return prev.apply(this, arguments); };
      var result = await remiNotesVis1OpenThread('note-plain');
      showTab = prev;
      return {
        button: !!btn,
        linked: !!(result && result.linked),
        stayed: !!(result && result.stayed),
        sheetHidden: sheet ? !!sheet.hidden : true,
        view: typeof copilotView==='undefined' ? '' : copilotView,
        askOn: ask ? ask.getAttribute('aria-selected') : '',
        notesOn: document.getElementById('copilotTabNotes') ? document.getElementById('copilotTabNotes').getAttribute('aria-selected') : '',
        tabs: window.__tabs.slice()
      };
    });
    assert.strictEqual(plain.button, false, 'unlinked note has no Open thread');
    assert.strictEqual(plain.linked, false);
    assert.strictEqual(plain.stayed, true);
    assert.strictEqual(plain.sheetHidden, false, 'stays inside Remi Notes');
    assert.strictEqual(plain.view, 'notes');
    assert.strictEqual(plain.askOn, 'false');
    assert.strictEqual(plain.notesOn, 'true');
    assert.ok(plain.tabs.indexOf('aidechat')<0, plain.tabs.join(','));

    await phone.evaluate(async function(){
      currentAdminRole = 'Scheduler';
      if(typeof layoutA1ApplyRoles==='function')layoutA1ApplyRoles();
      remiNotesVis1ResetTab();
      remiNotesShow();
      await remiNotesVis1Load();
    });
    const sched = await phone.evaluate(function(){
      var tab = document.getElementById('remiNotesVisSched');
      var card = document.querySelector('#remiNotesVis1 [data-note-id="note-test"]');
      var btn = card ? card.querySelector('.remi-stay-body') : null;
      return {
        schedHidden: tab ? !!tab.hidden : true,
        openThread: card ? card.textContent.indexOf('Open thread') : -1,
        onclick: btn ? btn.getAttribute('onclick') : '',
        hint: document.getElementById('remiNotesVisHint') ? document.getElementById('remiNotesVisHint').textContent : ''
      };
    });
    assert.strictEqual(sched.schedHidden, true, 'scheduler has no Scheduler notes tab');
    assert.ok(sched.openThread<0, 'scheduler note has no Open thread');
    assert.ok(sched.onclick.indexOf("remiNotesStay1bOpen('note-test')")>=0, sched.onclick);
    assert.strictEqual(sched.hint, 'Your notes only');
    await phone.click('#remiNotesVis1 [data-note-id="note-test"] .remi-stay-body');
    const schedStay = await phone.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var chat = document.getElementById('tab_aidechat');
      return {
        sheetHidden: sheet ? !!sheet.hidden : true,
        chatActive: !!(chat && chat.classList.contains('active')),
        view: copilotView,
        editing: !!document.getElementById('remiNotesVisEdit')
      };
    });
    assert.strictEqual(schedStay.sheetHidden, false, 'scheduler tap stays in Remi');
    assert.strictEqual(schedStay.chatActive, false, 'scheduler tap does not open Messages');
    assert.strictEqual(schedStay.view, 'notes');
    assert.strictEqual(schedStay.editing, true, 'scheduler tap opens in-rail edit');

    const nurse = await phone.evaluate(async function(){
      currentAdminRole = 'Nurse';
      var before = document.getElementById('copilotSheet') ? document.getElementById('copilotSheet').hidden : true;
      var result = await remiNotesVis1OpenThread('note-test');
      return {before:before, forbidden: !!(result && result.forbidden), sheet: document.getElementById('copilotSheet') ? document.getElementById('copilotSheet').hidden : true};
    });
    assert.strictEqual(nurse.forbidden, true, 'nurse open is refused');
    assert.strictEqual(errors.length, 0, errors.join('\n'));
    console.log('admin-remi-notes-open1 browser ok');
  }finally{
    if(browser)await browser.close();
    server.close();
  }
}
