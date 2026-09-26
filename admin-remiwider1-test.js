#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remiwider1'), 'remiwider1 marker');
assert.ok(html.includes('data-remiwider1="v=remiwider1"'), 'remiwider1 string marker');
assert.ok(html.includes('admin-build 2026-09-25-remiwider1'), 'remiwider1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remiwider1">'), 'remiwider1 meta');
assert.ok(html.includes('<!-- remi wider tip 1 2026-09-25 v=remiwider1 admin-build 2026-09-25-remiwider1'), 'remiwider1 comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-26-clienthrs1a'), 'clienthrs1a is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-remiwider1"') < html.indexOf('content="2026-09-25-coverpick1"'), 'coverpick1 stays after remiwider1');
assert.ok(html.indexOf('content="2026-09-25-coverpick1"') < html.indexOf('content="2026-09-25-remisec1"'), 'remisec1 stays after coverpick1');
assert.ok(html.indexOf('content="2026-09-25-remisec1"') < html.indexOf('content="2026-09-25-payready1d"'), 'payready1d stays after remisec1');
[
  '2026-09-25-coverpick1',
  '2026-09-25-remisec1',
  '2026-09-25-payready1d',
  '2026-09-25-payready1c',
  '2026-09-25-payready1b',
  '2026-09-25-coverunlock1',
  '2026-09-25-payready1',
  '2026-09-25-aidecreds1c',
  '2026-09-25-remichat1',
  '2026-09-25-remi1',
  '2026-09-25-eca-copilot1',
  '2026-09-25-cover1'
].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="'+meta+'">'), 'prior meta stays '+meta);
});
['v=coverpick1','v=remisec1','v=coverunlock1','v=payready1d','v=remichat1','v=remi1','v=eca-copilot1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays '+mark);
});

const note = html.slice(html.indexOf('v=remiwider1'), html.indexOf('<meta name="admin-build" content="2026-09-25-remiwider1">'));
assert.ok(/Admin and Scheduler only/.test(note), 'Admin and Scheduler only');
assert.ok(/Tip 1 only/.test(note), 'Tip 1 only');
assert.ok(/Tell Friday|tell Friday/.test(note), 'soft handoff tells Friday');
assert.ok(/No Friday memory/.test(note), 'no Friday memory');
assert.ok(/No Desk-brain/.test(note), 'no Desk-brain');
assert.ok(/one open cover/i.test(note), 'one open cover');
assert.ok(/admin_rank_backup_aides/.test(note) && /admin_list_open_shifts/.test(note) && /admin_cover_outcome/.test(note), 'Ace reuse named');
assert.ok(/No new Ace RPC/.test(note), 'no new Ace RPC');
assert.ok(/Tip 2 is out/.test(note), 'Tip 2 is out');
assert.ok(/no multi-cover triage/.test(note), 'triage is out');
assert.ok(/Quiet hours rules are unchanged/.test(note), 'quiet hours unchanged');
assert.ok(/No Auth reseal/.test(note), 'no Auth reseal');
assert.ok(/Remi stays the corner chip/.test(note), 'corner chip');
assert.ok(/Nurse does not get Remi/.test(note), 'nurse does not get Remi');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'note does not reseal Auth');

