#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  assert.fail('unclosed ' + sig);
}

assert.ok(html.includes('v=sched-time-tap1'), 'sched-time-tap1 marker');
assert.ok(html.includes('data-sched-time-tap1="v=sched-time-tap1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-sched-time-tap1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-sched-time-tap1">'), 'meta');
assert.ok(html.includes('<!-- schedule time tap 2026-09-27 v=sched-time-tap1 admin-build 2026-09-27-sched-time-tap1'), 'comment');
assert.ok(html.includes("var SCHED_TIME_TAP1_MARKER='v=sched-time-tap1'"), 'script marker');
assert.ok(html.includes('GHOST-SCHED-TIME-TAP1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Pure Admin UI. No SQL. No new RPC.'), 'no SQL and no new RPC');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-aides-info1'), 'first admin-build is aides-info1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after aide-office-vis1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
assert.ok(html.indexOf('content="2026-09-27-tabbar-8"') < html.indexOf('content="2026-09-27-cover-card-cancel1"'), 'cover-card-cancel1 stays after tabbar-8');
assert.ok(html.indexOf('content="2026-09-27-cover-card-cancel1"') < html.indexOf('content="2026-09-27-nosvc-reason-draft1"'), 'nosvc stays after cover-card-cancel1');
['v=aide-text-chat1','v=remi-float-hide1','v=tabbar-8','v=cover-card-cancel1','v=nosvc-reason-draft1','v=cover-unselect1','v=shift-slim1','v=clienthrs1c','v=clienthrs1b'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
['2026-09-27-aide-text-chat1','2026-09-27-remi-float-hide1','2026-09-27-tabbar-8','2026-09-27-cover-card-cancel1','2026-09-27-nosvc-reason-draft1','2026-09-27-cover-unselect1','2026-09-27-shift-slim1','2026-09-27-clienthrs1c','2026-09-26-clienthrs1b'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="'+meta+'">'), 'prior meta stays ' + meta);
});
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');

const css = html.slice(html.indexOf('/* v=sched-time-tap1 —'), html.indexOf('/* v=sched-time-tap1 end */'));
assert.ok(css.includes('min-height:48px'), 'box is at least 48px');
assert.ok(css.includes('width:100%'), 'box is the full field column');
assert.ok(!/pointer-events\s*:\s*none/.test(css), 'no pointer-events none');
assert.ok(!/width\s*:\s*24px/.test(css), 'no 24px overlay');
assert.ok(!css.includes('::-webkit-calendar-picker-indicator'), 'no indicator overlay');

const fields = html.slice(html.indexOf('data-sched-time-tap1="v=sched-time-tap1"'), html.indexOf('id="schedSlotAide"'));
assert.ok(fields.includes('id="schedSlotStart"') && fields.includes('id="schedSlotEnd"'), 'start and end stay');
assert.ok(fields.includes('class="field sched-time-tap"'), 'both fields use the tap box');
assert.strictEqual((fields.match(/type="time"/g) || []).length, 2, 'one time input per field');
assert.ok(html.includes('id="schedSlotSavePattern"') && html.includes('onclick="schedSaveSlotPattern()"'), 'Save stays');
assert.ok(html.includes('onclick="schedCloseSlotPattern()">Cancel'), 'Cancel stays');
assert.ok(html.includes('id="schedSlotDays"') && html.includes('aria-label="Sunday"') && html.includes('aria-label="Saturday"'), 'weekdays stay');
assert.ok(html.includes('id="schedSlotHoursView"') && html.includes('id="schedSlotHoursNote"'), 'hours auto-calc stays');
assert.ok(html.includes('>Edit shift<') && html.includes('>Add another<'), 'pills stay');

const tapJs = extractFn(html, 'function schedTimeTapOpen(input, ev, box)') + '\n' + extractFn(html, 'function schedBindTimeTap()');
assert.ok(tapJs.includes('showPicker'), 'prefers showPicker');
assert.ok(tapJs.includes('input.focus') && tapJs.includes('input.click'), 'falls back to focus and click');
assert.ok(!tapJs.includes('sbRestRpc'), 'tap path adds no RPC');
assert.ok(!/pointer-events/.test(tapJs), 'tap path does not hide the input');

