#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=aide-office-vis1'), 'aide-office-vis1 marker');
assert.ok(html.includes('data-aide-office-vis1="v=aide-office-vis1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-aide-office-vis1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aide-office-vis1">'), 'meta');
assert.ok(html.includes('<!-- aide office visible 2026-09-27 v=aide-office-vis1 admin-build 2026-09-27-aide-office-vis1'), 'comment');
assert.ok(html.includes("var AIDE_OFFICE_VIS1_MARKER='v=aide-office-vis1'"), 'script marker');
assert.ok(html.includes('GHOST-AIDE-OFFICE-VIS1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-msg-dense1'), 'first admin-build is msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-hold-client1"') < html.indexOf('content="2026-09-27-aides-info1"'), 'aides-info1 stays after hold-client1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-remi-langs1"'), 'remi-langs1 stays after aide-office-vis1');
assert.ok(html.indexOf('content="2026-09-27-remi-langs1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after remi-langs1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
assert.ok(html.indexOf('content="2026-09-27-tabbar-8"') < html.indexOf('content="2026-09-27-cover-card-cancel1"'), 'cover-card-cancel1 stays after tabbar-8');
assert.ok(html.indexOf('content="2026-09-27-cover-card-cancel1"') < html.indexOf('content="2026-09-27-nosvc-reason-draft1"'), 'nosvc-reason-draft1 stays after cover-card-cancel1');
assert.ok(html.indexOf('content="2026-09-27-nosvc-reason-draft1"') < html.indexOf('content="2026-09-27-cover-unselect1"'), 'cover-unselect1 stays after nosvc-reason-draft1');
assert.ok(html.indexOf('content="2026-09-27-cover-unselect1"') < html.indexOf('content="2026-09-27-remi-payroll1"'), 'payroll stays after cover-unselect1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-langs1">'), 'remi-langs1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-hold-clear1">'), 'hold-clear1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-sched-time-tap1">'), 'sched-time-tap1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aide-text-chat1">'), 'aide-text-chat1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-float-hide1">'), 'remi-float-hide1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-tabbar-8">'), 'tabbar-8 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-cover-card-cancel1">'), 'cover-card-cancel1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-nosvc-reason-draft1">'), 'nosvc meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-cover-unselect1">'), 'cover-unselect1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'payroll meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidechat1">'), 'aidechat1 meta stays');
['v=remi-langs1','v=hold-clear1','v=sched-time-tap1','v=aide-text-chat1','v=remi-float-hide1','v=tabbar-8','v=cover-card-cancel1','v=nosvc-reason-draft1','cancel-shift1','v=cover-unselect1','v=aidechat1','v=remi-notes-vis1','v=remi-payroll1','v=remiface1','v=remi-float-noshow1','v=coverage-simple1','v=client-ins1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="aideOfficeChipBadge"'), 'Remi corner badge');
assert.ok(html.includes('id="aideOfficeMsgBadge"'), 'Messages tab badge');
assert.ok(html.includes('id="aideOfficeRail"'), 'right-rail host');
assert.ok(html.includes('admin_get_aide_office_unread_badge'), 'badge rpc');
assert.ok(html.includes('admin_list_due_aide_office_alerts'), 'due alerts rpc');
assert.ok(html.includes('admin_list_aide_office_threads'), 'threads rpc stays');
assert.ok(html.includes('admin_mark_aide_office_messages_read'), 'ack rpc stays');

