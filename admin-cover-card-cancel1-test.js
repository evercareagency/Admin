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

assert.ok(html.includes('v=cover-card-cancel1'), 'cover-card-cancel1 marker');
assert.ok(html.includes('data-cover-card-cancel1="v=cover-card-cancel1"'), 'cover-card-cancel1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-cover-card-cancel1'), 'cover-card-cancel1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-cover-card-cancel1">'), 'cover-card-cancel1 meta');
assert.ok(html.includes('<!-- cover card cancel 2026-09-27 v=cover-card-cancel1 admin-build 2026-09-27-cover-card-cancel1'), 'cover-card-cancel1 comment');
assert.ok(html.includes("var COVER_CARD_CANCEL1_MARKER='v=cover-card-cancel1'"), 'script marker');
assert.ok(html.includes('GHOST-COVER-CARD-CANCEL1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-aide-notif-search1'), 'first admin-build is aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-hold-client1"') < html.indexOf('content="2026-09-27-aides-info1"'), 'aides-info1 stays after hold-client1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after aide-office-vis1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
assert.ok(html.indexOf('content="2026-09-27-tabbar-8"') < html.indexOf('content="2026-09-27-cover-card-cancel1"'), 'cover-card-cancel1 stays after tabbar-8');
['2026-09-27-remi-langs1','2026-09-27-hold-clear1','2026-09-27-remi-float-hide1','2026-09-27-tabbar-8','2026-09-27-nosvc-reason-draft1','2026-09-27-cover-unselect1','2026-09-27-remi-payroll1','2026-09-27-client-ins1','2026-09-27-remi-ideas763','2026-09-27-coverage-simple1','2026-09-27-clienthrs1c','2026-09-26-clienthrs1b','2026-09-25-aidechat1','2026-09-25-coverpick1','2026-09-25-cover1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="' + meta + '">'), 'prior meta stays ' + meta);
});
assert.ok(html.indexOf('content="2026-09-27-cover-card-cancel1"') < html.indexOf('content="2026-09-27-nosvc-reason-draft1"'), 'nosvc-reason-draft1 stays after this tip');
assert.ok(html.indexOf('content="2026-09-27-nosvc-reason-draft1"') < html.indexOf('content="2026-09-27-cover-unselect1"'), 'cover-unselect1 stays after nosvc-reason-draft1');
assert.ok(html.indexOf('content="2026-09-27-cover-unselect1"') < html.indexOf('content="2026-09-27-remi-payroll1"'), 'remi-payroll1 stays after cover-unselect1');
assert.ok(html.includes('v=coverage-simple1'), 'coverage-simple1 marker stays');
assert.ok(html.includes('v=remi-payroll1'), 'remi-payroll1 marker stays');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/cover-card-cancel1-v1.sql')), 'no new cancel SQL patch');
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');

const desk = html.slice(html.indexOf('id="tab_coverage"'), html.indexOf('id="tab_backups"'));
assert.ok(desk.includes('>Who can cover<'), 'who can cover title stays');
assert.ok(desk.includes('>Text client<'), 'text client stays on the detail sheet');
assert.ok(desk.includes('id="coverSimpleScrim"'), 'blast dialog stays');
assert.ok(!desk.includes('admin_cancel_noservice_shift'), 'cancel callable is not hardcoded in the coverage markup');

const paint = extractFn(html, 'function coverPaintList()');
const whoAt = paint.indexOf('>Who can cover</button>');
const aideAt = paint.indexOf('>Text this aide</button>');
const textAt = paint.indexOf('>Text client</button>');
const cancelAt = paint.indexOf('>Cancel</button>');
assert.ok(whoAt >= 0 && aideAt > whoAt && textAt > aideAt && cancelAt > textAt, 'card actions are Who can cover, Text this aide, Text client, Cancel');
assert.ok(paint.includes('data-cover-blast'), 'who can cover blast stays on the card');
assert.ok(paint.includes('data-cover-text'), 'text client stays on the card');
assert.ok(paint.includes('data-cover-cancel'), 'cancel sits on the card');
assert.ok(paint.indexOf('data-cover-cancel') > paint.indexOf('data-cover-id'), 'cancel is outside the card button that opens detail');

