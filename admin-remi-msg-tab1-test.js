#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-msg-tab1'), 'remi-msg-tab1 marker');
assert.ok(html.includes('?v=remi-msg-tab1'), 'cache bust query');
assert.ok(html.includes('data-remi-msg-tab1="v=remi-msg-tab1"'), 'string marker on the desk');
assert.ok(html.includes('admin-build 2026-09-28-remi-msg-tab1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-remi-msg-tab1">'), 'tip meta');
assert.ok(html.includes('GHOST-REMI-MSG-TAB1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('MERGE HOLD'), 'merge hold stays in the contract');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim live');
assert.ok(html.includes('No new SQL'), 'no new SQL');
assert.ok(html.includes('Ace CALLABLE reuse'), 'aide path reuses Ace callables');
assert.ok(html.includes('Mo locked Clients'), 'Mo locked the Clients segment');
assert.ok(html.includes('in-app widget is skipped'), 'client in-app widget is skipped');
assert.ok(html.includes('Aides ships in-app in full'), 'Aides in-app ships full');
assert.ok(html.includes('admin_compose_aide_text'), 'compose callable is named');
assert.ok(html.includes('admin/messages?aide_id='), 'aide draft opens the messages deep link');
assert.ok(html.includes('Aides | Clients is pure UI'), 'segment chrome is UI');
assert.ok(html.includes('Call / Text only. Not EverCare chat.'), 'clients copy is Call/Text only');
assert.ok(html.includes('You press Send in the phone Messages app.'), 'Mo sends in the phone Messages app');
assert.ok(html.includes('covercomms-style'), 'clients links follow covercomms');
assert.ok(html.includes('No Quo/SMS'), 'no Quo or SMS provider');
const contract = html.slice(html.indexOf('GHOST-REMI-MSG-TAB1-CONTRACT-v1'), html.indexOf('content="2026-09-28-remi-msg-tab1"'));
assert.ok(contract.includes('Admin and Scheduler'), 'contract names Admin and Scheduler');
assert.ok(contract.includes('not Admin-only'), 'Messages is not Admin-only');
assert.ok(contract.includes('is_scheduler_office'), 'role gate reuses is_scheduler_office');
assert.ok(contract.includes('Nurse stays denied for aidechat'), 'Nurse stays denied');
function layoutRoles(id){
  const at = html.indexOf('id="'+id+'"');
  assert.ok(at > 0, id);
  const tag = html.slice(html.lastIndexOf('<', at), html.indexOf('>', at));
  const m = tag.match(/data-layout-roles="([^"]*)"/);
  return m ? m[1].split(/\s+/) : [];
}
['nav_aidechat','tab_aidechat','copilotFab','copilotSheet','copilotTabAsk','msgSeg','aidechatComposer'].forEach(function(id){
  const roles = layoutRoles(id);
  assert.ok(roles.indexOf('Admin') >= 0 && roles.indexOf('Scheduler') >= 0, id+' data-layout-roles includes Admin and Scheduler');
  assert.ok(roles.indexOf('Nurse') < 0, id+' does not list Nurse');
});
assert.ok(html.includes("var REMI_MSG_TAB1_MARKER='v=remi-msg-tab1'"), 'marker constant');
assert.ok(html.includes("var REMI_MSG_TAB1_BUILD='2026-09-28-remi-msg-tab1'"), 'build constant');

