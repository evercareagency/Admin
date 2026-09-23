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

assert.ok(html.includes('<meta name="admin-build" content="2026-09-23-sb-dual-admin">'), 'admin-build meta');
assert.ok(html.includes("const SUPABASE_URL='https://zealkptwgifnkbkuavvp.supabase.co';"), 'supabase url');
assert.ok(!html.includes('lvaglmztnlnsrhlluayz'), 'abandoned project ref must not appear');
assert.ok(!/service_role/i.test(html), 'service_role must not be embedded');
assert.ok(!html.includes('resolve_username_email'), 'admin must not call the aides-only rpc');
assert.ok(html.includes(anonFile), 'anon key must be the attached legacy jwt');
assert.strictEqual(anonFile.length, 208);

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

const soft = extractFn(html, 'function softSbDualVerify(role,password)');
assert.ok(soft, 'softSbDualVerify missing');
assert.ok(/if\(!evercareSbEnabled\(\)\)return/.test(soft), 'flag off returns before the network');
assert.ok(soft.indexOf('if(!evercareSbEnabled())return') < soft.indexOf('fetch('), 'guard precedes fetch');
assert.ok(soft.includes(urlConst + "'+'/auth/v1/token?grant_type=password'") || soft.includes("SUPABASE_URL+'/auth/v1/token?grant_type=password'"), 'token endpoint');
assert.ok(/apikey:SUPABASE_ANON_KEY/.test(soft), 'apikey header');
assert.ok(/Authorization:'Bearer '\+SUPABASE_ANON_KEY/.test(soft), 'bearer anon');
assert.ok(/'Content-Type':'application\/json'/.test(soft), 'json content type');
assert.ok(/JSON\.stringify\(\{email:email,password:password\}\)/.test(soft), 'email and password body');
assert.ok(/window\.__sbDual=\{ok:true,email:email\}/.test(soft), 'probe ok');
assert.ok(/window\.__sbDual=\{ok:false,error:/.test(soft), 'probe error');
assert.ok(!/access_token/.test(soft.replace('data.access_token', '')), 'probe must not store the access token');
assert.strictEqual((html.match(/\/auth\/v1\/token\?grant_type=password/g) || []).length, 1, 'only one token call site');

const login = extractFn(html, 'async function mgrLogin()');
assert.ok(login.includes("action:'admin_login'"), 'sheets login stays');
const successAt = login.indexOf('data.success&&isPortalRole(data.role)');
const softAt = login.indexOf('softSbDualVerify(data.role,pwd)');
const homeAt = login.indexOf('openPortalHome(');
assert.ok(successAt >= 0 && softAt > successAt && homeAt > softAt, 'soft verify runs after sheets success and does not replace home');
assert.ok(!/await\s+softSbDualVerify/.test(login), 'soft verify must not be awaited');
assert.ok(login.indexOf('warmUpSheets()') < login.indexOf("action:'admin_login'"), 'warm still precedes the sheets post');

function runSoft(opts){
  const calls = [];
  const mem = Object.assign({}, opts.storage || {});
  const box = {
    SUPABASE_URL: urlConst,
    SUPABASE_ANON_KEY: keyConst,
    location: {search: opts.search || ''},
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;}
    },
    window: {},
    fetch: function(url, init){
      calls.push({url: url, init: init});
      if(opts.reject)return Promise.reject(opts.reject);
      const res = opts.response || {ok:true, status:200, raw: JSON.stringify({access_token:'secret-token', user:{id:'1'}})};
      return Promise.resolve({
        ok: res.ok,
        status: res.status,
        text: function(){return Promise.resolve(res.raw);}
      });
    },
    JSON: JSON,
    String: String,
    Promise: Promise
  };
  vm.createContext(box);
  vm.runInContext([
    extractFn(html, 'function evercareSbEnabled()'),
    extractFn(html, 'function roleAccountSbEmail(role)'),
    soft
  ].join('\n'), box);
  let threw = null;
  try{
    vm.runInContext('softSbDualVerify(' + JSON.stringify(opts.role) + ',' + JSON.stringify(opts.password) + ')', box);
  }catch(e){threw = e;}
  return {calls: calls, win: box.window, threw: threw, dual: function(){return box.window.__sbDual;}};
}