const bound = extractFn(html, 'function coverEnsureBound()');
assert.ok(bound.indexOf('data-cover-cancel') < bound.indexOf("closest('[data-cover-id]')"), 'cancel is handled before the detail opener');
assert.ok(!bound.slice(bound.indexOf('data-cover-cancel'), bound.indexOf("closest('[data-cover-id]')")).includes('coverOpenOutcome'), 'card cancel does not open the detail panel');

const block = html.slice(html.indexOf('// v=cover-card-cancel1'), html.indexOf('// end v=cover-card-cancel1'));
assert.ok(block.includes("coverSimpleRpc('admin_cancel_noservice_shift'"), 'reuses admin_cancel_noservice_shift');
assert.ok(block.includes('p_client_id') && block.includes('p_service_date') && block.includes('p_open_shift_id'), 'card passes client, date, and open shift');
assert.ok(block.includes('p_reason_code'), 'reason code stays optional');
assert.ok(block.includes('deep_link'), 'schedule refresh reads deep_link');
assert.ok(block.includes('schedLoadWeek'), 'schedule week reloads from the deep link');
assert.ok(!block.includes('admin_cover_outcome'), 'card cancel does not post a second outcome');
assert.ok(!block.includes('admin_record_client_skip'), 'card cancel does not open the no-service recorder');
assert.ok(!/sms:|mailto:|twilio|send_sms|quo\.com/.test(block), 'no Quo or SMS send');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier|auth\.updateUser/.test(block), 'no Auth reseal');
assert.ok(!block.includes('remi-float-hide1') && !block.includes('remi-langs1'), 'this block does not edit those trees');

const simple = html.slice(html.indexOf('// v=coverage-simple1 blast'), html.indexOf('// end v=coverage-simple1'));
assert.ok(simple.includes("coverSimpleRpc('admin_blast_cover_request'"), 'coverage-simple1 blast stays');
assert.ok(simple.includes("coverSimpleRpc('admin_confirm_cover_send'"), 'coverage-simple1 confirm stays');
assert.ok(!simple.includes('admin_cancel_noservice_shift'), 'cancel is not inside the blast block');

const ctx = vm.createContext({
  Intl: Intl, Date: Date, Object: Object, Math: Math, String: String, Number: Number,
  Array: Array, isFinite: isFinite, JSON: JSON
});
[
  'function sbUuid(v)',
  'function coverUuidOrNull(v)',
  'function formatAdminDate(val)',
  'function coverNyYmd(iso)',
  'function coverCardCancel1Mdy(shift)',
  'function coverCardCancel1Iso(val)',
  'function coverCardCancel1Body(shift, reasonCode)',
  'function coverCardCancel1Node(data)',
  'function coverCardCancel1Done(data)',
  'function coverCardCancel1Link(data, shift)'
].forEach(function(sig){vm.runInContext(extractFn(html, sig), ctx);});

