#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

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

assert.ok(html.includes('v=msg-bulk-delete1'), 'marker');
assert.ok(html.includes('?v=msg-bulk-delete1'), 'pages cache bust stays in the contract');
assert.ok(html.includes('admin-build 2026-09-29-msg-bulk-delete1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-msg-bulk-delete1">'), 'meta');
assert.ok(html.includes("var MSG_BULK_DELETE1_MARKER='v=msg-bulk-delete1'"), 'script marker');
assert.ok(html.includes("var MSG_BULK_DELETE1_BUILD='2026-09-29-msg-bulk-delete1'"), 'script build');
assert.ok(html.includes('GHOST-MSG-BULK-DELETE1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Ace CALLABLE for the Aides inbox'), 'Aides hide is callable');
assert.ok(html.includes('admin_hide_aide_office_threads'), 'hide RPC');
assert.ok(html.includes('p_thread_ids'), 'thread id payload');
assert.ok(html.includes('CLIENT_GAP'), 'client gap is named');
assert.ok(html.includes('Friday confirmed'), 'Friday confirmed the Clients choice');
assert.ok(html.includes('Disable Delete on Clients until Ace ships a client inbox'), 'Clients Delete stays disabled');
assert.ok(html.includes('No local hide for Clients'), 'no local client hide');
assert.ok(html.includes('Client inbox delete is not live yet'), 'clients delete stays muted in copy');
assert.ok(!html.includes('evercare_msg_bulk_delete1_aides') && !html.includes('evercare_msg_bulk_delete1_clients'), 'no local hide keys');
assert.ok(html.includes('It is not a send'), 'delete is not a send');
assert.ok(html.includes('Admin and Scheduler are one portal'), 'one portal');
assert.ok(html.includes('This chrome is not Admin-only'), 'not Admin-only');
assert.ok(html.includes('Scheduler login sees the same checkboxes, Select all, Unselect, and Delete as Admin'), 'Scheduler login copy');
assert.ok(html.includes('Nurse stays out'), 'Nurse out of scope');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/msg-bulk-delete1-v1.sql')), 'no SQL patch');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays the pages-cache shell');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-29-login-land-schedule1"') < html.indexOf('content="2026-09-29-list-search-az1"'), 'login-land stays before list-search');
assert.ok(html.indexOf('content="2026-09-29-list-search-az1"') < html.indexOf('content="2026-09-29-pages-cache-fresh1"'), 'pages-cache stays after list-search');
assert.ok(html.indexOf('content="2026-09-29-pages-cache-fresh1"') < html.indexOf('content="2026-09-29-msg-bulk-delete1"'), 'this tip follows the pages-cache shell');
['v=login-land-schedule1','v=list-search-az1','v=pages-cache-fresh1','v=remi-msg-tab1','v=remi-radar-dismiss1','v=aidechat1','admin_list_aide_office_threads','admin_resolve_radar_signal'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});

assert.ok(html.includes('id="msgBulkToolbar"'), 'toolbar');
assert.ok(html.includes('id="msgBulkSelectAll"') && html.includes('>Select all<'), 'Select all');
assert.ok(html.includes('id="msgBulkUnselect"') && html.includes('>Unselect<'), 'Unselect');
assert.ok(html.includes('id="msgBulkDelete"') && html.includes('>Delete<'), 'Delete');
assert.ok(/id="msgBulkDelete"[^>]*disabled/.test(html), 'Delete starts muted');
assert.ok(/id="msgBulkCount"[^>]*>0 selected</.test(html), 'count starts at 0 selected');
assert.ok(html.includes('class="msg-bulk-cb"'), 'checkbox class');
assert.ok(html.includes('data-msg-bulk-delete1="v=msg-bulk-delete1"'), 'desk marker');
assert.ok(html.includes('data-layout-roles="Admin Scheduler" data-msg-bulk-delete1="v=msg-bulk-delete1"'), 'toolbar is Admin and Scheduler');
function openTag(id){
  const at = html.indexOf('id="'+id+'"');
  assert.ok(at > 0, 'missing '+id);
  return html.slice(html.lastIndexOf('<', at), html.indexOf('>', at) + 1);
}
['msgBulkToolbar','msgBulkSelectAll','msgBulkUnselect','msgBulkDelete','msgBulkCount','msgBulkCallout'].forEach(function(id){
  const roles = (openTag(id).match(/data-layout-roles="([^"]*)"/) || [])[1];
  assert.strictEqual(roles, 'Admin Scheduler', id+' shares Admin and Scheduler chrome');
});