const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
const tipAt = html.indexOf('content="2026-09-28-remi-msg-tab1"');
assert.ok(tipAt > html.indexOf('content="2026-09-27-remi-float-hide1b"'), 'tip meta follows the locked first meta');
assert.ok(tipAt < html.indexOf('content="2026-09-28-aide-profile-link-fix"'), 'aide-profile-link-fix meta stays after this tip');

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
assert.strictEqual((nav.match(/bottom-tab/g) || []).length, 5, 'default bar is five slots');
const order = ['nav_timesheets','nav_schedule','nav_aides','nav_aidechat','nav_more'];
let prev = -1;
order.forEach(function(id){
  const at = nav.indexOf('id="'+id+'"');
  assert.ok(at > prev, id+' is on the default bar in lock order');
  prev = at;
});
assert.ok(nav.includes('> Messages'), 'Messages label is on the bar');
assert.ok(nav.includes('id="aideOfficeMsgBadge"'), 'unread badge stays on the Messages tab');
assert.ok(!nav.includes('id="nav_backups"'), 'Backup is not on the empty-storage bar');
const more = admin.slice(admin.indexOf('id="moreList"'), admin.indexOf('class="more-account"'));
assert.ok(more.includes('id="nav_backups"'), 'Backup stays in More');
assert.ok(more.includes('id="nav_coverage"'), 'Cover stays in More until Mo adds it');
assert.ok(!more.includes('id="nav_aidechat"'), 'Messages is not only under More');
assert.ok(more.indexOf('id="nav_coverage"') < more.indexOf('id="nav_backups"'), 'Cover stays ahead of Backup in More');

const chat = admin.slice(admin.indexOf('id="tab_aidechat"'), admin.indexOf('id="aideOfficeToast"'));
assert.ok(chat.includes('id="msgSeg"'), 'segment control is on the Messages desk');
assert.ok(chat.includes('id="msgSegAides"') && chat.includes('>Aides<'), 'Aides segment');
assert.ok(chat.includes('id="msgSegClients"') && chat.includes('>Clients<'), 'Clients segment');
assert.ok(chat.indexOf('id="msgSeg"') > chat.indexOf('id="aidechatInboxSub"'), 'segment sits under the header');
assert.ok(chat.indexOf('id="msgSeg"') < chat.indexOf('id="msgClientDesk"'), 'client desk follows the segment');
assert.ok(chat.includes('id="msgClientList"'), 'client list');
assert.ok(chat.includes('id="remiMsgTab1DraftNote"'), 'draft note');
assert.ok(chat.includes('Draft ready'), 'draft-ready copy');
assert.ok(chat.includes('id="aidechatComposer"') && chat.includes('id="aidechatReply"') && chat.includes('id="aidechatSend"'), 'composer stays');
assert.ok(chat.includes('id="clienthrs1dSched"'), 'Schedule a Remi stays parked in the page');
assert.ok(html.includes('html.aidechat-kb #aidechatComposer{position:fixed'), 'care-msg-safe1 composer dock stays');

const jsStart = html.indexOf('// v=remi-msg-tab1 Messages');
const jsEnd = html.indexOf('function remiAskAnswer(q)');
const js = html.slice(jsStart, jsEnd);
assert.ok(js.includes('function remiMsgTab1Ask'), 'ask function');
assert.ok(js.includes('function remiMsgTab1RoleOk'), 'role gate lives on this tip');
assert.ok(js.includes("var REMI_MSG_TAB1_OFFICE='is_scheduler_office'"), 'office gate matches aidechat1');
assert.ok(js.includes("role!=='Admin'&&role!=='Scheduler'"), 'Scheduler is on the compose gate');
assert.ok(js.includes('function remiMsgTab1OpenDraft'), 'open-draft function');
assert.ok(js.includes('function remiMsgTab1ClientSend'), 'client send stays a device draft');
assert.ok(js.includes('aideTextChatCompose'), 'aide draft reuses aide-text-chat1 compose');
assert.ok(js.includes("source:'remi-msg-tab1'"), 'compose is tagged for this tip');
assert.ok(!js.includes('client_office_messages'), 'no client office messages RPC');
assert.ok(!js.includes('admin_compose_client'), 'no invented client compose RPC');
assert.ok(!js.includes('admin_send_aide_office_message'), 'ask path does not call the aide office send RPC');
assert.ok(!js.includes('admin_send_aide_text'), 'ask path does not send; Send stays in aide-text-chat1');
assert.ok(!/mailto:/.test(js), 'clients do not open mail');
assert.ok(!/\bquo\b/i.test(js), 'no Quo provider');
assert.ok(!js.includes('sbRestRpc') && !js.includes('fetch('), 'no new network from the Messages tip');
assert.ok(!/CREATE TABLE|ALTER TABLE/i.test(js), 'no SQL in the tip');

