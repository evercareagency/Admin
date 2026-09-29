#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(__dirname, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');

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

assert.ok(html.includes('v=sched-creds1'), 'sched-creds1 marker');
assert.ok(html.includes('?v=sched-creds1'), 'query marker stays in the contract for Probe');
assert.ok(html.includes('GHOST-SCHED-CREDS1-CONTRACT-v1'), 'contract');
assert.ok(html.includes('admin-build 2026-09-29-sched-creds1'), 'build note');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-29-sched-creds1">'), 'admin-build meta');
assert.ok(html.includes("var SCHED_CREDS1_MARKER='v=sched-creds1'"), 'script marker');
assert.ok(html.includes("var SCHED_CREDS1_BUILD='2026-09-29-sched-creds1'"), 'script build');
assert.ok(html.includes('Ace N/A'), 'Ace N/A');
assert.ok(html.includes('UI parity only'), 'UI parity only');
assert.ok(html.includes('Standing rule: Admin and Scheduler are one portal'), 'standing rule');
assert.ok(html.includes('No Admin-only chrome'), 'no Admin-only chrome');
assert.ok(html.includes('Scheduler login is a soft-check'), 'soft-check is named');
assert.ok(html.includes('startAdminSession') && html.includes('restoreAdminSession'), 'same login session path');
assert.ok(html.includes('does not post a password') && html.includes('does not call sbAuthRoleLogin'), 'soft-check skips the password grant');
assert.ok(html.includes('Nurse is out of scope') || html.includes('Nurse out of scope'), 'Nurse out of scope');
assert.ok(html.includes('MERGE HOLD') && html.includes('Do not claim LIVE') && html.includes('Do not squash-merge'), 'merge hold');
assert.ok(html.includes('No new RPC') && html.includes('No SQL'), 'no new rpc or sql');
assert.ok(html.includes('data-sched-creds1="v=sched-creds1"'), 'aides desk marker');
assert.ok(html.includes('without a sticky ?v='), 'pages-cache-fresh1 clean URL stays');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays the pages-cache-fresh1 build');
assert.ok(html.includes("var PAGES_CACHE_FRESH1_BUILD='2026-09-29-pages-cache-fresh1'"), 'pages-cache build stays');
assert.ok(html.includes('v=login-land-schedule1') && html.includes('v=list-search-az1') && html.includes('v=pages-cache-fresh1'), 'head markers stay');
assert.ok(html.includes('v=manage-dots-creds1') && html.includes('v=aidecreds1'), 'prior creds markers stay');
const buildAt = html.indexOf('<meta name="admin-build"');
assert.ok(html.slice(buildAt, buildAt + 90).includes('2026-09-27-remi-float-hide1b'), 'first admin-build stays remi-float-hide1b');
assert.ok(html.indexOf('content="2026-09-29-login-land-schedule1"') < html.indexOf('content="2026-09-29-list-search-az1"'), 'login land stays before list search');
assert.ok(html.indexOf('content="2026-09-29-list-search-az1"') < html.indexOf('content="2026-09-29-pages-cache-fresh1"'), 'pages-cache-fresh1 stays after list search');
assert.ok(html.indexOf('content="2026-09-29-pages-cache-fresh1"') < html.indexOf('content="2026-09-29-sched-creds1"'), 'sched-creds1 meta follows pages-cache-fresh1');

