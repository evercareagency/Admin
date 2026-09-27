#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=shift-slim1'), 'shift-slim1 marker');
assert.ok(html.includes('data-shift-slim1="v=shift-slim1"'), 'shift-slim1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-clienthrs1c'), 'clienthrs1c build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-clienthrs1c">'), 'clienthrs1c meta');
assert.ok(html.includes('<!-- schedule client hours 2026-09-27 v=clienthrs1c v=shift-slim1 admin-build 2026-09-27-clienthrs1c'), 'clienthrs1c comment keeps the UX pack name');
assert.ok(html.includes('admin-build 2026-09-27-shift-slim1'), 'shift-slim1 build note stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-shift-slim1">'), 'shift-slim1 meta stays');
assert.ok(html.includes('<!-- schedule slim edit 2026-09-27 v=shift-slim1 admin-build 2026-09-27-shift-slim1'), 'shift-slim1 comment');
assert.ok(html.includes("var CLIENTHRS1C_MARKER='v=clienthrs1c'"), 'clienthrs1c script marker');
assert.ok(html.includes("var SHIFT_SLIM1_MARKER='v=shift-slim1'"), 'shift-slim1 script marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-clienthrs1c'), 'first admin-build is clienthrs1c');
['2026-09-27-shift-slim1','2026-09-26-isdash1b','2026-09-26-isdash1','2026-09-26-remi-notes1','2026-09-26-clienthrs1b','2026-09-26-clienthrs1a'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="'+meta+'">'), 'prior meta stays '+meta);
});
assert.ok(html.indexOf('content="2026-09-27-clienthrs1c"') < html.indexOf('content="2026-09-27-shift-slim1"'), 'shift-slim1 stays below clienthrs1c');
assert.ok(html.indexOf('content="2026-09-27-shift-slim1"') < html.indexOf('content="2026-09-26-isdash1b"'), 'isdash1b stays below shift-slim1');
assert.ok(html.includes('No full-page Remi'), 'no full-page Remi');
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page tab');
assert.ok(!html.includes('TODO(Ace shift-slim1 hospital hold)'), 'hospital hold TODO is replaced by the live callable');
assert.ok(html.includes("sbRestRpc('upsert_schedule_slot_pattern_weekdays'"), 'multi-day save uses the weekdays callable');
assert.ok(html.includes("sbRestRpc('upsert_schedule_client_hold'"), 'client hold callable');
assert.ok(html.includes("sbRestRpc('clear_schedule_client_hold'"), 'end hold callable');
assert.ok(html.includes("sbRestRpc('list_schedule_client_holds'"), 'list holds callable');
assert.ok(html.includes('p_miss_reason'), 'missed reason arg');

const form = html.slice(html.indexOf('id="schedSlotModeEdit"'), html.indexOf('class="sched-slim-keep"'));
assert.ok(!form.includes('Slot key'), 'slot key is not on the slim form');
assert.ok(!form.includes('for="schedSlotLabel"'), 'label is not on the slim form');
assert.ok(!/>\s*Order\s*</.test(form), 'order is not on the slim form');
assert.ok(form.includes('Days this week'), 'weekday checks label');
assert.ok(form.includes('aria-label="Sunday"') && form.includes('aria-label="Saturday"'), 'Su–Sa checks');
assert.ok(form.includes('>Edit shift<') && form.includes('>Add another<'), 'form pills');
assert.ok(form.includes('id="schedSlotHoursView"') && form.includes('readonly'), 'hours are read-only');
assert.ok(form.includes('id="schedSlotHoursNote"'), 'from start–end note');
assert.ok(html.includes('On hold (paused · 0 hrs)'), 'hold legend');
assert.ok(html.includes('#tab_schedule.is-fullweek .sched-layout{flex-direction:column'), 'desktop drawer does not sit beside the grid');

