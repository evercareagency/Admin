#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-notes-vis1'), 'remi-notes-vis1 marker');
assert.ok(html.includes('data-remi-notes-vis1="v=remi-notes-vis1"'), 'remi-notes-vis1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-notes-vis1'), 'remi-notes-vis1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-notes-vis1">'), 'remi-notes-vis1 meta');
assert.ok(html.includes('<!-- remi notes desk 2026-09-27 v=remi-notes-vis1 admin-build 2026-09-27-remi-notes-vis1'), 'remi-notes-vis1 comment');
assert.ok(html.includes("var REMI_NOTES_VIS1_MARKER='v=remi-notes-vis1'"), 'remi-notes-vis1 script marker');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-msg-dense1'), 'first admin-build is remi-proof1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-proof1"') < html.indexOf('content="2026-09-27-remi-sched1"'), 'sched meta follows proof');
assert.ok(html.indexOf('content="2026-09-27-remi-sched1"') < html.indexOf('content="2026-09-27-remi-rules1"'), 'rules meta follows sched');
assert.ok(html.indexOf('content="2026-09-27-remi-rules1"') < html.indexOf('content="2026-09-27-remi-notes-vis1"'), 'notes vis meta follows rules');
assert.ok(html.indexOf('content="2026-09-27-remi-notes-vis1"') < html.indexOf('content="2026-09-27-vapid1"'), 'vapid1 stays after this pack');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-vapid1">'), 'vapid1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-remi-notes1">'), 'remi-notes1 meta stays');
['v=remi-rules1','v=remi-sched1','v=vapid1','v=clienthrs1d','v=remi-cm-email1','v=remiface1','v=remi-notes1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior or pack marker stays ' + mark);
});
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="copilotTabRadar"') && html.includes('id="copilotTabAsk"') && html.includes('id="copilotTabNotes"'), 'Radar Ask Notes stay');
assert.ok(html.includes('id="copilotTabRules"') && html.includes('id="copilotTabSched"'), 'Rules and Scheduled tabs');

const nurseAt = html.indexOf('id="nurseScreen"');
const sheet = html.slice(html.indexOf('id="copilotSheet"'), nurseAt);
assert.ok(sheet.includes('data-layout-roles="Admin Scheduler"'), 'sheet stays Admin and Scheduler');
assert.ok(sheet.includes('My notes') === false, 'My notes are painted, not a second static page');
assert.ok(!sheet.includes('id="remiNotesVisSched"'), 'scheduler subtab is not copied onto the nurse side');

const start = html.indexOf('// remi notes vis1 v=remi-notes-vis1');
const end = html.indexOf('// end remi notes vis1 v=remi-notes-vis1');
assert.ok(start > 0 && end > start, 'notes vis script block');
const src = html.slice(start, end);
assert.ok(src.includes("sbRestRpc"), 'office JWT via sbRestRpc');
assert.ok(src.includes('is_scheduler_office'), 'is_scheduler_office path');
assert.ok(src.includes('remi_list_my_notes') && src.includes('remi_save_my_note'), 'my note rpcs');
assert.ok(src.includes('remi_list_scheduler_notes') && src.includes('remi_update_scheduler_note'), 'scheduler note rpcs');
assert.ok(src.includes('remi_list_my_note_thread'), 'optional thread rpc');
assert.ok(src.includes('My notes') && src.includes('Scheduler notes'), 'admin subtabs');
assert.ok(src.includes('updated_label') && src.includes('author_display_name'), 'paints attribution');
assert.ok(!/spy|manager can see/i.test(src), 'no spy or manager-can-see badge');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|send_sms/.test(src), 'no Quo or SMS');
assert.ok(src.includes('Nurse cannot use Remi notes'), 'nurse writes refused');

