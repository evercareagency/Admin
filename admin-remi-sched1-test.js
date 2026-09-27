#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-sched1'), 'remi-sched1 marker');
assert.ok(html.includes('data-remi-sched1="v=remi-sched1"'), 'remi-sched1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-sched1'), 'remi-sched1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-sched1">'), 'remi-sched1 meta');
assert.ok(html.includes('<!-- remi scheduled jobs 2026-09-27 v=remi-sched1 admin-build 2026-09-27-remi-sched1'), 'remi-sched1 comment');
assert.ok(html.includes("var REMI_SCHED1_MARKER='v=remi-sched1'"), 'remi-sched1 script marker');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-cover-card-cancel1'), 'first admin-build is remi-proof1');
assert.ok(html.indexOf('content="2026-09-27-remi-proof1"') < html.indexOf('content="2026-09-27-remi-sched1"'), 'this meta follows proof');
assert.ok(html.indexOf('content="2026-09-27-remi-sched1"') < html.indexOf('content="2026-09-27-remi-rules1"'), 'rules meta follows sched');
assert.ok(html.indexOf('content="2026-09-27-remi-rules1"') < html.indexOf('content="2026-09-27-remi-notes-vis1"'), 'notes vis meta follows rules');
assert.ok(html.indexOf('content="2026-09-27-remi-notes-vis1"') < html.indexOf('content="2026-09-27-vapid1"'), 'vapid1 stays after this pack');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-vapid1">'), 'vapid1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-clienthrs1d">'), 'clienthrs1d meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-cm-email1">'), 'remi-cm-email1 meta stays');
['v=remi-notes-vis1','v=remi-rules1','v=vapid1','v=clienthrs1d','v=remi-cm-email1','v=remiface1','v=remi-notes1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior or pack marker stays ' + mark);
});
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="copilotTabRadar"') && html.includes('id="copilotTabAsk"') && html.includes('id="copilotTabNotes"'), 'Radar Ask Notes stay');
assert.ok(html.includes('id="copilotTabSched"'), 'Scheduled tab in the rail');
assert.ok(!/sbRestRpc\(\s*['"]list_due_remi_scheduled_jobs['"]/.test(html), 'desk does not call list_due');
assert.ok(!/sbRestRpc\(\s*['"]admin_preview_remi_schedule_parse['"]/.test(html), 'no preview parse RPC');

const start = html.indexOf('// remi sched1 v=remi-sched1');
const end = html.indexOf('// end remi sched1 v=remi-sched1');
assert.ok(start > 0 && end > start, 'sched script block');
const src = html.slice(start, end);
assert.ok(src.includes('admin_list_remi_scheduled_jobs'), 'list rpc');
assert.ok(src.includes('admin_create_remi_scheduled_job'), 'create rpc');
assert.ok(src.includes('admin_update_remi_scheduled_job'), 'update rpc');
assert.ok(src.includes('is_scheduler_office'), 'is_scheduler_office path');
assert.ok(src.includes('sbRestRpc'), 'office JWT via sbRestRpc');
assert.ok(src.includes('list_due_remi_scheduled_jobs is a processor stub only'), 'list_due stays a stub comment');
assert.ok(!/sbRestRpc\(\s*['"]list_due_remi_scheduled_jobs['"]/.test(src), 'stub is not called');
assert.ok(!src.includes('admin_preview_remi_schedule_parse'), 'rail parses weekday and time');
assert.ok(src.includes('does not re-seed'), 'empty desk does not invent seeded clocks');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|send_sms/.test(src), 'no Quo or SMS');
assert.ok(src.includes('Nurse cannot use Remi schedules'), 'nurse writes refused');
assert.ok(src.includes('No Friday or Ace Grok runner'), 'clocks stay in Supabase');
assert.ok(!/new Function|functions\.invoke/.test(src), 'no clock runner');

const ASK = 'Hey Remi \u2014 every Monday at 9 give me the missing hours report.';
const JOBS = [
  {id:'j1', title:'Missing hours report', weekday:'mon', local_time:'09:00', is_on:true, sort_order:10, job_key:'missing_hours_report', schedule_label:'Every Monday \u00B7 9:00 AM ET \u00B7 posts in Remi rail'},
  {id:'j2', title:'Hours nudge (aides)', weekday:'fri', local_time:'12:00', is_on:true, sort_order:20, job_key:'hours_nudge', schedule_label:'Every Friday \u00B7 12:00 PM ET \u00B7 Messages + push if Allowed'},
  {id:'j3', title:'Manager digest', weekday:'fri', local_time:'14:00', is_on:true, sort_order:30, job_key:'manager_digest', schedule_label:'Every Friday \u00B7 2:00 PM ET \u00B7 who\u2019s still missing'}
];

function runSlice(){
  const sandbox = {currentAdminRole:'Admin', copilotView:'scheduled', console:console};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_SCHED1_MARKER, 'v=remi-sched1');
  assert.strictEqual(sandbox.REMI_SCHED1_OFFICE, 'is_scheduler_office');

  const parsed = sandbox.remiSched1Parse(ASK);
  assert.ok(parsed, 'monday 9 parses');
  assert.strictEqual(parsed.kind, 'missing_hours_report');
  assert.strictEqual(parsed.title, 'Missing hours report');
  assert.strictEqual(parsed.weekday, 'mon');
  assert.strictEqual(parsed.local_time, '09:00');
  assert.strictEqual(parsed.local_time_label, '9:00 AM');
  assert.strictEqual(parsed.timezone, 'America/New_York');
  const ask = sandbox.remiSched1FromAsk(ASK);
  assert.strictEqual(ask.sched.chip, 'New schedule');
  assert.strictEqual(ask.text, 'Got it. I\u2019ll post your missing-hours report every Monday at 9:00 AM ET in this rail.');
  const createdBody = sandbox.remiSched1CreateBody(ask.sched.draft);
  assert.strictEqual(createdBody.p_kind, 'missing_hours_report');
  assert.strictEqual(createdBody.p_title, 'Missing hours report');
  assert.strictEqual(createdBody.p_weekday, 'mon');
  assert.strictEqual(createdBody.p_local_time, '09:00');
  assert.strictEqual(createdBody.p_job_key, 'missing_hours_report');
  assert.strictEqual(createdBody.p_timezone, 'America/New_York');
  assert.strictEqual(createdBody.p_is_on, true);
  assert.strictEqual(createdBody.p_prompt_text, ASK);

  const noon = sandbox.remiSched1Parse('every Friday at noon hours nudge');
  assert.strictEqual(noon.kind, 'hours_nudge');
  assert.strictEqual(noon.weekday, 'fri');
  assert.strictEqual(noon.local_time, '12:00');
  assert.strictEqual(noon.title, 'Hours nudge (aides)');
  const digest = sandbox.remiSched1Parse('every Friday at 2pm manager digest');
  assert.strictEqual(digest.kind, 'manager_digest');
  assert.strictEqual(digest.weekday, 'fri');
  assert.strictEqual(digest.local_time, '14:00');
  assert.strictEqual(digest.local_time_label, '2:00 PM');
  const custom = sandbox.remiSched1Parse('every Friday at noon send the floor note');
  assert.strictEqual(custom.kind, 'custom');
  assert.strictEqual(custom.weekday, 'fri');
  assert.strictEqual(custom.local_time, '12:00');
  assert.ok(!Object.prototype.hasOwnProperty.call(sandbox.remiSched1CreateBody(custom), 'p_job_key'), 'custom omits job key');
  assert.strictEqual(sandbox.remiSched1Parse('remind me Monday at 9am'), null);
  assert.strictEqual(sandbox.remiSched1Parse('at 9 give me the missing hours report'), null);
  assert.strictEqual(sandbox.remiSched1FromAsk('remind me every Monday at 9'), null);

  const host = {innerHTML:''};
  const els = {};
  sandbox.document = {getElementById:function(id){
    if(id==='copilotBody')return host;
    if(id==='copilotTitle')return {textContent:''};
    if(id==='copilotSheet')return {hidden:true};
    return els[id] || null;
  }};
  sandbox.copilotSyncTabs = function(){};
  sandbox.copilotHideConfirm = function(){};
  sandbox.remiSched1Cache = [];
  sandbox.remiSched1Error = '';
  sandbox.remiSched1EditId = '';
  const emptyHtml = sandbox.remiSched1ListHtml();
  assert.ok(emptyHtml.indexOf('does not re-seed') >= 0, emptyHtml);
  assert.ok(emptyHtml.indexOf('Missing hours report') < 0, 'empty list does not paint seeded jobs');

  sandbox.remiSched1Cache = JOBS.slice();
  sandbox.remiSched1Paint();
  assert.ok(host.innerHTML.indexOf('Missing hours report') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Hours nudge (aides)') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Manager digest') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Every Monday \u00B7 9:00 AM ET \u00B7 posts in Remi rail') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Every Friday \u00B7 12:00 PM ET \u00B7 Messages + push if Allowed') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Every Friday \u00B7 2:00 PM ET \u00B7 who\u2019s still missing') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('>On<') >= 0, host.innerHTML);
  assert.strictEqual(sandbox.copilotView, 'scheduled');

  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='admin_list_remi_scheduled_jobs')return {ok:true, data:{success:true, jobs:JOBS}};
    if(name==='admin_create_remi_scheduled_job'){
      return {ok:true, data:{success:true, job:{id:'j9', title:body.p_title, weekday:body.p_weekday, local_time:body.p_local_time, is_on:true, schedule_label:'Every '+body.p_weekday+' \u00B7 '+body.p_local_time+' ET'}}};
    }
    if(name==='admin_update_remi_scheduled_job')return {ok:true, data:{success:true}};
    return {ok:false, error:'unexpected '+name};
  };
  rpc.length = 0;
  const listed = await sandbox.remiSched1Load();
  assert.strictEqual(listed.ok, true);
  assert.deepStrictEqual(rpc.map(function(row){return row.name;}), ['admin_list_remi_scheduled_jobs']);
  assert.strictEqual(sandbox.remiSched1Cache.length, 3);

  rpc.length = 0;
  sandbox.copilotChat = [{role:'remi', text:'', sched:{chip:'New schedule', editing:true, sent:false, draft:{
    kind:'missing_hours_report', title:'Missing hours report', weekday:'mon', local_time:'09:00',
    timezone:'America/New_York', summary:'Every Monday \u00B7 9:00 AM ET \u00B7 posts in Remi rail', prompt_text:ASK
  }}}];
  sandbox.copilotView = 'chat';
  sandbox.copilotPaintChat = function(){};
  els.remiSched1Week = {value:'fri'};
  els.remiSched1Clock = {value:'14:00'};
  const confirmed = await sandbox.remiSched1Confirm(0);
  assert.strictEqual(confirmed.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_create_remi_scheduled_job');
  assert.strictEqual(rpc[0].body.p_weekday, 'fri');
  assert.strictEqual(rpc[0].body.p_local_time, '14:00');
  assert.strictEqual(rpc[0].body.p_kind, 'missing_hours_report');
  assert.strictEqual(rpc[0].body.p_job_key, 'missing_hours_report');
  assert.strictEqual(sandbox.copilotChat[0].sched.sent, true);
  assert.ok(rpc.every(function(row){return row.name !== 'list_due_remi_scheduled_jobs';}));

  rpc.length = 0;
  sandbox.copilotView = 'scheduled';
  const toggled = await sandbox.remiSched1Toggle('j1', true);
  assert.strictEqual(toggled.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_update_remi_scheduled_job');
  assert.strictEqual(rpc[0].body.p_id, 'j1');
  assert.strictEqual(rpc[0].body.p_is_on, false);
  assert.ok(rpc[0].body.p_weekday == null && rpc[0].body.p_local_time == null, 'toggle sends is_on only');

  rpc.length = 0;
  sandbox.remiSched1BeginEdit('j2');
  els.remiSched1JobWeek = {value:'fri'};
  els.remiSched1JobClock = {value:'13:30'};
  const timed = await sandbox.remiSched1SaveTime('j2');
  assert.strictEqual(timed.ok, true);
  assert.strictEqual(rpc[0].body.p_id, 'j2');
  assert.strictEqual(rpc[0].body.p_weekday, 'fri');
  assert.strictEqual(rpc[0].body.p_local_time, '13:30');
  assert.ok(!Object.prototype.hasOwnProperty.call(rpc[0].body, 'p_is_on'), 'time change does not send is_on');

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  assert.strictEqual(sandbox.remiSched1FromAsk(ASK), null);
  const nurse = await sandbox.remiSched1Rpc('admin_create_remi_scheduled_job', {p_kind:'custom'});
  assert.strictEqual(nurse.forbidden, true);
  assert.strictEqual(rpc.length, 0, 'nurse write does not call Ace');
  sandbox.remiSched1Show();
  assert.strictEqual(rpc.length, 0, 'nurse scheduled tab does not list');

  console.log('admin-remi-sched1 unit ok');
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
    console.log('admin-remi-sched1 browser skipped (no puppeteer-core)');
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
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-sched1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.waitForSelector('#copilotFab', {timeout:10000});
    await page.evaluate(async function(){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      window.__jobs = [
        {id:'j1', title:'Missing hours report', weekday:'mon', local_time:'09:00', is_on:true, sort_order:10, schedule_label:'Every Monday \u00B7 9:00 AM ET \u00B7 posts in Remi rail'},
        {id:'j2', title:'Hours nudge (aides)', weekday:'fri', local_time:'12:00', is_on:true, sort_order:20, schedule_label:'Every Friday \u00B7 12:00 PM ET \u00B7 Messages + push if Allowed'},
        {id:'j3', title:'Manager digest', weekday:'fri', local_time:'14:00', is_on:true, sort_order:30, schedule_label:'Every Friday \u00B7 2:00 PM ET \u00B7 who\u2019s still missing'}
      ];
      window.__rpc = [];
      sbRestRpc = async function(name, body){
        window.__rpc.push({name:name, body:body});
        if(name==='admin_list_remi_scheduled_jobs')return {ok:true, data:{success:true, jobs:window.__jobs}};
        if(name==='admin_create_remi_scheduled_job'){
          return {ok:true, data:{success:true, confirm_chip:'New schedule', job:{
            id:'j9', title:body.p_title, weekday:body.p_weekday, local_time:body.p_local_time, is_on:true,
            schedule_label:'Every Monday \u00B7 9:00 AM ET \u00B7 posts in Remi rail'
          }}};
        }
        if(name==='admin_update_remi_scheduled_job')return {ok:true, data:{success:true}};
        return {ok:false, error:'unexpected '+name};
      };
      remiSched1Show();
      await remiSched1Load();
    });
    const view = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      var confirmNames = window.__rpc.map(function(row){return row.name;});
      return {
        text:document.getElementById('copilotBody').innerText,
        selected:document.getElementById('copilotTabSched').getAttribute('aria-selected'),
        viewW:window.innerWidth,
        sheetTop:box.top,
        sheetWidth:box.width,
        overflow:sheet.scrollWidth <= sheet.clientWidth + 2,
        names:confirmNames
      };
    });
    assert.strictEqual(view.viewW, 390);
    assert.strictEqual(view.selected, 'true');
    assert.ok(view.sheetTop >= 60, 'rail sheet '+view.sheetTop);
    assert.ok(view.sheetWidth <= view.viewW + 1);
    assert.strictEqual(view.overflow, true);
    assert.ok(view.text.indexOf('Missing hours report') >= 0, view.text);
    assert.ok(view.text.indexOf('Hours nudge (aides)') >= 0, view.text);
    assert.ok(view.text.indexOf('Manager digest') >= 0, view.text);
    assert.ok(view.text.indexOf('Every Monday') >= 0, view.text);
    assert.ok(view.names.indexOf('admin_create_remi_scheduled_job') < 0, 'opening Scheduled does not re-seed');
    assert.ok(view.names.indexOf('list_due_remi_scheduled_jobs') < 0, 'list_due stays off the desk');
    await page.screenshot({path:path.join(shotDir, 'remi-sched1-phone-list.png')});

    await page.evaluate(function(){
      copilotShowChat();
      document.getElementById('copilotChatInput').value = 'Hey Remi \u2014 every Monday at 9 give me the missing hours report.';
      copilotChatSubmit({preventDefault:function(){}});
    });
    const chip = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var go = document.getElementById('remiSched1Confirm');
      var change = document.getElementById('remiSched1Change');
      return {
        text:document.getElementById('copilotBody').innerText,
        ask:document.getElementById('copilotTabAsk').getAttribute('aria-selected'),
        confirmH:go ? go.getBoundingClientRect().height : 0,
        changeText:change ? change.textContent : '',
        overflow:sheet.scrollWidth <= sheet.clientWidth + 2
      };
    });
    assert.strictEqual(chip.ask, 'true');
    assert.ok(chip.text.indexOf('New schedule') >= 0, chip.text);
    assert.ok(chip.text.indexOf('Confirm') >= 0, chip.text);
    assert.ok(chip.text.indexOf('Change time') >= 0, chip.text);
    assert.ok(chip.text.indexOf('missing-hours report') >= 0, chip.text);
    assert.ok(chip.confirmH >= 44, 'confirm tap '+chip.confirmH);
    assert.strictEqual(chip.changeText, 'Change time');
    assert.strictEqual(chip.overflow, true);
    await page.screenshot({path:path.join(shotDir, 'remi-sched1-phone-confirm.png')});

    await page.click('#remiSched1Confirm');
    await page.waitForFunction(function(){
      return window.__rpc.some(function(row){return row.name==='admin_create_remi_scheduled_job';});
    });
    const saved = await page.evaluate(function(){
      var body = null;
      window.__rpc.forEach(function(row){
        if(row.name==='admin_create_remi_scheduled_job')body = row.body;
      });
      return {body:body, text:document.getElementById('copilotBody').innerText, names:window.__rpc.map(function(row){return row.name;})};
    });
    assert.ok(saved.body, 'confirm posts the job');
    assert.strictEqual(saved.body.p_kind, 'missing_hours_report');
    assert.strictEqual(saved.body.p_title, 'Missing hours report');
    assert.strictEqual(saved.body.p_weekday, 'mon');
    assert.strictEqual(saved.body.p_local_time, '09:00');
    assert.strictEqual(saved.body.p_job_key, 'missing_hours_report');
    assert.strictEqual(saved.body.p_timezone, 'America/New_York');
    assert.strictEqual(saved.body.p_is_on, true);
    assert.ok(saved.text.indexOf('Saved on Scheduled') >= 0, saved.text);
    assert.ok(saved.names.indexOf('list_due_remi_scheduled_jobs') < 0);
    assert.ok(saved.names.indexOf('admin_preview_remi_schedule_parse') < 0);
    console.log('admin-remi-sched1 browser ok');
  } finally {
    await browser.close();
    server.close();
  }
}
