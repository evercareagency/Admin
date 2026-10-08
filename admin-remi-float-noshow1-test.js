#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

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

assert.ok(html.includes('v=remi-float-noshow1'), 'remi-float-noshow1 marker');
assert.ok(html.includes('data-remi-float-noshow1="v=remi-float-noshow1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-float-noshow1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-float-noshow1">'), 'meta');
assert.ok(html.includes('<!-- remi float noshow 2026-09-27 v=remi-float-noshow1 admin-build 2026-09-27-remi-float-noshow1'), 'comment');
assert.ok(html.includes("var REMI_FLOAT_NOSHOW1_MARKER='v=remi-float-noshow1'"), 'script marker');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('GHOST-REMI-FLOAT-NOSHOW1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('id="remiFloatHost"'), 'rail host');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build is remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-27-list-az1"'), 'list-az1 stays after remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-hold-autosave1"'), 'hold-autosave1 stays after list-az1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-noshow1"') < html.indexOf('content="2026-09-27-remi-proof1"'), 'proof stays after this tip');
assert.ok(html.indexOf('content="2026-09-27-remi-proof1"') < html.indexOf('content="2026-09-27-remi-sched1"'), 'sched follows proof');
assert.ok(html.indexOf('content="2026-09-27-remi-sched1"') < html.indexOf('content="2026-09-27-remi-rules1"'), 'rules follows sched');
assert.ok(html.indexOf('content="2026-09-27-remi-rules1"') < html.indexOf('content="2026-09-27-remi-notes-vis1"'), 'notes vis follows rules');
['v=remi-proof1','v=remi-sched1','v=remi-rules1','v=remi-notes-vis1','v=coverage-simple1','v=vapid1','v=clienthrs1d','v=remi-cm-email1','v=remiface1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage-simple1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-proof1">'), 'proof meta stays');
assert.ok(html.includes('Ignore remi-ideas763 and 03-why-open'), 'later ideas stay out of this marker');
assert.ok(!html.includes('admin_why_open'), 'why-open is not wired');

const start = html.indexOf('// remi float noshow1 v=remi-float-noshow1');
const end = html.indexOf('// end remi float noshow1 v=remi-float-noshow1');
assert.ok(start > 0 && end > start, 'script block');
const src = html.slice(start, end);
assert.ok(src.includes('admin_rank_float_pool_aides'), 'float rank rpc');
assert.ok(src.includes('admin_blast_cover_request'), 'open-hole blast stays the coverage blast');
assert.ok(src.includes('admin_list_due_noshow_rescues'), 'noshow list rpc');
assert.ok(src.includes('admin_confirm_noshow_rescue'), 'noshow confirm rpc');
assert.ok(src.includes('admin_dismiss_noshow_rescue'), 'noshow dismiss rpc');
assert.ok(src.includes('is_scheduler_office'), 'office gate');
assert.ok(src.includes('sbRestRpc'), 'office JWT via sbRestRpc');
assert.ok(src.includes('remi_noshow_grace_minutes'), 'grace setting');
assert.ok(src.includes('42501'), 'nurse 42501');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|send_sms|sms:/.test(src), 'no Quo or SMS');
assert.ok(!src.includes('admin_rank_backup_aides'), 'does not replace backup rank');
assert.ok(!src.includes('admin_confirm_cover_send'), 'does not replace cover confirm');

const poll = extractFn(html, 'async function remiFloat1Poll()');
assert.ok(poll.includes("remiFloat1Rpc('admin_list_due_noshow_rescues'"), 'poll loads due rescues');
assert.ok(!poll.includes('admin_blast_cover_request'), 'poll never blasts');
assert.ok(!poll.includes('admin_confirm_noshow_rescue'), 'poll never confirms');
assert.ok(!poll.includes('admin_dismiss_noshow_rescue'), 'poll never dismisses');

