#!/usr/bin/env node
'use strict';
require('./test-block-apps-script.js');

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

function extractFn(src, sig){
  const start = src.indexOf(sig);
  if(start < 0)return '';
  let i = src.indexOf('{', start);
  let depth = 0;
  for(; i < src.length; i++){
    if(src[i] === '{')depth++;
    else if(src[i] === '}'){
      depth--;
      if(depth === 0)return src.slice(start, i + 1);
    }
  }
  return '';
}

assert.ok(!html.includes('function warmUpSheets('), 'warm-up is gone');
assert.ok(!html.includes('startLoginWarmKeepAlive'), 'login keep-alive is gone');
assert.ok(!html.includes('stopLoginWarmKeepAlive'), 'login keep-alive stop is gone');
assert.ok(!fs.existsSync(path.join(__dirname, 'exec')), 'pages root must not serve a static exec beacon');
assert.ok(!/SHEETS_URL/.test(html), 'SHEETS_URL is gone');
assert.ok(!/script\.google\.com/.test(html), 'no Apps Script host');
const headEnd = html.indexOf('</head>');
assert.ok(headEnd > 0, 'head must close');
const head = html.slice(0, headEnd);
assert.ok(/setResourceTimingBufferSize\(500\)/.test(head), 'head must raise the Resource Timing buffer to 500');
assert.ok(!/action:'ping'/.test(head), 'head must not POST the warm ping');
assert.ok(!/Wake Ace/.test(head), 'head Wake Ace IIFE must be gone');
const showScreenFn = extractFn(html, 'function showScreen(id)');
assert.ok(showScreenFn.includes('loginKbClear'), 'showScreen still clears the keyboard scrollport');
assert.ok(!/Warm|exec/.test(showScreenFn), 'showScreen does not warm or beacon');

const login = extractFn(html, 'async function mgrLogin()');
assert.ok(login, 'mgrLogin missing');
assert.ok(!login.includes("action:'admin_login'"), 'login does not post the legacy password login');
assert.ok(!login.includes('Sheets sign-in is no longer available'), 'login has no sheets branch');
assert.ok(login.includes("showScreen('loginScreen')"), 'a failed login stays on the login screen');
assert.ok(login.indexOf('evercareSbEnabled()') < login.indexOf('sbAuthRoleLogin('), 'login uses the office account');
assert.ok(html.includes('v=warmoff1'), 'warmoff1 marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-isclear1">'), 'isclear1 admin-build after cgreset1');
assert.ok(html.includes('v=cgreset1'), 'cgreset1 marker stays');
assert.ok(html.includes('v=bcast1'), 'bcast1 marker stays');
assert.ok(login.includes('openPortalHome('), 'login must open home after success');
assert.ok(!/get_users|get_all|get_clients|get_assigned_topic/.test(login), 'mgrLogin must not fetch heavy lists');
assert.ok(!/await\s+renderTimesheets|await\s+apiGetCached|await\s+loadNurseCompliance/.test(login), 'mgrLogin must not await list loads');

const home = extractFn(html, 'function openPortalHome(sess, opts)');
assert.ok(home, 'openPortalHome missing');
assert.ok(!/\bawait\b/.test(home), 'openPortalHome must not await');
const nurseShow = home.indexOf("showScreen('nurseScreen')");
const adminShow = home.indexOf("showScreen('adminScreen')");
const usersAt = home.indexOf("'get_users'");
const renderAt = home.indexOf('renderTimesheets()');
const nurseLoad = home.indexOf('loadNurseCompliance(true)');
assert.ok(nurseShow >= 0 && adminShow >= 0, 'home must paint nurse and admin screens');
assert.ok(nurseShow < nurseLoad && adminShow < renderAt, 'home must paint before list loads');
assert.ok(usersAt > adminShow && usersAt > nurseShow, 'get_users stays after home is shown');
assert.ok(/requestAnimationFrame\(function\(\)\{setTimeout\(run,0\);\}\)/.test(home), 'list loads must be deferred until after paint');
assert.ok(/role==='Nurse'/.test(home) && /showScreen\('nurseScreen'\)/.test(home), 'Nurse stays on nurse home');
assert.ok(/showScreen\('adminScreen'\)/.test(home), 'Admin and Scheduler use admin home');

