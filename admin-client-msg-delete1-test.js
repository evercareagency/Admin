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

const GAP = 'Client inbox delete isn\u2019t live yet';
const SELECT_COPY = 'Delete hides the selected clients from this inbox. Client stays in Manage. Not a send.';
const DONE_COPY = 'Hidden from this inbox. Client stays active in Manage Clients.';
const PHONE_PREVIEW = 'Call / Text only';
const NOPHONE_PREVIEW = 'no phone on file';

assert.ok(html.includes('v=client-msg-delete1'), 'marker');
assert.ok(html.includes('?v=client-msg-delete1'), 'pages cache bust stays in the contract');
assert.ok(html.includes('admin-build 2026-09-29-client-msg-delete1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-client-msg-delete1">'), 'meta');
assert.ok(html.includes("var CLIENT_MSG_DELETE1_MARKER='v=client-msg-delete1'"), 'script marker');
assert.ok(html.includes("var CLIENT_MSG_DELETE1_BUILD='2026-09-29-client-msg-delete1'"), 'script build');
assert.ok(html.includes('GHOST-CLIENT-MSG-DELETE1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace CALLABLE LIVE'), 'Ace callable live');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('admin_hide_client_message_threads'), 'hide RPC');
assert.ok(html.includes('admin_list_client_message_threads'), 'list RPC');
assert.ok(html.includes('p_client_ids'), 'client id payload');
assert.ok(!html.includes(GAP), 'Clients gap callout is gone');
assert.ok(html.includes(SELECT_COPY), 'selection callout');
assert.ok(html.includes(DONE_COPY), 'success callout');
assert.ok(html.includes(PHONE_PREVIEW), 'phone preview');
assert.ok(html.includes(NOPHONE_PREVIEW), 'no-phone preview');
assert.ok(html.includes('is_scheduler_office'), 'office gate');
assert.ok(html.includes('history_deleted stays false'), 'history is not deleted');
assert.ok(html.includes('clients.is_active false') === false || html.includes('does not set clients.is_active false'), 'hide does not deactivate');
assert.ok(html.includes('The client stays in Manage Clients'), 'Manage still has the client');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/client-msg-delete1-v1.sql')), 'no SQL patch');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays the pages-cache shell');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-29-pages-cache-fresh1"') < html.indexOf('content="2026-09-29-client-msg-delete1"'), 'this tip follows the pages-cache shell');
['v=msg-bulk-delete1','v=aide-thread-header1','v=msg-composer-kb3','v=pages-cache-fresh1','v=remi-msg-tab1','v=aidechat1','admin_hide_aide_office_threads','admin_list_aide_office_threads'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('data-client-msg-delete1="v=client-msg-delete1"'), 'desk marker');
assert.ok(html.includes('data-msg-bulk-delete1="v=msg-bulk-delete1"'), 'bulk marker stays');
assert.ok(html.includes('clean Home Screen URL'), 'clean Home Screen URL stays');

const deleteFn = extractFn(html, 'async function msgBulkDelete1Delete()');
const clientsAt = deleteFn.indexOf("if(inbox==='clients')");
const aideAt = deleteFn.indexOf('admin_hide_aide_office_threads');
assert.ok(clientsAt >= 0 && aideAt > clientsAt, 'Clients branch returns before the aide RPC');
const clientsBranch = deleteFn.slice(clientsAt, aideAt);
assert.ok(clientsBranch.includes("sbRestRpc('admin_hide_client_message_threads', {p_client_ids:cids})"), 'Clients Delete posts the hide RPC once');
assert.ok(!clientsBranch.includes('admin_hide_aide_office_threads'), 'Clients Delete does not call the aide hide RPC');
assert.ok(!clientsBranch.includes('is_active') && !clientsBranch.includes('isActive'), 'Clients Delete does not change active');
assert.ok(clientsBranch.includes('msgBulkDelete1DropClients(cids)'), 'rows drop before the re-list');
assert.ok(clientsBranch.indexOf('msgBulkDelete1Repaint()') < clientsBranch.indexOf('clientMsgDelete1Refresh'), 'paint drops before the re-list');
assert.ok(deleteFn.includes("sbRestRpc('admin_hide_aide_office_threads', {p_thread_ids:ids})"), 'Aides Delete still posts the aide hide RPC');
assert.ok(deleteFn.indexOf("role==='Nurse'") < deleteFn.indexOf('sbRestRpc'), 'Nurse returns before either RPC');
['admin_send_aide_office_message','admin_send_aide_text','admin_compose_aide_text','quo','archive_client','admin_deactivate','admin_hide_aide_message'].forEach(function(name){
  assert.ok(!clientsBranch.includes(name), 'client delete does not call ' + name);
});
assert.ok(!extractFn(html, 'function msgBulkDelete1DropClients(ids)').includes('is_active'), 'drop does not deactivate');
assert.ok(!extractFn(html, 'function msgBulkDelete1DropClients(ids)').includes('allClients'), 'drop does not touch Manage clients');
assert.ok(extractFn(html, 'async function clientMsgDelete1Refresh()').includes("sbRestRpc('admin_list_client_message_threads', {})"), 'list posts an empty body');
assert.ok(extractFn(html, 'function clientMsgDelete1MapRow(raw)').includes("preview='Call / Text only'"), 'phone preview is exact');
assert.ok(extractFn(html, 'function clientMsgDelete1MapRow(raw)').includes("preview='no phone on file'"), 'no-phone preview is exact');
assert.ok(extractFn(html, 'function msgBulkDelete1SyncChrome()').includes('var off=n<1'), 'Delete enables from the count, including Clients');
assert.ok(!extractFn(html, 'function msgBulkDelete1SyncChrome()').includes('clients||n<1'), 'Clients are not forced mute');