const schedStart = html.indexOf('// admin schedule v=sched1');
const schedEnd = html.indexOf('// end admin schedule v=sched1');
const slotStart = html.indexOf('// schedule multi-slot v=clienthrs1b');
const slotEnd = html.indexOf('// end schedule multi-slot v=clienthrs1b');
const schedSrc = html.slice(schedStart, schedEnd);
const slotSrc = html.slice(slotStart, slotEnd);
assert.ok(!/localStorage/.test(slotSrc), 'slot schedule does not use localStorage');
assert.ok(slotSrc.includes("mark==='worked'") && slotSrc.includes("mark==='missed'") && slotSrc.includes("mark==='cover'"), 'live mark values stay');

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
['schedWeekLabel','schedSourceNote','schedNoClients','schedEmpty','schedEmptyAdd','schedScroll','schedHead','schedBody','schedPanel','schedSlotDetail','schedSlotClientName','schedSlotAuth','schedSlotWhen','schedSlotWeekStat','schedSlotDaySum','schedSlotCards','schedSlotPattern','schedSlotPatternTitle','schedSlotClient','schedSlotWeekday','schedSlotKey','schedSlotLabel','schedSlotStart','schedSlotEnd','schedSlotAide','schedSlotHours','schedSlotHoursView','schedSlotHoursNote','schedSlotSort','schedSlotDaysHint','schedSlotShiftSummary','schedSlotModeEdit','schedSlotModeAdd','schedSlotRemovePattern','schedIntro','schedAddUsualBtn','schedFilterCalloff','schedFilterHold','schedFilterAll','schedFilterOpen','schedLegend','schedSearch','tab_schedule','schedViewWeek','schedViewDay'].forEach(makeEl);

const pressed = {};
const dayBtns = [7,1,2,3,4,5,6].map(function(wd){
  return {
    wd: wd,
    getAttribute: function(k){
      if(k==='data-wd')return String(wd);
      if(k==='aria-pressed')return pressed[wd]?'true':'false';
      return '';
    },
    setAttribute: function(k, v){ if(k==='aria-pressed')pressed[wd]=v==='true'; },
    classList: {add: function(){}, remove: function(){}}
  };
});
els.schedSlotDays = {
  id: 'schedSlotDays',
  dataset: {},
  querySelectorAll: function(){ return dayBtns; },
  addEventListener: function(){}
};

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
    return Promise.resolve({ok: true, data: {clients: [], deep_link: body || {}}});
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

assert.strictEqual(sandbox.CLIENTHRS1C_MARKER, 'v=clienthrs1c');
assert.strictEqual(sandbox.SHIFT_SLIM1_MARKER, 'v=shift-slim1');
assert.strictEqual(sandbox.schedHoursBetween('08:00:00', '17:00:00'), 9);
assert.strictEqual(sandbox.schedHoursBetween('17:00', '21:00'), 4);
assert.strictEqual(sandbox.schedHoursBetween('08:00', '13:00'), 5);
assert.strictEqual(sandbox.schedParseUsDate('09/10/2026'), '2026-09-10');
assert.strictEqual(sandbox.schedPretty('2026-09-10'), '09/10/2026');
const holdNote = sandbox.schedFormatHoldNote('2026-09-10', '', 'ER');
assert.strictEqual(sandbox.schedSlotIsHold({note: holdNote}), true);
assert.strictEqual(sandbox.schedSlotToward({hours: 9, pattern_hours: 9, mark: 'missed', note: holdNote}), 0);
const noShow = sandbox.schedMissedParts('No-show');
assert.strictEqual(noShow.reason, 'No-show');
assert.strictEqual(noShow.note, '');
const other = sandbox.schedMissedParts('Other: family asked');
assert.strictEqual(other.reason, 'Other');
assert.strictEqual(other.note, 'family asked');