const start = extractFn(html, 'function startAdminSession(data)');
assert.ok(start, 'startAdminSession missing');
assert.ok(!/password/.test(start), 'session must not store the password');
assert.ok(/const ADMIN_IDLE_MS=60\*60\*1000;/.test(html), 'office idle timeout is 60 minutes');
assert.ok(!/ADMIN_SESSION_MS/.test(html), 'absolute 8 hour session clock is gone');
assert.ok(html.includes('function touchAdminSessionActivity()'), 'activity resets the idle clock');
assert.ok(extractFn(html, 'function adminLogout()').includes('clearAdminSession()'), 'logout must clear the session');
assert.ok(html.includes('bootAdminPortal();'), 'session must restore when the app opens');
assert.ok(html.includes('enforceAdminSessionTimeout();'), 'session must expire on return');

const mem = {};
const localStorage = {
  getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
  setItem: function(k, v){mem[k] = String(v);},
  removeItem: function(k){delete mem[k];}
};
const screens = [];
const sandbox = {
  localStorage: localStorage,
  store: {
    get: function(k){try{return JSON.parse(localStorage.getItem(k));}catch(e){return null;}},
    set: function(k, v){localStorage.setItem(k, JSON.stringify(v));}
  },
  currentAdminRole: null,
  currentAdminUsername: null,
  currentNurseName: null,
  document: {getElementById: function(){return {textContent:'', disabled:false};}},
  window: {},
  showScreen: function(id){screens.push(id);},
  showNurseTab: function(){},
  nciCompleteListEpoch: 0,
  loadNurseCompliance: function(){screens.push('load-compliance');},
  loadNewClientIntakeDrafts: function(){},
  loadCompletedNewClientIntakes: function(){},
  renderTimesheets: function(){screens.push('render-timesheets');},
  renderBroadcastPreview: function(){},
  refreshNurseAlertBadge: function(){},
  logActivity: function(){screens.push('log');},
  apiGetCached: function(){screens.push('api'); return Promise.resolve(null);},
  Promise: Promise,
  requestAnimationFrame: function(fn){fn();},
  setTimeout: function(fn){fn();},
  Date: Date,
  String: String,
  Number: Number,
  console: console
};
vm.createContext(sandbox);
const prelude = [
  'const ADMIN_SESSION_KEY=\'admin_session\';',
  'const ADMIN_IDLE_MS=60*60*1000;',
  'var adminIdleMemAt=0;',
  extractFn(html, 'function isPortalRole(role)'),
  extractFn(html, 'function parseAdminLoginAt(sess)'),
  extractFn(html, 'function adminSessionActivityAt(sess)'),
  extractFn(html, 'function isAdminSessionExpired(sess)'),
  extractFn(html, 'function clearAdminSession()'),
  extractFn(html, 'function readAdminSession()'),
  extractFn(html, 'function writeAdminSession(sess)'),
  extractFn(html, 'function backfillAdminSessionLoginAt(sess)'),
  extractFn(html, 'function applyAdminSession(sess)'),
  extractFn(html, 'function startAdminSession(data)'),
  extractFn(html, 'function restoreAdminSession()'),
  extractFn(html, 'function openPortalHome(sess, opts)')
].join('\n');
vm.runInContext(prelude, sandbox);

const idleMs = 60 * 60 * 1000;
assert.strictEqual(vm.runInContext('ADMIN_IDLE_MS', sandbox), idleMs);

const adminSess = vm.runInContext('startAdminSession({success:true,role:"Admin",username:"mo"})', sandbox);
assert.strictEqual(adminSess.role, 'Admin');
assert.strictEqual(adminSess.username, 'mo');
assert.ok(adminSess.loginAt > 0);
assert.strictEqual(sandbox.currentAdminRole, 'Admin');
assert.strictEqual(sandbox.currentNurseName, null);
assert.ok(!/password/i.test(localStorage.getItem('admin_session')));