const askHook = html.slice(jsEnd, jsEnd + 400);
assert.ok(askHook.indexOf('remiMsgTab1Ask(q)') < askHook.indexOf('remiAskIsMark'), 'message intent is checked before other look-ups');
const submitAt = html.indexOf('if(ans.remiMsgTab1&&typeof remiMsgTab1OpenDraft');
assert.ok(submitAt > 0, 'Remi Ask submit opens the draft');
const submitTail = html.slice(submitAt, submitAt + 220);
assert.ok(!submitTail.includes('copilotClose'), 'Ask stays open over the thread');
assert.ok(!submitTail.includes('admin_send_aide'), 'submit does not send');

const sendFn = extractFn(html, 'async function aidechatSendOffice(ev)');
assert.ok(sendFn.indexOf('remiMsgTab1ClientSend') < sendFn.indexOf("aidechatRpc('send'"), 'client Send never reaches the aide office RPC');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start > 0, sig);
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

const calls = [];
const els = {};
function makeEl(id){
  const classes = new Set();
  return {
    id: id,
    hidden: id === 'remiMsgTab1DraftNote',
    textContent: '',
    value: '',
    innerHTML: '',
    classList: {
      toggle: function(name, on){if(on)classes.add(name);else classes.delete(name);},
      add: function(name){classes.add(name);},
      remove: function(name){classes.delete(name);},
      contains: function(name){return classes.has(name);}
    },
    setAttribute: function(){},
    getAttribute: function(){return null;}
  };
}
const ctx = {
  calls: calls,
  currentAdminRole: 'Admin',
  loadedAidesList: [
    {id:'aide-moe', username:'moe', name:'Moe Hart', isActive:true},
    {id:'aide-bea', username:'bea', name:'Bea Lin', isActive:true}
  ],
  allClients: [
    {id:'client-ada', name:'Ada Cole', phone:'2165550100', email:'ada@example.com', isActive:true},
    {id:'client-ruth', name:'Ruth Coleman', phone:'', caseManagerEmail:'pat@example.com', isActive:true},
    {id:'client-off', name:'Old Client', phone:'2165550199', isActive:false}
  ],
  schedWeekRows: [],
  aidechatThreads: [],
  aidechatSelectedId: '',
  document: {
    getElementById: function(id){
      if(!els[id])els[id] = makeEl(id);
      return els[id];
    }
  },
  showTab: function(tab){calls.push('showTab:'+tab);},
  aideTextChatCompose: async function(opts){
    opts=opts||{};
    calls.push('compose:'+String(opts.aideId||'')+':'+String(opts.body||''));
    var link='admin/messages?aide_id='+encodeURIComponent(String(opts.aideId||''));
    calls.push('link:'+link);
    return {ok:true, draft:{link:link, body:opts.body||'', aideId:opts.aideId||'', autoSent:false}};
  },
  aidechatOpen: async function(){calls.push('aidechatOpen');},
  aidechatOpenThread: async function(id){calls.push('openThread:'+id); ctx.aidechatSelectedId = id;},
  aidechatFindByAide: function(){return null;},
  aidechatId: function(prefix){return String(prefix||'id')+'-local';},
  aidechatShow: function(){calls.push('aidechatShow');},
  aidechatPaintThread: function(){calls.push('paintThread');},
  aidechatPaintInbox: function(){calls.push('paintInbox');},
  coverGo: function(href){calls.push('coverGo:'+href);},
  coverSmsHref: function(phone, body){
    return 'sms:'+String(phone||'').replace(/[^\d+]/g,'')+'?&body='+encodeURIComponent(String(body||''));
  },
  coverMailHref: function(email, subject, body){
    return 'mailto:'+String(email||'').trim()+'?subject='+encodeURIComponent(String(subject||''))+'&body='+encodeURIComponent(String(body||''));
  },
  coverPhoneHref: function(kind, phone){
    var d = String(phone||'').replace(/[^\d+]/g,'');
    if(!d)return '';
    return (kind==='sms'?'sms:':'tel:')+d;
  },
  showTempMsg: function(text){calls.push('toast:'+text);},
  setTimeout: setTimeout,
  clientOnDesk: function(row){return row && row.isActive !== false && row.is_active !== false;},
  console: console
};
vm.createContext(ctx);
vm.runInContext(extractFn(html, 'function aidechatRoleOk()'), ctx);
vm.runInContext(extractFn(html, 'function copilotRoleOk()'), ctx);
vm.runInContext(js, ctx);

