#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');
const CAUSE = '#aidechatReply is flex:1 1 auto; min-width:0; border-radius:999px inside .aidechat-composer (row + flex-wrap:wrap); iPhone Safari under keyboard flex-shrinks that used width to ~1ch and the pill radius paints the vertical oval — kb3 only VV-docked #aidechatComposer, it never hard-locked the sendrow width.';

assert.ok(html.includes('v=msg-composer-kb4'), 'msg-composer-kb4 marker');
assert.ok(html.includes('?v=msg-composer-kb4'), 'cache bust query');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-msg-composer-kb4">'), 'admin-build meta');
assert.ok(html.includes("var MSG_COMPOSER_KB4_MARKER='v=msg-composer-kb4'"), 'script marker');
assert.ok(html.includes("var MSG_COMPOSER_KB4_BUILD='2026-09-29-msg-composer-kb4'"), 'script build');
assert.ok(html.includes('GHOST-MSG-COMPOSER-KB4-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'Ace NO CALLABLE');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('Quiet Mo'), 'Quiet Mo');
assert.ok(html.includes(CAUSE), 'one-line cause stays in the HTML comment');
assert.ok(html.includes('data-msg-composer-kb4="v=msg-composer-kb4"'), 'composer carries the marker');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays pages-cache-fresh1');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/msg-composer-kb4-v1.sql')), 'no SQL patch');

['v=msg-composer-kb3','v=aide-thread-header1','v=msg-composer-kb2','v=sched-creds1','v=care-msg-safe1','v=aides-info1','v=admin-sched-chat-push1','v=pages-cache-fresh1','v=loginkb1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-msg-composer-kb3">'), 'kb3 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-pages-cache-fresh1">'), 'pages-cache meta stays');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.includes('without a sticky ?v='), 'Home Screen URL is not rewritten to a sticky ?v=');
assert.ok(html.includes('Nurse stays out'), 'Nurse stays out');
assert.ok(html.includes('No Caregiver'), 'Caregiver stays out');

assert.ok(html.includes('flex:1 1 auto;min-width:0;width:auto;max-width:100%;min-height:44px;max-height:88px;border-radius:999px'), 'resting pill rule stays so the cause is still in the repo');
assert.ok(html.includes('flex-wrap:wrap'), 'wrapping send row stays for the non-keyboard composer');
assert.ok(html.includes('html.aidechat-kb #tab_aidechat .msg-dense-panel #aidechatComposer{display:grid;grid-template-columns:minmax(0,1fr) auto;width:100%;max-width:100%;box-sizing:border-box;flex-wrap:nowrap;'), 'kb send row is a non-wrapping grid');
assert.ok(html.includes('html.aidechat-kb #tab_aidechat .msg-dense-panel #aidechatReply{width:100%;min-width:0;max-width:none;'), 'reply fills the fr column');
assert.ok(html.includes('grid-column:1 / -1'), 'draft note spans the full grid row');
assert.ok(html.includes('padding-right:12px !important'), 'fab paddingRight cannot squeeze the keyboard composer');
assert.ok(html.includes('html.remi-ask-kb #copilotSheet #copilotComposer{display:grid;grid-template-columns:minmax(0,1fr) auto;width:100%;max-width:100%;box-sizing:border-box;flex-wrap:nowrap;'), 'Remi Ask composer uses the same grid lock');
assert.ok(html.includes('html.remi-ask-kb #copilotSheet #copilotChatInput{width:100%;min-width:0;max-width:none;'), 'Ask field fills its column');
assert.ok(html.includes('placeholder="Ask or just chat..."'), 'Ask placeholder stays');
assert.ok(html.includes('html.aidechat-kb #aidechatComposer{position:fixed'), 'kb3 fixed dock stays');
assert.ok(html.includes('html.aidechat-kb #aidechatComposer{margin-bottom:0;padding:8px 12px 8px;}'), 'kb3 padding stays inside the white bar');

