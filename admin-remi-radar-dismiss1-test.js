#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + sig);
}

assert.ok(html.includes('v=remi-radar-dismiss1'), 'marker');
assert.ok(html.includes('?v=remi-radar-dismiss1'), 'pages cache bust');
assert.ok(html.includes('admin-build 2026-09-28-remi-radar-dismiss1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-remi-radar-dismiss1">'), 'meta');
assert.ok(html.includes("var REMI_RADAR_DISMISS1_MARKER='v=remi-radar-dismiss1'"), 'script marker');
assert.ok(html.includes("var REMI_RADAR_DISMISS1_BUILD='2026-09-28-remi-radar-dismiss1'"), 'script build');
assert.ok(html.includes('GHOST-REMI-RADAR-DISMISS1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('No Auth reseal') || html.includes('NO Auth reseal'), 'no auth reseal');
assert.ok(html.includes('data-remi-radar-dismiss1="v=remi-radar-dismiss1"'), 'sheet marker');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-radar-dismiss1-v1.sql')), 'no SQL patch');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
['v=remi-open-thread1','v=aide-profile-link-fix','v=eca-copilot1','v=remi-phone-rail1','v=aide-office-vis1','v=remi-float-hide1b','admin_ack_radar_signal','admin_resolve_radar_signal','admin_list_radar_signals'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes("if(role==='Nurse')return false"), 'Nurse stays out of Remi');
assert.ok(html.includes('id="copilotFab"') && html.includes('data-layout-roles="Admin Scheduler"'), 'Remi chip stays Admin and Scheduler');
assert.ok(html.includes('Admin and Scheduler are one portal'), 'Scheduler shares the Radar dismiss contract');
assert.ok(html.includes('This chrome is not Admin-only'), 'dismiss chrome is not Admin-only');
assert.ok(html.includes('Admin and Scheduler share it'), 'Radar note names both roles');
const roleFn = extractFn(html, 'function copilotRoleOk()');
assert.ok(roleFn.includes("role==='Admin'||role==='Scheduler'"), 'Scheduler passes the Remi role check');

const dismissFn = extractFn(html, 'async function remiRadarDismiss1Dismiss()');
assert.ok(dismissFn.includes("copilotRpc('resolve', remiRadarDismiss1ResolveBody(id))"), 'checked rows resolve one id at a time');
assert.ok(!dismissFn.includes("role==='Admin'"), 'dismiss is not an Admin-only role check');
assert.ok(!dismissFn.includes('alert.ace'), 'every checked row is resolved, not only Ace-flagged rows');
assert.ok(dismissFn.includes('copilotAlerts=(copilotAlerts||[]).filter'), 'dismiss removes those rows from the Radar list');
assert.ok(dismissFn.includes('remiRadarDismiss1Remember'), 'dismiss is remembered for refresh');
assert.ok(html.includes('Ack stays on the Radar list'), 'ack stays on the list');
['admin_blast_cover_request','admin_confirm_cover_send','admin_dismiss_noshow_rescue','admin_dismiss_why_open','admin_ack_radar_signal','sms:','mailto:','quo'].forEach(function(name){
  assert.ok(!dismissFn.includes(name), 'dismiss does not call ' + name);
});
const selectFn = extractFn(html, 'function remiRadarDismiss1SelectAll()');
const unselectFn = extractFn(html, 'function remiRadarDismiss1Unselect()');
assert.ok(!selectFn.includes("role==='Admin'") && !unselectFn.includes("role==='Admin'"), 'Select all and Unselect are not Admin-only');
assert.ok(!selectFn.includes('copilotRpc') && !unselectFn.includes('copilotRpc'), 'Select all and Unselect do not post');
assert.ok(html.includes('>Select all<') && html.includes('>Unselect<') && html.includes('>Dismiss selected<'), 'toolbar labels');
assert.ok(html.includes('Clears selected Radar rows only · not send · does not message anyone'), 'not-send callout');
assert.ok(html.includes('Dismissed from Radar · those rows cleared only · not a send'), 'after-dismiss callout');
assert.ok(html.includes('class="radar-dismiss-cb"'), 'checkbox on each card');
assert.ok(html.includes('evercare_radar_dismiss1:'), 'session key');

const quiet = html.slice(html.indexOf('function copilotPaintQuiet'), html.indexOf('function copilotPaintRadar'));
assert.ok(/8:00 PM/.test(quiet), 'quiet hours copy stays');
assert.ok(!/\d{4}-\d{2}-\d{2}/.test(quiet), 'quiet hours copy has no ISO date');

const store = {};
const ctx = {
  sessionStorage:{
    getItem:function(k){return Object.prototype.hasOwnProperty.call(store, k)?store[k]:null;},
    setItem:function(k,v){store[k]=String(v);}
  },
  document:{getElementById:function(){return {disabled:false};}},
  copilotAlerts:[],
  copilotView:'radar',
  currentAdminRole:'Admin',
  currentAdminUsername:'mo',
  rpc:[],
  toasts:[],
  painted:0
};
vm.createContext(ctx);
[
  'function copilotEsc(s)',
  'function copilotRoleOk()',
  'function remiRadarDismiss1Marker()',
  'function remiRadarDismiss1StoreKey()',
  'function remiRadarDismiss1Store()',
  'function remiRadarDismiss1Write(store)',
  'function remiRadarDismiss1Remember(alert)',
  'function remiRadarDismiss1StatusHidden(status)',
  'function remiRadarDismiss1Hidden(alert)',
  'function remiRadarDismiss1Filter(list)',
  'function remiRadarDismiss1SelectedCount(rows)',
  'function remiRadarDismiss1StatusLine(count, selected)',
  'function remiRadarDismiss1ToolbarHtml(count, selected)',
  'function remiRadarDismiss1ResolveBody(id)',
  'function remiRadarDismiss1SelectAll()',
  'function remiRadarDismiss1Unselect()',
  'async function remiRadarDismiss1Dismiss()'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});
vm.runInContext([
  'var remiRadarDismiss1Selected={};',
  'var remiRadarDismiss1Note="";',
  'var remiRadarDismiss1LastN=0;',
  'var remiRadarDismiss1Busy=false;',
  'function copilotRpc(kind, body){rpc.push({kind:kind, body:body});return Promise.resolve({ok:true, data:{success:true}});}',
  'function copilotPaintRadar(){painted++;}',
  'function showTempMsg(msg){toasts.push(msg);}'
].join('\n'), ctx);

function plain(expr){
  return JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));
}
assert.deepStrictEqual(plain('remiRadarDismiss1ResolveBody("sig-1")'), {p_id:'sig-1'});
assert.strictEqual(vm.runInContext('remiRadarDismiss1StatusHidden("resolved")', ctx), true);
assert.strictEqual(vm.runInContext('remiRadarDismiss1StatusHidden("open")', ctx), false);
assert.strictEqual(vm.runInContext('remiRadarDismiss1StatusHidden("acked")', ctx), false, 'ack stays on the list');
assert.strictEqual(vm.runInContext('remiRadarDismiss1Hidden({id:"sig-ack", ace:true, status:"acked", kind:"schedule_gap"})', ctx), false, 'an acked row is still a Radar row');

