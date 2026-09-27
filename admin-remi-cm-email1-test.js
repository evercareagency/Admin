#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-cm-email1'), 'remi-cm-email1 marker');
assert.ok(html.includes('v=remiface1'), 'remiface1 marker');
assert.ok(html.includes('data-remi-cm-email1="v=remi-cm-email1"'), 'remi-cm-email1 data attr');
assert.ok(html.includes('data-remiface1="v=remiface1"'), 'remiface1 data attr');
assert.ok(html.includes('<!-- remi cm email 2026-09-27 v=remi-cm-email1 admin-build 2026-09-27-remi-cm-email1'), 'remi-cm-email1 comment');
assert.ok(html.includes('<!-- remi face 2026-09-27 v=remiface1 admin-build 2026-09-27-remiface1'), 'remiface1 comment');
assert.ok(html.includes("var REMI_CM_EMAIL1_MARKER='v=remi-cm-email1'"), 'remi-cm-email1 script marker');
assert.ok(html.includes("var REMIFACE1_MARKER='v=remiface1'"), 'remiface1 script marker');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-remi-cm-email1'), 'first admin-build is remi-cm-email1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remiface1">'), 'remiface1 meta');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-coverage-simple1">'), 'coverage-simple1 meta stays');
assert.ok(html.includes('v=coverage-simple1'), 'coverage-simple1 marker stays');
['v=clienthrs1c','v=shift-slim1','v=remi-notes1','v=eca-copilot1','v=covercomms1','v=remi1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('admin_get_cover_refuse_template'), 'refuse get stays');
assert.ok(html.includes('admin_save_cover_refuse_template'), 'refuse save stays');
assert.ok(html.includes('admin_preview_cover_refuse_email'), 'refuse preview stays');
assert.ok(html.includes('admin_get_cover_client_skip_template'), 'skip get stays');
assert.ok(html.includes('admin_save_cover_client_skip_template'), 'skip save stays');
assert.ok(html.includes('admin_preview_cover_client_skip_email'), 'skip preview stays');
assert.ok(!/admin_save_cm_email|admin_cm_email_template|cm_email_templates/.test(html), 'no parallel CM email RPC or table');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('assets/remi-locked.png?v=remiface1'), 'locked face is wired');
assert.ok(!html.includes('remi-corner-chip.png'), 'old glow chip is not wired');
assert.ok(fs.existsSync(path.join(__dirname, 'assets/remi-locked.png')), 'locked png is in the repo');
assert.ok(html.includes("code:'personal'") && html.includes("code:'doctor'") && html.includes("code:'not_feeling_well'") && html.includes("reasonCode:'other'"), 'reason codes');
assert.ok(html.includes('{{greeting}}') && html.includes('{{case_manager}}') && html.includes('{{client}}') && html.includes('{{date}}') && html.includes('{{reason}}'), 'placeholders');
assert.ok(html.includes('No Auth reseal'), 'no auth reseal');
const nurseAt = html.indexOf('id="nurseScreen"');
const nurseHtml = html.slice(nurseAt, html.indexOf('id="isResultsModal"'));
assert.ok(!nurseHtml.includes('remi-locked.png') && !nurseHtml.includes('remi-rail-face'), 'Nurse screen has no Remi face');
const cmJs = html.slice(html.indexOf('// v=remi-cm-email1 side-rail CM email'), html.indexOf('function remiSecAnswer(q)'));
assert.ok(cmJs.includes("coverRpc('skipPreview'"), 'declined service uses skip preview');
assert.ok(cmJs.includes("coverRpc('preview'"), 'declined backup uses refuse preview');
assert.ok(cmJs.includes("coverRpc('tplSave'"), 'backup save uses refuse template');
assert.ok(cmJs.includes("coverRpc('skipSave'"), 'service save uses skip template');
assert.ok(cmJs.includes('coverMailHref'), 'send is mailto');
assert.ok(!/admin_record_client_skip|admin_cover_outcome|gmail\.googleapis/.test(cmJs), 'draft does not record an outcome or call Gmail');

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
    console.log('admin-remi-cm-email1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_SHOTS || '/opt/cursor/artifacts';
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
    page.on('pageerror', function(err){throw err;});
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-cm-email1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'jasmine@evercare.test';
      allClients = [{
        id:'c-bowlax',
        name:'Bowlax',
        case_manager_name:'Patricia Hayes',
        case_manager_email:'patricia.hayes@countyhealth.org'
      }];
      coverShifts = [{
        id:'18acd525-1111-4111-8111-111111111111',
        clientId:'c-bowlax',
        clientName:'Bowlax',
        caseManagerName:'Patricia Hayes',
        caseManagerEmail:'patricia.hayes@countyhealth.org',
        startsAt:'2026-09-25T13:00:00.000Z',
        endsAt:'2026-09-25T21:00:00.000Z',
        status:'open',
        source:'ace'
      }];
      window.__cmRpc = [];
      var orig = coverRpc;
      coverRpc = async function(kind, body){
        window.__cmRpc.push({kind:kind, body:body||{}});
        if(kind==='skipPreview'){
          return {ok:true, data:{subject:'Services not delivered today — {{client}} ({{date}})', body:COVER_CM_SKIP_DEFAULT, case_manager_email:'patricia.hayes@countyhealth.org'}};
        }
        if(kind==='preview' || kind==='tplGet' || kind==='skipGet'){
          var bodyTpl = (kind==='skipGet') ? COVER_CM_SKIP_DEFAULT : COVER_CM_DEFAULT;
          return {ok:true, data:{subject:'Services not delivered today — {{client}} ({{date}})', body:bodyTpl}};
        }
        if(kind==='skipSave' || kind==='tplSave')return {ok:true, data:{success:true}};
        return orig(kind, body);
      };
      window.__mail = [];
      coverGo = function(href){window.__mail.push(String(href||''));};
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('schedule');
    });
    await page.waitForSelector('#copilotFab .remi-chip-face', {visible:true});
    const chip = await page.evaluate(function(){
      var img = document.querySelector('#copilotFab .remi-chip-face');
      var sheet = document.getElementById('copilotSheet');
      var r = img.getBoundingClientRect();
      return {
        src: img.getAttribute('src'),
        w: r.width,
        h: r.height,
        natural: img.naturalWidth,
        sheetHidden: sheet.hidden,
        fullPage: !!document.getElementById('tab_remi')
      };
    });
    assert.ok(chip.src.indexOf('remi-locked.png?v=remiface1') >= 0, chip.src);
    assert.ok(chip.natural >= 64, 'face image loaded');
    assert.strictEqual(chip.sheetHidden, true, 'sheet stays closed until opened');
    assert.strictEqual(chip.fullPage, false, 'no full-page Remi');
    assert.ok(chip.w >= 44 && chip.h >= 44, 'chip tap target');
    await page.screenshot({path: path.join(shotDir, 'remiface1-phone-chip.png')});

    await page.click('#copilotFab');
    await page.click('#copilotTabAsk');
    await page.waitForSelector('.remi-rail-face', {visible:true});
    const rail = await page.evaluate(function(){
      var img = document.querySelector('#copilotSheet .remi-rail-face');
      var sheet = document.getElementById('copilotSheet');
      var sub = document.querySelector('.remi-rail-sub');
      var r = sheet.getBoundingClientRect();
      return {
        src: img.getAttribute('src'),
        sub: sub.textContent,
        sheetW: r.width,
        viewW: window.innerWidth,
        hidden: sheet.hidden
      };
    });
    assert.ok(rail.src.indexOf('remi-locked.png') >= 0, rail.src);
    assert.ok(/Side rail/.test(rail.sub), rail.sub);
    assert.strictEqual(rail.hidden, false);
    await page.screenshot({path: path.join(shotDir, 'remiface1-phone-rail.png')});

    await page.evaluate(function(){
      document.getElementById('copilotChatInput').value = 'draft email for Bowlax';
      copilotChatSubmit({preventDefault:function(){}});
    });
    await page.waitForSelector('[data-remi-cm="service"]', {visible:true});
    const picker = await page.evaluate(function(){
      var text = document.getElementById('copilotBody').innerText;
      return {
        text: text,
        service: !!document.querySelector('[data-remi-cm="service"]'),
        backup: !!document.querySelector('[data-remi-cm="backup"]'),
        other: !!document.querySelector('[data-remi-cm="other"]'),
        marker: document.querySelector('[data-remi-cm-email1]').getAttribute('data-remi-cm-email1')
      };
    });
    assert.strictEqual(picker.marker, 'v=remi-cm-email1');
    assert.ok(picker.service && picker.backup && picker.other, 'three chips');
    assert.ok(/Bowlax/.test(picker.text) && /Patricia Hayes/.test(picker.text), picker.text);
    assert.ok(/from client record/.test(picker.text), picker.text);
    await page.screenshot({path: path.join(shotDir, 'remi-cm-email1-phone-picker.png')});

    await page.click('[data-remi-cm="service"]');
    await page.waitForSelector('[data-reason-code="doctor"]', {visible:true});
    const reasons = await page.evaluate(function(){
      return Array.prototype.map.call(document.querySelectorAll('[data-reason-code]'), function(el){
        return el.getAttribute('data-reason-code');
      });
    });
    assert.deepStrictEqual(reasons, ['personal','doctor','not_feeling_well']);
    await page.click('[data-reason-code="doctor"]');
    await page.waitForFunction(function(){
      return document.querySelector('.remi-cm-card') && /a doctor appointment/.test(document.getElementById('copilotBody').innerText);
    }, {timeout:8000});
    const service = await page.evaluate(function(){
      var text = document.getElementById('copilotBody').innerText;
      var card = document.querySelector('.remi-cm-card');
      var send = document.querySelector('.remi-cm-send');
      var calls = window.__cmRpc.filter(function(r){return r.kind==='skipPreview';});
      var body = calls.length ? calls[calls.length-1].body : {};
      var first = (text.split('Body')[1] || '').split('\n').map(function(l){return l.trim();}).filter(Boolean)[0] || '';
      return {
        text: text,
        family: card.getAttribute('data-family'),
        code: card.getAttribute('data-reason-code'),
        sendDisabled: send.disabled,
        preview: body,
        first: first,
        h: send.getBoundingClientRect().height
      };
    });
    assert.strictEqual(service.family, 'skip');
    assert.strictEqual(service.code, 'doctor');
    assert.strictEqual(service.preview.p_client_name, 'Bowlax');
    assert.strictEqual(service.preview.p_case_manager_name, 'Patricia Hayes');
    assert.strictEqual(service.preview.p_reason_label, 'a doctor appointment');
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(service.preview.p_service_date), service.preview.p_service_date);
    assert.ok(/09\/25\/2026|09\/24\/2026|09\/26\/2026/.test(service.text), service.text);
    assert.ok(/Good (morning|afternoon|evening)/.test(service.first), service.first);
    assert.ok(service.first.indexOf('Patricia') < 0, 'greeting has no case manager name: '+service.first);
    assert.strictEqual(service.sendDisabled, false, 'mailto send is available when email is on file');
    assert.ok(service.h >= 44, 'send tap '+service.h);
    await page.screenshot({path: path.join(shotDir, 'remi-cm-email1-phone-service.png')});

    await page.click('.remi-cm-actions .btn.btn-ghost');
    await page.waitForSelector('#remiCmSubject', {visible:true});
    await page.screenshot({path: path.join(shotDir, 'remi-cm-email1-phone-edit.png')});
    await page.evaluate(function(){remiCmSave(copilotChat.length-1);});
    await page.waitForFunction(function(){
      return /Saved as my template/.test(document.getElementById('copilotBody').innerText);
    });
    const saved = await page.evaluate(function(){
      var calls = window.__cmRpc.filter(function(r){return r.kind==='skipSave';});
      return calls.length ? calls[calls.length-1].body : null;
    });
    assert.ok(saved && /\{\{client\}\}/.test(saved.p_body) && /\{\{greeting\}\}/.test(saved.p_body) && /\{\{reason\}\}/.test(saved.p_body), JSON.stringify(saved));
    assert.ok(/\{\{date\}\}/.test(saved.p_subject), saved.p_subject);

    await page.evaluate(function(){remiCmCopy(copilotChat.length-1);});
    await page.evaluate(function(){remiCmSend(copilotChat.length-1);});
    const mail = await page.evaluate(function(){return window.__mail.slice();});
    assert.ok(mail.length && mail[0].indexOf('mailto:patricia.hayes@countyhealth.org') === 0, mail.join('|'));

    await page.evaluate(function(){
      copilotChat = [];
      document.getElementById('copilotChatInput').value = 'draft email for Bowlax';
      copilotChatSubmit({preventDefault:function(){}});
    });
    await page.waitForSelector('[data-remi-cm="backup"]', {visible:true});
    await page.click('[data-remi-cm="backup"]');
    await page.waitForFunction(function(){
      var card = document.querySelector('.remi-cm-card');
      return card && card.getAttribute('data-family')==='refuse' && /permanent aide called off/.test(document.getElementById('copilotBody').innerText);
    }, {timeout:8000});
    const backup = await page.evaluate(function(){
      var calls = window.__cmRpc.filter(function(r){return r.kind==='preview';});
      return {n:calls.length, id:calls.length?calls[calls.length-1].body.p_open_shift_id:''};
    });
    assert.ok(backup.n >= 1, 'refuse preview called');
    assert.ok(String(backup.id).indexOf('18acd525') === 0, backup.id);
    await page.screenshot({path: path.join(shotDir, 'remi-cm-email1-phone-backup.png')});
    await page.evaluate(function(){remiCmSave(copilotChat.length-1);});
    await page.waitForFunction(function(){
      return window.__cmRpc.some(function(r){return r.kind==='tplSave';});
    });

    await page.evaluate(function(){
      copilotChat = [];
      document.getElementById('copilotChatInput').value = 'draft email for Bowlax';
      copilotChatSubmit({preventDefault:function(){}});
    });
    await page.waitForSelector('[data-remi-cm="other"]', {visible:true});
    await page.click('[data-remi-cm="other"]');
    await page.waitForSelector('#remiCmOther', {visible:true});
    await page.type('#remiCmOther', 'family visiting from out of town — prefers no aide today');
    await page.screenshot({path: path.join(shotDir, 'remi-cm-email1-phone-other.png')});
    await page.click('.remi-cm-actions .btn.btn-teal');
    await page.waitForFunction(function(){
      return /prefers no aide today/.test(document.getElementById('copilotBody').innerText) && document.querySelector('.remi-cm-card');
    }, {timeout:8000});
    const other = await page.evaluate(function(){
      var calls = window.__cmRpc.filter(function(r){return r.kind==='skipPreview';});
      var last = calls[calls.length-1];
      return {label:last&&last.body.p_reason_label, code:document.querySelector('.remi-cm-card').getAttribute('data-reason-code')};
    });
    assert.strictEqual(other.code, 'other');
    assert.ok(/prefers no aide today/.test(other.label), other.label);

    const deskPage = await browser.newPage();
    await deskPage.setViewport({width:1280, height:800, isMobile:false, hasTouch:false, deviceScaleFactor:1});
    await deskPage.goto('http://127.0.0.1:'+port+'/index.html?v=remi-cm-email1', {waitUntil:'domcontentloaded', timeout:20000});
    await deskPage.evaluate(function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'jasmine@evercare.test';
      allClients = [{
        id:'c-bowlax',
        name:'Bowlax',
        case_manager_name:'Patricia Hayes',
        case_manager_email:'patricia.hayes@countyhealth.org'
      }];
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('schedule');
      var sheet = document.getElementById('copilotSheet');
      sheet.hidden = false;
      copilotShowChat();
      document.getElementById('copilotChatInput').value = 'draft email for Bowlax';
      copilotChatSubmit({preventDefault:function(){}});
    });
    await deskPage.waitForSelector('[data-remi-cm="service"]', {visible:true});
    const desk = await deskPage.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var r = sheet.getBoundingClientRect();
      var img = document.querySelector('#copilotFab .remi-chip-face');
      var rail = document.querySelector('#copilotSheet .remi-rail-face');
      return {
        left: r.left,
        width: r.width,
        viewW: window.innerWidth,
        src: img.getAttribute('src'),
        rail: rail.getAttribute('src'),
        schedule: document.getElementById('tab_schedule').classList.contains('active')
      };
    });
    assert.ok(desk.width >= 280 && desk.width <= 480, 'desktop Remi is a rail '+desk.width+' of '+desk.viewW);
    assert.ok(desk.left > desk.viewW * 0.5, 'rail sits on the right '+desk.left);
    assert.ok(desk.schedule, 'schedule stays up behind the rail');
    assert.ok(desk.src.indexOf('remi-locked.png') >= 0, desk.src);
    assert.ok(desk.rail.indexOf('remi-locked.png') >= 0, desk.rail);
    await deskPage.screenshot({path: path.join(shotDir, 'remi-cm-email1-desktop-rail.png')});
    await deskPage.screenshot({path: path.join(shotDir, 'remiface1-desktop-chip-rail.png')});
    await deskPage.close();
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remi-cm-email1-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
