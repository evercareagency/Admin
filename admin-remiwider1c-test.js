#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

assert.ok(html.includes('v=remiwider1c'), 'remiwider1c marker');
assert.ok(html.includes('data-remiwider1c="v=remiwider1c"'), 'remiwider1c string marker');
assert.ok(html.includes('admin-build 2026-09-25-remiwider1c'), 'remiwider1c build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-remiwider1c">'), 'remiwider1c meta');
assert.ok(html.includes('<!-- remi wider tip 1c 2026-09-25 v=remiwider1c admin-build 2026-09-25-remiwider1c'), 'remiwider1c comment');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-26-clienthrs1b'), 'clienthrs1b is the first admin-build meta');
assert.ok(html.indexOf('content="2026-09-25-remiwider1c"') < html.indexOf('content="2026-09-25-remiwider1b"'), 'remiwider1b stays after remiwider1c');
assert.ok(html.indexOf('content="2026-09-25-remiwider1b"') < html.indexOf('content="2026-09-25-remiwider1"'), 'remiwider1 stays after remiwider1b');
['2026-09-25-remiwider1b','2026-09-25-remiwider1','2026-09-25-coverpick1'].forEach(function(meta){
  assert.ok(html.includes('<meta name="admin-build" content="'+meta+'">'), 'prior meta stays '+meta);
});

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
  assert.fail('unclosed ' + sig);
}
const awaiting = extractFn(html, 'function coverAwaiting()');
assert.ok(awaiting.includes("coverAskStatus('awaiting_client'"), 'still deciding asks first');
assert.ok(!awaiting.includes('coverApplyOutcome'), 'still deciding does not write by itself');
assert.ok(!awaiting.includes('coverSelectedAideId'), 'still deciding does not branch on the checked aide');
const ask = extractFn(html, 'function coverAskStatus(outcome, label)');
assert.ok(ask.includes('coverStatusHold=true'), 'opening tap is held');
assert.ok(!ask.includes('coverApplyOutcome'), 'ask does not write');
assert.ok(!ask.includes("scrollIntoView({block:'nearest'})"), 'confirm is not scrolled onto the tap');
const confirm = extractFn(html, 'function coverConfirmStatus()');
assert.ok(confirm.includes('coverStatusHeld(ev)'), 'same gesture cannot confirm');
assert.ok(confirm.includes("coverApplyOutcome('awaiting_client')"), 'confirm posts awaiting_client');
const cancel = extractFn(html, 'function coverCancelStatus()');
assert.ok(cancel.includes("coverStatusPending=''"), 'not yet clears the pending status');
assert.ok(!cancel.includes('coverApplyOutcome'), 'not yet does not write');
assert.ok(html.includes("if(/\\bstill deciding\\b|\\bawaiting client\\b/.test(s))return 'await'"), 'ask routes still deciding');
assert.ok(extractFn(html, 'async function remiWiderCommitAwait(action)').includes("coverApplyOutcome('awaiting_client')"), 'ask confirm reuses the cover outcome');
assert.ok(!/admin_update_client_address|admin_ask_copilot|admin_share_address|admin_still_deciding/.test(html.slice(html.indexOf('// v=remiwider1 tip 1'), html.indexOf('var schedWeekStart'))), 'no new Ace RPC');

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
    console.log('admin-remiwider1c browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : '/usr/local/bin/google-chrome');
  const shotDir = process.env.REMIWIDER_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const server = http.createServer(function(req, res){
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
    const file = path.normalize(path.join(root, rel));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404);res.end('missing');return;}
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
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
  const bowlax = '18acd525-1111-4111-8111-111111111111';
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.goto('http://127.0.0.1:'+port+'/index.html?v=remiwider1c', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(id){
      localStorage.clear();
      currentAdminRole = 'Admin';
      currentAdminUsername = 'mo@evercare.test';
      layoutA1ApplyRoles();
      showScreen('adminScreen');
      window.__bRpc = [];
      coverGo = function(){};
      var aides = [];
      for(var i=0;i<8;i++){
        aides.push({aide_id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa'+i, username:'aide'+i, name:'Aide '+i+' Longname', continuity_score:0, distance_miles:i+1, score:10-i, rank:i+1, phone:'216555010'+i});
      }
      coverRpc = function(kind, body){
        window.__bRpc.push({kind:kind, body:body||{}});
        if(kind==='list'){
          return Promise.resolve({ok:true, data:{success:true, shifts:[{
            open_shift_id:id, status:'open', source:'office', client_name:'Bowlax', regular_aide_name:'Ada Cole',
            regular_aide_id:'33333333-3333-4333-8333-333333333333', client_id:'66666666-6666-4666-8666-666666666666',
            shift_start:'2026-09-27T16:00:00Z', shift_end:'2026-09-27T20:00:00Z',
            client_phone:'', case_manager_email:'', case_manager_name:'', client_home_address:''
          }]}});
        }
        if(kind==='rank')return Promise.resolve({ok:true, data:{success:true, aides:aides}});
        if(kind==='outcome')return Promise.resolve({ok:true, data:{success:true, status:(body&&body.p_outcome)||'open', open_shift_id:id}});
        return Promise.resolve({missing:true});
      };
      showTab('coverage');
    }, bowlax);
    await page.waitForSelector('[data-cover-id="'+bowlax+'"]');
    await page.click('[data-cover-id="'+bowlax+'"]');
    await page.waitForSelector('#coverOutcomeView:not([hidden])');
    await page.waitForFunction(function(){return document.querySelectorAll('[data-cover-aide]').length>=1;});

    const pos = await page.evaluate(function(){
      var el = document.getElementById('coverAwaitBtn');
      var nav = document.querySelector('.bottom-nav');
      var navTop = nav.getBoundingClientRect().top;
      var r = el.getBoundingClientRect();
      window.scrollBy(0, r.bottom - (navTop - 4));
      r = el.getBoundingClientRect();
      var y = Math.min(r.bottom - 6, navTop - 10);
      var x = r.left + r.width / 2;
      return {x:x, y:y, aide:String(coverSelectedAideId||''), hit:(document.elementFromPoint(x,y)||{}).id||''};
    });
    assert.strictEqual(pos.aide, '', 'no aide is checked');
    assert.strictEqual(pos.hit, 'coverAwaitBtn', 'tap lands on Still deciding '+JSON.stringify(pos));
    await page.touchscreen.tap(pos.x, pos.y);
    await page.waitForSelector('#coverStatusConfirm:not([hidden])');
    await page.evaluate(function(p){
      var hit = document.elementFromPoint(p.x, p.y);
      if(hit && hit.click)hit.click();
      var go = document.getElementById('coverStatusGo');
      if(go)go.click();
    }, pos);
    const gate = await page.evaluate(function(){
      function box(id){
        var el = document.getElementById(id);
        var r = el.getBoundingClientRect();
        return {id:id, h:el.offsetHeight, top:r.top, bottom:r.bottom, text:(el.innerText||'').replace(/\s+/g,' ').trim()};
      }
      var nav = document.querySelector('.bottom-nav').getBoundingClientRect().top;
      var toast = document.getElementById('nciToast');
      var shift = coverFind(coverSelectedId)||{};
      return {
        note: document.getElementById('coverStatusNote').innerText,
        hidden: document.getElementById('coverStatusConfirm').hidden,
        go: box('coverStatusGo'),
        stop: box('coverStatusNotYet'),
        nav: nav,
        aide: String(coverSelectedAideId||''),
        status: shift.status,
        toast: toast && toast.style.display!=='none' ? toast.textContent : '',
        outcomes: window.__bRpc.filter(function(r){return r.kind==='outcome';}).length,
        build: document.querySelector('meta[name="admin-build"]').content
      };
    });
    assert.strictEqual(gate.build, '2026-09-26-clienthrs1b');
    assert.strictEqual(gate.hidden, false);
    assert.strictEqual(gate.aide, '');
    assert.ok(/Not yet writes nothing/.test(gate.note), gate.note);
    assert.ok(gate.go.h >= 44 && gate.stop.h >= 44, 'taps '+gate.go.h+'/'+gate.stop.h);
    assert.ok(gate.go.bottom <= gate.nav + 1 && gate.stop.bottom <= gate.nav + 1, 'confirm stays above the nav '+JSON.stringify(gate));
    assert.strictEqual(gate.status, 'open');
    assert.strictEqual(gate.outcomes, 0, 'opening tap and the follow-up click do not write');
    assert.ok(!/Still deciding\./.test(gate.toast), 'no green banner '+gate.toast);
    await page.screenshot({path: path.join(shotDir, 'remiwider1c-preaide-gate.png')});

    await page.click('#coverStatusNotYet');
    const held = await page.evaluate(function(){
      var toast = document.getElementById('nciToast');
      var shift = coverFind(coverSelectedId)||{};
      return {
        hidden: document.getElementById('coverStatusConfirm').hidden,
        status: shift.status,
        aide: String(coverSelectedAideId||''),
        outcomes: window.__bRpc.filter(function(r){return r.kind==='outcome';}).length,
        toast: toast && toast.style.display!=='none' ? toast.textContent : '',
        onOutcome: !document.getElementById('coverOutcomeView').hidden
      };
    });
    assert.strictEqual(held.hidden, true);
    assert.strictEqual(held.status, 'open');
    assert.strictEqual(held.outcomes, 0, 'Not yet writes nothing');
    assert.strictEqual(held.onOutcome, true);
    assert.ok(!/Still deciding\./.test(held.toast), held.toast);
    assert.strictEqual(await page.evaluate(function(){return document.getElementById('coverStatusConfirm').offsetHeight;}), 0);
    await page.evaluate(function(){
      document.getElementById('coverAwaitBtn').scrollIntoView({block:'center'});
    });
    await page.screenshot({path: path.join(shotDir, 'remiwider1c-not-yet.png')});

    await page.evaluate(function(){
      var el = document.getElementById('coverAwaitBtn');
      el.scrollIntoView({block:'center'});
    });
    await page.click('#coverAwaitBtn');
    await page.waitForSelector('#coverStatusConfirm:not([hidden])');
    await page.click('#coverStatusGo');
    await page.waitForFunction(function(){
      return window.__bRpc.some(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='awaiting_client';});
    });
    const decided = await page.evaluate(function(id){
      var hit = window.__bRpc.filter(function(r){return r.kind==='outcome' && r.body && r.body.p_outcome==='awaiting_client';});
      return {n:hit.length, id:hit[0] && hit[0].body.p_open_shift_id};
    }, bowlax);
    assert.strictEqual(decided.n, 1);
    assert.strictEqual(decided.id, bowlax);

    await page.evaluate(function(id){
      var shift = coverFind(id);
      shift.status = 'open';
      coverPostedKey = '';
      coverBusy = false;
      window.__bRpc = [];
      coverOpenOutcome(id);
    }, bowlax);
    await page.waitForSelector('#coverOutcomeView:not([hidden])');
    const asked = await page.evaluate(function(){
      var pack = remiWiderAnswer('still deciding');
      return {
        text: pack && pack.text,
        kinds: (pack && pack.actions || []).map(function(a){return a.kind;}),
        outcomes: window.__bRpc.filter(function(r){return r.kind==='outcome';}).length
      };
    });
    assert.ok(/Nothing is saved until you confirm/.test(asked.text), asked.text);
    assert.ok(asked.kinds.indexOf('wider-await') >= 0, asked.kinds.join(','));
    assert.strictEqual(asked.outcomes, 0, 'Ask does not write before Confirm');

    await page.click('#copilotFab');
    await page.waitForSelector('#copilotTabAsk', {visible:true});
    await page.click('#copilotTabAsk');
    await page.waitForSelector('#copilotChatInput', {visible:true});
    await page.evaluate(function(){
      document.getElementById('copilotChatInput').value = 'still deciding';
    });
    await page.click('#copilotChatSend');
    await page.waitForFunction(function(){
      return /Nothing is saved until you confirm/.test(document.getElementById('copilotThread').innerText);
    });
    await page.evaluate(function(){
      var buttons = Array.prototype.slice.call(document.querySelectorAll('#copilotThread .copilot-actions .btn'));
      var btn = buttons.filter(function(b){return b.textContent==='Still deciding';}).pop();
      btn.scrollIntoView({block:'center'});
      btn.click();
    });
    await page.waitForSelector('#copilotConfirm:not([hidden])');
    const askGate = await page.evaluate(function(){
      function box(id){
        var el = document.getElementById(id);
        return {h:el.offsetHeight, disabled:!!el.disabled};
      }
      return {
        go: box('copilotConfirmGo'),
        stop: box('copilotConfirmNotYet'),
        outcomes: window.__bRpc.filter(function(r){return r.kind==='outcome';}).length
      };
    });
    assert.ok(askGate.go.h >= 44 && askGate.stop.h >= 44, 'ask taps '+askGate.go.h+'/'+askGate.stop.h);
    assert.strictEqual(askGate.go.disabled, false);
    assert.strictEqual(askGate.outcomes, 0);
    await page.click('#copilotConfirmNotYet');
    const askHeld = await page.evaluate(function(){
      return window.__bRpc.filter(function(r){return r.kind==='outcome';}).length;
    });
    assert.strictEqual(askHeld, 0, 'Ask Not yet writes nothing');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().then(function(){
  console.log('admin-remiwider1c-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
