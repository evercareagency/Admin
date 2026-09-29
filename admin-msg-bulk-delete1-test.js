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
assert.ok(html.includes('Ace CALLABLE for a server-side hide is standing by'), 'Ace hide stays standing by');
assert.ok(html.includes('evercare_msg_bulk_delete1_aides'), 'aides session key');
assert.ok(html.includes('evercare_msg_bulk_delete1_clients'), 'clients session key');
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
assert.ok(html.includes('id="msgBulkCount">0 selected'), 'count starts at 0 selected');
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
assert.ok(!selectFn.includes('sessionStorage') && !unselectFn.includes('sessionStorage'), 'Select all and Unselect do not store');
assert.ok(!selectFn.includes('sbRestRpc') && !unselectFn.includes('sbRestRpc') && !deleteFn.includes('sbRestRpc'), 'toolbar does not post');
['admin_send_aide_office_message','admin_send_aide_text','admin_compose_aide_text','sms:','mailto:','quo','archive_client','admin_deactivate'].forEach(function(name){
  assert.ok(!deleteFn.includes(name), 'delete does not call ' + name);
});
assert.ok(deleteFn.includes('msgBulkDelete1Remember'), 'delete remembers the ids');
assert.ok(roleFn.includes("role==='Nurse'"), 'Nurse is denied');
assert.ok(roleFn.includes('Scheduler'), 'Scheduler is included');
assert.ok(roleFn.includes('This chrome is not Admin-only'), 'role gate says the chrome is shared');
assert.ok(roleFn.includes("role!=='Admin'&&role!=='Scheduler'"), 'Admin and Scheduler pass the same gate');
assert.ok(!/if\s*\(\s*role\s*===\s*'Admin'\s*\)/.test(roleFn), 'role gate is not Admin-only');
[selectFn, unselectFn, deleteFn].forEach(function(fn){
  assert.ok(fn.includes('msgBulkDelete1RoleOk()'), 'action uses the shared gate');
  assert.ok(!fn.includes("role==='Admin'"), 'action is not Admin-only');
});
assert.ok(extractFn(html, 'function aidechatPaintInbox()').includes("msgBulkDelete1Filter('aides'"), 'aides paint filters hidden ids');
assert.ok(extractFn(html, 'function remiMsgTab1PaintClients()').includes("msgBulkDelete1Filter('clients'"), 'clients paint filters hidden ids');
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
  'function msgBulkDelete1StoreKey(inbox)',
  'function msgBulkDelete1Read(inbox)',
  'function msgBulkDelete1Write(inbox, ids)',
  'function msgBulkDelete1Remember(inbox, id)',
  'function msgBulkDelete1Hidden(inbox, id)',
  'function msgBulkDelete1Filter(inbox, rows)',
  'function msgBulkDelete1Rows()',
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
  'function aidechatRoleOk(){return currentAdminRole!=="Nurse";}',
  'function aidechatSorted(){return aideRows.slice();}',
  'function remiMsgTab1ClientRows(){return clientRows.slice();}',
  'function aidechatPaintInbox(){paints.push("aides");}',
  'function remiMsgTab1PaintClients(){paints.push("clients");}',
  'function aidechatShow(which){shows.push(which);}',
  'function showTempMsg(msg){toasts.push(msg);}'
].join('\n'), ctx);

function plain(expr){
  return JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));
}

const aides = [
  {id:'a-moe', name:'moe'},
  {id:'a-sara', name:'Sara Alvarez'},
  {id:'a-jordan', name:'Jordan Kim'}
];
const clients = [
  {id:'c-bowlax', name:'Bowlax Abib'},
  {id:'c-ada', name:'Ada Cole'},
  {id:'c-rita', name:'Rita Morales'}
];

