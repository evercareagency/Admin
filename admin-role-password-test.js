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

const MARKER = '<!-- admin-role-password 2026-09-24 v=adminpw1 Ace admin_set_role_password -->';
assert.ok(html.includes(MARKER), 'tip marker missing');
assert.ok(html.includes('v=adminpw1'), 'adminpw1 marker stays');
assert.ok(html.includes('v=warmoff1'), 'warmoff1 marker stays');
assert.ok(html.includes('v=nursespd1'), 'nursespd1 marker stays');
assert.ok(html.includes('<!-- admin schedule 2026-09-24 v=sched1'), 'schedule marker ships beside adminpw1');
assert.ok(html.includes('content="2026-09-25-isclear1"'), 'admin-build advances to isclear1; password code stays');
assert.ok(html.includes('v=sched1m'), 'sched1m marker stays');
assert.ok(html.includes('v=cgreset1'), 'cgreset1 marker stays');
assert.ok(html.includes('v=bcast1'), 'bcast1 marker stays');
assert.ok(!/resetPasswordForEmail/.test(html), 'role passwords must not use recovery email');
assert.ok(!html.includes('id="adminRecoveryCode"'), 'recovery code field is gone');
assert.ok(!html.includes('id="adminResetModal"'), 'reset modal is gone');
assert.ok(!html.includes('id="adminResetRole"'), 'forgot account picker is gone');
assert.ok(!extractFn(html, 'async function doAdminReset()'), 'office reset function is gone');
assert.ok(!extractFn(html, 'async function sbAdminSetRolePasswordAnon(role, newPassword, recoveryCode)'), 'anon setter is gone');
assert.ok(!html.includes('p_recovery_code'), 'role password calls do not send a recovery code');
assert.ok(!html.includes('admin_forgot_password'), 'forgot sheets action is gone');
assert.ok(html.includes('id="mgrForgotBtn"') && html.includes('showAdminReset()'), 'forgot control stays');
assert.ok(html.includes('Contact the office administrator'), 'forgot copy');

const settings = html.slice(html.indexOf('id="adminOnlyPwdCard"'), html.indexOf('id="schedulerNoAccessCard"'));
assert.ok(settings.includes('id="adm_new_admin"') && settings.includes("changeRolePassword('Admin')"), 'Admin settings row stays');
assert.ok(settings.includes('id="adm_new_scheduler"') && settings.includes("changeRolePassword('Scheduler')"), 'Scheduler settings row stays');
assert.ok(settings.includes('id="adm_new_nurse"') && settings.includes('Update Nurse Password') && settings.includes("changeRolePassword('Nurse')"),
  'Nurse settings row must call changeRolePassword(Nurse)');
assert.ok(!/recovery code/i.test(settings), 'settings copy does not mention a recovery code');

