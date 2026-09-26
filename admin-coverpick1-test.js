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

assert.ok(html.includes('v=coverpick1'), 'coverpick1 marker');
assert.ok(html.includes('data-coverpick1="v=coverpick1"'), 'coverpick1 string marker');
assert.ok(html.includes('admin-build 2026-09-25-coverpick1'), 'coverpick1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-coverpick1">'), 'coverpick1 meta');
assert.ok(html.includes('<!-- coverage pick another aide 2026-09-25 v=coverpick1 admin-build 2026-09-25-coverpick1'), 'coverpick1 comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-26-clienthrs1a'), 'clienthrs1a is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-coverpick1"') < html.indexOf('content="2026-09-25-remisec1"'), 'remisec1 stays after coverpick1');
assert.ok(html.indexOf('content="2026-09-25-remisec1"') < html.indexOf('content="2026-09-25-payready1d"'), 'payready1d stays after remisec1');
assert.ok(html.indexOf('content="2026-09-25-payready1b"') < html.indexOf('content="2026-09-25-coverunlock1"'), 'coverunlock1 stays after payready1b');
['v=remisec1','v=payready1d','v=payready1c','v=coverunlock1','v=payready1','v=aidecreds1c','v=covercomms1','v=cover1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
['2026-09-25-remisec1','2026-09-25-payready1d','2026-09-25-coverunlock1','2026-09-25-payready1','2026-09-25-cover1'].forEach(function(build){
  assert.ok(html.includes('<meta name="admin-build" content="' + build + '">'), 'prior meta stays ' + build);
});

const note = html.slice(html.indexOf('v=coverpick1'), html.indexOf('<meta name="admin-build" content="2026-09-25-coverpick1">'));
assert.ok(/Remi stays the corner chip/.test(note), 'Remi stays corner-only');
assert.ok(/No Auth reseal/.test(note), 'no Auth reseal');
assert.ok(/No new Ace RPC/.test(note), 'no new Ace RPC');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'coverpick1 note does not reseal Auth');

const desk = html.slice(html.indexOf('id="tab_coverage"'), html.indexOf('id="tab_backups"'));
assert.ok(desk.includes('data-coverpick1="v=coverpick1"'), 'marker sits on the roster picker');
assert.ok(desk.includes('data-coverunlock1="v=coverunlock1"'), 'coverunlock1 marker stays');
assert.ok(desk.includes('>Who can cover<'), 'ranked list stays the section title');
assert.ok(desk.includes('id="coverRankList"'), 'ranked list stays');
assert.ok(desk.indexOf('id="coverRankList"') < desk.indexOf('id="coverPickOtherBtn"'), 'ranked list stays above Pick another aide');
assert.ok(desk.includes('>Pick another aide<'), 'pick control label');
assert.ok(desk.includes('id="coverRosterSearch"'), 'search field');
assert.ok(desk.includes('id="coverRosterList"'), 'scrollable roster list');
assert.ok(desk.includes('>Text this aide<') && desk.includes('>Client wants backup<') && desk.includes('>Confirm assign<'), 'text and confirm stay');
assert.ok(!/copilotFab|remi-chip/.test(desk), 'Remi is not expanded into Coverage');

const rpc = extractFn(html, 'var COVER_RPC=');
assert.ok(rpc.includes("outcome:['admin_cover_outcome']"), 'outcome RPC stays admin_cover_outcome');
assert.ok(rpc.includes("rank:['admin_rank_backup_aides']"), 'rank RPC stays');
assert.ok(!/admin_list_cover|admin_search_aides|admin_pick_aide/.test(rpc), 'no new cover roster RPC');
const pick = extractFn(html, 'function coverPickRank(id, name)');
assert.ok(pick.includes('coverPaintRanks(coverRanks)') && pick.includes('coverFillBackup(shift)'), 'roster tap uses the ranked check path');
assert.ok(!pick.includes('coverRpc('), 'coverPickRank does not post its own outcome');
const bound = extractFn(html, 'function coverEnsureBound()');
assert.ok(bound.includes("closest('[data-cover-aide]')") && bound.includes('coverPickRank('), 'roster rows share the ranked click path');
const paintRoster = extractFn(html, 'function coverPaintRoster()');
assert.ok(paintRoster.includes('data-cover-aide='), 'roster buttons are the same aide targets');
assert.ok(extractFn(html, 'function coverConfirmAssign()').includes("coverApplyOutcome('assigned_backup')"), 'confirm still posts assigned_backup');
assert.ok(extractFn(html, 'function coverShowAssign()').includes('coverFillBackup(shift)'), 'confirm panel still fills the same backup select');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser/.test(desk + pick + paintRoster), 'picker does not reseal Auth');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays');
assert.ok(html.includes('#tab_coverage .cover-roster-list{') && html.includes('overflow-y:auto') && html.includes('min-height:48px'), 'phone list scrolls and rows are at least 44px');

