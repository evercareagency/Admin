#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remiask1'), 'remiask1 marker');
assert.ok(html.includes('data-remiask1="v=remiask1"'), 'remiask1 string marker');
assert.ok(html.includes('admin-build 2026-09-25-remiask1'), 'remiask1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remiask1">'), 'remiask1 meta');
assert.ok(html.includes('<!-- remi ask lookups 2026-09-25 v=remiask1 admin-build 2026-09-25-remiask1'), 'remiask1 comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-26-clienthrs1a'), 'clienthrs1a is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-aidechat1"') < html.indexOf('content="2026-09-25-remiask1"'), 'remiask1 stays on the next meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remiwider1c">'), 'remiwider1c meta stays');
assert.ok(html.indexOf('content="2026-09-25-remiask1"') < html.indexOf('content="2026-09-25-remiwider1c"'), 'remiwider1c stays after remiask1');
assert.ok(html.indexOf('content="2026-09-25-remiwider1c"') < html.indexOf('content="2026-09-25-remiwider1b"'), 'remiwider1b stays after remiwider1c');
assert.ok(html.includes('v=remiwider1c') && html.includes('v=remiwider1'), 'wider markers stay');
assert.ok(html.includes('function remiAskAnswer'), 'look-up answer function');
assert.ok(html.includes('REMI_ASK_MARKER'), 'look-up marker constant');