const showFn = extractFn(html, 'function showAdminReset()');
const changeFn = extractFn(html, 'async function changeRolePassword(role)');
const sessionFn = extractFn(html, 'async function sbAdminSetRolePasswordSession(role, newPassword)');
const acceptedFn = extractFn(html, 'function sbRolePasswordAccepted(data)');
const payloadFn = extractFn(html, 'function sbRolePasswordPayload(data)');
const errFn = extractFn(html, 'function sbAuthErrorMessage(data,status)');
assert.ok(showFn && changeFn && sessionFn && acceptedFn && payloadFn && errFn, 'password helpers missing');
assert.ok(showFn.includes('Contact the office administrator'), 'forgot shows the office message');
assert.ok(!/fetch\(/.test(showFn) && !/admin_set_role_password/.test(showFn), 'forgot does not call the password RPC');

assert.ok(changeFn.includes("role==='Nurse'?'adm_new_nurse'"), 'Settings maps Nurse to adm_new_nurse');
assert.ok(changeFn.includes('sbAdminSetRolePasswordSession(role,newp)'), 'Settings Auth path uses the session helper');
assert.ok(changeFn.includes("action:'change_admin_password'"), 'Settings keeps Sheets rollback');
assert.ok(/evercareSbEnabled\(\)\)\{[\s\S]*return;[\s\S]*action:'change_admin_password'/.test(changeFn),
  'Auth settings returns before Sheets');
assert.ok(!/p_recovery_code/.test(sessionFn), 'Settings RPC body omits the recovery code');
assert.ok(sessionFn.includes("sbRestRpc('admin_set_role_password'"), 'Settings uses sbRestRpc');
assert.ok(acceptedFn.includes('row.ok!==true||row.success!==true'), 'success requires both ok and success');

const mutate = extractFn(html, 'async function sbRestMutate(method, table, pairs, body, prefer, refreshed, signal)');
assert.ok(mutate.includes('apikey:SUPABASE_ANON_KEY') && mutate.includes("Authorization:'Bearer '+sess.access_token"),
  'session RPC reuses sbRestMutate Admin access_token');

function harness(){
  const calls = [];
  const toasts = [];
  const activity = [];
  const els = {
    mgrForgotNote:{textContent:'', classList:{add:function(name){this.on=name;}}},
    adm_new_admin:{value:'adminpass'},
    adm_new_scheduler:{value:'schedpass'},
    adm_new_nurse:{value:'nursepass'},
    adminPwdErr:{textContent:'',style:{display:'none'}},
    adminPwdOk:{textContent:'',style:{display:'none'}}
  };
  const rpcCalls = [];
  const sandbox = {
    calls:calls,
    toasts:toasts,
    activity:activity,
    els:els,
    rpcCalls:rpcCalls,
    sbOn:true,
    currentAdminRole:'Admin',
    SUPABASE_URL:'https://example.supabase.co',
    SUPABASE_ANON_KEY:'anon-test-key',
    SHEETS_URL:'https://example.invalid/exec',
    document:{getElementById:function(id){return els[id]||null;}},
    evercareSbEnabled:function(){return sandbox.sbOn;},
    showTempMsg:function(msg,color){toasts.push({msg:msg,color:color});},
    logActivity:function(msg){activity.push(msg);},
    fetch:async function(url, opts){
      const body = opts && opts.body ? JSON.parse(opts.body) : null;
      calls.push({url:String(url), opts:opts, body:body});
      const scripted = sandbox.nextFetch;
      sandbox.nextFetch = null;
      if(scripted)return scripted;
      return {ok:true, status:200, text:async function(){return JSON.stringify({ok:true,success:true,role:'Admin',email:'admin@roles.evercare.local'});}};
    },
    sbRestRpc:async function(name, body){
      rpcCalls.push({name:name, body:body});
      const scripted = sandbox.nextRpc;
      sandbox.nextRpc = null;
      if(scripted)return scripted;
      return {ok:true, status:200, data:{ok:true,success:true,role:body.p_role,email:'x@roles.evercare.local'}};
    },
    nextFetch:null,
    nextRpc:null
  };
  vm.createContext(sandbox);
  vm.runInContext([errFn, payloadFn, acceptedFn, sessionFn, showFn, changeFn].join('\n'), sandbox);
  return sandbox;
}

(async function(){
  {
    const box = harness();
    box.showAdminReset();
    assert.strictEqual(box.els.mgrForgotNote.textContent, 'Contact the office administrator');
    assert.strictEqual(box.calls.length, 0);
    assert.strictEqual(box.rpcCalls.length, 0);
    assert.strictEqual(box.toasts.length, 0);
  }

  // Settings Admin / Scheduler / Nurse use the session RPC and omit the recovery code.
  for(const role of ['Admin','Scheduler','Nurse']){
    const box = harness();
    await box.changeRolePassword(role);
    assert.strictEqual(box.calls.length, 0, role+' must not fetch Sheets or anon RPC');
    assert.strictEqual(box.rpcCalls.length, 1);
    assert.strictEqual(box.rpcCalls[0].name, 'admin_set_role_password');
    assert.deepStrictEqual(Object.keys(box.rpcCalls[0].body).sort(), ['p_new_password','p_role']);
    assert.strictEqual(box.rpcCalls[0].body.p_role, role);
    assert.ok(box.rpcCalls[0].body.p_new_password.length >= 6);
    assert.strictEqual(box.els.adminPwdOk.style.display, 'block');
    assert.ok(box.els.adminPwdOk.textContent.indexOf(role) >= 0);
    assert.strictEqual(box.els.adminPwdErr.style.display, 'none');
    assert.deepStrictEqual(box.activity, ['Changed '+role+' password']);
  }

  // Settings RPC error: no green confirmation.
  {
    const box = harness();
    box.nextRpc = {ok:false, status:400, error:'password must be at least 6 characters'};
    box.els.adm_new_nurse.value = 'nursepass';
    await box.changeRolePassword('Nurse');
    assert.strictEqual(box.els.adminPwdOk.style.display, 'none');
    assert.strictEqual(box.els.adminPwdErr.textContent, 'password must be at least 6 characters');
    assert.strictEqual(box.activity.length, 0);
    assert.strictEqual(box.calls.length, 0);
  }

  // Settings HTTP ok payload that is not ok+success.
  {
    const box = harness();
    box.nextRpc = {ok:true, status:200, data:{ok:false, success:false, message:'invalid role'}};
    await box.changeRolePassword('Scheduler');
    assert.strictEqual(box.els.adminPwdOk.style.display, 'none');
    assert.strictEqual(box.els.adminPwdErr.textContent, 'invalid role');
  }

  // Non-admin cannot change passwords.
  {
    const box = harness();
    box.currentAdminRole = 'Scheduler';
    await box.changeRolePassword('Nurse');
    assert.strictEqual(box.rpcCalls.length, 0);
    assert.strictEqual(box.calls.length, 0);
    assert.strictEqual(box.toasts[0].msg, 'Only Admin can change passwords.');
  }

  // Sheets rollback for Nurse uses change_admin_password.
  {
    const box = harness();
    box.sbOn = false;
    await box.changeRolePassword('Nurse');
    assert.strictEqual(box.rpcCalls.length, 0);
    assert.strictEqual(box.calls.length, 1);
    assert.deepStrictEqual(box.calls[0].body, {action:'change_admin_password', role:'Nurse', password:'nursepass'});
    assert.strictEqual(box.els.adminPwdOk.style.display, 'block');
  }

  console.log('admin-role-password-test: ok');
})().catch(function(err){
  console.error(err);
  process.exit(1);
});
