#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const anonFile = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYWxrcHR3Z2lmbmtia3VhdnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMDExMTAsImV4cCI6MjEwNTc3NzExMH0.b-3Pdb_oVR3L6JM0yd_aQcqtQH8exGV7OPwdtx0b3Xg';

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

assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-admintheme1">'), 'admin-build meta');
assert.ok(html.includes('v=warmoff1'), 'warmoff1 marker');
assert.ok(html.includes('v=sbcut1b'), 'sbcut hotfix marker');
assert.ok(html.includes('sheets=1'), 'sheets rollback query');
assert.ok(html.includes('evercare_sheets'), 'sheets rollback storage key');
assert.ok(html.includes("currentAdminRole==='Nurse'"), 'nurse client writes still detect the Nurse role');
assert.ok(html.includes('v=nursenb1'), 'nursenb1 marker');
assert.ok(html.includes('v=bcast1'), 'bcast1 marker');
assert.ok(html.includes("sbRestRpc('list_new_client_intakes'"), 'completes list uses the intake RPC');
const sendBroadcast = extractFn(html, 'async function sendBroadcast()') || extractFn(html, 'function sendBroadcast()');
assert.ok(sendBroadcast.includes("sbRestRpc('send_broadcast'"), 'broadcast send uses Ace on cut ON');
assert.ok(sendBroadcast.includes('evercareSbEnabled()'), 'broadcast gates on sb cut');
assert.ok(sendBroadcast.includes("localStorage.setItem('broadcast_msg'"), 'broadcast rollback keeps localStorage');
assert.ok(!/SHEETS_URL/.test(sendBroadcast), 'broadcast has no Sheets /exec');
assert.ok(html.includes("const SUPABASE_URL='https://zealkptwgifnkbkuavvp.supabase.co';"), 'supabase url');
assert.ok(!html.includes('lvaglmztnlnsrhlluayz'), 'abandoned project ref must not appear');
assert.ok(!/service_role/i.test(html), 'service_role must not be embedded');
assert.ok(!html.includes('resolve_username_email'), 'admin must not call the aides-only rpc');
assert.ok(html.includes(anonFile), 'anon key must be the attached legacy jwt');
assert.strictEqual(anonFile.length, 208);
assert.ok(html.includes('id="mgrRoleField"'), 'account picker exists');
assert.ok(/id="mgrRoleField" style="display:none"/.test(html), 'account picker stays hidden until the flag is on');

const urlConst = (html.match(/const SUPABASE_URL='([^']+)'/) || [])[1];
const keyConst = (html.match(/const SUPABASE_ANON_KEY='([^']+)'/) || [])[1];
assert.strictEqual(keyConst, anonFile);
const payload = JSON.parse(Buffer.from(keyConst.split('.')[1], 'base64').toString());
assert.strictEqual(payload.role, 'anon');
assert.strictEqual(payload.ref, 'zealkptwgifnkbkuavvp');

const warm = extractFn(html, 'function warmUpSheets()');
assert.ok(warm && !/supabase/i.test(warm), 'warm path must not touch supabase');
const keep = extractFn(html, 'function startLoginWarmKeepAlive()');
assert.ok(keep && !/supabase/i.test(keep), 'login keep-alive must not touch supabase');

const authFns = [
  'function evercareSbEnabled()',
  'function syncSbRoleField()',
  'function roleAccountSbEmail(role)',
  'function sbPortalRoleFromProfile(role)',
  'function readSbSession()',
  'function writeSbSession(sess)',
  'function clearSbSession()',
  'function hydrateSbSession()',
  'function sbUserIdFromToken(token)',
  'function sbAuthErrorMessage(data,status)',
  'async function sbPasswordGrant(email,password)',
  'async function sbLoadProfile(accessToken,userId)',
  'async function sbAuthRoleLogin(role,password)',
  'function sbSignOut()'
].map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

