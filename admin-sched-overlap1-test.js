#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('SCHED_OVERLAP1'), 'SCHED_OVERLAP1 marker');
assert.ok(html.includes("var SCHED_OVERLAP1='SCHED_OVERLAP1'"), 'script marker');
assert.ok(html.includes("var SCHED_OVERLAP1_MARKER='v=sched-overlap1'"), 'script query marker');
assert.ok(html.includes("var SCHED_OVERLAP1_BUILD='2026-10-08-sched-overlap1'"), 'script build');
assert.ok(html.includes('v=sched-overlap1'), 'sched-overlap1 marker');
assert.ok(html.includes('?v=sched-overlap1'), 'cache tag');
assert.ok(html.includes('<meta name="admin-build" content="2026-10-08-sched-overlap1">'), 'build meta');
assert.ok(html.includes('data-sched-overlap1="v=sched-overlap1"'), 'schedule marker');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-10-08-sched-overlap1"'), 'sched-overlap1 meta follows the first');
assert.ok(html.includes('PAY_ADMIN1'), 'pay-admin1 gate stays');

const overlapStart = html.indexOf('// schedule overlap v=sched-overlap1');
const overlapEnd = html.indexOf('// end schedule overlap v=sched-overlap1');
const overlapSrc = html.slice(overlapStart, overlapEnd);
assert.ok(overlapStart > 0 && overlapEnd > overlapStart, 'overlap block');
assert.ok(!overlapSrc.includes('console.log') && !overlapSrc.includes('console.warn') && !overlapSrc.includes('console.error'), 'names are not written to the console');
assert.ok(!overlapSrc.includes('location.search') && !overlapSrc.includes('location.href'), 'no sticky Home Screen ?v=');
assert.ok(overlapSrc.includes('resp.conflicts==null&&resp.warnings==null') || overlapSrc.includes('node.conflicts||[]'), 'optional conflict keys');
assert.ok(overlapSrc.includes('node.conflicts||[]') && overlapSrc.includes('node.warnings||[]'), 'missing keys read as empty arrays');
assert.ok(html.includes("sbRestRpc('list_schedule_aide_overlaps'"), 'week load calls the overlap read');
assert.ok(html.includes("sbRestRpc('list_schedule_change_history'"), 'history uses the history read');
assert.ok(html.includes('schedHoldAutosave1Violation'), 'Save week hold check stays');

const nurseRule = html.match(/#nurseComplianceTable \.nurse-actions \.btn\{[^}]*min-height:\s*(\d+)px/);
assert.ok(nurseRule && Number(nurseRule[1]) >= 32, 'Nurse landing buttons min-height is at least 32px');
assert.ok(Number(nurseRule[1]) <= 44, 'Nurse landing buttons stay in the 36–44px range');

const schedStart = html.indexOf('// admin schedule v=sched1');
const schedEnd = html.indexOf('// end admin schedule v=sched1');
const slotStart = html.indexOf('// schedule multi-slot v=clienthrs1b');
const slotEnd = html.indexOf('// end schedule multi-slot v=clienthrs1b');
const schedSrc = html.slice(schedStart, schedEnd);
const slotSrc = html.slice(slotStart, slotEnd);

const logs = [];
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
    attrs: {},
    classList: {add: function(){}, remove: function(){}, toggle: function(){}},
    dataset: {},
    style: {},
    setAttribute: function(k, v){
      this.attrs[k] = v;
      if(k === 'hidden')this.hidden = true;
    },
    removeAttribute: function(k){
      delete this.attrs[k];
      if(k === 'hidden')this.hidden = false;
    },
    getAttribute: function(k){ return this.attrs[k]; },
    addEventListener: function(){},
    scrollIntoView: function(){},
    querySelector: function(){ return null; },
    querySelectorAll: function(){ return []; }
  };
  els[id] = el;
  return el;
}
['schedWeekLabel','schedSourceNote','schedNoClients','schedEmpty','schedEmptyAdd','schedScroll','schedHead','schedBody','schedPanel','schedSlotDetail','schedSlotClientName','schedSlotAuth','schedSlotWhen','schedSlotWeekStat','schedSlotDaySum','schedSlotCards','schedSlotPattern','schedSlotPatternTitle','schedSlotClient','schedSlotWeekday','schedSlotKey','schedSlotLabel','schedSlotStart','schedSlotEnd','schedSlotAide','schedSlotHours','schedSlotHoursView','schedSlotHoursNote','schedSlotSort','schedSlotDaysHint','schedSlotShiftSummary','schedSlotModeEdit','schedSlotModeAdd','schedSlotRemovePattern','schedIntro','schedAddUsualBtn','schedFilterCalloff','schedFilterHold','schedFilterAll','schedFilterOpen','schedLegend','schedSearch','tab_schedule','schedViewWeek','schedViewDay','schedHoldStart-s1','schedHoldEnd-s1','schedHoldNote-s1','schedHoldStart-am','schedHoldEnd-am','schedHoldNote-am','schedClientHoldStart','schedClientHoldEnd','schedClientHoldNote','schedOverlapNotice','schedOverlapMuted','schedHistBtn','schedHistDrawer','schedHistBody','schedHistMore','schedInsLegend'].forEach(makeEl);

