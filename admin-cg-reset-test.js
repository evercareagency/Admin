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

assert.ok(html.includes('v=cgreset1'), 'cgreset1 marker');
assert.ok(html.includes('<meta name="admin-build" content="2026-09-25-isclear1">'), 'admin-build advances to isclear1');
assert.ok(html.includes('admin-build 2026-09-24-cgreset1'), 'cgreset1 build note stays in the tip comment');
assert.ok(html.includes('<!-- caregiver password reset 2026-09-24 v=cgreset1'), 'tip comment');
assert.ok(html.includes('id="cgResetBtn"'), 'reset button stays tappable');
assert.ok(html.includes('onclick="adminResetCaregiverPwd()"'), 'Settings card still calls adminResetCaregiverPwd');
assert.ok(html.includes('class="cg-reset-fields"'), 'caregiver reset fields');
assert.ok(/@media\(max-width:420px\)\{[^}]*\.cg-reset-fields\{grid-template-columns:1fr/.test(html), 'phone stacks the reset fields');
assert.ok(html.includes('#cgResetBtn{min-height:44px'), 'reset button keeps a phone tap target');

const resetFn = extractFn(html, 'async function adminResetCaregiverPwd()');
const createFn = extractFn(html, 'async function submitCreateAide()');
const writeGate = extractFn(html, 'function sbIsAdminWriteAction(action)');
const dispatch = extractFn(html, 'async function sbAdminWriteDispatch(payload)');
const resetHelper = extractFn(html, 'async function sbAdminResetTempPassword(payload)');
const apiPost = extractFn(html, 'async function apiPost(payload)');
assert.ok(resetFn && createFn && writeGate && dispatch && resetHelper && apiPost, 'password helpers missing');

assert.ok(resetFn.includes("postAideAction('reset_temp_password','reset_aide_temp_password'"), 'Settings reuses the office reset helper');
assert.ok(resetFn.includes('showAideTempPasswordOnce'), 'success shows the temp password');
assert.ok(resetFn.includes('Temporary password:'), 'card repeats the temp password');
assert.ok(/evercareSbEnabled\(\)\)\{[\s\S]*return;[\s\S]*action:'reset_password'/.test(resetFn), 'Sheets reset_password stays on the rollback branch');
assert.ok(resetFn.indexOf("action:'reset_password'") > resetFn.indexOf('return;'), 'cut returns before Sheets');
assert.ok(!resetFn.includes("'set_password'"), 'Settings does not invent a set_password client');

assert.ok(createFn.includes('sbAdminAddAide') && createFn.includes('admin_add_aide'), 'Add aide form uses admin_add_aide');
assert.ok(!createFn.includes("'reset_password'") && !createFn.includes("'set_password'"), 'Add aide does not call Sheets password actions');
assert.ok(!createFn.includes('tempPassword') && !createFn.includes('admin_create_aide'), 'Add aide form does not create Auth');

assert.ok(writeGate.includes("action==='reset_password'") && writeGate.includes("action==='set_password'"), 'Sheets password actions are admin writes on cut');
assert.ok(dispatch.includes("action==='reset_password'") && dispatch.includes("action==='set_password'"), 'dispatch routes Sheets password names to the Ace helper');
assert.ok(resetHelper.includes("sbRestRpc('reset_aide_temp_password'"), 'helper stays the existing RPC client');
assert.ok(resetHelper.includes('payload.password'), 'Settings and raw reset_password passwords reach p_temp_password');
const sheetsAt = apiPost.indexOf('fetch(SHEETS_URL');
const gateAt = apiPost.indexOf("payload.action==='reset_password'");
assert.ok(gateAt > 0 && gateAt < sheetsAt, 'reset_password is gated before the Sheets post');
assert.ok(apiPost.indexOf("payload.action==='set_password'") < sheetsAt, 'set_password is gated before the Sheets post');

function harness(opts){
  const calls = [];
  const shown = [];
  const els = {
    cg_reset_user:{value:opts.user == null ? 'JDoe' : opts.user},
    cg_reset_pwd:{value:opts.pwd == null ? 'EcTyped99' : opts.pwd},
    cgResetErr:{textContent:'', style:{display:'none'}},
    cgResetOk:{textContent:'', style:{display:'none'}}
  };
  const sandbox = {
    els:els,
    calls:calls,
    shown:shown,
    document:{getElementById:function(id){return els[id] || null;}},
    evercareSbEnabled:function(){return !!opts.sbOn;},
    postAideAction:async function(primary, alias, payload){
      calls.push({kind:'aide', primary:primary, alias:alias, payload:payload});
      if(opts.aide)return opts.aide;
      return {data:{success:true, tempPassword:'EcFromAce', temp_password:'EcFromAce', username:payload.username, must_change_password:true}, err:null, action:primary};
    },
    apiPost:async function(payload){
      calls.push({kind:'api', payload:payload});
      return {success:true};
    },
    cacheInvalidate:function(key){calls.push({kind:'cache', key:key});},
    logActivity:function(msg){calls.push({kind:'log', msg:msg});},
    showAideTempPasswordOnce:function(user, pwd, title){shown.push({user:user, pwd:pwd, title:title});},
    aceActionError:function(data){return (data && (data.error || data.message)) || 'Error. Try again.';}
  };
  vm.createContext(sandbox);
  vm.runInContext(resetFn, sandbox);
  return sandbox;
}

(async function(){
  const on = harness({sbOn:true});
  await on.adminResetCaregiverPwd();
  assert.strictEqual(on.calls.filter(function(c){return c.kind==='api';}).length, 0, 'cut does not call apiPost reset_password');
  assert.strictEqual(on.calls.filter(function(c){return c.kind==='aide';}).length, 1);
  assert.strictEqual(on.calls[0].primary, 'reset_temp_password');
  assert.strictEqual(on.calls[0].alias, 'reset_aide_temp_password');
  assert.strictEqual(on.calls[0].payload.username, 'jdoe');
  assert.strictEqual(on.calls[0].payload.tempPassword, 'EcTyped99');
  assert.strictEqual(on.els.cg_reset_user.value, '');
  assert.strictEqual(on.els.cg_reset_pwd.value, '');
  assert.ok(on.els.cgResetOk.textContent.indexOf('EcFromAce') >= 0, 'card shows the Ace temp password');
  assert.ok(on.els.cgResetOk.textContent.indexOf('@jdoe') >= 0);
  assert.strictEqual(on.els.cgResetOk.style.display, 'block');
  assert.strictEqual(on.shown.length, 1);
  assert.strictEqual(on.shown[0].user, 'jdoe');
  assert.strictEqual(on.shown[0].pwd, 'EcFromAce');
  assert.strictEqual(on.shown[0].title, 'New temporary password');
  assert.ok(on.calls.some(function(c){return c.kind==='log';}));

  const sheets = harness({sbOn:false});
  await sheets.adminResetCaregiverPwd();
  assert.strictEqual(sheets.calls.filter(function(c){return c.kind==='aide';}).length, 0, 'rollback does not call Ace');
  assert.strictEqual(sheets.shown.length, 0, 'rollback keeps the old success line');
  const api = sheets.calls.filter(function(c){return c.kind==='api';});
  assert.strictEqual(api.length, 1);
  assert.strictEqual(api[0].payload.action, 'reset_password');
  assert.strictEqual(api[0].payload.username, 'jdoe');
  assert.strictEqual(api[0].payload.password, 'EcTyped99');
  assert.ok(sheets.els.cgResetOk.textContent.indexOf('@jdoe') >= 0);
  assert.ok(sheets.els.cgResetOk.textContent.indexOf('EcTyped99') < 0);

  const fail = harness({sbOn:true, aide:{data:{success:false, error:'No such aide'}, err:null, action:'reset_temp_password'}});
  await fail.adminResetCaregiverPwd();
  assert.strictEqual(fail.calls.filter(function(c){return c.kind==='api';}).length, 0, 'Ace failure must not fall through to Sheets');
  assert.strictEqual(fail.shown.length, 0);
  assert.strictEqual(fail.els.cgResetErr.textContent, 'No such aide');
  assert.strictEqual(fail.els.cgResetErr.style.display, 'block');
  assert.strictEqual(fail.els.cgResetOk.style.display, 'none');
  assert.strictEqual(fail.els.cg_reset_pwd.value, 'EcTyped99', 'failed reset keeps the typed password');

  const empty = harness({sbOn:true, user:'', pwd:''});
  await empty.adminResetCaregiverPwd();
  assert.strictEqual(empty.calls.length, 0);
  assert.strictEqual(empty.els.cgResetErr.textContent, 'Fill in both fields.');

  console.log('admin-cg-reset-test ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
