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

assert.ok(html.includes('SIGNOUT_LOCAL1'), 'sign-out marker');
assert.strictEqual(html.indexOf('<meta name="admin-build" content="2026-09-27-remi-float-hide1b">'), html.indexOf('<meta name="admin-build"'), 'first admin-build meta stays');

const logoutAt = [];
let from = 0;
while(true){
  const i = html.indexOf('/auth/v1/logout', from);
  if(i < 0)break;
  logoutAt.push(i);
  const rest = html.slice(i, i + '/auth/v1/logout?scope=local'.length);
  assert.strictEqual(rest, '/auth/v1/logout?scope=local', 'logout URL missing scope=local');
  from = i + '/auth/v1/logout'.length;
}
assert.ok(logoutAt.length >= 1, 'a logout URL is present');
assert.ok(!html.includes('scope=global'), 'logout is not global');
assert.ok(!/\.signOut\s*\(/.test(html), 'no client signOut call');

const activity = extractFn(html, 'async function logActivity(action)');
assert.ok(activity.includes("sbRestRpc('log_office_activity'"), 'activity uses the office RPC');
assert.ok(!activity.includes('fetch('), 'activity does not fetch on its own');

const sigs = [
  'function readSbSession()',
  'function clearSbSession()',
  'function clearAdminSession()',
  'function sbSignOut()',
  'function adminLogout()'
];
const src = sigs.map(function(sig){
  const fn = extractFn(html, sig);
  assert.ok(fn, 'missing ' + sig);
  return fn;
}).join('\n');

function boot(){
  const mem = {
    evercare_sb_session: JSON.stringify({access_token:'local-token', refresh_token:'refresh-token'}),
    admin_session: '{"role":"Admin"}'
  };
  const fetches = [];
  const screens = [];
  const timers = [];
  const aborts = [];
  const sandbox = {
    mem: mem,
    fetches: fetches,
    screens: screens,
    timers: timers,
    aborts: aborts,
    localStorage: {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;},
      setItem: function(k, v){mem[k] = String(v);},
      removeItem: function(k){delete mem[k];}
    },
    window: {__sbSession: {access_token:'local-token'}},
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-test-key',
    SB_SESSION_KEY: 'evercare_sb_session',
    ADMIN_SESSION_KEY: 'admin_session',
    currentAdminRole: 'Admin',
    currentAdminUsername: 'Admin',
    currentNurseName: 'Nurse',
    adminIdleMemAt: 99,
    nurseSigPads: {pad: true},
    document: {
      querySelectorAll: function(){return [];},
      getElementById: function(id){
        if(id === 'loginScreen')return {classList:{add:function(){}, remove:function(){}}};
        return null;
      }
    },
    showScreen: function(id){screens.push(id);},
    setTimeout: function(fn, ms){
      const id = timers.length + 1;
      timers.push({id:id, fn:fn, ms:ms});
      return id;
    },
    clearTimeout: function(){},
    AbortController: function(){
      this.signal = {aborted:false};
      this.abort = function(){
        this.signal.aborted = true;
        aborts.push(this);
      };
    },
    fetch: function(url, opts){
      fetches.push({url:String(url), opts:opts});
      const scripted = sandbox.nextFetch;
      sandbox.nextFetch = null;
      if(scripted)return scripted;
      return Promise.reject(new Error('logout failed'));
    },
    nextFetch: null
  };
  vm.createContext(sandbox);
  vm.runInContext(src + '\nthis.sbSignOut=sbSignOut; this.adminLogout=adminLogout;', sandbox);
  return sandbox;
}

(async function(){
  {
    const box = boot();
    box.adminLogout();
    assert.strictEqual(box.fetches.length, 1);
    assert.ok(box.fetches[0].url.indexOf('/auth/v1/logout?scope=local') >= 0, 'fetch uses local scope');
    assert.ok(box.fetches[0].url.indexOf('scope=') >= 0, 'fetch URL has a scope');
    assert.strictEqual(box.timers.length, 1);
    assert.strictEqual(box.timers[0].ms, 10000);
    assert.strictEqual(box.currentAdminRole, null);
    assert.strictEqual(box.currentAdminUsername, null);
    assert.strictEqual(box.currentNurseName, null);
    assert.strictEqual(box.adminIdleMemAt, 0);
    assert.deepStrictEqual(Object.keys(box.nurseSigPads), []);
    assert.strictEqual(box.window.__sbSession, null);
    assert.strictEqual(box.localStorage.getItem('evercare_sb_session'), null);
    assert.strictEqual(box.localStorage.getItem('admin_session'), null);
    assert.deepStrictEqual(box.screens, ['loginScreen']);
    await Promise.resolve();
    assert.strictEqual(box.aborts.length, 0);
  }

  {
    const box = boot();
    let finish;
    box.nextFetch = new Promise(function(resolve){finish = resolve;});
    box.adminLogout();
    assert.deepStrictEqual(box.screens, ['loginScreen']);
    assert.strictEqual(box.localStorage.getItem('evercare_sb_session'), null);
    assert.strictEqual(box.window.__sbSession, null);
    box.timers[0].fn();
    assert.strictEqual(box.aborts.length, 1);
    assert.strictEqual(box.fetches[0].opts.signal.aborted, true);
    finish();
    await Promise.resolve();
  }

  console.log('admin-signout-local1-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