const simple = html.slice(html.indexOf('// v=coverage-simple1 blast'), html.indexOf('// end v=coverage-simple1'));
assert.ok(simple.includes("coverSimpleRpc('admin_blast_cover_request'"), 'coverage blast stays');
assert.ok(simple.includes("coverSimpleRpc('admin_confirm_cover_send'"), 'coverage confirm stays');
assert.ok(simple.includes("coverRpc('rank'"), 'coverage rank stays admin_rank_backup_aides path');
assert.ok(!simple.includes('admin_rank_float_pool_aides'), 'float rank is not inside coverage-simple1');
assert.ok(!simple.includes('admin_confirm_noshow_rescue'), 'noshow confirm is not inside coverage-simple1');

const SHIFT = '55555555-5555-4555-8555-555555555555';
const DEVON = '44444444-4444-4444-8444-444444444441';
const LINA = '44444444-4444-4444-8444-444444444442';
const SARA = '44444444-4444-4444-8444-444444444443';
const JAMAL = '44444444-4444-4444-8444-444444444444';
const MARIA = '44444444-4444-4444-8444-444444444445';
const RESCUE = '66666666-6666-4666-8666-666666666666';
const RANK = {
  success: true,
  ok: true,
  marker: 'remi-float-noshow1',
  open_shift_id: SHIFT,
  client_name: 'Test Client Alpha',
  shift_start: '2026-09-27T13:00:00.000Z',
  shift_end: '2026-09-27T17:00:00.000Z',
  assigned_aide_id: MARIA,
  float_pool: [
    {rank: 1, aide_id: DEVON, name: 'Devon', same_day_yes_30d: 8, miles: 2.1, is_float: true},
    {rank: 2, aide_id: LINA, name: 'Lina', same_day_yes_30d: 6, miles: 3, is_float: true},
    {rank: 3, aide_id: SARA, name: 'Sara', same_day_yes_30d: 4, miles: 1.8, is_float: true}
  ],
  rest: [
    {rank: 4, aide_id: JAMAL, name: 'Jamal', same_day_yes_30d: 0, miles: 5.2, is_float: false},
    {rank: 5, aide_id: MARIA, name: 'Maria', same_day_yes_30d: 1, miles: 1.1, is_float: false}
  ]
};
const RESCUE_CARD = {
  id: RESCUE,
  status: 'pending',
  client_name: 'Test Client Alpha',
  assigned_aide_id: MARIA,
  assigned_aide_name: 'Maria',
  shift_start: '2026-09-27T13:00:00.000Z',
  shift_end: '2026-09-27T17:00:00.000Z',
  grace_minutes: 20,
  float_pool: [
    {rank: 1, aide_id: DEVON, name: 'Devon', same_day_yes_30d: 8, miles: 2.1, is_float: true},
    {rank: 2, aide_id: LINA, name: 'Lina', same_day_yes_30d: 6, miles: 3, is_float: true},
    {rank: 9, aide_id: MARIA, name: 'Maria', same_day_yes_30d: 1, miles: 1, is_float: true}
  ]
};

