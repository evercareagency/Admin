#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=aidechat1'), 'aidechat1 marker');
assert.ok(html.includes('data-aidechat1="v=aidechat1"'), 'aidechat1 string marker');
assert.ok(html.includes('admin-build 2026-09-25-aidechat1'), 'aidechat1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidechat1">'), 'aidechat1 meta');
assert.ok(html.includes('<!-- aide office chat 2026-09-25 v=aidechat1 admin-build 2026-09-25-aidechat1'), 'aidechat1 comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-aidechat1'), 'aidechat1 is the first admin-build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remiask1">'), 'remiask1 meta stays');
assert.ok(html.indexOf('content="2026-09-25-aidechat1"') < html.indexOf('content="2026-09-25-remiask1"'), 'remiask1 stays on the next meta');
assert.ok(html.indexOf('content="2026-09-25-remiask1"') < html.indexOf('content="2026-09-25-remiwider1c"'), 'remiwider1c stays after remiask1');

const admin = html.slice(html.indexOf('id="adminScreen"'), html.indexOf('id="nurseScreen"'));
const navStart = admin.indexOf('class="bottom-nav"');
const nav = admin.slice(navStart, admin.indexOf('</nav>', navStart));
assert.strictEqual((nav.match(/bottom-tab/g) || []).length, 5, 'bottom bar stays five tabs');
assert.ok(!nav.includes('nav_aidechat'), 'Aide chat is not a default bottom tab');
const more = admin.slice(admin.indexOf('id="moreList"'), admin.indexOf('class="more-account"'));
assert.ok(more.includes('id="nav_aidechat"'), 'Aide chat is under More');
assert.ok(more.includes('data-layout-roles="Admin Scheduler"'), 'Aide chat uses the Admin Scheduler gate');
assert.ok(more.indexOf('id="nav_coverage"') < more.indexOf('id="nav_aidechat"'), 'Coverage stays before Aide chat');
assert.ok(more.indexOf('id="nav_coverage"') < more.indexOf('id="nav_clients"'), 'Coverage stays before Clients');
assert.ok(admin.includes('id="tab_aidechat"'), 'inbox panel is on the Admin screen');
assert.ok(admin.indexOf('id="tab_coverage"') < admin.indexOf('id="tab_backups"'), 'coverage panel stays ahead of Backup');
assert.ok(admin.indexOf('id="tab_backups"') < admin.indexOf('id="tab_aidechat"'), 'aide chat panel is not inside Coverage');

const nurse = html.slice(html.indexOf('id="nurseScreen"'));
assert.strictEqual(nurse.indexOf('id="nav_aidechat"'), -1, 'Nurse screen has no Aide chat row');
assert.strictEqual(nurse.indexOf('id="tab_aidechat"'), -1, 'Nurse screen has no Aide chat panel');
assert.strictEqual(nurse.indexOf('id="copilotFab"'), -1, 'Nurse screen has no Remi chip');

