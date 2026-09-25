#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remichat1'), 'remichat1 marker');
assert.ok(html.includes('admin-build 2026-09-25-remichat1'), 'remichat1 admin-build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remichat1">'), 'remichat1 meta');
assert.ok(html.includes('<!-- remi ask 2026-09-25 v=remichat1 admin-build 2026-09-25-remichat1'), 'remichat1 comment');
assert.ok(html.includes('data-remichat="v=remichat1"'), 'remichat1 string marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-ncipdf1'), 'ncipdf1 is the current admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-ncipdf1"') < html.indexOf('content="2026-09-25-remichat1"'), 'remichat1 meta stays after ncipdf1');
['v=remiscroll1','v=remi1','v=phonezoom1','v=eca-copilot1','v=navedit1','v=coveraide1b','v=layoutA1','v=admintheme1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remiscroll1">'), 'remiscroll1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remi1">'), 'remi1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-phonezoom1">'), 'phonezoom1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-eca-copilot1">'), 'eca-copilot1 meta stays');
assert.ok(html.includes('Co-pilot stays closed until Mo opens it'), 'phonezoom1 closed-until-open note stays');

const note = html.slice(html.indexOf('v=remichat1'), html.indexOf('<!-- phone scroll lock 2026-09-25 v=remiscroll1'));
assert.ok(/Admin and Scheduler/.test(note), 'note keeps the role gate');
assert.ok(/Save as my template still posts admin_log_copilot_choice/.test(note), 'note reuses the template log');
assert.ok(!/reset_aide_temp_password|auth\.updateUser|rotate password|admin_create_aide/i.test(note), 'remichat1 note does not reseal Auth');

const nurseAt = html.indexOf('id="nurseScreen"');
const fabAt = html.indexOf('id="copilotFab"');
assert.ok(fabAt > 0 && fabAt < nurseAt, 'Remi chip sits in the Admin screen');
assert.strictEqual(html.indexOf('id="copilotFab"', nurseAt), -1, 'Nurse screen has no Remi chip');
assert.ok(html.includes('data-layout-roles="Admin Scheduler"') && html.includes('id="copilotFab"'), 'Remi is Admin and Scheduler');
assert.ok(html.includes('id="copilotTabAsk"') && html.includes('id="copilotComposer"') && html.includes('id="copilotChatInput"'), 'Ask thread is in the sheet');
assert.ok(html.includes('function copilotChatAnswer') && html.includes('function copilotSaveDirections'), 'Ask reuses Save as my template');
assert.ok(html.includes("p_choice:'save_directions'") || html.includes('p_choice:\'save_directions\''), 'template choice stays save_directions');