const openSheet = extractFn(html, 'function aidesInfo1OpenSheet(key)');
assert.ok(openSheet.includes('schedCreds1Office'), 'menu uses the office gate');
assert.ok(openSheet.includes('aidesInfo1Credentials()'), 'Credentials uses the existing handler');
assert.ok(extractFn(html, 'function aidesInfo1Credentials()').includes('aideCredOpenFromManageDots'), 'Credentials opens the Admin desk path');
const fromDots = extractFn(html, 'async function aideCredOpenFromManageDots(aideId, aideName)');
assert.ok(fromDots.includes('schedCreds1Office'), 'open path allows the office role');
assert.ok(fromDots.includes('aideCredOpen(id, aideName)'), 'normal list reuses aideCredOpen with the aide name');
assert.ok(extractFn(html, 'async function aideCredOpen(aideId, aideName)').includes('schedCreds1Office'), 'desk open allows Scheduler');
assert.ok(!extractFn(html, 'function aideCredsIsAdmin()').includes('Scheduler'), 'rollup gate stays Admin-only');
assert.ok(extractFn(html, 'function schedCreds1Office()').includes("role==='Scheduler'"), 'Scheduler shares the menu');
assert.ok(!openSheet.includes("role==='Admin'"), 'Aides ··· builder has no Admin-only role check');
assert.ok(extractFn(html, 'async function mgrLogin()').includes('startAdminSession'), 'Sign In uses one session for Admin and Scheduler');
assert.ok(extractFn(html, 'function sbPortalRoleFromProfile(role)').includes("key==='scheduler'"), 'profile role scheduler maps to Scheduler');
assert.ok(!extractFn(html, 'function startAdminSession(data)').includes('sbAuthRoleLogin'), 'session start does not grant a password');
assert.ok(!extractFn(html, 'function restoreAdminSession()').includes('sbPasswordGrant'), 'restore does not grant a password');
const freshStart = html.slice(html.indexOf('function pagesCacheFresh1Start'), html.indexOf('try{pagesCacheFresh1Start()'));
assert.ok(!freshStart.includes('?v='), 'pages-cache-fresh1 start does not stick a ?v=');

function classList(){
  const set = new Set();
  return {
    add:function(c){set.add(c);},
    remove:function(c){set.delete(c);},
    contains:function(c){return set.has(c);},
    toggle:function(c, on){
      if(on === undefined){ if(set.has(c))set.delete(c); else set.add(c); return; }
      if(on)set.add(c); else set.delete(c);
    }
  };
}
function node(id){
  return {id:id, hidden:true, style:{display:''}, textContent:'', innerHTML:'', classList:classList()};
}

const JANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
const jane = {id:JANE, username:'jdoe', name:'Jane Doe', fullName:'Jane Doe'};

function softCheckSchedulerLogin(){
  const mem = {};
  const box = {
    currentAdminRole: null,
    currentAdminUsername: null,
    currentNurseName: null,
    ADMIN_SESSION_KEY: 'admin_session',
    store: {
      get: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? JSON.parse(mem[k]) : null;},
      set: function(k, v){mem[k] = JSON.stringify(v);}
    }
  };
  vm.createContext(box);
  vm.runInContext([
    extractFn(html, 'function isPortalRole(role)'),
    extractFn(html, 'function writeAdminSession(sess)'),
    extractFn(html, 'function applyAdminSession(sess)'),
    extractFn(html, 'function startAdminSession(data)'),
    extractFn(html, 'function sbPortalRoleFromProfile(role)'),
    extractFn(html, 'function roleAccountSbEmail(role)')
  ].join('\n'), box);
  const mapped = box.sbPortalRoleFromProfile('scheduler');
  assert.strictEqual(mapped, 'Scheduler', 'soft-check maps the Scheduler profile');
  assert.strictEqual(box.roleAccountSbEmail('Scheduler'), 'scheduler@roles.evercare.local', 'Scheduler login account');
  assert.strictEqual(box.roleAccountSbEmail('Admin'), 'admin@roles.evercare.local', 'Admin login account stays');
  const sess = box.startAdminSession({role: mapped, username: 'Jaz', name: 'Jaz'});
  assert.strictEqual(sess.role, 'Scheduler');
  assert.strictEqual(box.currentAdminRole, 'Scheduler', 'soft-check Scheduler login sets the portal role');
  assert.strictEqual(box.currentAdminUsername, 'Jaz', 'soft-check Scheduler login is Jaz');
  assert.ok(mem.admin_session && JSON.parse(mem.admin_session).role === 'Scheduler', 'session stored for restore');
  return sess;
}
const schedulerLogin = softCheckSchedulerLogin();
assert.strictEqual(schedulerLogin.role, 'Scheduler');

