#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=hold-clear1'), 'hold-clear1 marker');
assert.ok(html.includes('data-hold-clear1="v=hold-clear1"') || html.includes("data-hold-clear1=\"'+HOLD_CLEAR1_MARKER+'\""), 'hold-clear1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-hold-clear1'), 'hold-clear1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-hold-clear1">'), 'hold-clear1 meta');
assert.ok(html.includes('<!-- schedule hold clear 2026-09-27 v=hold-clear1 admin-build 2026-09-27-hold-clear1'), 'hold-clear1 comment');
assert.ok(html.includes("var HOLD_CLEAR1_MARKER='v=hold-clear1'"), 'script marker');
assert.ok(html.includes('GHOST-HOLD-CLEAR1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('Patch none'), 'no SQL patch in the tip');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/hold-clear1-v1.sql')), 'no hold-clear1 SQL file');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-aide-notif-search1'), 'first admin-build is aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-hold-client1"') < html.indexOf('content="2026-09-27-aides-info1"'), 'aides-info1 stays after hold-client1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after aide-office-vis1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after this tip');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
assert.ok(html.indexOf('content="2026-09-27-tabbar-8"') < html.indexOf('content="2026-09-27-cover-card-cancel1"'), 'cover-card-cancel1 stays after tabbar-8');
['2026-09-27-remi-langs1','2026-09-27-sched-time-tap1','2026-09-27-aide-text-chat1','2026-09-27-remi-float-hide1','2026-09-27-tabbar-8','2026-09-27-cover-card-cancel1','2026-09-27-nosvc-reason-draft1','2026-09-27-cover-unselect1','2026-09-27-clienthrs1c','2026-09-27-shift-slim1','2026-09-26-clienthrs1b','2026-09-25-aidechat1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="' + meta + '">'), 'prior meta stays ' + meta);
});
['v=remi-langs1','v=sched-time-tap1','v=aide-text-chat1','v=remi-float-hide1','v=tabbar-8','v=cover-card-cancel1','v=clienthrs1c','v=shift-slim1','v=remi-payroll1','v=coverage-simple1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes("sbRestRpc('clear_schedule_client_hold'"), 'reuses the client hold RPC');
assert.ok(html.includes("sbRestRpc('clear_schedule_slot_day_mark'"), 'reuses the day mark RPC');
assert.ok(html.includes('function schedClearHold'), 'Clear has a hold path');
assert.ok(html.includes('schedClearIsHold(clientId, onDate, key))schedClearHold'), 'On hold Clear routes to the hold path');
assert.ok(html.includes('else schedClearSlotMark(clientId, onDate, key)'), 'Missed and cover Clear stay on the day mark');

const schedStart = html.indexOf('// admin schedule v=sched1');
const schedEnd = html.indexOf('// end admin schedule v=sched1');
const slotStart = html.indexOf('// schedule multi-slot v=clienthrs1b');
const slotEnd = html.indexOf('// end schedule multi-slot v=clienthrs1b');
const schedSrc = html.slice(schedStart, schedEnd);
const slotSrc = html.slice(slotStart, slotEnd);
const clearFn = slotSrc.slice(slotSrc.indexOf('async function schedClearHold'), slotSrc.indexOf('async function schedClearSlotMark'));
assert.ok(clearFn.includes("sbRestRpc('clear_schedule_client_hold',{p_hold_id:String(holdId)})"), 'Clear omits p_end_date');
assert.ok(!clearFn.includes('p_end_date'), 'the Clear function does not send an end date');
const endFn = slotSrc.slice(slotSrc.indexOf('async function schedWriteHold'), slotSrc.indexOf('async function schedSaveCover'));
assert.ok(endFn.includes('p_end_date:end||schedDateOnly(onDate)'), 'End hold still sends p_end_date');
assert.ok(!endFn.includes('clear_schedule_slot_day_mark'), 'End hold does not clear day marks');

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
['schedWeekLabel','schedSourceNote','schedNoClients','schedEmpty','schedEmptyAdd','schedScroll','schedHead','schedBody','schedPanel','schedSlotDetail','schedSlotClientName','schedSlotAuth','schedSlotWhen','schedSlotWeekStat','schedSlotDaySum','schedSlotCards','schedSlotPattern','schedSlotPatternTitle','schedSlotClient','schedSlotWeekday','schedSlotKey','schedSlotLabel','schedSlotStart','schedSlotEnd','schedSlotAide','schedSlotHours','schedSlotHoursView','schedSlotHoursNote','schedSlotSort','schedSlotDaysHint','schedSlotShiftSummary','schedSlotModeEdit','schedSlotModeAdd','schedSlotRemovePattern','schedIntro','schedAddUsualBtn','schedFilterCalloff','schedFilterHold','schedFilterAll','schedFilterOpen','schedLegend','schedSearch','tab_schedule','schedViewWeek','schedViewDay','schedHoldStart-am','schedHoldEnd-am','schedHoldNote-am','schedHoldStart-pm','schedHoldEnd-pm','schedHoldNote-pm'].forEach(makeEl);

const ada = '11111111-1111-4111-8111-111111111111';
const moe = '44444444-4444-4444-8444-444444444444';
const holdId = '99999999-9999-4999-8999-999999999999';
let clearedWeek = null;

const sandbox = {
  allClients: [],
  loadedAidesList: [],
  allAidesForAssign: [],
  currentAdminRole: 'Scheduler',
  currentAdminUsername: 'Jaz',
  location: {search: '', hash: ''},
  document: {getElementById: function(id){ return els[id] || null; }},
  showTempMsg: function(msg){ toasts.push(String(msg)); },
  logActivity: function(){},
  showTab: function(){},
  sbUuid: function(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || '')); },
  evercareSbEnabled: function(){ return true; },
  readSbSession: function(){ return {access_token: 'office', username: 'Jaz', role: 'Scheduler'}; },
  sbRestRpc: function(name, body){
    rpc.push({name: name, body: body});
    if(name === 'list_schedule_week_slots' || name === 'list_schedule_week'){
      if(clearedWeek)return Promise.resolve({ok: true, data: clearedWeek});
      return Promise.resolve({ok: false, error: 'skip reload'});
    }
    if(name === 'clear_schedule_client_hold' && body && body.fail){
      return Promise.resolve({ok: false, error: 'Hold is still active.'});
    }
    if(name === 'list_schedule_client_holds'){
      return Promise.resolve({ok: true, data: {holds: []}});
    }
    return Promise.resolve({ok: true, data: {}});
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
assert.strictEqual(sandbox.HOLD_CLEAR1_MARKER, 'v=hold-clear1');

function slot(on, key, mark, hours){
  return {
    slot_key: key,
    label: key === 'pm' ? 'Evening' : 'Morning',
    start_local: key === 'pm' ? '17:00:00' : '08:00:00',
    end_local: key === 'pm' ? '21:00:00' : '17:00:00',
    hours: mark === 'on_hold' ? 0 : hours,
    pattern_hours: hours,
    usual_aide_id: moe,
    aide_name: 'moe',
    sort_order: key === 'pm' ? 1 : 0,
    mark: mark || null,
    note: mark === 'on_hold' ? 'ER' : (mark === 'missed' ? 'No-show' : null),
    deep_link: {client_id: ada, on_date: on, slot_key: key}
  };
}
function heldPayload(){
  const days = {};
  for(let n = 1; n <= 7; n++){
    const on = sandbox.schedAddDays('2026-09-07', n - 1);
    let slots = [];
    if(n === 1)slots = [slot(on, 'am', null, 9)];
    if(n === 3)slots = [slot(on, 'am', 'missed', 9)];
    if(n === 4)slots = [slot(on, 'am', 'on_hold', 9), slot(on, 'pm', 'on_hold', 4)];
    if(n === 5)slots = [slot(on, 'am', null, 9)];
    days[String(n)] = {on_date: on, weekday: n, slots: slots};
  }
  return {
    week_start: '2026-09-07',
    clients: [{
      client_id: ada,
      client_name: 'Bowlax',
      weekly_authorized_hours: 40,
      holds: [{hold_id: holdId, start_date: '2026-09-10', end_date: '', note: 'ER', open_ended: true, is_active: true}],
      days: days
    }]
  };
}
function clearedPayload(){
  const days = {};
  for(let n = 1; n <= 7; n++){
    const on = sandbox.schedAddDays('2026-09-07', n - 1);
    let slots = [];
    if(n === 1)slots = [slot(on, 'am', null, 9)];
    if(n === 3)slots = [slot(on, 'am', 'missed', 9)];
    if(n === 4)slots = [slot(on, 'am', null, 9), slot(on, 'pm', null, 4)];
    if(n === 5)slots = [slot(on, 'am', null, 9)];
    days[String(n)] = {on_date: on, weekday: n, slots: slots};
  }
  return {
    week_start: '2026-09-07',
    clients: [{
      client_id: ada,
      client_name: 'Bowlax',
      weekly_authorized_hours: 40,
      holds: [],
      days: days
    }]
  };
}

(async function main(){
  sandbox.schedApplySlotWeek(heldPayload());
  sandbox.schedSelectSlotDay(ada, '2026-09-10', 4, 'am');
  const before = els.schedSlotCards.innerHTML;
  assert.ok(before.includes('data-slot-action="save-hold"'), 'Save hold stays');
  assert.ok(before.includes('End hold'), 'End hold stays');
  assert.ok(before.indexOf('save-hold') < before.indexOf('end-hold'), 'End hold sits with Save hold');
  assert.ok(before.indexOf('end-hold') < before.indexOf('data-slot-action="clear"'), 'Clear sits under Save hold / End hold');
  assert.ok(before.includes('data-hold-clear1="v=hold-clear1"'), 'hold Clear carries the marker');
  assert.ok(before.includes('is-on-hold'), 'On hold is selected');
  assert.ok(before.includes('mark-follow is-hold'), 'follow panel is open');
  assert.ok(before.includes('09/10/2026'), 'start date is MM/DD/YYYY');
  assert.ok(els.schedBody.innerHTML.includes('paused · 0 hrs'), 'week chip is on hold');
  assert.strictEqual(sandbox.schedClearIsHold(ada, '2026-09-09', 'am'), false, 'a missed day is not a hold clear');

  els['schedHoldStart-am'].value = '09/07/2026';
  els['schedHoldEnd-am'].value = '09/08/2026';
  els['schedHoldNote-am'].value = 'draft only';
  sandbox.schedSlotMarkOpen = 'hold:am';
  sandbox.schedSelectSlotDay(ada, '2026-09-07', 1, 'am');
  assert.ok(els.schedSlotCards.innerHTML.includes('data-hold-clear1'), 'draft On hold still shows Clear');
  rpc.length = 0;
  toasts.length = 0;
  await sandbox.schedClearHold(ada, '2026-09-07', 'am');
  assert.strictEqual(rpc.length, 0, 'a never-saved draft does not call Ace');
  assert.strictEqual(els['schedHoldStart-am'].value, '', 'draft Start clears');
  assert.strictEqual(els['schedHoldEnd-am'].value, '', 'draft End clears');
  assert.strictEqual(els['schedHoldNote-am'].value, '', 'draft Note clears');
  assert.strictEqual(sandbox.schedSlotMarkOpen, '', 'On hold unselects');
  assert.ok(!els.schedSlotCards.innerHTML.includes('mark-follow is-hold'), 'draft follow panel hides');
  assert.ok(!els.schedSlotCards.innerHTML.includes('is-on-hold'), 'draft On hold button unselects');
  assert.ok(toasts.indexOf('Hold cleared.') >= 0, 'draft clear is visible');
  const thu = sandbox.schedFindSlotClient(ada).days['4'];
  assert.strictEqual(thu.slots[0].mark, 'on_hold', 'draft clear leaves the saved Thursday mark');
  assert.ok(sandbox.schedSlotIsHold(thu.slots[0]), 'draft clear leaves the saved hold');

  els['schedHoldStart-am'].value = '09/10/2026';
  els['schedHoldEnd-am'].value = '';
  els['schedHoldNote-am'].value = 'ER';
  sandbox.schedSelectSlotDay(ada, '2026-09-10', 4, 'am');
  rpc.length = 0;
  clearedWeek = clearedPayload();
  await sandbox.schedClearHold(ada, '2026-09-10', 'am');
  const soft = rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; });
  const marks = rpc.filter(function(c){ return c.name === 'clear_schedule_slot_day_mark'; });
  assert.strictEqual(soft.length, 1, 'Clear posts one client hold clear');
  assert.strictEqual(soft[0].body.p_hold_id, holdId);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(soft[0].body, 'p_end_date'), false, 'Clear does not send p_end_date');
  assert.strictEqual(marks.length, 2, 'each on_hold slot on the hold is cleared');
  assert.deepStrictEqual(marks.map(function(c){ return c.body.p_on_date + ' ' + c.body.p_slot_key; }), ['2026-09-10 am', '2026-09-10 pm']);
  assert.ok(!marks.some(function(c){ return c.body.p_on_date === '2026-09-09'; }), 'missed day is not a hold mark');
  assert.ok(!marks.some(function(c){ return c.body.p_on_date === '2026-09-11'; }), 'a painted day without p_mark on_hold is not a day-mark clear');
  const afterClient = sandbox.schedFindSlotClient(ada);
  assert.ok(!afterClient.holds.length, 'cleared hold leaves the week');
  assert.strictEqual(afterClient.days['4'].slots[0].mark, '', 'Thursday morning mark is gone');
  assert.strictEqual(afterClient.days['4'].slots[1].mark, '', 'Thursday evening mark is gone');
  assert.strictEqual(sandbox.schedSlotIsHold(afterClient.days['4'].slots[0]), false, 'Thursday morning is not on hold');
  assert.strictEqual(sandbox.schedSlotIsHold(afterClient.days['5'].slots[0]), false, 'Friday hold chip is gone');
  assert.strictEqual(afterClient.days['3'].slots[0].mark, 'missed', 'missed mark stays');
  assert.ok(els.schedBody.innerHTML.includes('paused · 0 hrs') === false, 'week chips no longer say on hold');
  assert.ok(!els.schedSlotCards.innerHTML.includes('mark-follow is-hold'), 'follow panel hides after Clear');
  assert.ok(!els.schedSlotCards.innerHTML.includes('is-on-hold'), 'On hold unselects after Clear');
  assert.ok(els.schedSlotCards.innerHTML.includes('>9 hrs<') || els.schedSlotDaySum.textContent.indexOf('9') >= 0, 'hours resume');
  assert.strictEqual(sandbox.schedSlotMarkOpen, '');

  clearedWeek = null;
  sandbox.schedApplySlotWeek(heldPayload());
  sandbox.schedSelectSlotDay(ada, '2026-09-10', 4, 'am');
  sandbox.schedSlotMarkOpen = 'hold:am';
  els['schedHoldNote-am'].value = 'ER';
  const origRpc = sandbox.sbRestRpc;
  sandbox.sbRestRpc = function(name, body){
    if(name === 'clear_schedule_client_hold')return Promise.resolve({ok: false, error: 'Hold is still active.'});
    return origRpc(name, body);
  };
  rpc.length = 0;
  await sandbox.schedClearHold(ada, '2026-09-10', 'am');
  assert.strictEqual(rpc.filter(function(c){ return c.name === 'clear_schedule_slot_day_mark'; }).length, 0, 'a failed hold clear does not drop day marks');
  assert.strictEqual(sandbox.schedSlotMarkOpen, 'hold:am', 'failed Clear leaves On hold selected');
  assert.strictEqual(els['schedHoldNote-am'].value, 'ER', 'failed Clear leaves the note');
  sandbox.sbRestRpc = origRpc;

  sandbox.schedApplySlotWeek(heldPayload());
  els['schedHoldEnd-am'].value = '';
  rpc.length = 0;
  await sandbox.schedWriteHold(ada, '2026-09-10', 'am', true);
  const ended = rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; });
  assert.strictEqual(ended.length, 1, 'End hold still clears once');
  assert.strictEqual(ended[0].body.p_hold_id, holdId);
  assert.strictEqual(ended[0].body.p_end_date, '2026-09-10', 'End hold still sends p_end_date');
  assert.strictEqual(rpc.filter(function(c){ return c.name === 'clear_schedule_slot_day_mark'; }).length, 0, 'End hold does not clear day marks');

  sandbox.currentAdminRole = 'Scheduler';
  rpc.length = 0;
  await sandbox.schedClearSlotMark(ada, '2026-09-09', 'am');
  const missedClear = rpc.filter(function(c){ return c.name === 'clear_schedule_slot_day_mark'; });
  assert.strictEqual(missedClear.length, 1, 'missed Clear still uses the day mark RPC');
  assert.strictEqual(missedClear[0].body.p_slot_key, 'am');
  assert.strictEqual(rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; }).length, 0, 'missed Clear does not end a client hold');

  sandbox.schedApplySlotWeek(heldPayload());
  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  await sandbox.schedClearHold(ada, '2026-09-10', 'am');
  assert.strictEqual(rpc.length, 0, 'Nurse cannot clear a hold');
  sandbox.currentAdminRole = 'Scheduler';

  await shots();
  console.log('admin-hold-clear1-test ok');
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
      console.log('hold-clear1 browser skipped (no puppeteer-core)');
      return;
    }
  }
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const http = require('http');
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const file = path.normalize(path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath));
    if(!file.startsWith(__dirname)){ res.writeHead(403); res.end(); return; }
    fs.readFile(file, function(err, buf){
      if(err){ res.writeHead(404); res.end('missing'); return; }
      const ext = path.extname(file);
      const type = ext === '.png' ? 'image/png' : 'text/html; charset=utf-8';
      res.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-store'});
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
  const held = heldPayload();
  const cleared = clearedPayload();
  try {
    const phone = await browser.newPage();
    await phone.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await phone.goto('http://127.0.0.1:' + port + '/index.html?v=hold-clear1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await phone.evaluate(function(heldWeek, clearedWeek, adaId, moeId){
      window.__holdCalls = [];
      window.__holdCleared = false;
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'Jaz';
      readSbSession = function(){ return {access_token: 'office', username: 'Jaz', role: 'Scheduler'}; };
      sbRestRpc = async function(name, body){
        window.__holdCalls.push({name: name, body: body});
        if(name === 'clear_schedule_client_hold' || name === 'clear_schedule_slot_day_mark'){
          window.__holdCleared = true;
          return {ok: true, data: {}};
        }
        if(name === 'list_schedule_week_slots' || name === 'list_schedule_week'){
          return {ok: true, data: window.__holdCleared ? clearedWeek : heldWeek};
        }
        if(name === 'list_schedule_client_holds'){
          return {ok: true, data: {holds: window.__holdCleared ? [] : heldWeek.clients[0].holds}};
        }
        return {ok: true, data: {}};
      };
      loadedAidesList = [{id: moeId, username: 'moe', name: 'moe', is_active: true}];
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.getElementById('tab_schedule').classList.add('active');
      var sheet = document.getElementById('copilotSheet');
      if(sheet)sheet.hidden = true;
      schedApplySlotWeek(heldWeek);
      schedSelectSlotDay(adaId, '2026-09-07', 1, 'am');
    }, held, cleared, ada, moe);

    await phone.evaluate(function(adaId){
      var btn = document.querySelector('#sched-slot-' + adaId + '-am [data-slot-action="hold"]');
      btn.scrollIntoView({block: 'center'});
      btn.click();
    }, ada);
    await phone.waitForFunction(function(){
      return window.__holdCalls.some(function(c){ return c.name === 'list_schedule_client_holds'; }) && document.getElementById('schedHoldNote-am');
    });
    await phone.type('#schedHoldNote-am', 'draft only');
    const callsBeforeDraft = await phone.evaluate(function(){ return window.__holdCalls.length; });
    await phone.evaluate(function(){
      var btn = document.querySelector('[data-hold-clear1][data-slot-action="clear"]');
      btn.scrollIntoView({block: 'center'});
      btn.click();
    });
    await phone.waitForFunction(function(){
      return !document.querySelector('.mark-follow.is-hold') && !document.querySelector('[data-slot-action="hold"].is-on-hold');
    });
    const draft = await phone.evaluate(function(before){
      var added = window.__holdCalls.slice(before);
      return {
        added: added.map(function(c){ return c.name; }),
        follow: !!document.querySelector('.mark-follow.is-hold'),
        selected: !!document.querySelector('[data-slot-action="hold"].is-on-hold'),
        note: !!document.getElementById('schedHoldNote-am')
      };
    }, callsBeforeDraft);
    assert.deepStrictEqual(draft.added, [], 'draft Clear stays local');
    assert.strictEqual(draft.follow, false, 'draft panel hides on the phone');
    assert.strictEqual(draft.selected, false, 'draft On hold unselects on the phone');
    assert.strictEqual(draft.note, false, 'draft fields unmount');

    await phone.evaluate(function(adaId){
      schedSelectSlotDay(adaId, '2026-09-10', 4, 'am');
    }, ada);
    await phone.waitForSelector('.mark-follow.is-hold');
    const selected = await phone.evaluate(function(){
      var card = document.querySelector('.sched-slot-card.is-hold');
      var holdBtn = card ? card.querySelector('[data-slot-action="hold"]') : null;
      var clearBtn = card ? card.querySelector('[data-hold-clear1][data-slot-action="clear"]') : null;
      var chip = document.querySelector('#schedScroll .sched-chip.is-hold');
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        role: currentAdminRole,
        who: currentAdminUsername,
        selected: !!(holdBtn && holdBtn.classList.contains('is-on-hold')),
        start: document.getElementById('schedHoldStart-am').value,
        end: document.getElementById('schedHoldEnd-am').value,
        note: document.getElementById('schedHoldNote-am').value,
        clear: clearBtn ? clearBtn.textContent.trim() : '',
        save: card ? card.textContent.indexOf('Save hold') : -1,
        endBtn: card ? card.textContent.indexOf('End hold') : -1,
        chip: chip ? chip.innerText.replace(/\s+/g, ' ').trim() : '',
        hrs: card ? card.querySelector('.sched-hrs-pill').textContent.trim() : '',
        when: document.getElementById('schedSlotWhen').textContent,
        sheet: document.getElementById('copilotSheet').hidden
      };
    });
    assert.strictEqual(selected.build, '2026-09-27-aide-notif-search1');
    assert.strictEqual(selected.role, 'Scheduler');
    assert.strictEqual(selected.who, 'Jaz');
    assert.strictEqual(selected.selected, true);
    assert.strictEqual(selected.start, '09/10/2026');
    assert.strictEqual(selected.end, '');
    assert.strictEqual(selected.note, 'ER');
    assert.strictEqual(selected.clear, 'Clear');
    assert.ok(selected.save >= 0 && selected.endBtn > selected.save, 'Clear row follows Save hold and End hold');
    assert.ok(selected.chip.indexOf('On hold') >= 0, selected.chip);
    assert.ok(selected.chip.indexOf('0 hrs') >= 0, selected.chip);
    assert.strictEqual(selected.hrs, '0 hrs');
    assert.ok(selected.when.indexOf('09/10/2026') >= 0, selected.when);
    assert.strictEqual(selected.sheet, true, 'Remi sheet stays closed');
    await phone.evaluate(function(){
      document.querySelector('.mark-follow.is-hold').scrollIntoView({block: 'center'});
    });
    await phone.screenshot({path: path.join(outDir, 'hold-clear1-01-on-hold-selected.png')});

    const beforeClear = await phone.evaluate(function(){ return window.__holdCalls.length; });
    await phone.evaluate(function(){
      var btn = document.querySelector('.sched-slot-card.is-hold [data-hold-clear1][data-slot-action="clear"]');
      btn.scrollIntoView({block: 'center'});
      btn.click();
    });
    await phone.waitForFunction(function(){
      return !document.querySelector('.mark-follow.is-hold') && !document.querySelector('#schedScroll .sched-chip.is-hold');
    });
    const after = await phone.evaluate(function(before){
      var added = window.__holdCalls.slice(before);
      return {
        names: added.map(function(c){ return c.name; }),
        bodies: added.map(function(c){ return c.body; }),
        follow: !!document.querySelector('.mark-follow.is-hold'),
        selected: !!document.querySelector('[data-slot-action="hold"].is-on-hold'),
        chips: document.querySelectorAll('#schedScroll .sched-chip.is-hold').length,
        sum: document.getElementById('schedSlotDaySum').textContent,
        assumed: document.querySelector('.sched-mark.is-assumed') ? document.querySelector('.sched-mark.is-assumed').textContent.trim() : ''
      };
    }, beforeClear);
    assert.deepStrictEqual(after.names, ['clear_schedule_client_hold', 'clear_schedule_slot_day_mark', 'clear_schedule_slot_day_mark', 'list_schedule_week_slots']);
    assert.strictEqual(after.bodies[0].p_hold_id, holdId);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(after.bodies[0], 'p_end_date'), false);
    assert.strictEqual(after.bodies[1].p_slot_key, 'am');
    assert.strictEqual(after.bodies[1].p_on_date, '2026-09-10');
    assert.strictEqual(after.bodies[2].p_slot_key, 'pm');
    assert.strictEqual(after.follow, false);
    assert.strictEqual(after.selected, false);
    assert.strictEqual(after.chips, 0);
    assert.ok(after.sum.indexOf('9') >= 0, after.sum);
    assert.strictEqual(after.assumed, 'Assumed worked');
    await phone.evaluate(function(){
      var card = document.querySelector('.sched-slot-card');
      if(card)card.scrollIntoView({block: 'center'});
    });
    await phone.screenshot({path: path.join(outDir, 'hold-clear1-02-after-clear.png')});
    console.log('hold-clear1 phone before/after ok');
  } finally {
    await browser.close();
    server.close();
  }
}