const pinStart = html.indexOf('function careMsgSafe1PinAide()');
const pinEnd = html.indexOf('function careMsgSafe1FitComposer()');
const pinFn = html.slice(pinStart, pinEnd);
assert.ok(pinFn.includes('msgComposerKb3DockForm'), 'pin still docks with kb3');
assert.ok(pinFn.includes("form.style.position='fixed'"), 'composer is position fixed');
assert.ok(pinFn.includes('setTimeout(careMsgSafe1PinAide, 80)') === false, 'retries live on the binder, not inside the pin');
assert.ok(html.includes('setTimeout(careMsgSafe1PinAide, 80)') && html.includes('setTimeout(careMsgSafe1PinAide, 320)'), 'pin re-runs at 80ms and 320ms');
assert.ok(html.includes("vv.addEventListener('resize', function(){careMsgSafe1PinAide();"), 'visualViewport resize re-pins');
assert.ok(html.includes("vv.addEventListener('scroll', function(){careMsgSafe1PinAide();"), 'visualViewport scroll re-pins');
assert.ok(!pinFn.includes("role==='Admin'") && !pinFn.includes('currentAdminRole'), 'the keyboard pin is not Admin-only');

const fitStart = html.indexOf('var form=document.getElementById(\'aidechatComposer\');');
const fitFn = html.slice(fitStart, fitStart + 900);
assert.ok(fitFn.includes('aidechat-kb') && fitFn.includes('!kbOn&&fab'), 'fab overlap padding is ignored while aidechat-kb');

const askFn = html.slice(html.indexOf('function copilotChatViewport()'), html.indexOf('function copilotChatBindViewport()'));
assert.ok(askFn.includes('gap>=80'), 'Remi Ask still waits for gap>=80');
assert.ok(askFn.includes('msgComposerKb4LockForm') && askFn.includes('msgComposerKb4LockAsk'), 'Remi Ask locks the composer width');
assert.ok(askFn.includes('msgComposerKb4ClearField'), 'blur path clears the Ask field lock');

const lockStart = html.indexOf('function msgComposerKb4LockForm(');
const lockEnd = html.indexOf('function msgComposerKb3DockForm(');
assert.ok(lockStart > 0 && lockEnd > lockStart, 'lock helpers');
const dockEnd = html.indexOf('function careMsgSafe1PinAide()');
const sandbox = {
  document: {getElementById: function(){return null;}},
  window: {},
  isFinite: isFinite,
  Math: Math,
  Number: Number,
  String: String,
  parseFloat: parseFloat
};
vm.createContext(sandbox);
vm.runInContext(html.slice(lockStart, dockEnd), sandbox);

(function collapsedReply(){
  const field = {
    style: {},
    getBoundingClientRect: function(){
      if(String(field.style.width).indexOf('px') >= 0)return {width: parseFloat(field.style.width), height: 44};
      return {width: 8, height: 44};
    }
  };
  const send = {getBoundingClientRect: function(){return {width: 72, height: 44};}};
  const form = {clientWidth: 366, style: {}};
  const room = sandbox.msgComposerKb4LockField(form, field, send);
  assert.strictEqual(room, 366 - 72 - 8, 'collapsed field is forced to clientWidth - send - gap');
  assert.strictEqual(field.style.width, '286px');
  assert.strictEqual(field.style.maxWidth, 'none');
  assert.strictEqual(field.style.flex, 'none');
  assert.ok(room >= 120, 'forced width is never a 1ch oval');
})();

(function wideReplyStaysPercent(){
  const field = {
    style: {},
    getBoundingClientRect: function(){return {width: 280, height: 44};}
  };
  const form = {clientWidth: 366, style: {}};
  const room = sandbox.msgComposerKb4LockField(form, field, {getBoundingClientRect: function(){return {width: 72};}});
  assert.strictEqual(room, 280);
  assert.strictEqual(field.style.width, '100%', 'a wide field keeps the fr fill');
})();

(function gapFromComputedStyle(){
  sandbox.window.getComputedStyle = function(){return {columnGap: '10px', gap: '10px'};};
  const field = {
    style: {},
    getBoundingClientRect: function(){return {width: 8, height: 44};}
  };
  const form = {clientWidth: 400, style: {}};
  const room = sandbox.msgComposerKb4LockField(form, field, {getBoundingClientRect: function(){return {width: 80};}});
  assert.strictEqual(room, 310, 'gap is read from the composer');
  sandbox.window.getComputedStyle = null;
})();