const start = html.indexOf('// aide office vis1 v=aide-office-vis1');
const end = html.indexOf('// end aide office vis1 v=aide-office-vis1');
assert.ok(start > 0 && end > start, 'script block');
const src = html.slice(start, end);
assert.ok(src.includes('is_scheduler_office') || src.includes('Nurse cannot use Aide Office'), 'office gate');
assert.ok(src.includes('42501'), 'nurse 42501');
assert.ok(src.includes('push:false'), 'notify.push stays false');
assert.ok(src.includes('staff_push_table:false'), 'no staff push table');
assert.ok(src.includes("channels:['remi_rail','messages_badge']"), 'in-app channels');
assert.ok(src.includes('preview_from_aide'), 'aide preview');
assert.ok(src.includes('has_unread'), 'unread flag');
assert.ok(src.includes('admin/messages'), 'deep link base');
assert.ok(!/\bQuo\b|twilio|send_sms|sms:|mailto:/.test(src), 'no Quo or SMS');
assert.ok(!/mossier|reset_aide_temp_password|admin_set_role_password|signInWithPassword/.test(src), 'no Auth and no mossier');
assert.ok(!/staff_web_push_subscriptions|office_web_push_subscriptions|profile_web_push_subscriptions/.test(src), 'does not invent a staff push table');
assert.ok(!/fetch\(/.test(src), 'no raw fetch');
assert.ok(src.includes('aide_office_unread'), 'alert kind');
assert.ok(!src.includes('remi_save_my_note') && !src.includes('remi_list_my_notes'), 'does not touch Remi Notes');

const sandbox = {console:console, Date:Date, Intl:Intl, setTimeout:setTimeout, clearTimeout:clearTimeout, setInterval:setInterval, clearInterval:clearInterval};
vm.createContext(sandbox);
vm.runInContext(src + '\nthis.AIDE_OFFICE_VIS1_MARKER=AIDE_OFFICE_VIS1_MARKER;', sandbox);
assert.strictEqual(sandbox.AIDE_OFFICE_VIS1_MARKER, 'v=aide-office-vis1');

const decorated = sandbox.aideOfficeVis1DecorateThread({messages:[], last_at:''}, {
  has_unread:true,
  unread_from_aide:2,
  preview_from_aide:'Yes I can cover Ada AM.',
  deep_link:'admin/messages?aide_id=sara',
  last_message_at:'2026-09-27T13:40:00Z',
  last_message:'Remi auto reply should not be the preview'
});
assert.strictEqual(decorated.has_unread, true);
assert.strictEqual(decorated.unread, 2);
assert.strictEqual(decorated.preview_from_aide, 'Yes I can cover Ada AM.');
assert.ok(decorated.preview_from_aide.indexOf('Remi auto') < 0);

const sorted = sandbox.aideOfficeVis1Sort([
  {id:'read', has_unread:false, unread:0, urgent:true, last_message_at:'2026-09-27T18:00:00Z'},
  {id:'low', has_unread:true, unread:1, urgent:false, last_message_at:'2026-09-27T17:00:00Z'},
  {id:'high', has_unread:true, unread:4, urgent:false, last_message_at:'2026-09-27T12:00:00Z'}
]);
assert.deepStrictEqual(sorted.map(function(row){return row.id;}), ['high','low','read']);

const gate = sandbox.aideOfficeVis1Channels({channels:['remi_rail','messages_badge'], push:true, staff_push_table:true});
assert.deepStrictEqual(gate.channels, ['remi_rail','messages_badge']);
assert.strictEqual(gate.push, false);
assert.strictEqual(gate.staff_push_table, false);
sandbox.currentAdminRole = 'Nurse';
assert.strictEqual(sandbox.aideOfficeVis1OfficeOk(), false);
sandbox.currentAdminRole = 'Scheduler';
assert.strictEqual(sandbox.aideOfficeVis1OfficeOk(), true);
sandbox.currentAdminRole = 'Admin';
assert.strictEqual(sandbox.aideOfficeVis1OfficeOk(), true);
assert.strictEqual(sandbox.aideOfficeVis1Initials('Sara Alvarez'), 'SA');
assert.strictEqual(sandbox.aideOfficeVis1Initials('Devon'), 'DV');
assert.strictEqual(sandbox.aideOfficeVis1Initials('Lina'), 'LN');
assert.strictEqual(sandbox.aideOfficeVis1Date('2026-09-27T16:00:00Z'), '09/27/2026');
console.log('admin-aide-office-vis1 unit ok');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

async function shot(page, file){
  await page.screenshot({path:file});
}

function packFor(now){
  const saraAt = new Date(now - 15000).toISOString();
  const devonAt = new Date(now - 4 * 60 * 1000).toISOString();
  const linaAt = new Date(now - 30 * 60 * 60 * 1000).toISOString();
  return {
    saraAt: saraAt,
    threads: [
      {thread_id:'t-lina', aide_id:'lina-id', aide_username:'lina', aide_name:'Lina', has_unread:false, unread:0, preview_from_aide:'Thanks — timesheet fixed.', last_message:'Thanks — timesheet fixed.', last_message_at:linaAt},
      {thread_id:'t-devon', aide_id:'devon-id', aide_username:'devon', aide_name:'Devon', has_unread:true, unread:1, preview_from_aide:'Running 10 min late to Bowlax', last_message:'Remi: I noted that.', last_message_at:devonAt},
      {thread_id:'t-sara', aide_id:'sara-id', aide_username:'sara', aide_name:'Sara Alvarez', has_unread:true, unread:1, preview_from_aide:'Yes I can cover Ada AM.', last_message:'Remi auto-reply should stay off the card', last_message_at:saraAt}
    ],
    alerts: [
      {kind:'aide_office_unread', thread_id:'t-sara', aide_id:'sara-id', aide_name:'Sara Alvarez', aide_username:'sara', preview:'Yes I can cover Ada AM.', unread_from_aide_count:1, deep_link:'admin/messages?aide_id=sara-id', last_message_at:saraAt},
      {kind:'aide_office_unread', thread_id:'t-devon', aide_id:'devon-id', aide_name:'Devon', aide_username:'devon', preview:'Running 10 min late to Bowlax', unread_from_aide_count:1, deep_link:'admin/messages?aide_id=devon-id', last_message_at:devonAt}
    ],
    badge: {unread_threads:2, unread_messages:2}
  };
}

function installStub(pack, email){
  window.__calls = [];
  window.__pack = JSON.parse(JSON.stringify(pack));
  window.__badge = {unread_threads:pack.badge.unread_threads, unread_messages:pack.badge.unread_messages, deep_link_base:'admin/messages'};
  window.__alerts = JSON.parse(JSON.stringify(pack.alerts));
  readSbSession = function(){return {access_token:'office-jwt', email:email, user:{email:email}};};
  sbRestRpc = async function(name, body){
    window.__calls.push({name:name, body:body||{}});
    if(name==='admin_get_aide_office_unread_badge')return {ok:true, data:window.__badge};
    if(name==='admin_list_due_aide_office_alerts')return {ok:true, data:{alerts:window.__alerts, deep_link_base:'admin/messages'}};
    if(name==='admin_list_aide_office_threads')return {ok:true, data:{threads:window.__pack.threads}};
    if(name==='admin_mark_aide_office_messages_read'){
      var tid=String((body&&body.p_thread_id)||'');
      window.__alerts=window.__alerts.filter(function(a){return a.thread_id!==tid;});
      window.__pack.threads.forEach(function(t){
        if(t.thread_id===tid){t.has_unread=false;t.unread=0;}
      });
      window.__badge={
        unread_threads:Math.max(0, Number(window.__badge.unread_threads||0)-1),
        unread_messages:Math.max(0, Number(window.__badge.unread_messages||0)-1),
        deep_link_base:'admin/messages'
      };
      return {ok:true, data:{success:true}};
    }
    if(name==='admin_list_aide_office_messages'){
      var id=String((body&&body.p_thread_id)||'');
      var row=null;
      window.__pack.threads.forEach(function(t){if(t.thread_id===id)row=t;});
      var at=row&&row.last_message_at||'';
      var preview=row&&row.preview_from_aide||'';
      return {ok:true, data:{messages:[
        {id:'office-1', sender:'office', display_name:'Moe (Office)', body:'Hi Sara — can you cover Ada tomorrow AM?', created_at:at},
        {id:'aide-1', sender:'aide', body:preview, created_at:at}
      ]}};
    }
    if(name==='admin_get_aide_chat_remi_settings')return {ok:true, data:{enabled:false, start_local:'14:00', end_local:'08:00'}};
    if(name==='admin_list_open_shifts'||name==='list_open_shifts')return {ok:true, data:{shifts:[]}};
    return {ok:true, data:{success:true}};
  };
}

async function bootOffice(page, pack, role, email){
  await page.evaluate(installStub, pack, email);
  return page.evaluate(async function(role, email){
    localStorage.setItem(navEditStorageKeyFor('', email), JSON.stringify(['coverage','aidechat','aides','schedule']));
    currentAdminRole = role;
    currentAdminUsername = email;
    layoutA1ApplyRoles();
    navEditApply();
    showScreen('adminScreen');
    document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
    document.querySelectorAll('#adminScreen .nav-item').forEach(function(n){n.classList.remove('active');});
    var panel=document.getElementById('tab_aidechat');
    var nav=document.getElementById('nav_aidechat');
    if(panel)panel.classList.add('active');
    if(nav)nav.classList.add('active');
    await aidechatOpen();
    await aideOfficeVis1Poll({toast:true});
    var cards=[].map.call(document.querySelectorAll('#aidechatList .aidechat-card'), function(card){
      return {
        name:(card.querySelector('strong')||{}).textContent||'',
        text:card.textContent||'',
        unread:card.getAttribute('data-aide-office-unread')
      };
    });
    var toast=document.getElementById('aideOfficeToast');
    var who=document.getElementById('aideOfficeWho');
    return {
      who:who?who.textContent:'',
      whoClass:who?who.className:'',
      msg:(document.getElementById('aideOfficeMsgBadge')||{}).textContent||'',
      chip:(document.getElementById('aideOfficeChipBadge')||{}).textContent||'',
      railBadge:(document.getElementById('aideOfficeRailBadge')||{}).textContent||'',
      toastHidden:toast?toast.hidden:true,
      toast:(document.getElementById('aideOfficeToastBody')||{}).textContent||'',
      cards:cards,
      tabRemi:!!document.getElementById('tab_remi'),
      calls:window.__calls.map(function(c){return c.name;})
    };
  }, role, email);
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-aide-office-vis1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const root = __dirname;
  const outDir = '/opt/cursor/artifacts';
  fs.mkdirSync(outDir, {recursive:true});
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
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
  const errors = [];
  const now = Date.now();
  const pack = packFor(now);
  const schedulerPack = {
    saraAt: pack.saraAt,
    threads: pack.threads.filter(function(t){return t.thread_id==='t-sara' || t.thread_id==='t-lina';}).map(function(t){
      if(t.thread_id==='t-devon')return t;
      return t;
    }),
    alerts: pack.alerts.filter(function(a){return a.thread_id==='t-sara';}),
    badge: {unread_threads:1, unread_messages:1}
  };
  try{
    const phone = await browser.newPage();
    phone.on('pageerror', function(err){errors.push('phone '+String(err && err.message || err));});
    await phone.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await phone.goto('http://127.0.0.1:'+port+'/index.html?v=aide-office-vis1', {waitUntil:'domcontentloaded', timeout:60000});
    const adminPhone = await bootOffice(phone, pack, 'Admin', 'admin@roles.evercare.local');
    assert.strictEqual(adminPhone.who, 'Moe · Admin', adminPhone.who);
    assert.ok(adminPhone.whoClass.indexOf('is-admin')>=0, adminPhone.whoClass);
    assert.strictEqual(adminPhone.msg, '2');
    assert.strictEqual(adminPhone.chip, '2');
    assert.strictEqual(adminPhone.toastHidden, false);
    assert.ok(adminPhone.toast.indexOf('Sara')>=0, adminPhone.toast);
    assert.ok(adminPhone.toast.indexOf('Yes I can cover Ada AM.')>=0, adminPhone.toast);
    assert.deepStrictEqual(adminPhone.cards.map(function(c){return c.name;}), ['Sara Alvarez','Devon','Lina']);
    assert.strictEqual(adminPhone.cards[0].unread, '1');
    assert.ok(adminPhone.cards[0].text.indexOf('Yes I can cover Ada AM.')>=0, adminPhone.cards[0].text);
    assert.ok(adminPhone.cards[0].text.indexOf('Remi auto')<0, adminPhone.cards[0].text);
    assert.ok(adminPhone.cards[0].text.indexOf('SA')>=0, adminPhone.cards[0].text);
    assert.ok(adminPhone.cards[1].text.indexOf('DV')>=0, adminPhone.cards[1].text);
    assert.ok(adminPhone.cards[1].text.indexOf('4m')>=0, adminPhone.cards[1].text);
    assert.ok(adminPhone.cards[1].text.indexOf('Running 10 min late to Bowlax')>=0, adminPhone.cards[1].text);
    assert.ok(adminPhone.cards[1].text.indexOf('Remi:')<0, adminPhone.cards[1].text);
    assert.ok(adminPhone.cards[2].text.indexOf('LN')>=0, adminPhone.cards[2].text);
    assert.ok(adminPhone.cards[2].text.indexOf('yesterday')>=0 && adminPhone.cards[2].text.indexOf('read')>=0, adminPhone.cards[2].text);
    assert.strictEqual(adminPhone.tabRemi, false);
    assert.ok(adminPhone.calls.indexOf('admin_get_aide_office_unread_badge')>=0, adminPhone.calls.join(','));
    assert.ok(adminPhone.calls.indexOf('admin_list_due_aide_office_alerts')>=0, adminPhone.calls.join(','));
    assert.ok(adminPhone.calls.indexOf('admin_list_aide_office_threads')>=0, adminPhone.calls.join(','));
    const overflow = await phone.evaluate(function(){
      return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 2;
    });
    assert.strictEqual(overflow, true);
    await shot(phone, path.join(outDir, 'aide-office-vis1-admin-phone.png'));

    await phone.click('#aidechatList .aidechat-card.is-unread');
    await phone.waitForFunction(function(){
      return (window.__calls||[]).some(function(c){return c.name==='admin_mark_aide_office_messages_read' && c.body && c.body.p_thread_id==='t-sara';});
    }, {timeout:15000});
    const acked = await phone.evaluate(function(){
      var sara=document.querySelector('[data-aidechat-thread="t-sara"]');
      return {
        unread:sara?sara.getAttribute('data-aide-office-unread'):'',
        msg:(document.getElementById('aideOfficeMsgBadge')||{}).textContent||'',
        chipHidden:!!(document.getElementById('aideOfficeChipBadge')||{}).hidden,
        chip:(document.getElementById('aideOfficeChipBadge')||{}).textContent||''
      };
    });
    assert.strictEqual(acked.unread, '0');
    assert.ok(acked.msg==='1' || acked.chip==='1', JSON.stringify(acked));

    const schedPhone = await browser.newPage();
    schedPhone.on('pageerror', function(err){errors.push('sched-phone '+String(err && err.message || err));});
    await schedPhone.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await schedPhone.goto('http://127.0.0.1:'+port+'/index.html?v=aide-office-vis1', {waitUntil:'domcontentloaded', timeout:60000});
    await bootOffice(schedPhone, schedulerPack, 'Scheduler', 'scheduler@roles.evercare.local');
    const schedView = await schedPhone.evaluate(async function(){
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
      document.querySelectorAll('#adminScreen .nav-item').forEach(function(n){n.classList.remove('active');});
      var panel=document.getElementById('tab_coverage');
      var nav=document.getElementById('nav_coverage');
      if(panel)panel.classList.add('active');
      if(nav)nav.classList.add('active');
      await aideOfficeVis1Poll({toast:false});
      await copilotOpenRadar();
      var rail=document.getElementById('aideOfficeRail');
      var peek=document.getElementById('aideOfficeCoverPeek');
      var sheet=document.getElementById('copilotSheet');
      var box=sheet?sheet.getBoundingClientRect():null;
      return {
        who:(document.getElementById('aideOfficeWho')||{}).textContent||'',
        whoClass:(document.getElementById('aideOfficeWho')||{}).className||'',
        chip:(document.getElementById('aideOfficeChipBadge')||{}).textContent||'',
        rail:rail?rail.textContent:'',
        peek:peek?peek.textContent:'',
        sheetHidden:sheet?sheet.hidden:true,
        top:box?box.top:0,
        width:box?box.width:0
      };
    });
    assert.strictEqual(schedView.who, 'Jasmine · Scheduler');
    assert.ok(schedView.whoClass.indexOf('is-scheduler')>=0, schedView.whoClass);
    assert.strictEqual(schedView.chip, '1');
    assert.ok(schedView.rail.indexOf('Unread · Aide Office')>=0, schedView.rail);
    assert.ok(schedView.rail.indexOf('Sara Alvarez')>=0, schedView.rail);
    assert.ok(schedView.rail.indexOf('Yes I can cover Ada AM.')>=0, schedView.rail);
    assert.ok(schedView.rail.indexOf('Open thread')>=0, schedView.rail);
    assert.ok(schedView.rail.indexOf('in-app badge')>=0, schedView.rail);
    assert.ok(schedView.rail.indexOf('push +')<0, schedView.rail);
    assert.ok(schedView.peek.indexOf('Aide Office')>=0, schedView.peek);
    assert.strictEqual(schedView.sheetHidden, false);
    await shot(schedPhone, path.join(outDir, 'aide-office-vis1-scheduler-phone.png'));

    const desk = await browser.newPage();
    desk.on('pageerror', function(err){errors.push('desk '+String(err && err.message || err));});
    await desk.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await desk.goto('http://127.0.0.1:'+port+'/index.html?v=aide-office-vis1', {waitUntil:'domcontentloaded', timeout:60000});
    const adminDesk = await bootOffice(desk, pack, 'Admin', 'admin@roles.evercare.local');
    assert.deepStrictEqual(adminDesk.cards.map(function(c){return c.name;}), ['Sara Alvarez','Devon','Lina']);
    assert.strictEqual(adminDesk.msg, '2');
    await shot(desk, path.join(outDir, 'aide-office-vis1-admin-desktop.png'));

    const schedDesk = await browser.newPage();
    schedDesk.on('pageerror', function(err){errors.push('sched-desk '+String(err && err.message || err));});
    await schedDesk.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await schedDesk.goto('http://127.0.0.1:'+port+'/index.html?v=aide-office-vis1', {waitUntil:'domcontentloaded', timeout:60000});
    await bootOffice(schedDesk, schedulerPack, 'Scheduler', 'scheduler@roles.evercare.local');
    const schedDeskView = await schedDesk.evaluate(async function(){
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){p.classList.remove('active');});
      document.querySelectorAll('#adminScreen .nav-item').forEach(function(n){n.classList.remove('active');});
      var panel=document.getElementById('tab_coverage');
      var nav=document.getElementById('nav_coverage');
      if(panel)panel.classList.add('active');
      if(nav)nav.classList.add('active');
      await aideOfficeVis1Poll({toast:false});
      await copilotOpenRadar();
      var sheet=document.getElementById('copilotSheet');
      var box=sheet.getBoundingClientRect();
      return {
        left:box.left,
        right:box.right,
        inner:window.innerWidth,
        rail:(document.getElementById('aideOfficeRail')||{}).textContent||'',
        peek:(document.getElementById('aideOfficeCoverPeek')||{}).textContent||''
      };
    });
    assert.ok(schedDeskView.left > 200, JSON.stringify(schedDeskView));
    assert.ok(schedDeskView.right <= schedDeskView.inner + 1, JSON.stringify(schedDeskView));
    assert.ok(schedDeskView.rail.indexOf('Yes I can cover Ada AM.')>=0, schedDeskView.rail);
    await shot(schedDesk, path.join(outDir, 'aide-office-vis1-scheduler-desktop.png'));

    const sendPhone = await browser.newPage();
    sendPhone.on('pageerror', function(err){errors.push('send-phone '+String(err && err.message || err));});
    await sendPhone.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await sendPhone.goto('http://127.0.0.1:'+port+'/index.html?v=aide-office-vis1', {waitUntil:'domcontentloaded', timeout:60000});
    await bootOffice(sendPhone, pack, 'Admin', 'admin@roles.evercare.local');
    const sendGate = await sendPhone.evaluate(function(){
      var gate=aideOfficeVis1OnCaregiverNotify({
        notify:{channels:['remi_rail','messages_badge'], push:true, staff_push_table:true},
        aide_name:'Sara Alvarez',
        preview:'Yes I can cover Ada AM.',
        deep_link:'admin/messages?aide_id=sara-id'
      });
      return {
        push:gate.push,
        staff:gate.staff_push_table,
        channels:gate.channels,
        toast:(document.getElementById('aideOfficeToastBody')||{}).textContent||'',
        rail:(document.getElementById('aideOfficeRail')||{}).innerHTML||''
      };
    });
    assert.strictEqual(sendGate.push, false);
    assert.strictEqual(sendGate.staff, false);
    assert.deepStrictEqual(sendGate.channels, ['remi_rail','messages_badge']);
    assert.ok(sendGate.toast.indexOf('Yes I can cover Ada AM.')>=0, sendGate.toast);
    assert.ok(sendGate.rail.indexOf('NEW')>=0, sendGate.rail);
    await shot(sendPhone, path.join(outDir, 'aide-office-vis1-send-phone.png'));

    const sendDesk = await browser.newPage();
    sendDesk.on('pageerror', function(err){errors.push('send-desk '+String(err && err.message || err));});
    await sendDesk.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await sendDesk.goto('http://127.0.0.1:'+port+'/index.html?v=aide-office-vis1', {waitUntil:'domcontentloaded', timeout:60000});
    await bootOffice(sendDesk, pack, 'Admin', 'admin@roles.evercare.local');
    await sendDesk.evaluate(async function(){
      aideOfficeVis1OnCaregiverNotify({
        notify:{channels:['remi_rail','messages_badge'], push:false, staff_push_table:false},
        aide_name:'Sara Alvarez',
        preview:'Yes I can cover Ada AM.',
        deep_link:'admin/messages?aide_id=sara-id'
      });
      await copilotOpenRadar();
    });
    await shot(sendDesk, path.join(outDir, 'aide-office-vis1-send-desktop.png'));

    const nurse = await browser.newPage();
    nurse.on('pageerror', function(err){errors.push('nurse '+String(err && err.message || err));});
    await nurse.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await nurse.goto('http://127.0.0.1:'+port+'/index.html?v=aide-office-vis1', {waitUntil:'domcontentloaded', timeout:60000});
    const nurseView = await nurse.evaluate(async function(){
      window.__calls = [];
      readSbSession = function(){return {access_token:'office-jwt', email:'nurse@roles.evercare.local'};};
      sbRestRpc = async function(name, body){
        window.__calls.push(name);
        return {ok:true, data:{success:true}};
      };
      currentAdminRole = 'Nurse';
      currentAdminUsername = 'nurse@roles.evercare.local';
      layoutA1ApplyRoles();
      showScreen('adminScreen');
      var before=window.__calls.length;
      var got=await aideOfficeVis1Rpc('admin_get_aide_office_unread_badge', {});
      var nav=document.getElementById('nav_aidechat');
      var fab=document.getElementById('copilotFab');
      return {
        forbidden:!!(got&&got.forbidden),
        status:got&&got.status,
        calls:window.__calls.length-before,
        navHidden:nav?nav.hidden:true,
        fabHidden:fab?fab.hidden:true
      };
    });
    assert.strictEqual(nurseView.forbidden, true);
    assert.strictEqual(nurseView.calls, 0);
    assert.strictEqual(nurseView.navHidden, true);
    assert.strictEqual(nurseView.fabHidden, true);
    assert.deepStrictEqual(errors, []);
    console.log('admin-aide-office-vis1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
