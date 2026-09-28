#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const DEMO = 'a0a0e41d-6cdd-4ad0-ad11-ba44b3f31513';

assert.ok(html.includes('v=remi-proof1'), 'remi-proof1 marker');
assert.ok(html.includes('data-remi-proof1="v=remi-proof1"'), 'remi-proof1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-proof1'), 'remi-proof1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-proof1">'), 'remi-proof1 meta');
assert.ok(html.includes('<!-- remi job receipts 2026-09-27 v=remi-proof1 admin-build 2026-09-27-remi-proof1'), 'remi-proof1 comment');
assert.ok(html.includes("var REMI_PROOF1_MARKER='v=remi-proof1'"), 'remi-proof1 script marker');
assert.ok(html.includes(DEMO), 'probe seed stays documented');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-hold-client1'), 'first admin-build is remi-proof1');
assert.ok(html.indexOf('content="2026-09-27-remi-proof1"') < html.indexOf('content="2026-09-27-remi-sched1"'), 'sched follows proof');
assert.ok(html.indexOf('content="2026-09-27-remi-sched1"') < html.indexOf('content="2026-09-27-remi-rules1"'), 'rules follows sched');
assert.ok(html.indexOf('content="2026-09-27-remi-rules1"') < html.indexOf('content="2026-09-27-remi-notes-vis1"'), 'notes vis follows rules');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-vapid1">'), 'vapid1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage-simple1 meta stays');
['v=remi-notes-vis1','v=remi-rules1','v=remi-sched1','v=coverage-simple1','v=vapid1','v=clienthrs1d','v=remi-cm-email1','v=remiface1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'marker stays ' + mark);
});
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="copilotTabProof"'), 'Receipts tab in the rail');
assert.ok(html.includes('id="copilotTabRadar"') && html.includes('id="copilotTabAsk"'), 'Radar and Ask stay');

const start = html.indexOf('// remi proof1 v=remi-proof1');
const end = html.indexOf('// end remi proof1 v=remi-proof1');
assert.ok(start > 0 && end > start, 'proof script block');
const src = html.slice(start, end);
assert.ok(src.includes('admin_finalize_remi_cover_receipt'), 'finalize rpc');
assert.ok(src.includes('admin_list_remi_receipts'), 'list rpc');
assert.ok(src.includes('admin_get_remi_receipt'), 'get rpc');
assert.ok(src.includes('admin_find_remi_receipt'), 'find rpc');
assert.ok(src.includes('admin_record_remi_job_receipt'), 'lighter job receipt rpc');
assert.ok(src.includes('is_scheduler_office'), 'is_scheduler_office path');
assert.ok(src.includes('sbRestRpc'), 'office JWT via sbRestRpc');
assert.ok(src.includes('Open full proof'), 'open proof label');
assert.ok(src.includes('list_summary') && src.includes('finished_label') && src.includes('chip_summary'), 'paints receipt fields');
assert.ok(!src.includes('Bowlax'), 'Bowlax is not invented in the rail');
assert.ok(!src.includes(DEMO), 'probe seed is not hardcoded in the script');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|send_sms/.test(src), 'no Quo or SMS');
assert.ok(src.includes('Nurse cannot use Remi receipts'), 'nurse writes refused');

const simple = html.slice(html.indexOf('// v=coverage-simple1 blast'), html.indexOf('// end v=coverage-simple1'));
assert.ok(simple.includes("coverSimpleRpc('admin_blast_cover_request'"), 'blast stays');
assert.ok(simple.includes("coverSimpleRpc('admin_confirm_cover_send'"), 'confirm stays');
assert.ok(simple.includes('remiProof1AfterCover'), 'finalize is additive after confirm');
assert.ok(!simple.includes('admin_finalize_remi_cover_receipt'), 'confirm source still posts confirm, not the receipt rpc');
assert.ok(!simple.includes('admin_cover_outcome'), 'confirm does not post a second outcome');

