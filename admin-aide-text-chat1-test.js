#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=aide-text-chat1'), 'aide-text-chat1 marker');
assert.ok(html.includes('data-aide-text-chat1="v=aide-text-chat1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-27-aide-text-chat1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aide-text-chat1">'), 'meta');
assert.ok(html.includes('<!-- aide text chat 2026-09-27 v=aide-text-chat1 admin-build 2026-09-27-aide-text-chat1'), 'comment');
assert.ok(html.includes("var AIDE_TEXT_CHAT1_MARKER='v=aide-text-chat1'"), 'script marker');
assert.ok(html.includes('GHOST-AIDE-TEXT-CHAT1-CONTRACT-v1'), 'contract name');
assert.ok(html.includes('Ace CALLABLE. MERGE HOLD. Do not claim LIVE.'), 'callable and merge hold');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 80).includes('2026-09-27-hold-clear1'), 'first admin-build is hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-hold-clear1"') < html.indexOf('content="2026-09-27-sched-time-tap1"'), 'sched-time-tap1 stays after hold-clear1');
assert.ok(html.indexOf('content="2026-09-27-sched-time-tap1"') < html.indexOf('content="2026-09-27-aide-text-chat1"'), 'aide-text-chat1 stays after sched-time-tap1');
assert.ok(html.indexOf('content="2026-09-27-aide-text-chat1"') < html.indexOf('content="2026-09-27-remi-float-hide1"'), 'remi-float-hide1 stays after aide-text-chat1');
assert.ok(html.indexOf('content="2026-09-27-remi-float-hide1"') < html.indexOf('content="2026-09-27-tabbar-8"'), 'tabbar-8 stays after remi-float-hide1');
assert.ok(html.indexOf('content="2026-09-27-tabbar-8"') < html.indexOf('content="2026-09-27-cover-card-cancel1"'), 'cover-card-cancel1 stays after tabbar-8');
assert.ok(html.indexOf('content="2026-09-27-cover-card-cancel1"') < html.indexOf('content="2026-09-27-nosvc-reason-draft1"'), 'nosvc-reason-draft1 stays after cover-card-cancel1');
assert.ok(html.indexOf('content="2026-09-27-nosvc-reason-draft1"') < html.indexOf('content="2026-09-27-cover-unselect1"'), 'cover-unselect1 stays after nosvc-reason-draft1');
assert.ok(html.indexOf('content="2026-09-27-cover-unselect1"') < html.indexOf('content="2026-09-27-remi-payroll1"'), 'remi-payroll1 stays after cover-unselect1');
['v=remi-float-hide1','v=tabbar-8','v=cover-card-cancel1','v=nosvc-reason-draft1','cancel-shift1','v=cover-unselect1','v=remi-payroll1','v=client-ins1','v=aidechat1','v=covercomms1','v=vapid1','v=clienthrs1d'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-nosvc-reason-draft1">'), 'nosvc-reason-draft1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-cover-unselect1">'), 'cover-unselect1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-remi-payroll1">'), 'remi-payroll1 meta stays');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-aidechat1">'), 'aidechat1 meta stays');

const desk = html.slice(html.indexOf('id="tab_coverage"'), html.indexOf('id="tab_backups"'));
assert.ok(desk.includes('>Text this aide<') && desk.includes('>Text client<'), 'both text buttons stay');
assert.ok(desk.includes('id="coverAideTextSub"'), 'subtitle on the contact sheet');
assert.ok(desk.includes('Messages (push notifies phone)'), 'subtitle copy');
assert.ok(html.includes('data-cover-text-aide='), 'coverage list Text this aide');
assert.ok(desk.includes('phone_required: false'), 'phone is not required on the sheet');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + sig);
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + sig);
}

const textAide = extractFn(html, 'function coverTextAide()');
assert.ok(textAide.includes('aideTextChatCompose'), 'Text this aide opens the messages draft');
assert.ok(!textAide.includes('coverAskOutbound'), 'Text this aide does not open SMS Confirm');
assert.ok(!textAide.includes('coverSmsHref'), 'Text this aide does not build an sms link');
assert.ok(!textAide.includes('coverAidePhone'), 'Text this aide does not read a phone');
assert.ok(!/needs_phone|no_phone_on_file|No phone is on file/.test(textAide), 'no phone gate on Text this aide');

const textClient = extractFn(html, 'function coverMarkContact(kind)');
assert.ok(textClient.includes("coverAskOutbound('sms'"), 'Text client still drafts from the client phone');
assert.ok(textClient.includes('coverClientPhone'), 'Text client still uses the client phone');