const els = {};
function makeEl(id){
  const el = {
    id: id,
    value: '',
    dataset: {},
    _timeTapOpening: false,
    listeners: [],
    focus: function(){ this.focused = true; },
    click: function(){ this.clicked = (this.clicked || 0) + 1; },
    addEventListener: function(type, fn){ this.listeners.push({type: type, fn: fn}); },
    dispatch: function(ev){
      const list = this.listeners.slice();
      for(let i = 0; i < list.length; i++){
        if(list[i].type === (ev.type || 'click'))list[i].fn(ev);
      }
    }
  };
  els[id] = el;
  return el;
}
['schedSlotStart','schedSlotEnd','schedSlotHoursView','schedSlotHoursNote','schedSlotHours'].forEach(makeEl);
const boxStart = makeEl('boxStart');
const boxEnd = makeEl('boxEnd');
els.schedSlotStart.closest = function(sel){ return sel === '.sched-time-tap' ? boxStart : null; };
els.schedSlotEnd.closest = function(sel){ return sel === '.sched-time-tap' ? boxEnd : null; };

const sandbox = {
  schedEl: function(id){ return els[id] || null; },
  console: console
};
vm.createContext(sandbox);
vm.runInContext([
  extractFn(html, 'function schedNum(v)'),
  extractFn(html, 'function schedMinutes(t)'),
  extractFn(html, 'function schedHoursBetween(start, end)'),
  extractFn(html, 'function schedHoursShort(n)'),
  extractFn(html, 'function schedClockAmPm(t)'),
  extractFn(html, 'function schedTimeOrNull(v)'),
  extractFn(html, 'function schedSyncAutoHours()'),
  extractFn(html, 'function schedTimeTapOpen(input, ev, box)'),
  extractFn(html, 'function schedBindTimeTap()'),
  extractFn(html, 'function schedBindAutoHours()')
].join('\n'), sandbox);

assert.strictEqual(sandbox.schedHoursBetween('08:00', '13:00'), 5);
assert.strictEqual(sandbox.schedHoursBetween('08:00:00', '17:00:00'), 9);
els.schedSlotStart.value = '08:00';
els.schedSlotEnd.value = '13:00';
sandbox.schedSyncAutoHours();
assert.ok(els.schedSlotHoursView.value.indexOf('5') >= 0, els.schedSlotHoursView.value);
assert.ok(els.schedSlotHoursNote.textContent.indexOf('from start') >= 0, els.schedSlotHoursNote.textContent);
assert.strictEqual(els.schedSlotHours.value, '5');

const picked = [];
els.schedSlotStart.showPicker = function(){ picked.push('start'); };
els.schedSlotEnd.showPicker = function(){ picked.push('end'); };
sandbox.schedBindTimeTap();
boxStart.dispatch({type: 'click', target: els.schedSlotStart, preventDefault: function(){ this.prevented = true; }});
assert.deepStrictEqual(picked, ['start']);
assert.strictEqual(els.schedSlotStart.clicked || 0, 0, 'showPicker does not also click');
const left = {type: 'click', target: boxStart, preventDefault: function(){}};
boxStart.dispatch(left);
assert.deepStrictEqual(picked, ['start', 'start'], 'the field box, not only the input, opens the picker');

const legacy = makeEl('legacy');
const calls = [];
legacy.focus = function(){ calls.push('focus'); };
legacy.click = function(){ calls.push('click'); };
sandbox.schedTimeTapOpen(legacy, {target: boxStart, preventDefault: function(){}}, boxStart);
assert.deepStrictEqual(calls, ['focus', 'click'], 'missing showPicker focuses and clicks');
calls.length = 0;
sandbox.schedTimeTapOpen(legacy, {target: legacy, preventDefault: function(){}}, legacy);
assert.deepStrictEqual(calls, ['focus'], 'a click already on the input is not sent again');

