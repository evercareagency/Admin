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

assert.ok(html.includes('v=coverunlock1'), 'coverunlock1 marker');
assert.ok(html.includes('data-coverunlock1="v=coverunlock1"'), 'coverunlock1 string marker');
assert.ok(html.includes('admin-build 2026-09-25-coverunlock1'), 'coverunlock1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-coverunlock1">'), 'coverunlock1 meta');
assert.ok(html.includes('<!-- coverage outcome unlock 2026-09-25 v=coverunlock1 admin-build 2026-09-25-coverunlock1'), 'coverunlock1 comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-remiwider1c'), 'remiwider1c is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-remisec1"') < html.indexOf('content="2026-09-25-payready1d"'), 'payready1d stays after remisec1');
assert.ok(html.indexOf('content="2026-09-25-payready1b"') < html.indexOf('content="2026-09-25-coverunlock1"'), 'coverunlock1 stays after payready1b');
assert.ok(html.indexOf('content="2026-09-25-coverunlock1"') < html.indexOf('content="2026-09-25-payready1"'), 'payready1 stays after coverunlock1');
assert.ok(html.indexOf('content="2026-09-25-payready1"') < html.indexOf('content="2026-09-25-aidecreds1c"'), 'aidecreds1c stays after payready1');
['v=payready1','v=aidecreds1c','v=aidecreds1b','v=aidecreds1','v=covercomms1','v=coveraide1','v=cover1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
['2026-09-25-payready1','2026-09-25-aidecreds1c','2026-09-25-covercomms1','2026-09-25-cover1'].forEach(function(build){
  assert.ok(html.includes('<meta name="admin-build" content="' + build + '">'), 'prior meta stays ' + build);
});

const note = html.slice(html.indexOf('v=coverunlock1'), html.indexOf('<meta name="admin-build" content="2026-09-25-coverunlock1">'));
assert.ok(/Remi stays the corner chip/.test(note), 'Remi stays corner-only');
assert.ok(/No Auth reseal/.test(note), 'no Auth reseal');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'coverunlock1 note does not reseal Auth');

const desk = html.slice(html.indexOf('id="tab_coverage"'), html.indexOf('id="tab_backups"'));
assert.ok(desk.includes('data-coverunlock1="v=coverunlock1"'), 'marker sits on the open-shift outcome view');
assert.ok(desk.includes('>Text this aide<') && desk.includes('>Text client<') && desk.includes('>Call client<'), 'text and call stay optional');
assert.ok(desk.includes('>Client wants backup<'), 'client wants backup');
assert.ok(desk.includes('>Client refused · resume next day<'), 'client refused');
assert.ok(desk.includes('>Member called · no service today<'), 'member called');
assert.ok(desk.includes('>Still deciding<'), 'still deciding');
assert.ok(desk.includes('>Who can cover<'), 'aide ranking stays');
assert.ok(desk.includes('id="coverCmDraft"') && desk.includes('>Open in Mail<'), 'refuse email stays');
assert.ok(!/id="coverAssignBtn" disabled|id="coverRefuseBtn" disabled|id="coverAwaitBtn" disabled|id="coverSkipBtn" disabled/.test(desk), 'outcome buttons are not locked in markup');
assert.ok(desk.includes('Text or call is optional if you still need the client.'), 'soft reminder does not lock the shift');
assert.ok(!desk.includes('before you close this shift'), 'hard lock copy is gone from the desk');
assert.ok(!desk.includes('Text or call the client, then close the shift.'), 'header no longer requires text or call');
assert.ok(!/copilotFab|remi-chip/.test(desk), 'Remi is not expanded into Coverage');

