#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-notes1'), 'remi-notes1 marker');
assert.ok(html.includes('data-reminotes1="v=remi-notes1"'), 'remi-notes1 data attr');
assert.ok(html.includes('admin-build 2026-09-26-remi-notes1'), 'remi-notes1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-remi-notes1">'), 'remi-notes1 meta');
assert.ok(html.includes('<!-- remi notes 2026-09-26 v=remi-notes1 admin-build 2026-09-26-remi-notes1'), 'remi-notes1 comment');
assert.ok(html.includes("var REMI_NOTES1_MARKER='v=remi-notes1'"), 'remi-notes1 script marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-remi-sched1'), 'isdash1 is the first admin-build meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-26-clienthrs1b">'), 'clienthrs1b meta stays');
assert.ok(html.indexOf('content="2026-09-26-remi-notes1"') < html.indexOf('content="2026-09-26-clienthrs1b"'), 'clienthrs1b stays below remi-notes1');
assert.ok(html.indexOf('content="2026-09-26-clienthrs1b"') < html.indexOf('content="2026-09-26-clienthrs1a"'), 'clienthrs1a stays below clienthrs1b');
assert.ok(html.includes('No full-page Remi'), 'Remi is not a full page');
assert.ok(html.includes('id="copilotFab"'), 'Remi corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page tab');

const nurseAt = html.indexOf('id="nurseScreen"');
const notesAt = html.indexOf('id="copilotTabNotes"');
assert.ok(notesAt > 0 && nurseAt > notesAt, 'Notes tab is in the admin sheet, above the nurse screen');
const sheet = html.slice(html.indexOf('id="copilotSheet"'), nurseAt);
assert.ok(sheet.includes('data-layout-roles="Admin Scheduler"'), 'Remi sheet stays Admin and Scheduler');
assert.ok(sheet.includes('id="copilotTabRadar"') && sheet.includes('id="copilotTabAsk"') && sheet.includes('id="copilotTabNotes"'), 'Radar, Ask, and Notes');
assert.ok(sheet.includes('>30 min<') && sheet.includes('>1 hour<') && sheet.includes('>Tomorrow<') && sheet.includes('Pick date'), 'remind chips');
assert.ok(sheet.includes('remind me in 30 mins'), 'Ask phrasing hint');
assert.ok(sheet.includes('Kept 7 days then auto-delete') === false, 'banner is painted, not a second static copy');
const nurse = html.slice(nurseAt, html.indexOf('SUPERVISORY CONTACT MODAL'));
assert.ok(!nurse.includes('copilotTabNotes') && !nurse.includes('remiNotes'), 'Nurse screen has no Notes');

