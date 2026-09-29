#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

assert.ok(html.includes('v=msg-composer-rect1'), 'msg-composer-rect1 marker');
assert.ok(html.includes('?v=msg-composer-rect1'), 'cache bust query');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-msg-composer-rect1">'), 'admin-build meta');
assert.ok(html.includes("var MSG_COMPOSER_RECT1_MARKER='v=msg-composer-rect1'"), 'script marker');
assert.ok(html.includes("var MSG_COMPOSER_RECT1_BUILD='2026-09-29-msg-composer-rect1'"), 'script build');
assert.ok(html.includes('GHOST-MSG-COMPOSER-RECT1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'Ace NO CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes('Nurse stays out'), 'Nurse stays out');
assert.ok(html.includes('No Caregiver'), 'Caregiver stays out');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/msg-composer-rect1-v1.sql')), 'no SQL patch');

['v=msg-composer-kb4','v=msg-composer-kb3','v=aide-thread-header1','v=msg-composer-kb2','v=sched-creds1','v=care-msg-safe1','v=aides-info1','v=admin-sched-chat-push1','v=pages-cache-fresh1','v=loginkb1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-msg-composer-kb4">'), 'kb4 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-pages-cache-fresh1">'), 'pages-cache meta stays');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('without a sticky ?v='), 'Home Screen URL is not rewritten to a sticky ?v=');
assert.ok(html.includes('data-msg-composer-rect1="v=msg-composer-rect1"'), 'composer carries the marker');
assert.ok(html.includes('placeholder="Ask or just chat..."'), 'Ask placeholder stays');
assert.ok(html.includes('border-radius:11px !important'), 'rectangular radius wins');
assert.ok(html.includes('flex:1 1 auto;min-width:0;width:auto;max-width:100%;min-height:44px;max-height:88px;border-radius:999px'), 'kb4 cause rule stays in the file');
assert.ok(html.includes('html.aidechat-kb #msgDensePanel'), 'panel releases the fixed composer');
assert.ok(html.includes('msgComposerRect1FlushBottom'), 'flush bottom helper');
assert.ok(html.includes('msgComposerRect1FlushHeight'), 'flush height helper');
assert.ok(html.includes("field.style.borderRadius='11px'"), 'keyboard lock paints 11px, not a 22px pill');

const fnStart = html.indexOf('function msgComposerRect1ZeroBottom()');
const fnEnd = html.indexOf('function careMsgSafe1PinAide()');
assert.ok(fnStart > 0 && fnEnd > fnStart, 'rect1 helpers sit ahead of the pin');
const sandbox = {
  document: {
    body: {appendChild: function(){}},
    getElementById: function(){return null;},
    createElement: function(){
      return {
        id: '',
        style: {},
        setAttribute: function(){},
        getBoundingClientRect: function(){return {bottom: sandbox.window.innerHeight};}
      };
    }
  },
  window: {innerHeight: 844},
  isFinite: isFinite,
  Math: Math,
  Number: Number
};
vm.createContext(sandbox);
vm.runInContext(html.slice(fnStart, fnEnd), sandbox);

(function layoutOffsetClosesGap(){
  sandbox.window.innerHeight = 844;
  sandbox.msgComposerRect1ZeroBottom = function(){return 844;};
  const desired = sandbox.msgComposerRect1DesiredBottom({height: 500, offsetTop: 80});
  assert.strictEqual(desired, 580, 'layout-fixed visual bottom includes offsetTop');
  const box = {bottom: 0};
  const el = {
    style: {
      set bottom(v){box.bottom = parseFloat(v) || 0;},
      get bottom(){return box.bottom + 'px';}
    },
    setAttribute: function(){},
    getBoundingClientRect: function(){
      const edge = 844 - box.bottom;
      return {top: edge - 60, bottom: edge, height: 60, width: 390};
    }
  };
  const landed = sandbox.msgComposerRect1FlushBottom(el, {height: 500, offsetTop: 80});
  const rect = el.getBoundingClientRect();
  assert.strictEqual(landed, 264, 'bottom lifts off a false zero when offsetTop leaves a gap');
  assert.ok(Math.abs(rect.bottom - 580) <= 1, 'composer border sits on the visual bottom ' + rect.bottom);
})();

(function visualFixedStaysPut(){
  sandbox.msgComposerRect1ZeroBottom = function(){return 500;};
  const desired = sandbox.msgComposerRect1DesiredBottom({height: 500, offsetTop: 80});
  assert.strictEqual(desired, 500, 'visual-fixed bottom:0 is already the chrome edge');
  const box = {bottom: 0};
  const el = {
    style: {
      set bottom(v){box.bottom = parseFloat(v) || 0;},
      get bottom(){return box.bottom + 'px';}
    },
    setAttribute: function(){},
    getBoundingClientRect: function(){
      const edge = 500 - box.bottom;
      return {top: edge - 60, bottom: edge, height: 60, width: 390};
    }
  };
  sandbox.msgComposerRect1FlushBottom(el, {height: 500, offsetTop: 80});
  assert.strictEqual(box.bottom, 0, 'an already flush visual dock is not lifted');
  assert.strictEqual(el.getBoundingClientRect().bottom, 500);
})();