(function tinyClientFloors(){
  const field = {
    style: {},
    getBoundingClientRect: function(){return {width: 4, height: 44};}
  };
  const room = sandbox.msgComposerKb4LockField({clientWidth: 0, style: {}}, field, {getBoundingClientRect: function(){return {width: 72};}});
  assert.strictEqual(room, 120, 'a missing client width still clears the 1ch oval');
})();

(function clearField(){
  const field = {style: {width: '8px', maxWidth: 'none', minWidth: '0px', flex: 'none', boxSizing: 'border-box', borderRadius: '22px'}};
  sandbox.msgComposerKb4ClearField(field);
  assert.strictEqual(field.style.width, '');
  assert.strictEqual(field.style.borderRadius, '');
})();

(function formLockClearsPadding(){
  const form = {style: {paddingRight: '80px'}, setAttribute: function(k, v){form.attr = k + '=' + v;}};
  sandbox.msgComposerKb4LockForm(form);
  assert.strictEqual(form.style.display, 'grid');
  assert.strictEqual(form.style.gridTemplateColumns, 'minmax(0,1fr) auto');
  assert.strictEqual(form.style.flexWrap, 'nowrap');
  assert.strictEqual(form.style.width, '100%');
  assert.strictEqual(form.style.maxWidth, '100%');
  assert.strictEqual(form.style.paddingRight, '');
  assert.strictEqual(form.attr, 'data-msg-composer-kb4=v=msg-composer-kb4');
})();