const paint = extractFn(html, 'function coverPaintOutcome()');
assert.ok(paint.includes('refuse.disabled=false') && paint.includes('awaitBtn.disabled=false'), 'refuse and still deciding stay enabled');
assert.ok(!paint.includes('canClose') && !/refuse\.disabled=!coverContacted|assign\.disabled=!canClose/.test(paint), 'paint does not lock outcomes on contact');
assert.ok(paint.includes('assign.disabled=!canAssign') && paint.includes('skip.disabled=!canAssign'), 'assign and skip still follow open-shift status');
const showAssign = extractFn(html, 'function coverShowAssign()');
const apply = extractFn(html, 'async function coverApplyOutcome(outcome)');
const refuse = extractFn(html, 'function coverRefuse()');
assert.ok(!showAssign.includes('coverContacted') && !apply.includes('coverContacted') && !refuse.includes('coverContacted'), 'outcome actions do not require text or call');
assert.ok(!html.includes('Text or call the client first.'), 'contact toast is gone');
assert.ok(extractFn(html, 'function coverMarkContact(kind)').includes("coverAskOutbound('sms'"), 'text client still drafts a message');
assert.ok(extractFn(html, 'async function coverLoadRanks(shift)').includes("coverRpc('rank'"), 'aide ranking still loads');
assert.ok(refuse.includes("coverShowRefuseDraft(shift,'refuse')") && !refuse.includes('coverApplyOutcome'), 'refuse opens the draft and waits to record');
assert.ok(extractFn(html, 'function coverConfirmRefuse()').includes("coverApplyOutcome('client_refused_resume_next_day')"), 'confirm records the refusal');
assert.ok(extractFn(html, 'function coverAwaiting()').includes("coverAskStatus('awaiting_client'"), 'still deciding waits for confirm');
assert.ok(extractFn(html, 'function coverCancelStatus()').includes("coverStatusPending=''"), 'not yet clears the pending status');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser/.test(desk + paint + showAssign + apply + refuse), 'coverage outcome path does not reseal Auth');

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
    console.log('admin-coverunlock1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : '/usr/local/bin/google-chrome');
  const shotDir = process.env.COVERUNLOCK_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const shiftId = '11111111-1111-4111-8111-111111111111';
  const calls = [];
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
      if(rpc === 'admin_list_open_shifts'){
        payload = {success: true, shifts: [{
          open_shift_id: shiftId,
          client_id: '22222222-2222-4222-8222-222222222222',
          client_name: 'Ada Cole',
          regular_aide_id: '33333333-3333-4333-8333-333333333333',
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
          aide_id: '44444444-4444-4444-8444-444444444444',
          username: 'cam',
          name: 'Cam Brooks',
          continuity_score: 2,
          distance_miles: 1.2,
          score: 88,
          rank: 1,
          phone: '2165550199'
        }]};
      }else if(rpc === 'admin_preview_cover_refuse_email' || rpc === 'admin_get_cover_refuse_template'){
        payload = {
          success: true,
          subject: 'Services not delivered today — Ada Cole (09/26/2026)',
          body: 'Good morning\n\nI wanted to inform you that our mutual member Ada Cole will not receive services today.',
          case_manager_email: 'pat@example.com'
        };
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
        access_token: 'coverunlock1-test',
        refresh_token: 'coverunlock1-refresh',
        profile: {org_id: '4f97f4d3-6635-4544-904c-6b06aa02d40b', role: 'Admin'}
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=coverunlock1', {waitUntil: 'domcontentloaded', timeout: 20000});
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
      return view && !view.hidden && rank && /Cam Brooks/.test(rank.textContent || '');
    }, {timeout: 8000});

    async function measure(label){
      return page.evaluate(function(label){
        function box(id){
          var el = document.getElementById(id);
          if(!el)return null;
          var r = el.getBoundingClientRect();
          var cs = getComputedStyle(el);
          return {
            id: id,
            disabled: !!el.disabled,
            hidden: !!el.hidden,
            opacity: cs.opacity,
            w: r.width,
            h: r.height,
            left: r.left,
            right: r.right,
            top: r.top,
            bottom: r.bottom,
            text: (el.innerText || '').replace(/\s+/g, ' ').trim()
          };
        }
        var ids = ['coverTextAideBtn','coverTextBtn','coverCallBtn','coverAssignBtn','coverRefuseBtn','coverSkipBtn','coverAwaitBtn'];
        var fab = document.getElementById('copilotFab');
        var fabBox = fab ? fab.getBoundingClientRect() : null;
        var sheet = document.getElementById('copilotSheet');
        return {
          label: label,
          contacted: coverContacted === true,
          build: document.querySelector('meta[name="admin-build"]').content,
          marker: document.getElementById('coverOutcomeView').getAttribute('data-coverunlock1'),
          note: document.getElementById('coverContactNote').textContent,
          buttons: ids.map(box),
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          scrollHeight: document.documentElement.scrollHeight,
          viewH: window.innerHeight,
          fab: fabBox ? {top: fabBox.top, bottom: fabBox.bottom, left: fabBox.left, right: fabBox.right, hidden: !!fab.hidden} : null,
          sheetHidden: !sheet || !!sheet.hidden,
          rank: (document.querySelector('#coverRankList .cover-rank-row') || {}).innerText || ''
        };
      }, label);
    }

    const opened = await measure('opened');
    assert.strictEqual(opened.build, '2026-09-25-remiwider1c');
    assert.strictEqual(opened.marker, 'v=coverunlock1');
    assert.strictEqual(opened.contacted, false, 'opened without text or call');
    assert.ok(opened.note.indexOf('optional') >= 0, opened.note);
    assert.ok(!/before you close/i.test(opened.note), opened.note);
    assert.ok(opened.scrollWidth <= opened.clientWidth + 1, 'no horizontal overflow ' + opened.scrollWidth + '/' + opened.clientWidth);
    assert.ok(opened.scrollHeight > opened.viewH, 'outcome screen scrolls');
    assert.strictEqual(opened.sheetHidden, true, 'Remi sheet stays closed');
    assert.ok(opened.fab && opened.fab.hidden === false, 'Remi stays a corner chip');
    assert.ok(/Cam Brooks/.test(opened.rank) && /Worked this client 2 times/.test(opened.rank), 'ranking still paints');
    opened.buttons.forEach(function(btn){
      assert.ok(btn, 'missing button');
      assert.strictEqual(btn.disabled, false, btn.id + ' stays enabled');
      assert.ok(Number(btn.opacity) > 0.8, btn.id + ' is not faded ' + btn.opacity);
      assert.ok(btn.h >= 44 && btn.w >= 200, btn.id + ' tap size ' + btn.w + 'x' + btn.h);
      assert.ok(btn.left >= -1 && btn.right <= 391, btn.id + ' stays inside 390px ' + btn.left + '-' + btn.right);
    });

    await page.evaluate(function(){
      document.getElementById('coverContactNote').scrollIntoView({block: 'start'});
    });
    await page.screenshot({path: path.join(shotDir, 'coverunlock1-phone-outcomes.png')});

    await page.click('#coverAssignBtn');
    await page.waitForSelector('#coverAssignConfirm:not([hidden])');
    const assign = await measure('assign');
    assert.strictEqual(assign.contacted, false, 'backup confirm did not require text or call');
    assert.strictEqual(assign.buttons.filter(function(b){return b.id === 'coverAssignBtn';})[0].disabled, false);
    await page.evaluate(function(){
      document.getElementById('coverAssignConfirm').scrollIntoView({block: 'center'});
    });
    await page.screenshot({path: path.join(shotDir, 'coverunlock1-phone-wants-backup.png')});
    await page.click('#coverAssignCancel');

    await page.click('#coverSkipBtn');
    await page.waitForSelector('#coverSkipReason:not([hidden])');
    const skip = await measure('skip');
    assert.strictEqual(skip.contacted, false, 'member called did not require text or call');
    await page.evaluate(function(){
      document.getElementById('coverSkipReason').scrollIntoView({block: 'center'});
    });
    await page.screenshot({path: path.join(shotDir, 'coverunlock1-phone-member-called.png')});

    await page.click('#coverRefuseBtn');
    await page.waitForFunction(function(){
      var box = document.getElementById('coverRefuseMail');
      var draft = document.getElementById('coverCmDraft');
      var go = document.getElementById('coverRefuseConfirm');
      return box && !box.hidden && draft && /Ada Cole/.test(draft.value || '') && go && !go.hidden;
    }, {timeout: 8000});
    assert.ok(!calls.some(function(c){
      return c.rpc === 'admin_cover_outcome' && c.body && c.body.p_outcome === 'client_refused_resume_next_day';
    }), 'refuse draft does not record before Confirm');
    await page.click('#coverRefuseConfirm');
    await page.waitForFunction(function(id){
      return String(coverPostedKey) === String(id) + '|client_refused_resume_next_day';
    }, {timeout: 8000}, shiftId);
    const refused = await measure('refused');
    assert.strictEqual(refused.contacted, false, 'refuse did not require text or call');
    assert.ok(calls.some(function(c){
      return c.rpc === 'admin_cover_outcome' && c.body && c.body.p_outcome === 'client_refused_resume_next_day';
    }), 'refuse still posts the outcome');
    assert.ok(calls.some(function(c){return c.rpc === 'admin_rank_backup_aides';}), 'rank callable still runs');
    await page.evaluate(function(){
      document.getElementById('coverRefuseMail').scrollIntoView({block: 'start'});
    });
    await page.screenshot({path: path.join(shotDir, 'coverunlock1-phone-refused.png')});

    const clear = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab').getBoundingClientRect();
      var ids = ['coverAssignBtn','coverRefuseBtn','coverSkipBtn','coverAwaitBtn','coverTextBtn','coverCallBtn','coverTextAideBtn'];
      var hits = [];
      ids.forEach(function(id){
        var el = document.getElementById(id);
        el.scrollIntoView({block: 'center'});
        var r = el.getBoundingClientRect();
        var overlap = !(r.bottom < fab.top || r.top > fab.bottom || r.right < fab.left || r.left > fab.right);
        var visible = r.top >= 0 && r.bottom <= window.innerHeight && r.height >= 44;
        hits.push({id: id, overlap: overlap, visible: visible, top: r.top, bottom: r.bottom, fabTop: fab.top});
      });
      return hits;
    });
    clear.forEach(function(hit){
      assert.strictEqual(hit.overlap, false, hit.id + ' is under the Remi chip');
      assert.strictEqual(hit.visible, true, hit.id + ' is not fully on screen ' + hit.top + '-' + hit.bottom);
    });
    console.log('admin-coverunlock1-test: phone ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-coverunlock1-test: rules ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
