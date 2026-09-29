#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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

assert.ok(html.includes('v=aide-profile-link-fix'), 'marker');
assert.ok(html.includes('?v=aide-profile-link-fix'), 'cache bust');
assert.ok(html.includes('admin-build 2026-09-28-aide-profile-link-fix'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-28-aide-profile-link-fix">'), 'meta');
assert.ok(html.includes('<!-- aide profile link fix 2026-09-28 v=aide-profile-link-fix'), 'comment');
assert.ok(html.includes('GHOST-AIDE-PROFILE-LINK-FIX-CONTRACT-v1'), 'contract');
assert.ok(html.includes("var AIDE_PROFILE_LINK_FIX_MARKER='v=aide-profile-link-fix'"), 'script marker');
assert.ok(html.includes('MERGE HOLD') && html.includes('Do not claim LIVE') && html.includes('Do not squash-merge'), 'merge hold');
assert.ok(html.includes('No SQL') && html.includes('No new RPC') && html.includes('No Auth'), 'no sql rpc auth');
assert.ok(html.includes('one full page') || html.includes('one full aide page') || html.includes('View profile is one full page'), 'full page contract');
assert.ok(html.includes('#aideProfilePage'), 'profile page');
assert.ok(html.includes('data-aide-profile-link-fix="v=aide-profile-link-fix"'), 'data attr');
assert.ok(!html.includes('aide-info-card.is-focus') && !html.includes('aidesProfileLink1Focus'), 'does not scroll-highlight an aide card');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
['v=aides-info1','v=manage-dots-creds1','v=manage-done1','v=aide-manage-delete1','v=aidadel1','v=list-az-sticky1','v=aidecreds1'].forEach(function(mark){
  assert.ok(html.includes(mark), 'prior marker ' + mark);
});
assert.ok(html.includes('Phone CSS must not unhide'), 'phone hide contract');
assert.ok(html.includes('half-active'), 'more tab contract');
assert.ok(html.includes('#adminScreen #tab_aides.aide-profile-on #aidesContainer'), 'list hide beats phone rules');
assert.ok(html.includes('@media(max-width:430px)') && html.includes('#adminScreen #tab_aides.aide-profile-on #aidesContainer'), 'phone width still hides the list');

const credsFn = extractFn(html, 'function aidesInfo1Credentials()');
assert.ok(credsFn.includes('aideCredOpenFromManageDots'), 'manage dots credentials stay');
const doneFn = extractFn(html, 'function aideManageDone1Exit()');
assert.ok(doneFn.includes('aide-manage-on') && doneFn.includes('aideCredShowAfterManage'), 'done still force-exits manage');
const delFn = extractFn(html, 'function aidesInfo1Delete()');
assert.ok(delFn.includes('confirmSoftDeleteAide'), 'aidadel1 delete stays');
assert.ok(extractFn(html, 'function aidesInfo1ViewProfile()').includes('aidesInfo1Follow'), 'schedule deep links still follow');
assert.ok(!/sbRestRpc\(/.test(extractFn(html, 'function aideProfileLinkFixOpen(aideId)')), 'open does not invent an rpc');
assert.ok(extractFn(html, 'async function aideProfileLinkFixLoadCreds(id, name)').includes('sbAdminListAideCredentials'), 'credentials use the existing list path');

function classList(){
  const set = new Set();
  return {
    add:function(c){set.add(c);},
    remove:function(c){set.delete(c);},
    contains:function(c){return set.has(c);},
    toggle:function(c, on){if(on)set.add(c);else set.delete(c);}
  };
}
function node(id){
  return {id:id, hidden:true, style:{display:'', background:''}, textContent:'', innerHTML:'', classList:classList(), focus:function(){}};
}
const els = {
  tab_aides: node('tab_aides'),
  tab_more: node('tab_more'),
  tab_schedule: node('tab_schedule'),
  nav_aides: node('nav_aides'),
  nav_more: node('nav_more'),
  aideProfilePage: node('aideProfilePage'),
  aideProfileName: node('aideProfileName'),
  aideProfileAvatar: node('aideProfileAvatar'),
  aideProfileContact: node('aideProfileContact'),
  aideProfileClients: node('aideProfileClients'),
  aideProfileNext: node('aideProfileNext'),
  aideProfileCredsDue: node('aideProfileCredsDue'),
  aideProfileCreds: node('aideProfileCreds'),
  aideProfileBack: node('aideProfileBack'),
  aidesContainer: node('aidesContainer'),
  aideCredsRoot: node('aideCredsRoot'),
  aideInfoSheet: node('aideInfoSheet'),
  aideManageSure: node('aideManageSure'),
  aideManageBar: node('aideManageBar'),
  aideManageConfirm: node('aideManageConfirm')
};
els.tab_aides.hidden = false;
els.tab_aides.classList.add('active');
els.aidesContainer.hidden = false;
els.aidesContainer.innerHTML = '<article class="aide-info-card">Jane</article>';
els.nav_more.classList.add('active');
els.tab_more.hidden = false;
els.tab_more.classList.add('active');

const renders = [];
const desks = [];
const credLoads = [];
const exits = [];
const box = {
  aideDesk: 'active',
  aideProfileLinkFixWant: '',
  aidesInfo1ByKey: {
    jdoe: {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      name: 'Jane Doe',
      initials: 'JD',
      phone: '(216) 377-5991',
      preferred_language_label: 'ES',
      assignedClients: [{name:'Bowlax'}],
      _raw: {next_status:'next', next_label:'Next · 09/28/2026', creds_due:'2026-10-15'}
    }
  },
  aideCredState: {view:'list', seq:0, credentials:[], aideId:'', aideName:'', profilePage:false, manageDots:false},
  currentAdminRole: 'Admin',
  document: {
    getElementById: function(id){return els[id] || null;},
    querySelectorAll: function(sel){
      if(sel.indexOf('#tab_more') >= 0 || sel.indexOf('#moreList') >= 0){
        return els.nav_more.classList.contains('active') ? [els.nav_more] : [];
      }
      return [];
    }
  },
  window: {scrollTo:function(){}},
  layoutA1Primary: function(){return 'aides';},
  aideCredManageOn: function(){return els.tab_aides.classList.contains('aide-manage-on');},
  aideManageDone1Exit: function(){exits.push('done'); els.tab_aides.classList.remove('aide-manage-on');},
  aideCredBind: function(){},
  aideCredsIsAdmin: function(){return box.currentAdminRole === 'Admin';},
  aideCredRowHtml: function(c){return '<div class="aide-cred-row">'+c.type+'</div>';},
  sbAdminListAideCredentials: async function(id){
    credLoads.push(id);
    return {success:true, credentials:[{id:'c1', type:'cpr', label:'CPR', expiry:'2026-12-01', status:'ok'}]};
  },
  aidesInfo1Initials: function(){return 'JD';},
  aidesInfo1AvatarColor: function(){return '#2a7f7f';},
  aidesInfo1Next: function(){return {tone:'next', label:'Next · 09/28/2026'};},
  aidesInfo1Creds: function(){return 'Creds due 10/15/2026';},
  escapeHtml: function(s){return String(s==null?'':s);},
  renderAides: function(){
    renders.push(box.aideDesk);
    return Promise.resolve().then(function(){
      els.tab_aides.classList.add('aide-creds-on');
      els.aideCredsRoot.hidden = false;
    });
  },
  setAideDesk: function(view){box.aideDesk = view; desks.push(view); return box.renderAides();},
  showTab: function(tab){box._tabs = (box._tabs || []).concat(tab);},
  showTempMsg: function(msg){box._toasts = (box._toasts || []).concat(msg);}
};
box.aideProfileLinkFixOn = null;

const src = [
  'var aideProfileLinkFixWant="";',
  'var aideProfileLinkFixRestoreList=false;',
  extractFn(html, 'function aideProfileLinkFixOn()'),
  extractFn(html, 'function aideProfileLinkFixParse(link)'),
  extractFn(html, 'function aideProfileLinkFixFind(aideId)'),
  extractFn(html, 'function aideProfileLinkFixEsc(s)'),
  extractFn(html, 'function aideProfileLinkFixStickNav()'),
  extractFn(html, 'function aideProfileLinkFixPaint(aideId)'),
  extractFn(html, 'function aideProfileLinkFixPaintCreds(messageHtml)'),
  extractFn(html, 'async function aideProfileLinkFixLoadCreds(id, name)'),
  extractFn(html, 'function aideProfileLinkFixLeave()'),
  extractFn(html, 'function aideProfileLinkFixShowInfoList()'),
  extractFn(html, 'async function aideProfileLinkFixBack()'),
  extractFn(html, 'function aideProfileLinkFixAfterPaint()'),
  extractFn(html, 'function aideProfileLinkFixOpen(aideId)'),
  extractFn(html, 'function aidesInfo1Follow(link)'),
  extractFn(html, 'function aidesInfo1ViewProfile()'),
  extractFn(html, 'function aidesInfo1CloseSheet()')
].join('\n');

vm.createContext(box);
vm.runInContext(src, box);

const JANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
assert.strictEqual(box.aideProfileLinkFixParse('#admin/aides?aide_id='+JANE), JANE);
assert.strictEqual(box.aideProfileLinkFixParse('admin/aides?aide_id='+encodeURIComponent(JANE)), JANE);
assert.strictEqual(box.aideProfileLinkFixParse('aides?aide_id='+JANE), JANE);
assert.strictEqual(box.aideProfileLinkFixParse('/admin/aides?aide_id='+JANE+'#desk'), JANE);
assert.strictEqual(box.aideProfileLinkFixParse('admin/messages?aide_id='+JANE), '');
assert.strictEqual(box.aideProfileLinkFixParse('#aides'), '');
assert.strictEqual(box.aideProfileLinkFixParse(''), '');

els.tab_aides.classList.add('aide-manage-on');
assert.strictEqual(box.aideProfileLinkFixOpen(JANE), true);
assert.ok(els.tab_aides.classList.contains('aide-profile-on'), 'profile class replaces the list');
assert.ok(!els.tab_aides.classList.contains('aide-manage-on'), 'manage chrome exits');
assert.deepStrictEqual(exits, ['done']);
assert.strictEqual(els.aideProfilePage.hidden, false);
assert.strictEqual(els.aideProfileName.textContent, 'Jane Doe');
assert.ok(els.aideProfileContact.innerHTML.includes('(216) 377-5991'));
assert.ok(els.aideProfileContact.innerHTML.includes('ES'));
assert.ok(els.aideProfileClients.innerHTML.includes('Bowlax'));
assert.ok(els.aideProfileCreds.innerHTML.includes('Credentials'));
assert.ok(!els.nav_more.classList.contains('active'), 'More is not left half-active');
assert.ok(els.nav_aides.classList.contains('active'));
assert.strictEqual(els.tab_more.hidden, true);
assert.ok(!els.tab_more.classList.contains('active'));
assert.strictEqual(els.aideCredsRoot.hidden, true);

(async function(){
  await new Promise(function(r){setTimeout(r, 20);});
  assert.deepStrictEqual(credLoads, [JANE]);
  assert.ok(els.aideProfileCreds.innerHTML.includes('aide-cred-row'), 'credentials paint on the page');
  assert.ok(els.aideProfileCreds.innerHTML.indexOf('aide-info-card') < 0, 'credential card is not the aides list');

  box.aideDesk = 'deleted';
  await box.aideProfileLinkFixBack();
  assert.ok(!els.tab_aides.classList.contains('aide-profile-on'));
  assert.ok(!els.tab_aides.classList.contains('aide-creds-on'), 'back strips the credentials rollup');
  assert.strictEqual(els.aideCredsRoot.hidden, true);
  assert.strictEqual(els.aideProfilePage.hidden, true);
  assert.deepStrictEqual(desks, ['active'], 'back returns to the Active desk');
  assert.ok(!els.nav_more.classList.contains('active'));
  assert.ok(els.nav_aides.classList.contains('active'));

  box.aidesInfo1Current = box.aidesInfo1ByKey.jdoe;
  box.aidesInfo1Current.deep_link = 'admin/aides?aide_id='+JANE;
  els.aideInfoSheet = els.aideInfoSheet || node('aideInfoSheet');
  box.aidesInfo1ViewProfile();
  assert.ok(els.tab_aides.classList.contains('aide-profile-on'), 'view profile string opens the full page');
  assert.ok(!box._tabs || box._tabs.indexOf('schedule') < 0);

  box.aideProfileLinkFixLeave();
  box.aidesInfo1Current = {
    id: JANE,
    deep_link: {client_id:'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', on_date:'2026-09-28', slot_key:'default'}
  };
  box.schedPendingDeepLink = null;
  box.aidesInfo1ViewProfile();
  assert.ok(!els.tab_aides.classList.contains('aide-profile-on'), 'schedule object does not open the profile page');
  assert.strictEqual(box.schedPendingDeepLink.on_date, '2026-09-28');
  assert.strictEqual(box._tabs[box._tabs.length - 1], 'schedule');

  console.log('admin-aide-profile-link-fix-test: unit ok');
})().then(function(){
  return runBrowser();
}).catch(function(err){
  console.error(err);
  process.exit(1);
});

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
    console.log('admin-aide-profile-link-fix browser skipped (no puppeteer-core)');
    return;
  }
  const http = require('http');
  const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
  const shotDir = process.env.AIDE_PROFILE_LINK_FIX_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const server = http.createServer(function(req, res){
    const url = (req.url || '/').split('?')[0];
    const rel = url === '/' ? '/index.html' : url;
    const file = path.join(root, decodeURIComponent(rel));
    if(!file.startsWith(root)){res.writeHead(404); res.end('no'); return;}
    fs.readFile(file, function(err, buf){
      if(err){res.writeHead(404); res.end('missing'); return;}
      res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(function(resolve){server.listen(0, '127.0.0.1', resolve);});
  const port = server.address().port;
  const JANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  try{
    const page = await browser.newPage();
    await page.setViewport({width:390, height:844, isMobile:true, hasTouch:true, deviceScaleFactor:2});
    await page.setRequestInterception(true);
    page.on('request', function(req){
      const u = req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort(); return;}
      if(u.indexOf('127.0.0.1') >= 0 || u.indexOf('localhost') >= 0){req.continue(); return;}
      const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': req.headers()['access-control-request-headers'] || 'apikey,authorization,content-type,accept,prefer'
      };
      if(req.method() === 'OPTIONS'){req.respond({status:204, headers:cors}); return;}
      let rpc = '';
      const m = u.match(/\/rpc\/([a-z0-9_]+)/i);
      if(m)rpc = m[1];
      let payload = {success:true};
      if(rpc === 'admin_list_aides_info'){
        payload = {aides:[{
          id:JANE,
          username:'jdoe',
          full_name:'Jane Doe',
          initials:'JD',
          phone:'2163775991',
          preferred_language_label:'es',
          clients:[{name:'Bowlax'},{name:'Rivera'}],
          next_status:'next',
          next_label:'Next · 2026-09-28',
          creds_due:'2026-10-15',
          is_active:true,
          deep_link:'admin/aides?aide_id='+JANE
        },{
          id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
          username:'sokonkwo',
          full_name:'Sam Okonkwo',
          initials:'SO',
          phone:'2165550142',
          preferred_language_label:'en',
          clients:[{name:'Chen'}],
          next_status:'open',
          next_label:'Open',
          is_active:true,
          deep_link:'#admin/aides?aide_id=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
        }]};
      }else if(rpc === 'admin_list_aide_credentials'){
        payload = {credentials:[{id:'c1', credential_type:'cpr', label:'CPR', expiry_date:'2026-12-01', status:'ok'}]};
      }else if(rpc === 'admin_aide_credentials_rollup' || rpc === 'admin_list_aide_credentials_rollup'){
        payload = {aides:[], attention_count:0};
      }
      req.respond({status:200, contentType:'application/json', headers:cors, body:JSON.stringify(payload)});
    });
    await page.evaluateOnNewDocument(function(){
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token:'aide-profile-link-fix',
        refresh_token:'aide-profile-link-fix',
        profile:{org_id:'4f97f4d3-6635-4544-904c-6b06aa02d40b', role:'Scheduler'}
      }));
    });
    await page.goto('http://127.0.0.1:' + port + '/index.html?v=aide-profile-link-fix', {waitUntil:'domcontentloaded', timeout:20000});
    await page.evaluate(function(){
      currentAdminRole = 'Scheduler';
      document.getElementById('loginScreen').classList.remove('active');
      document.getElementById('adminScreen').classList.add('active');
      if(typeof layoutA1ApplyRoles === 'function')layoutA1ApplyRoles();
      showTab('more');
      showTab('aides');
    });
    await page.waitForSelector('.aide-info-card', {timeout:8000});
    await page.click('.aide-info-card .aide-info-more');
    await page.waitForFunction(function(){
      var actions = document.getElementById('aideInfoSheetActions');
      return actions && /View profile/.test(actions.innerText);
    }, {timeout:8000});
    await page.screenshot({path: path.join(shotDir, 'aide-profile-link-fix-sheet.png')});
    await page.evaluate(function(){
      var buttons = document.querySelectorAll('#aideInfoSheetActions .aide-info-act');
      for(var i = 0; i < buttons.length; i++){
        if(/View profile/.test(buttons[i].textContent || '')){buttons[i].click(); return;}
      }
    });
    await page.waitForFunction(function(){
      var tab = document.getElementById('tab_aides');
      var pageEl = document.getElementById('aideProfilePage');
      return tab && tab.classList.contains('aide-profile-on') && pageEl && !pageEl.hidden && /Jane Doe/.test(pageEl.innerText) && /Credentials/.test(pageEl.innerText);
    }, {timeout:8000});
    await page.evaluate(function(){
      currentAdminRole = 'Admin';
      return aideProfileLinkFixLoadCreds('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Jane Doe');
    });
    await page.waitForFunction(function(){
      var host = document.getElementById('aideProfileCreds');
      return host && /CPR/.test(host.innerText);
    }, {timeout:8000});
    const seen = await page.evaluate(function(){
      function shown(el){
        if(!el)return false;
        var cs = getComputedStyle(el);
        if(cs.display === 'none' || cs.visibility === 'hidden')return false;
        var r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }
      var list = document.getElementById('aidesContainer');
      var card = document.querySelector('#aidesContainer .aide-info-card');
      var pageEl = document.getElementById('aideProfilePage');
      var more = document.getElementById('nav_more');
      var aides = document.getElementById('nav_aides');
      var morePanel = document.getElementById('tab_more');
      return {
        listDisplay: getComputedStyle(list).display,
        cardShown: shown(card),
        pageShown: shown(pageEl),
        back: (document.getElementById('aideProfileBack') || {}).textContent || '',
        name: (document.getElementById('aideProfileName') || {}).textContent || '',
        creds: (document.getElementById('aideProfileCreds') || {}).innerText || '',
        moreActive: !!(more && more.classList.contains('active')),
        aidesActive: !!(aides && aides.classList.contains('active')),
        morePanelActive: !!(morePanel && morePanel.classList.contains('active') && !morePanel.hidden),
        manage: document.getElementById('tab_aides').classList.contains('aide-manage-on')
      };
    });
    assert.strictEqual(seen.listDisplay, 'none', 'phone CSS keeps the aides list hidden');
    assert.strictEqual(seen.cardShown, false, 'no aide card visible behind the page');
    assert.strictEqual(seen.pageShown, true);
    assert.ok(/Back/.test(seen.back));
    assert.strictEqual(seen.name, 'Jane Doe');
    assert.ok(/Credentials/.test(seen.creds) && /CPR/.test(seen.creds));
    assert.strictEqual(seen.moreActive, false, 'More tab is not half-active');
    assert.strictEqual(seen.aidesActive, true);
    assert.strictEqual(seen.morePanelActive, false);
    assert.strictEqual(seen.manage, false);
    await page.screenshot({path: path.join(shotDir, 'aide-profile-link-fix-page.png')});
    await page.evaluate(function(){currentAdminRole = 'Admin';});
    await page.click('#aideProfileBack');
    await page.waitForFunction(function(){
      function shown(el){
        if(!el)return false;
        var cs = getComputedStyle(el);
        if(cs.display === 'none' || cs.visibility === 'hidden')return false;
        var r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }
      var tab = document.getElementById('tab_aides');
      var list = document.getElementById('aidesContainer');
      var desk = document.getElementById('aideDesk');
      var pageEl = document.getElementById('aideProfilePage');
      var root = document.getElementById('aideCredsRoot');
      var more = document.querySelector('#aidesContainer .aide-info-more');
      var moreNav = document.getElementById('nav_more');
      var aidesNav = document.getElementById('nav_aides');
      return tab && !tab.classList.contains('aide-profile-on') && !tab.classList.contains('aide-creds-on')
        && pageEl && pageEl.hidden
        && shown(desk) && shown(list) && shown(more)
        && /Jane Doe/.test(list.innerText) && /\u22ef/.test(more.textContent || '')
        && root && !shown(root)
        && moreNav && !moreNav.classList.contains('active')
        && aidesNav && aidesNav.classList.contains('active');
    }, {timeout:8000});
    const backList = await page.evaluate(function(){
      function shown(el){
        if(!el)return false;
        var cs = getComputedStyle(el);
        if(cs.display === 'none' || cs.visibility === 'hidden')return false;
        var r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }
      var tab = document.getElementById('tab_aides');
      var root = document.getElementById('aideCredsRoot');
      var desk = document.getElementById('aideDesk');
      var active = desk && desk.querySelector('[data-aide-desk="active"]');
      return {
        credsOn: tab.classList.contains('aide-creds-on'),
        deskShown: shown(desk),
        activeOn: !!(active && active.classList.contains('on')),
        dots: document.querySelectorAll('#aidesContainer .aide-info-more').length,
        rollupShown: shown(root),
        rollupText: shown(root) ? (root.innerText || '') : '',
        moreActive: document.getElementById('nav_more').classList.contains('active'),
        morePanel: document.getElementById('tab_more').classList.contains('active')
      };
    });
    assert.strictEqual(backList.credsOn, false, 'back does not leave aide-creds-on');
    assert.strictEqual(backList.deskShown, true, 'Active desk tabs stay visible');
    assert.strictEqual(backList.activeOn, true, 'Active desk is selected');
    assert.ok(backList.dots >= 1, 'info-card ··· is on the list');
    assert.strictEqual(backList.rollupShown, false, 'credentials rollup is not the Back surface');
    assert.ok(!/No credential records yet/.test(backList.rollupText));
    assert.strictEqual(backList.moreActive, false);
    assert.strictEqual(backList.morePanel, false);
    await page.screenshot({path: path.join(shotDir, 'aide-profile-link-fix-back-list.png')});
    await page.evaluate(function(){return renderAides(false);});
    await page.waitForFunction(function(){
      function shown(el){
        if(!el)return false;
        var cs = getComputedStyle(el);
        if(cs.display === 'none' || cs.visibility === 'hidden')return false;
        var r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }
      var tab = document.getElementById('tab_aides');
      var root = document.getElementById('aideCredsRoot');
      var desk = document.getElementById('aideDesk');
      var more = document.querySelector('#aidesContainer .aide-info-more');
      return tab && !tab.classList.contains('aide-creds-on')
        && shown(desk) && shown(more)
        && root && !shown(root);
    }, {timeout:8000});
    await page.screenshot({path: path.join(shotDir, 'aide-profile-link-fix-active-cards.png')});
    await page.click('#aideCredManageBtn');
    await page.waitForFunction(function(){
      return document.getElementById('tab_aides').classList.contains('aide-manage-on');
    }, {timeout:8000});
    await page.click('#aidesContainer .aide-info-more');
    await page.waitForFunction(function(){
      var actions = document.getElementById('aideInfoSheetActions');
      return actions && /Credentials/.test(actions.innerText);
    }, {timeout:8000});
    await page.evaluate(function(){
      var buttons = document.querySelectorAll('#aideInfoSheetActions .aide-info-act');
      for(var i = 0; i < buttons.length; i++){
        if(/^Credentials$/.test((buttons[i].textContent || '').trim())){buttons[i].click(); return;}
      }
    });
    await page.waitForFunction(function(){
      var tab = document.getElementById('tab_aides');
      var detail = document.getElementById('aideCredDetail');
      return tab && tab.classList.contains('aide-manage-on') && tab.classList.contains('aide-manage-creds')
        && detail && !detail.hidden && /Credentials/.test(detail.innerText || '');
    }, {timeout:8000});
    await page.click('#aideManageDoneBtn');
    await page.waitForFunction(function(){
      function shown(el){
        if(!el)return false;
        var cs = getComputedStyle(el);
        if(cs.display === 'none' || cs.visibility === 'hidden')return false;
        var r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }
      var tab = document.getElementById('tab_aides');
      var root = document.getElementById('aideCredsRoot');
      var desk = document.getElementById('aideDesk');
      var more = document.querySelector('#aidesContainer .aide-info-more');
      return tab && !tab.classList.contains('aide-manage-on') && !tab.classList.contains('aide-creds-on')
        && shown(desk) && shown(more)
        && root && !shown(root);
    }, {timeout:8000});
    await page.evaluate(function(){aidesInfo1OpenSheet('sokonkwo'); aidesInfo1ViewProfile();});
    await page.waitForFunction(function(){
      return document.getElementById('aideProfileName') && document.getElementById('aideProfileName').textContent === 'Sam Okonkwo';
    }, {timeout:8000});
    const samHidden = await page.evaluate(function(){
      return getComputedStyle(document.getElementById('aidesContainer')).display;
    });
    assert.strictEqual(samHidden, 'none');
    await page.click('#nav_more');
    await page.waitForFunction(function(){
      var more = document.getElementById('tab_more');
      var aides = document.getElementById('tab_aides');
      var moreNav = document.getElementById('nav_more');
      var aidesNav = document.getElementById('nav_aides');
      return more && !more.hidden && more.classList.contains('active')
        && aides && aides.hidden && !aides.classList.contains('aide-profile-on')
        && moreNav && moreNav.classList.contains('active')
        && aidesNav && !aidesNav.classList.contains('active');
    }, {timeout:8000});
    await page.screenshot({path: path.join(shotDir, 'aide-profile-link-fix-more.png')});
    console.log('admin-aide-profile-link-fix-test: browser ok');
  }finally{
    await browser.close();
    server.close();
  }
}