const ADA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const RUTH = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const QUIET = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const MOE = '11111111-1111-4111-8111-111111111111';

function listed(){
  return [
    {client_id:ADA, display_name:'Ada Cole', phone:'2165550100', preview:'Call / Text only', updated_at:'2026-09-29T12:00:00Z', sort_key:'2026-09-29T12:00:00Z', sms_link:'sms:2165550100', tel_link:'tel:2165550100'},
    {client_id:RUTH, display_name:'Ruth Coleman', phone:null, preview:'no phone on file', updated_at:'2026-09-29T11:00:00Z', sort_key:'2026-09-29T11:00:00Z', sms_link:null, tel_link:null},
    {client_id:QUIET, display_name:'Quiet Client', phone:'2165550199', preview:'Call / Text only', updated_at:'2026-09-29T10:00:00Z', sort_key:'2026-09-29T10:00:00Z', sms_link:'sms:2165550199', tel_link:'tel:2165550199'}
  ];
}

const paints = [];
const toasts = [];
const ctx = {
  paints:paints,
  toasts:toasts,
  shows:[],
  document:{getElementById:function(){return {disabled:false, classList:{toggle:function(){}}, textContent:''};}}
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
  'function msgBulkDelete1DropClients(ids)',
  'function clientMsgDelete1Marker()',
  'function clientMsgDelete1MapRow(raw)',
  'function clientMsgDelete1MapList(data)',
  'function clientMsgDelete1InboxRows()',
  'async function clientMsgDelete1Refresh()',
  'function clientMsgDelete1KickLoad()',
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
  'var clientMsgDelete1Rows=[];',
  'var clientMsgDelete1Loaded=false;',
  'var clientMsgDelete1Gen=0;',
  'var clientMsgDelete1Kick=false;',
  'var currentAdminRole="Admin";',
  'var currentAdminUsername="mo";',
  'var remiMsgTab1Segment="clients";',
  'var remiMsgTab1ClientId="";',
  'var aidechatSelectedId="";',
  'var aidechatThreads=[];',
  'var aideRows=[];',
  'var manageClients=[];',
  'var listHold=null;',
  'var rpcs=[];',
  'var aideRefreshes=0;',
  'function aidechatRoleOk(){return currentAdminRole!=="Nurse";}',
  'function aidechatSorted(){return aideRows.slice();}',
  'function aidechatShow(which){shows.push(which);}',
  'function aidechatPaintInbox(){paints.push("aides");}',
  'function remiMsgTab1PaintClients(){paints.push(clientMsgDelete1Rows.map(function(r){return r.id;}));}',
  'function remiMsgTab1ClientRows(){return [];}',
  'function showTempMsg(msg){toasts.push(msg);}',
  'function sbRestRpc(name, body){',
  '  rpcs.push({name:name, body:body});',
  '  if(name==="admin_hide_client_message_threads"){',
  '    return Promise.resolve({ok:true, status:200, data:{success:true, ok:true, marker:"client-msg-delete1", v:"client-msg-delete1", inbox:"client", history_deleted:false, hidden_count:(body.p_client_ids||[]).length, hidden_client_ids:body.p_client_ids||[]}});',
  '  }',
  '  if(name==="admin_hide_aide_office_threads"){',
  '    return Promise.resolve({ok:true, status:200, data:{success:true, ok:true, history_deleted:false, inbox:"aide", hidden_thread_ids:(body&&body.p_thread_ids)||[]}});',
  '  }',
  '  if(name==="admin_list_client_message_threads"){',
  '    if(listHold)return listHold.then(function(){return {ok:true, status:200, data:clientMsgDelete1Rows.slice()};});',
  '    return Promise.resolve({ok:true, status:200, data:clientMsgDelete1Rows.slice()});',
  '  }',
  '  if(name==="admin_list_aide_office_threads")return Promise.resolve({ok:true, data:{success:true, threads:aideRows.slice()}});',
  '  return Promise.resolve({ok:false, status:404, error:"offline"});',
  '}',
  'function aidechatRefresh(){aideRefreshes++; aideRows=aidechatThreads.slice(); return Promise.resolve();}'
].join('\n'), ctx);