(function sheetGrowsToChrome(){
  sandbox.msgComposerRect1ZeroBottom = function(){return 844;};
  const box = {height: 400};
  const sheet = {
    style: {
      set height(v){box.height = parseFloat(v) || box.height;},
      get height(){return box.height + 'px';},
      set maxHeight(v){box.max = v;},
      set bottom(v){box.bottom = v;},
      set marginBottom(v){box.marginBottom = v;},
      set paddingBottom(v){box.pad = v;},
      set top(v){box.top = v;}
    },
    setAttribute: function(){},
    getBoundingClientRect: function(){
      return {top: 0, bottom: box.height, height: box.height, width: 390};
    }
  };
  const delta = sandbox.msgComposerRect1FlushHeight(sheet, {height: 520, offsetTop: 0});
  assert.ok(Math.abs(delta) <= 1, 'sheet delta ' + delta);
  assert.strictEqual(box.height, 520, 'short sheet grows to the visual viewport');
  assert.strictEqual(box.pad, '0px', 'no padding band under the Ask composer');
})();

console.log('admin-msg-composer-rect1-test: unit ok');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function radiusPx(value){
  const parts = String(value || '').trim().split(/\s+/);
  const nums = parts.map(function(part){return parseFloat(part);}).filter(function(n){return isFinite(n);});
  if(!nums.length)return 999;
  return Math.max.apply(null, nums);
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-msg-composer-rect1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.RECT1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript', '.css':'text/css', '.txt':'text/plain'};
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
  const errors = [];
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await page.setViewport({width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
    await page.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 30000});
    const boot = await page.evaluate(function(){
      localStorage.clear();
      sessionStorage.clear();
      var metas = document.querySelectorAll('meta[name="admin-build"]');
      return {
        first: metas[0] ? metas[0].content : '',
        rect1: typeof MSG_COMPOSER_RECT1_BUILD === 'string' ? MSG_COMPOSER_RECT1_BUILD : '',
        fresh: document.querySelector('meta[name="pages-cache-fresh1"]') ? document.querySelector('meta[name="pages-cache-fresh1"]').content : ''
      };
    });
    assert.strictEqual(boot.first, '2026-09-27-remi-float-hide1b');
    assert.strictEqual(boot.rect1, '2026-09-29-msg-composer-rect1');
    assert.strictEqual(boot.fresh, '2026-09-29-pages-cache-fresh1');

    async function openThread(role){
      return page.evaluate(function(roleName){
        currentAdminRole = roleName;
        currentAdminUsername = roleName === 'Scheduler' ? 'jaz' : 'moe';
        if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
        if(typeof showScreen === 'function')showScreen('adminScreen');
        aidechatRefresh = async function(){return;};
        aidechatLoadSettings = async function(){return;};
        if(typeof clienthrs1dLoadNames === 'function')clienthrs1dLoadNames = function(){};
        if(typeof clienthrs1dKickDue === 'function')clienthrs1dKickDue = function(){};
        var id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
        var thread = aidechatMapThread({
          thread_id: 't-sara',
          aide_id: id,
          aide_username: 'sara.a',
          aide_name: 'Sara Alvarez',
          status: 'open',
          messages: [
            {id: 'm1', sender: 'aide', body: 'I can cover Sunday — confirm?', created_at: '2026-09-29T14:00:00Z'},
            {id: 'm2', sender: 'office', display_name: roleName === 'Scheduler' ? 'Jaz (Scheduler)' : 'Moe (Admin)', body: 'Yes — marking Covered. Thanks Sara.', created_at: '2026-09-29T14:01:00Z'}
          ]
        });
        aidechatThreads = [thread];
        aidechatSelectedId = thread.id;
        aidechatView = 'thread';
        showTab('aidechat');
        aidechatShow('thread');
        aidechatPaintThread();
        var reply = document.getElementById('aidechatReply');
        if(reply)reply.value = 'See you Sunday — start at 9.';
        return document.getElementById('aidechatComposer').getAttribute('data-msg-composer-rect1');
      }, role);
    }

    async function measure(){
      return page.evaluate(function(){
        careMsgSafe1ReadVv = function(){return {height: 520, offsetTop: 0, width: 390};};
        var reply = document.getElementById('aidechatReply');
        var send = document.getElementById('aidechatSend');
        var form = document.getElementById('aidechatComposer');
        reply.focus();
        careMsgSafe1PinAide();
        var replyCs = window.getComputedStyle(reply);
        var sendCs = window.getComputedStyle(send);
        var rr = reply.getBoundingClientRect();
        var sr = send.getBoundingClientRect();
        var fr = form.getBoundingClientRect();
        var view = careMsgSafe1ReadVv();
        var target = msgComposerRect1DesiredBottom(view);
        return {
          replyRadius: replyCs.borderRadius,
          sendRadius: sendCs.borderRadius,
          replyW: Math.round(rr.width),
          replyH: Math.round(rr.height),
          sendW: Math.round(sr.width),
          sendH: Math.round(sr.height),
          delta: Math.round(fr.bottom - target),
          marker: form.getAttribute('data-msg-composer-rect1'),
          roles: form.getAttribute('data-layout-roles'),
          kb: document.documentElement.classList.contains('aidechat-kb'),
          nav: window.getComputedStyle(document.getElementById('bottomNav')).display
        };
      });
    }

    assert.strictEqual(await openThread('Admin'), 'v=msg-composer-rect1');
    const admin = await measure();
    assert.strictEqual(admin.kb, true);
    assert.strictEqual(admin.nav, 'none');
    assert.strictEqual(admin.roles, 'Admin Scheduler');
    assert.ok(radiusPx(admin.replyRadius) <= 12 && radiusPx(admin.replyRadius) >= 10, 'Type radius ' + admin.replyRadius);
    assert.ok(radiusPx(admin.sendRadius) <= 12 && radiusPx(admin.sendRadius) >= 10, 'Send radius ' + admin.sendRadius);
    assert.ok(admin.replyH >= 44, 'Type min height ' + admin.replyH);
    assert.ok(admin.sendH >= 44, 'Send min height ' + admin.sendH);
    assert.ok(admin.replyW > admin.replyH * 2, 'Type is a wide rectangle ' + JSON.stringify(admin));
    assert.ok(admin.sendW > admin.sendH, 'Send is not a circle ' + JSON.stringify(admin));
    assert.ok(Math.abs(admin.delta) <= 2, 'composer flush ' + admin.delta);
    await page.screenshot({path: path.join(shotDir, 'msg-composer-rect1-admin.png')});

    await openThread('Scheduler');
    const sched = await measure();
    assert.strictEqual(sched.kb, true);
    assert.ok(radiusPx(sched.replyRadius) <= 12, sched.replyRadius);
    assert.ok(radiusPx(sched.sendRadius) <= 12, sched.sendRadius);
    assert.ok(sched.sendW > sched.sendH, 'Scheduler Send is not a circle');
    assert.ok(Math.abs(sched.delta) <= 2, 'Scheduler flush ' + sched.delta);
    await page.screenshot({path: path.join(shotDir, 'msg-composer-rect1-scheduler.png')});

    const ask = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var form = document.getElementById('copilotComposer');
      var input = document.getElementById('copilotChatInput');
      var send = document.getElementById('copilotChatSend');
      sheet.hidden = false;
      form.hidden = false;
      document.documentElement.classList.add('remi-ask-kb');
      if(document.body)document.body.classList.add('remi-ask-kb');
      sheet.style.top = '0px';
      sheet.style.height = '400px';
      sheet.style.maxHeight = '400px';
      msgComposerRect1FlushHeight(sheet, {height: 520, offsetTop: 0});
      var inputCs = window.getComputedStyle(input);
      var sendCs = window.getComputedStyle(send);
      var ir = input.getBoundingClientRect();
      var sr = send.getBoundingClientRect();
      var sheetRect = sheet.getBoundingClientRect();
      return {
        placeholder: input.getAttribute('placeholder'),
        label: (send.textContent || '').replace(/\s+/g, ''),
        marker: form.getAttribute('data-msg-composer-rect1'),
        inputRadius: inputCs.borderRadius,
        sendRadius: sendCs.borderRadius,
        inputH: Math.round(ir.height),
        sendH: Math.round(sr.height),
        sendW: Math.round(sr.width),
        inputW: Math.round(ir.width),
        sheetBottom: Math.round(sheetRect.bottom),
        sheetH: Math.round(sheetRect.height)
      };
    });
    assert.strictEqual(ask.placeholder, 'Ask or just chat...');
    assert.strictEqual(ask.label, 'Send');
    assert.strictEqual(ask.marker, 'v=msg-composer-rect1');
    assert.ok(radiusPx(ask.inputRadius) <= 12 && radiusPx(ask.inputRadius) >= 10, ask.inputRadius);
    assert.ok(radiusPx(ask.sendRadius) <= 12 && radiusPx(ask.sendRadius) >= 10, ask.sendRadius);
    assert.ok(ask.inputH >= 44 && ask.sendH >= 44, JSON.stringify(ask));
    assert.ok(ask.inputW > ask.inputH, 'Ask field is not an oval ' + JSON.stringify(ask));
    assert.ok(ask.sendW > ask.sendH, 'Ask Send is not a circle ' + JSON.stringify(ask));
    assert.ok(Math.abs(ask.sheetBottom - 520) <= 2, 'Ask sheet flush ' + ask.sheetBottom);
    await page.screenshot({path: path.join(shotDir, 'msg-composer-rect1-remi.png')});

    assert.ok(!errors.length, errors.join('\n'));
    console.log('admin-msg-composer-rect1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