function runSlice(){
  const sandbox = {
    currentAdminRole: 'Admin',
    console: console,
    Intl: Intl,
    Date: Date,
    JSON: JSON,
    Math: Math,
    Number: Number,
    String: String,
    Array: Array,
    Object: Object,
    isFinite: isFinite,
    setInterval: function(){return 0;},
    clearInterval: function(){}
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_FLOAT_NOSHOW1_MARKER, 'v=remi-float-noshow1');
  assert.strictEqual(sandbox.REMI_FLOAT_NOSHOW1_OFFICE, 'is_scheduler_office');
  assert.strictEqual(sandbox.REMI_FLOAT_GRACE_DEFAULT, 20);
  assert.strictEqual(sandbox.remiFloat1GraceFrom(null), 20);
  assert.strictEqual(sandbox.remiFloat1GraceFrom({minutes: 15}), 15);
  assert.strictEqual(sandbox.remiFloat1GraceFrom({value: {minutes: 25}}), 25);
  assert.strictEqual(sandbox.remiFloat1GraceFrom('{"minutes":30}'), 30);
  assert.strictEqual(sandbox.remiFloat1Date('2026-09-27T13:00:00.000Z'), '09/27/2026');
  const intro = sandbox.remiFloat1Intro({client: 'Test Client Alpha', start: '2026-09-27T13:00:00.000Z', end: '2026-09-27T17:00:00.000Z'});
  assert.ok(intro.indexOf('Test Client Alpha is open') === 0, intro);
  assert.ok(intro.indexOf('9:00') >= 0, intro);
  assert.ok(!/\d{4}-\d{2}-\d{2}/.test(intro), intro);
  const rankBody = sandbox.remiFloat1RankBody(SHIFT);
  assert.strictEqual(rankBody.p_open_shift_id, SHIFT);
  assert.strictEqual(JSON.stringify(sandbox.remiFloat1ListBody()), JSON.stringify({p_limit: 20}));
  const confirmBody = sandbox.remiFloat1ConfirmBody(RESCUE);
  assert.strictEqual(JSON.stringify(confirmBody), JSON.stringify({p_rescue_id: RESCUE}));
  assert.ok(!Object.prototype.hasOwnProperty.call(confirmBody, 'p_aide_ids'), 'confirm lets Ace pick the float pool and exclude the assignee');
  assert.strictEqual(JSON.stringify(sandbox.remiFloat1DismissBody(RESCUE)), JSON.stringify({p_rescue_id: RESCUE}));

  sandbox.remiFloat1Rank = RANK;
  sandbox.remiFloat1ShiftId = SHIFT;
  sandbox.remiFloat1SeedPicked(RANK);
  const chosen = sandbox.remiFloat1ChosenIds();
  assert.ok(chosen.indexOf(DEVON) >= 0);
  assert.ok(chosen.indexOf(MARIA) < 0, 'assigned aide is not a blast choice');
  const card = sandbox.remiFloat1FloatHtml();
  assert.ok(card.indexOf('Float pool') >= 0, card);
  assert.ok(card.indexOf('Devon') >= 0, card);
  assert.ok(card.indexOf('8 same-day yes') >= 0, card);
  assert.ok(card.indexOf('2.1 mi') >= 0, card);
  assert.ok(card.indexOf('>Float<') >= 0, card);
  assert.ok(card.indexOf('Rest of list') >= 0, card);
  assert.ok(card.indexOf('Jamal') >= 0, card);
  assert.ok(card.indexOf('0 same-day yes') >= 0, card);
  assert.ok(card.indexOf('5.2 mi') >= 0, card);
  assert.ok(card.indexOf('Confirm blast') >= 0, card);
  assert.ok(card.indexOf('Edit list') >= 0, card);
  assert.ok(card.indexOf('Maria') < 0, 'float card drops the assignee');

  const rescueHtml = sandbox.remiFloat1NoshowHtml(RESCUE_CARD);
  assert.ok(rescueHtml.indexOf('Maria no reply 20 min past start') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('Test Client Alpha') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('Devon') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('>Float<') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('>Confirm<') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('>Dismiss<') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('Won\u2019t re-blast Maria') >= 0, rescueHtml);
  assert.ok((rescueHtml.match(/Maria/g) || []).length === 2, 'Maria is the title and the note, not a suggested aide');

  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name: name, body: body});
    if(name === 'admin_rank_float_pool_aides')return {ok: true, data: RANK};
    if(name === 'admin_blast_cover_request')return {ok: true, data: {success: true, blast_count: (body.p_aide_ids || []).length, assigned: false}};
    if(name === 'admin_list_due_noshow_rescues')return {ok: true, data: {success: true, grace_minutes: 20, rescues: [RESCUE_CARD]}};
    if(name === 'admin_confirm_noshow_rescue')return {ok: true, data: {success: true, status: 'blasted'}};
    if(name === 'admin_dismiss_noshow_rescue')return {ok: true, data: {success: true, status: 'dismissed'}};
    return {ok: false, error: 'unexpected ' + name};
  };
  sandbox.sbRestGet = async function(){
    return {ok: true, data: [{key: 'remi_noshow_grace_minutes', value: {minutes: 20}}]};
  };
  const ranked = await sandbox.remiFloat1LoadRank(SHIFT);
  assert.strictEqual(ranked.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_rank_float_pool_aides');
  assert.strictEqual(rpc[0].body.p_open_shift_id, SHIFT);
  sandbox.remiFloat1Editing = true;
  delete sandbox.remiFloat1Picked[JAMAL];
  const blasted = await sandbox.remiFloat1ConfirmBlast();
  assert.strictEqual(blasted.ok, true);
  const blast = rpc.filter(function(row){return row.name === 'admin_blast_cover_request';}).pop();
  assert.ok(blast, 'confirm blast uses admin_blast_cover_request');
  assert.strictEqual(blast.body.p_open_shift_id, SHIFT);
  assert.strictEqual(blast.body.p_address_mode, 'area');
  assert.ok(blast.body.p_aide_ids.indexOf(DEVON) >= 0);
  assert.ok(blast.body.p_aide_ids.indexOf(JAMAL) < 0, 'unchecked rest aide is not blasted');
  assert.ok(blast.body.p_aide_ids.indexOf(MARIA) < 0, 'assignee is not blasted');
  rpc.length = 0;
  const again = await sandbox.remiFloat1ConfirmBlast();
  assert.strictEqual(again.ok, false);
  assert.strictEqual(rpc.length, 0, 'blasted hole does not spam confirm');

  rpc.length = 0;
  const listed = await sandbox.remiFloat1Poll();
  assert.strictEqual(listed.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_list_due_noshow_rescues');
  assert.strictEqual(JSON.stringify(rpc[0].body), JSON.stringify({p_limit: 20}));
  assert.ok(!rpc.some(function(row){return row.name === 'admin_blast_cover_request' || row.name === 'admin_confirm_noshow_rescue';}), 'poll does not blast');
  assert.strictEqual(sandbox.remiFloat1Rescues.length, 1);

  rpc.length = 0;
  const dismissed = await sandbox.remiFloat1DismissRescue(RESCUE);
  assert.strictEqual(dismissed.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_dismiss_noshow_rescue');
  assert.strictEqual(JSON.stringify(rpc[0].body), JSON.stringify({p_rescue_id: RESCUE}));
  assert.strictEqual(sandbox.remiFloat1Rescues.length, 0);
  rpc.length = 0;
  await sandbox.remiFloat1Poll();
  assert.strictEqual(sandbox.remiFloat1Rescues.length, 0, 'dismissed rescue is not shown again');
  assert.ok(!rpc.some(function(row){return row.name === 'admin_confirm_noshow_rescue';}));
  const dismissedAgain = await sandbox.remiFloat1ConfirmRescue(RESCUE);
  assert.strictEqual(dismissedAgain.ok, false);
  assert.ok(!rpc.some(function(row){return row.name === 'admin_confirm_noshow_rescue';}), 'dismissed card does not confirm');

  sandbox.remiFloat1WriteStatus(RESCUE, 'pending');
  sandbox.remiFloat1Rescues = [Object.assign({}, RESCUE_CARD)];
  rpc.length = 0;
  const confirmed = await sandbox.remiFloat1ConfirmRescue(RESCUE);
  assert.strictEqual(confirmed.ok, true);
  const confirm = rpc.filter(function(row){return row.name === 'admin_confirm_noshow_rescue';}).pop();
  assert.ok(confirm);
  assert.strictEqual(JSON.stringify(confirm.body), JSON.stringify({p_rescue_id: RESCUE}));
  assert.strictEqual(sandbox.remiFloat1Rescues.length, 0);
  rpc.length = 0;
  await sandbox.remiFloat1Poll();
  assert.strictEqual(sandbox.remiFloat1Rescues.length, 0, 'blasted rescue is not shown again');

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  const nurseRank = await sandbox.remiFloat1LoadRank(SHIFT);
  const nursePoll = await sandbox.remiFloat1Poll();
  const nurseBlast = await sandbox.remiFloat1ConfirmBlast();
  const nurseYes = await sandbox.remiFloat1ConfirmRescue(RESCUE);
  assert.strictEqual(nurseRank.forbidden, true);
  assert.strictEqual(nursePoll.forbidden, true);
  assert.strictEqual(nurseBlast.forbidden, true);
  assert.strictEqual(nurseYes.forbidden, true);
  assert.strictEqual(rpc.length, 0, 'nurse does not call Ace');

  console.log('admin-remi-float-noshow1 unit ok');
  await runBrowser();
})().catch(function(err){
  console.error(err);
  process.exit(1);
});

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
    console.log('admin-remi-float-noshow1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_FLOAT_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const types = {'.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.css': 'text/css'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403); res.end(); return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404); res.end('missing'); return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  const shiftId = SHIFT;
  const rescueId = RESCUE;
  function arm(page){
    page.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
  }
  async function openDesk(page, width, height, mobile){
    await page.setViewport({width: width, height: height, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1});
    await page.setRequestInterception(true);
    arm(page);
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({
        role: 'Admin', username: 'mo@evercare.test', name: 'Mo', loginAt: Date.now()
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=remi-float-noshow1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.waitForSelector('#copilotFab', {timeout: 10000});
  }
  async function stub(page, mode){
    await page.evaluate(function(args){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      if(typeof showTab === 'function')showTab('schedule');
      window.__rpc = [];
      window.__mode = args.mode;
      sbRestGet = async function(){
        return {ok: true, data: [{key: 'remi_noshow_grace_minutes', value: {minutes: 20}}]};
      };
      sbRestRpc = async function(name, body){
        window.__rpc.push({name: name, body: body});
        if(name === 'admin_rank_float_pool_aides')return {ok: true, data: args.rank};
        if(name === 'admin_blast_cover_request')return {ok: true, data: {success: true, assigned: false, blast_count: (body.p_aide_ids || []).length}};
        if(name === 'admin_list_due_noshow_rescues'){
          var rescues = window.__mode === 'noshow' ? [args.rescue] : [];
          return {ok: true, data: {success: true, grace_minutes: 20, rescues: rescues}};
        }
        if(name === 'admin_confirm_noshow_rescue')return {ok: true, data: {success: true, status: 'blasted'}};
        if(name === 'admin_dismiss_noshow_rescue')return {ok: true, data: {success: true, status: 'dismissed'}};
        return {ok: false, error: 'unexpected ' + name};
      };
    }, {mode: mode, rank: RANK, rescue: RESCUE_CARD});
  }
  try{
    const phone = await browser.newPage();
    await openDesk(phone, 390, 844, true);
    await stub(phone, 'float');
    await phone.evaluate(async function(id){
      copilotShowChat();
      remiFloat1Rank = null;
      remiFloat1ShiftId = '';
      remiFloat1WriteStatus('float:' + id, '');
      await remiFloat1LoadRank(id);
    }, shiftId);
    const floatView = await phone.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      var blast = document.getElementById('remiFloat1Blast');
      var edit = document.getElementById('remiFloat1Edit');
      return {
        text: document.getElementById('remiFloatHost').innerText,
        hidden: sheet.hidden,
        viewW: window.innerWidth,
        sheetLeft: box.left,
        sheetWidth: box.width,
        blastH: blast ? blast.getBoundingClientRect().height : 0,
        editH: edit ? edit.getBoundingClientRect().height : 0,
        sub: document.querySelector('#copilotSheet .remi-rail-sub').textContent,
        fullPage: !!document.getElementById('tab_remi')
      };
    });
    assert.strictEqual(floatView.viewW, 390);
    assert.strictEqual(floatView.hidden, false);
    assert.strictEqual(floatView.fullPage, false);
    assert.ok(floatView.sheetWidth <= 390);
    assert.ok(floatView.blastH >= 44, 'confirm blast tap ' + floatView.blastH);
    assert.ok(floatView.editH >= 44, 'edit list tap ' + floatView.editH);
    assert.strictEqual(floatView.sub, 'Coverage · confirm');
    assert.ok(floatView.text.indexOf('Float pool') >= 0, floatView.text);
    assert.ok(floatView.text.indexOf('Devon') >= 0, floatView.text);
    assert.ok(floatView.text.indexOf('8 same-day yes') >= 0, floatView.text);
    assert.ok(floatView.text.indexOf('2.1 mi') >= 0, floatView.text);
    assert.ok(floatView.text.indexOf('Float') >= 0, floatView.text);
    assert.ok(floatView.text.toLowerCase().indexOf('rest of list') >= 0, floatView.text);
    assert.ok(floatView.text.indexOf('Jamal') >= 0, floatView.text);
    assert.ok(floatView.text.indexOf('Confirm blast') >= 0, floatView.text);
    await phone.screenshot({path: path.join(shotDir, 'remi-float-noshow1-phone-float.png')});
    await phone.click('#remiFloat1Edit');
    await phone.click('[data-remi-float-id="' + JAMAL + '"]');
    await phone.click('#remiFloat1Blast');
    await phone.waitForFunction(function(){
      return window.__rpc.some(function(row){return row.name === 'admin_blast_cover_request';});
    }, {timeout: 8000});
    const blastCall = await phone.evaluate(function(){
      var hit = null;
      window.__rpc.forEach(function(row){if(row.name === 'admin_blast_cover_request')hit = row;});
      return {
        hit: hit,
        rank: window.__rpc.filter(function(row){return row.name === 'admin_rank_float_pool_aides';}).length,
        host: document.getElementById('remiFloatHost').innerText
      };
    });
    assert.ok(blastCall.rank >= 1, 'rail called admin_rank_float_pool_aides');
    assert.strictEqual(blastCall.hit.body.p_open_shift_id, shiftId);
    assert.ok(blastCall.hit.body.p_aide_ids.indexOf(DEVON) >= 0);
    assert.ok(blastCall.hit.body.p_aide_ids.indexOf(JAMAL) < 0);
    assert.ok(blastCall.host.indexOf('Confirm blast') < 0, 'blasted card does not stay up');

    await phone.evaluate(function(){
      sessionStorage.removeItem('evercare_remi_float_noshow1');
      remiFloat1Memory = null;
      remiFloat1Rank = null;
      remiFloat1Rescues = [];
      window.__mode = 'noshow';
      window.__rpc = [];
    });
    await phone.evaluate(function(){return remiFloat1Poll();});
    const noshowView = await phone.evaluate(function(){
      var host = document.getElementById('remiFloatHost');
      var confirm = host.querySelector('[data-remi-float-act="confirm"]');
      var dismiss = host.querySelector('[data-remi-float-act="dismiss"]');
      return {
        text: host.innerText,
        sub: document.querySelector('#copilotSheet .remi-rail-sub').textContent,
        confirmH: confirm ? confirm.getBoundingClientRect().height : 0,
        dismissH: dismiss ? dismiss.getBoundingClientRect().height : 0
      };
    });
    assert.ok(noshowView.text.indexOf('Maria no reply 20 min past start') >= 0, noshowView.text);
    assert.ok(noshowView.text.indexOf('Devon') >= 0, noshowView.text);
    assert.ok(noshowView.text.indexOf('Confirm') >= 0, noshowView.text);
    assert.ok(noshowView.text.indexOf('Dismiss') >= 0, noshowView.text);
    assert.strictEqual(noshowView.sub, 'No-show rescue');
    assert.ok(noshowView.confirmH >= 44, 'confirm tap ' + noshowView.confirmH);
    assert.ok(noshowView.dismissH >= 44, 'dismiss tap ' + noshowView.dismissH);
    const mariaLines = noshowView.text.split('\n').filter(function(line){return line.trim() === 'Maria';});
    assert.strictEqual(mariaLines.length, 0, 'Maria is not a suggested backup');
    await phone.screenshot({path: path.join(shotDir, 'remi-float-noshow1-phone-noshow.png')});
    await phone.click('[data-remi-float-act="dismiss"]');
    await phone.waitForFunction(function(){
      return window.__rpc.some(function(row){return row.name === 'admin_dismiss_noshow_rescue';});
    }, {timeout: 8000});
    await phone.evaluate(function(){return remiFloat1Poll();});
    const afterDismiss = await phone.evaluate(function(){
      return {
        text: document.getElementById('remiFloatHost').innerText,
        confirm: window.__rpc.filter(function(row){return row.name === 'admin_confirm_noshow_rescue';}).length,
        dismiss: window.__rpc.filter(function(row){return row.name === 'admin_dismiss_noshow_rescue';}).length,
        blast: window.__rpc.filter(function(row){return row.name === 'admin_blast_cover_request' || row.name === 'admin_confirm_noshow_rescue';}).length
      };
    });
    assert.strictEqual(afterDismiss.dismiss, 1);
    assert.strictEqual(afterDismiss.confirm, 0);
    assert.strictEqual(afterDismiss.blast, 0, 'dismiss does not blast');
    assert.ok(afterDismiss.text.indexOf('Maria no reply') < 0, 'dismissed card stays down');

    await phone.evaluate(function(){
      sessionStorage.removeItem('evercare_remi_float_noshow1');
      remiFloat1Memory = null;
      window.__rpc = [];
    });
    await phone.evaluate(function(){return remiFloat1Poll();});
    await phone.click('[data-remi-float-act="confirm"]');
    await phone.waitForFunction(function(){
      return window.__rpc.some(function(row){return row.name === 'admin_confirm_noshow_rescue';});
    }, {timeout: 8000});
    const confirmCall = await phone.evaluate(function(){
      var hit = null;
      window.__rpc.forEach(function(row){if(row.name === 'admin_confirm_noshow_rescue')hit = row;});
      return {body: hit && hit.body, text: document.getElementById('remiFloatHost').innerText};
    });
    assert.deepStrictEqual(confirmCall.body, {p_rescue_id: rescueId});
    assert.ok(confirmCall.text.indexOf('Maria no reply') < 0, 'confirmed card stays down');

    const desk = await browser.newPage();
    await openDesk(desk, 1280, 800, false);
    await stub(desk, 'float');
    const wide = await desk.evaluate(async function(id){
      copilotShowChat();
      remiFloat1WriteStatus('float:' + id, '');
      await remiFloat1LoadRank(id);
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var main = document.querySelector('#adminScreen .main-content').getBoundingClientRect();
      return {
        text: document.getElementById('remiFloatHost').innerText,
        sub: document.querySelector('#copilotSheet .remi-rail-sub').textContent,
        sheetLeft: sheet.left,
        sheetWidth: sheet.width,
        mainLeft: main.left,
        viewW: window.innerWidth,
        fullPage: !!document.getElementById('tab_remi')
      };
    }, shiftId);
    assert.strictEqual(wide.viewW, 1280);
    assert.strictEqual(wide.fullPage, false);
    assert.ok(wide.text.indexOf('Float pool') >= 0, wide.text);
    assert.ok(wide.text.indexOf('Confirm blast') >= 0, wide.text);
    assert.strictEqual(wide.sub, 'Coverage · confirm');
    assert.ok(wide.sheetWidth < 520 && wide.sheetWidth > 300, 'desktop rail width ' + wide.sheetWidth);
    assert.ok(wide.sheetLeft > wide.viewW * 0.5, 'rail stays on the right ' + wide.sheetLeft);
    assert.ok(wide.mainLeft < wide.sheetLeft, 'desk stays beside the rail');
    await desk.screenshot({path: path.join(shotDir, 'remi-float-noshow1-desktop-float.png')});
    await desk.evaluate(function(){
      sessionStorage.removeItem('evercare_remi_float_noshow1');
      remiFloat1Memory = null;
      remiFloat1Rank = null;
      window.__mode = 'noshow';
      return remiFloat1Poll();
    });
    const wideNo = await desk.evaluate(function(){
      return document.getElementById('remiFloatHost').innerText;
    });
    assert.ok(wideNo.indexOf('Maria no reply 20 min past start') >= 0, wideNo);
    assert.ok(wideNo.indexOf('Dismiss') >= 0, wideNo);
    await desk.screenshot({path: path.join(shotDir, 'remi-float-noshow1-desktop-noshow.png')});
    console.log('admin-remi-float-noshow1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}
