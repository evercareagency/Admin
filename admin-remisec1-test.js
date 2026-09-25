#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remisec1'), 'remisec1 marker');
assert.ok(html.includes('admin-build 2026-09-25-remisec1'), 'remisec1 admin-build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remisec1">'), 'remisec1 meta');
assert.ok(html.includes('<!-- remi secretary 2026-09-25 v=remisec1 admin-build 2026-09-25-remisec1'), 'remisec1 comment');
assert.ok(html.includes('data-remisec="v=remisec1"'), 'remisec1 string marker');
assert.ok(html.includes('placeholder="Ask or just chat..."'), 'composer invites chat');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-25-remisec1'), 'remisec1 is the first admin-build meta');
[
  '2026-09-25-aidecreds1',
  '2026-09-25-remidate1',
  '2026-09-25-ncipdf1',
  '2026-09-25-remichat1',
  '2026-09-25-remiscroll1',
  '2026-09-25-remi1',
  '2026-09-25-phonezoom1',
  '2026-09-25-eca-copilot1'
].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="'+meta+'">'), 'prior meta stays '+meta);
});
assert.ok(html.indexOf('content="2026-09-25-remisec1"') < html.indexOf('content="2026-09-25-aidecreds1"'), 'aidecreds1 stays after remisec1');
['v=aidecreds1','v=remidate1','v=ncipdf1','v=remichat1','v=remiscroll1','v=remi1','v=phonezoom1','v=eca-copilot1','v=aidadel1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays '+mark);
});

const note = html.slice(html.indexOf('v=remisec1'), html.indexOf('<!-- aide credentials 2026-09-25 v=aidecreds1'));
assert.ok(/Admin and Scheduler/.test(note), 'secretary stays Admin and Scheduler');
assert.ok(/Quiet hours rules are unchanged/.test(note), 'quiet hours are not retuned');
assert.ok(/MM\/DD\/YYYY/.test(note), 'dates people read stay MM/DD/YYYY');
assert.ok(!/reset_aide_temp_password|auth\.updateUser|rotate password|admin_create_aide/i.test(note), 'remisec1 note does not reseal Auth');
assert.ok(!/admin_update_client_address|admin_ask_copilot/.test(html.slice(html.indexOf('// v=remisec1 secretary'), html.indexOf('var schedWeekStart'))), 'no invented address or ask RPC');