const rows = [
  {id:'sig-fri', kind:'schedule_gap', ace:true, status:'open', surface:'Fri mark still open', detail:'Ada Cole · 2026-09-26 still open'},
  {id:'sig-wed', kind:'coverage_open', ace:true, status:'open', surface:'Wed AM shortfall', detail:'Sara no-show'},
  {id:'coverage_open', kind:'coverage_open', surface:'Coverage', detail:'2 open shifts on the desk.'},
  {id:'sig-new', kind:'coverage_open', ace:true, status:'open', surface:'New cover', detail:'A later signal'}
];
vm.runInContext('copilotAlerts='+JSON.stringify(rows.slice(0,3))+';', ctx);
const idle = vm.runInContext('remiRadarDismiss1ToolbarHtml(3, 0)', ctx);
assert.ok(idle.includes('Select all') && idle.includes('Unselect') && idle.includes('Dismiss selected'), 'toolbar');
assert.ok(idle.includes('disabled'), 'dismiss muted until a row is checked');
assert.ok(idle.includes('is-idle'), 'Unselect stays visible when nothing is checked');
const hot = vm.runInContext('remiRadarDismiss1ToolbarHtml(4, 2)', ctx);
assert.ok(!/id="radarDismissGo"[^>]*disabled/.test(hot), 'dismiss enables when rows are checked');
assert.ok(hot.includes('not send') && hot.includes('does not message anyone'), 'selected callout');

