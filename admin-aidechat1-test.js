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
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-26-clienthrs1b'), 'clienthrs1b is the first admin-build meta');
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
assert.ok(chatJs.includes('remiCalloffReply()'), 'aide chat uses the locked call-off helper');
assert.ok(html.includes("return '(216) 377-5991';"), 'locked office number');
assert.ok(html.includes('function remiCalloffReply'), 'Remi call-off helper');
assert.ok(html.includes("list:['admin_list_aide_office_threads']"), 'admin_list_aide_office_threads');
assert.ok(html.includes("messages:['admin_list_aide_office_messages']"), 'admin_list_aide_office_messages');
assert.ok(html.includes("send:['admin_send_aide_office_message']"), 'admin_send_aide_office_message');
assert.ok(html.includes("clear:['admin_clear_aide_office_escalate']"), 'admin_clear_aide_office_escalate');
assert.ok(html.includes("read:['admin_mark_aide_office_messages_read']"), 'admin_mark_aide_office_messages_read');
assert.ok(html.includes("script:['admin_get_aide_chat_call_off_script']"), 'admin_get_aide_chat_call_off_script');
assert.ok(html.includes("settingsGet:['admin_get_aide_chat_remi_settings']"), 'admin_get_aide_chat_remi_settings');
assert.ok(html.includes("settingsSet:['admin_save_aide_chat_remi_settings']"), 'admin_save_aide_chat_remi_settings');
assert.ok(html.includes("context:['admin_aide_chat_remi_context']"), 'admin_aide_chat_remi_context');
assert.ok(html.includes("contextOwn:['aide_chat_remi_context']"), 'aide_chat_remi_context fallback');
assert.ok(chatJs.includes('from_remi:true'), 'from_remi only on a Remi line');
assert.ok(!/p_from_remi|from_remi:/.test(chatJs.slice(chatJs.indexOf('function aidechatWireSend'), chatJs.indexOf('function aidechatWireMessages'))), 'send args stay the live shape');
assert.ok(html.includes('href="tel:+12163775991"'), 'call-off number is tap-to-call');
assert.ok(!/sms:|mailto:/.test(chatJs), 'aide chat block does not open Messages or Mail');
assert.ok(chatJs.includes('p_escalate_only'), 'list accepts p_escalate_only');
assert.ok(chatJs.includes('p_limit:80'), 'messages accept p_limit');
assert.ok(chatJs.includes('p_before'), 'messages accept p_before');
assert.ok(!/admin_record_call_off/.test(chatJs), 'clearing a flag does not record a call-off');
const calloffHelper = html.slice(html.indexOf('function remiCalloffPhone'), html.indexOf('function remiSecCalloff(q)'));
const helperPhones = calloffHelper.match(/\(\d{3}\) \d{3}-\d{4}/g) || [];
assert.deepStrictEqual(Array.from(new Set(helperPhones)), ['(216) 377-5991']);
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
    assert.strictEqual(boot.first, '2026-09-26-clienthrs1b');
    assert.strictEqual(boot.second, '2026-09-26-clienthrs1a');
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
      window.scrollTo(0, 0);
      var box = document.getElementById('aidechatSettings');
      if(box)box.scrollIntoView({block:'start'});
    });
    await page.screenshot({path: path.join(shotDir, 'aidechat1-settings-phone.png')});
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
        phone: remiCalloffPhone(),
        poison: remiLockCalloffLine('Please call (440) 555-0199 so I can approve the call-off.'),
        sec: (remiSecCalloff('any call-offs today?') || {}).text || '',
        playbook: (copilotPlaybook('coverage_open') || {}).explain || '',
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
    assert.strictEqual(rules.phone, '(216) 377-5991');
    assert.strictEqual(rules.call.text, 'I can\'t approve a call-off. Please call the office at (216) 377-5991 so someone can help you right away. I\'ve also noted this for the scheduler.');
    assert.ok(rules.call.text.indexOf('(216) 377-5991') >= 0);
    assert.ok(rules.poison.indexOf('(216) 377-5991') >= 0, rules.poison);
    assert.ok(rules.poison.indexOf('440') < 0 && rules.poison.indexOf('555-0199') < 0, rules.poison);
    assert.ok(rules.sec.indexOf('(216) 377-5991') >= 0, rules.sec);
    assert.ok(rules.playbook.indexOf('(216) 377-5991') >= 0, rules.playbook);
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
    const phoneLink = await page.evaluate(function(){
      var link = document.querySelector('#aidechatMessages .aidechat-bubble-remi a.aidechat-phone');
      var rules = document.querySelector('#aidechatRules a.aidechat-phone');
      var banner = document.querySelector('#aidechatUrgentBanner a.aidechat-phone');
      var box = link ? link.getBoundingClientRect() : {height:0};
      var hrefs = Array.prototype.map.call(document.querySelectorAll('#tab_aidechat a[href^="tel:"]'), function(a){return a.getAttribute('href');});
      return {
        href: link ? link.getAttribute('href') : '',
        text: link ? link.textContent : '',
        rulesHref: rules ? rules.getAttribute('href') : '',
        rulesText: rules ? rules.textContent : '',
        bannerText: banner ? banner.textContent : '',
        height: box.height,
        hrefs: hrefs
      };
    });
    assert.strictEqual(phoneLink.href, 'tel:+12163775991');
    assert.strictEqual(phoneLink.text, '(216) 377-5991');
    assert.strictEqual(phoneLink.rulesHref, 'tel:+12163775991');
    assert.strictEqual(phoneLink.rulesText, '(216) 377-5991');
    assert.strictEqual(phoneLink.bannerText, '(216) 377-5991');
    assert.ok(phoneLink.height >= 44, 'call-off number is tappable');
    assert.ok(phoneLink.hrefs.every(function(h){return h === 'tel:+12163775991';}), phoneLink.hrefs.join(','));
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
        if(name === 'admin_list_aide_office_threads')return {ok:true, data:{success:true, threads:[{thread_id:'ace-ada', aide_id:'ada-1', aide_username:'ada', aide_name:'Ada Cole', escalated:true, escalate_reason:'call_off', last_message:'noted'}]}};
        if(name === 'admin_list_aide_office_messages')return {ok:true, data:{success:true, messages:[]}};
        if(name === 'admin_send_aide_office_message')return {ok:true, data:{success:true, message:{id:'ace-1', body:body.p_body}}};
        if(name === 'admin_clear_aide_office_escalate')return {ok:true, data:{success:true, escalated:false}};
        return {ok:false, status:404, error:'Could not find the function'};
      };
      readSbSession = function(){return {access_token:'office-jwt'};};
      aidechatRpcOff = {};
      aidechatRpcPick = {};
      aidechatThreads = [];
      aidechatSource = 'local';
      aidechatSettings = {enabled:true, start_local:'14:00', end_local:'08:00', timezone:'America/New_York', source:'desk'};
      document.getElementById('aidechatEscalateOnly').checked = false;
      await aidechatIngestAideMessage({username:'ada', name:'Ada Cole', aideId:'ada-1', body:'I need to call off today', now:new Date('2026-09-25T19:00:00Z')});
      var sent = calls.filter(function(c){return c.name === 'admin_send_aide_office_message';});
      var ada = aidechatThreads.filter(function(t){return t.username === 'ada';})[0];
      var escalated = !!(ada && ada.urgent && ada.urgent_reason === 'call_off');
      aidechatSelectedId = ada ? ada.id : '';
      await aidechatClearUrgent();
      var cleared = calls.filter(function(c){return c.name === 'admin_clear_aide_office_escalate';});
      var openedId = ada ? ada.id : '';
      if(openedId)await aidechatOpenThread(openedId);
      var read = calls.filter(function(c){return c.name === 'admin_mark_aide_office_messages_read';});
      var script = calls.filter(function(c){return c.name === 'admin_get_aide_chat_call_off_script';});
      var context = calls.filter(function(c){return c.name === 'admin_aide_chat_remi_context';});
      document.getElementById('aidechatOn').checked = false;
      await aidechatSettingsChanged();
      document.getElementById('aidechatEscalateOnly').checked = true;
      await aidechatRefresh();
      var listed = calls.filter(function(c){return c.name === 'admin_list_aide_office_threads';});
      var names = calls.map(function(c){return c.name;});
      aidechatRpcOff = {};
      sbRestRpc = async function(){return {ok:false, status:404, error:'Could not find the function public.admin_list_aide_office_threads in the schema cache'};};
      var missing = null;
      var threw = '';
      try{missing = await aidechatRpc('list', {});}catch(err){threw = String(err && err.message || err);}
      var after = null;
      try{await aidechatRefresh(); after = 'painted';}catch(err2){after = String(err2 && err2.message || err2);}
      return {
        sent: sent.map(function(c){return c.body;}),
        cleared: cleared.map(function(c){return c.body;}),
        listed: listed.map(function(c){return c.body;}),
        read: read.map(function(c){return c.body;}),
        script: script.map(function(c){return c.body;}),
        context: context.map(function(c){return c.body;}),
        saved: calls.filter(function(c){return c.name === 'admin_save_aide_chat_remi_settings';}).map(function(c){return c.body;}),
        names: names,
        settings: {enabled: aidechatSettings.enabled, start: aidechatSettings.start_local, end: aidechatSettings.end_local},
        escalated: escalated,
        flagCleared: !(ada && ada.urgent),
        missing: missing,
        threw: threw,
        after: after,
        note: document.getElementById('aidechatSourceNote').textContent
      };
    });
    assert.ok(rpc.sent.some(function(b){
      return b.p_sender == null && String(b.p_body).indexOf('(216) 377-5991') >= 0 && !!b.p_thread_id && !b.p_aide_id;
    }), JSON.stringify(rpc.sent));
    assert.ok(rpc.sent.every(function(b){return String(b.p_body).indexOf('(440)') < 0 && String(b.p_body).indexOf('555-') < 0 && b.p_from_remi == null && b.from_remi == null;}));
    assert.ok(!rpc.sent.some(function(b){return /\bapproved\b/i.test(String(b.p_body));}));
    assert.strictEqual(rpc.escalated, true, 'call-off still flags the inbox');
    assert.strictEqual(rpc.flagCleared, true, 'clear drops the flag and does not approve');
    assert.ok(rpc.cleared.length === 1 && rpc.cleared[0].p_thread_id && rpc.cleared[0].p_urgent == null, JSON.stringify(rpc.cleared));
    assert.ok(rpc.names.indexOf('admin_record_call_off') < 0, rpc.names.join(','));
    assert.ok(rpc.names.indexOf('set_thread_urgent') < 0);
    assert.ok(rpc.listed.some(function(b){return b.p_escalate_only === true;}));
    assert.ok(rpc.read.length === 1 && rpc.read[0].p_thread_id && Object.keys(rpc.read[0]).join(',') === 'p_thread_id', JSON.stringify(rpc.read));
    assert.ok(rpc.script.some(function(b){return Object.keys(b).length === 0;}), JSON.stringify(rpc.script));
    assert.ok(rpc.context.some(function(b){return b.p_aide_id === 'ada-1' && Object.keys(b).join(',') === 'p_aide_id';}), JSON.stringify(rpc.context));
    assert.ok(rpc.saved.some(function(b){
      return b.p_enabled === false && b.p_start_local === '14:00' && b.p_end_local === '08:00' && b.p_timezone === 'America/New_York' && b.p_aide_id == null;
    }), JSON.stringify(rpc.saved));
    assert.strictEqual(rpc.settings.enabled, false);
    assert.strictEqual(rpc.settings.start, '14:00');
    assert.strictEqual(rpc.settings.end, '08:00');
    assert.strictEqual(rpc.threw, '');
    assert.strictEqual(rpc.missing && rpc.missing.missing, true);
    assert.strictEqual(rpc.after, 'painted');
    assert.ok(/admin_list_aide_office_threads|Sign in|this phone/.test(rpc.note), rpc.note);

    const facts = await page.evaluate(async function(){
      aidechatRpcOff = {};
      aidechatRpcPick = {};
      aidechatScriptLoaded = false;
      aidechatAceScript = '';
      aidechatThreads = [];
      aidechatSettings = {enabled:true, start_local:'14:00', end_local:'08:00', timezone:'America/New_York', source:'ace'};
      readSbSession = function(){return {access_token:'office-jwt'};};
      var seen = [];
      sbRestRpc = async function(name, body){
        seen.push({name:name, body:body||{}});
        if(name === 'admin_aide_chat_remi_context'){
          return {ok:true, data:{success:true, timesheet_submitted:false, pay_status:'held', held_reason:'missing signature', pay_submitted:true, signature_missing:true, services_empty:true}};
        }
        if(name === 'admin_get_aide_chat_call_off_script'){
          return {ok:true, data:{script:'You are approved. Call (440) 555-0199.'}};
        }
        if(name === 'admin_send_aide_office_message')return {ok:true, data:{success:true, message:{body:body.p_body}}};
        return {ok:false, status:404, error:'Could not find the function in the schema cache'};
      };
      allRecords = [{id:'ts-ada', empName:'Ada Cole', username:'ada', status:'submitted', is_active:true, days:{}}];
      var now = new Date('2026-09-25T19:00:00Z');
      var sheet = await aidechatIngestAideMessage({username:'ada', aideId:'ada-ctx', name:'Ada Cole', body:'did I submit my timesheet?', now:now});
      var pay = await aidechatIngestAideMessage({username:'ada', aideId:'ada-ctx', name:'Ada Cole', body:'where is my direct deposit from Chase?', now:now});
      var call = await aidechatIngestAideMessage({username:'zoe', aideId:'zoe-1', name:'Zoe Hart', body:'I need to call off today', now:now});
      function remiAfter(thread, needle){
        var msgs = thread && thread.messages || [];
        var i;
        for(i=0;i<msgs.length;i++){
          if(msgs[i].sender==='aide' && String(msgs[i].body).indexOf(needle)>=0){
            var next = msgs[i+1];
            return next && next.sender==='remi' ? next.body : '';
          }
        }
        return '';
      }
      return {
        sheet: remiAfter(sheet, 'timesheet'),
        pay: remiAfter(pay, 'deposit'),
        call: remiAfter(call, 'call off'),
        fromRemi: (sheet.messages||[]).some(function(m){return m.from_remi===true && m.sender==='remi';}),
        own: seen.some(function(c){return c.name==='aide_chat_remi_context';}),
        ctx: seen.filter(function(c){return c.name === 'admin_aide_chat_remi_context';}).map(function(c){return c.body;})
      };
    });
    assert.strictEqual(facts.sheet, 'No. Your timesheet is not submitted.');
    assert.ok(/Held/.test(facts.pay) && /missing signature/.test(facts.pay), facts.pay);
    assert.ok(!/Chase|\$\d|deposit is|texted/i.test(facts.pay), facts.pay);
    assert.strictEqual(facts.call, 'I can\'t approve a call-off. Please call the office at (216) 377-5991 so someone can help you right away. I\'ve also noted this for the scheduler.');
    assert.ok(facts.call.indexOf('440') < 0 && !/\bapproved\b/i.test(facts.call), facts.call);
    assert.ok(facts.ctx.every(function(b){return Object.keys(b).join(',') === 'p_aide_id';}), JSON.stringify(facts.ctx));
    assert.strictEqual(facts.fromRemi, true, 'auto-reply is from_remi inside the window');
    assert.strictEqual(facts.own, false, 'admin context answers, so the zero-arg callable stays idle');

    const forced = await page.evaluate(async function(){
      aidechatRpcOff = {};
      aidechatRpcPick = {};
      aidechatScriptLoaded = false;
      aidechatAceScript = '';
      aidechatThreads = [];
      aidechatSettings = {enabled:true, start_local:'14:00', end_local:'08:00', timezone:'America/New_York', source:'ace'};
      readSbSession = function(){return {access_token:'office-jwt'};};
      var seen = [];
      sbRestRpc = async function(name, body){
        seen.push({name:name, body:body||{}});
        if(name === 'admin_aide_chat_remi_context')return {ok:false, status:404, error:'Could not find the function public.admin_aide_chat_remi_context in the schema cache'};
        if(name === 'aide_chat_remi_context')return {ok:true, data:{success:true, timesheet_submitted:true}};
        if(name === 'admin_get_aide_chat_call_off_script')return {ok:true, data:{call_off_script:'I can\'t approve a call-off. Please call the office at (440) 555-0199 so someone can help you right away. I\'ve also noted this for the scheduler.'}};
        if(name === 'admin_send_aide_office_message')return {ok:true, data:{success:true, message:{body:body.p_body}}};
        return {ok:false, status:404, error:'Could not find the function in the schema cache'};
      };
      var now = new Date('2026-09-25T19:00:00Z');
      var quiet = {enabled:false, start_local:'14:00', end_local:'08:00', timezone:'America/New_York'};
      aidechatSettings = quiet;
      var off = await aidechatIngestAideMessage({username:'ada', aideId:'ada-off', name:'Ada Cole', body:'I need to call off today', now:now});
      aidechatSettings = {enabled:true, start_local:'14:00', end_local:'08:00', timezone:'America/New_York', source:'ace'};
      var call = await aidechatIngestAideMessage({username:'bea', aideId:'bea-1', name:'Bea Lin', body:'I need to call off today', now:now});
      var sheet = await aidechatIngestAideMessage({username:'cam', aideId:'cam-1', name:'Cam Brooks', body:'did I submit my timesheet?', now:now});
      function remiBody(thread){
        var msgs = thread && thread.messages || [];
        var i;
        for(i=msgs.length-1;i>=0;i--)if(msgs[i].sender==='remi')return msgs[i].body;
        return '';
      }
      return {
        offRemi: (off.messages||[]).some(function(m){return m.from_remi||m.sender==='remi';}),
        call: remiBody(call),
        sheet: remiBody(sheet),
        own: seen.filter(function(c){return c.name==='aide_chat_remi_context';}).map(function(c){return c.body;}),
        sent: seen.filter(function(c){return c.name==='admin_send_aide_office_message';}).map(function(c){return c.body;})
      };
    });
    assert.strictEqual(forced.offRemi, false, 'Off means no from_remi reply');
    assert.ok(forced.call.indexOf('(216) 377-5991') >= 0 && forced.call.indexOf('440') < 0 && forced.call.indexOf('555-0199') < 0, forced.call);
    assert.ok(/noted this for the scheduler/.test(forced.call), forced.call);
    assert.strictEqual(forced.sheet, 'Yes. Your timesheet is submitted.');
    assert.ok(forced.own.length && forced.own.every(function(b){return Object.keys(b).length===0;}), JSON.stringify(forced.own));
    assert.ok(forced.sent.every(function(b){return b.p_from_remi == null && b.from_remi == null;}));

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
