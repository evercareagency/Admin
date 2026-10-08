#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-open-thread1'), 'marker');
assert.ok(html.includes('?v=remi-open-thread1'), 'pages cache bust');
assert.ok(html.includes('admin-build 2026-09-28-remi-open-thread1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-remi-open-thread1">'), 'meta');
assert.ok(html.includes("var REMI_OPEN_THREAD1_MARKER='v=remi-open-thread1'"), 'script marker');
assert.ok(html.includes('GHOST-REMI-OPEN-THREAD1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD'), 'MERGE HOLD');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim LIVE');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth reseal'), 'hard rules');
['v=care-msg-safe1','v=remi-chat-bleed1','v=manage-dots-creds1','v=timesheet-archive-kill1','v=remi-float-hide1b','v=remi-phone-rail1','v=aide-office-vis1','v=manage-done1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(!fs.existsSync(path.join(__dirname, 'patches/remi-open-thread1-v1.sql')), 'no SQL patch');

const openFn = html.slice(html.indexOf('async function aideOfficeVis1OpenAide'), html.indexOf('function aideOfficeVis1OpenAlert'));
assert.ok(openFn.includes("copilotClose()"), 'closes Remi on the same path');
assert.ok(openFn.includes("showTab('aidechat')"), 'showTab to aidechat');
assert.ok(!openFn.includes("showTab('more')"), 'does not showTab more');
assert.ok(openFn.includes('remiOpenThread1Desk()'), 'clears the More selection');
assert.ok(openFn.includes('aidechatOpenThread'), 'opens the office thread');
assert.ok(!openFn.includes('showTempMsg'), 'does not stop on a toast');
assert.ok(html.includes("data-remi-open-thread1=\"'+REMI_OPEN_THREAD1_MARKER+'\""), 'open button carries the marker');
assert.ok(html.includes('id="aidechatComposer"'), 'care-msg composer stays');
assert.ok(html.includes('function remiChatBleed1Sync'), 'remi-chat-bleed1 stays');
assert.ok(html.includes('function copilotClose'), 'close path stays');

const pinStart = html.indexOf('function careMsgSafe1PinAide()');
const pinEnd = html.indexOf('function careMsgSafe1FitComposer()');
const pinFn = html.slice(pinStart, pinEnd);
assert.ok(pinStart > 0 && pinFn.length > 40, 'aide pin helper stays');
assert.ok(!pinFn.includes('gap<80') && !pinFn.includes('gap>=80'), 'aide pin does not wait for a keyboard gap');
assert.ok(pinFn.includes("getElementById('aidechatComposer')"), 'only the composer is docked');
assert.ok(pinFn.includes("form.style.position='fixed'"), 'composer is position fixed');
assert.ok(!pinFn.includes("thread.style.position='fixed'"), 'thread is not position fixed');
assert.ok(pinFn.includes('careMsgSafe1ClearThreadPin()'), 'pin clears any thread fixed leftover');
assert.ok(pinFn.includes('loginKbFixedFollowsLayout'), 'composer uses the loginkb1 fixed-origin check');
const holdFn = html.slice(html.indexOf('function careMsgSafe1HoldDesk()'), pinStart);
assert.ok(pinFn.includes('careMsgSafe1HoldDesk()'), 'focused reply holds the desk');
assert.ok(holdFn.includes('remiOpenThread1Desk'), 'focused reply keeps More unselected');
assert.ok(holdFn.includes("classList.add('is-open')"), 'focused reply keeps the thread open');
assert.ok(holdFn.includes('copilotClose'), 'focused reply closes an open Remi sheet');
assert.ok(html.includes('setTimeout(careMsgSafe1PinAide, 80)') && html.includes('setTimeout(careMsgSafe1PinAide, 320)'), 'pin re-runs at 80ms and 320ms');
assert.ok(html.includes("vv.addEventListener('resize', function(){careMsgSafe1PinAide();"), 'visualViewport resize re-pins');
assert.ok(html.includes("vv.addEventListener('scroll', function(){careMsgSafe1PinAide();"), 'visualViewport scroll re-pins');
assert.ok(html.includes("(window.innerWidth||0)<=899"), 'desktop widths at 900px and up do not tuck');
const askFn = html.slice(html.indexOf('function copilotChatViewport()'), html.indexOf('function copilotChatBindViewport()'));
assert.ok(askFn.includes('gap>=80'), 'Remi Ask still waits for gap>=80');
const leaveFn = html.slice(html.indexOf('function moreHide1Leave'), html.indexOf('function remiChatBleed1On'));
assert.ok(leaveFn.includes('careMsgSafe1ClearAidePin'), 'leaving Messages clears the pin');
assert.ok(leaveFn.includes('aidechatReply') && leaveFn.includes('.blur()'), 'leaving Messages blurs the reply');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function installStub(pack, email){
  window.__calls = [];
  window.__pack = JSON.parse(JSON.stringify(pack));
  readSbSession = function(){return {access_token:'office-jwt', email:email, user:{email:email}};};
  sbRestRpc = async function(name, body){
    window.__calls.push({name:name, body:body||{}});
    if(name==='admin_get_aide_office_unread_badge')return {ok:true, data:{unread_threads:1, unread_messages:1, deep_link_base:'admin/messages'}};
    if(name==='admin_list_due_aide_office_alerts')return {ok:true, data:{alerts:window.__pack.alerts, deep_link_base:'admin/messages'}};
    if(name==='admin_list_aide_office_threads')return {ok:true, data:{threads:window.__pack.threads}};
    if(name==='admin_list_aide_office_messages'){
      var id=String((body&&body.p_thread_id)||'');
      var row=null;
      window.__pack.threads.forEach(function(t){if(t.thread_id===id||t.aide_id===String((body&&body.p_aide_id)||''))row=t;});
      return {ok:true, data:{messages:[
        {id:'aide-1', sender:'aide', body:row&&row.preview_from_aide||'Yes I can cover Ada AM.', created_at:row&&row.last_message_at||''}
      ]}};
    }
    if(name==='admin_mark_aide_office_messages_read')return {ok:true, data:{success:true}};
    if(name==='admin_get_aide_chat_remi_settings')return {ok:true, data:{enabled:false, start_local:'14:00', end_local:'08:00'}};
    if(name==='admin_list_radar_signals')return {ok:true, data:{signals:[]}};
    if(name==='admin_get_quiet_hours')return {ok:true, data:{enabled:false, start_local:'20:00', end_local:'07:00', timezone:'America/New_York'}};
    return {ok:true, data:{success:true}};
  };
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  if(!puppeteer){
    console.log('admin-remi-open-thread1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const root = __dirname;
  const outDir = process.env.REMI_OPEN_THREAD1_SHOTS || '/tmp/remi-open-thread1';
  fs.mkdirSync(outDir, {recursive:true});
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript'};
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
  const pack = {
    threads: [
      {thread_id:'t-sara', aide_id:'sara-id', aide_username:'sara', aide_name:'Sara Alvarez', has_unread:true, unread:1, preview_from_aide:'Yes I can cover Ada AM.', last_message:'Yes I can cover Ada AM.', last_message_at:'2026-09-28T15:00:00Z'}
    ],
    alerts: [
      {kind:'aide_office_unread', thread_id:'t-sara', aide_id:'sara-id', aide_name:'Sara Alvarez', aide_username:'sara', preview:'Yes I can cover Ada AM.', unread_from_aide_count:1, deep_link:'admin/messages?aide_id=sara-id', last_message_at:'2026-09-28T15:00:00Z'}
    ]
  };
  try{
    const phone = await browser.newPage();
    phone.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await phone.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await phone.goto('http://127.0.0.1:'+port+'/index.html?v=remi-open-thread1', {waitUntil:'domcontentloaded', timeout:60000});
    await phone.evaluate(installStub, pack, 'admin@roles.evercare.local');
    await phone.evaluate(async function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'admin@roles.evercare.local';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('schedule');
      aideOfficeVis1Boot();
      await aideOfficeVis1Poll({toast:false});
      await copilotOpenRadar();
    });
    const before = await phone.evaluate(function(){
      var sheet=document.getElementById('copilotSheet');
      var btn=document.querySelector('#aideOfficeRail [data-aide-office-open]');
      return {
        sheetHidden:sheet?!!sheet.hidden:true,
        label:btn?btn.textContent:'',
        aide:btn?btn.getAttribute('data-aide-office-aide'):'',
        marker:btn?btn.getAttribute('data-remi-open-thread1'):''
      };
    });
    assert.strictEqual(before.sheetHidden, false, 'radar sheet starts open');
    assert.strictEqual(before.label, 'Open thread');
    assert.strictEqual(before.aide, 'sara-id');
    assert.strictEqual(before.marker, 'v=remi-open-thread1');
    await phone.click('#aideOfficeRail [data-aide-office-aide="sara-id"]');
    await phone.waitForFunction(function(){
      var title=document.getElementById('aidechatThreadTitle');
      var sheet=document.getElementById('copilotSheet');
      var thread=document.getElementById('aidechatThreadView');
      return title && title.textContent.indexOf('Sara Alvarez')>=0 && sheet && sheet.hidden && thread && !thread.hidden;
    }, {timeout:15000});
    const after = await phone.evaluate(function(){
      var chat=document.getElementById('tab_aidechat');
      var more=document.getElementById('tab_more');
      var moreNav=document.getElementById('nav_more');
      var chatNav=document.getElementById('nav_aidechat');
      var thread=document.getElementById('aidechatThreadView');
      var title=document.getElementById('aidechatThreadTitle');
      var msgs=document.getElementById('aidechatMessages');
      var sheet=document.getElementById('copilotSheet');
      var composer=document.getElementById('aidechatComposer');
      var chatCss=chat?getComputedStyle(chat):null;
      var moreCss=more?getComputedStyle(more):null;
      return {
        chatActive:!!(chat&&chat.classList.contains('active')),
        chatHidden:chat?!!chat.hidden:true,
        chatDisplay:chatCss?chatCss.display:'',
        moreActive:!!(more&&more.classList.contains('active')),
        moreHidden:more?!!more.hidden:true,
        moreDisplay:moreCss?moreCss.display:'',
        moreNav:!!(moreNav&&moreNav.classList.contains('active')),
        chatNav:!!(chatNav&&chatNav.classList.contains('active')),
        threadHidden:thread?!!thread.hidden:true,
        title:title?title.textContent:'',
        msgs:msgs?msgs.textContent:'',
        sheetHidden:sheet?!!sheet.hidden:true,
        composer:!!composer,
        hash:location.hash
      };
    });
    assert.strictEqual(after.sheetHidden, true, JSON.stringify(after));
    assert.strictEqual(after.chatActive, true, JSON.stringify(after));
    assert.strictEqual(after.chatHidden, false, JSON.stringify(after));
    assert.notStrictEqual(after.chatDisplay, 'none', JSON.stringify(after));
    assert.strictEqual(after.moreActive, false, JSON.stringify(after));
    assert.strictEqual(after.moreHidden, true, JSON.stringify(after));
    assert.strictEqual(after.moreDisplay, 'none', JSON.stringify(after));
    assert.strictEqual(after.moreNav, false, JSON.stringify(after));
    assert.strictEqual(after.chatNav, true, JSON.stringify(after));
    assert.strictEqual(after.threadHidden, false, JSON.stringify(after));
    assert.ok(after.title.indexOf('Sara Alvarez')>=0, after.title);
    assert.ok(after.msgs.indexOf('Yes I can cover Ada AM.')>=0, after.msgs);
    assert.strictEqual(after.composer, true);
    assert.strictEqual(after.hash, '#aidechat');
    await phone.focus('#aidechatReply');
    const tucked = await phone.evaluate(function(){
      var nav=document.getElementById('bottomNav');
      var navCss=nav?getComputedStyle(nav):null;
      var chat=document.getElementById('tab_aidechat');
      var thread=document.getElementById('aidechatThreadView');
      var threadCss=thread?getComputedStyle(thread):null;
      var moreNav=document.getElementById('nav_more');
      var sheet=document.getElementById('copilotSheet');
      return {
        kb:document.documentElement.classList.contains('aidechat-kb'),
        gap:typeof careMsgSafe1KbGap==='function'?careMsgSafe1KbGap():-1,
        navDisplay:navCss?navCss.display:'',
        active:!!(chat&&chat.classList.contains('active')),
        open:!!(chat&&chat.classList.contains('is-open')),
        threadPos:threadCss?threadCss.position:'',
        moreNav:!!(moreNav&&moreNav.classList.contains('active')),
        sheetHidden:sheet?!!sheet.hidden:true,
        focused:document.activeElement?document.activeElement.id:''
      };
    });
    assert.strictEqual(tucked.focused, 'aidechatReply', JSON.stringify(tucked));
    assert.ok(tucked.gap<80, 'focus tucks before any keyboard gap '+JSON.stringify(tucked));
    assert.strictEqual(tucked.kb, true, 'focus adds aidechat-kb before the keyboard '+JSON.stringify(tucked));
    assert.strictEqual(tucked.navDisplay, 'none', 'bottom tabs hide on focus '+JSON.stringify(tucked));
    assert.notStrictEqual(tucked.threadPos, 'fixed', 'thread stays in normal flow '+JSON.stringify(tucked));
    assert.strictEqual(tucked.active, true, JSON.stringify(tucked));
    assert.strictEqual(tucked.open, true, JSON.stringify(tucked));
    assert.strictEqual(tucked.moreNav, false, JSON.stringify(tucked));
    assert.strictEqual(tucked.sheetHidden, true, JSON.stringify(tucked));
    const docked = await phone.evaluate(function(){
      careMsgSafe1ReadVv=function(){return {height:420, offsetTop:0, width:390};};
      careMsgSafe1PinAide();
      var form=document.getElementById('aidechatComposer');
      var thread=document.getElementById('aidechatThreadView');
      var panel=document.getElementById('msgDensePanel');
      var msgs=document.getElementById('aidechatMessages');
      var fr=form.getBoundingClientRect();
      var pr=panel.getBoundingClientRect();
      var mr=msgs.getBoundingClientRect();
      var vvBottom=420;
      return {
        kb:document.documentElement.classList.contains('aidechat-kb'),
        threadPos:getComputedStyle(thread).position,
        composerPos:getComputedStyle(form).position,
        top:Math.round(fr.top),
        bottom:Math.round(fr.bottom),
        panelBottom:Math.round(pr.bottom),
        msgsBottom:Math.round(mr.bottom),
        vvBottom:vvBottom,
        active:document.getElementById('tab_aidechat').classList.contains('active'),
        open:document.getElementById('tab_aidechat').classList.contains('is-open')
      };
    });
    assert.strictEqual(docked.kb, true, JSON.stringify(docked));
    assert.strictEqual(docked.composerPos, 'fixed', JSON.stringify(docked));
    assert.notStrictEqual(docked.threadPos, 'fixed', JSON.stringify(docked));
    assert.ok(docked.bottom<=docked.vvBottom+6, 'composer bottom stays at or above the visual viewport '+JSON.stringify(docked));
    assert.ok(docked.bottom>=docked.vvBottom-16, 'composer stays docked on the visual viewport bottom '+JSON.stringify(docked));
    assert.ok(docked.top>140, 'composer does not jump near the top '+JSON.stringify(docked));
    assert.ok(docked.panelBottom<=docked.top+8, 'panel shortens above the dock '+JSON.stringify(docked));
    assert.ok(docked.msgsBottom<=docked.top+8, 'message list stays above the dock '+JSON.stringify(docked));
    assert.strictEqual(docked.active, true);
    assert.strictEqual(docked.open, true);
    await phone.focus('#aidechatSend');
    await new Promise(function(r){setTimeout(r, 120);});
    const sendTuck = await phone.evaluate(function(){
      return {
        kb:document.documentElement.classList.contains('aidechat-kb'),
        focused:document.activeElement?document.activeElement.id:'',
        nav:getComputedStyle(document.getElementById('bottomNav')).display
      };
    });
    assert.strictEqual(sendTuck.focused, 'aidechatSend', JSON.stringify(sendTuck));
    assert.strictEqual(sendTuck.kb, true, 'Send keeps the tuck '+JSON.stringify(sendTuck));
    assert.strictEqual(sendTuck.nav, 'none', JSON.stringify(sendTuck));
    await phone.screenshot({path:path.join(outDir, 'remi-open-thread1-phone.png')});
    await phone.evaluate(function(){showTab('schedule');});
    const left = await phone.evaluate(function(){
      var chat=document.getElementById('tab_aidechat');
      return {
        kb:document.documentElement.classList.contains('aidechat-kb'),
        active:!!(chat&&chat.classList.contains('active')),
        open:!!(chat&&chat.classList.contains('is-open'))
      };
    });
    assert.strictEqual(left.kb, false, 'leaving Messages clears aidechat-kb '+JSON.stringify(left));
    assert.strictEqual(left.active, false, JSON.stringify(left));
    assert.strictEqual(left.open, false, JSON.stringify(left));

    const desk = await browser.newPage();
    desk.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await desk.setViewport({width:1280, height:800, isMobile:false, hasTouch:false, deviceScaleFactor:1});
    await desk.goto('http://127.0.0.1:'+port+'/index.html?v=remi-open-thread1', {waitUntil:'domcontentloaded', timeout:60000});
    await desk.evaluate(installStub, pack, 'admin@roles.evercare.local');
    await desk.evaluate(async function(){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'admin@roles.evercare.local';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      showTab('schedule');
      aideOfficeVis1Boot();
      await aideOfficeVis1Poll({toast:false});
      await copilotOpenRadar();
    });
    await desk.click('#aideOfficeRail [data-aide-office-aide="sara-id"]');
    await desk.waitForFunction(function(){
      var title=document.getElementById('aidechatThreadTitle');
      var sheet=document.getElementById('copilotSheet');
      return title && title.textContent.indexOf('Sara Alvarez')>=0 && sheet && sheet.hidden;
    }, {timeout:15000});
    await desk.focus('#aidechatReply');
    await new Promise(function(r){setTimeout(r, 100);});
    const wide = await desk.evaluate(function(){
      var chat=document.getElementById('tab_aidechat');
      var moreNav=document.getElementById('nav_more');
      return {
        width:window.innerWidth,
        kb:document.documentElement.classList.contains('aidechat-kb'),
        focused:document.activeElement?document.activeElement.id:'',
        active:!!(chat&&chat.classList.contains('active')),
        open:!!(chat&&chat.classList.contains('is-open')),
        moreNav:!!(moreNav&&moreNav.classList.contains('active')),
        sheetHidden:!!document.getElementById('copilotSheet').hidden
      };
    });
    assert.ok(wide.width>=900, JSON.stringify(wide));
    assert.strictEqual(wide.focused, 'aidechatReply', JSON.stringify(wide));
    assert.strictEqual(wide.kb, false, 'desktop 1280 does not add aidechat-kb '+JSON.stringify(wide));
    assert.strictEqual(wide.active, true, JSON.stringify(wide));
    assert.strictEqual(wide.open, true, JSON.stringify(wide));
    assert.strictEqual(wide.moreNav, false, JSON.stringify(wide));
    assert.strictEqual(wide.sheetHidden, true, JSON.stringify(wide));
    await desk.close();
    assert.deepStrictEqual(errors, []);
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remi-open-thread1 ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