const off = runSoft({role:'Admin', password:'pw'});
assert.strictEqual(off.calls.length, 0, 'flag off makes zero supabase calls');
assert.strictEqual(off.dual(), undefined);
assert.strictEqual(off.threw, null);

const queryOn = runSoft({role:'Scheduler', password:'sched-pw', search:'?sb=1'});
assert.strictEqual(queryOn.calls.length, 1);
assert.strictEqual(queryOn.calls[0].url, urlConst + '/auth/v1/token?grant_type=password');
assert.strictEqual(queryOn.calls[0].init.method, 'POST');
assert.strictEqual(queryOn.calls[0].init.headers.apikey, keyConst);
assert.strictEqual(queryOn.calls[0].init.headers.Authorization, 'Bearer ' + keyConst);
assert.strictEqual(queryOn.calls[0].init.headers['Content-Type'], 'application/json');
assert.deepStrictEqual(JSON.parse(queryOn.calls[0].init.body), {email:'scheduler@roles.evercare.local', password:'sched-pw'});

const stored = runSoft({role:'nurse', password:'n', storage:{evercare_sb:'1'}});
assert.strictEqual(stored.calls.length, 1);
assert.deepStrictEqual(JSON.parse(stored.calls[0].init.body), {email:'nurse@roles.evercare.local', password:'n'});

const bothOffish = runSoft({role:'Admin', password:'x', search:'?sb=0', storage:{evercare_sb:'0'}});
assert.strictEqual(bothOffish.calls.length, 0, 'sb=0 and evercare_sb=0 stay off');

const aide = runSoft({role:'Aide', password:'x', search:'?v=1&sb=1'});
assert.strictEqual(aide.calls.length, 0, 'non-role accounts do not call supabase');
assert.strictEqual(aide.dual().ok, false);
assert.ok(aide.dual().error);

function settle(p){
  return new Promise(function(resolve){setTimeout(resolve, 20);}).then(function(){return p;});
}

settle(Promise.resolve()).then(function(){
  const ok = runSoft({role:'Admin', password:'secret', search:'?sb=1&x=2'});
  const bad = runSoft({
    role:'Admin',
    password:'nope',
    storage:{evercare_sb:'1'},
    response:{ok:false, status:400, raw: JSON.stringify({error:'invalid_grant', error_description:'Invalid login credentials'})}
  });
  const boom = runSoft({role:'Nurse', password:'x', search:'?sb=1', reject: new Error('offline')});
  const htmlErr = runSoft({
    role:'Admin',
    password:'x',
    search:'?sb=1',
    response:{ok:false, status:500, raw:'<html>nope</html>'}
  });
  return Promise.all([
    new Promise(function(r){setTimeout(r, 30);}).then(function(){return ok;}),
    new Promise(function(r){setTimeout(r, 30);}).then(function(){return bad;}),
    new Promise(function(r){setTimeout(r, 30);}).then(function(){return boom;}),
    new Promise(function(r){setTimeout(r, 30);}).then(function(){return htmlErr;})
  ]);
}).then(function(results){
  const ok = results[0];
  const bad = results[1];
  const boom = results[2];
  const htmlErr = results[3];
  assert.strictEqual(ok.dual().ok, true);
  assert.strictEqual(ok.dual().email, 'admin@roles.evercare.local');
  assert.strictEqual(ok.dual().error, undefined);
  assert.ok(!JSON.stringify(ok.dual()).includes('secret-token'), 'access token stays out of the probe');
  assert.strictEqual(bad.dual().ok, false);
  assert.strictEqual(bad.dual().email, 'admin@roles.evercare.local');
  assert.strictEqual(bad.dual().error, 'Invalid login credentials');
  assert.strictEqual(bad.threw, null, 'invalid grant must not throw');
  assert.strictEqual(boom.dual().ok, false);
  assert.strictEqual(boom.dual().error, 'offline');
  assert.strictEqual(boom.dual().email, 'nurse@roles.evercare.local');
  assert.strictEqual(boom.threw, null, 'network failure must not throw');
  assert.strictEqual(htmlErr.dual().ok, false);
  assert.strictEqual(htmlErr.dual().error, 'HTTP 500');
  console.log('admin-sb-dual-test: ok');
}).catch(function(err){
  console.error(err);
  process.exit(1);
});