const shift = {
  id: '22222222-2222-4222-8222-222222222222',
  clientId: '11111111-1111-4111-8111-111111111111',
  clientName: 'Bowlax',
  startsAt: '2026-09-27T12:00:00.000Z',
  endsAt: '2026-09-27T21:00:00.000Z',
  serviceDate: '2026-09-27',
  slotKey: 'default'
};
const body = vm.runInContext('coverCardCancel1Body(' + JSON.stringify(shift) + ', "")', ctx);
assert.strictEqual(body.p_client_id, shift.clientId);
assert.strictEqual(body.p_open_shift_id, shift.id);
assert.strictEqual(body.p_service_date, '09/27/2026', 'service date people read is MM/DD/YYYY');
assert.ok(!Object.prototype.hasOwnProperty.call(body, 'p_reason_code'), 'blank reason is omitted so the server default stays personal');
const withReason = vm.runInContext('coverCardCancel1Body(' + JSON.stringify(shift) + ', "doctor")', ctx);
assert.strictEqual(withReason.p_reason_code, 'doctor');
const fromClock = vm.runInContext('coverCardCancel1Mdy({startsAt:"2026-09-27T12:00:00.000Z"})', ctx);
assert.strictEqual(fromClock, '09/27/2026');
assert.strictEqual(vm.runInContext('coverCardCancel1Done({cancelled:true, next:"close_panel"})', ctx), true);
assert.strictEqual(vm.runInContext('coverCardCancel1Done({cancelled:"true"})', ctx), true, 'idempotent true still closes');
assert.strictEqual(vm.runInContext('coverCardCancel1Done({next:"close_panel"})', ctx), true);
assert.strictEqual(vm.runInContext('coverCardCancel1Done({cancelled:false, next:"close_panel"})', ctx), false);
assert.strictEqual(vm.runInContext('coverCardCancel1Done({cancelled:false})', ctx), false);
const link = vm.runInContext('coverCardCancel1Link({cancelled:true, next:"close_panel", deep_link:{client_id:"11111111-1111-4111-8111-111111111111", on_date:"2026-09-27", slot_key:"default"}}, ' + JSON.stringify(shift) + ')', ctx);
assert.strictEqual(link.on_date, '2026-09-27');
assert.strictEqual(link.slot_key, 'default');
assert.strictEqual(vm.runInContext('coverCardCancel1Iso("09/27/2026")', ctx), '2026-09-27');

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
    console.log('admin-cover-card-cancel1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.COVER_CARD_CANCEL1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const types = {'.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript'};
  const server = http.createServer(function(req, res){
    const url = req.url.split('?')[0];
    const file = path.join(root, url === '/' ? 'index.html' : url);
    if(!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
      res.writeHead(404); res.end('no'); return;
    }
    res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream'});
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const clientId = '11111111-1111-4111-8111-111111111111';
  const aideId = '33333333-3333-4333-8333-333333333333';
  const shiftId = '22222222-2222-4222-8222-222222222222';
  const devonId = '44444444-4444-4444-8444-444444444444';
  const calls = [];
  let cancelled = false;
  const shift = {
    open_shift_id: shiftId,
    client_id: clientId,
    client_name: 'Bowlax',
    service_date: '2026-09-27',
    regular_aide_id: aideId,
    regular_aide_name: 'moe',
    shift_start: '2026-09-27T12:00:00.000Z',
    shift_end: '2026-09-27T21:00:00.000Z',
    status: 'open',
    source: 'office',
    is_client_skip: true,
    exception_kind: 'client_skip',
    reason: 'client declined cover',
    slot_key: 'default'
  };
  function weekPayload(){
    return {
      success: true,
      week_start: '2026-09-21',
      clients: [{
        client_id: clientId,
        client_name: 'Bowlax',
        days: {
          '7': {
            on_date: '2026-09-27',
            slots: [{
              slot_key: 'default',
              start_local: '08:00',
              end_local: '17:00',
              hours: 8,
              usual_aide_id: aideId,
              aide_name: 'moe',
              sort_order: 0,
              mark: cancelled ? 'missed' : '',
              miss_reason: cancelled ? 'client_declined' : ''
            }]
          }
        }
      }]
    };
  }
  function arm(page){
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort(); return;}
      if(u.indexOf('127.0.0.1') >= 0 || u.indexOf('localhost') >= 0){req.continue(); return;}
      const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || 'apikey,authorization,content-type,accept,prefer'
      };
      if(req.method() === 'OPTIONS'){req.respond({status: 204, headers: cors}); return;}
      let rpc = '';
      const m = u.match(/\/rpc\/([a-z0-9_]+)/i);
      if(m)rpc = m[1];
      let body = {};
      try{body = JSON.parse(req.postData() || '{}');}catch(e){}
      if(rpc)calls.push({rpc: rpc, body: body});
      let payload = {success: true};
      if(u.indexOf('/rest/v1/clients') >= 0){
        payload = [{id: clientId, name: 'Bowlax', is_active: true}];
      }else if(u.indexOf('/rest/v1/aides') >= 0){
        payload = [
          {id: aideId, username: 'moe', full_name: 'moe', is_active: true},
          {id: devonId, username: 'devon', full_name: 'Devon Park', is_active: true}
        ];
      }else if(rpc === 'admin_list_open_shifts'){
        payload = {success: true, shifts: cancelled ? [] : [shift]};
      }else if(rpc === 'admin_rank_backup_aides'){
        payload = {success: true, aides: [{aide_id: devonId, username: 'devon', name: 'Devon Park', continuity_score: 2, distance_miles: 1.2, score: 80, rank: 1}]};
      }else if(rpc === 'admin_cancel_noservice_shift'){
        cancelled = true;
        payload = {
          success: true,
          cancelled: true,
          next: 'close_panel',
          open_shift_id: body.p_open_shift_id,
          status: 'cancelled',
          schedule_exception: {kind: 'client_skip'},
          day_mark: {mark: 'missed', miss_reason: 'client_declined'},
          deep_link: {client_id: body.p_client_id, on_date: '2026-09-27', slot_key: 'default'}
        };
      }else if(rpc === 'list_schedule_week_slots' || rpc === 'list_schedule_week'){
        payload = weekPayload();
      }else if(rpc === 'admin_cover_outcome' || rpc === 'admin_record_client_skip' || rpc === 'upsert_schedule_slot_day_mark'){
        payload = {success: false, error: 'cover-card-cancel1 must not call ' + rpc};
      }
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers: cors,
        body: JSON.stringify(payload)
      });
    });
  }
  try{
    const page = await browser.newPage();
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.setRequestInterception(true);
    arm(page);
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token: 'cover-card-cancel1-test',
        refresh_token: 'cover-card-cancel1-refresh',
        profile: {org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'Admin'}
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=cover-card-cancel1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      showTab('coverage');
    });
    await page.waitForSelector('[data-cover-cancel="' + shiftId + '"]', {timeout: 8000});
    const card = await page.evaluate(function(id){
      var wrap = document.querySelector('[data-open-shift-id="' + id + '"]');
      var actions = wrap ? wrap.querySelector('.cover-card-actions') : null;
      var labels = actions ? Array.prototype.map.call(actions.querySelectorAll('button'), function(btn){return btn.textContent.trim();}) : [];
      var outcome = document.getElementById('coverOutcomeView');
      return {
        labels: labels,
        skip: wrap ? wrap.textContent.indexOf('CLIENT-SKIP') >= 0 : false,
        office: wrap ? wrap.textContent.indexOf('Office') >= 0 : false,
        name: wrap ? wrap.textContent.indexOf('Bowlax') >= 0 : false,
        date: wrap ? wrap.getAttribute('data-service-date') : '',
        outcomeHidden: !!(outcome && outcome.hidden),
        build: document.querySelector('meta[name="admin-build"]').content
      };
    }, shiftId);
    assert.deepStrictEqual(card.labels, ['Who can cover', 'Text this aide', 'Text client', 'Cancel']);
    assert.strictEqual(card.skip, true);
    assert.strictEqual(card.office, true);
    assert.strictEqual(card.name, true);
    assert.strictEqual(card.date, '09/27/2026');
    assert.strictEqual(card.outcomeHidden, true);
    assert.strictEqual(card.build, '2026-09-27-aide-notif-search1');
    await page.screenshot({path: path.join(shotDir, 'cover-card-cancel1-phone-card.png'), fullPage: true});
    await page.setViewport({width: 1280, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 1});
    await page.screenshot({path: path.join(shotDir, 'cover-card-cancel1-desktop-card.png'), fullPage: true});
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.click('[data-cover-blast="' + shiftId + '"]');
    await page.waitForFunction(function(){
      var scrim = document.getElementById('coverSimpleScrim');
      return scrim && !scrim.hidden;
    }, {timeout: 8000});
    assert.ok(!calls.some(function(c){return c.rpc === 'admin_cancel_noservice_shift';}), 'who can cover does not cancel');
    await page.evaluate(function(){if(typeof coverSimpleClose === 'function')coverSimpleClose();});
    await page.click('[data-cover-text="' + shiftId + '"]');
    await page.waitForFunction(function(){
      var view = document.getElementById('coverOutcomeView');
      return view && !view.hidden;
    }, {timeout: 8000});
    assert.ok(!calls.some(function(c){return c.rpc === 'admin_cancel_noservice_shift';}), 'text client does not cancel');
    await page.click('#coverOutcomeBack');
    await page.waitForSelector('[data-cover-cancel="' + shiftId + '"]');
    const beforeCancel = calls.filter(function(c){return c.rpc === 'admin_cancel_noservice_shift';}).length;
    await page.$eval('[data-cover-cancel="' + shiftId + '"]', function(el){el.scrollIntoView({block: 'center'});});
    await page.evaluate(function(id){
      document.querySelector('[data-cover-cancel="' + id + '"]').click();
    }, shiftId);
    await page.waitForFunction(function(){
      var empty = document.getElementById('coverEmpty');
      var banner = document.getElementById('coverSimpleBanner');
      var outcome = document.getElementById('coverOutcomeView');
      return empty && !empty.hidden && banner && !banner.hidden && /Cancelled/.test(banner.textContent) && outcome && outcome.hidden && !document.querySelector('[data-cover-cancel]');
    }, {timeout: 8000});
    const cancelCalls = calls.filter(function(c){return c.rpc === 'admin_cancel_noservice_shift';});
    assert.strictEqual(cancelCalls.length, beforeCancel + 1);
    assert.strictEqual(cancelCalls[0].body.p_client_id, clientId);
    assert.strictEqual(cancelCalls[0].body.p_open_shift_id, shiftId);
    assert.strictEqual(cancelCalls[0].body.p_service_date, '09/27/2026');
    assert.ok(!Object.prototype.hasOwnProperty.call(cancelCalls[0].body, 'p_reason_code'));
    assert.ok(calls.some(function(c){return c.rpc === 'list_schedule_week_slots' && c.body.p_week_start === '2026-09-21';}), 'schedule refreshes the deep_link week');
    assert.ok(!calls.some(function(c){return c.rpc === 'admin_cover_outcome' || c.rpc === 'admin_record_client_skip' || c.rpc === 'upsert_schedule_slot_day_mark';}), 'no second cancel engine');
    const after = await page.evaluate(function(){
      return {
        gone: !document.querySelector('[data-open-shift-id]'),
        empty: document.getElementById('coverEmpty').textContent,
        banner: document.getElementById('coverSimpleBanner').textContent,
        outcome: document.getElementById('coverOutcomeView').hidden,
        open: document.getElementById('coverStatOpen').textContent,
        link: (typeof schedPendingDeepLink !== 'undefined' && schedPendingDeepLink) ? schedPendingDeepLink.on_date : ''
      };
    });
    assert.strictEqual(after.gone, true);
    assert.ok(/No open shifts/.test(after.empty));
    assert.ok(/Bowlax/.test(after.empty));
    assert.ok(/09\/27\/2026/.test(after.banner));
    assert.strictEqual(after.outcome, true);
    assert.strictEqual(after.open, '0');
    assert.strictEqual(after.link, '2026-09-27');
    await page.screenshot({path: path.join(shotDir, 'cover-card-cancel1-phone-cancelled.png'), fullPage: true});
    await page.setViewport({width: 1280, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 1});
    await page.screenshot({path: path.join(shotDir, 'cover-card-cancel1-desktop-cancelled.png'), fullPage: true});
    await page.evaluate(function(row){
      coverShifts = [coverMapShift(row)];
      coverCardCancel1Note = '';
      coverPaintList();
    }, shift);
    await page.waitForSelector('[data-cover-cancel="' + shiftId + '"]');
    await page.evaluate(function(id){
      document.querySelector('[data-cover-cancel="' + id + '"]').click();
    }, shiftId);
    await page.waitForFunction(function(){
      return !document.querySelector('[data-cover-cancel]');
    }, {timeout: 8000});
    const again = calls.filter(function(c){return c.rpc === 'admin_cancel_noservice_shift';});
    assert.strictEqual(again.length, 2, 'a second tap still calls the same cancel');
    assert.strictEqual(again[1].body.p_open_shift_id, shiftId);
    assert.strictEqual(again[1].body.p_service_date, '09/27/2026');
    console.log('admin-cover-card-cancel1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-cover-card-cancel1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
