#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const JANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const SAM = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';

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

assert.ok(html.includes('v=aides-profile-link1'), 'marker');
assert.ok(html.includes('?v=aides-profile-link1'), 'query marker');
assert.ok(html.includes('data-aides-profile-link1="v=aides-profile-link1"'), 'data attr');
assert.ok(html.includes('admin-build 2026-09-28-aides-profile-link1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-aides-profile-link1">'), 'meta');
assert.ok(html.includes('<!-- aides profile link 2026-09-28 v=aides-profile-link1 ?v=aides-profile-link1 admin-build 2026-09-28-aides-profile-link1'), 'comment');
assert.ok(html.includes("var AIDES_PROFILE_LINK1_MARKER='v=aides-profile-link1'"), 'script marker');
assert.ok(html.includes("var AIDES_PROFILE_LINK1_BUILD='2026-09-28-aides-profile-link1'"), 'script build');
assert.ok(html.includes('GHOST-AIDES-PROFILE-LINK1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('Ace NO CALLABLE'), 'no new callable');
assert.ok(html.includes('MERGE HOLD') && html.includes('Do not claim LIVE') && html.includes('Do not squash-merge'), 'merge hold');
assert.ok(html.includes('admin/aides?aide_id='), 'deep link form is documented');
assert.ok(html.includes('#tab_aides article.aide-info-card.is-focus'), 'focus highlight');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-28-cover-desk1"') < html.indexOf('content="2026-09-28-aides-profile-link1"'), 'profile meta follows cover-desk1');
['v=aides-info1','v=list-az-sticky1','v=cover-desk1','v=punch-leftovers1','v=list-az1','2026-09-27-aides-info1','2026-09-28-list-az-sticky1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker stays ' + mark);
});
assert.ok(html.includes('<meta name="admin-build" content="2026-09-27-aides-info1">'), 'aides-info1 meta stays');
assert.ok(extractFn(html, 'function aidesInfo1Reset()').includes('confirmResetAideTempPassword'), 'reset stays');
assert.ok(extractFn(html, 'function aidesInfo1Delete()').includes('confirmSoftDeleteAide'), 'delete stays');
assert.ok(extractFn(html, 'function aidesInfo1ViewProfile()').includes('aidesInfo1Follow'), 'view profile still follows deep_link');
const fallback = html.slice(html.indexOf('async function renderAides'), html.indexOf('var aideCredState'));
assert.ok(fallback.includes('class="aide-row-card"'), 'fallback cards stay');
assert.ok(fallback.includes('listAzSticky1StageHtml'), 'list-az-sticky1 fallback stays');
assert.ok(fallback.includes('data-aide-id='), 'fallback cards carry aide id');

