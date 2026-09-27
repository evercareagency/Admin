#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

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

assert.ok(html.includes('v=cover-unselect1'), 'cover-unselect1 marker');
assert.ok(html.includes('data-cover-unselect1="v=cover-unselect1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-cover-unselect1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-cover-unselect1">'), 'meta');
assert.ok(html.includes('<!-- cover unselect 2026-09-27 v=cover-unselect1 admin-build 2026-09-27-cover-unselect1'), 'comment');
assert.ok(html.includes("var COVER_UNSELECT1_MARKER='v=cover-unselect1'"), 'script marker');
assert.ok(html.includes('GHOST-COVER-UNSELECT1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
assert.ok(html.includes('No SQL'), 'no SQL');
assert.ok(html.includes('No Quo/SMS') && html.includes('No Auth reseal'), 'hard rules');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-aides-info1'), 'first admin-build is aides-info1');
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
assert.ok(html.indexOf('content="2026-09-27-cover-unselect1"') < html.indexOf('content="2026-09-27-remi-payroll1"'), 'payroll stays after cover-unselect1');
['v=nosvc-reason-draft1','cancel-shift1','v=remi-payroll1','v=client-ins1','v=remi-ideas763','v=remi-float-noshow1','v=remi-proof1','v=remi-sched1','v=remi-rules1','v=remi-notes-vis1','v=coverage-simple1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage-simple1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'payroll meta stays');
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');

const bar = html.slice(html.indexOf('data-cover-unselect1="v=cover-unselect1"'), html.indexOf('id="coverSimpleAides"'));
assert.ok(bar.indexOf('id="coverSimpleCount"') < bar.indexOf('Select all active'), 'count stays left');
assert.ok(bar.indexOf('>Select all active<') < bar.indexOf('>Unselect all<'), 'Unselect all sits beside Select all active');
assert.ok(bar.includes('id="coverSimpleNone"') && bar.includes('coverSimpleUnselectAll()'), 'Unselect all control');
assert.ok(!bar.includes('Clear selection'), 'Who can cover does not say Clear selection');
assert.ok(html.includes('onclick="isAssignClearSelection()">Clear selection</button>'), 'in-service keeps Clear selection');
assert.ok(html.includes('id="coverSimpleEmpty"') && html.includes('Select at least one aide to send a chat blast.'), 'empty state');

const simple = html.slice(html.indexOf('// v=coverage-simple1 blast'), html.indexOf('// end v=coverage-simple1'));
assert.ok(simple.includes("coverSimpleRpc('admin_blast_cover_request'"), 'blast callable stays');
assert.ok(!/sms:|mailto:/.test(simple), 'this tip does not open Messages or Mail');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser/.test(simple), 'no Auth reseal');
const unselect = extractFn(html, 'function coverSimpleUnselectAll()');
assert.ok(unselect.includes('coverSimplePicked={}'), 'clears the Set');
assert.ok(unselect.includes('coverSimplePaintBlast()'), 'repaints checkboxes');
assert.ok(!unselect.includes('coverSimpleRpc') && !unselect.includes('coverSimpleClose'), 'unselect does not blast or close');
const selectAll = extractFn(html, 'function coverSimpleSelectAll()');
assert.ok(selectAll.includes('if(!row.calledOff)coverSimplePicked[row.id]=1'), 'select all active still skips called-off');
const send = extractFn(html, 'async function coverSimpleSendBlast()');
assert.ok(send.indexOf('if(!picked.length)') < send.indexOf("coverSimpleRpc('admin_blast_cover_request'"), 'empty set returns before the blast');
assert.ok(send.includes('!body.p_aide_ids') && send.includes('p_aide_ids.length'), 'empty p_aide_ids never posts');
const sync = extractFn(html, 'function coverSimpleSyncSend()');
assert.ok(sync.includes("btn.classList.toggle('is-disabled', n===0)"), 'zero selection ghosts Send chat blast');
assert.ok(sync.includes('btn.disabled=off'), 'zero selection disables Send chat blast');

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
    console.log('admin-cover-unselect1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.COVER_UNSELECT_SHOTS || '/opt/cursor/artifacts';
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
  const shiftId = '55555555-5555-4555-8555-555555555555';
  const names = [
    ['Devon Park','devon',2.1,2],
    ['Jamal Wright','jamal',3.4,1],
    ['Aisha Khan','aisha',4.0,1],
    ['Sara Nguyen','sara',1.8,3],
    ['moe','moe',5.2,1],
    ['Probe QA Test','probe',0,0],
    ['Maria Santos','maria',2.8,1],
    ['Tanya Brooks','tanya',6.1,0],
    ['Chris Okafor','chris',3.0,1],
    ['Elena Rossi','elena',4.5,2],
    ['Omar Haddad','omar',7.2,0],
    ['Priya Shah','priya',2.4,1],
    ['Luis Mendoza','luis',5.0,0],
    ['Nina Patel','nina',3.7,1],
    ['Grace Kim','grace',1.5,2],
    ['Ben Carter','ben',8.0,0],
    ['Fatima Ali','fatima',4.2,1],
    ['Ryan Cole','ryan',6.8,0],
    ['Hannah Lee','hannah',2.9,2],
    ['Jordan Miles','jordan',5.5,0]
  ];
  const aides = names.map(function(row, i){
    const n = String(i + 1).padStart(12, '0');
    return {
      aide_id: '77777777-7777-4777-8777-' + n,
      username: row[1],
      name: row[0],
      continuity_score: row[3],
      distance_miles: row[2],
      score: 90 - i,
      rank: i + 1
    };
  });
  const aideRows = aides.map(function(a){
    return {id: a.aide_id, username: a.username, full_name: a.name, is_active: true};
  }).concat([{id: kimId, username: 'kim', full_name: 'Kim Lee', is_active: true}]);
  const calls = [];
  const shift = {
    open_shift_id: shiftId,
    client_id: clientId,
    client_name: 'Bowlax',
    client_home_address: '100 Public Square, Downtown, OH 44114',
    regular_aide_id: kimId,
    regular_aide_name: 'Kim Lee',
    shift_start: '2026-09-24T12:00:00.000Z',
    shift_end: '2026-09-24T21:00:00.000Z',
    status: 'open',
    source: 'office',
    reason: 'Sick'
  };
  function arm(page){
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic/.test(u)){req.continue(); return;}
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
        payload = [{id: clientId, name: 'Bowlax', address: '100 Public Square, Downtown, OH 44114', is_active: true}];
      }else if(u.indexOf('/rest/v1/aides') >= 0){
        payload = aideRows;
      }else if(rpc === 'admin_list_open_shifts'){
        payload = {success: true, shifts: [shift]};
      }else if(rpc === 'admin_rank_backup_aides'){
        payload = {success: true, aides: aides};
      }else if(rpc === 'admin_blast_cover_request'){
        payload = {
          success: true, ok: true, open_shift_id: shiftId, status: 'open', assigned: false,
          address_mode: body.p_address_mode || 'area', blast_count: (body.p_aide_ids || []).length,
          aide_ids: body.p_aide_ids || []
        };
      }
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers: cors,
        body: JSON.stringify(payload)
      });
    });
  }
  async function shot(page, name){
    await page.screenshot({path: path.join(shotDir, name), fullPage: false});
  }
  try{
    const page = await browser.newPage();
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.setRequestInterception(true);
    arm(page);
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token: 'cover-unselect1-test',
        refresh_token: 'cover-unselect1-refresh',
        profile: {org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'Admin'}
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=cover-unselect1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.evaluate(function(){
      return Promise.race([
        document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
        new Promise(function(resolve){setTimeout(resolve, 2500);})
      ]);
    });
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      showTab('coverage');
    });
    await page.waitForSelector('[data-cover-blast="' + shiftId + '"]', {timeout: 8000});
    await page.click('[data-cover-blast="' + shiftId + '"]');
    await page.waitForFunction(function(){
      var scrim = document.getElementById('coverSimpleScrim');
      var count = document.getElementById('coverSimpleCount');
      return scrim && !scrim.hidden && count && count.textContent === '20 selected';
    }, {timeout: 8000});
    const selected = await page.evaluate(function(kim){
      var count = document.getElementById('coverSimpleCount').getBoundingClientRect();
      var actions = document.querySelector('.cover-simple-pick-actions').getBoundingClientRect();
      var all = document.getElementById('coverSimpleAll').getBoundingClientRect();
      var none = document.getElementById('coverSimpleNone').getBoundingClientRect();
      var modal = document.querySelector('.cover-simple-modal').getBoundingClientRect();
      var rows = Array.prototype.slice.call(document.querySelectorAll('.cover-simple-aide'));
      var kimRow = rows.filter(function(row){return row.textContent.indexOf('Kim Lee') >= 0;})[0];
      return {
        count: document.getElementById('coverSimpleCount').textContent,
        unselect: document.getElementById('coverSimpleNone').textContent,
        select: document.getElementById('coverSimpleAll').textContent,
        on: document.querySelectorAll('.cover-simple-aide.is-on').length,
        kimOff: !!(kimRow && kimRow.getAttribute('aria-pressed') === 'false' && /Called off/.test(kimRow.textContent)),
        sendDisabled: document.getElementById('coverSimpleSendBlast').disabled,
        actionsRight: actions.left >= count.right - 2,
        unselectRight: none.left >= all.right - 2,
        noneW: none.width,
        allW: all.width,
        modalRight: modal.right,
        noneRight: none.right,
        clipped: none.right > modal.right + 1 || all.right > modal.right + 1 || none.width < 40,
        open: !document.getElementById('coverSimpleScrim').hidden,
        build: document.querySelector('meta[name="admin-build"]').content
      };
    }, kimId);
    assert.strictEqual(selected.count, '20 selected');
    assert.strictEqual(selected.unselect, 'Unselect all');
    assert.strictEqual(selected.select, 'Select all active');
    assert.strictEqual(selected.on, 20);
    assert.strictEqual(selected.kimOff, true, 'called-off aide stays unchecked');
    assert.strictEqual(selected.sendDisabled, false);
    assert.strictEqual(selected.actionsRight, true, 'actions sit to the right of the count');
    assert.strictEqual(selected.unselectRight, true, 'Unselect all sits to the right of Select all active');
    assert.strictEqual(selected.clipped, false, 'pick-bar labels stay inside the modal ' + JSON.stringify(selected));
    assert.strictEqual(selected.open, true);
    assert.strictEqual(selected.build, '2026-09-27-aides-info1');
    await shot(page, 'cover-unselect1-phone-20-selected.png');
    await page.setViewport({width: 1280, height: 900, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await shot(page, 'cover-unselect1-desktop-20-selected.png');
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    const blastsBefore = calls.filter(function(c){return c.rpc === 'admin_blast_cover_request';}).length;
    await page.click('#coverSimpleNone');
    await page.waitForFunction(function(){
      var count = document.getElementById('coverSimpleCount');
      var send = document.getElementById('coverSimpleSendBlast');
      var empty = document.getElementById('coverSimpleEmpty');
      return count && count.textContent === '0 selected' && send && send.disabled && empty && !empty.hidden;
    }, {timeout: 4000});
    const cleared = await page.evaluate(function(){
      return {
        count: document.getElementById('coverSimpleCount').textContent,
        on: document.querySelectorAll('.cover-simple-aide.is-on').length,
        pressed: document.querySelectorAll('.cover-simple-aide[aria-pressed="true"]').length,
        open: !document.getElementById('coverSimpleScrim').hidden,
        sendDisabled: document.getElementById('coverSimpleSendBlast').disabled,
        ghost: document.getElementById('coverSimpleSendBlast').classList.contains('is-disabled'),
        aria: document.getElementById('coverSimpleSendBlast').getAttribute('aria-disabled'),
        empty: document.getElementById('coverSimpleEmpty').textContent,
        emptyShown: !document.getElementById('coverSimpleEmpty').hidden,
        unselectStill: document.getElementById('coverSimpleNone').textContent
      };
    });
    assert.strictEqual(cleared.count, '0 selected');
    assert.strictEqual(cleared.on, 0);
    assert.strictEqual(cleared.pressed, 0);
    assert.strictEqual(cleared.open, true, 'modal stays open');
    assert.strictEqual(cleared.sendDisabled, true);
    assert.strictEqual(cleared.ghost, true);
    assert.strictEqual(cleared.aria, 'true');
    assert.strictEqual(cleared.empty, 'Select at least one aide to send a chat blast.');
    assert.strictEqual(cleared.emptyShown, true);
    assert.strictEqual(cleared.unselectStill, 'Unselect all');
    assert.strictEqual(calls.filter(function(c){return c.rpc === 'admin_blast_cover_request';}).length, blastsBefore, 'unselect does not blast');
    await page.evaluate(function(){
      document.getElementById('coverSimpleSendBlast').click();
      return coverSimpleSendBlast();
    });
    assert.strictEqual(calls.filter(function(c){return c.rpc === 'admin_blast_cover_request';}).length, blastsBefore, 'empty selection never calls the blast');
    assert.ok(!calls.some(function(c){
      return c.rpc === 'admin_blast_cover_request' && (!c.body.p_aide_ids || !c.body.p_aide_ids.length);
    }), 'no blast with an empty aide list');
    await shot(page, 'cover-unselect1-phone-0-selected.png');
    await page.setViewport({width: 1280, height: 900, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await shot(page, 'cover-unselect1-desktop-0-selected.png');
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.evaluate(function(){
      var modal = document.querySelector('.cover-simple-modal');
      modal.style.maxHeight = 'none';
      modal.style.overflow = 'visible';
    });
    const phoneModal = await page.$('.cover-simple-modal');
    await phoneModal.screenshot({path: path.join(shotDir, 'cover-unselect1-phone-unselect-full.png')});
    await page.setViewport({width: 1280, height: 900, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    const deskModal = await page.$('.cover-simple-modal');
    await deskModal.screenshot({path: path.join(shotDir, 'cover-unselect1-desktop-unselect-full.png')});
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.evaluate(function(){
      var modal = document.querySelector('.cover-simple-modal');
      modal.style.maxHeight = '';
      modal.style.overflow = '';
      document.getElementById('coverSimpleSendBlast').scrollIntoView({block: 'center'});
    });
    await shot(page, 'cover-unselect1-phone-blast-ghosted.png');
    await page.setViewport({width: 1280, height: 900, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.evaluate(function(){
      document.getElementById('coverSimpleSendBlast').scrollIntoView({block: 'center'});
    });
    await shot(page, 'cover-unselect1-desktop-blast-ghosted.png');
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2});
    await page.click('#coverSimpleAll');
    await page.waitForFunction(function(){
      var count = document.getElementById('coverSimpleCount');
      var send = document.getElementById('coverSimpleSendBlast');
      return count && count.textContent === '20 selected' && send && !send.disabled;
    }, {timeout: 4000});
    const refilled = await page.evaluate(function(){
      var rows = Array.prototype.slice.call(document.querySelectorAll('.cover-simple-aide'));
      var kimRow = rows.filter(function(row){return row.textContent.indexOf('Kim Lee') >= 0;})[0];
      return {
        count: document.getElementById('coverSimpleCount').textContent,
        on: document.querySelectorAll('.cover-simple-aide.is-on').length,
        kimOff: !!(kimRow && kimRow.getAttribute('aria-pressed') === 'false'),
        emptyHidden: document.getElementById('coverSimpleEmpty').hidden
      };
    });
    assert.strictEqual(refilled.count, '20 selected');
    assert.strictEqual(refilled.on, 20);
    assert.strictEqual(refilled.kimOff, true, 'Select all active still excludes called-off');
    assert.strictEqual(refilled.emptyHidden, true);
    await page.evaluate(function(){
      document.getElementById('coverSimpleSendBlast').click();
    });
    await page.waitForFunction(function(){
      var scrim = document.getElementById('coverSimpleScrim');
      return scrim && scrim.hidden;
    }, {timeout: 8000});
    const blast = calls.filter(function(c){return c.rpc === 'admin_blast_cover_request';});
    assert.strictEqual(blast.length, 1, 'one blast after a real selection');
    assert.strictEqual(blast[0].body.p_open_shift_id, shiftId);
    assert.strictEqual(blast[0].body.p_address_mode, 'area');
    assert.strictEqual(blast[0].body.p_aide_ids.length, 20);
    assert.ok(blast[0].body.p_aide_ids.indexOf(kimId) < 0, 'called-off aide is not in p_aide_ids');
    aides.forEach(function(a){
      assert.ok(blast[0].body.p_aide_ids.indexOf(a.aide_id) >= 0, a.name);
    });
    console.log('admin-cover-unselect1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-cover-unselect1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