screens.length = 0;
vm.runInContext('openPortalHome(readAdminSession(),{freshLogin:true})', sandbox);
assert.ok(screens.indexOf('adminScreen') >= 0, 'Admin home paints');
assert.ok(screens.indexOf('adminScreen') < screens.indexOf('render-timesheets'), 'timesheets load after home');
assert.ok(!screens.includes('nurseScreen'), 'Admin must not open the nurse portal');

screens.length = 0;
vm.runInContext('startAdminSession({role:"Scheduler",username:"sched"})', sandbox);
vm.runInContext('openPortalHome(readAdminSession(),{freshLogin:false})', sandbox);
assert.strictEqual(sandbox.currentAdminRole, 'Scheduler');
assert.ok(screens.includes('adminScreen'));
assert.ok(!screens.includes('log'), 'restore must not write a fresh login');

screens.length = 0;
vm.runInContext('startAdminSession({role:"Nurse",name:"Ada Nurse",nurseUsername:"ada"})', sandbox);
assert.strictEqual(sandbox.currentAdminRole, 'Nurse');
assert.strictEqual(sandbox.currentNurseName, 'Ada Nurse');
vm.runInContext('openPortalHome(readAdminSession(),{freshLogin:true})', sandbox);
assert.ok(screens.includes('nurseScreen'), 'Nurse home paints');
assert.ok(!screens.includes('adminScreen'), 'Nurse must not open admin tools');
assert.ok(screens.indexOf('nurseScreen') < screens.indexOf('load-compliance'));

function parkIdle(loginAt, activityAt){
  const row = JSON.parse(localStorage.getItem('admin_session'));
  row.loginAt = loginAt;
  row.lastActivityAt = activityAt;
  localStorage.setItem('admin_session', JSON.stringify(row));
  vm.runInContext('adminIdleMemAt=0', sandbox);
}
parkIdle(Date.now() - idleMs + 5000, Date.now() - idleMs + 5000);
const still = vm.runInContext('restoreAdminSession()', sandbox);
assert.ok(still && still.role === 'Nurse', 'session inside 60 idle minutes must restore');

parkIdle(Date.now() - idleMs * 8, Date.now());
const active = vm.runInContext('restoreAdminSession()', sandbox);
assert.ok(active && active.role === 'Nurse', 'recent activity keeps a long login alive');

parkIdle(Date.now() - idleMs - 1000, Date.now() - idleMs - 1000);
const gone = vm.runInContext('restoreAdminSession()', sandbox);
assert.strictEqual(gone, null, 'idle session past 60 minutes must require login');
assert.strictEqual(localStorage.getItem('admin_session'), null);
assert.strictEqual(sandbox.currentAdminRole, null);

localStorage.setItem('admin_session', JSON.stringify({role:'Aide',username:'x',loginAt:Date.now()}));
assert.strictEqual(vm.runInContext('restoreAdminSession()', sandbox), null, 'non-portal roles must not restore');
assert.strictEqual(localStorage.getItem('admin_session'), null);

assert.strictEqual(vm.runInContext('startAdminSession({role:"Aide",password:"secret"})', sandbox), null);

const bare = {role:'Admin', username:'mo'};
localStorage.setItem('admin_session', JSON.stringify(bare));
const filled = vm.runInContext('restoreAdminSession()', sandbox);
assert.ok(filled.loginAt, 'missing loginAt is backfilled instead of forcing logout');
assert.strictEqual(vm.runInContext('isAdminSessionExpired(readAdminSession())', sandbox), false);

