#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-float-hide1'), 'remi-float-hide1 marker');
assert.ok(html.includes('data-remi-float-hide1="v=remi-float-hide1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-float-hide1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-float-hide1">'), 'meta');
assert.ok(html.includes('<!-- remi float hide 2026-09-27 v=remi-float-hide1 admin-build 2026-09-27-remi-float-hide1'), 'comment');
assert.ok(html.includes("var REMI_FLOAT_HIDE1_MARKER='v=remi-float-hide1'"), 'script marker');
assert.ok(html.includes('GHOST-REMI-FLOAT-HIDE1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(html.includes('id="copilotTabPayroll"'), 'Payroll tab');
assert.ok(html.includes('id="copilotTabCover"'), 'Coverage tab');
assert.ok(html.includes('id="copilotTabProof"'), 'Receipts tab stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-compliance-bulk1'), 'first admin-build is msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
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
assert.ok(html.indexOf('content="2026-09-27-cover-card-cancel1"') < html.indexOf('content="2026-09-27-nosvc-reason-draft1"'), 'nosvc-reason-draft1 stays after cover-card-cancel1');
assert.ok(html.indexOf('content="2026-09-27-nosvc-reason-draft1"') < html.indexOf('content="2026-09-27-cover-unselect1"'), 'cover-unselect1 stays after nosvc-reason-draft1');
assert.ok(html.indexOf('content="2026-09-27-cover-unselect1"') < html.indexOf('content="2026-09-27-remi-payroll1"'), 'payroll meta stays after cover-unselect1');
assert.ok(html.indexOf('content="2026-09-27-remi-payroll1"') < html.indexOf('content="2026-09-27-remi-ideas763"'), 'ideas763 stays');
assert.ok(html.indexOf('content="2026-09-27-remi-ideas763"') < html.indexOf('content="2026-09-27-remi-float-noshow1"'), 'float noshow meta stays');
assert.ok(html.indexOf('content="2026-09-27-remi-float-noshow1"') < html.indexOf('content="2026-09-27-remi-proof1"'), 'proof stays');
['v=tabbar-8','v=cover-card-cancel1','v=nosvc-reason-draft1','v=cover-unselect1','v=remi-payroll1','v=remi-ideas763','v=remi-float-noshow1','v=remi-proof1','v=remi-sched1','v=remi-rules1','v=remi-notes-vis1','v=coverage-simple1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-tabbar-8">'), 'tabbar-8 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-cover-card-cancel1">'), 'cover-card-cancel1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-nosvc-reason-draft1">'), 'nosvc meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-cover-unselect1">'), 'cover-unselect1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'payroll meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage-simple1 meta stays');

const noshowStart = html.indexOf('// remi float noshow1 v=remi-float-noshow1');
const noshowEnd = html.indexOf('// end remi float noshow1 v=remi-float-noshow1');
assert.ok(noshowStart > 0 && noshowEnd > noshowStart, 'noshow patch block stays');
const noshowSrc = html.slice(noshowStart, noshowEnd);
assert.ok(noshowSrc.includes('admin_rank_float_pool_aides'), 'noshow rank rpc stays');
assert.ok(noshowSrc.includes('admin_blast_cover_request'), 'noshow blast rpc stays');
assert.ok(noshowSrc.includes('admin_list_due_noshow_rescues'), 'list due stays');
assert.ok(noshowSrc.includes('admin_confirm_noshow_rescue'), 'confirm stays');
assert.ok(noshowSrc.includes('admin_dismiss_noshow_rescue'), 'dismiss stays');
assert.ok(noshowSrc.includes('Float pool'), 'old float paint source stays in the noshow patch');
assert.ok(!noshowSrc.includes('admin_confirm_cover_send'), 'does not replace cover confirm');

