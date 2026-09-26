#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=clienthrs1b'), 'clienthrs1b marker');
assert.ok(html.includes('data-clienthrs1b="v=clienthrs1b"'), 'clienthrs1b data attr');
assert.ok(html.includes('admin-build 2026-09-26-clienthrs1b'), 'clienthrs1b build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-clienthrs1b">'), 'clienthrs1b meta');
assert.ok(html.includes('<!-- schedule multi-slot 2026-09-26 v=clienthrs1b admin-build 2026-09-26-clienthrs1b'), 'clienthrs1b comment');
assert.ok(html.includes('GHOST-CLIENTHRS1B-CONTRACT-v1'), 'clienthrs1b contract');
assert.ok(html.includes("var CLIENTHRS1B_MARKER='v=clienthrs1b'"), 'clienthrs1b script marker');
assert.ok(html.includes('CLIENTHRS'), 'CLIENTHRS marker string');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-26-clienthrs1b'), 'clienthrs1b is the first admin-build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-clienthrs1a">'), 'clienthrs1a meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidechat1">'), 'aidechat1 meta stays');
assert.ok(html.indexOf('content="2026-09-26-clienthrs1b"') < html.indexOf('content="2026-09-26-clienthrs1a"'), 'clienthrs1a stays below clienthrs1b');
assert.ok(html.indexOf('content="2026-09-26-clienthrs1a"') < html.indexOf('content="2026-09-25-aidechat1"'), 'aidechat1 stays below clienthrs1a');
assert.ok(html.includes('Remi stays the side rail on the right only'), 'Remi stays a right side rail');
assert.ok(html.includes('No full-page Remi'), 'no full-page Remi');
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page tab');

const schedStart = html.indexOf('// admin schedule v=sched1');
const schedEnd = html.indexOf('// end admin schedule v=sched1');
const slotStart = html.indexOf('// schedule multi-slot v=clienthrs1b');
const slotEnd = html.indexOf('// end schedule multi-slot v=clienthrs1b');
assert.ok(schedStart > 0 && schedEnd > schedStart, 'single-slot schedule block stays');
assert.ok(slotStart > schedEnd && slotEnd > slotStart, 'multi-slot block follows schedule v1');
const schedSrc = html.slice(schedStart, schedEnd);
const slotSrc = html.slice(slotStart, slotEnd);
assert.ok(schedSrc.includes("sbRestRpc('list_schedule_week'"), 'list_schedule_week stays in the single-slot block');
assert.ok(!schedSrc.includes('list_schedule_week_slots'), 'single-slot block does not switch RPCs');
assert.ok(slotSrc.includes("sbRestRpc('list_schedule_week_slots'"), 'week board prefers list_schedule_week_slots');
assert.ok(slotSrc.includes('p_week_start'), 'slots week arg');
assert.ok(slotSrc.includes("sbRestRpc('upsert_schedule_slot_pattern'"), 'upsert slot pattern');
assert.ok(slotSrc.includes('p_client_id') && slotSrc.includes('p_weekday') && slotSrc.includes('p_slot_key'), 'pattern keys');
assert.ok(slotSrc.includes('p_usual_aide_id') && slotSrc.includes('p_hours') && slotSrc.includes('p_label'), 'pattern fields');
assert.ok(slotSrc.includes('p_start_local') && slotSrc.includes('p_end_local') && slotSrc.includes('p_sort_order'), 'pattern time and order');
assert.ok(slotSrc.includes("sbRestRpc('delete_schedule_slot_pattern'"), 'delete slot pattern');
assert.ok(slotSrc.includes("sbRestRpc('upsert_schedule_slot_day_mark'"), 'upsert day mark');
assert.ok(slotSrc.includes('p_on_date') && slotSrc.includes('p_mark') && slotSrc.includes('p_cover_aide_id') && slotSrc.includes('p_note'), 'mark args');
assert.ok(slotSrc.includes("sbRestRpc('clear_schedule_slot_day_mark'"), 'clear day mark');
assert.ok(slotSrc.includes("mark==='worked'") && slotSrc.includes("mark==='missed'") && slotSrc.includes("mark==='cover'"), 'mark values');
assert.ok(slotSrc.includes('client_id') && slotSrc.includes('on_date') && slotSrc.includes('slot_key'), 'deep link shape fields');
assert.ok(slotSrc.includes('SCHEDULE_SLOT_DEEP_LINK_SHAPE'), 'deep link shape is documented in script');
assert.ok(!/localStorage/.test(slotSrc), 'slot schedule does not use localStorage');
assert.ok(!/reset_aide_temp_password/.test(slotSrc), 'no password reseal in this tip');
assert.ok(html.includes('.sched-scroll{max-height:640px') && html.includes('touch-action:pan-x pan-y'), 'week swipe scroller stays');
assert.ok(html.includes('min-width:max(100%,52rem)'), 'week grid stays wider than a phone');
assert.ok(/@media\(max-width:768px\)\{[^}]*#tab_schedule \.sched-swipe-hint\{display:block/.test(html), 'phone swipe hint');
assert.ok(html.includes('.sched-slot-ctrls .btn{min-height:44px'), 'mark controls are tappable');
assert.ok(html.includes('@media(max-width:900px)') && html.includes('.sched-slot-detail{width:100%'), 'day detail stacks on a phone');

const askJs = html.slice(html.indexOf('// v=remiask1 status look-ups'), html.indexOf('function remiSecAnswer(q)'));
assert.ok(askJs.includes('function remiAskSlotMarks'), 'Remi reads schedule marks from the desk');
assert.ok(askJs.includes('function remiAskIsMark') && askJs.includes('function remiAskIsPay'), 'mark and pay intents are separate');
assert.ok(askJs.indexOf('if(/\\b(ready|held)\\b/.test(s)&&!/\\b(cover|shift)\\b/.test(s))') < 0, 'a name containing Ready does not open pay readiness');
assert.ok(askJs.includes('if(/\\bschedule for\\b/.test(s)&&!remiAskIsMark(s))return true;'), 'schedule for does not swallow mark asks');
const findBody = askJs.slice(askJs.indexOf('function remiAskSlotFindClient'), askJs.indexOf('function remiAskSlotDayOf'));
assert.ok(findBody.indexOf('copilotMention') < 0 && findBody.indexOf('remiAskPersonHit') < 0, 'slot client match does not use any-token mention');
assert.ok(findBody.indexOf('remiAskSlotExactClient') >= 0 && findBody.indexOf('remiAskSlotClientByFocus') >= 0, 'full name and focus beat a fuzzy hit');
const askBody = askJs.slice(askJs.indexOf('function remiAskAnswer'));
const markAt = askBody.indexOf('remiAskIsMark');
const skipAt = askBody.indexOf('remiAskSkip');
const payAt = askBody.indexOf('remiAskIsPay');
assert.ok(markAt > 0 && skipAt > markAt && payAt > markAt, 'mark readout runs before skip and pay');
assert.ok(!/sbRestRpc|fetch\(/.test(askJs), 'mark readout stays on desk data');

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
    classList: {
      add: function(){},
      remove: function(){},
      toggle: function(){}
    },
    dataset: {},
    style: {},
    setAttribute: function(k, v){ this[k] = v; },
    getAttribute: function(k){ return this[k]; },
    addEventListener: function(){},
    scrollIntoView: function(){ this.scrolled = true; },
    querySelector: function(){ return null; }
  };
  els[id] = el;
  return el;
}
['schedWeekLabel','schedSourceNote','schedNoClients','schedEmpty','schedEmptyAdd','schedScroll','schedHead','schedBody','schedPanel','schedSlotDetail','schedSlotClientName','schedSlotAuth','schedSlotWhen','schedSlotWeekStat','schedSlotDaySum','schedSlotCards','schedSlotPattern','schedSlotPatternTitle','schedSlotClient','schedSlotWeekday','schedSlotKey','schedSlotLabel','schedSlotStart','schedSlotEnd','schedSlotAide','schedSlotHours','schedSlotSort','schedIntro','schedAddUsualBtn','schedFilterCalloff','schedFilterAll','schedFilterOpen','schedSearch','tab_schedule','schedViewWeek','schedViewDay'].forEach(makeEl);

