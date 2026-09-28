#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-rules1'), 'remi-rules1 marker');
assert.ok(html.includes('data-remi-rules1="v=remi-rules1"'), 'remi-rules1 data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-rules1'), 'remi-rules1 build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-rules1">'), 'remi-rules1 meta');
assert.ok(html.includes('<!-- remi rules 2026-09-27 v=remi-rules1 admin-build 2026-09-27-remi-rules1'), 'remi-rules1 comment');
assert.ok(html.includes("var REMI_RULES1_MARKER='v=remi-rules1'"), 'remi-rules1 script marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-aide-notif-search1'), 'first admin-build is remi-proof1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after remi-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-proof1"') < html.indexOf('content="2026-09-27-remi-sched1"'), 'sched meta follows proof');
assert.ok(html.indexOf('content="2026-09-27-remi-sched1"') < html.indexOf('content="2026-09-27-remi-rules1"'), 'this meta is under sched');
assert.ok(html.indexOf('content="2026-09-27-remi-rules1"') < html.indexOf('content="2026-09-27-remi-notes-vis1"'), 'notes vis stays after rules');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-vapid1">'), 'vapid1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-cm-email1">'), 'remi-cm-email1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remiface1">'), 'remiface1 meta stays');
['v=remi-notes-vis1','v=remi-sched1','v=vapid1','v=clienthrs1d','v=remi-cm-email1','v=remiface1','v=remi-notes1','v=coverage-simple1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'marker stays ' + mark);
});
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="copilotTabRules"'), 'Rules tab in the rail');
assert.ok(html.includes('id="copilotTabRadar"') && html.includes('id="copilotTabAsk"') && html.includes('id="copilotTabNotes"'), 'Radar Ask Notes stay');

const start = html.indexOf('// remi rules1 v=remi-rules1');
const end = html.indexOf('// end remi rules1 v=remi-rules1');
assert.ok(start > 0 && end > start, 'rules script block');
const src = html.slice(start, end);
assert.ok(src.includes('admin_list_remi_rules'), 'list rpc');
assert.ok(src.includes('admin_create_remi_rule'), 'create rpc');
assert.ok(src.includes('admin_update_remi_rule'), 'update rpc');
assert.ok(src.includes('admin_list_active_remi_rules'), 'active rpc');
assert.ok(src.includes('is_scheduler_office'), 'is_scheduler_office path');
assert.ok(src.includes('sbRestRpc'), 'office JWT via sbRestRpc');
assert.ok(src.includes('Using rule: '), 'chip falls back to saved title');
assert.ok(!src.includes('Bowlax'), 'Bowlax is not invented in the rail');
assert.ok(!/delete_remi_rule|admin_delete_remi_rule/.test(src), 'toggle prefers is_on');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier/.test(src), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|send_sms/.test(src), 'no Quo or SMS');
assert.ok(src.includes('Nurse cannot use Remi rules'), 'nurse refused');

const FIX = [
  {id:'r1', title:'Bowlax cover order', body:'Always try Maria first, then Devon, then open blast.', is_on:true, sort_order:10, chip_label:'Using rule: Bowlax cover order'},
  {id:'r2', title:'Quiet hours', body:"Don't nudge aides after 9:00 PM ET.", is_on:true, sort_order:20, chip_label:'Using rule: Quiet hours'},
  {id:'r3', title:'Devon preference', body:'Messages only — no phone ping for coverage.', is_on:false, sort_order:30, chip_label:'Using rule: Devon preference'}
];

function runSlice(){
  const sandbox = {currentAdminRole:'Admin', copilotView:'rules', console:console};
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox;
}