const ctx = vm.createContext({
  loadedAidesList: [],
  allAidesForAssign: [],
  coverPickPhone: function(row){return row && row.phone ? String(row.phone) : '';}
});
[
  'function aideDeactivatedStamp(u)',
  'function aideOnDesk(u, desk)',
  'function schedAideRosters()',
  'function coverRosterActive(row)',
  'function coverRosterMatch(row, query)',
  'function coverActiveRoster(query)'
].forEach(function(sig){
  vm.runInContext(extractFn(html, sig), ctx);
});
ctx.loadedAidesList = [
  {id: 'cam', username: 'cam', name: 'Cam Brooks', isActive: true, phone: '2165550199'},
  {id: 'dana', username: 'dana', name: 'Dana Ruiz', isActive: true, phone: '2165550177'},
  {id: 'erin', username: 'erin', name: 'Erin Moss', isActive: false, deactivated_at: '2026-09-20T03:20:00.000Z'},
  {id: 'nope', username: 'nope', name: 'No Stamp', isActive: false},
  {id: 'bea', username: 'bea', name: 'Bea Ortiz', isActive: true}
];
ctx.allAidesForAssign = [
  {id: 'dana', username: 'dana', name: 'Dana Ruiz', isActive: true},
  {id: 'gia', username: 'gia', name: 'Gia Novak', is_active: true}
];
const roster = vm.runInContext('coverActiveRoster("")', ctx);
assert.deepStrictEqual(Array.from(roster, function(r){return r.name;}), ['Bea Ortiz', 'Cam Brooks', 'Dana Ruiz', 'Gia Novak'], 'active aides only, including aides outside a short rank list');
assert.ok(!Array.from(roster).some(function(r){return r.username === 'erin' || r.username === 'nope';}), 'soft-deleted aides stay off the roster');
assert.strictEqual(Array.from(roster).filter(function(r){return r.id === 'dana';}).length, 1, 'duplicate desk rows collapse');
const found = vm.runInContext('coverActiveRoster("dan")', ctx);
assert.deepStrictEqual(Array.from(found, function(r){return r.username;}), ['dana'], 'search matches a name that is not the ranked shortlist');
const byUser = vm.runInContext('coverActiveRoster("@gia")', ctx);
assert.deepStrictEqual(Array.from(byUser, function(r){return r.username;}), ['gia'], 'search matches username');
assert.strictEqual(vm.runInContext('coverActiveRoster("zzz").length', ctx), 0, 'empty search result');
assert.strictEqual(vm.runInContext('coverRosterMatch({name:"Dana Ruiz", username:"dana"}, "ruiz")', ctx), true);

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
    console.log('admin-coverpick1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : '/usr/local/bin/google-chrome');
  const shotDir = process.env.COVERPICK_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const shiftId = '11111111-1111-4111-8111-111111111111';
  const camId = '44444444-4444-4444-8444-444444444444';
  const danaId = '55555555-5555-4555-8555-555555555555';
  const erinId = '66666666-6666-4666-8666-666666666666';
  const beaId = '33333333-3333-4333-8333-333333333333';
  const calls = [];
  const aides = [
    {id: camId, username: 'cam', full_name: 'Cam Brooks', is_active: true, deactivated_at: null, phone: '2165550199'},
    {id: danaId, username: 'dana', full_name: 'Dana Ruiz', is_active: true, deactivated_at: null, phone: '2165550177'},
    {id: beaId, username: 'bea', full_name: 'Bea Ortiz', is_active: true, deactivated_at: null},
    {id: '77777777-7777-4777-8777-777777777777', username: 'finn', full_name: 'Finn Hale', is_active: true, deactivated_at: null},
    {id: '88888888-8888-4888-8888-888888888888', username: 'gia', full_name: 'Gia Novak', is_active: true, deactivated_at: null},
    {id: '99999999-9999-4999-8999-999999999999', username: 'hana', full_name: 'Hana Cole', is_active: true, deactivated_at: null},
    {id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', username: 'ivan', full_name: 'Ivan Peck', is_active: true, deactivated_at: null},
    {id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', username: 'jules', full_name: 'Jules Ward', is_active: true, deactivated_at: null},
    {id: erinId, username: 'erin', full_name: 'Erin Moss', is_active: false, deactivated_at: '2026-09-20T03:20:00.000Z'}
  ];
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(__dirname, rel));
    if(!file.startsWith(__dirname)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream';
      res.writeHead(200, {'Content-Type': type, 'Cache-Control': 'no-store'});
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
  function arm(page){
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort();return;}
      if(u.indexOf('127.0.0.1') >= 0 || u.indexOf('localhost') >= 0){req.continue();return;}
      const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || 'apikey,authorization,content-type,accept,prefer'
      };
      if(req.method() === 'OPTIONS'){req.respond({status: 204, headers: cors});return;}
      let rpc = '';
      const m = u.match(/\/rpc\/([a-z0-9_]+)/i);
      if(m)rpc = m[1];
      let body = {};
      try{body = JSON.parse(req.postData() || '{}');}catch(e){}
      if(rpc)calls.push({rpc: rpc, body: body});
      let payload = {success: true};
      if(rpc === 'admin_list_aides'){
        payload = {success: true, aides: aides};
      }else if(rpc === 'admin_list_open_shifts'){
        payload = {success: true, shifts: [{
          open_shift_id: shiftId,
          client_id: '22222222-2222-4222-8222-222222222222',
          client_name: 'Ada Cole',
          regular_aide_id: beaId,
          regular_aide_name: 'Bea Ortiz',
          shift_start: '2026-09-26T12:00:00.000Z',
          shift_end: '2026-09-26T16:00:00.000Z',
          status: 'open',
          source: 'office',
          client_phone: '2165550142',
          case_manager_name: 'Pat Lee',
          case_manager_email: 'pat@example.com'
        }]};
      }else if(rpc === 'admin_rank_backup_aides'){
        payload = {success: true, aides: [{
          aide_id: camId,
          username: 'cam',
          name: 'Cam Brooks',
          continuity_score: 2,
          distance_miles: 1.2,
          score: 88,
          rank: 1,
          phone: '2165550199'
        }]};
      }else if(rpc === 'admin_cover_outcome'){
        payload = {success: true, status: body.p_outcome || 'open', open_shift_id: shiftId};
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
        access_token: 'coverpick1-test',
        refresh_token: 'coverpick1-refresh',
        profile: {org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'Admin'}
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=coverpick1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      showTab('coverage');
    });
    await page.waitForSelector('[data-cover-id="' + shiftId + '"]');
    await page.click('[data-cover-id="' + shiftId + '"]');
    await page.waitForFunction(function(){
      var view = document.getElementById('coverOutcomeView');
      var rank = document.querySelector('#coverRankList .cover-rank-row');
      var pick = document.getElementById('coverPickOtherBtn');
      var roster = document.getElementById('coverRosterPick');
      return view && !view.hidden && rank && /Cam Brooks/.test(rank.textContent || '') && pick && roster && roster.hidden;
    }, {timeout: 8000});

    const ranked = await page.evaluate(function(){
      var rank = document.getElementById('coverRankList').getBoundingClientRect();
      var btn = document.getElementById('coverPickOtherBtn').getBoundingClientRect();
      var fab = document.getElementById('copilotFab');
      var sheet = document.getElementById('copilotSheet');
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: document.getElementById('coverRosterPick').getAttribute('data-coverpick1'),
        rankTop: rank.top,
        btnTop: btn.top,
        btnH: btn.height,
        rosterHidden: document.getElementById('coverRosterPick').hidden,
        sheetHidden: !sheet || !!sheet.hidden,
        fabHidden: !fab || !!fab.hidden,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });
    assert.strictEqual(ranked.build, '2026-09-26-clienthrs1a');
    assert.strictEqual(ranked.marker, 'v=coverpick1');
    assert.ok(ranked.rankTop < ranked.btnTop, 'ranked list stays above Pick another aide');
    assert.strictEqual(ranked.rosterHidden, true, 'full roster stays closed until opened');
    assert.ok(ranked.btnH >= 44, 'pick control tap size ' + ranked.btnH);
    assert.strictEqual(ranked.sheetHidden, true, 'Remi sheet stays closed');
    assert.strictEqual(ranked.fabHidden, false, 'Remi stays a corner chip');
    assert.ok(ranked.scrollWidth <= ranked.clientWidth + 1, 'no horizontal overflow');
    await page.evaluate(function(){
      document.getElementById('coverRankPanel').scrollIntoView({block: 'start'});
    });
    await page.screenshot({path: path.join(shotDir, 'coverpick1-phone-ranked.png')});

    await page.click('#coverRankList [data-cover-aide="' + camId + '"]');
    const camPicked = await page.evaluate(function(){return String(coverSelectedAideId || '');});
    assert.strictEqual(camPicked, camId, 'ranked tap still checks that aide');

    await page.click('#coverPickOtherBtn');
    await page.waitForFunction(function(danaId, erinId){
      var box = document.getElementById('coverRosterPick');
      var list = document.getElementById('coverRosterList');
      var search = document.getElementById('coverRosterSearch');
      if(!box || box.hidden || !list || !search)return false;
      var text = list.innerText || '';
      return /Dana Ruiz/.test(text) && /Cam Brooks/.test(text) && !/Erin Moss/.test(text);
    }, {timeout: 8000}, danaId, erinId);
    const open = await page.evaluate(function(){
      var search = document.getElementById('coverRosterSearch');
      var list = document.getElementById('coverRosterList');
      var row = list.querySelector('.cover-roster-row');
      var sr = search.getBoundingClientRect();
      var rr = row.getBoundingClientRect();
      var cs = getComputedStyle(list);
      return {
        searchH: sr.height,
        rowH: rr.height,
        overflowY: cs.overflowY,
        scrolls: list.scrollHeight > list.clientHeight + 4,
        names: list.innerText,
        rankStill: (document.querySelector('#coverRankList .cover-rank-row') || {}).innerText || ''
      };
    });
    assert.ok(open.searchH >= 44, 'search tap size ' + open.searchH);
    assert.ok(open.rowH >= 44, 'roster row tap size ' + open.rowH);
    assert.strictEqual(open.overflowY, 'auto', 'roster list scrolls');
    assert.strictEqual(open.scrolls, true, 'roster list is taller than the phone pane');
    assert.ok(/Dana Ruiz/.test(open.names) && !/Erin Moss/.test(open.names), 'full active roster includes a non-ranked aide and hides soft-deleted');
    assert.ok(/Cam Brooks/.test(open.rankStill) && /Worked this client 2 times/.test(open.rankStill), 'ranked list stays painted');
    await page.evaluate(function(){
      document.getElementById('coverRankPanel').scrollIntoView({block: 'start'});
    });
    await page.screenshot({path: path.join(shotDir, 'coverpick1-phone-roster.png')});

    await page.type('#coverRosterSearch', 'Dana');
    await page.waitForFunction(function(){
      var rows = document.querySelectorAll('#coverRosterList .cover-roster-row');
      return rows.length === 1 && /Dana Ruiz/.test(rows[0].innerText || '');
    }, {timeout: 4000});
    await page.click('#coverRosterList [data-cover-aide="' + danaId + '"]');
    const danaPicked = await page.evaluate(function(danaId){
      var sel = document.getElementById('coverBackupSel');
      return {
        id: String(coverSelectedAideId || ''),
        select: sel ? String(sel.value || '') : '',
        label: sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex].textContent : ''
      };
    }, danaId);
    assert.strictEqual(danaPicked.id, danaId, 'roster tap uses coverPickRank');
    assert.strictEqual(danaPicked.select, danaId, 'same backup select as a ranked pick');
    assert.ok(/Dana Ruiz/.test(danaPicked.label), danaPicked.label);

    await page.evaluate(function(){
      document.getElementById('coverAssignBtn').scrollIntoView({block: 'center'});
    });
    await page.click('#coverAssignBtn');
    await page.waitForSelector('#coverAssignConfirm:not([hidden])');
    const beforeConfirm = await page.evaluate(function(){
      return {contacted: coverContacted === true, hidden: document.getElementById('coverAssignConfirm').hidden};
    });
    assert.strictEqual(beforeConfirm.contacted, false, 'confirm does not require text or call');
    assert.strictEqual(beforeConfirm.hidden, false);
    await page.evaluate(function(){
      document.getElementById('coverAssignConfirm').scrollIntoView({block: 'center'});
    });
    await page.screenshot({path: path.join(shotDir, 'coverpick1-phone-assign.png')});
    await page.click('#coverAssignConfirmBtn');
    await page.waitForFunction(function(){
      return (document.getElementById('coverOnTheWay') || {}).hidden === false;
    }, {timeout: 8000});
    const outcome = calls.filter(function(c){return c.rpc === 'admin_cover_outcome';});
    assert.strictEqual(outcome.length, 1, 'one outcome post');
    assert.strictEqual(outcome[0].body.p_outcome, 'assigned_backup');
    assert.strictEqual(outcome[0].body.p_backup_aide_id, danaId);
    assert.ok(calls.some(function(c){return c.rpc === 'admin_rank_backup_aides';}), 'rank callable still runs');
    assert.ok(calls.some(function(c){return c.rpc === 'admin_list_aides' && c.body && c.body.p_include_deleted === false;}), 'roster reuses admin_list_aides active list');
    assert.ok(!calls.some(function(c){return /cover_roster|search_aides|pick_aide/.test(c.rpc);}), 'no new roster RPC was called');
    console.log('admin-coverpick1-test: phone ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-coverpick1-test: rules ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