const notes1Start = html.indexOf('// remi notes v=remi-notes1');
const notes1End = html.indexOf('// end remi notes v=remi-notes1');
const notes1 = html.slice(notes1Start, notes1End);
assert.ok(!/sbRestRpc|supabase\.|fetch\(/.test(notes1), 'reminder notes stay off Ace');
assert.ok(notes1.includes('evercare_remi_notes:'), 'local reminders stay');
assert.ok(notes1.includes('remiNotesVis1Html'), 'desk notes mount above reminders');

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

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_NOTES_VIS1_MARKER, 'v=remi-notes-vis1');
  assert.strictEqual(sandbox.REMI_NOTES_VIS1_OFFICE, 'is_scheduler_office');
  assert.strictEqual(sandbox.remiNotesVis1IsAdmin(), true);
  const adminShell = sandbox.remiNotesVis1Html();
  assert.ok(adminShell.includes('>My notes<') && adminShell.includes('>Scheduler notes<'), adminShell);
  assert.ok(!/id="remiNotesVisSched"[^>]*\shidden/.test(adminShell), 'admin sees Scheduler notes');

  sandbox.currentAdminRole = 'Scheduler';
  sandbox.remiNotesVis1ResetTab();
  const schedShell = sandbox.remiNotesVis1Html();
  assert.ok(/id="remiNotesVisSched"[^>]*\shidden/.test(schedShell), 'scheduler has no Scheduler notes tab');
  assert.strictEqual(sandbox.remiNotesVis1Hint(), 'Admin My notes never appear here.');
  const denied = await sandbox.remiNotesVis1Rpc('remi_list_scheduler_notes', {p_limit:50});
  assert.strictEqual(denied.forbidden, true, 'scheduler cannot list admin scheduler tab');
  const calls = [];
  sandbox.sbRestRpc = async function(){calls.push('nope'); return {ok:true, data:{}};};
  const deniedWrite = await sandbox.remiNotesVis1Rpc('remi_update_scheduler_note', {p_note_id:'x', p_body:'no'});
  assert.strictEqual(deniedWrite.forbidden, true);
  assert.strictEqual(calls.length, 0, 'forbidden path does not call Ace');

  sandbox.currentAdminRole = 'Nurse';
  assert.strictEqual(sandbox.remiNotesVis1OfficeOk(), false);
  const nurse = await sandbox.remiNotesVis1Rpc('remi_save_my_note', {p_body:'nope'});
  assert.strictEqual(nurse.forbidden, true);
  assert.strictEqual(calls.length, 0, 'nurse write does not call Ace');

  sandbox.currentAdminRole = 'Admin';
  const card = sandbox.remiNotesVis1CardHtml({
    id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    author_display_name:'Jazmine (Scheduler)',
    body:'Maria said yes to 9 AM tomorrow.',
    created_at:'2026-09-27T13:12:00.000Z',
    has_admin_update:true,
    latest_update:{author_display_name:'Moe (Manager)', updated_label:'Moe (Manager) updated', body:'No — she said 11 AM. Update the blast to 11.'},
    updates:[{author_display_name:'Moe (Manager)', updated_label:'Moe (Manager) updated', body:'No — she said 11 AM. Update the blast to 11.'}]
  }, 'scheduler', true);
  assert.ok(card.includes('Jazmine (Scheduler)'), card);
  assert.ok(card.includes('Moe (Manager) updated'), card);
  assert.ok(card.includes('No — she said 11 AM. Update the blast to 11.'), card);
  assert.ok(card.includes('Update note'), card);
  assert.ok(!/spy|manager can see/i.test(card));
  const mine = sandbox.remiNotesVis1PaneHtml([{id:'a', body:'Devon pay hold — check Monday.', updates:[]}], '');
  assert.ok(mine.includes('>You<'), mine);
  assert.ok(mine.includes('Devon pay hold'), mine);
  assert.ok(mine.includes('id="remiNotesVisSave"'), mine);
  assert.ok(mine.includes('Scheduler never sees this tab'), mine);
  assert.ok(!/spy|manager can see/i.test(mine));

  const rpc = [];
  const input = {value:'Devon pay hold — check Monday.'};
  sandbox.document = {getElementById: function(id){return id==='remiNotesVisInput'?input:null;}};
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='remi_save_my_note')return {ok:true, data:{success:true, ok:true, marker:'remi-notes-vis1', note:{id:'n1', body:body.p_body}}};
    if(name==='remi_list_my_notes')return {ok:true, data:{success:true, tab:'my_notes', notes:[{id:'n1', body:body.p_body, updates:[]}]}};
    return {ok:false, error:'unexpected '+name};
  };
  const saved = await sandbox.remiNotesVis1Save();
  assert.strictEqual(saved.ok, true);
  assert.strictEqual(rpc[0].name, 'remi_save_my_note');
  assert.strictEqual(rpc[0].body.p_body, 'Devon pay hold — check Monday.');
  assert.strictEqual(rpc[1].name, 'remi_list_my_notes');
  assert.strictEqual(rpc[1].body.p_limit, 50);
  assert.strictEqual(input.value, '');

  const reply = {value:'No — she said 11 AM. Update the blast to 11.'};
  sandbox.document = {getElementById: function(id){
    if(id==='remiVisReply_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')return reply;
    return null;
  }};
  rpc.length = 0;
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    return {ok:true, data:{success:true, update:{updated_label:'Moe (Manager) updated', body:body.p_body}, note:{id:body.p_note_id}}};
  };
  sandbox.remiNotesVis1Which = 'scheduler';
  const updated = await sandbox.remiNotesVis1Update('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  assert.strictEqual(updated.ok, true);
  assert.strictEqual(rpc[0].name, 'remi_update_scheduler_note');
  assert.strictEqual(rpc[0].body.p_note_id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  assert.strictEqual(rpc[0].body.p_body, 'No — she said 11 AM. Update the blast to 11.');

  rpc.length = 0;
  sandbox.remiNotesVis1ThreadId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    return {ok:true, data:{success:true, note:{id:body.p_note_id, body:'Maria said yes to 9 AM tomorrow.', updates:[]}}};
  };
  await sandbox.remiNotesVis1Load();
  assert.strictEqual(rpc[0].name, 'remi_list_my_note_thread');
  assert.strictEqual(rpc[0].body.p_note_id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  console.log('admin-remi-notes-vis1 unit ok');
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

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-notes-vis1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_PACK_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript', '.css':'text/css'};
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
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await page.setRequestInterception(true);
    page.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({
        role:'Admin', username:'mo@evercare.test', name:'Mo', loginAt:Date.now()
      }));
    });
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-notes-vis1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.waitForSelector('#copilotFab', {timeout:10000});
    const my = await page.evaluate(async function(){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      var notes = [{
        id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        author_display_name:'Moe (Manager)',
        body:'Devon pay hold — check Monday.',
        created_at:'2026-09-27T12:40:00.000Z',
        updates:[], latest_update:null, has_admin_update:false
      }];
      var sched = [{
        id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        author_role:'scheduler',
        author_display_name:'Jazmine (Scheduler)',
        body:'Maria said yes to 9 AM tomorrow.',
        created_at:'2026-09-27T13:12:00.000Z',
        has_admin_update:true,
        latest_update:{author_display_name:'Moe (Manager)', updated_label:'Moe (Manager) updated', body:'No — she said 11 AM. Update the blast to 11.'},
        updates:[{author_display_name:'Moe (Manager)', updated_label:'Moe (Manager) updated', body:'No — she said 11 AM. Update the blast to 11.'}]
      }];
      window.__rpc = [];
      sbRestRpc = async function(name, body){
        window.__rpc.push({name:name, body:body});
        if(name==='remi_list_my_notes')return {ok:true, data:{success:true, ok:true, marker:'remi-notes-vis1', v:'remi-notes-vis1', tab:'my_notes', notes:notes}};
        if(name==='remi_list_scheduler_notes')return {ok:true, data:{success:true, tab:'scheduler_notes', notes:sched}};
        if(name==='remi_save_my_note'){
          notes.unshift({id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc', body:body.p_body, created_at:'2026-09-27T14:00:00.000Z', updates:[], author_display_name:'Moe (Manager)'});
          return {ok:true, data:{success:true, note:notes[0]}};
        }
        if(name==='remi_update_scheduler_note')return {ok:true, data:{success:true, update:{updated_label:'Moe (Manager) updated', body:body.p_body}, note:sched[0]}};
        if(name==='remi_list_my_note_thread')return {ok:true, data:{success:true, note:sched[0]}};
        return {ok:false, error:'unexpected '+name};
      };
      remiNotesShow();
      await remiNotesVis1Load();
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      var save = document.getElementById('remiNotesVisSave');
      var text = document.getElementById('remiNotesVis1').innerText;
      return {
        text:text,
        selected:document.getElementById('copilotTabNotes').getAttribute('aria-selected'),
        schedTab:!!document.getElementById('remiNotesVisSched') && !document.getElementById('remiNotesVisSched').hidden,
        sheetTop:box.top,
        sheetWidth:box.width,
        viewW:window.innerWidth,
        saveH:save?save.getBoundingClientRect().height:0,
        overflow:sheet.scrollWidth <= sheet.clientWidth + 2,
        tab:document.getElementById('remiNotesVis1').getAttribute('data-tab'),
        chip:!!document.getElementById('copilotFab')
      };
    });
    assert.strictEqual(my.viewW, 390);
    assert.strictEqual(my.selected, 'true');
    assert.strictEqual(my.schedTab, true, 'admin scheduler subtab');
    assert.strictEqual(my.tab, 'my_notes');
    assert.ok(my.sheetTop >= 60, 'sheet not full-page zoom '+my.sheetTop);
    assert.ok(my.sheetWidth <= my.viewW + 1);
    assert.strictEqual(my.overflow, true, 'phone sheet does not scroll sideways');
    assert.ok(my.saveH >= 44, 'save tap '+my.saveH);
    assert.ok(my.text.indexOf('Devon pay hold') >= 0, my.text);
    assert.ok(my.text.indexOf('My notes') >= 0, my.text);
    assert.ok(my.text.indexOf('Scheduler never sees this tab') >= 0, my.text);
    assert.ok(!/spy|manager can see/i.test(my.text), my.text);
    assert.strictEqual(my.chip, true);
    await page.evaluate(function(){
      var keep = document.getElementById('remiNotes1Keep');
      var dock = document.getElementById('remiNotesDock');
      if(keep)keep.style.display = 'none';
      if(dock)dock.style.display = 'none';
      var body = document.getElementById('copilotBody');
      if(body)body.scrollTop = 0;
    });
    await page.screenshot({path:path.join(shotDir, 'remi-notes-vis1-phone-my.png')});

    await page.evaluate(function(){
      var input = document.getElementById('remiNotesVisInput');
      input.value = 'Check Kim for Tuesday.';
    });
    await page.click('#remiNotesVisSave');
    await page.waitForFunction(function(){return document.body.innerText.indexOf('Check Kim for Tuesday.') >= 0;});
    const saved = await page.evaluate(function(){
      var hit = null;
      for(var i=0;i<window.__rpc.length;i++)if(window.__rpc[i].name==='remi_save_my_note')hit = window.__rpc[i];
      return hit && hit.body;
    });
    assert.ok(saved && saved.p_body === 'Check Kim for Tuesday.', JSON.stringify(saved));

    await page.click('#remiNotesVisSched');
    await page.waitForFunction(function(){return document.body.innerText.indexOf('Jazmine (Scheduler)') >= 0;});
    const schedView = await page.evaluate(function(){
      var root = document.getElementById('remiNotesVis1');
      var text = root.innerText;
      return {
        tab:root.getAttribute('data-tab'),
        text:text,
        myHidden:document.getElementById('remiNotesVisMy').classList.contains('on') === false
      };
    });
    assert.strictEqual(schedView.tab, 'scheduler_notes');
    assert.strictEqual(schedView.myHidden, true);
    assert.ok(schedView.text.indexOf('Moe (Manager) updated') >= 0, schedView.text);
    assert.ok(schedView.text.indexOf('Maria said yes to 9 AM tomorrow.') >= 0, schedView.text);
    assert.ok(schedView.text.indexOf('Update note') >= 0, schedView.text);
    assert.ok(schedView.text.indexOf('Your My notes stay off her screen') >= 0, schedView.text);
    await page.evaluate(function(){
      var keep = document.getElementById('remiNotes1Keep');
      if(keep)keep.style.display = 'none';
      var body = document.getElementById('copilotBody');
      if(body)body.scrollTop = 0;
    });
    await page.screenshot({path:path.join(shotDir, 'remi-notes-vis1-phone-scheduler.png')});

    await page.evaluate(function(){
      var box = document.getElementById('remiVisReply_bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
      box.value = 'No — she said 11 AM. Update the blast to 11.';
    });
    await page.evaluate(function(){return remiNotesVis1Update('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');});
    const reply = await page.evaluate(function(){
      for(var i=window.__rpc.length-1;i>=0;i--){
        if(window.__rpc[i].name==='remi_update_scheduler_note')return window.__rpc[i].body;
      }
      return null;
    });
    assert.ok(reply && reply.p_note_id === 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', JSON.stringify(reply));
    assert.strictEqual(reply.p_body, 'No — she said 11 AM. Update the blast to 11.');

    const schedRole = await page.evaluate(async function(){
      window.__rpc = [];
      currentAdminRole = 'Scheduler';
      remiNotesVis1ResetTab();
      remiNotesShow();
      await remiNotesVis1Load();
      var btn = document.getElementById('remiNotesVisSched');
      var names = window.__rpc.map(function(row){return row.name;});
      return {
        hidden:!!(btn && btn.hidden),
        listedScheduler:names.indexOf('remi_list_scheduler_notes') >= 0,
        text:document.getElementById('remiNotesVis1').innerText
      };
    });
    assert.strictEqual(schedRole.hidden, true, 'scheduler does not get the Scheduler notes tab');
    assert.strictEqual(schedRole.listedScheduler, false);
    assert.ok(schedRole.text.indexOf('Admin My notes never appear here.') >= 0, schedRole.text);

    const nurse = await browser.newPage();
    await nurse.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await nurse.setRequestInterception(true);
    nurse.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await nurse.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({
        role:'Nurse', username:'nurse@evercare.test', name:'Nurse', loginAt:Date.now()
      }));
    });
    await nurse.goto('http://127.0.0.1:'+port+'/index.html?v=remi-notes-vis1', {waitUntil:'domcontentloaded', timeout:20000});
    await nurse.waitForSelector('#nurseScreen', {timeout:10000});
    const nurseState = await nurse.evaluate(async function(){
      currentAdminRole = 'Nurse';
      if(typeof showScreen === 'function')showScreen('nurseScreen');
      var calls = 0;
      sbRestRpc = async function(){calls += 1; return {ok:true, data:{}};};
      if(typeof remiNotesShow === 'function')remiNotesShow();
      var got = await remiNotesVis1Rpc('remi_save_my_note', {p_body:'nope'});
      var sheet = document.getElementById('copilotSheet');
      return {
        nurseOn:document.getElementById('nurseScreen').classList.contains('active'),
        inNurse:!!document.getElementById('nurseScreen').querySelector('#copilotTabNotes'),
        sheetHidden:sheet ? sheet.hidden : true,
        forbidden:got && got.forbidden === true,
        calls:calls
      };
    });
    assert.strictEqual(nurseState.nurseOn, true);
    assert.strictEqual(nurseState.inNurse, false);
    assert.strictEqual(nurseState.sheetHidden, true);
    assert.strictEqual(nurseState.forbidden, true);
    assert.strictEqual(nurseState.calls, 0);
    console.log('admin-remi-notes-vis1 browser ok');
  } finally {
    await browser.close();
    server.close();
  }
}
