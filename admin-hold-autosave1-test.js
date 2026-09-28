#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=hold-autosave1'), 'hold-autosave1 marker');
assert.ok(html.includes('data-hold-autosave1="v=hold-autosave1"'), 'hold-autosave1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-hold-autosave1'), 'hold-autosave1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-hold-autosave1">'), 'hold-autosave1 meta');
assert.ok(html.includes('<!-- schedule hold autosave 2026-09-27 v=hold-autosave1 admin-build 2026-09-27-hold-autosave1'), 'hold-autosave1 comment');
assert.ok(html.includes("var HOLD_AUTOSAVE1_MARKER='v=hold-autosave1'"), 'script marker');
assert.ok(html.includes('GHOST-HOLD-AUTOSAVE1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('Do not squash-merge.'), 'do not squash-merge');
assert.ok(html.includes('holds_written'), 'weekdays response lock');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-hold-autosave1'), 'first admin-build is hold-autosave1');
assert.ok(html.indexOf('content="2026-09-27-hold-autosave1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after this tip');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-remi-langs1"'), 'remi-langs1 stays after aide-office-vis1');
assert.ok(html.indexOf('content="2026-09-27-remi-langs1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after remi-langs1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
['2026-09-27-login-toast1','2026-09-27-aide-office-vis1','2026-09-27-remi-langs1','2026-09-27-hold-clear1','2026-09-27-sched-time-tap1','2026-09-27-aide-text-chat1','2026-09-27-remi-float-hide1','2026-09-27-tabbar-8','2026-09-27-cover-card-cancel1','2026-09-27-clienthrs1c','2026-09-27-shift-slim1','2026-09-27-client-ins1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="' + meta + '">'), 'prior meta stays ' + meta);
});
['v=login-toast1','v=aide-office-vis1','v=remi-langs1','v=hold-clear1','v=sched-time-tap1','v=clienthrs1c','v=shift-slim1','v=client-ins1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('hold-client1'), 'explicit Save hold stays on the hold-client1 path');
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('No Quo/SMS'), 'no Quo/SMS');
assert.ok(!html.includes('mossier'), 'no mossier auth reseal');
assert.ok(!html.includes('af44b579-5881-46ea-8cb8-83a33c0af200'), 'does not auto-clear Bowlax');

const schedStart = html.indexOf('// admin schedule v=sched1');
const schedEnd = html.indexOf('// end admin schedule v=sched1');
const slotStart = html.indexOf('// schedule multi-slot v=clienthrs1b');
const slotEnd = html.indexOf('// end schedule multi-slot v=clienthrs1b');
const schedSrc = html.slice(schedStart, schedEnd);
const slotSrc = html.slice(slotStart, slotEnd);
const saveFn = slotSrc.slice(slotSrc.indexOf('async function schedSaveSlotPattern'), slotSrc.indexOf('async function schedDeleteSlotPattern'));
assert.ok(saveFn.includes("schedPatternSaveRpc('upsert_schedule_slot_pattern_weekdays'"), 'Save week uses the weekdays callable');
assert.ok(saveFn.includes("schedPatternSaveRpc('upsert_schedule_slot_pattern'"), 'Add shift and one-day edit use the pattern callable');
assert.ok(saveFn.includes("schedPatternSaveRpc('delete_schedule_slot_pattern'"), 'unchecked weekday delete stays on the pattern callable');
assert.ok(!saveFn.includes('upsert_schedule_client_hold'), 'Save week does not call the hold RPC');
assert.ok(!saveFn.includes('schedWriteHold'), 'Save week does not call Save hold');
assert.ok(!saveFn.includes("p_mark:'on_hold'") && !saveFn.includes('p_mark:"on_hold"'), 'Save week does not mark on_hold');
assert.ok(!saveFn.includes('schedHoldStart') && !saveFn.includes('schedHoldEnd') && !saveFn.includes('schedHoldNote'), 'Save week does not read hold drafts');
const clearFn = slotSrc.slice(slotSrc.indexOf('async function schedClearHold'), slotSrc.indexOf('async function schedClearSlotMark'));
assert.ok(clearFn.includes("sbRestRpc('clear_schedule_client_hold',{p_client_id:String(clientId)})"), 'Clear is client-scoped');
assert.ok(!clearFn.includes('p_hold_id'), 'Clear omits p_hold_id');
assert.ok(!clearFn.includes('p_end_date'), 'Clear still does not send an end date');
const endFn = slotSrc.slice(slotSrc.indexOf('async function schedWriteHold'), slotSrc.indexOf('async function schedSaveCover'));
assert.ok(endFn.includes('p_client_id:String(clientId)'), 'End hold is client-scoped');
assert.ok(endFn.includes('p_end_date:end||schedDateOnly(onDate)'), 'End hold still sends p_end_date');
assert.ok(endFn.includes("got=await sbRestRpc('clear_schedule_client_hold',{\n        p_client_id:String(clientId),\n        p_end_date:end||schedDateOnly(onDate)\n      })"), 'End hold omits p_hold_id');
assert.ok(endFn.includes("sbRestRpc('upsert_schedule_client_hold'"), 'explicit Save hold still posts the client hold');

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
['schedWeekLabel','schedSourceNote','schedNoClients','schedEmpty','schedEmptyAdd','schedScroll','schedHead','schedBody','schedPanel','schedSlotDetail','schedSlotClientName','schedSlotAuth','schedSlotWhen','schedSlotWeekStat','schedSlotDaySum','schedSlotCards','schedSlotPattern','schedSlotPatternTitle','schedSlotClient','schedSlotWeekday','schedSlotKey','schedSlotLabel','schedSlotStart','schedSlotEnd','schedSlotAide','schedSlotHours','schedSlotHoursView','schedSlotHoursNote','schedSlotSort','schedSlotDaysHint','schedSlotShiftSummary','schedSlotModeEdit','schedSlotModeAdd','schedSlotRemovePattern','schedIntro','schedAddUsualBtn','schedFilterCalloff','schedFilterHold','schedFilterAll','schedFilterOpen','schedLegend','schedSearch','tab_schedule','schedViewWeek','schedViewDay','schedHoldStart-s1','schedHoldEnd-s1','schedHoldNote-s1','schedHoldStart-am','schedHoldEnd-am','schedHoldNote-am'].forEach(makeEl);

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

const ada = '11111111-1111-4111-8111-111111111111';
const moe = '44444444-4444-4444-8444-444444444444';
const holdId = '99999999-9999-4999-8999-999999999999';
let weekReply = null;
let weekdayReply = {ok: true, marker: 'hold-autosave1', v: 'hold-autosave1', holds_written: false, count: 6};

const sandbox = {
  allClients: [],
  loadedAidesList: [],
  allAidesForAssign: [],
  currentAdminRole: 'Scheduler',
  currentAdminUsername: 'Jaz2029',
  location: {search: '', hash: ''},
  document: {getElementById: function(id){ return els[id] || null; }},
  showTempMsg: function(msg){ toasts.push(String(msg)); },
  logActivity: function(){},
  showTab: function(){},
  sbUuid: function(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || '')); },
  evercareSbEnabled: function(){ return true; },
  readSbSession: function(){ return {access_token: 'office', username: 'Jaz2029', role: 'Scheduler'}; },
  sbRestRpc: function(name, body){
    rpc.push({name: name, body: body});
    if(name === 'list_schedule_week_slots' || name === 'list_schedule_week'){
      if(weekReply)return Promise.resolve({ok: true, data: weekReply});
      return Promise.resolve({ok: false, error: 'skip reload'});
    }
    if(name === 'upsert_schedule_slot_pattern_weekdays'){
      return Promise.resolve({ok: true, data: weekdayReply});
    }
    if(name === 'list_schedule_client_holds'){
      return Promise.resolve({ok: true, data: {holds: []}});
    }
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
  console: console
};
vm.createContext(sandbox);
vm.runInContext(schedSrc + '\n' + slotSrc, sandbox);
assert.strictEqual(sandbox.HOLD_AUTOSAVE1_MARKER, 'v=hold-autosave1');

function emptyDays(start){
  const days = {};
  for(let n = 1; n <= 7; n++){
    days[String(n)] = {on_date: sandbox.schedAddDays(start, n - 1), weekday: n, slots: []};
  }
  return days;
}
function slot(on, key, extra){
  extra = extra || {};
  return {
    slot_key: key,
    label: 'Morning',
    start_local: '08:00:00',
    end_local: '18:00:00',
    hours: extra.hours != null ? extra.hours : 10,
    pattern_hours: 10,
    usual_aide_id: moe,
    aide_name: 'moe',
    sort_order: 0,
    mark: extra.mark || null,
    note: extra.note || null,
    on_hold: !!extra.on_hold,
    hold_id: extra.hold_id || '',
    hold_start: extra.hold_start || '',
    hold_end: extra.hold_end || '',
    deep_link: {client_id: ada, on_date: on, slot_key: key}
  };
}

(async function main(){
  sandbox.schedWeekStart = '2026-09-21';
  sandbox.schedApplySlotWeek({
    week_start: '2026-09-21',
    marker: 'hold-client1',
    v: 'hold-client1',
    clients: [{
      client_id: ada,
      client_name: 'Bowlax Abib',
      weekly_authorized_hours: 60,
      holds: [],
      days: emptyDays('2026-09-21')
    }]
  });
  els.schedSlotClient.value = ada;
  els.schedSlotWeekday.value = '1';
  els.schedSlotKey.value = '';
  els.schedSlotLabel.value = '';
  els.schedSlotStart.value = '08:00';
  els.schedSlotEnd.value = '18:00';
  els.schedSlotAide.value = '';
  els.schedSlotHours.value = '';
  els.schedSlotSort.value = '';
  [1,2,3,4,5,6].forEach(function(wd){ pressed[wd] = true; });
  pressed[7] = false;
  sandbox.schedSlotFormMode = 'add';
  sandbox.schedSlotEditKey = '';
  sandbox.schedSlotEditWeekday = 0;
  sandbox.schedSlotMarkOpen = 'hold:s1';
  els['schedHoldStart-s1'].value = '09/21/2026';
  els['schedHoldEnd-s1'].value = '09/27/2026';
  els['schedHoldNote-s1'].value = 'sticky week';
  els['schedHoldStart-am'].value = '09/21/2026';
  els['schedHoldEnd-am'].value = '09/27/2026';
  els['schedHoldNote-am'].value = 'sticky week';
  rpc.length = 0;
  toasts.length = 0;
  weekdayReply = {ok: true, marker: 'hold-autosave1', v: 'hold-autosave1', holds_written: false, count: 6};
  await sandbox.schedSaveSlotPattern();
  const names = rpc.map(function(c){ return c.name; });
  assert.ok(names.indexOf('upsert_schedule_slot_pattern_weekdays') >= 0, 'Save week posts the weekdays callable');
  assert.ok(!names.some(function(n){ return n === 'upsert_schedule_client_hold'; }), 'filled Start/End did not fire a hold');
  assert.ok(!names.some(function(n){ return n === 'upsert_schedule_slot_day_mark'; }), 'Save week did not post a day mark');
  assert.ok(!names.some(function(n){ return n === 'clear_schedule_client_hold'; }), 'Save week did not clear a hold');
  const saved = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_pattern_weekdays'; })[0];
  assert.strictEqual(saved.body.p_client_id, ada);
  assert.strictEqual(JSON.stringify(saved.body.p_weekdays), JSON.stringify([1,2,3,4,5,6]));
  assert.strictEqual(saved.body.p_hours, 10);
  assert.strictEqual(saved.body.p_start_local, '08:00:00');
  assert.ok(!saved.body.p_start_date && !saved.body.p_mark, 'pattern body is not a hold');
  assert.ok(toasts.indexOf('Shift saved on 6 days.') >= 0, 'Save week tells Mo the shift saved');
  assert.ok(!toasts.some(function(t){ return t.indexOf('must not create a hold') >= 0; }), 'holds_written false is accepted');
  assert.strictEqual(sandbox.schedSlotMarkOpen, '', 'sticky On hold unselects after Save week');
  assert.strictEqual(els['schedHoldStart-s1'].value, '', 'Save week clears sticky Start');
  assert.strictEqual(els['schedHoldEnd-s1'].value, '', 'Save week clears sticky End');
  assert.strictEqual(els['schedHoldNote-s1'].value, '', 'Save week clears sticky Note');

  weekdayReply = {ok: true, marker: 'hold-autosave1', v: 'hold-autosave1', holds_written: true};
  sandbox.schedSlotMarkOpen = 'hold:s1';
  els['schedHoldStart-s1'].value = '09/21/2026';
  els['schedHoldEnd-s1'].value = '09/27/2026';
  rpc.length = 0;
  toasts.length = 0;
  await sandbox.schedSaveSlotPattern();
  assert.ok(!rpc.some(function(c){ return c.name === 'upsert_schedule_client_hold'; }), 'a bad holds_written flag still does not fire a client hold');
  assert.ok(toasts.indexOf('Save week reported a hold write.') >= 0, 'holds_written true is rejected');
  assert.ok(toasts.indexOf('Shift saved on 6 days.') < 0, 'a reported hold write is not a clean Save');

  const workedDays = emptyDays('2026-09-21');
  for(let n = 1; n <= 6; n++){
    const on = workedDays[String(n)].on_date;
    workedDays[String(n)].slots = [slot(on, 's1')];
  }
  sandbox.schedApplySlotWeek({
    week_start: '2026-09-21',
    clients: [{client_id: ada, client_name: 'Bowlax Abib', weekly_authorized_hours: 60, holds: [], days: workedDays}]
  });
  sandbox.schedSelectSlotDay(ada, '2026-09-21', 1, 's1');
  assert.ok(els.schedSlotCards.innerHTML.includes('Assumed worked'), 'saved week paints assumed worked');
  assert.ok(!els.schedSlotCards.innerHTML.includes('data-slot-action="hold" is-on-hold') && !els.schedBody.innerHTML.includes('>On hold<'), 'Save week does not paint On hold');
  assert.ok(els.schedBody.innerHTML.includes('10h'), 'hours stay on the week');

  els['schedHoldStart-s1'].value = '09/21/2026';
  els['schedHoldEnd-s1'].value = '09/27/2026';
  els['schedHoldNote-s1'].value = 'Hospital';
  rpc.length = 0;
  await sandbox.schedWriteHold(ada, '2026-09-21', 's1', false);
  const holdCall = rpc.filter(function(c){ return c.name === 'upsert_schedule_client_hold'; });
  const markCall = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_day_mark'; });
  assert.strictEqual(holdCall.length, 1, 'explicit Save hold still posts the client hold');
  assert.strictEqual(holdCall[0].body.p_start_date, '2026-09-21');
  assert.strictEqual(holdCall[0].body.p_end_date, '2026-09-27');
  assert.strictEqual(holdCall[0].body.p_note, 'Hospital');
  assert.strictEqual(markCall.length, 1, 'explicit Save hold still marks the tapped slot');
  assert.strictEqual(markCall[0].body.p_mark, 'on_hold');

  const openDays = emptyDays('2026-10-05');
  openDays['1'].slots = [slot('2026-10-05', 's1', {hours: 0, on_hold: true, hold_id: holdId, hold_start: '2026-10-03', mark: 'on_hold'})];
  sandbox.schedWeekStart = '2026-10-05';
  sandbox.schedApplySlotWeek({
    week_start: '2026-10-05',
    marker: 'hold-client1',
    clients: [{
      client_id: ada,
      client_name: 'Bowlax Abib',
      holds: [{hold_id: holdId, start_date: '2026-10-03', end_date: '', note: '', open_ended: true, is_active: true}],
      days: openDays
    }]
  });
  sandbox.schedPaint();
  assert.ok(els.schedBody.innerHTML.includes('On hold'), 'an open 10/03 hold still paints On hold');
  assert.ok(els.schedBody.innerHTML.includes('0 hrs'), 'an open hold still paints 0 hrs');
  rpc.length = 0;
  sandbox.schedWeekStart = '2026-09-21';
  await sandbox.schedSaveSlotPattern();
  assert.ok(!rpc.some(function(c){ return c.name === 'clear_schedule_client_hold'; }), 'Save week does not auto-clear the 10/03 hold');

  sandbox.schedWeekStart = '2026-09-21';
  sandbox.schedApplySlotWeek({
    week_start: '2026-09-21',
    clients: [{client_id: ada, client_name: 'Bowlax Abib', holds: [], days: workedDays}]
  });
  sandbox.schedSelectSlotDay(ada, '2026-09-21', 1, 's1');
  sandbox.schedSlotMarkOpen = 'hold:s1';
  els['schedHoldStart-s1'].value = '09/21/2026';
  els['schedHoldEnd-s1'].value = '09/27/2026';
  els['schedHoldNote-s1'].value = 'sticky';
  sandbox.schedPaint();
  rpc.length = 0;
  await sandbox.schedClearHold(ada, '2026-09-21', 's1');
  assert.strictEqual(rpc.length, 0, 'a draft Clear still stays local');
  assert.strictEqual(sandbox.schedSlotMarkOpen, '', 'Clear unselects On hold');
  assert.strictEqual(els['schedHoldStart-s1'].value, '', 'Clear empties Start');
  assert.strictEqual(els['schedHoldEnd-s1'].value, '', 'Clear empties End');
  assert.strictEqual(els['schedHoldNote-s1'].value, '', 'Clear empties Note');
  assert.ok(!els.schedSlotCards.innerHTML.includes('is-on-hold'), 'Clear drops the On hold button');

  els['schedHoldStart-s1'].value = '09/21/2026';
  els['schedHoldEnd-s1'].value = '09/27/2026';
  sandbox.schedSlotMarkOpen = 'hold:s1';
  rpc.length = 0;
  toasts.length = 0;
  await sandbox.schedSaveSlotPattern();
  assert.ok(!rpc.some(function(c){ return c.name === 'upsert_schedule_client_hold'; }), 'Save after Clear does not co-fire a hold');
  assert.strictEqual(els['schedHoldStart-s1'].value, '', 'the next Save does not keep week-bound drafts');

  const holdA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const holdB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const stackDays = emptyDays('2026-09-21');
  stackDays['1'].slots = [slot('2026-09-21', 's1', {hours: 0, on_hold: true, hold_id: holdA, hold_start: '2026-09-21', hold_end: '2026-09-28', mark: 'on_hold'})];
  const stackHolds = [
    {hold_id: holdA, start_date: '2026-09-21', end_date: '2026-09-28', note: 'Hospital', is_active: true},
    {hold_id: holdB, start_date: '2026-10-03', end_date: '', note: 'ER', open_ended: true, is_active: true}
  ];
  let listedHolds = stackHolds.slice();
  let staleWeek = true;
  sandbox.sbRestRpc = function(name, body){
    rpc.push({name: name, body: body});
    if(name === 'list_schedule_client_holds')return Promise.resolve({ok: true, data: {holds: listedHolds}});
    if(name === 'clear_schedule_client_hold'){
      if(body && body.p_client_id && !Object.prototype.hasOwnProperty.call(body, 'p_hold_id')) listedHolds = [];
      else listedHolds = listedHolds.filter(function(h){ return h.hold_id !== body.p_hold_id; });
      return Promise.resolve({ok: true, data: {ok: true}});
    }
    if(name === 'list_schedule_week_slots' || name === 'list_schedule_week'){
      var weekHolds = (staleWeek ? stackHolds : listedHolds).map(function(h){ return Object.assign({}, h); });
      return Promise.resolve({ok: true, data: {
        week_start: '2026-09-21',
        clients: [{client_id: ada, client_name: 'Bowlax Abib', weekly_authorized_hours: 60, holds: weekHolds, days: stackDays}]
      }});
    }
    return Promise.resolve({ok: true, data: {ok: true}});
  };
  sandbox.schedWeekStart = '2026-09-21';
  sandbox.schedHoldTargetId = '';
  sandbox.schedApplySlotWeek({
    week_start: '2026-09-21',
    clients: [{client_id: ada, client_name: 'Bowlax Abib', weekly_authorized_hours: 60, holds: stackHolds, days: stackDays}]
  });
  sandbox.schedSelectSlotDay(ada, '2026-09-21', 1, 's1');
  sandbox.schedPaint();
  assert.ok(els.schedSlotCards.innerHTML.includes('targets hold <span class="hold-id">' + holdA), 'banner names the hold that End hold will change');
  assert.ok(els.schedSlotCards.innerHTML.includes(holdB), 'the other active hold is listed before End hold');
  assert.ok(els.schedSlotCards.innerHTML.includes('also ends every other active hold'), 'the banner says End hold clears the stack');
  assert.ok(els.schedSlotCards.innerHTML.includes('10/03/2026'), 'the open hold shows its start');
  assert.ok(els.schedSlotCards.innerHTML.includes('open'), 'the open hold is labeled open');
  assert.ok(els.schedBody.innerHTML.includes('On hold'), 'the overlapping hospital week still paints On hold');
  els['schedHoldStart-s1'].value = '09/21/2026';
  els['schedHoldEnd-s1'].value = '09/28/2026';
  els['schedHoldNote-s1'].value = 'Hospital';
  rpc.length = 0;
  toasts.length = 0;
  await sandbox.schedWriteHold(ada, '2026-09-21', 's1', true);
  const endedStack = rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; });
  assert.strictEqual(endedStack.length, 1, 'End hold is one client-scoped call');
  assert.strictEqual(endedStack[0].body.p_client_id, ada);
  assert.strictEqual(endedStack[0].body.p_end_date, '2026-09-28');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(endedStack[0].body, 'p_hold_id'), false, 'End hold omits p_hold_id');
  assert.ok(!rpc.some(function(c){ return c.name === 'upsert_schedule_client_hold'; }), 'End hold does not invent a hold');
  assert.ok(toasts.indexOf('Hold ended. The pattern resumes after 09/28/2026.') >= 0, 'one End hold finishes the client');
  assert.ok(toasts.indexOf('Hold ended. Another active hold remains.') < 0, 'End hold does not leave a second hold to end');
  assert.notStrictEqual(sandbox.schedHoldTargetId, holdB);
  const stamped = sandbox.schedFindSlotClient(ada);
  const stampedB = (stamped.holds || []).filter(function(h){ return h.hold_id === holdB; })[0];
  assert.ok(stampedB, 'the ended open hold stays a row with an end date');
  assert.strictEqual(stampedB.end_date, '2026-09-28');
  assert.strictEqual(stampedB.is_active, false, 'a start after the end date does not stay active');
  assert.ok(!els.schedSlotCards.innerHTML.includes(holdB), 'the open leftover is not still the End hold target');
  assert.ok(!els.schedSlotCards.innerHTML.includes('value="10/03/2026"'), 'the leftover start is not left on the form');
  rpc.length = 0;
  await sandbox.schedSaveSlotPattern();
  assert.ok(!rpc.some(function(c){ return c.name === 'upsert_schedule_client_hold' || c.name === 'clear_schedule_client_hold'; }), 'Save week does not co-fire or delete a hold');
  const laterDays = emptyDays('2026-10-05');
  laterDays['1'].slots = [slot('2026-10-05', 's1')];
  sandbox.schedFilterHold = true;
  sandbox.schedApplySlotWeek({
    week_start: '2026-10-05',
    clients: [{
      client_id: ada,
      client_name: 'Bowlax Abib',
      weekly_authorized_hours: 60,
      holds: [
        {hold_id: holdA, start_date: '2026-09-21', end_date: '2026-09-28', note: 'Hospital', is_active: true},
        {hold_id: holdB, start_date: '2026-10-03', end_date: '2026-09-28', note: 'ER', is_active: true}
      ],
      days: laterDays
    }]
  });
  sandbox.schedPaint();
  assert.ok(!els.schedBody.innerHTML.includes('Bowlax'), 'On hold filter skips later weeks after every hold was ended');
  assert.ok(!els.schedBody.innerHTML.includes('On hold'), 'an ended stack does not paint a later week');
  sandbox.schedFilterHold = false;
  staleWeek = false;

  listedHolds = [stackHolds[0]];
  sandbox.schedHoldTargetId = '';
  sandbox.schedApplySlotWeek({
    week_start: '2026-09-21',
    clients: [{client_id: ada, client_name: 'Bowlax Abib', weekly_authorized_hours: 60, holds: [stackHolds[0]], days: stackDays}]
  });
  sandbox.schedSelectSlotDay(ada, '2026-09-21', 1, 's1');
  els['schedHoldStart-s1'].value = '09/21/2026';
  els['schedHoldEnd-s1'].value = '';
  els['schedHoldNote-s1'].value = 'Hospital';
  rpc.length = 0;
  toasts.length = 0;
  await sandbox.schedWriteHold(ada, '2026-09-21', 's1', true);
  assert.strictEqual(rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; }).length, 1, 'a single hold still ends once');
  assert.strictEqual(rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; })[0].body.p_client_id, ada);
  assert.strictEqual(rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; })[0].body.p_end_date, '2026-09-21');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; })[0].body, 'p_hold_id'), false);
  assert.ok(toasts.indexOf('Hold ended. The pattern resumes after 09/21/2026.') >= 0, 'one hold still uses the end-date chrome');
  assert.ok(toasts.indexOf('Hold ended. Another active hold remains.') < 0, 'one hold does not pretend another remains');

  const clearDays = emptyDays('2026-09-21');
  clearDays['1'].slots = [slot('2026-09-21', 's1', {hours: 0, on_hold: true, hold_id: holdA, hold_start: '2026-09-21', hold_end: '2026-09-28', mark: 'on_hold'})];
  listedHolds = stackHolds.map(function(h){ return Object.assign({}, h); });
  staleWeek = false;
  sandbox.schedHoldTargetId = '';
  sandbox.schedFilterHold = false;
  sandbox.schedApplySlotWeek({
    week_start: '2026-09-21',
    clients: [{client_id: ada, client_name: 'Bowlax Abib', weekly_authorized_hours: 60, holds: listedHolds.slice(), days: clearDays}]
  });
  sandbox.schedSelectSlotDay(ada, '2026-09-21', 1, 's1');
  rpc.length = 0;
  await sandbox.schedClearHold(ada, '2026-09-21', 's1');
  const soft = rpc.filter(function(c){ return c.name === 'clear_schedule_client_hold'; });
  assert.strictEqual(soft.length, 1, 'Clear is one client-scoped call');
  assert.strictEqual(soft[0].body.p_client_id, ada);
  assert.ok(!Object.prototype.hasOwnProperty.call(soft[0].body, 'p_hold_id'), 'Clear omits p_hold_id');
  assert.ok(!Object.prototype.hasOwnProperty.call(soft[0].body, 'p_end_date'), 'Clear omits p_end_date');
  assert.strictEqual(listedHolds.length, 0, 'Clear-all drops every active hold for the client');

  await shots();
  console.log('admin-hold-autosave1-test ok');
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
      console.log('hold-autosave1 browser skipped (no puppeteer-core)');
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
  const adaId = ada;
  const moeId = moe;
  const hold = '88888888-8888-4888-8888-888888888888';
  try {
    const phone = await browser.newPage();
    await phone.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await phone.goto('http://127.0.0.1:' + port + '/index.html?v=hold-autosave1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await phone.evaluate(function(adaId, moeId, hold){
      window.__calls = [];
      window.__phase = 'empty';
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'Jaz2029';
      readSbSession = function(){ return {access_token: 'office', username: 'Jaz2029', role: 'Scheduler'}; };
      loadedAidesList = [{id: moeId, username: 'moe', name: 'moe', is_active: true}];
      function days(start, fill){
        var out = {};
        for(var n = 1; n <= 7; n++){
          var on = schedAddDays(start, n - 1);
          var slots = [];
          if(fill && n <= 6){
            slots.push({
              slot_key: 's1', label: 'Morning', start_local: '08:00:00', end_local: '18:00:00',
              hours: window.__phase === 'held' ? 0 : 10, pattern_hours: 10,
              usual_aide_id: moeId, aide_name: 'moe', sort_order: 0,
              mark: window.__phase === 'held' ? 'on_hold' : null,
              on_hold: window.__phase === 'held',
              hold_id: window.__phase === 'held' ? hold : '',
              hold_start: window.__phase === 'held' ? '2026-09-21' : '',
              hold_end: window.__phase === 'held' ? '2026-09-27' : '',
              hold_note: window.__phase === 'held' ? 'Hospital' : '',
              note: null,
              deep_link: {client_id: adaId, on_date: on, slot_key: 's1'}
            });
          }
          out[String(n)] = {on_date: on, weekday: n, slots: slots, day_hours: slots.length ? (window.__phase === 'held' ? 0 : 10) : 0};
        }
        return out;
      }
      window.__week = function(){
        return {
          week_start: '2026-09-21',
          marker: 'hold-client1',
          v: 'hold-client1',
          clients: [{
            client_id: adaId,
            client_name: 'Bowlax Abib',
            weekly_authorized_hours: 60,
            holds: window.__phase === 'held' ? [{hold_id: hold, start_date: '2026-09-21', end_date: '2026-09-27', note: 'Hospital', is_active: true}] : [],
            days: days('2026-09-21', window.__phase !== 'empty')
          }]
        };
      };
      sbRestRpc = async function(name, body){
        window.__calls.push({name: name, body: body});
        if(name === 'upsert_schedule_slot_pattern_weekdays' || name === 'upsert_schedule_slot_pattern'){
          window.__phase = 'worked';
          return {ok: true, data: {ok: true, marker: 'hold-autosave1', v: 'hold-autosave1', holds_written: false, count: 6}};
        }
        if(name === 'upsert_schedule_client_hold'){
          window.__phase = 'held';
          return {ok: true, data: {ok: true, hold_id: hold}};
        }
        if(name === 'list_schedule_week_slots' || name === 'list_schedule_week'){
          return {ok: true, data: window.__week()};
        }
        if(name === 'list_schedule_client_holds'){
          return {ok: true, data: {holds: window.__phase === 'held' ? window.__week().clients[0].holds : []}};
        }
        return {ok: true, data: {ok: true}};
      };
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.getElementById('tab_schedule').classList.add('active');
      var sheet = document.getElementById('copilotSheet');
      if(sheet)sheet.hidden = true;
      schedWeekStart = '2026-09-21';
      schedApplySlotWeek(window.__week());
      schedSelectSlotDay(adaId, '2026-09-21', 1, '');
      schedSetSlotFormMode('add');
      schedSetDayChecks([1,2,3,4,5,6]);
      document.getElementById('schedSlotStart').value = '08:00';
      document.getElementById('schedSlotEnd').value = '18:00';
      schedSyncAutoHours();
    }, adaId, moeId, hold);

    const before = await phone.evaluate(function(){ return window.__calls.length; });
    await phone.evaluate(function(){
      document.getElementById('schedSlotSavePattern').scrollIntoView({block: 'center'});
      document.getElementById('schedSlotSavePattern').click();
    });
    await phone.waitForFunction(function(){
      return window.__phase === 'worked' && document.body.innerText.indexOf('Assumed worked') >= 0;
    });
    const saved = await phone.evaluate(function(before){
      var added = window.__calls.slice(before);
      var card = document.querySelector('.sched-slot-card');
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        names: added.map(function(c){ return c.name; }),
        holds: added.filter(function(c){ return c.name === 'upsert_schedule_client_hold' || (c.body && c.body.p_mark === 'on_hold'); }).length,
        holdsWritten: added.filter(function(c){ return c.name === 'upsert_schedule_slot_pattern_weekdays'; }).map(function(c){ return c; }),
        assumed: card ? card.querySelector('.sched-mark.is-assumed').textContent.trim() : '',
        hrs: card ? card.querySelector('.sched-hrs-pill').textContent.trim() : '',
        holdChips: document.querySelectorAll('#schedScroll .sched-chip.is-hold').length,
        who: document.getElementById('schedSlotClientName').textContent,
        when: document.getElementById('schedSlotWhen').textContent
      };
    }, before);
    assert.strictEqual(saved.build, '2026-09-27-hold-autosave1');
    assert.ok(saved.names.indexOf('upsert_schedule_slot_pattern_weekdays') >= 0, saved.names.join(','));
    assert.strictEqual(saved.holds, 0, 'phone Save week fired no hold RPC');
    assert.strictEqual(saved.assumed, 'Assumed worked');
    assert.strictEqual(saved.hrs, '10 hrs');
    assert.strictEqual(saved.holdChips, 0);
    assert.ok(saved.who.indexOf('Bowlax') >= 0, saved.who);
    assert.ok(saved.when.indexOf('09/21/2026') >= 0, saved.when);
    await phone.evaluate(function(){
      var mark = document.querySelector('.sched-mark.is-assumed');
      var card = mark ? mark.closest('.sched-slot-card') : document.querySelector('.sched-slot-card');
      if(!card)return;
      card.scrollIntoView({block: 'start', inline: 'nearest'});
      var top = card.getBoundingClientRect().top;
      if(top < 64 || top > 120)window.scrollBy(0, top - 72);
    });
    await phone.screenshot({path: path.join(outDir, 'hold-autosave1-phone-save-week-assumed.png')});

    const beforeHold = await phone.evaluate(function(){ return window.__calls.length; });
    await phone.evaluate(function(){
      var btn = document.querySelector('[data-slot-action="hold"]');
      btn.scrollIntoView({block: 'center'});
      btn.click();
    });
    await phone.waitForSelector('#schedHoldStart-s1');
    await phone.evaluate(function(){
      document.getElementById('schedHoldStart-s1').value = '09/21/2026';
      document.getElementById('schedHoldEnd-s1').value = '09/27/2026';
      document.getElementById('schedHoldNote-s1').value = 'Hospital';
      document.querySelector('[data-slot-action="save-hold"]').click();
    });
    await phone.waitForFunction(function(){
      return window.__phase === 'held' && document.body.innerText.indexOf('On hold') >= 0 && document.body.innerText.indexOf('0 hrs') >= 0;
    });
    const held = await phone.evaluate(function(before){
      var added = window.__calls.slice(before);
      var card = document.querySelector('.sched-slot-card.is-hold');
      return {
        names: added.map(function(c){ return c.name; }),
        hold: added.filter(function(c){ return c.name === 'upsert_schedule_client_hold'; })[0],
        mark: added.filter(function(c){ return c.name === 'upsert_schedule_slot_day_mark'; })[0],
        badge: card ? card.querySelector('.sched-mark.is-hold').textContent.replace(/\s+/g, ' ').trim() : '',
        hrs: card ? card.querySelector('.sched-hrs-pill').textContent.trim() : '',
        banner: document.querySelector('.hold-banner') ? document.querySelector('.hold-banner').textContent.replace(/\s+/g, ' ').trim() : '',
        chip: document.querySelector('#schedScroll .sched-chip.is-hold') ? document.querySelector('#schedScroll .sched-chip.is-hold').innerText.replace(/\s+/g, ' ').trim() : ''
      };
    }, beforeHold);
    assert.ok(held.names.indexOf('upsert_schedule_client_hold') >= 0, held.names.join(','));
    assert.strictEqual(held.hold.body.p_start_date, '2026-09-21');
    assert.strictEqual(held.hold.body.p_end_date, '2026-09-27');
    assert.strictEqual(held.hold.body.p_note, 'Hospital');
    assert.strictEqual(held.mark.body.p_mark, 'on_hold');
    assert.ok(held.badge.indexOf('On hold') >= 0, held.badge);
    assert.strictEqual(held.hrs, '0 hrs');
    assert.ok(held.banner.indexOf('Hospital') >= 0, held.banner);
    assert.ok(held.chip.indexOf('0 hrs') >= 0, held.chip);
    await phone.evaluate(function(){
      var mark = document.querySelector('.sched-mark.is-hold');
      var card = mark ? mark.closest('.sched-slot-card') : document.querySelector('.sched-slot-card.is-hold');
      if(!card)return;
      card.scrollIntoView({block: 'start', inline: 'nearest'});
      var top = card.getBoundingClientRect().top;
      if(top < 64 || top > 120)window.scrollBy(0, top - 72);
    });
    await phone.screenshot({path: path.join(outDir, 'hold-autosave1-phone-save-hold.png')});

    const holdA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const holdB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    await phone.evaluate(function(holdA, holdB, adaId){
      window.__stack = [
        {hold_id: holdA, start_date: '2026-09-21', end_date: '2026-09-28', note: 'Hospital', is_active: true},
        {hold_id: holdB, start_date: '2026-10-03', end_date: '', note: 'ER', open_ended: true, is_active: true}
      ];
      sbRestRpc = async function(name, body){
        window.__calls.push({name: name, body: body});
        if(name === 'list_schedule_client_holds')return {ok: true, data: {holds: window.__stack}};
        if(name === 'clear_schedule_client_hold'){
          if(body && body.p_client_id && !Object.prototype.hasOwnProperty.call(body, 'p_hold_id')) window.__stack = [];
          else window.__stack = window.__stack.filter(function(h){ return h.hold_id !== body.p_hold_id; });
          return {ok: true, data: {ok: true}};
        }
        if(name === 'list_schedule_week_slots' || name === 'list_schedule_week'){
          var week = window.__week();
          week.clients[0].holds = window.__stack.slice();
          var slot = week.clients[0].days['1'] && week.clients[0].days['1'].slots[0];
          if(slot){
            slot.mark = 'on_hold';
            slot.on_hold = true;
            slot.hours = 0;
            slot.hold_id = holdA;
            slot.hold_start = '2026-09-21';
            slot.hold_end = '2026-09-28';
            slot.hold_note = 'Hospital';
          }
          return {ok: true, data: week};
        }
        return {ok: true, data: {ok: true}};
      };
      schedHoldTargetId = '';
      var week = window.__week();
      week.clients[0].holds = window.__stack.slice();
      var slot = week.clients[0].days['1'].slots[0];
      slot.mark = 'on_hold';
      slot.on_hold = true;
      slot.hours = 0;
      slot.hold_id = holdA;
      slot.hold_start = '2026-09-21';
      slot.hold_end = '2026-09-28';
      slot.hold_note = 'Hospital';
      schedApplySlotWeek(week);
      schedSelectSlotDay(adaId, '2026-09-21', 1, 's1');
      schedPaint();
    }, holdA, holdB, ada);
    await phone.waitForFunction(function(holdA, holdB){
      var text = document.body.innerText;
      return text.indexOf(holdA) >= 0 && text.indexOf(holdB) >= 0 && text.indexOf('10/03/2026') >= 0;
    }, {}, holdA, holdB);
    await phone.evaluate(function(){
      var stack = document.querySelector('.hold-stack') || document.querySelector('.hold-banner');
      if(!stack)return;
      stack.scrollIntoView({block: 'start', inline: 'nearest'});
      var top = stack.getBoundingClientRect().top;
      if(top < 64 || top > 160)window.scrollBy(0, top - 88);
    });
    await phone.screenshot({path: path.join(outDir, 'hold-autosave1-phone-stacked-before-end.png')});
    await phone.evaluate(function(){
      var start = document.getElementById('schedHoldStart-s1');
      var end = document.getElementById('schedHoldEnd-s1');
      var note = document.getElementById('schedHoldNote-s1');
      if(start)start.value = '09/21/2026';
      if(end)end.value = '09/28/2026';
      if(note)note.value = 'Hospital';
      var btn = document.querySelector('[data-slot-action="end-hold"]');
      btn.scrollIntoView({block: 'center'});
      btn.click();
    });
    await phone.waitForFunction(function(adaId){
      var calls = window.__calls.filter(function(c){ return c.name === 'clear_schedule_client_hold'; });
      var text = document.body.innerText;
      var body = calls[0] && calls[0].body;
      return calls.length === 1 && body && body.p_client_id === adaId && body.p_end_date === '2026-09-28' && !Object.prototype.hasOwnProperty.call(body, 'p_hold_id') && text.indexOf('The pattern resumes after') >= 0 && text.indexOf('Another active hold remains') < 0;
    }, {}, ada);
    await phone.evaluate(function(holdA, holdB, adaId){
      schedFilterHold = true;
      var days = {};
      var start = new Date('2026-10-05T12:00:00Z');
      for(var wd = 1; wd <= 7; wd++){
        var dt = new Date(start.getTime());
        dt.setUTCDate(start.getUTCDate() + wd - 1);
        var iso = dt.toISOString().slice(0, 10);
        days[String(wd)] = {
          weekday: wd,
          on_date: iso,
          day_hours: wd === 1 ? 10 : 0,
          slots: wd === 1 ? [{slot_key: 's1', hours: 10, aide_name: 'Amina Hassan'}] : []
        };
      }
      schedApplySlotWeek({
        week_start: '2026-10-05',
        clients: [{
          client_id: adaId,
          client_name: 'Bowlax Abib',
          weekly_authorized_hours: 60,
          holds: [
            {hold_id: holdA, start_date: '2026-09-21', end_date: '2026-09-28', note: 'Hospital', is_active: true},
            {hold_id: holdB, start_date: '2026-10-03', end_date: '2026-09-28', note: 'ER', is_active: true}
          ],
          days: days
        }]
      });
      schedPaint();
      var btn = document.getElementById('schedFilterHold');
      if(btn)btn.scrollIntoView({block: 'start', inline: 'nearest'});
    }, holdA, holdB, ada);
    await phone.waitForFunction(function(){
      var body = document.getElementById('schedBody');
      return body && body.innerText.indexOf('Bowlax') < 0 && body.innerText.indexOf('On hold') < 0;
    });
    await phone.screenshot({path: path.join(outDir, 'hold-autosave1-phone-end-clears-stacked.png')});
    console.log('hold-autosave1 phone shots ok');
  } finally {
    await browser.close();
    server.close();
  }
}