function plain(expr){
  return JSON.parse(JSON.stringify(vm.runInContext(expr, ctx)));
}
function idsOf(expr){
  return plain(expr+'.map(function(r){return r.client_id||r.id;})');
}
function clientHides(){
  return plain('rpcs').filter(function(row){return row.name==='admin_hide_client_message_threads';});
}
function aideHides(){
  return plain('rpcs').filter(function(row){return row.name==='admin_hide_aide_office_threads';});
}
function listCalls(){
  return plain('rpcs').filter(function(row){return row.name==='admin_list_client_message_threads';});
}

function resetDesk(role){
  vm.runInContext(
    'currentAdminRole='+JSON.stringify(role)+'; remiMsgTab1Segment="clients"; remiMsgTab1ClientId=""; aidechatThreads=[]; aideRows=[]; paints.length=0; toasts.length=0; shows.length=0; rpcs.length=0; aideRefreshes=0; listHold=null; msgBulkDelete1Busy=false; msgBulkDelete1Note=""; msgBulkDelete1NoteInbox=""; msgBulkDelete1Selected={aides:{},clients:{}}; manageClients='+JSON.stringify([
      {id:ADA, name:'Ada Cole', phone:'2165550100', isActive:true, is_active:true},
      {id:RUTH, name:'Ruth Coleman', phone:'', isActive:true, is_active:true},
      {id:QUIET, name:'Quiet Client', phone:'2165550199', isActive:true, is_active:true}
    ])+'; clientMsgDelete1Rows=clientMsgDelete1MapList('+JSON.stringify(listed())+'); clientMsgDelete1Loaded=true; clientMsgDelete1Gen=0; clientMsgDelete1Kick=false;',
    ctx
  );
}