function menuBox(){
  const els = {
    aideInfoSheet: node('aideInfoSheet'),
    aideInfoSheetTitle: node('aideInfoSheetTitle'),
    aideInfoSheetActions: node('aideInfoSheetActions')
  };
  const box = {
    currentAdminRole: schedulerLogin.role,
    aideDesk: 'active',
    manageOn: false,
    aidesInfo1Current: null,
    aidesInfo1ByKey: {jdoe: jane, blank: {id:'', username:'blank', name:'Blank Aide'}},
    document: {getElementById: function(id){return els[id] || null;}},
    aideCredManageOn: function(){return !!box.manageOn;}
  };
  box.els = els;
  vm.createContext(box);
  vm.runInContext([
    extractFn(html, 'function canManageAides()'),
    extractFn(html, 'function schedCreds1Office()'),
    extractFn(html, 'function aidesInfo1OpenSheet(key)')
  ].join('\n'), box);
  return box;
}

function labels(box){
  return box.els.aideInfoSheetActions.innerHTML;
}

function assertMenu(htmlMenu, who){
  assert.ok(htmlMenu.includes('View profile'), who + ' View profile');
  assert.ok(htmlMenu.includes('>Credentials<'), who + ' Credentials');
  assert.ok(htmlMenu.includes('Reset temp password'), who + ' Reset');
  assert.ok(htmlMenu.includes('>Delete<'), who + ' Delete');
  assert.ok(htmlMenu.includes('data-sched-creds1="v=sched-creds1"'), who + ' marker on Credentials');
  assert.ok(htmlMenu.includes('onclick="aidesInfo1Credentials()"'), who + ' same Credentials handler');
  assert.ok(htmlMenu.indexOf('>Credentials<') < htmlMenu.indexOf('View profile'), who + ' Credentials then View profile');
  assert.ok(htmlMenu.indexOf('View profile') < htmlMenu.indexOf('Reset temp password'), who + ' View profile then Reset');
  assert.ok(htmlMenu.indexOf('Reset temp password') < htmlMenu.indexOf('>Delete<'), who + ' Reset then Delete');
}

const sched = menuBox();
sched.aidesInfo1OpenSheet('jdoe');
assert.strictEqual(sched.els.aideInfoSheet.hidden, false);
assertMenu(labels(sched), 'Scheduler');
sched.manageOn = true;
sched.aidesInfo1OpenSheet('jdoe');
assert.ok(labels(sched).includes('Manage mode'), 'Scheduler Manage note');
assertMenu(labels(sched), 'Scheduler Manage');

sched.currentAdminRole = 'Admin';
sched.manageOn = false;
sched.aidesInfo1OpenSheet('jdoe');
const adminMenu = labels(sched);
assertMenu(adminMenu, 'Admin');
sched.manageOn = true;
sched.aidesInfo1OpenSheet('jdoe');
assertMenu(labels(sched), 'Admin Manage');
assert.ok(labels(sched).includes('Manage mode'));

sched.currentAdminRole = 'Nurse';
sched.manageOn = false;
sched.aidesInfo1OpenSheet('jdoe');
const nurseMenu = labels(sched);
assert.ok(nurseMenu.includes('View profile'), 'Nurse can view profile');
assert.ok(!nurseMenu.includes('Credentials'), 'Nurse does not get Credentials');
assert.ok(!nurseMenu.includes('Reset temp password'), 'Nurse does not get Reset');
assert.ok(!nurseMenu.includes('>Delete<'), 'Nurse does not get Delete');

sched.currentAdminRole = 'Scheduler';
sched.aidesInfo1OpenSheet('blank');
assert.ok(!labels(sched).includes('Credentials'), 'no Credentials without an aide id');