const selectFn = extractFn(html, 'function msgBulkDelete1SelectAll()');
const unselectFn = extractFn(html, 'function msgBulkDelete1Unselect()');
const deleteFn = extractFn(html, 'async function msgBulkDelete1Delete()');
const roleFn = extractFn(html, 'function msgBulkDelete1RoleOk()');
assert.ok(!selectFn.includes('sessionStorage') && !unselectFn.includes('sessionStorage') && !deleteFn.includes('sessionStorage'), 'selection does not store a local hide');
assert.ok(!selectFn.includes('sbRestRpc') && !unselectFn.includes('sbRestRpc'), 'Select all and Unselect do not post');
assert.ok(deleteFn.includes("sbRestRpc('admin_hide_aide_office_threads', {p_thread_ids:ids})"), 'Aides Delete posts the hide RPC once');
assert.ok(deleteFn.indexOf("inbox==='clients'") < deleteFn.indexOf('admin_hide_aide_office_threads'), 'Clients return before the aide RPC');
assert.ok(deleteFn.indexOf("role==='Nurse'") < deleteFn.indexOf('sbRestRpc'), 'Nurse returns before the RPC');
['admin_send_aide_office_message','admin_send_aide_text','admin_compose_aide_text','sms:','mailto:','quo','archive_client','admin_deactivate'].forEach(function(name){
  assert.ok(!deleteFn.includes(name), 'delete does not call ' + name);
});
assert.ok(roleFn.includes("role==='Nurse'"), 'Nurse is denied');
assert.ok(roleFn.includes('Scheduler'), 'Scheduler is included');
assert.ok(roleFn.includes('This chrome is not Admin-only'), 'role gate says the chrome is shared');
assert.ok(roleFn.includes("role!=='Admin'&&role!=='Scheduler'"), 'Admin and Scheduler pass the same gate');
assert.ok(!/if\s*\(\s*role\s*===\s*'Admin'\s*\)/.test(roleFn), 'role gate is not Admin-only');
[selectFn, unselectFn, deleteFn].forEach(function(fn){
  assert.ok(fn.includes('msgBulkDelete1RoleOk()'), 'action uses the shared gate');
  assert.ok(!fn.includes("role==='Admin'"), 'action is not Admin-only');
});
assert.ok(!extractFn(html, 'function aidechatPaintInbox()').includes('msgBulkDelete1Filter'), 'aides paint follows the list, not a local hide');
assert.ok(!extractFn(html, 'function remiMsgTab1PaintClients()').includes('msgBulkDelete1Filter'), 'clients paint does not fake a hide');
assert.ok(extractFn(html, 'function msgBulkDelete1AideIds(rows)').includes('out.length>=1000'), 'hide payload caps at 1000');
assert.ok(extractFn(html, 'function aidechatPaintInbox()').includes('msgBulkDelete1CheckHtml'), 'aides rows have a checkbox');
assert.ok(extractFn(html, 'function remiMsgTab1PaintClients()').includes('msgBulkDelete1CheckHtml'), 'client rows have a checkbox');

const store = {};
const paints = [];
const toasts = [];
const ctx = {
  sessionStorage:{
    getItem:function(k){return Object.prototype.hasOwnProperty.call(store, k)?store[k]:null;},
    setItem:function(k,v){store[k]=String(v);}
  },
  document:{getElementById:function(){return {disabled:false, classList:{toggle:function(){}}, textContent:''};}},
  currentAdminRole:'Admin',
  currentAdminUsername:'mo',
  remiMsgTab1Segment:'aides',
  aidechatSelectedId:'',
  remiMsgTab1ClientId:'',
  aideRows:[],
  clientRows:[],
  paints:paints,
  toasts:toasts,
  shows:[]
};
vm.createContext(ctx);
[
  'function msgBulkDelete1Marker()',
  'function msgBulkDelete1RoleOk()',
  'function msgBulkDelete1Inbox()',
  'function msgBulkDelete1Uuid(id)',
  'function msgBulkDelete1AideIds(rows)',
  'function msgBulkDelete1Rows()',
  'function msgBulkDelete1RpcOk(got)',
  'function msgBulkDelete1DropAides(ids)',
  'function msgBulkDelete1On(inbox, id)',
  'function msgBulkDelete1Count()',
  'function msgBulkDelete1Esc(s)',
  'function msgBulkDelete1CheckHtml(inbox, id, name, on)',
  'function msgBulkDelete1Callout(n)',
  'function msgBulkDelete1SyncChrome()',
  'function msgBulkDelete1Repaint()',
  'function msgBulkDelete1SelectAll()',
  'function msgBulkDelete1Unselect()',
  'function msgBulkDelete1Toggle(inbox, id, on)',
  'async function msgBulkDelete1Delete()'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});
vm.runInContext([
  'var msgBulkDelete1Selected={aides:{},clients:{}};',
  'var msgBulkDelete1Note="";',
  'var msgBulkDelete1NoteInbox="";',
  'var msgBulkDelete1Busy=false;',
  'var msgBulkDelete1LastN=0;',
  'var aidechatThreads=[];',
  'var rpcs=[];',
  'var refreshes=0;',
  'function aidechatRoleOk(){return currentAdminRole!=="Nurse";}',
  'function aidechatSorted(){return aideRows.slice();}',
  'function remiMsgTab1ClientRows(){return clientRows.slice();}',
  'function aidechatPaintInbox(){paints.push("aides");}',
  'function remiMsgTab1PaintClients(){paints.push("clients");}',
  'function aidechatShow(which){shows.push(which);}',
  'function showTempMsg(msg){toasts.push(msg);}',
  'function sbRestRpc(name, body){rpcs.push({name:name, body:body}); if(name==="admin_hide_aide_office_threads")return Promise.resolve({ok:true, status:200, data:{success:true, ok:true, history_deleted:false, inbox:"aide", hidden_thread_ids:(body&&body.p_thread_ids)||[]}}); return Promise.resolve({ok:true, data:{success:true, threads:[]}});}',
  'function aidechatRefresh(){refreshes++; aideRows=aidechatThreads.slice(); paints.push("refresh"); return Promise.resolve();}'
].join('\n'), ctx);

function plain(expr){
  return JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));
}