function classList(){
  const set = new Set();
  return {
    add:function(c){set.add(c);},
    remove:function(c){set.delete(c);},
    contains:function(c){return set.has(c);}
  };
}
function card(id){
  const el = {
    kind:'info',
    attrs:{'data-aide-id':id, class:'aide-info-card'},
    classList:classList(),
    focused:false,
    scrolled:null,
    getAttribute:function(k){return this.attrs[k] || '';},
    setAttribute:function(k, v){this.attrs[k] = v;},
    focus:function(){this.focused = true;},
    scrollIntoView:function(opts){this.scrolled = opts || true;}
  };
  return el;
}
const jane = card(JANE);
const sam = card(SAM);
const cards = [jane, sam];
const els = {
  aidesContainer:{
    id:'aidesContainer',
    querySelectorAll:function(){return cards;}
  },
  tab_aides:{id:'tab_aides'},
  tab_schedule:{id:'tab_schedule'},
  tab_clients:{id:'tab_clients'},
  aideInfoSheet:{id:'aideInfoSheet', hidden:true},
  aideInfoSheetTitle:{textContent:''},
  aideInfoSheetActions:{innerHTML:''}
};
const toasts = [];
const tabs = [];
const box = {
  aidesProfileLink1Pending:'',
  aidesProfileLink1Seq:0,
  aidesProfileLink1PaintSeq:0,
  aidesInfo1Current:null,
  aidesInfo1ByKey:{},
  schedPendingDeepLink:null,
  aideDesk:'active',
  currentAdminRole:'Admin',
  document:{
    getElementById:function(id){return els[id] || null;}
  },
  showTempMsg:function(msg){toasts.push(msg);},
  showTab:function(tab){tabs.push(tab);},
  canManageAides:function(){return true;},
  confirmResetAideTempPassword:function(){},
  confirmSoftDeleteAide:function(){},
  decodeURIComponent:decodeURIComponent,
  String:String,
  Number:Number
};
const src = [
  'var aidesProfileLink1Pending="";',
  'var aidesProfileLink1Seq=0;',
  'var aidesProfileLink1PaintSeq=0;',
  'var aidesInfo1Current=null;',
  'var aidesInfo1ByKey={};',
  extractFn(html, 'function aidesProfileLink1Parse(link)'),
  extractFn(html, 'function aidesProfileLink1Cards()'),
  extractFn(html, 'function aidesProfileLink1Focus(aideId)'),
  extractFn(html, 'function aidesProfileLink1NotePaint()'),
  extractFn(html, 'function aidesProfileLink1AfterPaint()'),
  extractFn(html, 'function aidesProfileLink1Open(aideId)'),
  extractFn(html, 'function aidesInfo1Follow(link)'),
  extractFn(html, 'function aidesInfo1CloseSheet()'),
  extractFn(html, 'function aidesInfo1ViewProfile()'),
  extractFn(html, 'function aidesInfo1Reset()'),
  extractFn(html, 'function aidesInfo1Delete()')
].join('\n');
vm.createContext(box);
vm.runInContext(src, box);

assert.strictEqual(box.aidesProfileLink1Parse('admin/aides?aide_id=' + JANE), JANE);
assert.strictEqual(box.aidesProfileLink1Parse('#admin/aides?aide_id=' + JANE), JANE);
assert.strictEqual(box.aidesProfileLink1Parse('/admin/aides?aide_id=' + encodeURIComponent(SAM)), SAM);
assert.strictEqual(box.aidesProfileLink1Parse('aides?aide_id=' + JANE), JANE);
assert.strictEqual(box.aidesProfileLink1Parse('https://office.example/admin/aides?aide_id=' + JANE + '#card'), JANE);
assert.strictEqual(box.aidesProfileLink1Parse('?aide_id=' + SAM), SAM);
assert.strictEqual(box.aidesProfileLink1Parse('admin/messages?aide_id=' + JANE), '', 'messages stays off the aides parser');
assert.strictEqual(box.aidesProfileLink1Parse('aides'), '');
assert.strictEqual(box.aidesProfileLink1Parse('admin/aides'), '');
assert.strictEqual(box.aidesProfileLink1Parse(''), '');

box.aidesInfo1Follow('admin/aides?aide_id=' + SAM);
assert.deepStrictEqual(tabs, ['aides']);
assert.deepStrictEqual(toasts, [], 'string deep link does not toast');
assert.ok(sam.classList.contains('is-focus'), 'sam card is highlighted');
assert.strictEqual(jane.classList.contains('is-focus'), false);
assert.strictEqual(sam.focused, true, 'sam card is focused');
assert.ok(sam.scrolled && sam.scrolled.block === 'center', 'sam card scrolls into view');

tabs.length = 0;
box.aidesInfo1Follow('#/admin/aides?aide_id=' + JANE);
assert.deepStrictEqual(tabs, ['aides']);
assert.deepStrictEqual(toasts, []);
assert.ok(jane.classList.contains('is-focus'));
assert.strictEqual(sam.classList.contains('is-focus'), false, 'previous highlight clears');

tabs.length = 0;
box.aidesInfo1Follow('admin/aides?aide_id=cccccccc-cccc-4ccc-8ccc-ccccccccccc3');
assert.deepStrictEqual(tabs, ['aides'], 'missing card still opens Aides');
assert.deepStrictEqual(toasts, [], 'missing card does not toast once Aides opens');

tabs.length = 0;
box.aidesInfo1Follow('schedule');
assert.deepStrictEqual(tabs, ['schedule'], 'bare tab name still opens that tab');
assert.deepStrictEqual(toasts, []);