const pressed = {};
const dayBtns = [7,1,2,3,4,5,6].map(function(wd){
  return {
    wd: wd,
    getAttribute: function(k){
      if(k === 'data-wd')return String(wd);
      if(k === 'aria-pressed')return pressed[wd] ? 'true' : 'false';
      return '';
    },
    setAttribute: function(k, v){ if(k === 'aria-pressed')pressed[wd] = v === 'true'; },
    classList: {add: function(){}, remove: function(){}}
  };
});
els.schedSlotDays = {
  id: 'schedSlotDays',
  dataset: {},
  querySelectorAll: function(){ return dayBtns; },
  addEventListener: function(){}
};

const ada = '11111111-1111-4111-8111-111111111111';
const nia = '22222222-2222-4222-8222-222222222222';
const moe = '44444444-4444-4444-8444-444444444444';
const headsUp = 'Saved. Heads-up: Maya Brooks also works Nia Cole Tue 9:00am\u20131:00pm (from 10/13/2026).';
const conflict = {
  kind: 'pattern',
  client_id: nia,
  client_name: 'Nia Cole',
  slot_key: 's1',
  weekday: 2,
  start_local: '09:00',
  end_local: '13:00',
  first_conflict_date: '2026-10-13'
};
const warning = {code: 'aide_double_booked', aide_id: moe, count: 1};

let patternReply = {ok: true, marker: 'hold-autosave1', v: 'hold-autosave1', holds_written: false, count: 1};
let markReply = {ok: true, deep_link: {client_id: ada, on_date: '2026-10-13', slot_key: 's1'}};
let overlapReply = {ok: false};
let weekReply = null;
let histReply = {ok: true, rows: [], has_more: false, limit: 100};

const sandbox = {
  allClients: [],
  loadedAidesList: [],
  allAidesForAssign: [],
  currentAdminRole: 'Scheduler',
  currentAdminUsername: 'scheduler',
  location: {search: '', hash: ''},
  document: {getElementById: function(id){ return els[id] || null; }},
  showTempMsg: function(msg){ toasts.push(String(msg)); },
  logActivity: function(){},
  showTab: function(){},
  sbUuid: function(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || '')); },
  evercareSbEnabled: function(){ return true; },
  readSbSession: function(){ return {access_token: 'office', username: 'scheduler', role: 'Scheduler'}; },
  sbRestRpc: function(name, body){
    rpc.push({name: name, body: body});
    if(name === 'upsert_schedule_slot_pattern' || name === 'upsert_schedule_slot_pattern_weekdays'){
      return Promise.resolve({ok: true, data: patternReply});
    }
    if(name === 'upsert_schedule_slot_day_mark')return Promise.resolve({ok: true, data: markReply});
    if(name === 'list_schedule_aide_overlaps')return Promise.resolve(overlapReply.ok ? {ok: true, data: overlapReply} : {ok: false, error: 'overlap unavailable', status: 500});
    if(name === 'list_schedule_change_history')return Promise.resolve(histReply && histReply._fail ? {ok: false, error: 'forbidden', status: 403} : {ok: true, data: histReply});
    if(name === 'list_schedule_week_slots' || name === 'list_schedule_week'){
      if(weekReply)return Promise.resolve({ok: true, data: weekReply});
      return Promise.resolve({ok: false, error: 'skip reload'});
    }
    if(name === 'list_schedule_client_holds')return Promise.resolve({ok: true, data: {holds: []}});
    return Promise.resolve({ok: true, data: {ok: true}});
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
  console: {
    log: function(){ logs.push('log'); },
    warn: function(){ logs.push('warn'); },
    error: function(){ logs.push('error'); }
  }
};
vm.createContext(sandbox);
vm.runInContext(schedSrc + '\n' + slotSrc, sandbox);