async function runVm(){
  vm.runInContext('currentAdminRole="Admin"; remiMsgTab1Segment="aides"; aideRows='+JSON.stringify(aides)+'; clientRows='+JSON.stringify(clients)+'; paints.length=0; toasts.length=0; msgBulkDelete1Busy=false; msgBulkDelete1Selected={aides:{},clients:{}};', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1RoleOk()', ctx), true, 'Admin is allowed');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 0, 'nothing selected');
  const idle = vm.runInContext('msgBulkDelete1CheckHtml("aides","a-moe","moe", false)', ctx);
  assert.ok(idle.includes('class="msg-bulk-cb"') && !idle.includes('checked'), 'unchecked box');
  assert.ok(vm.runInContext('msgBulkDelete1Callout(0)', ctx).includes('Delete stays off'), 'muted copy');

  vm.runInContext('msgBulkDelete1SelectAll();', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 3, 'Select all checks every aide');
  assert.strictEqual(store.evercare_msg_bulk_delete1_aides, undefined, 'Select all does not store');
  assert.strictEqual(store.evercare_msg_bulk_delete1_clients, undefined, 'Select all does not touch clients');
  vm.runInContext('msgBulkDelete1Unselect();', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 0, 'Unselect clears aides');
  assert.strictEqual(store.evercare_msg_bulk_delete1_aides, undefined, 'Unselect does not store');

  vm.runInContext('msgBulkDelete1Selected.aides={"a-moe":1,"a-jordan":1};', ctx);
  store.evercare_msg_bulk_delete1_clients = JSON.stringify({v:1, ids:['c-keep']});
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(vm.runInContext('toasts[0]', ctx), 'Cleared from this inbox');
  assert.deepStrictEqual(plain('msgBulkDelete1Filter("aides", aideRows).map(function(r){return r.id;})'), ['a-sara'], 'Aides delete removes only the checked rows');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Hidden("aides","a-moe")', ctx), true);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Hidden("aides","a-sara")', ctx), false, 'unchecked aide stays');
  assert.deepStrictEqual(plain('msgBulkDelete1Filter("clients", clientRows).map(function(r){return r.id;})'), ['c-bowlax','c-ada','c-rita'], 'Aides delete leaves Clients alone');
  assert.ok(store.evercare_msg_bulk_delete1_clients.includes('c-keep'), 'clients session key stays');
  assert.ok(!store.evercare_msg_bulk_delete1_aides.includes('a-sara'), 'unchecked aide is not stored');

  vm.runInContext('remiMsgTab1Segment="clients"; msgBulkDelete1Selected.clients={"c-bowlax":1}; toasts.length=0; paints.length=0;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.deepStrictEqual(plain('msgBulkDelete1Filter("clients", clientRows).map(function(r){return r.id;})'), ['c-ada','c-rita'], 'Clients delete removes only the checked client');
  assert.deepStrictEqual(plain('msgBulkDelete1Filter("aides", aideRows).map(function(r){return r.id;})'), ['a-sara'], 'Clients delete leaves the remaining aide');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Hidden("clients","c-ada")', ctx), false);
  assert.strictEqual(vm.runInContext('toasts[0]', ctx), 'Cleared from this inbox');

  delete store.evercare_msg_bulk_delete1_aides;
  delete store.evercare_msg_bulk_delete1_clients;
  vm.runInContext('currentAdminRole="Scheduler"; currentAdminUsername="scheduler"; remiMsgTab1Segment="aides"; msgBulkDelete1Busy=false; msgBulkDelete1Selected={aides:{},clients:{}}; msgBulkDelete1Note=""; msgBulkDelete1NoteInbox="";', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1RoleOk()', ctx), true, 'Scheduler login shares the inbox');
  vm.runInContext('msgBulkDelete1SelectAll();', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 3, 'Scheduler Select all checks every aide');
  assert.strictEqual(store.evercare_msg_bulk_delete1_aides, undefined, 'Scheduler Select all does not store');
  vm.runInContext('msgBulkDelete1Unselect();', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 0, 'Scheduler Unselect clears aides');
  assert.strictEqual(store.evercare_msg_bulk_delete1_aides, undefined, 'Scheduler Unselect does not store');
  vm.runInContext('msgBulkDelete1Selected.aides={"a-moe":1,"a-jordan":1};', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.deepStrictEqual(plain('msgBulkDelete1Filter("aides", aideRows).map(function(r){return r.id;})'), ['a-sara'], 'Scheduler Aides delete removes only the checked rows');
  assert.deepStrictEqual(plain('msgBulkDelete1Filter("clients", clientRows).map(function(r){return r.id;})'), ['c-bowlax','c-ada','c-rita'], 'Scheduler Aides delete leaves Clients alone');
  vm.runInContext('remiMsgTab1Segment="clients"; msgBulkDelete1Selected={aides:{},clients:{"c-bowlax":1}}; msgBulkDelete1Busy=false;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.deepStrictEqual(plain('msgBulkDelete1Filter("clients", clientRows).map(function(r){return r.id;})'), ['c-ada','c-rita'], 'Scheduler Clients delete removes only the checked client');
  assert.deepStrictEqual(plain('msgBulkDelete1Filter("aides", aideRows).map(function(r){return r.id;})'), ['a-sara'], 'Scheduler Clients delete leaves the remaining aide');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Hidden("clients","c-ada")', ctx), false, 'Scheduler leaves Ada');

  vm.runInContext('currentAdminRole="Nurse"; msgBulkDelete1Busy=false; remiMsgTab1Segment="clients"; msgBulkDelete1Selected={aides:{},clients:{"c-ada":1}};', ctx);
  const beforeNurse = store.evercare_msg_bulk_delete1_clients;
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  vm.runInContext('msgBulkDelete1SelectAll();', ctx);
  assert.strictEqual(store.evercare_msg_bulk_delete1_clients, beforeNurse, 'Nurse delete writes nothing');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Hidden("clients","c-ada")', ctx), false, 'Nurse does not hide a client');
  assert.strictEqual(vm.runInContext('msgBulkDelete1RoleOk()', ctx), false, 'Nurse is denied');
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
      sbRestRpc=async function(name, body){
        window.__rpc.push({name:name, body:body||{}});
        return {ok:true, data:{success:true, threads:[], messages:[], enabled:false, start_local:'14:00', end_local:'08:00'}};
      };
      showScreen('adminScreen');
      showTab('aidechat');
      await aidechatOpen();
      sessionStorage.removeItem('evercare_msg_bulk_delete1_aides');
      sessionStorage.removeItem('evercare_msg_bulk_delete1_clients');
      aidechatThreads=[
        {id:'a-moe', aide_id:'a-moe', username:'moe', name:'moe', status:'open', last_message:'Can I swap Sunday with Sara?', last_at:'2026-09-29T12:00:00Z', messages:[], preview_from_aide:'Can I swap Sunday with Sara?'},
        {id:'a-sara', aide_id:'a-sara', username:'sara', name:'Sara Alvarez', status:'open', last_message:'Done', last_at:'2026-09-29T11:00:00Z', messages:[], preview_from_aide:'Done'},
        {id:'a-jordan', aide_id:'a-jordan', username:'jordan', name:'Jordan Kim', status:'open', last_message:'Timesheet week of 9/21', last_at:'2026-09-29T10:00:00Z', messages:[], preview_from_aide:'Timesheet week of 9/21'}
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

    await page.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="a-moe"]');
    const one = await page.evaluate(function(){
      var del=document.getElementById('msgBulkDelete');
      return {
        disabled:!!del.disabled,
        count:document.getElementById('msgBulkCount').textContent,
        threadHidden:document.getElementById('aidechatThreadView').hidden,
        checked:document.querySelector('#aidechatList .msg-bulk-cb[data-msg-bulk-id="a-moe"]').checked
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

    await page.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="a-moe"]');
    await page.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="a-jordan"]');
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
        aidesKey:sessionStorage.getItem('evercare_msg_bulk_delete1_aides'),
        clientsKey:sessionStorage.getItem('evercare_msg_bulk_delete1_clients')
      };
    });
    assert.deepStrictEqual(afterAides.names, ['Sara Alvarez'], 'Delete removes only the checked aides');
    assert.strictEqual(afterAides.count, '0 selected');
    assert.strictEqual(afterAides.disabled, true, 'Delete mutes again');
    assert.strictEqual(afterAides.clientsKey, null, 'Aides delete does not write the clients key');
    assert.ok(afterAides.aidesKey.indexOf('a-moe')>=0 && afterAides.aidesKey.indexOf('a-jordan')>=0, afterAides.aidesKey);
    assert.ok(!afterAides.rpc.some(function(name){return /send|hide|archive|delete|blast|compose/i.test(name);}), afterAides.rpc.join(','));

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
    assert.strictEqual(clientsOn.disabled, true);
    assert.strictEqual(clientsOn.count, '0 selected');
    await page.click('#msgClientList .msg-bulk-cb[data-msg-bulk-id="c-bowlax"]');
    await page.screenshot({path:path.join(outDir, '03-clients-selected.png')});
    await page.evaluate(function(){window.__rpc=[];});
    await page.click('#msgBulkDelete');
    const afterClients = await page.evaluate(function(){
      remiMsgTab1SetSegment('aides');
      return {
        clients:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        aides:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        rpc:window.__rpc.map(function(row){return row.name;})
      };
    });
    assert.deepStrictEqual(afterClients.clients, ['Ada Cole','Rita Morales'], 'Clients delete removes only Bowlax');
    assert.deepStrictEqual(afterClients.aides, ['Sara Alvarez'], 'Clients delete leaves Aides alone');
    assert.ok(!afterClients.rpc.some(function(name){return /send|hide|archive|delete|blast|compose/i.test(name);}), afterClients.rpc.join(','));

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
    assert.deepStrictEqual(refresh.clients, ['Ada Cole','Rita Morales'], 'refresh keeps the deleted client hidden');

    const schedPage = await browser.newPage();
    await schedPage.setViewport({width:390, height:844, isMobile:true, hasTouch:true});
    await schedPage.goto('http://127.0.0.1:'+port+'/', {waitUntil:'domcontentloaded', timeout:60000});
    const schedBoot = await schedPage.evaluate(async function(){
      window.__rpc=[];
      readSbSession=function(){return {access_token:'office-jwt', email:'scheduler@evercare.test'};};
      sbRestRpc=async function(name, body){
        window.__rpc.push({name:name, body:body||{}});
        return {ok:true, data:{success:true, threads:[], messages:[], enabled:false, start_local:'14:00', end_local:'08:00'}};
      };
      startAdminSession({role:'Scheduler', username:'scheduler', name:'Scheduler'});
      showScreen('adminScreen');
      showTab('aidechat');
      await aidechatOpen();
      sessionStorage.removeItem('evercare_msg_bulk_delete1_aides');
      sessionStorage.removeItem('evercare_msg_bulk_delete1_clients');
      aidechatThreads=[
        {id:'a-moe', aide_id:'a-moe', username:'moe', name:'moe', status:'open', last_message:'Can I swap Sunday with Sara?', last_at:'2026-09-29T12:00:00Z', messages:[], preview_from_aide:'Can I swap Sunday with Sara?'},
        {id:'a-sara', aide_id:'a-sara', username:'sara', name:'Sara Alvarez', status:'open', last_message:'Done', last_at:'2026-09-29T11:00:00Z', messages:[], preview_from_aide:'Done'},
        {id:'a-jordan', aide_id:'a-jordan', username:'jordan', name:'Jordan Kim', status:'open', last_message:'Timesheet week of 9/21', last_at:'2026-09-29T10:00:00Z', messages:[], preview_from_aide:'Timesheet week of 9/21'}
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

    await schedPage.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="a-moe"]');
    const schedOne = await schedPage.evaluate(function(){
      var del=document.getElementById('msgBulkDelete');
      return {
        disabled:!!del.disabled,
        count:document.getElementById('msgBulkCount').textContent,
        threadHidden:document.getElementById('aidechatThreadView').hidden,
        checked:document.querySelector('#aidechatList .msg-bulk-cb[data-msg-bulk-id="a-moe"]').checked
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

    await schedPage.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="a-moe"]');
    await schedPage.click('#aidechatList .msg-bulk-cb[data-msg-bulk-id="a-jordan"]');
    await schedPage.screenshot({path:path.join(outDir, '06-scheduler-aides-selected.png')});
    await schedPage.evaluate(function(){window.__rpc=[];});
    await schedPage.click('#msgBulkDelete');
    const schedAides = await schedPage.evaluate(function(){
      return {
        names:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        rpc:window.__rpc.map(function(row){return row.name;}),
        count:document.getElementById('msgBulkCount').textContent,
        disabled:document.getElementById('msgBulkDelete').disabled,
        clientsKey:sessionStorage.getItem('evercare_msg_bulk_delete1_clients')
      };
    });
    assert.deepStrictEqual(schedAides.names, ['Sara Alvarez'], 'Scheduler Delete removes only the checked aides');
    assert.strictEqual(schedAides.count, '0 selected');
    assert.strictEqual(schedAides.disabled, true);
    assert.strictEqual(schedAides.clientsKey, null, 'Scheduler Aides delete does not write the clients key');
    assert.ok(!schedAides.rpc.some(function(name){return /send|hide|archive|delete|blast|compose/i.test(name);}), schedAides.rpc.join(','));

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
      return {on:on, count:document.getElementById('msgBulkCount').textContent, rpc:window.__rpc.map(function(row){return row.name;})};
    });
    assert.strictEqual(schedClientsAll.on, 3, 'Scheduler Select all checks every client');
    assert.strictEqual(schedClientsAll.count, '3 selected');
    assert.ok(!schedClientsAll.rpc.some(function(name){return /send|hide|archive|delete|blast|compose/i.test(name);}), 'Scheduler client Select all does not post');
    await schedPage.click('#msgBulkUnselect');
    await schedPage.click('#msgClientList .msg-bulk-cb[data-msg-bulk-id="c-bowlax"]');
    await schedPage.screenshot({path:path.join(outDir, '07-scheduler-clients-selected.png')});
    await schedPage.evaluate(function(){window.__rpc=[];});
    await schedPage.click('#msgBulkDelete');
    const schedAfter = await schedPage.evaluate(function(){
      remiMsgTab1SetSegment('aides');
      return {
        clients:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        aides:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        rpc:window.__rpc.map(function(row){return row.name;})
      };
    });
    assert.deepStrictEqual(schedAfter.clients, ['Ada Cole','Rita Morales'], 'Scheduler Clients delete removes only Bowlax');
    assert.deepStrictEqual(schedAfter.aides, ['Sara Alvarez'], 'Scheduler Clients delete leaves Aides alone');
    assert.ok(!schedAfter.rpc.some(function(name){return /send|hide|archive|delete|blast|compose/i.test(name);}), schedAfter.rpc.join(','));
    await schedPage.close();

    const nurse = await page.evaluate(async function(){
      var before=sessionStorage.getItem('evercare_msg_bulk_delete1_aides');
      currentAdminRole='Nurse';
      msgBulkDelete1Selected={aides:{'a-moe':1}, clients:{}};
      msgBulkDelete1Busy=false;
      await msgBulkDelete1Delete();
      msgBulkDelete1SelectAll();
      return {
        roleOk:msgBulkDelete1RoleOk(),
        same:sessionStorage.getItem('evercare_msg_bulk_delete1_aides')===before,
        hidden:msgBulkDelete1Hidden('aides','a-moe')
      };
    });
    assert.strictEqual(nurse.roleOk, false, 'Nurse denied');
    assert.strictEqual(nurse.same, true, 'Nurse delete does not write');
    assert.strictEqual(nurse.hidden, false, 'moe was not hidden by Nurse');
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