const secJs = html.slice(html.indexOf('// v=remisec1 secretary'), html.indexOf('var schedWeekStart'));
assert.ok(secJs.includes('function remiSecWeatherSnapshot'), 'weather swap point stays named');
assert.ok(secJs.includes("action:'update_client'") || secJs.includes("action:'update_client'"), 'address reuses the desk client update');
assert.ok(secJs.includes('sbAdminAddAide'), 'add aide uses the live add path');
assert.ok(secJs.includes('softDeleteAide'), 'soft-remove uses the live hide path');
assert.ok(!/admin_create_aide|reset_aide_temp_password|auth\.updateUser/.test(secJs), 'secretary does not reseal Auth');
assert.ok(html.includes('if(start===end)return true;'), 'quiet hours overnight rule stays');

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
    console.log('admin-remisec1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMISEC_SHOTS || '/opt/cursor/artifacts';
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
        fabVisible: !!(fab && fab.getClientRects().length)
      };
    });
    assert.strictEqual(boot.sheetHidden, true, 'Remi sheet stays closed on login');
    assert.strictEqual(boot.adminActive, false, 'login is the desk, not Remi');
    assert.strictEqual(boot.fabVisible, false, 'Remi chip stays off the login screen');

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
    const closed = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var fab = document.getElementById('copilotFab');
      var r = fab.getBoundingClientRect();
      return {
        sheetHidden: sheet.hidden,
        label: fab.getAttribute('aria-label'),
        onScreen: r.left >= 0 && r.right <= window.innerWidth + 1 && r.bottom <= window.innerHeight + 1
      };
    });
    assert.strictEqual(closed.sheetHidden, true, 'desk does not auto-open Remi');
    assert.strictEqual(closed.label, 'Remi');
    assert.strictEqual(closed.onScreen, true, 'corner chip is on the phone');
    await page.screenshot({path: path.join(shotDir, 'remisec1-chip-closed.png')});

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotTabAsk', {visible:true});
    await page.click('#copilotTabAsk');
    await page.waitForSelector('#copilotChatInput', {visible:true});

    const planned = await page.evaluate(function(){
      allClients = [{id:'c-ruth', name:'Ruth Coleman', address:'10 Old Street', phone:'216-555-0199', firstName:'Ruth', lastName:'Coleman'}];
      loadedAidesList = [{id:'a-ada', username:'ada', name:'Ada Cole', phone:'216-555-0100', mustChangePassword:false, assignedClients:['Ruth Coleman']}];
      coverShifts = [{
        id:'sh-oh', status:'open', clientName:'Oh', aideName:'Ada Cole',
        startsAt:'2026-09-27T16:00:00Z', endsAt:'2026-09-27T20:00:00Z',
        phone:'216-555-0140'
      }];
      window.__secWrites = [];
      window.__secRemoves = [];
      window.__secAdds = [];
      apiPost = function(payload){
        window.__secWrites.push(payload);
        return Promise.resolve({success:true});
      };
      softDeleteAide = function(username){
        window.__secRemoves.push(username);
        return Promise.resolve();
      };
      sbAdminAddAide = function(payload){
        window.__secAdds.push(payload);
        return Promise.resolve({success:true, username:'janedoe'});
      };
      renderAides = function(){return Promise.resolve();};
      paintClients = function(){};
      function grab(q){
        var ans = copilotChatAnswer(q);
        return {
          kind: ans.kind||'',
          text: ans.text||'',
          wx: ans.wx||'',
          note: ans.note||'',
          sec: !!ans.sec,
          labels: (ans.actions||[]).map(function(a){return a.label;}),
          kinds: (ans.actions||[]).map(function(a){return a.kind;})
        };
      }
      var help = grab('hello remi');
      var greet = grab('hey Remi');
      var weather = grab("what's the weather?");
      var calloff = grab('any call-offs today?');
      var look = grab('look up caregiver Ada Cole');
      var client = grab('find client Ruth Coleman');
      var address = grab('update client Ruth Coleman address to 100 Public Square, Cleveland OH 44129');
      var remove = grab('soft remove aide Ada Cole');
      var add = grab('add aide Jane Doe phone 216-555-0100 email jane@example.com');
      var shift = grab('who has an open shift');
      return {
        writes: window.__secWrites.length,
        removes: window.__secRemoves.length,
        adds: window.__secAdds.length,
        help: help,
        greet: greet,
        weather: weather,
        calloff: calloff,
        look: look,
        client: client,
        address: address,
        remove: remove,
        add: add,
        shift: shift
      };
    });
    assert.strictEqual(planned.writes, 0, 'planning an address change does not write');
    assert.strictEqual(planned.removes, 0, 'planning a soft-remove does not write');
    assert.strictEqual(planned.adds, 0, 'planning an add does not write');
    assert.strictEqual(planned.help.kind, '');
    assert.ok(/Timesheets/.test(planned.help.text) && /login issues/.test(planned.help.text), planned.help.text);
    assert.ok(/Hey Mo/.test(planned.greet.text) && /Cleveland/.test(planned.greet.text) && /just chatting/.test(planned.greet.text), planned.greet.text);
    assert.strictEqual(planned.greet.wx, 'chip');
    assert.ok(/72/.test(planned.weather.text) && /clear/i.test(planned.weather.text) && /Rain chance after 6pm/.test(planned.weather.text), planned.weather.text);
    assert.strictEqual(planned.weather.wx, 'card');
    assert.ok(/desk duty/.test(planned.weather.note), planned.weather.note);
    assert.ok(/09\/27\/2026/.test(planned.calloff.text) && /Oh CALL-OFF/.test(planned.calloff.text), planned.calloff.text);
    assert.ok(planned.calloff.labels.indexOf('Draft SMS') >= 0 && planned.calloff.labels.indexOf('Open Coverage') >= 0, planned.calloff.labels.join(','));
    assert.ok(/Nothing sends until you confirm/.test(planned.calloff.note), planned.calloff.note);
    assert.ok(/Ada Cole/.test(planned.look.text) && /@ada/.test(planned.look.text) && /216-555-0100/.test(planned.look.text), planned.look.text);
    assert.ok(/Ruth Coleman/.test(planned.client.text) && /10 Old Street/.test(planned.client.text), planned.client.text);
    assert.ok(/From: 10 Old Street/.test(planned.address.text) && /100 Public Square/.test(planned.address.text), planned.address.text);
    assert.ok(planned.address.kinds.indexOf('sec-write') >= 0, 'address offers a confirm write');
    assert.ok(/Soft-remove Ada Cole @ada/.test(planned.remove.text), planned.remove.text);
    assert.ok(planned.remove.kinds.indexOf('sec-write') >= 0);
    assert.ok(/Jane Doe/.test(planned.add.text) && /No sign-in is created/.test(planned.add.text), planned.add.text);
    assert.ok(planned.add.kinds.indexOf('sec-write') >= 0);
    assert.strictEqual(planned.shift.kind, 'coverage_open');
    assert.ok(planned.shift.kinds.indexOf('sms') >= 0 && planned.shift.kinds.indexOf('mail') >= 0, 'open-shift desk answer stays');

    await page.evaluate(function(){copilotChat = []; copilotPaintChat();});
    await page.type('#copilotChatInput', 'hey Remi');
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      return /Hey Mo/.test(document.getElementById('copilotThread').innerText) && document.querySelector('.remi-wx-chip');
    });
    const greetUi = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var sr = sheet.getBoundingClientRect();
      var chip = document.querySelector('.remi-wx-chip');
      var cr = chip.getBoundingClientRect();
      var input = document.getElementById('copilotChatInput');
      return {
        text: document.getElementById('copilotThread').innerText,
        chip: chip.innerText,
        inSheet: cr.left >= sr.left - 1 && cr.right <= sr.right + 1 && cr.top >= sr.top - 1,
        placeholder: input.getAttribute('placeholder'),
        ask: document.getElementById('copilotTabAsk').getAttribute('aria-selected'),
        scrollX: window.scrollX
      };
    });
    assert.strictEqual(greetUi.ask, 'true');
    assert.strictEqual(greetUi.placeholder, 'Ask or just chat...');
    assert.ok(/Hey Mo/.test(greetUi.text) && /Cleveland/.test(greetUi.chip) && /72/.test(greetUi.chip) && /Clear/.test(greetUi.chip), greetUi.text+' '+greetUi.chip);
    assert.strictEqual(greetUi.inSheet, true, 'weather chip stays inside the phone sheet');
    assert.strictEqual(greetUi.scrollX, 0);
    await page.screenshot({path: path.join(shotDir, 'remisec1-greeting.png')});

    await page.evaluate(function(){copilotChat = []; copilotChatEnsureHello(); copilotPaintChat();});
    await page.type('#copilotChatInput', "what's the weather?");
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      return document.querySelector('.remi-wx-card') && /Rain chance after 6pm/.test(document.getElementById('copilotThread').innerText);
    });
    const weatherUi = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var sr = sheet.getBoundingClientRect();
      var card = document.querySelector('.remi-wx-card');
      var cr = card.getBoundingClientRect();
      return {
        text: document.getElementById('copilotThread').innerText,
        card: card.innerText,
        inSheet: cr.left >= sr.left - 1 && cr.right <= sr.right + 1,
        wide: cr.width > sr.width + 2
      };
    });
    assert.ok(/Ask about Timesheets/.test(weatherUi.text), 'desk hello stays above the weather');
    assert.ok(/Cleveland right now/.test(weatherUi.text) && /Cleveland OH 44129/.test(weatherUi.card) && /72/.test(weatherUi.card), weatherUi.card);
    assert.ok(/High 76/.test(weatherUi.card) && /Low 58/.test(weatherUi.card) && /12PM/.test(weatherUi.card), weatherUi.card);
    assert.ok(/Still on desk duty/.test(weatherUi.text));
    assert.strictEqual(weatherUi.inSheet, true, 'weather card stays on the phone');
    assert.strictEqual(weatherUi.wide, false, 'weather card does not widen the page');
    await page.screenshot({path: path.join(shotDir, 'remisec1-weather.png')});

    await page.evaluate(function(){copilotChat = []; copilotChatEnsureHello(); copilotPaintChat();});
    await page.type('#copilotChatInput', 'any call-offs today?');
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      var t = document.getElementById('copilotThread').innerText;
      return /CALL-OFF/.test(t) && /Draft SMS/.test(t) && /Nothing sends until you confirm/.test(t);
    });
    const handoff = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var sr = sheet.getBoundingClientRect();
      var buttons = Array.prototype.slice.call(document.querySelectorAll('#copilotThread .copilot-actions-row .btn'));
      var box = buttons.map(function(b){return b.getBoundingClientRect();});
      return {
        text: document.getElementById('copilotThread').innerText,
        labels: buttons.map(function(b){return b.innerText;}),
        tall: box.every(function(r){return r.height >= 44;}),
        inSheet: box.every(function(r){return r.left >= sr.left - 1 && r.right <= sr.right + 1;}),
        sideBySide: box.length === 2 && Math.abs(box[0].top - box[1].top) < 2
      };
    });
    assert.ok(/09\/27\/2026/.test(handoff.text) && /Oh CALL-OFF still open/.test(handoff.text), handoff.text);
    assert.deepStrictEqual(handoff.labels, ['Draft SMS', 'Open Coverage']);
    assert.strictEqual(handoff.tall, true, 'handoff buttons are tappable');
    assert.strictEqual(handoff.inSheet, true, 'handoff buttons stay on the phone');
    assert.ok(/Nothing sends until you confirm/.test(handoff.text));
    await page.screenshot({path: path.join(shotDir, 'remisec1-calloff.png')});

    await page.evaluate(function(){copilotChat = []; copilotPaintChat();});
    await page.type('#copilotChatInput', 'update client Ruth Coleman address to 100 Public Square, Cleveland OH 44129');
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      return /100 Public Square/.test(document.getElementById('copilotThread').innerText);
    });
    const before = await page.evaluate(function(){
      var btn = Array.prototype.slice.call(document.querySelectorAll('#copilotThread button')).filter(function(b){return b.textContent === 'Update address';})[0];
      btn.click();
      var box = document.getElementById('copilotConfirm');
      return {
        writes: window.__secWrites.length,
        shown: box && !box.hidden,
        text: box ? box.innerText : ''
      };
    });
    assert.strictEqual(before.writes, 0, 'opening confirm does not write');
    assert.strictEqual(before.shown, true, 'confirm UI is shown');
    assert.ok(/Confirm this change/.test(before.text) && /100 Public Square/.test(before.text) && /Nothing is written until you confirm/.test(before.text), before.text);
    await page.screenshot({path: path.join(shotDir, 'remisec1-confirm-address.png')});

    await page.click('#copilotConfirmGo');
    await page.waitForFunction(function(){return window.__secWrites.length === 1;});
    const after = await page.evaluate(function(){
      return {
        writes: window.__secWrites.length,
        payload: window.__secWrites[0],
        removes: window.__secRemoves.length,
        adds: window.__secAdds.length,
        said: document.getElementById('copilotThread').innerText,
        hidden: document.getElementById('copilotConfirm').hidden
      };
    });
    assert.strictEqual(after.writes, 1, 'confirm writes once');
    assert.strictEqual(after.payload.action, 'update_client');
    assert.strictEqual(after.payload.id, 'c-ruth');
    assert.strictEqual(after.payload.address, '100 Public Square, Cleveland OH 44129');
    assert.strictEqual(after.payload.name, 'Ruth Coleman');
    assert.strictEqual(after.removes, 0);
    assert.strictEqual(after.adds, 0);
    assert.ok(/Address updated for Ruth Coleman/.test(after.said), after.said);
    assert.strictEqual(after.hidden, true, 'confirm closes after the write');

    const held = await page.evaluate(async function(){
      copilotChat = [];
      var ans = copilotChatAnswer('soft remove aide Ada Cole');
      copilotChat.push({role:'remi', text:ans.text, kind:ans.kind, actions:ans.actions, sec:true});
      copilotPaintChat();
      copilotChatAction(0, 0);
      var shown = !document.getElementById('copilotConfirm').hidden;
      copilotCancelConfirm();
      var add = copilotChatAnswer('add aide Jane Doe phone 216-555-0100 email jane@example.com');
      copilotChat.push({role:'remi', text:add.text, actions:add.actions, sec:true});
      var idx = copilotChat.length - 1;
      copilotPaintChat();
      copilotChatAction(idx, 0);
      var addShown = !document.getElementById('copilotConfirm').hidden;
      document.getElementById('copilotConfirmGo').click();
      await new Promise(function(r){setTimeout(r, 30);});
      return {
        shown: shown,
        removes: window.__secRemoves.slice(),
        addShown: addShown,
        adds: window.__secAdds.slice()
      };
    });
    assert.strictEqual(held.shown, true, 'soft-remove shows confirm');
    assert.deepStrictEqual(held.removes, [], 'Not yet does not soft-remove');
    assert.strictEqual(held.addShown, true, 'add aide shows confirm');
    assert.strictEqual(held.adds.length, 1, 'confirmed add calls admin_add_aide path');
    assert.strictEqual(held.adds[0].firstName, 'Jane');
    assert.strictEqual(held.adds[0].lastName, 'Doe');
    assert.strictEqual(held.adds[0].phone, '216-555-0100');
    assert.strictEqual(held.adds[0].email, 'jane@example.com');

    await page.click('#copilotCloseBtn');
    const back = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var fab = document.getElementById('copilotFab');
      return {
        sheetHidden: sheet.hidden,
        desk: document.getElementById('adminScreen').classList.contains('active'),
        fab: !!(fab && fab.getClientRects().length && getComputedStyle(fab).display !== 'none')
      };
    });
    assert.strictEqual(back.sheetHidden, true, 'Close returns to the desk');
    assert.strictEqual(back.desk, true);
    assert.strictEqual(back.fab, true, 'corner chip is back');

    await page.evaluate(function(){
      copilotClose();
      currentAdminRole = 'Nurse';
      layoutA1ApplyRoles();
      showScreen('nurseScreen');
    });
    const nurse = await page.evaluate(function(){
      var fab = document.getElementById('copilotFab');
      var home = document.getElementById('nurseScreen');
      return {
        fabVisible: !!(fab && fab.getClientRects().length && getComputedStyle(fab).display !== 'none' && !fab.hidden),
        sheetHidden: document.getElementById('copilotSheet').hidden,
        mentions: /\bRemi\b/.test(home.innerText || ''),
        roleOk: copilotRoleOk(),
        nurseAns: copilotChatAnswer('hey Remi')
      };
    });
    assert.strictEqual(nurse.fabVisible, false, 'Nurse has no Remi chip');
    assert.strictEqual(nurse.sheetHidden, true);
    assert.strictEqual(nurse.mentions, false);
    assert.strictEqual(nurse.roleOk, false);
    assert.ok(nurse.nurseAns && /Timesheets/.test(nurse.nurseAns.text), 'Nurse does not get the secretary greeting');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remisec1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
