#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remiwider1b'), 'remiwider1b marker');
assert.ok(html.includes('data-remiwider1b="v=remiwider1b"'), 'remiwider1b string marker');
assert.ok(html.includes('admin-build 2026-09-25-remiwider1b'), 'remiwider1b build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remiwider1b">'), 'remiwider1b meta');
assert.ok(html.includes('<!-- remi wider tip 1b 2026-09-25 v=remiwider1b admin-build 2026-09-25-remiwider1b'), 'remiwider1b comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-25-remiwider1b'), 'remiwider1b is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-remiwider1b"') < html.indexOf('content="2026-09-25-remiwider1"'), 'remiwider1 stays after remiwider1b');
assert.ok(html.indexOf('content="2026-09-25-remiwider1"') < html.indexOf('content="2026-09-25-coverpick1"'), 'coverpick1 stays after remiwider1');
['2026-09-25-remiwider1','2026-09-25-coverpick1','2026-09-25-coverunlock1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="'+meta+'">'), 'prior meta stays '+meta);
});
['v=remiwider1','v=coverpick1','v=coverunlock1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays '+mark);
});

const note = html.slice(html.indexOf('v=remiwider1b'), html.indexOf('<meta name="admin-build" content="2026-09-25-remiwider1b">'));
assert.ok(/Admin and Scheduler only/.test(note), 'Admin and Scheduler only');
assert.ok(/Tip 1 only/.test(note), 'Tip 1 only');
assert.ok(/Tip 2 is out/.test(note), 'Tip 2 is out');
assert.ok(/no multi-cover triage/.test(note), 'triage is out');
assert.ok(/Tell Friday|tell Friday/.test(note), 'soft handoff tells Friday');
assert.ok(/No Friday memory/.test(note), 'no Friday memory');
assert.ok(/No Desk-brain/.test(note), 'no Desk-brain');
assert.ok(/No new Ace RPC/.test(note), 'no new Ace RPC');
assert.ok(/Quiet hours rules are unchanged/.test(note), 'quiet hours unchanged');
assert.ok(/No Auth reseal/.test(note), 'no Auth reseal');
assert.ok(/Remi stays the corner chip/.test(note), 'corner chip');
assert.ok(/Nurse does not get Remi/.test(note), 'nurse does not get Remi');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|auth\.updateUser|rotate password/.test(note), 'note does not reseal Auth');

