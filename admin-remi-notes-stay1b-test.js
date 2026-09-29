#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildTxt = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/\s+$/,'');

assert.strictEqual(buildTxt, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('v=remi-notes-stay1b'), 'marker');
assert.ok(html.includes('?v=remi-notes-stay1b'), 'pages cache bust');
assert.ok(html.includes('admin-build 2026-09-29-remi-notes-stay1b'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-notes-stay1b">'), 'meta');
assert.ok(html.includes('<!-- remi notes stay 2026-09-29 v=remi-notes-stay1b ?v=remi-notes-stay1b admin-build 2026-09-29-remi-notes-stay1b'), 'comment');
assert.ok(html.includes("var REMI_NOTES_STAY1B_MARKER='v=remi-notes-stay1b'"), 'script marker');
assert.ok(html.includes("var REMI_NOTES_STAY1B_BUILD='2026-09-29-remi-notes-stay1b'"), 'script build');
assert.ok(html.includes('GHOST-REMI-NOTES-STAY1B-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('Pure Admin UI'), 'pure UI');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth reseal'), 'hard rules');
assert.ok(html.includes('data-remi-notes-stay1b="v=remi-notes-stay1b"'), 'data attr');
assert.ok(html.includes('Notes stay here'), 'soft copy');
['v=remi-notes-open1b','v=remi-notes-open1','v=remi-notes-vis1','v=remi-notes1','v=remi-rail-crud1','v=remi-open-thread1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-29-remi-notes-open1b"') < html.indexOf('content="2026-09-29-remi-notes-stay1b"'), 'stay1b follows open1b');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-notes-stay1b-v1.sql')), 'no SQL patch');

const notes1Start = html.indexOf('// remi notes v=remi-notes1');
const notes1End = html.indexOf('// end remi notes v=remi-notes1');
const notes1 = html.slice(notes1Start, notes1End);
assert.ok(!notes1.includes('>Open thread<'), 'local Reminders never paint Open thread');
assert.ok(notes1.includes('data-remi-notes-stay1b="v=remi-notes-stay1b"'), 'reminders carry the stay marker');
assert.ok(notes1.includes('onclick="remiNotesEdit(this)"'), 'reminder tap edits in place');

const visStart = html.indexOf('// remi notes vis1 v=remi-notes-vis1');
const visEnd = html.indexOf('// end remi notes vis1 v=remi-notes-vis1');
const src = html.slice(visStart, visEnd);
assert.ok(!src.includes('>Open thread<'), 'office notes never paint Open thread');
assert.ok(!src.includes("showTab('aidechat')"), 'notes slice does not open Messages');
assert.ok(!src.includes('copilotClose()'), 'notes slice does not close Remi');
assert.ok(!src.includes('aideOfficeVis1OpenAide'), 'notes slice does not open an office thread');
assert.ok(!src.includes('remiOpenThread1Desk'), 'notes slice does not jump to the Messages desk');
assert.ok(src.includes('Notes stay here'), 'pane chip');
assert.ok(src.includes('remi_edit_my_note') && src.includes('remi_delete_my_note') && src.includes('remi_save_my_note'), 'edit delete save stay');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');

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
  sandbox.aideOfficeVis1OpenAide = function(aide, thread){
    calls.push('open:'+aide+':'+thread);
    return Promise.resolve({id:thread||aide});
  };
  sandbox.remiNotesShow = function(){
    calls.push('notes-tab');
    sandbox.copilotView = 'notes';
  };
  return calls;
}

