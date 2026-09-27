#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=msg-dense1'), 'msg-dense1 marker');
assert.ok(html.includes('data-msg-dense1="v=msg-dense1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-msg-dense1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-msg-dense1">'), 'meta');
assert.ok(html.includes('<!-- messages dense 2026-09-27 v=msg-dense1 admin-build 2026-09-27-msg-dense1'), 'comment');
assert.ok(html.includes("var MSG_DENSE1_MARKER='v=msg-dense1'"), 'script marker');
assert.ok(html.includes('GHOST-MSG-DENSE1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('MERGE HOLD. Do not claim LIVE. Do not squash-merge.'), 'merge hold');
assert.ok(html.includes('option 2 one-box scroll'), 'option 2');
assert.ok(html.includes('Not option 1 phone-width column'), 'not option 1');
assert.ok(html.includes('overflow-y:auto') || html.includes('overflow-y: auto'), 'message list scrolls');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-msg-dense1'), 'first admin-build is msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-msg-dense1"') < html.indexOf('content="2026-09-27-hold-client1"'), 'hold-client1 stays after msg-dense1');
assert.ok(html.indexOf('content="2026-09-27-hold-client1"') < html.indexOf('content="2026-09-27-aides-info1"'), 'aides-info1 stays after hold-client1');
assert.ok(html.indexOf('content="2026-09-27-aides-info1"') < html.indexOf('content="2026-09-27-login-toast1"'), 'login-toast1 stays after aides-info1');
assert.ok(html.indexOf('content="2026-09-27-login-toast1"') < html.indexOf('content="2026-09-27-aide-office-vis1"'), 'aide-office-vis1 stays after login-toast1');
assert.ok(html.indexOf('content="2026-09-27-aide-office-vis1"') < html.indexOf('content="2026-09-27-remi-langs1"'), 'remi-langs1 stays after aide-office-vis1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aide-office-vis1">'), 'aide-office-vis1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-langs1">'), 'remi-langs1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'payroll meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidechat1">'), 'aidechat1 meta stays');
['v=aide-office-vis1','v=remi-langs1','v=hold-clear1','v=sched-time-tap1','v=aide-text-chat1','v=remi-float-hide1','v=tabbar-8','v=cover-card-cancel1','v=nosvc-reason-draft1','cancel-shift1','v=cover-unselect1','v=remi-payroll1','v=client-ins1','v=aidechat1','v=remiface1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('id="copilotFab"'), 'corner chip stays');
assert.ok(html.includes('id="copilotSheet"'), 'phone sheet stays');
assert.ok(html.includes('id="aideOfficeRail"'), 'right rail stays');
assert.ok(html.includes('assets/remi-locked.png?v=remiface1'), 'Remi face stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
assert.ok(html.includes('id="aidechatThreadAv"'), 'thread header avatar');
assert.ok(html.includes('class="aide-office-av"'), 'aide list avatar stays');
assert.ok(html.includes('id="msgDensePanel"'), 'fixed thread panel');
assert.ok(html.includes('function msgDense1Fit'), 'height lock');
assert.ok(html.includes('padding:6px 10px'), 'tighter bubble padding');
assert.ok(html.includes('admin_get_remi_payroll_report'), 'payroll desk stays');
const denseNote = html.slice(html.indexOf('<!-- messages dense 2026-09-27 v=msg-dense1'), html.indexOf('<meta name="admin-build" content="2026-09-27-msg-dense1">') + 62);
assert.ok(!/patches\/msg-dense1|\.sql/.test(denseNote), 'no SQL in this tip');

const blockStart = html.indexOf('// v=msg-dense1 option 2 one-box scroll');
const blockEnd = html.indexOf('// aide office vis1 v=aide-office-vis1', blockStart);
assert.ok(blockStart > 0 && blockEnd > blockStart, 'script block');
const block = html.slice(blockStart, blockEnd);
assert.ok(!/\bQuo\b|twilio|send_sms|sms:|mailto:/.test(block), 'no Quo or SMS');
assert.ok(!/mossier|reset_aide_temp_password|admin_set_role_password|signInWithPassword/.test(block), 'no Auth and no mossier');
assert.ok(!/fetch\(/.test(block), 'no raw fetch');
assert.ok(!/admin_get_remi_payroll_report|admin_export_remi_payroll/.test(block), 'does not touch payroll desk');

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
    console.log('admin-msg-dense1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.MSG_DENSE1_SHOTS || '/opt/cursor/artifacts';
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
  function seed(extra){
    var bodies = [
      'Hi — can I cover Bowlax Sunday 9–1?',
      'Yes if you can start at 9 sharp. Usual aide is out.',
      'I can. Confirming now.',
      'Perfect. I\'ll mark Covered. Thanks Sara.',
      'Done.',
      'Also — Remi may nudge if anything changes. You\'re good.',
      'Got it. See you Sunday.',
      'Quick note: client prefers soft knock.',
      'Noted — soft knock.',
      'Thanks again.'
    ];
    var msgs = [];
    var i;
    for(i=0;i<bodies.length;i++){
      msgs.push({
        id:'m'+i,
        sender:i%2?'office':'aide',
        body:bodies[i],
        created_at:i<2?'2026-09-01T16:00:00Z':'2026-09-27T15:00:00Z',
        display_name:i%2?'Moe (Manager)':'Sara Alvarez'
      });
    }
    if(extra){
      for(i=0;i<extra;i++){
        msgs.push({id:'x'+i, sender:i%2?'remi':'aide', body:'Extra line '+(i+1)+' so the box has to scroll.', created_at:'2026-09-27T16:00:00Z', display_name:i%2?'Remi':'Sara Alvarez'});
      }
    }
    return [
      {id:'sara', aide_id:'sara', username:'sara', name:'Sara Alvarez', urgent:false, last_message:bodies[0], last_at:'2026-09-27T15:00:00Z', messages:msgs, preview_from_aide:bodies[0], has_unread:false},
      {id:'moe', aide_id:'moe', username:'moe', name:'Moe Hassan', urgent:false, last_message:'Thanks — on my way', last_at:'2026-09-27T14:00:00Z', messages:[], preview_from_aide:'Thanks — on my way', has_unread:false},
      {id:'fatima', aide_id:'fatima', username:'fatima', name:'Fatima N.', urgent:false, last_message:'Unread note', last_at:'2026-09-27T13:00:00Z', messages:[], preview_from_aide:'Unread note', has_unread:true, unread:2}
    ];
  }
  async function openDesk(page, width, height, mobile){
    await page.setViewport({width:width, height:height, isMobile:!!mobile, hasTouch:!!mobile, deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=msg-dense1', {waitUntil:'domcontentloaded', timeout:20000});
    return page.evaluate(async function(pack){
      localStorage.clear();
      sessionStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('aidechat');
      await aidechatOpen();
      aidechatThreads = pack;
      aidechatSource = 'local';
      aidechatSelectedId = 'sara';
      aidechatShow('thread');
      aidechatPaintInbox();
      aidechatPaintThread();
      msgDense1Fit();
      var panel = document.getElementById('msgDensePanel');
      var box = document.getElementById('aidechatMessages');
      var bubble = box.querySelector('.aidechat-bubble');
      var reply = document.getElementById('aidechatReply');
      var send = document.getElementById('aidechatSend');
      var av = document.getElementById('aidechatThreadAv');
      var listAv = document.querySelectorAll('#aidechatList .aide-office-av');
      var pad = bubble ? parseFloat(getComputedStyle(bubble).paddingTop) : 99;
      var replyBox = reply.getBoundingClientRect();
      var sendBox = send.getBoundingClientRect();
      return {
        first: document.querySelector('meta[name="admin-build"]').content,
        marker: MSG_DENSE1_MARKER,
        overflow: getComputedStyle(box).overflowY,
        panelH: panel.clientHeight,
        panelW: panel.clientWidth,
        docH: document.documentElement.scrollHeight,
        msgClient: box.clientHeight,
        msgScroll: box.scrollHeight,
        pad: pad,
        av: av ? av.textContent : '',
        listCount: listAv.length,
        listText: Array.prototype.map.call(listAv, function(n){return n.textContent;}),
        days: Array.prototype.map.call(box.querySelectorAll('.msg-dense-day'), function(n){return n.textContent;}),
        row: Math.abs(sendBox.top - replyBox.top) < 24 && sendBox.left >= replyBox.right - 4,
        chip: document.querySelector('#copilotFab img').getAttribute('src'),
        sheet: !!document.getElementById('copilotSheet'),
        rail: !!document.getElementById('aideOfficeRail'),
        split: document.getElementById('tab_aidechat').classList.contains('is-thread'),
        label: (document.getElementById('aidechatListLabel')||{}).textContent || '',
        labelShown: getComputedStyle(document.getElementById('aidechatListLabel')).display !== 'none',
        selected: !!document.querySelector('#aidechatList .aidechat-card.is-selected'),
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth
      };
    }, seed(12));
  }
  try{
    const phone = await browser.newPage();
    phone.on('pageerror', function(err){errors.push('phone '+String(err && err.message || err));});
    const phoneView = await openDesk(phone, 390, 844, true);
    assert.strictEqual(phoneView.first, '2026-09-27-msg-dense1');
    assert.strictEqual(phoneView.marker, 'v=msg-dense1');
    assert.strictEqual(phoneView.overflow, 'auto');
    assert.ok(phoneView.pad <= 8, 'tighter padding '+phoneView.pad);
    assert.strictEqual(phoneView.av, 'SA');
    assert.ok(phoneView.listCount >= 3, 'aide list keeps avatars');
    assert.ok(phoneView.listText.indexOf('SA') >= 0, phoneView.listText.join(','));
    assert.ok(phoneView.days.indexOf('TODAY') >= 0, phoneView.days.join(','));
    assert.ok(phoneView.days.indexOf('09/01/2026') >= 0, phoneView.days.join(','));
    assert.ok(phoneView.row, 'composer is a row');
    assert.ok(phoneView.chip.indexOf('remi-locked.png') >= 0, phoneView.chip);
    assert.strictEqual(phoneView.sheet, true);
    assert.strictEqual(phoneView.rail, true);
    assert.strictEqual(phoneView.split, false, 'phone is not the desktop split');
    assert.ok(phoneView.panelW > 280, 'phone thread is the full box, not a skinny column '+phoneView.panelW);
    assert.ok(phoneView.msgScroll > phoneView.msgClient, 'messages scroll inside the box');
    assert.ok(phoneView.scrollW <= phoneView.clientW + 1, 'phone does not widen');
    const grown = await phone.evaluate(function(pack){
      var beforeDoc = document.documentElement.scrollHeight;
      var beforePanel = document.getElementById('msgDensePanel').clientHeight;
      var beforeClient = document.getElementById('aidechatMessages').clientHeight;
      var beforeTab = document.getElementById('tab_aidechat').getBoundingClientRect().height;
      aidechatThreads = pack;
      aidechatPaintThread();
      msgDense1Fit();
      var box = document.getElementById('aidechatMessages');
      return {
        doc: document.documentElement.scrollHeight - beforeDoc,
        panel: document.getElementById('msgDensePanel').clientHeight - beforePanel,
        client: box.clientHeight - beforeClient,
        tab: document.getElementById('tab_aidechat').getBoundingClientRect().height - beforeTab,
        scroll: box.scrollHeight,
        box: box.clientHeight
      };
    }, seed(24));
    assert.strictEqual(grown.doc, 0, 'page does not grow with bubbles '+JSON.stringify(grown));
    assert.strictEqual(grown.panel, 0, 'panel height stays fixed '+JSON.stringify(grown));
    assert.strictEqual(grown.client, 0, 'message viewport stays fixed '+JSON.stringify(grown));
    assert.ok(Math.abs(grown.tab) < 2, 'tab does not grow '+JSON.stringify(grown));
    assert.ok(grown.scroll > grown.box, 'only the msgs box scrolls');
    await phone.screenshot({path: path.join(shotDir, 'msg-dense1-phone.png')});

    const desk = await browser.newPage();
    desk.on('pageerror', function(err){errors.push('desk '+String(err && err.message || err));});
    const deskView = await openDesk(desk, 1280, 900, false);
    assert.strictEqual(deskView.split, true, 'desktop keeps the aide list beside the thread');
    assert.strictEqual(deskView.overflow, 'auto');
    assert.strictEqual(deskView.av, 'SA');
    assert.ok(deskView.listCount >= 3);
    assert.strictEqual(deskView.label, 'Aides');
    assert.strictEqual(deskView.labelShown, true);
    assert.strictEqual(deskView.selected, true);
    assert.ok(deskView.panelW > 480, 'desktop thread is one wide box, not a phone column '+deskView.panelW);
    assert.ok(deskView.msgScroll > deskView.msgClient, 'desktop messages scroll inside');
    assert.ok(deskView.pad <= 8, deskView.pad);
    const deskGrown = await desk.evaluate(function(pack){
      var beforeDoc = document.documentElement.scrollHeight;
      var beforePanel = document.getElementById('msgDensePanel').clientHeight;
      aidechatThreads = pack;
      aidechatPaintThread();
      msgDense1Fit();
      var box = document.getElementById('aidechatMessages');
      return {
        doc: document.documentElement.scrollHeight - beforeDoc,
        panel: document.getElementById('msgDensePanel').clientHeight - beforePanel,
        scroll: box.scrollHeight,
        box: box.clientHeight
      };
    }, seed(30));
    assert.strictEqual(deskGrown.doc, 0, 'desktop page does not grow '+JSON.stringify(deskGrown));
    assert.strictEqual(deskGrown.panel, 0, 'desktop panel stays fixed '+JSON.stringify(deskGrown));
    assert.ok(deskGrown.scroll > deskGrown.box);
    await desk.screenshot({path: path.join(shotDir, 'msg-dense1-desktop.png')});
    assert.deepStrictEqual(errors, []);
    console.log('admin-msg-dense1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
