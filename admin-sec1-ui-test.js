#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const vm = require('vm');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const buildFile = fs.readFileSync(path.join(root, 'admin-build.txt'), 'utf8').replace(/^\s+|\s+$/g, '');
const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');

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

function loadRolePassEnv(){
  const file = path.join(root, '.role-pass.env');
  if(!fs.existsSync(file))return;
  fs.readFileSync(file, 'utf8').split(/\n/).forEach(function(line){
    const m = line.match(/^\s*(ROLE_[A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if(!m || process.env[m[1]])return;
    let v = m[2];
    if((v.charAt(0)==='"' && v.charAt(v.length-1)==='"') || (v.charAt(0)==="'" && v.charAt(v.length-1)==="'")){
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  });
}

function scanSecret(label, secret){
  if(!secret){
    console.log('sec1-ui: '+label+' absent; scan skipped');
    return;
  }
  const hits = [];
  function walk(dir){
    fs.readdirSync(dir, {withFileTypes:true}).forEach(function(ent){
      if(ent.name==='.git' || ent.name==='node_modules' || ent.name==='.role-pass.env')return;
      const full = path.join(dir, ent.name);
      if(ent.isDirectory()){walk(full);return;}
      if(!ent.isFile())return;
      let text;
      try{text = fs.readFileSync(full, 'utf8');}catch(e){return;}
      if(text.indexOf(secret)>=0)hits.push(path.relative(root, full));
    });
  }
  walk(root);
  assert.deepStrictEqual(hits, [], label+' must not appear in the worktree');
}

assert.ok(html.includes("var SEC1_UI='sec1-ui'"), 'SEC1_UI marker');
assert.ok(html.includes('SEC1_UI_MARKER'), 'SEC1_UI marker name');
assert.ok(html.includes('?v=sec1-ui'), 'cache tag');
assert.strictEqual(buildFile, '2026-09-29-pages-cache-fresh1', 'admin-build.txt stays');
const firstMeta = html.slice(html.indexOf('<meta name="admin-build"'), html.indexOf('<meta name="admin-build"')+90);
assert.ok(firstMeta.includes('2026-09-27-remi-float-hide1b'), 'first admin-build meta stays');
assert.ok(!/location\.(href|replace|assign)[^;\n]*\?v=/.test(html), 'home screen URL is not rewritten to a sticky query');
assert.ok(ignore.split(/\n/).some(function(line){return line.trim()==='.role-pass.env';}), '.role-pass.env is git-ignored');

assert.ok(html.includes('Contact the office administrator'), 'forgot copy');
assert.ok(html.includes('id="mgrForgotNote"'), 'forgot note');
const showForgot = extractFn(html, 'function showAdminReset()');
assert.ok(showForgot.includes('Contact the office administrator'));
assert.ok(!/fetch\(/.test(showForgot));
assert.ok(!html.includes('p_recovery_code'));
assert.ok(!html.includes('admin_forgot_password'));
assert.ok(!html.includes('id="adminRecoveryCode"'));
const legacyMgrName='MGR_'+'PASSWORD';
assert.equal((html.match(new RegExp(legacyMgrName,'g'))||[]).length, 0);

const login = extractFn(html, 'async function mgrLogin()');
assert.ok(!login.includes("action:'admin_login'"), 'sheets rollback does not post legacy login');
assert.ok(!login.includes('Sheets sign-in is no longer available. Contact the office administrator.'));
assert.ok(!/fetch\(/.test(login), 'login does not fetch');
assert.ok(login.includes("showScreen('loginScreen')"));
assert.ok(/finally\{[\s\S]*_mgrLoginInFlight=false/.test(login), 'login button lock always clears');

const cdn = [
  ['leaflet/1.9.4/leaflet.min.css', 'sha384-c6Rcwz4e4CITMbu/NBmnNS8yN2sC3cUElMEMfP3vqqKFp7GOYaaBBCqmaWBjmkjb'],
  ['leaflet/1.9.4/leaflet.min.js', 'sha384-NElt3Op+9NBMCYaef5HxeJmU4Xeard/Lku8ek6hoPTvYkQPh3zLIrJP7KiRocsxO'],
  ['jspdf/2.5.1/jspdf.umd.min.js', 'sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk'],
  ['html2canvas/1.4.1/html2canvas.min.js', 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H'],
  ['jszip/3.10.1/jszip.min.js', 'sha384-+mbV2IY1Zk/X1p/nWllGySJSUN8uMs+gUAN10Or95UBH0fpj6GfKgPmgC5EXieXG']
];
cdn.forEach(function(pair){
  const at = html.indexOf(pair[0]);
  assert.ok(at>0, pair[0]);
  const tag = html.slice(Math.max(0, html.lastIndexOf('<', at)), html.indexOf('>', at)+1);
  assert.ok(tag.includes('integrity="'+pair[1]+'"'), pair[0]+' integrity');
  assert.ok(tag.includes('crossorigin="anonymous"'), pair[0]+' crossorigin');
  assert.ok(tag.includes('referrerpolicy="no-referrer"'), pair[0]+' referrerpolicy');
});
assert.equal((html.match(/cdnjs\.cloudflare\.com/g)||[]).length, 5, 'only the pinned cdnjs assets');

assert.ok(/const ADMIN_IDLE_MS=60\*60\*1000;/.test(html), '60 minute idle');
assert.ok(!/ADMIN_SESSION_MS/.test(html), 'absolute session clock is gone');
assert.ok(html.includes('function touchAdminSessionActivity()'));
assert.ok(html.includes('function bindAdminIdleWatch()'));

const sandbox = {
  Date: Date,
  Number: Number,
  String: String,
  isFinite: Number.isFinite,
  currentAdminRole: 'Scheduler',
  currentAdminUsername: 'scheduler',
  currentNurseName: null,
  localStorage: (function(){
    const mem = {};
    return {
      getItem: function(k){return Object.prototype.hasOwnProperty.call(mem, k)?mem[k]:null;},
      setItem: function(k,v){mem[k]=String(v);},
      removeItem: function(k){delete mem[k];}
    };
  })()
};
sandbox.store = {
  get: function(k){try{return JSON.parse(sandbox.localStorage.getItem(k));}catch(e){return null;}},
  set: function(k,v){sandbox.localStorage.setItem(k, JSON.stringify(v));}
};
vm.createContext(sandbox);
vm.runInContext([
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
  extractFn(html, 'function touchAdminSessionActivity()')
].join('\n'), sandbox);

const idle = 60*60*1000;
vm.runInContext('startAdminSession({role:"Scheduler",username:"scheduler"})', sandbox);
const fresh = JSON.parse(sandbox.localStorage.getItem('admin_session'));
fresh.loginAt = Date.now()-idle*3;
fresh.lastActivityAt = Date.now()-1000;
sandbox.localStorage.setItem('admin_session', JSON.stringify(fresh));
vm.runInContext('adminIdleMemAt=0; touchAdminSessionActivity()', sandbox);
const touched = JSON.parse(sandbox.localStorage.getItem('admin_session'));
assert.ok(Date.now()-touched.lastActivityAt < 5000, 'activity writes a new stamp');
assert.strictEqual(vm.runInContext('isAdminSessionExpired(readAdminSession())', sandbox), false);

fresh.lastActivityAt = Date.now()-idle-1000;
sandbox.localStorage.setItem('admin_session', JSON.stringify(fresh));
vm.runInContext('adminIdleMemAt=0', sandbox);
assert.strictEqual(vm.runInContext('restoreAdminSession()', sandbox), null);
assert.strictEqual(sandbox.localStorage.getItem('admin_session'), null);

loadRolePassEnv();
['ROLE_SCHEDULER_PASSWORD','ROLE_ADMIN_PASSWORD','ROLE_NURSE_PASSWORD'].forEach(function(name){
  scanSecret(name, process.env[name]);
});

if(process.env.SEC1_SRI_SKIP==='1'){
  console.log('admin-sec1-ui-test: ok');
  process.exit(0);
}

const https = require('https');
function get(url){
  return new Promise(function(resolve, reject){
    https.get(url, function(res){
      if(res.statusCode>=300 && res.statusCode<400 && res.headers.location){
        get(res.headers.location).then(resolve, reject);
        return;
      }
      const chunks=[];
      res.on('data', function(c){chunks.push(c);});
      res.on('end', function(){resolve(Buffer.concat(chunks));});
    }).on('error', reject);
  });
}

(async function(){
  for(const pair of cdn){
    const buf = await get('https://cdnjs.cloudflare.com/ajax/libs/'+pair[0]);
    const hash = 'sha384-'+crypto.createHash('sha384').update(buf).digest('base64');
    assert.strictEqual(hash, pair[1], pair[0]+' hash');
  }
  console.log('admin-sec1-ui-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