async function runVm(){
  const mapped = plain('clientMsgDelete1MapList('+JSON.stringify(listed())+')');
  assert.deepStrictEqual(mapped.map(function(row){return row.id;}), [ADA, RUTH, QUIET], 'client_id is the row id, newest first');
  assert.strictEqual(mapped[0].preview, PHONE_PREVIEW);
  assert.strictEqual(mapped[0].sms_link, 'sms:2165550100');
  assert.strictEqual(mapped[0].tel_link, 'tel:2165550100');
  assert.strictEqual(mapped[1].preview, NOPHONE_PREVIEW);
  assert.strictEqual(mapped[1].sms_link, null);
  assert.strictEqual(mapped[1].tel_link, null);
  assert.deepStrictEqual(plain('clientMsgDelete1MapList({threads:[]})'), [], 'an envelope is not a client list');

  resetDesk('Admin');
  assert.strictEqual(vm.runInContext('msgBulkDelete1RoleOk()', ctx), true, 'Admin is allowed');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 0, 'nothing selected');
  assert.ok(vm.runInContext('msgBulkDelete1Callout(0)', ctx).includes('Delete stays off'), 'muted copy');
  vm.runInContext('msgBulkDelete1SelectAll();', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 3, 'Select all checks every client');
  assert.strictEqual(clientHides().length, 0, 'Select all does not post');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Callout(3)', ctx), SELECT_COPY);
  vm.runInContext('msgBulkDelete1Unselect();', ctx);
  assert.strictEqual(vm.runInContext('msgBulkDelete1Count()', ctx), 0, 'Unselect clears clients');
  assert.strictEqual(clientHides().length, 0, 'Unselect does not post');

  vm.runInContext('msgBulkDelete1Selected.clients['+JSON.stringify(ADA)+']=1; msgBulkDelete1Selected.clients['+JSON.stringify(QUIET)+']=1; paints.length=0; toasts.length=0; rpcs.length=0;', ctx);
  let release;
  vm.runInContext('listHold=new Promise(function(resolve){listRelease=resolve;});', ctx);
  const pending = vm.runInContext('msgBulkDelete1Delete()', ctx);
  await new Promise(function(r){setTimeout(r, 30);});
  assert.strictEqual(clientHides().length, 1, 'Delete posts the client hide RPC once');
  assert.deepStrictEqual(clientHides()[0].body, {p_client_ids:[ADA, QUIET]}, 'payload is the selected client uuids');
  assert.strictEqual(aideHides().length, 0, 'Clients Delete does not call the aide RPC');
  assert.deepStrictEqual(plain('paints[0]'), [RUTH], 'the checked rows drop before the list returns');
  assert.strictEqual(vm.runInContext('toasts[0]', ctx), 'Hidden from this inbox');
  assert.deepStrictEqual(idsOf('manageClients'), [ADA, RUTH, QUIET], 'Manage clients stay');
  assert.ok(plain('manageClients').every(function(row){return row.isActive===true && row.is_active===true;}), 'hide does not clear is_active');
  vm.runInContext('clientMsgDelete1Rows=clientMsgDelete1Rows.filter(function(r){return r.id!=='+JSON.stringify(ADA)+' && r.id!=='+JSON.stringify(QUIET)+';}); listRelease();', ctx);
  await pending;
  assert.deepStrictEqual(idsOf('clientMsgDelete1Rows'), [RUTH], 're-list omits the hidden clients');
  assert.strictEqual(listCalls().length, 1, 're-list posts once');
  assert.deepStrictEqual(listCalls()[0].body, {}, 'list body is empty');
  assert.strictEqual(vm.runInContext('msgBulkDelete1Callout(0)', ctx), DONE_COPY);
  assert.strictEqual(aideHides().length, 0, 'the re-list is not an aide hide');

  vm.runInContext('clientMsgDelete1Rows=clientMsgDelete1MapList('+JSON.stringify(listed().slice(0,1))+'); clientMsgDelete1Loaded=true; msgBulkDelete1Busy=false; msgBulkDelete1Selected={aides:{},clients:{}}; msgBulkDelete1Selected.clients['+JSON.stringify(ADA)+']=1; rpcs.length=0; toasts.length=0;', ctx);
  vm.runInContext('sbRestRpc=function(name, body){rpcs.push({name:name, body:body}); if(name==="admin_hide_client_message_threads")return Promise.resolve({ok:true, status:200, data:{success:true, ok:true, history_deleted:false, hidden_count:0, hidden_client_ids:[], marker:"client-msg-delete1", inbox:"client"}}); if(name==="admin_list_client_message_threads"){clientMsgDelete1Rows=[]; return Promise.resolve({ok:true, status:200, data:[]});} return Promise.resolve({ok:false});};', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(clientHides().length, 1, 'a repeat hide still posts once');
  assert.deepStrictEqual(clientHides()[0].body, {p_client_ids:[ADA]});
  assert.deepStrictEqual(idsOf('clientMsgDelete1Rows'), [], 'idempotent hide leaves the inbox without that client');
  assert.strictEqual(vm.runInContext('toasts[0]', ctx), 'Hidden from this inbox');

  resetDesk('Scheduler');
  vm.runInContext('sbRestRpc=function(name, body){rpcs.push({name:name, body:body}); if(name==="admin_hide_client_message_threads")return Promise.resolve({ok:true, status:200, data:{success:true, ok:true, history_deleted:false, hidden_count:1, hidden_client_ids:body.p_client_ids, marker:"client-msg-delete1", inbox:"client"}}); if(name==="admin_list_client_message_threads"){var ids=(body&&body.p_client_ids)||[]; clientMsgDelete1Rows=clientMsgDelete1Rows.filter(function(r){return (rpcs.filter(function(row){return row.name==="admin_hide_client_message_threads";}).pop().body.p_client_ids||[]).indexOf(r.id)<0;}); return Promise.resolve({ok:true, status:200, data:clientMsgDelete1Rows.slice()});} return Promise.resolve({ok:false});}; msgBulkDelete1Selected.clients['+JSON.stringify(RUTH)+']=1; rpcs.length=0;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.deepStrictEqual(clientHides()[0].body, {p_client_ids:[RUTH]}, 'Scheduler uses the same client hide RPC');
  assert.ok(idsOf('clientMsgDelete1Rows').indexOf(RUTH) < 0, 'Scheduler hide drops Ruth');
  assert.deepStrictEqual(idsOf('manageClients'), [ADA, RUTH, QUIET], 'Scheduler leaves Manage clients');

  resetDesk('Nurse');
  vm.runInContext('msgBulkDelete1Selected.clients['+JSON.stringify(ADA)+']=1; rpcs.length=0; msgBulkDelete1Busy=false;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  await vm.runInContext('clientMsgDelete1Refresh()', ctx);
  assert.strictEqual(clientHides().length, 0, 'Nurse delete does not post');
  assert.strictEqual(listCalls().length, 0, 'Nurse list does not post');
  assert.strictEqual(vm.runInContext('msgBulkDelete1RoleOk()', ctx), false, 'Nurse is denied');
  assert.deepStrictEqual(idsOf('clientMsgDelete1Rows'), [ADA, RUTH, QUIET], 'Nurse leaves the inbox');

  resetDesk('Admin');
  vm.runInContext('sbRestRpc=function(name, body){rpcs.push({name:name, body:body}); return Promise.resolve({ok:false, status:403, error:"42501"});}; msgBulkDelete1Selected.clients['+JSON.stringify(ADA)+']=1; rpcs.length=0;', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(clientHides().length, 1, 'a denied hide was attempted');
  assert.deepStrictEqual(idsOf('clientMsgDelete1Rows'), [ADA, RUTH, QUIET], '403 leaves the inbox');
  assert.strictEqual(listCalls().length, 0, '403 does not re-list');

  const many = [];
  for(let n=1;n<=1001;n++){
    many.push({client_id:'aaaaaaaa-aaaa-4aaa-8aaa-'+String(n).padStart(12,'0'), display_name:'Client '+n, phone:'2165550100', preview:PHONE_PREVIEW, sms_link:'sms:2165550100', tel_link:'tel:2165550100'});
  }
  vm.runInContext('sbRestRpc=function(name, body){rpcs.push({name:name, body:body}); if(name==="admin_hide_client_message_threads")return Promise.resolve({ok:true, status:200, data:{success:true, ok:true, history_deleted:false, hidden_client_ids:body.p_client_ids||[]}}); if(name==="admin_list_client_message_threads")return Promise.resolve({ok:true, status:200, data:[]}); return Promise.resolve({ok:false});}; currentAdminRole="Admin"; remiMsgTab1Segment="clients"; clientMsgDelete1Rows=clientMsgDelete1MapList('+JSON.stringify(many)+'); clientMsgDelete1Loaded=true; rpcs.length=0; msgBulkDelete1Busy=false; msgBulkDelete1Selected={aides:{},clients:{}};', ctx);
  vm.runInContext('msgBulkDelete1SelectAll();', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(clientHides().length, 1, 'a long selection is still one post');
  assert.strictEqual(clientHides()[0].body.p_client_ids.length, 1000, 'payload caps at 1000');

  resetDesk('Admin');
  vm.runInContext('remiMsgTab1Segment="aides"; aideRows=[{id:'+JSON.stringify(MOE)+', name:"moe"}]; aidechatThreads=aideRows.slice(); msgBulkDelete1Selected={aides:{},clients:{}}; msgBulkDelete1Selected.aides['+JSON.stringify(MOE)+']=1; msgBulkDelete1Busy=false; rpcs.length=0; sbRestRpc=function(name, body){rpcs.push({name:name, body:body}); if(name==="admin_hide_aide_office_threads"){aidechatThreads=aidechatThreads.filter(function(t){return (body.p_thread_ids||[]).indexOf(t.id)<0;}); return Promise.resolve({ok:true, status:200, data:{success:true, ok:true, history_deleted:false, hidden_thread_ids:body.p_thread_ids}});} if(name==="admin_list_aide_office_threads")return Promise.resolve({ok:true, data:{success:true, threads:[]}}); return Promise.resolve({ok:false});};', ctx);
  await vm.runInContext('msgBulkDelete1Delete()', ctx);
  assert.strictEqual(aideHides().length, 1, 'Aides Delete still posts');
  assert.deepStrictEqual(aideHides()[0].body, {p_thread_ids:[MOE]});
  assert.strictEqual(clientHides().length, 0, 'Aides Delete does not post the client hide RPC');
  assert.deepStrictEqual(idsOf('clientMsgDelete1Rows'), [ADA, RUTH, QUIET], 'Aides Delete leaves the client inbox');
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
    console.log('admin-client-msg-delete1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  if(!fs.existsSync(chrome)){
    console.log('admin-client-msg-delete1 browser skipped (no chrome)');
    return;
  }
  const root = __dirname;
  const outDir = process.env.CLIENT_MSG_DELETE1_SHOTS || '/tmp/client-msg-delete1';
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
    const boot = await page.evaluate(async function(ADA, RUTH, QUIET){
      currentAdminRole='Admin';
      currentAdminUsername='mo';
      window.__rpc=[];
      window.__list=[];
      window.__holdList=false;
      window.__releaseList=null;
      readSbSession=function(){return {access_token:'office-jwt', email:'mo@evercare.test'};};
      allClients=[
        {id:ADA, name:'Ada Cole', phone:'2165550100', isActive:true, is_active:true},
        {id:RUTH, name:'Ruth Coleman', phone:'', isActive:true, is_active:true},
        {id:QUIET, name:'Quiet Client', phone:'2165550199', isActive:true, is_active:true}
      ];
      window.__list=[
        {client_id:ADA, display_name:'Ada Cole', phone:'2165550100', preview:'Call / Text only', updated_at:'2026-09-29T12:00:00Z', sort_key:'2026-09-29T12:00:00Z', sms_link:'sms:2165550100', tel_link:'tel:2165550100'},
        {client_id:RUTH, display_name:'Ruth Coleman', phone:null, preview:'no phone on file', updated_at:'2026-09-29T11:00:00Z', sort_key:'2026-09-29T11:00:00Z', sms_link:null, tel_link:null},
        {client_id:QUIET, display_name:'Quiet Client', phone:'2165550199', preview:'Call / Text only', updated_at:'2026-09-29T10:00:00Z', sort_key:'2026-09-29T10:00:00Z', sms_link:'sms:2165550199', tel_link:'tel:2165550199'}
      ];
      sbRestRpc=async function(name, body){
        window.__rpc.push({name:name, body:body||{}});
        if(name==='admin_list_client_message_threads'){
          if(window.__holdList)await new Promise(function(resolve){window.__releaseList=resolve;});
          return {ok:true, status:200, data:window.__list.slice()};
        }
        if(name==='admin_hide_client_message_threads'){
          var ids=(body&&body.p_client_ids)||[];
          window.__list=window.__list.filter(function(row){return ids.indexOf(row.client_id)<0;});
          return {ok:true, status:200, data:{success:true, ok:true, marker:'client-msg-delete1', v:'client-msg-delete1', inbox:'client', history_deleted:false, hidden_count:ids.length, hidden_client_ids:ids.slice()}};
        }
        if(name==='admin_hide_aide_office_threads'){
          var tids=(body&&body.p_thread_ids)||[];
          aidechatThreads=(aidechatThreads||[]).filter(function(t){return tids.indexOf(String(t.id))<0;});
          return {ok:true, status:200, data:{success:true, ok:true, history_deleted:false, inbox:'aide', hidden_thread_ids:tids}};
        }
        if(name==='admin_list_aide_office_threads'){
          return {ok:true, data:{success:true, threads:(aidechatThreads||[]).slice()}};
        }
        return {ok:true, data:{success:true, threads:[], messages:[], enabled:false, start_local:'14:00', end_local:'08:00'}};
      };
      showScreen('adminScreen');
      showTab('aidechat');
      await aidechatOpen();
      remiMsgTab1SetSegment('clients');
      await clientMsgDelete1Refresh();
      remiMsgTab1PaintClients();
      function rowBits(){
        return Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card'), function(card){
          var links=Array.prototype.map.call(card.querySelectorAll('a'), function(a){return a.getAttribute('href');});
          return {name:card.querySelector('strong').textContent, preview:card.querySelector('.aidechat-preview').textContent, links:links, id:card.getAttribute('data-msg-client')};
        });
      }
      var del=document.getElementById('msgBulkDelete');
      return {
        rows:rowBits(),
        disabled:!!del.disabled,
        count:document.getElementById('msgBulkCount').textContent,
        callout:document.getElementById('msgBulkCallout').textContent,
        roles:document.getElementById('msgBulkToolbar').getAttribute('data-layout-roles'),
        marker:document.getElementById('msgClientDesk').getAttribute('data-client-msg-delete1'),
        build:document.querySelector('meta[name="admin-build"][content="2026-09-29-client-msg-delete1"]').content
      };
    }, ADA, RUTH, QUIET);
    assert.strictEqual(boot.build, '2026-09-29-client-msg-delete1');
    assert.strictEqual(boot.marker, 'v=client-msg-delete1');
    assert.ok(boot.roles.indexOf('Admin')>=0 && boot.roles.indexOf('Scheduler')>=0, boot.roles);
    assert.strictEqual(boot.disabled, true, 'Delete muted until select');
    assert.strictEqual(boot.count, '0 selected');
    assert.deepStrictEqual(boot.rows.map(function(row){return row.name;}), ['Ada Cole','Ruth Coleman','Quiet Client']);
    assert.ok(boot.rows[0].preview.indexOf(PHONE_PREVIEW)===0, boot.rows[0].preview);
    assert.ok(boot.rows[0].links.indexOf('sms:2165550100')>=0 && boot.rows[0].links.indexOf('tel:2165550100')>=0, boot.rows[0].links.join(','));
    assert.ok(boot.rows[1].preview.indexOf(NOPHONE_PREVIEW)===0, boot.rows[1].preview);
    assert.deepStrictEqual(boot.rows[1].links, [], 'no phone has no sms or tel link');
    assert.strictEqual(boot.rows[0].id, ADA, 'checkbox id is client_id');
    await page.screenshot({path:path.join(outDir, '01-clients-idle.png')});

    await page.click('#msgClientList .msg-bulk-cb[data-msg-bulk-id="'+ADA+'"]');
    const one = await page.evaluate(function(){
      var del=document.getElementById('msgBulkDelete');
      return {
        disabled:!!del.disabled,
        count:document.getElementById('msgBulkCount').textContent,
        callout:document.getElementById('msgBulkCallout').textContent,
        thread:document.getElementById('tab_aidechat').classList.contains('is-client-thread')
      };
    });
    assert.strictEqual(one.disabled, false, 'Delete enables after one check');
    assert.strictEqual(one.count, '1 selected');
    assert.strictEqual(one.callout, SELECT_COPY);
    assert.strictEqual(one.thread, false, 'checkbox does not open a client thread');
    await page.screenshot({path:path.join(outDir, '02-clients-selected.png')});

    const dropped = await page.evaluate(async function(ADA){
      window.__rpc=[];
      window.__holdList=true;
      var pending=msgBulkDelete1Delete();
      await new Promise(function(r){setTimeout(r, 40);});
      var mid={
        names:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        hide:window.__rpc.filter(function(row){return row.name==='admin_hide_client_message_threads';}),
        aide:window.__rpc.filter(function(row){return row.name==='admin_hide_aide_office_threads';}).length,
        active:allClients.map(function(row){return {id:row.id, isActive:row.isActive, is_active:row.is_active};})
      };
      if(window.__releaseList)window.__releaseList();
      window.__holdList=false;
      await pending;
      return {
        mid:mid,
        after:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        callout:document.getElementById('msgBulkCallout').textContent,
        disabled:document.getElementById('msgBulkDelete').disabled,
        list:window.__rpc.filter(function(row){return row.name==='admin_list_client_message_threads';}).map(function(row){return row.body;})
      };
    }, ADA);
    assert.deepStrictEqual(dropped.mid.hide[0].body, {p_client_ids:[ADA]});
    assert.strictEqual(dropped.mid.aide, 0, 'client delete does not post the aide RPC');
    assert.deepStrictEqual(dropped.mid.names, ['Ruth Coleman','Quiet Client'], 'Ada drops before the list returns');
    assert.deepStrictEqual(dropped.after, ['Ruth Coleman','Quiet Client'], 're-list keeps Ada omitted');
    assert.strictEqual(dropped.callout, DONE_COPY);
    assert.strictEqual(dropped.disabled, true, 'Delete mutes again');
    assert.deepStrictEqual(dropped.list, [{}], 're-list body is empty');
    assert.ok(dropped.mid.active.every(function(row){return row.isActive===true && row.is_active===true;}), 'Manage is_active stays true');
    assert.ok(dropped.mid.active.some(function(row){return row.id===ADA;}), 'Ada stays in Manage');
    await page.screenshot({path:path.join(outDir, '03-clients-hidden.png')});

    await page.evaluate(function(){window.__rpc=[];});
    await page.click('#msgBulkSelectAll');
    const all = await page.evaluate(function(){
      var on=0;
      Array.prototype.forEach.call(document.querySelectorAll('#msgClientList .msg-bulk-cb'), function(box){if(box.checked)on++;});
      return {on:on, count:document.getElementById('msgBulkCount').textContent, rpc:window.__rpc.map(function(row){return row.name;})};
    });
    assert.strictEqual(all.on, 2, 'Select all checks the remaining clients');
    assert.strictEqual(all.count, '2 selected');
    assert.ok(!all.rpc.some(function(name){return name==='admin_hide_client_message_threads' || name==='admin_hide_aide_office_threads';}), 'Select all does not post');
    await page.evaluate(function(){window.__rpc=[];});
    await page.click('#msgBulkUnselect');
    const none = await page.evaluate(function(){
      return {disabled:document.getElementById('msgBulkDelete').disabled, rpc:window.__rpc.map(function(row){return row.name;})};
    });
    assert.strictEqual(none.disabled, true);
    assert.ok(!none.rpc.some(function(name){return name==='admin_hide_client_message_threads';}), 'Unselect does not post');

    const schedPage = await browser.newPage();
    await schedPage.setViewport({width:390, height:844, isMobile:true, hasTouch:true});
    await schedPage.goto('http://127.0.0.1:'+port+'/', {waitUntil:'domcontentloaded', timeout:60000});
    const sched = await schedPage.evaluate(async function(ADA, RUTH, QUIET){
      window.__rpc=[];
      window.__list=[
        {client_id:ADA, display_name:'Ada Cole', phone:'2165550100', preview:'Call / Text only', updated_at:'2026-09-29T12:00:00Z', sort_key:'2026-09-29T12:00:00Z', sms_link:'sms:2165550100', tel_link:'tel:2165550100'},
        {client_id:RUTH, display_name:'Ruth Coleman', phone:null, preview:'no phone on file', updated_at:'2026-09-29T11:00:00Z', sort_key:'2026-09-29T11:00:00Z', sms_link:null, tel_link:null}
      ];
      readSbSession=function(){return {access_token:'office-jwt', email:'scheduler@evercare.test'};};
      sbRestRpc=async function(name, body){
        window.__rpc.push({name:name, body:body||{}});
        if(name==='admin_list_client_message_threads')return {ok:true, status:200, data:window.__list.slice()};
        if(name==='admin_hide_client_message_threads'){
          var ids=(body&&body.p_client_ids)||[];
          window.__list=window.__list.filter(function(row){return ids.indexOf(row.client_id)<0;});
          return {ok:true, status:200, data:{success:true, ok:true, history_deleted:false, hidden_count:ids.length, hidden_client_ids:ids, marker:'client-msg-delete1', inbox:'client'}};
        }
        if(name==='admin_list_aide_office_threads')return {ok:true, data:{success:true, threads:[]}};
        return {ok:true, data:{success:true, threads:[], messages:[], enabled:false, start_local:'14:00', end_local:'08:00'}};
      };
      allClients=[{id:ADA, name:'Ada Cole', isActive:true, is_active:true},{id:RUTH, name:'Ruth Coleman', isActive:true, is_active:true}];
      startAdminSession({role:'Scheduler', username:'scheduler', name:'Scheduler'});
      showScreen('adminScreen');
      showTab('aidechat');
      await aidechatOpen();
      remiMsgTab1SetSegment('clients');
      await clientMsgDelete1Refresh();
      remiMsgTab1PaintClients();
      if(typeof layoutA1ApplyRoles==='function')layoutA1ApplyRoles();
      var del=document.getElementById('msgBulkDelete');
      return {
        role:currentAdminRole,
        roleOk:msgBulkDelete1RoleOk(),
        names:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        disabled:!!del.disabled,
        roles:document.getElementById('msgBulkToolbar').getAttribute('data-layout-roles')
      };
    }, ADA, RUTH, QUIET);
    assert.strictEqual(sched.role, 'Scheduler');
    assert.strictEqual(sched.roleOk, true);
    assert.deepStrictEqual(sched.names, ['Ada Cole','Ruth Coleman']);
    assert.strictEqual(sched.disabled, true);
    assert.strictEqual(sched.roles, 'Admin Scheduler');
    await schedPage.click('#msgClientList .msg-bulk-cb[data-msg-bulk-id="'+RUTH+'"]');
    await schedPage.screenshot({path:path.join(outDir, '04-scheduler-clients-selected.png')});
    await schedPage.evaluate(function(){window.__rpc=[];});
    await schedPage.click('#msgBulkDelete');
    const schedAfter = await schedPage.evaluate(function(){
      return {
        names:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;}),
        hide:window.__rpc.filter(function(row){return row.name==='admin_hide_client_message_threads';}),
        aide:window.__rpc.filter(function(row){return row.name==='admin_hide_aide_office_threads';}).length,
        manage:allClients.map(function(row){return row.id+':'+(row.is_active===true);})
      };
    });
    assert.deepStrictEqual(schedAfter.names, ['Ada Cole'], 'Scheduler Delete removes only the checked client');
    assert.deepStrictEqual(schedAfter.hide[0].body, {p_client_ids:[RUTH]});
    assert.strictEqual(schedAfter.aide, 0);
    assert.ok(schedAfter.manage.indexOf(RUTH+':true')>=0, 'Scheduler keeps Ruth active in Manage');
    await schedPage.close();

    const nurse = await page.evaluate(async function(QUIET){
      var before=window.__rpc.length;
      currentAdminRole='Nurse';
      msgBulkDelete1Busy=false;
      msgBulkDelete1Selected={aides:{}, clients:{}};
      msgBulkDelete1Selected.clients[QUIET]=1;
      await msgBulkDelete1Delete();
      await clientMsgDelete1Refresh();
      return {
        roleOk:msgBulkDelete1RoleOk(),
        added:window.__rpc.slice(before).map(function(row){return row.name;}),
        still:Array.prototype.map.call(document.querySelectorAll('#msgClientList .aidechat-card strong'), function(n){return n.textContent;})
      };
    }, QUIET);
    assert.strictEqual(nurse.roleOk, false, 'Nurse denied');
    assert.ok(nurse.added.indexOf('admin_hide_client_message_threads')<0, 'Nurse hide does not post');
    assert.ok(nurse.added.indexOf('admin_list_client_message_threads')<0, 'Nurse list does not post');
    assert.ok(nurse.still.indexOf('Quiet Client')>=0, 'Quiet Client stays');

    const aides = await page.evaluate(async function(MOE){
      currentAdminRole='Admin';
      msgBulkDelete1Busy=false;
      msgBulkDelete1Selected={aides:{}, clients:{}};
      aidechatThreads=[{id:MOE, aide_id:'a-moe', username:'moe', name:'moe', status:'open', last_message:'Sunday', last_at:'2026-09-29T12:00:00Z', messages:[], preview_from_aide:'Sunday'}];
      remiMsgTab1SetSegment('aides');
      aidechatPaintInbox();
      window.__rpc=[];
      msgBulkDelete1Selected.aides[MOE]=1;
      await msgBulkDelete1Delete();
      return {
        names:Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card strong'), function(n){return n.textContent;}),
        hide:window.__rpc.filter(function(row){return row.name==='admin_hide_aide_office_threads';}),
        client:window.__rpc.filter(function(row){return row.name==='admin_hide_client_message_threads';}).length
      };
    }, MOE);
    assert.deepStrictEqual(aides.hide.length, 1, 'Aides Delete still posts');
    assert.deepStrictEqual(aides.hide[0].body.p_thread_ids, [MOE]);
    assert.strictEqual(aides.client, 0, 'Aides Delete does not post the client RPC');
    assert.ok(aides.names.indexOf('moe')<0, 'the aide row drops');
  }finally{
    await browser.close();
    await new Promise(function(resolve){server.close(resolve);});
  }
}

runVm().then(function(){
  return runBrowser();
}).then(function(){
  console.log('admin-client-msg-delete1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