const start = html.indexOf('// remi float hide1 v=remi-float-hide1');
const end = html.indexOf('// end remi float hide1 v=remi-float-hide1');
assert.ok(start > noshowEnd && end > start, 'hide script follows the noshow patch');
const src = html.slice(start, end);
assert.ok(src.includes('admin_blast_cover_request') === false || src.includes('Open-hole blast stays admin_blast_cover_request'), 'blast comment stays on the existing rpc');
assert.ok(!src.includes("sbRestRpc('admin_blast_cover_request'"), 'hide does not replace the blast call');
assert.ok(src.includes('Ranked \\u00b7 same-day yes / 30d') || src.includes('Ranked \u00b7 same-day yes / 30d'), 'ranked band label');
assert.ok(src.includes('Rest of list'), 'rest band label');
assert.ok(src.includes('hide_float_ui:true') || src.includes('hide_float_ui: true') || src.includes('hide_float_ui:true'), 'hide flag');
assert.ok(src.includes('is_float=false'), 'is_float forced false');
assert.ok(!src.includes('remi-fn-tag'), 'no Float tag markup');
assert.ok(!src.includes('>Float<'), 'no Float chip text node');
assert.ok(src.includes('is_scheduler_office'), 'office gate');
assert.ok(src.includes('42501') === false, 'hide block does not invent a new nurse path');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|send_sms/.test(src), 'no Quo or SMS');
assert.ok(src.includes("view==='receipts'||view==='payroll'") || src.includes("view==='receipts'||view==='payroll'"), 'receipts and payroll hide the rank card');

const simple = html.slice(html.indexOf('// v=coverage-simple1 blast'), html.indexOf('// end v=coverage-simple1'));
assert.ok(simple.includes("coverSimpleRpc('admin_blast_cover_request'"), 'coverage blast stays');
assert.ok(simple.includes("coverSimpleRpc('admin_confirm_cover_send'"), 'coverage confirm stays');
assert.ok(!simple.includes('remi-float-hide1'), 'coverage-simple1 block is unchanged');

const SHIFT = '55555555-5555-4555-8555-555555555555';
const DEVON = '44444444-4444-4444-8444-444444444441';
const LINA = '44444444-4444-4444-8444-444444444442';
const SARA = '44444444-4444-4444-8444-444444444443';
const JAMAL = '44444444-4444-4444-8444-444444444444';
const AISHA = '44444444-4444-4444-8444-444444444446';
const GHOST = '44444444-4444-4444-8444-444444444447';
const MARIA = '44444444-4444-4444-8444-444444444445';
const RESCUE = '66666666-6666-4666-8666-666666666666';
const RANK = {
  success: true,
  ok: true,
  marker: 'remi-float-hide1',
  v: 'remi-float-hide1',
  hide_float_ui: true,
  float_pool: [],
  float_count: 0,
  open_shift_id: SHIFT,
  client_name: 'Bowlax',
  shift_start: '2026-09-27T13:00:00.000Z',
  shift_end: '2026-09-27T17:00:00.000Z',
  assigned_aide_id: MARIA,
  ranked: [
    {rank: 1, aide_id: DEVON, name: 'Devon', same_day_yes_30d: 8, miles: 2.1, is_float: true},
    {rank: 2, aide_id: LINA, name: 'Lina', same_day_yes_30d: 6, miles: 3, is_float: true},
    {rank: 3, aide_id: SARA, name: 'Sara', same_day_yes_30d: 4, miles: 1.8, is_float: true}
  ],
  rest: [
    {rank: 4, aide_id: JAMAL, name: 'Jamal', same_day_yes_30d: 0, miles: 5.2, is_float: false},
    {rank: 5, aide_id: AISHA, name: 'Aisha', same_day_yes_30d: 0, miles: 4.4, is_float: false}
  ],
  aides: [],
  note: 'no Float pool UI · remi-float-hide1 · paint ranked + rest bands only'
};
RANK.float_pool = [{rank: 9, aide_id: GHOST, name: 'ShouldNotPaint', same_day_yes_30d: 3, miles: 1, is_float: true}];
const RESCUE_CARD = {
  id: RESCUE,
  status: 'pending',
  client_name: 'Bowlax',
  assigned_aide_id: MARIA,
  assigned_aide_name: 'Maria',
  shift_start: '2026-09-27T13:00:00.000Z',
  shift_end: '2026-09-27T17:00:00.000Z',
  grace_minutes: 20,
  hide_float_ui: true,
  float_pool: [],
  ranked: [
    {rank: 1, aide_id: DEVON, name: 'Devon', same_day_yes_30d: 8, miles: 2.1, is_float: true},
    {rank: 9, aide_id: MARIA, name: 'Maria', same_day_yes_30d: 1, miles: 1, is_float: true}
  ],
  suggested_aides: [{rank: 1, aide_id: DEVON, name: 'Devon', same_day_yes_30d: 8, miles: 2.1, is_float: false}]
};
const PAY = {
  success: true,
  start_date: '2026-09-14',
  end_date: '2026-09-27',
  start_date_display: '09/14/2026',
  end_date_display: '09/27/2026',
  stats: {aides: 3, paid_hours: 96.5, covers: 4, flags: 0, paid_shifts: 12},
  job: {next_run_at: '2026-10-07T12:00:00+00:00', anchor_date: '2026-09-23'},
  aides: []
};