(async function main(){
const ada = '11111111-1111-4111-8111-111111111111';
const moe = '44444444-4444-4444-8444-444444444444';
function emptyDays(start){
  const days = {};
  for(let n = 1; n <= 7; n++){
    days[String(n)] = {on_date: sandbox.schedAddDays(start, n - 1), weekday: n, slots: []};
  }
  return days;
}
sandbox.schedApplySlotWeek({
  week_start: '2026-09-07',
  clients: [{
    client_id: ada,
    client_name: 'Bowlax',
    weekly_authorized_hours: 63,
    days: emptyDays('2026-09-07')
  }]
});
sandbox.schedPaint();
assert.strictEqual(sandbox.schedSlotMode, true);
els.schedSlotClient.value = ada;
els.schedSlotWeekday.value = '1';
els.schedSlotKey.value = '';
els.schedSlotLabel.value = '';
els.schedSlotStart.value = '08:00';
els.schedSlotEnd.value = '17:00';
els.schedSlotAide.value = '';
els.schedSlotHours.value = '';
els.schedSlotSort.value = '';
pressed[1] = true;
pressed[2] = true;
pressed[3] = true;
pressed[4] = true;
sandbox.schedSlotFormMode = 'add';
sandbox.schedSlotEditKey = '';
sandbox.schedSlotEditWeekday = 0;
rpc.length = 0;
await sandbox.schedSaveSlotPattern();
const fan = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_pattern'; });
assert.strictEqual(fan.length, 0, 'multi-check save does not N-call the single upsert');
const saves = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_pattern_weekdays'; });
assert.strictEqual(saves.length, 1, 'one save is one weekdays call');
assert.strictEqual(JSON.stringify(saves[0].body.p_weekdays), JSON.stringify([1, 2, 3, 4]));
assert.strictEqual(saves[0].body.p_hours, 9);
assert.strictEqual(saves[0].body.p_start_local, '08:00:00');
assert.strictEqual(saves[0].body.p_end_local, '17:00:00');
assert.strictEqual(saves[0].body.p_label, 'Morning');
assert.strictEqual(saves[0].body.p_slot_key, 's1');
assert.strictEqual(saves[0].body.p_client_id, ada);

pressed[2] = false;
pressed[3] = false;
pressed[4] = false;
sandbox.schedSlotFormMode = 'edit';
sandbox.schedSlotEditKey = 's1';
sandbox.schedSlotEditWeekday = 1;
els.schedSlotKey.value = 's1';
rpc.length = 0;
await sandbox.schedSaveSlotPattern();
const single = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_pattern'; });
const again = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_pattern_weekdays'; });
assert.strictEqual(again.length, 0, 'a one-day edit does not use the weekdays callable');
assert.strictEqual(single.length, 1, 'a one-day edit uses the single upsert');
assert.strictEqual(single[0].body.p_weekday, 1);
assert.strictEqual(single[0].body.p_slot_key, 's1');

function slot(on, mark, note){
  return {
    slot_key: 'am',
    label: 'Day',
    start_local: '08:00:00',
    end_local: '17:00:00',
    hours: 9,
    pattern_hours: 9,
    usual_aide_id: moe,
    aide_name: 'moe',
    sort_order: 0,
    mark: mark || null,
    note: note || null,
    deep_link: {client_id: ada, on_date: on, slot_key: 'am'}
  };
}
const days = emptyDays('2026-09-07');
for(let n = 4; n <= 7; n++){
  const on = days[String(n)].on_date;
  days[String(n)].slots = [slot(on, 'missed', holdNote)];
}
days['1'].slots = [slot(days['1'].on_date, null, null)];
sandbox.schedSlotFormMode = 'edit';
sandbox.schedSlotAddAnother = false;
sandbox.schedSlotFormStamp = '';
const holdWeek = {
  week_start: '2026-09-07',
  clients: [{client_id: ada, client_name: 'Bowlax', weekly_authorized_hours: 63, days: days}]
};
sandbox.schedApplySlotWeek(holdWeek);
sandbox.schedSelectSlotDay(ada, '2026-09-10', 4, 'am');
sandbox.schedPaint();
assert.ok(els.schedBody.innerHTML.includes('On hold'), 'grid chip says On hold');
assert.ok(els.schedBody.innerHTML.includes('paused · 0 hrs'), 'grid chip says paused · 0 hrs');
assert.ok(els.schedSlotCards.innerHTML.includes('data-slot-action="missed"'), 'missed button');
assert.ok(els.schedSlotCards.innerHTML.includes('Covered shift'), 'covered shift button');
assert.ok(els.schedSlotCards.innerHTML.includes('data-slot-action="hold"'), 'on hold button');
assert.ok(!els.schedSlotCards.innerHTML.includes('data-slot-action="worked"'), 'no worked button');
assert.ok(!els.schedSlotCards.innerHTML.includes('schedMissReason-am'), 'a hold day opens the hold form');
assert.ok(els.schedSlotCards.innerHTML.includes('Save hold'), 'hold form saves');
assert.ok(els.schedSlotCards.innerHTML.includes('End hold'), 'end hold is on the form');
assert.ok(els.schedSlotHoursView.value.indexOf('9') >= 0, 'hours view comes from 8–5');
assert.ok(String(els.schedSlotHoursNote.textContent).indexOf('from start') >= 0, 'hours note');

els['schedMissReason-am'] = {value: 'Other'};
els['schedMissNote-am'] = {value: 'family asked'};
rpc.length = 0;
sandbox.schedSlotSelected = {clientId: ada, onDate: '2026-09-07', weekday: 1};
await sandbox.schedSaveMissed(ada, '2026-09-07', 'am');
const miss = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_day_mark'; }).pop();
assert.strictEqual(miss.body.p_mark, 'missed');
assert.strictEqual(miss.body.p_miss_reason, 'other');
assert.strictEqual(miss.body.p_note, 'family asked');
assert.strictEqual(miss.body.p_hours, 0);
assert.ok(!rpc.some(function(c){ return c.body && c.body.p_mark === 'worked'; }), 'missed save does not write worked');

els['schedHoldStart-am'] = {value: '09/10/2026'};
els['schedHoldEnd-am'] = {value: ''};
els['schedHoldNote-am'] = {value: 'ER'};
sandbox.schedApplySlotWeek(holdWeek);
const holdSlot = sandbox.schedFindSlotClient(ada).days['4'].slots[0];
holdSlot.hold_id = '99999999-9999-4999-8999-999999999999';
holdSlot.on_hold = true;
rpc.length = 0;
await sandbox.schedWriteHold(ada, '2026-09-10', 'am', false);
const listed = rpc.filter(function(c){ return c.name === 'list_schedule_client_holds'; });
const clientHold = rpc.filter(function(c){ return c.name === 'upsert_schedule_client_hold'; });
const slotHold = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_day_mark'; });
assert.ok(listed.length >= 1, 'save lists client holds');
assert.strictEqual(listed[0].body.p_client_id, ada);
assert.strictEqual(clientHold.length, 1, 'hospital hold is one client-hold upsert');
assert.strictEqual(clientHold[0].body.p_start_date, '2026-09-10');
assert.strictEqual(clientHold[0].body.p_end_date, null);
assert.strictEqual(clientHold[0].body.p_note, 'ER');
assert.strictEqual(clientHold[0].body.p_hold_id, holdSlot.hold_id);
assert.strictEqual(slotHold.length, 1, 'the tapped slot is marked on_hold');
assert.strictEqual(slotHold[0].body.p_mark, 'on_hold');
assert.strictEqual(slotHold[0].body.p_hours, 0);
assert.strictEqual(slotHold[0].body.p_slot_key, 'am');

sandbox.schedApplySlotWeek(holdWeek);
sandbox.schedFindSlotClient(ada).days['4'].slots[0].hold_id = holdSlot.hold_id;
rpc.length = 0;
await sandbox.schedWriteHold(ada, '2026-09-10', 'am', true);
const ended = rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; });
assert.strictEqual(ended.length, 1, 'end hold clears the client hold');
assert.strictEqual(ended[0].body.p_hold_id, holdSlot.hold_id);
assert.strictEqual(ended[0].body.p_end_date, '2026-09-10');
assert.ok(!rpc.some(function(c){ return c.name === 'upsert_schedule_slot_pattern'; }), 'end hold does not rewrite patterns');