const COVER = {
  id: DEMO,
  kind: 'cover',
  title: 'Coverage receipt',
  status: 'Covered',
  subtitle: 'Bowlax · Tomorrow 9:00–1:00 · call-off Maria',
  client_name: 'Bowlax',
  blasted_count: 12,
  said_yes_count: 3,
  assigned_aide_name: 'Devon',
  finished_label: 'Today 9:41 AM ET',
  timeline: [
    {at_label: '9:28', label: 'Remi logged call-off'},
    {at_label: '9:29', label: 'Blast sent (Messages + push if Allowed)'},
    {at_label: '9:37', label: 'Devon Yes · Lina Yes · Sara Yes'},
    {at_label: '9:41', label: 'Schedule marked Covered · Devon'}
  ],
  chip_summary: 'Blasted 12 · 3 yes · Devon covered · 9:41',
  list_summary: 'Bowlax cover · Devon · Covered'
};
const NUDGE = {id: 'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1', kind: 'hours_nudge', title: 'Hours nudge', status: 'Sent', list_summary: 'Hours nudge · 8 aides · Sent', finished_label: 'Sat 4:12', chip_summary: 'Hours nudge · 8 aides · Sent'};
const DIGEST = {id: 'c2c2c2c2-c2c2-42c2-82c2-c2c2c2c2c2c2', kind: 'manager_digest', title: 'Manager digest', status: 'Sent', list_summary: 'Manager digest · 3 missing', finished_label: 'Fri 2:01', chip_summary: 'Manager digest · 3 missing'};