const credCalls = [];
const els = {
  tab_aides: node('tab_aides'),
  aideCredsRoot: node('aideCredsRoot'),
  aideCredList: node('aideCredList'),
  aideCredSearchWrap: node('aideCredSearchWrap'),
  aideCredBanner: node('aideCredBanner'),
  aideCredDetail: node('aideCredDetail')
};
const desk = {
  currentAdminRole: 'Scheduler',
  aideCredState: {view:'list', q:'', aides:[], attention:0, recordCount:0, aideId:'', aideName:'', credentials:[], editing:null, sheetOpen:false, pickAide:false, seq:0, error:'', profilePage:false, manageDots:false},
  document: {getElementById: function(id){return els[id] || null;}},
  escapeHtml: function(s){return String(s==null?'':s);},
  aideCredBind: function(){},
  aideProfileLinkFixOn: function(){return false;},
  aideCredRowHtml: function(c){return '<div class="aide-cred-row">'+c.type+'</div>';},
  sbAdminListAideCredentials: async function(id){
    credCalls.push(id);
    return {success:true, credentials:[{id:'c-cpr', type:'cpr', label:'CPR', expiry:'2026-10-05', status:'expiring_soon'}]};
  }
};
vm.createContext(desk);
vm.runInContext([
  extractFn(html, 'function schedCreds1Office()'),
  extractFn(html, 'function aideCredsIsAdmin()'),
  extractFn(html, 'function aideCredManageOn()'),
  extractFn(html, 'function aideCredDetailTop()'),
  extractFn(html, 'function aideCredPaintDetail(messageHtml)'),
  extractFn(html, 'async function aideCredOpen(aideId, aideName)'),
  extractFn(html, 'async function aideCredOpenFromManageDots(aideId, aideName)')
].join('\n'), desk);

assert.strictEqual(desk.schedCreds1Office(), true, 'Scheduler is office');
assert.strictEqual(desk.aideCredsIsAdmin(), false, 'Scheduler still does not own the rollup');
desk.currentAdminRole = 'Admin';
assert.strictEqual(desk.schedCreds1Office(), true);
assert.strictEqual(desk.aideCredsIsAdmin(), true);
desk.currentAdminRole = 'Nurse';
assert.strictEqual(desk.schedCreds1Office(), false, 'Nurse is out');
desk.currentAdminRole = 'Scheduler';