(async function unit(){
  const sandbox = runSlice();
  assert.strictEqual(sandbox.REMI_RULES1_MARKER, 'v=remi-rules1');
  const chips = Array.from(sandbox.remiRules1ChipsFrom(FIX));
  assert.deepStrictEqual(chips, ['Using rule: Bowlax cover order', 'Using rule: Quiet hours']);
  assert.ok(chips.join(' ').indexOf('Devon') < 0, 'off rules stay off the chip');
  const titled = Array.from(sandbox.remiRules1ChipsFrom([{id:'r9', title:'Skip vacation aides', body:'Skip them.', is_on:true}]));
  assert.deepStrictEqual(titled, ['Using rule: Skip vacation aides']);
  assert.deepStrictEqual(Array.from(sandbox.remiRules1ChipsFrom([])), []);
  assert.strictEqual(sandbox.remiRules1IsCoverContext('Maria called off Bowlax tomorrow 9–1.', {}), true);
  assert.strictEqual(sandbox.remiRules1IsCoverContext('who can cover Bowlax', {kind:'coverage_open'}), true);
  assert.strictEqual(sandbox.remiRules1IsCoverContext('tell me a joke about the weather', {}), false);
  assert.strictEqual(sandbox.remiRules1IsCoverContext('every Monday at 9 give me the missing hours report', {}), false);

  const host = {innerHTML:''};
  sandbox.document = {getElementById:function(id){
    if(id==='copilotBody')return host;
    if(id==='copilotTitle')return {textContent:''};
    if(id==='copilotSheet')return {hidden:true};
    return null;
  }};
  sandbox.copilotSyncTabs = function(){};
  sandbox.copilotHideConfirm = function(){};
  sandbox.remiRules1Cache = FIX.slice();
  sandbox.remiRules1Mode = 'list';
  sandbox.remiRules1Error = '';
  sandbox.remiRules1Paint();
  assert.ok(host.innerHTML.indexOf('Bowlax cover order') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Quiet hours') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('Devon preference') >= 0, 'off rules still list');
  assert.ok(host.innerHTML.indexOf('>On<') >= 0 && host.innerHTML.indexOf('>Off<') >= 0, host.innerHTML);
  assert.ok(host.innerHTML.indexOf('+ Add rule') >= 0, host.innerHTML);
  assert.strictEqual(sandbox.copilotView, 'rules');

  const rpc = [];
  sandbox.sbRestRpc = async function(name, body){
    rpc.push({name:name, body:body});
    if(name==='admin_create_remi_rule'){
      return {ok:true, data:{success:true, marker:'remi-rules1', rule:{id:'r4', title:body.p_title, body:body.p_body, is_on:true, chip_label:'Using rule: '+body.p_title}}};
    }
    if(name==='admin_update_remi_rule'){
      return {ok:true, data:{success:true, rule:{id:body.p_id, title:body.p_title||'Bowlax cover order', body:body.p_body||'', is_on:body.p_is_on}}};
    }
    if(name==='admin_list_remi_rules')return {ok:true, data:{success:true, rules:FIX}};
    if(name==='admin_list_active_remi_rules')return {ok:true, data:{success:true, rules:FIX.filter(function(r){return r.is_on;})}};
    return {ok:false, error:'unexpected '+name};
  };
  sandbox.document = {getElementById:function(id){
    if(id==='copilotBody')return host;
    if(id==='copilotTitle')return {textContent:''};
    if(id==='remiRules1Title')return {value:'Skip vacation aides'};
    if(id==='remiRules1Body')return {value:'When blasting coverage, skip anyone marked On vacation.'};
    return null;
  }};
  sandbox.remiRules1Mode = 'add';
  const created = await sandbox.remiRules1Save();
  assert.strictEqual(created.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_create_remi_rule');
  assert.strictEqual(rpc[0].body.p_title, 'Skip vacation aides');
  assert.strictEqual(rpc[0].body.p_body, 'When blasting coverage, skip anyone marked On vacation.');
  assert.strictEqual(rpc[0].body.p_is_on, true);
  assert.strictEqual(rpc[1].name, 'admin_list_remi_rules');

  rpc.length = 0;
  const toggled = await sandbox.remiRules1Toggle('r1', true);
  assert.strictEqual(toggled.ok, true);
  assert.strictEqual(rpc[0].name, 'admin_update_remi_rule');
  assert.strictEqual(rpc[0].body.p_id, 'r1');
  assert.strictEqual(rpc[0].body.p_is_on, false);
  assert.ok(rpc[0].body.p_title == null && rpc[0].body.p_body == null, 'toggle sends is_on only');

  rpc.length = 0;
  sandbox.remiRules1Mode = 'edit';
  sandbox.remiRules1EditId = 'r2';
  sandbox.remiRules1Cache = FIX.slice();
  sandbox.document.getElementById = function(id){
    if(id==='copilotBody')return host;
    if(id==='copilotTitle')return {textContent:''};
    if(id==='remiRules1Title')return {value:'Quiet hours'};
    if(id==='remiRules1Body')return {value:'Do not nudge aides after 9:00 PM ET.'};
    return null;
  };
  const edited = await sandbox.remiRules1Save();
  assert.strictEqual(edited.ok, true);
  assert.strictEqual(rpc[0].body.p_id, 'r2');
  assert.strictEqual(rpc[0].body.p_title, 'Quiet hours');
  assert.strictEqual(rpc[0].body.p_body, 'Do not nudge aides after 9:00 PM ET.');
  assert.ok(!Object.prototype.hasOwnProperty.call(rpc[0].body, 'p_is_on'), 'edit does not force the toggle');

  sandbox.currentAdminRole = 'Nurse';
  rpc.length = 0;
  const nurse = await sandbox.remiRules1Rpc('admin_create_remi_rule', {p_title:'Joke', p_body:'not a rule', p_is_on:true});
  assert.strictEqual(nurse.forbidden, true);
  assert.strictEqual(rpc.length, 0);

  sandbox.currentAdminRole = 'Admin';
  sandbox.copilotChat = [{role:'mo', text:'Maria called off Bowlax tomorrow.'}, {role:'remi', text:'Got it.', ruleContext:true, kind:'coverage_open', sec:true, actions:[]}];
  sandbox.copilotView = 'chat';
  sandbox.copilotPaintChat = function(){sandbox.painted = sandbox.remiRules1ChipsHtml(sandbox.copilotChat[1].ruleChips);};
  await sandbox.remiRules1LoadChips(1);
  assert.strictEqual(sandbox.copilotChat[1].ruleChips.length, 2);
  assert.ok(sandbox.painted.indexOf('Using rule: Bowlax cover order') >= 0, sandbox.painted);
  assert.ok(sandbox.painted.indexOf('Devon preference') < 0, sandbox.painted);
  console.log('admin-remi-rules1 unit ok');
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
    console.log('admin-remi-rules1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_PACK_SHOTS || '/opt/cursor/artifacts';
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
        role:'Admin', username:'mo@evercare.test', name:'Mo', loginAt:Date.now()
      }));
    });
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-rules1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.waitForSelector('#copilotFab', {timeout:10000});
    await page.evaluate(async function(){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      window.__rules = [
        {id:'r1', title:'Bowlax cover order', body:'Always try Maria first, then Devon, then open blast.', is_on:true, sort_order:10, chip_label:'Using rule: Bowlax cover order'},
        {id:'r2', title:'Quiet hours', body:"Don't nudge aides after 9:00 PM ET.", is_on:true, sort_order:20, chip_label:'Using rule: Quiet hours'},
        {id:'r3', title:'Devon preference', body:'Messages only — no phone ping for coverage.', is_on:true, sort_order:30, chip_label:'Using rule: Devon preference'}
      ];
      window.__rpc = [];
      sbRestRpc = async function(name, body){
        window.__rpc.push({name:name, body:body});
        if(name==='admin_list_remi_rules')return {ok:true, data:{success:true, rules:window.__rules}};
        if(name==='admin_list_active_remi_rules')return {ok:true, data:{success:true, rules:window.__rules.filter(function(r){return r.is_on!==false;})}};
        if(name==='admin_create_remi_rule'){
          var row = {id:'r4', title:body.p_title, body:body.p_body, is_on:true, sort_order:40, chip_label:'Using rule: '+body.p_title};
          window.__rules.push(row);
          return {ok:true, data:{success:true, rule:row}};
        }
        if(name==='admin_update_remi_rule'){
          window.__rules.forEach(function(r){
            if(String(r.id)!==String(body.p_id))return;
            if(body.p_is_on!=null)r.is_on = body.p_is_on;
            if(body.p_title!=null)r.title = body.p_title;
            if(body.p_body!=null)r.body = body.p_body;
          });
          return {ok:true, data:{success:true}};
        }
        return {ok:false, error:'unexpected '+name};
      };
      remiRules1Show();
      await remiRules1Load();
    });
    const view = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var box = sheet.getBoundingClientRect();
      var add = document.getElementById('remiRules1Add');
      return {
        text:document.getElementById('copilotBody').innerText,
        selected:document.getElementById('copilotTabRules').getAttribute('aria-selected'),
        viewW:window.innerWidth,
        sheetTop:box.top,
        sheetWidth:box.width,
        overflow:sheet.scrollWidth <= sheet.clientWidth + 2,
        addH:add ? add.getBoundingClientRect().height : 0
      };
    });
    assert.strictEqual(view.viewW, 390);
    assert.strictEqual(view.selected, 'true');
    assert.ok(view.sheetTop >= 60, 'rail sheet '+view.sheetTop);
    assert.ok(view.sheetWidth <= view.viewW + 1);
    assert.strictEqual(view.overflow, true);
    assert.ok(view.addH >= 44, 'add rule tap '+view.addH);
    assert.ok(view.text.indexOf('Bowlax cover order') >= 0, view.text);
    assert.ok(view.text.indexOf('Quiet hours') >= 0, view.text);
    assert.ok(view.text.indexOf('Devon preference') >= 0, view.text);
    assert.ok(view.text.indexOf('+ Add rule') >= 0, view.text);
    await page.screenshot({path:path.join(shotDir, 'remi-rules1-phone-list.png')});

    await page.click('#remiRules1Add');
    await page.waitForSelector('#remiRules1Title');
    await page.type('#remiRules1Title', 'Skip vacation aides');
    await page.type('#remiRules1Body', 'When blasting coverage, skip anyone marked On vacation.');
    await page.click('#remiRules1Save');
    await page.waitForFunction(function(){return document.body.innerText.indexOf('Skip vacation aides') >= 0;});
    const created = await page.evaluate(function(){
      for(var i=0;i<window.__rpc.length;i++)if(window.__rpc[i].name==='admin_create_remi_rule')return window.__rpc[i].body;
      return null;
    });
    assert.ok(created && created.p_title === 'Skip vacation aides', JSON.stringify(created));
    assert.strictEqual(created.p_is_on, true);

    await page.evaluate(function(){return remiRules1Toggle('r1', true);});
    const toggled = await page.evaluate(function(){
      for(var i=window.__rpc.length-1;i>=0;i--)if(window.__rpc[i].name==='admin_update_remi_rule' && window.__rpc[i].body.p_id==='r1')return window.__rpc[i].body;
      return null;
    });
    assert.ok(toggled && toggled.p_is_on === false, JSON.stringify(toggled));

    await page.evaluate(async function(){
      copilotShowChat();
      document.getElementById('copilotChatInput').value = 'Maria called off Bowlax tomorrow 9–1.';
      copilotChatSubmit({preventDefault:function(){}});
      await remiRules1LoadChips(copilotChat.length-1);
    });
    const chip = await page.evaluate(function(){
      return document.getElementById('copilotBody').innerText;
    });
    assert.ok(chip.indexOf('Using rule: Quiet hours') >= 0, chip);
    assert.ok(chip.indexOf('Using rule: Skip vacation aides') >= 0, chip);
    assert.ok(chip.indexOf('Using rule: Bowlax cover order') < 0, 'off rules stay off the chip '+chip);

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
        role:'Admin', username:'mo@evercare.test', name:'Mo', loginAt:Date.now()
      }));
    });
    await desk.goto('http://127.0.0.1:'+port+'/index.html?v=remi-rules1', {waitUntil:'domcontentloaded', timeout:20000});
    await desk.waitForSelector('#copilotFab', {timeout:10000});
    const wide = await desk.evaluate(async function(){
      currentAdminRole = 'Admin';
      if(typeof showScreen === 'function')showScreen('adminScreen');
      window.__rules = [
        {id:'r1', title:'Bowlax cover order', body:'Always try Maria first, then Devon, then open blast.', is_on:true, sort_order:10, chip_label:'Using rule: Bowlax cover order'}
      ];
      sbRestRpc = async function(name){
        if(name==='admin_list_remi_rules')return {ok:true, data:{success:true, rules:window.__rules}};
        return {ok:true, data:{success:true, rules:[]}};
      };
      remiRules1Show();
      await remiRules1Load();
      var sheet = document.getElementById('copilotSheet').getBoundingClientRect();
      var main = document.querySelector('#adminScreen .main-content').getBoundingClientRect();
      var tabs = ['copilotTabRadar','copilotTabAsk','copilotTabNotes','copilotTabRules','copilotTabSched','copilotTabProof'].map(function(id){
        var el = document.getElementById(id);
        return el ? el.textContent : '';
      });
      return {
        tabs:tabs,
        rulesOn:document.getElementById('copilotTabRules').getAttribute('aria-selected'),
        sheetLeft:sheet.left,
        sheetWidth:sheet.width,
        mainLeft:main.left,
        viewW:window.innerWidth
      };
    });
    assert.deepStrictEqual(wide.tabs, ['Radar','Ask','Notes','Rules','Scheduled','Receipts']);
    assert.strictEqual(wide.rulesOn, 'true');
    assert.strictEqual(wide.viewW, 1280);
    assert.ok(wide.sheetWidth < 520 && wide.sheetWidth > 300, 'desktop rail width '+wide.sheetWidth);
    assert.ok(wide.sheetLeft > wide.viewW * 0.5, 'rail stays on the right '+wide.sheetLeft);
    assert.ok(wide.mainLeft < wide.sheetLeft, 'desk stays beside the rail');
    await desk.screenshot({path:path.join(shotDir, 'remi-pack-desktop-rail.png')});
    console.log('admin-remi-rules1 browser ok');
  } finally {
    await browser.close();
    server.close();
  }
}
