#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('v=remi-rail-crud1'), 'remi-rail-crud1 marker');
assert.ok(html.includes('data-remi-rail-crud1="v=remi-rail-crud1"'), 'sheet paints the marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-remi-rail-crud1">'), 'crud meta');
assert.ok(html.includes('<!-- remi rail crud 2026-09-29 v=remi-rail-crud1'), 'crud comment');
assert.ok(html.includes("var REMI_RAIL_CRUD1_MARKER='v=remi-rail-crud1'"), 'script marker');
assert.ok(html.includes('Ace CALLABLE LIVE'), 'ace callable live');
assert.ok(html.includes('MERGE HOLD'), 'merge hold');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(html.includes('remi_edit_my_note') && html.includes('remi_delete_my_note'), 'my note edit and delete rpcs');
assert.ok(html.includes('admin_delete_remi_rule'), 'rule delete rpc');
assert.ok(html.includes('admin_delete_remi_scheduled_job'), 'scheduled delete rpc');
assert.ok(html.includes('admin_update_remi_rule'), 'rule update stays');
assert.ok(html.includes('admin_update_remi_scheduled_job'), 'scheduled update stays');
assert.ok(html.includes('remi_update_scheduler_note'), 'scheduler append path stays');
assert.ok(!html.includes('Admin My notes never appear here.'), 'old scheduler hint is gone');
assert.ok(html.includes("return 'Your notes only'"), 'scheduler hint is Your notes only');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(html.slice(html.indexOf('// remi notes vis1'), html.indexOf('// end remi sched1'))), 'no Auth reseal in this rail');

function slice(startMark, endMark){
  const start = html.indexOf(startMark);
  const end = html.indexOf(endMark);
  assert.ok(start > 0 && end > start, startMark);
  return html.slice(start, end);
}

const notesSrc = slice('// remi notes vis1 v=remi-notes-vis1', '// end remi notes vis1 v=remi-notes-vis1');
const rulesSrc = slice('// remi rules1 v=remi-rules1', '// end remi rules1 v=remi-rules1');
const schedSrc = slice('// remi sched1 v=remi-sched1', '// end remi sched1 v=remi-sched1');
assert.ok(!notesSrc.includes('remi_update_scheduler_note') || notesSrc.includes("remiNotesVis1Rpc('remi_update_scheduler_note'"), 'scheduler update stays the append rpc');
assert.ok(notesSrc.includes('remi_edit_my_note') && notesSrc.includes('remi_delete_my_note'), 'notes crud calls');
assert.ok(rulesSrc.includes('admin_delete_remi_rule') && rulesSrc.includes('admin_update_remi_rule'), 'rules keep update and add delete');
assert.ok(schedSrc.includes('admin_delete_remi_scheduled_job') && schedSrc.includes('remiSched1UpdateBody'), 'sched delete and full update body');
assert.ok(notesSrc.includes("return 'Your notes only'"), 'scheduler hint lives in the notes slice');