const sandbox = {
  allClients: [],
  loadedAidesList: [],
  allAidesForAssign: [],
  currentAdminRole: 'Admin',
  location: {search: '', hash: ''},
  document: {
    getElementById: function(id){ return els[id] || null; }
  },
  showTempMsg: function(msg){ toasts.push(String(msg)); },
  logActivity: function(){},
  showTab: function(){},
  sbUuid: function(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v || '')); },
  evercareSbEnabled: function(){ return true; },
  readSbSession: function(){ return {access_token: 'office'}; },
  sbRestRpc: function(name, body){
    rpc.push({name: name, body: body});
    return Promise.resolve({ok: true, data: {clients: []}});
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

assert.strictEqual(sandbox.CLIENTHRS1B_MARKER, 'v=clienthrs1b');
assert.deepStrictEqual(Object.keys(sandbox.SCHEDULE_SLOT_DEEP_LINK_SHAPE).sort(), ['client_id', 'on_date', 'slot_key']);
assert.strictEqual(sandbox.schedSlotToward({hours: 5, pattern_hours: 5, mark: ''}), 5, 'unmarked uses pattern hours');
assert.strictEqual(sandbox.schedSlotToward({hours: 5, pattern_hours: 5, mark: 'worked'}), 5, 'worked uses pattern hours');
assert.strictEqual(sandbox.schedSlotToward({hours: 3, pattern_hours: 5, mark: 'worked'}), 3, 'worked honors hours override');
assert.strictEqual(sandbox.schedSlotToward({hours: 4, pattern_hours: 4, mark: 'cover'}), 4, 'cover uses pattern hours');
assert.strictEqual(sandbox.schedSlotToward({hours: 2, pattern_hours: 4, mark: 'cover'}), 2, 'cover honors hours override');
assert.strictEqual(sandbox.schedSlotToward({hours: 5, pattern_hours: 5, mark: 'missed'}), 0, 'missed counts as zero');
assert.strictEqual(sandbox.schedNormSlotKey(' AM '), 'am');
assert.strictEqual(sandbox.schedNormSlotKey('no spaces'), '');

const parsed = sandbox.schedParseDeepLink('?client_id=ada-1&on_date=2026-09-30&slot_key=AM', '');
assert.strictEqual(parsed.client_id, 'ada-1');
assert.strictEqual(parsed.on_date, '2026-09-30');
assert.strictEqual(parsed.slot_key, 'am');
const hashed = sandbox.schedParseDeepLink('', '#schedule?client_id=ada-1&on_date=2026-09-30&slot_key=pm');
assert.strictEqual(hashed.slot_key, 'pm');
assert.strictEqual(sandbox.schedParseDeepLink('?client_id=ada-1&on_date=2026-09-30&slot_key=Bad Key', ''), null);

const ada = '11111111-1111-4111-8111-111111111111';
const sara = '22222222-2222-4222-8222-222222222222';
const kim = '33333333-3333-4333-8333-333333333333';
function slot(key, label, aideId, aideName, hours, sort, start, end, mark){
  return {
    slot_key: key,
    label: label,
    start_local: start,
    end_local: end,
    hours: hours,
    pattern_hours: hours,
    usual_aide_id: aideId,
    aide_name: aideName,
    sort_order: sort,
    mark: mark || null,
    cover_aide_id: null,
    cover_aide_name: null,
    note: null,
    deep_link: {client_id: ada, on_date: '2026-09-23', slot_key: key}
  };
}
function weekPayload(amMark, pmMark){
  const days = {};
  for(let n = 1; n <= 7; n++){
    const on = sandbox.schedAddDays('2026-09-21', n - 1);
    const slots = (n >= 1 && n <= 5) ? [
      slot('am', 'Morning', sara, 'Sara Cole', 5, 0, '08:00:00', '13:00:00', n === 3 ? amMark : null),
      slot('pm', 'Evening', kim, 'Kim Lee', 4, 1, '16:00:00', '20:00:00', n === 3 ? pmMark : null)
    ] : [];
    slots.forEach(function(s){ s.deep_link = {client_id: ada, on_date: on, slot_key: s.slot_key}; });
    days[String(n)] = {on_date: on, weekday: n, day_hours: 0, slots: slots};
  }
  return {
    week_start: '2026-09-21',
    week_end: '2026-09-27',
    clients: [
      {client_id: ada, client_name: 'Ada Cole', weekly_authorized_hours: 63, days: days},
      {client_id: 'ben', client_name: 'Ben Ruiz', weekly_authorized_hours: 27, days: {'1': {on_date: '2026-09-21', slots: [slot('day', 'Day', sara, 'Moe Hart', 4, 0, '09:00:00', '13:00:00', null)]}}}
    ]
  };
}

sandbox.schedApplyWeek(weekPayload(null, null));
assert.strictEqual(sandbox.schedSlotMode, true, 'slot payload turns on multi-chip mode');
assert.strictEqual(sandbox.schedWeekStart, '2026-09-21');
const wed = sandbox.schedFindSlotClient(ada).days['3'];
assert.strictEqual(wed.slots.length, 2);
assert.strictEqual(wed.day_hours, 9, '5 + 4 toward the bucket');
assert.strictEqual(sandbox.schedFindSlotClient(ada).week_hours, 45, 'five days of 9');
sandbox.schedPaint();
assert.ok(els.schedBody.innerHTML.includes('Sara'), 'week chip shows Sara');
assert.ok(els.schedBody.innerHTML.includes('Kim'), 'week chip shows Kim');
assert.ok(els.schedBody.innerHTML.includes('sched-chip'), 'stacked chip class');
assert.ok(els.schedBody.innerHTML.includes('is-pm'), 'second shift uses the evening chip');
assert.ok(els.schedBody.innerHTML.includes('63 hrs/week'), 'authorized hours badge');
assert.ok(els.schedBody.innerHTML.includes('>5h<') || els.schedBody.innerHTML.includes('5h'), 'morning hours on the chip');
assert.ok(els.schedSlotDaySum.textContent.includes('9 hrs'), 'day detail totals both shifts');
assert.ok(els.schedSlotCards.innerHTML.includes('Morning'), 'day detail lists the morning slot');
assert.ok(els.schedSlotCards.innerHTML.includes('data-slot-action="missed"'), 'missed mark control');
assert.ok(els.schedSlotCards.innerHTML.includes('data-slot-action="worked"'), 'worked mark control');
assert.ok(els.schedSlotCards.innerHTML.includes('Swap cover'), 'cover control');
assert.ok(els.schedSlotCards.innerHTML.includes('data-deep-link=') && els.schedSlotCards.innerHTML.includes('slot_key') && els.schedSlotCards.innerHTML.includes('on_date'), 'deep link shape is on the slot');
assert.strictEqual(els.schedSlotDetail.hidden, false, 'day detail is open beside the week');

sandbox.schedApplyWeek({
  week_start: '2026-09-21',
  clients: [{client_id: 'ada', client_name: 'Ada Client', days: {'1': {hours: 4, aide_id: 'a1', aide_name: 'Sara', source: 'pattern'}}}]
});
assert.strictEqual(sandbox.schedSlotMode, false, 'single-slot payload keeps the old board');
sandbox.schedPaint();
assert.ok(els.schedBody.innerHTML.includes('Sara 4h') || els.schedBody.innerHTML.includes('Sara'), 'old cell text still paints');

sandbox.schedApplySlotWeek(weekPayload('missed', 'worked'));
const marked = sandbox.schedFindSlotClient(ada).days['3'];
assert.strictEqual(sandbox.schedSlotToward(marked.slots[0]), 0);
assert.strictEqual(sandbox.schedSlotToward(marked.slots[1]), 4);
assert.strictEqual(marked.day_hours, 4, 'missed morning drops out of the day bucket');
sandbox.schedSelectSlotDay(ada, '2026-09-23', 3);
sandbox.schedPaint();
assert.ok(els.schedBody.innerHTML.includes('is-missed'), 'missed chip is marked');
assert.ok(els.schedSlotCards.innerHTML.includes('Missed / no-show'), 'day detail shows the missed mark');
assert.ok(els.schedSlotCards.innerHTML.includes('no cover'), 'missed without a cover aide shows the hour loss');
assert.ok(els.schedSlotCards.innerHTML.includes('✓ Worked'), 'evening shows worked');

sandbox.schedFocusDeepLink({client_id: ada, on_date: '2026-09-23', slot_key: 'pm'});
assert.strictEqual(sandbox.schedSlotView, 'day');
assert.strictEqual(sandbox.schedSlotFocus.slot_key, 'pm');
assert.strictEqual(sandbox.schedSlotSelected.onDate, '2026-09-23');
assert.ok(els.schedSlotCards.innerHTML.includes('is-focus'), 'focused slot is highlighted');

(async function(){
rpc.length = 0;
sandbox.sbRestRpc = function(name, body){
  rpc.push({name: name, body: body});
  if(name === 'list_schedule_week_slots') return Promise.resolve({ok: false, status: 404, error: 'missing'});
  if(name === 'list_schedule_week') return Promise.resolve({ok: true, data: {week_start: '2026-09-21', clients: []}});
  return Promise.resolve({ok: false, error: 'missing'});
};
await sandbox.schedLoadWeek('2026-09-21');
assert.ok(rpc.some(function(c){ return c.name === 'list_schedule_week_slots' && c.body.p_week_start === '2026-09-21'; }), 'loader tries slots first');
assert.ok(rpc.some(function(c){ return c.name === 'list_schedule_week' && c.body.p_week_start === '2026-09-21'; }), 'loader falls back to list_schedule_week');
assert.strictEqual(sandbox.schedSlotMode, false);

rpc.length = 0;
sandbox.sbRestRpc = function(name, body){
  rpc.push({name: name, body: body});
  if(name === 'list_schedule_week_slots') return Promise.resolve({ok: true, data: weekPayload(null, null)});
  return Promise.resolve({ok: true, data: {deep_link: {client_id: body.p_client_id, on_date: body.p_on_date || '2026-09-23', slot_key: body.p_slot_key}}});
};
await sandbox.schedLoadWeek('2026-09-21');
assert.strictEqual(sandbox.schedSlotMode, true);
assert.ok(!rpc.some(function(c){ return c.name === 'list_schedule_week'; }), 'a live slots week does not call the single-slot RPC');

els.schedSlotClient.value = ada;
els.schedSlotWeekday.value = '3';
els.schedSlotKey.value = 'AM';
els.schedSlotLabel.value = 'Morning';
els.schedSlotStart.value = '08:00';
els.schedSlotEnd.value = '13:00';
els.schedSlotAide.value = sara;
els.schedSlotHours.value = '5';
els.schedSlotSort.value = '0';
sandbox.loadedAidesList = [{id: sara, username: 'sara', name: 'Sara Cole'}, {id: kim, username: 'kim', name: 'Kim Lee'}];
await sandbox.schedSaveSlotPattern();
const patternCall = rpc.find(function(c){ return c.name === 'upsert_schedule_slot_pattern'; });
assert.ok(patternCall, 'save shift calls upsert_schedule_slot_pattern');
assert.strictEqual(patternCall.body.p_client_id, ada);
assert.strictEqual(patternCall.body.p_weekday, 3);
assert.strictEqual(patternCall.body.p_slot_key, 'am');
assert.strictEqual(patternCall.body.p_usual_aide_id, sara);
assert.strictEqual(patternCall.body.p_hours, 5);
assert.strictEqual(patternCall.body.p_label, 'Morning');
assert.strictEqual(patternCall.body.p_start_local, '08:00:00');
assert.strictEqual(patternCall.body.p_end_local, '13:00:00');
assert.strictEqual(patternCall.body.p_sort_order, 0);

await sandbox.schedMarkSlot(ada, '2026-09-23', 'am', 'missed');
const miss = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_day_mark'; }).pop();
assert.strictEqual(miss.body.p_mark, 'missed');
assert.strictEqual(miss.body.p_on_date, '2026-09-23');
assert.strictEqual(miss.body.p_slot_key, 'am');
assert.strictEqual(miss.body.p_cover_aide_id, null);
assert.strictEqual(miss.body.p_hours, null);
assert.strictEqual(sandbox.schedSlotFocus.client_id, ada);
assert.strictEqual(sandbox.schedSlotFocus.on_date, '2026-09-23');
assert.strictEqual(sandbox.schedSlotFocus.slot_key, 'am');

await sandbox.schedMarkSlot(ada, '2026-09-23', 'pm', 'cover', {cover: kim, hours: 4, note: 'swap'});
const cover = rpc.filter(function(c){ return c.name === 'upsert_schedule_slot_day_mark'; }).pop();
assert.strictEqual(cover.body.p_mark, 'cover');
assert.strictEqual(cover.body.p_cover_aide_id, kim);
assert.strictEqual(cover.body.p_hours, 4);
assert.strictEqual(cover.body.p_note, 'swap');

await sandbox.schedClearSlotMark(ada, '2026-09-23', 'am');
const cleared = rpc.filter(function(c){ return c.name === 'clear_schedule_slot_day_mark'; }).pop();
assert.strictEqual(cleared.body.p_slot_key, 'am');
assert.strictEqual(cleared.body.p_on_date, '2026-09-23');

await sandbox.schedDeleteSlotPattern(ada, 3, 'pm');
const removed = rpc.filter(function(c){ return c.name === 'delete_schedule_slot_pattern'; }).pop();
assert.strictEqual(removed.body.p_weekday, 3);
assert.strictEqual(removed.body.p_slot_key, 'pm');

sandbox.currentAdminRole = 'Nurse';
const beforeNurse = rpc.length;
await sandbox.schedMarkSlot(ada, '2026-09-23', 'am', 'worked');
assert.strictEqual(rpc.length, beforeNurse, 'Nurse cannot write a mark');
sandbox.currentAdminRole = 'Admin';

async function phoneShots(){
  if(process.env.SKIP_BROWSER === '1') return;
  let puppeteer;
  try { puppeteer = require('puppeteer-core'); }
  catch(e){
    try { puppeteer = require('/tmp/probe/node_modules/puppeteer-core'); }
    catch(e2){
      console.log('admin-clienthrs1b browser skipped (no puppeteer-core)');
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
  const outDir = process.env.CLIENTHRS_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(outDir, {recursive: true});
  try {
    const page = await browser.newPage();
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(){
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.getElementById('tab_schedule').classList.add('active');
      currentAdminRole = 'Admin';
      readSbSession = function(){ return {access_token: 'office'}; };
      var adaId = '11111111-1111-4111-8111-111111111111';
      var saraId = '22222222-2222-4222-8222-222222222222';
      var kimId = '33333333-3333-4333-8333-333333333333';
      var moeId = '44444444-4444-4444-8444-444444444444';
      loadedAidesList = [
        {id: saraId, username: 'sara', name: 'Sara Cole'},
        {id: kimId, username: 'kim', name: 'Kim Lee'},
        {id: moeId, username: 'moe', name: 'Moe Hart'}
      ];
      function daySlots(on, amMark, pmMark){
        return [
          {slot_key:'am', label:'Morning', start_local:'08:00:00', end_local:'13:00:00', hours:5, pattern_hours:5, usual_aide_id:saraId, aide_name:'Sara Cole', sort_order:0, mark:amMark, cover_aide_id:null, note:null, deep_link:{client_id:adaId, on_date:on, slot_key:'am'}},
          {slot_key:'pm', label:'Evening', start_local:'16:00:00', end_local:'20:00:00', hours:4, pattern_hours:4, usual_aide_id:kimId, aide_name:'Kim Lee', sort_order:1, mark:pmMark, cover_aide_id:null, note:null, deep_link:{client_id:adaId, on_date:on, slot_key:'pm'}}
        ];
      }
      var days = {};
      for(var n = 1; n <= 7; n++){
        var on = schedAddDays('2026-09-21', n - 1);
        days[String(n)] = {on_date:on, weekday:n, slots: n <= 5 ? daySlots(on, null, null) : []};
      }
      var benDays = {};
      for(var b = 1; b <= 7; b++){
        var bon = schedAddDays('2026-09-21', b - 1);
        benDays[String(b)] = {on_date:bon, weekday:b, slots: b <= 5 ? [{slot_key:'day', label:'Day', start_local:'09:00:00', end_local:'13:00:00', hours:4, pattern_hours:4, usual_aide_id:moeId, aide_name:'Moe Hart', sort_order:0, mark:null, deep_link:{client_id:'ben', on_date:bon, slot_key:'day'}}] : []};
      }
      window.__hrsCalls = [];
      sbRestRpc = function(name, body){
        window.__hrsCalls.push({name:name, body:body});
        return Promise.resolve({ok:true, data:{deep_link:{client_id:body && body.p_client_id, on_date:body && body.p_on_date, slot_key:body && body.p_slot_key}, clients:[]}});
      };
      schedApplySlotWeek({
        week_start:'2026-09-21',
        week_end:'2026-09-27',
        clients:[
          {client_id:adaId, client_name:'Ada Cole', weekly_authorized_hours:63, days:days},
          {client_id:'ben', client_name:'Ben Ruiz', weekly_authorized_hours:27, days:benDays}
        ]
      });
      schedSetView('week');
      schedPaint();
    });
    const week = await page.evaluate(function(){
      var sc = document.getElementById('schedScroll');
      var chips = sc.querySelectorAll('.sched-chip');
      var first = sc.querySelector('.sched-chip-stack');
      var box = first ? first.getBoundingClientRect() : null;
      var cs = getComputedStyle(sc);
      var doc = document.documentElement;
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        chips: chips.length,
        stack: first ? first.innerText.replace(/\s+/g, ' ').trim() : '',
        badge: (sc.querySelector('.sched-auth-badge') || {}).textContent || '',
        chipTop: box ? box.top : -1,
        chipBottom: box ? box.bottom : -1,
        scroll: sc.scrollWidth,
        client: sc.clientWidth,
        overflowX: cs.overflowX,
        touch: cs.touchAction,
        docScroll: doc.scrollWidth,
        docClient: doc.clientWidth,
        viewW: window.innerWidth,
        detail: !document.getElementById('schedSlotDetail').hidden
      };
    });
    assert.strictEqual(week.build, '2026-09-26-clienthrs1b');
    assert.strictEqual(week.viewW, 390);
    assert.ok(week.chips >= 2, 'two chips on the week board ' + week.chips);
    assert.ok(week.stack.indexOf('Sara') >= 0 && week.stack.indexOf('Kim') >= 0, 'stacked Sara and Kim ' + week.stack);
    assert.strictEqual(week.badge, '63 hrs/week');
    assert.ok(week.chipTop >= 0 && week.chipBottom <= 844, 'chips are on the phone screen');
    assert.ok(week.scroll > week.client + 80, 'week board scrolls sideways');
    assert.ok(week.overflowX === 'auto' || week.overflowX === 'scroll', 'horizontal scroller');
    assert.ok(/pan-x/.test(week.touch), 'touch pan');
    assert.ok(week.docScroll <= week.docClient + 2, 'page itself does not scroll sideways');
    assert.strictEqual(week.detail, true, 'day detail is on the schedule');
    const grid = await page.$('#schedScroll');
    const gridBox = await grid.boundingBox();
    await page.touchscreen.touchStart(gridBox.x + gridBox.width - 20, gridBox.y + 36);
    for(var step = 1; step <= 8; step++){
      await new Promise(function(r){ setTimeout(r, 16); });
      await page.touchscreen.touchMove(gridBox.x + gridBox.width - 20 - step * 28, gridBox.y + 36);
    }
    await page.touchscreen.touchEnd();
    const swiped = await page.evaluate(function(){ return document.getElementById('schedScroll').scrollLeft; });
    assert.ok(swiped > 20, 'phone swipe moves the week ' + swiped);
    await page.evaluate(function(){ document.getElementById('schedScroll').scrollLeft = 0; });
    await page.screenshot({path: path.join(outDir, 'clienthrs1b-week-phone.png')});

    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      var adaId = '11111111-1111-4111-8111-111111111111';
      var wed = schedFindSlotClient(adaId).days['3'];
      wed.slots[0].mark = 'missed';
      wed.slots[1].mark = 'worked';
      schedApplySlotWeek({
        week_start: schedWeekStart,
        clients: schedSlotClients.map(function(c){
          var days = {};
          for(var n = 1; n <= 7; n++){
            days[String(n)] = {on_date:c.days[String(n)].on_date, weekday:n, slots:c.days[String(n)].slots};
          }
          return {client_id:c.id, client_name:c.name, weekly_authorized_hours:c.weekly_authorized_hours, days:days};
        })
      });
      schedFocusDeepLink({client_id:adaId, on_date:'2026-09-23', slot_key:'am'});
    });
    await page.evaluate(function(){
      var sum = document.getElementById('schedSlotDaySum');
      if(sum) sum.scrollIntoView({block:'start'});
      window.scrollBy(0, -8);
    });
    const day = await page.evaluate(function(){
      var card = document.querySelector('.sched-slot-card.is-missed');
      var btn = card.querySelector('[data-slot-action="missed"]');
      var box = btn.getBoundingClientRect();
      var nav = document.querySelector('#adminScreen .bottom-nav');
      var navTop = nav ? nav.getBoundingClientRect().top : 844;
      var detail = document.getElementById('schedSlotDetail').getBoundingClientRect();
      return {
        text: card.innerText.replace(/\s+/g, ' ').trim(),
        btnH: box.height,
        btnTop: box.top,
        btnBottom: box.bottom,
        navTop: navTop,
        detailW: detail.width,
        viewW: window.innerWidth,
        link: card.getAttribute('data-deep-link'),
        worked: !!document.querySelector('.sched-slot-card.is-worked')
      };
    });
    assert.ok(day.text.indexOf('Missed') >= 0, 'day detail shows missed ' + day.text);
    assert.ok(day.text.indexOf('no cover') >= 0, 'day detail shows no cover');
    assert.strictEqual(day.worked, true, 'evening worked card is on the day');
    assert.ok(day.btnH >= 44, 'mark control is at least 44px ' + day.btnH);
    assert.ok(day.btnTop >= 0 && day.btnBottom <= day.navTop + 1, 'mark control sits above the bottom nav');
    assert.ok(day.detailW >= 300 && day.detailW <= day.viewW + 1, 'day detail uses the phone width');
    const link = JSON.parse(day.link);
    assert.deepStrictEqual(Object.keys(link).sort(), ['client_id', 'on_date', 'slot_key']);
    assert.strictEqual(link.slot_key, 'am');
    assert.strictEqual(link.on_date, '2026-09-23');
    await page.screenshot({path: path.join(outDir, 'clienthrs1b-day-phone.png')});

    const missBtn = await page.$('.sched-slot-card.is-missed [data-slot-action="worked"]');
    await missBtn.click();
    const called = await page.evaluate(function(){
      return window.__hrsCalls.filter(function(c){ return c.name === 'upsert_schedule_slot_day_mark'; }).pop();
    });
    assert.ok(called, 'tapping Worked calls upsert_schedule_slot_day_mark');
    assert.strictEqual(called.body.p_mark, 'worked');
    assert.strictEqual(called.body.p_slot_key, 'am');
    assert.strictEqual(called.body.p_on_date, '2026-09-23');

    const desk = await browser.newPage();
    await desk.setViewport({width: 1280, height: 800, isMobile: false, hasTouch: false, deviceScaleFactor: 1});
    await desk.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 20000});
    const wide = await desk.evaluate(function(){
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.getElementById('tab_schedule').classList.add('active');
      var adaId = '11111111-1111-4111-8111-111111111111';
      var days = {};
      for(var n = 1; n <= 7; n++){
        var on = schedAddDays('2026-09-21', n - 1);
        days[String(n)] = {on_date:on, slots:[{slot_key:'am', label:'Morning', hours:5, pattern_hours:5, aide_name:'Sara Cole', sort_order:0, mark:null, deep_link:{client_id:adaId, on_date:on, slot_key:'am'}}, {slot_key:'pm', label:'Evening', hours:4, pattern_hours:4, aide_name:'Kim Lee', sort_order:1, mark:null, deep_link:{client_id:adaId, on_date:on, slot_key:'pm'}}]};
      }
      schedApplySlotWeek({week_start:'2026-09-21', clients:[{client_id:adaId, client_name:'Ada Cole', weekly_authorized_hours:63, days:days}]});
      schedSetView('week');
      var layout = getComputedStyle(document.querySelector('#tab_schedule .sched-layout')).flexDirection;
      var fab = document.getElementById('copilotFab').getBoundingClientRect();
      var detail = document.getElementById('schedSlotDetail').getBoundingClientRect();
      var grid = document.getElementById('schedScroll').getBoundingClientRect();
      return {
        layout: layout,
        chips: document.querySelectorAll('#schedScroll .sched-chip').length,
        detailRight: detail.right,
        gridRight: grid.right,
        fabRight: fab.right,
        viewW: window.innerWidth,
        hiddenRemiPage: !document.getElementById('tab_remi')
      };
    });
    assert.strictEqual(wide.layout, 'row', 'desktop schedule stays side by side');
    assert.ok(wide.chips >= 2, 'desktop shows both chips');
    assert.ok(wide.detailRight > wide.gridRight - 2, 'day detail sits to the right of the week grid');
    assert.ok(wide.fabRight > wide.viewW - 120, 'Remi chip stays on the right');
    assert.strictEqual(wide.hiddenRemiPage, true);

    const marks = await page.evaluate(function(){
      currentAdminRole = 'Admin';
      payReadyState = {week_start:'2026-09-21', rows:[]};
      var id = '55555555-5555-4555-8555-555555555555';
      var heldId = '66666666-6666-4666-8666-666666666666';
      function weekDays(clientId, wednesday){
        var days = {};
        for(var n = 1; n <= 7; n++){
          var on = schedAddDays('2026-09-28', n - 1);
          days[String(n)] = {on_date:on, weekday:n, slots: n === 3 ? wednesday(on, clientId) : []};
        }
        return days;
      }
      var readyDays = weekDays(id, function(on, clientId){
        return [
          {slot_key:'am', label:'Morning', hours:5, pattern_hours:5, aide_name:'Sara Cole', sort_order:0, mark:'worked', deep_link:{client_id:clientId, on_date:on, slot_key:'am'}},
          {slot_key:'pm', label:'Afternoon', hours:4, pattern_hours:4, aide_name:'Kim Lee', sort_order:1, mark:'missed', deep_link:{client_id:clientId, on_date:on, slot_key:'pm'}},
          {slot_key:'eve', label:'Evening', hours:4, pattern_hours:4, aide_name:'Moe Hart', sort_order:2, mark:'cover', cover_aide_name:'Moe Hart', deep_link:{client_id:clientId, on_date:on, slot_key:'eve'}}
        ];
      });
      var heldDays = weekDays(heldId, function(){ return []; });
      schedApplySlotWeek({
        week_start:'2026-09-28',
        clients:[
          {client_id:heldId, client_name:'payready1 Probe Held', weekly_authorized_hours:40, days:heldDays},
          {client_id:id, client_name:'payready1 Probe Ready', weekly_authorized_hours:40, days:readyDays}
        ]
      });
      schedFocusDeepLink({client_id:id, on_date:'2026-09-30', slot_key:'am'});
      function text(q){
        var ans = copilotChatAnswer(q);
        return (ans && ans.text) || '';
      }
      var named = text('marks for payready1 Probe Ready on 09/30/2026');
      var status = text('What is the schedule status for payready1 Probe Ready?');
      var scheduleFor = text('What are the marks on the schedule for payready1 Probe Ready on 09/30/2026?');
      var how = text('How is the schedule?');
      var focusOnly = text('focused slot marks');
      var sept = text('schedule marks for payready1 Probe Ready September 30');
      var quoted = text('marks for client "payready1 Probe Ready" on 09/30/2026');
      var heldAsk = text('marks for payready1 Probe Held on 09/30/2026');
      var readyMiss = text("who's Ready?");
      payReadyState = {week_start:'2026-09-21', rows:[
        {name:'Ada Cole', status:'ready', reason:'', reasonLabel:''},
        {name:'Dana Ruiz', status:'held', reason:'missing_signature', reasonLabel:'missing signature'}
      ]};
      return {
        named: named,
        status: status,
        scheduleFor: scheduleFor,
        how: how,
        readyMiss: readyMiss,
        ready: text("who's Ready?"),
        held: text("who's Held and why?"),
        both: text("who's Ready and who's Held?"),
        focus: text('What are the marks for the focused slot?'),
        focusOnly: focusOnly,
        sept: sept,
        quoted: quoted,
        heldAsk: heldAsk,
        onDate: schedSlotFocus && schedSlotFocus.on_date,
        slotKey: schedSlotFocus && schedSlotFocus.slot_key
      };
    });
    assert.ok(marks.named.indexOf('pay readiness') < 0, 'named marks are not a pay miss: ' + marks.named);
    assert.strictEqual(marks.named.indexOf('YES.'), 0, marks.named);
    assert.ok(marks.named.indexOf('payready1 Probe Ready') >= 0, marks.named);
    assert.ok(marks.named.indexOf('Probe Held') < 0, 'Ready ask must not pick Held: ' + marks.named);
    assert.ok(marks.named.indexOf('see schedule marks') < 0, marks.named);
    assert.ok(marks.named.indexOf('09/30/2026') >= 0, marks.named);
    assert.ok(marks.named.indexOf('am Morning: Worked 5h') >= 0, marks.named);
    assert.ok(marks.named.indexOf('pm Afternoon: Missed 0h') >= 0, marks.named);
    assert.ok(marks.named.indexOf('Cover') >= 0, marks.named);
    assert.ok(marks.focusOnly.indexOf('payready1 Probe Ready') >= 0, marks.focusOnly);
    assert.ok(marks.focusOnly.indexOf('Name the client') < 0, marks.focusOnly);
    assert.ok(marks.focusOnly.indexOf('Probe Held') < 0, marks.focusOnly);
    assert.ok(marks.focusOnly.indexOf('Worked 5h') >= 0, marks.focusOnly);
    assert.ok(marks.sept.indexOf('payready1 Probe Ready') >= 0 && marks.sept.indexOf('Worked 5h') >= 0, marks.sept);
    assert.ok(marks.sept.indexOf('Name the date') < 0 && marks.sept.indexOf('Probe Held') < 0, marks.sept);
    assert.ok(marks.quoted.indexOf('payready1 Probe Ready') >= 0 && marks.quoted.indexOf('Worked 5h') >= 0, marks.quoted);
    assert.ok(marks.quoted.indexOf('Probe Held') < 0, marks.quoted);
    assert.ok(marks.heldAsk.indexOf('payready1 Probe Held') >= 0, marks.heldAsk);
    assert.ok(marks.heldAsk.indexOf('Probe Ready') < 0 && marks.heldAsk.indexOf('Worked 5h') < 0, marks.heldAsk);
    assert.ok(marks.status.indexOf('pay readiness') < 0, marks.status);
    assert.ok(marks.status.indexOf('Worked 5h') >= 0 && marks.status.indexOf('Missed 0h') >= 0 && marks.status.indexOf('Cover') >= 0, marks.status);
    assert.ok(marks.scheduleFor.indexOf('pay readiness') < 0 && marks.scheduleFor.indexOf('Worked 5h') >= 0, marks.scheduleFor);
    assert.strictEqual(marks.how.indexOf('YES.'), 0, marks.how);
    assert.ok(marks.how.indexOf('Worked') < 0 && marks.how.indexOf('pay readiness') < 0, marks.how);
    assert.ok(marks.readyMiss.indexOf('pay readiness') >= 0, marks.readyMiss);
    assert.ok(marks.ready.indexOf('Ada Cole') >= 0 && marks.ready.indexOf('Ready') >= 0, marks.ready);
    assert.ok(marks.held.indexOf('Dana Ruiz') >= 0, marks.held);
    assert.ok(marks.both.indexOf('Ada Cole') >= 0 && marks.both.indexOf('Dana Ruiz') >= 0, marks.both);
    assert.ok(marks.focus.indexOf('Worked 5h') >= 0, marks.focus);
    assert.ok(marks.focus.indexOf('Missed') < 0 && marks.focus.indexOf('Cover') < 0, marks.focus);
    assert.strictEqual(marks.onDate, '2026-09-30');
    assert.strictEqual(marks.slotKey, 'am');

    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      copilotChat = [];
      copilotShowChat();
      var input = document.getElementById('copilotChatInput');
      if(input) input.value = 'marks for payready1 Probe Ready on 09/30/2026';
      copilotChatSubmit({preventDefault: function(){}});
    });
    const thread = await page.evaluate(function(){
      var bubbles = document.querySelectorAll('#copilotThread .copilot-bubble-remi');
      var last = bubbles.length ? bubbles[bubbles.length - 1] : null;
      if(last && last.scrollIntoView) last.scrollIntoView({block:'center'});
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      var fab = document.getElementById('copilotFab').getBoundingClientRect();
      return {
        text: last ? last.innerText.replace(/\s+/g, ' ').trim() : '',
        hidden: sheet.hidden,
        sheetRight: box.right,
        fabRight: fab.right,
        viewW: window.innerWidth,
        viewH: window.innerHeight,
        askSelected: document.getElementById('copilotTabAsk').getAttribute('aria-selected')
      };
    });
    assert.strictEqual(thread.viewW, 390);
    assert.strictEqual(thread.viewH, 844);
    assert.strictEqual(thread.hidden, false);
    assert.strictEqual(thread.askSelected, 'true');
    assert.ok(thread.text.indexOf('payready1 Probe Ready') >= 0, thread.text);
    assert.ok(thread.text.indexOf('Probe Held') < 0, thread.text);
    assert.ok(thread.text.indexOf('am Morning: Worked 5h') >= 0, thread.text);
    assert.ok(thread.text.indexOf('pm Afternoon: Missed 0h') >= 0, thread.text);
    assert.ok(thread.text.indexOf('Cover') >= 0, thread.text);
    assert.ok(thread.text.indexOf('pay readiness') < 0, thread.text);
    assert.ok(thread.text.indexOf('see schedule marks') < 0, thread.text);
    assert.ok(thread.sheetRight <= thread.viewW + 1, 'Remi stays inside the phone');
    assert.ok(thread.fabRight > thread.viewW - 120, 'Remi chip stays on the right');
    await page.screenshot({path: path.join(outDir, 'clienthrs1b-remi-marks-phone.png')});
    console.log('admin-clienthrs1b phone layout ok');
  } finally {
    await browser.close();
    server.close();
  }
}

await phoneShots();
console.log('admin-clienthrs1b-test ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