tabs.length = 0;
box.aidesInfo1Follow('#clients');
assert.deepStrictEqual(tabs, ['clients']);
assert.deepStrictEqual(toasts, []);

tabs.length = 0;
box.aidesInfo1Follow({client_id:'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', on_date:'2026-09-28', slot_key:'pm'});
assert.deepStrictEqual(tabs, ['schedule']);
assert.strictEqual(box.schedPendingDeepLink.on_date, '2026-09-28');
assert.strictEqual(box.schedPendingDeepLink.slot_key, 'pm');
assert.deepStrictEqual(toasts, []);

tabs.length = 0;
box.aidesInfo1Follow({surface:'aides'});
assert.deepStrictEqual(tabs, ['aides']);
assert.deepStrictEqual(toasts, []);

box.aidesInfo1Follow('');
box.aidesInfo1Follow('not-a-desk');
box.aidesInfo1Follow('admin/messages?aide_id=' + JANE);
assert.deepStrictEqual(toasts, [
  'No profile link on this aide.',
  'No profile link on this aide.',
  'No profile link on this aide.'
]);

toasts.length = 0;
tabs.length = 0;
box.aidesInfo1Current = {name:'Sam Okonkwo', username:'sokonkwo', id:SAM, deep_link:'admin/aides?aide_id=' + SAM};
box.aidesInfo1ViewProfile();
assert.strictEqual(els.aideInfoSheet.hidden, true, 'view profile closes the sheet');
assert.deepStrictEqual(tabs, ['aides']);
assert.deepStrictEqual(toasts, []);
assert.ok(sam.classList.contains('is-focus'));

