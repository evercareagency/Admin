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
assert.ok(openFn.includes("copilotClose()"), 'closes Remi');
assert.ok(openFn.includes("showTab('aidechat')"), 'showTab to aidechat');
assert.ok(openFn.includes('remiOpenThread1Desk()'), 'clears the More selection');
assert.ok(openFn.includes('aideOfficeVis1OpenAide'), 'opens the office thread');
assert.ok(!openFn.includes("showTab('more')"), 'does not showTab more');
assert.ok(openFn.includes('if(!linked)return remiNotesOpen1Stay()'), 'unlinked stays before any hop');
assert.ok(openFn.indexOf('if(!linked)return remiNotesOpen1Stay()')<openFn.indexOf('remiNotesOpen1Messages();'), 'messages hop is only after the linked check');
assert.ok(!openFn.includes('No linked Messages thread on this note.'), 'unlinked tap does not toast a dead thread');
assert.ok(openFn.includes("remiNotesVis1ThreadId=''"), 'does not stay in the in-notes thread');
const refetch = html.slice(html.indexOf('async function remiNotesOpen1Refetch'), html.indexOf('function remiNotesVis1PaintPane'));
assert.ok(refetch.includes('remi_list_my_notes') && refetch.includes('remi_list_scheduler_notes'), 're-fetches the existing list');
assert.ok(!refetch.includes('remi_list_my_note_thread'), 'open path does not post the in-notes thread rpc');
assert.ok(html.includes('data-remi-notes-open1="v=remi-notes-open1" data-remi-notes-open1b="v=remi-notes-open1b" onclick="remiNotesVis1OpenThread('), 'button keeps the onclick name');
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
  assert.ok(card.includes('data-remi-notes-open1="v=remi-notes-open1"'), card);
  assert.ok(card.includes('data-remi-notes-open1b="v=remi-notes-open1b"'), card);
  assert.ok(card.includes("onclick=\"remiNotesVis1OpenThread('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')\""), card);
  assert.ok(card.includes('>Open thread<'), card);
  const plainCard = sandbox.remiNotesVis1CardHtml({
    id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    body:'remind me in 10 mins',
    updates:[]
  }, 'my', true);
  assert.ok(!plainCard.includes('Open thread'), plainCard);

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
  assert.strictEqual(got.aideId, 'sara-id');
  assert.strictEqual(got.threadId, 't-sara');
  assert.ok(calls.indexOf('close')>=0, 'closes remi');
  assert.ok(calls.indexOf('tab:aidechat')>=0, 'messages tab');
  assert.ok(calls.indexOf('desk')>=0, 'desk helper');
  assert.ok(calls.indexOf('open:sara-id:t-sara')>=0, calls.join(','));
  assert.ok(!calls.some(function(c){return c==='tab:more';}), 'no more tab');
  assert.ok(!calls.some(function(c){return c.indexOf('toast:')===0;}), 'no toast when linked');
  assert.strictEqual(sandbox.remiNotesVis1ThreadId, '', 'does not stay inside notes');

  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('n-deep');
  assert.strictEqual(got.aideId, 'jaz-id');
  assert.ok(calls.indexOf('open:jaz-id:')>=0, calls.join(','));

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
  assert.ok(calls.indexOf('open::t-office')>=0, calls.join(','));

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
  assert.ok(calls.indexOf('open:miss-aide:t-miss')>=0, calls.join(','));

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
  assert.ok(calls.indexOf('open:sched-aide:t-sched')>=0);

  sandbox.currentAdminRole = 'Scheduler';
  sandbox.remiNotesVis1Which = 'my';
  sandbox.remiNotesVis1Cache = [{id:'n-jaz', body:'Mine', deep_link:'admin/messages?aide_id=sara-id'}];
  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('n-jaz');
  assert.strictEqual(got.linked, true);
  assert.ok(calls.indexOf('open:sara-id:')>=0, 'scheduler uses the same open path');
  assert.ok(calls.indexOf('tab:aidechat')>=0);

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
      var btn = document.querySelector('#remiNotesVis1 [data-note-id="note-test"] [data-remi-notes-open1]');
      var sheet = document.getElementById('copilotSheet');
      return {
        label: btn ? btn.textContent : '',
        marker: btn ? btn.getAttribute('data-remi-notes-open1') : '',
        onclick: btn ? btn.getAttribute('onclick') : '',
        sheetHidden: sheet ? !!sheet.hidden : true,
        root: document.getElementById('remiNotesVis1') ? document.getElementById('remiNotesVis1').getAttribute('data-remi-notes-open1') : ''
      };
    });
    assert.strictEqual(before.label, 'Open thread');
    assert.strictEqual(before.marker, 'v=remi-notes-open1');
    assert.ok(before.onclick.indexOf("remiNotesVis1OpenThread('note-test')")>=0, before.onclick);
    assert.strictEqual(before.sheetHidden, false, 'notes sheet starts open');
    assert.strictEqual(before.root, 'v=remi-notes-open1');
    await phone.click('#remiNotesVis1 [data-note-id="note-test"] [data-remi-notes-open1]');
    await phone.waitForFunction(function(){
      var title = document.getElementById('aidechatThreadTitle');
      var sheet = document.getElementById('copilotSheet');
      var chat = document.getElementById('tab_aidechat');
      return title && title.textContent.indexOf('Sara Alvarez')>=0 && sheet && sheet.hidden && chat && chat.classList.contains('active');
    }, {timeout:15000});
    const linked = await phone.evaluate(function(){
      var chat = document.getElementById('tab_aidechat');
      var more = document.getElementById('tab_more');
      var moreNav = document.getElementById('nav_more');
      var chatNav = document.getElementById('nav_aidechat');
      var thread = document.getElementById('aidechatThreadView');
      var toast = document.getElementById('nciToast');
      var names = (window.__calls||[]).map(function(c){return c.name;});
      return {
        chatActive: !!(chat && chat.classList.contains('active')),
        moreActive: !!(more && more.classList.contains('active')),
        moreNav: !!(moreNav && moreNav.classList.contains('active')),
        chatNav: !!(chatNav && chatNav.classList.contains('active')),
        threadHidden: thread ? !!thread.hidden : true,
        toast: toast && toast.style.display!=='none' ? toast.textContent : '',
        threadRpc: names.indexOf('remi_list_my_note_thread')>=0
      };
    });
    assert.strictEqual(linked.chatActive, true, 'messages tab active');
    assert.strictEqual(linked.moreActive, false, 'more panel not selected');
    assert.strictEqual(linked.moreNav, false, 'more nav not selected');
    assert.strictEqual(linked.chatNav, true, 'messages nav selected');
    assert.strictEqual(linked.threadHidden, false, 'thread is open');
    assert.ok(linked.toast.indexOf('No linked')<0, linked.toast);
    assert.strictEqual(linked.threadRpc, false, 'linked open does not post the in-notes thread rpc');

    await phone.evaluate(async function(){
      remiNotesShow();
      remiNotesVis1Which = 'my';
      remiNotesVis1ThreadId = '';
      await remiNotesVis1Load();
    });
    const plain = await phone.evaluate(async function(){
      var btn = document.querySelector('#remiNotesVis1 [data-note-id="note-plain"] [data-remi-notes-open1]');
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
    assert.strictEqual(plain.button, false, 'unlinked note hides Open thread');
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
      var btn = document.querySelector('#remiNotesVis1 [data-remi-notes-open1]');
      return {schedHidden: tab ? !!tab.hidden : true, label: btn ? btn.textContent : ''};
    });
    assert.strictEqual(sched.schedHidden, true, 'scheduler has no Scheduler notes tab');
    assert.strictEqual(sched.label, 'Open thread');
    await phone.click('#remiNotesVis1 [data-remi-notes-open1]');
    await phone.waitForFunction(function(){
      var title = document.getElementById('aidechatThreadTitle');
      var sheet = document.getElementById('copilotSheet');
      return title && title.textContent.indexOf('Sara Alvarez')>=0 && sheet && sheet.hidden;
    }, {timeout:15000});

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