const widerJs = html.slice(html.indexOf('// v=remiwider1 tip 1'), html.indexOf('var schedWeekStart'));
assert.ok(widerJs.includes('function remiWiderAnswer'), 'shift talk lives with the secretary');
assert.ok(widerJs.includes('function remiWiderFetchRanks'), 'rank read is the desk rank call');
assert.ok(widerJs.includes("coverRpc('rank', coverRankArgs(shift.id))"), 'rank uses coverRankArgs');
assert.ok(widerJs.includes("coverApplyOutcome('assigned_backup')"), 'assign reuses cover outcome');
assert.ok(widerJs.includes("coverApplyOutcome('client_refused_resume_next_day')"), 'refuse reuses cover outcome');
assert.ok(widerJs.includes('coverConfirmSkip'), 'skip reuses the member-called flow');
assert.ok(widerJs.includes('COVER_CM_DEFAULT') && widerJs.includes('COVER_CM_SKIP_DEFAULT'), 'drafts reuse locked templates');
assert.ok(widerJs.includes('coverShowRoster'), 'pick another aide opens the desk roster');
assert.ok(!/burnout|cascade|escalation|triage|who's-been-asked|whos-been-asked/.test(widerJs), 'Tip 2 board is not in the script');
assert.ok(!/admin_create_aide|reset_aide_temp_password|auth\.updateUser|admin_update_client_address|admin_ask_copilot/.test(widerJs), 'no invented RPC and no Auth reseal');
assert.ok(html.includes("outcome:['admin_cover_outcome']"), 'outcome RPC stays');
assert.ok(html.includes("rank:['admin_rank_backup_aides']"), 'rank RPC stays');
assert.ok(html.includes("list:['admin_list_open_shifts']"), 'list RPC stays');
assert.ok(html.includes('if(start===end)return true;'), 'quiet hours overnight rule stays');
assert.ok(html.includes('id="copilotFab"') && html.includes('class="remi-chip-pill">Remi</span>'), 'Remi chip stays');
const nurseAt = html.indexOf('id="nurseScreen"');
const fabAt = html.indexOf('id="copilotFab"');
assert.ok(fabAt > 0 && fabAt < nurseAt, 'Remi chip sits in the Admin screen');
assert.strictEqual(html.indexOf('id="copilotFab"', nurseAt), -1, 'Nurse screen has no Remi chip');

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
    console.log('admin-remiwider1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : '/usr/local/bin/google-chrome');
  const shotDir = process.env.REMIWIDER_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox','--disable-dev-shm-usage']
  });
  const bowlax = '18acd525-1111-4111-8111-111111111111';
  const zelda = '22222222-2222-4222-8222-222222222222';
  const adaId = '33333333-3333-4333-8333-333333333333';
  const camId = '44444444-4444-4444-8444-444444444444';
  const danaId = '55555555-5555-4555-8555-555555555555';
  const clientId = '66666666-6666-4666-8666-666666666666';
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remiwider1', {waitUntil:'domcontentloaded', timeout:20000});
    const boot = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var fab = document.getElementById('copilotFab');
      return {
        sheetHidden: !!(sheet && sheet.hidden),
        adminActive: document.getElementById('adminScreen').classList.contains('active'),
        fabVisible: !!(fab && fab.getClientRects().length),
        build: document.querySelector('meta[name="admin-build"]').content
      };
    });
    assert.strictEqual(boot.sheetHidden, true, 'Remi sheet stays closed on login');
    assert.strictEqual(boot.adminActive, false, 'login is the desk, not a Remi takeover');
    assert.strictEqual(boot.fabVisible, false, 'Remi chip stays off the login screen');
    assert.strictEqual(boot.build, '2026-09-26-clienthrs1a');

    await page.evaluate(function(ids){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('timesheets');
      coverShifts = [
        {
          id: ids.bowlax, status:'open', source:'ace', clientName:'Bowlax', aideName:'Ada Cole', aideId: ids.adaId,
          clientId: ids.clientId, startsAt:'2026-09-27T16:00:00Z', endsAt:'2026-09-27T20:00:00Z',
          phone:'2165550140', caseManagerEmail:'pat@example.com', caseManagerName:'Pat Lee',
          clientHomeAddress:'100 Public Square, Cleveland OH 44129'
        },
        {
          id: ids.zelda, status:'open', source:'ace', clientName:'Zelda Moon', aideName:'Bea Ortiz', aideId: ids.danaId,
          clientId: ids.clientId, startsAt:'2026-09-28T16:00:00Z', endsAt:'2026-09-28T20:00:00Z', phone:'2165550188'
        }
      ];
      coverSelectedId = '';
      coverRanks = [];
      remiWiderRanks = {};
      coverPostedKey = '';
      coverBusy = false;
      copilotQuiet.enabled = true;
      copilotQuiet.start = '00:00';
      copilotQuiet.end = '00:00';
      copilotQuiet.start_local = '00:00';
      copilotQuiet.end_local = '00:00';
      copilotQuiet.source = 'desk';
      window.__widerRpc = [];
      window.__widerGo = [];
      apiGetCached = function(){return Promise.resolve({success:false});};
      coverGo = function(href){window.__widerGo.push(String(href||''));};
      coverRpc = function(kind, body){
        window.__widerRpc.push({kind:kind, body:body||{}});
        if(kind==='list'){
          var shifts = (coverShifts||[]).map(function(s){
            return {
              open_shift_id:s.id, client_name:s.clientName, regular_aide_name:s.aideName, regular_aide_id:s.aideId,
              client_id:s.clientId, shift_start:s.startsAt, shift_end:s.endsAt, status:s.status||'open',
              client_phone:s.phone, case_manager_email:s.caseManagerEmail, case_manager_name:s.caseManagerName,
              client_home_address:s.clientHomeAddress, source:'office'
            };
          });
          return Promise.resolve({ok:true, data:{success:true, shifts:shifts}});
        }
        if(kind==='rank'){
          return Promise.resolve({ok:true, data:{success:true, aides:[
            {aide_id:ids.adaId, name:'Ada Cole', username:'ada', continuity_score:9, distance_miles:1, rank:1, phone:'2165550100'},
            {aide_id:ids.camId, name:'Cam Brooks', username:'cam', continuity_score:4, distance_miles:2.4, rank:2, phone:'2165550199'},
            {aide_id:ids.danaId, name:'Dana Ruiz', username:'dana', continuity_score:0, distance_miles:6, rank:3, phone:'2165550177'}
          ]}});
        }
        if(kind==='outcome' || kind==='skipRecord')return Promise.resolve({ok:true, data:{success:true}});
        return Promise.resolve({missing:true});
      };
    }, {bowlax:bowlax, zelda:zelda, adaId:adaId, camId:camId, danaId:danaId, clientId:clientId});

    await page.waitForSelector('#copilotFab .remi-chip-face', {visible:true});
    const closed = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var fab = document.getElementById('copilotFab');
      var r = fab.getBoundingClientRect();
      var desk = document.getElementById('adminScreen');
      return {
        sheetHidden: sheet.hidden,
        label: fab.getAttribute('aria-label'),
        onScreen: r.left >= 0 && r.right <= window.innerWidth + 1 && r.bottom <= window.innerHeight + 1,
        wide: r.width >= 44 && r.height >= 44,
        deskText: desk.innerText.indexOf('Timesheets') >= 0,
        scrollX: window.scrollX
      };
    });
    assert.strictEqual(closed.sheetHidden, true, 'desk does not auto-open Remi');
    assert.strictEqual(closed.label, 'Remi');
    assert.strictEqual(closed.onScreen, true, 'corner chip is on the phone');
    assert.strictEqual(closed.wide, true, 'corner chip tap is at least 44px');
    assert.strictEqual(closed.deskText, true, 'the desk stays up behind the chip');
    assert.strictEqual(closed.scrollX, 0);
    await page.screenshot({path: path.join(shotDir, 'remiwider1-chip-closed.png')});

    const planned = await page.evaluate(function(){
      function grab(q){
        var ans = copilotChatAnswer(q);
        return {
          kind: ans.kind||'',
          text: ans.text||'',
          sec: !!ans.sec,
          note: ans.note||'',
          labels: (ans.actions||[]).map(function(a){return a.label;}),
          kinds: (ans.actions||[]).map(function(a){return a.kind;})
        };
      }
      var saved = coverShifts.slice();
      coverShifts = [
        {id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', status:'open', clientName:'Amy Cole', aideName:'Ada', startsAt:'2026-09-27T16:00:00Z'},
        {id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', status:'open', clientName:'Bev Cole', aideName:'Bea', startsAt:'2026-09-28T16:00:00Z'}
      ];
      var many = grab('who can cover');
      coverShifts = saved;
      var hand = grab('can you build a new screen');
      var local = grab('anything local?');
      var warm = grab('thank you');
      var hey = grab('hey Remi');
      var open = grab('who has an open shift');
      var miss = grab('who can cover Quincy');
      var skipAsk = grab('member called no service today');
      var keys = [];
      for(var i=0;i<localStorage.length;i++)keys.push(localStorage.key(i));
      return {many:many, hand:hand, local:local, warm:warm, hey:hey, open:open, miss:miss, skipAsk:skipAsk, keys:keys};
    });
    assert.ok(/Name the client/.test(planned.many.text), planned.many.text);
    assert.ok(!/Amy Cole/.test(planned.many.text) && !/Bev Cole/.test(planned.many.text), 'no multi-cover list');
    assert.ok(/Tell Friday/.test(planned.hand.text), planned.hand.text);
    assert.ok(!/friday memory|I remember/i.test(planned.hand.text));
    assert.deepStrictEqual(planned.keys.filter(function(k){return /friday/i.test(k);}), []);
    assert.ok(/Public Square/.test(planned.local.text) && /Cleveland OH 44129/.test(planned.local.text) && /desk/.test(planned.local.text), planned.local.text);
    assert.strictEqual(planned.local.sec, true);
    assert.ok(/desk/.test(planned.warm.text), planned.warm.text);
    assert.ok(/Hey Mo/.test(planned.hey.text) && /just chatting/.test(planned.hey.text), planned.hey.text);
    assert.strictEqual(planned.open.kind, 'coverage_open');
    assert.strictEqual(planned.open.sec, false, 'who has an open shift stays the desk answer');
    assert.ok(planned.open.kinds.indexOf('sms') >= 0 && planned.open.kinds.indexOf('mail') >= 0, planned.open.kinds.join(','));
    assert.ok(/Quincy/.test(planned.miss.text) && /Nothing was assigned/.test(planned.miss.text), planned.miss.text);
    assert.ok(/Which reason/.test(planned.skipAsk.text), planned.skipAsk.text);
    assert.ok(planned.skipAsk.kinds.indexOf('wider-skip') < 0, 'skip waits for a reason');

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotTabAsk', {visible:true});
    await page.click('#copilotTabAsk');
    await page.waitForSelector('#copilotChatInput', {visible:true});
    await page.type('#copilotChatInput', 'who can cover');
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      var t = document.getElementById('copilotThread').innerText;
      return /Ask in this order/.test(t) && /Cam Brooks/.test(t) && /Worked this client 4 times/.test(t);
    });
    const talk = await page.evaluate(function(ids){
      var thread = document.getElementById('copilotThread');
      var sheet = document.getElementById('copilotSheet');
      var sr = sheet.getBoundingClientRect();
      var buttons = Array.prototype.slice.call(thread.querySelectorAll('.copilot-actions .btn'));
      var last = buttons.slice(-5);
      last.forEach(function(b){b.scrollIntoView({block:'center'});});
      var box = last.map(function(b){
        var r = b.getBoundingClientRect();
        return {label:b.innerText, h:b.offsetHeight, w:r.width, left:r.left, right:r.right, top:r.top, bottom:r.bottom};
      });
      var ranks = window.__widerRpc.filter(function(r){return r.kind==='rank';});
      return {
        text: thread.innerText,
        labels: last.map(function(b){return b.innerText;}),
        box: box,
        sheetLeft: sr.left,
        sheetRight: sr.right,
        ranks: ranks.map(function(r){return r.body;}),
        outcomes: window.__widerRpc.filter(function(r){return r.kind==='outcome' || r.kind==='skipRecord';}).length,
        goes: window.__widerGo.slice(),
        scrollX: window.scrollX
      };
    }, {bowlax:bowlax});
    assert.ok(/Bowlax/.test(talk.text), talk.text);
    assert.ok(!/Zelda/.test(talk.text), 'one cover only');
    assert.ok(!/Ada Cole/.test(talk.text), 'regular aide is not offered as backup');
    assert.ok(/2\.4 miles away/.test(talk.text) && /Never worked this client/.test(talk.text), talk.text);
    assert.ok(/I would start with Cam Brooks/.test(talk.text), talk.text);
    assert.ok(!/100 Public Square/.test(talk.text), 'address stays out of the thread');
    assert.deepStrictEqual(talk.labels, ['Text Cam', 'Assign Cam Brooks', 'Share address', 'Call client', 'Pick another aide']);
    talk.box.forEach(function(b){
      assert.ok(b.h >= 44, b.label+' tap height '+b.h);
      assert.ok(b.left >= -1 && b.right <= 391, b.label+' stays on the phone '+b.left+'-'+b.right);
    });
    assert.strictEqual(talk.outcomes, 0, 'reading ranks does not assign');
    assert.deepStrictEqual(talk.goes, [], 'reading ranks does not text or call');
    assert.ok(talk.ranks.length >= 1, 'rank RPC ran');
    assert.strictEqual(talk.ranks[0].p_open_shift_id, bowlax);
    assert.strictEqual(talk.ranks[0].p_limit, 20);
    assert.strictEqual(talk.scrollX, 0);
    await page.screenshot({path: path.join(shotDir, 'remiwider1-shift-talk.png')});

    async function clickLabel(label){
      await page.evaluate(function(label){
        var buttons = Array.prototype.slice.call(document.querySelectorAll('#copilotThread .copilot-actions .btn'));
        var btn = buttons.filter(function(b){return b.textContent===label;}).pop();
        btn.scrollIntoView({block:'center'});
        btn.click();
      }, label);
    }
    await clickLabel('Share address');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    const share = await page.evaluate(function(){
      var box = document.getElementById('copilotConfirm');
      var go = document.getElementById('copilotConfirmGo');
      var stop = document.getElementById('copilotConfirmNotYet');
      return {
        text: box.innerText,
        thread: document.getElementById('copilotThread').innerText,
        goes: window.__widerGo.slice(),
        outcomes: window.__widerRpc.filter(function(r){return r.kind==='outcome';}).length,
        goH: go.offsetHeight,
        stopH: stop.offsetHeight
      };
    });
    assert.ok(/100 Public Square/.test(share.text), share.text);
    assert.ok(/Confirm/.test(share.text) && /Quiet hours are on/.test(share.text), share.text);
    assert.ok(!/100 Public Square/.test(share.thread), 'thread still hides the address');
    assert.deepStrictEqual(share.goes, []);
    assert.strictEqual(share.outcomes, 0);
    assert.ok(share.goH >= 44 && share.stopH >= 44, 'confirm taps are at least 44px');
    await page.screenshot({path: path.join(shotDir, 'remiwider1-confirm-share.png')});
    await page.click('#copilotConfirmNotYet');
    const shareHeld = await page.evaluate(function(){
      return {hidden: document.getElementById('copilotConfirm').hidden, goes: window.__widerGo.slice()};
    });
    assert.strictEqual(shareHeld.hidden, true);
    assert.deepStrictEqual(shareHeld.goes, [], 'Not yet does not share the address');

    await clickLabel('Text Cam');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    const textHeld = await page.evaluate(function(){
      return {goes: window.__widerGo.slice(), outcomes: window.__widerRpc.filter(function(r){return r.kind==='outcome';}).length};
    });
    assert.deepStrictEqual(textHeld.goes, []);
    assert.strictEqual(textHeld.outcomes, 0, 'text confirm is still closed');
    await page.click('#copilotConfirmNotYet');
    await clickLabel('Text Cam');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    await page.click('#copilotConfirmGo');
    await page.waitForFunction(function(){return window.__widerGo.length===1;});
    const textSent = await page.evaluate(function(){
      return {href: window.__widerGo[0], outcomes: window.__widerRpc.filter(function(r){return r.kind==='outcome';}).length};
    });
    assert.ok(/^sms:/.test(textSent.href), textSent.href);
    assert.ok(/2165550199/.test(textSent.href), textSent.href);
    assert.ok(!/100%20Public%20Square|100 Public Square/.test(decodeURIComponent(textSent.href)), 'aide text does not include the address');
    assert.strictEqual(textSent.outcomes, 0, 'texting does not assign');

    await page.evaluate(function(){window.__widerGo=[];});
    await clickLabel('Call client');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    await page.click('#copilotConfirmNotYet');
    const callHeld = await page.evaluate(function(){
      var shift = coverFind('18acd525-1111-4111-8111-111111111111');
      return {goes: window.__widerGo.slice(), contacted: !!(shift && shift.contacted)};
    });
    assert.deepStrictEqual(callHeld.goes, []);
    assert.strictEqual(callHeld.contacted, false, 'Not yet does not place the call');
    await clickLabel('Call client');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    await page.click('#copilotConfirmGo');
    await page.waitForFunction(function(){return window.__widerGo.length===1;});
    const callSent = await page.evaluate(function(){return window.__widerGo[0];});
    assert.ok(/^tel:/.test(callSent), callSent);

    await clickLabel('Pick another aide');
    await page.waitForSelector('#coverRosterPick:not([hidden])');
    const roster = await page.evaluate(function(){
      var box = document.getElementById('coverRosterPick');
      var sheet = document.getElementById('copilotSheet');
      var fab = document.getElementById('copilotFab');
      var r = fab.getBoundingClientRect();
      var search = document.getElementById('coverRosterSearch');
      return {
        marker: box.getAttribute('data-coverpick1'),
        sheetHidden: sheet.hidden,
        fab: !!(fab && fab.getClientRects().length && r.width >= 44),
        searchH: search ? search.offsetHeight : 0,
        outcomes: window.__widerRpc.filter(function(c){return c.kind==='outcome';}).length
      };
    });
    assert.strictEqual(roster.marker, 'v=coverpick1');
    assert.strictEqual(roster.sheetHidden, true, 'opening the roster returns Remi to the corner');
    assert.strictEqual(roster.fab, true, 'corner chip stays');
    assert.ok(roster.searchH >= 44, 'roster search is tappable');
    assert.strictEqual(roster.outcomes, 0, 'pick another aide does not assign');
    await page.screenshot({path: path.join(shotDir, 'remiwider1-pick-roster.png')});

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotTabAsk', {visible:true});
    await page.click('#copilotTabAsk');
    await page.evaluate(function(){window.__widerGo=[];});
    await page.type('#copilotChatInput', 'client refused backup');
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      var t = document.getElementById('copilotThread').innerText;
      return /Services not delivered today/.test(t) && /Bowlax/.test(t) && /will not receive services/.test(t);
    });
    const refuse = await page.evaluate(function(){
      return {
        text: document.getElementById('copilotThread').innerText,
        outcomes: window.__widerRpc.filter(function(r){return r.kind==='outcome';}).length
      };
    });
    assert.ok(/Thank you/.test(refuse.text), refuse.text);
    assert.ok(!/Hey\b/.test(refuse.text.split('Services not delivered today').pop()), 'refuse draft does not say Hey');
    assert.strictEqual(refuse.outcomes, 0, 'the refuse draft is not recorded yet');
    await page.screenshot({path: path.join(shotDir, 'remiwider1-refuse-draft.png')});
    await clickLabel('Record refused');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    await page.click('#copilotConfirmNotYet');
    const refuseHeld = await page.evaluate(function(){
      return window.__widerRpc.filter(function(r){return r.kind==='outcome';}).length;
    });
    assert.strictEqual(refuseHeld, 0, 'Not yet does not record the refusal');
    await clickLabel('Record refused');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    await page.click('#copilotConfirmGo');
    await page.waitForFunction(function(){
      return window.__widerRpc.some(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='client_refused_resume_next_day';});
    });
    const refused = await page.evaluate(function(id){
      var hit = window.__widerRpc.filter(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='client_refused_resume_next_day';});
      return {n: hit.length, id: hit[0] && hit[0].body.p_open_shift_id, goes: window.__widerGo.slice()};
    }, bowlax);
    assert.strictEqual(refused.n, 1);
    assert.strictEqual(refused.id, bowlax);
    assert.deepStrictEqual(refused.goes, [], 'recording the refusal does not open Mail');

    await page.evaluate(function(){
      coverShifts.forEach(function(s){s.status='open';});
      coverPostedKey='';
      coverBusy=false;
      coverSkipReason='';
      window.__widerGo=[];
    });
    await page.type('#copilotChatInput', 'member called personal no service today');
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      var t = document.getElementById('copilotThread').innerText;
      return /No services today/.test(t) && /Personal/.test(t) && /at the member/.test(t);
    });
    const skip = await page.evaluate(function(){
      return window.__widerRpc.filter(function(r){return r.kind==='skipRecord';}).length;
    });
    assert.strictEqual(skip, 0, 'skip draft is not recorded yet');
    await page.screenshot({path: path.join(shotDir, 'remiwider1-skip-draft.png')});
    await clickLabel('Record no service');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    await page.click('#copilotConfirmNotYet');
    const skipHeld = await page.evaluate(function(){
      return window.__widerRpc.filter(function(r){return r.kind==='skipRecord';}).length;
    });
    assert.strictEqual(skipHeld, 0, 'Not yet does not record the skip');
    await clickLabel('Record no service');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    await page.click('#copilotConfirmGo');
    await page.waitForFunction(function(){
      return window.__widerRpc.some(function(r){return r.kind==='skipRecord';});
    });
    const skipped = await page.evaluate(function(){
      var hit = window.__widerRpc.filter(function(r){return r.kind==='skipRecord';});
      return {n: hit.length, reason: hit[0] && hit[0].body.p_reason, id: hit[0] && hit[0].body.p_open_shift_id};
    });
    assert.strictEqual(skipped.n, 1);
    assert.strictEqual(skipped.reason, 'personal');
    assert.strictEqual(skipped.id, bowlax);

    await page.evaluate(function(){
      coverShifts.forEach(function(s){if(s.clientName==='Bowlax')s.status='open';});
      coverPostedKey='';
      coverBusy=false;
      window.__widerRpc = window.__widerRpc.filter(function(r){return r.kind!=='outcome';});
    });
    await page.type('#copilotChatInput', 'assign backup');
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      return /Assign is a draft until you confirm/.test(document.getElementById('copilotThread').innerText);
    });
    await clickLabel('Assign Cam Brooks');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    const assignHeld = await page.evaluate(function(){
      return {
        text: document.getElementById('copilotConfirm').innerText,
        outcomes: window.__widerRpc.filter(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='assigned_backup';}).length
      };
    });
    assert.ok(/Quiet hours are on/.test(assignHeld.text) && /Cam Brooks/.test(assignHeld.text), assignHeld.text);
    assert.strictEqual(assignHeld.outcomes, 0, 'assign waits for Confirm');
    await page.screenshot({path: path.join(shotDir, 'remiwider1-confirm-assign.png')});
    await page.click('#copilotConfirmNotYet');
    await clickLabel('Assign Cam Brooks');
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    await page.click('#copilotConfirmGo');
    await page.waitForFunction(function(){
      return window.__widerRpc.some(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='assigned_backup';});
    });
    const assigned = await page.evaluate(function(){
      var hit = window.__widerRpc.filter(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='assigned_backup';});
      return {n: hit.length, aide: hit[0] && hit[0].body.p_backup_aide_id, id: hit[0] && hit[0].body.p_open_shift_id};
    });
    assert.strictEqual(assigned.n, 1);
    assert.strictEqual(assigned.aide, camId);
    assert.strictEqual(assigned.id, bowlax);

    await page.evaluate(function(){
      copilotClose();
      currentAdminRole = 'Scheduler';
      layoutA1ApplyRoles();
      showScreen('adminScreen');
    });
    const sched = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      var ans = copilotChatAnswer('who can cover');
      return {
        fab: !!(fab && getComputedStyle(fab).display!=='none'),
        role: copilotRoleOk(),
        sec: !!ans.sec
      };
    });
    assert.strictEqual(sched.fab, true, 'Scheduler keeps the Remi chip');
    assert.strictEqual(sched.role, true);
    assert.strictEqual(sched.sec, true, 'Scheduler gets one-cover shift talk');

    await page.evaluate(function(){
      copilotClose();
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      showScreen('nurseScreen');
    });
    const nurse = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      var home = document.getElementById('nurseScreen');
      var ans = copilotChatAnswer('who can cover');
      return {
        fabVisible: !!(fab && fab.getClientRects().length && getComputedStyle(fab).display!=='none' && !fab.hidden),
        sheetHidden: document.getElementById('copilotSheet').hidden,
        mentions: /\bRemi\b/.test(home.innerText || ''),
        roleOk: copilotRoleOk(),
        sec: !!ans.sec,
        order: /Ask in this order/.test(ans.text||'')
      };
    });
    assert.strictEqual(nurse.fabVisible, false, 'Nurse has no Remi chip');
    assert.strictEqual(nurse.sheetHidden, true);
    assert.strictEqual(nurse.mentions, false);
    assert.strictEqual(nurse.roleOk, false);
    assert.strictEqual(nurse.sec, false, 'Nurse does not get Remi shift talk');
    assert.strictEqual(nurse.order, false);
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remiwider1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