box.aidesInfo1Current = {username:'sokonkwo', deep_link:'admin/aides?aide_id=' + SAM};
box.aidesInfo1Reset();
assert.strictEqual(els.aideInfoSheet.hidden, true);
console.log('admin-aides-profile-link1-test: unit ok');

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
    console.log('admin-aides-profile-link1 browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.AIDES_PROFILE_LINK1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive:true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.js':'text/javascript'};
  const server = http.createServer(function(req, res){
    const url = (req.url || '/').split('?')[0];
    const rel = url === '/' ? '/index.html' : url;
    const file = path.join(root, decodeURIComponent(rel));
    if(!file.startsWith(root)){res.writeHead(404); res.end('no'); return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404); res.end('missing'); return;}
      res.writeHead(200, {'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const aides = [];
  for(let n = 0; n < 8; n++){
    const id = '11111111-1111-4111-8111-11111111111' + n;
    aides.push({
      id:id,
      username:'aide' + n,
      full_name:'Aide ' + n + ' Person',
      initials:'A' + n,
      phone:'216555010' + n,
      preferred_language_label:'en',
      clients:[{name:'Client ' + n}],
      next_status:'open',
      next_label:'Open',
      is_active:true,
      deep_link:'admin/aides?aide_id=' + id
    });
  }
  const target = aides[7].id;
  const browser = await puppeteer.launch({
    executablePath:chrome,
    headless:'new',
    args:['--no-sandbox', '--disable-dev-shm-usage']
  });
  function arm(page){
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort(); return;}
      if(u.indexOf('127.0.0.1') >= 0 || u.indexOf('localhost') >= 0){req.continue(); return;}
      const cors = {
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers':req.headers()['access-control-request-headers'] || 'apikey,authorization,content-type,accept,prefer'
      };
      if(req.method() === 'OPTIONS'){req.respond({status:204, headers:cors}); return;}
      let rpc = '';
      const m = u.match(/\/rpc\/([a-z0-9_]+)/i);
      if(m)rpc = m[1];
      let payload = {success:true, data:[]};
      if(rpc === 'admin_list_aides_info')payload = {aides:aides};
      req.respond({status:200, contentType:'application/json', headers:cors, body:JSON.stringify(payload)});
    });
  }
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.setRequestInterception(true);
    arm(page);
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token:'aides-profile-link1-test',
        refresh_token:'aides-profile-link1-refresh',
        profile:{org_id:'4f97f4d3-6635-4544-904c-6b06aa02d40b', role:'Admin'}
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=aides-profile-link1', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      window.__toasts = [];
      var prev = showTempMsg;
      showTempMsg = function(msg, color){
        window.__toasts.push(String(msg || ''));
        return prev.apply(this, arguments);
      };
      showTab('aides');
    });
    await page.waitForSelector('.aide-info-card', {timeout:8000});
    const before = await page.evaluate(function(id){
      var card = document.querySelector('.aide-info-card[data-aide-id="' + id + '"]');
      var rect = card.getBoundingClientRect();
      return {top:rect.top, bottom:rect.bottom, vh:window.innerHeight, count:document.querySelectorAll('.aide-info-card').length};
    }, target);
    assert.strictEqual(before.count, 8);
    assert.ok(before.top > before.vh, 'target card starts below the phone fold');
    await page.click('.aide-info-card[data-aide-id="' + target + '"] .aide-info-more');
    await page.waitForFunction(function(){
      var sheet = document.getElementById('aideInfoSheet');
      var actions = document.getElementById('aideInfoSheetActions');
      return sheet && !sheet.hidden && actions && /View profile/.test(actions.innerText) && /Reset temp password/.test(actions.innerText) && /Delete/.test(actions.innerText);
    }, {timeout:8000});
    await page.screenshot({path:path.join(shotDir, 'aides-profile-link1-sheet.png')});
    await page.evaluate(function(){
      var buttons = document.querySelectorAll('#aideInfoSheetActions .aide-info-act');
      buttons[0].click();
    });
    await page.waitForFunction(function(id){
      var card = document.querySelector('.aide-info-card[data-aide-id="' + id + '"]');
      return card && card.classList.contains('is-focus') && aidesProfileLink1Pending === '';
    }, {timeout:8000}, target);
    const after = await page.evaluate(function(id){
      var card = document.querySelector('.aide-info-card[data-aide-id="' + id + '"]');
      var rect = card.getBoundingClientRect();
      var toast = document.getElementById('nciToast');
      var aides = document.getElementById('tab_aides');
      return {
        focused:card.classList.contains('is-focus'),
        top:rect.top,
        bottom:rect.bottom,
        vh:window.innerHeight,
        tab:aides && aides.classList.contains('active') && !aides.hidden,
        toasts:window.__toasts.slice(),
        toastText:toast ? toast.textContent : '',
        toastOn:toast ? toast.style.display !== 'none' : false,
        sheetHidden:document.getElementById('aideInfoSheet').hidden,
        build:document.querySelector('meta[name="admin-build"]').content,
        marker:typeof AIDES_PROFILE_LINK1_MARKER === 'string' ? AIDES_PROFILE_LINK1_MARKER : ''
      };
    }, target);
    assert.strictEqual(after.build, '2026-09-27-remi-float-hide1b', 'first admin-build meta stays');
    assert.strictEqual(after.marker, 'v=aides-profile-link1');
    assert.strictEqual(after.focused, true);
    assert.strictEqual(after.tab, true);
    assert.strictEqual(after.sheetHidden, true);
    assert.ok(after.top >= 0 && after.bottom <= after.vh + 2, 'focused card is scrolled into the phone viewport');
    assert.ok(!after.toasts.some(function(msg){return msg.indexOf('No profile link') >= 0;}), 'no orange profile toast');
    assert.ok(!(after.toastOn && /No profile link/.test(after.toastText)));
    await page.screenshot({path:path.join(shotDir, 'aides-profile-link1-focused.png')});
    const fromSchedule = await page.evaluate(function(id){
      window.__toasts = [];
      showTab('schedule');
      aidesInfo1Follow('#admin/aides?aide_id=' + id);
      var card = document.querySelector('.aide-info-card[data-aide-id="' + id + '"]');
      var aides = document.getElementById('tab_aides');
      return {
        tab:aides && aides.classList.contains('active'),
        focused:!!(card && card.classList.contains('is-focus')),
        toasts:window.__toasts.slice()
      };
    }, aides[0].id);
    assert.strictEqual(fromSchedule.tab, true);
    assert.strictEqual(fromSchedule.focused, true);
    assert.deepStrictEqual(fromSchedule.toasts, []);
    console.log('admin-aides-profile-link1-test: browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