const MOE = '11111111-1111-4111-8111-111111111111';
const SARA = '22222222-2222-4222-8222-222222222222';
const JORDAN = '33333333-3333-4333-8333-333333333333';
const aides = [
  {id:MOE, name:'moe'},
  {id:SARA, name:'Sara Alvarez'},
  {id:JORDAN, name:'Jordan Kim'}
];
const clients = [
  {id:'c-bowlax', name:'Bowlax Abib'},
  {id:'c-ada', name:'Ada Cole'},
  {id:'c-rita', name:'Rita Morales'}
];
function hideCalls(){
  return plain('rpcs').filter(function(row){return row.name==='admin_hide_aide_office_threads';});
}

function resetDesk(role){
  vm.runInContext(
    'currentAdminRole='+JSON.stringify(role)+'; remiMsgTab1Segment="aides"; aideRows='+JSON.stringify(aides)+'; aidechatThreads=aideRows.slice(); clientRows='+JSON.stringify(clients)+'; paints.length=0; toasts.length=0; rpcs.length=0; refreshes=0; msgBulkDelete1Busy=false; msgBulkDelete1Note=""; msgBulkDelete1NoteInbox=""; msgBulkDelete1Selected={aides:{},clients:{}};',
    ctx
  );
}
function idsOf(expr){
  return plain(expr+'.map(function(r){return r.id;})');
}

