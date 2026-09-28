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

assert.ok(html.includes('v=coverage-simple1'), 'coverage-simple1 marker');
assert.ok(html.includes('data-coverage-simple1="v=coverage-simple1"'), 'coverage-simple1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-coverage-simple1'), 'coverage-simple1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage-simple1 meta');
assert.ok(html.includes('<!-- coverage simplify 2026-09-27 v=coverage-simple1 admin-build 2026-09-27-coverage-simple1'), 'coverage-simple1 comment');
assert.ok(html.includes('GHOST-COVERAGE-SIMPLE1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes("var COVERAGE_SIMPLE1_MARKER='v=coverage-simple1'"), 'script marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build is remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-27-list-az1"'), 'list-az1 stays after remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-hold-autosave1"'), 'hold-autosave1 stays after list-az1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
['2026-09-27-clienthrs1c','2026-09-27-shift-slim1','2026-09-26-isdash1b','2026-09-26-clienthrs1b','2026-09-25-aidechat1','2026-09-25-coverpick1','2026-09-25-cover1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="' + meta + '">'), 'prior meta stays ' + meta);
});
assert.ok(html.indexOf('content="2026-09-27-coverage-simple1"') < html.indexOf('content="2026-09-27-clienthrs1c"'), 'clienthrs1c stays below this tip');
assert.ok(html.includes('v=clienthrs1c'), 'clienthrs1c marker stays');
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('No SMS') && html.includes('No email') && html.includes('No Auth reseal'), 'hard rules in the note');

const desk = html.slice(html.indexOf('id="tab_coverage"'), html.indexOf('id="tab_backups"'));
assert.ok(desk.includes('id="coverNoAssign"'), 'record screen says no assign');
assert.ok(desk.includes('No Assign aide on this screen'), 'no assign copy');
assert.ok(desk.includes('id="coverSimpleScrim"'), 'blast dialog');
assert.ok(desk.includes('admin_blast_cover_request') === false, 'blast callable is not hardcoded in the coverage markup');
assert.ok(desk.includes('>Who can cover<'), 'ranked list title stays');
assert.ok(desk.includes('id="coverRankList"'), 'ranked list stays');
assert.ok(desk.includes('id="coverPickOtherBtn"'), 'pick another aide stays');
assert.ok(desk.includes('>Client refused'), 'refuse stays');
assert.ok(desk.includes('id="coverBackupSel"'), 'confirm assign stays on the outcome sheet');
assert.ok(desk.indexOf('id="coverRankList"') < desk.indexOf('id="coverPickOtherBtn"'), 'rank stays above pick another');
assert.ok(!/sms:|mailto:/.test(desk.slice(desk.indexOf('id="coverSimpleScrim"'))), 'blast dialog does not open Messages or Mail');

const simple = html.slice(html.indexOf('// v=coverage-simple1 blast'), html.indexOf('// end v=coverage-simple1'));
assert.ok(simple.includes("coverSimpleRpc('admin_blast_cover_request'"), 'blast callable');
assert.ok(simple.includes("coverSimpleRpc('admin_confirm_cover_send'"), 'confirm callable');
assert.ok(simple.includes('p_open_shift_id') && simple.includes('p_aide_ids') && simple.includes('p_address_mode'), 'blast args');
assert.ok(simple.includes('p_backup_aide_id') && simple.includes('p_slot_key') && simple.includes('p_confirm_body'), 'confirm args');
assert.ok(!simple.includes('admin_cover_outcome'), 'confirm does not post a second outcome');
assert.ok(!simple.includes('upsert_schedule_slot_day_mark'), 'confirm does not post a manual day mark');
assert.ok(!/sms:|mailto:/.test(simple), 'this tip does not open Messages or Mail');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser/.test(simple), 'no Auth reseal');

const record = extractFn(html, 'async function coverRecordCalloff()');
assert.ok(record.includes("showTempMsg('Call-off recorded. Shift is open.'"), 'record toast stays');
assert.ok(record.indexOf('coverReload({keepOnFail:true})') < record.indexOf("showTempMsg('Call-off recorded. Shift is open.'"), 'refetch still starts before the toast');
assert.ok(record.includes('coverSimpleAfterRecord'), 'record opens the blast next');
assert.ok(extractFn(html, 'function coverRecordBody(clientId, aideId, shiftStart, shiftEnd, reason)').includes('p_regular_aide_id'), 'record still names the regular aide');
assert.ok(!extractFn(html, 'var COVER_RPC=').includes('admin_blast_cover_request'), 'blast stays off the old cover RPC map');