function run(code){
  return vm.runInContext(code, ctx);
}

const roles = {
  nav_timesheets: 'Admin Scheduler',
  nav_schedule: 'Admin Scheduler',
  nav_aides: 'Admin Scheduler',
  nav_aidechat: 'Admin Scheduler',
  nav_backups: 'Admin Scheduler',
  nav_coverage: 'Admin Scheduler',
  nav_clients: 'Admin Scheduler'
};
const mem = {};
const navCtx = {
  currentAdminRole: 'Admin',
  currentAdminUsername: 'mo@evercare.test',
  localStorage: {
    getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
    setItem: function(k, v){mem[k] = String(v);}
  },
  document: {
    getElementById: function(id){
      if(!roles[id])return null;
      return {getAttribute: function(name){return name === 'data-layout-roles' ? roles[id] : null;}};
    }
  },
  readSbSession: function(){return null;},
  readAdminSession: function(){return null;}
};
vm.createContext(navCtx);
[
  'function navEditDefaults()',
  'function navEditCatalog()',
  'function navEditRoleOk(tab)',
  'function navEditSanitize(slots)',
  'function navEditParse(raw)',
  'function navEditStorageKeyFor(id, email)',
  'function navEditIdentity()',
  'function navEditStorageKey()',
  'function navEditRead()'
].forEach(function(sig){vm.runInContext(extractFn(html, sig), navCtx);});
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(vm.runInContext('navEditRead()', navCtx))),
  ['timesheets','schedule','aides','aidechat'],
  'empty storage pins Messages'
);
assert.ok(vm.runInContext("navEditCatalog().indexOf('coverage')>=0 && navEditCatalog().indexOf('backups')>=0", navCtx), 'Cover and Backup stay in the catalog');
navCtx.currentAdminRole = 'Scheduler';
assert.strictEqual(vm.runInContext("navEditRoleOk('aidechat')", navCtx), true, 'Scheduler can keep Messages on the bar');
navCtx.currentAdminRole = 'Nurse';
assert.strictEqual(vm.runInContext("navEditRoleOk('aidechat')", navCtx), false, 'Nurse cannot keep Messages on the bar');
navCtx.currentAdminRole = 'Admin';

assert.strictEqual(run("remiMsgTab1Parse('hello remi')"), null, 'a greeting is not a message intent');
assert.strictEqual(run("remiMsgTab1Parse('text moe')"), null, 'text is not the message intent');

const moe = run("remiMsgTab1Ask('message moe')");
assert.strictEqual(moe.actions.length, 0, 'message moe has no send actions');
assert.strictEqual(moe.remiMsgTab1.kind, 'aide');
assert.strictEqual(moe.remiMsgTab1.username, 'moe');
assert.strictEqual(moe.remiMsgTab1.draft, 'Hi Moe Hart \u2014 ');
assert.ok(/won.t auto-send/i.test(moe.text), 'Remi says it will not auto-send');
assert.deepStrictEqual(calls.filter(function(c){return c.indexOf('coverGo:')===0 || c.indexOf('admin_send')===0;}), [], 'asking does not send');

const moeBody = run("remiMsgTab1Ask('please message moe the Wednesday shift moved')");
assert.strictEqual(moeBody.remiMsgTab1.draft, 'the Wednesday shift moved');

const ada = run("remiMsgTab1Ask('message Ada Cole')");
assert.strictEqual(ada.actions.length, 0);
assert.strictEqual(ada.remiMsgTab1.kind, 'client');
assert.strictEqual(ada.remiMsgTab1.id, 'client-ada');
assert.strictEqual(ada.remiMsgTab1.draft, 'Hi Ada Cole \u2014 ');
assert.ok(/Call \/ Text/i.test(ada.text) && /not EverCare chat/i.test(ada.text) && /phone Messages app/i.test(ada.text), ada.text);