async function runVm(){
  resetDesk('Admin');
  assert.strictEqual(vm.runInContext('msgBulkDelete1RoleOk()', ctx), true, 'Admin is allowed');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 0, 'nothing selected');
  const idle = vm.runInContext('msgBulkDelete1CheckHtml("aides",'+JSON.stringify(MOE)+',"moe", false)', ctx);
  assert.ok(idle.includes('class="msg-bulk-cb"') && !idle.includes('checked'), 'unchecked box');
  assert.ok(vm.runInContext('msgBulkDelete1Callout(0)', ctx).includes('Delete stays off'), 'muted copy');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Uuid("a-moe")', ctx), false, 'a short id is not a thread uuid');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Uuid('+JSON.stringify(MOE)+')', ctx), true, 'thread uuid passes');

  vm.runInContext('msgBulkDelete1SelectAll();', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 3, 'Select all checks every aide');
  assert.strictEqual(hideCalls().length, 0, 'Select all does not post');
  vm.runInContext('msgBulkDelete1Unselect();', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 0, 'Unselect clears aides');
  assert.strictEqual(hideCalls().length, 0, 'Unselect does not post');

  vm.runInContext('msgBulkDelete1Selected.aides={}; msgBulkDelete1Selected.aides['+JSON.stringify(MOE)+']=1; msgBulkDelete1Selected.aides['+JSON.stringify(JORDAN)+']=1; msgBulkDelete1Selected.aides["a-local"]=1;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(hideCalls().length, 1, 'Delete posts the hide RPC once');
  assert.deepStrictEqual(hideCalls()[0].body, {p_thread_ids:[MOE, JORDAN]}, 'payload is the selected thread uuids');
  assert.strictEqual(vm.runInContext('toasts[0]', ctx), 'Hidden from this inbox');
  assert.ok(vm.runInContext('refreshes', ctx) >= 1, 'Delete refreshes the aide list');
  assert.deepStrictEqual(idsOf('aideRows'), [SARA], 'Aides delete removes only the checked threads');
  assert.deepStrictEqual(idsOf('clientRows'), ['c-bowlax','c-ada','c-rita'], 'Aides delete leaves Clients alone');

  const rpcAfterAides = hideCalls().length;
  vm.runInContext('remiMsgTab1Segment="clients"; msgBulkDelete1Selected.clients={"c-bowlax":1}; toasts.length=0; paints.length=0;', ctx);
  assert.ok(vm.runInContext('msgBulkDelete1Callout(1)', ctx).includes('not live yet'), 'Clients callout names the gap');
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(hideCalls().length, rpcAfterAides, 'Clients Delete does not call the aide hide RPC');
  assert.deepStrictEqual(idsOf('clientRows'), ['c-bowlax','c-ada','c-rita'], 'Clients stay on the desk');
  assert.deepStrictEqual(idsOf('aideRows'), [SARA], 'Clients Delete leaves the remaining aide');

  resetDesk('Scheduler');
  assert.strictEqual(vm.runInContext('msgBulkDelete1RoleOk()', ctx), true, 'Scheduler login shares the inbox');
  vm.runInContext('msgBulkDelete1SelectAll();', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 3, 'Scheduler Select all checks every aide');
  assert.strictEqual(hideCalls().length, 0, 'Scheduler Select all does not post');
  vm.runInContext('msgBulkDelete1Unselect(); msgBulkDelete1Selected.aides={}; msgBulkDelete1Selected.aides['+JSON.stringify(MOE)+']=1; msgBulkDelete1Selected.aides['+JSON.stringify(JORDAN)+']=1;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.deepStrictEqual(hideCalls()[0].body, {p_thread_ids:[MOE, JORDAN]}, 'Scheduler uses the same hide RPC');
  assert.deepStrictEqual(idsOf('aideRows'), [SARA], 'Scheduler Aides delete removes only the checked threads');
  vm.runInContext('remiMsgTab1Segment="clients"; msgBulkDelete1Selected={aides:{},clients:{"c-bowlax":1}}; msgBulkDelete1Busy=false; rpcs.length=0;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(hideCalls().length, 0, 'Scheduler Clients Delete does not post');
  assert.deepStrictEqual(idsOf('clientRows'), ['c-bowlax','c-ada','c-rita'], 'Scheduler leaves every client');

  const beforeNurse = hideCalls().length;
  vm.runInContext('currentAdminRole="Nurse"; msgBulkDelete1Busy=false; remiMsgTab1Segment="aides"; msgBulkDelete1Selected={aides:{},clients:{}}; msgBulkDelete1Selected.aides['+JSON.stringify(SARA)+']=1;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  vm.runInContext('msgBulkDelete1SelectAll();', ctx);
  assert.strictEqual(hideCalls().length, beforeNurse, 'Nurse delete does not post');
  assert.deepStrictEqual(idsOf('aideRows'), [SARA], 'Nurse does not hide Sara');
  assert.strictEqual(vm.runInContext('msgBulkDelete1RoleOk()', ctx), false, 'Nurse is denied');

  resetDesk('Admin');
  vm.runInContext('sbRestRpc=function(name, body){rpcs.push({name:name, body:body}); return Promise.resolve({ok:false, status:403, error:"42501"});} ; msgBulkDelete1Selected.aides['+JSON.stringify(MOE)+']=1;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(hideCalls().length, 1, 'a denied hide was attempted only when the role may call');
  assert.deepStrictEqual(idsOf('aideRows'), [MOE, SARA, JORDAN], '403 leaves the inbox');
  assert.strictEqual(vm.runInContext('refreshes', ctx), 0, 'a denied hide does not refresh');

  const many = [];
  for(let n=1;n<=1001;n++){
    many.push({id:'aaaaaaaa-aaaa-4aaa-8aaa-'+String(n).padStart(12,'0'), name:'Aide '+n});
  }
  vm.runInContext('sbRestRpc=function(name, body){rpcs.push({name:name, body:body}); return Promise.resolve({ok:true, status:200, data:{success:true, ok:true, history_deleted:false, hidden_thread_ids:(body&&body.p_thread_ids)||[]}});}; currentAdminRole="Admin"; remiMsgTab1Segment="aides"; aideRows='+JSON.stringify(many)+'; aidechatThreads=aideRows.slice(); rpcs.length=0; refreshes=0; msgBulkDelete1Busy=false; msgBulkDelete1Selected={aides:{},clients:{}};', ctx);
  vm.runInContext('msgBulkDelete1SelectAll();', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(hideCalls().length, 1, 'a long selection is still one post');
  assert.strictEqual(hideCalls()[0].body.p_thread_ids.length, 1000, 'payload caps at 1000');
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
    console.log('admin-msg-bulk-delete1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const root = __dirname;
  const outDir = process.env.MSG_BULK_DELETE1_SHOTS || '/tmp/msg-bulk-delete1';
  fs.mkdirSync(outDir, {recursive:true});
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript', '.txt':'text/plain'};
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
    await page.goto('http://127.0.0.1:'+port+'/', {waitUntil:'domcontentloaded', timeout:60000});
    const boot = await page.evaluate(async function(){
      currentAdminRole='Admin';
      currentAdminUsername='mo';
      window.__rpc=[];
      readSbSession=function(){return {access_token:'office-jwt', email:'mo@evercare.test'};};
      window.__hidden={};
      sbRestRpc=async function(name, body){
        window.__rpc.push({name:name, body:body||{}});
        if(name==='admin_hide_aide_office_threads'){
          var ids=(body&&body.p_thread_ids)||[];
          ids.forEach(function(id){window.__hidden[id]=1;});
          return {ok:true, status:200, data:{success:true, ok:true, history_deleted:false, inbox:'aide', marker:'msg-bulk-delete1', hidden_thread_ids:ids}};
        }
        if(name==='admin_list_aide_office_threads'){
          var left=(aidechatThreads||[]).filter(function(t){return !window.__hidden[String(t.id)];});
          return {ok:true, data:{success:true, threads:left}};
        }
        return {ok:true, data:{success:true, threads:[], messages:[], enabled:false, start_local:'14:00', end_local:'08:00'}};
      };
      showScreen('adminScreen');
      showTab('aidechat');
      await aidechatOpen();
      sessionStorage.removeItem('evercare_msg_bulk_delete1_aides');
      sessionStorage.removeItem('evercare_msg_bulk_delete1_clients');
      aidechatThreads=[
        {id:'11111111-1111-4111-8111-111111111111', aide_id:'a-moe', username:'moe', name:'moe', status:'open', last_message:'Can I swap Sunday with Sara?', last_at:'2026-09-29T12:00:00Z', messages:[], preview_from_aide:'Can I swap Sunday with Sara?'},
        {id:'22222222-2222-4222-8222-222222222222', aide_id:'a-sara', username:'sara', name:'Sara Alvarez', status:'open', last_message:'Done', last_at:'2026-09-29T11:00:00Z', messages:[], preview_from_aide:'Done'},
        {id:'33333333-3333-4333-8333-333333333333', aide_id:'a-jordan', username:'jordan', name:'Jordan Kim', status:'open', last_message:'Timesheet week of 9/21', last_at:'2026-09-29T10:00:00Z', messages:[], preview_from_aide:'Timesheet week of 9/21'}
      ];
      allClients=[
        {id:'c-bowlax', name:'Bowlax Abib', phone:'(216) 555-0142', isActive:true},
        {id:'c-ada', name:'Ada Cole', phone:'(216) 555-0199', isActive:true},
        {id:'c-rita', name:'Rita Morales', phone:'', isActive:true}
      ];
      remiMsgTab1Segment='aides';
      aidechatPaintInbox();
      var del=document.getElementById('msgBulkDelete');
      return {
        checks:document.querySelectorAll('#aidechatList .msg-bulk-cb').length,
        names:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        disabled:!!del.disabled,
        count:document.getElementById('msgBulkCount').textContent,
        labels:document.getElementById('msgBulkToolbar').textContent,
        threadHidden:document.getElementById('aidechatThreadView').hidden,
        role:document.getElementById('msgBulkToolbar').getAttribute('data-layout-roles')
      };
    });
    assert.strictEqual(boot.checks, 3, 'Admin aides rows have checks');
    assert.deepStrictEqual(boot.names, ['moe','Sara Alvarez','Jordan Kim']);
    assert.strictEqual(boot.disabled, true, 'Delete muted until select');
    assert.strictEqual(boot.count, '0 selected');
    assert.ok(boot.labels.indexOf('Select all')>=0 && boot.labels.indexOf('Unselect')>=0 && boot.labels.indexOf('Delete')>=0, boot.labels);
    assert.strictEqual(boot.threadHidden, true);
    assert.ok(boot.role.indexOf('Admin')>=0 && boot.role.indexOf('Scheduler')>=0, boot.role);
    await page.screenshot({path:path.join(outDir, '01-aides-checks.png')});

    await page.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="'+MOE+'"]');
    const one = await page.evaluate(function(){
      var del=document.getElementById('msgBulkDelete');
      return {
        disabled:!!del.disabled,
        count:document.getElementById('msgBulkCount').textContent,
        threadHidden:document.getElementById('aidechatThreadView').hidden,
        checked:document.querySelector('#aidechatList .msg-bulk-cb[data-msg-bulk-id="11111111-1111-4111-8111-111111111111"]').checked
      };
    });
    assert.strictEqual(one.checked, true, 'check selects the row');
    assert.strictEqual(one.disabled, false, 'Delete enables after one check');
    assert.strictEqual(one.count, '1 selected');
    assert.strictEqual(one.threadHidden, true, 'checkbox does not open the thread');

    await page.evaluate(function(){window.__rpc=[];});
    await page.click('#msgBulkSelectAll');
    const all = await page.evaluate(function(){
      var boxes=document.querySelectorAll('#aidechatList .msg-bulk-cb');
      var on=0;
      Array.prototype.forEach.call(boxes, function(box){if(box.checked)on++;});
      return {on:on, total:boxes.length, rpc:window.__rpc.map(function(row){return row.name;}), count:document.getElementById('msgBulkCount').textContent};
    });
    assert.strictEqual(all.on, 3, 'Select all checks every aide');
    assert.ok(!all.rpc.some(function(name){return /send|hide|archive|delete|blast|compose/i.test(name);}), 'Select all does not post '+all.rpc.join(','));
    assert.strictEqual(all.count, '3 selected');
    await page.evaluate(function(){window.__rpc=[];});
    await page.click('#msgBulkUnselect');
    const none = await page.evaluate(function(){
      var on=0;
      Array.prototype.forEach.call(document.querySelectorAll('#aidechatList .msg-bulk-cb'), function(box){if(box.checked)on++;});
      return {on:on, disabled:document.getElementById('msgBulkDelete').disabled, rpc:window.__rpc.map(function(row){return row.name;})};
    });
    assert.strictEqual(none.on, 0, 'Unselect clears checks');
    assert.strictEqual(none.disabled, true);
    assert.ok(!none.rpc.some(function(name){return /send|hide|archive|delete|blast|compose/i.test(name);}), 'Unselect does not post '+none.rpc.join(','));

    await page.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="'+MOE+'"]');
    await page.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="'+JORDAN+'"]');
    await page.screenshot({path:path.join(outDir, '02-aides-selected.png')});
    const rpcAtDelete = await page.evaluate(function(){window.__rpcDelete=[]; window.__rpc=window.__rpcDelete; return 0;});
    void rpcAtDelete;
    await page.click('#msgBulkDelete');
    const afterAides = await page.evaluate(function(){
      return {
        names:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        rpc:window.__rpc.map(function(row){return row.name;}),
        count:document.getElementById('msgBulkCount').textContent,
        disabled:document.getElementById('msgBulkDelete').disabled,
        hide:window.__rpc.filter(function(row){return row.name==='admin_hide_aide_office_threads';})
      };
    });
    assert.deepStrictEqual(afterAides.names, ['Sara Alvarez'], 'Delete removes only the checked aides');
    assert.strictEqual(afterAides.count, '0 selected');
    assert.strictEqual(afterAides.disabled, true, 'Delete mutes again');
    assert.strictEqual(afterAides.hide.length, 1, 'Delete posts the hide RPC once');
    assert.deepStrictEqual(afterAides.hide[0].body.p_thread_ids, [MOE, JORDAN], 'payload is the selected thread uuids');
    assert.ok(!afterAides.rpc.some(function(name){return /send|archive|blast|compose|admin_deactivate|archive_client/i.test(name);}), afterAides.rpc.join(','));

    await page.click('#msgSegClients');
    const clientsOn = await page.evaluate(function(){
      return {
        names:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        checks:document.querySelectorAll('#msgClientList .msg-bulk-cb').length,
        disabled:document.getElementById('msgBulkDelete').disabled,
        count:document.getElementById('msgBulkCount').textContent
      };
    });
    assert.deepStrictEqual(clientsOn.names, ['Bowlax Abib','Ada Cole','Rita Morales'], 'Clients tab is untouched');
    assert.strictEqual(clientsOn.checks, 3, 'Clients rows have checks');
    assert.strictEqual(clientsOn.disabled, true, 'Clients Delete stays muted');
    assert.strictEqual(clientsOn.count, '0 selected');
    await page.click('#msgClientList .msg-bulk-cb[data-msg-bulk-id="c-bowlax"]');
    const clientsGap = await page.evaluate(function(){
      var del=document.getElementById('msgBulkDelete');
      return {
        disabled:!!del.disabled,
        callout:document.getElementById('msgBulkCallout').textContent,
        count:document.getElementById('msgBulkCount').textContent
      };
    });
    assert.strictEqual(clientsGap.disabled, true, 'Clients Delete stays muted after a check');
    assert.ok(clientsGap.callout.indexOf('not live yet')>=0, clientsGap.callout);
    assert.strictEqual(clientsGap.count, '1 selected');
    await page.screenshot({path:path.join(outDir, '03-clients-selected.png')});
    await page.evaluate(function(){window.__rpc=[];});
    await page.evaluate(function(){return msgBulkDelete1Delete();});
    const afterClients = await page.evaluate(function(){
      remiMsgTab1SetSegment('aides');
      return {
        clients:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        aides:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        hide:window.__rpc.filter(function(row){return row.name==='admin_hide_aide_office_threads';}).length
      };
    });
    assert.deepStrictEqual(afterClients.clients, ['Bowlax Abib','Ada Cole','Rita Morales'], 'Clients Delete does not remove clients');
    assert.deepStrictEqual(afterClients.aides, ['Sara Alvarez'], 'Clients Delete leaves Aides alone');
    assert.strictEqual(afterClients.hide, 0, 'Clients Delete does not post the aide hide RPC');

    const refresh = await page.evaluate(function(){
      aidechatPaintInbox();
      remiMsgTab1Segment='clients';
      remiMsgTab1PaintClients();
      return {
        aides:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        clients:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;})
      };
    });
    assert.deepStrictEqual(refresh.aides, ['Sara Alvarez'], 'refresh keeps deleted aides hidden');
    assert.deepStrictEqual(refresh.clients, ['Bowlax Abib','Ada Cole','Rita Morales'], 'Clients stay painted. Delete is not live on that inbox');

    const schedPage = await browser.newPage();
    await schedPage.setViewport({width:390, height:844, isMobile:true, hasTouch:true});
    await schedPage.goto('http://127.0.0.1:'+port+'/', {waitUntil:'domcontentloaded', timeout:60000});
    const schedBoot = await schedPage.evaluate(async function(){
      window.__rpc=[];
      readSbSession=function(){return {access_token:'office-jwt', email:'scheduler@evercare.test'};};
      window.__hidden={};
      sbRestRpc=async function(name, body){
        window.__rpc.push({name:name, body:body||{}});
        if(name==='admin_hide_aide_office_threads'){
          var ids=(body&&body.p_thread_ids)||[];
          ids.forEach(function(id){window.__hidden[id]=1;});
          return {ok:true, status:200, data:{success:true, ok:true, history_deleted:false, inbox:'aide', marker:'msg-bulk-delete1', hidden_thread_ids:ids}};
        }
        if(name==='admin_list_aide_office_threads'){
          var left=(aidechatThreads||[]).filter(function(t){return !window.__hidden[String(t.id)];});
          return {ok:true, data:{success:true, threads:left}};
        }
        return {ok:true, data:{success:true, threads:[], messages:[], enabled:false, start_local:'14:00', end_local:'08:00'}};
      };
      startAdminSession({role:'Scheduler', username:'scheduler', name:'Scheduler'});
      showScreen('adminScreen');
      showTab('aidechat');
      await aidechatOpen();
      sessionStorage.removeItem('evercare_msg_bulk_delete1_aides');
      sessionStorage.removeItem('evercare_msg_bulk_delete1_clients');
      aidechatThreads=[
        {id:'11111111-1111-4111-8111-111111111111', aide_id:'a-moe', username:'moe', name:'moe', status:'open', last_message:'Can I swap Sunday with Sara?', last_at:'2026-09-29T12:00:00Z', messages:[], preview_from_aide:'Can I swap Sunday with Sara?'},
        {id:'22222222-2222-4222-8222-222222222222', aide_id:'a-sara', username:'sara', name:'Sara Alvarez', status:'open', last_message:'Done', last_at:'2026-09-29T11:00:00Z', messages:[], preview_from_aide:'Done'},
        {id:'33333333-3333-4333-8333-333333333333', aide_id:'a-jordan', username:'jordan', name:'Jordan Kim', status:'open', last_message:'Timesheet week of 9/21', last_at:'2026-09-29T10:00:00Z', messages:[], preview_from_aide:'Timesheet week of 9/21'}
      ];
      allClients=[
        {id:'c-bowlax', name:'Bowlax Abib', phone:'(216) 555-0142', isActive:true},
        {id:'c-ada', name:'Ada Cole', phone:'(216) 555-0199', isActive:true},
        {id:'c-rita', name:'Rita Morales', phone:'', isActive:true}
      ];
      remiMsgTab1Segment='aides';
      aidechatPaintInbox();
      if(typeof layoutA1ApplyRoles==='function')layoutA1ApplyRoles();
      function chrome(id){
        var el=document.getElementById(id);
        var st=el?getComputedStyle(el):null;
        return {
          roles:el?el.getAttribute('data-layout-roles'):'',
          hidden:!(el&&!el.hasAttribute('hidden')&&st&&st.display!=='none'&&st.visibility!=='hidden')
        };
      }
      var ids=['msgBulkToolbar','msgBulkSelectAll','msgBulkUnselect','msgBulkDelete','msgBulkCount','msgBulkCallout'];
      var pieces={};
      ids.forEach(function(id){pieces[id]=chrome(id);});
      var del=document.getElementById('msgBulkDelete');
      return {
        role:currentAdminRole,
        roleOk:msgBulkDelete1RoleOk(),
        checks:document.querySelectorAll('#aidechatList .msg-bulk-cb').length,
        names:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        disabled:!!del.disabled,
        count:document.getElementById('msgBulkCount').textContent,
        labels:document.getElementById('msgBulkToolbar').textContent,
        pieces:pieces
      };
    });
    assert.strictEqual(schedBoot.role, 'Scheduler', 'Scheduler login');
    assert.strictEqual(schedBoot.roleOk, true, 'Scheduler role gate');
    assert.strictEqual(schedBoot.checks, 3, 'Scheduler aides rows have checks');
    assert.deepStrictEqual(schedBoot.names, ['moe','Sara Alvarez','Jordan Kim']);
    assert.strictEqual(schedBoot.disabled, true, 'Scheduler Delete muted until select');
    assert.strictEqual(schedBoot.count, '0 selected');
    assert.ok(schedBoot.labels.indexOf('Select all')>=0 && schedBoot.labels.indexOf('Unselect')>=0 && schedBoot.labels.indexOf('Delete')>=0, schedBoot.labels);
    Object.keys(schedBoot.pieces).forEach(function(id){
      assert.strictEqual(schedBoot.pieces[id].roles, 'Admin Scheduler', id+' is shared chrome');
      assert.strictEqual(schedBoot.pieces[id].hidden, false, id+' stays visible for Scheduler login');
    });
    await schedPage.screenshot({path:path.join(outDir, '05-scheduler-aides-idle.png')});

    await schedPage.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="'+MOE+'"]');
    const schedOne = await schedPage.evaluate(function(){
      var del=document.getElementById('msgBulkDelete');
      return {
        disabled:!!del.disabled,
        count:document.getElementById('msgBulkCount').textContent,
        threadHidden:document.getElementById('aidechatThreadView').hidden,
        checked:document.querySelector('#aidechatList .msg-bulk-cb[data-msg-bulk-id="11111111-1111-4111-8111-111111111111"]').checked
      };
    });
    assert.strictEqual(schedOne.checked, true, 'Scheduler check selects the row');
    assert.strictEqual(schedOne.disabled, false, 'Scheduler Delete enables after one check');
    assert.strictEqual(schedOne.count, '1 selected');
    assert.strictEqual(schedOne.threadHidden, true, 'Scheduler checkbox does not open the thread');

    await schedPage.evaluate(function(){window.__rpc=[];});
    await schedPage.click('#msgBulkSelectAll');
    const schedAll = await schedPage.evaluate(function(){
      var on=0;
      Array.prototype.forEach.call(document.querySelectorAll('#aidechatList .msg-bulk-cb'), function(box){if(box.checked)on++;});
      return {on:on, rpc:window.__rpc.map(function(row){return row.name;}), count:document.getElementById('msgBulkCount').textContent};
    });
    assert.strictEqual(schedAll.on, 3, 'Scheduler Select all checks every aide');
    assert.strictEqual(schedAll.count, '3 selected');
    assert.ok(!schedAll.rpc.some(function(name){return /send|hide|archive|delete|blast|compose/i.test(name);}), 'Scheduler Select all does not post '+schedAll.rpc.join(','));
    await schedPage.evaluate(function(){window.__rpc=[];});
    await schedPage.click('#msgBulkUnselect');
    const schedNone = await schedPage.evaluate(function(){
      var on=0;
      Array.prototype.forEach.call(document.querySelectorAll('#aidechatList .msg-bulk-cb'), function(box){if(box.checked)on++;});
      return {on:on, disabled:document.getElementById('msgBulkDelete').disabled, rpc:window.__rpc.map(function(row){return row.name;})};
    });
    assert.strictEqual(schedNone.on, 0, 'Scheduler Unselect clears checks');
    assert.strictEqual(schedNone.disabled, true);
    assert.ok(!schedNone.rpc.some(function(name){return /send|hide|archive|delete|blast|compose/i.test(name);}), 'Scheduler Unselect does not post '+schedNone.rpc.join(','));

    await schedPage.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="'+MOE+'"]');
    await schedPage.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="'+JORDAN+'"]');
    await schedPage.screenshot({path:path.join(outDir, '06-scheduler-aides-selected.png')});
    await schedPage.evaluate(function(){window.__rpc=[];});
    await schedPage.click('#msgBulkDelete');
    const schedAides = await schedPage.evaluate(function(){
      return {
        names:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        rpc:window.__rpc.map(function(row){return row.name;}),
        count:document.getElementById('msgBulkCount').textContent,
        disabled:document.getElementById('msgBulkDelete').disabled,
        hide:window.__rpc.filter(function(row){return row.name==='admin_hide_aide_office_threads';})
      };
    });
    assert.deepStrictEqual(schedAides.names, ['Sara Alvarez'], 'Scheduler Delete removes only the checked aides');
    assert.strictEqual(schedAides.count, '0 selected');
    assert.strictEqual(schedAides.disabled, true);
    assert.strictEqual(schedAides.hide.length, 1, 'Scheduler posts the same hide RPC once');
    assert.deepStrictEqual(schedAides.hide[0].body.p_thread_ids, [MOE, JORDAN]);
    assert.ok(!schedAides.rpc.some(function(name){return /send|archive|blast|compose|admin_deactivate/i.test(name);}), schedAides.rpc.join(','));

    await schedPage.click('#msgSegClients');
    const schedClientsOn = await schedPage.evaluate(function(){
      return {
        names:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        checks:document.querySelectorAll('#msgClientList .msg-bulk-cb').length,
        disabled:document.getElementById('msgBulkDelete').disabled,
        count:document.getElementById('msgBulkCount').textContent,
        roles:document.getElementById('msgBulkToolbar').getAttribute('data-layout-roles')
      };
    });
    assert.deepStrictEqual(schedClientsOn.names, ['Bowlax Abib','Ada Cole','Rita Morales'], 'Scheduler Clients tab is untouched');
    assert.strictEqual(schedClientsOn.checks, 3, 'Scheduler Clients rows have checks');
    assert.strictEqual(schedClientsOn.disabled, true, 'Scheduler Clients Delete starts muted');
    assert.strictEqual(schedClientsOn.count, '0 selected');
    assert.strictEqual(schedClientsOn.roles, 'Admin Scheduler');
    await schedPage.evaluate(function(){window.__rpc=[];});
    await schedPage.click('#msgBulkSelectAll');
    const schedClientsAll = await schedPage.evaluate(function(){
      var on=0;
      Array.prototype.forEach.call(document.querySelectorAll('#msgClientList .msg-bulk-cb'), function(box){if(box.checked)on++;});
      var del=document.getElementById('msgBulkDelete');
      return {on:on, count:document.getElementById('msgBulkCount').textContent, disabled:!!del.disabled, callout:document.getElementById('msgBulkCallout').textContent, rpc:window.__rpc.map(function(row){return row.name;})};
    });
    assert.strictEqual(schedClientsAll.on, 3, 'Scheduler Select all checks every client');
    assert.strictEqual(schedClientsAll.count, '3 selected');
    assert.strictEqual(schedClientsAll.disabled, true, 'Scheduler Clients Delete stays muted');
    assert.ok(schedClientsAll.callout.indexOf('not live yet')>=0, schedClientsAll.callout);
    assert.ok(!schedClientsAll.rpc.some(function(name){return name==='admin_hide_aide_office_threads'||/send|archive|blast|compose/i.test(name);}), 'Scheduler client Select all does not post');
    await schedPage.click('#msgBulkUnselect');
    await schedPage.click('#msgClientList .msg-bulk-cb[data-msg-bulk-id="c-bowlax"]');
    await schedPage.screenshot({path:path.join(outDir, '07-scheduler-clients-selected.png')});
    await schedPage.evaluate(function(){window.__rpc=[];});
    await schedPage.evaluate(function(){return msgBulkDelete1Delete();});
    const schedAfter = await schedPage.evaluate(function(){
      remiMsgTab1SetSegment('aides');
      return {
        clients:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        aides:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        hide:window.__rpc.filter(function(row){return row.name==='admin_hide_aide_office_threads';}).length
      };
    });
    assert.deepStrictEqual(schedAfter.clients, ['Bowlax Abib','Ada Cole','Rita Morales'], 'Scheduler Clients Delete does not remove clients');
    assert.deepStrictEqual(schedAfter.aides, ['Sara Alvarez'], 'Scheduler Clients Delete leaves Aides alone');
    assert.strictEqual(schedAfter.hide, 0, 'Scheduler Clients Delete does not post the aide hide RPC');
    await schedPage.close();

    const nurse = await page.evaluate(async function(){
      var before=window.__rpc.filter(function(row){return row.name==='admin_hide_aide_office_threads';}).length;
      remiMsgTab1Segment='aides';
      currentAdminRole='Nurse';
      msgBulkDelete1Selected={aides:{'22222222-2222-4222-8222-222222222222':1}, clients:{}};
      msgBulkDelete1Busy=false;
      await msgBulkDelete1Delete();
      msgBulkDelete1SelectAll();
      return {
        roleOk:msgBulkDelete1RoleOk(),
        same:window.__rpc.filter(function(row){return row.name==='admin_hide_aide_office_threads';}).length===before,
        hidden:!!window.__hidden['22222222-2222-4222-8222-222222222222'],
        sara:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;})
      };
    });
    assert.strictEqual(nurse.roleOk, false, 'Nurse denied');
    assert.strictEqual(nurse.same, true, 'Nurse delete does not post');
    assert.strictEqual(nurse.hidden, false, 'Nurse does not hide Sara');
    assert.ok(nurse.sara.indexOf('Sara Alvarez')>=0, 'Sara stays in the inbox');
    await page.screenshot({path:path.join(outDir, '04-toolbar.png')});
  }finally{
    await browser.close();
    await new Promise(function(resolve){server.close(resolve);});
  }
}

runVm().then(function(){
  return runBrowser();
}).then(function(){
  console.log('admin-msg-bulk-delete1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