const login = extractFn(html, 'async function mgrLogin()');
assert.ok(login.includes("action:'admin_login'"), 'sheets login stays for flag off');
assert.ok(!login.includes('softSbDualVerify'), 'soft probe must not run after sheets success');
assert.ok(login.indexOf('evercareSbEnabled()') < login.indexOf('warmUpSheets()'), 'sb cut login does not warm before the flag branch');
assert.ok(login.indexOf('sbAuthRoleLogin(') < login.indexOf('warmUpSheets()'), 'sb auth is not preceded by sheets warmkeep');
assert.ok(login.indexOf('evercareSbEnabled()') < login.indexOf("action:'admin_login'"), 'flag check precedes sheets admin_login');
assert.ok(login.indexOf('sbAuthRoleLogin(') > 0 && login.indexOf('sbAuthRoleLogin(') < login.indexOf("action:'admin_login'"), 'auth login is the flag-on branch');
assert.ok(!/await\s+softSbDualVerify/.test(login), 'soft verify must not be awaited');
assert.strictEqual((html.match(/\/auth\/v1\/token\?grant_type=password/g) || []).length, 1, 'only one password grant');
assert.ok(html.includes("'/rest/v1/profiles?id=eq.'"), 'profile load uses the user jwt');
assert.ok(extractFn(html, 'function adminLogout()').includes('sbSignOut()'), 'sign-out revokes the auth session');
assert.ok(extractFn(html, 'function clearAdminSession()').includes("localStorage.removeItem('evercare_sb_session')"), 'clearing the portal session drops the jwt');

function b64url(obj){
  return Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function tokenBody(opts){
  const userId = opts.userId || '11111111-1111-1111-1111-111111111111';
  const access = opts.access || (b64url({alg:'none',typ:'JWT'}) + '.' + b64url({sub:userId,role:'authenticated'}) + '.sig');
  const body = {
    access_token: access,
    refresh_token: opts.refresh || 'refresh-1',
    expires_in: 3600,
    expires_at: 1999999999,
    token_type: 'bearer'
  };
  if(opts.omitUser)return body;
  body.user = {id: opts.userId === null ? undefined : userId, email: opts.email || 'admin@roles.evercare.local'};
  if(opts.userId === null)delete body.user.id;
  return body;
}

function profileBody(opts){
  const row = {
    id: opts.userId || '11111111-1111-1111-1111-111111111111',
    org_id: '22222222-2222-2222-2222-222222222222',
    role: opts.role || 'admin',
    display_name: opts.display_name == null ? 'Office Admin' : opts.display_name,
    email: opts.email || 'admin@roles.evercare.local',
    is_active: opts.is_active !== false
  };
  if(opts.empty)return [];
  if(opts.object)return row;
  return [row];
}

function runAuth(opts){
  const calls = [];
  const mem = Object.assign({}, opts.storage || {});
  const queue = (opts.responses || []).slice();
  const box = {
    SUPABASE_URL: urlConst,
    SUPABASE_ANON_KEY: keyConst,
    SB_SESSION_KEY: 'evercare_sb_session',
    location: {search: opts.search || ''},
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k, v){mem[k] = String(v);},
      removeItem: function(k){delete mem[k];}
    },
    window: {},
    fetch: function(url, init){
      calls.push({url: url, init: init});
      const next = queue.length ? queue.shift() : null;
      if(next && next.reject)return Promise.reject(next.reject);
      if(!next && opts.reject)return Promise.reject(opts.reject);
      const res = next || opts.response || {ok:false, status:400, raw:'{}'};
      return Promise.resolve({
        ok: res.ok,
        status: res.status,
        text: function(){return Promise.resolve(res.raw);}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise,
    encodeURIComponent: encodeURIComponent,
    atob: function(s){return Buffer.from(s, 'base64').toString('utf8');}
  };
  vm.createContext(box);
  vm.runInContext(authFns, box);
  const result = vm.runInContext(
    'sbAuthRoleLogin(' + JSON.stringify(opts.role) + ',' + JSON.stringify(opts.password) + ')',
    box
  );
  return result.then(function(out){
    return {calls: calls, out: out, mem: mem, win: box.window};
  });
}

function sheetsLoginHarness(opts){
  const sheets = [];
  const warmed = [];
  const els = {
    mgr_pass: {value: opts.password || ''},
    mgr_role: {value: opts.role || 'Admin'},
    mgrLoginBtn: {disabled: false, textContent: 'Sign In →'},
    mgrErr: {style: {display: 'none'}, textContent: ''}
  };
  const box = {
    window: {},
    document: {
      getElementById: function(id){return els[id] || null;},
      querySelector: function(){return els.mgrLoginBtn;}
    },
    SHEETS_URL: 'https://script.google.com/macros/s/test/exec',
    warmUpSheets: function(){warmed.push(true);},
    evercareSbEnabled: function(){return !!opts.flag;},
    sbAuthRoleLogin: function(role, password){
      box.auth = {role: role, password: password};
      return Promise.resolve(opts.authResult || {ok:false});
    },
    isPortalRole: function(role){return role === 'Admin' || role === 'Scheduler' || role === 'Nurse';},
    startAdminSession: function(data){box.started = data; return {role: data.role, username: data.username, name: data.name};},
    openPortalHome: function(sess, homeOpts){box.home = {sess: sess, opts: homeOpts};},
    fetch: function(url, init){
      sheets.push({url: url, init: init});
      const data = opts.sheetsData || {success:true, role:'Scheduler', username:'sheets-sched'};
      return Promise.resolve({json: function(){return Promise.resolve(data);}});
    },
    JSON: JSON,
    Promise: Promise
  };
  vm.createContext(box);
  vm.runInContext(login, box);
  return vm.runInContext('mgrLogin()', box).then(function(){
    return {sheets: sheets, warmed: warmed, box: box, els: els};
  });
}

const uid = '11111111-1111-1111-1111-111111111111';

function flagBox(search, storage){
  const mem = Object.assign({}, storage || {});
  const box = {
    location: {search: search || ''},
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;}
    }
  };
  vm.createContext(box);
  vm.runInContext(extractFn(html, 'function evercareSbEnabled()'), box);
  return box;
}
assert.strictEqual(vm.runInContext('evercareSbEnabled()', flagBox('')), true, 'default is Supabase');
assert.strictEqual(vm.runInContext('evercareSbEnabled()', flagBox('?sb=0')), true, 'missing sb=1 does not select Sheets');
assert.strictEqual(vm.runInContext('evercareSbEnabled()', flagBox('?sb=1')), true, 'old sb=1 query stays on');
assert.strictEqual(vm.runInContext('evercareSbEnabled()', flagBox('', {evercare_sb:'1'})), true, 'old evercare_sb key is not required');
assert.strictEqual(vm.runInContext('evercareSbEnabled()', flagBox('?sheets=1')), false, 'query rollback');
assert.strictEqual(vm.runInContext('evercareSbEnabled()', flagBox('?v=1', {evercare_sheets:'1'})), false, 'storage rollback');
assert.strictEqual(vm.runInContext('evercareSbEnabled()', flagBox('?sb=1', {evercare_sheets:'1'})), false, 'sheets force wins');

