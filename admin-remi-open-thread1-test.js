#!/usr/bin/env node
'use strict';

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
    await phone.screenshot({path:path.join(outDir, 'remi-open-thread1-phone.png')});
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