const ctx = vm.createContext({Intl: Intl, Date: Date, Object: Object, Math: Math, String: String, Number: Number, Array: Array, isFinite: isFinite});
[
  'function coverNyYmd(iso)',
  'function coverSimpleLocalMinutes(hhmm)',
  'function coverSimpleNyMinutes(iso)',
  'function coverSimpleOverlap(a0,a1,b0,b1)',
  'function coverSimpleDayRows(client)',
  'function coverSimplePickSlot(shift, clients)',
  'function coverSimpleBlastBody(openShiftId, aideIds, mode)',
  'function coverSimpleConfirmBody(openShiftId, aideId, slotKey, confirmBody)',
  'function coverSimpleDraftText(ctx)',
  'function coverSimpleIsYes(text)',
  'function coverSimpleLooksLikeBlast(body)',
  'function coverSimpleBlastPreview(ctx)',
  'function coverSimpleFullAddress(shift)',
  'function coverSimpleAreaLine(shift)'
].forEach(function(sig){vm.runInContext(extractFn(html, sig), ctx);});

const clients = [{
  id: 'ada',
  name: 'Ada Cole',
  days: {
    '5': {
      on_date: '2026-09-25',
      slots: [
        {slot_key: 'am', start_local: '08:00', end_local: '13:00', usual_aide_id: 'sara', aide_name: 'Sara Nguyen'},
        {slot_key: 'pm', start_local: '15:00', end_local: '20:00', usual_aide_id: 'kim', aide_name: 'Kim Lee'}
      ]
    }
  }
}];
ctx.clients = clients;
assert.strictEqual(vm.runInContext('coverSimplePickSlot({clientId:"ada", aideId:"kim", startsAt:"2026-09-25T19:00:00.000Z", endsAt:"2026-09-26T00:00:00.000Z"}, clients)', ctx), 'pm', 'evening call-off uses the pm slot');
assert.strictEqual(vm.runInContext('coverSimplePickSlot({clientId:"missing"}, [])', ctx), 'default', 'unknown board uses default');
assert.strictEqual(vm.runInContext('coverSimplePickSlot({clientId:"ada", startsAt:"2026-09-25T12:00:00.000Z", endsAt:"2026-09-25T16:00:00.000Z"}, [{id:"ada", name:"Ada", days:{"5":{on_date:"2026-09-25", slots:[{slot_key:"am", start_local:"08:00", end_local:"12:00"}]}}}])', ctx), 'am', 'the only slot key is passed through');
const blast = vm.runInContext('coverSimpleBlastBody("os-1", ["a","a","b"], "FULL")', ctx);
assert.strictEqual(blast.p_open_shift_id, 'os-1');
assert.strictEqual(blast.p_address_mode, 'full');
assert.deepStrictEqual(Array.from(blast.p_aide_ids), ['a', 'b']);
const area = vm.runInContext('coverSimpleBlastBody("os-1", ["a"], "street")', ctx);
assert.strictEqual(area.p_address_mode, 'area', 'unknown mode stays area');
const confirm = vm.runInContext('coverSimpleConfirmBody("os-1", "devon", "pm", "Ada Cole\\n1842 Euclid Ave\\nShift is yours, Devon")', ctx);
assert.strictEqual(confirm.p_slot_key, 'pm');
assert.ok(confirm.p_confirm_body.indexOf('1842 Euclid Ave') >= 0);
const fallback = vm.runInContext('coverSimpleConfirmBody("os-1", "devon", "", "")', ctx);
assert.strictEqual(fallback.p_slot_key, 'default');
assert.ok(!Object.prototype.hasOwnProperty.call(fallback, 'p_confirm_body'), 'empty confirm body is omitted');
assert.strictEqual(vm.runInContext('coverSimpleIsYes("Yes I can take it")', ctx), true);
assert.strictEqual(vm.runInContext('coverSimpleIsYes("No I cannot")', ctx), false);
assert.strictEqual(vm.runInContext('coverSimpleLooksLikeBlast("Coverage needed · Ada\\nReply yes in this chat if you can take it.")', ctx), true);
const draft = vm.runInContext('coverSimpleDraftText({client_name:"Ada Cole", full_address:"1842 Euclid Ave, Cleveland, OH 44115", when_label:"Fri 09/25/2026 · 3:00 PM–8:00 PM", aide_name:"Devon Park"})', ctx);
assert.ok(draft.indexOf('1842 Euclid Ave, Cleveland, OH 44115') >= 0, 'draft has the full street');
assert.ok(draft.indexOf('Shift is yours, Devon') >= 0, 'draft names the aide');
const preview = vm.runInContext('coverSimpleBlastPreview({client_name:"Ada Cole", address_mode:"area", area:"Euclid Ave / Cleveland", when_label:"Fri 09/25/2026 · 3:00 PM–8:00 PM"})', ctx);
assert.ok(preview.indexOf('Area: Euclid Ave / Cleveland') >= 0);
assert.ok(preview.indexOf('1842') < 0, 'area blast preview holds the street back');

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
    console.log('admin-coverage-simple1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.COVERAGE_SIMPLE_SHOTS || '/opt/cursor/artifacts';
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
  const clientId = '22222222-2222-4222-8222-222222222222';
  const kimId = '33333333-3333-4333-8333-333333333333';
  const devonId = '44444444-4444-4444-8444-444444444444';
  const shiftId = '55555555-5555-4555-8555-555555555555';
  const threadId = '66666666-6666-4666-8666-666666666666';
  const calls = [];
  let confirmed = false;
  const shift = {
    open_shift_id: shiftId,
    client_id: clientId,
    client_name: 'Ada Cole',
    client_home_address: '1842 Euclid Ave, Cleveland, OH 44115',
    regular_aide_id: kimId,
    regular_aide_name: 'Kim Lee',
    shift_start: '2026-09-25T19:00:00.000Z',
    shift_end: '2026-09-26T00:00:00.000Z',
    status: 'open',
    source: 'office',
    reason: 'Sick'
  };
  const aides = [
    {aide_id: devonId, username: 'devon', name: 'Devon Park', continuity_score: 3, distance_miles: 2.1, score: 90, rank: 1},
    {aide_id: '77777777-7777-4777-8777-777777777771', username: 'jamal', name: 'Jamal Wright', continuity_score: 1, distance_miles: 3.4, score: 80, rank: 2},
    {aide_id: '77777777-7777-4777-8777-777777777772', username: 'aisha', name: 'Aisha Khan', continuity_score: 0, distance_miles: 4, score: 70, rank: 3}
  ];
  function weekPayload(){
    return {
      success: true,
      week_start: '2026-09-21',
      clients: [{
        client_id: clientId,
        client_name: 'Ada Cole',
        days: {
          '5': {
            on_date: '2026-09-25',
            slots: [
              {slot_key: 'am', start_local: '08:00', end_local: '13:00', hours: 5, usual_aide_id: 'sara', aide_name: 'Sara Nguyen', sort_order: 0},
              {
                slot_key: 'pm', start_local: '15:00', end_local: '20:00', hours: 5, sort_order: 1,
                usual_aide_id: kimId, aide_name: 'Kim Lee',
                mark: confirmed ? 'cover' : '',
                cover_aide_id: confirmed ? devonId : '',
                cover_aide_name: confirmed ? 'Devon Park' : ''
              }
            ]
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
        payload = [{id: clientId, name: 'Ada Cole', address: '1842 Euclid Ave, Cleveland, OH 44115', is_active: true, weekly_authorized_hours: 63}];
      }else if(u.indexOf('/rest/v1/aides') >= 0){
        payload = [
          {id: kimId, username: 'kim', full_name: 'Kim Lee', is_active: true},
          {id: devonId, username: 'devon', full_name: 'Devon Park', is_active: true}
        ];
      }else if(rpc === 'admin_list_open_shifts'){
        payload = {success: true, shifts: [shift]};
      }else if(rpc === 'admin_rank_backup_aides'){
        payload = {success: true, aides: aides};
      }else if(rpc === 'admin_blast_cover_request'){
        payload = {
          success: true, ok: true, open_shift_id: shiftId, status: 'open', assigned: false,
          address_mode: body.p_address_mode || 'area', blast_count: (body.p_aide_ids || []).length,
          aide_ids: body.p_aide_ids || [],
          payload: {
            client_name: 'Ada Cole', shift_date: '2026-09-25', time_label: '3:00 PM–8:00 PM',
            address_mode: body.p_address_mode || 'area',
            full_address: '1842 Euclid Ave, Cleveland, OH 44115',
            area: 'Euclid Ave / Cleveland'
          }
        };
      }else if(rpc === 'admin_confirm_cover_send'){
        confirmed = true;
        payload = {
          success: true, ok: true, open_shift_id: shiftId, backup_aide_id: devonId,
          on_date: '2026-09-25', slot_key: body.p_slot_key,
          day_mark: {mark: 'cover', deep_link: {client_id: clientId, on_date: '2026-09-25', slot_key: body.p_slot_key}},
          deep_link: {client_id: clientId, on_date: '2026-09-25', slot_key: body.p_slot_key}
        };
      }else if(rpc === 'admin_list_aide_office_threads'){
        payload = {success: true, threads: [{
          thread_id: threadId, aide_id: devonId, aide_name: 'Devon Park', username: 'devon', last_message: 'Yes I can take it'
        }]};
      }else if(rpc === 'admin_list_aide_office_messages'){
        payload = {success: true, messages: [
          {id: 'm1', sender: 'office', body: 'Coverage needed · Ada Cole\nFri 09/25/2026 · 3:00 PM–8:00 PM\nArea: Euclid Ave / Cleveland\nReply yes in this chat if you can take it.'},
          {id: 'm2', sender: 'aide', body: 'Yes I can take it'}
        ]};
      }else if(rpc === 'list_schedule_week_slots' || rpc === 'list_schedule_week'){
        payload = weekPayload();
      }else if(rpc === 'admin_cover_outcome' || rpc === 'upsert_schedule_slot_day_mark'){
        payload = {success: false, error: 'coverage-simple1 must not call ' + rpc};
      }
      const list = u.indexOf('/rest/v1/clients') >= 0 || u.indexOf('/rest/v1/aides') >= 0;
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers: cors,
        body: JSON.stringify(list ? payload : payload)
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
        access_token: 'coverage-simple1-test',
        refresh_token: 'coverage-simple1-refresh',
        profile: {org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'Admin'}
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=coverage-simple1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      showTab('coverage');
    });
    await page.waitForSelector('[data-cover-id="' + shiftId + '"]', {timeout: 8000});
    await page.click('[data-cover-id="' + shiftId + '"]');
    await page.waitForFunction(function(){
      var view = document.getElementById('coverOutcomeView');
      return view && !view.hidden && document.getElementById('coverPickOtherBtn') && document.getElementById('coverRefuseBtn');
    }, {timeout: 8000});
    await page.click('#coverOutcomeBack');
    await page.waitForSelector('#coverIntakeOpen');
    await page.click('#coverIntakeOpen');
    await page.waitForSelector('#coverNoAssign');
    const intake = await page.evaluate(function(){
      var view = document.getElementById('coverIntakeView');
      var assign = view ? view.querySelector('#coverBackupSel, #coverAssignBtn') : null;
      return {
        open: !!(view && !view.hidden),
        noAssign: document.getElementById('coverNoAssign').textContent,
        assignInIntake: !!assign
      };
    });
    assert.strictEqual(intake.open, true);
    assert.ok(/No Assign aide/.test(intake.noAssign));
    assert.strictEqual(intake.assignInIntake, false, 'record step has no assign control');
    await page.screenshot({path: path.join(shotDir, 'coverage-simple1-phone-record.png'), fullPage: true});
    await page.click('#coverRecordCancel');
    await page.waitForSelector('[data-cover-blast="' + shiftId + '"]');
    await page.click('[data-cover-blast="' + shiftId + '"]');
    await page.waitForFunction(function(){
      var scrim = document.getElementById('coverSimpleScrim');
      var preview = document.getElementById('coverSimplePreview');
      return scrim && !scrim.hidden && preview && /Area:/.test(preview.textContent) && /1842/.test(preview.textContent) === false;
    }, {timeout: 8000});
    const blastUi = await page.evaluate(function(){
      return {
        count: document.getElementById('coverSimpleCount').textContent,
        areaOn: document.getElementById('coverSimpleArea').classList.contains('is-on'),
        kim: /Called off/.test(document.getElementById('coverSimpleAides').textContent)
      };
    });
    assert.ok(/selected/.test(blastUi.count));
    assert.strictEqual(blastUi.areaOn, true);
    await page.screenshot({path: path.join(shotDir, 'coverage-simple1-phone-blast.png'), fullPage: true});
    await page.setViewport({width: 1280, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.screenshot({path: path.join(shotDir, 'coverage-simple1-desktop-blast.png'), fullPage: true});
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.$eval('#coverSimpleSendBlast', function(el){el.scrollIntoView({block: 'center'});});
    await page.evaluate(function(){
      document.getElementById('coverSimpleSendBlast').click();
    });
    await page.waitForFunction(function(){
      var scrim = document.getElementById('coverSimpleScrim');
      return scrim && scrim.hidden;
    }, {timeout: 8000});
    const blastCall = calls.filter(function(c){return c.rpc === 'admin_blast_cover_request';}).pop();
    assert.ok(blastCall, 'blast callable fired');
    assert.strictEqual(blastCall.body.p_address_mode, 'area');
    assert.ok(blastCall.body.p_aide_ids.indexOf(devonId) >= 0);
    assert.ok(blastCall.body.p_aide_ids.indexOf(kimId) < 0, 'regular aide is not blasted');
    assert.ok(!calls.some(function(c){return c.rpc === 'admin_cover_outcome';}), 'blast does not assign');
    await page.evaluate(function(){showTab('aidechat');});
    await page.waitForSelector('[data-aidechat-thread="' + threadId + '"]', {timeout: 8000});
    await page.click('[data-aidechat-thread="' + threadId + '"]');
    await page.waitForFunction(function(){
      var draft = document.getElementById('coverSimpleDraft');
      var text = document.getElementById('coverSimpleDraftText');
      return draft && !draft.hidden && text && /1842 Euclid Ave/.test(text.textContent) && /Shift is yours, Devon/.test(text.textContent);
    }, {timeout: 8000});
    await page.screenshot({path: path.join(shotDir, 'coverage-simple1-phone-draft.png'), fullPage: true});
    await page.setViewport({width: 1280, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.screenshot({path: path.join(shotDir, 'coverage-simple1-desktop-draft.png'), fullPage: true});
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.evaluate(function(){
      document.getElementById('coverSimpleConfirm').click();
    });
    await page.waitForFunction(function(){
      var banner = document.getElementById('coverSimpleSchedBanner');
      var chip = document.querySelector('#schedBody .sched-chip.is-cover');
      return banner && !banner.hidden && /Covered/.test(banner.textContent) && chip && /Devon/.test(chip.textContent);
    }, {timeout: 8000});
    const send = calls.filter(function(c){return c.rpc === 'admin_confirm_cover_send';}).pop();
    assert.ok(send, 'confirm callable fired');
    assert.strictEqual(send.body.p_slot_key, 'pm', 'multi-slot evening uses pm');
    assert.strictEqual(send.body.p_backup_aide_id, devonId);
    assert.ok(String(send.body.p_confirm_body || '').indexOf('1842 Euclid Ave') >= 0);
    assert.ok(!calls.some(function(c){return c.rpc === 'upsert_schedule_slot_day_mark' || c.rpc === 'admin_cover_outcome';}), 'Send does not add a manual Schedule or outcome call');
    await page.screenshot({path: path.join(shotDir, 'coverage-simple1-phone-schedule.png'), fullPage: true});
    await page.setViewport({width: 1280, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.screenshot({path: path.join(shotDir, 'coverage-simple1-desktop-schedule.png'), fullPage: true});
    console.log('admin-coverage-simple1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-coverage-simple1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