Promise.all([
  runAuth({role:'Admin', password:'pw', search:'?sheets=1'}),
  runAuth({role:'Scheduler', password:'sched-pw', search:'?sb=1', responses:[
    {ok:true, status:200, raw: JSON.stringify(tokenBody({email:'scheduler@roles.evercare.local'}))},
    {ok:true, status:200, raw: JSON.stringify(profileBody({role:'scheduler', email:'scheduler@roles.evercare.local', display_name:'Sched Person'}))}
  ]}),
  runAuth({role:'nurse', password:'n', storage:{evercare_sb:'1'}, responses:[
    {ok:true, status:200, raw: JSON.stringify(tokenBody({email:'nurse@roles.evercare.local', omitUser:true, userId:'nurse-uid'}))},
    {ok:true, status:200, raw: JSON.stringify(profileBody({role:'nurse', email:'nurse@roles.evercare.local', display_name:'Ada Nurse', userId:'nurse-uid'}))}
  ]}),
  runAuth({role:'Admin', password:'nope', search:'?sb=1&x=2', storage:{evercare_sb_session:'{"access_token":"old"}'}, responses:[
    {ok:false, status:400, raw: JSON.stringify({error:'invalid_grant', error_description:'Invalid login credentials'})}
  ]}),
  runAuth({role:'Nurse', password:'x', search:'?sb=1', responses:[
    {reject: new Error('offline')}
  ]}),
  runAuth({role:'Admin', password:'x', search:'?sb=1', responses:[
    {ok:false, status:500, raw:'<html>nope</html>'}
  ]}),
  runAuth({role:'Admin', password:'x', search:'?sheets=1', storage:{evercare_sheets:'1', evercare_sb:'0', evercare_sb_session:'{"access_token":"keep"}'}}),
  runAuth({role:'Aide', password:'x', search:'?sb=1'}),
  runAuth({role:'Admin', password:'secret', search:'?sb=1', responses:[
    {ok:true, status:200, raw: JSON.stringify(tokenBody({email:'admin@roles.evercare.local'}))},
    {ok:true, status:200, raw: JSON.stringify([])}
  ]}),
  runAuth({role:'Admin', password:'secret', search:'?sb=1', responses:[
    {ok:true, status:200, raw: JSON.stringify(tokenBody({email:'admin@roles.evercare.local'}))},
    {ok:true, status:200, raw: JSON.stringify(profileBody({role:'scheduler'}))}
  ]}),
  runAuth({role:'Nurse', password:'secret', search:'?sb=1', responses:[
    {ok:true, status:200, raw: JSON.stringify(tokenBody({email:'nurse@roles.evercare.local'}))},
    {ok:true, status:200, raw: JSON.stringify(profileBody({role:'nurse', is_active:false, display_name:'Off'}))}
  ]}),
  sheetsLoginHarness({flag:false, password:'sheets-secret'}),
  sheetsLoginHarness({flag:true, role:'Nurse', password:'nurse-secret', authResult:{
    ok:true,
    role:'Nurse',
    profile:{display_name:'Ada Nurse', email:'nurse@roles.evercare.local', role:'nurse'}
  }}),
  sheetsLoginHarness({flag:true, role:'Admin', password:'bad', authResult:{ok:false, error:'Invalid login credentials'}}),
  sheetsLoginHarness({flag:true, role:'Scheduler', password:'x', authResult:{ok:false, network:true, error:'offline'}})
]).then(function(results){
  const off = results[0];
  assert.strictEqual(off.calls.length, 0, 'flag off makes zero supabase calls');
  assert.strictEqual(off.out.skipped, true);
  assert.strictEqual(off.win.__sbDual, undefined);

  const sched = results[1];
  assert.strictEqual(sched.calls.length, 2, 'password grant then profile');
  assert.strictEqual(sched.calls[0].url, urlConst + '/auth/v1/token?grant_type=password');
  assert.strictEqual(sched.calls[0].init.method, 'POST');
  assert.strictEqual(sched.calls[0].init.headers.apikey, keyConst);
  assert.strictEqual(sched.calls[0].init.headers.Authorization, 'Bearer ' + keyConst);
  assert.strictEqual(sched.calls[0].init.headers['Content-Type'], 'application/json');
  assert.deepStrictEqual(JSON.parse(sched.calls[0].init.body), {email:'scheduler@roles.evercare.local', password:'sched-pw'});
  assert.ok(sched.calls[1].url.indexOf('/rest/v1/profiles?id=eq.' + encodeURIComponent(uid)) >= 0, sched.calls[1].url);
  assert.ok(sched.calls[1].url.indexOf('select=id,org_id,role,display_name,email,is_active') > 0);
  assert.strictEqual(sched.calls[1].init.headers.apikey, keyConst);
  assert.ok(sched.calls[1].init.headers.Authorization.indexOf('Bearer ') === 0);
  assert.notStrictEqual(sched.calls[1].init.headers.Authorization, 'Bearer ' + keyConst);
  assert.strictEqual(sched.calls[1].init.headers.Authorization, 'Bearer ' + JSON.parse(sched.mem.evercare_sb_session).access_token);
  assert.strictEqual(sched.out.ok, true);
  assert.strictEqual(sched.out.role, 'Scheduler');
  assert.strictEqual(sched.out.email, 'scheduler@roles.evercare.local');
  assert.strictEqual(sched.out.profile.display_name, 'Sched Person');
  assert.strictEqual(sched.out.profile.org_id, '22222222-2222-2222-2222-222222222222');
  const stored = JSON.parse(sched.mem.evercare_sb_session);
  assert.ok(stored.access_token);
  assert.strictEqual(stored.refresh_token, 'refresh-1');
  assert.strictEqual(stored.expires_at, 1999999999);
  assert.strictEqual(stored.user.id, uid);
  assert.strictEqual(stored.profile.role, 'scheduler');
  assert.ok(!Object.prototype.hasOwnProperty.call(stored, 'password'));
  assert.ok(!JSON.stringify(stored).includes('sched-pw'));
  assert.strictEqual(sched.win.__sbDual.ok, true);
  assert.strictEqual(sched.win.__sbDual.role, 'Scheduler');
  assert.ok(!JSON.stringify(sched.win.__sbDual).includes(stored.access_token), 'probe object must not carry the jwt');
  assert.strictEqual(sched.win.__sbSession.access_token, stored.access_token);

  const nurse = results[2];
  assert.strictEqual(nurse.calls.length, 2);
  assert.deepStrictEqual(JSON.parse(nurse.calls[0].init.body), {email:'nurse@roles.evercare.local', password:'n'});
  assert.ok(nurse.calls[1].url.indexOf('id=eq.nurse-uid') > 0, 'jwt sub is the profile id when user.id is omitted');
  assert.strictEqual(nurse.out.role, 'Nurse');
  assert.strictEqual(JSON.parse(nurse.mem.evercare_sb_session).user.id, 'nurse-uid');

  const bad = results[3];
  assert.strictEqual(bad.calls.length, 1, 'bad password does not load profiles');
  assert.strictEqual(bad.out.ok, false);
  assert.strictEqual(bad.out.error, 'Invalid login credentials');
  assert.strictEqual(bad.win.__sbDual.ok, false);
  assert.strictEqual(bad.win.__sbDual.email, 'admin@roles.evercare.local');
  assert.strictEqual(bad.mem.evercare_sb_session, undefined, 'failed auth clears a previous jwt');

  const boom = results[4];
  assert.strictEqual(boom.out.ok, false);
  assert.strictEqual(boom.out.network, true);
  assert.strictEqual(boom.out.error, 'offline');
  assert.strictEqual(boom.win.__sbDual.email, 'nurse@roles.evercare.local');
  assert.strictEqual(boom.mem.evercare_sb_session, undefined);

  const htmlErr = results[5];
  assert.strictEqual(htmlErr.out.ok, false);
  assert.strictEqual(htmlErr.out.error, 'HTTP 500');
  assert.strictEqual(htmlErr.mem.evercare_sb_session, undefined);

  const bothOff = results[6];
  assert.strictEqual(bothOff.calls.length, 0, 'sheets=1 and evercare_sheets=1 stay off');
  assert.strictEqual(bothOff.out.skipped, true);
  assert.strictEqual(bothOff.mem.evercare_sb_session, '{"access_token":"keep"}', 'flag off does not clear a stored jwt');

  const aide = results[7];
  assert.strictEqual(aide.calls.length, 0, 'non-role accounts do not call supabase');
  assert.strictEqual(aide.out.ok, false);
  assert.ok(aide.out.error);

  const missing = results[8];
  assert.strictEqual(missing.out.ok, false);
  assert.strictEqual(missing.out.error, 'profile missing');
  assert.strictEqual(missing.mem.evercare_sb_session, undefined);

  const mismatch = results[9];
  assert.strictEqual(mismatch.out.ok, false);
  assert.strictEqual(mismatch.out.error, 'role mismatch');
  assert.strictEqual(mismatch.mem.evercare_sb_session, undefined);

  const inactive = results[10];
  assert.strictEqual(inactive.out.ok, false);
  assert.strictEqual(inactive.out.error, 'profile inactive');

  const sheetsOff = results[11];
  assert.strictEqual(sheetsOff.warmed.length, 1);
  assert.strictEqual(sheetsOff.box.auth, undefined, 'flag off does not call auth');
  assert.strictEqual(sheetsOff.sheets.length, 1);
  assert.deepStrictEqual(JSON.parse(sheetsOff.sheets[0].init.body), {action:'admin_login', password:'sheets-secret'});
  assert.strictEqual(sheetsOff.box.home.sess.role, 'Scheduler');
  assert.strictEqual(sheetsOff.box.started.username, 'sheets-sched');
  assert.strictEqual(sheetsOff.els.mgr_pass.value, '');

  const sheetsOn = results[12];
  assert.strictEqual(sheetsOn.sheets.length, 0, 'flag on does not post admin_login');
  assert.strictEqual(sheetsOn.warmed.length, 0, 'flag on does not warm /exec on login');
  assert.deepStrictEqual(sheetsOn.box.auth, {role:'Nurse', password:'nurse-secret'});
  assert.strictEqual(sheetsOn.box.home.sess.role, 'Nurse');
  assert.strictEqual(sheetsOn.box.home.sess.name, 'Ada Nurse');
  assert.strictEqual(sheetsOn.box.home.opts.freshLogin, true);
  assert.strictEqual(sheetsOn.els.mgr_pass.value, '');
  assert.ok(!JSON.stringify(sheetsOn.box.started).includes('nurse-secret'));

  const sheetsBad = results[13];
  assert.strictEqual(sheetsBad.sheets.length, 0);
  assert.strictEqual(sheetsBad.box.home, undefined);
  assert.strictEqual(sheetsBad.els.mgrErr.textContent, 'Incorrect password.');
  assert.strictEqual(sheetsBad.els.mgrErr.style.display, 'block');
  assert.strictEqual(sheetsBad.box.window._mgrLoginInFlight, false);

  const sheetsNet = results[14];
  assert.strictEqual(sheetsNet.els.mgrErr.textContent, 'Connection error. Please try again.');
  assert.strictEqual(sheetsNet.box.home, undefined);

  console.log('admin-sb-dual-test: ok');
  return runBrowser();
}).catch(function(err){
  console.error(err);
  process.exit(1);
});

