#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-chat-bleed1'), 'remi-chat-bleed1 marker');
assert.ok(html.includes('data-remi-chat-bleed1="v=remi-chat-bleed1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-remi-chat-bleed1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-chat-bleed1">'), 'meta');
assert.ok(html.includes('<!-- remi chat bleed 2026-09-27 v=remi-chat-bleed1 admin-build 2026-09-27-remi-chat-bleed1'), 'comment');
assert.ok(html.includes("var REMI_CHAT_BLEED1_MARKER='v=remi-chat-bleed1'"), 'script marker');
assert.ok(html.includes('function remiChatBleed1Sync'), 'sync parks this desk');
assert.ok(html.includes('GHOST-REMI-CHAT-BLEED1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD. Do not claim LIVE. Do not squash-merge.'), 'merge hold');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth reseal'), 'hard rules');
assert.ok(html.includes('No Quo/SMS'), 'no Quo');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-chat-bleed1-v1.sql')), 'no SQL patch');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build is remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1b"') < html.indexOf('content="2026-09-27-list-az1"'), 'list-az1 stays after remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-27-list-az1"') < html.indexOf('content="2026-09-27-remi-chat-bleed1"'), 'remi-chat-bleed1 stays after list-az1');
assert.ok(html.indexOf('content="2026-09-27-remi-chat-bleed1"') < html.indexOf('content="2026-09-27-compliance-bulk1"'), 'compliance-bulk1 stays after remi-chat-bleed1');
assert.ok(html.indexOf('content="2026-09-27-compliance-bulk1"') < html.indexOf('content="2026-09-27-hold-autosave1"'), 'hold-autosave1 stays after compliance-bulk1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-aide-notif-search1"'), 'aide-notif-search1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-aide-notif-search1"') < html.indexOf('content="2026-09-27-remi-chat1"'), 'remi-chat1 stays after aide-notif-search1');
['v=msg-dense1','v=more-hide1','v=aide-text-chat1','v=aide-office-vis1','v=remi-chat1','v=clienthrs1d','v=remiface1','v=aidechat1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(html.includes('id="aideOfficeRail"'), 'right rail stays');
assert.ok(html.includes('id="clienthrs1dSched"'), 'schedule form stays');
assert.ok(html.includes('assets/remi-locked.png?v=remiface1'), 'Remi face stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('#tab_aidechat.active #clienthrs1dSched{display:none !important;}'), 'schedule is parked on this desk');
assert.ok(html.includes('#adminScreen:has(#tab_aidechat.active) #copilotFab{display:none !important;}'), 'chip hides only while Messages is active');
assert.ok(html.includes('#tab_aidechat .msg-dense-panel #clienthrs1dSched{margin-top:8px;max-height:min(280px,calc(100% - 148px));overflow-x:hidden;overflow-y:auto;'), 'msg-dense1 schedule pin rule stays');
assert.ok(html.includes('#adminScreen .tab-panel:not(.active){display:none !important;}'), 'inactive panels cannot paint');
const panelChunk = html.slice(html.indexOf('id="msgDensePanel"'), html.indexOf('id="aideOfficeToast"'));
assert.ok(panelChunk.indexOf('id="aidechatMessages"') < panelChunk.indexOf('id="clienthrs1dSched"'), 'schedule node stays after messages');
assert.ok(panelChunk.indexOf('id="clienthrs1dSched"') < panelChunk.indexOf('id="aidechatComposer"'), 'schedule node stays above the composer');
const note = html.slice(html.indexOf('<!-- remi chat bleed 2026-09-27'), html.indexOf('<meta name="admin-build" content="2026-09-27-remi-chat-bleed1">'));
assert.ok(!/patches\/remi-chat-bleed1|\.sql/.test(note), 'no SQL in this tip');
assert.ok(!/reset_aide_temp_password|admin_set_role_password/.test(note), 'note does not reseal Auth');
assert.ok(/No mossier/.test(note), 'note keeps Auth off mossier');
const blockStart = html.indexOf('// v=remi-chat-bleed1 — park Schedule a Remi');
const blockEnd = html.indexOf('// aide office vis1 v=aide-office-vis1', blockStart);
assert.ok(blockStart > 0 && blockEnd > blockStart, 'script block');
const block = html.slice(blockStart, blockEnd);
assert.ok(!/\bQuo\b|twilio|send_sms|sms:|mailto:/.test(block), 'no Quo or SMS');
assert.ok(!/fetch\(/.test(block), 'no raw fetch');
assert.ok(!/admin_get_remi_payroll_report|sbRestRpc/.test(block), 'no new RPC');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function overlap(a, b){
  if(!a || !b || a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0)return false;
  return a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-chat-bleed1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.REMI_CHAT_BLEED1_SHOTS || '/opt/cursor/artifacts';
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
  const errors = [];
  function seed(){
    var bodies = [
      'Hi — can I cover Test Client Alpha Sunday 9–1?',
      'Yes if you can start at 9 sharp.',
      'I can. Confirming now.',
      'Perfect. Thanks.'
    ];
    var msgs = [];
    for(var i=0;i<bodies.length;i++){
      msgs.push({
        id:'m'+i,
        sender:i%2?'office':'aide',
        body:bodies[i],
        created_at:'2026-09-27T15:00:00Z',
        display_name:i%2?'Moe (Manager)':'Lina'
      });
    }
    return [
      {id:'lina', aide_id:'lina', username:'lina', name:'Lina', urgent:false, last_message:bodies[0], last_at:'2026-09-27T15:00:00Z', messages:msgs, preview_from_aide:bodies[0], has_unread:false}
    ];
  }
  async function openThread(page, width, height, mobile){
    await page.setViewport({width:width, height:height, isMobile:!!mobile, hasTouch:!!mobile, deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remi-chat-bleed1', {waitUntil:'domcontentloaded', timeout:20000});
    return page.evaluate(async function(pack){
      localStorage.clear();
      sessionStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('timesheets');
      showTab('aidechat');
      await aidechatOpen();
      aidechatThreads = pack;
      aidechatSource = 'local';
      aidechatSelectedId = 'lina';
      aidechatShow('thread');
      aidechatPaintInbox();
      aidechatPaintThread();
      if(typeof msgDense1Fit==='function')msgDense1Fit();
      if(typeof remiChatBleed1Sync==='function')remiChatBleed1Sync();
      var sched = document.getElementById('clienthrs1dSched');
      var panel = document.getElementById('msgDensePanel');
      var composer = document.getElementById('aidechatComposer');
      var msgs = document.getElementById('aidechatMessages');
      var fab = document.getElementById('copilotFab');
      var chat = document.getElementById('tab_aidechat');
      function box(el){
        var r = el.getBoundingClientRect();
        return {left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height};
      }
      var sb = box(sched);
      var pb = box(panel);
      var cb = box(composer);
      var mb = box(msgs);
      var fb = box(fab);
      var schedCs = getComputedStyle(sched);
      var fabCs = getComputedStyle(fab);
      var laidOut = schedCs.display !== 'none' && sb.width > 8 && sb.height > 8;
      var inColumn = laidOut && sb.left < pb.right && sb.right > pb.left && sb.top < pb.bottom && sb.bottom > pb.top;
      function hit(a, b){
        if(a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0)return false;
        return a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
      }
      return {
        first: document.querySelector('meta[name="admin-build"]').content,
        marker: REMI_CHAT_BLEED1_MARKER,
        on: remiChatBleed1On(),
        flag: document.getElementById('adminScreen').getAttribute('data-remi-chat-bleed1-on') || '',
        active: chat.classList.contains('active'),
        schedDisplay: schedCs.display,
        schedH: sched.offsetHeight,
        inPanel: !!(sched.closest && sched.closest('#msgDensePanel')),
        inColumn: inColumn,
        schedHitsMsgs: hit(sb, mb),
        schedHitsComposer: hit(sb, cb),
        fabDisplay: fabCs.display,
        fabHiddenAttr: !!fab.hidden,
        fabHitsComposer: hit(fb, cb),
        fabHitsMsgs: hit(fb, mb),
        sheet: !!document.getElementById('copilotSheet'),
        rail: !!document.getElementById('aideOfficeRail'),
        composerShown: cb.height > 20 && getComputedStyle(composer).display !== 'none',
        msgsShown: mb.height > 20
      };
    }, seed());
  }
  try{
    const phone = await browser.newPage();
    phone.on('pageerror', function(err){errors.push('phone '+String(err && err.message || err));});
    const phoneView = await openThread(phone, 390, 844, true);
    assert.strictEqual(phoneView.first, '2026-09-27-remi-float-hide1b');
    assert.strictEqual(phoneView.marker, 'v=remi-chat-bleed1');
    assert.strictEqual(phoneView.on, true);
    assert.strictEqual(phoneView.flag, '1');
    assert.strictEqual(phoneView.active, true);
    assert.strictEqual(phoneView.schedDisplay, 'none', 'phone schedule is parked');
    assert.strictEqual(phoneView.schedH, 0, 'phone schedule takes no thread space');
    assert.strictEqual(phoneView.inColumn, false, 'phone schedule is not in the thread column');
    assert.strictEqual(phoneView.schedHitsMsgs, false);
    assert.strictEqual(phoneView.schedHitsComposer, false);
    assert.strictEqual(phoneView.inPanel, true, 'schedule node stays parked in the panel');
    assert.strictEqual(phoneView.fabDisplay, 'none', 'phone Remi chip hides on Messages');
    assert.strictEqual(phoneView.fabHiddenAttr, false, 'role hidden flag stays for layout roles');
    assert.strictEqual(phoneView.fabHitsComposer, false, 'phone Remi chip does not cover the composer');
    assert.strictEqual(phoneView.fabHitsMsgs, false);
    assert.strictEqual(phoneView.sheet, true);
    assert.strictEqual(phoneView.rail, true);
    assert.strictEqual(phoneView.composerShown, true, 'composer stays');
    assert.strictEqual(phoneView.msgsShown, true, 'thread stays');
    await phone.screenshot({path: path.join(shotDir, 'remi-chat-bleed1-phone.png')});

    const desk = await browser.newPage();
    desk.on('pageerror', function(err){errors.push('desk '+String(err && err.message || err));});
    const deskView = await openThread(desk, 1280, 900, false);
    assert.strictEqual(deskView.inColumn, false, 'desktop schedule is not in the thread column');
    assert.strictEqual(deskView.schedDisplay, 'none');
    assert.strictEqual(deskView.schedHitsComposer, false);
    assert.strictEqual(deskView.fabDisplay, 'none', 'desktop Remi chip hides on Messages');
    assert.strictEqual(deskView.fabHitsComposer, false, 'desktop Remi chip does not cover the composer');
    assert.strictEqual(deskView.composerShown, true);
    assert.strictEqual(deskView.inPanel, true);
    await desk.screenshot({path: path.join(shotDir, 'remi-chat-bleed1-desktop.png')});

    const left = await desk.evaluate(function(){
      var tabs = ['timesheets','schedule','aides','clients','nurse','inservices','more','coverage'];
      var rows = [];
      tabs.forEach(function(tab){
        showTab('aidechat');
        aidechatShow('thread');
        showTab(tab);
        var chat = document.getElementById('tab_aidechat');
        var dest = document.getElementById('tab_'+tab);
        var fab = document.getElementById('copilotFab');
        var sched = document.getElementById('clienthrs1dSched');
        var cs = getComputedStyle(chat);
        var rect = chat.getBoundingClientRect();
        var fabCs = getComputedStyle(fab);
        var schedCs = getComputedStyle(sched);
        rows.push({
          tab:tab,
          active:chat.classList.contains('active'),
          hidden:!!chat.hidden,
          display:cs.display,
          h:rect.height,
          flag:document.getElementById('adminScreen').getAttribute('data-remi-chat-bleed1-on')||'',
          fabDisplay:fabCs.display,
          fabHidden:!!fab.hidden,
          schedH:sched.getBoundingClientRect().height,
          destOn:!!(dest&&dest.classList.contains('active')&&!dest.hidden&&getComputedStyle(dest).display!=='none')
        });
      });
      showTab('timesheets');
      var fab = document.getElementById('copilotFab');
      var fb = fab.getBoundingClientRect();
      return {
        rows:rows,
        fabBack:getComputedStyle(fab).display!=='none' && fb.width>40 && fb.height>40,
        sheet:!!document.getElementById('copilotSheet'),
        rail:!!document.getElementById('aideOfficeRail')
      };
    });
    assert.strictEqual(left.sheet, true, 'Remi sheet stays');
    assert.strictEqual(left.rail, true, 'Remi rail stays');
    assert.strictEqual(left.fabBack, true, 'corner chip returns after leaving Messages');
    left.rows.forEach(function(row){
      assert.strictEqual(row.active, false, row.tab+' Messages still active');
      assert.strictEqual(row.hidden, true, row.tab+' Messages not hidden');
      assert.strictEqual(row.display, 'none', row.tab+' Messages display '+row.display);
      assert.strictEqual(row.h, 0, row.tab+' Messages still painted');
      assert.strictEqual(row.flag, '', row.tab+' bleed flag stuck');
      assert.strictEqual(row.schedH, 0, row.tab+' schedule still painted');
      assert.notStrictEqual(row.fabDisplay, 'none', row.tab+' chip stayed hidden');
      assert.strictEqual(row.fabHidden, false, row.tab+' chip stayed role-hidden');
      assert.strictEqual(row.destOn, true, row.tab+' destination hidden');
    });
    await desk.screenshot({path: path.join(shotDir, 'remi-chat-bleed1-left.png')});
    assert.deepStrictEqual(errors, []);
    console.log('admin-remi-chat-bleed1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