(async function unit(){
  const sandbox = runSlice();
  const shell = sandbox.remiNotesVis1Html();
  assert.ok(shell.includes('data-remi-notes-stay1b="v=remi-notes-stay1b"'), shell);
  assert.ok(shell.includes('>My notes<') && shell.includes('>Scheduler notes<'), shell);

  const linked = sandbox.remiNotesVis1CardHtml({
    id:'note-sara',
    body:'Sara — confirm Tue start',
    aide_id:'sara-id',
    thread_id:'t-sara',
    updates:[]
  }, 'my', true);
  assert.ok(!linked.includes('Open thread'), linked);
  assert.ok(linked.includes('>Edit<') && linked.includes('>Delete<'), linked);
  assert.ok(linked.includes("onclick=\"remiNotesStay1bOpen('note-sara')\""), linked);

  const plain = sandbox.remiNotesVis1CardHtml({id:'note-plain', body:'Devon pay hold — check Monday.', updates:[]}, 'my', true);
  assert.ok(!plain.includes('Open thread'), plain);
  assert.ok(plain.includes("onclick=\"remiNotesStay1bOpen('note-plain')\""), plain);

  sandbox.currentAdminRole = 'Scheduler';
  sandbox.remiNotesVis1Which = 'my';
  const schedMine = sandbox.remiNotesVis1CardHtml({id:'note-jaz', body:'Jaz: check Wed open before blast.', updates:[]}, 'my', true);
  assert.ok(!schedMine.includes('Open thread'), schedMine);
  assert.ok(schedMine.includes('>Edit<') && schedMine.includes('>Delete<'), schedMine);
  assert.strictEqual(sandbox.remiNotesVis1Hint(), 'Your notes only');

  sandbox.currentAdminRole = 'Admin';
  sandbox.remiNotesVis1Which = 'scheduler';
  const schedTab = sandbox.remiNotesVis1CardHtml({
    id:'note-sched',
    body:'Maria said yes.',
    author_display_name:'Jazmine (Scheduler)',
    aide_id:'sara-id',
    updates:[]
  }, 'scheduler', true);
  assert.ok(!schedTab.includes('Open thread'), schedTab);
  assert.ok(schedTab.includes('Update note'), schedTab);
  assert.ok(!schedTab.includes('>Edit<'), 'scheduler notes tab keeps Update note');

  sandbox.remiNotesVis1Which = 'my';
  const pane = sandbox.remiNotesVis1PaneHtml([
    {id:'note-sara', body:'Sara — confirm Tue start', aide_id:'sara-id', thread_id:'t-sara', updates:[]},
    {id:'note-plain', body:'Devon pay hold — check Monday.', updates:[]}
  ], '');
  assert.strictEqual(pane.split('>Open thread<').length - 1, 0, pane);
  assert.ok(pane.includes('Notes stay here'), pane);
  assert.ok(pane.includes('>Edit<') && pane.includes('>Delete<') && pane.includes('>Save<'), pane);

  sandbox.remiNotesVis1Which = 'my';
  sandbox.remiNotesVis1Cache = [
    {id:'note-plain', body:'Devon pay hold — check Monday.'},
    {id:'note-sara', body:'Sara — confirm Tue start', aide_id:'sara-id', thread_id:'t-sara'}
  ];
  sandbox.remiNotesVis1RowsCache = sandbox.remiNotesVis1Cache.slice();
  const calls = wire(sandbox);

  let got = await sandbox.remiNotesVis1OpenThread('note-plain');
  assert.strictEqual(got.linked, false);
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(sandbox.remiNotesVis1EditId, 'note-plain');
  assert.strictEqual(calls.length, 0, 'unlinked tap does not navigate');
  assert.strictEqual(sandbox.copilotView, 'notes');

  calls.length = 0;
  got = await sandbox.remiNotesVis1OpenThread('note-sara');
  assert.strictEqual(got.linked, true);
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(got.aideId, 'sara-id');
  assert.strictEqual(sandbox.remiNotesVis1EditId, 'note-sara');
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c==='desk'||c.indexOf('open:')===0;}), calls.join(','));

  got = sandbox.remiNotesStay1bOpen('note-plain');
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(got.detail, true);
  assert.strictEqual(sandbox.copilotView, 'notes');

  sandbox.currentAdminRole = 'Scheduler';
  sandbox.remiNotesVis1Which = 'my';
  sandbox.remiNotesVis1EditId = '';
  got = sandbox.remiNotesStay1bOpen('note-sara');
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(got.linked, true);
  assert.strictEqual(sandbox.remiNotesVis1EditId, 'note-sara');
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c.indexOf('open:')===0;}), calls.join(','));

  sandbox.currentAdminRole = 'Admin';
  sandbox.remiNotesVis1Which = 'scheduler';
  sandbox.remiNotesVis1EditId = '';
  got = sandbox.remiNotesStay1bOpen('note-sara');
  assert.strictEqual(got.stayed, true);
  assert.strictEqual(sandbox.remiNotesVis1DetailId, 'note-sara');
  assert.strictEqual(sandbox.remiNotesVis1EditId, '', 'scheduler notes tab does not switch to My notes edit');

  sandbox.currentAdminRole = 'Nurse';
  calls.length = 0;
  const denied = await sandbox.remiNotesVis1OpenThread('note-sara');
  assert.strictEqual(denied.forbidden, true);
  assert.strictEqual(calls.length, 0);

  sandbox.currentAdminRole = 'Admin';
  sandbox.remiNotesVis1Which = 'my';
  sandbox.remiNotesVis1ThreadId = '';
  sandbox.remiNotesVis1EditId = 'note-plain';
  const input = {value:'Devon pay hold — check Monday. Also ping payroll.'};
  const host = {innerHTML:''};
  sandbox.document = {getElementById:function(id){
    if(id==='remiNotesVisEdit')return input;
    if(id==='remiNotesVisPane')return host;
    if(id==='copilotSheet')return {hidden:false};
    return null;
  }};
  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='remi_edit_my_note')return {ok:true, data:{success:true, note:{id:body.p_note_id, body:body.p_body, updates:[]}}};
    if(name==='remi_list_my_notes')return {ok:true, data:{notes:[{id:'note-plain', body:body.p_body, updates:[]}]}};
    if(name==='remi_save_my_note')return {ok:true, data:{success:true, note:{id:'note-new', body:body.p_body, updates:[]}}};
    return {ok:false, error:'unexpected '+name};
  };
  calls.length = 0;
  const edited = await sandbox.remiNotesVis1SaveEdit('note-plain');
  assert.strictEqual(edited.ok, true);
  assert.strictEqual(rpc[0].name, 'remi_edit_my_note');
  assert.strictEqual(rpc[1].name, 'remi_list_my_notes');
  assert.strictEqual(sandbox.copilotView, 'notes');
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat'||c.indexOf('open:')===0;}), calls.join(','));
  assert.ok(host.innerHTML.indexOf('Open thread')<0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Notes stay here')>=0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('>Edit<')>=0 && host.innerHTML.indexOf('>Delete<')>=0, host.innerHTML);

  const composer = {value:'Keep Bowlax CM quiet until Maria confirms.'};
  const sheet = {hidden:true};
  sandbox.document = {getElementById:function(id){
    if(id==='remiNotesVisInput')return composer;
    if(id==='remiNotesVisPane')return host;
    if(id==='copilotSheet')return sheet;
    return null;
  }};
  rpc.length = 0;
  calls.length = 0;
  const saved = await sandbox.remiNotesVis1Save();
  assert.strictEqual(saved.ok, true);
  assert.strictEqual(rpc[0].name, 'remi_save_my_note');
  assert.strictEqual(sandbox.copilotView, 'notes');
  assert.strictEqual(sheet.hidden, false, 'save reopens the Remi sheet if it was hidden');
  assert.ok(!calls.some(function(c){return c==='close'||c==='tab:aidechat';}), calls.join(','));

  console.log('admin-remi-notes-stay1b unit ok');
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
    if(name==='remi_save_my_note'){
      var saved = {id:'note-saved', body:body&&body.p_body, updates:[]};
      window.__pack.my = window.__pack.my.concat([saved]);
      return {ok:true, data:{success:true, note:saved}};
    }
    if(name==='remi_edit_my_note'){
      window.__pack.my = window.__pack.my.map(function(note){
        if(note.id===body.p_note_id)note.body = body.p_body;
        return note;
      });
      return {ok:true, data:{success:true, note:{id:body.p_note_id, body:body.p_body, updates:[]}}};
    }
    if(name==='admin_get_aide_office_unread_badge')return {ok:true, data:{unread_threads:0, unread_messages:0, deep_link_base:'admin/messages'}};
    if(name==='admin_list_due_aide_office_alerts')return {ok:true, data:{alerts:[], deep_link_base:'admin/messages'}};
    if(name==='admin_list_aide_office_threads')return {ok:true, data:{threads:[]}};
    if(name==='admin_get_aide_chat_remi_settings')return {ok:true, data:{enabled:false, start_local:'14:00', end_local:'08:00'}};
    if(name==='admin_list_radar_signals')return {ok:true, data:{signals:[]}};
    if(name==='admin_get_quiet_hours')return {ok:true, data:{enabled:false, start_local:'20:00', end_local:'07:00', timezone:'America/New_York'}};
    return {ok:true, data:{success:true}};
  };
}