function emptyDays(start){
  const days = {};
  for(let n = 1; n <= 7; n++){
    days[String(n)] = {on_date: sandbox.schedAddDays(start, n - 1), weekday: n, slots: []};
  }
  return days;
}
function slot(on, key){
  return {
    slot_key: key,
    label: 'Morning',
    start_local: '09:00:00',
    end_local: '13:00:00',
    hours: 4,
    pattern_hours: 4,
    usual_aide_id: moe,
    aide_name: 'Maya Brooks',
    sort_order: 0,
    mark: '',
    deep_link: {client_id: ada, on_date: on, slot_key: key}
  };
}

(async function main(){
  sandbox.loadedAidesList = [{id: moe, name: 'Maya Brooks', username: 'maya'}];
  sandbox.schedRememberAide(moe, 'Maya Brooks');
  assert.strictEqual(sandbox.schedOverlap1AfterSave(null), '', 'null response is tolerated');
  assert.strictEqual(sandbox.schedOverlap1AfterSave({ok: true}), '', 'missing data keys are tolerated');
  assert.strictEqual(sandbox.schedOverlap1AfterSave({ok: true, data: {ok: true, marker: 'hold-autosave1', v: 'hold-autosave1', holds_written: false}}), '', 'a save without the new keys stays quiet');
  assert.strictEqual(els.schedOverlapNotice.hidden, true, 'no notice when keys are missing');

  const bare = sandbox.schedOverlap1AfterSave({data: {warnings: [{code: 'overlap_unchecked_no_times', aide_id: moe}]}});
  assert.strictEqual(bare, '', 'unchecked times do not become a failed save');
  assert.strictEqual(els.schedOverlapNotice.hidden, true, 'unchecked times are not the amber notice');
  assert.ok(els.schedOverlapMuted.textContent.indexOf('not checked') >= 0, 'unchecked times are muted');

  sandbox.schedWeekStart = '2026-10-12';
  sandbox.schedApplySlotWeek({
    week_start: '2026-10-12',
    clients: [{client_id: ada, client_name: 'Ada Client', holds: [], days: emptyDays('2026-10-12')}]
  });
  els.schedSlotClient.value = ada;
  els.schedSlotWeekday.value = '2';
  els.schedSlotKey.value = '';
  els.schedSlotLabel.value = '';
  els.schedSlotStart.value = '09:00';
  els.schedSlotEnd.value = '13:00';
  els.schedSlotAide.value = '';
  els.schedSlotHours.value = '';
  els.schedSlotSort.value = '';
  dayBtns.forEach(function(btn){ pressed[btn.wd] = false; });
  pressed[2] = true;
  sandbox.schedSlotFormMode = 'add';
  sandbox.schedSlotEditKey = '';
  sandbox.schedSlotEditWeekday = 0;
  patternReply = {
    ok: true,
    marker: 'hold-autosave1',
    v: 'hold-autosave1',
    holds_written: false,
    conflicts: [conflict],
    warnings: [warning]
  };
  rpc.length = 0;
  toasts.length = 0;
  logs.length = 0;
  await sandbox.schedSaveSlotPattern();
  assert.ok(rpc.some(function(c){ return c.name === 'upsert_schedule_slot_pattern'; }), 'the pattern save still posts');
  assert.ok(toasts.indexOf(headsUp) >= 0, 'the amber heads-up is shown');
  assert.ok(toasts.indexOf('Could not save the shift.') < 0, 'a warning is not a failed save');
  assert.ok(!toasts.some(function(t){ return t.indexOf('hold') >= 0; }), 'holds_written false still counts as a clean save');
  assert.strictEqual(els.schedOverlapNotice.textContent, headsUp, 'the notice names the aide, client, weekday, times, and first date');
  assert.strictEqual(els.schedOverlapNotice.hidden, false, 'the notice is visible');
  assert.strictEqual(logs.length, 0, 'client and aide names are not logged');

  patternReply = {ok: true, marker: 'hold-autosave1', v: 'hold-autosave1', holds_written: false};
  [1,2,3,4,5,6].forEach(function(wd){ pressed[wd] = true; });
  pressed[7] = false;
  rpc.length = 0;
  toasts.length = 0;
  await sandbox.schedSaveSlotPattern();
  const weekSave = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_pattern_weekdays'; })[0];
  assert.ok(weekSave, 'Save week still posts weekdays');
  assert.strictEqual(weekSave.body.p_mark, undefined, 'Save week does not send a day mark');
  assert.ok(toasts.indexOf('Shift saved on 6 days.') >= 0, 'missing warning keys keep the success toast');
  assert.strictEqual(els.schedOverlapNotice.hidden, true, 'a later save without a warning clears the notice');
  assert.ok(!toasts.some(function(t){ return t.indexOf('must not create a hold') >= 0; }), 'Save week still accepts marker, v, and holds_written');

  markReply = {
    ok: true,
    deep_link: {client_id: ada, on_date: '2026-10-13', slot_key: 's1'},
    conflicts: [conflict],
    warnings: [warning]
  };
  rpc.length = 0;
  toasts.length = 0;
  await sandbox.schedMarkSlot(ada, '2026-10-13', 's1', 'cover', {cover: moe});
  assert.ok(rpc.some(function(c){ return c.name === 'upsert_schedule_slot_day_mark' && c.body.p_mark === 'cover'; }), 'cover still posts the day mark');
  assert.ok(toasts.indexOf(headsUp) >= 0, 'a cover warning is painted and the save stays ok');

  const adaDays = emptyDays('2026-10-12');
  const niaDays = emptyDays('2026-10-12');
  adaDays['2'].slots = [slot('2026-10-13', 's1')];
  niaDays['2'].slots = [Object.assign({}, slot('2026-10-13', 's1'), {usual_aide_id: moe, aide_name: 'Maya Brooks', deep_link: {client_id: nia, on_date: '2026-10-13', slot_key: 's1'}})];
  const week = {
    week_start: '2026-10-12',
    clients: [
      {client_id: ada, client_name: 'Ada Client', holds: [], days: adaDays},
      {client_id: nia, client_name: 'Nia Cole', holds: [], days: niaDays}
    ]
  };
  const pair = {
    aide_id: moe,
    aide_name: 'Maya Brooks',
    a: {kind: 'pattern', id: 'p1', client_id: ada, client_name: 'Ada Client', slot_key: 's1', on_date: '2026-10-13', start_local: '09:00', end_local: '13:00'},
    b: {kind: 'pattern', id: 'p2', client_id: nia, client_name: 'Nia Cole', slot_key: 's1', on_date: '2026-10-13', start_local: '10:00', end_local: '14:00'}
  };
  overlapReply = {ok: true, conflicts: [pair]};
  weekReply = week;
  rpc.length = 0;
  toasts.length = 0;
  await sandbox.schedLoadWeek('2026-10-12');
  sandbox.schedPaint();
  assert.ok(rpc.some(function(c){ return c.name === 'list_schedule_aide_overlaps' && c.body.p_week_start === '2026-10-12'; }), 'week load asks for overlaps');
  const badges = els.schedBody.innerHTML.split('Double-booked').length - 1;
  assert.strictEqual(badges, 2, 'both shifts in the pair get a badge');
  const shown = sandbox.schedOverlap1Show(0, 'a');
  assert.ok(shown.indexOf('Nia Cole') >= 0 && shown.indexOf('10:00am') >= 0, 'tapping a badge shows the other shift');
  assert.strictEqual(logs.length, 0, 'badge text is not logged');

  overlapReply = {ok: false};
  weekReply = week;
  toasts.length = 0;
  await sandbox.schedLoadWeek('2026-10-12');
  sandbox.schedPaint();
  assert.ok(els.schedBody.innerHTML.indexOf('Double-booked') < 0, 'a failed overlap call paints nothing');
  assert.strictEqual(toasts.length, 0, 'a failed overlap call does not toast');

  sandbox.currentAdminRole = 'Nurse';
  sandbox.schedHist1Sync();
  assert.strictEqual(els.schedHistBtn.hidden, true, 'Nurse does not see History');
  rpc.length = 0;
  const nurseOpen = await sandbox.schedHist1Open();
  assert.strictEqual(nurseOpen.hidden, true, 'Nurse open is refused');
  assert.ok(!rpc.some(function(c){ return c.name === 'list_schedule_change_history'; }), 'Nurse does not call history');

  sandbox.currentAdminRole = 'Admin';
  sandbox.schedHist1Sync();
  assert.strictEqual(els.schedHistBtn.hidden, false, 'Admin sees History');
  sandbox.currentAdminRole = 'Scheduler';
  sandbox.schedHist1Sync();
  assert.strictEqual(els.schedHistBtn.hidden, false, 'Scheduler sees History');
  assert.strictEqual(sandbox.schedHist1CanSee(), true, 'Scheduler may open history');

  sandbox.schedWeekStart = '2026-10-12';
  sandbox.schedSlotSelected = {clientId: ada, onDate: '2026-10-13', weekday: 2};
  histReply = {
    ok: true,
    has_more: true,
    limit: 100,
    rows: [
      {id: 9, changed_at_et: '10/07/2026 9:09 PM ET', actor_name: 'Sam Office', summary: 'Moved Tue 9:00am-1:00pm to 10:00am-2:00pm'},
      {id: 8, changed_at_et: '10/07/2026 8:00 PM ET', actor_name: 'actor@example.com', summary: 'Added Tue 9:00am-1:00pm shift'}
    ]
  };
  rpc.length = 0;
  toasts.length = 0;
  const opened = await sandbox.schedHist1Open();
  assert.strictEqual(opened.ok, true, 'history loads');
  assert.strictEqual(els.schedHistDrawer.hidden, false, 'the drawer opens');
  assert.strictEqual(rpc[0].name, 'list_schedule_change_history');
  assert.strictEqual(rpc[0].body.p_week_start, '2026-10-12');
  assert.strictEqual(rpc[0].body.p_client_id, ada, 'a focused client is sent');
  assert.strictEqual(rpc[0].body.p_limit, 100);
  assert.ok(els.schedHistBody.innerHTML.indexOf('10/07/2026 9:09 PM ET') < els.schedHistBody.innerHTML.indexOf('10/07/2026 8:00 PM ET'), 'newest row is first');
  assert.ok(els.schedHistBody.innerHTML.includes('Sam Office'), 'actor name is shown');
  assert.ok(els.schedHistBody.innerHTML.includes('Moved Tue 9:00am-1:00pm to 10:00am-2:00pm'), 'summary is shown');
  assert.ok(!els.schedHistBody.innerHTML.includes('@'), 'emails are not shown');
  assert.strictEqual(els.schedHistMore.hidden, false, 'has_more shows Load more');
  assert.ok(els.schedHistMore.textContent === '' || html.includes('>Load more<'), 'Load more label');

  histReply = {ok: true, has_more: false, limit: 200, rows: histReply.rows};
  const more = await sandbox.schedHist1More();
  assert.strictEqual(more.limit, 200, 'Load more raises p_limit');
  assert.strictEqual(rpc[rpc.length - 1].body.p_limit, 200);
  assert.strictEqual(els.schedHistMore.hidden, true, 'Load more hides when has_more is false');

  histReply = {ok: true, has_more: false, rows: []};
  const empty = await sandbox.schedHist1Open();
  assert.strictEqual(empty.ok, true);
  assert.ok(els.schedHistBody.innerHTML.includes('No changes this week.'), 'empty week copy');

  histReply = {_fail: true};
  toasts.length = 0;
  const failed = await sandbox.schedHist1Open();
  assert.strictEqual(failed.ok, false);
  assert.ok(els.schedHistBody.innerHTML.includes('Could not load history.'), 'quiet error copy');
  assert.strictEqual(toasts.length, 0, 'history failure does not toast');

  console.log('admin-sched-overlap1-test ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