const tagged = run("remiMsgTab1Ask('message client Ruth Coleman confirm the visit')");
assert.strictEqual(tagged.remiMsgTab1.kind, 'client');
assert.strictEqual(tagged.remiMsgTab1.draft, 'confirm the visit');

const missing = run("remiMsgTab1Ask('message nobody')");
assert.ok(!missing.remiMsgTab1, 'unknown name does not open a draft');
assert.ok(/nothing was sent/i.test(missing.text));

ctx.currentAdminRole = 'Scheduler';
assert.strictEqual(run('remiMsgTab1RoleOk()'), true, 'Scheduler passes the Messages gate');
const schedAsk = run("remiMsgTab1Ask('message moe the Wednesday shift moved')");
assert.strictEqual(schedAsk.remiMsgTab1.kind, 'aide');
assert.strictEqual(schedAsk.remiMsgTab1.draft, 'the Wednesday shift moved');
ctx.currentAdminRole = 'Nurse';
assert.strictEqual(run('remiMsgTab1RoleOk()'), false, 'Nurse fails the Messages gate');
assert.strictEqual(run("remiMsgTab1Ask('message moe')"), null, 'Nurse stays denied');
ctx.currentAdminRole = 'Admin';

async function runUnitDrafts(){
calls.length = 0;
await run("remiMsgTab1OpenDraft("+JSON.stringify(moe.remiMsgTab1)+")");
assert.ok(calls.some(function(c){return c.indexOf('compose:aide-moe:Hi Moe Hart')===0;}), 'aide draft calls compose with the body');
assert.ok(calls.some(function(c){return c.indexOf('link:admin/messages?aide_id=')===0;}), 'aide draft opens admin/messages?aide_id=');
assert.strictEqual(els.aidechatReply.value, 'Hi Moe Hart \u2014 ');
assert.strictEqual(els.remiMsgTab1DraftNote.hidden, false);
assert.ok(els.remiMsgTab1DraftNote.textContent.indexOf('Draft ready') >= 0, 'aide draft stays an in-app composer draft');
assert.ok(!calls.some(function(c){return c.indexOf('coverGo:')===0 || c.indexOf('admin_send')===0;}), 'opening an aide draft does not send');

calls.length = 0;
ctx.currentAdminRole = 'Scheduler';
await run("remiMsgTab1OpenDraft("+JSON.stringify(schedAsk.remiMsgTab1)+")");
assert.ok(calls.some(function(c){return c.indexOf('compose:aide-moe:the Wednesday shift moved')===0;}), 'Scheduler compose uses the same aide draft path');
assert.ok(!calls.some(function(c){return c.indexOf('admin_send')===0 || c.indexOf('coverGo:')===0;}), 'Scheduler compose does not send');
calls.length = 0;
ctx.currentAdminRole = 'Nurse';
await run("remiMsgTab1OpenDraft("+JSON.stringify(moe.remiMsgTab1)+")");
assert.deepStrictEqual(calls, [], 'Nurse compose does not open a draft');
ctx.currentAdminRole = 'Admin';

calls.length = 0;
await run("remiMsgTab1OpenDraft("+JSON.stringify(ada.remiMsgTab1)+")");
assert.strictEqual(run('remiMsgTab1Segment'), 'clients');
assert.strictEqual(run('remiMsgTab1ClientId'), 'client-ada');
assert.ok(els.tab_aidechat.classList.contains('is-client-thread'), 'client thread chrome');
assert.strictEqual(els.aidechatReply.value, 'Hi Ada Cole \u2014 ');
assert.ok(els.aidechatThreadMeta.innerHTML.indexOf('sms:') >= 0, 'phone on file offers sms');
assert.ok(els.aidechatThreadMeta.innerHTML.indexOf('tel:') >= 0, 'phone on file offers tel');
assert.ok(els.aidechatThreadMeta.innerHTML.indexOf('Call / Text only') >= 0, 'client thread is Call/Text only');
assert.ok(els.aidechatThreadMeta.innerHTML.indexOf('not EverCare chat') >= 0, 'client thread is not EverCare chat');
assert.ok(els.aidechatThreadMeta.innerHTML.indexOf('mailto:') < 0, 'client contact does not use mail');
assert.strictEqual(els.aidechatSend.textContent, 'Text');
assert.ok(els.remiMsgTab1DraftNote.textContent.indexOf('Call / Text only') >= 0);
assert.ok(!calls.some(function(c){return c.indexOf('coverGo:')===0;}), 'opening a client draft does not send');

calls.length = 0;
const sent = run('remiMsgTab1ClientSend({preventDefault:function(){}})');
assert.strictEqual(sent, false);
assert.strictEqual(calls.length, 1);
assert.ok(calls[0].indexOf('coverGo:sms:2165550100') === 0, 'client Send opens the device sms draft');
assert.ok(calls[0].indexOf('body=') > 0, 'sms draft carries the composer text');
assert.strictEqual(els.aidechatReply.value, 'Hi Ada Cole \u2014 ', 'composer is not cleared');

const rows = run('remiMsgTab1ClientRows()');
assert.ok(rows.some(function(r){return r.id==='client-ada';}));
assert.ok(!rows.some(function(r){return r.name==='Old Client';}), 'inactive clients stay off the desk');

run("remiMsgTab1OpenClient('client-ruth', 'Hi Ruth Coleman \u2014 ')");
assert.ok(els.aidechatThreadMeta.innerHTML.indexOf('mailto:') < 0, 'email on file is not a client contact');
calls.length = 0;
const ruth = run('remiMsgTab1ClientSend({preventDefault:function(){}})');
assert.strictEqual(ruth, false);
assert.ok(calls[0].indexOf('toast:') === 0, 'no phone keeps the draft even when email is on file');
assert.ok(!calls.some(function(c){return c.indexOf('coverGo:')===0 || c.indexOf('admin_send')===0;}));

run("allClients=[{id:'c-quiet', name:'Quiet Client', phone:'', email:'', isActive:true}]; remiMsgTab1OpenClient('c-quiet', 'Hi Quiet Client \u2014 ');");
calls.length = 0;
const quiet = run('remiMsgTab1ClientSend({preventDefault:function(){}})');
assert.strictEqual(quiet, false);
assert.ok(calls[0].indexOf('toast:') === 0, 'no contact keeps the draft');
assert.ok(!calls.some(function(c){return c.indexOf('coverGo:')===0;}));
assert.strictEqual(els.aidechatReply.value, 'Hi Quiet Client \u2014 ');

console.log('admin-remi-msg-tab1 unit ok');
}