async function runBrowser(){
  if(process.env.SKIP_BROWSER==='1')return;
  let puppeteer;
  try{puppeteer=require('puppeteer-core');}
  catch(e){
    try{puppeteer=require('/tmp/probe/node_modules/puppeteer-core');}
    catch(e2){
      console.log('admin-sb-dual browser skipped (no puppeteer-core)');
      return;
    }
  }
  const http=require('http');
  const chrome=process.env.CHROME_PATH||'/usr/bin/google-chrome';
  const root=path.join(__dirname);
  const server=http.createServer((req,res)=>{
    const urlPath=decodeURIComponent((req.url||'/').split('?')[0]);
    const file=path.normalize(path.join(root, urlPath==='/'?'index.html':urlPath));
    if(!file.startsWith(root)){res.writeHead(403);res.end();return;}
    fs.readFile(file,(err,buf)=>{
      if(err){res.writeHead(404);res.end('missing');return;}
      const type=file.endsWith('.js')?'text/javascript':'text/html; charset=utf-8';
      res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});
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
  const access='hdr.payload.sig';
  function roleFromEmail(email){
    return String(email||'').split('@')[0];
  }
  async function open(vp, search, storage){
    const context=await browser.createBrowserContext();
    const page=await context.newPage();
    await page.setViewport(vp);
    if(storage){
      await page.evaluateOnNewDocument(function(mem){
        Object.keys(mem).forEach(function(k){localStorage.setItem(k, mem[k]);});
      }, storage);
    }
    const hits=[];
    await page.setRequestInterception(true);
    page.on('request',function(req){
      const u=req.url();
      if(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|gstatic\.com/.test(u)){req.abort();return;}
      if(/supabase\.co|script\.google\.com/.test(u)){
        const cors={
          'Access-Control-Allow-Origin':'*',
          'Access-Control-Allow-Headers':'apikey, authorization, content-type, accept, prefer',
          'Access-Control-Allow-Methods':'GET, POST, OPTIONS'
        };
        if(req.method()==='OPTIONS'){
          req.respond({status:204, headers:cors, body:''});
          return;
        }
        const post=req.postData()||'';
        let action='';
        let body=null;
        try{body=JSON.parse(post||'{}');action=body.action||'';}catch(e){}
        hits.push({method:req.method(),url:u,action:action,post:post,headers:req.headers()});
        if(/\/auth\/v1\/token/.test(u)){
          const email=body&&body.email;
          const role=roleFromEmail(email);
          req.respond({
            status:200,
            contentType:'application/json',
            headers:cors,
            body:JSON.stringify({
              access_token:access,
              refresh_token:'refresh-browser',
              expires_in:3600,
              expires_at:1999999999,
              token_type:'bearer',
              user:{id:role+'-uid',email:email}
            })
          });
          return;
        }
        if(/\/rest\/v1\/profiles/.test(u)){
          const email=(hits.slice().reverse().find(function(h){return /\/auth\/v1\/token/.test(h.url);})||{}).post;
          let parsed=null;
          try{parsed=JSON.parse(email||'{}');}catch(e){}
          const role=roleFromEmail(parsed&&parsed.email);
          req.respond({
            status:200,
            contentType:'application/json',
            headers:cors,
            body:JSON.stringify([{
              id:role+'-uid',
              org_id:'org-1',
              role:role,
              display_name:role==='nurse'?'Ada Nurse':(role==='scheduler'?'Sched Person':'Office Admin'),
              email:parsed&&parsed.email,
              is_active:true
            }])
          });
          return;
        }
        req.respond({
          status:200,
          contentType:'application/json',
          headers:cors,
          body:JSON.stringify({success:true,ok:true,role:'Admin',username:'mo',data:[]})
        });
        return;
      }
      req.continue();
    });
    const sheetsRollback=/(?:^|[?&])sheets=1(?:&|$)/.test(search)||(storage&&storage.evercare_sheets==='1');
    await page.goto('http://127.0.0.1:'+port+'/index.html'+search,{waitUntil:'domcontentloaded',timeout:20000});
    if(sheetsRollback){
      await page.waitForFunction(function(){
        return window._sheetsWarmUpStarted===true &&
          performance.getEntriesByType('resource').some(function(e){
            return /\/exec/.test(e.name) && e.name.indexOf('script.google.com')<0;
          });
      },{timeout:4000});
    }else{
      await page.waitForFunction(function(){
        var el=document.getElementById('loginScreen');
        return !!(el&&el.classList.contains('active'));
      },{timeout:4000});
      await new Promise(function(r){setTimeout(r,400);});
      const quiet=await page.evaluate(function(){
        return {
          started:window._sheetsWarmUpStarted===true,
          exec:performance.getEntriesByType('resource').map(function(e){return e.name;}).filter(function(n){return /\/exec/.test(n);})
        };
      });
      assert.strictEqual(quiet.started, false, 'sb cut must not start sheets warmkeep before login');
      assert.strictEqual(quiet.exec.length, 0, 'sb cut first paint must not request /exec '+JSON.stringify(quiet.exec));
      assert.ok(!hits.some(function(h){return h.action==='ping'||(h.method==='GET'&&/\/exec/.test(h.url));}), 'sb cut first paint must not warm Sheets /exec');
    }
    return {page:page,hits:hits,context:context};
  }
  try{
    const desktop={width:1280,height:800};
    const phone={width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2};
    const off=await open(desktop,'?sheets=1&v=sheets');
    const offField=await off.page.$eval('#mgrRoleField',function(el){return getComputedStyle(el).display;});
    assert.strictEqual(offField,'none','flag off hides the account picker');
    await off.page.type('#mgr_pass','sheets-secret');
    await off.page.click('#mgrLoginBtn');
    await off.page.waitForFunction(function(){
      return document.getElementById('adminScreen').classList.contains('active');
    },{timeout:8000});
    const offState=await off.page.evaluate(function(){
      return {
        admin:document.getElementById('adminScreen').classList.contains('active'),
        nurse:document.getElementById('nurseScreen').classList.contains('active'),
        pass:document.getElementById('mgr_pass').value,
        sb:localStorage.getItem('evercare_sb_session'),
        role:document.getElementById('sidebarRoleName').textContent
      };
    });
    assert.strictEqual(offState.admin,true);
    assert.strictEqual(offState.nurse,false);
    assert.strictEqual(offState.pass,'');
    assert.strictEqual(offState.sb,null);
    assert.ok(off.hits.some(function(h){return h.action==='admin_login'&&h.post.indexOf('sheets-secret')>0;}));
    assert.ok(!off.hits.some(function(h){return /supabase\.co/.test(h.url);}),'flag off must not call supabase');
    assert.strictEqual(offState.role,'Admin');
    await off.context.close();

    for(const vp of [{name:'desktop',size:desktop,role:'Scheduler',home:'admin',search:'?v=sbcut1'},{name:'phone',size:phone,role:'Nurse',home:'nurse',search:'?sb=1&v=phone'}]){
      const on=await open(vp.size,vp.search);
      const field=await on.page.$eval('#mgrRoleField',function(el){return getComputedStyle(el).display;});
      assert.strictEqual(field,'flex',vp.name+' shows the account picker');
      await on.page.select('#mgr_role',vp.role);
      await on.page.click('#mgr_pass',{clickCount:3});
      await on.page.type('#mgr_pass',vp.role.toLowerCase()+'-secret');
      await on.page.click('#mgrLoginBtn');
      const screenId=vp.home==='nurse'?'nurseScreen':'adminScreen';
      await on.page.waitForFunction(function(id){
        return document.getElementById(id).classList.contains('active');
      },{timeout:8000},screenId);
      const state=await on.page.evaluate(function(){
        var raw=localStorage.getItem('evercare_sb_session');
        var sess=raw?JSON.parse(raw):null;
        var admin=JSON.parse(localStorage.getItem('admin_session')||'null');
        return {
          login:document.getElementById('loginScreen').classList.contains('active'),
          admin:document.getElementById('adminScreen').classList.contains('active'),
          nurse:document.getElementById('nurseScreen').classList.contains('active'),
          pass:document.getElementById('mgr_pass').value,
          email:sess&&sess.email,
          token:sess&&sess.access_token,
          refresh:sess&&sess.refresh_token,
          profileRole:sess&&sess.profile&&sess.profile.role,
          org:sess&&sess.profile&&sess.profile.org_id,
          adminRole:admin&&admin.role,
          nurseLabel:document.getElementById('nurseSidebarRoleName').textContent,
          side:document.getElementById('sidebarRoleName').textContent,
          dual:window.__sbDual
        };
      });
      assert.strictEqual(state.login,false,vp.name+' leaves the login screen');
      assert.strictEqual(state.pass,'');
      assert.strictEqual(state.token,access);
      assert.strictEqual(state.refresh,'refresh-browser');
      assert.strictEqual(state.org,'org-1');
      assert.ok(!JSON.stringify(state.dual).includes(access));
      assert.strictEqual(state.dual.ok,true);
      const email=vp.role.toLowerCase()+'@roles.evercare.local';
      assert.strictEqual(state.email,email);
      assert.strictEqual(state.profileRole,vp.role.toLowerCase());
      assert.strictEqual(state.adminRole,vp.role);
      const tokenHit=on.hits.filter(function(h){return /\/auth\/v1\/token/.test(h.url);});
      const profileHit=on.hits.filter(function(h){return /\/rest\/v1\/profiles/.test(h.url);});
      assert.strictEqual(tokenHit.length,1,vp.name+' one password grant');
      assert.strictEqual(profileHit.length,1,vp.name+' one profile load');
      assert.deepStrictEqual(JSON.parse(tokenHit[0].post),{email:email,password:vp.role.toLowerCase()+'-secret'});
      assert.strictEqual(tokenHit[0].headers.apikey,keyConst);
      assert.strictEqual(tokenHit[0].headers.authorization,'Bearer '+keyConst);
      assert.strictEqual(profileHit[0].headers.authorization,'Bearer '+access);
      assert.ok(!on.hits.some(function(h){return h.action==='admin_login';}),vp.name+' skips sheets admin_login');
      assert.ok(!on.hits.some(function(h){return h.action==='ping'||(h.method==='GET'&&/\/exec/.test(h.url));}),vp.name+' does not warm sheets /exec');
      if(vp.home==='nurse'){
        assert.strictEqual(state.nurse,true);
        assert.strictEqual(state.admin,false);
        assert.ok(state.nurseLabel.indexOf('Ada Nurse')>=0,state.nurseLabel);
        const nciBy=Date.now()+4000;
        while(!on.hits.some(function(h){return /\/rpc\/list_new_client_intakes/.test(h.url)&&/Complete/.test(h.post||'');})&&Date.now()<nciBy){
          await new Promise(function(r){setTimeout(r,40);});
        }
        const completeHits=on.hits.filter(function(h){return /\/rpc\/list_new_client_intakes/.test(h.url)&&/Complete/.test(h.post||'');});
        assert.ok(completeHits.length>=1, vp.name+' nurse Completes hit list_new_client_intakes');
        assert.ok(completeHits.every(function(h){return h.url.indexOf('script.google.com')<0;}), vp.name+' Completes must not use /exec');
        assert.ok(!on.hits.some(function(h){return h.action==='list_new_client_intakes'&&/script\.google\.com/.test(h.url);}), vp.name+' Completes list is not a Sheets action');
      }else{
        assert.strictEqual(state.admin,true);
        assert.strictEqual(state.nurse,false);
        assert.strictEqual(state.side,'Scheduler');
      }
      console.log('admin-sb-dual browser',vp.name,'ok');
      await on.context.close();
    }

    const storedFlag=await open(phone,'?v=stored',{evercare_sb:'1'});
    const storedField=await storedFlag.page.$eval('#mgrRoleField',function(el){return getComputedStyle(el).display;});
    assert.strictEqual(storedField,'flex','localStorage evercare_sb=1 shows the account picker');
    await storedFlag.page.select('#mgr_role','Admin');
    await storedFlag.page.type('#mgr_pass','admin-secret');
    await storedFlag.page.click('#mgrLoginBtn');
    await storedFlag.page.waitForFunction(function(){
      return document.getElementById('adminScreen').classList.contains('active');
    },{timeout:8000});
    const storedState=await storedFlag.page.evaluate(function(){
      var sess=JSON.parse(localStorage.getItem('evercare_sb_session')||'null');
      return {email:sess&&sess.email,role:document.getElementById('sidebarRoleName').textContent};
    });
    assert.strictEqual(storedState.email,'admin@roles.evercare.local');
    assert.strictEqual(storedState.role,'Admin');
    assert.ok(!storedFlag.hits.some(function(h){return h.action==='admin_login';}));
    console.log('admin-sb-dual browser stored-flag ok');
    await storedFlag.context.close();
  }finally{
    await browser.close();
    await new Promise(r=>server.close(r));
  }
}