function runSlice(){
  const sandbox = {currentAdminRole: 'Admin', copilotView: 'receipts', copilotChat: [], console: console};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_PROOF1_MARKER, 'v=remi-proof1');
  assert.strictEqual(sandbox.REMI_PROOF1_OFFICE, 'is_scheduler_office');
  assert.strictEqual(sandbox.remiProof1FromAsk('tell me a joke about the weather'), null);
  const ask = sandbox.remiProof1FromAsk('show me the Bowlax receipt');
  assert.ok(ask && ask.proofQuery === 'show me the Bowlax receipt', JSON.stringify(ask));
  assert.strictEqual(sandbox.remiProof1IsReceiptAsk('receipt for Devon'), true);

  const card = sandbox.remiProof1CardHtml(COVER);
  assert.ok(card.includes('Coverage receipt'), card);
  assert.ok(card.includes('Covered'), card);
  assert.ok(card.includes('Bowlax · Tomorrow 9:00–1:00 · call-off Maria'), card);
  assert.ok(card.includes('12 aides'), card);
  assert.ok(card.includes('>3<'), card);
  assert.ok(card.includes('Devon'), card);
  assert.ok(card.includes('Today 9:41 AM ET'), card);
  assert.ok(card.includes('9:28 — Remi logged call-off'), card);
  assert.ok(card.includes('Schedule marked Covered · Devon'), card);

  const chip = sandbox.remiProof1ChipHtml(sandbox.remiProof1ChipFrom({
    receipt: COVER,
    rail_chip: {kind: 'receipt', summary: COVER.chip_summary, receipt_id: DEMO, open_label: 'Open full proof →'}
  }));
  assert.ok(chip.includes('Receipt'), chip);
  assert.ok(chip.includes('Blasted 12 · 3 yes · Devon covered · 9:41'), chip);
  assert.ok(chip.includes('Open full proof →'), chip);

  sandbox.remiProof1Cache = [COVER, NUDGE, DIGEST];
  sandbox.remiProof1Error = '';
  const list = sandbox.remiProof1ListHtml();
  assert.ok(list.includes('Recent receipts'), list);
  assert.ok(list.includes('Today 9:41 AM ET'), list);
  assert.ok(list.includes('Bowlax cover · Devon · Covered'), list);
  assert.ok(list.includes('Hours nudge · 8 aides · Sent'), list);
  assert.ok(list.includes('Manager digest · 3 missing'), list);
  assert.ok(list.includes('Sat 4:12'), list);
  assert.ok(list.includes('Fri 2:01'), list);

  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name: name, body: body});
    if(name === 'admin_finalize_remi_cover_receipt'){
      return {ok: true, data: {success: true, marker: 'remi-proof1', receipt: COVER, rail_chip: {kind: 'receipt', summary: COVER.chip_summary, receipt_id: DEMO, open_label: 'Open full proof →'}}};
    }
    if(name === 'admin_get_remi_receipt')return {ok: true, data: {success: true, receipt: COVER}};
    if(name === 'admin_list_remi_receipts')return {ok: true, data: {success: true, receipts: [COVER, NUDGE, DIGEST]}};
    if(name === 'admin_find_remi_receipt')return {ok: true, data: {success: true, best: COVER, receipts: [COVER]}};
    if(name === 'admin_record_remi_job_receipt')return {ok: true, data: {success: true, receipt: NUDGE}};
    return {ok: false, error: 'unexpected ' + name};
  };
  sandbox.copilotPaintChat = function(){sandbox.painted = true;};
  const finalized = await sandbox.remiProof1AfterCover('shift-1', {said_yes_aide_ids: ['aide-devon', 'aide-lina']});
  assert.strictEqual(finalized.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_finalize_remi_cover_receipt');
  assert.strictEqual(rpc[0].body.p_open_shift_id, 'shift-1');
  assert.deepStrictEqual(rpc[0].body.p_said_yes_aide_ids, ['aide-devon', 'aide-lina']);
  assert.ok(sandbox.copilotChat[0].text.indexOf('Done — Bowlax is Covered with Devon.') >= 0, sandbox.copilotChat[0].text);
  assert.strictEqual(sandbox.copilotChat[0].proof.summary, COVER.chip_summary);

  rpc.length = 0;
  const plain = await sandbox.remiProof1AfterCover('shift-2', {});
  assert.strictEqual(plain.ok, true);
  assert.ok(!Object.prototype.hasOwnProperty.call(rpc[0].body, 'p_said_yes_aide_ids'), 'omit said-yes when Ace should read the yes thread');

  rpc.length = 0;
  sandbox.copilotChat = [{role: 'remi', text: '', proofQuery: 'show me the Bowlax receipt', sec: true}];
  sandbox.copilotView = 'chat';
  const found = await sandbox.remiProof1Lookup(0);
  assert.strictEqual(found.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_find_remi_receipt');
  assert.strictEqual(rpc[0].body.p_query, 'show me the Bowlax receipt');
  assert.strictEqual(sandbox.copilotChat[0].proof.receipt_id, DEMO);

  rpc.length = 0;
  const opened = await sandbox.remiProof1Open(DEMO);
  assert.strictEqual(opened.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_get_remi_receipt');
  assert.strictEqual(rpc[0].body.p_id, DEMO);

  rpc.length = 0;
  const recorded = await sandbox.remiProof1RecordJob({kind: 'hours_nudge', title: 'Hours nudge', status: 'Sent', list_summary: NUDGE.list_summary, chip_summary: NUDGE.chip_summary, subtitle: '8 aides'});
  assert.strictEqual(recorded.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_record_remi_job_receipt');
  assert.strictEqual(rpc[0].body.p_kind, 'hours_nudge');
  assert.strictEqual(rpc[0].body.p_status, 'Sent');
  assert.strictEqual(rpc[0].body.p_list_summary, NUDGE.list_summary);

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  assert.strictEqual(sandbox.remiProof1FromAsk('show me the Bowlax receipt'), null);
  const nurse = await sandbox.remiProof1Rpc('admin_get_remi_receipt', {p_id: DEMO});
  assert.strictEqual(nurse.forbidden, true);
  const nurseCover = await sandbox.remiProof1AfterCover('shift-1', {});
  assert.strictEqual(nurseCover.forbidden, true);
  assert.strictEqual(rpc.length, 0, 'nurse write does not call Ace');

  console.log('admin-remi-proof1 unit ok');
  await runBrowser();
})().catch(function(err){
  console.error(err);
  process.exit(1);
});

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
    console.log('admin-remi-proof1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_PACK_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const types = {'.html': 'text/html; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.css': 'text/css'};
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403); res.end(); return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404); res.end('missing'); return;}
      const ext = path.extname(file).toLowerCase();
      res.writeHead(200, {'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store'});
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
  const demo = DEMO;
  try{
    const page = await browser.newPage();
    await page.setViewport({width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1});
    await page.setRequestInterception(true);
    page.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({
        role: 'Admin', username: 'mo@evercare.test', name: 'Mo', loginAt: Date.now()
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=remi-proof1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await page.waitForSelector('#copilotFab', {timeout: 10000});
    await page.evaluate(async function(demoId){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      window.__cover = {
        id: demoId, kind: 'cover', title: 'Coverage receipt', status: 'Covered',
        subtitle: 'Bowlax · Tomorrow 9:00–1:00 · call-off Maria', client_name: 'Bowlax',
        blasted_count: 12, said_yes_count: 3, assigned_aide_name: 'Devon',
        finished_label: 'Today 9:41 AM ET',
        timeline: [
          {at_label: '9:28', label: 'Remi logged call-off'},
          {at_label: '9:29', label: 'Blast sent (Messages + push if Allowed)'},
          {at_label: '9:37', label: 'Devon Yes · Lina Yes · Sara Yes'},
          {at_label: '9:41', label: 'Schedule marked Covered · Devon'}
        ],
        chip_summary: 'Blasted 12 · 3 yes · Devon covered · 9:41',
        list_summary: 'Bowlax cover · Devon · Covered'
      };
      window.__rows = [
        window.__cover,
        {id: 'b1b1b1b1-b1b1-41b1-81b1-b1b1b1b1b1b1', kind: 'hours_nudge', status: 'Sent', finished_label: 'Sat 4:12', list_summary: 'Hours nudge · 8 aides · Sent'},
        {id: 'c2c2c2c2-c2c2-42c2-82c2-c2c2c2c2c2c2', kind: 'manager_digest', status: 'Sent', finished_label: 'Fri 2:01', list_summary: 'Manager digest · 3 missing'}
      ];
      window.__rpc = [];
      sbRestRpc = async function(name, body){
        window.__rpc.push({name: name, body: body});
        if(name === 'admin_list_remi_receipts')return {ok: true, data: {success: true, receipts: window.__rows}};
        if(name === 'admin_get_remi_receipt')return {ok: true, data: {success: true, receipt: window.__cover}};
        if(name === 'admin_find_remi_receipt')return {ok: true, data: {success: true, best: window.__cover, receipts: [window.__cover], rail_chip: {kind: 'receipt', summary: window.__cover.chip_summary, receipt_id: window.__cover.id, open_label: 'Open full proof →'}}};
        if(name === 'admin_finalize_remi_cover_receipt')return {ok: true, data: {success: true, receipt: window.__cover, rail_chip: {kind: 'receipt', summary: window.__cover.chip_summary, receipt_id: window.__cover.id, open_label: 'Open full proof →'}}};
        return {ok: false, error: 'unexpected ' + name};
      };
      remiProof1Show();
      await remiProof1Load();
    }, demo);
    const listView = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      var mini = document.querySelector('.remi-proof-mini');
      return {
        text: document.getElementById('copilotBody').innerText,
        selected: document.getElementById('copilotTabProof').getAttribute('aria-selected'),
        viewW: window.innerWidth,
        sheetTop: box.top,
        sheetWidth: box.width,
        overflow: sheet.scrollWidth <= sheet.clientWidth + 2,
        miniH: mini ? mini.getBoundingClientRect().height : 0
      };
    });
    assert.strictEqual(listView.viewW, 390);
    assert.strictEqual(listView.selected, 'true');
    assert.ok(listView.sheetTop >= 60, 'rail sheet ' + listView.sheetTop);
    assert.ok(listView.sheetWidth <= listView.viewW + 1);
    assert.strictEqual(listView.overflow, true);
    assert.ok(listView.miniH >= 44, 'receipt row tap ' + listView.miniH);
    assert.ok(listView.text.indexOf('Recent receipts') >= 0, listView.text);
    assert.ok(listView.text.indexOf('Bowlax cover · Devon · Covered') >= 0, listView.text);
    assert.ok(listView.text.indexOf('Hours nudge · 8 aides · Sent') >= 0, listView.text);
    assert.ok(listView.text.indexOf('Manager digest · 3 missing') >= 0, listView.text);
    await page.screenshot({path: path.join(shotDir, 'remi-proof1-phone-list.png')});

    await page.evaluate(function(demoId){return remiProof1Open(demoId);}, demo);
    await page.waitForFunction(function(){return document.body.innerText.indexOf('Coverage receipt') >= 0;});
    const cardView = await page.evaluate(function(){
      return document.getElementById('copilotBody').innerText;
    });
    assert.ok(cardView.indexOf('Coverage receipt') >= 0, cardView);
    assert.ok(cardView.indexOf('Covered') >= 0, cardView);
    assert.ok(cardView.indexOf('12 aides') >= 0, cardView);
    assert.ok(cardView.indexOf('Today 9:41 AM ET') >= 0, cardView);
    assert.ok(cardView.indexOf('9:41 — Schedule marked Covered · Devon') >= 0, cardView);
    await page.screenshot({path: path.join(shotDir, 'remi-proof1-phone-card.png')});

    await page.evaluate(async function(){
      copilotShowChat();
      document.getElementById('copilotChatInput').value = 'show me the Bowlax receipt';
      copilotChatSubmit({preventDefault: function(){}});
      await remiProof1Lookup(copilotChat.length - 1);
    });
    const chipView = await page.evaluate(function(){
      var open = document.getElementById('remiProof1Open');
      return {
        text: document.getElementById('copilotBody').innerText,
        ask: document.getElementById('copilotTabAsk').getAttribute('aria-selected'),
        openH: open ? open.getBoundingClientRect().height : 0
      };
    });
    assert.strictEqual(chipView.ask, 'true');
    assert.ok(chipView.text.indexOf('Receipt') >= 0, chipView.text);
    assert.ok(chipView.text.indexOf('Blasted 12 · 3 yes · Devon covered · 9:41') >= 0, chipView.text);
    assert.ok(chipView.text.indexOf('Open full proof') >= 0, chipView.text);
    assert.ok(chipView.openH >= 44, 'open proof tap ' + chipView.openH);
    await page.screenshot({path: path.join(shotDir, 'remi-proof1-phone-chip.png')});

    const finalized = await page.evaluate(function(){
      return remiProof1AfterCover('shift-bowlax', {said_yes_aide_ids: ['devon-id']}).then(function(){
        var hit = null;
        window.__rpc.forEach(function(row){if(row.name === 'admin_finalize_remi_cover_receipt')hit = row.body;});
        return hit;
      });
    });
    assert.ok(finalized && finalized.p_open_shift_id === 'shift-bowlax', JSON.stringify(finalized));
    assert.deepStrictEqual(finalized.p_said_yes_aide_ids, ['devon-id']);

    const desk = await browser.newPage();
    await desk.setViewport({width: 1280, height: 800, isMobile: false, hasTouch: false, deviceScaleFactor: 1});
    await desk.setRequestInterception(true);
    desk.on('request', function(req){
      const url = req.url();
      if(/127\.0\.0\.1|fonts\.googleapis|fonts\.gstatic|^data:/.test(url))req.continue();
      else req.abort();
    });
    await desk.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sheets', '1');
      localStorage.setItem('admin_session', JSON.stringify({
        role: 'Admin', username: 'mo@evercare.test', name: 'Mo', loginAt: Date.now()
      }));
    });
    await desk.goto('http://127.0.0.1:' + port + '/index.html?v=remi-proof1', {waitUntil: 'domcontentloaded', timeout: 20000});
    await desk.waitForSelector('#copilotFab', {timeout: 10000});
    const wide = await desk.evaluate(async function(demoId){
      currentAdminRole = 'Admin';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      var cover = {
        id: demoId, title: 'Coverage receipt', status: 'Covered',
        subtitle: 'Bowlax · Tomorrow 9:00–1:00 · call-off Maria',
        client_name: 'Bowlax', blasted_count: 12, said_yes_count: 3,
        assigned_aide_name: 'Devon', finished_label: 'Today 9:41 AM ET',
        timeline: [{at_label: '9:41', label: 'Schedule marked Covered · Devon'}],
        chip_summary: 'Blasted 12 · 3 yes · Devon covered · 9:41',
        list_summary: 'Bowlax cover · Devon · Covered'
      };
      sbRestRpc = async function(name){
        if(name === 'admin_get_remi_receipt')return {ok: true, data: {success: true, receipt: cover}};
        if(name === 'admin_list_remi_receipts')return {ok: true, data: {success: true, receipts: [cover]}};
        return {ok: true, data: {success: true, receipts: []}};
      };
      await remiProof1Open(demoId);
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var main = document.querySelector('#adminScreen .main-content').getBoundingClientRect();
      return {
        text: document.getElementById('copilotBody').innerText,
        proofOn: document.getElementById('copilotTabProof').getAttribute('aria-selected'),
        sheetLeft: sheet.left,
        sheetWidth: sheet.width,
        mainLeft: main.left,
        viewW: window.innerWidth
      };
    }, demo);
    assert.strictEqual(wide.proofOn, 'true');
    assert.strictEqual(wide.viewW, 1280);
    assert.ok(wide.text.indexOf('Coverage receipt') >= 0, wide.text);
    assert.ok(wide.sheetWidth < 520 && wide.sheetWidth > 300, 'desktop rail width ' + wide.sheetWidth);
    assert.ok(wide.sheetLeft > wide.viewW * 0.5, 'rail stays on the right ' + wide.sheetLeft);
    assert.ok(wide.mainLeft < wide.sheetLeft, 'desk stays beside the rail');
    await desk.screenshot({path: path.join(shotDir, 'remi-proof1-desktop-rail.png')});
    console.log('admin-remi-proof1 browser ok');
  } finally {
    await browser.close();
    server.close();
  }
}