runUnitDrafts().then(runBrowser).catch(function(err){
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
    console.log('admin-remi-msg-tab1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  if(!fs.existsSync(chrome)){
    console.log('admin-remi-msg-tab1 browser skipped (no chrome)');
    return;
  }
  const root = __dirname;
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
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  try{
    const page = await browser.newPage();
    page.setDefaultTimeout(20000);
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-msg-tab1', {waitUntil:'domcontentloaded', timeout:30000});
    const desk = await page.evaluate(async function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      var sends = [];
      readSbSession = function(){return {access_token:'office-jwt'};};
      sbRestRpc = async function(name, body){
        sends.push({name:String(name||''), body:body||{}});
        if(name==='admin_compose_aide_text'){
          return {ok:true, data:{
            draft:{body:(body&&body.p_body)||''},
            aide_name:'Moe Hart',
            aide_username:'moe',
            thread_id:'11111111-1111-4111-8111-111111111111',
            channel:'in_app_messages',
            admin_deep_link:'admin/messages?aide_id='+(body&&body.p_aide_id||'')
          }};
        }
        if(name==='admin_get_aide_text_channel'){
          return {ok:true, data:{channel:'in_app_messages', has_push_subscription:false, phone_required:false, sms_sent:false}};
        }
        if(name==='admin_send_aide_text')return {ok:true, data:{channel:'in_app_messages', sms_sent:false, thread_id:'11111111-1111-4111-8111-111111111111'}};
        return {ok:false, status:404, error:'offline'};
      };
      var gone = [];
      var realGo = coverGo;
      coverGo = function(href){gone.push(String(href||''));};
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      loadedAidesList = [{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', aide_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username:'moe', name:'Moe Hart', isActive:true, phone:'2165550142'}];
      allClients = [{id:'client-ada', name:'Ada Cole', phone:'2165550100', email:'ada@example.com', isActive:true}];
      aidechatThreads = [];
      var bar = Array.prototype.map.call(document.querySelectorAll('#bottomNav .bottom-tab'), function(btn){
        return btn.id;
      });
      showTab('aidechat');
      await new Promise(function(r){setTimeout(r, 40);});
      remiMsgTab1SetSegment('clients');
      var clientsOn = document.getElementById('tab_aidechat').classList.contains('is-clients');
      var clientCount = document.querySelectorAll('#msgClientList [data-msg-client]').length;
      remiMsgTab1SetSegment('aides');
      var sheet = document.getElementById('copilotSheet');
      sheet.hidden = false;
      var asked = remiMsgTab1Ask('message moe the shift moved');
      await remiMsgTab1OpenDraft(asked.remiMsgTab1);
      await new Promise(function(r){setTimeout(r, 80);});
      var aideDraft = document.getElementById('aidechatReply').value;
      var note = document.getElementById('remiMsgTab1DraftNote').hidden;
      var sheetStill = document.getElementById('copilotSheet').hidden;
      var link = document.documentElement.getAttribute('data-remi-msg-tab1-link') || document.documentElement.getAttribute('data-aide-text-deep-link') || '';
      var afterCompose = sends.map(function(row){return row.name;});
      document.getElementById('aidechatSend').click();
      await new Promise(function(r){setTimeout(r, 60);});
      var afterAideSend = sends.map(function(row){return row.name;});
      var clientAsk = remiMsgTab1Ask('message Ada Cole');
      await remiMsgTab1OpenDraft(clientAsk.remiMsgTab1);
      await new Promise(function(r){setTimeout(r, 80);});
      var clientDraft = document.getElementById('aidechatReply').value;
      var clientThread = document.getElementById('tab_aidechat').classList.contains('is-client-thread');
      var clientMeta = document.getElementById('aidechatThreadMeta').textContent;
      var clientSend = document.getElementById('aidechatSend').textContent;
      document.getElementById('aidechatSend').click();
      await new Promise(function(r){setTimeout(r, 40);});
      coverGo = realGo;
      return {
        marker: REMI_MSG_TAB1_MARKER,
        build: document.querySelectorAll('meta[name="admin-build"]')[1].content,
        bar: bar,
        clientsOn: clientsOn,
        clientCount: clientCount,
        aideDraft: aideDraft,
        noteHidden: note,
        sheetHidden: sheetStill,
        link: link,
        afterCompose: afterCompose,
        afterAideSend: afterAideSend,
        clientDraft: clientDraft,
        clientThread: clientThread,
        clientMeta: clientMeta,
        clientSend: clientSend,
        sends: sends,
        gone: gone
      };
    });
    const roles = await page.evaluate(async function(){
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'jaz@evercare.test';
      layoutA1ApplyRoles();
      var sends = [];
      sbRestRpc = async function(name, body){
        sends.push(String(name||''));
        if(name==='admin_compose_aide_text'){
          return {ok:true, data:{draft:{body:(body&&body.p_body)||''}, aide_name:'Moe Hart', aide_username:'moe', admin_deep_link:'admin/messages?aide_id='+(body&&body.p_aide_id||''), channel:'in_app_messages'}};
        }
        if(name==='admin_get_aide_text_channel')return {ok:true, data:{channel:'in_app_messages', has_push_subscription:false}};
        return {ok:false, status:404, error:'offline'};
      };
      function gate(id){
        var el = document.getElementById(id);
        return {hidden: !!(el && el.hidden), roles: el ? String(el.getAttribute('data-layout-roles')||'') : ''};
      }
      var asked = remiMsgTab1Ask('message moe the shift moved');
      await remiMsgTab1OpenDraft(asked && asked.remiMsgTab1);
      await new Promise(function(r){setTimeout(r, 80);});
      var sched = {
        roleOk: remiMsgTab1RoleOk(),
        nav: gate('nav_aidechat'),
        tab: gate('tab_aidechat'),
        ask: gate('copilotTabAsk'),
        seg: gate('msgSeg'),
        composer: gate('aidechatComposer'),
        sheet: gate('copilotSheet'),
        kind: asked && asked.remiMsgTab1 && asked.remiMsgTab1.kind,
        draft: document.getElementById('aidechatReply').value,
        sends: sends.slice()
      };
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      var nurseAsk = remiMsgTab1Ask('message moe');
      return {
        sched: sched,
        nurseRoleOk: remiMsgTab1RoleOk(),
        nurseAsk: nurseAsk,
        nurseNavHidden: !!document.getElementById('nav_aidechat').hidden,
        nurseAskHidden: !!document.getElementById('copilotTabAsk').hidden
      };
    });
    assert.strictEqual(desk.marker, 'v=remi-msg-tab1');
    assert.strictEqual(desk.build, '2026-09-28-remi-msg-tab1');
    assert.deepStrictEqual(desk.bar, ['nav_timesheets','nav_schedule','nav_aides','nav_aidechat','nav_more']);
    assert.strictEqual(desk.clientsOn, true);
    assert.ok(desk.clientCount >= 1, 'Clients segment lists Ada');
    assert.strictEqual(desk.aideDraft, 'the shift moved');
    assert.strictEqual(desk.noteHidden, false);
    assert.strictEqual(desk.sheetHidden, false, 'Remi Ask stays open');
    assert.ok(desk.link.indexOf('admin/messages?aide_id=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') >= 0, desk.link);
    assert.ok(desk.afterCompose.indexOf('admin_compose_aide_text') >= 0, 'compose runs when the draft opens');
    assert.strictEqual(desk.afterCompose.filter(function(name){return name==='admin_send_aide_text';}).length, 0, 'compose does not send');
    assert.strictEqual(desk.afterAideSend.filter(function(name){return name==='admin_send_aide_text';}).length, 1, 'aide Send posts admin_send_aide_text once');
    assert.strictEqual(desk.clientDraft, 'Hi Ada Cole \u2014 ');
    assert.strictEqual(desk.clientThread, true);
    assert.ok(desk.clientMeta.indexOf('Call / Text only') >= 0 && desk.clientMeta.indexOf('not EverCare chat') >= 0, desk.clientMeta);
    assert.strictEqual(desk.clientSend, 'Text');
    assert.ok(desk.gone.length === 1 && desk.gone[0].indexOf('sms:2165550100') === 0, 'client Send opens sms only after the tap');
    assert.ok(!desk.sends.some(function(row){return row.name === 'admin_send_aide_office_message' || row.name === 'client_office_messages' || row.name === 'admin_compose_client_text';}), 'no office or client compose RPC');
    assert.strictEqual(roles.sched.roleOk, true);
    ['nav','tab','ask','seg','composer','sheet'].forEach(function(key){
      assert.ok(roles.sched[key].roles.indexOf('Admin') >= 0 && roles.sched[key].roles.indexOf('Scheduler') >= 0, key);
      assert.strictEqual(roles.sched[key].hidden, false, key+' stays visible for Scheduler');
    });
    assert.strictEqual(roles.sched.kind, 'aide');
    assert.strictEqual(roles.sched.draft, 'the shift moved');
    assert.ok(roles.sched.sends.indexOf('admin_compose_aide_text') >= 0, 'Scheduler compose posts admin_compose_aide_text');
    assert.ok(roles.sched.sends.indexOf('admin_send_aide_text') < 0, 'Scheduler compose does not send');
    assert.strictEqual(roles.nurseRoleOk, false);
    assert.strictEqual(roles.nurseAsk, null);
    assert.strictEqual(roles.nurseNavHidden, true);
    assert.strictEqual(roles.nurseAskHidden, true);
    console.log('admin-remi-msg-tab1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}
