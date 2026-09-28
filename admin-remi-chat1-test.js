#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-chat1'), 'remi-chat1 marker');
assert.ok(html.includes('data-remi-chat1="v=remi-chat1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-chat1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-chat1">'), 'meta');
assert.ok(html.includes('<!-- remi just chat 2026-09-27 v=remi-chat1 admin-build 2026-09-27-remi-chat1'), 'comment');
assert.ok(html.includes("var REMI_CHAT1_MARKER='v=remi-chat1'"), 'script marker');
assert.ok(html.includes('GHOST-REMI-CHAT1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. UI-only. No SQL patch. No new Ace RPC.'), 'callable ui-only');
assert.ok(html.includes('MERGE HOLD. Do not claim LIVE. Do not squash-merge.'), 'merge hold');
assert.ok(html.includes('placeholder="Ask or just chat..."'), 'placeholder invites chat');
assert.ok(html.includes('function remiChat1IsSmallTalk'), 'small-talk detector');
assert.ok(html.includes('function remiChat1Talk'), 'conversational reply');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-chat1-v1.sql')), 'no SQL patch');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-list-az1'), 'first admin-build is list-az1');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-hold-autosave1"'), 'hold-autosave1 stays after list-az1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-hold-client1"') < html.indexOf('content="2026-09-27-aides-info1"'), 'aides-info1 stays after hold-client1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-remi-langs1"'), 'remi-langs1 stays after aide-office-vis1');
assert.ok(html.indexOf('content="2026-09-27-remi-langs1"') < html.indexOf('content="2026-09-27-hold-clear1"'), 'hold-clear1 stays after remi-langs1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
['v=hold-client1','v=aides-info1','v=login-toast1','v=hold-clear1','v=sched-time-tap1','v=remichat1','v=eca-copilot1','v=remi-float-hide1','v=remisec1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
['2026-09-27-hold-clear1','2026-09-27-sched-time-tap1','2026-09-27-remi-float-hide1','2026-09-25-remichat1','2026-09-25-eca-copilot1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="' + meta + '">'), 'prior meta stays ' + meta);
});
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
const note = html.slice(html.indexOf('<!-- remi just chat 2026-09-27'), html.indexOf('<meta name="admin-build" content="2026-09-27-remi-chat1">'));
assert.ok(!/reset_aide_temp_password|admin_set_role_password/.test(note), 'note does not reseal Auth');
assert.ok(/No mossier/.test(note), 'note keeps Auth off mossier');
assert.ok(!/\bQuo\b/.test(note) || /No Quo\/SMS/.test(note), 'note does not add Quo');
const chatJs = html.slice(html.indexOf('// v=remi-chat1 just-chat'), html.indexOf('function copilotChatHtml'));
assert.ok(chatJs.includes('REMI_CHAT1_INVENTORY'), 'inventory string stays for help');
assert.ok(chatJs.includes('What do you want to look up?'), 'unmatched chat does not dump the inventory');
assert.ok(!/sbRestRpc|fetch\(|openai|mossier|reset_aide_temp_password/.test(chatJs), 'chat detector adds no RPC and no Auth');
assert.ok(html.includes('copilotInQuietHours'), 'quiet hours stay');
assert.ok(html.includes('function copilotChatAnswer'), 'desk answer stays');

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

const INVENTORY = /Timesheets|Inservices|Coverage, Schedule|Name a desk or a person/i;

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-chat1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_CHAT1_SHOTS || '/opt/cursor/artifacts';
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
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-chat1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('timesheets');
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
    });
    await page.waitForSelector('#copilotFab .remi-chip-face', {visible:true});
    const boot = await page.evaluate(function(){
      return {
        build: document.querySelector('meta[name="admin-build"]').content,
        marker: REMI_CHAT1_MARKER,
        sheetHidden: document.getElementById('copilotSheet').hidden,
        placeholder: document.getElementById('copilotChatInput').getAttribute('placeholder'),
        fullPage: !!document.getElementById('tab_remi')
      };
    });
    assert.strictEqual(boot.build, '2026-09-27-list-az1');
    assert.strictEqual(boot.marker, 'v=remi-chat1');
    assert.strictEqual(boot.sheetHidden, true, 'sheet stays closed until opened');
    assert.strictEqual(boot.placeholder, 'Ask or just chat...');
    assert.strictEqual(boot.fullPage, false);

    const planned = await page.evaluate(function(){
      function grab(q){
        var ans = copilotChatAnswer(q);
        return {kind:ans.kind||'', text:ans.text||'', actions:(ans.actions||[]).map(function(a){return a.kind;})};
      }
      return {
        just: grab('just chat'),
        chatting: grab('just chatting'),
        wanna: grab('wanna chat'),
        hello: grab('hello'),
        help: grab('what can you do?'),
        look: grab('what do you look up?'),
        nonsense: grab('asdf qwerty'),
        mixed: grab('just chat about timesheets'),
        sheet: grab('timesheet for Ada Cole'),
        cover: grab('who has an open shift')
      };
    });
    function chatOnly(pack, label){
      assert.strictEqual(pack.kind, '', label+' kind');
      assert.strictEqual(pack.actions.length, 0, label+' actions');
      assert.ok(!INVENTORY.test(pack.text), label+' inventory: '+pack.text);
      assert.ok(/just chat|right here|Happy to/i.test(pack.text), label+' warm: '+pack.text);
    }
    chatOnly(planned.just, 'just chat');
    chatOnly(planned.chatting, 'just chatting');
    chatOnly(planned.wanna, 'wanna chat');
    assert.strictEqual(planned.hello.kind, '');
    assert.strictEqual(planned.hello.actions.length, 0);
    assert.ok(!INVENTORY.test(planned.hello.text), planned.hello.text);
    assert.ok(/Hey Mo/.test(planned.hello.text), planned.hello.text);
    assert.ok(/I can look up Timesheets/.test(planned.help.text) && /login issues/.test(planned.help.text), planned.help.text);
    assert.strictEqual(planned.help.actions.length, 0);
    assert.ok(/I can look up Timesheets/.test(planned.look.text), planned.look.text);
    assert.strictEqual(planned.nonsense.text, 'What do you want to look up?');
    assert.ok(!INVENTORY.test(planned.nonsense.text), planned.nonsense.text);
    assert.strictEqual(planned.mixed.kind, 'timesheet_late', 'chat plus a desk topic stays a work ask');
    assert.ok(/timesheet/i.test(planned.mixed.text), planned.mixed.text);
    assert.ok(!/Happy to just chat/.test(planned.mixed.text), planned.mixed.text);
    assert.strictEqual(planned.sheet.kind, 'timesheet_late');
    assert.ok(/Ada Cole/.test(planned.sheet.text) && /32:00/.test(planned.sheet.text), planned.sheet.text);
    assert.ok(planned.sheet.actions.indexOf('copy') >= 0, 'timesheet draft stays');
    assert.strictEqual(planned.cover.kind, 'coverage_open');
    assert.ok(planned.cover.actions.indexOf('sms') >= 0, 'coverage draft stays');

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotTabAsk', {visible:true});
    await page.click('#copilotTabAsk');
    await page.waitForSelector('#copilotChatInput', {visible:true});
    await page.evaluate(function(){ copilotChat = []; copilotPaintChat(); });
    await page.evaluate(function(){ document.getElementById('copilotChatInput').value = 'just chat'; });
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      var thread = document.getElementById('copilotThread');
      return thread && /just chat/i.test(thread.innerText) && /Happy to just chat/.test(thread.innerText);
    });
    const justUi = await page.evaluate(function(){
      var thread = document.getElementById('copilotThread');
      var sheet = document.getElementById('copilotSheet');
      var bubbles = thread.querySelectorAll('.copilot-bubble-remi');
      var last = bubbles[bubbles.length-1];
      var buttons = last ? last.querySelectorAll('.copilot-actions .btn') : [];
      return {
        text: last ? last.innerText : '',
        buttons: buttons.length,
        hidden: sheet.hidden,
        width: window.innerWidth,
        rail: sheet.className
      };
    });
    assert.ok(/Happy to just chat, Mo/.test(justUi.text), justUi.text);
    assert.ok(!INVENTORY.test(justUi.text), justUi.text);
    assert.strictEqual(justUi.buttons, 0);
    assert.strictEqual(justUi.hidden, false);
    assert.strictEqual(justUi.width, 390);
    await page.screenshot({path: path.join(shotDir, 'remi-chat1-just-chat.png')});

    await page.evaluate(function(){ copilotChat = []; copilotPaintChat(); });
    await page.evaluate(function(){ document.getElementById('copilotChatInput').value = 'just chatting'; });
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      var bubbles = document.querySelectorAll('#copilotThread .copilot-bubble-remi');
      var last = bubbles[bubbles.length-1];
      return last && /Happy to just chat/.test(last.innerText) && !/Timesheets/.test(last.innerText);
    });

    await page.evaluate(function(){ copilotChat = []; copilotPaintChat(); });
    await page.evaluate(function(){ document.getElementById('copilotChatInput').value = 'timesheet for Ada Cole'; });
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      var thread = document.getElementById('copilotThread');
      return thread && /Ada Cole/.test(thread.innerText) && /32:00/.test(thread.innerText) && /Drafts only/.test(thread.innerText);
    });
    const deskUi = await page.evaluate(function(){
      var thread = document.getElementById('copilotThread');
      var bubbles = thread.querySelectorAll('.copilot-bubble-remi');
      var last = bubbles[bubbles.length-1];
      var labels = Array.prototype.map.call(last.querySelectorAll('.copilot-actions .btn'), function(b){return b.textContent;});
      return {text: last.innerText, labels: labels};
    });
    assert.ok(/Ada Cole/.test(deskUi.text) && /Ruth Coleman/.test(deskUi.text) && /32:00/.test(deskUi.text), deskUi.text);
    assert.ok(deskUi.labels.some(function(label){return /Copy/.test(label);}), deskUi.labels.join(','));
    await page.screenshot({path: path.join(shotDir, 'remi-chat1-desk-ask.png')});

    await page.evaluate(function(){
      copilotClose();
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      showScreen('nurseScreen');
    });
    const nurse = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      return {
        fabVisible: !!(fab && fab.getClientRects().length && getComputedStyle(fab).display !== 'none' && !fab.hidden),
        sheetHidden: document.getElementById('copilotSheet').hidden,
        roleOk: copilotRoleOk(),
        nurseAns: copilotChatAnswer('just chat')
      };
    });
    assert.strictEqual(nurse.fabVisible, false, 'Nurse has no Remi chip');
    assert.strictEqual(nurse.sheetHidden, true);
    assert.strictEqual(nurse.roleOk, false);
    assert.ok(/Timesheets/.test(nurse.nurseAns.text), 'Nurse does not get the chat reply');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remi-chat1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