(function showScreenDoesNotFetch(){
  const calls = [];
  const classList = function(on){
    const set = {};
    if(on)set.active = true;
    return {
      add: function(c){set[c] = true;},
      remove: function(c){delete set[c];},
      contains: function(c){return !!set[c];}
    };
  };
  const screens = {
    loginScreen: {classList: classList(false)},
    adminScreen: {classList: classList(true)}
  };
  const box = {
    window: {},
    fetch: function(url, opts){
      calls.push({url: url, method: opts && opts.method});
      return Promise.resolve({text: function(){return Promise.resolve('');}});
    },
    document: {
      querySelectorAll: function(){return [screens.loginScreen, screens.adminScreen];},
      getElementById: function(id){return screens[id];}
    }
  };
  vm.createContext(box);
  vm.runInContext(showScreenFn, box);
  vm.runInContext("showScreen('loginScreen')", box);
  assert.ok(screens.loginScreen.classList.contains('active'), 'sign-out shows the login screen');
  assert.ok(!screens.adminScreen.classList.contains('active'), 'sign-out leaves the admin home');
  assert.strictEqual(calls.length, 0, 'showing the login screen does not fetch');
  vm.runInContext("showScreen('adminScreen')", box);
  assert.strictEqual(calls.length, 0, 'leaving the login screen does not fetch');
})();

console.log('admin-login-feel-test: ok');