console.log('admin-msg-composer-kb4-test: unit ok');

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
    console.log('admin-msg-composer-kb4 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.KB4_SHOTS || '/opt/cursor/artifacts';
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
    await page.setViewport({width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true});
    await page.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil: 'domcontentloaded', timeout: 30000});
    const boot = await page.evaluate(function(){
      localStorage.clear();
      sessionStorage.clear();
      var metas = document.querySelectorAll('meta[name="admin-build"]');
      return {
        first: metas[0] ? metas[0].content : '',
        kb4: typeof MSG_COMPOSER_KB4_BUILD === 'string' ? MSG_COMPOSER_KB4_BUILD : '',
        kb3: typeof MSG_COMPOSER_KB3_BUILD === 'string' ? MSG_COMPOSER_KB3_BUILD : '',
        fresh: document.querySelector('meta[name="pages-cache-fresh1"]') ? document.querySelector('meta[name="pages-cache-fresh1"]').content : ''
      };
    });
    assert.strictEqual(boot.first, '2026-09-27-remi-float-hide1b');
    assert.strictEqual(boot.kb4, '2026-09-29-msg-composer-kb4');
    assert.strictEqual(boot.kb3, '2026-09-29-msg-composer-kb3');
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
          thread_id: 't-keisha',
          aide_id: id,
          aide_username: 'keisha.w',
          aide_name: 'Keisha Williams',
          status: 'open',
          messages: [
            {id: 'm1', sender: 'aide', body: 'Can I swap Sunday AM?', created_at: '2026-09-29T14:00:00Z'},
            {id: 'm2', sender: 'office', display_name: 'Moe (Admin)', body: 'Checking now.', created_at: '2026-09-29T14:01:00Z'}
          ]
        });
        aidechatThreads = [thread];
        aidechatSelectedId = thread.id;
        aidechatView = 'thread';
        showTab('aidechat');
        aidechatShow('thread');
        aidechatPaintThread();
        var reply = document.getElementById('aidechatReply');
        if(reply)reply.value = 'See you Sunday.';
        return {
          roles: document.getElementById('aidechatComposer').getAttribute('data-layout-roles'),
          kb4: document.getElementById('aidechatComposer').getAttribute('data-msg-composer-kb4'),
          placeholder: reply ? reply.getAttribute('placeholder') : ''
        };
      }, role);
    }

    async function measure(role){
      await openThread(role);
      return page.evaluate(function(){
        careMsgSafe1ReadVv = function(){return {height: 520, offsetTop: 0, width: 390};};
        var reply = document.getElementById('aidechatReply');
        var form = document.getElementById('aidechatComposer');
        var send = document.getElementById('aidechatSend');
        form.style.paddingRight = '96px';
        reply.focus();
        careMsgSafe1PinAide();
        var rect = reply.getBoundingClientRect();
        var formRect = form.getBoundingClientRect();
        var sendRect = send.getBoundingClientRect();
        var view = careMsgSafe1ReadVv();
        var target = msgComposerKb3VisualBottom(view);
        var cs = window.getComputedStyle(form);
        var replyCs = window.getComputedStyle(reply);
        var nav = document.getElementById('bottomNav');
        var navCs = window.getComputedStyle(nav);
        var note = document.getElementById('remiMsgTab1DraftNote');
        note.hidden = false;
        var noteCs = window.getComputedStyle(note);
        return {
          replyW: Math.round(rect.width),
          replyH: Math.round(rect.height),
          sendW: Math.round(sendRect.width),
          formW: Math.round(formRect.width),
          delta: Math.round(formRect.bottom - target),
          display: cs.display,
          flexWrap: cs.flexWrap,
          padRight: cs.paddingRight,
          radius: replyCs.borderRadius,
          kb: document.documentElement.classList.contains('aidechat-kb'),
          navDisplay: navCs.display,
          marker: form.getAttribute('data-msg-composer-kb4'),
          noteCol: noteCs.gridColumn,
          inlineWidth: reply.style.width,
          left: Math.round(formRect.left),
          rightGap: Math.round(window.innerWidth - formRect.right)
        };
      });
    }

    const opened = await openThread('Admin');
    assert.strictEqual(opened.roles, 'Admin Scheduler');
    assert.strictEqual(opened.kb4, 'v=msg-composer-kb4');
    assert.strictEqual(opened.placeholder, 'Type a message…');

    const admin = await measure('Admin');
    assert.strictEqual(admin.kb, true);
    assert.strictEqual(admin.display, 'grid');
    assert.strictEqual(admin.flexWrap, 'nowrap');
    assert.ok(admin.replyW >= 120, 'Type field stays wide ' + JSON.stringify(admin));
    assert.ok(admin.replyW > admin.replyH, 'field is not a vertical oval ' + JSON.stringify(admin));
    assert.ok(Math.abs(admin.delta) <= 2, 'composer stays flush ' + admin.delta);
    assert.strictEqual(admin.navDisplay, 'none');
    assert.strictEqual(admin.padRight, '12px', 'fab squeeze does not stick ' + admin.padRight);
    assert.strictEqual(admin.marker, 'v=msg-composer-kb4');
    assert.ok(admin.noteCol.indexOf('1') === 0, 'draft note spans the grid ' + admin.noteCol);
    assert.ok(Math.abs(admin.left) <= 1 && Math.abs(admin.rightGap) <= 1, 'composer is full width');
    await page.screenshot({path: path.join(shotDir, 'msg-composer-kb4-admin.png')});

    const forced = await page.evaluate(function(){
      var reply = document.getElementById('aidechatReply');
      var form = document.getElementById('aidechatComposer');
      var send = document.getElementById('aidechatSend');
      reply.style.width = '8px';
      reply.style.maxWidth = '8px';
      reply.style.flex = '1 1 auto';
      reply.style.minWidth = '0px';
      reply.style.borderRadius = '999px';
      var before = reply.getBoundingClientRect().width;
      var orig = reply.getBoundingClientRect.bind(reply);
      reply.getBoundingClientRect = function(){
        return {width: 8, height: 44, top: 0, left: 0, bottom: 44, right: 8};
      };
      var room = msgComposerKb4LockReply(form);
      reply.getBoundingClientRect = orig;
      var after = orig().width;
      var expect = Math.floor(form.clientWidth - send.getBoundingClientRect().width - 8);
      return {before: Math.round(before), after: Math.round(after), room: room, expect: expect, width: reply.style.width};
    });
    assert.ok(forced.before < 120, 'setup really collapsed the field ' + JSON.stringify(forced));
    assert.strictEqual(forced.room, forced.expect, 'forced width is clientWidth - send - gap ' + JSON.stringify(forced));
    assert.ok(forced.after >= 120, 'lock restores the field ' + JSON.stringify(forced));
    assert.ok(Math.abs(forced.after - forced.expect) <= 2, 'painted width matches the force ' + JSON.stringify(forced));

    const sched = await measure('Scheduler');
    assert.strictEqual(sched.kb, true);
    assert.strictEqual(sched.display, 'grid');
    assert.ok(sched.replyW >= 120, 'Scheduler Type field stays wide ' + JSON.stringify(sched));
    assert.ok(Math.abs(sched.delta) <= 2, 'Scheduler composer stays flush');
    await page.screenshot({path: path.join(shotDir, 'msg-composer-kb4-scheduler.png')});

    await page.evaluate(function(){
      var reply = document.getElementById('aidechatReply');
      if(reply)reply.blur();
    });
    await new Promise(function(resolve){setTimeout(resolve, 120);});
    const cleared = await page.evaluate(function(){
      var form = document.getElementById('aidechatComposer');
      var reply = document.getElementById('aidechatReply');
      return {
        kb: document.documentElement.classList.contains('aidechat-kb'),
        display: form.style.display,
        width: reply.style.width
      };
    });
    assert.strictEqual(cleared.kb, false, 'blur clears the tuck');
    assert.strictEqual(cleared.display, '', 'blur drops the inline grid lock');
    assert.strictEqual(cleared.width, '', 'blur drops the forced reply width');

    const ask = await page.evaluate(function(){
      var sheet = document.getElementById('copilotSheet');
      var form = document.getElementById('copilotComposer');
      var input = document.getElementById('copilotChatInput');
      sheet.hidden = false;
      form.hidden = false;
      document.documentElement.classList.add('remi-ask-kb');
      input.style.width = '6px';
      input.style.flex = '1 1 auto';
      input.style.minWidth = '0px';
      var before = input.getBoundingClientRect().width;
      var orig = input.getBoundingClientRect.bind(input);
      input.getBoundingClientRect = function(){
        return {width: 6, height: 44, top: 0, left: 0, bottom: 44, right: 6};
      };
      msgComposerKb4LockForm(form);
      var room = msgComposerKb4LockAsk(form);
      input.getBoundingClientRect = orig;
      var cs = window.getComputedStyle(form);
      var after = orig().width;
      var send = document.getElementById('copilotChatSend').getBoundingClientRect().width;
      return {
        before: Math.round(before),
        after: Math.round(after),
        room: room,
        display: cs.display,
        flexWrap: cs.flexWrap,
        placeholder: input.getAttribute('placeholder'),
        marker: form.getAttribute('data-msg-composer-kb4'),
        expect: Math.floor(form.clientWidth - send - 8)
      };
    });
    assert.ok(ask.before < 120, 'Ask field can collapse ' + JSON.stringify(ask));
    assert.strictEqual(ask.display, 'grid');
    assert.strictEqual(ask.flexWrap, 'nowrap');
    assert.ok(ask.after >= 120, 'Ask field stays wide ' + JSON.stringify(ask));
    assert.strictEqual(ask.room, ask.expect, 'Ask uses the same width formula ' + JSON.stringify(ask));
    assert.strictEqual(ask.placeholder, 'Ask or just chat...');
    assert.strictEqual(ask.marker, 'v=msg-composer-kb4');
    await page.screenshot({path: path.join(shotDir, 'msg-composer-kb4-ask.png')});

    await page.setViewport({width: 1100, height: 800, deviceScaleFactor: 1});
    const desk = await page.evaluate(function(){
      document.documentElement.classList.remove('remi-ask-kb');
      careMsgSafe1ReadVv = function(){return {height: 400, offsetTop: 0, width: 1100};};
      var reply = document.getElementById('aidechatReply');
      if(reply)reply.focus();
      careMsgSafe1PinAide();
      return {
        phone: careMsgSafe1Phone(),
        kb: document.documentElement.classList.contains('aidechat-kb')
      };
    });
    assert.strictEqual(desk.phone, false);
    assert.strictEqual(desk.kb, false, 'desktop focus does not tuck');
    assert.ok(!errors.length, errors.join('\n'));
    console.log('admin-msg-composer-kb4 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
