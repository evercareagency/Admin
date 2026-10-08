#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=hold-client1'), 'hold-client1 marker');
assert.ok(html.includes('data-hold-client1="v=hold-client1"'), 'hold-client1 data attr');
assert.ok(html.includes('<!-- client hold 2026-09-27 v=hold-client1 admin-build 2026-09-27-hold-client1'), 'hold-client1 comment');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-hold-client1">'), 'hold-client1 meta');
assert.ok(html.includes("var HOLD_CLIENT1_MARKER='v=hold-client1'"), 'script marker');
assert.ok(html.includes('GHOST-HOLD-CLIENT1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE'), 'Ace CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Probe PASS'), 'merge waits for Probe PASS');
assert.ok(html.includes('hold-client1-v1.sql'), 'Ace patch already applied');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build is remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-27-list-az1"'), 'list-az1 stays after remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-hold-autosave1"'), 'hold-autosave1 stays after list-az1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-hold-client1"') < html.indexOf('content="2026-09-27-aides-info1"'), 'aides-info1 stays after hold-client1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
['v=aides-info1','v=login-toast1','v=aide-text-chat1','v=remi-float-hide1','v=tabbar-8','v=cover-card-cancel1','v=clienthrs1c','v=shift-slim1','v=client-ins1','v=sched1','v=clienthrs1b','v=hold-clear1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aide-text-chat1">'), 'aide-text-chat1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-clienthrs1c">'), 'clienthrs1c meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-client-ins1">'), 'client-ins1 meta stays');
assert.ok(html.includes("sbRestRpc('upsert_schedule_client_hold'"), 'save reuses the client hold callable');
assert.ok(html.includes("sbRestRpc('clear_schedule_client_hold',{p_hold_id:holdId})"), 'clear omits p_end_date');
assert.ok(html.includes("sbRestRpc('clear_schedule_client_hold',{\n      p_hold_id:holdId,\n      p_end_date:end\n    })"), 'end hold sends p_end_date only');
assert.ok(html.includes("sbRestRpc('upsert_schedule_slot_day_mark'"), 'slot day mark stays');
assert.ok(html.includes('paused · 0 hrs'), 'per-slot hold chip stays');
assert.ok(html.includes('On hold (client · no hours needed)'), 'legend matches the locked look');
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
const holdFns = html.slice(html.indexOf('async function schedSaveClientHold'), html.indexOf('function schedFocusDeepLink'));
assert.ok(!/quo|twilio|send_sms|reset_aide_temp_password|admin_set_role_password/i.test(holdFns), 'no Auth reseal and no Quo/SMS on the client hold path');
assert.ok(!holdFns.includes('upsert_schedule_slot_pattern'), 'client hold save does not invent a shift');
assert.ok(!holdFns.includes('upsert_schedule_slot_day_mark'), 'client hold save does not mark a slot');

const schedStart = html.indexOf('// admin schedule v=sched1');
const schedEnd = html.indexOf('// end admin schedule v=sched1');
const slotStart = html.indexOf('// schedule multi-slot v=clienthrs1b');
const slotEnd = html.indexOf('// end schedule multi-slot v=clienthrs1b');
const schedSrc = html.slice(schedStart, schedEnd);
const slotSrc = html.slice(slotStart, slotEnd);

const rpc = [];
const toasts = [];
const els = {};
function makeEl(id){
  const el = {
    id: id,
    hidden: false,
    innerHTML: '',
    textContent: '',
    value: '',
    disabled: false,
    classList: {add: function(){}, remove: function(){}, toggle: function(){}},
    dataset: {},
    style: {},
    setAttribute: function(k, v){ this[k] = v; },
    getAttribute: function(k){ return this[k]; },
    addEventListener: function(){},
    scrollIntoView: function(){},
    querySelector: function(){ return null; },
    querySelectorAll: function(){ return []; }
  };
  els[id] = el;
  return el;
}
['schedWeekLabel','schedSourceNote','schedNoClients','schedEmpty','schedEmptyAdd','schedScroll','schedHead','schedBody','schedPanel','schedSlotDetail','schedSlotClientName','schedSlotAuth','schedSlotWhen','schedSlotWeekStat','schedSlotDaySum','schedSlotCards','schedSlotPattern','schedSlotPatternTitle','schedSlotClient','schedSlotWeekday','schedSlotKey','schedSlotLabel','schedSlotStart','schedSlotEnd','schedSlotAide','schedSlotHours','schedSlotHoursView','schedSlotHoursNote','schedSlotSort','schedSlotDaysHint','schedSlotShiftSummary','schedSlotModeEdit','schedSlotModeAdd','schedSlotRemovePattern','schedIntro','schedAddUsualBtn','schedFilterCalloff','schedFilterHold','schedFilterAll','schedFilterOpen','schedLegend','schedSearch','tab_schedule','schedViewWeek','schedViewDay','schedClientHoldChip','schedClientHoldStart','schedClientHoldEnd','schedClientHoldNote'].forEach(makeEl);

