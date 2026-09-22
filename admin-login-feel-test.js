#!/usr/bin/env node
'use strict';

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

const warm = extractFn(html, 'function warmUpSheets()');
assert.ok(warm, 'warmUpSheets missing');
assert.ok(/action:'ping'/.test(warm), 'warm ping must post action ping');
assert.ok(/method:'GET'/.test(warm), 'warm ping must also GET /exec');
assert.ok(/\.catch\(/.test(warm), 'warm ping must soft-fail');
assert.ok(!/await\s+fetch/.test(warm), 'warm ping must not block on /exec');
assert.ok(/function warmUpSheets\(\)\{[\s\S]*?\}\s*warmUpSheets\(\);/.test(html), 'warm ping must run when the script opens');
assert.ok(!/loginScreen'\)\?\.classList\.contains\('active'\)\)warmUpSheets/.test(html), 'warm ping must not wait for the login screen check');
const loginAt = html.indexOf('id="loginScreen"');
const earlyPing = html.indexOf("body:JSON.stringify({action:'ping'})");
assert.ok(loginAt > 0 && earlyPing > 0 && earlyPing < loginAt, 'warm ping must be sent before the login screen markup is parsed');
assert.ok(html.indexOf("method:'GET'", earlyPing) > earlyPing && html.indexOf("method:'GET'", earlyPing) < loginAt, 'GET wake must run with the early ping');
const execUrls = html.match(/https:\/\/script\.google\.com\/macros\/s\/[^'"]+\/exec/g) || [];
assert.strictEqual(new Set(execUrls).size, 1, 'early ping and SHEETS_URL must share one /exec URL');

const login = extractFn(html, 'async function mgrLogin()');
assert.ok(login, 'mgrLogin missing');
assert.ok(login.indexOf('warmUpSheets()') >= 0 && login.indexOf('warmUpSheets()') < login.indexOf("action:'admin_login'"),
  'warm ping must start before the login POST');
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
assert.ok(/ADMIN_SESSION_MS=8\*60\*60\*1000/.test(html), 'session must last 8 hours');
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
  'const ADMIN_SESSION_MS=8*60*60*1000;',
  extractFn(html, 'function isPortalRole(role)'),
  extractFn(html, 'function parseAdminLoginAt(sess)'),
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

const eightH = 8 * 60 * 60 * 1000;
assert.strictEqual(vm.runInContext('ADMIN_SESSION_MS', sandbox), eightH);

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

const kept = JSON.parse(localStorage.getItem('admin_session'));
kept.loginAt = Date.now() - eightH + 5000;
localStorage.setItem('admin_session', JSON.stringify(kept));
const still = vm.runInContext('restoreAdminSession()', sandbox);
assert.ok(still && still.role === 'Nurse', 'session inside 8h must restore');

kept.loginAt = Date.now() - eightH - 1000;
localStorage.setItem('admin_session', JSON.stringify(kept));
const gone = vm.runInContext('restoreAdminSession()', sandbox);
assert.strictEqual(gone, null, 'session past 8h must require login');
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
      await page.goto('http://127.0.0.1:'+port+'/index.html?v=warm',{waitUntil:'domcontentloaded',timeout:20000});
      await page.waitForFunction(()=>window._sheetsWarmUpStarted===true,{timeout:5000});
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
      console.log('admin-login-feel browser', vp.name, hits.map(h=>h.method+(h.action?':'+h.action:'')).join(','));
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