const askJs = html.slice(html.indexOf('// v=remiask1 status look-ups'), html.indexOf('function remiSecAnswer(q)'));
assert.ok(askJs.includes('function remiAskAnswer'), 'slice is the look-up block');
assert.ok(!/sbRestRpc|fetch\(|admin_timesheet_pay_readiness|admin_rank_backup_aides/.test(askJs), 'look-ups do not call Ace');
assert.ok(!/reset_aide_temp_password|auth\.updateUser|admin_create_aide/.test(askJs), 'look-ups do not reseal Auth');
assert.ok(!/kind:\s*'sms'|kind:\s*'mail'|kind:\s*"sms"/.test(askJs), 'look-up answers do not build outbound actions');
assert.ok(!/sandata|clock-in|evv/i.test(askJs), 'look-ups do not claim EVV');

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
    console.log('admin-remiask1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMIASK_SHOTS || '/opt/cursor/artifacts';
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
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remiask1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('timesheets');
      payReadyGen = (payReadyGen || 0) + 1;
      payReadyLoad = function(){return Promise.resolve(payReadyState);};
      allRecords = [
        {id:'ts1', empName:'Ada Cole', username:'ada', clientName:'Ruth Coleman', weekStart:'2026-09-21', totalHrs:'32:00', status:'submitted', is_active:true, isActive:true, notes:'', correctionNote:'', correctionDays:[], days:{0:{tin:'09:00', tout:'17:00', hrs:'8:00'}}},
        {id:'ts2', empName:'Bea Lin', username:'bea', clientName:'Owen Park', weekStart:'2026-09-21', totalHrs:'20:00', status:'submitted', is_active:true, isActive:true, notes:'', correctionNote:'Please fix Tuesday', correctionDays:['tue'], days:{}}
      ];
      loadedAidesList = [
        {username:'ada', name:'Ada Cole', isActive:true, phone:'2165550100', assignedClients:['Ruth Coleman']},
        {username:'bea', name:'Bea Lin', isActive:true, assignedClients:['Owen Park']},
        {username:'cam', name:'Cam Brooks', isActive:true, assignedClients:[]}
      ];
      allClients = [{id:'c1', name:'Ruth Coleman', address:'100 Public Square', phone:'5555550199', assignedAides:['ada']}];
      isComplianceRows = [
        {empName:'Ada Cole', username:'ada', topicShort:'Infection control', isCompleted:false},
        {empName:'Bea Lin', username:'bea', topicShort:'Handwashing', isCompleted:true}
      ];
      payReadyState = {week_start:'2026-09-21', rows:[
        {name:'Ada Cole', status:'ready', reason:'', reasonLabel:'', checks:{}},
        {name:'Dana Ruiz', status:'held', reason:'missing_signature', reasonLabel:'missing signature', checks:{signature:'missing', submitted:'yes'}}
      ]};
      aideCredState = {aides:[
        {id:'a1', name:'Ada Cole', username:'ada', expired_count:0, expiring_soon_count:0, cpr_status:'ok', bare:false},
        {id:'c1', name:'Cam Brooks', username:'cam', expired_count:1, expiring_soon_count:0, cpr_status:'', bare:false}
      ]};
      coverShifts = [{id:'sh1', status:'open', clientName:'Ruth Coleman', aideName:'Ada Cole', startsAt:'2026-09-25T14:00:00Z', endsAt:'2026-09-25T18:00:00Z', phone:'5555550100', caseManagerEmail:'pat@example.com'}];
      allBackupRecords = [{id:'b1', empName:'Ada Cole', clientName:'Ruth Coleman', weekStart:'2026-09-14', status:'draft', notes:''}];
      nciCompletedRows = [{clientName:'Ruth Coleman', completedAt:'2026-09-20', status:'Complete'}];
      nurseComplianceRows = [{clientName:'Ruth Coleman', status:'Needs visits', visits:1, countingCalls:4}];
      schedWeekRows = [{id:'c1', name:'Ruth Coleman'}];
      schedUsual = [{client_id:'c1', weekday:1, usual_aide_id:'', hours:8}];
      schedExceptions = [];
      schedWeekStart = '2026-09-21';
      var broadcast = document.getElementById('broadcastPreview');
      if(broadcast)broadcast.textContent = 'Current active alert: Check the Friday schedule.';
      copilotAlerts = [{id:'lf1', kind:'login_fail', ace:true, title:'Login fails', detail:'ada failed sign-in at 8:10. password secret'}];
    });
    await page.waitForSelector('#copilotFab .remi-chip-face', {visible:true});
    const chip = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      var r = fab.getBoundingClientRect();
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: REMI_ASK_MARKER,
        sheetHidden: document.getElementById('copilotSheet').hidden,
        label: fab.getAttribute('aria-label'),
        onScreen: r.left >= 0 && r.right <= window.innerWidth + 1 && r.bottom <= window.innerHeight + 1
      };
    });
    assert.strictEqual(chip.build, '2026-09-26-clienthrs1a');
    assert.strictEqual(chip.marker, 'v=remiask1');
    assert.strictEqual(chip.sheetHidden, true);
    assert.strictEqual(chip.label, 'Remi');
    assert.strictEqual(chip.onScreen, true);

    const planned = await page.evaluate(function(){
      function grab(q){
        var ans = copilotChatAnswer(q);
        return {text:ans.text||'', sec:!!ans.sec, actions:(ans.actions||[]).map(function(a){return a.kind;}), kind:ans.kind||''};
      }
      var broadcast = document.getElementById('broadcastPreview');
      if(broadcast)broadcast.textContent = 'Current active alert: Check the Friday schedule.';
      var saved = coverShifts.slice();
      coverShifts = [
        {id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', status:'open', clientName:'Amy Cole', aideName:'Ada'},
        {id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', status:'open', clientName:'Bev Cole', aideName:'Bea'}
      ];
      var many = grab('who can cover');
      coverShifts = saved;
      return {
        submitted: grab('are all timesheets submitted this week?'),
        typo: grab('are all timsheets submited this week'),
        soft: grab('all timehstee turned in'),
        missing: grab('missing signature?'),
        correction: grab('who is in correction?'),
        status: grab('timesheet status for Ada Cole'),
        inservice: grab('are all inservices finished?'),
        left: grab("what's left for Ada"),
        ready: grab("who's Ready?"),
        held: grab("who's Held and why?"),
        cred: grab('is Ada credential-current?'),
        credNo: grab('is Cam credential current'),
        open: grab("what's open?"),
        shift: grab('status on the open shift'),
        active: grab('is Ada active?'),
        phone: grab('phone for Ada'),
        address: grab('address for Ruth Coleman'),
        assigned: grab('who is assigned to Ruth Coleman'),
        schedule: grab('schedule status'),
        backup: grab('backup status'),
        completes: grab('completes status'),
        compliance: grab('compliance status'),
        broadcast: grab('broadcast status'),
        login: grab('login status'),
        password: grab("what's Ada's password"),
        ranked: grab("who's ranked to cover Ruth"),
        oldSheet: grab('timesheet for Ada Cole'),
        oldOpen: grab('who has an open shift'),
        oldShift: grab('open shift for Ruth'),
        hello: grab('hello remi'),
        friday: grab('can you build a new screen'),
        many: many
      };
    });

    function look(pack, label){
      assert.strictEqual(pack.actions.length, 0, label+' has no actions');
      assert.ok(!/I can look up Timesheets/i.test(pack.text), label+' does not bounce to the topic menu: '+pack.text);
      assert.ok(!/\bConfirm\b/.test(pack.text), label+' does not ask to confirm: '+pack.text);
    }
    look(planned.submitted, 'submitted');
    assert.ok(/^NO\./.test(planned.submitted.text) && /Cam Brooks/.test(planned.submitted.text) && /Ada Cole/.test(planned.submitted.text), planned.submitted.text);
    look(planned.typo, 'typo');
    assert.strictEqual(planned.typo.text, planned.submitted.text);
    look(planned.soft, 'timehstee');
    assert.strictEqual(planned.soft.text, planned.submitted.text, planned.soft.text);
    look(planned.missing, 'signature');
    assert.ok(/^NO\./.test(planned.missing.text) && /Ada Cole/.test(planned.missing.text), planned.missing.text);
    look(planned.correction, 'correction');
    assert.ok(/^NO\./.test(planned.correction.text) && /Bea Lin/.test(planned.correction.text), planned.correction.text);
    look(planned.status, 'status');
    assert.ok(/Ada Cole/.test(planned.status.text) && /missing signature/.test(planned.status.text), planned.status.text);
    look(planned.inservice, 'inservice');
    assert.ok(/^NO\./.test(planned.inservice.text) && /Ada Cole/.test(planned.inservice.text) && /Infection control/.test(planned.inservice.text), planned.inservice.text);
    look(planned.left, 'left');
    assert.ok(/Ada Cole/.test(planned.left.text) && /Infection control/.test(planned.left.text), planned.left.text);
    look(planned.ready, 'ready');
    assert.ok(/^YES\./.test(planned.ready.text) && /Ada Cole/.test(planned.ready.text), planned.ready.text);
    look(planned.held, 'held');
    assert.ok(/^NO\./.test(planned.held.text) && /Dana Ruiz/.test(planned.held.text) && /missing signature/.test(planned.held.text), planned.held.text);
    look(planned.cred, 'cred');
    assert.ok(/^YES\./.test(planned.cred.text) && /credential-current/.test(planned.cred.text), planned.cred.text);
    look(planned.credNo, 'credNo');
    assert.ok(/^NO\./.test(planned.credNo.text) && /overdue/.test(planned.credNo.text), planned.credNo.text);
    look(planned.open, 'open');
    assert.ok(/Ruth Coleman/.test(planned.open.text) && /Ada Cole/.test(planned.open.text), planned.open.text);
    look(planned.shift, 'shift');
    assert.ok(/Ruth Coleman/.test(planned.shift.text), planned.shift.text);
    look(planned.active, 'active');
    assert.ok(/^YES\./.test(planned.active.text) && /Ada Cole/.test(planned.active.text), planned.active.text);
    look(planned.phone, 'phone');
    assert.ok(/2165550100/.test(planned.phone.text) && !/5555550100/.test(planned.phone.text), planned.phone.text);
    look(planned.address, 'address');
    assert.ok(/100 Public Square/.test(planned.address.text), planned.address.text);
    look(planned.assigned, 'assigned');
    assert.ok(/Ada Cole/.test(planned.assigned.text), planned.assigned.text);
    look(planned.schedule, 'schedule');
    assert.ok(/^NO\./.test(planned.schedule.text), planned.schedule.text);
    look(planned.backup, 'backup');
    assert.ok(/Ada Cole/.test(planned.backup.text), planned.backup.text);
    look(planned.completes, 'completes');
    assert.ok(/Ruth Coleman/.test(planned.completes.text), planned.completes.text);
    look(planned.compliance, 'compliance');
    assert.ok(/Needs visits/.test(planned.compliance.text), planned.compliance.text);
    look(planned.broadcast, 'broadcast');
    assert.ok(/Check the Friday schedule/.test(planned.broadcast.text), planned.broadcast.text);
    look(planned.login, 'login');
    assert.ok(/ada failed sign-in/.test(planned.login.text) && /will not guess a password/.test(planned.login.text) && !/secret/.test(planned.login.text), planned.login.text);
    look(planned.password, 'password');
    assert.ok(/don.?t see passwords/.test(planned.password.text) && /will not guess/.test(planned.password.text), planned.password.text);
    look(planned.ranked, 'ranked');
    assert.ok(/don.?t see a who-can-cover list/.test(planned.ranked.text), planned.ranked.text);

    assert.strictEqual(planned.oldSheet.kind, 'timesheet_late');
    assert.ok(planned.oldSheet.actions.indexOf('copy') >= 0, 'timesheet for Ada still drafts');
    assert.ok(/Drafts only/.test(planned.oldSheet.text), planned.oldSheet.text);
    assert.strictEqual(planned.oldOpen.sec, false, 'who has an open shift stays the desk answer');
    assert.ok(planned.oldOpen.actions.indexOf('sms') >= 0, 'open-shift desk answer still has a text draft');
    assert.ok(planned.oldShift.actions.indexOf('sms') >= 0, 'open shift for Ruth still drafts');
    assert.ok(/I can look up Timesheets/.test(planned.hello.text), 'unclear hello still offers the desks');
    assert.ok(/Tell Friday/.test(planned.friday.text), planned.friday.text);
    assert.ok(/Name the client/.test(planned.many.text), planned.many.text);

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotTabAsk', {visible:true});
    await page.click('#copilotTabAsk');
    await page.waitForSelector('#copilotChatInput', {visible:true});

    async function ask(q){
      await page.evaluate(function(){ copilotChat = []; copilotPaintChat(); });
      await page.evaluate(function(q){ document.getElementById('copilotChatInput').value = q; }, q);
      await page.click('#copilotChatSend');
      await page.waitForFunction(function(q){
        var thread = document.getElementById('copilotThread');
        return thread && thread.innerText.indexOf(q) >= 0 && thread.innerText.length > q.length + 8;
      }, {}, q);
    }
    await ask('are all timesheets submitted this week?');
    const tsShot = await page.evaluate(function(){
      var thread = document.getElementById('copilotThread');
      var buttons = thread.querySelectorAll('.copilot-actions .btn');
      var confirm = document.getElementById('copilotConfirm');
      return {text: thread.innerText, buttons: buttons.length, confirmHidden: !confirm || confirm.hidden};
    });
    assert.ok(/NO\./.test(tsShot.text) && /Cam Brooks/.test(tsShot.text) && /Ada Cole/.test(tsShot.text), tsShot.text);
    assert.strictEqual(tsShot.buttons, 0, 'submitted look-up has no buttons');
    assert.strictEqual(tsShot.confirmHidden, true, 'submitted look-up does not open Confirm');
    await page.screenshot({path: path.join(shotDir, 'remiask1-timesheets-submitted.png')});

    await ask('are all inservices finished?');
    const isShot = await page.evaluate(function(){
      return document.getElementById('copilotThread').innerText;
    });
    assert.ok(/NO\./.test(isShot) && /Ada Cole/.test(isShot) && /Infection control/.test(isShot), isShot);
    assert.ok(!/I can look up Timesheets/.test(isShot), isShot);
    await page.screenshot({path: path.join(shotDir, 'remiask1-inservices-finished.png')});

    await ask("who's Ready and who's Held?");
    const payShot = await page.evaluate(function(){
      return document.getElementById('copilotThread').innerText;
    });
    assert.ok(/Ready: Ada Cole/.test(payShot) && /Dana Ruiz/.test(payShot) && /missing signature/.test(payShot), payShot);
    assert.ok(!/I can look up Timesheets/.test(payShot), payShot);
    await page.screenshot({path: path.join(shotDir, 'remiask1-pay-ready-held.png')});

    await ask('are all timsheets submited this week');
    const typoShot = await page.evaluate(function(){
      var thread = document.getElementById('copilotThread');
      return {text: thread.innerText, buttons: thread.querySelectorAll('.copilot-actions .btn').length};
    });
    assert.ok(/NO\./.test(typoShot.text) && /Cam Brooks/.test(typoShot.text), typoShot.text);
    assert.ok(!/I can look up Timesheets/.test(typoShot.text), 'typo does not bounce to the topic menu');
    assert.strictEqual(typoShot.buttons, 0);
    await page.screenshot({path: path.join(shotDir, 'remiask1-typo.png')});

    await ask('open shift for Ruth');
    await page.waitForFunction(function(){
      var buttons = document.querySelectorAll('#copilotThread .copilot-actions .btn');
      return Array.prototype.some.call(buttons, function(b){return b.textContent === 'Open Messages';});
    });
    await page.evaluate(function(){
      var buttons = Array.prototype.slice.call(document.querySelectorAll('#copilotThread .copilot-actions .btn'));
      var btn = buttons.filter(function(b){return b.textContent === 'Open Messages';}).pop();
      btn.scrollIntoView({block:'center'});
      btn.click();
    });
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    const confirm = await page.evaluate(function(){
      var box = document.getElementById('copilotConfirm');
      return {text: box.innerText, href: location.href, hidden: box.hidden};
    });
    assert.strictEqual(confirm.hidden, false);
    assert.ok(/Confirm/.test(confirm.text) && /Not yet/.test(confirm.text), confirm.text);
    assert.ok(!/^sms:/.test(confirm.href), 'Confirm is still required before a text draft');
    await page.screenshot({path: path.join(shotDir, 'remiask1-confirm-draft.png')});

    await page.evaluate(function(){
      copilotClose();
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      showScreen('nurseScreen');
    });
    const nurse = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      var r = fab ? fab.getBoundingClientRect() : {width:0, height:0};
      return {w: r.width, h: r.height, nurse: document.getElementById('nurseScreen').classList.contains('active')};
    });
    assert.strictEqual(nurse.nurse, true);
    assert.ok(nurse.w === 0 || nurse.h === 0, 'Nurse does not get Remi');
  } finally {
    await browser.close();
    await new Promise(function(resolve){server.close(resolve);});
  }
}

runBrowser().then(function(){
  console.log('admin-remiask1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