const sandbox = {
  allClients: [],
  loadedAidesList: [],
  allAidesForAssign: [],
  currentAdminRole: 'Admin',
  location: {search: '', hash: ''},
  document: {getElementById: function(id){ return els[id] || null; }},
  showTempMsg: function(msg){ toasts.push(String(msg)); },
  logActivity: function(){},
  showTab: function(){},
  sbUuid: function(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || '')); },
  evercareSbEnabled: function(){ return true; },
  readSbSession: function(){ return {access_token: 'office'}; },
  sbRestRpc: function(name, body){
    rpc.push({name: name, body: body});
    if(name === 'list_schedule_week' || name === 'list_schedule_week_slots'){
      return Promise.resolve({ok: false, error: 'skip reload'});
    }
    return Promise.resolve({ok: true, data: {ok: true, success: true}});
  },
  sbRestGet: function(){ return Promise.resolve({ok: false}); },
  apiGetCached: async function(){ return {success: false}; },
  Intl: Intl,
  Date: Date,
  Number: Number,
  String: String,
  Math: Math,
  JSON: JSON,
  isFinite: isFinite,
  decodeURIComponent: decodeURIComponent,
  Promise: Promise,
  console: console
};
vm.createContext(sandbox);
vm.runInContext(schedSrc + '\n' + slotSrc, sandbox);

assert.strictEqual(sandbox.HOLD_CLIENT1_MARKER, 'v=hold-client1');
assert.strictEqual(sandbox.CLIENTHRS1C_MARKER, 'v=clienthrs1c');

const testClientAlpha = '11111111-1111-4111-8111-111111111111';
const ada = '22222222-2222-4222-8222-222222222222';
const holdId = '99999999-9999-4999-8999-999999999999';

function emptyDays(start){
  const days = {};
  for(let n = 1; n <= 7; n++){
    days[String(n)] = {on_date: sandbox.schedAddDays(start, n - 1), weekday: n, slots: []};
  }
  return days;
}
function calls(name){
  return rpc.filter(function(c){ return c.name === name; });
}

const banner = {
  hold_id: holdId,
  note: 'hospital',
  start_date: '2026-09-28',
  end_date: '2026-10-05',
  start_label: '09/28',
  end_label: '10/05',
  open_ended: false,
  label: 'hospital · 09/28 – 10/05'
};