const desk = html.slice(html.indexOf('id="tab_coverage"'), html.indexOf('id="tab_backups"'));
assert.ok(desk.includes('id="coverShareBtn"') && desk.includes('>Share address<'), 'share address stays reachable');
assert.ok(desk.includes('id="coverCallBtn"') && desk.includes('>Call client<'), 'call stays reachable');
assert.ok(desk.includes('id="coverRefuseConfirm"') && desk.includes('id="coverRefuseNotYet"'), 'refuse confirm gate');
assert.ok(desk.includes('id="coverStatusGo"') && desk.includes('id="coverStatusNotYet"'), 'still deciding confirm gate');
assert.ok(desk.includes('id="coverCmMailReason"'), 'missing email reason is on the draft');
assert.ok(desk.includes('id="coverCmMail" disabled'), 'Open in Mail starts disabled');

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
const refuse = extractFn(html, 'function coverRefuse()');
assert.ok(refuse.includes("coverShowRefuseDraft(shift,'refuse')") && !refuse.includes('coverApplyOutcome'), 'refuse shows the draft before it records');
assert.ok(extractFn(html, 'function coverConfirmRefuse()').includes("coverApplyOutcome('client_refused_resume_next_day')"), 'confirm records the refusal');
assert.ok(extractFn(html, 'function coverAwaiting()').includes("coverAskStatus('awaiting_client'"), 'still deciding waits');
assert.ok(!extractFn(html, 'function coverAwaiting()').includes('coverApplyOutcome'), 'still deciding does not write by itself');
assert.ok(html.includes('function remiWiderNorm'), 'hyphenated asks are normalized');
assert.ok(html.includes('No client phone is on file'), 'call draft names the missing phone');
assert.ok(html.includes('No home address is on file'), 'share draft names the missing address');
assert.ok(extractFn(html, 'function coverMapShift(row)').includes("'home_address'"), 'office home address is read when Ace sends it');
assert.ok(extractFn(html, 'function coverClientPhone(shift)').includes('coverClientRecord'), 'call uses a phone already on the client');
assert.ok(html.includes('if(start===end)return true;'), 'quiet hours overnight rule stays');
assert.ok(!/admin_update_client_address|admin_ask_copilot|admin_share_address/.test(html.slice(html.indexOf('// v=remiwider1 tip 1'), html.indexOf('var schedWeekStart'))), 'no invented wider RPC');

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
    console.log('admin-remiwider1b browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : '/usr/local/bin/google-chrome');
  const shotDir = process.env.REMIWIDER_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
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
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remiwider1b', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(id){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      showScreen('adminScreen');
      window.__bRpc = [];
      window.__bGo = [];
      window.__bowlax = id;
      coverGo = function(href){window.__bGo.push(String(href||''));};
      coverRpc = function(kind, body){
        window.__bRpc.push({kind:kind, body:body||{}});
        if(kind==='list'){
          return Promise.resolve({ok:true, data:{success:true, shifts:[{
            open_shift_id:id, status:'open', source:'office', client_name:'Bowlax', regular_aide_name:'Ada Cole',
            regular_aide_id:'33333333-3333-4333-8333-333333333333', client_id:'66666666-6666-4666-8666-666666666666',
            shift_start:'2026-09-27T16:00:00Z', shift_end:'2026-09-27T20:00:00Z',
            client_phone:'', case_manager_email:'', case_manager_name:'', client_home_address:''
          }]}});
        }
        if(kind==='outcome')return Promise.resolve({ok:true, data:{success:true, status:(body&&body.p_outcome)||'open', open_shift_id:id}});
        return Promise.resolve({missing:true});
      };
      showTab('coverage');
    }, bowlax);
    await page.waitForSelector('[data-cover-id="'+bowlax+'"]');
    await page.click('[data-cover-id="'+bowlax+'"]');
    await page.waitForSelector('#coverOutcomeView:not([hidden])');

    function outcomes(kind){
      return page.evaluate(function(kind){
        return window.__bRpc.filter(function(r){
          return r.kind==='outcome' && (!kind || (r.body && r.body.p_outcome===kind));
        }).length;
      }, kind||'');
    }

    await page.click('#coverAwaitBtn');
    await page.waitForSelector('#coverStatusConfirm:not([hidden])');
    const still = await page.evaluate(function(){
      function box(id){
        var el = document.getElementById(id);
        if(!el)return null;
        el.scrollIntoView({block:'center'});
        var r = el.getBoundingClientRect();
        return {id:id, text:(el.innerText||'').replace(/\s+/g,' ').trim(), disabled:!!el.disabled, h:el.offsetHeight, w:r.width};
      }
      return {
        note: document.getElementById('coverStatusNote').innerText,
        go: box('coverStatusGo'),
        stop: box('coverStatusNotYet'),
        status: (coverFind(coverSelectedId)||{}).status
      };
    });
    assert.ok(/Not yet writes nothing/.test(still.note), still.note);
    assert.ok(still.go.h >= 44 && still.stop.h >= 44, 'still deciding taps '+still.go.h+'/'+still.stop.h);
    assert.strictEqual(still.status, 'open');
    assert.strictEqual(await outcomes('awaiting_client'), 0);
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-still-deciding.png')});
    await page.click('#coverStatusNotYet');
    const heldStatus = await page.evaluate(function(){
      return {
        hidden: document.getElementById('coverStatusConfirm').hidden,
        status: (coverFind(coverSelectedId)||{}).status,
        n: window.__bRpc.filter(function(r){return r.kind==='outcome';}).length
      };
    });
    assert.strictEqual(heldStatus.hidden, true);
    assert.strictEqual(heldStatus.status, 'open');
    assert.strictEqual(heldStatus.n, 0, 'Not yet does not write awaiting_client');
    await page.click('#coverAwaitBtn');
    await page.waitForSelector('#coverStatusConfirm:not([hidden])');
    await page.click('#coverStatusGo');
    await page.waitForFunction(function(){
      return window.__bRpc.some(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='awaiting_client';});
    });
    const decided = await page.evaluate(function(id){
      var hit = window.__bRpc.filter(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='awaiting_client';});
      return {n:hit.length, id:hit[0] && hit[0].body.p_open_shift_id};
    }, bowlax);
    assert.strictEqual(decided.n, 1);
    assert.strictEqual(decided.id, bowlax);

    await page.evaluate(function(id){
      var shift = coverFind(id);
      shift.status = 'open';
      shift.contacted = false;
      coverPostedKey = '';
      coverBusy = false;
      coverContacted = false;
      window.__bRpc = [];
      window.__bGo = [];
      coverOpenOutcome(id);
    }, bowlax);
    await page.click('#coverCallBtn');
    await page.waitForSelector('#coverOutboundConfirm:not([hidden])');
    const call = await page.evaluate(function(){
      function box(id){
        var el = document.getElementById(id);
        el.scrollIntoView({block:'center'});
        return {text:(el.innerText||'').replace(/\s+/g,' ').trim(), disabled:!!el.disabled, h:el.offsetHeight};
      }
      var shift = coverFind(coverSelectedId);
      return {
        note: document.getElementById('coverOutboundNote').innerText,
        go: box('coverOutboundGo'),
        stop: box('coverOutboundCancel'),
        contacted: !!(shift && shift.contacted),
        goes: window.__bGo.slice()
      };
    });
    assert.ok(/No client phone is on file/.test(call.note), call.note);
    assert.strictEqual(call.go.disabled, true, 'call Confirm stays off without a phone');
    assert.ok(call.go.h >= 44 && call.stop.h >= 44, 'call taps '+call.go.h+'/'+call.stop.h);
    assert.strictEqual(call.contacted, false);
    assert.deepStrictEqual(call.goes, []);
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-call-draft.png')});
    await page.click('#coverOutboundCancel');
    const callHeld = await page.evaluate(function(){
      var shift = coverFind(coverSelectedId);
      return {hidden: document.getElementById('coverOutboundConfirm').hidden, contacted: !!(shift && shift.contacted), goes: window.__bGo.slice()};
    });
    assert.strictEqual(callHeld.hidden, true);
    assert.strictEqual(callHeld.contacted, false, 'Not yet does not mark the call');
    assert.deepStrictEqual(callHeld.goes, []);

    await page.click('#coverShareBtn');
    await page.waitForSelector('#coverOutboundConfirm:not([hidden])');
    const share = await page.evaluate(function(){
      function box(id){
        var el = document.getElementById(id);
        el.scrollIntoView({block:'center'});
        return {disabled:!!el.disabled, h:el.offsetHeight, text:(el.innerText||'').trim()};
      }
      return {
        note: document.getElementById('coverOutboundNote').innerText,
        go: box('coverOutboundGo'),
        stop: box('coverOutboundCancel'),
        goes: window.__bGo.slice()
      };
    });
    assert.ok(/No home address is on file/.test(share.note), share.note);
    assert.strictEqual(share.go.disabled, true, 'share Confirm stays off without an address');
    assert.ok(share.go.h >= 44 && share.stop.h >= 44, 'share taps '+share.go.h+'/'+share.stop.h);
    assert.deepStrictEqual(share.goes, []);
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-share-draft.png')});
    await page.click('#coverOutboundCancel');
    assert.deepStrictEqual(await page.evaluate(function(){return window.__bGo.slice();}), []);

    const camId = '44444444-4444-4444-8444-444444444444';
    await page.evaluate(async function(id, camId){
      coverRpc = function(kind, body){
        window.__bRpc.push({kind:kind, body:body||{}});
        if(kind==='list'){
          return Promise.resolve({ok:true, data:{success:true, shifts:[{
            open_shift_id:id, status:'open', source:'office', client_name:'Bowlax', regular_aide_name:'Ada Cole',
            regular_aide_id:'33333333-3333-4333-8333-333333333333', client_id:'66666666-6666-4666-8666-666666666666',
            shift_start:'2026-09-27T16:00:00Z', shift_end:'2026-09-27T20:00:00Z',
            client_phone:'2165550140', home_address:'100 Public Square',
            case_manager_email:'', case_manager_name:''
          }]}});
        }
        if(kind==='rank'){
          return Promise.resolve({ok:true, data:{success:true, aides:[{
            aide_id:camId, name:'Cam Brooks', username:'cam', phone:'2165550199',
            continuity_score:2, distance_miles:1.2, rank:1
          }]}});
        }
        if(kind==='outcome')return Promise.resolve({ok:true, data:{success:true, status:(body&&body.p_outcome)||'open', open_shift_id:id}});
        return Promise.resolve({missing:true});
      };
      window.__bGo = [];
      await coverReload();
      coverOpenOutcome(id);
    }, bowlax, camId);
    await page.waitForFunction(function(id){
      var shift = coverFind(id);
      var row = document.querySelector('#coverRankList .cover-rank-row');
      return shift && String(shift.phone||'')==='2165550140' && String(shift.clientHomeAddress||'')==='100 Public Square' && row && /Cam Brooks/.test(row.textContent||'');
    }, {timeout:8000}, bowlax);
    await page.evaluate(function(camId){
      document.querySelector('#coverRankList [data-cover-aide="'+camId+'"]').scrollIntoView({block:'center'});
    }, camId);
    await page.click('#coverRankList [data-cover-aide="'+camId+'"]');

    await page.evaluate(function(){
      document.getElementById('coverCallBtn').scrollIntoView({block:'center'});
    });
    await page.click('#coverCallBtn');
    await page.waitForSelector('#coverOutboundConfirm:not([hidden])');
    const callSeed = await page.evaluate(function(){
      function box(id){
        var el = document.getElementById(id);
        el.scrollIntoView({block:'center'});
        var r = el.getBoundingClientRect();
        var hit = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
        var nav = document.querySelector('#adminScreen .bottom-nav').getBoundingClientRect();
        return {
          disabled:!!el.disabled,
          h:el.offsetHeight,
          clear:r.bottom <= nav.top + 1 && r.top >= 0,
          hit:hit===el || (hit && el.contains(hit))
        };
      }
      return {
        note: document.getElementById('coverOutboundNote').innerText,
        go: box('coverOutboundGo'),
        stop: box('coverOutboundCancel'),
        overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      };
    });
    assert.ok(/2165550140/.test(callSeed.note), callSeed.note);
    assert.ok(!/No client phone is on file/.test(callSeed.note), callSeed.note);
    assert.strictEqual(callSeed.go.disabled, false, 'call Confirm turns on when the phone is on the shift');
    assert.ok(callSeed.go.h >= 44 && callSeed.stop.h >= 44, 'seeded call taps '+callSeed.go.h+'/'+callSeed.stop.h);
    assert.strictEqual(callSeed.go.clear, true, 'call Confirm sits above the bottom nav');
    assert.strictEqual(callSeed.go.hit, true, 'call Confirm is the tap target');
    assert.strictEqual(callSeed.overflow, true, 'seeded call screen does not overflow');
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-call-seeded.png')});
    await page.click('#coverOutboundCancel');
    const callSeedHeld = await page.evaluate(function(){
      var shift = coverFind(coverSelectedId);
      return {goes: window.__bGo.slice(), contacted: !!(shift && shift.contacted)};
    });
    assert.deepStrictEqual(callSeedHeld.goes, []);
    assert.strictEqual(callSeedHeld.contacted, false, 'Not yet does not dial');
    await page.evaluate(function(){
      document.getElementById('coverCallBtn').scrollIntoView({block:'center'});
    });
    await page.click('#coverCallBtn');
    await page.waitForSelector('#coverOutboundGo:not([disabled])');
    await page.evaluate(function(){
      document.getElementById('coverOutboundGo').scrollIntoView({block:'center'});
    });
    await page.click('#coverOutboundGo');
    const callOpened = await page.evaluate(function(){
      var shift = coverFind(coverSelectedId);
      return {href: window.__bGo[0] || '', contacted: !!(shift && shift.contacted)};
    });
    assert.ok(/^tel:2165550140/.test(callOpened.href), callOpened.href);
    assert.strictEqual(callOpened.contacted, true, 'Confirm records the call step');

    await page.evaluate(function(){window.__bGo = [];});
    await page.evaluate(function(){
      document.getElementById('coverShareBtn').scrollIntoView({block:'center'});
    });
    await page.click('#coverShareBtn');
    await page.waitForSelector('#coverOutboundConfirm:not([hidden])');
    const shareSeed = await page.evaluate(function(){
      function box(id){
        var el = document.getElementById(id);
        el.scrollIntoView({block:'center'});
        var r = el.getBoundingClientRect();
        var nav = document.querySelector('#adminScreen .bottom-nav').getBoundingClientRect();
        return {disabled:!!el.disabled, h:el.offsetHeight, clear:r.bottom <= nav.top + 1 && r.top >= 0};
      }
      return {
        note: document.getElementById('coverOutboundNote').innerText,
        go: box('coverOutboundGo'),
        stop: box('coverOutboundCancel')
      };
    });
    assert.ok(/100 Public Square/.test(shareSeed.note), shareSeed.note);
    assert.ok(!/No home address is on file/.test(shareSeed.note), shareSeed.note);
    assert.strictEqual(shareSeed.go.disabled, false, 'share Confirm turns on when the address and aide phone are on file');
    assert.ok(shareSeed.go.h >= 44 && shareSeed.stop.h >= 44, 'seeded share taps '+shareSeed.go.h+'/'+shareSeed.stop.h);
    assert.strictEqual(shareSeed.go.clear, true, 'share Confirm sits above the bottom nav');
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-share-seeded.png')});
    await page.click('#coverOutboundCancel');
    assert.deepStrictEqual(await page.evaluate(function(){return window.__bGo.slice();}), [], 'Not yet does not share the address');
    await page.evaluate(function(){
      document.getElementById('coverShareBtn').scrollIntoView({block:'center'});
    });
    await page.click('#coverShareBtn');
    await page.waitForSelector('#coverOutboundGo:not([disabled])');
    await page.evaluate(function(){
      document.getElementById('coverOutboundGo').scrollIntoView({block:'center'});
    });
    await page.click('#coverOutboundGo');
    const shareOpened = await page.evaluate(function(){return window.__bGo[0] || '';});
    assert.ok(/^sms:2165550199/.test(shareOpened), shareOpened);
    assert.ok(/100%20Public%20Square|100 Public Square/.test(decodeURIComponent(shareOpened)), shareOpened);

    const seededAsk = await page.evaluate(function(){
      function grab(q, kind){
        var ans = copilotChatAnswer(q);
        var hit = (ans.actions||[]).filter(function(a){return a.kind===kind;})[0] || null;
        return {text:ans.text||'', missing:hit?String(hit.missing||''):'missing-action', phone:hit?String(hit.phone||''):'', body:hit?String(hit.body||''):''};
      }
      return {call:grab('call the client', 'wider-call'), share:grab('share the home address', 'wider-share')};
    });
    assert.strictEqual(seededAsk.call.missing, '', seededAsk.call.text);
    assert.strictEqual(seededAsk.call.phone, '2165550140');
    assert.strictEqual(seededAsk.share.missing, '');
    assert.ok(/100 Public Square/.test(seededAsk.share.body), seededAsk.share.body);

    await page.evaluate(function(){window.__bGo = [];});
    await page.click('#coverRefuseBtn');
    await page.waitForFunction(function(){
      var draft = document.getElementById('coverCmDraft');
      var mail = document.getElementById('coverCmMail');
      var box = document.getElementById('coverRefuseMail');
      return box && !box.hidden && draft && /Bowlax/.test(draft.value||'') && /no case manager email/.test(mail.textContent||'');
    });
    const refuse = await page.evaluate(function(){
      function box(id){
        var el = document.getElementById(id);
        el.scrollIntoView({block:'center'});
        var r = el.getBoundingClientRect();
        return {text:(el.innerText||'').replace(/\s+/g,' ').trim(), disabled:!!el.disabled, h:el.offsetHeight, w:r.width};
      }
      return {
        reason: document.getElementById('coverCmMailReason').innerText,
        reasonHidden: document.getElementById('coverCmMailReason').hidden,
        mail: box('coverCmMail'),
        go: box('coverRefuseConfirm'),
        stop: box('coverRefuseNotYet'),
        outcomes: window.__bRpc.filter(function(r){return r.kind==='outcome';}).length,
        goes: window.__bGo.slice()
      };
    });
    assert.ok(/case manager email is not on file/.test(refuse.reason), refuse.reason);
    assert.strictEqual(refuse.reasonHidden, false, 'missing email reason is visible');
    assert.ok(/no case manager email/.test(refuse.mail.text), refuse.mail.text);
    assert.strictEqual(refuse.mail.disabled, true);
    assert.ok(refuse.go.h >= 44 && refuse.stop.h >= 44, 'refuse taps '+refuse.go.h+'/'+refuse.stop.h);
    assert.strictEqual(refuse.outcomes, 0, 'draft does not record');
    assert.deepStrictEqual(refuse.goes, [], 'draft does not open Mail');
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-refuse-draft.png')});
    await page.click('#coverRefuseNotYet');
    const refuseHeld = await page.evaluate(function(){
      return {
        hidden: document.getElementById('coverRefuseMail').hidden,
        outcomes: window.__bRpc.filter(function(r){return r.kind==='outcome';}).length,
        status: (coverFind(coverSelectedId)||{}).status
      };
    });
    assert.strictEqual(refuseHeld.hidden, true);
    assert.strictEqual(refuseHeld.outcomes, 0, 'Not yet does not record the refusal');
    assert.strictEqual(refuseHeld.status, 'open');
    await page.click('#coverRefuseBtn');
    await page.waitForSelector('#coverRefuseMail:not([hidden]) #coverRefuseConfirm');
    await page.click('#coverRefuseConfirm');
    await page.waitForFunction(function(){
      return window.__bRpc.some(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='client_refused_resume_next_day';});
    });
    const refused = await page.evaluate(function(id){
      var hit = window.__bRpc.filter(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='client_refused_resume_next_day';});
      return {n:hit.length, id:hit[0] && hit[0].body.p_open_shift_id, goes: window.__bGo.slice()};
    }, bowlax);
    assert.strictEqual(refused.n, 1);
    assert.strictEqual(refused.id, bowlax);
    assert.deepStrictEqual(refused.goes, [], 'recording the refusal does not open Mail');

    const asked = await page.evaluate(function(){
      (coverShifts||[]).forEach(function(s){ if(s)s.status='open'; });
      function grab(q){
        var ans = copilotChatAnswer(q);
        return {
          text: ans.text||'',
          kinds: (ans.actions||[]).map(function(a){return a.kind;}),
          labels: (ans.actions||[]).map(function(a){return a.label;})
        };
      }
      var generic = 'I can look up Timesheets';
      var refuse = grab('refuse-backup');
      var skip = grab('client-initiated skip');
      var personal = grab('personal');
      var build = grab('can you build a new screen');
      return {generic:generic, refuse:refuse, skip:skip, personal:personal, build:build};
    });
    assert.ok(asked.refuse.text.indexOf(asked.generic) < 0, asked.refuse.text);
    assert.ok(/Services not delivered today/.test(asked.refuse.text), asked.refuse.text);
    assert.ok(asked.refuse.kinds.indexOf('wider-outcome') >= 0, asked.refuse.kinds.join(','));
    assert.ok(asked.skip.text.indexOf(asked.generic) < 0, asked.skip.text);
    assert.ok(/Which reason/.test(asked.skip.text) && /No services today/.test(asked.skip.text), asked.skip.text);
    assert.ok(asked.skip.kinds.indexOf('wider-skip') >= 0, 'client-initiated skip offers the confirm draft');
    assert.ok(/Tell Friday/.test(asked.personal.text), asked.personal.text);
    assert.ok(/Desk-brain/.test(asked.personal.text), asked.personal.text);
    assert.ok(!/I remember|friday memory/i.test(asked.personal.text));
    assert.ok(/Tell Friday/.test(asked.build.text), asked.build.text);
    assert.ok(asked.build.text.indexOf(asked.generic) < 0, asked.build.text);

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotTabAsk', {visible:true});
    await page.click('#copilotTabAsk');
    await page.waitForSelector('#copilotChatInput', {visible:true});
    async function ask(text){
      await page.evaluate(function(text){
        document.getElementById('copilotChatInput').value = text;
      }, text);
      await page.click('#copilotChatSend');
    }
    await ask('refuse-backup');
    await page.waitForFunction(function(){
      return /Services not delivered today/.test(document.getElementById('copilotThread').innerText);
    });
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-ask-refuse.png')});
    await page.evaluate(function(){
      var buttons = Array.prototype.slice.call(document.querySelectorAll('#copilotThread .copilot-actions .btn'));
      var btn = buttons.filter(function(b){return b.textContent==='Record refused';}).pop();
      btn.scrollIntoView({block:'center'});
      btn.click();
    });
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    const askRefuse = await page.evaluate(function(){
      function box(id){
        var el = document.getElementById(id);
        el.scrollIntoView({block:'center'});
        return {h:el.offsetHeight, text:(el.innerText||'').trim()};
      }
      return {go:box('copilotConfirmGo'), stop:box('copilotConfirmNotYet'), outcomes: window.__bRpc.filter(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='client_refused_resume_next_day';}).length};
    });
    assert.ok(askRefuse.go.h >= 44 && askRefuse.stop.h >= 44, 'ask refuse taps '+askRefuse.go.h+'/'+askRefuse.stop.h);
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-ask-refuse-confirm.png')});
    await page.click('#copilotConfirmNotYet');
    await ask('client-initiated skip');
    await page.waitForFunction(function(){
      return /Which reason/.test(document.getElementById('copilotThread').innerText) && /No services today/.test(document.getElementById('copilotThread').innerText);
    });
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-ask-skip.png')});
    await ask('build a personal reminder');
    await page.waitForFunction(function(){
      var bubbles = document.querySelectorAll('#copilotThread .copilot-bubble-remi');
      var last = bubbles.length ? bubbles[bubbles.length-1].innerText : '';
      return /Tell Friday/.test(last) && /Desk-brain/.test(last);
    });
    await page.screenshot({path: path.join(shotDir, 'remiwider1b-ask-handoff.png')});
    const nurse = await page.evaluate(function(){
      currentAdminRole = 'Nurse';
      var ans = copilotChatAnswer('refuse-backup');
      return {role: copilotRoleOk(), sec: !!ans.sec, text: ans.text||''};
    });
    assert.strictEqual(nurse.role, false);
    assert.strictEqual(nurse.sec, false, 'Nurse does not get the refuse draft');
    assert.ok(nurse.text.indexOf('Services not delivered today') < 0, nurse.text);
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remiwider1b-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