const chatJs = html.slice(html.indexOf('// v=aidechat1 aide'), html.indexOf('// v=remiask1 status look-ups'));
assert.ok(chatJs.includes('function aidechatRemiDecide'), 'slice is the aide chat block');
assert.ok(chatJs.includes('AIDECHAT_CALLOFF_REPLY'), 'call-off reply constant');
assert.ok(chatJs.includes('(216) 377-5991'), 'main office number');
assert.ok(chatJs.includes("list:['list_aide_threads','admin_list_aide_threads']"), 'list_aide_threads');
assert.ok(chatJs.includes("messages:['get_thread_messages','admin_get_thread_messages']"), 'get_thread_messages');
assert.ok(chatJs.includes("send:['send_office_message','admin_send_office_message']"), 'send_office_message');
assert.ok(chatJs.includes("urgent:['set_thread_urgent','admin_set_thread_urgent']"), 'set_thread_urgent');
assert.ok(chatJs.includes("settingsGet:['get_remi_auto_reply_settings','admin_get_remi_auto_reply_settings']"), 'get_remi_auto_reply_settings');
assert.ok(chatJs.includes("settingsSet:['set_remi_auto_reply_settings','admin_set_remi_auto_reply_settings']"), 'set_remi_auto_reply_settings');
assert.ok(chatJs.includes('America/New_York'), 'window timezone');
assert.ok(chatJs.includes("start_local:'14:00'"), 'default window start 2pm');
assert.ok(chatJs.includes("end_local:'08:00'"), 'default window end 8am');
assert.ok(!/sms:|mailto:/.test(chatJs), 'aide chat does not open Messages or Mail');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|admin_create_aide|signInWithPassword/.test(chatJs), 'aide chat does not reseal Auth');
assert.ok(!/fetch\(/.test(chatJs), 'aide chat does not send on its own fetch');
assert.ok(html.includes('id="aidechatOn"') && html.includes('id="aidechatReply"') && html.includes('Reply as office'), 'settings and office reply controls');
assert.ok(extractCatalog().includes('aidechat'), 'Aide chat can be pinned from Edit tabs');

function extractCatalog(){
  const at = html.indexOf('function navEditCatalog()');
  return html.slice(at, html.indexOf('function navEditRoleOk', at));
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
    console.log('admin-aidechat1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.AIDECHAT_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
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
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=aidechat1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(){
      localStorage.clear();
      sessionStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
    });
    const boot = await page.evaluate(function(){
      var metas = document.querySelectorAll('meta[name="admin-build"]');
      return {
        first: document.querySelector('meta[name="admin-build"]').content,
        second: metas[1] ? metas[1].content : '',
        marker: AIDECHAT_MARKER,
        ask: typeof REMI_ASK_MARKER === 'string' ? REMI_ASK_MARKER : ''
      };
    });
    assert.strictEqual(boot.first, '2026-09-25-aidechat1');
    assert.strictEqual(boot.second, '2026-09-25-remiask1');
    assert.strictEqual(boot.marker, 'v=aidechat1');
    assert.strictEqual(boot.ask, 'v=remiask1');

    await page.evaluate(function(){
      showTab('more');
      var row = document.getElementById('nav_aidechat');
      if(row)row.scrollIntoView({block:'center'});
    });
    await page.click('#nav_aidechat');
    await page.waitForSelector('#aidechatOn', {visible:true});
    await page.evaluate(async function(){
      await aidechatOpen();
      document.getElementById('aidechatOn').checked = true;
      document.getElementById('aidechatStart').value = '14:00';
      document.getElementById('aidechatEnd').value = '08:00';
      await aidechatSettingsChanged();
      loadedAidesList = [
        {username:'ada', name:'Ada Cole', isActive:true},
        {username:'bea', name:'Bea Lin', isActive:true},
        {username:'cam', name:'Cam Brooks', isActive:true}
      ];
      allRecords = [
        {id:'ts-ada', empName:'Ada Cole', username:'ada', clientName:'Ruth Coleman', weekStart:'2026-09-20', status:'submitted', is_active:true, isActive:true, signatureMissing:true, days:{5:{date:'2026-09-25', tin:'', tout:'', hrs:'', svcs:[]}}},
        {id:'ts-cam', empName:'Cam Brooks', username:'cam', clientName:'Owen Park', weekStart:'2026-09-20', status:'draft', is_active:true, isActive:true, days:{}}
      ];
      payReadyState = {week_start:'2026-09-21', rows:[
        {name:'Ada Cole', username:'ada', status:'held', reason:'missing_signature', reasonLabel:'missing signature', checks:{submitted:'yes', signature:'missing'}},
        {name:'Bea Lin', username:'bea', status:'ready', reason:'', reasonLabel:'', checks:{submitted:'yes', signature:'present'}}
      ]};
      var inside = new Date('2026-09-25T19:00:00Z');
      var outside = new Date('2026-09-25T14:30:00Z');
      var night = new Date('2026-09-25T06:00:00Z');
      var morning = new Date('2026-09-25T13:00:00Z');
      var settingsOn = {enabled:true, start_local:'14:00', end_local:'08:00', timezone:'America/New_York'};
      var settingsOff = {enabled:false, start_local:'14:00', end_local:'08:00', timezone:'America/New_York'};
      var ada = {id:'ada', username:'ada', name:'Ada Cole'};
      window.__aide = {
        off: aidechatRemiDecide('I need to call off today', ada, settingsOff, inside),
        outside: aidechatRemiDecide('I need to call off today', ada, settingsOn, outside),
        morning: aidechatRemiDecide('please call-off', ada, settingsOn, morning),
        night: aidechatRemiDecide('calling off', ada, settingsOn, night),
        call: aidechatRemiDecide('I need to call off today', ada, settingsOn, inside),
        other: aidechatRemiDecide("is Bea's timesheet submitted?", ada, settingsOn, inside),
        submitted: aidechatRemiDecide('did I submit my timesheet?', ada, settingsOn, inside),
        cam: aidechatRemiDecide('did I submit my timesheet?', {username:'cam', name:'Cam Brooks'}, settingsOn, inside),
        sig: aidechatRemiDecide('is a signature missing?', ada, settingsOn, inside),
        empty: aidechatRemiDecide('are services empty today?', ada, settingsOn, inside),
        pay: aidechatRemiDecide('is my pay ready?', ada, settingsOn, inside),
        beaPay: aidechatRemiDecide('is my pay ready?', {username:'bea', name:'Bea Lin'}, settingsOn, inside),
        dispute: aidechatRemiDecide('where is my direct deposit from Chase?', ada, settingsOn, inside),
        hello: aidechatRemiDecide('hello there', ada, settingsOn, inside),
        windowNight: aidechatInWindow(night, settingsOn),
        windowOut: aidechatInWindow(outside, settingsOn),
        windowIn: aidechatInWindow(inside, settingsOn)
      };
      schedWeekStart = '';
      schedUsual = [];
      schedExceptions = [];
      schedWeekRows = [];
      schedUseWeekRows = false;
      await aidechatIngestAideMessage({username:'cam', name:'Cam Brooks', body:'did I submit my timesheet?', now:inside});
      await aidechatIngestAideMessage({username:'bea', name:'Bea Lin', body:'where is my direct deposit from Chase?', now:inside});
      await aidechatIngestAideMessage({username:'ada', name:'Ada Cole', body:'I need to call off today', now:inside});
    });

    const rules = await page.evaluate(function(){return window.__aide;});
    assert.strictEqual(rules.off.text, '', 'Off means no Remi reply');
    assert.strictEqual(rules.off.urgent, false);
    assert.strictEqual(rules.outside.text, '', 'outside the window means no Remi reply');
    assert.strictEqual(rules.morning.text, '', 'after 8am is outside 2pm to 8am');
    assert.strictEqual(rules.windowOut, false);
    assert.strictEqual(rules.windowIn, true);
    assert.strictEqual(rules.windowNight, true, '2am is inside the overnight window');
    assert.strictEqual(rules.night.text, rules.call.text);
    assert.strictEqual(rules.call.text, 'I can\'t approve a call-off. Please call the office at (216) 377-5991 so someone can help you right away. I\'ve also noted this for the scheduler.');
    assert.ok(rules.call.text.indexOf('(216) 377-5991') >= 0);
    assert.strictEqual(rules.call.urgent, true);
    assert.strictEqual(rules.call.reason, 'call_off');
    assert.strictEqual(rules.call.headsUp, 'coverage');
    assert.ok(!/\bapproved\b/i.test(rules.call.text), rules.call.text);
    assert.ok(!/you'?re off|you are off|assigned a backup/i.test(rules.call.text));
    assert.strictEqual(rules.other.text, 'I can only look up your own status.');
    assert.ok(!/Bea|Lin|Cam/.test(rules.other.text));
    assert.strictEqual(rules.submitted.text, 'Yes. Your timesheet is submitted.');
    assert.ok(!/Cam|Bea/.test(rules.submitted.text));
    assert.strictEqual(rules.cam.text, 'No. Your timesheet is not submitted.');
    assert.ok(!/Ada/.test(rules.cam.text));
    assert.strictEqual(rules.sig.text, 'Yes. A signature is missing on your timesheet.');
    assert.ok(!/Bea|Cam/.test(rules.sig.text));
    assert.strictEqual(rules.empty.text, 'Yes. Services are empty on your timesheet that day.');
    assert.ok(/^Your pay on this desk: Held/.test(rules.pay.text), rules.pay.text);
    assert.ok(/submitted/.test(rules.pay.text));
    assert.ok(!/Bea|Ready/.test(rules.pay.text), rules.pay.text);
    assert.strictEqual(rules.pay.urgent, false);
    assert.ok(/^Your pay on this desk: Ready/.test(rules.beaPay.text), rules.beaPay.text);
    assert.ok(!/Ada|Held/.test(rules.beaPay.text));
    assert.strictEqual(rules.dispute.urgent, true);
    assert.strictEqual(rules.dispute.reason, 'pay_dispute');
    assert.ok(/flagged this for the office/i.test(rules.dispute.text), rules.dispute.text);
    assert.ok(/Held/.test(rules.dispute.text));
    assert.ok(!/Chase|\$\d|Friday|deposit is|texted/i.test(rules.dispute.text), rules.dispute.text);
    assert.strictEqual(rules.hello.text, '', 'a greeting is human only');

    const sched = await page.evaluate(function(){
      allRecords = [];
      schedWeekStart = '2026-09-21';
      schedUseWeekRows = true;
      schedWeekRows = [{id:'c1', name:'Ruth Coleman', isActive:true}];
      schedUsual = [{client_id:'c1', weekday:5, usual_aide_id:'ada', hours:4}];
      schedExceptions = [];
      var on = {enabled:true, start_local:'14:00', end_local:'08:00', timezone:'America/New_York'};
      var ada = {username:'ada', name:'Ada Cole'};
      var now = new Date('2026-09-25T19:00:00Z');
      var has = aidechatRemiDecide('do I have services today?', ada, on, now);
      schedUsual = [];
      var none = aidechatRemiDecide('do I have services today?', ada, on, now);
      schedWeekStart = '';
      schedWeekRows = [];
      schedUseWeekRows = false;
      var missing = aidechatRemiDecide('do I have services today?', ada, on, now);
      return {has:has.text, none:none.text, missing:missing.text};
    });
    assert.strictEqual(sched.has, 'No. You are scheduled today with Ruth Coleman.');
    assert.strictEqual(sched.none, 'Yes. You have no services on the schedule today.');
    assert.strictEqual(sched.missing, 'I don\'t see today\'s services on this desk.');

    const inbox = await page.evaluate(function(){
      var cards = Array.prototype.map.call(document.querySelectorAll('#aidechatList .aidechat-card'), function(el){
        var r = el.getBoundingClientRect();
        return {
          name: el.querySelector('strong').textContent,
          urgent: el.getAttribute('data-aidechat-urgent'),
          text: el.innerText,
          left: r.left,
          right: r.right,
          height: r.height
        };
      });
      var note = document.getElementById('aidechatWindowNote').textContent;
      var rules = document.getElementById('aidechatRules').textContent;
      var start = document.getElementById('aidechatStart').value;
      var end = document.getElementById('aidechatEnd').value;
      var on = document.getElementById('aidechatOn').checked;
      return {
        cards: cards,
        note: note,
        rules: rules,
        start: start,
        end: end,
        on: on,
        emptyHidden: document.getElementById('aidechatEmpty').hidden,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        nurseHasChat: !!document.querySelector('#nurseScreen #nav_aidechat')
      };
    });
    assert.strictEqual(inbox.on, true);
    assert.strictEqual(inbox.start, '14:00');
    assert.strictEqual(inbox.end, '08:00');
    assert.ok(/2:00 PM/.test(inbox.note) && /8:00 AM/.test(inbox.note) && /America\/New_York/.test(inbox.note), inbox.note);
    assert.ok(inbox.rules.indexOf('(216) 377-5991') >= 0);
    assert.strictEqual(inbox.emptyHidden, true);
    assert.strictEqual(inbox.nurseHasChat, false);
    assert.ok(inbox.scrollWidth <= inbox.clientWidth + 1, 'inbox does not widen the phone');
    assert.strictEqual(inbox.cards.length, 3, 'one card per aide');
    var adaCard = inbox.cards.filter(function(c){return c.name === 'Ada Cole';})[0];
    var bea = inbox.cards.filter(function(c){return c.name === 'Bea Lin';})[0];
    assert.ok(adaCard, JSON.stringify(inbox.cards));
    assert.strictEqual(adaCard.urgent, '1');
    assert.ok(adaCard.text.indexOf('Urgent') >= 0 && adaCard.text.indexOf('Open') >= 0);
    assert.ok(adaCard.text.indexOf('(216) 377-5991') >= 0, adaCard.text);
    assert.ok(adaCard.right <= 391 && adaCard.left >= -1);
    assert.ok(adaCard.height >= 44);
    assert.strictEqual(bea.urgent, '1');
    assert.ok(bea.text.indexOf('Pay') >= 0);
    await page.evaluate(function(){window.scrollTo(0,0);});
    await page.screenshot({path: path.join(shotDir, 'aidechat1-inbox-phone.png')});

    await page.evaluate(function(){
      var cards = document.querySelectorAll('#aidechatList .aidechat-card');
      for(var i=0;i<cards.length;i++){
        if(cards[i].innerText.indexOf('Ada Cole') >= 0){
          cards[i].scrollIntoView({block:'center'});
          cards[i].click();
          return;
        }
      }
    });
    await page.waitForSelector('#aidechatReply', {visible:true});
    const opened = await page.evaluate(function(){
      return {
        title: document.getElementById('aidechatThreadTitle').textContent,
        banner: document.getElementById('aidechatUrgentBanner').textContent,
        bubbles: Array.prototype.map.call(document.querySelectorAll('#aidechatMessages .aidechat-bubble'), function(el){
          return {who: el.querySelector('.aidechat-who').textContent, text: el.textContent};
        })
      };
    });
    assert.strictEqual(opened.title, 'Ada Cole');
    assert.ok(/Coverage heads-up/.test(opened.banner), opened.banner);
    assert.ok(/Open · Urgent/.test(opened.banner));
    assert.ok(opened.bubbles.some(function(b){return b.who === 'Remi' && b.text.indexOf('(216) 377-5991') >= 0;}), JSON.stringify(opened.bubbles));
    await page.type('#aidechatReply', 'I will have the scheduler call you.');
    await page.click('#aidechatSend');
    const replied = await page.evaluate(function(){
      var bubbles = Array.prototype.map.call(document.querySelectorAll('#aidechatMessages .aidechat-bubble'), function(el){
        return {who: el.querySelector('.aidechat-who').textContent, text: el.innerText};
      });
      var send = document.getElementById('aidechatSend').getBoundingClientRect();
      var back = document.getElementById('aidechatBack').getBoundingClientRect();
      return {
        bubbles: bubbles,
        value: document.getElementById('aidechatReply').value,
        sendH: send.height,
        backH: back.height,
        sendRight: send.right,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });
    assert.ok(replied.bubbles.some(function(b){return b.who === 'Office' && b.text.indexOf('scheduler call you') >= 0;}));
    assert.strictEqual(replied.bubbles.filter(function(b){return b.who === 'Remi';}).length, 1, 'office reply does not trigger another Remi line');
    assert.strictEqual(replied.value, '');
    assert.ok(replied.sendH >= 44 && replied.backH >= 44);
    assert.ok(replied.sendRight <= 391);
    assert.ok(replied.scrollWidth <= replied.clientWidth + 1, 'thread does not widen the phone');
    await page.screenshot({path: path.join(shotDir, 'aidechat1-thread-phone.png')});

    await page.click('#aidechatBack');
    await page.waitForSelector('#aidechatList .aidechat-card', {visible:true});
    await page.evaluate(function(){
      var cards = document.querySelectorAll('#aidechatList .aidechat-card');
      for(var i=0;i<cards.length;i++){
        if(cards[i].innerText.indexOf('Bea Lin') >= 0){cards[i].click();return;}
      }
    });
    await page.waitForSelector('#aidechatUrgentBanner:not([hidden])');
    const payThread = await page.evaluate(function(){
      var remi = '';
      var nodes = document.querySelectorAll('#aidechatMessages .aidechat-bubble-remi');
      if(nodes[0])remi = nodes[0].textContent;
      return {
        banner: document.getElementById('aidechatUrgentBanner').textContent,
        remi: remi
      };
    });
    assert.ok(/Flagged for the office/.test(payThread.banner), payThread.banner);
    assert.ok(payThread.remi.indexOf('flagged this for the office') >= 0, payThread.remi);
    assert.ok(/Ready/.test(payThread.remi) && !/Chase|\$\d|texted|deposit is/i.test(payThread.remi), payThread.remi);
    assert.ok(payThread.remi.indexOf('(216) 377-5991') < 0, 'a pay dispute does not pretend to approve a call-off');
    await page.screenshot({path: path.join(shotDir, 'aidechat1-pay-phone.png')});

    const cleared = await page.evaluate(async function(){
      await aidechatClearUrgent();
      return document.getElementById('aidechatUrgentBanner').hidden;
    });
    assert.strictEqual(cleared, true);

    const rpc = await page.evaluate(async function(){
      var calls = [];
      sbRestRpc = async function(name, body){
        calls.push({name:name, body:body||{}});
        if(name === 'list_aide_threads')return {ok:true, data:{success:true, threads:[]}};
        if(name === 'get_thread_messages')return {ok:true, data:{success:true, messages:[]}};
        if(name === 'get_remi_auto_reply_settings')return {ok:true, data:{success:true, enabled:true, start_local:'14:00', end_local:'08:00', timezone:'America/New_York'}};
        if(name === 'set_remi_auto_reply_settings')return {ok:true, data:{success:true, enabled:body.p_enabled, start_local:body.p_start_local, end_local:body.p_end_local, timezone:body.p_timezone}};
        if(name === 'send_office_message')return {ok:true, data:{success:true, message:{id:'ace-1', sender:body.p_sender, body:body.p_body}}};
        if(name === 'set_thread_urgent')return {ok:true, data:{success:true, urgent:body.p_urgent, urgent_reason:body.p_reason}};
        return {ok:false, status:404, error:'Could not find the function'};
      };
      readSbSession = function(){return {access_token:'office-jwt'};};
      aidechatRpcOff = {};
      aidechatRpcPick = {};
      aidechatThreads = [];
      aidechatSource = 'local';
      aidechatSettings = {enabled:true, start_local:'14:00', end_local:'08:00', timezone:'America/New_York', source:'desk'};
      await aidechatIngestAideMessage({username:'ada', name:'Ada Cole', aideId:'ada-1', body:'I need to call off today', now:new Date('2026-09-25T19:00:00Z')});
      var sent = calls.filter(function(c){return c.name === 'send_office_message';});
      var urgent = calls.filter(function(c){return c.name === 'set_thread_urgent';});
      document.getElementById('aidechatOn').checked = false;
      await aidechatSettingsChanged();
      var saved = calls.filter(function(c){return c.name === 'set_remi_auto_reply_settings';}).pop();
      aidechatRpcOff = {};
      sbRestRpc = async function(){return {ok:false, status:404, error:'Could not find the function public.list_aide_threads in the schema cache'};};
      var missing = null;
      var threw = '';
      try{missing = await aidechatRpc('list', {});}catch(err){threw = String(err && err.message || err);}
      var after = null;
      try{await aidechatRefresh(); after = 'painted';}catch(err2){after = String(err2 && err2.message || err2);}
      return {
        sent: sent.map(function(c){return c.body;}),
        urgent: urgent.map(function(c){return c.body;}),
        saved: saved ? saved.body : null,
        missing: missing,
        threw: threw,
        after: after,
        note: document.getElementById('aidechatSourceNote').textContent
      };
    });
    assert.ok(rpc.sent.some(function(b){return b.p_sender === 'remi' && String(b.p_body).indexOf('(216) 377-5991') >= 0;}));
    assert.ok(rpc.urgent.some(function(b){return b.p_urgent === true && b.p_reason === 'call_off';}));
    assert.ok(rpc.saved && rpc.saved.p_enabled === false && rpc.saved.p_timezone === 'America/New_York');
    assert.strictEqual(rpc.saved.p_start_local, '14:00');
    assert.strictEqual(rpc.saved.p_end_local, '08:00');
    assert.strictEqual(rpc.threw, '');
    assert.strictEqual(rpc.missing && rpc.missing.missing, true);
    assert.strictEqual(rpc.after, 'painted');
    assert.ok(/list_aide_threads|Sign in|this phone/.test(rpc.note), rpc.note);

    const roles = await page.evaluate(async function(){
      currentAdminRole = 'Scheduler';
      layoutA1ApplyRoles();
      showTab('more');
      var nav = document.getElementById('nav_aidechat');
      showTab('aidechat');
      await aidechatOpen();
      var scheduler = {hidden: !!nav.hidden, active: document.getElementById('tab_aidechat').classList.contains('active')};
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      showTab('aidechat');
      var panel = document.getElementById('tab_aidechat');
      var fab = document.getElementById('copilotFab');
      var ingested = await aidechatIngestAideMessage({username:'ada', name:'Ada Cole', body:'call off'});
      return {
        scheduler: scheduler,
        nurseNavHidden: !!document.getElementById('nav_aidechat').hidden,
        nursePanelHidden: !!panel.hidden,
        nursePanelActive: panel.classList.contains('active'),
        fabHidden: !!fab.hidden,
        ingested: ingested
      };
    });
    assert.strictEqual(roles.scheduler.hidden, false);
    assert.strictEqual(roles.scheduler.active, true);
    assert.strictEqual(roles.nurseNavHidden, true);
    assert.strictEqual(roles.nursePanelHidden, true);
    assert.strictEqual(roles.nursePanelActive, false);
    assert.strictEqual(roles.fabHidden, true);
    assert.strictEqual(roles.ingested, null);
    assert.deepStrictEqual(errors, []);
  }finally{
    await browser.close();
    await new Promise(function(resolve){server.close(resolve);});
  }
}

runBrowser().then(function(){
  console.log('admin-aidechat1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
