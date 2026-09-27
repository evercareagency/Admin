#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=clienthrs1d'), 'clienthrs1d marker');
assert.ok(html.includes('data-clienthrs1d="v=clienthrs1d"'), 'clienthrs1d data attr');
assert.ok(html.includes('<!-- client hours notifications 2026-09-27 v=clienthrs1d admin-build 2026-09-27-clienthrs1d'), 'clienthrs1d comment');
assert.ok(html.includes("var CLIENTHRS1D_MARKER='v=clienthrs1d'"), 'clienthrs1d script marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-login-toast1'), 'first admin-build is vapid1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-clienthrs1d">'), 'clienthrs1d meta stays');
assert.ok(html.indexOf('content="2026-09-27-clienthrs1d"') < html.indexOf('content="2026-09-27-remi-cm-email1"'), 'remi-cm-email1 stays after this tip');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-cm-email1">'), 'remi-cm-email1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remiface1">'), 'remiface1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage-simple1 meta stays');
['v=remi-cm-email1','v=remiface1','v=coverage-simple1','v=clienthrs1c','v=shift-slim1','v=aidechat1','v=remi-notes1','v=remi1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('admin_list_aide_notification_roster'), 'roster rpc');
assert.ok(html.includes('admin_nudge_aide_notifications'), 'nudge rpc');
assert.ok(html.includes('admin_schedule_aide_message'), 'schedule rpc');
assert.ok(html.includes('admin_list_scheduled_aide_messages'), 'list scheduled rpc');
assert.ok(html.includes('admin_edit_scheduled_aide_message'), 'edit scheduled rpc');
assert.ok(html.includes('admin_cancel_scheduled_aide_message'), 'cancel scheduled rpc');
assert.ok(html.includes('process_due_scheduled_aide_messages'), 'due processor rpc');
assert.ok(html.includes('admin_get_aide_chat_display_names'), 'get display names');
assert.ok(html.includes('admin_save_aide_chat_display_names'), 'save display names');
assert.ok(html.includes('get_vapid_public_key'), 'vapid public key');
assert.ok(html.includes('id="nav_notifications"'), 'Notifications is in More');
assert.ok(html.includes('id="tab_notifications"'), 'roster panel');
assert.ok(html.includes('id="chatNamesCard"'), 'chat names settings');
assert.ok(html.includes('id="clienthrs1dSched"'), 'schedule panel');
assert.ok(html.includes('value="sms_later" disabled'), 'SMS later stays disabled');
assert.ok(!/twilio|sms_send|send_sms|\bQuo\b/.test(html.slice(html.indexOf('var CLIENTHRS1D_MARKER'), html.indexOf('// v=remiask1 status look-ups'))), 'no SMS sender in this tip');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('assets/remi-locked.png?v=remiface1'), 'locked Remi face stays');
const navStart = html.indexOf('class="bottom-nav"');
const nav = html.slice(navStart, html.indexOf('</nav>', navStart));
assert.strictEqual((nav.match(/bottom-tab/g) || []).length, 5, 'bottom bar stays five tabs');
assert.ok(!nav.includes('nav_notifications'), 'Notifications is not a default bottom tab');
const more = html.slice(html.indexOf('id="moreList"'), html.indexOf('class="more-account"'));
assert.ok(more.indexOf('id="nav_notifications"') < more.indexOf('id="nav_aidechat"'), 'Notifications sits with Aide chat');
assert.ok(more.includes('data-layout-roles="Admin Scheduler"'), 'office gate');
const nurse = html.slice(html.indexOf('id="nurseScreen"'));
assert.strictEqual(nurse.indexOf('id="nav_notifications"'), -1, 'Nurse screen has no Notifications row');
assert.ok(!/reset_aide_temp_password/.test(html.slice(html.indexOf('var CLIENTHRS1D_MARKER'), html.indexOf('// v=remiask1 status look-ups'))), 'no auth reseal in this tip');

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
    console.log('admin-clienthrs1d browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.CLIENTHRS1D_SHOTS || '/opt/cursor/artifacts';
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
  const SARA = '11111111-1111-4111-8111-111111111111';
  const KIM = '22222222-2222-4222-8222-222222222222';
  const MOE = '33333333-3333-4333-8333-333333333333';
  const LINA = '44444444-4444-4444-8444-444444444444';
  const DEVON = '55555555-5555-4555-8555-555555555555';
  const SCHED = '66666666-6666-4666-8666-666666666666';
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await page.setViewport({width:390, height:844, deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=clienthrs1d', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(){
      localStorage.clear();
      sessionStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'moe';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
    });
    const boot = await page.evaluate(function(){
      var metas = document.querySelectorAll('meta[name="admin-build"]');
      return {
        first: document.querySelector('meta[name="admin-build"]').content,
        second: metas[1] ? metas[1].content : '',
        third: metas[2] ? metas[2].content : '',
        fourth: metas[3] ? metas[3].content : '',
        fifth: metas[4] ? metas[4].content : '',
        sixth: metas[5] ? metas[5].content : '',
        seventh: metas[6] ? metas[6].content : '',
        eighth: metas[7] ? metas[7].content : '',
        ninth: metas[8] ? metas[8].content : '',
        marker: CLIENTHRS1D_MARKER,
        chip: document.querySelector('#copilotFab img').getAttribute('src')
      };
    });
    assert.strictEqual(boot.first, '2026-09-27-login-toast1');
    assert.strictEqual(boot.second, '2026-09-27-aide-office-vis1');
    assert.strictEqual(boot.third, '2026-09-27-remi-langs1');
    assert.strictEqual(boot.fourth, '2026-09-27-hold-clear1');
    assert.strictEqual(boot.fifth, '2026-09-27-sched-time-tap1');
    assert.strictEqual(boot.sixth, '2026-09-27-aide-text-chat1');
    assert.strictEqual(boot.seventh, '2026-09-27-remi-float-hide1');
    assert.strictEqual(boot.eighth, '2026-09-27-tabbar-8');
    assert.strictEqual(boot.ninth, '2026-09-27-cover-card-cancel1');
    assert.strictEqual(boot.marker, 'v=clienthrs1d');
    assert.ok(boot.chip.indexOf('remi-locked.png') >= 0, boot.chip);

    const roster = [
      {aide_id:MOE, aide_username:'mossier', aide_name:'Moe', remi_reminders:true, office_chat_push:true, timesheet_location_permission:'denied', has_active_subscription:false, needs_attention:true, nudge_kinds:['turn_on_location']},
      {aide_id:LINA, aide_username:'lina', aide_name:'Lina', remi_reminders:false, office_chat_push:false, timesheet_location_permission:'never_asked', has_active_subscription:false, needs_attention:true, nudge_kinds:['turn_on_reminders','turn_on_chat','turn_on_location']},
      {aide_id:SARA, aide_username:'sara', aide_name:'Sara', remi_reminders:true, office_chat_push:true, timesheet_location_permission:'allowed', has_active_subscription:true, needs_attention:false, nudge_kinds:[]},
      {aide_id:DEVON, aide_username:'devon', aide_name:'Devon', remi_reminders:false, office_chat_push:true, timesheet_location_permission:'allowed', has_active_subscription:true, needs_attention:true, nudge_kinds:['turn_on_reminders']}
    ];
    const messages = [
      {id:'m1', sender_role:'remi', from_role:'from_remi', display_name:'Remi AI', body:'Hi Sara — reminder to submit your timesheet today when you can.', created_at:'2026-09-27T12:00:00Z'},
      {id:'m2', sender_role:'office', from_role:'from_office', display_name:'Jazmine (Scheduler)', body:'Can you cover Ada tomorrow morning 8–1?', created_at:'2026-09-27T12:01:00Z'},
      {id:'m3', sender_role:'aide', from_role:'from_aide', display_name:'Sara', body:'Yes I can.', created_at:'2026-09-27T12:02:00Z'},
      {id:'m4', sender_role:'office', from_role:'from_office', display_name:'Moe (Manager)', body:'Thanks Sara — office phone if anything changes: (216) 377-5991.', created_at:'2026-09-27T12:03:00Z'}
    ];
    const queued = [{
      id:SCHED, aide_id:SARA, aide_name:'Sara', body:'Reminder: pick up Ada Cole tomorrow 8:00–1:00. Text me if anything changes.',
      shortcut:'tomorrow_7am_et', scheduled_for:'2026-09-28T11:00:00Z', scheduled_for_et:'2026-09-28 07:00:00',
      status:'queued', deliver_channel:'in_app_messages', sms_later_oos:false
    }];

    await page.evaluate(function(pack){
      window.__calls = [];
      readSbSession = function(){return {access_token:'office-jwt'};};
      sbRestRpc = async function(name, body){
        window.__calls.push({name:name, body:body||{}});
        if(name === 'get_vapid_public_key')return {ok:true, data:{success:true, vapidPublicKey:null, configured:false, note:'not set'}};
        if(name === 'admin_list_aide_notification_roster'){
          var filter = (body && body.p_filter) || 'needs_attention';
          var aides = pack.roster.filter(function(row){
            if(filter === 'all')return true;
            if(filter === 'location_off')return row.timesheet_location_permission !== 'allowed';
            if(filter === 'chat_off')return !row.office_chat_push;
            return row.needs_attention;
          });
          return {ok:true, data:{success:true, filter:filter, aides:aides}};
        }
        if(name === 'admin_nudge_aide_notifications')return {ok:true, data:{success:true, nudge_kind:body.p_nudge_kind, aide_id:body.p_aide_id, sms_sent:false, channel:'in_app_messages', message:{display_name:'Remi AI', body:'Hi — please turn on timesheet location'}}};
        if(name === 'admin_get_aide_chat_display_names' || name === 'admin_save_aide_chat_display_names'){
          var names = {remi:(body && body.p_remi) || 'Remi AI', scheduler:(body && body.p_scheduler) || 'Jazmine (Scheduler)', admin:(body && body.p_admin) || 'Moe (Manager)'};
          return {ok:true, data:{success:true, display_names:names, remi:names.remi, scheduler:names.scheduler, admin:names.admin}};
        }
        if(name === 'admin_list_aide_office_threads')return {ok:true, data:{success:true, threads:[
          {thread_id:'t-sara', aide_id:pack.SARA, aide_username:'sara', aide_name:'Sara', last_message:'Yes I can.'},
          {thread_id:'t-kim', aide_id:pack.KIM, aide_username:'kim', aide_name:'Kim', last_message:''},
          {thread_id:'t-moe', aide_id:pack.MOE, aide_username:'mossier', aide_name:'Moe', last_message:''}
        ]}};
        if(name === 'admin_list_aide_office_messages')return {ok:true, data:{success:true, viewer:'office', display_names:{remi:'Remi AI', scheduler:'Jazmine (Scheduler)', admin:'Moe (Manager)'}, messages:pack.messages}};
        if(name === 'admin_list_scheduled_aide_messages')return {ok:true, data:{success:true, messages:pack.queued}};
        if(name === 'admin_schedule_aide_message')return {ok:true, data:{success:true, scheduled:{id:pack.SCHED, status:'queued', deliver_channel:body.p_deliver_channel, shortcut:body.p_shortcut || null}}};
        if(name === 'admin_edit_scheduled_aide_message')return {ok:true, data:{success:true, scheduled:{id:body.p_id, status:'queued'}}};
        if(name === 'admin_cancel_scheduled_aide_message')return {ok:true, data:{success:true, status:'canceled'}};
        if(name === 'process_due_scheduled_aide_messages')return {ok:true, data:{success:true, processed:0, sms_implemented:false, sms_later_due_unsent:0}};
        if(name === 'admin_get_aide_chat_remi_settings')return {ok:true, data:{success:true, enabled:false, start_local:'14:00', end_local:'08:00', timezone:'America/New_York'}};
        if(name === 'admin_mark_aide_office_messages_read')return {ok:true, data:{success:true}};
        return {ok:false, status:404, error:'Could not find the function'};
      };
    }, {roster:roster, messages:messages, queued:queued, SARA:SARA, KIM:KIM, MOE:MOE, SCHED:SCHED});

    await page.evaluate(function(){showTab('more');});
    await page.click('#nav_notifications');
    await page.waitForSelector('#notifRows .notif-row');
    await page.click('#notifFilterAll');
    await page.waitForFunction(function(){return document.querySelectorAll('#notifRows .notif-row').length >= 4;});
    const phoneRoster = await page.evaluate(function(){
      var rows = Array.prototype.map.call(document.querySelectorAll('#notifRows .notif-row'), function(el){
        return el.innerText.replace(/\s+/g,' ').trim();
      });
      var sms = document.getElementById('clienthrs1dChannel');
      return {
        rows: rows,
        vapid: document.getElementById('notifVapid').textContent,
        scroll: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        nurse: !!document.querySelector('#nurseScreen #nav_notifications')
      };
    });
    assert.strictEqual(phoneRoster.nurse, false);
    assert.ok(phoneRoster.vapid.indexOf('not configured') >= 0, phoneRoster.vapid);
    assert.ok(phoneRoster.rows.some(function(t){return t.indexOf('Moe @mossier') >= 0 && t.indexOf('turn on location') >= 0;}), phoneRoster.rows.join('\n'));
    assert.ok(phoneRoster.rows.some(function(t){return t.indexOf('Sara @sara') >= 0 && t.indexOf('All set') >= 0;}));
    assert.ok(phoneRoster.rows.some(function(t){return t.indexOf('Never asked') >= 0 && t.indexOf('turn on chat') >= 0 && t.indexOf('turn on reminders') >= 0;}));
    assert.ok(phoneRoster.scroll, 'phone roster does not widen the page');
    await shotEl(page, '#tab_notifications', path.join(shotDir, 'clienthrs1d-roster-phone.png'));

    await page.click('#notifRows .notif-btn');
    const nudged = await page.evaluate(function(){
      return {
        status: document.getElementById('notifStatus').textContent,
        call: window.__calls.filter(function(c){return c.name === 'admin_nudge_aide_notifications';}).pop()
      };
    });
    assert.ok(nudged.call && nudged.call.body.p_nudge_kind === 'turn_on_location' && nudged.call.body.p_aide_id === MOE, JSON.stringify(nudged));
    assert.ok(/Not SMS/.test(nudged.status), nudged.status);
    assert.ok(!windowCallsHaveSms(await page.evaluate(function(){return window.__calls;})));

    await page.click('#notifFilterLocation');
    const loc = await page.evaluate(function(){
      return window.__calls.filter(function(c){return c.name === 'admin_list_aide_notification_roster';}).pop().body.p_filter;
    });
    assert.strictEqual(loc, 'location_off');

    await page.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await page.evaluate(function(){window.scrollTo(0,0); document.getElementById('notifFilterAll').scrollIntoView({block:'center'});});
    await page.click('#notifFilterAll');
    await page.waitForFunction(function(){return document.querySelectorAll('#notifRows .notif-row').length >= 4;});
    await shotEl(page, '#tab_notifications', path.join(shotDir, 'clienthrs1d-roster-desktop.png'));

    await page.setViewport({width:390, height:844, deviceScaleFactor:1});
    await page.evaluate(function(){showTab('aidechat');});
    await page.waitForSelector('#aidechatList .aidechat-card');
    await page.evaluate(function(){
      var cards = document.querySelectorAll('#aidechatList .aidechat-card');
      for(var i=0;i<cards.length;i++){
        if(cards[i].innerText.indexOf('Sara') >= 0){cards[i].click();return;}
      }
    });
    await page.waitForSelector('#clienthrs1dSched');
    await page.waitForSelector('.clienthrs1d-queued');
    const pov = await page.evaluate(function(){
      var who = Array.prototype.map.call(document.querySelectorAll('#aidechatMessages .aidechat-who'), function(el){return el.textContent;});
      var channel = document.getElementById('clienthrs1dChannel');
      var smsOpt = channel.querySelector('option[value="sms_later"]');
      var queued = document.querySelector('.clienthrs1d-queued').innerText;
      var meta = document.getElementById('aidechatThreadMeta').textContent;
      return {
        who: who,
        meta: meta,
        queued: queued,
        disabled: smsOpt.disabled,
        value: channel.value,
        date: document.getElementById('clienthrs1dDate').value,
        time: document.getElementById('clienthrs1dTime').value,
        scroll: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      };
    });
    assert.deepStrictEqual(pov.who, ['Remi AI','Jazmine (Scheduler)','Sara','Moe (Manager)']);
    assert.ok(pov.meta.indexOf('Moe (Manager)') >= 0, pov.meta);
    assert.ok(/tomorrow 7:00 AM ET/.test(pov.queued), pov.queued);
    assert.ok(pov.queued.indexOf('Sara') >= 0);
    assert.strictEqual(pov.disabled, true);
    assert.strictEqual(pov.value, 'in_app_messages');
    assert.ok(/^\d{2}\/\d{2}\/\d{4}$/.test(pov.date), pov.date);
    assert.strictEqual(pov.time, '07:00');
    assert.ok(pov.scroll, 'phone thread does not widen the page');
    await page.evaluate(function(){document.getElementById('aidechatThreadTitle').scrollIntoView({block:'start'});});
    await page.screenshot({path: path.join(shotDir, 'clienthrs1d-pov-phone.png')});
    await shotEl(page, '#clienthrs1dSched', path.join(shotDir, 'clienthrs1d-schedule-phone.png'));

    await page.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await page.evaluate(function(){
      if(typeof aidechatShow==='function')aidechatShow('thread');
      document.getElementById('aidechatThreadTitle').scrollIntoView({block:'start'});
    });
    const desk = await page.evaluate(function(){
      var panel = document.getElementById('tab_aidechat');
      var list = document.getElementById('aidechatInboxView');
      return {split: panel.classList.contains('is-thread'), listHidden: list.hidden};
    });
    assert.strictEqual(desk.split, true);
    assert.strictEqual(desk.listHidden, false);
    await page.screenshot({path: path.join(shotDir, 'clienthrs1d-pov-desktop.png')});
    await shotEl(page, '#clienthrs1dSched', path.join(shotDir, 'clienthrs1d-schedule-desktop.png'));
    await page.setViewport({width:390, height:844, deviceScaleFactor:1});

    await page.select('#clienthrs1dWhen', 'tomorrow_7am_et');
    await page.click('#clienthrs1dSchedule');
    const scheduled = await page.evaluate(function(){
      return window.__calls.filter(function(c){return c.name === 'admin_schedule_aide_message';}).pop();
    });
    assert.strictEqual(scheduled.body.p_shortcut, 'tomorrow_7am_et');
    assert.strictEqual(scheduled.body.p_deliver_channel, 'in_app_messages');
    assert.strictEqual(scheduled.body.p_scheduled_for, undefined);
    assert.ok(scheduled.body.p_body.indexOf('Ada Cole') >= 0);

    const due = await page.evaluate(function(){
      return window.__calls.some(function(c){return c.name === 'process_due_scheduled_aide_messages';});
    });
    assert.strictEqual(due, true);

    await page.click('[data-sched-edit]');
    await page.evaluate(function(){
      document.getElementById('clienthrs1dBody').value = 'Updated reminder for Sara.';
    });
    await page.click('#clienthrs1dSchedule');
    const edited = await page.evaluate(function(){
      return window.__calls.filter(function(c){return c.name === 'admin_edit_scheduled_aide_message';}).pop();
    });
    assert.ok(edited && edited.body.p_id && edited.body.p_body.indexOf('Updated reminder') >= 0, JSON.stringify(edited && edited.body));
    await page.click('[data-sched-cancel]');
    const canceled = await page.evaluate(function(){
      return window.__calls.filter(function(c){return c.name === 'admin_cancel_scheduled_aide_message';}).pop();
    });
    assert.ok(canceled && canceled.body.p_id);

    await page.setViewport({width:390, height:844, deviceScaleFactor:1});
    await page.evaluate(function(){showTab('settings');});
    await page.waitForSelector('#chatNameRemi');
    await page.evaluate(function(){document.getElementById('chatNamesCard').scrollIntoView({block:'start'});});
    const names = await page.evaluate(function(){
      return {
        remi: document.getElementById('chatNameRemi').value,
        scheduler: document.getElementById('chatNameScheduler').value,
        admin: document.getElementById('chatNameAdmin').value,
        aide: document.getElementById('chatNamesAidePreview').innerText,
        office: document.getElementById('chatNamesOfficePreview').innerText
      };
    });
    assert.strictEqual(names.remi, 'Remi AI');
    assert.strictEqual(names.scheduler, 'Jazmine (Scheduler)');
    assert.strictEqual(names.admin, 'Moe (Manager)');
    assert.ok(names.aide.indexOf('You') >= 0 && names.aide.indexOf('Remi AI') >= 0, names.aide);
    assert.ok(names.office.indexOf('Sara') >= 0 && names.office.indexOf('You') < 0, names.office);
    await shotEl(page, '#chatNamesCard', path.join(shotDir, 'clienthrs1d-names-phone.png'));
    await page.click('#chatNamesSave');
    const saved = await page.evaluate(function(){
      return window.__calls.filter(function(c){return c.name === 'admin_save_aide_chat_display_names';}).pop();
    });
    assert.strictEqual(saved.body.p_remi, 'Remi AI');
    assert.strictEqual(saved.body.p_scheduler, 'Jazmine (Scheduler)');
    assert.strictEqual(saved.body.p_admin, 'Moe (Manager)');

    await page.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await page.evaluate(function(){window.scrollTo(0,0);});
    await shotEl(page, '#chatNamesCard', path.join(shotDir, 'clienthrs1d-names-desktop.png'));

    const calls = await page.evaluate(function(){return window.__calls.map(function(c){return c.name;});});
    assert.ok(calls.indexOf('get_vapid_public_key') >= 0);
    assert.ok(!calls.some(function(n){return /quo|sms_send|send_sms/i.test(n);}), calls.join(','));
    assert.deepStrictEqual(errors, []);
  }finally{
    await browser.close();
    server.close();
  }
}

async function shotEl(page, sel, file){
  const el = await page.$(sel);
  assert.ok(el, 'missing '+sel);
  await page.evaluate(function(){
    var css=document.getElementById('clienthrs1dShotCss');
    if(!css){
      css=document.createElement('style');
      css.id='clienthrs1dShotCss';
      css.textContent='[data-shot-hide]{visibility:hidden !important;}';
      document.head.appendChild(css);
    }
    document.querySelectorAll('.shell-top,.bottom-nav,#copilotFab').forEach(function(node){
      node.setAttribute('data-shot-hide','1');
    });
  });
  await el.evaluate(function(node){node.scrollIntoView({block:'start'});});
  await el.screenshot({path:file});
  await page.evaluate(function(){
    document.querySelectorAll('[data-shot-hide]').forEach(function(node){node.removeAttribute('data-shot-hide');});
  });
}

function windowCallsHaveSms(calls){
  return (calls||[]).some(function(c){
    var blob = JSON.stringify(c.body||{});
    return c.name === 'admin_schedule_aide_message' && blob.indexOf('sms_later') >= 0;
  });
}

runBrowser().then(function(){
  console.log('admin-clienthrs1d ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
