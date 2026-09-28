#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remi-open-thread1'), 'remi-open-thread1 marker');
assert.ok(html.includes('data-remi-open-thread1="v=remi-open-thread1"'), 'thread host marker');
assert.ok(html.includes('<meta name="admin-build" content="v=remi-open-thread1">'), 'meta v=remi-open-thread1');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-remi-open-thread1">'), 'dated meta');
assert.ok(html.includes('<!-- remi open thread 2026-09-28 v=remi-open-thread1'), 'comment');
assert.ok(html.includes('MERGE HOLD'), 'merge hold stays in the note');
assert.ok(html.includes('Do not claim LIVE'), 'do not claim live');
assert.ok(html.includes('Do not squash-merge'), 'do not squash-merge');
assert.ok(html.includes('id="aideOfficeThread"'), 'remi thread host');
assert.ok(html.includes('id="aideOfficeRail"'), 'rail host stays');
assert.ok(html.includes('id="copilotSheet"'), 'remi sheet stays');
assert.ok(!html.includes('id="tab_remi"'), 'Remi is not a full page');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
['v=aide-office-vis1','v=aidechat1','v=remi-notes-vis1','v=cover-desk1','v=remi-float-hide1b','v=remi-phone-rail1','v=msg-dense1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('function remiNotesVis1OpenThread'), 'notes open thread stays');
assert.ok(html.includes('remi_list_my_note_thread'), 'notes thread rpc stays');
assert.ok(html.includes("if(panelOk&&!panelOk.classList.contains('active'))return;"), 'aidechatOpen active guard stays');

const openAt = html.indexOf('async function aideOfficeVis1OpenAide');
const openEnd = html.indexOf('async function aideOfficeVis1SendThread');
assert.ok(openAt > 0 && openEnd > openAt, 'open aide function');
const openSrc = html.slice(openAt, openEnd);
assert.ok(!openSrc.includes('showTab'), 'open does not bury Messages');
assert.ok(openSrc.includes('aideOfficeVis1PaintRemiThread'), 'paints inside Remi');
assert.ok(openSrc.includes("aidechatRpc('read'"), 'mark read when the thread opens');
assert.ok(openSrc.includes('aideOfficeVis1EnsureSheet'), 'keeps the Remi sheet open');
assert.ok(!/mossier|reset_aide_temp_password|signInWithPassword/.test(openSrc), 'no Auth and no mossier');

const start = html.indexOf('// aide office vis1 v=aide-office-vis1');
const end = html.indexOf('// end aide office vis1 v=aide-office-vis1');
assert.ok(start > 0 && end > start, 'script block');
const src = html.slice(start, end);
assert.ok(src.includes('admin_mark_aide_office_messages_read') || src.includes("aidechatRpc('read'"), 'ack path');
assert.ok(!/\bQuo\b|twilio|send_sms|sms:/.test(src), 'no Quo or SMS');
assert.ok(!/fetch\(/.test(src), 'no raw fetch');

const sandbox = {console:console, Date:Date, setTimeout:setTimeout, clearTimeout:clearTimeout, setInterval:setInterval, clearInterval:clearInterval};
vm.createContext(sandbox);
vm.runInContext(src + '\nthis.REMI_OPEN_THREAD1_MARKER=REMI_OPEN_THREAD1_MARKER;', sandbox);
assert.strictEqual(sandbox.REMI_OPEN_THREAD1_MARKER, 'v=remi-open-thread1');
assert.strictEqual(sandbox.aideOfficeVis1AideFrom({aide_id:'moe-id', deep_link:'admin/messages?aide_id=wrong-id'}), 'moe-id');
assert.strictEqual(sandbox.aideOfficeVis1AideFrom({deep_link:'admin/messages?aide_id=moe-id'}), 'moe-id');
assert.strictEqual(sandbox.aideOfficeVis1AideFrom({aide_id:'', deep_link:'admin/messages?aide_id=from-link'}), 'from-link');
console.log('admin-remi-open-thread1 unit ok');

function loadPuppeteer(){
  try{return require('puppeteer-core');}
  catch(e){
    try{return require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){return null;}
  }
}

function installStub(pack){
  window.__calls = [];
  window.__pack = JSON.parse(JSON.stringify(pack));
  window.__badge = {unread_threads:1, unread_messages:1, deep_link_base:'admin/messages'};
  window.__alerts = JSON.parse(JSON.stringify(pack.alerts));
  readSbSession = function(){return {access_token:'office-jwt', email:'scheduler@roles.evercare.local', user:{email:'scheduler@roles.evercare.local'}};};
  sbRestRpc = async function(name, body){
    window.__calls.push({name:name, body:body||{}});
    if(name==='admin_get_aide_office_unread_badge')return {ok:true, data:window.__badge};
    if(name==='admin_list_due_aide_office_alerts')return {ok:true, data:{alerts:window.__alerts, kind:'aide_office_unread', deep_link_base:'admin/messages'}};
    if(name==='admin_list_aide_office_threads')return {ok:true, data:{threads:window.__pack.threads}};
    if(name==='admin_mark_aide_office_messages_read'){
      var tid=String((body&&body.p_thread_id)||'');
      window.__alerts=window.__alerts.filter(function(a){return a.thread_id!==tid;});
      window.__pack.threads.forEach(function(t){
        if(t.thread_id===tid){t.has_unread=false;t.unread=0;}
      });
      window.__badge={unread_threads:0, unread_messages:0, deep_link_base:'admin/messages'};
      return {ok:true, data:{success:true, badge:window.__badge}};
    }
    if(name==='admin_list_aide_office_messages'){
      return {ok:true, data:{messages:[
        {id:'office-1', sender:'office', display_name:'Office', body:'Can you cover tomorrow?', created_at:'2026-09-28T14:00:00Z'},
        {id:'aide-1', sender:'aide', display_name:'moe', body:'I have a question about my pay.', created_at:'2026-09-28T14:05:00Z'}
      ]}};
    }
    if(name==='admin_send_aide_office_message')return {ok:true, data:{success:true}};
    if(name==='admin_get_aide_chat_remi_settings')return {ok:true, data:{enabled:false, start_local:'14:00', end_local:'08:00'}};
    if(name==='admin_list_open_shifts'||name==='list_open_shifts')return {ok:true, data:{shifts:[]}};
    if(name==='remi_list_my_notes'||name==='remi_list_my_note_thread'||name==='remi_list_scheduler_notes')return {ok:true, data:{notes:[]}};
    return {ok:true, data:{success:true}};
  };
}

async function bootRail(page, pack){
  await page.evaluate(installStub, pack);
  return page.evaluate(async function(){
    localStorage.setItem(navEditStorageKeyFor('', 'scheduler@roles.evercare.local'), JSON.stringify(['coverage','aidechat','aides','schedule']));
    currentAdminRole = 'Scheduler';
    currentAdminUsername = 'scheduler@roles.evercare.local';
    layoutA1ApplyRoles();
    navEditApply();
    showScreen('adminScreen');
    document.querySelectorAll('#adminScreen .tab-panel').forEach(function(p){
      p.classList.remove('active');
      p.hidden = true;
    });
    document.querySelectorAll('#adminScreen .nav-item').forEach(function(n){n.classList.remove('active');});
    var chat = document.getElementById('tab_aidechat');
    if(chat){chat.classList.remove('active'); chat.hidden = true;}
    var panel = document.getElementById('tab_coverage');
    var nav = document.getElementById('nav_coverage');
    if(panel){panel.hidden = false; panel.classList.add('active');}
    if(nav)nav.classList.add('active');
    await aideOfficeVis1Poll({toast:false});
    await copilotOpenRadar();
    return {
      rail:(document.getElementById('aideOfficeRail')||{}).textContent||'',
      chatActive:!!(chat&&chat.classList.contains('active'))
    };
  });
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
  const outDir = '/opt/cursor/artifacts';
  fs.mkdirSync(outDir, {recursive:true});
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
  const pack = {
    threads: [
      {thread_id:'t-moe', aide_id:'moe-id', aide_username:'moe', aide_name:'moe', has_unread:true, unread:1, preview_from_aide:'I have a question about my pay.', last_message:'I have a question about my pay.', last_message_at:'2026-09-28T14:05:00Z'}
    ],
    alerts: [
      {kind:'aide_office_unread', thread_id:'t-moe', aide_id:'moe-id', aide_name:'moe', aide_username:'moe', preview:'I have a question about my pay.', unread_from_aide_count:1, deep_link:'admin/messages?aide_id=wrong-id', last_message_at:'2026-09-28T14:05:00Z'}
    ]
  };
  try{
    const phone = await browser.newPage();
    phone.on('pageerror', function(err){errors.push('phone '+String(err && err.message || err));});
    await phone.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await phone.goto('http://127.0.0.1:'+port+'/index.html?v=remi-open-thread1', {waitUntil:'domcontentloaded', timeout:60000});
    const booted = await bootRail(phone, pack);
    assert.strictEqual(booted.chatActive, false);
    assert.ok(booted.rail.indexOf('moe replied')>=0, booted.rail);
    assert.ok(booted.rail.indexOf('Open thread')>=0, booted.rail);
    assert.ok(booted.rail.indexOf('Thread opens in Remi')>=0, booted.rail);
    await phone.click('#aideOfficeRail .aide-office-open');
    await phone.waitForFunction(function(){
      var host=document.getElementById('aideOfficeThread');
      var text=host?host.textContent||'':'';
      var read=(window.__calls||[]).some(function(c){return c.name==='admin_mark_aide_office_messages_read' && c.body && c.body.p_thread_id==='t-moe';});
      var msgs=(window.__calls||[]).some(function(c){return c.name==='admin_list_aide_office_messages' && c.body && c.body.p_thread_id==='t-moe';});
      return host && !host.hidden && read && msgs && text.indexOf('I have a question about my pay.')>=0 && text.indexOf('Can you cover tomorrow?')>=0;
    }, {timeout:15000});
    const opened = await phone.evaluate(function(){
      var chat=document.getElementById('tab_aidechat');
      var cover=document.getElementById('tab_coverage');
      var sheet=document.getElementById('copilotSheet');
      var host=document.getElementById('aideOfficeThread');
      var box=sheet?sheet.getBoundingClientRect():null;
      var msgCall=null;
      (window.__calls||[]).forEach(function(c){
        if(c.name==='admin_list_aide_office_messages')msgCall=c.body;
      });
      return {
        chatActive:!!(chat&&chat.classList.contains('active')),
        coverActive:!!(cover&&cover.classList.contains('active')),
        sheetHidden:sheet?sheet.hidden:true,
        threadHidden:host?host.hidden:true,
        text:host?host.textContent||'':'',
        chipHidden:!!(document.getElementById('aideOfficeChipBadge')||{}).hidden,
        msgCall:msgCall,
        top:box?box.top:0,
        width:box?box.width:0
      };
    });
    assert.strictEqual(opened.chatActive, false, 'messages tab stays buried');
    assert.strictEqual(opened.coverActive, true, 'desk under Remi stays');
    assert.strictEqual(opened.sheetHidden, false, 'remi sheet stays open');
    assert.strictEqual(opened.threadHidden, false, 'thread pane is open');
    assert.ok(opened.text.indexOf('Aide Office · in Remi')>=0, opened.text);
    assert.ok(opened.text.indexOf('moe')>=0, opened.text);
    assert.ok(opened.text.indexOf('wrong-id')<0, opened.text);
    assert.strictEqual(opened.msgCall && opened.msgCall.p_thread_id, 't-moe');
    assert.ok(!opened.msgCall.p_aide_id || opened.msgCall.p_aide_id==='moe-id', JSON.stringify(opened.msgCall));
    assert.strictEqual(opened.chipHidden, true, 'badge clears after ack');
    assert.ok(opened.width > 200, 'phone sheet has width');
    await phone.screenshot({path:path.join(outDir, 'remi-open-thread1-phone.png')});

    await phone.type('#aideOfficeThreadReply', 'See you then');
    await phone.click('#aideOfficeThreadForm button');
    await phone.waitForFunction(function(){
      return (window.__calls||[]).some(function(c){
        return c.name==='admin_send_aide_office_message' && c.body && c.body.p_thread_id==='t-moe' && c.body.p_body==='See you then';
      }) && (document.getElementById('aideOfficeThread')||{}).textContent.indexOf('See you then')>=0;
    }, {timeout:10000});
    const sent = await phone.evaluate(function(){
      var chat=document.getElementById('tab_aidechat');
      var sheet=document.getElementById('copilotSheet');
      return {
        chatActive:!!(chat&&chat.classList.contains('active')),
        sheetHidden:sheet?sheet.hidden:true
      };
    });
    assert.strictEqual(sent.chatActive, false);
    assert.strictEqual(sent.sheetHidden, false);

    await phone.click('#copilotTabNotes');
    await phone.waitForFunction(function(){
      var host=document.getElementById('aideOfficeThread');
      return host && host.hidden && (typeof copilotView==='undefined' || copilotView==='notes');
    }, {timeout:10000});
    const notes = await phone.evaluate(async function(){
      var before=window.__calls.length;
      remiNotesVis1OpenThread('note-moe');
      await new Promise(function(resolve){setTimeout(resolve, 50);});
      var host=document.getElementById('aideOfficeThread');
      var chat=document.getElementById('tab_aidechat');
      return {
        threadHidden:host?host.hidden:true,
        chatActive:!!(chat&&chat.classList.contains('active')),
        notesFn:typeof remiNotesVis1OpenThread==='function',
        view:typeof copilotView==='undefined'?'':copilotView,
        calledNote:(window.__calls||[]).slice(before).some(function(c){return c.name==='remi_list_my_note_thread';})
      };
    });
    assert.strictEqual(notes.threadHidden, true, 'notes tab closes the office pane');
    assert.strictEqual(notes.chatActive, false);
    assert.strictEqual(notes.notesFn, true);
    assert.strictEqual(notes.view, 'notes');
    assert.strictEqual(notes.calledNote, true, 'notes open thread still loads a note');
    await phone.click('#copilotTabRadar');
    await phone.waitForFunction(function(){
      return typeof copilotView!=='undefined' && copilotView==='radar' && document.getElementById('copilotSheet') && !document.getElementById('copilotSheet').hidden;
    }, {timeout:10000});

    const desk = await browser.newPage();
    desk.on('pageerror', function(err){errors.push('desk '+String(err && err.message || err));});
    await desk.setViewport({width:1280, height:900, deviceScaleFactor:1});
    await desk.goto('http://127.0.0.1:'+port+'/index.html?v=remi-open-thread1', {waitUntil:'domcontentloaded', timeout:60000});
    await bootRail(desk, pack);
    await desk.click('#aideOfficeRail .aide-office-open');
    await desk.waitForSelector('#aideOfficeThread:not([hidden])', {timeout:15000});
    const deskView = await desk.evaluate(function(){
      var sheet=document.getElementById('copilotSheet');
      var box=sheet.getBoundingClientRect();
      var host=document.getElementById('aideOfficeThread');
      var chat=document.getElementById('tab_aidechat');
      return {
        left:box.left,
        right:box.right,
        inner:window.innerWidth,
        text:host?host.textContent||'':'',
        chatActive:!!(chat&&chat.classList.contains('active')),
        hidden:host?host.hidden:true
      };
    });
    assert.ok(deskView.left > 200, JSON.stringify(deskView));
    assert.ok(deskView.right <= deskView.inner + 1, JSON.stringify(deskView));
    assert.strictEqual(deskView.hidden, false);
    assert.strictEqual(deskView.chatActive, false);
    assert.ok(deskView.text.indexOf('I have a question about my pay.')>=0, deskView.text);
    await desk.screenshot({path:path.join(outDir, 'remi-open-thread1-desktop.png')});

    const inbox = await browser.newPage();
    inbox.on('pageerror', function(err){errors.push('inbox '+String(err && err.message || err));});
    await inbox.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await inbox.goto('http://127.0.0.1:'+port+'/index.html?v=remi-open-thread1', {waitUntil:'domcontentloaded', timeout:60000});
    await inbox.evaluate(installStub, pack);
    await inbox.evaluate(async function(){
      currentAdminRole = 'Admin';
      currentAdminUsername = 'admin@roles.evercare.local';
      readSbSession = function(){return {access_token:'office-jwt', email:'admin@roles.evercare.local', user:{email:'admin@roles.evercare.local'}};};
      layoutA1ApplyRoles();
      showScreen('adminScreen');
      showTab('aidechat');
      await aidechatOpen();
    });
    await inbox.waitForSelector('#aidechatList .aidechat-card', {timeout:15000});
    await inbox.click('#aidechatList .aidechat-card');
    await inbox.waitForFunction(function(){
      var view=document.getElementById('aidechatThreadView');
      var title=(document.getElementById('aidechatThreadTitle')||{}).textContent||'';
      return view && !view.hidden && title.indexOf('moe')>=0;
    }, {timeout:15000});
    const inboxView = await inbox.evaluate(function(){
      var chat=document.getElementById('tab_aidechat');
      var host=document.getElementById('aideOfficeThread');
      return {
        chatActive:!!(chat&&chat.classList.contains('active')),
        threadHidden:host?host.hidden:true,
        title:(document.getElementById('aidechatThreadTitle')||{}).textContent||''
      };
    });
    assert.strictEqual(inboxView.chatActive, true, 'inbox still opens Messages');
    assert.strictEqual(inboxView.threadHidden, true, 'inbox open does not force the remi pane');
    assert.ok(inboxView.title.indexOf('moe')>=0, inboxView.title);

    assert.deepStrictEqual(errors, []);
    console.log('admin-remi-open-thread1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
