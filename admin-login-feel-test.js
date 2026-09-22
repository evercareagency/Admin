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