async function shots(){
  if(process.env.SKIP_BROWSER === '1')return;
  let puppeteer;
  try { puppeteer = require('puppeteer-core'); }
  catch(e){
    try { puppeteer = require('/tmp/pptr/node_modules/puppeteer-core'); }
    catch(e2){
      console.log('shift-slim1 browser skipped (no puppeteer-core)');
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
  const outDir = process.env.SLIM_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(outDir, {recursive: true});
  const adaId = '11111111-1111-4111-8111-111111111111';
  const moeId = '44444444-4444-4444-8444-444444444444';
  const kimId = '33333333-3333-4333-8333-333333333333';
  async function boot(page, width, height, mobile){
    await page.setViewport({width: width, height: height, isMobile: !!mobile, hasTouch: !!mobile, deviceScaleFactor: mobile ? 2 : 1});
    await page.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(adaId, moeId, kimId){
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.getElementById('tab_schedule').classList.add('active');
      currentAdminRole = 'Admin';
      readSbSession = function(){ return {access_token: 'office'}; };
      loadedAidesList = [
        {id: moeId, username: 'moe', name: 'moe', is_active: true},
        {id: kimId, username: 'kim', name: 'Kim Lee', is_active: true},
        {id: 'gone', username: 'old', name: 'Old Aide', is_active: false, deactivated_at: '2026-09-01'}
      ];
      var days = {};
      for(var n = 1; n <= 7; n++){
        var on = schedAddDays('2026-09-07', n - 1);
        var slots = n <= 4 ? [{
          slot_key: 'am', label: 'Day', start_local: '08:00:00', end_local: '17:00:00',
          hours: 9, pattern_hours: 9, usual_aide_id: moeId, aide_name: 'moe', sort_order: 0,
          mark: null, note: null, deep_link: {client_id: adaId, on_date: on, slot_key: 'am'}
        }] : [];
        days[String(n)] = {on_date: on, weekday: n, slots: slots};
      }
      schedApplySlotWeek({
        week_start: '2026-09-07',
        clients: [{client_id: adaId, client_name: 'Bowlax', weekly_authorized_hours: 63, days: days}]
      });
      schedSelectSlotDay(adaId, '2026-09-07', 1, 'am');
      schedSetSlotFormMode('edit');
    }, adaId, moeId, kimId);
  }
  try {
    const phone = await browser.newPage();
    await boot(phone, 390, 844, true);
    const phoneProbe = await phone.evaluate(function(){
      var sc = document.getElementById('schedScroll');
      var form = document.getElementById('schedSlotPattern');
      var checks = document.querySelectorAll('#schedSlotDays .day-chip');
      var fab = document.getElementById('copilotFab').getBoundingClientRect();
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        viewW: window.innerWidth,
        scroll: sc.scrollWidth,
        client: sc.clientWidth,
        checks: checks.length,
        hours: document.getElementById('schedSlotHoursView').value,
        note: document.getElementById('schedSlotHoursNote').textContent,
        slotKeyLabel: !!form.querySelector('label[for="schedSlotKey"]'),
        fabRight: fab.right,
        noRemiPage: !document.getElementById('tab_remi'),
        sheetHidden: document.getElementById('copilotSheet').hidden
      };
    });
    assert.strictEqual(phoneProbe.build, '2026-09-27-clienthrs1c');
    assert.strictEqual(phoneProbe.viewW, 390);
    assert.ok(phoneProbe.scroll > phoneProbe.client + 40, 'phone week scrolls');
    assert.strictEqual(phoneProbe.checks, 7);
    assert.ok(phoneProbe.hours.indexOf('9') >= 0, phoneProbe.hours);
    assert.ok(phoneProbe.note.indexOf('from start') >= 0, phoneProbe.note);
    assert.strictEqual(phoneProbe.slotKeyLabel, false);
    assert.strictEqual(phoneProbe.noRemiPage, true);
    assert.strictEqual(phoneProbe.sheetHidden, true);
    assert.ok(phoneProbe.fabRight > 390 - 120, 'Remi chip stays on the right');
    await phone.evaluate(function(){
      document.getElementById('schedSlotPattern').scrollIntoView({block: 'start'});
    });
    await phone.screenshot({path: path.join(outDir, 'shift-slim1-form-phone.png')});
    await phone.evaluate(function(){
      document.querySelectorAll('#schedSlotDays .day-chip').forEach(function(btn){
        var wd = btn.getAttribute('data-wd');
        var on = wd === '1' || wd === '2' || wd === '3' || wd === '4';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.classList.toggle('on', on);
      });
      var hint = document.getElementById('schedSlotDaysHint');
      if(hint)hint.textContent = 'Creates 4 shifts this week';
      document.getElementById('schedSlotDays').scrollIntoView({block: 'center'});
    });
    await phone.screenshot({path: path.join(outDir, 'shift-slim1-days-phone.png')});
    await phone.evaluate(function(){
      var card = document.querySelector('.sched-slot-card');
      if(card)card.scrollIntoView({block: 'center'});
    });
    await phone.screenshot({path: path.join(outDir, 'shift-slim1-marks-phone.png')});
    await phone.evaluate(function(adaId){
      var on = '2026-09-10';
      var client = schedFindSlotClient(adaId);
      client.days['4'].on_hold = true;
      client.days['4'].hold_id = '99999999-9999-4999-8999-999999999999';
      client.days['4'].slots[0].mark = 'on_hold';
      client.days['4'].slots[0].on_hold = true;
      client.days['4'].slots[0].hold_id = client.days['4'].hold_id;
      client.days['4'].slots[0].hours = 0;
      client.holds = [{hold_id: client.days['4'].hold_id, start_date: '2026-09-10', end_date: '', note: 'ER', open_ended: true}];
      schedSelectSlotDay(adaId, on, 4, 'am');
      document.getElementById('schedScroll').scrollIntoView({block: 'start'});
    }, adaId);
    const holdProbe = await phone.evaluate(function(){
      var chip = document.querySelector('#schedScroll .sched-chip.is-hold');
      var box = chip ? chip.getBoundingClientRect() : null;
      return {
        text: chip ? chip.innerText.replace(/\s+/g, ' ').trim() : '',
        top: box ? box.top : -1,
        actions: document.querySelectorAll('.mark-actions .btn').length
      };
    });
    assert.ok(holdProbe.text.indexOf('On hold') >= 0, holdProbe.text);
    assert.ok(holdProbe.text.indexOf('paused') >= 0, holdProbe.text);
    assert.ok(holdProbe.actions >= 3, 'three mark buttons');
    await phone.screenshot({path: path.join(outDir, 'shift-slim1-hold-phone.png')});

    const desk = await browser.newPage();
    await boot(desk, 1280, 900, false);
    const wide = await desk.evaluate(function(){
      var layout = getComputedStyle(document.querySelector('#tab_schedule .sched-layout')).flexDirection;
      var grid = document.getElementById('schedScroll').getBoundingClientRect();
      var main = document.querySelector('#tab_schedule .sched-main').getBoundingClientRect();
      var detail = document.getElementById('schedSlotDetail').getBoundingClientRect();
      var fab = document.getElementById('copilotFab').getBoundingClientRect();
      var doc = document.documentElement;
      return {
        layout: layout,
        gridW: grid.width,
        mainW: main.width,
        detailTop: detail.top,
        gridBottom: grid.bottom,
        docScroll: doc.scrollWidth,
        docClient: doc.clientWidth,
        fabRight: fab.right,
        viewW: window.innerWidth,
        noRemiPage: !document.getElementById('tab_remi')
      };
    });
    assert.strictEqual(wide.layout, 'column');
    assert.ok(wide.gridW >= wide.mainW - 8, 'grid uses the full week width');
    assert.ok(wide.detailTop >= wide.gridBottom - 2, 'drawer is below the grid');
    assert.ok(wide.docScroll <= wide.docClient + 2, 'desktop page does not scroll sideways');
    assert.ok(wide.fabRight > wide.viewW - 140, 'Remi stays on the right rail side');
    assert.strictEqual(wide.noRemiPage, true);
    await desk.screenshot({path: path.join(outDir, 'shift-slim1-desktop.png'), fullPage: true});
    await desk.evaluate(function(){
      document.getElementById('schedSlotDays').scrollIntoView({block: 'center'});
    });
    await desk.screenshot({path: path.join(outDir, 'shift-slim1-days-desktop.png')});
    console.log('shift-slim1 phone and desktop layout ok');
  } finally {
    await browser.close();
    server.close();
  }
}

await shots();
console.log('admin-shift-slim1-test ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