const openErr = makeEl('openErr');
openErr.showPicker = function(){
  const err = new Error('already');
  err.name = 'InvalidStateError';
  throw err;
};
openErr.focus = function(){ calls.push('focus'); };
openErr.click = function(){ calls.push('click'); };
calls.length = 0;
sandbox.schedTimeTapOpen(openErr, {target: boxStart}, boxStart);
assert.deepStrictEqual(calls, [], 'an already-open picker is not clicked again');

sandbox.schedBindAutoHours();
assert.ok(els.schedSlotStart.listeners.some(function(row){ return row.type === 'input'; }), 'hours input listener stays');
assert.ok(els.schedSlotEnd.listeners.some(function(row){ return row.type === 'change'; }), 'hours change listener stays');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/pptr/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('sched-time-tap1 browser skipped (no puppeteer-core)');
    return;
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
  const outDir = process.env.TAP_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(outDir, {recursive: true});
  const adaId = '11111111-1111-4111-8111-111111111111';
  const moeId = '44444444-4444-4444-8444-444444444444';
  try {
    const phone = await browser.newPage();
    await phone.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await phone.goto('http://127.0.0.1:' + port + '/index.html?v=sched-time-tap1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await phone.evaluate(function(adaId, moeId){
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){ p.classList.remove('active'); });
      document.getElementById('tab_schedule').classList.add('active');
      currentAdminRole = 'Scheduler';
      readSbSession = function(){ return {access_token: 'office'}; };
      loadedAidesList = [{id: moeId, username: 'moe', name: 'moe', is_active: true}];
      var days = {};
      for(var n = 1; n <= 7; n++){
        var on = schedAddDays('2026-09-07', n - 1);
        var slots = n === 1 ? [{
          slot_key: 'am', label: 'Day', start_local: '08:00:00', end_local: '13:00:00',
          hours: 5, pattern_hours: 5, usual_aide_id: moeId, aide_name: 'moe', sort_order: 0,
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
    }, adaId, moeId);
    await phone.evaluate(function(){
      document.getElementById('schedSlotPattern').scrollIntoView({block: 'center'});
    });
    const box = await phone.evaluate(function(){
      var start = document.getElementById('schedSlotStart');
      var end = document.getElementById('schedSlotEnd');
      var field = start.closest('.sched-time-tap');
      var col = start.closest('.sched-two');
      var sr = start.getBoundingClientRect();
      var er = end.getBoundingClientRect();
      var fr = field.getBoundingClientRect();
      var cr = col.getBoundingClientRect();
      var cs = getComputedStyle(start);
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: document.getElementById('tab_schedule').getAttribute('data-sched-time-tap1'),
        search: location.search,
        startH: sr.height,
        startW: sr.width,
        endH: er.height,
        endW: er.width,
        fieldW: fr.width,
        colW: cr.width,
        minH: cs.minHeight,
        pe: cs.pointerEvents,
        kids: field.children.length,
        hours: document.getElementById('schedSlotHoursView').value,
        note: document.getElementById('schedSlotHoursNote').textContent,
        days: document.querySelectorAll('#schedSlotDays .day-chip').length,
        aide: document.getElementById('schedSlotAide').tagName,
        save: document.getElementById('schedSlotSavePattern').textContent.replace(/\s+/g, ' ').trim(),
        cancel: !!Array.prototype.some.call(document.querySelectorAll('#schedSlotPattern button'), function(btn){
          return btn.textContent.replace(/\s+/g, ' ').trim() === 'Cancel';
        })
      };
    });
    assert.strictEqual(box.build, '2026-09-27-aides-info1');
    assert.strictEqual(box.marker, 'v=sched-time-tap1');
    assert.ok(box.search.indexOf('v=sched-time-tap1') >= 0, box.search);
    assert.ok(box.startH >= 48 && box.endH >= 48, 'height ' + box.startH + '/' + box.endH);
    assert.ok(box.startW >= box.fieldW - 2, 'start fills the field ' + box.startW + ' vs ' + box.fieldW);
    assert.ok(box.endW >= box.fieldW - 2, 'end fills the field');
    assert.ok(box.fieldW >= box.colW - 4, 'field fills the column ' + box.fieldW + ' vs ' + box.colW);
    assert.ok(box.startW > 200, 'hit area is the column, not a 24px icon ' + box.startW);
    assert.strictEqual(box.pe, 'auto');
    assert.strictEqual(box.kids, 2, 'label and input only');
    assert.ok(box.hours.indexOf('5') >= 0, box.hours);
    assert.ok(box.note.indexOf('from start') >= 0, box.note);
    assert.strictEqual(box.days, 7);
    assert.strictEqual(box.aide, 'SELECT');
    assert.strictEqual(box.save, 'Save');
    assert.strictEqual(box.cancel, true);

    await phone.evaluate(function(){
      window.__taps = [];
      ['schedSlotStart','schedSlotEnd'].forEach(function(id){
        var input = document.getElementById(id);
        var orig = input.showPicker.bind(input);
        input.showPicker = function(){
          window.__taps.push({id: id, via: 'showPicker'});
          return orig();
        };
      });
    });
    const startTap = await phone.evaluate(function(){
      var r = document.getElementById('schedSlotStart').getBoundingClientRect();
      return {x: r.left + 16, y: r.top + r.height / 2, right: r.right};
    });
    assert.ok(startTap.x < startTap.right - 24, 'tap is outside the clock corner');
    await phone.touchscreen.tap(startTap.x, startTap.y);
    await new Promise(function(resolve){ setTimeout(resolve, 400); });
    await phone.screenshot({path: path.join(outDir, 'sched-time-tap1-phone-picker.png')});
    const afterStart = await phone.evaluate(function(){ return window.__taps.slice(); });
    assert.strictEqual(afterStart.length, 1, 'one tap opens the picker once ' + JSON.stringify(afterStart));
    assert.strictEqual(afterStart[0].id, 'schedSlotStart');
    assert.strictEqual(afterStart[0].via, 'showPicker');

    const endTap = await phone.evaluate(function(){
      var r = document.getElementById('schedSlotEnd').getBoundingClientRect();
      return {x: r.left + 16, y: r.top + r.height / 2, right: r.right};
    });
    assert.ok(endTap.x < endTap.right - 24, 'end tap is outside the clock corner');
    await phone.touchscreen.tap(endTap.x, endTap.y);
    const afterEnd = await phone.evaluate(function(){ return window.__taps.slice(); });
    assert.strictEqual(afterEnd.length, 2, JSON.stringify(afterEnd));
    assert.strictEqual(afterEnd[1].id, 'schedSlotEnd');

    await phone.evaluate(function(){ document.getElementById('schedSlotModeAdd').click(); });
    const added = await phone.evaluate(function(){
      return {
        mode: document.getElementById('schedSlotPatternTitle').textContent,
        sameStart: !!document.querySelector('.sched-time-tap input#schedSlotStart'),
        sameEnd: !!document.querySelector('.sched-time-tap input#schedSlotEnd')
      };
    });
    assert.ok(added.mode.indexOf('Add another') >= 0, added.mode);
    assert.strictEqual(added.sameStart, true);
    assert.strictEqual(added.sameEnd, true);
    const addTap = await phone.evaluate(function(){
      var el = document.getElementById('schedSlotStart');
      el.scrollIntoView({block: 'center'});
      var r = el.getBoundingClientRect();
      return {x: r.left + 16, y: r.top + r.height / 2};
    });
    await phone.touchscreen.tap(addTap.x, addTap.y);
    const afterAdd = await phone.evaluate(function(){ return window.__taps.length; });
    assert.strictEqual(afterAdd, 3, 'Add another uses the same Start control');

    const hours = await phone.evaluate(function(){
      var start = document.getElementById('schedSlotStart');
      var end = document.getElementById('schedSlotEnd');
      start.value = '08:00';
      end.value = '13:00';
      start.dispatchEvent(new Event('input', {bubbles: true}));
      end.dispatchEvent(new Event('change', {bubbles: true}));
      return {
        view: document.getElementById('schedSlotHoursView').value,
        note: document.getElementById('schedSlotHoursNote').textContent
      };
    });
    assert.ok(hours.view.indexOf('5') >= 0, hours.view);
    assert.ok(hours.note.indexOf('from start') >= 0, hours.note);
    console.log('sched-time-tap1 phone hit area ok');
  } finally {
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-sched-time-tap1-test ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