function runSlice(){
  const sandbox = {
    currentAdminRole: 'Admin',
    copilotView: 'coverage',
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
  vm.runInContext(noshowSrc + '\n' + src, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_FLOAT_HIDE1_MARKER, 'v=remi-float-hide1');
  assert.strictEqual(sandbox.REMI_FLOAT_HIDE1_OFFICE, 'is_scheduler_office');
  assert.strictEqual(sandbox.REMI_FLOAT_NOSHOW1_MARKER, 'v=remi-float-noshow1');
  const split = sandbox.remiFloatHide1Split(RANK);
  assert.strictEqual(split.hide_float_ui, true);
  assert.strictEqual(split.float_pool.length, 0);
  assert.strictEqual(split.ranked.length, 3);
  assert.strictEqual(split.ranked[0].name, 'Devon');
  assert.strictEqual(split.ranked[0].is_float, false);
  assert.ok(!split.ranked.concat(split.rest).some(function(row){return row.name === 'ShouldNotPaint';}));
  sandbox.remiFloat1Rank = RANK;
  sandbox.remiFloat1ShiftId = SHIFT;
  sandbox.copilotView = 'coverage';
  sandbox.remiFloat1SeedPicked(RANK);
  const chosen = sandbox.remiFloat1ChosenIds();
  assert.ok(chosen.indexOf(DEVON) >= 0);
  assert.ok(chosen.indexOf(JAMAL) >= 0);
  assert.ok(chosen.indexOf(GHOST) < 0, 'ignored float_pool aide is not blasted');
  assert.ok(chosen.indexOf(MARIA) < 0, 'assignee is not a blast choice');
  const card = sandbox.remiFloat1FloatHtml();
  assert.ok(card.indexOf('Open shift') >= 0, card);
  assert.ok(card.indexOf('Ranked \u00b7 same-day yes / 30d') >= 0, card);
  assert.ok(card.indexOf('Rest of list') >= 0, card);
  assert.ok(card.indexOf('Devon') >= 0, card);
  assert.ok(card.indexOf('8 same-day yes') >= 0, card);
  assert.ok(card.indexOf('2.1 mi') >= 0, card);
  assert.ok(card.indexOf('Jamal') >= 0, card);
  assert.ok(card.indexOf('0 same-day yes') >= 0, card);
  assert.ok(card.indexOf('5.2 mi') >= 0, card);
  assert.ok(card.indexOf('Confirm blast') >= 0, card);
  assert.ok(card.indexOf('Edit list') >= 0, card);
  assert.ok(card.indexOf('>Float<') < 0, card);
  assert.ok(card.indexOf('remi-fn-tag') < 0, card);
  assert.ok(card.indexOf('is-float') < 0, card);
  assert.ok(card.indexOf('ShouldNotPaint') < 0, card);
  assert.ok(card.indexOf('no separate Float pool block') >= 0, card);
  sandbox.copilotView = 'receipts';
  assert.strictEqual(sandbox.remiFloat1FloatHtml(), '');
  sandbox.copilotView = 'payroll';
  assert.strictEqual(sandbox.remiFloat1FloatHtml(), '');
  sandbox.remiPayroll1Stats = function(report){return report.stats || {};};
  sandbox.remiPayroll1FormatNext = function(){return 'Wed 10/07/2026 8:00 AM ET';};
  sandbox.remiPayroll1Mdy = function(iso){
    var m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[2] + '/' + m[3] + '/' + m[1] : '';
  };
  sandbox.remiPayroll1Report = PAY;
  sandbox.remiPayroll1Start = '2026-09-14';
  sandbox.remiPayroll1End = '2026-09-27';
  const glance = sandbox.remiFloatHide1GlanceHtml();
  assert.ok(glance.indexOf('Wed payroll ready') >= 0, glance);
  assert.ok(glance.indexOf('09/14/2026') >= 0, glance);
  assert.ok(glance.indexOf('09/27/2026') >= 0, glance);
  assert.ok(glance.indexOf('>3<') >= 0, glance);
  assert.ok(glance.indexOf('96.5') >= 0, glance);
  assert.ok(glance.indexOf('>4<') >= 0, glance);
  assert.ok(glance.indexOf('Open full report') >= 0, glance);
  assert.ok(glance.indexOf('10/07/2026') >= 0, glance);
  assert.ok(glance.indexOf('Float pool block removed') >= 0, glance);
  assert.ok(glance.indexOf('remi-fn-tag') < 0, glance);

  sandbox.copilotView = 'coverage';
  const rescueHtml = sandbox.remiFloat1NoshowHtml(RESCUE_CARD);
  assert.ok(rescueHtml.indexOf('Maria no reply 20 min past start') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('Devon') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('>Confirm<') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('>Dismiss<') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('no Float pool UI') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('remi-float-hide1') >= 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('float pool only') < 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('Suggested float-pool') < 0, rescueHtml);
  assert.ok(rescueHtml.indexOf('>Float<') < 0, rescueHtml);
  assert.ok((rescueHtml.match(/Maria/g) || []).length === 2, 'Maria is the title and the note');

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
  sandbox.copilotView = 'coverage';
  const ranked = await sandbox.remiFloat1LoadRank(SHIFT);
  assert.strictEqual(ranked.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_rank_float_pool_aides');
  const blasted = await sandbox.remiFloat1ConfirmBlast();
  assert.strictEqual(blasted.ok, true);
  const blast = rpc.filter(function(row){return row.name === 'admin_blast_cover_request';}).pop();
  assert.ok(blast, 'confirm blast uses admin_blast_cover_request');
  assert.strictEqual(blast.body.p_address_mode, 'area');
  assert.ok(blast.body.p_aide_ids.indexOf(DEVON) >= 0);
  assert.ok(blast.body.p_aide_ids.indexOf(GHOST) < 0);
  assert.ok(blast.body.p_aide_ids.indexOf(MARIA) < 0);
  rpc.length = 0;
  const listed = await sandbox.remiFloat1Poll();
  assert.strictEqual(listed.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_list_due_noshow_rescues');
  assert.ok(!rpc.some(function(row){return row.name === 'admin_blast_cover_request' || row.name === 'admin_confirm_noshow_rescue';}), 'poll never blasts');
  rpc.length = 0;
  const confirmed = await sandbox.remiFloat1ConfirmRescue(RESCUE);
  assert.strictEqual(confirmed.ok, true);
  assert.strictEqual(JSON.stringify(rpc[0].body), JSON.stringify({p_rescue_id: RESCUE}));
  sandbox.remiFloat1WriteStatus(RESCUE, 'pending');
  sandbox.remiFloat1Rescues = [Object.assign({}, RESCUE_CARD)];
  rpc.length = 0;
  const dismissed = await sandbox.remiFloat1DismissRescue(RESCUE);
  assert.strictEqual(dismissed.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_dismiss_noshow_rescue');
  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  const nurseRank = await sandbox.remiFloat1LoadRank(SHIFT);
  assert.strictEqual(nurseRank.forbidden, true);
  assert.strictEqual(rpc.length, 0, 'nurse does not call Ace');
  console.log('admin-remi-float-hide1 unit ok');
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
    console.log('admin-remi-float-hide1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_FLOAT_HIDE_SHOTS || '/opt/cursor/artifacts';
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
  const receipt = {
    id: 'a0a0e41d-6cdd-4ad0-ad11-ba44b3f31513',
    title: 'Bowlax cover',
    status: 'Covered',
    chip_summary: 'Bowlax \u00b7 Sun 9:00\u20131:00 closed with Devon. Blasted 12 \u00b7 3 yes \u00b7 covered 9:41.',
    list_summary: 'Bowlax cover \u00b7 Devon \u00b7 Covered',
    finished_label: '09/27/2026'
  };
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
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=remi-float-hide1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.waitForSelector('#copilotFab', {timeout: 10000});
  }
  async function stub(page){
    await page.evaluate(function(pack){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      window.__rpc = [];
      remiPayroll1Report = pack.pay;
      remiPayroll1Start = '2026-09-14';
      remiPayroll1End = '2026-09-27';
      remiPayroll1Job = pack.pay.job;
      sbRestGet = async function(){return {ok: true, data: []};};
      sbRestRpc = async function(name, body){
        window.__rpc.push({name: name, body: body});
        if(name === 'admin_rank_float_pool_aides')return {ok: true, data: pack.rank};
        if(name === 'admin_blast_cover_request')return {ok: true, data: {success: true, assigned: false, blast_count: (body.p_aide_ids || []).length}};
        if(name === 'admin_list_remi_receipts')return {ok: true, data: {success: true, receipts: [pack.receipt]}};
        if(name === 'admin_get_remi_payroll_report')return {ok: true, data: pack.pay};
        if(name === 'admin_list_due_noshow_rescues')return {ok: true, data: {success: true, grace_minutes: 20, rescues: pack.mode === 'noshow' ? [pack.rescue] : []}};
        if(name === 'admin_confirm_noshow_rescue')return {ok: true, data: {success: true, status: 'blasted'}};
        if(name === 'admin_dismiss_noshow_rescue')return {ok: true, data: {success: true, status: 'dismissed'}};
        return {ok: false, error: 'unexpected ' + name};
      };
    }, {rank: RANK, pay: PAY, receipt: receipt, rescue: RESCUE_CARD, mode: 'float'});
  }
  async function paintReceipts(page){
    await page.evaluate(async function(){
      coverShifts = [];
      remiFloat1Rank = null;
      copilotShowChat();
      await remiProof1Show();
      await remiProof1Load();
      remiFloat1Rank = null;
      copilotView = 'receipts';
      remiFloat1Paint();
      remiFloatHide1MountGlance();
      remiFloatHide1Sub();
    });
  }
  async function paintCoverage(page){
    await page.evaluate(async function(id){
      copilotView = 'coverage';
      remiFloat1WriteStatus('float:' + id, '');
      remiFloat1Rank = null;
      await remiFloat1LoadRank(id);
      remiFloatHide1ShowCoverage();
    }, SHIFT);
  }
  try{
    const phone = await browser.newPage();
    await openDesk(phone, 390, 844, true);
    await stub(phone);
    await paintReceipts(phone);
    const receipts = await phone.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      var host = document.getElementById('remiFloatHost');
      var open = document.getElementById('remiFloatHideOpen');
      return {
        text: document.getElementById('copilotBody').innerText,
        host: host.innerText,
        hiddenHost: host.hidden,
        sub: document.querySelector('#copilotSheet .remi-rail-sub').textContent,
        receiptsOn: document.getElementById('copilotTabProof').getAttribute('aria-selected'),
        payrollTab: !!document.getElementById('copilotTabPayroll'),
        coverTab: !!document.getElementById('copilotTabCover'),
        tags: document.querySelectorAll('#copilotSheet .remi-fn-tag').length,
        openH: open ? open.getBoundingClientRect().height : 0,
        viewW: window.innerWidth,
        sheetWidth: box.width,
        fullPage: !!document.getElementById('tab_remi'),
        build: document.querySelector('meta[name="admin-build"]').content
      };
    });
    assert.strictEqual(receipts.build, '2026-09-27-compliance-bulk1');
    assert.strictEqual(receipts.viewW, 390);
    assert.strictEqual(receipts.fullPage, false);
    assert.ok(receipts.sheetWidth <= 390);
    assert.strictEqual(receipts.receiptsOn, 'true');
    assert.strictEqual(receipts.payrollTab, true);
    assert.strictEqual(receipts.coverTab, true);
    assert.strictEqual(receipts.sub, 'Receipts \u00b7 confirm');
    assert.ok(receipts.text.indexOf('Wed payroll ready') >= 0, receipts.text);
    assert.ok(receipts.text.indexOf('96.5') >= 0, receipts.text);
    assert.ok(receipts.text.indexOf('Open full report') >= 0, receipts.text);
    assert.ok(receipts.text.indexOf('10/07/2026') >= 0, receipts.text);
    assert.ok(receipts.text.indexOf('Bowlax') >= 0, receipts.text);
    assert.ok(receipts.text.indexOf('Float pool block removed') >= 0, receipts.text);
    assert.ok(receipts.host.indexOf('Confirm blast') < 0, receipts.host);
    assert.ok(receipts.host.indexOf('Ranked') < 0, receipts.host);
    assert.strictEqual(receipts.tags, 0);
    assert.ok(receipts.openH >= 44, 'open report tap ' + receipts.openH);
    await phone.screenshot({path: path.join(shotDir, 'remi-float-hide1-phone-receipts.png')});

    await paintCoverage(phone);
    const cover = await phone.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var blast = document.getElementById('remiFloat1Blast');
      var edit = document.getElementById('remiFloat1Edit');
      return {
        text: document.getElementById('remiFloatHost').innerText,
        sub: document.querySelector('#copilotSheet .remi-rail-sub').textContent,
        coverOn: document.getElementById('copilotTabCover').getAttribute('aria-selected'),
        tags: document.querySelectorAll('#copilotSheet .remi-fn-tag').length,
        blastH: blast ? blast.getBoundingClientRect().height : 0,
        editH: edit ? edit.getBoundingClientRect().height : 0,
        sheetLeft: sheet.getBoundingClientRect().left
      };
    });
    assert.strictEqual(cover.sub, 'Coverage \u00b7 confirm');
    assert.strictEqual(cover.coverOn, 'true');
    assert.strictEqual(cover.tags, 0);
    assert.ok(cover.text.indexOf('Open shift') >= 0, cover.text);
    assert.ok(cover.text.indexOf('Devon') >= 0, cover.text);
    assert.ok(cover.text.indexOf('8 same-day yes') >= 0, cover.text);
    assert.ok(cover.text.indexOf('2.1 mi') >= 0, cover.text);
    assert.ok(cover.text.toLowerCase().indexOf('rest of list') >= 0, cover.text);
    assert.ok(cover.text.indexOf('Jamal') >= 0, cover.text);
    assert.ok(cover.text.indexOf('Aisha') >= 0, cover.text);
    assert.ok(cover.text.indexOf('Confirm blast') >= 0, cover.text);
    assert.ok(cover.text.indexOf('ShouldNotPaint') < 0, cover.text);
    assert.ok(cover.blastH >= 44, 'confirm blast tap ' + cover.blastH);
    assert.ok(cover.editH >= 44, 'edit list tap ' + cover.editH);
    await phone.screenshot({path: path.join(shotDir, 'remi-float-hide1-phone-coverage.png')});
    await phone.click('#remiFloat1Blast');
    await phone.waitForFunction(function(){
      return window.__rpc.some(function(row){return row.name === 'admin_blast_cover_request';});
    }, {timeout: 8000});
    const blastCall = await phone.evaluate(function(){
      var hit = null;
      window.__rpc.forEach(function(row){if(row.name === 'admin_blast_cover_request')hit = row;});
      return hit;
    });
    assert.strictEqual(blastCall.body.p_open_shift_id, SHIFT);
    assert.strictEqual(blastCall.body.p_address_mode, 'area');
    assert.ok(blastCall.body.p_aide_ids.indexOf(DEVON) >= 0);
    assert.ok(blastCall.body.p_aide_ids.indexOf(GHOST) < 0);

    await phone.evaluate(function(){
      sessionStorage.removeItem('evercare_remi_float_noshow1');
      remiFloat1Memory = null;
      remiFloat1Rank = null;
      remiFloat1Rescues = [];
      window.__rpc = [];
    });
    await phone.evaluate(function(card){
      window.__rescue = card;
      sbRestRpc = async function(name, body){
        window.__rpc.push({name: name, body: body});
        if(name === 'admin_list_due_noshow_rescues')return {ok: true, data: {success: true, grace_minutes: 20, rescues: [window.__rescue]}};
        if(name === 'admin_confirm_noshow_rescue')return {ok: true, data: {success: true, status: 'blasted'}};
        if(name === 'admin_dismiss_noshow_rescue')return {ok: true, data: {success: true, status: 'dismissed'}};
        if(name === 'admin_rank_float_pool_aides')return {ok: true, data: {success: true, ranked: [], rest: [], float_pool: [], hide_float_ui: true}};
        return {ok: false, error: 'unexpected ' + name};
      };
      return remiFloat1Poll();
    }, RESCUE_CARD);
    const noshow = await phone.evaluate(function(){
      return document.getElementById('remiFloatHost').innerText;
    });
    assert.ok(noshow.indexOf('Maria no reply 20 min past start') >= 0, noshow);
    assert.ok(noshow.indexOf('Devon') >= 0, noshow);
    assert.ok(noshow.indexOf('Confirm') >= 0, noshow);
    assert.ok(noshow.indexOf('Dismiss') >= 0, noshow);
    assert.ok(noshow.indexOf('no Float pool UI') >= 0, noshow);
    assert.ok(noshow.toLowerCase().indexOf('float pool only') < 0, noshow);
    assert.ok(noshow.indexOf('Suggested float-pool') < 0, noshow);
    await phone.click('[data-remi-float-act="dismiss"]');
    await phone.waitForFunction(function(){
      return window.__rpc.some(function(row){return row.name === 'admin_dismiss_noshow_rescue';});
    }, {timeout: 8000});
    const afterDismiss = await phone.evaluate(function(){
      return {
        confirm: window.__rpc.filter(function(row){return row.name === 'admin_confirm_noshow_rescue';}).length,
        blast: window.__rpc.filter(function(row){return row.name === 'admin_blast_cover_request';}).length
      };
    });
    assert.strictEqual(afterDismiss.confirm, 0);
    assert.strictEqual(afterDismiss.blast, 0, 'dismiss does not blast');

    const desk = await browser.newPage();
    await openDesk(desk, 1280, 800, false);
    await stub(desk);
    await paintReceipts(desk);
    const wideReceipts = await desk.evaluate(function(){
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var main = document.querySelector('#adminScreen .main-content').getBoundingClientRect();
      return {
        text: document.getElementById('copilotBody').innerText,
        host: document.getElementById('remiFloatHost').innerText,
        sub: document.querySelector('#copilotSheet .remi-rail-sub').textContent,
        sheetLeft: sheet.left,
        sheetWidth: sheet.width,
        mainLeft: main.left,
        viewW: window.innerWidth,
        fullPage: !!document.getElementById('tab_remi')
      };
    });
    assert.strictEqual(wideReceipts.viewW, 1280);
    assert.strictEqual(wideReceipts.fullPage, false);
    assert.ok(wideReceipts.text.indexOf('Wed payroll ready') >= 0, wideReceipts.text);
    assert.ok(wideReceipts.host.indexOf('Confirm blast') < 0, wideReceipts.host);
    assert.strictEqual(wideReceipts.sub, 'Receipts \u00b7 confirm');
    assert.ok(wideReceipts.sheetWidth < 520 && wideReceipts.sheetWidth > 300, 'desktop rail width ' + wideReceipts.sheetWidth);
    assert.ok(wideReceipts.sheetLeft > wideReceipts.viewW * 0.5, 'rail stays on the right');
    assert.ok(wideReceipts.mainLeft < wideReceipts.sheetLeft, 'desk stays beside the rail');
    await desk.screenshot({path: path.join(shotDir, 'remi-float-hide1-desktop-receipts.png')});
    await paintCoverage(desk);
    const wideCover = await desk.evaluate(function(){
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      return {
        text: document.getElementById('remiFloatHost').innerText,
        tags: document.querySelectorAll('#copilotSheet .remi-fn-tag').length,
        sub: document.querySelector('#copilotSheet .remi-rail-sub').textContent,
        sheetLeft: sheet.left,
        viewW: window.innerWidth
      };
    });
    assert.ok(wideCover.text.indexOf('Devon') >= 0, wideCover.text);
    assert.ok(wideCover.text.indexOf('Confirm blast') >= 0, wideCover.text);
    assert.ok(wideCover.text.indexOf('ShouldNotPaint') < 0, wideCover.text);
    assert.strictEqual(wideCover.tags, 0);
    assert.strictEqual(wideCover.sub, 'Coverage \u00b7 confirm');
    assert.ok(wideCover.sheetLeft > wideCover.viewW * 0.5, 'coverage rail stays on the right');
    await desk.screenshot({path: path.join(shotDir, 'remi-float-hide1-desktop-coverage.png')});
    console.log('admin-remi-float-hide1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}
