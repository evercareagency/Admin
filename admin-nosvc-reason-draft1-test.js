#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=nosvc-reason-draft1'), 'nosvc-reason-draft1 marker');
assert.ok(html.includes('cancel-shift1'), 'cancel-shift1 marker');
assert.ok(html.includes('data-nosvc-reason-draft1="v=nosvc-reason-draft1"'), 'nosvc data attr');
assert.ok(html.includes('data-cancel-shift1="cancel-shift1"'), 'cancel-shift1 data attr');
assert.ok(html.includes('<!-- nosvc reason draft 2026-09-27 v=nosvc-reason-draft1 cancel-shift1 admin-build 2026-09-27-nosvc-reason-draft1'), 'comment');
assert.ok(html.includes("var NOSVC_REASON_DRAFT1_MARKER='v=nosvc-reason-draft1'"), 'script marker');
assert.ok(html.includes("var CANCEL_SHIFT1_MARKER='cancel-shift1'"), 'cancel script marker');
assert.ok(html.includes('GHOST-NOSVC-REASON-DRAFT1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build is remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-27-list-az1"'), 'list-az1 stays after remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-hold-autosave1"'), 'hold-autosave1 stays after list-az1');
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
assert.ok(html.indexOf('content="2026-09-27-nosvc-reason-draft1"') < html.indexOf('content="2026-09-27-remi-float-noshow1"'), 'float stays after this tip');
['v=remi-float-noshow1','v=remi-proof1','v=eca-copilot1','v=covercomms1','v=remi-cm-email1','v=coverage-simple1','v=remiface1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-cm-email1">'), 'remi-cm-email1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage-simple1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-eca-copilot1">'), 'eca-copilot1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-covercomms1">'), 'covercomms1 meta stays');
assert.ok(html.includes("nosvcPreview:['admin_preview_noservice_cm_draft']"), 'chip preview rpc');
assert.ok(html.includes("nosvcCancel:['admin_cancel_noservice_shift']"), 'cancel shift rpc');
assert.ok(html.includes("skipPreview:['admin_preview_cover_client_skip_email']"), 'old skip preview stays');
assert.ok(html.includes('admin_get_cover_client_skip_template'), 'skip template get stays');
assert.ok(html.includes('admin_record_client_skip'), 'record skip stays');
assert.ok(html.includes('admin_cover_outcome'), 'cover outcome stays');
assert.ok(html.includes('upsert_schedule_slot_day_mark'), 'day mark stays');
assert.ok(html.includes('function coverSkipPreviewBody(shift){'), 'old preview body stays');
assert.ok(!html.includes('gmail.googleapis'), 'no Gmail send backend');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('Nurse cannot cancel this shift (42501).'), 'nurse 42501');
assert.ok(html.includes('onclick="nosvcPick('), 'chip change handler');
assert.ok(html.includes('class="btn btn-ghost nosvc-cancel"'), 'cancel is the outline button');
const nosvcJs = html.slice(html.indexOf('// v=nosvc-reason-draft1'), html.indexOf('function remiWiderDraftPack'));
assert.ok(nosvcJs.includes("coverRpc('nosvcPreview'"), 'chip path calls the new preview');
assert.ok(nosvcJs.includes("coverRpc('nosvcCancel'"), 'cancel path calls the new rpc');
assert.ok(!nosvcJs.includes('admin_preview_cover_client_skip_email'), 'chip path does not call the old preview');
assert.ok(!nosvcJs.includes("coverRpc('outcome'"), 'cancel path does not call cover outcome');
assert.ok(nosvcJs.includes('schedPendingDeepLink'), 'schedule refreshes from deep_link');
assert.ok(nosvcJs.includes("next||'')==='close_panel'"), 'close_panel closes the panel');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function previewData(body){
  var code = String(body.p_reason_code||'personal');
  var labels = {
    personal:'Personal',
    doctor:'Doctor appointment',
    not_feeling_well:'Not feeling well',
    other:String(body.p_reason_other||'').trim()||'Other'
  };
  var label = labels[code]||code;
  return {
    success:true,
    ok:true,
    marker:'nosvc-reason-draft1',
    v:'nosvc-reason-draft1',
    reason_code:code,
    reason_label:label,
    chips:['personal','doctor','not_feeling_well','other'].map(function(c){
      return {code:c, label:labels[c]||c, selected:c===code};
    }),
    subject:'Services not delivered today — Bowlax (09/27/2026)',
    body:'Good evening\n\nI wanted to inform you that our mutual member Bowlax will not receive services today, 09/27/2026, at the member\'s request due to '+label+'. Services will resume on the next scheduled date.\nPlease let me know if you need any additional information.\n\nThank you,',
    case_manager_name:'Patricia Hayes',
    case_manager_email:'patricia.hayes@countyhealth.org',
    service_date_display:'09/27/2026',
    fills:{reason:label}
  };
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-nosvc-reason-draft1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.NOSVC_SHOTS || '/opt/cursor/artifacts';
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
  const clientId = '66666666-6666-4666-8666-666666666666';
  const shiftId = '18acd525-1111-4111-8111-111111111111';
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){throw err;});
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=nosvc-reason-draft1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(ids){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'jasmine@evercare.test';
      if(typeof layoutA1ApplyRoles==='function')layoutA1ApplyRoles();
      showScreen('adminScreen');
      showTab('schedule');
      allClients = [{
        id:ids.clientId,
        name:'Bowlax',
        case_manager_name:'Patricia Hayes',
        case_manager_email:'patricia.hayes@countyhealth.org'
      }];
      coverShifts = [{
        id:ids.shiftId,
        status:'open',
        source:'ace',
        clientName:'Bowlax',
        clientId:ids.clientId,
        aideName:'Ada Cole',
        startsAt:'2026-09-27T16:00:00Z',
        endsAt:'2026-09-27T21:00:00Z',
        caseManagerName:'Patricia Hayes',
        caseManagerEmail:'patricia.hayes@countyhealth.org'
      }];
      window.__rpc = [];
      window.__go = [];
      window.__tabs = [];
      var origShow = showTab;
      showTab = function(tab){
        window.__tabs.push(String(tab||''));
        window.__link = (typeof schedPendingDeepLink!=='undefined')?schedPendingDeepLink:null;
        return origShow.apply(this, arguments);
      };
      coverGo = function(href){window.__go.push(String(href||''));};
      coverRpc = function(kind, body){
        window.__rpc.push({kind:kind, body:body||{}});
        if(kind==='nosvcPreview'){
          var code = String((body&&body.p_reason_code)||'personal');
          var labels = {personal:'Personal', doctor:'Doctor appointment', not_feeling_well:'Not feeling well', other:String((body&&body.p_reason_other)||'').trim()||'Other'};
          var label = labels[code]||code;
          return Promise.resolve({ok:true, data:{
            success:true, ok:true, marker:'nosvc-reason-draft1', v:'nosvc-reason-draft1',
            reason_code:code, reason_label:label,
            chips:['personal','doctor','not_feeling_well','other'].map(function(c){
              return {code:c, label:labels[c]||c, selected:c===code};
            }),
            subject:'Services not delivered today — Bowlax (09/27/2026)',
            body:'Good evening\n\nI wanted to inform you that our mutual member Bowlax will not receive services today, 09/27/2026, at the member\'s request due to '+label+'. Services will resume on the next scheduled date.\nPlease let me know if you need any additional information.\n\nThank you,',
            case_manager_name:'Patricia Hayes',
            case_manager_email:'patricia.hayes@countyhealth.org',
            service_date_display:'09/27/2026',
            fills:{reason:label}
          }});
        }
        if(kind==='nosvcCancel'){
          return Promise.resolve({ok:true, data:{
            success:true, cancelled:true, next:'close_panel',
            marker:'nosvc-reason-draft1', cancel_marker:'cancel-shift1',
            open_shift_id:(body&&body.p_open_shift_id)||null,
            deep_link:{client_id:(body&&body.p_client_id)||'', on_date:'2026-09-27', slot_key:(body&&body.p_slot_key)||'default'},
            note:'Cancel shift — close Member-called / no-service panel'
          }});
        }
        if(kind==='skipRecord')return Promise.resolve({ok:true, data:{success:true}});
        return Promise.resolve({missing:true});
      };
      window.__nurse = (function(){
        var saved = currentAdminRole;
        currentAdminRole = 'Nurse';
        var ok = nosvcOfficeOk();
        var n = nosvcStateFromShift(coverShifts[0], 'Doctor appointment', '');
        var before = window.__rpc.length;
        return nosvcRunCancel(n).then(function(){
          currentAdminRole = saved;
          return {ok:ok, added:window.__rpc.length-before};
        });
      })();
    }, {clientId:clientId, shiftId:shiftId});
    const nurse = await page.evaluate(function(){return window.__nurse;});
    assert.strictEqual(nurse.ok, false, 'nurse is not scheduler office');
    assert.strictEqual(nurse.added, 0, 'nurse cancel does not call the rpc');

    await page.click('#copilotFab');
    await page.click('#copilotTabAsk');
    await page.waitForSelector('#copilotChatInput', {visible:true});
    await page.type('#copilotChatInput', 'member called no service today');
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      var body = document.querySelector('[data-nosvc="body"]');
      var on = document.querySelector('.nosvc-chip.on');
      return body && /due to Personal/.test(body.innerText) && on && on.textContent==='Personal';
    }, {timeout:8000});
    const personal = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var r = sheet.getBoundingClientRect();
      var outcomes = Array.prototype.slice.call(document.querySelectorAll('.nosvc-outcomes .btn')).map(function(b){
        return {text:b.textContent, ghost:b.classList.contains('btn-ghost'), h:b.getBoundingClientRect().height};
      });
      var chips = Array.prototype.slice.call(document.querySelectorAll('.nosvc-chip')).map(function(b){
        return {text:b.textContent, h:b.getBoundingClientRect().height};
      });
      var previews = window.__rpc.filter(function(row){return row.kind==='nosvcPreview';});
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: document.querySelector('[data-nosvc-reason-draft1]').getAttribute('data-nosvc-reason-draft1'),
        sub: document.querySelector('.remi-rail-sub').textContent,
        kicker: document.querySelector('.nosvc-kicker').textContent,
        to: document.querySelector('.nosvc-v small').textContent,
        body: document.querySelector('[data-nosvc="body"]').innerText,
        outcomes: outcomes,
        chips: chips,
        previewCodes: previews.map(function(row){return row.body.p_reason_code;}),
        previewDate: previews[0] && previews[0].body.p_service_date,
        oldPreview: previews.some(function(row){return row.kind==='skipPreview';}),
        sheetW: r.width,
        viewW: window.innerWidth,
        scrollW: document.documentElement.scrollWidth,
        fullPage: !!document.getElementById('tab_remi')
      };
    });
    assert.strictEqual(personal.build, '2026-09-27-remi-float-hide1b');
    assert.strictEqual(personal.marker, 'v=nosvc-reason-draft1');
    assert.ok(/Side rail/.test(personal.sub), personal.sub);
    assert.strictEqual(personal.kicker, 'After you talk to the client');
    assert.ok(personal.to.indexOf('patricia.hayes@countyhealth.org')>=0, personal.to);
    assert.ok(/due to Personal/.test(personal.body), personal.body);
    assert.ok(!/due to Doctor/.test(personal.body), personal.body);
    assert.deepStrictEqual(personal.previewCodes, ['personal']);
    assert.strictEqual(personal.previewDate, '09/27/2026');
    assert.strictEqual(personal.oldPreview, false);
    assert.strictEqual(personal.fullPage, false);
    assert.ok(personal.sheetW <= personal.viewW + 1);
    assert.ok(personal.scrollW <= personal.viewW + 1, 'no horizontal overflow');
    assert.deepStrictEqual(personal.outcomes.map(function(b){return b.text;}), ['Save skip','Copy','Send later','Hold','Cancel shift']);
    assert.strictEqual(personal.outcomes[4].ghost, true, 'Cancel shift is the outline button');
    personal.outcomes.forEach(function(b){assert.ok(b.h >= 44, b.text+' tap '+b.h);});
    personal.chips.forEach(function(b){assert.ok(b.h >= 44, b.text+' chip '+b.h);});
    await page.evaluate(function(){
      document.querySelector('.nosvc').scrollIntoView({block:'center'});
    });
    await page.screenshot({path: path.join(shotDir, 'nosvc-reason-draft1-phone-personal.png')});

    await page.evaluate(function(){
      var btn = document.querySelector('.nosvc-chip[data-reason-code="doctor"]');
      btn.scrollIntoView({block:'center'});
      btn.click();
    });
    await page.waitForFunction(function(){
      var body = document.querySelector('[data-nosvc="body"]');
      var on = document.querySelector('.nosvc-chip.on');
      var codes = window.__rpc.filter(function(row){return row.kind==='nosvcPreview';}).map(function(row){return row.body.p_reason_code;});
      return body && /due to Doctor appointment/.test(body.innerText) && on && on.getAttribute('data-reason-code')==='doctor' && codes.indexOf('doctor')>=0;
    }, {timeout:8000});
    const doctor = await page.evaluate(function(){
      var previews = window.__rpc.filter(function(row){return row.kind==='nosvcPreview';});
      return {
        body: document.querySelector('[data-nosvc="body"]').innerText,
        on: document.querySelector('.nosvc-chip.on').textContent,
        codes: previews.map(function(row){return row.body.p_reason_code;}),
        dates: previews.map(function(row){return row.body.p_service_date;}),
        refreshed: document.querySelector('.nosvc-who').textContent
      };
    });
    assert.deepStrictEqual(doctor.codes, ['personal','doctor']);
    assert.ok(doctor.dates.every(function(d){return d==='09/27/2026';}), doctor.dates.join(','));
    assert.strictEqual(doctor.on, 'Doctor appointment');
    assert.ok(/due to Doctor appointment/.test(doctor.body), doctor.body);
    assert.ok(!/due to Personal/.test(doctor.body), 'doctor chip must not keep the personal draft');
    assert.ok(/refreshed/.test(doctor.refreshed), doctor.refreshed);
    await page.screenshot({path: path.join(shotDir, 'nosvc-reason-draft1-phone-doctor.png')});

    await page.evaluate(function(){
      document.querySelector('.nosvc-outcomes .btn:nth-child(3)').click();
    });
    const mailed = await page.evaluate(function(){return window.__go.slice();});
    assert.strictEqual(mailed.length, 1);
    assert.ok(/^mailto:patricia\.hayes@countyhealth\.org/.test(mailed[0]), mailed[0]);
    assert.ok(/Doctor%20appointment|Doctor appointment/.test(decodeURIComponent(mailed[0])), 'mailto body follows the chip');

    await page.setViewport({width:1280, height:800, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.evaluate(function(){
      document.querySelector('.nosvc').scrollIntoView({block:'center'});
    });
    const desk = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var r = sheet.getBoundingClientRect();
      var cancel = document.querySelector('.nosvc-cancel').getBoundingClientRect();
      return {
        viewW: window.innerWidth,
        sheetLeft: r.left,
        sheetRight: r.right,
        sheetW: r.width,
        hidden: sheet.hidden,
        cancelH: cancel.height,
        body: document.querySelector('[data-nosvc="body"]').innerText
      };
    });
    assert.strictEqual(desk.viewW, 1280);
    assert.strictEqual(desk.hidden, false);
    assert.ok(desk.sheetLeft > 700, 'desktop rail sits on the right '+desk.sheetLeft);
    assert.ok(desk.sheetW <= 440, 'rail stays a side panel '+desk.sheetW);
    assert.ok(desk.cancelH >= 44, 'cancel tap '+desk.cancelH);
    assert.ok(/due to Doctor appointment/.test(desk.body));
    await page.screenshot({path: path.join(shotDir, 'nosvc-reason-draft1-desktop-doctor.png')});

    await page.evaluate(function(){
      document.querySelector('.nosvc-cancel').click();
    });
    await page.waitForFunction(function(){
      return window.__rpc.some(function(row){return row.kind==='nosvcCancel';}) && document.getElementById('copilotSheet').hidden;
    }, {timeout:8000});
    const cancelled = await page.evaluate(function(){
      var hit = window.__rpc.filter(function(row){return row.kind==='nosvcCancel';});
      var sched = document.getElementById('tab_schedule');
      return {
        n: hit.length,
        body: hit[0] && hit[0].body,
        outcome: window.__rpc.filter(function(row){return row.kind==='outcome';}).length,
        sheetHidden: document.getElementById('copilotSheet').hidden,
        scheduleOn: sched && sched.classList.contains('active'),
        tabs: window.__tabs.slice(),
        link: window.__link
      };
    });
    assert.strictEqual(cancelled.n, 1);
    assert.strictEqual(cancelled.outcome, 0, 'cancel does not call admin_cover_outcome');
    assert.strictEqual(cancelled.body.p_client_id, clientId);
    assert.strictEqual(cancelled.body.p_service_date, '09/27/2026');
    assert.strictEqual(cancelled.body.p_open_shift_id, shiftId);
    assert.strictEqual(cancelled.body.p_reason_code, 'doctor');
    assert.strictEqual(cancelled.body.p_slot_key, 'default');
    assert.strictEqual(cancelled.sheetHidden, true, 'member-called panel closed');
    assert.ok(cancelled.tabs.indexOf('schedule')>=0, 'schedule refresh');
    assert.ok(cancelled.link && cancelled.link.client_id===clientId, JSON.stringify(cancelled.link));
    assert.strictEqual(cancelled.link.on_date, '2026-09-27');
    assert.strictEqual(cancelled.link.slot_key, 'default');
    assert.strictEqual(cancelled.scheduleOn, true);
    await page.screenshot({path: path.join(shotDir, 'nosvc-reason-draft1-desktop-cancelled.png')});
  }finally{
    await browser.close();
    await new Promise(function(resolve){server.close(resolve);});
  }
}

runBrowser().then(function(){
  console.log('admin-nosvc-reason-draft1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