const start = html.indexOf('// remi notes v=remi-notes1');
const end = html.indexOf('// end remi notes v=remi-notes1');
assert.ok(start > 0 && end > start, 'notes script block');
const src = html.slice(start, end);
assert.ok(!/sbRestRpc|supabase\.|fetch\(/.test(src), 'notes do not call Ace or fetch');
assert.ok(!/reset_aide_temp_password|admin_create_aide|auth\.updateUser/.test(src), 'no Auth reseal');
assert.ok(src.includes('evercare_remi_notes:'), 'localStorage key');
assert.ok(src.includes('America/New_York'), 'reminders use New York time');
assert.ok(src.includes('REMI_NOTES_KEEP_MS=7*24*60*60*1000'), '7 day keep');
const submit = html.slice(html.indexOf('function copilotChatSubmit'), html.indexOf('function copilotShowChat'));
assert.ok(submit.includes('remiNotesFromAsk'), 'Ask submit creates a note from remind-me phrasing');

function memStorage(){
  const mem = {};
  return {
    mem: mem,
    getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
    setItem: function(k, v){mem[k] = String(v);},
    removeItem: function(k){delete mem[k];}
  };
}
const store = memStorage();
const sandbox = {
  currentAdminRole: 'Admin',
  currentAdminUsername: 'mo@evercare.test',
  copilotView: 'radar',
  localStorage: store,
  Intl: Intl,
  Date: Date,
  Math: Math,
  Number: Number,
  String: String,
  JSON: JSON,
  isFinite: isFinite,
  parseInt: parseInt,
  encodeURIComponent: encodeURIComponent,
  Object: Object,
  console: console
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
assert.strictEqual(sandbox.REMI_NOTES1_MARKER, 'v=remi-notes1');

const sat = new Date('2026-09-26T16:00:00.000Z');
const half = sandbox.remiNotesParseAsk('remind me in 30 mins', sat);
assert.ok(half, '30 mins parses');
assert.strictEqual(new Date(half.remind_at).getTime() - sat.getTime(), 30 * 60 * 1000);
assert.strictEqual(half.text, 'remind me in 30 mins');
const minsWord = sandbox.remiNotesParseAsk('remind me in 30 minutes', sat);
assert.strictEqual(new Date(minsWord.remind_at).getTime() - sat.getTime(), 30 * 60 * 1000);
const hour = sandbox.remiNotesParseAsk('remind me in an hour', sat);
assert.strictEqual(new Date(hour.remind_at).getTime() - sat.getTime(), 60 * 60 * 1000);
const monday = sandbox.remiNotesParseAsk('remind me Monday at 3:25pm', sat);
const monParts = sandbox.remiNotesNyParts(new Date(monday.remind_at));
assert.strictEqual(monParts.weekday, 'Mon');
assert.strictEqual(monParts.month, '09');
assert.strictEqual(monParts.day, '28');
assert.strictEqual(monParts.hour, '15');
assert.strictEqual(monParts.minute, '25');
const task = sandbox.remiNotesParseAsk('remind me Monday at 3:25pm to finish shortfall notes', sat);
assert.strictEqual(task.text, 'finish shortfall notes');
assert.strictEqual(sandbox.remiNotesNyParts(new Date(task.remind_at)).day, '28');
const mdy = sandbox.remiNotesParseAsk('remind me 09/28 at 3:25 PM', sat);
assert.strictEqual(sandbox.remiNotesNyParts(new Date(mdy.remind_at)).hour, '15');
const soon = sandbox.remiNotesDisplay(half.remind_at, sat);
assert.strictEqual(soon.pill, '⏱ in 30 min');
assert.ok(soon.extra.indexOf('Sat ~') === 0 || soon.extra.indexOf('remind · Sat ~') === 0, soon.extra);
const tom = sandbox.remiNotesChipAt('tomorrow', sat);
const tomView = sandbox.remiNotesDisplay(tom.toISOString(), sat);
assert.strictEqual(tomView.pill, '📅 tomorrow 9am');
assert.strictEqual(tomView.extra, 'Sun Sep 27');
const custom = sandbox.remiNotesDisplay(monday.remind_at, sat);
assert.strictEqual(custom.pill, '📅 Mon Sep 28 · 3:25 PM');
assert.strictEqual(custom.pillClass, 'custom');

sandbox.currentAdminUsername = 'Mo@EverCare.test';
const made = sandbox.remiNotesFromAsk('remind me in 30 mins', sat);
assert.ok(made && made.note && made.note.remind_at, 'Ask creates a note');
assert.ok(made.answer.text.indexOf('Saved on Notes') >= 0, made.answer.text);
assert.strictEqual(made.answer.actions.length, 0, 'remind-me does not draft a text');
assert.ok(store.mem['evercare_remi_notes:mo%40evercare.test'], 'keyed by lowercased email');
sandbox.currentAdminUsername = 'other@evercare.test';
assert.strictEqual(sandbox.remiNotesOpenList(sat).length, 0, 'another user does not see the note');
sandbox.currentAdminUsername = 'mo@evercare.test';
assert.strictEqual(sandbox.remiNotesOpenList(sat).length, 1, 'same email sees the note');

sandbox.currentAdminUsername = 'desk@evercare.test';
const open = sandbox.remiNotesCreate('Call CM about Bowlax cover', new Date(sat.getTime() + 30 * 60 * 1000).toISOString(), sat);
assert.strictEqual(sandbox.remiNotesOpenList(sat).length, 1);
sandbox.remiNotesComplete(open.id, sat);
assert.strictEqual(sandbox.remiNotesOpenList(sat).length, 0, 'checking moves it out of open');
assert.strictEqual(sandbox.remiNotesDoneList(sat).length, 1, 'done list has it');
const left = sandbox.remiNotesDaysLeft(sandbox.remiNotesDoneList(sat)[0].done_at, sat);
assert.strictEqual(left, 7);
sandbox.remiNotesRestore(open.id);
assert.strictEqual(sandbox.remiNotesOpenList(sat).length, 1, 'recover returns it to open');
assert.strictEqual(sandbox.remiNotesDoneList(sat).length, 0);

const stale = sandbox.remiNotesCreate('old done', null, sat);
sandbox.remiNotesComplete(stale.id, new Date(sat.getTime() - 8 * 24 * 60 * 60 * 1000));
assert.strictEqual(sandbox.remiNotesDoneList(sat).filter(function(n){return n.id === stale.id;}).length, 0, '8 days done is purged');
const kept = sandbox.remiNotesCreate('still here', null, sat);
sandbox.remiNotesComplete(kept.id, new Date(sat.getTime() - 6 * 24 * 60 * 60 * 1000));
assert.strictEqual(sandbox.remiNotesDoneList(sat).filter(function(n){return n.id === kept.id;}).length, 1, '6 days done stays');

sandbox.remiNotesChip('1hour');
assert.strictEqual(sandbox.remiNotesPending.kind, '1hour');
assert.ok(Math.abs(Date.parse(sandbox.remiNotesPending.remind_at) - Date.now() - 60 * 60 * 1000) < 5000, '1 hour chip');
sandbox.remiNotesChip('tomorrow');
const tomNow = sandbox.remiNotesNyParts(new Date(sandbox.remiNotesPending.remind_at));
assert.strictEqual(tomNow.hour, '09');
assert.strictEqual(tomNow.minute, '00');

sandbox.remiNotesPick = {viewY:2026, viewM:9, y:2026, m:9, d:28, ap:'PM'};
sandbox.document = {
  getElementById: function(id){
    if(id === 'remiNotesHour')return {value:'3'};
    if(id === 'remiNotesMin')return {value:'25'};
    return null;
  }
};
const picked = sandbox.remiNotesPickerDate();
const pickedParts = sandbox.remiNotesNyParts(picked);
assert.strictEqual(pickedParts.day, '28');
assert.strictEqual(pickedParts.hour, '15');
assert.strictEqual(pickedParts.minute, '25');
assert.strictEqual(sandbox.remiNotesWhenLabel(picked), 'Mon Sep 28 · 3:25 PM');

sandbox.currentAdminRole = 'Scheduler';
sandbox.currentAdminUsername = 'scheduler@evercare.test';
assert.strictEqual(sandbox.remiNotesRoleOk(), true);
const sched = sandbox.remiNotesFromAsk('remind me in 30 mins', sat);
assert.ok(sched && sched.note, 'Scheduler can save a reminder');
sandbox.currentAdminRole = 'Nurse';
sandbox.currentAdminUsername = 'nurse@evercare.test';
assert.strictEqual(sandbox.remiNotesRoleOk(), false, 'Nurse has no Notes');
assert.strictEqual(sandbox.remiNotesFromAsk('remind me in 30 mins', sat), null, 'Nurse Ask does not create a note');
assert.strictEqual(sandbox.remiNotesCreate('nope', null, sat), null);
assert.ok(!store.mem['evercare_remi_notes:nurse%40evercare.test'], 'Nurse write is refused');

console.log('admin-remi-notes1 unit ok');

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
    console.log('admin-remi-notes1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_NOTES_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript', '.css':'text/css'};
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
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await page.setRequestInterception(true);
    page.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({
        role:'Admin',
        username:'mo@evercare.test',
        name:'Mo',
        loginAt:Date.now()
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?sheets=1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.waitForSelector('#copilotFab', {timeout:10000});
    const seeded = await page.evaluate(function(){
      if(!document.getElementById('adminScreen').classList.contains('active')){
        currentAdminRole = 'Admin';
        currentAdminUsername = 'mo@evercare.test';
        if(typeof showScreen === 'function')showScreen('adminScreen');
      }
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      var now = new Date();
      remiNotesCreate('Call CM about Bowlax cover', new Date(now.getTime() + 30 * 60 * 1000).toISOString(), now);
      remiNotesCreate('Confirm Kim for Ada Tue AM', remiNotesChipAt('tomorrow', now).toISOString(), now);
      var mon = remiNotesParseAsk('remind me Monday at 3:25pm', now);
      remiNotesCreate('Finish shortfall notes before noon', mon.remind_at, now);
      remiNotesShow();
      var box = document.getElementById('copilotSheet').getBoundingClientRect();
      var check = document.querySelector('#copilotBody .check');
      var add = document.getElementById('remiNotesAdd');
      var chip = document.getElementById('remiNotesChip30');
      return {
        selected: document.getElementById('copilotTabNotes').getAttribute('aria-selected'),
        ask: document.getElementById('copilotTabAsk').getAttribute('aria-selected'),
        text: document.getElementById('copilotBody').innerText,
        sheetTop: box.top,
        sheetBottom: box.bottom,
        sheetWidth: box.width,
        viewW: window.innerWidth,
        viewH: window.innerHeight,
        checkH: check ? check.getBoundingClientRect().height : 0,
        addH: add ? add.getBoundingClientRect().height : 0,
        chipH: chip ? chip.getBoundingClientRect().height : 0,
        openCount: remiNotesOpenList(now).length
      };
    });
    assert.strictEqual(seeded.selected, 'true', 'Notes tab selected');
    assert.strictEqual(seeded.ask, 'false');
    assert.strictEqual(seeded.viewW, 390);
    assert.strictEqual(seeded.viewH, 844);
    assert.ok(seeded.sheetTop >= 60, 'phone Remi is a sheet, not a full-page zoom ' + seeded.sheetTop);
    assert.ok(seeded.sheetBottom <= seeded.viewH + 1, 'sheet stays on the phone');
    assert.ok(seeded.sheetWidth <= seeded.viewW + 1);
    assert.ok(seeded.text.indexOf('Call CM about Bowlax cover') >= 0, seeded.text);
    assert.ok(seeded.text.indexOf('Confirm Kim for Ada Tue AM') >= 0, seeded.text);
    assert.ok(seeded.text.indexOf('Finish shortfall notes before noon') >= 0, seeded.text);
    assert.ok(seeded.text.indexOf('in 30 min') >= 0, seeded.text);
    assert.ok(seeded.text.indexOf('tomorrow 9am') >= 0, seeded.text);
    assert.ok(seeded.text.indexOf('Recently done') >= 0, seeded.text);
    assert.ok(seeded.checkH >= 44 && seeded.addH >= 44 && seeded.chipH >= 44, 'tappable ' + [seeded.checkH, seeded.addH, seeded.chipH].join(','));
    assert.strictEqual(seeded.openCount, 3);
    await page.screenshot({path:path.join(shotDir, 'remi-notes1-phone.png')});

    await page.evaluate(function(){remiNotesOpenPicker();});
    await page.click('#remiNotesCal button.d.today-mark');
    const dayBtn = await page.evaluate(function(){
      var days = Array.prototype.slice.call(document.querySelectorAll('#remiNotesCal button.d'));
      var hit = null;
      for(var i = 0; i < days.length; i++){
        if(days[i].textContent.trim() === '28' && days[i].className.indexOf('mute') < 0){hit = i; break;}
      }
      if(hit == null){
        for(var j = 0; j < days.length; j++){
          if(days[j].className.indexOf('mute') < 0 && days[j].className.indexOf('today-mark') < 0){hit = j; break;}
        }
      }
      return hit;
    });
    assert.ok(dayBtn != null, 'calendar has a day');
    const buttons = await page.$$('#remiNotesCal button.d');
    await buttons[dayBtn].click();
    await page.click('#remiNotesHour', {clickCount:3});
    await page.type('#remiNotesHour', '3');
    await page.click('#remiNotesMin', {clickCount:3});
    await page.type('#remiNotesMin', '25');
    await page.click('#remiNotesPm');
    const preview = await page.$eval('#remiNotesPickPreview', function(el){return el.innerText;});
    assert.ok(preview.indexOf('3:25 PM') >= 0, preview);
    await page.screenshot({path:path.join(shotDir, 'remi-notes1-picker-phone.png')});
    await page.click('#remiNotesSetRemind');
    await page.type('#remiNotesInput', 'Picker probe');
    await page.click('#remiNotesAdd');
    const pickedNote = await page.evaluate(function(){
      var list = remiNotesOpenList(new Date());
      var hit = null;
      for(var i = 0; i < list.length; i++){
        if(list[i].text === 'Picker probe')hit = list[i];
      }
      var parts = hit ? remiNotesNyParts(new Date(hit.remind_at)) : null;
      return {parts:parts, chipOn:document.getElementById('remiNotesChipPick').classList.contains('on') === false};
    });
    assert.ok(pickedNote.parts, 'pick date created a note');
    assert.strictEqual(pickedNote.parts.hour, '15');
    assert.strictEqual(pickedNote.parts.minute, '25');

    const flowed = await page.evaluate(function(){
      var row = document.querySelector('#copilotBody .note-row .check');
      row.click();
      remiNotesShowDone();
      var doneText = document.getElementById('copilotBody').innerText;
      var recover = document.querySelector('#copilotBody .btn-recover');
      var id = recover ? recover.getAttribute('data-id') : '';
      recover.click();
      var openText = document.getElementById('copilotBody').innerText;
      var openIds = remiNotesOpenList(new Date()).map(function(n){return n.id;});
      return {doneText:doneText, openText:openText, back:openIds.indexOf(id) >= 0, banner:doneText.indexOf('Kept 7 days then auto-delete') >= 0};
    });
    assert.strictEqual(flowed.banner, true, flowed.doneText);
    assert.ok(flowed.doneText.indexOf('Recover') >= 0, flowed.doneText);
    assert.strictEqual(flowed.back, true, 'recover returns the note to open');
    assert.ok(flowed.openText.indexOf('Open notes') >= 0, flowed.openText);

    await page.click('#remiNotesChip30');
    await page.type('#remiNotesInput', 'Chip half hour');
    await page.click('#remiNotesAdd');
    const chipNote = await page.evaluate(function(){
      var now = Date.now();
      var list = remiNotesOpenList(new Date());
      var hit = null;
      for(var i = 0; i < list.length; i++)if(list[i].text === 'Chip half hour')hit = list[i];
      return hit ? Math.abs(Date.parse(hit.remind_at) - now - 30 * 60 * 1000) : -1;
    });
    assert.ok(chipNote >= 0 && chipNote < 15000, '30 min chip sets remind_at ' + chipNote);

    await page.evaluate(function(){
      copilotShowChat();
      document.getElementById('copilotChatInput').value = 'remind me in 30 mins';
      copilotChatSubmit({preventDefault:function(){}});
    });
    const asked = await page.evaluate(function(){
      var bubbles = document.querySelectorAll('#copilotThread .copilot-bubble-remi');
      var last = bubbles.length ? bubbles[bubbles.length - 1].innerText : '';
      var list = remiNotesOpenList(new Date());
      var hit = null;
      for(var i = 0; i < list.length; i++){
        if(list[i].text === 'remind me in 30 mins')hit = list[i];
      }
      return {last:last, delta:hit ? Math.abs(Date.parse(hit.remind_at) - Date.now() - 30 * 60 * 1000) : -1};
    });
    assert.ok(asked.last.indexOf('Saved on Notes') >= 0, asked.last);
    assert.ok(asked.delta >= 0 && asked.delta < 15000, 'Ask remind me in 30 mins creates a note');

    await page.evaluate(function(){remiNotesShow();});
    await page.screenshot({path:path.join(shotDir, 'remi-notes1-phone-after.png')});

    const desk = await browser.newPage();
    await desk.setViewport({width:1280, height:800, isMobile:false, hasTouch:false, deviceScaleFactor:1});
    await desk.setRequestInterception(true);
    desk.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await desk.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({
        role:'Scheduler',
        username:'scheduler@evercare.test',
        name:'Scheduler',
        loginAt:Date.now()
      }));
    });
    await desk.goto('http://127.0.0.1:' + port + '/index.html?sheets=1', {waitUntil:'domcontentloaded', timeout:20000});
    await desk.waitForSelector('#copilotFab', {timeout:10000});
    const wide = await desk.evaluate(function(){
      currentAdminRole = 'Scheduler';
      currentAdminUsername = 'scheduler@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      if(typeof showTab === 'function'){
        try{showTab('schedule');}catch(e){}
      }
      var now = new Date();
      remiNotesCreate('Call CM about Bowlax cover', new Date(now.getTime() + 30 * 60 * 1000).toISOString(), now);
      remiNotesCreate('Confirm Kim for Ada Tue AM', remiNotesChipAt('tomorrow', now).toISOString(), now);
      var mon = remiNotesParseAsk('remind me Monday at 3:25pm', now);
      remiNotesCreate('Finish shortfall notes before noon', mon.remind_at, now);
      remiNotesShow();
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var main = document.querySelector('#adminScreen .main-content').getBoundingClientRect();
      return {
        role:currentAdminRole,
        selected:document.getElementById('copilotTabNotes').getAttribute('aria-selected'),
        sheetLeft:sheet.left,
        sheetRight:sheet.right,
        sheetWidth:sheet.width,
        mainLeft:main.left,
        viewW:window.innerWidth,
        text:document.getElementById('copilotBody').innerText
      };
    });
    assert.strictEqual(wide.role, 'Scheduler');
    assert.strictEqual(wide.selected, 'true');
    assert.strictEqual(wide.viewW, 1280);
    assert.ok(wide.sheetWidth < 520 && wide.sheetWidth > 300, 'desktop rail width ' + wide.sheetWidth);
    assert.ok(wide.sheetLeft > wide.viewW * 0.5, 'rail stays on the right ' + wide.sheetLeft);
    assert.ok(wide.sheetRight <= wide.viewW + 1);
    assert.ok(wide.mainLeft < wide.sheetLeft, 'desk stays beside the rail');
    assert.ok(wide.text.indexOf('Open notes') >= 0, wide.text);
    await desk.screenshot({path:path.join(shotDir, 'remi-notes1-desktop.png')});

    const nurse = await browser.newPage();
    await nurse.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await nurse.setRequestInterception(true);
    nurse.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await nurse.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({
        role:'Nurse',
        username:'nurse@evercare.test',
        name:'Nurse',
        loginAt:Date.now()
      }));
    });
    await nurse.goto('http://127.0.0.1:' + port + '/index.html?sheets=1', {waitUntil:'domcontentloaded', timeout:20000});
    await nurse.waitForSelector('#nurseScreen', {timeout:10000});
    const nurseState = await nurse.evaluate(function(){
      currentAdminRole = 'Nurse';
      currentAdminUsername = 'nurse@evercare.test';
      if(typeof showScreen === 'function')showScreen('nurseScreen');
      if(typeof remiNotesShow === 'function')remiNotesShow();
      var sheet = document.getElementById('copilotSheet');
      return {
        nurseOn:document.getElementById('nurseScreen').classList.contains('active'),
        adminOn:document.getElementById('adminScreen').classList.contains('active'),
        inNurse:!!document.getElementById('nurseScreen').querySelector('#copilotTabNotes'),
        sheetHidden:sheet ? sheet.hidden : true,
        roleOk:remiNotesRoleOk(),
        created:remiNotesFromAsk('remind me in 30 mins', new Date())
      };
    });
    assert.strictEqual(nurseState.nurseOn, true);
    assert.strictEqual(nurseState.adminOn, false);
    assert.strictEqual(nurseState.inNurse, false, 'Nurse DOM has no Notes tab');
    assert.strictEqual(nurseState.sheetHidden, true);
    assert.strictEqual(nurseState.roleOk, false);
    assert.strictEqual(nurseState.created, null);
    console.log('admin-remi-notes1 browser ok');
  } finally {
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