function run(){
  const sandbox = {currentAdminRole:'Admin', currentAdminUsername:'mo@evercare.test', copilotView:'notes', console:console};
  vm.createContext(sandbox);
  vm.runInContext(notesSrc + '\n' + rulesSrc + '\n' + schedSrc, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = run();
  sandbox.currentAdminRole = 'Scheduler';
  sandbox.remiNotesVis1ResetTab();
  assert.strictEqual(sandbox.remiNotesVis1Hint(), 'Your notes only');
  const schedCard = sandbox.remiNotesVis1CardHtml({id:'n-sched', body:'Maria said yes.', author_display_name:'Jazmine (Scheduler)'}, 'scheduler', true);
  assert.ok(schedCard.includes('Update note'), schedCard);
  assert.ok(!schedCard.includes('remiNotesVis1BeginEdit'), 'scheduler notes tab keeps the update path');
  assert.ok(!schedCard.includes('remi_edit_my_note'), schedCard);

  sandbox.currentAdminRole = 'Admin';
  sandbox.remiNotesVis1Which = 'my';
  sandbox.remiNotesVis1RowsCache = [{id:'n1', body:'Devon pay hold — check Monday.', updates:[]}];
  const mine = sandbox.remiNotesVis1PaneHtml(sandbox.remiNotesVis1RowsCache, '');
  assert.ok(mine.includes('>Edit<') && mine.includes('>Delete<'), mine);
  assert.ok(mine.includes('Devon pay hold'), mine);
  assert.ok(mine.includes('data-remi-rail-crud1="v=remi-rail-crud1"') || sandbox.remiNotesVis1Html().includes('data-remi-rail-crud1="v=remi-rail-crud1"'), 'notes root paints the marker');

  const host = {innerHTML:''};
  const els = {};
  const confirm = {hidden:true, text:'', detail:''};
  sandbox.document = {getElementById:function(id){
    if(id==='copilotBody')return host;
    if(id==='copilotTitle')return {textContent:''};
    if(id==='copilotSheet')return {hidden:false};
    if(id==='remiNotesVisPane')return host;
    if(id==='remiRailCrud1Confirm')return confirm;
    if(id==='remiRailCrud1ConfirmTitle')return {set textContent(v){confirm.text=v;}, get textContent(){return confirm.text;}};
    if(id==='remiRailCrud1ConfirmDetail')return {set textContent(v){confirm.detail=v;}, get textContent(){return confirm.detail;}};
    return els[id]||null;
  }};
  sandbox.copilotSyncTabs = function(){};
  sandbox.copilotHideConfirm = function(){};
  sandbox.remiNotesVis1EditId = '';
  sandbox.remiNotesVis1BeginEdit('n1');
  assert.ok(host.innerHTML.indexOf('id="remiNotesVisEdit"') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Cancel') >= 0 && host.innerHTML.indexOf('>Save<') >= 0, host.innerHTML);

  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='remi_edit_my_note')return {ok:true, data:{success:true, ok:true, marker:'remi-rail-crud1', v:'remi-rail-crud1', note:{id:body.p_note_id, body:body.p_body, updates:[]}}};
    if(name==='remi_delete_my_note')return {ok:true, data:{success:true, ok:true, deleted:true, note_id:body.p_note_id, marker:'remi-rail-crud1', v:'remi-rail-crud1'}};
    if(name==='remi_list_my_notes')return {ok:true, data:{notes:[{id:'n1', body:'Devon pay hold — check Monday. Also ping payroll.', updates:[]}]}};
    if(name==='remi_update_scheduler_note')return {ok:true, data:{success:true}};
    if(name==='admin_list_remi_rules')return {ok:true, data:{rules:sandbox.remiRules1Cache}};
    if(name==='admin_update_remi_rule')return {ok:true, data:{success:true}};
    if(name==='admin_delete_remi_rule')return {ok:true, data:{success:true, ok:true, rule_id:body.p_id, marker:'remi-rail-crud1', v:'remi-rail-crud1'}};
    if(name==='admin_list_remi_scheduled_jobs')return {ok:true, data:{jobs:sandbox.remiSched1Cache}};
    if(name==='admin_update_remi_scheduled_job')return {ok:true, data:{success:true}};
    if(name==='admin_delete_remi_scheduled_job')return {ok:true, data:{success:true, ok:true, job_id:body.p_id, marker:'remi-rail-crud1', v:'remi-rail-crud1'}};
    return {ok:false, error:'unexpected '+name};
  };
  els.remiNotesVisEdit = {value:'Devon pay hold — check Monday. Also ping payroll.'};
  rpc.length = 0;
  const edited = await sandbox.remiNotesVis1SaveEdit('n1');
  assert.strictEqual(edited.ok, true);
  assert.strictEqual(rpc[0].name, 'remi_edit_my_note');
  assert.strictEqual(rpc[0].body.p_note_id, 'n1');
  assert.strictEqual(rpc[0].body.p_body, 'Devon pay hold — check Monday. Also ping payroll.');
  assert.strictEqual(rpc[1].name, 'remi_list_my_notes');
  assert.ok(host.innerHTML.indexOf('>Edit<') >= 0, 'edit stays after save');

  rpc.length = 0;
  sandbox.remiNotesVis1RowsCache = [{id:'n1', body:'Devon pay hold — check Monday. Also ping payroll.', updates:[]}];
  sandbox.remiNotesVis1AskDelete('n1');
  assert.strictEqual(confirm.hidden, false);
  assert.strictEqual(confirm.text, 'Delete this note?');
  const deleted = await sandbox.remiRailCrud1Yes();
  assert.strictEqual(deleted.ok, true);
  assert.strictEqual(rpc[0].name, 'remi_delete_my_note');
  assert.strictEqual(rpc[0].body.p_note_id, 'n1');
  assert.strictEqual(confirm.hidden, true);

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  const nurseNote = await sandbox.remiNotesVis1Rpc('remi_edit_my_note', {p_note_id:'n1', p_body:'no'});
  assert.strictEqual(nurseNote.forbidden, true);
  assert.strictEqual(rpc.length, 0, 'nurse note edit does not call Ace');

  sandbox.currentAdminRole = 'Admin';
  sandbox.remiRules1Cache = [
    {id:'r1', title:'Bowlax cover order', body:'Always try Maria first.', is_on:true, sort_order:10},
    {id:'r2', title:'Quiet hours', body:"Don't nudge aides after 9:00 PM ET.", is_on:true, sort_order:20}
  ];
  sandbox.remiRules1Mode = 'list';
  sandbox.remiRules1Error = '';
  sandbox.copilotView = 'rules';
  sandbox.remiRules1Paint();
  assert.ok(host.innerHTML.indexOf('>Edit<') >= 0 && host.innerHTML.indexOf('>Delete<') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('>On<') >= 0, 'on off stays');
  sandbox.remiRules1Edit('r1');
  assert.ok(host.innerHTML.indexOf('id="remiRules1Title"') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Quiet hours') >= 0, 'other rules stay on the list');
  assert.ok(host.innerHTML.indexOf('>Save<') >= 0 && host.innerHTML.indexOf('Cancel') >= 0, host.innerHTML);

  rpc.length = 0;
  const toggled = await sandbox.remiRules1Toggle('r2', true);
  assert.strictEqual(toggled.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_update_remi_rule');
  assert.strictEqual(rpc[0].body.p_is_on, false);
  assert.ok(rpc[0].body.p_title == null, 'toggle still sends is_on only');

  rpc.length = 0;
  sandbox.remiRules1Mode = 'list';
  sandbox.remiRules1AskDelete('r1');
  assert.strictEqual(confirm.text, 'Delete this rule?');
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='admin_delete_remi_rule')return {ok:true, data:{success:true, ok:true, rule_id:body.p_id}};
    if(name==='admin_list_remi_rules')return {ok:true, data:{rules:[{id:'r2', title:'Quiet hours', body:'stay', is_on:true, sort_order:20}]}};
    return {ok:false, error:'unexpected '+name};
  };
  const ruleGone = await sandbox.remiRailCrud1Yes();
  assert.strictEqual(ruleGone.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_delete_remi_rule');
  assert.strictEqual(rpc[0].body.p_id, 'r1');
  assert.strictEqual(rpc[1].name, 'admin_list_remi_rules');

  sandbox.remiSched1Cache = [
    {id:'j1', title:'Missing hours report', weekday:'mon', local_time:'09:00', is_on:true, sort_order:10, job_key:'missing_hours_report', schedule_label:'Every Monday \u00B7 9:00 AM ET \u00B7 posts in Remi rail', timezone:'America/New_York', prompt_text:'every Monday at 9'},
    {id:'j2', title:'Hours nudge (aides)', weekday:'fri', local_time:'12:00', is_on:true, sort_order:20, schedule_label:'Every Friday \u00B7 12:00 PM ET \u00B7 Messages + push if Allowed'}
  ];
  sandbox.remiSched1EditId = '';
  sandbox.remiSched1DeleteId = '';
  sandbox.remiSched1Error = '';
  sandbox.copilotView = 'scheduled';
  sandbox.remiSched1Paint();
  assert.ok(host.innerHTML.indexOf('>Edit<') >= 0 && host.innerHTML.indexOf('>Delete<') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('>On<') >= 0, 'scheduled on off stays');
  assert.ok(host.innerHTML.indexOf('Change time') < 0, 'saved cards say Edit');

  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='admin_update_remi_scheduled_job')return {ok:true, data:{success:true}};
    if(name==='admin_delete_remi_scheduled_job')return {ok:true, data:{success:true, ok:true, job_id:body.p_id}};
    if(name==='admin_list_remi_scheduled_jobs')return {ok:true, data:{jobs:sandbox.remiSched1Cache.filter(function(job){return job.id!=='j1';})}};
    return {ok:false, error:'unexpected '+name};
  };
  rpc.length = 0;
  const off = await sandbox.remiSched1Toggle('j1', true);
  assert.strictEqual(off.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_update_remi_scheduled_job');
  assert.strictEqual(rpc[0].body.p_id, 'j1');
  assert.strictEqual(rpc[0].body.p_is_on, false);
  assert.strictEqual(rpc[0].body.p_title, 'Missing hours report');
  assert.strictEqual(rpc[0].body.p_weekday, 'mon');
  assert.strictEqual(rpc[0].body.p_local_time, '09:00');
  assert.strictEqual(rpc[0].body.p_timezone, 'America/New_York');
  assert.strictEqual(rpc[0].body.p_prompt_text, 'every Monday at 9');
  assert.ok(Object.prototype.hasOwnProperty.call(rpc[0].body, 'p_recurrence'));
  assert.ok(Object.prototype.hasOwnProperty.call(rpc[0].body, 'p_interval_days'));
  assert.ok(Object.prototype.hasOwnProperty.call(rpc[0].body, 'p_anchor_date'));
  assert.ok(Object.prototype.hasOwnProperty.call(rpc[0].body, 'p_range_prefs'));

  rpc.length = 0;
  sandbox.remiSched1AskDelete('j1');
  assert.strictEqual(confirm.text, 'Delete this scheduled job?');
  const jobGone = await sandbox.remiRailCrud1Yes();
  assert.strictEqual(jobGone.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_delete_remi_scheduled_job');
  assert.strictEqual(rpc[0].body.p_id, 'j1');
  assert.deepStrictEqual(Object.keys(rpc[0].body), ['p_id']);

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  const nurseJob = await sandbox.remiSched1Rpc('admin_delete_remi_scheduled_job', {p_id:'j2'});
  const nurseRule = await sandbox.remiRules1Rpc('admin_delete_remi_rule', {p_id:'r2'});
  assert.strictEqual(nurseJob.forbidden, true);
  assert.strictEqual(nurseRule.forbidden, true);
  assert.strictEqual(rpc.length, 0, 'nurse deletes do not call Ace');

  console.log('admin-remi-rail-crud1 unit ok');
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
    console.log('admin-remi-rail-crud1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_PACK_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
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
  let browser;
  try{
    browser = await puppeteer.launch({executablePath:chrome, headless:'new', args:['--no-sandbox','--disable-dev-shm-usage']});
  }catch(err){
    server.close();
    console.log('admin-remi-rail-crud1 browser skipped ('+err.message+')');
    return;
  }
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
      localStorage.setItem('admin_session', JSON.stringify({role:'Admin', username:'mo@evercare.test', name:'Mo', loginAt:Date.now()}));
    });
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-rail-crud1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.waitForSelector('#copilotFab', {timeout:10000});
    await page.evaluate(async function(){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      window.__notes = [{id:'n1', body:'Devon pay hold — check Monday.', created_at:'2026-09-29T12:40:00.000Z', updates:[]}];
      window.__rules = [
        {id:'r1', title:'Bowlax cover order', body:'Always try Maria first, then Devon, then open blast.', is_on:true, sort_order:10},
        {id:'r2', title:'Quiet hours', body:"Don't nudge aides after 9:00 PM ET.", is_on:false, sort_order:20}
      ];
      window.__jobs = [
        {id:'j1', title:'Missing hours report', weekday:'mon', local_time:'09:00', is_on:true, sort_order:10, schedule_label:'Every Monday \u00B7 9:00 AM ET \u00B7 posts in Remi rail', timezone:'America/New_York', prompt_text:'every Monday at 9'}
      ];
      window.__rpc = [];
      sbRestRpc = async function(name, body){
        window.__rpc.push({name:name, body:body});
        if(name==='remi_list_my_notes')return {ok:true, data:{notes:window.__notes}};
        if(name==='remi_list_scheduler_notes')return {ok:true, data:{notes:[{id:'s1', author_display_name:'Jazmine (Scheduler)', body:'Maria said yes.', updates:[]}]}};
        if(name==='remi_save_my_note'){
          window.__notes.unshift({id:'n2', body:body.p_body, updates:[]});
          return {ok:true, data:{note:window.__notes[0]}};
        }
        if(name==='remi_edit_my_note'){
          window.__notes.forEach(function(note){if(note.id===body.p_note_id)note.body=body.p_body;});
          return {ok:true, data:{note:{id:body.p_note_id, body:body.p_body, updates:[]}}};
        }
        if(name==='remi_delete_my_note'){
          window.__notes = window.__notes.filter(function(note){return note.id!==body.p_note_id;});
          return {ok:true, data:{success:true, deleted:true, note_id:body.p_note_id}};
        }
        if(name==='remi_update_scheduler_note')return {ok:true, data:{success:true}};
        if(name==='admin_list_remi_rules')return {ok:true, data:{rules:window.__rules}};
        if(name==='admin_update_remi_rule'){
          window.__rules.forEach(function(rule){
            if(rule.id!==body.p_id)return;
            if(body.p_is_on!=null)rule.is_on = body.p_is_on;
            if(body.p_title!=null)rule.title = body.p_title;
            if(body.p_body!=null)rule.body = body.p_body;
          });
          return {ok:true, data:{success:true}};
        }
        if(name==='admin_delete_remi_rule'){
          window.__rules = window.__rules.filter(function(rule){return rule.id!==body.p_id;});
          return {ok:true, data:{success:true, rule_id:body.p_id}};
        }
        if(name==='admin_list_remi_scheduled_jobs')return {ok:true, data:{jobs:window.__jobs}};
        if(name==='admin_update_remi_scheduled_job')return {ok:true, data:{success:true}};
        if(name==='admin_delete_remi_scheduled_job'){
          window.__jobs = window.__jobs.filter(function(job){return job.id!==body.p_id;});
          return {ok:true, data:{success:true, job_id:body.p_id}};
        }
        return {ok:false, error:'unexpected '+name};
      };
      remiNotesShow();
      await remiNotesVis1Load();
    });
    const notes = await page.evaluate(function(){
      var root = document.getElementById('remiNotesVis1');
      return {text:root.innerText, marker:root.getAttribute('data-remi-rail-crud1'), edit:root.innerHTML.indexOf('>Edit<') >= 0, del:root.innerHTML.indexOf('>Delete<') >= 0};
    });
    assert.strictEqual(notes.marker, 'v=remi-rail-crud1');
    assert.strictEqual(notes.edit, true);
    assert.strictEqual(notes.del, true);
    assert.ok(notes.text.indexOf('Devon pay hold') >= 0, notes.text);
    await page.evaluate(function(){remiNotesVis1BeginEdit('n1');});
    await page.waitForSelector('#remiNotesVisEdit');
    const editing = await page.evaluate(function(){
      return {value:document.getElementById('remiNotesVisEdit').value, ring:!!document.querySelector('.remi-vis-card.is-ring')};
    });
    assert.ok(editing.value.indexOf('Devon pay hold') >= 0, editing.value);
    assert.strictEqual(editing.ring, true);
    await page.screenshot({path:path.join(shotDir, 'remi-rail-crud1-notes-editing.png')});
    await page.evaluate(function(){
      document.getElementById('remiNotesVisEdit').value = 'Devon pay hold — check Monday. Also ping payroll.';
    });
    await page.evaluate(function(){return remiNotesVis1SaveEdit('n1');});
    const savedEdit = await page.evaluate(function(){
      var hit = null;
      window.__rpc.forEach(function(row){if(row.name==='remi_edit_my_note')hit = row.body;});
      return {body:hit, text:document.getElementById('remiNotesVis1').innerText};
    });
    assert.strictEqual(savedEdit.body.p_note_id, 'n1');
    assert.ok(savedEdit.body.p_body.indexOf('Also ping payroll') >= 0, savedEdit.body.p_body);
    assert.ok(savedEdit.text.indexOf('Edit') >= 0 && savedEdit.text.indexOf('Delete') >= 0, savedEdit.text);

    await page.evaluate(function(){remiNotesVis1AskDelete('n1');});
    const asked = await page.evaluate(function(){
      var box = document.getElementById('remiRailCrud1Confirm');
      return {hidden:box.hidden, title:document.getElementById('remiRailCrud1ConfirmTitle').textContent};
    });
    assert.strictEqual(asked.hidden, false);
    assert.strictEqual(asked.title, 'Delete this note?');
    await page.screenshot({path:path.join(shotDir, 'remi-rail-crud1-notes-delete.png')});
    await page.evaluate(function(){return remiRailCrud1Yes();});
    const afterDelete = await page.evaluate(function(){
      var hit = null;
      window.__rpc.forEach(function(row){if(row.name==='remi_delete_my_note')hit = row.body;});
      return {body:hit, text:document.getElementById('copilotBody').innerText, hidden:document.getElementById('remiRailCrud1Confirm').hidden};
    });
    assert.strictEqual(afterDelete.body.p_note_id, 'n1');
    assert.ok(afterDelete.text.indexOf('Devon pay hold') < 0, afterDelete.text);
    assert.strictEqual(afterDelete.hidden, true);

    await page.click('#remiNotesVisSched');
    await page.waitForFunction(function(){return document.body.innerText.indexOf('Update note') >= 0;});
    const schedTab = await page.evaluate(function(){
      var root = document.getElementById('remiNotesVis1');
      return {text:root.innerText, editRpc:window.__rpc.some(function(row){return row.name==='remi_edit_my_note' && row.body && row.body.p_note_id==='s1';})};
    });
    assert.ok(schedTab.text.indexOf('Update note') >= 0, schedTab.text);
    assert.ok(schedTab.text.indexOf('Jazmine') >= 0, schedTab.text);
    assert.strictEqual(schedTab.editRpc, false);

    await page.evaluate(async function(){
      currentAdminRole = 'Scheduler';
      window.__notes = [{id:'n-jaz', body:'Maria said yes to 9 AM tomorrow.', updates:[]}];
      remiNotesVis1ResetTab();
      remiNotesShow();
      await remiNotesVis1Load();
    });
    const schedRole = await page.evaluate(function(){
      return document.getElementById('remiNotesVis1').innerText;
    });
    assert.ok(schedRole.indexOf('Your notes only') >= 0, schedRole);
    assert.ok(schedRole.indexOf('Admin') < 0, schedRole);
    assert.ok(schedRole.indexOf('Edit') >= 0 && schedRole.indexOf('Delete') >= 0, schedRole);

    await page.evaluate(async function(){
      currentAdminRole = 'Admin';
      remiRules1Show();
      await remiRules1Load();
    });
    await page.evaluate(function(){remiRules1Edit('r1');});
    const ruleEdit = await page.evaluate(function(){
      return {title:document.getElementById('remiRules1Title').value, text:document.getElementById('copilotBody').innerText};
    });
    assert.strictEqual(ruleEdit.title, 'Bowlax cover order');
    assert.ok(ruleEdit.text.indexOf('Quiet hours') >= 0, ruleEdit.text);
    assert.ok(ruleEdit.text.indexOf('Off') >= 0, ruleEdit.text);
    await page.screenshot({path:path.join(shotDir, 'remi-rail-crud1-rules-editing.png')});
    await page.evaluate(function(){return remiRules1Toggle('r2', false);});
    await page.evaluate(function(){remiRules1AskDelete('r1');});
    const ruleAsk = await page.evaluate(function(){
      return document.getElementById('remiRailCrud1ConfirmTitle').textContent;
    });
    assert.strictEqual(ruleAsk, 'Delete this rule?');
    await page.evaluate(function(){return remiRailCrud1Yes();});
    const ruleGone = await page.evaluate(function(){
      var hit = null;
      window.__rpc.forEach(function(row){if(row.name==='admin_delete_remi_rule')hit = row.body;});
      var toggled = null;
      window.__rpc.forEach(function(row){if(row.name==='admin_update_remi_rule' && row.body.p_id==='r2')toggled = row.body;});
      return {hit:hit, toggled:toggled, text:document.getElementById('copilotBody').innerText};
    });
    assert.strictEqual(ruleGone.hit.p_id, 'r1');
    assert.strictEqual(ruleGone.toggled.p_is_on, true);
    assert.ok(ruleGone.text.indexOf('Bowlax cover order') < 0, ruleGone.text);
    assert.ok(ruleGone.text.indexOf('Quiet hours') >= 0, ruleGone.text);

    await page.evaluate(async function(){
      remiSched1Show();
      await remiSched1Load();
    });
    const schedList = await page.evaluate(function(){
      return document.getElementById('remiSched1').innerText;
    });
    assert.ok(schedList.indexOf('Missing hours report') >= 0, schedList);
    assert.ok(schedList.indexOf('Edit') >= 0 && schedList.indexOf('Delete') >= 0, schedList);
    assert.ok(schedList.indexOf('On') >= 0, schedList);
    await page.evaluate(function(){remiSched1BeginEdit('j1');});
    await page.waitForSelector('#remiSched1JobTitle');
    await page.screenshot({path:path.join(shotDir, 'remi-rail-crud1-sched-editing.png')});
    await page.evaluate(function(){return remiSched1Toggle('j1', true);});
    const toggledJob = await page.evaluate(function(){
      var hit = null;
      for(var i=window.__rpc.length-1;i>=0;i--)if(window.__rpc[i].name==='admin_update_remi_scheduled_job'){hit = window.__rpc[i].body; break;}
      return hit;
    });
    assert.strictEqual(toggledJob.p_is_on, false);
    assert.strictEqual(toggledJob.p_title, 'Missing hours report');
    assert.ok(Object.prototype.hasOwnProperty.call(toggledJob, 'p_recurrence'));
    await page.evaluate(function(){remiSched1AskDelete('j1');});
    const jobAsk = await page.evaluate(function(){return document.getElementById('remiRailCrud1ConfirmTitle').textContent;});
    assert.strictEqual(jobAsk, 'Delete this scheduled job?');
    await page.screenshot({path:path.join(shotDir, 'remi-rail-crud1-sched-delete.png')});
    await page.evaluate(function(){return remiRailCrud1Yes();});
    const jobGone = await page.evaluate(function(){
      var hit = null;
      window.__rpc.forEach(function(row){if(row.name==='admin_delete_remi_scheduled_job')hit = row.body;});
      return {hit:hit, text:document.getElementById('copilotBody').innerText};
    });
    assert.strictEqual(jobGone.hit.p_id, 'j1');
    assert.ok(jobGone.text.indexOf('Missing hours report') < 0, jobGone.text);
    console.log('admin-remi-rail-crud1 browser ok');
  } finally {
    await browser.close();
    server.close();
  }
}