const invented = [
  'admin_ask_copilot',
  'admin_list_copilot_radar',
  'admin_list_login_fails',
  'admin_get_copilot_quiet_hours',
  'admin_save_copilot_quiet_hours'
];
invented.forEach(function(name){
  assert.ok(!html.includes(name), 'no new RPC name ' + name);
});
const chatJs = html.slice(html.indexOf('// v=remichat1 Ask thread'), html.indexOf('// Live Ace office RPCs'));
assert.ok(!/sbRestRpc|fetch\(|openai|anthropic|generativelanguage|api\.grok/i.test(chatJs), 'Ask does not call a model or a new RPC');
assert.ok(!/reset_aide_temp_password|auth\.updateUser|admin_create_aide/.test(chatJs), 'Ask does not reseal Auth');
assert.ok(chatJs.includes('copilotSaveDirections') && chatJs.includes('copilotChooseAction') && chatJs.includes('copilotInQuietHours'), 'Ask reuses confirm, templates, and quiet hours');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

async function drag(page, x1, y1, x2, y2){
  const session = await page.target().createCDPSession();
  await session.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:x1, y:y1}]});
  const steps = 8;
  for(let i = 1; i <= steps; i++){
    await session.send('Input.dispatchTouchEvent', {type:'touchMove', touchPoints:[{x:x1 + (x2 - x1) * i / steps, y:y1 + (y2 - y1) * i / steps}]});
  }
  await session.send('Input.dispatchTouchEvent', {type:'touchEnd', touchPoints:[]});
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remichat1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMICHAT_SHOTS || '/opt/cursor/artifacts';
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
    await page.goto('http://127.0.0.1:'+port+'/index.html', {waitUntil:'domcontentloaded', timeout:20000});
    const boot = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var fab = document.getElementById('copilotFab');
      return {
        sheetHidden: !!(sheet && sheet.hidden),
        adminActive: document.getElementById('adminScreen').classList.contains('active'),
        fabVisible: !!(fab && fab.getClientRects().length),
        scrollX: window.scrollX
      };
    });
    assert.strictEqual(boot.sheetHidden, true, 'Remi sheet stays closed on login');
    assert.strictEqual(boot.adminActive, false, 'login is desk-first, not a Remi screen');
    assert.strictEqual(boot.fabVisible, false, 'Remi chip stays off the login screen');
    assert.strictEqual(boot.scrollX, 0, 'login is not shifted sideways');

    await page.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('timesheets');
    });
    await page.waitForSelector('#copilotFab .remi-chip-face', {visible:true});
    const desk = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var fab = document.getElementById('copilotFab');
      var r = fab.getBoundingClientRect();
      return {
        sheetHidden: sheet.hidden,
        label: fab.getAttribute('aria-label'),
        pill: fab.querySelector('.remi-chip-pill').textContent,
        onScreen: r.left >= 0 && r.right <= window.innerWidth + 1 && r.width > 40,
        scrollX: window.scrollX
      };
    });
    assert.strictEqual(desk.sheetHidden, true, 'desk does not auto-open Remi');
    assert.strictEqual(desk.label, 'Remi');
    assert.strictEqual(desk.pill, 'Remi');
    assert.strictEqual(desk.scrollX, 0);
    assert.ok(desk.onScreen, 'chip is on the phone');
    await page.screenshot({path: path.join(shotDir, 'remichat1-desk-chip.png')});

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotTabAsk', {visible:true});
    await page.click('#copilotTabAsk');
    await page.waitForSelector('#copilotChatInput', {visible:true});
    const lookups = await page.evaluate(function(){
      allRecords = [{
        id:'ts1', empName:'Ada Cole', clientName:'Ruth Coleman', weekStart:'2026-09-21',
        totalHrs:'32:00', status:'submitted', is_active:true, isActive:true, notes:'',
        correctionNote:'', correctionDays:[]
      }];
      coverShifts = [{
        id:'sh1', status:'open', clientName:'Ruth Coleman', aideName:'Ada Cole',
        startsAt:'2026-09-25T14:00:00Z', endsAt:'2026-09-25T18:00:00Z',
        phone:'5555550100', caseManagerEmail:'pat@example.com'
      }];
      loadedAidesList = [{username:'ada', name:'Ada Cole', mustChangePassword:true, assignedClients:['Ruth Coleman']}];
      allBackupRecords = [{id:'b1', empName:'Ada Cole', clientName:'Ruth Coleman', weekStart:'2026-09-14', status:'draft', notes:''}];
      nciCompletedRows = [{clientName:'Ruth Coleman', completedAt:'2026-09-20', pdfLink:'https://example.test/ruth.pdf', status:'Complete'}];
      nurseComplianceRows = [{clientName:'Ruth Coleman', status:'Needs visits', visits:1, countingCalls:4}];
      isComplianceRows = [{empName:'Ada Cole', username:'ada', topicShort:'Infection control', isCompleted:false}];
      schedWeekRows = [{id:'c1', name:'Ruth Coleman'}];
      schedUsual = [{client_id:'c1', weekday:1, usual_aide_id:'a1', hours:8}];
      schedExceptions = [];
      schedWeekStart = '2026-09-21';
      schedAideNames = {a1:'Ada Cole'};
      var broadcast = document.getElementById('broadcastPreview');
      if(broadcast)broadcast.textContent = 'Current active alert: Check the Friday schedule.';
      copilotAlerts = [{id:'lf1', kind:'login_fail', ace:true, title:'Login fails', detail:'ada failed sign-in at 8:10.'}];
      function grab(q){
        var ans = copilotChatAnswer(q);
        return {kind:ans.kind, text:ans.text, actions:(ans.actions||[]).map(function(a){return a.kind;})};
      }
      return {
        timesheet: grab('timesheet for Ada Cole'),
        coverage: grab('who has an open shift'),
        schedule: grab('schedule for Ruth'),
        aide: grab('who is still on a temporary password'),
        backup: grab('phone-change drafts'),
        inservice: grab('which inservice is not completed'),
        completes: grab('completed intakes'),
        compliance: grab('who is behind on compliance'),
        broadcast: grab('what is the broadcast alert'),
        login: grab('any login fails'),
        help: grab('hello remi')
      };
    });
    assert.strictEqual(lookups.timesheet.kind, 'timesheet_late');
    assert.ok(lookups.timesheet.text.includes('Ada Cole') && lookups.timesheet.text.includes('Ruth Coleman') && lookups.timesheet.text.includes('32:00'), lookups.timesheet.text);
    assert.ok(lookups.timesheet.actions.indexOf('copy') >= 0, 'timesheet draft copy stays');
    assert.strictEqual(lookups.coverage.kind, 'coverage_open');
    assert.ok(lookups.coverage.text.includes('Ruth Coleman'), lookups.coverage.text);
    assert.ok(lookups.coverage.actions.indexOf('sms') >= 0 && lookups.coverage.actions.indexOf('mail') >= 0, 'coverage drafts stay');
    assert.strictEqual(lookups.schedule.kind, 'schedule_gap');
    assert.ok(/Ruth Coleman/.test(lookups.schedule.text), lookups.schedule.text);
    assert.strictEqual(lookups.aide.kind, 'aide_issue');
    assert.ok(/temporary password/i.test(lookups.aide.text) && /does not change a password/i.test(lookups.aide.text), lookups.aide.text);
    assert.strictEqual(lookups.backup.kind, 'backup_needed');
    assert.ok(/No Approve, Decline, or PTO/.test(lookups.backup.text), lookups.backup.text);
    assert.strictEqual(lookups.inservice.kind, 'inservice_due');
    assert.ok(/not completed/i.test(lookups.inservice.text) && /Ada Cole/.test(lookups.inservice.text), lookups.inservice.text);
    assert.strictEqual(lookups.completes.kind, 'intake_pending');
    assert.ok(/Ruth Coleman/.test(lookups.completes.text) && /PDF on file/.test(lookups.completes.text), lookups.completes.text);
    assert.strictEqual(lookups.compliance.kind, 'compliance_flag');
    assert.ok(/Needs visits/.test(lookups.compliance.text), lookups.compliance.text);
    assert.strictEqual(lookups.broadcast.kind, 'broadcast_needed');
    assert.ok(/Check the Friday schedule/.test(lookups.broadcast.text) && /will not send/i.test(lookups.broadcast.text), lookups.broadcast.text);
    assert.strictEqual(lookups.login.kind, 'login_fail');
    assert.ok(/ada failed sign-in/.test(lookups.login.text) && /does not change a password/i.test(lookups.login.text), lookups.login.text);
    assert.strictEqual(lookups.help.kind, '');
    assert.ok(/Timesheets/.test(lookups.help.text) && /login issues/.test(lookups.help.text), lookups.help.text);

    await page.type('#copilotChatInput', 'timesheet for Ada Cole');
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      var thread = document.getElementById('copilotThread');
      return thread && /Ada Cole/.test(thread.innerText) && /32:00/.test(thread.innerText);
    });
    const ask = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var body = document.getElementById('copilotBody');
      var input = document.getElementById('copilotChatInput');
      var send = document.getElementById('copilotChatSend');
      var sr = sheet.getBoundingClientRect();
      var ir = input.getBoundingClientRect();
      var br = send.getBoundingClientRect();
      var mo = document.querySelector('.copilot-bubble-mo');
      var remi = document.querySelectorAll('.copilot-bubble-remi');
      var last = remi[remi.length - 1];
      var cs = getComputedStyle(body);
      var inputCs = getComputedStyle(input);
      return {
        sheetHidden: sheet.hidden,
        askSelected: document.getElementById('copilotTabAsk').getAttribute('aria-selected'),
        inputH: ir.height,
        sendH: br.height,
        font: inputCs.fontSize,
        inSheet: ir.left >= sr.left - 1 && ir.right <= sr.right + 1 && br.right <= sr.right + 1,
        mo: mo ? mo.innerText : '',
        answer: last ? last.innerText : '',
        overflowY: cs.overflowY,
        touch: cs.touchAction,
        scrollX: window.scrollX,
        bodyScrollLeft: body.scrollLeft,
        taller: body.scrollHeight > body.clientHeight + 20
      };
    });
    assert.strictEqual(ask.sheetHidden, false);
    assert.strictEqual(ask.askSelected, 'true');
    assert.ok(ask.inputH >= 44 && ask.sendH >= 44, 'composer is tappable ' + ask.inputH + ' ' + ask.sendH);
    assert.ok(parseFloat(ask.font) >= 16, ask.font);
    assert.strictEqual(ask.inSheet, true, 'composer stays inside the sheet');
    assert.ok(/timesheet for Ada Cole/.test(ask.mo), ask.mo);
    assert.ok(/Ada Cole/.test(ask.answer) && /32:00/.test(ask.answer) && /Drafts only/.test(ask.answer), ask.answer);
    assert.ok(ask.overflowY === 'auto' || ask.overflowY === 'scroll', ask.overflowY);
    assert.strictEqual(ask.touch, 'pan-y');
    assert.strictEqual(ask.scrollX, 0);
    assert.strictEqual(ask.bodyScrollLeft, 0);
    assert.strictEqual(ask.taller, true, 'Ask thread is taller than the sheet');
    await page.screenshot({path: path.join(shotDir, 'remichat1-ask-thread.png')});

    const scrolled = await page.evaluate(function(){
      var body = document.getElementById('copilotBody');
      var atAnswer = body.scrollTop;
      body.scrollTop = 0;
      var atTop = body.scrollTop;
      var topText = (body.innerText || '').slice(0, 40);
      body.scrollTop = body.scrollHeight;
      var atBottom = body.scrollTop;
      body.scrollTop = 0;
      return {
        atAnswer: atAnswer,
        atTop: atTop,
        atBottom: atBottom,
        topText: topText,
        scrollX: window.scrollX,
        pageLeft: document.documentElement.scrollLeft,
        bodyLeft: body.scrollLeft
      };
    });
    assert.ok(scrolled.atBottom > scrolled.atTop, 'sheet scrolls vertically');
    assert.ok(scrolled.atAnswer > scrolled.atTop, 'the exchange sits below the top of the thread');
    assert.strictEqual(scrolled.scrollX, 0, 'vertical scroll does not shift the page');
    assert.strictEqual(scrolled.pageLeft, 0);
    assert.strictEqual(scrolled.bodyLeft, 0);
    await page.screenshot({path: path.join(shotDir, 'remichat1-ask-scroll.png')});

    const bodyBox = await page.evaluate(function(){
      var r = document.getElementById('copilotBody').getBoundingClientRect();
      return {x: r.left + r.width / 2, y: r.top + 80};
    });
    await drag(page, bodyBox.x, bodyBox.y, bodyBox.x - 140, bodyBox.y);
    const shoved = await page.evaluate(function(){
      var body = document.getElementById('copilotBody');
      return {
        scrollX: window.scrollX,
        pageLeft: document.documentElement.scrollLeft,
        bodyLeft: body.scrollLeft,
        sheetLeft: document.getElementById('copilotSheet').scrollLeft
      };
    });
    assert.strictEqual(shoved.scrollX, 0, 'sideways drag does not shove the page');
    assert.strictEqual(shoved.pageLeft, 0);
    assert.strictEqual(shoved.bodyLeft, 0);
    assert.strictEqual(shoved.sheetLeft, 0);

    const confirm = await page.evaluate(function(){
      copilotQuiet.enabled = true;
      copilotQuiet.start = '00:00';
      copilotQuiet.end = '00:00';
      copilotQuiet.start_local = '00:00';
      copilotQuiet.end_local = '00:00';
      var ans = copilotChatAnswer('open shift for Ruth');
      var sms = -1;
      for(var i = 0; i < ans.actions.length; i++){
        if(ans.actions[i].kind === 'sms')sms = i;
      }
      copilotChat.push({role:'remi', kind:ans.kind, text:ans.text, actions:ans.actions});
      var idx = copilotChat.length - 1;
      copilotChatAction(idx, sms);
      var box = document.getElementById('copilotConfirm');
      return {
        quiet: /Quiet hours are on/.test(ans.text),
        shown: box && !box.hidden,
        text: box ? box.innerText : '',
        href: location.href,
        smsAt: sms
      };
    });
    assert.ok(confirm.smsAt >= 0, 'coverage offers Open Messages');
    assert.strictEqual(confirm.quiet, true, 'quiet hours reminder is in the answer');
    assert.strictEqual(confirm.shown, true, 'Confirm shows before Messages');
    assert.ok(/Confirm/.test(confirm.text) && /Quiet hours are on/.test(confirm.text), confirm.text);
    assert.ok(!/^sms:/.test(confirm.href), 'nothing was sent');

    await page.evaluate(function(){
      copilotClose();
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      showScreen('nurseScreen');
    });
    const nurse = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      var sheet = document.getElementById('copilotSheet');
      var home = document.getElementById('nurseScreen');
      return {
        fabVisible: !!(fab && fab.getClientRects().length && getComputedStyle(fab).display !== 'none' && !fab.hidden),
        sheetHidden: sheet.hidden,
        nurseActive: home.classList.contains('active'),
        mentionsRemi: /\bRemi\b/.test(home.innerText || ''),
        roleOk: copilotRoleOk()
      };
    });
    assert.strictEqual(nurse.nurseActive, true);
    assert.strictEqual(nurse.fabVisible, false, 'Nurse has no Remi chip');
    assert.strictEqual(nurse.sheetHidden, true, 'Nurse does not get the Remi sheet');
    assert.strictEqual(nurse.mentionsRemi, false);
    assert.strictEqual(nurse.roleOk, false, 'Nurse role gate blocks Ask');
    await page.screenshot({path: path.join(shotDir, 'remichat1-nurse-no-chip.png')});
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remichat1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