(async function(){
  await desk.aideCredOpenFromManageDots(JANE, 'Jane Doe');
  assert.deepStrictEqual(credCalls, [JANE], 'Scheduler Credentials lists that aide');
  assert.strictEqual(desk.aideCredState.view, 'detail');
  assert.strictEqual(desk.aideCredState.aideName, 'Jane Doe');
  assert.strictEqual(els.aideCredDetail.hidden, false);
  assert.strictEqual(els.aideCredsRoot.hidden, false);
  assert.ok(els.aideCredDetail.innerHTML.includes('Jane Doe'), els.aideCredDetail.innerHTML);
  assert.ok(els.aideCredDetail.innerHTML.includes('Credentials'), els.aideCredDetail.innerHTML);
  assert.ok(els.aideCredDetail.innerHTML.includes('cpr'), els.aideCredDetail.innerHTML);
  assert.strictEqual(els.aideCredList.hidden, true, 'rollup list stays hidden');
  const schedDesk = els.aideCredDetail.innerHTML;

  desk.currentAdminRole = 'Admin';
  credCalls.length = 0;
  els.aideCredDetail.innerHTML = '';
  desk.aideCredState.view = 'list';
  desk.aideCredState.aideId = '';
  await desk.aideCredOpenFromManageDots(JANE, 'Jane Doe');
  assert.deepStrictEqual(credCalls, [JANE], 'Admin uses the same list callable');
  assert.strictEqual(els.aideCredDetail.innerHTML, schedDesk, 'Scheduler desk HTML matches Admin');

  desk.currentAdminRole = 'Nurse';
  credCalls.length = 0;
  const before = els.aideCredDetail.innerHTML;
  await desk.aideCredOpenFromManageDots(JANE, 'Jane Doe');
  assert.deepStrictEqual(credCalls, [], 'Nurse does not open the desk');
  assert.strictEqual(els.aideCredDetail.innerHTML, before);

  desk.currentAdminRole = 'Scheduler';
  els.tab_aides.classList.add('aide-manage-on');
  credCalls.length = 0;
  els.aideCredDetail.innerHTML = '';
  desk.aideCredState.view = 'list';
  desk.aideCredState.manageDots = false;
  await desk.aideCredOpenFromManageDots(JANE, 'Jane Doe');
  assert.deepStrictEqual(credCalls, [JANE], 'Manage Credentials still lists that aide');
  assert.strictEqual(desk.aideCredState.manageDots, true);
  assert.ok(els.tab_aides.classList.contains('aide-manage-on'), 'Manage stays on');
  assert.ok(els.tab_aides.classList.contains('aide-manage-creds'), 'Manage shows the one-aide desk');
  assert.ok(els.aideCredDetail.innerHTML.includes('Jane Doe') && els.aideCredDetail.innerHTML.includes('cpr'));
  assert.strictEqual(els.aideCredList.hidden, true);
  console.log('admin-sched-creds1-test: unit ok');
  return runBrowser();
})().then(function(){
  console.log('admin-sched-creds1-test ok');
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
function chromePath(){
  if(process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH))return process.env.CHROME_PATH;
  const candidates = ['/usr/bin/google-chrome', '/usr/local/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for(let i = 0; i < candidates.length; i++){
    if(fs.existsSync(candidates[i]))return candidates[i];
  }
  return '';
}

async function runBrowser(){
  const puppeteer = loadPuppeteer();
  const chrome = chromePath();
  if(!puppeteer || !chrome){
    console.log('admin-sched-creds1 browser skipped (no puppeteer-core or chrome)');
    return;
  }
  const http = require('http');
  const shotDir = process.env.SCHED_CREDS1_SHOTS || '/opt/cursor/artifacts';
  fs.mkdirSync(shotDir, {recursive: true});
  const root = __dirname;
  const types = {'.html':'text/html; charset=utf-8', '.js':'text/javascript', '.txt':'text/plain; charset=utf-8', '.png':'image/png'};
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
  const calls = [];
  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });
  function arm(page){
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
      let body = {};
      try{body = JSON.parse(req.postData() || '{}');}catch(e){}
      if(rpc)calls.push({rpc:rpc, body:body});
      let payload = {success:true};
      if(rpc === 'admin_list_aides_info'){
        payload = {aides:[{
          id: JANE,
          username: 'jdoe',
          full_name: 'Jane Doe',
          initials: 'JD',
          phone: '2163775991',
          preferred_language_label: 'en',
          clients: [{name:'Reed'}],
          next_status: 'next',
          next_label: 'Next',
          creds_due: '2026-10-05',
          is_active: true,
          deep_link: {surface:'aides'}
        }]};
      }else if(rpc === 'admin_list_aide_credentials'){
        payload = {success:true, credentials:[{
          id: 'c-cpr',
          credential_type: 'cpr',
          expiry_date: '2026-10-05',
          status: 'expiring_soon',
          label: 'CPR'
        }]};
      }else if(rpc === 'admin_aide_credentials_rollup'){
        payload = {success:true, attention_count:0, aides:[]};
      }
      req.respond({status:200, contentType:'application/json', headers:cors, body:JSON.stringify(payload)});
    });
  }
  const authGrants = [];
  async function boot(width, height, role){
    const page = await browser.newPage();
    await page.setViewport({width:width, height:height, isMobile:width < 900, hasTouch:width < 900, deviceScaleFactor:1});
    await page.setRequestInterception(true);
    arm(page);
    page.on('request', function(req){
      if(/\/auth\/v1\/token/.test(req.url()))authGrants.push(req.url());
    });
    const grantMark = authGrants.length;
    const username = role === 'Scheduler' ? 'Jaz' : (role === 'Nurse' ? 'Nurse' : 'Mo');
    await page.evaluateOnNewDocument(function(roleName, userName){
      try{sessionStorage.setItem('pagesCacheFresh1Reloads', '1');}catch(e){}
      localStorage.setItem('admin_session', JSON.stringify({
        role: roleName,
        username: userName,
        name: roleName === 'Nurse' ? 'Nurse' : '',
        loginAt: Date.now()
      }));
      var email = roleName === 'Scheduler' ? 'scheduler@roles.evercare.local' : (roleName === 'Nurse' ? 'nurse@roles.evercare.local' : 'admin@roles.evercare.local');
      localStorage.setItem('evercare_sb_session', JSON.stringify({
        access_token: 'sched-creds1-test',
        refresh_token: 'sched-creds1-refresh',
        email: email,
        profile: {org_id:'4f97f4d3-6635-4544-904c-6b06aa02d40b', role: String(roleName).toLowerCase(), display_name: userName, email: email}
      }));
    }, role, username);
    await page.goto('http://127.0.0.1:' + port + '/index.html', {waitUntil:'domcontentloaded', timeout:20000});
    const signed = await page.evaluate(function(){
      var sess = typeof readAdminSession === 'function' ? readAdminSession() : null;
      return {
        role: currentAdminRole,
        username: currentAdminUsername,
        sessionRole: sess && sess.role,
        adminOn: !!(document.getElementById('adminScreen') && document.getElementById('adminScreen').classList.contains('active'))
      };
    });
    assert.strictEqual(signed.role, role, 'restoreAdminSession applied the login role');
    assert.strictEqual(signed.sessionRole, role, 'admin_session is the login record');
    assert.strictEqual(signed.username, username, 'soft-check keeps the signed-in name');
    assert.strictEqual(authGrants.length, grantMark, 'soft-check does not post a password grant');
    if(role === 'Nurse'){
      const nurseHome = await page.evaluate(function(){
        return {
          nurseOn: document.getElementById('nurseScreen').classList.contains('active'),
          adminOn: document.getElementById('adminScreen').classList.contains('active')
        };
      });
      assert.strictEqual(nurseHome.nurseOn, true, 'Nurse stays on the nurse home');
      assert.strictEqual(nurseHome.adminOn, false, 'Nurse does not get Admin chrome');
      return page;
    }
    assert.strictEqual(signed.adminOn, true, 'Admin and Scheduler share the portal');
    await page.evaluate(function(){showTab('aides');});
    await page.waitForSelector('#aidesContainer .aide-info-more', {timeout:8000});
    const chrome = await page.evaluate(function(){
      var search = document.getElementById('aidesListSearch');
      var manage = document.getElementById('aideCredManageBtn');
      return {
        searchRoles: search ? search.getAttribute('data-layout-roles') : '',
        manageHidden: !manage || manage.hidden === true
      };
    });
    assert.ok(chrome.searchRoles.indexOf('Admin') >= 0 && chrome.searchRoles.indexOf('Scheduler') >= 0, 'Aides search chrome is Admin Scheduler');
    assert.strictEqual(chrome.manageHidden, false, 'Manage is office chrome');
    return page;
  }
  async function menuItems(page){
    await page.click('#aidesContainer .aide-info-more');
    await page.waitForFunction(function(){
      var sheet = document.getElementById('aideInfoSheet');
      var actions = document.getElementById('aideInfoSheetActions');
      return sheet && !sheet.hidden && actions && actions.innerText;
    }, {timeout:8000});
    return page.evaluate(function(){
      var actions = document.getElementById('aideInfoSheetActions');
      var buttons = Array.prototype.map.call(actions.querySelectorAll('button'), function(btn){
        return (btn.textContent || '').replace(/\s+/g, ' ').trim();
      });
      return {
        buttons: buttons,
        text: actions.innerText,
        search: location.search,
        marker: (actions.querySelector('[data-sched-creds1]') || {}).getAttribute ? actions.querySelector('[data-sched-creds1]').getAttribute('data-sched-creds1') : '',
        rollupHidden: document.getElementById('aideCredsRoot').hidden,
        manage: document.getElementById('tab_aides').classList.contains('aide-manage-on')
      };
    });
  }
  async function openCreds(page){
    const before = calls.length;
    await page.evaluate(function(){
      var buttons = document.querySelectorAll('#aideInfoSheetActions button');
      for(var i = 0; i < buttons.length; i++){
        if(/^Credentials$/.test((buttons[i].textContent || '').trim())){buttons[i].click(); return;}
      }
      throw new Error('Credentials button missing');
    });
    await page.waitForFunction(function(){
      var detail = document.getElementById('aideCredDetail');
      var root = document.getElementById('aideCredsRoot');
      var sheet = document.getElementById('aideInfoSheet');
      return detail && !detail.hidden && root && !root.hidden && sheet && sheet.hidden
        && /Jane Doe/.test(detail.innerText || '') && /CPR/.test(detail.innerText || '');
    }, {timeout:8000});
    const seen = calls.slice(before).filter(function(c){return c.rpc === 'admin_list_aide_credentials';});
    const painted = await page.evaluate(function(){
      return {
        text: document.getElementById('aideCredDetail').innerText,
        manage: document.getElementById('tab_aides').classList.contains('aide-manage-on'),
        manageCreds: document.getElementById('tab_aides').classList.contains('aide-manage-creds'),
        listHidden: document.getElementById('aideCredList').hidden
      };
    });
    assert.ok(seen.length >= 1 && seen[0].body.p_aide_id === JANE, 'same admin_list_aide_credentials path');
    assert.ok(/Jane Doe/.test(painted.text) && /CPR/.test(painted.text), painted.text);
    assert.strictEqual(painted.listHidden, true, 'one aide desk, not the rollup list');
    return painted;
  }
  try{
    const phone = await boot(390, 844, 'Scheduler');
    const phoneMenu = await menuItems(phone);
    assert.deepStrictEqual(phoneMenu.buttons, ['Credentials', 'View profile', 'Reset temp password', 'Delete']);
    assert.strictEqual(phoneMenu.marker, 'v=sched-creds1');
    assert.strictEqual(phoneMenu.search, '', 'clean URL has no sticky ?v=');
    assert.strictEqual(phoneMenu.rollupHidden, true, 'Scheduler landing still hides the rollup block');
    await phone.screenshot({path: path.join(shotDir, 'sched-creds1-phone-menu.png')});
    const phoneDesk = await openCreds(phone);
    assert.strictEqual(phoneDesk.manage, false);
    await phone.screenshot({path: path.join(shotDir, 'sched-creds1-phone-desk.png')});

    const deskPage = await boot(1280, 800, 'Scheduler');
    const deskMenu = await menuItems(deskPage);
    assert.deepStrictEqual(deskMenu.buttons, phoneMenu.buttons, 'desktop menu matches phone');
    assert.strictEqual(deskMenu.rollupHidden, true);
    await deskPage.screenshot({path: path.join(shotDir, 'sched-creds1-desktop-menu.png')});
    await openCreds(deskPage);
    await deskPage.screenshot({path: path.join(shotDir, 'sched-creds1-desktop-desk.png')});

    const manage = await boot(390, 844, 'Scheduler');
    await manage.evaluate(function(){aideCredToggleManage();});
    await manage.waitForFunction(function(){
      return document.getElementById('tab_aides').classList.contains('aide-manage-on');
    }, {timeout:8000});
    const manageMenu = await menuItems(manage);
    assert.ok(manageMenu.buttons.indexOf('Credentials') >= 0 && manageMenu.buttons.indexOf('View profile') >= 0 && manageMenu.buttons.indexOf('Reset temp password') >= 0 && manageMenu.buttons.indexOf('Delete') >= 0, manageMenu.buttons.join(','));
    assert.ok(/Manage mode/.test(manageMenu.text));
    assert.strictEqual(manageMenu.manage, true);
    await manage.screenshot({path: path.join(shotDir, 'sched-creds1-phone-manage-menu.png')});
    const manageDesk = await openCreds(manage);
    assert.strictEqual(manageDesk.manage, true, 'Manage stays on');
    assert.strictEqual(manageDesk.manageCreds, true, 'Manage opens the one-aide desk');

    const admin = await boot(390, 844, 'Admin');
    const adminMenu = await menuItems(admin);
    assert.deepStrictEqual(adminMenu.buttons, phoneMenu.buttons, 'Admin menu matches Scheduler');
    await admin.screenshot({path: path.join(shotDir, 'sched-creds1-admin-phone-menu.png')});
    await openCreds(admin);

    const nurse = await boot(390, 844, 'Nurse');
    const nurseRole = await nurse.evaluate(function(){return currentAdminRole;});
    assert.strictEqual(nurseRole, 'Nurse', 'Nurse login stays Nurse');

    console.log('admin-sched-creds1-test: phone and desktop ok');
  }finally{
    await browser.close();
    server.close();
  }
}