vm.runInContext('remiRadarDismiss1Selected={"sig-fri":1,"sig-wed":1};', ctx);
async function runVm(){
await vm.runInContext('remiRadarDismiss1Dismiss()', ctx);
const rpc = plain('rpc');
assert.strictEqual(rpc.length, 2, 'one resolve per selected Ace id');
assert.deepStrictEqual(rpc.map(function(row){return row.kind;}), ['resolve','resolve']);
assert.deepStrictEqual(rpc.map(function(row){return row.body;}), [{p_id:'sig-fri'},{p_id:'sig-wed'}]);
assert.strictEqual(vm.runInContext('toasts[0]', ctx), 'Dismissed from Radar');
const left = plain('copilotAlerts.map(function(a){return a.id;})');
assert.deepStrictEqual(left, ['coverage_open'], 'only the checked rows leave Radar');
assert.strictEqual(vm.runInContext('remiRadarDismiss1Hidden({id:"sig-fri", ace:true, status:"open", kind:"schedule_gap"})', ctx), true, 'same id stays hidden on refresh');
assert.strictEqual(vm.runInContext('remiRadarDismiss1Hidden({id:"sig-new", ace:true, status:"open", kind:"coverage_open"})', ctx), false, 'a different id stays');
assert.strictEqual(vm.runInContext('remiRadarDismiss1Hidden({id:"coverage_open", kind:"coverage_open", surface:"Coverage"})', ctx), false, 'an unchecked row of the same kind stays');

vm.runInContext('copilotAlerts=[{id:"sig-fri", ace:true, status:"resolved", kind:"schedule_gap"},{id:"timesheet_late", kind:"timesheet_late", surface:"Timesheets", detail:"Nothing flagged."}]; rpc.length=0; remiRadarDismiss1Selected={};', ctx);
const reloaded = plain('remiRadarDismiss1Filter(copilotAlerts).map(function(a){return a.id;})');
assert.deepStrictEqual(reloaded, ['timesheet_late'], 'refresh drops resolved Ace rows and keeps the rest');

vm.runInContext('currentAdminRole="Nurse"; remiRadarDismiss1Busy=false; remiRadarDismiss1Selected={"timesheet_late":1}; copilotAlerts=[{id:"timesheet_late", kind:"timesheet_late"}]; rpc.length=0;', ctx);
await vm.runInContext('remiRadarDismiss1Dismiss()', ctx);
assert.strictEqual(vm.runInContext('rpc.length', ctx), 0, 'Nurse dismiss posts nothing');
assert.strictEqual(vm.runInContext('copilotRoleOk()', ctx), false, 'Nurse is denied');

vm.runInContext('currentAdminRole="Admin"; copilotAlerts=[{id:"desk-1", kind:"login_fail", surface:"Login fails", detail:"Nothing flagged."},{id:"desk-2", kind:"broadcast_needed", surface:"Broadcast", detail:"You send it."}]; remiRadarDismiss1Selected={"desk-1":1}; rpc.length=0; toasts.length=0;', ctx);
await vm.runInContext('remiRadarDismiss1Dismiss()', ctx);
assert.deepStrictEqual(plain('rpc'), [{kind:'resolve', body:{p_id:'desk-1'}}], 'a checked desk row still resolves by p_id');
assert.deepStrictEqual(plain('copilotAlerts.map(function(a){return a.id;})'), ['desk-2']);
assert.strictEqual(vm.runInContext('toasts[0]', ctx), 'Dismissed from Radar');

vm.runInContext('currentAdminRole="Scheduler"; currentAdminUsername="scheduler"; remiRadarDismiss1Busy=false; remiRadarDismiss1Selected={}; copilotAlerts=[{id:"sch-1", kind:"schedule_gap", surface:"Fri mark", detail:"Open"},{id:"sch-2", kind:"coverage_open", surface:"Cover", detail:"Open"}]; rpc.length=0; toasts.length=0;', ctx);
assert.strictEqual(vm.runInContext('copilotRoleOk()', ctx), true, 'Scheduler shares Remi');
const schBar = vm.runInContext('remiRadarDismiss1ToolbarHtml(2, 0)', ctx);
assert.ok(schBar.includes('Select all') && schBar.includes('Unselect') && schBar.includes('>Dismiss selected<'), 'Scheduler gets the same toolbar');
assert.ok(/id="radarDismissGo"[^>]*disabled/.test(schBar), 'Scheduler dismiss stays muted until a check');
vm.runInContext('remiRadarDismiss1SelectAll();', ctx);
assert.strictEqual(vm.runInContext('rpc.length', ctx), 0, 'Scheduler Select all does not post');
assert.strictEqual(vm.runInContext('remiRadarDismiss1SelectedCount(copilotAlerts)', ctx), 2, 'Scheduler Select all checks every row');
vm.runInContext('remiRadarDismiss1Unselect();', ctx);
assert.strictEqual(vm.runInContext('remiRadarDismiss1SelectedCount(copilotAlerts)', ctx), 0, 'Scheduler Unselect clears checks');
assert.strictEqual(vm.runInContext('rpc.length', ctx), 0, 'Scheduler Unselect does not post');
vm.runInContext('remiRadarDismiss1Selected={"sch-1":1};', ctx);
await vm.runInContext('remiRadarDismiss1Dismiss()', ctx);
assert.deepStrictEqual(plain('rpc'), [{kind:'resolve', body:{p_id:'sch-1'}}], 'Scheduler dismiss loops admin_resolve_radar_signal by p_id');
assert.deepStrictEqual(plain('copilotAlerts.map(function(a){return a.id;})'), ['sch-2'], 'Scheduler dismiss removes only the checked row');
assert.strictEqual(vm.runInContext('toasts[0]', ctx), 'Dismissed from Radar');
assert.strictEqual(vm.runInContext('remiRadarDismiss1Hidden({id:"sch-1", status:"open", kind:"schedule_gap"})', ctx), true, 'Scheduler refresh keeps that id off Radar');
assert.strictEqual(vm.runInContext('remiRadarDismiss1Hidden({id:"sch-2", status:"open", kind:"coverage_open"})', ctx), false, 'Scheduler keeps the unchecked row');
}

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
    console.log('admin-remi-radar-dismiss1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const root = __dirname;
  const outDir = process.env.REMI_RADAR_DISMISS1_SHOTS || '/tmp/remi-radar-dismiss1';
  fs.mkdirSync(outDir, {recursive:true});
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript'};
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
    executablePath:chrome,
    headless:'new',
    args:['--no-sandbox','--disable-dev-shm-usage']
  });
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true});
    await page.goto('http://127.0.0.1:'+port+'/?v=remi-radar-dismiss1', {waitUntil:'domcontentloaded', timeout:60000});
    const opened = await page.evaluate(async function(){
      currentAdminRole='Admin';
      currentAdminUsername='mo';
      readSbSession=function(){return {access_token:'office-jwt', email:'mo@evercare.test'};};
      window.__rpc=[];
      sbRestRpc=async function(name, body){
        window.__rpc.push({name:name, body:body||{}});
        if(name==='admin_list_radar_signals'){
          return {ok:true, data:{signals:[
            {id:'sig-fri', kind:'schedule_gap', title:'Fri mark still open', summary:'Ada Cole · 2026-09-26 still open.', status:'open', severity:'warn'},
            {id:'sig-wed', kind:'aide_issue', title:'Wed AM shortfall', summary:'Sara no-show on Ada.', status:'open'},
            {id:'sig-bowl', kind:'broadcast_needed', title:'Coverage gap · Test Client Alpha', summary:'Thu 8a–5p still open.', status:'open'},
            {id:'sig-ben', kind:'timesheet_late', title:'Ben Ortiz week', summary:'All five days marked.', status:'open'}
          ]}};
        }
        if(name==='admin_get_quiet_hours')return {ok:true, data:{enabled:false, start_local:'20:00', end_local:'07:00', timezone:'America/New_York'}};
        if(name==='admin_resolve_radar_signal')return {ok:true, data:{success:true, status:'resolved'}};
        return {ok:true, data:{success:true}};
      };
      if(typeof showScreen==='function')showScreen('adminScreen');
      if(typeof showTab==='function')showTab('schedule');
      await copilotOpenRadar();
      var go=document.getElementById('radarDismissGo');
      var boxes=document.querySelectorAll('#copilotList .radar-dismiss-cb');
      return {
        hidden:document.getElementById('copilotSheet').hidden,
        labels:{
          all:document.getElementById('radarDismissSelectAll').textContent,
          none:document.getElementById('radarDismissUnselect').textContent,
          go:go.textContent
        },
        goDisabled:go.disabled,
        boxCount:boxes.length,
        sub:document.getElementById('radarDismissCount').textContent,
        date:document.querySelector('#copilotList .radar-card-body span').textContent
      };
    });
    assert.strictEqual(opened.hidden, false, 'phone sheet opens');
    assert.deepStrictEqual(opened.labels, {all:'Select all', none:'Unselect', go:'Dismiss selected'});
    assert.strictEqual(opened.goDisabled, true);
    assert.ok(opened.boxCount >= 4, 'a checkbox on each Radar card, got '+opened.boxCount);
    assert.ok(opened.sub.indexOf('alert')>=0, opened.sub);
    assert.ok(opened.date.indexOf('09/26/2026')>=0, 'dates read MM/DD/YYYY: '+opened.date);
    assert.ok(opened.date.indexOf('2026-09-26')<0, 'ISO date is not shown');
    await page.screenshot({path:path.join(outDir, '01-phone-radar-checks.png')});

    await page.evaluate(function(){
      var boxes=document.querySelectorAll('#copilotList .radar-dismiss-cb');
      boxes[0].checked=true;
      boxes[0].dispatchEvent(new Event('change', {bubbles:true}));
      boxes[1].checked=true;
      boxes[1].dispatchEvent(new Event('change', {bubbles:true}));
    });
    await page.waitForFunction(function(){
      var go=document.getElementById('radarDismissGo');
      return go && !go.disabled && document.querySelectorAll('#copilotList .radar-dismiss-cb:checked').length===2;
    });
    const selected = await page.evaluate(function(){
      return {
        callout:document.getElementById('radarDismissCallout').textContent,
        sub:document.getElementById('radarDismissCount').textContent,
        disabled:document.getElementById('radarDismissGo').disabled
      };
    });
    assert.ok(selected.callout.indexOf('not send')>=0, selected.callout);
    assert.ok(selected.callout.indexOf('does not message anyone')>=0, selected.callout);
    assert.strictEqual(selected.disabled, false);
    assert.ok(/2 of \d+ selected/.test(selected.sub), selected.sub);
    await page.screenshot({path:path.join(outDir, '02-phone-radar-selected.png')});

    await page.evaluate(function(){document.getElementById('radarDismissGo').scrollIntoView({block:'center'});});
    await page.click('#radarDismissGo');
    await page.waitForFunction(function(){
      return document.getElementById('radarDismissCallout') && document.getElementById('radarDismissCallout').textContent.indexOf('Dismissed from Radar')>=0;
    });
    const after = await page.evaluate(function(){
      var ids=[];
      document.querySelectorAll('#copilotList [data-copilot-id]').forEach(function(el){ids.push(el.getAttribute('data-copilot-id'));});
      var names={};
      window.__rpc.forEach(function(row){names[row.name]=(names[row.name]||0)+1;});
      return {
        ids:ids,
        callout:document.getElementById('radarDismissCallout').textContent,
        goDisabled:document.getElementById('radarDismissGo').disabled,
        names:names,
        resolves:window.__rpc.filter(function(row){return row.name==='admin_resolve_radar_signal';}).map(function(row){return row.body;})
      };
    });
    assert.ok(after.ids.indexOf('sig-fri')<0 && after.ids.indexOf('sig-wed')<0, 'selected rows cleared '+after.ids.join(','));
    assert.ok(after.ids.indexOf('sig-bowl')>=0 && after.ids.indexOf('sig-ben')>=0, 'other rows stay '+after.ids.join(','));
    assert.ok(after.callout.indexOf('not a send')>=0, after.callout);
    assert.strictEqual(after.goDisabled, true);
    assert.strictEqual(after.names.admin_resolve_radar_signal, 2);
    assert.deepStrictEqual(after.resolves, [{p_id:'sig-fri'},{p_id:'sig-wed'}]);
    ['admin_blast_cover_request','admin_confirm_cover_send','admin_ack_radar_signal','admin_dismiss_noshow_rescue','admin_dismiss_why_open'].forEach(function(name){
      assert.ok(!after.names[name], 'did not call '+name);
    });
    await page.screenshot({path:path.join(outDir, '03-phone-radar-after-dismiss.png')});

    const refreshed = await page.evaluate(async function(){
      await copilotLoadRadar();
      copilotPaintRadar();
      var ids=[];
      document.querySelectorAll('#copilotList [data-copilot-id]').forEach(function(el){ids.push(el.getAttribute('data-copilot-id'));});
      return ids;
    });
    assert.ok(refreshed.indexOf('sig-fri')<0 && refreshed.indexOf('sig-wed')<0, 'refresh does not resurrect dismissed ids');
    assert.ok(refreshed.indexOf('sig-bowl')>=0 && refreshed.indexOf('sig-ben')>=0, 'refresh keeps the other rows');

    await page.click('#radarDismissSelectAll');
    const allOn = await page.evaluate(function(){
      var boxes=document.querySelectorAll('#copilotList .radar-dismiss-cb');
      var on=document.querySelectorAll('#copilotList .radar-dismiss-cb:checked');
      return {n:boxes.length, on:on.length, disabled:document.getElementById('radarDismissGo').disabled};
    });
    assert.ok(allOn.n>=1 && allOn.on===allOn.n, 'Select all checks every visible card');
    assert.strictEqual(allOn.disabled, false);
    await page.click('#radarDismissUnselect');
    const cleared = await page.evaluate(function(){
      return {
        on:document.querySelectorAll('#copilotList .radar-dismiss-cb:checked').length,
        disabled:document.getElementById('radarDismissGo').disabled,
        rpc:window.__rpc.filter(function(row){return row.name==='admin_resolve_radar_signal';}).length
      };
    });
    assert.strictEqual(cleared.on, 0, 'Unselect clears checks');
    assert.strictEqual(cleared.disabled, true);
    assert.strictEqual(cleared.rpc, 2, 'Unselect does not post another resolve');

    const schedOpen = await page.evaluate(async function(){
      currentAdminRole='Scheduler';
      currentAdminUsername='scheduler';
      if(typeof layoutA1ApplyRoles==='function')layoutA1ApplyRoles();
      var fab=document.getElementById('copilotFab');
      await copilotOpenRadar();
      var go=document.getElementById('radarDismissGo');
      var boxes=document.querySelectorAll('#copilotList .radar-dismiss-cb');
      return {
        roleOk:copilotRoleOk(),
        fabHidden:!!(fab&&fab.hasAttribute('hidden')),
        sheetHidden:document.getElementById('copilotSheet').hidden,
        labels:{
          all:document.getElementById('radarDismissSelectAll').textContent,
          none:document.getElementById('radarDismissUnselect').textContent,
          go:go.textContent
        },
        goDisabled:go.disabled,
        boxCount:boxes.length,
        note:(document.querySelector('#copilotBody .copilot-note')||{}).textContent||''
      };
    });
    assert.strictEqual(schedOpen.roleOk, true, 'Scheduler can open Radar');
    assert.strictEqual(schedOpen.fabHidden, false, 'Scheduler keeps the Remi chip');
    assert.strictEqual(schedOpen.sheetHidden, false, 'Scheduler opens the same sheet');
    assert.deepStrictEqual(schedOpen.labels, {all:'Select all', none:'Unselect', go:'Dismiss selected'});
    assert.strictEqual(schedOpen.goDisabled, true);
    assert.ok(schedOpen.boxCount >= 4, 'Scheduler sees a checkbox on each card, got '+schedOpen.boxCount);
    assert.ok(schedOpen.note.indexOf('Admin and Scheduler share it')>=0, schedOpen.note);
    await page.screenshot({path:path.join(outDir, '05-scheduler-radar.png')});

    const rpcBefore = await page.evaluate(function(){return window.__rpc.length;});
    await page.evaluate(function(){
      var boxes=document.querySelectorAll('#copilotList .radar-dismiss-cb');
      boxes[0].checked=true;
      boxes[0].dispatchEvent(new Event('change', {bubbles:true}));
    });
    await page.waitForFunction(function(){
      var go=document.getElementById('radarDismissGo');
      return go && !go.disabled && document.querySelectorAll('#copilotList .radar-dismiss-cb:checked').length===1;
    });
    await page.evaluate(function(){document.getElementById('radarDismissGo').scrollIntoView({block:'center'});});
    await page.click('#radarDismissGo');
    await page.waitForFunction(function(){
      return document.getElementById('radarDismissCallout') && document.getElementById('radarDismissCallout').textContent.indexOf('Dismissed from Radar')>=0;
    });
    const schedAfter = await page.evaluate(function(before){
      var ids=[];
      document.querySelectorAll('#copilotList [data-copilot-id]').forEach(function(el){ids.push(el.getAttribute('data-copilot-id'));});
      var fresh=window.__rpc.slice(before);
      var names={};
      fresh.forEach(function(row){names[row.name]=(names[row.name]||0)+1;});
      return {
        ids:ids,
        names:names,
        resolves:fresh.filter(function(row){return row.name==='admin_resolve_radar_signal';}).map(function(row){return row.body;})
      };
    }, rpcBefore);
    assert.ok(schedAfter.ids.indexOf('sig-fri')<0, 'Scheduler dismiss clears the checked row '+schedAfter.ids.join(','));
    assert.ok(schedAfter.ids.indexOf('sig-wed')>=0, 'Scheduler keeps the unchecked row');
    assert.strictEqual(schedAfter.names.admin_resolve_radar_signal, 1);
    assert.deepStrictEqual(schedAfter.resolves, [{p_id:'sig-fri'}]);
    ['admin_blast_cover_request','admin_confirm_cover_send','admin_ack_radar_signal'].forEach(function(name){
      assert.ok(!schedAfter.names[name], 'Scheduler dismiss did not call '+name);
    });
    await page.screenshot({path:path.join(outDir, '06-scheduler-after-dismiss.png')});

    await page.setViewport({width:1280, height:800, isMobile:false, hasTouch:false});
    await page.evaluate(function(){
      currentAdminRole='Scheduler';
      var sheet=document.getElementById('copilotSheet');
      if(sheet)sheet.hidden=false;
      if(typeof copilotDeskAlerts==='function'&&(!copilotAlerts||!copilotAlerts.length))copilotAlerts=copilotDeskAlerts();
      copilotPaintRadar();
    });
    const desk = await page.evaluate(function(){
      var sheet=document.getElementById('copilotSheet');
      var style=getComputedStyle(sheet);
      return {right:style.right, width:style.width, full:sheet.className.indexOf('full')<0};
    });
    assert.strictEqual(desk.right, '0px', 'desktop stays the right rail');
    await page.screenshot({path:path.join(outDir, '04-desktop-rail.png')});

    const nurse = await page.evaluate(function(){
      currentAdminRole='Nurse';
      var before=document.getElementById('copilotSheet').hidden;
      copilotSyncRole();
      return {ok:copilotRoleOk(), hidden:document.getElementById('copilotSheet').hidden, before:before};
    });
    assert.strictEqual(nurse.ok, false);
    assert.strictEqual(nurse.hidden, true, 'Nurse loses the Remi sheet');
  }finally{
    await browser.close();
    server.close();
  }
}

runVm().then(function(){return runBrowser();}).then(function(){
  console.log('admin-remi-radar-dismiss1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