const blockStart = html.indexOf('// v=aide-text-chat1 Text this aide');
const blockEnd = html.indexOf('// v=vapid1 Ace CALLABLE', blockStart);
assert.ok(blockStart > 0 && blockEnd > blockStart, 'script block');
const block = html.slice(blockStart, blockEnd);
assert.ok(block.includes('admin_compose_aide_text'), 'compose rpc');
assert.ok(block.includes('admin_send_aide_text'), 'send rpc');
assert.ok(block.includes('admin_get_aide_text_channel'), 'channel rpc');
assert.ok(block.includes("admin/messages?aide_id="), 'admin deep link');
assert.ok(block.includes('caregiver/messages'), 'caregiver deep link');
assert.ok(block.includes('has_push_subscription'), 'push is chrome only');
assert.ok(block.includes('phone_required:false') || block.includes('phoneRequired:false'), 'phone_required false');
assert.ok(block.includes('smsSent:false'), 'sms_sent stays false');
assert.ok(block.includes('autoSent:false'), 'compose does not auto-send');
assert.ok(!/sms:|mailto:|fetch\(/.test(block), 'this block does not open a phone text or mail');
assert.ok(!/needs_phone|no_phone_on_file|No phone is on file/.test(block), 'no aide phone gate in the block');
assert.ok(!/reset_aide_temp_password|admin_set_role_password|mossier|auth\.updateUser/.test(block), 'no Auth reseal');
assert.ok(!/\bQuo\b|twilio|admin_text_client/.test(block), 'no Quo and no invented client text rpc');
assert.ok(block.includes('42501'), 'nurse denial stays visible to the desk');
assert.ok(!block.includes('remi-langs1') && !block.includes('remi-float-hide1'), 'this tip does not touch langs or float-hide WIP');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(extractFn(html, 'function aideTextChatUuid(v)'), ctx);
vm.runInContext('function clienthrs1dUuid(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||"").trim());}', ctx);
assert.strictEqual(vm.runInContext('aideTextChatUuid("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")', ctx), true);
assert.strictEqual(vm.runInContext('aideTextChatUuid("")', ctx), false);
assert.strictEqual(vm.runInContext('aideTextChatUuid("sara")', ctx), false);

console.log('admin-aide-text-chat1 unit ok');

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
    console.log('admin-aide-text-chat1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.AIDE_TEXT_SHOTS || '/opt/cursor/artifacts';
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
  const AIDE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const CLIENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  try{
    const page = await browser.newPage();
    page.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=aide-text-chat1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(aideId){
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('evercare_sb_session', JSON.stringify({access_token:'office-test', role:'Admin'}));
      window.__sbSession = {access_token:'office-test', role:'Admin'};
      window.__aideTextCalls = [];
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      navEditApply();
      showScreen('adminScreen');
      sbRestRpc = async function(name, body){
        window.__aideTextCalls.push({name:name, body:body||{}});
        if(name==='admin_compose_aide_text'){
          return {ok:true, data:{
            success:true, ok:true, marker:'aide-text-chat1', v:'aide-text-chat1',
            channel:'in_app_messages', sms_sent:false, phone_required:false,
            aide_id:body.p_aide_id, aide_name:'Sara Alvarez', aide_username:'sara',
            client_id:body.p_client_id||null,
            thread_id:'11111111-1111-4111-8111-111111111111',
            admin_deep_link:'admin/messages?aide_id='+body.p_aide_id,
            caregiver_deep_link:'caregiver/messages',
            draft:{body:body.p_body||null, ready:true},
            actions:{open_messages:true, send_rpc:'admin_send_aide_text', label:'Send in Messages'},
            auto_sent:false
          }};
        }
        if(name==='admin_get_aide_text_channel'){
          return {ok:true, data:{channel:'in_app_messages', phone_required:false, has_push_subscription:false}};
        }
        if(name==='admin_send_aide_text'){
          return {ok:true, data:{
            success:true, ok:true, channel:'in_app_messages', sms_sent:false, phone_required:false,
            thread_id:'11111111-1111-4111-8111-111111111111',
            push_job_id:'22222222-2222-4222-8222-222222222222',
            message:{body:body.p_body}
          }};
        }
        if(name==='admin_list_aide_office_threads')return {ok:true, data:{threads:[]}};
        if(name==='admin_list_aide_office_messages')return {ok:true, data:{messages:[]}};
        if(name==='admin_get_aide_chat_remi_settings')return {ok:true, data:{enabled:false, start_local:'14:00', end_local:'08:00', timezone:'America/New_York'}};
        if(name==='admin_mark_aide_office_messages_read')return {ok:true, data:{ok:true}};
        return {ok:true, data:{ok:true, success:true}};
      };
      document.getElementById('tab_coverage').classList.add('active');
      coverShifts=[{
        id:'os-ada',
        clientId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        clientName:'Ada Cole',
        aideName:'Kim',
        startsAt:'2026-09-28T12:00:00Z',
        endsAt:'2026-09-28T16:00:00Z',
        status:'open',
        phone:'',
        source:'ace'
      }];
      coverSelectedId='os-ada';
      coverRanks=[{id:aideId, username:'sara', name:'Sara Alvarez', phone:'', distance:1.2, continuity:2, score:9, rank:1}];
      coverSelectedAideId=aideId;
      coverShow('outcome');
      coverPaintOutcome();
      coverPaintRanks(coverRanks);
    }, AIDE);

    const sheet = await page.evaluate(function(){
      var note = document.getElementById('coverAideTextSub');
      var btn = document.getElementById('coverTextAideBtn');
      return {
        label: btn ? btn.textContent : '',
        sub: note ? note.textContent : '',
        phoneChip: document.getElementById('coverAideTextChips').innerText,
        hiddenGate: (document.getElementById('coverOutboundConfirm')||{}).hidden
      };
    });
    assert.strictEqual(sheet.label, 'Text this aide');
    assert.strictEqual(sheet.sub, 'Messages (push notifies phone)');
    assert.ok(sheet.phoneChip.includes('phone_required: false'));
    assert.ok(sheet.phoneChip.includes('in_app_messages'));
    assert.strictEqual(sheet.hiddenGate, true);
    await page.screenshot({path:path.join(shotDir, 'aide-text-chat1-phone-coverage.png')});

    await page.evaluate(function(){return coverTextAide();});
    await page.waitForFunction(function(){
      return (window.__aideTextCalls||[]).some(function(c){return c.name==='admin_compose_aide_text';});
    }, {timeout:8000});
    const composed = await page.evaluate(function(){
      var calls = window.__aideTextCalls.filter(function(c){return c.name==='admin_compose_aide_text'||c.name==='admin_send_aide_text'||c.name==='admin_get_aide_text_channel'||c.name==='admin_send_aide_office_message';});
      var box = document.getElementById('aidechatReply');
      var send = document.getElementById('aidechatSend');
      return {
        calls: calls,
        title: document.getElementById('aidechatThreadTitle').textContent,
        sub: document.getElementById('aideTextChatSub').textContent,
        subHidden: document.getElementById('aideTextChatSub').hidden,
        chips: document.getElementById('aideTextChatChips').innerText,
        draft: box ? box.value : '',
        sendLabel: send ? send.textContent : '',
        sendDisabled: !!(send && send.disabled),
        link: document.documentElement.getAttribute('data-aide-text-deep-link'),
        threadHidden: document.getElementById('aidechatThreadView').hidden,
        visible: document.body.innerText
      };
    });
    const composeCalls = composed.calls.filter(function(c){return c.name==='admin_compose_aide_text';});
    const sendCalls = composed.calls.filter(function(c){return c.name==='admin_send_aide_text';});
    const officeCalls = composed.calls.filter(function(c){return c.name==='admin_send_aide_office_message';});
    assert.strictEqual(composeCalls.length, 1, 'compose once');
    assert.strictEqual(sendCalls.length, 0, 'compose does not send');
    assert.strictEqual(officeCalls.length, 0, 'compose does not call the office send');
    assert.strictEqual(composeCalls[0].body.p_aide_id, AIDE);
    assert.strictEqual(composeCalls[0].body.p_client_id, CLIENT);
    assert.ok(composeCalls[0].body.p_body && composeCalls[0].body.p_body.indexOf('Sara') >= 0, 'draft prefill');
    assert.ok(!composeCalls[0].body.p_phone, 'compose body has no phone');
    assert.strictEqual(composed.title, 'Sara Alvarez');
    assert.strictEqual(composed.sub, 'Messages (push notifies phone)');
    assert.strictEqual(composed.subHidden, false);
    assert.ok(composed.chips.includes('phone_required: false'));
    assert.ok(composed.chips.includes('Push is not required'));
    assert.ok(composed.draft.indexOf('Sara') >= 0, 'composer holds the draft');
    assert.strictEqual(composed.sendLabel, 'Send in Messages');
    assert.strictEqual(composed.sendDisabled, false, 'missing push is not a blocker');
    assert.ok(String(composed.link).indexOf('admin/messages?aide_id='+AIDE) === 0, 'deep link');
    assert.strictEqual(composed.threadHidden, false);
    assert.ok(!composed.visible.includes('No phone is on file'), 'aide messages does not show the phone gate');
    assert.ok(!composed.visible.includes('needs_phone'), 'no needs_phone copy');
    await page.evaluate(function(){
      var box = document.getElementById('aidechatReply');
      if(box && box.scrollIntoView)box.scrollIntoView({block:'center'});
    });
    await page.screenshot({path:path.join(shotDir, 'aide-text-chat1-phone-compose.png')});

    await page.evaluate(function(){
      return aidechatSendOffice({preventDefault:function(){}});
    });
    await page.waitForFunction(function(){
      return (window.__aideTextCalls||[]).some(function(c){return c.name==='admin_send_aide_text';});
    }, {timeout:8000});
    const sent = await page.evaluate(function(){
      var calls = window.__aideTextCalls.filter(function(c){return c.name==='admin_send_aide_text'||c.name==='admin_send_aide_office_message';});
      return {
        calls: calls,
        chips: document.getElementById('aideTextChatChips').innerText,
        bubble: document.getElementById('aidechatMessages').innerText,
        draftLeft: document.getElementById('aidechatReply').value
      };
    });
    assert.strictEqual(sent.calls.filter(function(c){return c.name==='admin_send_aide_text';}).length, 1);
    assert.strictEqual(sent.calls.filter(function(c){return c.name==='admin_send_aide_office_message';}).length, 0, 'send uses admin_send_aide_text only');
    assert.ok(sent.chips.includes('sms_sent: false'));
    assert.ok(sent.chips.includes('phone_required: false'));
    assert.ok(sent.chips.includes('push_job_id'));
    assert.ok(sent.bubble.includes('Moe (Manager)'));
    assert.ok(sent.bubble.includes('Sara'));
    assert.strictEqual(sent.draftLeft, '');
    await page.screenshot({path:path.join(shotDir, 'aide-text-chat1-phone-sent.png')});

    const deskPage = await browser.newPage();
    deskPage.on('pageerror', function(err){errors.push(String(err && err.message || err));});
    await deskPage.setViewport({width:1280, height:800, deviceScaleFactor:1});
    await deskPage.goto('http://127.0.0.1:'+port+'/index.html?v=aide-text-chat1', {waitUntil:'domcontentloaded', timeout:20000});
    await deskPage.evaluate(function(aideId){
      localStorage.setItem('evercare_sb_session', JSON.stringify({access_token:'office-test', role:'Admin'}));
      window.__sbSession = {access_token:'office-test', role:'Admin'};
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      showScreen('adminScreen');
      sbRestRpc = async function(name, body){
        if(name==='admin_compose_aide_text'){
          return {ok:true, data:{
            success:true, ok:true, channel:'in_app_messages', sms_sent:false, phone_required:false,
            aide_name:'Sara Alvarez', aide_username:'sara', client_id:body.p_client_id||null,
            thread_id:'11111111-1111-4111-8111-111111111111',
            admin_deep_link:'admin/messages?aide_id='+body.p_aide_id,
            draft:{body:body.p_body||null, ready:true}, auto_sent:false
          }};
        }
        if(name==='admin_get_aide_text_channel')return {ok:true, data:{channel:'in_app_messages', phone_required:false, has_push_subscription:false}};
        if(name==='admin_send_aide_text')return {ok:true, data:{ok:true, success:true, channel:'in_app_messages', sms_sent:false, phone_required:false, push_job_id:'22222222-2222-4222-8222-222222222222'}};
        if(name==='admin_list_aide_office_threads')return {ok:true, data:{threads:[]}};
        if(name==='admin_list_aide_office_messages')return {ok:true, data:{messages:[]}};
        if(name==='admin_get_aide_chat_remi_settings')return {ok:true, data:{enabled:false, start_local:'14:00', end_local:'08:00', timezone:'America/New_York'}};
        return {ok:true, data:{ok:true, success:true}};
      };
      coverShifts=[{id:'os-ada', clientId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', clientName:'Ada Cole', startsAt:'2026-09-28T12:00:00Z', endsAt:'2026-09-28T16:00:00Z', status:'open', phone:'', source:'ace'}];
      coverSelectedId='os-ada';
      coverRanks=[{id:aideId, username:'sara', name:'Sara Alvarez', phone:'', rank:1}];
      coverSelectedAideId=aideId;
      return coverTextAide();
    }, AIDE);
    await deskPage.screenshot({path:path.join(shotDir, 'aide-text-chat1-desktop-compose.png')});
    await deskPage.evaluate(function(){return aidechatSendOffice({preventDefault:function(){}});});
    await deskPage.screenshot({path:path.join(shotDir, 'aide-text-chat1-desktop-sent.png')});
    await deskPage.close();

    const nurse = await page.evaluate(function(){
      currentAdminRole = 'Nurse';
      window.__aideTextCalls = [];
      return aideTextChatCompose({aideId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', aideName:'Sara', body:'Hi'}).then(function(got){
        return {ok:got && got.ok, denied:!!(got && got.denied), calls:window.__aideTextCalls.length};
      });
    });
    assert.strictEqual(nurse.ok, false);
    assert.strictEqual(nurse.denied, true);
    assert.strictEqual(nurse.calls, 0, 'nurse does not post');

    assert.deepStrictEqual(errors, [], errors.join('\n'));
    console.log('admin-aide-text-chat1 browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