(async function main(){
  sandbox.schedApplySlotWeek({
    week_start: '2026-09-28',
    week_end: '2026-10-04',
    marker: 'hold-client1',
    v: 'hold-client1',
    clients: [
      {client_id: testClientAlpha, client_name: 'Test Client Alpha', weekly_authorized_hours: 63, client_on_hold: false, hold_banner: null, holds: [], days: emptyDays('2026-09-28')},
      {client_id: ada, client_name: 'Ada Cole', weekly_authorized_hours: 40, days: emptyDays('2026-09-28')}
    ]
  });
  assert.strictEqual(sandbox.schedHoldClient1, true, 'week marker is hold-client1');
  assert.strictEqual(sandbox.schedSlotMode, true);
  sandbox.schedPaint();
  assert.strictEqual(els.schedEmpty.hidden, true, 'empty week does not demand Add shift first');
  assert.ok(els.schedBody.innerHTML.includes('Test Client Alpha'), 'empty week still lists the client');
  assert.ok(els.schedBody.innerHTML.includes('sched-dash'), 'empty days are dashes');
  assert.strictEqual(els.schedSlotDetail.hidden, true, 'cold paint does not open the client panel');
  sandbox.schedSelectSlotDay(testClientAlpha, '2026-09-28', 1);
  assert.ok(els.schedSlotCards.innerHTML.includes('Put on hold'), 'Put on hold is on the client week');
  assert.ok(els.schedSlotCards.innerHTML.includes('Save hold'), 'Start/End/Note save is on the panel');
  assert.ok(els.schedSlotCards.innerHTML.includes('No Add shift required'), 'no Add shift prerequisite');
  assert.ok(els.schedSlotDaySum.textContent.includes('Empty week'), 'empty week copy');
  assert.ok(!els.schedBody.innerHTML.includes('class="sched-chip'), 'dashes are not hourly chips');

  els.schedClientHoldStart.value = '09/28/2026';
  els.schedClientHoldEnd.value = '10/05/2026';
  els.schedClientHoldNote.value = 'hospital / ER';
  rpc.length = 0;
  await sandbox.schedSaveClientHold(testClientAlpha);
  const saved = calls('upsert_schedule_client_hold');
  assert.strictEqual(saved.length, 1, 'one client hold upsert');
  assert.strictEqual(saved[0].body.p_client_id, testClientAlpha);
  assert.strictEqual(saved[0].body.p_start_date, '2026-09-28');
  assert.strictEqual(saved[0].body.p_end_date, '2026-10-05');
  assert.strictEqual(saved[0].body.p_note, 'hospital / ER');
  assert.ok(!Object.prototype.hasOwnProperty.call(saved[0].body, 'p_hold_id'), 'a new hold does not invent a hold id');
  assert.ok(!calls('upsert_schedule_slot_pattern').length, 'save does not create a pattern');
  assert.ok(!calls('upsert_schedule_slot_pattern_weekdays').length, 'save does not fan out shifts');
  assert.ok(!calls('upsert_schedule_slot_day_mark').length, 'save does not mark a slot on hold');

  sandbox.schedApplySlotWeek({
    week_start: '2026-09-28',
    marker: 'hold-client1',
    v: 'hold-client1',
    clients: [
      {client_id: testClientAlpha, client_name: 'Test Client Alpha', weekly_authorized_hours: 63, client_on_hold: true, hold_banner: banner, holds: [{hold_id: holdId, start_date: '2026-09-28', end_date: '2026-10-05', note: 'hospital', open_ended: false}], days: emptyDays('2026-09-28')},
      {
        client_id: ada,
        client_name: 'Ada Cole',
        weekly_authorized_hours: 40,
        client_on_hold: false,
        days: (function(){
          const days = emptyDays('2026-09-28');
          days['1'].slots = [{slot_key: 'am', label: 'Day', start_local: '08:00:00', end_local: '13:00:00', hours: 5, pattern_hours: 5, usual_aide_id: '', aide_name: 'Sara', sort_order: 0, mark: null}];
          return days;
        })()
      }
    ]
  });
  const painted = sandbox.schedFindSlotClient(testClientAlpha);
  assert.strictEqual(painted.client_on_hold, true);
  assert.strictEqual(painted.hold_banner.label, 'hospital · 09/28 – 10/05');
  assert.strictEqual(painted.days['1'].slots.length, 0, 'hold does not invent a slot');
  sandbox.schedSetFilter('hold');
  assert.ok(els.schedBody.innerHTML.includes('Test Client Alpha'), 'On hold filter lists the client');
  assert.ok(els.schedBody.innerHTML.includes('hospital · 09/28 – 10/05'), 'row banner uses hold_banner.label');
  assert.ok(els.schedBody.innerHTML.includes('row-hold-banner'), 'row banner class');
  assert.ok(els.schedBody.innerHTML.includes('sched-dash'), 'held empty days stay dashes');
  assert.ok(!els.schedBody.innerHTML.includes('Ada Cole'), 'clients who are not on hold stay off the filter');
  assert.ok(els.schedSlotCards.innerHTML.includes('End hold…'), 'End hold is on the client panel');
  assert.ok(els.schedSlotCards.innerHTML.includes('data-client-hold="clear"'), 'Clear is separate from End hold');
  assert.ok(els.schedClientHoldChip.innerHTML.includes('On hold'), 'client chip');

  els.schedClientHoldEnd.value = '10/01/2026';
  rpc.length = 0;
  await sandbox.schedEndClientHold(testClientAlpha);
  const ended = calls('clear_schedule_client_hold');
  assert.strictEqual(ended.length, 1, 'end hold is one clear');
  assert.strictEqual(ended[0].body.p_hold_id, holdId);
  assert.strictEqual(ended[0].body.p_end_date, '2026-10-01');
  assert.deepStrictEqual(Object.keys(ended[0].body).sort(), ['p_end_date', 'p_hold_id']);
  assert.ok(!calls('upsert_schedule_slot_pattern').length, 'end hold does not write a shift');
  assert.ok(!calls('upsert_schedule_slot_day_mark').length, 'end hold does not mark a slot');

  sandbox.schedApplySlotWeek({
    week_start: '2026-09-28',
    marker: 'hold-client1',
    v: 'hold-client1',
    clients: [{
      client_id: testClientAlpha,
      client_name: 'Test Client Alpha',
      weekly_authorized_hours: 63,
      client_on_hold: true,
      hold_banner: banner,
      holds: [{hold_id: holdId, start_date: '2026-09-28', end_date: '2026-10-05', note: 'hospital', open_ended: false}],
      days: emptyDays('2026-09-28')
    }]
  });
  sandbox.schedFilterHold = false;
  sandbox.schedPaint();
  rpc.length = 0;
  await sandbox.schedClearClientHold(testClientAlpha);
  const cleared = calls('clear_schedule_client_hold');
  assert.strictEqual(cleared.length, 1, 'clear abandons the hold');
  assert.strictEqual(cleared[0].body.p_hold_id, holdId);
  assert.ok(!Object.prototype.hasOwnProperty.call(cleared[0].body, 'p_end_date'), 'clear does not send p_end_date');
  assert.ok(!calls('upsert_schedule_slot_day_mark').length, 'clear is not the slot-mark clear');

  sandbox.schedApplySlotWeek({
    week_start: '2026-10-12',
    marker: 'hold-client1',
    v: 'hold-client1',
    clients: [
      {client_id: testClientAlpha, client_name: 'Test Client Alpha', weekly_authorized_hours: 63, client_on_hold: false, hold_banner: null, holds: [{hold_id: holdId, start_date: '2026-09-28', end_date: '2026-10-01', note: 'hospital', open_ended: false, is_active: true}], days: emptyDays('2026-10-12')},
      {client_id: ada, client_name: 'Ada Cole', weekly_authorized_hours: 40, client_on_hold: false, days: emptyDays('2026-10-12')}
    ]
  });
  assert.strictEqual(sandbox.schedFindSlotClient(testClientAlpha).client_on_hold, false);
  sandbox.schedSetFilter('hold');
  assert.ok(!els.schedBody.innerHTML.includes('Test Client Alpha'), 'later week filter excludes the ended hold');
  assert.ok(els.schedBody.innerHTML.includes('No clients on hold this week'), 'empty On hold filter does not say to make a shift');
  sandbox.schedSetFilter('all');
  assert.ok(els.schedBody.innerHTML.includes('Test Client Alpha'), 'later week All still lists the client');
  assert.ok(els.schedBody.innerHTML.includes('sched-dash'), 'later week stays dashes until hours resume');
  assert.ok(!els.schedBody.innerHTML.includes('row-hold-banner'), 'ended hold has no row banner');

  await shots();
  console.log('admin-hold-client1-test ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});

async function shots(){
  if(process.env.SKIP_BROWSER === '1')return;
  let puppeteer;
  try { puppeteer = require('puppeteer-core'); }
  catch(e){
    try { puppeteer = require('/tmp/pptr/node_modules/puppeteer-core'); }
    catch(e2){
      console.log('hold-client1 browser skipped (no puppeteer-core)');
      return;
    }
  }
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  if(!fs.existsSync(chrome)){
    console.log('hold-client1 browser skipped (no chrome)');
    return;
  }
  const http = require('http');
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.normalize(path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath));
    if(!file.startsWith(__dirname)){ res.writeHead(403); res.end(); return; }
    fs.readFile(file, function(err, buf){
      if(err){ res.writeHead(404); res.end('missing'); return; }
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){ server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    protocolTimeout: 60000,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const outDir = process.env.HOLD_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(outDir, {recursive: true});
  const testClientAlphaId = '11111111-1111-4111-8111-111111111111';
  const adaId = '22222222-2222-4222-8222-222222222222';
  const hid = '99999999-9999-4999-8999-999999999999';
  try {
    const page = await browser.newPage();
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=hold-client1', {waitUntil: 'domcontentloaded', timeout: 20000});
    const boot = await page.evaluate(function(testClientAlphaId, adaId, hid){
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.getElementById('tab_schedule').classList.add('active');
      currentAdminRole = 'Admin';
      readSbSession = function(){ return {access_token: 'office'}; };
      window.__rpc = [];
      window.__nextWeek = null;
      sbRestRpc = function(name, body){
        window.__rpc.push({name: name, body: body});
        if(name === 'list_schedule_week_slots' || name === 'list_schedule_week'){
          if(window.__nextWeek)return Promise.resolve({ok: true, data: window.__nextWeek});
          return Promise.resolve({ok: false, error: 'skip'});
        }
        return Promise.resolve({ok: true, data: {ok: true, success: true, hold: {hold_id: hid}}});
      };
      function days(start){
        var out = {};
        for(var n = 1; n <= 7; n++){
          out[String(n)] = {on_date: schedAddDays(start, n - 1), weekday: n, slots: []};
        }
        return out;
      }
      var adaDays = days('2026-09-28');
      adaDays['1'].slots = [{slot_key: 'am', label: 'Day', start_local: '08:00:00', end_local: '13:00:00', hours: 5, pattern_hours: 5, usual_aide_id: '', aide_name: 'Sara', sort_order: 0, mark: null}];
      adaDays['2'].slots = adaDays['1'].slots;
      schedApplySlotWeek({
        week_start: '2026-09-28',
        marker: 'hold-client1',
        v: 'hold-client1',
        clients: [
          {client_id: testClientAlphaId, client_name: 'Test Client Alpha', weekly_authorized_hours: 63, client_on_hold: false, hold_banner: null, holds: [], days: days('2026-09-28')},
          {client_id: adaId, client_name: 'Ada Cole', weekly_authorized_hours: 40, client_on_hold: false, days: adaDays}
        ]
      });
      schedSelectSlotDay(testClientAlphaId, '2026-09-28', 1);
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: document.getElementById('tab_schedule').getAttribute('data-hold-client1'),
        put: document.getElementById('schedSlotCards').innerText,
        dashes: document.querySelectorAll('#schedBody .sched-dash').length
      };
    }, testClientAlphaId, adaId, hid);
    assert.strictEqual(boot.build, '2026-09-27-remi-float-hide1b');
    assert.strictEqual(boot.marker, 'v=hold-client1');
    assert.ok(boot.put.indexOf('Put on hold') >= 0, boot.put);
    assert.ok(boot.put.indexOf('Save hold') >= 0, boot.put);
    assert.ok(boot.dashes >= 7, 'empty week paints dashes');
    await page.evaluate(function(){
      document.getElementById('schedSlotDetail').scrollIntoView({block: 'start'});
    });
    await page.screenshot({path: path.join(outDir, 'hold-client1-01-put-phone.png')});

    const saved = await page.evaluate(function(testClientAlphaId, hid){
      window.__rpc = [];
      window.__nextWeek = {
        week_start: '2026-09-28',
        marker: 'hold-client1',
        v: 'hold-client1',
        clients: [
          {
            client_id: testClientAlphaId,
            client_name: 'Test Client Alpha',
            weekly_authorized_hours: 63,
            client_on_hold: true,
            hold_banner: {
              hold_id: hid,
              note: 'hospital',
              start_date: '2026-09-28',
              end_date: '2026-10-05',
              start_label: '09/28',
              end_label: '10/05',
              open_ended: false,
              label: 'hospital · 09/28 – 10/05'
            },
            holds: [{hold_id: hid, start_date: '2026-09-28', end_date: '2026-10-05', note: 'hospital', open_ended: false}],
            days: (function(){
              var out = {};
              for(var n = 1; n <= 7; n++)out[String(n)] = {on_date: schedAddDays('2026-09-28', n - 1), weekday: n, slots: []};
              return out;
            })()
          }
        ]
      };
      var note = document.getElementById('schedClientHoldNote');
      if(note)note.value = 'hospital / ER';
      var btn = document.querySelector('#schedSlotCards [data-client-hold="save"]');
      if(btn)btn.click();
      return new Promise(function(resolve){
        setTimeout(function(){
          resolve({
            rpc: window.__rpc.map(function(c){ return {name: c.name, body: c.body}; }),
            banner: document.querySelector('.row-hold-banner') ? document.querySelector('.row-hold-banner').innerText : ''
          });
        }, 80);
      });
    }, testClientAlphaId, hid);
    const upsert = saved.rpc.filter(function(c){ return c.name === 'upsert_schedule_client_hold'; });
    assert.strictEqual(upsert.length, 1, 'browser save posts the client hold');
    assert.strictEqual(upsert[0].body.p_note, 'hospital / ER');
    assert.ok(!saved.rpc.some(function(c){ return c.name === 'upsert_schedule_slot_pattern' || c.name === 'upsert_schedule_slot_day_mark'; }), 'browser save does not invent a shift');
    await page.evaluate(function(){ schedSetFilter('hold'); });
    const filtered = await page.evaluate(function(){
      return {
        text: document.getElementById('schedBody').innerText,
        pressed: document.getElementById('schedFilterHold').getAttribute('aria-pressed')
      };
    });
    assert.strictEqual(filtered.pressed, 'true');
    assert.ok(filtered.text.indexOf('Test Client Alpha') >= 0, filtered.text);
    assert.ok(filtered.text.indexOf('hospital · 09/28 – 10/05') >= 0, filtered.text);
    await page.screenshot({path: path.join(outDir, 'hold-client1-02-filter-phone.png')});

    const ended = await page.evaluate(function(testClientAlphaId){
      window.__rpc = [];
      window.__nextWeek = {
        week_start: '2026-09-28',
        marker: 'hold-client1',
        v: 'hold-client1',
        clients: [{
          client_id: testClientAlphaId,
          client_name: 'Test Client Alpha',
          weekly_authorized_hours: 63,
          client_on_hold: false,
          hold_banner: null,
          holds: [],
          days: (function(){
            var out = {};
            for(var n = 1; n <= 7; n++)out[String(n)] = {on_date: schedAddDays('2026-09-28', n - 1), weekday: n, slots: []};
            return out;
          })()
        }]
      };
      var endBtn = document.querySelector('#schedSlotCards [data-client-hold="end"]');
      if(endBtn)endBtn.click();
      var end = document.getElementById('schedClientHoldEnd');
      if(end)end.value = '10/01/2026';
      var go = document.querySelector('#schedSlotCards [data-client-hold="confirm-end"]');
      if(go)go.click();
      return new Promise(function(resolve){
        setTimeout(function(){
          var clear = window.__rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; });
          resolve({
            keys: clear.length ? Object.keys(clear[0].body) : [],
            end: clear.length ? clear[0].body.p_end_date : '',
            panel: document.getElementById('schedSlotCards').innerText
          });
        }, 80);
      });
    }, testClientAlphaId);
    assert.ok(ended.keys.indexOf('p_hold_id') >= 0, 'end sends hold id');
    assert.ok(ended.keys.indexOf('p_end_date') >= 0, 'end sends end date');
    assert.strictEqual(ended.end, '2026-10-01');
    assert.ok(ended.panel.indexOf('Hold ended') >= 0 || ended.panel.indexOf('Ended') >= 0, ended.panel);
    await page.evaluate(function(){ schedSetFilter('all'); });
    await page.screenshot({path: path.join(outDir, 'hold-client1-03-end-phone.png')});

    const desk = await browser.newPage();
    await desk.setViewport({width: 1280, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1});
    await desk.goto('http://127.0.0.1:' + port + '/index.html?v=hold-client1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await desk.evaluate(function(testClientAlphaId, hid){
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.getElementById('tab_schedule').classList.add('active');
      currentAdminRole = 'Admin';
      function days(start){
        var out = {};
        for(var n = 1; n <= 7; n++)out[String(n)] = {on_date: schedAddDays(start, n - 1), weekday: n, slots: []};
        return out;
      }
      schedApplySlotWeek({
        week_start: '2026-09-28',
        marker: 'hold-client1',
        v: 'hold-client1',
        clients: [{
          client_id: testClientAlphaId,
          client_name: 'Test Client Alpha',
          weekly_authorized_hours: 63,
          client_on_hold: true,
          hold_banner: {hold_id: hid, note: 'hospital', start_date: '2026-09-28', end_date: '2026-10-05', start_label: '09/28', end_label: '10/05', open_ended: false, label: 'hospital · 09/28 – 10/05'},
          holds: [],
          days: days('2026-09-28')
        }]
      });
      schedSetFilter('hold');
    }, testClientAlphaId, hid);
    await desk.screenshot({path: path.join(outDir, 'hold-client1-02-filter-desktop.png'), fullPage: true});
    console.log('hold-client1 phone and desktop screenshots ok');
  } finally {
    await browser.close();
    server.close();
  }
}