async function boot(page, role, email){
  await page.evaluate(installStub, {
    my: [
      {id:'note-plain', body:'Devon pay hold — check Monday.', updates:[]},
      {id:'note-sara', body:'Sara — confirm Tue start', aide_id:'sara-id', thread_id:'t-sara', updates:[]}
    ],
    sched: [
      {id:'note-sched', author_display_name:'Jazmine (Scheduler)', body:'Maria said yes.', aide_id:'sara-id', updates:[]}
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
  }, role, email);
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-notes-stay1b browser skipped (no puppeteer-core)');
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
    console.log('admin-remi-notes-stay1b browser skipped ('+String(err&&err.message||err)+')');
    return;
  }
  const errors = [];
  try{
    const phone = await browser.newPage();
    phone.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await phone.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await phone.goto('http://127.0.0.1:'+port+'/index.html?v=remi-notes-stay1b', {waitUntil:'domcontentloaded', timeout:60000});
    await boot(phone, 'Admin', 'admin@roles.evercare.local');
    await phone.evaluate(async function(){
      remiNotesShow();
      await remiNotesVis1Load();
      remiNotesFromAsk('remind me in 10mins — call payroll.');
    });
    const list = await phone.evaluate(function(){
      var root = document.getElementById('remiNotesVis1');
      var keep = document.getElementById('remiNotes1Keep');
      var plain = document.querySelector('#remiNotesVis1 [data-note-id="note-plain"]');
      var linked = document.querySelector('#remiNotesVis1 [data-note-id="note-sara"]');
      var schedTab = document.getElementById('tab_schedule');
      var chat = document.getElementById('tab_aidechat');
      return {
        chip: root ? (root.querySelector('.remi-stay-chip')||{}).textContent || '' : '',
        openCount: root ? root.textContent.split('Open thread').length - 1 : -1,
        keepOpen: keep ? keep.textContent.indexOf('Open thread') : -1,
        plainEdit: plain ? !!plain.querySelector('button.edit') : false,
        plainDelete: plain ? !!plain.querySelector('button.del') : false,
        linkedOpen: linked ? linked.textContent.indexOf('Open thread') : -1,
        scheduleActive: !!(schedTab && schedTab.classList.contains('active')),
        chatActive: !!(chat && chat.classList.contains('active')),
        sheetHidden: document.getElementById('copilotSheet') ? !!document.getElementById('copilotSheet').hidden : true,
        firstMeta: document.querySelector('meta[name="admin-build"]').content
      };
    });
    assert.ok(list.chip.indexOf('Notes stay here')>=0, list.chip);
    assert.strictEqual(list.openCount, 0, 'My notes have no Open thread');
    assert.ok(list.keepOpen<0, 'reminders have no Open thread');
    assert.strictEqual(list.plainEdit, true);
    assert.strictEqual(list.plainDelete, true);
    assert.ok(list.linkedOpen<0, 'linked note has no Open thread');
    assert.strictEqual(list.scheduleActive, true);
    assert.strictEqual(list.chatActive, false);
    assert.strictEqual(list.sheetHidden, false);
    assert.strictEqual(list.firstMeta, '2026-09-27-remi-float-hide1b');

    await phone.click('#remiNotes1Keep button.note-title');
    const reminder = await phone.evaluate(function(){
      var input = document.getElementById('remiNotesEditInput');
      var chat = document.getElementById('tab_aidechat');
      var sheet = document.getElementById('copilotSheet');
      var keep = document.getElementById('remiNotes1Keep');
      return {
        editing: !!(input && String(input.value||'').trim()),
        inputVal: input ? input.value : '',
        keepText: keep ? keep.textContent.slice(0, 180) : '',
        chatActive: !!(chat && chat.classList.contains('active')),
        sheetHidden: sheet ? !!sheet.hidden : true,
        view: copilotView,
        openThread: keep ? keep.textContent.indexOf('Open thread') : -1
      };
    });
    assert.strictEqual(reminder.editing, true, 'reminder tap edits in the Remi room '+JSON.stringify(reminder));
    assert.strictEqual(reminder.chatActive, false);
    assert.strictEqual(reminder.sheetHidden, false);
    assert.strictEqual(reminder.view, 'notes');
    assert.ok(reminder.openThread<0);
    await phone.evaluate(function(){remiNotesEditing=''; remiNotesPaint();});

    await phone.click('#remiNotesVis1 [data-note-id="note-sara"] .remi-stay-body');
    const detail = await phone.evaluate(function(){
      var edit = document.getElementById('remiNotesVisEdit');
      var chat = document.getElementById('tab_aidechat');
      var sheet = document.getElementById('copilotSheet');
      return {
        value: edit ? edit.value : '',
        save: !!document.querySelector('#remiNotesVis1 .remi-crud-edit button.go'),
        cancel: !!document.querySelector('#remiNotesVis1 .remi-crud-edit button.alt'),
        chatActive: !!(chat && chat.classList.contains('active')),
        sheetHidden: sheet ? !!sheet.hidden : true,
        view: copilotView,
        openThread: document.getElementById('remiNotesVis1').textContent.indexOf('Open thread')
      };
    });
    assert.ok(detail.value.indexOf('Sara — confirm Tue start')>=0, detail.value);
    assert.strictEqual(detail.save, true);
    assert.strictEqual(detail.cancel, true);
    assert.strictEqual(detail.chatActive, false);
    assert.strictEqual(detail.sheetHidden, false);
    assert.strictEqual(detail.view, 'notes');
    assert.ok(detail.openThread<0);

    await phone.evaluate(function(){
      var edit = document.getElementById('remiNotesVisEdit');
      edit.value = 'Sara — confirm Tue start. Already in Messages.';
    });
    await phone.click('#remiNotesVis1 .remi-crud-edit button.go');
    await phone.waitForFunction(function(){
      var card = document.querySelector('#remiNotesVis1 [data-note-id="note-sara"]');
      return card && card.textContent.indexOf('Already in Messages')>=0 && !document.getElementById('remiNotesVisEdit');
    }, {timeout:8000});
    const afterSave = await phone.evaluate(function(){
      var chat = document.getElementById('tab_aidechat');
      var sheet = document.getElementById('copilotSheet');
      var card = document.querySelector('#remiNotesVis1 [data-note-id="note-sara"]');
      return {
        chatActive: !!(chat && chat.classList.contains('active')),
        sheetHidden: sheet ? !!sheet.hidden : true,
        view: copilotView,
        openThread: card ? card.textContent.indexOf('Open thread') : -1,
        edit: card ? !!card.querySelector('button.edit') : false,
        names: (window.__calls||[]).map(function(c){return c.name;})
      };
    });
    assert.strictEqual(afterSave.chatActive, false, 'save does not hop to Messages');
    assert.strictEqual(afterSave.sheetHidden, false, 'save stays in Remi');
    assert.strictEqual(afterSave.view, 'notes');
    assert.ok(afterSave.openThread<0, 'saved linked note still has no Open thread');
    assert.strictEqual(afterSave.edit, true);
    assert.ok(afterSave.names.indexOf('remi_edit_my_note')>=0, afterSave.names.join(','));

    await phone.evaluate(async function(){
      currentAdminRole = 'Scheduler';
      if(typeof layoutA1ApplyRoles==='function')layoutA1ApplyRoles();
      remiNotesVis1ResetTab();
      remiNotesShow();
      await remiNotesVis1Load();
    });
    const sched = await phone.evaluate(function(){
      var tab = document.getElementById('remiNotesVisSched');
      var root = document.getElementById('remiNotesVis1');
      return {
        hidden: tab ? !!tab.hidden : true,
        hint: document.getElementById('remiNotesVisHint') ? document.getElementById('remiNotesVisHint').textContent : '',
        openThread: root ? root.textContent.indexOf('Open thread') : -1,
        chip: root && root.querySelector('.remi-stay-chip') ? root.querySelector('.remi-stay-chip').textContent : ''
      };
    });
    assert.strictEqual(sched.hidden, true, 'scheduler has no Scheduler notes tab');
    assert.strictEqual(sched.hint, 'Your notes only');
    assert.ok(sched.openThread<0);
    assert.ok(sched.chip.indexOf('Notes stay here')>=0, sched.chip);
    await phone.click('#remiNotesVis1 [data-note-id="note-plain"] .remi-stay-body');
    const schedDetail = await phone.evaluate(function(){
      return {
        editing: !!document.getElementById('remiNotesVisEdit'),
        chat: !!(document.getElementById('tab_aidechat') && document.getElementById('tab_aidechat').classList.contains('active')),
        sheet: document.getElementById('copilotSheet') ? !!document.getElementById('copilotSheet').hidden : true
      };
    });
    assert.strictEqual(schedDetail.editing, true);
    assert.strictEqual(schedDetail.chat, false);
    assert.strictEqual(schedDetail.sheet, false);

    await phone.evaluate(async function(){
      currentAdminRole = 'Admin';
      if(typeof layoutA1ApplyRoles==='function')layoutA1ApplyRoles();
      remiNotesVis1ResetTab();
      remiNotesShow();
      await remiNotesVis1Load();
      remiNotesVis1Tab('scheduler');
      await remiNotesVis1Load();
    });
    const adminSched = await phone.evaluate(function(){
      var card = document.querySelector('#remiNotesVis1 [data-note-id="note-sched"]');
      return {
        text: card ? card.textContent : '',
        update: card ? !!card.querySelector('button.go') : false
      };
    });
    assert.ok(adminSched.text.indexOf('Open thread')<0, adminSched.text);
    assert.ok(adminSched.text.indexOf('Maria said yes')>=0, adminSched.text);
    assert.strictEqual(adminSched.update, true);
    await phone.click('#remiNotesVis1 [data-note-id="note-sched"] .remi-stay-body');
    const schedStay = await phone.evaluate(function(){
      var card = document.querySelector('#remiNotesVis1 [data-note-id="note-sched"]');
      return {
        ring: card ? card.className.indexOf('is-ring')>=0 : false,
        chat: !!(document.getElementById('tab_aidechat') && document.getElementById('tab_aidechat').classList.contains('active')),
        sheetHidden: document.getElementById('copilotSheet') ? !!document.getElementById('copilotSheet').hidden : true,
        reply: !!document.getElementById('remiVisReply_note-sched')
      };
    });
    assert.strictEqual(schedStay.ring, true, 'scheduler note detail stays in the card');
    assert.strictEqual(schedStay.reply, true);
    assert.strictEqual(schedStay.chat, false);
    assert.strictEqual(schedStay.sheetHidden, false);

    assert.strictEqual(errors.length, 0, errors.join('\n'));
    console.log('admin-remi-notes-stay1b browser ok');
  }finally{
    if(browser)await browser.close();
    server.close();
  }
}