async function runBrowser(){
  if(process.env.SKIP_BROWSER==='1')return;
  const http=require('http');
  let puppeteer;
  try{puppeteer=require('puppeteer-core');}
  catch(e){
    try{puppeteer=require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){
      console.log('admin-login-feel browser skipped (no puppeteer-core)');
      return;
    }
  }
  const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
  const root=path.join(__dirname);
  const server=http.createServer((req,res)=>{
    const urlPath=decodeURIComponent((req.url||'/').split('?')[0]);
    const file=path.normalize(path.join(root, urlPath==='/'?'index.html':urlPath));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file,(err,buf)=>{
      if(err){res.writeHead(404);res.end('missing');return;}
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
      res.end(buf);
    });
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port;
  const browser=await puppeteer.launch({
    executablePath:chrome,
    headless:'new',
    args:['--no-sandbox','--disable-dev-shm-usage']
  });
  try{
    for(const vp of [
      {name:'desktop',width:1280,height:800,isMobile:false},
      {name:'phone',width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2}
    ]){
      const page=await browser.newPage();
      await page.setViewport(vp);
      const hits=[];
      await page.setRequestInterception(true);
      page.on('request',req=>{
        const u=req.url();
        if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort();return;}
        if(!/script\.google\.com/.test(u)){req.continue();return;}
        let action='';
        try{action=JSON.parse(req.postData()||'{}').action||'';}catch(e){}
        hits.push({method:req.method(),action,url:u});
        req.respond({
          status:200,
          contentType:'application/json',
          headers:{'Access-Control-Allow-Origin':'*'},
          body:JSON.stringify({success:true,ok:true})
        });
      });
      const navAt=Date.now();
      await page.goto('http://127.0.0.1:'+port+'/index.html?sheets=1&v=warm',{waitUntil:'domcontentloaded',timeout:20000});
      const budget=Math.max(50, 1500-(Date.now()-navAt));
      const freshTiming=await page.waitForFunction(()=>{
        return window._sheetsWarmUpStarted===true &&
          performance.getEntriesByType('resource').some(function(e){
            return /\/exec/.test(e.name) && e.name.indexOf('script.'+'google.com')<0 && e.name.indexOf('googleusercontent.com')<0;
          });
      },{timeout:budget}).then(function(){return true;}).catch(function(){return false;});
      const freshExec=await page.evaluate(function(){
        var names=performance.getEntriesByType('resource').map(function(e){return e.name;}).filter(function(n){return /\/exec/.test(n);});
        return {
          flag:window._sheetsWarmUpStarted===true,
          exec:names,
          buf:typeof performance.setResourceTimingBufferSize==='function'
        };
      });
      assert.ok(freshTiming, vp.name+' fresh open: _sheetsWarmUpStarted and same-origin /exec Resource Timing within 1.5s; names='+JSON.stringify(freshExec.exec)+' flag='+freshExec.flag+' budget='+budget);
      assert.ok(freshExec.flag && freshExec.exec.some(function(n){return n.indexOf('script.'+'google.com')<0 && n.indexOf('googleusercontent.com')<0;}), vp.name+' fresh Resource Timing must keep same-origin /exec');
      const deadline=Date.now()+4000;
      while(!hits.some(h=>h.action==='ping'||h.method==='GET')&&Date.now()<deadline){
        await new Promise(r=>setTimeout(r,40));
      }
      const state=await page.evaluate(()=>({
        login:!!document.getElementById('loginScreen')?.classList.contains('active'),
        admin:!!document.getElementById('adminScreen')?.classList.contains('active'),
        warm:window._sheetsWarmUpStarted===true
      }));
      assert.ok(state.login, vp.name+' login screen must stay up before Sign In');
      assert.ok(!state.admin, vp.name+' must not open home before Sign In');
      assert.ok(state.warm, vp.name+' warm flag must be set');
      assert.ok(hits.some(h=>h.action==='ping'), vp.name+' must POST {action:ping} before Sign In');
      assert.ok(hits.some(h=>h.method==='GET'&&/\/exec/.test(h.url)), vp.name+' must GET /exec before Sign In');
      assert.ok(hits.every(h=>/\/exec/.test(h.url)), vp.name+' warm traffic must be /exec');
      const freshCount=hits.length;
      await new Promise(function(r){setTimeout(r,1200);});
      assert.strictEqual(hits.length, freshCount, vp.name+' fresh open must not keep-alive ping');
      // Probe: sign out → one-shot completes → clear Resource Timing → a new /exec within 1.8s.
      await page.evaluate(()=>{
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('adminScreen').classList.add('active');
        var menu=document.getElementById('avatarMenu');
        if(menu)menu.hidden=false;
      });
      await page.click('#adminSignOut');
      const oneShotBy=Date.now()+3000;
      while(hits.length<freshCount+2&&Date.now()<oneShotBy)await new Promise(r=>setTimeout(r,20));
      assert.ok(hits.length>=freshCount+2, vp.name+' sign-out must fire a POST ping and a GET');
      const snap=hits.length;
      await page.evaluate(()=>performance.clearResourceTimings());
      const cleared=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>/\/exec/.test(e.name)).length);
      assert.strictEqual(cleared, 0, vp.name+' Resource Timing must be empty after the probe clears it');
      const keepBy=Date.now()+1800;
      while(hits.length<snap+2&&Date.now()<keepBy)await new Promise(r=>setTimeout(r,20));
      const timed=await page.waitForFunction(()=>performance.getEntriesByType('resource').some(function(e){
        return /\/exec/.test(e.name) && e.name.indexOf('script.'+'google.com')<0 && e.name.indexOf('googleusercontent.com')<0;
      }),{timeout:1800}).then(()=>true).catch(()=>false);
      const after=await page.evaluate(()=>({
        login:!!document.getElementById('loginScreen').classList.contains('active'),
        admin:!!document.getElementById('adminScreen').classList.contains('active'),
        signInDisabled:!!document.getElementById('mgrLoginBtn').disabled,
        exec:performance.getEntriesByType('resource').map(function(e){return e.name;}).filter(function(n){return /\/exec/.test(n);})
      }));
      assert.ok(timed, vp.name+' keep-alive same-origin /exec must appear in Resource Timing within 1.8s after sign-out; names='+JSON.stringify(after.exec));
      assert.ok(after.login, vp.name+' login screen must be showing after sign-out');
      assert.ok(!after.admin, vp.name+' admin home must be hidden after sign-out');
      assert.strictEqual(after.signInDisabled, false, vp.name+' Sign In must stay clickable');
      assert.ok(after.exec.some(function(n){return n.indexOf('script.'+'google.com')<0 && n.indexOf('googleusercontent.com')<0;}), vp.name+' Resource Timing must list the keep-alive same-origin /exec');
      const neu=hits.slice(snap);
      assert.ok(neu.some(h=>h.action==='ping'), vp.name+' keep-alive must POST {action:ping}');
      assert.ok(neu.some(h=>h.method==='GET'&&/\/exec/.test(h.url)), vp.name+' keep-alive must GET /exec');
      await page.evaluate(()=>showScreen('adminScreen'));
      const stopped=hits.length;
      await new Promise(r=>setTimeout(r,1300));
      assert.strictEqual(hits.length, stopped, vp.name+' leaving login must stop the keep-alive');
      console.log('admin-login-feel browser', vp.name, 'fresh='+hits.slice(0,freshCount).map(h=>h.method+(h.action?':'+h.action:'')).join(','),
        'keepalive='+neu.map(h=>h.method+(h.action?':'+h.action:'')).join(','));
      await page.close();
    }
    for(const vp of [
      {name:'desktop',width:1280,height:800,isMobile:false},
      {name:'phone',width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2}
    ]){
      const page=await browser.newPage();
      await page.setViewport(vp);
      const hits=[];
      await page.setRequestInterception(true);
      page.on('request',req=>{
        const u=req.url();
        if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort();return;}
        if(!/script\.google\.com/.test(u)){req.continue();return;}
        let action='';
        try{action=JSON.parse(req.postData()||'{}').action||'';}catch(e){}
        hits.push({method:req.method(),action,url:u});
        req.respond({
          status:200,
          contentType:'application/json',
          headers:{'Access-Control-Allow-Origin':'*'},
          body:JSON.stringify({success:true,ok:true})
        });
      });
      const navAt=Date.now();
      await page.goto('http://127.0.0.1:'+port+'/index.html?v=warmoff1',{waitUntil:'domcontentloaded',timeout:20000});
      const painted=await page.evaluate(()=>({
        login:!!document.getElementById('loginScreen')?.classList.contains('active'),
        admin:!!document.getElementById('adminScreen')?.classList.contains('active'),
        build:document.querySelector('meta[name="admin-build"]')?.content||''
      }));
      assert.ok(painted.login, vp.name+' sb cut login screen is up at DOMContentLoaded');
      assert.ok(!painted.admin, vp.name+' sb cut must not open home before Sign In');
      assert.strictEqual(painted.build, '2026-09-27-remi-float-hide1b');
      assert.ok(Date.now()-navAt<1500, vp.name+' sb cut first paint must not wait on warmkeep');
      await new Promise(r=>setTimeout(r,500));
      const quiet=await page.evaluate(()=>({
        warm:window._sheetsWarmUpStarted===true,
        exec:performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/\/exec/.test(n))
      }));
      assert.notStrictEqual(quiet.warm, true, vp.name+' sb cut must not set the warm flag');
      assert.strictEqual(quiet.exec.length, 0, vp.name+' sb cut first paint must not request /exec '+JSON.stringify(quiet.exec));
      assert.strictEqual(hits.length, 0, vp.name+' sb cut must not call Sheets /exec on login paint');
      await page.evaluate(()=>{
        document.getElementById('loginScreen').classList.remove('active');
        document.getElementById('adminScreen').classList.add('active');
        var menu=document.getElementById('avatarMenu');
        if(menu)menu.hidden=false;
      });
      await page.click('#adminSignOut');
      await new Promise(r=>setTimeout(r,1400));
      const after=await page.evaluate(()=>({
        login:!!document.getElementById('loginScreen').classList.contains('active'),
        warm:window._sheetsWarmUpStarted===true,
        exec:performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/\/exec/.test(n))
      }));
      assert.ok(after.login, vp.name+' sb cut sign-out returns to login');
      assert.notStrictEqual(after.warm, true, vp.name+' sb cut sign-out must not warm');
      assert.strictEqual(after.exec.length, 0, vp.name+' sb cut sign-out must not beacon /exec');
      assert.strictEqual(hits.length, 0, vp.name+' sb cut sign-out must not POST ping');
      console.log('admin-login-feel browser sb-cut', vp.name, 'quiet');
      await page.close();
    }
  }finally{
    await browser.close();
    await new Promise(r=>server.close(r));
  }
}

runBrowser().catch(function(err){
  console.error(err);
  process.exit(1);
});
